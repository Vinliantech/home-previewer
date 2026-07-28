import { createClientFn } from "@/lib/client-function";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { advanceLeadStatus, type LeadStatus } from "@/lib/crm";
import { createEdgeFn, createEdgeQuery } from "@/integrations/supabase/edge";

const investmentTypes = [
  "full_purchase",
  "group_purchase",
  "fractional",
  "tokenized",
  "land_purchase",
  "residential_property",
  "commercial_property",
  "rental_income",
  "not_decided",
] as const;

const leadStatuses = [
  "new",
  "auto_response_sent",
  "assigned_to_adviser",
  "contact_attempted",
  "contacted",
  "interested",
  "qualified",
  "property_information_sent",
  "brochure_sent",
  "investment_pack_sent",
  "inspection_booked",
  "inspection_completed",
  "kyc_pending",
  "payment_pending",
  "payment_discussion",
  "payment_submitted",
  "payment_received",
  "payment_approved",
  "converted",
  "follow_up_later",
  "not_interested",
  "lost",
] as const;

const leadSources = [
  "website_contact_form",
  "website_property_enquiry",
  "website_investment_form",
  "event_registration",
  "workshop_registration",
  "facebook_lead_ads",
  "facebook_messenger",
  "instagram",
  "whatsapp",
  "referral",
  "affiliate",
  "walk_in",
  "phone_call",
  "manual_entry",
  "other",
] as const;

const taskTypes = [
  "call",
  "whatsapp",
  "email_followup",
  "brochure",
  "payment_plan",
  "inspection",
  "event_reminder",
  "document_request",
  "group_plan",
  "tokenized_explain",
  "allocation",
  "payment_followup",
  "kyc_reminder",
  "adviser_meeting",
  "other",
] as const;

/** Assign a lead to a specific adviser. RLS limits this action to permitted CRM users. */
export const assignLead = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ leadId: z.string().uuid(), agentId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: current } = await supabase
      .from("leads")
      .select("status")
      .eq("id", data.leadId)
      .maybeSingle();
    // Re-routing a lead must not drag its pipeline position backwards.
    const nextStatus = current
      ? advanceLeadStatus(current.status as LeadStatus, "assigned_to_adviser")
      : null;
    const now = new Date().toISOString();
    const { data: lead, error } = await supabase
      .from("leads")
      .update({
        assigned_to: data.agentId,
        assigned_at: now,
        last_activity_at: now,
        ...(nextStatus ? { status: nextStatus } : {}),
      })
      .eq("id", data.leadId)
      .select("full_name")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("lead_activities").insert({
      lead_id: data.leadId,
      activity_type: "assignment",
      body: "Lead assigned to a sales adviser.",
      actor_id: userId,
      meta: { adviser_id: data.agentId },
    });
    await supabase.from("crm_notifications").insert({
      user_id: data.agentId,
      type: "lead_assigned",
      title: "New lead assigned to you",
      body: lead.full_name,
      lead_id: data.leadId,
    });
    return { ok: true };
  });

/** Auto-assign by configured rules, with round-robin as the fallback. */
export const autoAssignLead = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => z.object({ leadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .maybeSingle();
    if (!lead) throw new Error("Lead not found");

    const { data: rules } = await supabase
      .from("assignment_rules")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: true });

    let agentId: string | null = null;
    for (const rule of rules ?? []) {
      if (
        rule.match_location &&
        lead.preferred_location &&
        !lead.preferred_location.toLowerCase().includes(rule.match_location.toLowerCase())
      ) {
        continue;
      }
      if (rule.match_investment_type && lead.investment_type !== rule.match_investment_type)
        continue;
      if (rule.match_campaign_id && lead.campaign_id !== rule.match_campaign_id) continue;
      if (rule.match_budget_min && (lead.budget_max ?? 0) < rule.match_budget_min) continue;
      if (rule.match_budget_max && (lead.budget_min ?? 0) > rule.match_budget_max) continue;
      if (rule.assign_agent_id && !rule.use_round_robin) {
        agentId = rule.assign_agent_id;
        break;
      }
      if (rule.use_round_robin) break;
    }

    if (!agentId) {
      const { data: agents } = await supabase
        .from("sales_agents")
        .select("id, user_id, round_robin_cursor")
        .eq("active", true)
        .order("round_robin_cursor", { ascending: true })
        .limit(1);
      const agent = agents?.[0];
      if (agent) {
        agentId = agent.user_id;
        await supabase
          .from("sales_agents")
          .update({ round_robin_cursor: (agent.round_robin_cursor ?? 0) + 1 })
          .eq("id", agent.id);
      }
    }

    if (!agentId) return { ok: false, reason: "no_active_agents" };

    const now = new Date().toISOString();
    // Routing a lead must not drag its pipeline position backwards.
    const nextStatus = advanceLeadStatus(lead.status as LeadStatus, "assigned_to_adviser");
    await supabase
      .from("leads")
      .update({
        assigned_to: agentId,
        assigned_at: now,
        last_activity_at: now,
        ...(nextStatus ? { status: nextStatus } : {}),
      })
      .eq("id", data.leadId);
    await supabase.from("follow_up_tasks").insert({
      lead_id: data.leadId,
      title: "Contact new lead within 30 minutes",
      task_type: "call",
      assigned_to: agentId,
      due_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      priority: "high",
      created_by: userId,
    });
    await supabase.from("crm_notifications").insert({
      user_id: agentId,
      type: "lead_assigned",
      title: "New lead assigned",
      body: lead.full_name,
      lead_id: data.leadId,
    });
    return { ok: true, agentId };
  });

export const updateLeadStatus = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ leadId: z.string().uuid(), status: z.enum(leadStatuses) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("leads")
      .update({ status: data.status, last_activity_at: new Date().toISOString() })
      .eq("id", data.leadId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateLeadGrade = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        leadId: z.string().uuid(),
        grade: z.enum(["A", "B", "C", "D"]),
        reason: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("leads")
      .update({
        lead_grade: data.grade,
        grade_reason: data.reason || null,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", data.leadId);
    if (error) throw new Error(error.message);
    await supabase.from("lead_activities").insert({
      lead_id: data.leadId,
      activity_type: "grade_change",
      body: `Lead grade changed to ${data.grade}.`,
      actor_id: userId,
      meta: { reason: data.reason ?? null },
    });
    return { ok: true };
  });

export const addLeadNote = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ leadId: z.string().uuid(), body: z.string().trim().min(2).max(3000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("lead_activities").insert({
      lead_id: data.leadId,
      activity_type: "note",
      body: data.body,
      actor_id: context.userId,
    });
    if (error) throw new Error(error.message);
    await context.supabase
      .from("leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.leadId);
    return { ok: true };
  });

export const createFollowUpTask = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        leadId: z.string().uuid(),
        title: z.string().trim().min(2).max(180),
        taskType: z.enum(taskTypes),
        dueAt: z.string().datetime(),
        assignedTo: z.string().uuid(),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        notes: z.string().trim().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: task, error } = await context.supabase
      .from("follow_up_tasks")
      .insert({
        lead_id: data.leadId,
        title: data.title,
        task_type: data.taskType,
        due_at: data.dueAt,
        assigned_to: data.assignedTo,
        priority: data.priority,
        notes: data.notes || null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("lead_activities").insert({
      lead_id: data.leadId,
      activity_type: "task",
      body: `Follow-up task created: ${data.title}`,
      actor_id: context.userId,
      meta: { task_id: task.id, due_at: data.dueAt },
    });
    return { ok: true, taskId: task.id };
  });

export const completeFollowUpTask = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        taskId: z.string().uuid(),
        completed: z.boolean(),
        outcome: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("follow_up_tasks")
      .update({
        completed_at: data.completed ? new Date().toISOString() : null,
        completed_by: data.completed ? context.userId : null,
        status: data.completed ? "completed" : "open",
        outcome: data.outcome || null,
      })
      .eq("id", data.taskId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Convert a qualified lead to a deal opportunity. */
export const convertToOpportunity = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        leadId: z.string().uuid(),
        buyerName: z.string().trim().min(1),
        unitType: z.string().max(120).optional(),
        dealValueNaira: z.number().min(0),
        investmentAmount: z.number().min(0).optional(),
        purchaseModel: z.enum(investmentTypes),
        expectedCloseAt: z.string().optional(),
        probability: z.number().min(0).max(100).default(50),
        propertyName: z.string().max(160).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: lead } = await supabase
      .from("leads")
      .select("assigned_to")
      .eq("id", data.leadId)
      .maybeSingle();
    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .insert({
        lead_id: data.leadId,
        buyer_name: data.buyerName,
        unit_type: data.unitType,
        deal_value_naira: data.dealValueNaira,
        investment_amount: data.investmentAmount ?? data.dealValueNaira,
        purchase_model: data.purchaseModel,
        expected_close_at: data.expectedCloseAt || null,
        probability: data.probability,
        property_name: data.propertyName,
        assigned_to: lead?.assigned_to ?? userId,
        created_by: userId,
        stage: "qualification",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("leads").update({ status: "qualified" }).eq("id", data.leadId);
    await supabase.from("lead_activities").insert({
      lead_id: data.leadId,
      activity_type: "note",
      body: `Converted to an opportunity valued at NGN ${data.dealValueNaira.toLocaleString("en-NG")}.`,
      actor_id: userId,
    });
    return { ok: true, opportunityId: opportunity.id };
  });

/** Manual intake uses the same lead record and preserves every later enquiry as activity. */
export const createManualLead = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(30).optional(),
        whatsappNumber: z.string().trim().max(30).optional(),
        email: z.string().trim().email().optional().or(z.literal("")),
        location: z.string().trim().max(120).optional(),
        countryOfResidence: z.string().trim().max(100).optional(),
        propertyName: z.string().trim().max(160).optional(),
        propertyType: z.string().trim().max(120).optional(),
        preferredLocation: z.string().trim().max(120).optional(),
        budgetMin: z.number().nonnegative().optional(),
        budgetMax: z.number().nonnegative().optional(),
        investmentType: z.enum(investmentTypes).optional(),
        leadSource: z.enum(leadSources).default("manual_entry"),
        sourceDetail: z.string().trim().max(200).optional(),
        preferredContactMethod: z.string().trim().max(40).optional(),
        expectedTimeline: z.string().trim().max(60).optional(),
        assignedTo: z.string().uuid().optional(),
        notes: z.string().trim().max(3000).optional(),
        consentGiven: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Normalised matching lives in the database so every capture path agrees on
    // what "same contact" means. Matching email with ILIKE would treat "_" and
    // "%" as wildcards and merge unrelated people.
    let existing: { id: string } | null = null;
    if (data.email || data.phone) {
      const { data: matchId } = await supabase.rpc("find_lead_by_contact", {
        _email: data.email ?? null,
        _phone: data.phone ?? null,
      });
      if (matchId) existing = { id: matchId as string };
    }

    const now = new Date().toISOString();
    const values = {
      full_name: data.fullName,
      phone: data.phone || null,
      whatsapp_number: data.whatsappNumber || null,
      email: data.email || null,
      location: data.location || null,
      country_of_residence: data.countryOfResidence || null,
      property_name: data.propertyName || null,
      property_type: data.propertyType || null,
      preferred_location: data.preferredLocation || null,
      budget_min: data.budgetMin ?? null,
      budget_max: data.budgetMax ?? null,
      investment_type: data.investmentType ?? "not_decided",
      lead_source: data.leadSource,
      source_detail: data.sourceDetail || null,
      preferred_contact_method: data.preferredContactMethod || null,
      expected_timeline: data.expectedTimeline || null,
      assigned_to: data.assignedTo ?? null,
      assigned_at: data.assignedTo ? now : null,
      status: data.assignedTo ? ("assigned_to_adviser" as const) : ("new" as const),
      notes: data.notes || null,
      consent_given: data.consentGiven,
      consent_at: data.consentGiven ? now : null,
      consent_source: data.leadSource,
      last_activity_at: now,
    };

    let leadId: string;
    let merged = false;
    if (existing) {
      leadId = existing.id;
      merged = true;
      const { error } = await supabase.from("leads").update(values).eq("id", leadId);
      if (error) throw new Error(error.message);
    } else {
      const { data: lead, error } = await supabase
        .from("leads")
        .insert(values)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      leadId = lead.id;
    }

    await supabase.from("lead_interests").insert({
      lead_id: leadId,
      source: data.leadSource,
      source_reference: data.sourceDetail || null,
      property_name: data.propertyName || null,
      investment_type: data.investmentType ?? "not_decided",
      budget_min: data.budgetMin ?? null,
      budget_max: data.budgetMax ?? null,
      message: data.notes || null,
      captured_at: now,
    });
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "system",
      body: merged
        ? "New enquiry merged into the existing lead profile."
        : "Lead created manually in the CRM.",
      actor_id: userId,
      meta: { source: data.leadSource },
    });
    return { ok: true, leadId, merged };
  });

export const createCrmEvent = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        name: z.string().trim().min(3).max(160),
        eventType: z.string().trim().min(2).max(60),
        propertyName: z.string().trim().max(160).optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime().optional(),
        venue: z.string().trim().max(240).optional(),
        meetingUrl: z.string().url().optional().or(z.literal("")),
        capacity: z.number().int().positive().optional(),
        description: z.string().trim().max(2000).optional(),
        status: z.enum(["draft", "published"]).default("draft"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: event, error } = await context.supabase
      .from("crm_events")
      .insert({
        name: data.name,
        event_type: data.eventType,
        property_name: data.propertyName || null,
        starts_at: data.startsAt,
        ends_at: data.endsAt || null,
        venue: data.venue || null,
        meeting_url: data.meetingUrl || null,
        capacity: data.capacity ?? null,
        description: data.description || null,
        owner_id: context.userId,
        created_by: context.userId,
        status: data.status,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, eventId: event.id };
  });

export const toggleAutomationSequence = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z.object({ sequenceId: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automation_sequences")
      .update({ active: data.active })
      .eq("id", data.sequenceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveEmailTemplate = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(3).max(120),
        category: z.string().trim().min(2).max(60),
        subject: z.string().trim().min(3).max(200),
        previewText: z.string().trim().max(240).optional(),
        htmlBody: z.string().trim().min(10).max(50_000),
        textBody: z.string().trim().max(20_000).optional(),
        active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const values = {
      name: data.name,
      category: data.category,
      subject: data.subject,
      preview_text: data.previewText || null,
      html_body: data.htmlBody,
      text_body: data.textBody || null,
      active: data.active,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("email_templates")
        .update(values)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, templateId: data.id };
    }
    const { data: template, error } = await context.supabase
      .from("email_templates")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, templateId: template.id };
  });

export const createAutomationSequence = createClientFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        name: z.string().trim().min(3).max(120),
        description: z.string().trim().max(1000).optional(),
        triggerSource: z.string().trim().max(80).optional(),
        triggerInvestmentType: z.enum(investmentTypes).optional(),
        immediateTemplateId: z.string().uuid().optional(),
        active: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: sequence, error } = await context.supabase
      .from("automation_sequences")
      .insert({
        name: data.name,
        description: data.description || null,
        trigger_source: data.triggerSource || null,
        trigger_investment_type: data.triggerInvestmentType || null,
        active: data.active,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (data.immediateTemplateId) {
      const { error: stepError } = await context.supabase.from("automation_steps").insert({
        sequence_id: sequence.id,
        template_id: data.immediateTemplateId,
        step_order: 1,
        delay_minutes: 0,
        action_type: "send_email",
      });
      if (stepError) throw new Error(stepError.message);
    }
    return { ok: true, sequenceId: sequence.id };
  });

export const getCrmIntegrationStatus = createEdgeQuery<{
  meta: { configured: boolean; required: string[]; lastCaptureAt: string | null };
  email: { configured: boolean; provider: string; required: string[] };
  whatsapp: { configured: boolean; required: string[]; built: true };
}>("admin-workflows", "integration_status");

export const sendTestCrmEmail = createEdgeFn<
  { email: string },
  { ok: true }
>("admin-workflows", "test_email", (input) =>
  z.object({ email: z.string().email() }).parse(input),
);
