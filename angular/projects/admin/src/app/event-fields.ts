import type { EventInput } from '@charity/shared';
export type FieldKey = keyof EventInput;
export type EventDraft = Record<FieldKey, string>;
export const textFields = [
  { key: 'name', label: 'Event name', max: 150, long: false },
  { key: 'location', label: 'Location', max: 180, long: false },
  { key: 'purpose', label: 'Fundraising purpose', max: 255, long: false },
  { key: 'short_description', label: 'Short description', max: 300, long: true },
  { key: 'full_description', label: 'Full description', max: 16000, long: true },
] as const;
export const moneyFields = [
  { key: 'ticket_price', label: 'Ticket price (AUD)', max: 999999.99 },
  { key: 'fundraising_goal', label: 'Fundraising goal (AUD)', max: 99999999.99 },
  { key: 'current_progress', label: 'Current progress (AUD)', max: 99999999.99 },
] as const;
export const blankDraft = (): EventDraft => ({
  organisation_id: '',
  category_id: '',
  name: '',
  event_datetime: '',
  location: '',
  purpose: '',
  short_description: '',
  full_description: '',
  ticket_price: '0.00',
  fundraising_goal: '0.00',
  current_progress: '0.00',
  status: 'active',
  latitude: '',
  longitude: '',
});
/** Keep these browser checks aligned with the authoritative API admin-validation rules. */
export function validateDraft(draft: EventDraft): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const field of textFields) {
    if (!draft[field.key].trim()) errors[field.key] = field.label + ' is required.';
    else if (Array.from(draft[field.key].trim()).length > field.max)
      errors[field.key] = 'Use at most ' + field.max + ' characters.';
  }
  for (const key of ['organisation_id', 'category_id'] as const) {
    if (!/^\d+$/.test(draft[key]) || Number(draft[key]) < 1 || Number(draft[key]) > 2147483647)
      errors[key] = 'Choose a valid ' + key.replace('_id', '') + '.';
  }
  const date = draft.event_datetime;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(date))
    errors.event_datetime = 'Enter a Brisbane date and time.';
  else {
    const [y, m, d, h, min, s = 0] = date.split(/\D/).map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d, h, min, s));
    if (
      y < 1000 ||
      y > 9999 ||
      parsed.getUTCFullYear() !== y ||
      parsed.getUTCMonth() !== m - 1 ||
      parsed.getUTCDate() !== d ||
      h > 23 ||
      min > 59 ||
      s > 59
    )
      errors.event_datetime = 'Enter a valid date and time (years 1000–9999).';
  }
  for (const field of moneyFields)
    if (!/^\d+(\.\d{1,2})?$/.test(draft[field.key]) || Number(draft[field.key]) > field.max)
      errors[field.key] = 'Enter 0–' + field.max + ' with at most two decimal places.';
  if (!['active', 'suspended'].includes(draft.status))
    errors.status = 'Choose Active or Suspended.';
  for (const [key, max] of [
    ['latitude', 90],
    ['longitude', 180],
  ] as const) {
    if (
      draft[key] !== '' &&
      (!/^-?\d+(\.\d{1,6})?$/.test(draft[key]) || Math.abs(Number(draft[key])) > max)
    )
      errors[key] =
        'Enter a value from -' + max + ' to ' + max + ', with at most six decimal places.';
  }
  if ((draft.latitude === '') !== (draft.longitude === ''))
    errors.latitude = 'Provide both coordinates or leave both blank.';
  return errors;
}
export function eventInput(draft: EventDraft): EventInput {
  return {
    ...draft,
    name: draft.name.trim(),
    location: draft.location.trim(),
    purpose: draft.purpose.trim(),
    short_description: draft.short_description.trim(),
    full_description: draft.full_description.trim(),
    organisation_id: Number(draft.organisation_id),
    category_id: Number(draft.category_id),
    status: draft.status as EventInput['status'],
    latitude: draft.latitude === '' ? null : Number(draft.latitude),
    longitude: draft.longitude === '' ? null : Number(draft.longitude),
  };
}
