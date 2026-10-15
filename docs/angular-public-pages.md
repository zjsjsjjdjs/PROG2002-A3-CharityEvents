# Angular public pages: first release

Implemented by user1 (Hongke Ouyang / Sakitam630), starting from main `00be5f9`
after Angular foundation PR #14. Codex assisted implementation and test preparation.

## Scope

- Home: upcoming events, charity contact details, price and fundraising progress;
  loading, empty and retry states.
- Search: real category choices and combined date/location/category filters;
  URL query parameters restore filters on refresh, browser navigation and return
  from event detail. Changing search cancels obsolete requests. Empty/error states
  clear old results; category errors have an independent retry.
- Detail: event, organisation and fundraising information, Brisbane time, newest
  registrations first, and a link to the working registration form. Invalid IDs,
  missing and suspended events show an error without a registration action.
- Both event and registration times explicitly use Australia/Brisbane, even on a
  machine in another timezone. Angular text binding renders user text as text.

Routes: `/`, `/search`, `/events/:id`. Legacy `index.html`, `search.html` and
`detail.html?id=...` links return to Angular pages. Public styling and navigation
are local to the public app; shared source, admin pages, Express and SQL are unchanged.
The separate connection diagnostic and not-found route remain available.

## Temporary registration bridge

This PR does not implement the Angular registration form or weather. The event
page links to `/register.html?id=...`, the existing working form. The public-only
`angular/proxy.public.conf.cjs` forwards that document and its `/assets/**` files
to the same local API target. On successful registration, the form navigates to
`detail.html?id=...`; Angular handles that route and refreshes the attendee list.

For production, retain the existing registration document/assets and `/api/**`
under Express while routing the public application pages to the Angular index.
Do not send `/register.html` to the SPA fallback. If the existing form is hosted
elsewhere, override `LEGACY_REGISTRATION_PATH` in the public app providers with
its verified path (without a query string). Deployment is a separate reviewed
step; this PR does not change the live cPanel site. The bridge can be removed when
the Angular registration form is merged.

## Run and verify

Use the Angular workspace README's supported Node version and startup commands.

```sh
npm ci --prefix api
npm ci --prefix angular
npm test --prefix angular
npm run build --prefix angular
node scripts/test-angular-public.cjs
```

The browser runner needs Chrome, a running local MySQL/MariaDB server and test
credentials permitted to create/drop a temporary database. It reads `api/.env`,
or the file named in `ANGULAR_TEST_ENV_FILE`. It never overwrites that file.
It creates a unique database, imports the existing full SQL, adjusts fixtures only
inside that database, starts its own API and Angular servers on available ports,
and disposes its database and child servers on completion/failure. No existing
database is cleared. Logs/screenshots/results go to ignored
`submission/angular-public-checks`.

The test covers live database-backed browsing, combined filters and reload,
Brisbane display from a UTC+8 browser, back-to-search restoration, empty results,
failure/retry without stale cards, unavailable events, a real registration through
the bridge, and all three pages at 390 px. API failure responses are injected only
for the explicit failure/retry browser case. It does not access cPanel.

## Validation record (2026-10-15)

- Angular unit tests: public/shared 18 passed; admin foundation 1 passed.
- Both production builds passed; public bundle about 335 kB raw / 88 kB estimated transfer.
- Real MariaDB 10.4.32, Express and headless Chrome: 9 acceptance checks passed.
  The actual legacy registration form inserted a record in the disposable database
  and returned to Angular detail with the new attendee first.
- Desktop/detail and 390 px mobile screenshots were reviewed. No unhandled browser
  page errors or horizontal overflow were observed.
- Tests used a separately initialized local MariaDB instance because the normal
  local service was stopped. The owned test database and test servers were disposed;
  the temporary MariaDB instance was shut down afterwards. No live site was changed.
