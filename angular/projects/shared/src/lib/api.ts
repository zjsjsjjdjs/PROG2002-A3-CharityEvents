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
  health() {
    return this.http.get<HealthStatus>(this.base + '/health');
  }
  categories() {
    return this.http.get<Category[]>(this.base + '/categories');
  }
  upcoming() {
    return this.http.get<EventSummary[]>(this.base + '/events/upcoming');
  }
  search(filters: EventSearch = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && String(value).trim() !== '')
        params = params.set(key, String(value).trim());
    }
    return this.http.get<EventSummary[]>(this.base + '/events/search', { params });
  }
  detail(eventId: number) {
    return this.http.get<EventDetail>(this.base + '/events/' + eventId);
  }
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
  events() {
    return this.http.get<AdminEventSummary[]>(this.base + '/events');
  }
  organisations() {
    return this.http.get<Organisation[]>(this.base + '/organisations');
  }
  detail(eventId: number) {
    return this.http.get<AdminEventDetail>(this.base + '/events/' + eventId);
  }
  create(input: EventInput) {
    return this.http.post<EventMutationResult>(this.base + '/events', input);
  }
  update(eventId: number, input: EventInput) {
    return this.http.put<EventMutationResult>(this.base + '/events/' + eventId, input);
  }
  delete(eventId: number) {
    return this.http.delete<EventMutationResult>(this.base + '/events/' + eventId);
  }
}
