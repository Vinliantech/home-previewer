import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { emailKey, phoneKey } from "@/lib/contact-keys";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  advanceLeadStatus,
  type InvestmentType,
  type LeadSource,
  type LeadStatus,
} from "@/lib/crm";

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

/**
 * Abuse throttles. The public forms carry only a honeypot, so the pipeline is
 * the last line of defence: every capture writes rows, emails the enquirer and
 * notifies an adviser — all of which an attacker can multiply.
 *
 * Identity throttle: one person lodging more than this many enquiries inside
 * the window is a stuck retry loop or a script; the first few are already
 * recorded, so later ones are acknowledged as duplicates and dropped.
 */
const IDENTITY_WINDOW_MINUTES = 10;
const IDENTITY_MAX_SUBMISSIONS = 5;
/**
 * Email circuit breaker: if acknowledgement volume across ALL leads exceeds
 * this rate, something is flooding the forms with fresh identities. Leads are
 * still captured (a launch spike must not lose real enquiries) — only the
 * outbound email pauses until volume falls back under the threshold.
 */
const EMAIL_WINDOW_MINUTES = 10;
const EMAIL_MAX_SENDS = 50;

/**
 * The single path every inbound lead travels: website forms, Meta Lead Ads,
 * event registrations. It resolves the contact against existing leads, merges
 * without destroying what is already on the profile, records the enquiry,
 * sends the acknowledgement and hands the lead to the assignment rules.
 *
 * Runs on the server with the service client only.
 */

type Text = string | null | undefined;

export type LeadCaptureInput = {
  source: LeadSource;
  /**
   * Id of this one submission, where the source issues one (Meta's leadgen_id).
   * A repeat delivery of the same id is ignored, which is what makes provider
   * retries safe. Never pass an id shared by several people (an event id): that
   * would treat the second registrant as a duplicate.
   */
  submissionId?: Text;
  /** Reference kept against the enquiry for reporting (event id, campaign id). */
  sourceReference?: Text;
  /** Human-readable origin kept on the lead (event name, referrer). */
  sourceDetail?: Text;
  fullName: string;
  email?: Text;
  phone?: Text;
  whatsappNumber?: Text;
  location?: Text;
  countryOfResidence?: Text;
  propertyName?: Text;
  propertyType?: Text;
  preferredLocation?: Text;
  budgetMin?: number | null;
  budgetMax?: number | null;
  investmentType?: InvestmentType | null;
  preferredContactMethod?: Text;
  expectedTimeline?: Text;
  message?: Text;
  consentGiven?: boolean;
  capturedAt?: Text;
  rawPayload?: Json;
  /** Facebook attribution, when the lead came from Meta. */
  facebook?: {
    leadId?: Text;
    pageId?: Text;
    campaignId?: Text;
    campaignName?: Text;
    adsetId?: Text;
    adsetName?: Text;
    adId?: Text;
    adName?: Text;
    formId?: Text;
  };
  interestMetadata?: Json;
  acknowledgement?: {
    investmentLabel?: Text;
    eventName?: Text;
  };
  /**
   * Skip the CRM's own acknowledgement because the caller sends its own
   * confirmation. The workshop pages do this: Brevo sends the branded
   * confirmation with the registration reference, and two emails for one
   * sign-up reads to the participant as a system fault.
   */
  suppressAcknowledgement?: boolean;
};

export type LeadCaptureResult = {
  leadId: string;
  merged: boolean;
  acknowledgementSent: boolean;
  /** True when this exact submission was already processed. */
  duplicateSubmission: boolean;
};

function clean(value: Text): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Fields an automated capture may fill in but never overwrite. A returning
 * enquirer must not wipe the adviser's notes or null out a property that a
 * previous submission established; every enquiry's own detail is preserved on
 * lead_interests regardless.
 */
function fillOnly<T extends Record<string, unknown>>(
  existing: Record<string, unknown>,
  incoming: T,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined || value === "") continue;
    const current = existing[key];
    if (current === null || current === undefined || current === "") {
      patch[key as keyof T] = value as T[keyof T];
    }
  }
  return patch;
}

async function findExistingLeadId(input: LeadCaptureInput): Promise<string | null> {
  const fbLeadId = clean(input.facebook?.leadId);
  if (fbLeadId) {
    const { data } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("fb_lead_id", fbLeadId)
      .maybeSingle();
    if (data) return data.id;
  }

  // Normalised matching lives in the database so the expression and its index
  // stay identical. Never match email with ILIKE: "_" and "%" are wildcards.
  const { data, error } = await supabaseAdmin.rpc("find_lead_by_contact", {
    _email: emailKey(input.email),
    _phone: clean(input.phone) ?? clean(input.whatsappNumber),
  });
  if (error) {
    console.error("[crm-capture] contact lookup failed:", error.message);
    return null;
  }
  return (data as string | null) ?? null;
}

export async function captureLead(input: LeadCaptureInput): Promise<LeadCaptureResult> {
  const now = new Date().toISOString();
  const capturedAt = clean(input.capturedAt) ?? now;
  const email = emailKey(input.email);
  const phone = clean(input.phone);
  const submissionId = clean(input.submissionId);
  // The submission id doubles as the stored reference so the idempotency check
  // reads an indexed column rather than jsonb.
  const sourceReference = submissionId ?? clean(input.sourceReference);

  // Providers retry webhooks; the same submission must not be recorded twice.
  if (submissionId) {
    const { data: seen } = await supabaseAdmin
      .from("lead_interests")
      .select("lead_id")
      .eq("source", input.source)
      .eq("source_reference", submissionId)
      .maybeSingle();
    if (seen) {
      return {
        leadId: seen.lead_id,
        merged: true,
        acknowledgementSent: false,
        duplicateSubmission: true,
      };
    }
  }

  const existingId = await findExistingLeadId(input);

  // Identity throttle: past the cap, acknowledge as a duplicate and stop —
  // no profile write, no interest row, no email, no adviser notification.
  if (existingId) {
    const since = new Date(Date.now() - IDENTITY_WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("lead_interests")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", existingId)
      .gte("captured_at", since);
    if ((count ?? 0) >= IDENTITY_MAX_SUBMISSIONS) {
      console.warn(`[crm-capture] rate limit: lead ${existingId} exceeded submission window`);
      return {
        leadId: existingId,
        merged: true,
        acknowledgementSent: false,
        duplicateSubmission: true,
      };
    }
  }

  const profile = {
    // leads.full_name is NOT NULL; sources such as Meta may omit it.
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
    fb_lead_id: clean(input.facebook?.leadId),
    page_id: clean(input.facebook?.pageId),
    campaign_id: clean(input.facebook?.campaignId),
    campaign_name: clean(input.facebook?.campaignName),
    facebook_adset_id: clean(input.facebook?.adsetId),
    facebook_adset_name: clean(input.facebook?.adsetName),
    ad_id: clean(input.facebook?.adId),
    ad_name: clean(input.facebook?.adName),
    form_id: clean(input.facebook?.formId),
  };

  let leadId: string;
  if (existingId) {
    const { data: existing, error: readError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", existingId)
      .single();
    if (readError || !existing) {
      throw new Error(readError?.message ?? "Lead lookup failed.");
    }
    leadId = existing.id;

    const patch: LeadUpdate = {
      ...fillOnly(existing as Record<string, unknown>, profile),
      last_activity_at: capturedAt,
    };

    // A second number for a known contact is worth keeping, but only where the
    // profile has nothing there yet — fillOnly already guarantees that.
    if (phone && !existing.whatsapp_number && phoneKey(phone) !== phoneKey(existing.phone)) {
      patch.whatsapp_number = phone;
    }

    // Consent is an audit record: capture the first grant, never restate it.
    if (input.consentGiven && !existing.consent_given) {
      patch.consent_given = true;
      patch.consent_at = capturedAt;
      patch.consent_source = input.source;
    }

    const { error } = await supabaseAdmin.from("leads").update(patch).eq("id", leadId);
    if (error) throw new Error(error.message);
  } else {
    const { data: inserted, error } = await supabaseAdmin
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
    if (error || !inserted) throw new Error(error?.message ?? "Lead creation failed.");
    leadId = inserted.id;
  }

  // Every submission is recorded in full here, which is what lets the lead
  // profile above stay fill-only.
  await supabaseAdmin.from("lead_interests").insert({
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

  await supabaseAdmin.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "system",
    body: existingId
      ? "New enquiry merged into the existing lead profile."
      : "Lead captured and added to the CRM.",
    meta: { source: input.source, source_reference: sourceReference },
  });

  // Email circuit breaker: measured against the "email sent" activity trail,
  // which every acknowledgement writes below.
  const emailSince = new Date(Date.now() - EMAIL_WINDOW_MINUTES * 60_000).toISOString();
  const { count: recentEmails } = await supabaseAdmin
    .from("lead_activities")
    .select("id", { count: "exact", head: true })
    .eq("activity_type", "email")
    .gte("created_at", emailSince);

  let acknowledgement: { ok: boolean } = { ok: false };
  if (input.suppressAcknowledgement) {
    // Caller owns the confirmation for this lead.
  } else if ((recentEmails ?? 0) < EMAIL_MAX_SENDS) {
    const { sendLeadAcknowledgement } = await import("@/lib/crm-email.server");
    acknowledgement = await sendLeadAcknowledgement({
      leadId,
      fullName: input.fullName,
      email,
      source: input.source,
      propertyName: clean(input.propertyName),
      investmentLabel: clean(input.acknowledgement?.investmentLabel),
      eventName: clean(input.acknowledgement?.eventName),
    });
  } else {
    console.warn(
      `[crm-capture] email breaker open: ${recentEmails} acknowledgements in ${EMAIL_WINDOW_MINUTES} min — lead ${leadId} captured without email`,
    );
  }

  if (acknowledgement.ok) {
    await applyAutomatedStatus(leadId, "auto_response_sent");
    await supabaseAdmin.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "email",
      body: "Immediate acknowledgement email sent.",
    });
  }

  const { autoAssignCrmLead } = await import("@/lib/crm-assignment.server");
  await autoAssignCrmLead(leadId);

  return {
    leadId,
    merged: Boolean(existingId),
    acknowledgementSent: acknowledgement.ok,
    duplicateSubmission: false,
  };
}

/**
 * Writes an automated status only when it moves the lead forward.
 */
export async function applyAutomatedStatus(leadId: string, next: LeadStatus): Promise<void> {
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return;
  const status = advanceLeadStatus(lead.status as LeadStatus, next);
  if (!status) return;
  await supabaseAdmin.from("leads").update({ status }).eq("id", leadId);
}

/**
 * Records a lead whose capture threw, with everything needed to replay it.
 *
 * Callers must not let this throw: it runs inside the failure path, and a
 * second failure there would put us back to losing the lead entirely. The
 * worst case is the console line we already had.
 */
export async function recordCaptureFailure(input: LeadCaptureInput, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  try {
    const row = {
      source: input.source,
      submission_id: clean(input.submissionId),
      payload: input as unknown as Json,
      raw_payload: input.rawPayload ?? null,
      error: message.slice(0, 2000),
      last_attempt_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lead_capture_failures enters the generated types after the migration runs.
    const sb = supabaseAdmin as any;

    // A redelivery of a lead that keeps failing updates its row rather than
    // adding another, so the queue stays one entry per lost lead.
    if (row.submission_id) {
      const { data: seen } = await sb
        .from("lead_capture_failures")
        .select("id, attempts")
        .eq("source", row.source)
        .eq("submission_id", row.submission_id)
        .is("resolved_at", null)
        .maybeSingle();
      if (seen) {
        await sb
          .from("lead_capture_failures")
          .update({
            error: row.error,
            attempts: (seen.attempts ?? 1) + 1,
            last_attempt_at: row.last_attempt_at,
            payload: row.payload,
          })
          .eq("id", seen.id);
        return;
      }
    }

    await sb.from("lead_capture_failures").insert(row);
  } catch (writeError) {
    console.error(
      "[crm-capture] could not record the failed capture:",
      writeError instanceof Error ? writeError.message : writeError,
      "| original error:",
      message,
    );
  }
}
