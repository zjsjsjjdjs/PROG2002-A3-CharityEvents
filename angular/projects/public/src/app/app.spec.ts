import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { HomePage } from './home';
import { SearchPage } from './search';
import { DetailPage } from './detail';
import { EventDetail } from '@charity/shared';

const event: EventDetail = {
  event_id: 5,
  name: '<img src=x onerror=alert(1)> Community day',
  event_datetime: '2026-11-02T14:00:00+10:00',
  location: 'Brisbane & coast',
  purpose: 'Community care',
  short_description: 'Join your community.',
  full_description: 'First line.\nSecond line.',
  ticket_price: '12.50',
  fundraising_goal: '1000.00',
  current_progress: '250.00',
  status: 'active',
  category_id: 2,
  category_name: 'Workshop',
  organisation_id: 1,
  organisation_name: 'Harbour Hope',
  organisation_mission: 'Community care',
  contact_email: 'contact@example.test',
  contact_phone: '0255501200',
  website_url: null,
  latitude: null,
  longitude: null,
  registrations: [
    {
      registration_id: 1,
      event_id: 5,
      name: 'Older guest',
      tickets: 1,
      registered_at: '2026-10-01T00:00:00Z',
    },
    {
      registration_id: 2,
      event_id: 5,
      name: 'Newer guest',
      tickets: 2,
      registered_at: '2026-10-02T00:00:00Z',
    },
  ],
};
describe('public browsing routes', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('shows the home empty state and recovers from a failed refresh', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/', HomePage);
    http.expectOne('/api/events/upcoming').flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No upcoming events yet');
    page.refresh.next();
    http.expectOne('/api/events/upcoming').flush({}, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('could not be loaded');
    page.refresh.next();
    http.expectOne('/api/events/upcoming').flush([event]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Community day');
    expect(harness.routeNativeElement?.querySelector('img')).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('2:00 pm');
  });
  it('restores URL filters, preserves them in detail links and clears all filters', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl(
      '/search?location=Brisbane%20%26%20coast&categoryId=2',
      SearchPage,
    );
    http
      .expectOne('/api/categories')
      .flush([{ category_id: 2, name: 'Workshop', description: null }]);
    const req = http.expectOne((r) => r.url === '/api/events/search');
    expect(req.request.params.get('location')).toBe('Brisbane & coast');
    expect(req.request.params.get('categoryId')).toBe('2');
    req.flush([event]);
    harness.detectChanges();
    expect(page.form.controls.location.value).toBe('Brisbane & coast');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toContain(
      'categoryId=2',
    );
    page.clear();
    await harness.fixture.whenStable();
    http.expectOne('/api/events/search').flush([]);
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/search');
    expect(harness.routeNativeElement?.textContent).toContain('No matching events');
  });
  it('cancels stale searches when query parameters change', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/search?location=Old');
    http.expectOne('/api/categories').flush([]);
    const old = http.expectOne('/api/events/search?location=Old');
    await harness.navigateByUrl('/search?location=New');
    expect(old.cancelled).toBe(true);
    http.expectOne('/api/events/search?location=New').flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No matching events');
  });
  it('rejects duplicate or impossible date filters without sending a search request', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/search?date=2026-02-30');
    http.expectOne('/api/categories').flush([]);
    http.expectNone((r) => r.url === '/api/events/search');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('valid calendar date');
    await harness.navigateByUrl('/search?categoryId=1&categoryId=2');
    http.expectNone((r) => r.url === '/api/events/search');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('only one value');
  });
  it('keeps search available if category loading fails and retries categories independently', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/search', SearchPage);
    http.expectOne('/api/categories').flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectOne('/api/events/search').flush([event]);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Categories could not be loaded');
    expect(harness.routeNativeElement?.textContent).toContain('1 event found');
    page.categoryRefresh.next();
    http.expectOne('/api/categories').flush([]);
    http.expectNone('/api/events/search');
  });
  it('renders newest attendees first, Brisbane time and a working registration URL', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/events/5?categoryId=2');
    http.expectOne('/api/events/5').flush(event);
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    expect(root.textContent).toContain('2:00 pm');
    expect(root.querySelector('.attendee-list li')?.textContent).toContain('Newer guest');
    expect(root.querySelector('.booking-panel a')?.getAttribute('href')).toBe(
      '/register.html?id=5',
    );
    expect(root.querySelector('.back-link')?.getAttribute('href')).toBe('/search?categoryId=2');
    expect(root.querySelector('img')).toBeNull();
  });
  it('supports legacy registration return links and removes stale details when next event is unavailable', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/detail.html?id=5');
    http.expectOne('/api/events/5').flush(event);
    harness.detectChanges();
    await harness.navigateByUrl('/detail.html?id=6');
    http.expectOne('/api/events/6').flush({}, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('removed or suspended');
    expect(harness.routeNativeElement?.querySelector('.booking-panel')).toBeNull();
  });
  it('rejects invalid detail IDs, including duplicate legacy parameters', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of ['/events/0', '/events/nope', '/detail.html?id=3&id=4']) {
      await harness.navigateByUrl(url, DetailPage);
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('No valid event');
    }
    http.expectNone((r) => r.url.startsWith('/api/events/'));
  });
  it('keeps the connection page and unknown-route recovery available', async () => {
    const harness = await RouterTestingHarness.create('/connection');
    expect(harness.routeNativeElement?.querySelector('button')?.textContent).toContain(
      'Check connection',
    );
    await harness.navigateByUrl('/missing-page');
    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
