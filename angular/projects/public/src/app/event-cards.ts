import { Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { EventSummary } from '@charity/shared';
import { AudPipe, BrisbaneDatePipe, progressPercent, eventTiming } from './event-view';
@Component({
  selector: 'hh-event-cards',
  imports: [RouterLink, AudPipe, BrisbaneDatePipe],
  template: `
    <div class="event-grid">
      @for (event of events(); track event.event_id) {
        <article class="event-card">
          <div class="tag-row">
            <span class="tag">{{ event.category_name }}</span
            ><span
              class="tag timing-tag"
              [class.past]="timing(event.event_datetime) === 'past'"
              [class.upcoming]="timing(event.event_datetime) === 'upcoming'"
              >{{ timing(event.event_datetime) }}</span
            >
          </div>
          <h3 class="event-title">{{ event.name }}</h3>
          <p class="event-meta">
            <time [attr.datetime]="event.event_datetime">{{
              event.event_datetime | brisbaneDate
            }}</time>
          </p>
          <p class="event-meta">{{ event.location }}</p>
          <p class="event-purpose">{{ event.purpose }}</p>
          <p class="event-ticket">
            {{
              +event.ticket_price === 0 ? 'Free entry' : (event.ticket_price | aud) + ' per ticket'
            }}
          </p>
          <div class="progress-block">
            <p class="progress-label">
              {{ event.current_progress | aud }} raised of {{ event.fundraising_goal | aud }} goal
            </p>
            <div
              class="progress-track"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              [attr.aria-valuenow]="progress(event.current_progress, event.fundraising_goal)"
              [attr.aria-label]="'Fundraising progress for ' + event.name"
            >
              <span
                class="progress-fill"
                [style.width.%]="progress(event.current_progress, event.fundraising_goal)"
              ></span>
            </div>
          </div>
          <a
            class="button secondary-button card-link"
            [routerLink]="['/events', event.event_id]"
            [queryParams]="filters()"
            [attr.aria-label]="'View details for ' + event.name"
            >View details</a
          >
        </article>
      }
    </div>
  `,
})
export class EventCards {
  readonly events = input.required<EventSummary[]>();
  readonly filters = input<Params>({});
  readonly progress = progressPercent;
  readonly timing = eventTiming;
}
