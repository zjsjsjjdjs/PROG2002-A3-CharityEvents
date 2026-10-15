import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL, AdminEventsApi, PublicEventsApi } from './api';
import type { EventInput } from './models';
describe('existing API contracts', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('encodes search text and omits empty filters', () => {
    TestBed.inject(PublicEventsApi)
      .search({ location: '  Brisbane & coast  ', categoryId: 2, date: ' ' })
      .subscribe();
    const req = http.expectOne((r) => r.url === '/api/events/search');
    expect(req.request.params.get('location')).toBe('Brisbane & coast');
    expect(req.request.urlWithParams).toContain('Brisbane%20%26%20coast');
    expect(req.request.params.get('categoryId')).toBe('2');
    expect(req.request.params.has('date')).toBe(false);
    req.flush([]);
  });
  it('preserves duplicate-registration errors for the form', () => {
    const input = { name: 'Test Guest', email: 'guest@example.test', tickets: 2 };
    let failure: HttpErrorResponse | undefined;
    TestBed.inject(PublicEventsApi)
      .register(5, input)
      .subscribe({ error: (e) => (failure = e) });
    const req = http.expectOne('/api/events/5/registrations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ code: 'DUPLICATE_REGISTRATION' }, { status: 409, statusText: 'Conflict' });
    expect(failure?.status).toBe(409);
    expect(failure?.error.code).toBe('DUPLICATE_REGISTRATION');
  });
  it('uses an overridden prefix consistently without injecting credentials', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/DataServ/api/' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(PublicEventsApi).detail(5).subscribe();
    TestBed.inject(AdminEventsApi).events().subscribe();
    for (const url of ['/DataServ/api/events/5', '/DataServ/api/admin/events']) {
      const req = http.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });
  it('preserves admin authorization failures', () => {
    let failure: HttpErrorResponse | undefined;
    TestBed.inject(AdminEventsApi)
      .events()
      .subscribe({ error: (e) => (failure = e) });
    http
      .expectOne('/api/admin/events')
      .flush({ code: 'ADMIN_AUTH_REQUIRED' }, { status: 401, statusText: 'Unauthorized' });
    expect(failure?.status).toBe(401);
  });
  it('preserves wall time and decimal amounts on create and update', () => {
    const input: EventInput = {
      organisation_id: 1,
      category_id: 2,
      name: 'Community day',
      event_datetime: '2026-11-02T10:00:00',
      location: 'Brisbane',
      purpose: 'Community care',
      short_description: 'Join us.',
      full_description: 'A community fundraiser.',
      ticket_price: '12.50',
      fundraising_goal: '1000.00',
      current_progress: '0.00',
      status: 'active',
      latitude: null,
      longitude: null,
    };
    const api = TestBed.inject(AdminEventsApi);
    api.create(input).subscribe();
    api.update(5, input).subscribe();
    for (const [url, method] of [
      ['/api/admin/events', 'POST'],
      ['/api/admin/events/5', 'PUT'],
    ]) {
      const req = http.expectOne(url);
      expect(req.request.method).toBe(method);
      expect(req.request.body).toEqual(input);
      req.flush({ message: 'Saved.', event_id: 5 });
    }
  });
  it('preserves protected-delete conflicts', () => {
    let failure: HttpErrorResponse | undefined;
    TestBed.inject(AdminEventsApi)
      .delete(5)
      .subscribe({ error: (e) => (failure = e) });
    const req = http.expectOne('/api/admin/events/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({ code: 'EVENT_HAS_REGISTRATIONS' }, { status: 409, statusText: 'Conflict' });
    expect(failure?.error.code).toBe('EVENT_HAS_REGISTRATIONS');
  });
});
