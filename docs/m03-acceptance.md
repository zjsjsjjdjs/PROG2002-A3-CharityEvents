# M03 acceptance — event detail and registration navigation

Verified on 2026-10-07 by Hongke Ouyang <2838356314@qq.com> against the
isolated MariaDB 10.4.32 database `user1_a3_test_20261007`.

- `node --test api/test/m03-detail.test.js`: 5 tests passed, 0 failed.
- `node --test api/test/m03-browser.test.js`: 4 tests passed, 0 failed,
  using installed Chrome in headless mode at 1280x900 and 390x844.
- Server and client JavaScript syntax checks passed.

Confirmed retained A2 detail fields, lists isolated by event, newest-first
ordering with stable ID tie-breaks, empty lists, omitted attendee emails,
400 invalid IDs, 404 missing/suspended events, rendered attendee names,
correct `register.html?id=3` navigation, disabled Register on invalid detail,
no mobile horizontal overflow and no browser JavaScript exceptions.

The destination registration page belongs to M05 and is not implemented in
this M03 commit; this check verifies the navigation URL only.
Local screenshots: `submission/m03-detail-desktop.png` and
`submission/m03-detail-mobile.png` (ignored by Git). Browser assertions passed;
the image preview tool was unavailable, so no separate visual screenshot review
is claimed. The built-in browser automation failed to initialize; reproducible
Playwright tests use the installed Chrome instead.

Install dependencies with `npm ci` inside `api`, set DB_HOST/DB_NAME as in the
M02 acceptance record, then run the commands above from the project root.
`BROWSER_CHANNEL` may select another installed Chromium browser (e.g. msedge).
The test server uses an automatically allocated port and closes afterwards.
