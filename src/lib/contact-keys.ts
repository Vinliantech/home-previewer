/**
 * Contact identity normalisation — the TypeScript mirror of the SQL helpers
 * `public.crm_email_key` and `public.crm_phone_key` in the
 * 20260717090000_crm_lead_matching migration.
 *
 * Two capture sources rarely format a contact the same way: Meta delivers
 * "+234 803 123 4567" while the website form collects "08031234567". These
 * keys are what "same person" means everywhere. If you change either function,
 * change its SQL twin in a new migration — the pair must stay identical or
 * dedupe splits across the boundary.
 */

/** Case- and whitespace-insensitive email identity; null when empty. */
export function emailKey(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  return email === "" ? null : email;
}

/**
 * Phone identity: digits only, last ten kept — the stable part across local
 * (0803…) and international (+234 803…) forms. Null when fewer than ten
 * digits, because a fragment is not an identity.
 */
export function phoneKey(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}
