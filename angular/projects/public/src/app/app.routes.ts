import { Routes } from '@angular/router';
import { ConnectionPage, NotFoundPage } from '@charity/shared';
import { HomePage } from './home';
import { SearchPage } from './search';
import { DetailPage } from './detail';
import { RegistrationPage } from './registration';
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage, title: 'Charity events | Harbour Hope' },
  { path: 'search', component: SearchPage, title: 'Search events | Harbour Hope' },
  { path: 'events/:id/register', component: RegistrationPage, title: 'Register | Harbour Hope' },
  { path: 'events/:id', component: DetailPage },
  // Preserve bookmarked legacy public URLs within Angular.
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'search.html', redirectTo: 'search', pathMatch: 'full' },
  { path: 'detail.html', component: DetailPage },
  { path: 'register.html', component: RegistrationPage, title: 'Register | Harbour Hope' },
  { path: 'connection', component: ConnectionPage, title: 'Service connection | Harbour Hope' },
  { path: '**', component: NotFoundPage, title: 'Page not found | Harbour Hope' },
];
