# User2 Angular acceptance record

Updated 17 October 2026. Application main is `61f293c`, including PR #21. Runtime deployed to user2 combines public/API bytes from `8d4b71c` and admin bytes from `57fafcc`. Documentation and release evidence updates are local review changes, not yet pushed.

## Automated and local evidence

| Run | Scope and result | Boundary |
| --- | --- | --- |
| 15 October initial deployment candidate | 31 public/shared, 28 admin, 89 API test counts passed; both builds and isolated runtime browser flow passed | Before latest weather/appearance integration |
| 16 October main synchronisation | 53 public/shared, 28 admin, 89 API test counts passed; both production builds passed | 89 includes nine hosting test counts; do not add them twice |
| 16 October runtime candidate at 8d4b71c | Startup, login/logout, create, Angular registration, roster, pause/resume, edit retaining registration, deletion refusal, mobile, legacy navigation and private-path checks passed | Real temporary local database; local HTTP, not cPanel |
| Node 18 compatibility | User2 Node 18.20.0 hosting checks: nine passed. Teammate Node 18.20.8 startup/asset/login smoke passed | Exact 18.20.8 smoke did not query the school database |
| PR #21 appearance update | Teammate recorded admin production build, 28 admin tests, browser CRUD/registration protection and desktop/mobile checks passed | Restored management presentation; original author retained |

The 8d4b71c candidate result is in `submission/angular-release-2026-10-16T10-29-48-025Z/qa/result.json`. Earlier integration logs and screenshots remain under ignored `submission/`. These paths are development evidence; no screenshots or private test databases are implicitly published by this document.

## User2 online acceptance on 17 October

Environment: https://24832371.it.scu.edu.au, cPanel Node 18.20.8, Production, application root `a3-api`, startup `app.js`. The account holder performed these checks and confirmed each result during guided deployment; this is manual participant-reported evidence, not an automated production scan.

| Check | Confirmed result |
| --- | --- |
| API health, public homepage, admin login | Database connected; both applications open |
| Create event and public search | New test activity is visible, with matching information/time |
| Registration and roster | One test registration appears in public/admin lists with matching ticket count |
| Edit | Public information changes; original registration remains |
| Registered deletion | UI refuses/disables deletion; server rejection additionally has local API evidence |
| Suspend and resume | Public registration becomes unavailable, returns after resume; attendee remains |
| Empty-event deletion | Cancel preserves the event; confirm removes it after refresh |
| Detail and registration reload | Both deep links remain usable after F5 |
| Empty search | Clear message; clearing filters restores results |
| Logout and protected deep link | Logged-out visit requires login |
| Protected management API | Logged-out request does not expose event data |
| Duplicate email and invalid tickets | Duplicate rejected without increasing count; zero/fractional ticket input rejected |
| Mobile | Navigation, forms and lists reported usable without page-wide overflow |
| Weather | Normal display confirmed; missing-coordinate message does not prevent opening registration |

Test activities/registrations were deliberately labelled. The no-coordinate test activity was removed without registration. The registered demonstration activity can remain for the video; its live data is not substituted for the fictional seed SQL.

## Limits and status

Weather timeout, network failure, malformed-response and rate-limit cases have local automated evidence; a forced provider network outage was not simulated on the live site. Passenger worker count was not independently verified. Sessions are in memory and require single-process behaviour or a shared store for multiple workers. Successful manual login checks do not prove multi-worker support.

Video, peer evaluation and user2 deployment were reported complete. Teacher submission and final archive creation remain separate. GitHub access has been handled by the student and is not re-audited here.
