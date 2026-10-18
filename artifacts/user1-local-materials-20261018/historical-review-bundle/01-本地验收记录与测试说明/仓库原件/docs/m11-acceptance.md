# Current integration status

User1 is Hongke Ouyang; user2 is Tianyi Li. The candidate contains both contributors' modules, M11 time fixes and the three final follow-up fixes. Recorded full regression on 2026-10-07:
80 passed, 0 failed. See final-technical-checks.md and a3-delivery.md.
M02-M11 and follow-up fixes are merged in the [A3 repository](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents) through PR #12. M12 assembles the final documentation; individual manual/deployment evidence remains unreported. See [current delivery status](m12-delivery-checklist.md).

## Historical acceptance record

The dated record below describes its original commit boundary. Pending items and
61/76-test counts below are historical; the current status above supersedes them.

# M11 joint integration acceptance — complete locally

Owner: Hongke Ouyang <2838356314@qq.com> (user1, registration and integration).
Backend contributor: Tianyi Li <id_09188388@foxmail.com> (user2).
Verified on 2026-10-07. Local integration is complete; no remote push, main-branch
merge or actual cPanel deployment is claimed.

## Integrated source and attribution

The working delivery candidate is E:\workplace\user1-A3, branch
codex/user1-registration. This branch fast-forwarded from 43bc8f2 to user2's
06c0b0a, then restored the pending M11 work. Both contributors' original module
commits and the A2 ancestor 5c800ac remain unchanged. The user2 source directory
E:\workplace\user2-A3 was read/fetched locally, not modified.

| Contributor | Module | Original commit |
| --- | --- | --- |
| Hongke Ouyang | M02 database and 12 registration samples | 4a73ac8 |
| Hongke Ouyang | M03 detail and attendee list | 201b202 |
| Hongke Ouyang | M04 registration API | 5dde68b |
| Hongke Ouyang | M05 registration page | 43bc8f2 |
| Tianyi Li | M06 admin directory | becc5aa |
| Tianyi Li | M07 create event | b7cc357 |
| Tianyi Li | M08 update and registrations | 7c65393 |
| Tianyi Li | M09 protected deletion | bedb09c |
| Tianyi Li | M10 deployment configuration | 06c0b0a |

The package.json startup conflict was resolved in favour of M10's node app.js.
The shared serial test command was retained. M11 changes only the public search
and detail timestamp expressions in server.js; admin routing, authentication,
CORS, startup and configured database helpers remain intact.

## Time correction

A2 stores Brisbane-local DATETIME values. The old public search/detail queries
allowed the database driver to interpret them in the host timezone. Event 3's
stored 14:00 consequently displayed as Brisbane 16:00 on the UTC+8 host.
Both queries now use the same explicit SQL DATE_FORMAT serialization as the
homepage and admin APIs: 2026-10-11T14:00:00+10:00. Registration timestamps keep
their existing UTC ISO format.

## Reproduce the full joint acceptance

Requirements: installed Node.js, dependencies installed with npm ci --prefix api,
a running MySQL/MariaDB service, an ignored api/.env containing local test
connection settings, and installed Chrome (or BROWSER_CHANNEL=msedge for Edge).
The database user needs permission to create and dispose isolated test databases.
The existing api/.env database must also be a local test database because the M10
startup check deliberately loads it and checks health using read-only HTTP calls.

From the project root:

```powershell
node scripts/test-joint-acceptance.cjs
```

The runner imports database/a3-fresh-install.sql into a new uniquely named
user1_a3_test_joint_* database, passes its name to the entire serial test suite,
and disposes only that invocation's database afterwards. It does not overwrite
api/.env or use either contributor's existing database for test mutations.
M10 also creates and disposes its own fresh-install test database. The anchored
startup check reads the existing local connection settings and performs only
health/page/CORS/private-path checks.

Result: **76 passed, 0 failed, 0 skipped** (64 acceptance cases and 12 parent tests).
Tests ran against real MariaDB and installed headless Chrome. Output is retained
locally in submission/m11-joint-test.log, ignored by Git. No external service or
remote repository was used for this verification.

| Scenario | Result and evidence |
| --- | --- |
| Admin-created event visible publicly | Passed; homepage, search, public detail and admin list/detail share the same event and timestamp |
| Full browser registration for an admin-created event | Passed; detail → Register → confirmation → detail, then the admin editor shows the same name and ticket quantity |
| Shared data and privacy | Passed; direct DB row matches submitted data, admin/public registration arrays match, public lists omit contact email |
| Duplicate registration | Passed; trimmed case-insensitive duplicate email returns 409, one row remains |
| Same email across different events | Passed in retained M02/M04/M05 tests |
| Invalid tickets | Passed; zero, negative, fractional, string and overflowing values return 400 |
| Update and timestamp consistency | Passed; new timestamp appears in all APIs, registration ID/content retained |
| Browser timezone independence | Passed; New York browser sees Brisbane 14:00, Shanghai browser sees updated Brisbane 09:30, admin input retains local wall-clock time |
| Suspension | Passed; admin retains event/registrations, public detail and new registration return 404 |
| Delete with registrations | Passed; active and suspended registered events both return 409 EVENT_HAS_REGISTRATIONS |
| Delete without registrations | Passed; event disappears and later registration returns 404 |
| Concurrent registration/deletion | Passed in retained M09 test, five races, no orphaned or lost successful registration |
| A2 homepage/search regression | Passed; active/upcoming filtering, past-event search, AND filters, reset, empty/invalid results |
| Deployment configuration regression | Passed locally; authentication, CORS, fresh SQL import, startup and private path protection |

## Remaining delivery boundaries

M11 acceptance covers the integrated registration/admin workflow and time fix.
The following previously reported backend issues were not changed by this scoped
integration and remain follow-up work before final delivery:

- Failed admin refresh followed by filtering can clear the error and show cached data.
- The admin editor accepts repeated id parameters instead of rejecting ambiguity.
- prepare-admin-test-db.cjs checks for an existing .env after creating a database.
  The M11 runner above does not use that helper and does not modify .env.

M12 final document/SQL assembly and final main-branch integration remain pending.
The user reports that a new team repository exists; its URL and eventual upload
are still to be handled. Nothing was pushed. Earlier documents describing the
repository as not yet created are historical and need reconciliation in M12.
Each person's actual cPanel deployment, video (at most 15 minutes) and individual
peer-assessment submission must be completed and recorded separately. The current
validated deployment layout remains a same-origin domain/subdomain root.
