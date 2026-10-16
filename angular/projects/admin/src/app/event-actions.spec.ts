import { By } from '@angular/platform-browser';
import { EventListPage } from './event-list';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_BASE_URL } from '@charity/shared';
import { EventActions } from './event-actions';
import { EventRegistrationsPage } from './event-registrations';
import { routes } from './app.routes';

const event = { event_id: 12, name: 'Charity day', status: 'active', registration_count: 0 };
const attendee = {
  registration_id: 1,
  event_id: 12,
  name: 'Guest One',
  tickets: 2,
  registered_at: '2026-10-15T14:00:00+10:00',
};
const detail = {
  ...event,
  event_datetime: '2030-11-02T14:00:00+10:00',
  registrations: [attendee, { ...attendee, registration_id: 2, name: 'Guest Two', tickets: 3 }],
};
describe('management actions', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function setup(value = event) {
    const fixture = TestBed.createComponent(EventActions);
    fixture.componentRef.setInput('event', value);
    fixture.detectChanges();
    return fixture;
  }
  it('requires explicit confirmation and cancel issues no request', () => {
    const f = setup();
    const page = f.componentInstance;
    page.choose('delete');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Permanently delete');
    page.cancel();
    page.confirm();
    http.expectNone('/api/admin/events/12');
    expect(page.pending()).toBeNull();
  });
  it('PATCHes only status, honors API prefix and locks repeated confirmation', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/deployment/api/' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const page = setup().componentInstance;
    let refreshed = 0;
    page.changed.subscribe(() => refreshed++);
    page.choose('suspend');
    page.confirm();
    page.confirm();
    page.cancel();
    expect(page.busy()).toBe(true);
    const req = http.expectOne('/deployment/api/admin/events/12/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'suspended' });
    req.flush({ event_id: 12 });
    expect(refreshed).toBe(1);
    expect(page.pending()).toBeNull();
  });
  it('resumes a suspended event only after confirmation', () => {
    const page = setup({ ...event, status: 'suspended' }).componentInstance;
    page.choose('resume');
    http.expectNone('/api/admin/events/12/status');
    page.confirm();
    const req = http.expectOne('/api/admin/events/12/status');
    expect(req.request.body).toEqual({ status: 'active' });
    req.flush({ event_id: 12 });
  });
  it('blocks deletion when registrations are already known', () => {
    const f = setup({ ...event, registration_count: 2 });
    const page = f.componentInstance;
    page.choose('delete');
    page.confirm();
    http.expectNone('/api/admin/events/12');
    expect(f.nativeElement.textContent).toContain('deletion is blocked');
    expect(page.pending()).toBeNull();
  });
  it('keeps an event and locks deletion when server detects a new registration', () => {
    const page = setup().componentInstance;
    let changed = false;
    page.changed.subscribe(() => (changed = true));
    page.choose('delete');
    page.confirm();
    const req = http.expectOne('/api/admin/events/12');
    expect(req.request.method).toBe('DELETE');
    req.flush(
      { code: 'EVENT_HAS_REGISTRATIONS', message: 'Has registrations. Suspend instead.' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(page.protectedEvent()).toBe(true);
    expect(changed).toBe(false);
    expect(page.error()).toContain('Suspend instead');
    page.choose('delete');
    page.confirm();
    http.expectNone('/api/admin/events/12');
  });
  it('emits refresh only after successful deletion', () => {
    const page = setup().componentInstance;
    let changed = false;
    page.changed.subscribe(() => (changed = true));
    page.choose('delete');
    page.confirm();
    expect(changed).toBe(false);
    http.expectOne('/api/admin/events/12').flush({ event_id: 12 });
    expect(changed).toBe(true);
  });
  it('shows failure and requires a fresh confirmation to retry', () => {
    const page = setup().componentInstance;
    page.choose('suspend');
    page.confirm();
    http
      .expectOne('/api/admin/events/12/status')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(page.busy()).toBe(false);
    expect(page.error()).toContain('Refresh the list');
    page.confirm();
    http.expectNone('/api/admin/events/12/status');
    page.choose('suspend');
    page.confirm();
    http.expectOne('/api/admin/events/12/status').flush({ event_id: 12 });
  });
  it('locks actions while another row is being changed', () => {
    const f = setup();
    f.componentRef.setInput('locked', true);
    f.detectChanges();
    f.componentInstance.choose('suspend');
    expect(f.componentInstance.pending()).toBeNull();
    http.expectNone('/api/admin/events/12/status');
  });
  it('locks list filters and refresh until the action completes', async () => {
    const h = await RouterTestingHarness.create();
    const list = await h.navigateByUrl('/events', EventListPage);
    http
      .expectOne('/api/admin/events')
      .flush([
        {
          ...event,
          location: 'Brisbane',
          category_name: 'Run',
          event_datetime: '2030-11-02T14:00:00+10:00',
          ticket_price: 0,
          display_status: 'Active',
        },
      ]);
    h.detectChanges();
    const actions = h.routeDebugElement!.query(By.directive(EventActions))
      .componentInstance as EventActions;
    actions.choose('suspend');
    actions.confirm();
    h.detectChanges();
    await Promise.resolve();
    h.detectChanges();
    expect(list.mutating()).toBe(true);
    expect(h.routeNativeElement?.querySelector<HTMLSelectElement>('#status-filter')?.disabled).toBe(
      true,
    );
    list.load();
    http.expectNone('/api/admin/events');
    http.expectOne('/api/admin/events/12/status').flush({ event_id: 12 });
    http.expectOne('/api/admin/events').flush([]);
    h.detectChanges();
    expect(list.mutating()).toBe(false);
  });
  it('shows access denial without reporting success', () => {
    const page = setup().componentInstance;
    page.choose('suspend');
    page.confirm();
    http
      .expectOne('/api/admin/events/12/status')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(page.error()).toContain('Access was refused');
    expect(page.pending()).toBeNull();
  });
});
describe('registration list', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('loads names, counts tickets separately, filters and excludes email', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/12/registrations', EventRegistrationsPage);
    http.expectOne('/api/admin/events/12').flush(detail);
    h.detectChanges();
    expect(page.people().length).toBe(2);
    expect(page.tickets()).toBe(5);
    expect(h.routeNativeElement?.textContent).toContain('2 registrations · 5 tickets');
    page.query.set(' ONE ');
    expect(page.visible().length).toBe(1);
  });
  it('clears stale participants on refresh failure and retries with empty state', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/12/registrations', EventRegistrationsPage);
    http.expectOne('/api/admin/events/12').flush(detail);
    page.load();
    http.expectOne('/api/admin/events/12').flush({}, { status: 500, statusText: 'Error' });
    expect(page.people()).toEqual([]);
    expect(page.error()).toContain('unavailable');
    page.load();
    http.expectOne('/api/admin/events/12').flush({ ...detail, registrations: [] });
    h.detectChanges();
    expect(h.routeNativeElement?.textContent).toContain('No registrations yet.');
  });
  it('rejects invalid ids and shows missing events', async () => {
    const h = await RouterTestingHarness.create();
    const page = await h.navigateByUrl('/events/no/registrations', EventRegistrationsPage);
    expect(page.error()).toContain('Invalid event ID');
    http.expectNone('/api/admin/events/no');
    await h.navigateByUrl('/events/99/registrations');
    http.expectOne('/api/admin/events/99').flush({}, { status: 404, statusText: 'Not found' });
    expect(page.error()).toContain('not be found');
  });
  it('cancels the previous request when navigating to another event', async () => {
    const h = await RouterTestingHarness.create();
    await h.navigateByUrl('/events/12/registrations', EventRegistrationsPage);
    const previous = http.expectOne('/api/admin/events/12');
    const page = await h.navigateByUrl('/events/13/registrations', EventRegistrationsPage);
    expect(previous.cancelled).toBe(true);
    http
      .expectOne('/api/admin/events/13')
      .flush({ ...detail, event_id: 13, name: 'Second event', registrations: [] });
    expect(page.event()?.event_id).toBe(13);
  });
});
