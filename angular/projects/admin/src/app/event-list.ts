import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminEventsApi, type AdminEventSummary } from '@charity/shared';
import { EventActions } from './event-actions';
import { AdminFeedback, requestError } from './admin-feedback';
/**
 * Management event list with client-side name/location/category filtering and separate status filtering.
 */
@Component({
  selector: 'hh-event-list',
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, EventActions],
  templateUrl: './event-list.html',
})
export class EventListPage {
  private readonly api = inject(AdminEventsApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly feedback = inject(AdminFeedback);
  readonly events = signal<AdminEventSummary[]>([]);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal('');
  readonly query = signal('');
  readonly status = signal('');
  readonly visible = computed(() =>
    this.events().filter(
      (event) =>
        (!this.status() || event.display_status === this.status()) &&
        [event.name, event.location, event.category_name].some((value) =>
          value.toLowerCase().includes(this.query().trim().toLowerCase()),
        ),
    ),
  );
  constructor() {
    this.load();
  }
  load() {
    if (this.loading() || this.mutating()) return;
    this.loading.set(true);
    this.error.set('');
    this.events.set([]);
    this.api
      .events()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this.events.set(events);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(requestError(error));
          this.loading.set(false);
        },
      });
  }
  clear() {
    if (this.mutating()) return;
    this.query.set('');
    this.status.set('');
  }
}
