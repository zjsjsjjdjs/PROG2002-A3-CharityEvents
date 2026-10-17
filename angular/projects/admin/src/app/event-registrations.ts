import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AdminEventsApi, type AdminEventDetail } from '@charity/shared';
import { requestError } from './admin-feedback';
/**
 * Per-event registration roster with name filtering and a ticket total; cancels stale requests when the event changes.
 */
@Component({
  selector: 'hh-event-registrations',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './event-registrations.html',
})
export class EventRegistrationsPage {
  private readonly api = inject(AdminEventsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private request?: Subscription;
  private id: number | null = null;
  readonly event = signal<AdminEventDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly query = signal('');
  readonly people = computed(() => this.event()?.registrations ?? []);
  readonly tickets = computed(() =>
    this.people().reduce((sum, person) => sum + Number(person.tickets), 0),
  );
  readonly visible = computed(() =>
    this.people().filter((person) =>
      person.name.toLowerCase().includes(this.query().trim().toLowerCase()),
    ),
  );
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const raw = params.get('id') ?? '';
      this.id =
        /^\d+$/.test(raw) &&
        Number.isSafeInteger(Number(raw)) &&
        Number(raw) > 0 &&
        Number(raw) <= 2147483647
          ? Number(raw)
          : null;
      this.query.set('');
      this.load();
    });
  }
  load() {
    this.request?.unsubscribe();
    this.event.set(null);
    this.error.set('');
    if (this.id === null) {
      this.loading.set(false);
      this.error.set('Invalid event ID. Return to All events.');
      return;
    }
    this.loading.set(true);
    this.request = this.api
      .detail(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(requestError(error));
          this.loading.set(false);
        },
      });
  }
}
