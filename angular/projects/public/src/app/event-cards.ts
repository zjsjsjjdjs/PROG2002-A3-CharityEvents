import { Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { EventSummary } from '@charity/shared';
import { AudPipe, BrisbaneDatePipe, progressPercent } from './event-view';
@Component({
  selector: 'hh-event-cards',
  imports: [RouterLink, AudPipe, BrisbaneDatePipe],
  template: `
    <div class="event-grid">
      @for (event of events(); track event.event_id) {
        <article class="event-card">
          <span class="category-tag">{{ event.category_name }}</span>
          <h3>
            <a [routerLink]="['/events', event.event_id]" [queryParams]="filters()">{{
              event.name
            }}</a>
          </h3>
          <p class="event-date">
            <time [attr.datetime]="event.event_datetime">{{
              event.event_datetime | brisbaneDate
            }}</time>
            · Brisbane
          </p>
          <p class="event-location">{{ event.location }}</p>
          <p>{{ event.short_description }}</p>
          <p class="muted">Supporting {{ event.purpose }}</p>
          <div class="card-bottom">
            <p class="ticket-price">
              {{
                +event.ticket_price === 0
                  ? 'Free entry'
                  : (event.ticket_price | aud) + ' per ticket'
              }}
            </p>
            <p class="fund-label">
              {{ event.current_progress | aud }} raised of {{ event.fundraising_goal | aud }}
            </p>
            <progress
              max="100"
              [value]="progress(event.current_progress, event.fundraising_goal)"
              [attr.aria-label]="'Fundraising progress for ' + event.name"
            ></progress>
            <a
              class="text-link"
              [routerLink]="['/events', event.event_id]"
              [queryParams]="filters()"
              [attr.aria-label]="'View details for ' + event.name"
              >View details <span aria-hidden="true">→</span></a
            >
          </div>
        </article>
      }
    </div>
  `,
})
export class EventCards {
  readonly events = input.required<EventSummary[]>();
  readonly filters = input<Params>({});
  readonly progress = progressPercent;
}
