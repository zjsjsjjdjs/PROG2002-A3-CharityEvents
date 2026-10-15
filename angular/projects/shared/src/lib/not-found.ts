import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'hh-not-found',
  imports: [RouterLink],
  template:
    '<section class="page-panel"><h1>Page not found</h1><p>This address is not available.</p><a routerLink="/">Return home</a></section>',
})
export class NotFoundPage {}
