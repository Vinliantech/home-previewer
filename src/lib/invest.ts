export const NAIRA = "₦";

export function fmtNGN(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? Number(n) : (n ?? 0);
  if (!Number.isFinite(v)) return `${NAIRA}0`;
  return `${NAIRA}${v.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function fmtPct(n: number | string | null | undefined, dp = 2): string {
  const v = typeof n === "string" ? Number(n) : (n ?? 0);
  if (!Number.isFinite(v)) return "0.00%";
  return `${v.toFixed(dp)}%`;
}

export const PROPERTY_STATUS_LABEL: Record<string, string> = {
  open: "Open for Investment",
  partially_funded: "Partially Funded",
  fully_funded: "Fully Funded",
  under_review: "Under Company Review",
  approved: "Approved",
  acquisition_in_progress: "Acquisition in Progress",
  acquired: "Property Acquired",
  income_generating: "Income Generating",
  available_for_resale: "Available for Resale",
  sold: "Sold",
  closed: "Closed",
};

export const INVESTMENT_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Awaiting Company Approval",
  payment_pending: "Payment Pending",
  payment_received: "Payment Received",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const KYC_STATUS_LABEL: Record<string, string> = {
  not_submitted: "Not Submitted",
  pending: "Pending Review",
  verified: "Verified",
  rejected: "Rejected",
  more_info: "More Information Required",
};

export const TOKEN_STATUS_LABEL: Record<string, string> = {
  reserved: "Reserved",
  pending_payment: "Pending Payment",
  pending_approval: "Pending Approval",
  active: "Active",
  locked: "Locked",
  listed_for_resale: "Listed for Resale",
  transferred: "Transferred",
  redeemed: "Redeemed",
  cancelled: "Cancelled",
};

export const EXIT_STATUS_LABEL: Record<string, string> = {
  submitted: "Request Submitted",
  under_review: "Under Review",
  approved_for_listing: "Approved for Listing",
  buyer_found: "Buyer Found",
  payment_pending: "Payment Pending",
  transfer_in_progress: "Transfer in Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function statusTone(status: string): string {
  if (
    [
      "approved",
      "verified",
      "active",
      "fully_funded",
      "completed",
      "acquired",
      "income_generating",
    ].includes(status)
  )
    return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
  if (["rejected", "cancelled", "closed", "sold"].includes(status))
    return "bg-rose-500/15 text-rose-200 border-rose-400/30";
  if (
    [
      "pending",
      "submitted",
      "under_review",
      "payment_pending",
      "payment_received",
      "more_info",
      "reserved",
      "pending_approval",
      "pending_payment",
    ].includes(status)
  )
    return "bg-amber-500/15 text-amber-200 border-amber-400/30";
  if (
    [
      "open",
      "partially_funded",
      "approved_for_listing",
      "buyer_found",
      "transfer_in_progress",
    ].includes(status)
  )
    return "bg-sky-500/15 text-sky-200 border-sky-400/30";
  return "bg-slate-500/15 text-slate-200 border-slate-400/30";
}

export function ownershipPct(approvedAmount: number, initialValue: number): number {
  if (!initialValue) return 0;
  return (approvedAmount / initialValue) * 100;
}

export function tokensForAmount(amount: number, tokenValue: number): number {
  if (!tokenValue) return 0;
  return Math.floor(amount / tokenValue);
}

export function currentShareValue(currentPropertyValue: number, ownership: number): number {
  return Math.round(currentPropertyValue * (ownership / 100));
}
