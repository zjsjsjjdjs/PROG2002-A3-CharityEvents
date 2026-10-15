import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConnectionPage } from './connection-page';
describe('service connection feedback', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('requires a click, blocks duplicate checks and allows retry after an outage', async () => {
    const fixture = TestBed.createComponent(ConnectionPage);
    const http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    http.expectNone('/api/health');
    fixture.componentInstance.check();
    fixture.componentInstance.check();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    http.expectOne('/api/health').flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'unavailable',
    );
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
    fixture.componentInstance.check();
    http.expectOne('/api/health').flush({ status: 'ok', database: 'connected' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('service and database are connected');
  });
  it('rejects an invalid response', () => {
    const fixture = TestBed.createComponent(ConnectionPage);
    fixture.componentInstance.check();
    TestBed.inject(HttpTestingController).expectOne('/api/health').flush(null);
    expect(fixture.componentInstance.state()).toBe('error');
  });
  it('cancels an in-flight check on navigation away', () => {
    const fixture = TestBed.createComponent(ConnectionPage);
    fixture.componentInstance.check();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/health');
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });
});
