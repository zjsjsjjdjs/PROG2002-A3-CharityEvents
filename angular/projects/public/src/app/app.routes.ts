import { Routes } from '@angular/router';
import { ConnectionPage, NotFoundPage } from '@charity/shared';
import { HomePage } from './home';
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePage, title: 'Charity events | Harbour Hope' },
  { path: 'connection', component: ConnectionPage, title: 'Service connection | Harbour Hope' },
  { path: '**', component: NotFoundPage, title: 'Page not found | Harbour Hope' },
];
