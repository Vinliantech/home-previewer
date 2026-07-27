/**
 * The client's documentation number.
 *
 * Mirrors the affiliate member id (KS-00001) but carries a C, because the two
 * sequences are independent and would otherwise collide: affiliate 42 and
 * client 42 would both read "KS-00042" on paperwork.
 *
 * The number is assigned by the profiles.client_number column default at
 * signup and never changes, so it is safe to print on contracts and receipts.
 */
export const CLIENT_NUMBER_PREFIX = "KS-C";

export function clientNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (!Number.isInteger(value) || value <= 0) return "—";
  return `${CLIENT_NUMBER_PREFIX}-${String(value).padStart(5, "0")}`;
}
