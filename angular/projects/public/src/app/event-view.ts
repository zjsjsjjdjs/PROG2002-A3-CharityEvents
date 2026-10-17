import { Pipe, PipeTransform } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith, timeout } from 'rxjs';

export type LoadState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };
/**
 * Convert an HTTP stream into accessible loading, ready and error UI states.
 * @param request - Observable request; cancelled when the consuming subscription ends.
 * @param message - Fallback user-facing error message.
 * @param missing - Optional replacement message for HTTP 404.
 * @returns State stream with a 15-second request timeout and an initial loading state.
 */
export function loadState<T>(
  request: Observable<T>,
  message: string,
  missing?: string,
): Observable<LoadState<T>> {
  return request.pipe(
    timeout(15000),
    map((data) => ({ status: 'ready', data }) as LoadState<T>),
    catchError((error: HttpErrorResponse) =>
      of<LoadState<T>>({
        status: 'error',
        message: error.status === 404 && missing ? missing : message,
      }),
    ),
    startWith({ status: 'loading' } as LoadState<T>),
  );
}
@Pipe({ name: 'brisbaneDate' })
export class BrisbaneDatePipe implements PipeTransform {
  transform(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Brisbane',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
}
@Pipe({ name: 'aud' })
export class AudPipe implements PipeTransform {
  transform(value: string | number): string {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(
      Number(value),
    );
  }
}
/**
 * Calculate the fundraising progress bar value.
 * @param raised - Funds raised as a number or API decimal string.
 * @param goal - Fundraising target as a number or API decimal string.
 * @returns Percentage clamped to 0..100; zero for a non-positive goal.
 */
export function progressPercent(raised: string | number, goal: string | number): number {
  return Number(goal) > 0 ? Math.max(0, Math.min(100, (Number(raised) / Number(goal)) * 100)) : 0;
}

/** Match the original site's calendar-day labels in Brisbane, independent of the host timezone. */
export function eventTiming(value: string, now = new Date()): 'past' | 'upcoming' {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const key = (date: Date) => {
    const parts = formatter.formatToParts(date);
    return ['year', 'month', 'day']
      .map((type) => parts.find((part) => part.type === type)!.value)
      .join('-');
  };
  return key(new Date(value)) < key(now) ? 'past' : 'upcoming';
}
