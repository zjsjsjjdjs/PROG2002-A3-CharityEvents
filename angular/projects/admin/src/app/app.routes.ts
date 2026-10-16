import { EventRegistrationsPage } from './event-registrations';
import { Routes } from '@angular/router';
import { ConnectionPage, NotFoundPage } from '@charity/shared';
import { EventListPage } from './event-list';
import { EventFormPage } from './event-form';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'events' },
  { path: 'events', component: EventListPage, title: 'All events | Harbour Hope' },
  { path: 'events/new', component: EventFormPage, title: 'New event | Harbour Hope' },
  { path: 'events/:id/edit', component: EventFormPage, title: 'Edit event | Harbour Hope' },
  {
    path: 'events/:id/registrations',
    component: EventRegistrationsPage,
    title: 'Registration list | Harbour Hope',
  },
  { path: 'connection', component: ConnectionPage, title: 'Service connection | Harbour Hope' },
  { path: '**', component: NotFoundPage, title: 'Page not found | Harbour Hope' },
];
