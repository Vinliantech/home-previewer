export type PoolVisibility = "private" | "open";

export type PoolStatus =
  | "pending_approval"
  | "open"
  | "threshold_met"
  | "closing"
  | "completed"
  | "cancelled"
  | "rejected";

export type PoolMemberStatus =
  | "invited"
  | "pending"
  | "committed"
  | "approved"
  | "declined"
  | "removed";

export const POOL_STATUS_LABEL: Record<PoolStatus, string> = {
  pending_approval: "Pending approval",
  open: "Open",
  threshold_met: "Threshold met",
  closing: "Closing",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export const POOL_MEMBER_STATUS_LABEL: Record<PoolMemberStatus, string> = {
  invited: "Invited",
  pending: "Pending approval",
  committed: "Committed",
  approved: "Approved",
  declined: "Declined",
  removed: "Removed",
};

export const POOL_VISIBILITY_LABEL: Record<PoolVisibility, string> = {
  private: "Private group",
  open: "Open pool",
};

export type PoolSummary = {
  pool_id: string;
  committed: number;
  approved: number;
  members: number;
  approved_members: number;
};

export type GroupPool = {
  id: string;
  name: string;
  property_id: string | null;
  property_name: string | null;
  created_by: string;
  visibility: PoolVisibility;
  target_amount: number;
  min_contribution: number;
  member_cap: number | null;
  closing_date: string | null;
  status: PoolStatus;
  description: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PoolMember = {
  id: string;
  pool_id: string;
  user_id: string | null;
  invited_email: string | null;
  committed_amount: number;
  status: PoolMemberStatus;
  is_founder: boolean;
  joined_at: string | null;
  created_at: string;
  /** Optional joined display name from a profile lookup. */
  display_name?: string | null;
};

export function poolProgressPct(committed: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((committed / target) * 100));
}

/* Server-function result shapes (kept explicit so TanStack Start's
   serialization type-check is satisfied and demo data can mirror them). */

export type PoolListItem = GroupPool & {
  summary: PoolSummary;
  my_membership?: { is_founder: boolean; status: PoolMemberStatus } | null;
};

export type PoolListResult = { pools: PoolListItem[] };

export type PoolDetailResult = {
  pool: GroupPool;
  members: PoolMember[];
  summary: PoolSummary;
  is_founder: boolean;
  i_am_member?: boolean;
};
