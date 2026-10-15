/** Contracts for the existing Express API. MySQL DECIMAL values are serialized as strings. */
export type Decimal = string | number;
export type EventStatus = 'active' | 'suspended';
export interface Category {
  category_id: number;
  name: string;
  description: string | null;
}
export interface Organisation {
  organisation_id: number;
  name: string;
}
export interface EventSummary {
  event_id: number;
  name: string;
  event_datetime: string;
  location: string;
  purpose: string;
  short_description: string;
  ticket_price: Decimal;
  fundraising_goal: Decimal;
  current_progress: Decimal;
  status: EventStatus;
  category_id: number;
  category_name: string;
}
/** Both public and admin attendee lists intentionally omit email. */
export interface Attendee {
  registration_id: number;
  event_id: number;
  name: string;
  tickets: number;
  registered_at: string;
}
export interface EventDetail extends EventSummary {
  full_description: string;
  latitude: Decimal | null;
  longitude: Decimal | null;
  organisation_id: number;
  organisation_name: string;
  organisation_mission: string;
  contact_email: string;
  contact_phone: string;
  website_url: string | null;
  registrations: Attendee[];
}
export interface RegistrationInput {
  name: string;
  email: string;
  tickets: number;
}
export interface RegistrationReceipt extends Attendee {
  email: string;
}
export interface RegistrationResult {
  message: string;
  registration: RegistrationReceipt;
}
export interface EventSearch {
  date?: string;
  location?: string;
  categoryId?: number;
}
/** Admin list is a different projection from the public event summary. */
export interface AdminEventSummary {
  event_id: number;
  name: string;
  location: string;
  status: EventStatus;
  ticket_price: Decimal;
  event_datetime: string;
  category_name: string;
  display_status: 'Active' | 'Past' | 'Suspended';
  registration_count: number;
}
/** Writes use Brisbane local wall time without an offset, unlike response timestamps. */
export interface EventInput {
  organisation_id: number;
  category_id: number;
  name: string;
  event_datetime: string;
  location: string;
  purpose: string;
  short_description: string;
  full_description: string;
  ticket_price: Decimal;
  fundraising_goal: Decimal;
  current_progress: Decimal;
  status: EventStatus;
  latitude: Decimal | null;
  longitude: Decimal | null;
}
export interface AdminEventDetail extends EventInput {
  event_id: number;
  registrations: Attendee[];
}
export interface EventMutationResult {
  message: string;
  event_id: number;
}
export interface ApiError {
  code?: string;
  message: string;
  fields?: Record<string, string>;
}
export interface HealthStatus {
  status: 'ok';
  database: 'connected';
}
