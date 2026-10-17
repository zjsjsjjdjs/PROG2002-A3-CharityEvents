import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  API_BASE_URL,
  AdminEventsApi,
  type AdminEventSummary,
  type EventMutationResult,
} from '@charity/shared';
import { AdminFeedback, requestError } from './admin-feedback';

type Action = 'suspend' | 'resume' | 'delete';
/**
 * Reusable row actions with confirmation, in-flight locking and server-authoritative registration protection.
 */
@Component({
  selector: 'hh-event-actions',
  imports: [RouterLink],
  template: `
    <div class="row-actions">
      <a
        [routerLink]="['/events', event().event_id, 'edit']"
        [attr.aria-label]="'Edit ' + event().name"
        >Edit</a
      >
      <button
        class="secondary"
        type="button"
        [disabled]="busy() || locked()"
        (click)="choose(event().status === 'suspended' ? 'resume' : 'suspend')"
      >
        {{ event().status === 'suspended' ? 'Resume' : 'Suspend' }}
      </button>
      <button
        class="danger secondary"
        type="button"
        [disabled]="busy() || locked() || protectedEvent()"
        (click)="choose('delete')"
        [attr.aria-describedby]="protectedEvent() ? 'delete-reason-' + event().event_id : null"
      >
        Delete
      </button>
    </div>
    @if (protectedEvent()) {
      <small [id]="'delete-reason-' + event().event_id"
        >Has registrations; deletion is blocked. Suspend instead.</small
      >
    }
    @if (pending(); as action) {
      <div
        class="action-confirmation"
        role="group"
        [attr.aria-label]="'Confirm ' + action + ' ' + event().name"
      >
        <p>
          {{
            action === 'delete' ? 'Permanently delete' : action === 'suspend' ? 'Suspend' : 'Resume'
          }}
          <strong>{{ event().name }}</strong
          >?
        </p>
        <p>
          {{
            action === 'delete'
              ? 'This cannot be undone. The server will check for registrations again.'
              : action === 'suspend'
                ? 'Public registration will be unavailable. Existing registrations are kept.'
                : 'Active status restores public visibility and registration. Existing registrations are kept.'
          }}
        </p>
        <button
          type="button"
          [class.danger]="action === 'delete'"
          [disabled]="busy() || locked()"
          (click)="confirm()"
        >
          {{ busy() ? 'Working…' : 'Confirm ' + action }}
        </button>
        <button type="button" class="secondary" [disabled]="busy() || locked()" (click)="cancel()">
          Cancel
        </button>
      </div>
    }
    @if (busy()) {
      <p role="status">Updating event. Please wait.</p>
    }
    @if (error()) {
      <p class="field-error" role="alert">{{ error() }}</p>
    }
  `,
})
export class EventActions {
  readonly event = input.required<AdminEventSummary>();
  readonly changed = output<void>();
  readonly working = output<boolean>();
  readonly locked = input(false);
  readonly pending = signal<Action | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly serverProtected = signal(false);
  private readonly api = inject(AdminEventsApi);
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL).replace(/\/+$/, '');
  private readonly feedback = inject(AdminFeedback);
  private readonly destroyRef = inject(DestroyRef);
  protectedEvent() {
    return this.event().registration_count > 0 || this.serverProtected();
  }
  choose(action: Action) {
    if (this.busy() || this.locked() || (action === 'delete' && this.protectedEvent())) return;
    this.error.set('');
    this.feedback.notice.set('');
    this.pending.set(action);
  }
  cancel() {
    if (!this.busy() && !this.locked()) this.pending.set(null);
  }
  confirm() {
    const action = this.pending();
    if (!action || this.busy() || this.locked()) return;
    if (action === 'delete' && this.protectedEvent()) {
      this.pending.set(null);
      return;
    }
    this.busy.set(true);
    this.working.emit(true);
    this.error.set('');
    const id = this.event().event_id;
    const request =
      action === 'delete'
        ? this.api.delete(id)
        : this.http.patch<EventMutationResult>(this.base + '/admin/events/' + id + '/status', {
            status: action === 'suspend' ? 'suspended' : 'active',
          });
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.working.emit(false);
        this.pending.set(null);
        this.feedback.notice.set(
          'Event #' +
            id +
            ' ' +
            (action === 'delete' ? 'deleted.' : action === 'suspend' ? 'suspended.' : 'resumed.'),
        );
        this.changed.emit();
      },
      error: (error) => {
        this.busy.set(false);
        this.working.emit(false);
        this.pending.set(null);
        if (error.status === 409 && error.error?.code === 'EVENT_HAS_REGISTRATIONS')
          this.serverProtected.set(true);
        this.error.set(
          requestError(error) +
            (error.status === 0 || error.status >= 500
              ? ' Refresh the list to check the outcome before trying again.'
              : ''),
        );
      },
    });
  }
}
