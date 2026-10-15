# user1 local acceptance — 15 October 2026

Scope: Angular public home/search/detail/registration/weather, keyboard and small
screen use, and integration with the existing Angular admin list/create/edit
snapshot. Executed locally on Node 24.19.0, MariaDB 10.4.32 and headless Chrome.
All later changes in this record and handoff are local; no push or deployment.

| Layer | Result | Command |
| --- | --- | --- |
| Public/shared Angular tests | 52 passed | `npm test --prefix angular` |
| Admin Angular tests | 14 passed | Same command, admin target |
| Production builds | Both passed | `npm run build --prefix angular` |
| Public browsing/registration/weather browser checks | 20 passed | `node scripts/test-angular-public.cjs` |
| Production-built Angular public/admin integration | 10 passed | `node scripts/test-angular-integration.cjs` |
| Existing API, schema, concurrency and legacy browser regression | 80 passed, 0 failed, 0 skipped | `node scripts/test-joint-acceptance.cjs` |

Counts describe different test layers and are not a claim of 176 unique user
requirements. The backend count includes parent tests, as in the previous M11/M12
records. Those old records remain historical; this is a fresh execution.

## Joint production-build scenario

1. Create a future event in the Angular admin form with coordinates and 14:00
   Brisbane wall time, using a browser set to America/New_York.
2. Find it through Angular public search, open and directly reload its detail,
   and match weather to its event date using controlled provider data.
3. Register using the public Angular form, receive confirmation, and continue
   using keyboard Tab/Enter. The same attendee appears in Angular admin.
4. Change the event name/time in admin. Public reload shows 09:30 and retains
   the attendee. The existing API rejects deletion with EVENT_HAS_REGISTRATIONS.
5. Leave a public registration form open, suspend in Angular admin, then submit:
   the server rejects registration. The public detail becomes unavailable and
   the admin retains the original attendee.
6. Check direct/legacy URLs, unknown routes, skip link, API/error fallback,
   missing assets, and public widths of 320, 390 and 768 pixels.

No unhandled page errors or unintended extra registrations were recorded. Weather
failure/browser cases are mocked for determinism; the earlier separate live
Open-Meteo contract check is described in `angular-weather.md`. This is not a
cPanel, Apache, Passenger or production-login acceptance claim.

## Evidence and cleanup

Ignored local evidence:

- `submission/angular-public-checks/results.json` and screenshots.
- `submission/angular-integration-checks/results.json` and screenshots.
- `submission/test-joint-acceptance.cjs.log` (80-pass fresh run).
- `submission/test-angular-public.cjs.log` and `submission/test-angular-integration.cjs.log`.

The scripts created uniquely named empty databases and dropped only those owned
databases. Dedicated test servers and the dedicated MariaDB instance were stopped.
Existing business `.env`, data, user2 checkout, remote branches and cPanel were not
changed. Production public screenshots were visually reviewed.

## Limits and next integration

The admin snapshot does not yet implement the Angular delete UI. The test checks
its existing API safeguard and makes no claim about that future UI. User2's later
changes need a joint rerun. Deployment-specific fallback, auth, CORS/CSP and both
students' actual live URLs require separate online acceptance.
The final detail-card singular/plural wording was checked during the packaging
build after the test run; no application logic changed afterwards.
