import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
/**
 * Persistent public application shell: app.html defines Header, Nav, main/router-outlet and Footer once for all public routes.
 */
@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  readonly menuOpen = signal(false);
  readonly router = inject(Router);
  get isHome() {
    return this.router.url.split(/[?#]/)[0] === '/';
  }
  skipToContent(event: Event) {
    event.preventDefault();
    const main = document.getElementById('main');
    main?.focus();
    main?.scrollIntoView();
  }
}
