# Angular registration workflow

user1: Hongke Ouyang / Sakitam630. Prepared as a separate registration PR on main
`be283db`, after public pages PR #15 and admin pages PR #16 were merged. Implemented
with Codex assistance. Upload was authorized after local acceptance; this change
does not deploy anything to cPanel.

## User flow

Open an event, choose Register, review the event summary and complete name, email
and ticket quantity. A reactive Angular form validates against the existing API
rules and normalises whitespace/email case. Invalid input identifies the affected
fields. While submitting, the form is disabled and repeated submits are ignored.

A confirmed response replaces the form with a receipt containing the attendee's
name, ticket quantity, registration reference and Brisbane registration time.
Choose View event details to reload the event and its newest-first attendee list.
Search filters survive this round trip. There is no automatic redirect that could
hide the confirmation before it is read, and no personal data in URLs or browser
storage. Reloading starts a fresh form; the database still prevents duplicates.

Duplicate-email conflicts preserve input. A removed/suspended event blocks further
submission. Network errors, timeouts and unexpected responses give an uncertain-
result warning: check event details before retrying. POST requests are never retried
automatically. Navigating to another event cancels the obsolete client request and
clears personal input; cancelling a client request cannot undo a server-side save.

## Routes and integration

- `/events/:id/register`: Angular registration.
- `/register.html?id=...`: compatible legacy URL handled by Angular.
- Detail buttons use RouterLink, preserving search filters.
- `proxy.public.conf.cjs` and the legacy registration token are removed. Both dev
  apps now use `proxy.conf.cjs`, which forwards `/api/**` only.
- Shared services, admin app, Express registration endpoint and database schema
  are unchanged. Existing server-side validation/unique keys remain authoritative.

For public deployment, build the Angular public app and serve client routes,
including the legacy aliases, through its index.html. Keep `/api/**` routed to
Express. Do not copy old clientside HTML on top of the Angular build: an old
register.html would bypass the Angular alias. For a subdirectory deployment,
configure the build base href and API prefix as described in the workspace README.
Actual cPanel deployment is separate and has not been performed here.

## Validation (2026-10-15)

- After updating to main `be283db`: public/shared 31 tests and admin 14 tests passed
  (45 total). The earlier local run had 31 public/shared plus 1 foundation admin test.
- Both production builds passed. Public initial bundle about 348 kB raw / 91 kB
  estimated transfer, within the existing budget.
- Before the base update, 15 headless Chrome checks passed against real Express
  and MariaDB 10.4.32 in an
  isolated test database. Cases include public browsing regression, actual Angular
  registration and fresh attendee display, case/space duplicate rejection, same
  email for another event, network failure/retry, mid-flow suspension, legacy URLs,
  invalid IDs and all four public pages at 390 px. No page errors were observed.
  The public application and API are unchanged by the base update; these browser
  checks were not rerun for upload. The rebuilt public bundle hashes are unchanged.
- Registration screenshots were visually reviewed. The temporary database and
  servers were disposed and the dedicated MariaDB instance was shut down.

Reproduce using the commands in angular/README.md and
`node scripts/test-angular-public.cjs`; the runner is updated to exercise Angular
registration rather than the old HTML bridge. Test fixtures never touch live data.

Weather is not part of this change. The prior public PR has not been rewritten or
updated by this separate follow-up.
