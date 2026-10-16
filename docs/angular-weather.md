# Angular event weather and exceptional states

Implemented locally by user1 (Hongke Ouyang / Sakitam630), with Codex assistance,
on 2026-10-15. Branch `user1-angular-weather` starts at registration commit
`6e51688` (PR #17). This module has not been pushed, opened as a PR or deployed.
The registration dependency must be retained when preparing the eventual PR.

## Behaviour

The public event detail page requests Open-Meteo using the event's latitude and
longitude. It selects the exact event day in Australia/Brisbane, displaying the
WMO condition and daily minimum/maximum temperatures in Celsius. This is a daily
forecast, not an hourly forecast for the event start time. The provider is linked
in the card. No API key, personal information, database change or backend change
is required. Admin and shared application source are unchanged.

The independent card handles:

- Loading, without blocking event information or registration.
- Missing, incomplete or invalid coordinates: explanation, no external request.
- Past dates, unreadable dates and dates beyond today plus 15 days: explanation,
  no external request. No substitution of today's weather for a distant event.
- Provider missing the event day: no forecast message.
- Network failures, ten-second timeout, rate limits and malformed/incomplete
  temperature data: explanation and manual Retry weather button. No automatic retries.
- Unknown weather codes: valid temperatures with an explicit condition fallback.
- Event changes: cancel the obsolete request and clear old results.

Reference: [Open-Meteo forecast documentation](https://open-meteo.com/en/docs).
The maximum requested forecast is 16 calendar days including today; availability
of a particular variable/date still depends on the provider.

## Verification (2026-10-15)

- Public/shared unit tests: **52 passed** (including 21 weather cases).
- Admin unit tests: **14 passed**.
- Public and admin production builds: passed.
- Chrome acceptance: **20 passed**, using real local Express and a disposable
  MariaDB database, with deterministic Open-Meteo browser responses.
- Covers existing browsing, search, registration, duplicate and suspended-event
  handling; plus weather loading, success, network failure/retry, registration
  availability during failure, malformed/missing-day payloads, no-coordinate and
  out-of-window states, and desktop/mobile layouts. No browser page errors.
- Separate read-only live provider request returned Australia/Brisbane, 16 days
  and Celsius units. Browser failure scenarios are simulated; these are not a
  claim of cPanel deployment acceptance or of a live end-to-end browser forecast.
- Test database was removed and dedicated test servers stopped after the run.

Reproduce with supported Node (24.19.0 used):

```sh
cd angular
npm test
npm run build
cd ..
node scripts/test-angular-public.cjs
```

The browser runner requires API dependencies, Chrome and a local database account
allowed to create/drop its uniquely named test database. `ANGULAR_TEST_ENV_FILE`
can point to a separate environment file; the runner never imports into an
existing application database. Weather scenarios are in
`scripts/test-angular-weather.cjs`, called by that runner.

## Local handoff

Build output: `angular/dist/public/browser`. The ignored local archive
`submission/angular-public-weather-local.zip` contains those public static files,
including the previously completed public browsing and registration features.
It contains no API, admin application, credentials, database export or dependencies.
It has not been uploaded or deployed. Source changes remain on the local branch.

For cPanel, public client routes must resolve to the public index.html and `/api`
must reach the existing Express API. If the host sets Content-Security-Policy,
its connect-src must permit `https://api.open-meteo.com` alongside the application's
own API. No server configuration was changed here. Check a near-future event with
coordinates and a weather failure state on the actual deployed origin during
final user2 deployment acceptance.
