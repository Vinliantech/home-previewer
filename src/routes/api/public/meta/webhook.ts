import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { parseMetaLeadFields, type MetaLeadPayload } from "@/lib/meta-fields";

type MetaWebhookBody = {
  entry?: Array<{
    id: string;
    changes?: Array<{
      field: string;
      value: {
        leadgen_id: string;
        page_id: string;
        form_id: string;
        ad_id?: string;
        created_time?: number;
      };
    }>;
  }>;
};

/**
 * Meta Lead Ads webhook. All credentials are server environment variables;
 * the admin UI only reports whether the connection is configured.
 */
export const Route = createFileRoute("/api/public/meta/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const verify = process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && verify && token === verify && challenge) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const appSecret = process.env.META_APP_SECRET;
        const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
        const graphVersion = process.env.META_GRAPH_API_VERSION;
        if (!appSecret || !pageAccessToken || !graphVersion) {
          return new Response("misconfigured", { status: 500 });
        }

        const raw = await request.text();
        const signature = request.headers.get("x-hub-signature-256") ?? "";
        const expected = `sha256=${createHmac("sha256", appSecret).update(raw).digest("hex")}`;
        const suppliedBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        if (
          suppliedBuffer.length !== expectedBuffer.length ||
          !timingSafeEqual(suppliedBuffer, expectedBuffer)
        ) {
          return new Response("invalid signature", { status: 401 });
        }

        let body: MetaWebhookBody;
        try {
          body = JSON.parse(raw) as MetaWebhookBody;
        } catch {
          return new Response("invalid payload", { status: 400 });
        }

        const { captureLead, recordCaptureFailure } = await import("@/lib/crm-capture.server");
        const configuredPageId = process.env.META_PAGE_ID;

        for (const entry of body.entry ?? []) {
          for (const change of entry.changes ?? []) {
            if (change.field !== "leadgen") continue;
            const value = change.value;
            if (configuredPageId && value.page_id !== configuredPageId) continue;

            const fields = [
              "field_data",
              "campaign_id",
              "campaign_name",
              "adset_id",
              "adset_name",
              "ad_id",
              "ad_name",
              "form_id",
              "created_time",
            ].join(",");
            const graphUrl = new URL(
              `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(value.leadgen_id)}`,
            );
            graphUrl.searchParams.set("access_token", pageAccessToken);
            graphUrl.searchParams.set("fields", fields);
            const response = await fetch(graphUrl);
            if (!response.ok) {
              console.error("[meta-webhook] lead fetch failed:", response.status);
              continue;
            }
            const metaLead = (await response.json()) as MetaLeadPayload;
            const captureInput = parseMetaLeadFields(metaLead, {
              leadgenId: value.leadgen_id,
              pageId: value.page_id,
              formId: value.form_id,
              adId: value.ad_id ?? null,
            });

            try {
              await captureLead(captureInput);
            } catch (error) {
              // One bad lead must not fail the batch — the others are already
              // captured, and returning non-200 would make Meta redeliver them
              // all. But a 200 also means Meta will never resend THIS one, so
              // it is queued for replay rather than left in a log line.
              console.error(
                "[meta-webhook] lead capture failed, queued for retry:",
                error instanceof Error ? error.message : error,
              );
              await recordCaptureFailure(captureInput, error);
            }
          }
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
