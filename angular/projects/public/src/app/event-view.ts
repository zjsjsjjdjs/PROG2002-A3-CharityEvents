import { Pipe, PipeTransform } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith, timeout } from 'rxjs';

export type LoadState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string };
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
export function progressPercent(raised: string | number, goal: string | number): number {
  return Number(goal) > 0 ? Math.max(0, Math.min(100, (Number(raised) / Number(goal)) * 100)) : 0;
}
