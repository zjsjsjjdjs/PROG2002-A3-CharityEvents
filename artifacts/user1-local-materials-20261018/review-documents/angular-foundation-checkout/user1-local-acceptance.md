# user1 local acceptance — status updated 17 October 2026

This record separates dated local tool results, student-confirmed online checks,
and the remaining final submission review. Updating this record does not rerun
all application tests, deploy code or create a final submission package.

## Version and deployment boundary

- Public implementation, registration, weather/error states, joint checks and
  restored public appearance were integrated through PR #19 (`bea6b17`).
- Integrated API/public and admin actions/deployment work are present in
  `8d4b71c` (including PRs #18 and #20).
- Restored Angular admin appearance is `57fafcc`, merged through
  [PR #21](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents/pull/21)
  as `61f293c`. Main was verified at `61f293c` during this update.
- The online installation uses the integrated `8d4b71c` release with the later
  `57fafcc` admin bundle. The user confirmed the restored public/admin layouts
  and the online flows below. This is a recorded deployment history, not a
  claim that every hosted file has been independently hashed.
- Assessment-feedback commit `4e31bee` adds source comments, an ERD and a
  documentation generator. Token comparison verified that all 17 changed
  application source files retain identical non-comment tokens. It introduces
  no application behaviour change requiring another cPanel deployment.

## Historical local executions: 15–16 October

Environment: Node 24.19.0, MariaDB 10.4.32 and headless Chrome. These executions
cover the earlier user1 stack and public appearance revision `d3f3878`.

| Layer | 15 October | 16 October public restoration |
| --- | --- | --- |
| Public/shared Angular tests | 52 passed | 53 passed |
| Admin Angular tests | 14 passed | No separate rerun in this public run |
| Production builds | Public and admin passed | Public passed |
| Public browser checks | 20 passed | 21 passed |
| Production-built public/admin integration | 10 passed | 10 passed |
| API/schema/concurrency/legacy regression | 80 passed, 0 failed, 0 skipped | No separate rerun |
| Final-built mobile Escape/focus check | Not separately recorded | Passed |
| Desktop/mobile comparison with old public site | Not this restoration run | Reviewed using the same local DB |

Counts cover different layers and must not be added as independent requirements;
the 80-result total includes parent tests. These historical results do not mean
all suites were rerun on the final merged main commit.

The joint scenario created a future event at 14:00 Brisbane time in a browser
using America/New_York, searched and directly reloaded its public detail,
registered an attendee, and verified that attendee in admin. Changing the event
time to 09:30 retained registrations; the API rejected deletion of a registered
event. Suspending an event while its registration form was open blocked the
subsequent submission. Checks also covered legacy/unknown URLs, keyboard use,
missing assets and widths of 320, 390 and 768 pixels. Automated weather cases
used controlled responses; the earlier live-provider check is described in
`angular-weather.md`. These local runs did not test Apache or Passenger.

## Later integrated admin restoration: 16 October

The restored candidate combined API/public from `8d4b71c` with the admin changes
subsequently committed as `57fafcc`, using Node 24.19.0 locally.

| Evidence | Recorded result |
| --- | --- |
| Admin production build | Passed; `main-OK6VEMMB.js`, `styles-RJBLR4YC.css` |
| Admin Angular tests | 28 passed in 2 files |
| Packaged application acceptance | 13 named checks passed |
| Admin appearance/interaction checks | 7 named checks passed, with desktop/mobile screenshots |

The 13 checks cover packaged startup, public deep reload, admin sign-in/out,
cookie/API protection, event creation, Angular registration, roster,
suspend/resume, edit preserving registrations, protected deletion, mobile use,
legacy-home redirect and blocked private files. This later run covers the merged
admin actions absent from the earlier user1 snapshot.

Appearance checks compare old/restored list and edit pages at 1440 and 390 pixels,
include create/roster pages, and check the 320-pixel form, invalid-submit focus,
empty search/clear filters, status filtering, cancelling/confirming deletion of
an unregistered local test event, and absence of unhandled browser errors.

A separate Node 18.20.8 compatibility check exercised actual packaged production
startup, static/deep routes, login/access protection and logout. It did not
connect to the school database or reproduce cPanel/Passenger. Angular compilation
was performed locally on Node 24.19.0, not on the school's Node 18 runtime.

## Online acceptance confirmed by the student

Deployment: [public website](https://24832591.it.scu.edu.au/) and
[Angular admin](https://24832591.it.scu.edu.au/admin/).
During the guided deployment and subsequent checks on 16–17 October, the student
provided screenshots and/or confirmed:

- Restored public homepage and admin list/edit layout load normally; returning
  from details to the list works.
- Public registration of the named test attendee “Final Deployment Test” with
  one ticket appears in the admin roster.
- Admin roster, new-event form/cancel, sign-in/out and public-site navigation work.
- Suspension prevents registration; the event was subsequently resumed to Active.
- Public detail/registration direct refresh, no-result search and clearing
  filters work; a fresh unauthenticated admin edit request leads to login.
- Weather displays normally or provides the applicable unavailable state. An
  earlier screenshot shows an event-day forecast and Open-Meteo attribution.
  Captured temperature values are observations, not fixed expected values.

These are student-confirmed manual checks, not a newly executed automated live
suite. No forced live weather-provider failure, live duplicate-registration
rejection or successful live deletion is claimed here; controlled/local tests
cover those cases where recorded. Another student's personal deployment has not
been independently checked in this record.

A separate read-only HTTP check on 17 October returned 200 for `/` and
`/api/health`; `/admin/` redirected to the login page and finished with 200.
This verifies those responses and the unauthenticated redirect only, not every
business operation or the complete database contents.

## Evidence locations and limitations

Raw outputs remain local and are not silently replaced by this narrative update.
Paths below are relative to the named local checkout, not tracked GitHub files.

| Checkout/evidence | Purpose |
| --- | --- |
| `submission/angular-foundation-worktree/submission/angular-public-checks/results.json` | Latest retained public run: 21 checks and screenshots |
| `submission/angular-foundation-worktree/submission/angular-integration-checks/results.json` | Latest retained earlier integration run: 10 checks and screenshots |
| `submission/angular-foundation-worktree/submission/test-joint-acceptance.cjs.log` | Historical 80-result regression run |
| `submission/angular-admin-appearance-worktree/submission/admin-build.log` and `admin-tests.log` | Later admin production build and 28 tests |
| `submission/angular-admin-appearance-worktree/submission/angular-deployment-qa/result.json` | Later packaged run: 13 checks |
| `submission/angular-admin-appearance-worktree/submission/admin-appearance-qa/results.json` | 7 appearance/interaction checks and screenshots |
| `submission/cpanel-node18-8d4b71c-check/node18-check-results.json` | Node 18 compatibility scope and limitations |
| `submission/angular-admin-appearance-worktree/submission/a2-feedback-review/live-link-check.json` | 17 October read-only HTTP results |

These paths start from the user's local `E:\workplace\user1-A3` directory.
The earlier retained terminal logs can have different counts from later-overwritten
JSON results. The 53-unit-test and final Escape/focus outcomes were observed in
tool execution; no separate complete saved terminal log was found for those runs.

The packaged result JSON contains an outdated boilerplate limitation mentioning
PR #17 and pending cPanel work. Its raw contents are preserved; the dated version
and online sections above supply the corrected context. It remains evidence of
local HTTP execution, not proof of live cPanel execution.

Database runners created uniquely named local databases and removed their own
test databases. They did not modify production data. Earlier test-process cleanup
does not establish the current status of subsequent local preview processes.

## Assessment feedback and final review boundary

The A2 feedback concerned the GitHub link, reusable page structure, documentation
comments and a missing report ERD. A3 has shared Angular shells; the feedback
change adds JSDoc contracts, a reproducible documentation generator and an ERD
matching the four-table schema in `database/a3-fresh-install.sql`. Generation
produced 49 documented blocks. This is not a claim of exhaustive API documentation.

The [A3 repository](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents)
remains public by student choice. Authenticated access succeeds; anonymous 404
is consistent with private access and is not evidence of a misspelled URL.

The student reports video, peer evaluation and cPanel deployment complete.
The final report/video files will be placed by the student for final review.
ERD inclusion in the actual final report, final link/access details, final archive
contents and Moodle submission/receipt still require that review. No final ZIP
is generated during this update, and no school submission is claimed complete.
