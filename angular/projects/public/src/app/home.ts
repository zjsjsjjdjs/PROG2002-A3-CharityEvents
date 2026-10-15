import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, startWith, switchMap } from 'rxjs';
import { PublicEventsApi } from '@charity/shared';
import { EventCards } from './event-cards';
import { loadState } from './event-view';
@Component({
  selector: 'hh-home',
  imports: [RouterLink, EventCards],
  templateUrl: './home.html',
})
export class HomePage {
  private readonly api = inject(PublicEventsApi);
  readonly refresh = new Subject<void>();
  readonly state = toSignal(
    this.refresh.pipe(
      startWith(undefined),
      switchMap(() =>
        loadState(this.api.upcoming(), 'Upcoming events could not be loaded. Please try again.'),
      ),
    ),
    { requireSync: true },
  );
}
