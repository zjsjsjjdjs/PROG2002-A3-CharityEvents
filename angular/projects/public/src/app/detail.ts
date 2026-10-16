import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, combineLatest, of, startWith, switchMap, tap } from 'rxjs';
import { EventDetail, PublicEventsApi } from '@charity/shared';
import {
  AudPipe,
  BrisbaneDatePipe,
  LoadState,
  loadState,
  progressPercent,
  eventTiming,
} from './event-view';
import { EventWeather } from './event-weather';
import { searchFilters } from './search';
@Component({
  selector: 'hh-event-detail',
  imports: [RouterLink, AudPipe, BrisbaneDatePipe, EventWeather],
  templateUrl: './detail.html',
})
export class DetailPage {
  private readonly api = inject(PublicEventsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  readonly refresh = new Subject<void>();
  readonly progress = progressPercent;
  readonly timing = eventTiming;
  readonly state = toSignal(
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
      this.refresh.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([path, query]) => {
        const id = path.get('id') || (query.getAll('id').length === 1 ? query.get('id') : null);
        if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
          return of<LoadState<EventDetail>>({
            status: 'error',
            message: 'No valid event was selected. Choose an event from the search page.',
          });
        return loadState(
          this.api.detail(Number(id)),
          'Event details could not be loaded. Please try again.',
          'This event is unavailable. It may have been removed or suspended.',
        );
      }),
      tap((state) =>
        this.title.setTitle(
          state.status === 'ready'
            ? state.data.name + ' | Harbour Hope'
            : 'Event details | Harbour Hope',
        ),
      ),
    ),
    { requireSync: true },
  );
  readonly attendees = computed(() => {
    const state = this.state();
    return state.status === 'ready'
      ? [...state.data.registrations].sort(
          (a, b) =>
            Date.parse(b.registered_at) - Date.parse(a.registered_at) ||
            b.registration_id - a.registration_id,
        )
      : [];
  });
  get filters() {
    const filters = searchFilters(this.route.snapshot.queryParamMap);
    return typeof filters === 'string' ? {} : filters;
  }
}
