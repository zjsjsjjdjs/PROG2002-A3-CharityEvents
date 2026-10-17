import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
/**
 * Persistent management shell: Header, Nav, main/router-outlet and Footer are reused across all Angular admin routes.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="admin-header">
      <a class="brand" routerLink="/events"
        ><span class="brand-mark" aria-hidden="true">HH</span
        ><span
          ><span class="brand-name">Harbour Hope</span
          ><span class="brand-subtitle">Event management</span></span
        ></a
      >
      <nav aria-label="Management navigation">
        <a
          routerLink="/events"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          >All events</a
        >
        <a routerLink="/events/new" routerLinkActive="active" ariaCurrentWhenActive="page"
          >New event</a
        >
        <a routerLink="/connection" routerLinkActive="active" ariaCurrentWhenActive="page"
          >Connection</a
        >
        @if (hosted) {
          <a href="/">Public website ↗</a><a href="/admin/login">Sign in</a>
          <form action="/admin/logout" method="post" class="session-tools">
            <button type="submit" class="secondary">Sign out</button>
          </form>
        }
      </nav>
    </header>
    <main class="admin-main" id="main" tabindex="-1"><router-outlet /></main>
    <footer class="admin-footer">
      Harbour Hope Charity · Community events, carefully managed.
    </footer>
  `,
})
export class App {
  readonly hosted = new URL(inject(DOCUMENT).baseURI).pathname === '/admin/';
}
