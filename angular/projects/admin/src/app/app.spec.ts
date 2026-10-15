import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { EventListPage } from './event-list';
import { EventFormPage } from './event-form';
import { blankDraft, validateDraft } from './event-fields';

const valid = {
  ...blankDraft(),
  organisation_id: '1',
  category_id: '2',
  name: 'Community day',
  location: 'Brisbane',
  purpose: 'Food relief',
  short_description: 'Join us',
  full_description: 'Community fundraiser',
  event_datetime: '2030-11-02T14:30:05',
  ticket_price: '12.50',
  fundraising_goal: '1000.00',
};
const rows = [
  {
    event_id: 1,
    name: 'Community day',
    location: 'Brisbane',
    category_name: 'Gala',
    event_datetime: '2030-11-02T14:30:05+10:00',
    ticket_price: '12.50',
    status: 'active',
    display_status: 'Active',
    registration_count: 1,
  },
  {
    event_id: 2,
    name: 'Past auction',
    location: 'City Hall',
    category_name: 'Auction',
    event_datetime: '2020-01-01T14:00:00+10:00',
    ticket_price: '0.00',
    status: 'active',
    display_status: 'Past',
    registration_count: 0,
  },
  {
    event_id: 3,
    name: 'Paused run',
    location: 'Park',
    category_name: 'Run',
    event_datetime: '2030-11-02T14:30:00+10:00',
    ticket_price: '5.00',
    status: 'suspended',
    display_status: 'Suspended',
    registration_count: 2,
  },
];
const detail = {
  ...valid,
  organisation_id: 1,
  category_id: 2,
  event_id: 1,
  event_datetime: '2030-11-02T14:30:05+10:00',
  latitude: null,
  longitude: null,
  registrations: [
    {
      registration_id: 8,
      event_id: 1,
      name: 'Guest',
      tickets: 2,
      registered_at: '2026-10-01T09:00:00+10:00',
    },
  ],
};
describe('admin pages', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function options() {
    http.expectOne('/api/categories').flush([{ category_id: 2, name: 'Gala' }]);
    http
      .expectOne('/api/admin/organisations')
      .flush([{ organisation_id: 1, name: 'Harbour Hope' }]);
  }
  it('redirects home to the real event list and supports connection and unknown routes', async () => {
    const h = await RouterTestingHarness.create('/');
    http.expectOne('/api/admin/events').flush(rows);
    h.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/events');
    expect(h.routeNativeElement?.textContent).toContain('Community day');
    await h.navigateByUrl('/connection');
    expect(h.routeNativeElement?.textContent).toContain('Check connection');
    await h.navigateByUrl('/missing');
    expect(h.routeNativeElement?.textContent).toContain('Page not found');
  });
  it('filters all statuses and text, then clears both filters', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events', EventListPage);
    http.expectOne('/api/admin/events').flush(rows);
    expect(page.visible().length).toBe(3);
    page.status.set('Suspended');
    expect(page.visible()[0].event_id).toBe(3);
    page.query.set('unknown');
    expect(page.visible()).toEqual([]);
    page.clear();
    page.query.set('  CITY HALL  ');
    expect(page.visible()[0].event_id).toBe(2);
    page.clear();
    expect(page.visible().length).toBe(3);
  });
  it('does not resurrect stale rows when refresh fails and filters change', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events', EventListPage);
    http.expectOne('/api/admin/events').flush(rows);
    page.load();
    http.expectOne('/api/admin/events').flush({}, { status: 500, statusText: 'Error' });
    page.status.set('Active');
    h.detectChanges();
    expect(page.visible()).toEqual([]);
    expect(h.routeNativeElement?.textContent).toContain('unavailable');
    expect(h.routeNativeElement?.querySelector('table')).toBeNull();
    page.load();
    http.expectOne('/api/admin/events').flush([]);
    expect(page.error()).toBe('');
  });
  it('shows administrator authorization errors without displaying data', async () => {
    const h = await RouterTestingHarness.create('/events');
    http.expectOne('/api/admin/events').flush({}, { status: 401, statusText: 'Unauthorized' });
    h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('sign-in is required');
  });
  it('blocks invalid create input, posts valid input once and returns to a refreshed list', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/new', EventFormPage);
    options();
    page.save();
    http.expectNone('/api/admin/events');
    expect(page.errors().name).toBeTruthy();
    page.form.setValue(valid);
    page.save();
    page.save();
    const req = http.expectOne('/api/admin/events');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.event_datetime).toBe(valid.event_datetime);
    expect(req.request.body.latitude).toBeNull();
    req.flush({ event_id: 9, message: 'Created' });
    await h.fixture.whenStable();
    http.expectOne('/api/admin/events').flush(rows);
    h.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/events');
    expect(h.routeNativeElement?.textContent).toContain('Event #9 created.');
  });
  it('loads edit values without shifting Brisbane time and excludes registrations from PUT', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/1/edit', EventFormPage);
    options();
    http.expectOne('/api/admin/events/1').flush(detail);
    h.detectChanges();
    expect(page.form.controls.event_datetime.value).toBe(valid.event_datetime);
    expect(h.routeNativeElement?.textContent).toContain('Guest');
    page.save();
    const req = http.expectOne('/api/admin/events/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.registrations).toBeUndefined();
    req.flush(
      { message: 'Please check location', fields: { location: 'Location is required.' } },
      { status: 400, statusText: 'Bad Request' },
    );
    h.detectChanges();
    expect(page.form.controls.name.value).toBe(valid.name);
    expect(page.saving()).toBe(false);
    expect(page.errors().location).toBe('Location is required.');
    expect(page.registrations().length).toBe(1);
  });
  it('reloads when navigating between edit ids using the same component', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/events/1/edit', EventFormPage);
    options();
    http.expectOne('/api/admin/events/1').flush(detail);
    const page = await h.navigateByUrl('/events/2/edit', EventFormPage);
    options();
    http.expectOne('/api/admin/events/2').flush({ ...detail, event_id: 2, name: 'Second event' });
    expect(page.form.controls.name.value).toBe('Second event');
  });
  it('rejects malformed edit IDs without making API requests', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/no/edit', EventFormPage);
    expect(page.ready()).toBe(false);
    expect(page.error()).toContain('Invalid event ID');
    http.expectNone('/api/categories');
  });
  it('blocks missing events and allows a failed load to retry', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/1/edit', EventFormPage);
    options();
    http.expectOne('/api/admin/events/1').flush({}, { status: 404, statusText: 'Not Found' });
    expect(page.ready()).toBe(false);
    expect(page.error()).toContain('not be found');
    page.load();
    options();
    http.expectOne('/api/admin/events/1').flush(detail);
    expect(page.ready()).toBe(true);
  });
  it('does not allow saving without categories', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/new', EventFormPage);
    http.expectOne('/api/categories').flush([]);
    http
      .expectOne('/api/admin/organisations')
      .flush([{ organisation_id: 1, name: 'Harbour Hope' }]);
    expect(page.ready()).toBe(false);
    page.save();
    http.expectNone('/api/admin/events');
  });
});
describe('event validation boundaries', () => {
  it('accepts free tickets and a past calendar date', () => {
    expect(
      validateDraft({ ...valid, ticket_price: '0', event_datetime: '2020-02-29T10:00' }),
    ).toEqual({});
  });
  it('rejects impossible dates and excessive monetary precision', () => {
    const errors = validateDraft({
      ...valid,
      event_datetime: '2030-02-29T10:00',
      ticket_price: '1.234',
      fundraising_goal: '-1',
    });
    expect(errors.event_datetime).toBeTruthy();
    expect(errors.ticket_price).toBeTruthy();
    expect(errors.fundraising_goal).toBeTruthy();
  });
  it('rejects a single coordinate and validates boundaries including zero', () => {
    expect(validateDraft({ ...valid, latitude: '0' }).latitude).toBeTruthy();
    expect(validateDraft({ ...valid, latitude: '90', longitude: '-180' })).toEqual({});
    expect(validateDraft({ ...valid, latitude: '91', longitude: '180' }).latitude).toBeTruthy();
    expect(validateDraft({ ...valid, latitude: '0', longitude: '0' })).toEqual({});
  });
  it('rejects whitespace and overlong text', () => {
    expect(validateDraft({ ...valid, name: '   ' }).name).toBeTruthy();
    expect(validateDraft({ ...valid, name: 'x'.repeat(151) }).name).toBeTruthy();
  });
});
