import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import {
  brisbaneDay,
  EventWeatherApi,
  readForecast,
  WEATHER_NOW,
  WeatherEvent,
  WeatherState,
} from './weather';
import { EventWeather } from './event-weather';
const event: WeatherEvent = {
  latitude: '-27.47',
  longitude: '153.03',
  event_datetime: '2026-10-16T14:00:00+10:00',
};
const response = () => ({
  daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C' },
  daily: {
    time: ['2026-10-15', '2026-10-16'],
    weather_code: [0, 63],
    temperature_2m_min: [17, 18.5],
    temperature_2m_max: [26, 28.2],
  },
});
const url = 'https://api.open-meteo.com/v1/forecast';
describe('event-day weather', () => {
  let http: HttpTestingController, api: EventWeatherApi;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WEATHER_NOW, useValue: () => new Date('2026-10-14T14:30:00Z') },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(EventWeatherApi);
  });
  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });
  it('requests Celsius/Brisbane and selects the event date, not today', () => {
    let state: WeatherState | undefined;
    api.load(event).subscribe((value) => (state = value));
    expect(state).toEqual({ status: 'loading' });
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('latitude')).toBe('-27.47');
    expect(req.request.params.get('timezone')).toBe('Australia/Brisbane');
    expect(req.request.params.get('forecast_days')).toBe('16');
    expect(req.request.params.get('temperature_unit')).toBe('celsius');
    req.flush(response());
    expect(state).toEqual({
      status: 'ready',
      date: '2026-10-16',
      condition: 'Moderate rain',
      low: 18.5,
      high: 28.2,
    });
  });
  it('uses the Brisbane calendar day at a UTC day boundary', () => {
    expect(brisbaneDay(new Date('2026-10-14T14:30:00Z'))).toBe('2026-10-15');
    api.load({ ...event, event_datetime: '2026-10-14T14:30:00Z' }).subscribe((state) => {
      if (state.status === 'ready') expect(state.date).toBe('2026-10-15');
    });
    http.expectOne((r) => r.url === url).flush(response());
  });
  it.each([null, '', ' ', 'NaN', 'Infinity', '91'])(
    'makes no request with invalid latitude %s',
    (latitude) => {
      api.load({ ...event, latitude }).subscribe((s) => expect(s.status).toBe('unavailable'));
      http.expectNone((r) => r.url === url);
    },
  );
  it('rejects incomplete/out-of-range longitude and accepts zero coordinates', () => {
    for (const longitude of [null, '181', '-181'])
      api.load({ ...event, longitude }).subscribe((s) => expect(s.status).toBe('unavailable'));
    http.expectNone((r) => r.url === url);
    api.load({ ...event, latitude: 0, longitude: 0 }).subscribe();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('longitude')).toBe('0');
    req.flush(response());
  });
  it.each(['2026-10-14T14:00:00+10:00', '2026-10-31T14:00:00+10:00', 'invalid', '2026-10-16'])(
    'skips unavailable dates %s',
    (event_datetime) => {
      api.load({ ...event, event_datetime }).subscribe((s) => expect(s.status).toBe('unavailable'));
      http.expectNone((r) => r.url === url);
    },
  );
  it('allows the final forecast day (today plus 15), even if provider omits it', () => {
    api.load({ ...event, event_datetime: '2026-10-30T14:00:00+10:00' }).subscribe((s) => {
      if (s.status !== 'loading') expect(s.status).toBe('unavailable');
    });
    http.expectOne((r) => r.url === url).flush(response());
  });
  it('never coerces missing temperatures to zero or displays inverted ranges', () => {
    for (const low of [null, '18', 40]) {
      const body = response();
      (body.daily.temperature_2m_min as unknown[])[1] = low;
      expect(() => readForecast(body, '2026-10-16')).toThrow();
    }
    expect(() => readForecast({}, '2026-10-16')).toThrow();
    const body = response();
    body.daily_units.temperature_2m_min = '°F';
    expect(() => readForecast(body, '2026-10-16')).toThrow();
  });
  it('retains valid temperatures with an unknown condition and maps WMO overcast correctly', () => {
    const body = response();
    body.daily.weather_code[1] = 999;
    expect(readForecast(body, '2026-10-16')).toMatchObject({
      condition: 'Weather condition unavailable',
      low: 18.5,
    });
    body.daily.weather_code[1] = 3;
    expect(readForecast(body, '2026-10-16')).toMatchObject({ condition: 'Overcast' });
  });
  it.each([0, 429, 503])(
    'handles provider/network status %s without automatic retries',
    (status) => {
      let state: WeatherState | undefined;
      api.load(event).subscribe((s) => (state = s));
      const req = http.expectOne((r) => r.url === url);
      if (status === 0) req.error(new ProgressEvent('error'));
      else req.flush({}, { status, statusText: 'Unavailable' });
      expect(state).toMatchObject({ status: 'error' });
      http.expectNone((r) => r.url === url);
    },
  );
  it('times out after ten seconds and cancels the request', async () => {
    vi.useFakeTimers();
    let state: WeatherState | undefined;
    api.load(event).subscribe((s) => (state = s));
    const req = http.expectOne((r) => r.url === url);
    await vi.advanceTimersByTimeAsync(10001);
    expect(req.cancelled).toBe(true);
    expect(state).toMatchObject({ status: 'error' });
  });
  it('recovers on manual retry and clears/cancels stale forecasts when the event changes', () => {
    const fixture = TestBed.createComponent(EventWeather);
    fixture.componentRef.setInput('event', event);
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne((r) => r.url === url).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Retry weather');
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading');
    http.expectOne((r) => r.url === url).flush(response());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Moderate rain');
    expect(fixture.nativeElement.textContent).toContain('16 Oct 2026');
    fixture.componentRef.setInput('event', { ...event, longitude: 154 });
    fixture.detectChanges();
    TestBed.tick();
    const old = http.expectOne((r) => r.url === url);
    expect(fixture.nativeElement.textContent).not.toContain('Moderate rain');
    fixture.componentRef.setInput('event', { ...event, latitude: null });
    fixture.detectChanges();
    TestBed.tick();
    expect(old.cancelled).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no valid map coordinates');
  });
});
