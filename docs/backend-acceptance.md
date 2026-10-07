# Backend acceptance and contribution
Backend author: Tianyi Li <id_09188388@foxmail.com>, as confirmed by the user.
A2 source: E:\workplace\aaaa\user2, commit 5c800ac884e4dc4c50e2ca01b87347416c116f0d.
A2 repository: https://github.com/zjsjsjjdjs/prog2002-charity-events.
The original A2 commits and Hongke Ouyang's M02–M05 commits are retained unchanged.
The earlier collaboration document uses historical user1/user2 labels; the current
backend identity is Tianyi Li and the registration author is Hongke Ouyang.

M01 is deferred at the user's request. Remote creation, invitations and pushes
remain manual pending tasks. Development branch: codex/tianyi-admin.
The teammate's uncommitted M11 timestamp fix remains in their own workspace and
must be included during final integration with its original attribution.

## M06 list and navigation
Implemented GET /api/admin/events, admin.html, name/location search, status filter,
registration totals, refresh, empty/error feedback and responsive navigation.
Public event filtering is unchanged. Past is derived from the Brisbane calendar
date; database status remains active or suspended. Create/edit entries are completed
in M07/M08 and deletion in M09.

Verified on 2026-10-07 with real MariaDB in an isolated user1_a3_test_admin_* database
and headless installed Chrome. Command from api:
`node --require dotenv/config --test test/m06-admin-list.test.js`.
Result: 3 acceptance cases plus parent test passed, 0 failed. Includes suspended
visibility, past public search, registration counts, network failure/recovery,
empty results and 390px mobile overflow check. A select accessible-name defect
was found in the initial run, corrected and verified.

The setup helper creates a new database from A2 plus the M02 migrations and stores
connection settings only in ignored api/.env. Never run acceptance tests against
production data. No original A2 or teammate data is changed.


## M07 new events
Implemented POST /api/admin/events and GET /api/admin/organisations, a category and
organisation-backed event form, and shared browser/API validation. Dates use Brisbane
local time; money respects database precision; optional coordinates must be a pair.
Errors preserve form input and distinguish invalid references from generic failures.
Saved names are rendered as text, including HTML-like strings.

Verified: node --require dotenv/config --test test/m07-create.test.js (from api).
Result: 3 acceptance cases plus parent passed, 0 failed, using real MariaDB and Chrome.
Covers persistence and refresh, malformed input, calendar/decimal/coordinate bounds,
foreign keys, media type, browser validation, escaped text and 390px layout.
