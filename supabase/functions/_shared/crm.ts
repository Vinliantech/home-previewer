import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { sendLeadAcknowledgement } from "./email.ts";

export type LeadInput = {
  source: string;
  submissionId?: string | null;
  sourceReference?: string | null;
  sourceDetail?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  location?: string | null;
  countryOfResidence?: string | null;
  propertyName?: string | null;
  propertyType?: string | null;
  preferredLocation?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  investmentType?: string | null;
  preferredContactMethod?: string | null;
  expectedTimeline?: string | null;
  message?: string | null;
  consentGiven?: boolean;
  capturedAt?: string | null;
  rawPayload?: unknown;
  facebook?: Record<string, string | null | undefined>;
  interestMetadata?: Record<string, unknown>;
  acknowledgement?: {
    investmentLabel?: string | null;
    eventName?: string | null;
  };
  suppressAcknowledgement?: boolean;
};

const clean = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function fillOnly(existing: Record<string, unknown>, incoming: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(incoming).filter(
      ([key, value]) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        (existing[key] === null || existing[key] === undefined || existing[key] === ""),
    ),
  );
}

async function autoAssign(admin: SupabaseClient, leadId: string): Promise<void> {
  const { data: lead } = await admin
    .from("leads")
    .select("id, full_name, assigned_to, status")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead || lead.assigned_to) return;
  const { data: agents } = await admin
    .from("sales_agents")
    .select("id, user_id, round_robin_cursor")
    .eq("active", true)
    .order("round_robin_cursor")
    .limit(1);
  const agent = agents?.[0];
  if (!agent) return;
  const now = new Date().toISOString();
  await Promise.all([
    admin
      .from("sales_agents")
      .update({ round_robin_cursor: (agent.round_robin_cursor ?? 0) + 1 })
      .eq("id", agent.id),
    admin
      .from("leads")
      .update({
        assigned_to: agent.user_id,
        assigned_at: now,
        last_activity_at: now,
        ...(lead.status === "new" || lead.status === "auto_response_sent"
          ? { status: "assigned_to_adviser" }
          : {}),
      })
      .eq("id", leadId),
  ]);
  const { data: existingTask } = await admin
    .from("follow_up_tasks")
    .select("id")
    .eq("lead_id", leadId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  if (!existingTask) {
    await admin.from("follow_up_tasks").insert({
      lead_id: leadId,
      title: "Contact new lead within 30 minutes",
      task_type: "call",
      assigned_to: agent.user_id,
      due_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      priority: "high",
    });
  }
  await Promise.all([
    admin.from("crm_notifications").insert({
      user_id: agent.user_id,
      type: "lead_assigned",
      title: "New lead assigned",
      body: lead.full_name,
      lead_id: leadId,
    }),
    admin.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "assignment",
      body: "Lead assigned automatically using CRM routing rules.",
      meta: { adviser_id: agent.user_id },
    }),
  ]);
}

export async function captureLead(admin: SupabaseClient, input: LeadInput) {
  const capturedAt = clean(input.capturedAt) ?? new Date().toISOString();
  const email = clean(input.email)?.toLowerCase() ?? null;
  const phone = clean(input.phone);
  const submissionId = clean(input.submissionId);
  const sourceReference = submissionId ?? clean(input.sourceReference);

  if (submissionId) {
    const { data: duplicate } = await admin
      .from("lead_interests")
      .select("lead_id")
      .eq("source", input.source)
      .eq("source_reference", submissionId)
      .maybeSingle();
    if (duplicate) {
      return {
        leadId: duplicate.lead_id,
        merged: true,
        acknowledgementSent: false,
        duplicateSubmission: true,
      };
    }
  }

  const { data: matchId, error: matchError } = await admin.rpc("find_lead_by_contact", {
    _email: email,
    _phone: phone ?? clean(input.whatsappNumber),
  });
  if (matchError) throw new Error(matchError.message);
  const existingId = (matchId as string | null) ?? null;
  const facebook = input.facebook ?? {};
  const profile = {
    full_name: clean(input.fullName) ?? "Unknown lead",
    email,
    phone,
    whatsapp_number: clean(input.whatsappNumber) ?? phone,
    location: clean(input.location),
    country_of_residence: clean(input.countryOfResidence),
    property_name: clean(input.propertyName),
    property_type: clean(input.propertyType),
    preferred_location: clean(input.preferredLocation),
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    investment_type: input.investmentType ?? null,
    preferred_contact_method: clean(input.preferredContactMethod),
    expected_timeline: clean(input.expectedTimeline),
    source_detail: clean(input.sourceDetail),
    notes: clean(input.message),
    fb_lead_id: clean(facebook.leadId),
    page_id: clean(facebook.pageId),
    campaign_id: clean(facebook.campaignId),
    campaign_name: clean(facebook.campaignName),
    facebook_adset_id: clean(facebook.adsetId),
    facebook_adset_name: clean(facebook.adsetName),
    ad_id: clean(facebook.adId),
    ad_name: clean(facebook.adName),
    form_id: clean(facebook.formId),
  };

  let leadId: string;
  if (existingId) {
    const { data: existing, error } = await admin
      .from("leads")
      .select("*")
      .eq("id", existingId)
      .single();
    if (error || !existing) throw new Error(error?.message ?? "Lead lookup failed.");
    leadId = existing.id;
    const patch: Record<string, unknown> = {
      ...fillOnly(existing as Record<string, unknown>, profile),
      last_activity_at: capturedAt,
    };
    if (input.consentGiven && !existing.consent_given) {
      patch.consent_given = true;
      patch.consent_at = capturedAt;
      patch.consent_source = input.source;
    }
    const { error: updateError } = await admin.from("leads").update(patch).eq("id", leadId);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { data, error } = await admin
      .from("leads")
      .insert({
        ...profile,
        lead_source: input.source,
        status: "new",
        captured_at: capturedAt,
        last_activity_at: capturedAt,
        consent_given: input.consentGiven ?? false,
        consent_at: input.consentGiven ? capturedAt : null,
        consent_source: input.consentGiven ? input.source : null,
        raw_payload: input.rawPayload ?? null,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Lead creation failed.");
    leadId = data.id;
  }

  const { error: interestError } = await admin.from("lead_interests").insert({
    lead_id: leadId,
    source: input.source,
    source_reference: sourceReference,
    property_name: clean(input.propertyName),
    investment_type: input.investmentType ?? null,
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax ?? null,
    message: clean(input.message),
    metadata: input.interestMetadata ?? {},
    captured_at: capturedAt,
  });
  if (interestError) throw new Error(interestError.message);
  await admin.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "system",
    body: existingId
      ? "New enquiry merged into the existing lead profile."
      : "Lead captured and added to the CRM.",
    meta: { source: input.source, source_reference: sourceReference },
  });

  let acknowledgement = { ok: false };
  if (!input.suppressAcknowledgement) {
    acknowledgement = await sendLeadAcknowledgement(admin, {
      leadId,
      fullName: input.fullName,
      email,
      source: input.source,
      propertyName: clean(input.propertyName),
      investmentLabel: clean(input.acknowledgement?.investmentLabel),
      eventName: clean(input.acknowledgement?.eventName),
    });
    if (acknowledgement.ok) {
      await Promise.all([
        admin
          .from("leads")
          .update({ status: "auto_response_sent" })
          .eq("id", leadId)
          .eq("status", "new"),
        admin.from("lead_activities").insert({
          lead_id: leadId,
          activity_type: "email",
          body: "Immediate acknowledgement email sent.",
        }),
      ]);
    }
  }

  await autoAssign(admin, leadId);
  return {
    leadId,
    merged: Boolean(existingId),
    acknowledgementSent: acknowledgement.ok,
    duplicateSubmission: false,
  };
}

export async function recordCaptureFailure(
  admin: SupabaseClient,
  input: LeadInput,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const submissionId = clean(input.submissionId);
  if (submissionId) {
    const { data: existing } = await admin
      .from("lead_capture_failures")
      .select("id, attempts")
      .eq("source", input.source)
      .eq("submission_id", submissionId)
      .is("resolved_at", null)
      .maybeSingle();
    if (existing) {
      await admin
        .from("lead_capture_failures")
        .update({
          error: message.slice(0, 2000),
          attempts: (existing.attempts ?? 1) + 1,
          last_attempt_at: new Date().toISOString(),
          payload: input,
        })
        .eq("id", existing.id);
      return;
    }
  }
  await admin.from("lead_capture_failures").insert({
    source: input.source,
    submission_id: submissionId,
    payload: input,
    raw_payload: input.rawPayload ?? null,
    error: message.slice(0, 2000),
    last_attempt_at: new Date().toISOString(),
  });
}
