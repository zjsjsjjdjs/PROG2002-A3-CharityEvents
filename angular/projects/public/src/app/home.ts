import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'hh-home',
  imports: [RouterLink],
  template: `
    <section class="page-panel" aria-labelledby="home-title">
      <p class="eyebrow">Harbour Hope / Charity events</p>
      <h1 id="home-title">Together, we make a difference.</h1>
      <p>
        The public website foundation is ready. Event browsing, registration and weather will be
        added in the next development step.
      </p>
      <p><strong>Development preview</strong> · This application is not yet the live website.</p>
      <a class="button" routerLink="/connection">Check service connection</a>
    </section>
  `,
})
export class HomePage {}
