# Harbour Hope Angular foundation

Based on M12-merged main (`ac81f5a`): two standalone Angular applications and shared
source. Public home, search and event detail pages now use the existing API.
Angular registration, admin CRUD, weather and production deployment are subsequent
work. Registration currently links to the working legacy page. See the
[public-page migration notes](../docs/angular-public-pages.md).

## Install and start

Use Node **22.22.3+ within 22.x**, **24.15.0+ within 24.x**, or a compatible newer
release ([Angular compatibility](https://angular.dev/reference/versions)).
Node 24.10.0 used for the original project is too old for Angular 22.
Developed with Node 24.19.0, Angular 22.2.3, CLI 22.2.2 and TypeScript 6.0.3.
No global CLI is required. From this `angular` directory:

```sh
npm ci
npm run start:public
```

Open http://127.0.0.1:4200. In a second terminal in this directory:

```sh
npm run start:admin
```

Open http://127.0.0.1:4201. Public routes are `/`, `/search`, `/events/:id` and
`/connection`. Admin still has its foundation routes. Both have a not-found page.
The connection button performs a read-only health check. Start the existing API
using the root README instructions. Preview pages render without it; connection
checks report unavailable until the API and database run.

The local proxy forwards `/api/**` to http://127.0.0.1:3000. The public dev server
also proxies `/register.html` and `/assets/**` to the existing Express site for the
registration bridge; no admin proxy behavior changes. For another local API
port, set this before starting the frontend (PowerShell):

```powershell
$env:API_PROXY_TARGET = 'http://127.0.0.1:3001'
npm run start:admin
```

The proxy preserves Host for existing same-origin admin checks. Use a local API
in development mode with PUBLIC_ORIGIN unset or matching the preview origin.
Do not change production admin protection for a preview. The shared service does
not store passwords or inject Authorization; admin authentication UX is part of
the admin migration. Never put database credentials in browser source.

## Ownership and extension points

| Location | Purpose | Next owner |
| --- | --- | --- |
| `projects/public/src/app` | Public routes and pages | user1 |
| `projects/admin/src/app` | Admin routes and pages | user2 |
| `projects/shared/src/lib/models.ts` | Existing API contracts | Coordinate |
| `projects/shared/src/lib/api.ts` | PublicEventsApi / AdminEventsApi | Coordinate |
| `projects/shared/src/styles.css` | Shared brand and layout | Coordinate |

Import from `@charity/shared`. Shared is source reused by both apps, not a published
library. Add pages to each app's `app.routes.ts`. HttpClient and standalone routing
are configured; strict TypeScript and template checking are enabled.

The API prefix defaults to `/api`. For a verified deployment prefix, add
`{ provide: API_BASE_URL, useValue: '/actual-prefix/api' }` to the app.config.ts
providers. Prefer same-origin hosting. Public timestamps include Brisbane +10:00;
admin writes take Brisbane wall time without an offset. Decimal values may be
strings. Attendee lists exclude email. HTTP errors propagate for page-level handling.

## Verification and production outputs

```sh
npm test
npm run build
```

Tests cover routes/fallback, HTTP contracts and connection feedback. Shared tests
are imported by the public test target and run once. These use mocked HTTP; they
do not replace real API/database or final deployment acceptance.

Outputs: `dist/public/browser` and `dist/admin/browser`. Host them separately.
For subpath hosting, build with its base href, for example:

```sh
npm run ng -- build admin --base-href /admin/
```

Production hosting must return each app's index.html for its own client routes,
while keeping `/api/**` under Express and preserving admin protection. The dev
proxy is not included in production. cPanel configuration and authentication
acceptance belong to deployment. Do not replace the live website with these
preview screens; ng serve is for local development only.

## Collaboration

user1 (Hongke Ouyang / Sakitam630) implemented this foundation with Codex assistance
for scaffolding, code and tests. user2 reviews the standalone PR before both
members branch from the merged foundation. Each member records actual later work,
testing and AI assistance in the report. Weather, business migration and deployment
are not claimed complete by this foundation.

## Foundation validation (2026-10-15)

- Production builds: public and admin passed (about 252 kB initial raw bundle each).
- Unit tests: public/shared 10 passed; admin 1 passed.
- Chrome smoke checks passed for both apps: home, direct-route reload, connection
  success/failure/retry, unknown-route recovery, and 390 px mobile width.
- A local mock API using the existing adminAccess middleware accepted same-origin
  POST requests through both proxies with Host and Origin preserved. No live
  records were created. No browser page errors were observed.
- This foundation run did not rerun the historical full database acceptance suite
  or deploy anything to cPanel.
