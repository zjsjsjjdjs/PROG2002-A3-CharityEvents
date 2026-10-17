import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import type {
  AdminEventDetail,
  AdminEventSummary,
  Category,
  EventDetail,
  EventInput,
  EventMutationResult,
  EventSearch,
  EventSummary,
  HealthStatus,
  Organisation,
  RegistrationInput,
  RegistrationResult,
} from './models';

/** Override per application when a verified deployment uses a different API prefix. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => '/api' });

@Injectable({ providedIn: 'root' })
export class PublicEventsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL).replace(/\/+$/, '');
  /**
   * Read API/database health.
   * @returns Observable health response; failures propagate to the caller.
   */
  health() {
    return this.http.get<HealthStatus>(this.base + '/health');
  }
  /**
   * Read categories used by public search.
   * @returns Observable category list.
   */
  categories() {
    return this.http.get<Category[]>(this.base + '/categories');
  }
  /**
   * Read active upcoming events from the public API.
   * @returns Observable event summaries.
   */
  upcoming() {
    return this.http.get<EventSummary[]>(this.base + '/events/upcoming');
  }
  /**
   * Search public events with non-empty query parameters.
   * @param filters - Optional search criteria; blank values are omitted.
   * @returns Observable matching event summaries.
   */
  search(filters: EventSearch = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && String(value).trim() !== '')
        params = params.set(key, String(value).trim());
    }
    return this.http.get<EventSummary[]>(this.base + '/events/search', { params });
  }
  /**
   * Read public event details and the email-free attendee list.
   * @param eventId - Validated positive event identifier.
   * @returns Observable event detail; HTTP errors propagate.
   */
  detail(eventId: number) {
    return this.http.get<EventDetail>(this.base + '/events/' + eventId);
  }
  /**
   * Submit a registration; the server validates input, availability and uniqueness.
   * @param eventId - Selected event identifier.
   * @param input - Name, email and ticket count.
   * @returns Observable receipt; duplicate registration is reported by HTTP 409.
   */
  register(eventId: number, input: RegistrationInput) {
    return this.http.post<RegistrationResult>(
      this.base + '/events/' + eventId + '/registrations',
      input,
    );
  }
}

@Injectable({ providedIn: 'root' })
export class AdminEventsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL).replace(/\/+$/, '') + '/admin';
  /**
   * Read all management events with display status and registration counts.
   * @returns Observable summaries; authentication errors propagate.
   */
  events() {
    return this.http.get<AdminEventSummary[]>(this.base + '/events');
  }
  /**
   * Read available event organisations.
   * @returns Observable organisation list.
   */
  organisations() {
    return this.http.get<Organisation[]>(this.base + '/organisations');
  }
  /**
   * Read editable event fields and associated registrations.
   * @param eventId - Validated identifier.
   * @returns Observable management event detail.
   */
  detail(eventId: number) {
    return this.http.get<AdminEventDetail>(this.base + '/events/' + eventId);
  }
  /**
   * Create a validated event through the admin API.
   * @param input - Complete event input.
   * @returns Observable creation result.
   */
  create(input: EventInput) {
    return this.http.post<EventMutationResult>(this.base + '/events', input);
  }
  /**
   * Replace editable event fields while retaining registrations.
   * @param eventId - Target event identifier.
   * @param input - Complete event input.
   * @returns Observable mutation result.
   */
  update(eventId: number, input: EventInput) {
    return this.http.put<EventMutationResult>(this.base + '/events/' + eventId, input);
  }
  /**
   * Request deletion; existing registrations are protected by the server.
   * @param eventId - Target event identifier.
   * @returns Observable mutation result; HTTP 409 means deletion is blocked.
   */
  delete(eventId: number) {
    return this.http.delete<EventMutationResult>(this.base + '/events/' + eventId);
  }
}
