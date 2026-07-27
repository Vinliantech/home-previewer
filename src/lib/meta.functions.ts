import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Meta Lead Ads recovery.
 *
 * The webhook only ever hears about leads submitted while it is subscribed and
 * reachable. Anything that arrived before the subscription existed, or during
 * a deploy, an outage or an expired page token, is never redelivered by Meta —
 * it simply never reaches the CRM.
 *
 * These two functions close that: pull leads a form already holds, and replay
 * the ones whose capture threw. Both lean on captureLead's leadgen_id
 * idempotency, so re-running either is safe and will not duplicate a lead.
 */

type Roles = { role: string }[] | null;

async function assertCrmAdmin(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const allowed = ((data ?? []) as Roles satisfies Roles)?.some(
    (row) => row.role === "admin" || row.role === "super_admin" || row.role === "crm_manager",
  );
  if (!allowed) throw new Error("Only CRM administrators can manage the Meta connection.");
}

function metaConfig() {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_API_VERSION;
  if (!pageAccessToken || !graphVersion) {
    throw new Error(
      "Meta is not configured. Set META_PAGE_ACCESS_TOKEN and META_GRAPH_API_VERSION.",
    );
  }
  return { pageAccessToken, graphVersion };
}

/** Leads that failed to capture, newest first. */
export const listLeadCaptureFailures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);
    const sb = context.supabase as unknown as SupabaseClient;
    const { data, error } = await sb
      .from("lead_capture_failures")
      .select("*")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { failures: data ?? [] };
  });

/** Replay one failed capture. Safe to call repeatedly. */
export const retryLeadCapture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lead_capture_failures enters the generated types after the migration runs.
    const sb = supabaseAdmin as any;

    const { data: row } = await sb
      .from("lead_capture_failures")
      .select("id, payload, attempts")
      .eq("id", data.id)
      .is("resolved_at", null)
      .maybeSingle();
    if (!row) throw new Error("That failed capture is already resolved or does not exist.");

    const { captureLead } = await import("@/lib/crm-capture.server");
    try {
      const result = await captureLead(row.payload);
      await sb
        .from("lead_capture_failures")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_lead_id: result.leadId,
          attempts: (row.attempts ?? 1) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return { ok: true, leadId: result.leadId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await sb
        .from("lead_capture_failures")
        .update({
          error: message.slice(0, 2000),
          attempts: (row.attempts ?? 1) + 1,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      throw new Error(`Still failing: ${message}`);
    }
  });

type MetaFormLead = {
  id: string;
  created_time?: string;
  field_data?: Array<{ name: string; values: string[] }>;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  form_id?: string;
};

/**
 * Pull every lead a Meta form already holds into the CRM.
 *
 * Meta keeps lead data for 90 days, so this recovers anything the webhook
 * missed within that window. Leads already captured are recognised by their
 * leadgen id and skipped, so this is safe to run whenever the team suspects a
 * gap.
 */
export const importMetaFormLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        formId: z.string().trim().min(1).max(64),
        /** Only pull leads created at or after this instant. */
        since: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);
    const { pageAccessToken, graphVersion } = metaConfig();

    const { captureLead, recordCaptureFailure } = await import("@/lib/crm-capture.server");
    const { parseMetaLeadFields } = await import("@/lib/meta-fields");

    const fields = [
      "id",
      "created_time",
      "field_data",
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
      "form_id",
    ].join(",");

    let next: string | null =
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(data.formId)}/leads` +
      `?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(pageAccessToken)}`;

    let imported = 0;
    let alreadyPresent = 0;
    let failed = 0;
    let pages = 0;
    const sinceMs = data.since ? Date.parse(data.since) : null;

    // Bounded so a huge form cannot hold the request open indefinitely; the
    // caller re-runs with `since` to continue.
    while (next && pages < 20) {
      const response: Response = await fetch(next);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Meta rejected the request (${response.status}). ` +
            `Check the form id and that the page access token is still valid. ${body.slice(0, 300)}`,
        );
      }
      const page = (await response.json()) as {
        data?: MetaFormLead[];
        paging?: { next?: string };
      };
      pages += 1;

      for (const metaLead of page.data ?? []) {
        if (sinceMs && metaLead.created_time && Date.parse(metaLead.created_time) < sinceMs) {
          continue;
        }
        const input = parseMetaLeadFields(metaLead, {
          leadgenId: metaLead.id,
          pageId: process.env.META_PAGE_ID ?? null,
          formId: metaLead.form_id ?? data.formId,
        });
        try {
          const result = await captureLead(input);
          if (result.duplicateSubmission) alreadyPresent += 1;
          else imported += 1;
        } catch (error) {
          failed += 1;
          await recordCaptureFailure(input, error);
        }
      }

      next = page.paging?.next ?? null;
    }

    return { imported, alreadyPresent, failed, pages, morePages: Boolean(next) };
  });

type MetaCampaign = {
  id: string;
  name?: string;
  objective?: string;
  status?: string;
  daily_budget?: string;
  insights?: { data?: Array<{ spend?: string; impressions?: string; clicks?: string }> };
};

function toNumber(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Pull campaign spend from Meta into fb_campaigns.
 *
 * crm.reports reads that table for cost-per-lead and campaign ROI, but nothing
 * ever wrote it, so those figures were permanently zero. Lead capture already
 * records campaign_id against every Facebook lead, so once spend lands here the
 * two join up.
 *
 * The ad account comes from a server environment variable, matching the rest of
 * the Meta credentials. fb_lead_sources has an access_token column intended for
 * this, but that table is readable by every CRM admin — a token belongs in the
 * environment, not in a row.
 *
 * daily_budget arrives in minor units (kobo), so it is divided by 100.
 */
export const syncMetaCampaignInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCrmAdmin(context.supabase as unknown as SupabaseClient, context.userId);
    const { pageAccessToken, graphVersion } = metaConfig();

    const adAccount = process.env.META_AD_ACCOUNT_ID;
    if (!adAccount) {
      throw new Error(
        "Set META_AD_ACCOUNT_ID (the ad account id, with or without the act_ prefix) to sync campaign spend.",
      );
    }
    const account = adAccount.startsWith("act_") ? adAccount : `act_${adAccount}`;

    const fields = "id,name,objective,status,daily_budget,insights{spend,impressions,clicks}";
    let next: string | null =
      `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(account)}/campaigns` +
      `?fields=${encodeURIComponent(fields)}&limit=100&access_token=${encodeURIComponent(pageAccessToken)}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- fb_campaigns is in the generated types but the upsert shape is looser than the generated Insert.
    const sb = supabaseAdmin as any;

    let synced = 0;
    let pages = 0;
    const syncedAt = new Date().toISOString();

    while (next && pages < 20) {
      const response: Response = await fetch(next);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Meta rejected the request (${response.status}). Check META_AD_ACCOUNT_ID and that the ` +
            `token carries ads_read. ${body.slice(0, 300)}`,
        );
      }
      const page = (await response.json()) as {
        data?: MetaCampaign[];
        paging?: { next?: string };
      };
      pages += 1;

      const rows = (page.data ?? []).map((campaign) => {
        const insight = campaign.insights?.data?.[0];
        return {
          campaign_id: campaign.id,
          campaign_name: campaign.name ?? campaign.id,
          objective: campaign.objective ?? null,
          status: campaign.status ?? null,
          daily_budget: campaign.daily_budget ? toNumber(campaign.daily_budget) / 100 : null,
          spend: toNumber(insight?.spend),
          impressions: Math.round(toNumber(insight?.impressions)),
          clicks: Math.round(toNumber(insight?.clicks)),
          last_synced_at: syncedAt,
          updated_at: syncedAt,
        };
      });

      if (rows.length > 0) {
        const { error } = await sb.from("fb_campaigns").upsert(rows, { onConflict: "campaign_id" });
        if (error) throw new Error(error.message);
        synced += rows.length;
      }

      next = page.paging?.next ?? null;
    }

    return { synced, pages, morePages: Boolean(next) };
  });
