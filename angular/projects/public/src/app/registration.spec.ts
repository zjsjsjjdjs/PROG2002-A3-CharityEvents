import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { RegistrationPage } from './registration';
import { emailValidator, nameValidator, ticketsValidator } from './registration-validation';
const event = {
  event_id: 5,
  name: 'Community day',
  event_datetime: '2026-11-02T14:00:00+10:00',
  location: 'Brisbane',
  ticket_price: '12.50',
  short_description: 'Join us.',
  registrations: [],
};
const receipt = {
  registration_id: 20,
  event_id: 5,
  name: 'Guest',
  email: 'guest@example.com',
  tickets: 2,
  registered_at: '2026-10-15T00:00:00Z',
};

describe('registration validation matches server rules', () => {
  it('counts Unicode name characters and rejects blank/control characters', () => {
    expect(nameValidator(new FormControl('🙂'.repeat(120)))).toBeNull();
    for (const value of [' ', 'a'.repeat(121), 'Guest\u0001'])
      expect(nameValidator(new FormControl(value))).not.toBeNull();
  });
  it('rejects malformed emails accepted by loose checks and accepts normalised addresses', () => {
    expect(emailValidator(new FormControl('  Guest+Tickets@Example.COM  '))).toBeNull();
    for (const value of [
      'a@localhost',
      '.a@example.com',
      'a..b@example.com',
      'a@-bad.com',
      'a b@example.com',
      'a'.repeat(65) + '@example.com',
    ])
      expect(emailValidator(new FormControl(value))).not.toBeNull();
  });
  it('accepts only bounded whole-ticket quantities', () => {
    for (const value of ['', '0', '-1', '1.5', '1e2', '2147483648'])
      expect(ticketsValidator(new FormControl(value))).not.toBeNull();
    for (const value of ['1', ' 2 ', '2147483647'])
      expect(ticketsValidator(new FormControl(value))).toBeNull();
  });
});
describe('Angular registration workflow', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function open() {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/events/5/register?categoryId=2', RegistrationPage);
    http.expectOne('/api/events/5').flush(event);
    harness.detectChanges();
    return { harness, page };
  }
  function fill(page: RegistrationPage) {
    page.form.setValue({ name: ' Guest ', email: ' Guest@Example.COM ', tickets: '2' });
  }
  it('rejects missing/invalid/duplicate IDs without loading or submitting', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of ['/events/0/register', '/register.html', '/register.html?id=3&id=4']) {
      const page = await harness.navigateByUrl(url, RegistrationPage);
      page.submit();
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('No valid event');
      expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
    }
    http.expectNone((r) => r.url.startsWith('/api/events/'));
  });
  it('keeps form hidden for unavailable events and supports a failed-load retry', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/events/5/register', RegistrationPage);
    http.expectOne('/api/events/5').flush({}, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('unavailable for registration');
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
    page.refresh.next();
    http.expectOne('/api/events/5').flush(event);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('form')).not.toBeNull();
  });
  it('shows field errors, focuses the first invalid field and sends no invalid registration', async () => {
    const { harness, page } = await open();
    page.form.setValue({ name: ' ', email: 'bad', tickets: '0' });
    page.submit();
    harness.detectChanges();
    expect(page.form.controls.name.touched).toBe(true);
    expect(harness.routeNativeElement?.querySelector('[aria-invalid="true"]')).not.toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('highlighted fields');
    http.expectNone((r) => r.method === 'POST');
  });
  it('normalises input, computes ticket total, prevents duplicate clicks and confirms once', async () => {
    const { harness, page } = await open();
    fill(page);
    harness.detectChanges();
    expect(page.total()).toBe(25);
    page.submit();
    page.submit();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('fieldset')?.disabled).toBe(true);
    const req = http.expectOne('/api/events/5/registrations');
    expect(req.request.body).toEqual({ name: 'Guest', email: 'guest@example.com', tickets: 2 });
    req.flush({ message: 'Registration successful.', registration: receipt });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Registration confirmed');
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('.primary-link')?.getAttribute('href')).toBe(
      '/events/5?categoryId=2',
    );
    page.submit();
    http.expectNone((r) => r.method === 'POST');
  });
  it('retains input on duplicate-email conflict and allows correction', async () => {
    const { harness, page } = await open();
    fill(page);
    page.submit();
    http
      .expectOne('/api/events/5/registrations')
      .flush({ code: 'DUPLICATE_REGISTRATION' }, { status: 409, statusText: 'Conflict' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('already registered');
    expect(page.form.getRawValue()).toEqual({
      name: 'Guest',
      email: 'guest@example.com',
      tickets: '2',
    });
    expect(page.form.enabled).toBe(true);
    expect(page.pending()).toBe(false);
    page.form.controls.email.setValue('another@example.com');
    page.submit();
    expect(http.expectOne('/api/events/5/registrations').request.body.email).toBe(
      'another@example.com',
    );
  });
  it('keeps values and avoids automatic retry after an uncertain network failure', async () => {
    const { harness, page } = await open();
    fill(page);
    page.submit();
    http.expectOne('/api/events/5/registrations').error(new ProgressEvent('error'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain(
      'Check the event details for your name',
    );
    expect(page.form.controls.name.value).toBe('Guest');
    expect(page.receipt()).toBeNull();
    http.expectNone((r) => r.method === 'POST');
  });
  it('blocks further submission if the event is suspended during registration', async () => {
    const { harness, page } = await open();
    fill(page);
    page.submit();
    http
      .expectOne('/api/events/5/registrations')
      .flush({}, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(page.blocked()).toBe(true);
    expect(harness.routeNativeElement?.querySelector('fieldset')?.disabled).toBe(true);
    page.submit();
    http.expectNone((r) => r.method === 'POST');
  });
  it('does not claim success when the API response cannot confirm this registration', async () => {
    const { page } = await open();
    fill(page);
    page.submit();
    http
      .expectOne('/api/events/5/registrations')
      .flush({ registration: { ...receipt, event_id: 99 } });
    expect(page.receipt()).toBeNull();
    expect(page.submitError()).toContain('could not be confirmed');
  });
  it('cancels obsolete submissions and resets personal input when changing events', async () => {
    const { harness, page } = await open();
    fill(page);
    page.submit();
    const pending = http.expectOne('/api/events/5/registrations');
    await harness.navigateByUrl('/events/6/register');
    expect(pending.cancelled).toBe(true);
    http.expectOne('/api/events/6').flush({ ...event, event_id: 6 });
    expect(page.form.getRawValue()).toEqual({ name: '', email: '', tickets: '1' });
    expect(page.receipt()).toBeNull();
    expect(page.pending()).toBe(false);
  });
  it('handles bookmarked legacy registration URLs in Angular', async () => {
    const harness = await RouterTestingHarness.create('/register.html?id=5');
    http.expectOne('/api/events/5').flush(event);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('form')).not.toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('Community day');
  });
});
