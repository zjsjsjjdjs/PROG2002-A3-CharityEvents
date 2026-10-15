import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicEventsApi } from './api';
@Component({
  selector: 'hh-connection-page',
  template: `
    <section class="page-panel" aria-labelledby="connection-title">
      <p class="eyebrow">Service connection</p>
      <h1 id="connection-title">Check the connection</h1>
      <p>
        Check whether the event service can connect to its database. This check does not change any
        records.
      </p>
      <button type="button" (click)="check()" [disabled]="state() === 'loading'">
        {{ state() === 'loading' ? 'Checking…' : 'Check connection' }}
      </button>
      <p role="status" aria-live="polite" [class.error]="state() === 'error'">{{ message() }}</p>
    </section>
  `,
})
export class ConnectionPage {
  private readonly api = inject(PublicEventsApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly state = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal('Select Check connection to start.');
  check() {
    if (this.state() === 'loading') return;
    this.state.set('loading');
    this.message.set('Checking the event service…');
    this.api
      .health()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result?.status !== 'ok' || result?.database !== 'connected') {
            this.state.set('error');
            this.message.set('The event service returned an unexpected result. Try again.');
            return;
          }
          this.state.set('success');
          this.message.set('The event service and database are connected.');
        },
        error: () => {
          this.state.set('error');
          this.message.set(
            'The event service is unavailable. Check that the API and database are running, then try again.',
          );
        },
      });
  }
}
