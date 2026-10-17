import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
  takeUntil,
  tap,
  timeout,
} from 'rxjs';
import { EventDetail, PublicEventsApi, RegistrationReceipt } from '@charity/shared';
import { AudPipe, BrisbaneDatePipe, LoadState, loadState } from './event-view';
import { searchFilters } from './search';
import { emailValidator, nameValidator, ticketsValidator } from './registration-validation';

/**
 * Reactive registration page: validates input, prevents repeated pending submissions and keeps the receipt tied to the selected event.
 */
@Component({
  selector: 'hh-registration',
  imports: [RouterLink, ReactiveFormsModule, AudPipe, BrisbaneDatePipe],
  templateUrl: './registration.html',
})
export class RegistrationPage {
  private readonly api = inject(PublicEventsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly eventChanged = new Subject<void>();
  private currentId: number | null | undefined;
  private readonly confirmation = viewChild<ElementRef<HTMLElement>>('confirmation');
  constructor() {
    afterRenderEffect(() => this.confirmation()?.nativeElement.focus());
  }
  readonly refresh = new Subject<void>();
  readonly pending = signal(false);
  readonly blocked = signal(false);
  readonly submitError = signal('');
  readonly receipt = signal<RegistrationReceipt | null>(null);
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [nameValidator] }),
    email: new FormControl('', { nonNullable: true, validators: [emailValidator] }),
    tickets: new FormControl('1', { nonNullable: true, validators: [ticketsValidator] }),
  });
  private readonly values = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { requireSync: true },
  );
  private readonly eventId = combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(
    map(([path, query]) => {
      const raw = path.get('id') || (query.getAll('id').length === 1 ? query.get('id') : null);
      return raw && /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) > 0
        ? Number(raw)
        : null;
    }),
    distinctUntilChanged(),
  );
  readonly state = toSignal(
    combineLatest([this.eventId, this.refresh.pipe(startWith(undefined))]).pipe(
      tap(([id]) => {
        if (id !== this.currentId) {
          this.eventChanged.next();
          this.currentId = id;
          this.pending.set(false);
          this.blocked.set(false);
          this.submitError.set('');
          this.receipt.set(null);
          this.form.reset({ name: '', email: '', tickets: '1' });
        }
      }),
      switchMap(([id]) =>
        id === null
          ? of<LoadState<EventDetail>>({
              status: 'error',
              message: 'No valid event was selected. Return to search and choose an event.',
            })
          : loadState(
              this.api.detail(id),
              'Event information could not be loaded. Please try again.',
              'This event is unavailable for registration. It may have been removed or suspended.',
            ),
      ),
    ),
    { requireSync: true },
  );
  readonly total = computed(() => {
    const state = this.state(),
      tickets = String(this.values().tickets ?? '').trim();
    return state.status === 'ready' &&
      /^\d+$/.test(tickets) &&
      +tickets >= 1 &&
      +tickets <= 2147483647
      ? +tickets * Number(state.data.ticket_price)
      : null;
  });
  get filters() {
    const filters = searchFilters(this.route.snapshot.queryParamMap);
    return typeof filters === 'string' ? {} : filters;
  }
  invalid(field: 'name' | 'email' | 'tickets') {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }
  submit() {
    const state = this.state();
    if (state.status !== 'ready' || this.pending() || this.blocked() || this.receipt()) return;
    const raw = this.form.getRawValue();
    this.form.setValue({
      name: raw.name.trim(),
      email: raw.email.trim().toLowerCase(),
      tickets: String(raw.tickets).trim(),
    });
    this.form.markAllAsTouched();
    this.submitError.set('');
    if (this.form.invalid) {
      this.submitError.set('Please check the highlighted fields.');
      const field = (['name', 'email', 'tickets'] as const).find(
        (key) => this.form.controls[key].invalid,
      );
      this.element.nativeElement.querySelector<HTMLInputElement>('[name="' + field + '"]')?.focus();
      return;
    }
    const input = this.form.getRawValue();
    this.pending.set(true);
    this.form.disable({ emitEvent: false });
    this.api
      .register(state.data.event_id, {
        name: input.name,
        email: input.email,
        tickets: Number(input.tickets),
      })
      .pipe(
        timeout(15000),
        takeUntil(this.eventChanged),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.pending.set(false);
          this.form.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: (result) => {
          const saved = result?.registration;
          if (
            !saved ||
            saved.event_id !== state.data.event_id ||
            !Number.isSafeInteger(saved.registration_id) ||
            saved.registration_id < 1 ||
            saved.tickets !== Number(input.tickets)
          ) {
            this.submitError.set(
              'Your registration could not be confirmed. Check the event details for your name before trying again.',
            );
            return;
          }
          this.receipt.set(saved);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409)
            this.submitError.set(
              'This email is already registered for this event. Check the attendee list on the event details page.',
            );
          else if (error.status === 404) {
            this.blocked.set(true);
            this.submitError.set(
              'This event is no longer available for registration. Your entries have been kept. Return to search to choose another event.',
            );
          } else if (error.status === 400)
            this.submitError.set(
              'The registration details were not accepted. Check your name, email address and ticket quantity, then try again.',
            );
          else
            this.submitError.set(
              'Your registration could not be confirmed. Your entries have been kept. Check the event details for your name before trying again.',
            );
        },
      });
  }
}
