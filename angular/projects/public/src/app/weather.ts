import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, defer, map, Observable, of, startWith, timeout } from 'rxjs';
import { EventDetail } from '@charity/shared';

export const WEATHER_NOW = new InjectionToken<() => Date>('weather clock', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
export type WeatherEvent = Pick<EventDetail, 'latitude' | 'longitude' | 'event_datetime'>;
export type WeatherState =
  | { status: 'loading' }
  | { status: 'unavailable' | 'error'; message: string }
  | { status: 'ready'; date: string; condition: string; low: number; high: number };

/**
 * Convert an instant into a Brisbane calendar date, independent of the browser timezone.
 * @param date - Valid JavaScript Date to format.
 * @returns Calendar date in YYYY-MM-DD form.
 */
export function brisbaneDay(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return ['year', 'month', 'day'].map((key) => parts.find((p) => p.type === key)!.value).join('-');
}
function coordinate(value: unknown, limit: number): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}
const conditions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
/**
 * Validate Open-Meteo daily arrays and extract the requested event-day forecast.
 * @param body - Untrusted JSON response from the weather provider.
 * @param date - Brisbane date key in YYYY-MM-DD form.
 * @returns Ready weather or an unavailable state when the requested day is absent.
 * @throws Error when response arrays, Celsius units or selected values are invalid.
 */
export function readForecast(body: unknown, date: string): WeatherState {
  const response = record(body),
    daily = record(response['daily']);
  const units = record(response['daily_units']);
  const dates = daily['time'],
    codes = daily['weather_code'];
  const lows = daily['temperature_2m_min'],
    highs = daily['temperature_2m_max'];
  if (
    !Array.isArray(dates) ||
    !Array.isArray(codes) ||
    !Array.isArray(lows) ||
    !Array.isArray(highs) ||
    units['temperature_2m_min'] !== '°C' ||
    units['temperature_2m_max'] !== '°C'
  )
    throw new Error('Invalid forecast');
  const index = dates.indexOf(date);
  if (index < 0)
    return {
      status: 'unavailable',
      message:
        'The provider has no forecast for this event date yet. Please check again closer to the event.',
    };
  const low: unknown = lows[index],
    high: unknown = highs[index],
    code: unknown = codes[index];
  if (
    typeof low !== 'number' ||
    !Number.isFinite(low) ||
    typeof high !== 'number' ||
    !Number.isFinite(high) ||
    low > high ||
    typeof code !== 'number' ||
    !Number.isInteger(code)
  ) {
    throw new Error('Incomplete forecast');
  }
  return {
    status: 'ready',
    date,
    low,
    high,
    condition: conditions[code] ?? 'Weather condition unavailable',
  };
}
@Injectable({ providedIn: 'root' })
export class EventWeatherApi {
  private readonly http = inject(HttpClient);
  private readonly now = inject(WEATHER_NOW);
  /**
   * Load weather only for valid coordinates and dates from today through the next 15 Brisbane days.
   * @param event - Event coordinates and an ISO timestamp with an explicit timezone.
   * @returns Lazy stream of loading/ready/unavailable/error states; timeout or network failure becomes a UI error after at most 10 seconds.
   */
  load(event: WeatherEvent): Observable<WeatherState> {
    return defer(() => {
      const latitude = coordinate(event.latitude, 90),
        longitude = coordinate(event.longitude, 180);
      if (latitude === null || longitude === null)
        return of<WeatherState>({
          status: 'unavailable',
          message: 'Weather is unavailable because this event has no valid map coordinates.',
        });
      const timestamp = new Date(event.event_datetime);
      if (
        !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(event.event_datetime) ||
        !Number.isFinite(timestamp.getTime())
      )
        return of<WeatherState>({
          status: 'unavailable',
          message: 'Weather is unavailable because the event date could not be read.',
        });
      const date = brisbaneDay(timestamp),
        today = brisbaneDay(this.now());
      const days = (Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000;
      if (days < 0)
        return of<WeatherState>({
          status: 'unavailable',
          message: 'This event date has passed. A forecast is no longer available here.',
        });
      if (days > 15)
        return of<WeatherState>({
          status: 'unavailable',
          message:
            'Forecasts cover today and the next 15 days. Please check again closer to this event.',
        });
      return this.http
        .get<unknown>('https://api.open-meteo.com/v1/forecast', {
          params: {
            latitude,
            longitude,
            daily: 'weather_code,temperature_2m_max,temperature_2m_min',
            timezone: 'Australia/Brisbane',
            temperature_unit: 'celsius',
            forecast_days: 16,
          },
        })
        .pipe(
          timeout(10000),
          map((body) => readForecast(body, date)),
          catchError((error: unknown) =>
            of<WeatherState>({
              status: 'error',
              message:
                error instanceof HttpErrorResponse && error.status === 429
                  ? 'The weather service is busy. Please wait a moment before trying again.'
                  : 'Weather could not be loaded. You can still view this event and register. Please try again.',
            }),
          ),
          startWith<WeatherState>({ status: 'loading' }),
        );
    });
  }
}
