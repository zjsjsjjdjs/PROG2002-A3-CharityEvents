import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, Subscription } from 'rxjs';
import {
  AdminEventsApi,
  PublicEventsApi,
  type Attendee,
  type Category,
  type Organisation,
} from '@charity/shared';
import { AdminFeedback, requestError } from './admin-feedback';
import {
  blankDraft,
  eventInput,
  validateDraft,
  textFields,
  moneyFields,
  type EventDraft,
  type FieldKey,
} from './event-fields';
@Component({
  selector: 'hh-event-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './event-form.html',
})
export class EventFormPage {
  private readonly api = inject(AdminEventsApi);
  private readonly publicApi = inject(PublicEventsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly feedback = inject(AdminFeedback);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element: ElementRef<HTMLElement> = inject(ElementRef);
  private request?: Subscription;
  readonly textFields = textFields;
  readonly moneyFields = moneyFields;
  readonly form = new FormGroup(
    Object.fromEntries(
      Object.entries(blankDraft()).map(([key, value]) => [
        key,
        new FormControl(value, { nonNullable: true }),
      ]),
    ) as Record<FieldKey, FormControl<string>>,
  );
  readonly editing = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly ready = signal(false);
  readonly error = signal('');
  readonly errors = signal<Partial<Record<FieldKey, string>>>({});
  readonly categories = signal<Category[]>([]);
  readonly organisations = signal<Organisation[]>([]);
  readonly registrations = signal<Attendee[]>([]);
  private id: number | null = null;
  private invalidId = false;
  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const raw = params.get('id');
      this.editing.set(raw !== null);
      this.invalidId =
        raw !== null &&
        (!/^\d+$/.test(raw) ||
          !Number.isSafeInteger(Number(raw)) ||
          Number(raw) < 1 ||
          Number(raw) > 2147483647);
      this.id = raw === null ? null : Number(raw);
      this.load();
    });
  }
  load() {
    this.request?.unsubscribe();
    this.form.reset(blankDraft());
    this.errors.set({});
    this.error.set('');
    this.registrations.set([]);
    this.ready.set(false);
    if (this.invalidId) {
      this.loading.set(false);
      this.error.set('Invalid event ID. Return to All events.');
      return;
    }
    this.loading.set(true);
    this.request = forkJoin({
      categories: this.publicApi.categories(),
      organisations: this.api.organisations(),
      event: this.id === null ? of(null) : this.api.detail(this.id),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, organisations, event }) => {
          this.categories.set(categories);
          this.organisations.set(organisations);
          if (event) {
            const draft = blankDraft();
            for (const key of Object.keys(draft) as FieldKey[])
              draft[key] = event[key] === null ? '' : String(event[key]);
            // API timestamps carry +10:00. Keep Brisbane wall time; do not convert through the browser timezone.
            draft.event_datetime = event.event_datetime.slice(0, 19);
            this.form.setValue(draft);
            this.registrations.set(event.registrations);
          } else if (organisations.length === 1)
            this.form.controls.organisation_id.setValue(String(organisations[0].organisation_id));
          this.loading.set(false);
          if (!categories.length || !organisations.length)
            this.error.set(
              'Categories and organisations must be available before saving. Ask the project maintainer to check the database, then retry.',
            );
          else this.ready.set(true);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set(requestError(error));
        },
      });
  }
  save() {
    if (!this.ready() || this.saving()) return;
    const draft: EventDraft = this.form.getRawValue();
    const errors = validateDraft(draft);
    this.errors.set(errors);
    this.error.set('');
    if (Object.keys(errors).length) {
      this.error.set('Check the highlighted fields before saving.');
      this.focusFirstError();
      return;
    }
    this.saving.set(true);
    const input = eventInput(draft);
    const action = this.id === null ? this.api.create(input) : this.api.update(this.id, input);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.feedback.notice.set(
          'Event #' + result.event_id + (this.id === null ? ' created.' : ' updated.'),
        );
        void this.router.navigate(['/events']);
      },
      error: (error) => {
        const fields: Partial<Record<FieldKey, string>> = {};
        for (const key of Object.keys(blankDraft()) as FieldKey[])
          if (typeof error?.error?.fields?.[key] === 'string')
            fields[key] = error.error.fields[key];
        this.errors.set(fields);
        this.saving.set(false);
        this.error.set(
          requestError(error) +
            ' Your entries are kept. If the connection was interrupted, check All events before retrying.',
        );
        this.focusFirstError();
      },
    });
  }
  private focusFirstError() {
    const key = Object.keys(this.errors())[0];
    if (key) this.element.nativeElement.querySelector<HTMLElement>('#' + key)?.focus();
  }
}
