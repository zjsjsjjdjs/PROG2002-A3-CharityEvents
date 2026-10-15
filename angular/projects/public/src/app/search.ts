import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, combineLatest, of, startWith, switchMap, tap } from 'rxjs';
import { Category, EventSearch, EventSummary, PublicEventsApi } from '@charity/shared';
import { EventCards } from './event-cards';
import { LoadState, loadState } from './event-view';

export function searchFilters(params: ParamMap): EventSearch | string {
  for (const key of ['date', 'location', 'categoryId'])
    if (params.getAll(key).length > 1) return 'Use only one value for each search filter.';
  const date = (params.get('date') || '').trim();
  const location = (params.get('location') || '').trim();
  const category = (params.get('categoryId') || '').trim();
  if (
    date &&
    (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date + 'T00:00:00Z')) ||
      new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date)
  )
    return 'Choose a valid calendar date.';
  if (
    category &&
    (!/^\d+$/.test(category) || !Number.isSafeInteger(Number(category)) || Number(category) < 1)
  )
    return 'Choose a valid category.';
  return {
    ...(date ? { date } : {}),
    ...(location ? { location } : {}),
    ...(category ? { categoryId: Number(category) } : {}),
  };
}
@Component({
  selector: 'hh-search',
  imports: [ReactiveFormsModule, EventCards],
  templateUrl: './search.html',
})
export class SearchPage {
  private readonly api = inject(PublicEventsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly refresh = new Subject<void>();
  readonly categoryRefresh = new Subject<void>();
  readonly form = new FormGroup({
    date: new FormControl('', { nonNullable: true }),
    location: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl('', { nonNullable: true }),
  });
  readonly categories = toSignal(
    this.categoryRefresh.pipe(
      startWith(undefined),
      switchMap(() =>
        loadState<Category[]>(
          this.api.categories(),
          'Categories could not be loaded. You can still search by date or location.',
        ),
      ),
    ),
    { requireSync: true },
  );
  readonly state = toSignal(
    combineLatest([this.route.queryParamMap, this.refresh.pipe(startWith(undefined))]).pipe(
      tap(([params]) =>
        this.form.setValue({
          date: params.get('date') || '',
          location: params.get('location') || '',
          categoryId: params.get('categoryId') || '',
        }),
      ),
      switchMap(([params]) => {
        const filters = searchFilters(params);
        return typeof filters === 'string'
          ? of<LoadState<EventSummary[]>>({ status: 'error', message: filters })
          : loadState(this.api.search(filters), 'Events could not be loaded. Please try again.');
      }),
    ),
    { requireSync: true },
  );
  get appliedFilters() {
    const filters = searchFilters(this.route.snapshot.queryParamMap);
    return typeof filters === 'string' ? {} : filters;
  }
  submit() {
    const queryParams = Object.fromEntries(
      Object.entries(this.form.getRawValue())
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => v !== ''),
    );
    const tree = this.router.createUrlTree(['/search'], { queryParams });
    if (this.router.serializeUrl(tree) === this.router.url) this.refresh.next();
    else void this.router.navigateByUrl(tree);
  }
  clear() {
    this.form.reset();
    if (this.router.url === '/search') this.refresh.next();
    else void this.router.navigate(['/search']);
  }
}
