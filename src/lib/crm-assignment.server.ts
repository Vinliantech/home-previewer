import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { advanceLeadStatus, type LeadStatus } from "@/lib/crm";

/**
 * Applies the same assignment rules to public form, event and Meta leads.
 * This runs only on the server with the service client.
 */
export async function autoAssignCrmLead(leadId: string): Promise<string | null> {
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select(
      "id, full_name, preferred_location, investment_type, campaign_id, budget_min, budget_max, assigned_to, status",
    )
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return null;
  if (lead.assigned_to) return lead.assigned_to;

  const { data: rules } = await supabaseAdmin
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
    if (rule.match_investment_type && lead.investment_type !== rule.match_investment_type) continue;
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
    const { data: agents } = await supabaseAdmin
      .from("sales_agents")
      .select("id, user_id, round_robin_cursor")
      .eq("active", true)
      .order("round_robin_cursor", { ascending: true })
      .limit(1);
    const agent = agents?.[0];
    if (agent) {
      agentId = agent.user_id;
      await supabaseAdmin
        .from("sales_agents")
        .update({ round_robin_cursor: (agent.round_robin_cursor ?? 0) + 1 })
        .eq("id", agent.id);
    }
  }

  if (!agentId) return null;
  const now = new Date().toISOString();
  // Routing a lead must not drag its pipeline position backwards.
  const nextStatus = advanceLeadStatus(lead.status as LeadStatus, "assigned_to_adviser");
  await supabaseAdmin
    .from("leads")
    .update({
      assigned_to: agentId,
      assigned_at: now,
      last_activity_at: now,
      ...(nextStatus ? { status: nextStatus } : {}),
    })
    .eq("id", leadId);

  const { data: existingTask } = await supabaseAdmin
    .from("follow_up_tasks")
    .select("id")
    .eq("lead_id", leadId)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  if (!existingTask) {
    await supabaseAdmin.from("follow_up_tasks").insert({
      lead_id: leadId,
      title: "Contact new lead within 30 minutes",
      task_type: "call",
      assigned_to: agentId,
      due_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      priority: "high",
    });
  }

  await supabaseAdmin.from("crm_notifications").insert({
    user_id: agentId,
    type: "lead_assigned",
    title: "New lead assigned",
    body: lead.full_name,
    lead_id: leadId,
  });
  await supabaseAdmin.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "assignment",
    body: "Lead assigned automatically using CRM routing rules.",
    meta: { adviser_id: agentId },
  });
  return agentId;
}
