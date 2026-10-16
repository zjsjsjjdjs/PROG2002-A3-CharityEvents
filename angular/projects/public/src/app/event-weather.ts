import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, startWith, Subject, switchMap } from 'rxjs';
import { DatePipe } from '@angular/common';
import { EventWeatherApi, WeatherEvent, WeatherState } from './weather';

@Component({
  selector: 'hh-event-weather',
  imports: [DatePipe],
  templateUrl: './event-weather.html',
})
export class EventWeather {
  readonly event = input.required<WeatherEvent>();
  readonly refresh = new Subject<void>();
  private readonly api = inject(EventWeatherApi);
  readonly state = toSignal(
    combineLatest([toObservable(this.event), this.refresh.pipe(startWith(undefined))]).pipe(
      switchMap(([event]) => this.api.load(event)),
    ),
    {
      initialValue: { status: 'loading' } as WeatherState,
    },
  );
}
