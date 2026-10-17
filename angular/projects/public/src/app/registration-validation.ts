import { AbstractControl, ValidationErrors } from '@angular/forms';
/** Match the existing Express registration contract; the server remains authoritative. */
export function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return !value || [...value].length > 120 || /[\u0000-\u001f\u007f]/.test(value)
    ? { name: true }
    : null;
}
/**
 * Check normalized email syntax against the server registration contract.
 * @param control - Email form control; values are trimmed and lowercased for validation.
 * @returns An email error or null. Server-side validation remains authoritative.
 */
export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const email = String(control.value ?? '')
    .trim()
    .toLowerCase();
  const parts = email.split('@');
  if (email.length > 254 || !/^[\x21-\x7e]+$/.test(email) || parts.length !== 2)
    return { email: true };
  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)
  )
    return { email: true };
  const labels = domain.split('.');
  return labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
    )
    ? null
    : { email: true };
}
/**
 * Require a positive whole ticket count within the signed MySQL INT limit.
 * @param control - Ticket-count form control.
 * @returns A tickets error or null for integers from 1 to 2147483647.
 */
export function ticketsValidator(control: AbstractControl): ValidationErrors | null {
  const text = String(control.value ?? '').trim(),
    value = Number(text);
  return /^\d+$/.test(text) && Number.isInteger(value) && value >= 1 && value <= 2147483647
    ? null
    : { tickets: true };
}
