export type LeadStatus =
  | "new"
  | "auto_response_sent"
  | "assigned_to_adviser"
  | "contact_attempted"
  | "contacted"
  | "interested"
  | "qualified"
  | "property_information_sent"
  | "brochure_sent"
  | "investment_pack_sent"
  | "inspection_booked"
  | "inspection_completed"
  | "kyc_pending"
  | "payment_pending"
  | "payment_discussion"
  | "payment_submitted"
  | "payment_received"
  | "payment_approved"
  | "converted"
  | "follow_up_later"
  | "not_interested"
  | "lost";

export type PipelineStage = Exclude<
  LeadStatus,
  "interested" | "brochure_sent" | "payment_discussion" | "payment_received"
>;

export type LeadGrade = "A" | "B" | "C" | "D";

export type InvestmentType =
  | "full_purchase"
  | "group_purchase"
  | "fractional"
  | "tokenized"
  | "land_purchase"
  | "residential_property"
  | "commercial_property"
  | "rental_income"
  | "not_decided";

export type LeadSource =
  | "website_contact_form"
  | "website_property_enquiry"
  | "website_investment_form"
  | "event_registration"
  | "workshop_registration"
  | "facebook_lead_ads"
  | "facebook_messenger"
  | "instagram"
  | "whatsapp"
  | "referral"
  | "affiliate"
  | "walk_in"
  | "phone_call"
  | "manual_entry"
  | "other";

export type OpportunityStage =
  | "qualification"
  | "proposal"
  | "negotiation"
  | "closing"
  | "won"
  | "lost";

export type TaskType =
  | "call"
  | "whatsapp"
  | "email_followup"
  | "brochure"
  | "payment_plan"
  | "inspection"
  | "event_reminder"
  | "document_request"
  | "group_plan"
  | "tokenized_explain"
  | "allocation"
  | "payment_followup"
  | "kyc_reminder"
  | "adviser_meeting"
  | "other";

/**
 * How far along the pipeline each status sits. Automated capture may only move
 * a lead forward: a converted client who fills in another Facebook form must
 * not be reset to "auto_response_sent". Aliases that describe the same point in
 * the pipeline deliberately share a rank.
 */
const LEAD_STATUS_RANK: Record<LeadStatus, number> = {
  new: 0,
  auto_response_sent: 10,
  assigned_to_adviser: 20,
  contact_attempted: 30,
  follow_up_later: 35,
  contacted: 40,
  interested: 50,
  qualified: 60,
  property_information_sent: 70,
  brochure_sent: 70,
  investment_pack_sent: 80,
  inspection_booked: 90,
  inspection_completed: 100,
  kyc_pending: 110,
  payment_pending: 120,
  payment_discussion: 120,
  payment_submitted: 130,
  payment_received: 140,
  payment_approved: 150,
  converted: 160,
  not_interested: 0,
  lost: 0,
};

/** Statuses an adviser or admin owns outright; automation never moves them. */
const TERMINAL_LEAD_STATUSES: readonly LeadStatus[] = ["converted", "not_interested", "lost"];

/**
 * Returns the status an automated step should write, or null to leave the lead
 * where it is.
 */
export function advanceLeadStatus(current: LeadStatus, next: LeadStatus): LeadStatus | null {
  if (current === next) return null;
  if (TERMINAL_LEAD_STATUSES.includes(current)) return null;
  if (LEAD_STATUS_RANK[next] <= LEAD_STATUS_RANK[current]) return null;
  return next;
}

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  location: string | null;
  country_of_residence: string | null;
  fb_profile_url: string | null;
  fb_lead_id: string | null;
  page_id: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  facebook_adset_id: string | null;
  facebook_adset_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  form_id: string | null;
  form_name: string | null;
  cost_per_lead: number | null;
  property_id: string | null;
  property_name: string | null;
  property_type: string | null;
  preferred_location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  investment_type: InvestmentType | null;
  lead_source: LeadSource;
  source_detail: string | null;
  status: LeadStatus;
  lead_grade: LeadGrade;
  recommended_grade: LeadGrade;
  grade_score: number;
  grade_reason: string | null;
  preferred_contact_method: string | null;
  expected_timeline: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  captured_at: string;
  last_contacted_at: string | null;
  last_activity_at: string | null;
  consent_given: boolean;
  consent_at: string | null;
  consent_source: string | null;
  unsubscribed_at: string | null;
  do_not_contact: boolean;
  notes: string | null;
  created_at: string;
  updated_at?: string;
};

export type SalesAgent = {
  id?: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string | null;
  active?: boolean;
  assigned_locations?: string[];
  assigned_investment_types?: InvestmentType[];
  monthly_target_naira?: number | null;
};

export type FollowUpTask = {
  id: string;
  lead_id: string;
  title: string;
  task_type: TaskType;
  due_at: string;
  assigned_to: string | null;
  completed_at: string | null;
  completed_by?: string | null;
  snoozed_until?: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "completed" | "cancelled";
  notes: string | null;
  outcome?: string | null;
  created_at: string;
};

export type CrmEvent = {
  id: string;
  name: string;
  event_type: string;
  property_name: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  meeting_url: string | null;
  capacity: number | null;
  description: string | null;
  owner_id: string | null;
  status: "draft" | "published" | "completed" | "cancelled";
  registration_count?: number;
  attendance_count?: number;
};

export type EmailTemplate = {
  id: string;
  name: string;
  category: string;
  subject: string;
  preview_text: string | null;
  html_body: string;
  active: boolean;
  updated_at: string;
};

export type AutomationSequence = {
  id: string;
  name: string;
  description: string | null;
  trigger_source: string | null;
  trigger_investment_type: InvestmentType | null;
  active: boolean;
  enrolled_count?: number;
  completed_count?: number;
  next_step?: string;
};

type StatusMeta = {
  key: PipelineStage;
  label: string;
  shortLabel: string;
  phase: "Intake" | "Engage" | "Evaluate" | "Close" | "Closed";
  tone: string;
};

export const LEAD_STATUSES: StatusMeta[] = [
  {
    key: "new",
    label: "New Lead",
    shortLabel: "New",
    phase: "Intake",
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    key: "auto_response_sent",
    label: "Auto Response Sent",
    shortLabel: "Responded",
    phase: "Intake",
    tone: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  {
    key: "assigned_to_adviser",
    label: "Assigned to Adviser",
    shortLabel: "Assigned",
    phase: "Intake",
    tone: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    key: "contact_attempted",
    label: "Contact Attempted",
    shortLabel: "Attempted",
    phase: "Engage",
    tone: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  {
    key: "contacted",
    label: "Contacted",
    shortLabel: "Contacted",
    phase: "Engage",
    tone: "bg-violet-50 text-violet-800 border-violet-200",
  },
  {
    key: "qualified",
    label: "Qualified",
    shortLabel: "Qualified",
    phase: "Evaluate",
    tone: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    key: "property_information_sent",
    label: "Property Information Sent",
    shortLabel: "Property Info",
    phase: "Evaluate",
    tone: "bg-orange-50 text-orange-800 border-orange-200",
  },
  {
    key: "investment_pack_sent",
    label: "Investment Pack Sent",
    shortLabel: "Pack Sent",
    phase: "Evaluate",
    tone: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
  {
    key: "inspection_booked",
    label: "Inspection Scheduled",
    shortLabel: "Inspection",
    phase: "Evaluate",
    tone: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  },
  {
    key: "inspection_completed",
    label: "Inspection Completed",
    shortLabel: "Inspected",
    phase: "Evaluate",
    tone: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    key: "kyc_pending",
    label: "KYC Pending",
    shortLabel: "KYC",
    phase: "Close",
    tone: "bg-lime-50 text-lime-800 border-lime-200",
  },
  {
    key: "payment_pending",
    label: "Payment Pending",
    shortLabel: "Payment Due",
    phase: "Close",
    tone: "bg-teal-50 text-teal-800 border-teal-200",
  },
  {
    key: "payment_submitted",
    label: "Payment Submitted",
    shortLabel: "Submitted",
    phase: "Close",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    key: "payment_approved",
    label: "Payment Approved",
    shortLabel: "Approved",
    phase: "Close",
    tone: "bg-green-50 text-green-800 border-green-200",
  },
  {
    key: "converted",
    label: "Converted to Client",
    shortLabel: "Converted",
    phase: "Closed",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    key: "follow_up_later",
    label: "Follow Up Later",
    shortLabel: "Later",
    phase: "Closed",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  },
  {
    key: "not_interested",
    label: "Not Interested",
    shortLabel: "Not Interested",
    phase: "Closed",
    tone: "bg-rose-50 text-rose-800 border-rose-200",
  },
  {
    key: "lost",
    label: "Lost Lead",
    shortLabel: "Lost",
    phase: "Closed",
    tone: "bg-red-50 text-red-800 border-red-200",
  },
];

export const LEAD_GRADES: { key: LeadGrade; label: string; description: string; tone: string }[] = [
  {
    key: "A",
    label: "Hot Lead",
    description: "Ready to inspect, complete KYC or pay",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    key: "B",
    label: "Qualified Lead",
    description: "Clear intent and suitable budget",
    tone: "border-blue-200 bg-blue-50 text-blue-800",
  },
  {
    key: "C",
    label: "Nurture Lead",
    description: "Interested but needs more time or information",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    key: "D",
    label: "Inactive Lead",
    description: "Incomplete, unresponsive or outside target",
    tone: "border-slate-200 bg-slate-100 text-slate-700",
  },
];

export const INVESTMENT_TYPES: { key: InvestmentType; label: string }[] = [
  { key: "full_purchase", label: "Full Purchase" },
  { key: "group_purchase", label: "Group Buy" },
  { key: "fractional", label: "Fractional Ownership" },
  { key: "tokenized", label: "Property Tokenization" },
  { key: "land_purchase", label: "Land Purchase" },
  { key: "residential_property", label: "Residential Property" },
  { key: "commercial_property", label: "Commercial Property" },
  { key: "rental_income", label: "Rental-Income Investment" },
  { key: "not_decided", label: "Not Yet Decided" },
];

export const LEAD_SOURCES: { key: LeadSource; label: string }[] = [
  { key: "website_contact_form", label: "Website contact form" },
  { key: "website_property_enquiry", label: "Property enquiry form" },
  { key: "website_investment_form", label: "Investment form" },
  { key: "event_registration", label: "Event registration" },
  { key: "workshop_registration", label: "Workshop registration" },
  { key: "facebook_lead_ads", label: "Facebook Lead Ads" },
  { key: "facebook_messenger", label: "Facebook Messenger" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "referral", label: "Referral" },
  { key: "affiliate", label: "Affiliate" },
  { key: "walk_in", label: "Walk-in" },
  { key: "phone_call", label: "Phone call" },
  { key: "manual_entry", label: "Manual admin entry" },
  { key: "other", label: "Other" },
];

export const OPPORTUNITY_STAGES: { key: OpportunityStage; label: string; tone: string }[] = [
  { key: "qualification", label: "Qualification", tone: "border-slate-300" },
  { key: "proposal", label: "Proposal", tone: "border-blue-300" },
  { key: "negotiation", label: "Negotiation", tone: "border-amber-300" },
  { key: "closing", label: "Closing", tone: "border-violet-300" },
  { key: "won", label: "Won", tone: "border-emerald-400" },
  { key: "lost", label: "Lost", tone: "border-rose-300" },
];

export const TASK_TYPES: { key: TaskType; label: string }[] = [
  { key: "call", label: "Call reminder" },
  { key: "whatsapp", label: "WhatsApp follow-up" },
  { key: "email_followup", label: "Email follow-up" },
  { key: "inspection", label: "Property inspection" },
  { key: "event_reminder", label: "Event reminder" },
  { key: "document_request", label: "Document request" },
  { key: "payment_followup", label: "Payment reminder" },
  { key: "kyc_reminder", label: "KYC reminder" },
  { key: "adviser_meeting", label: "Adviser meeting" },
  { key: "brochure", label: "Send brochure" },
  { key: "payment_plan", label: "Send payment plan" },
  { key: "group_plan", label: "Explain group buy" },
  { key: "tokenized_explain", label: "Explain tokenized offer" },
  { key: "allocation", label: "Send allocation details" },
  { key: "other", label: "Other" },
];

export const PIPELINE_PHASES = ["Intake", "Engage", "Evaluate", "Close", "Closed"] as const;

export const nairaFmt = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function fmtNaira(value: number | null | undefined): string {
  if (value == null) return "Not set";
  return nairaFmt.format(value);
}

export function pipelineStageForStatus(status: LeadStatus): PipelineStage {
  if (status === "interested") return "contacted";
  if (status === "brochure_sent") return "property_information_sent";
  if (status === "payment_discussion") return "payment_pending";
  if (status === "payment_received") return "payment_approved";
  return status;
}

export function statusMeta(status: LeadStatus) {
  const stage = pipelineStageForStatus(status);
  return LEAD_STATUSES.find((item) => item.key === stage) ?? LEAD_STATUSES[0];
}

export function gradeMeta(grade: LeadGrade | null | undefined) {
  return LEAD_GRADES.find((item) => item.key === grade) ?? LEAD_GRADES[2];
}

export function investmentLabel(type: InvestmentType | null | undefined): string {
  if (!type) return "Not decided";
  return INVESTMENT_TYPES.find((item) => item.key === type)?.label ?? type;
}

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "Other";
  return LEAD_SOURCES.find((item) => item.key === source)?.label ?? source.replaceAll("_", " ");
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Not set";
  const date = new Date(iso);
  return date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function isOverdue(task: FollowUpTask): boolean {
  return (
    task.status === "open" && !task.completed_at && new Date(task.due_at).getTime() < Date.now()
  );
}
