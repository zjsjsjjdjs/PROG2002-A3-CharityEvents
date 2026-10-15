import { Routes } from '@angular/router';
import { ConnectionPage, NotFoundPage } from '@charity/shared';
import { HomePage } from './home';
import { SearchPage } from './search';
import { DetailPage } from './detail';
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage, title: 'Charity events | Harbour Hope' },
  { path: 'search', component: SearchPage, title: 'Search events | Harbour Hope' },
  { path: 'events/:id', component: DetailPage },
  // Keep links back from the existing registration page functional during migration.
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'search.html', redirectTo: 'search', pathMatch: 'full' },
  { path: 'detail.html', component: DetailPage },
  { path: 'connection', component: ConnectionPage, title: 'Service connection | Harbour Hope' },
  { path: '**', component: NotFoundPage, title: 'Page not found | Harbour Hope' },
];
