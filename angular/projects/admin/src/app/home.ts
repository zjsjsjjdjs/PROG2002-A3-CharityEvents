import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'hh-home',
  imports: [RouterLink],
  template: `
    <section class="page-panel" aria-labelledby="home-title">
      <p class="eyebrow">Harbour Hope / Event management</p>
      <h1 id="home-title">Care for every community event.</h1>
      <p>
        The administration foundation is ready. Event management forms and registration lists will
        be added in the next development step.
      </p>
      <p><strong>Development preview</strong> · This application is not yet the live website.</p>
      <a class="button" routerLink="/connection">Check service connection</a>
    </section>
  `,
})
export class HomePage {}
