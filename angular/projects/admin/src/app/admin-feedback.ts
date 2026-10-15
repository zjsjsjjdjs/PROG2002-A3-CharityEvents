import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class AdminFeedback {
  readonly notice = signal('');
}
export function requestError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Cannot reach the service. Check your connection and try again.';
    if (error.status === 401)
      return 'Administrator sign-in is required. Sign in on the application domain, then retry.';
    if (error.status === 403)
      return 'Access was refused. Open management on the configured application domain.';
    if (error.status === 404) return 'This event could not be found. Return to All events.';
    if (error.status >= 500) return 'The service is unavailable. Please try again shortly.';
    if (typeof error.error?.message === 'string') return error.error.message;
  }
  return 'The request could not be completed. Please try again.';
}
