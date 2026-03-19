/**
 * North American phone number utilities.
 * Scoped to +1 country code (US/Canada).
 */

/** Remove all non-digit characters from a string. */
export function stripToDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Normalize any phone-like string to E.164 format (+1NNNNNNNNNN).
 * Accepts 10-digit (assumes +1) or 11-digit (leading 1) inputs.
 * Returns null if the input cannot be parsed as a valid NA number.
 */
export function toE164(input: string): string | null {
  const digits = stripToDigits(input);
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

/** Returns true if the input can be normalized to a valid NA phone number. */
export function isValidNAPhone(input: string): boolean {
  return toE164(input) !== null;
}

/**
 * Format an E.164 string for human display: +1 416-555-1234.
 * Returns the raw input unchanged if it cannot be parsed.
 */
export function formatPhoneDisplay(e164: string): string {
  const digits = stripToDigits(e164);
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (local.length !== 10) return e164;
  return `+1 ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
}

/**
 * Progressive formatting for live input masking.
 * Takes raw digits (0–10) and returns formatted string: NNN-NNN-NNNN.
 * The +1 prefix is handled by the component, not this function.
 */
export function formatPhoneLive(digits: string): string {
  const d = digits.slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}
