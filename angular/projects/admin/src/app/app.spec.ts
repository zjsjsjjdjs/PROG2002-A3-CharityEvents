import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('admin routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  it('opens the home page, a direct connection route and a recoverable unknown route', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Development preview');
    await harness.navigateByUrl('/connection');
    expect(harness.routeNativeElement?.querySelector('button')?.textContent).toContain(
      'Check connection',
    );
    await harness.navigateByUrl('/missing-page');
    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
    expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
