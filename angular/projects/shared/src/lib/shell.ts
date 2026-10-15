import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'hh-shell',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="site-nav">
        <a class="brand" routerLink="/" aria-label="Harbour Hope home">
          <span class="brand-mark" aria-hidden="true">HH</span>
          <span
            ><strong>Harbour Hope</strong><small>{{ area() }}</small></span
          >
        </a>
        <nav aria-label="Main navigation">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            >Home</a
          >
          <a routerLink="/connection" routerLinkActive="active" ariaCurrentWhenActive="page"
            >Connection</a
          >
        </nav>
      </div>
    </header>
    <main id="main" tabindex="-1"><ng-content /></main>
    <footer>Harbour Hope Charity · Community care in Brisbane</footer>
  `,
})
export class AppShell {
  readonly area = input.required<string>();
}
