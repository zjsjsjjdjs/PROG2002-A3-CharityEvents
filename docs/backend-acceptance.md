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

## M08 edit events and view registrations
Implemented GET and PUT /api/admin/events/:id. The admin detail endpoint includes
all editable fields and reuses getEventRegistrations; unlike the public detail
endpoint it also returns suspended events. Update locks the event in a transaction
and changes only event fields, leaving all registration IDs and records intact.
The browser prefills Brisbane local time and displays the existing attendee list.

Verified: node --require dotenv/config --test test/m08-update.test.js (from api).
Result: 5 acceptance cases plus parent passed, 0 failed. Covers public data updates,
unchanged saves, suspended-event editing, invalid IDs and foreign keys, browser
prefill/save, and preservation of a registration created through the public API.

## M09 delete events and protect registrations
Implemented DELETE /api/admin/events/:id with browser confirmation. The API locks
the parent event before checking registrations, matching createRegistration's
lock order. Existing registrations produce 409 EVENT_HAS_REGISTRATIONS and are
never cascaded. Missing events return 404; invalid IDs return 400.

Verified: node --require dotenv/config --test test/m09-delete.test.js (from api).
Result: 4 acceptance cases plus parent passed, 0 failed. Includes browser cancel,
confirmed deletion, rejection feedback, public registration appearing in admin,
and five registration/delete races with no successful registration lost or orphaned.
This completes the backend portion of the M11 cross-module registration/delete check;
the teammate's uncommitted public timestamp regression and final joint M11 record
still require integration.

## M10 deployment and final local checks
Implemented anchored api/.env loading, configurable database host/port/pool limits,
Passenger app.js startup, explicit CORS allowlists, and production administrator
HTTP Basic authentication. Production requires an HTTPS origin and explicit admin
credentials; development without credentials is limited to loopback access.
The fresh-install SQL uses the operator-selected empty database and preserves
schema/sample attribution. Backend API/operation and cPanel guides are included.
No cPanel account or remote repository was accessed.

Verified: node --require dotenv/config --test test/m10-deployment.test.js (from api).
Four acceptance cases plus parent passed. Includes configuration validation,
authenticated/unauthenticated requests, cross-site write rejection, actual fresh SQL
import (four tables, eight events, twelve registrations), startup from the project
root, anchored environment lookup, allowed/disallowed CORS origins, database health
and private file paths returning 404.

Final full regression: npm test --prefix api, 61 passed and 0 failed (51 acceptance
cases and 10 parent tests), on 2026-10-07. This covers committed M02–M05 plus M06–M10;
it does not include Hongke's uncommitted M11 public timestamp regression test.
Desktop and mobile directory/edit screenshots were inspected. A hidden retry button
was incorrectly displayed because of the button display style; the hidden rule was
fixed and browser assertions now cover it. Screenshots are local ignored artifacts
in submission/admin-desktop.png, admin-mobile.png, edit-desktop.png and edit-mobile.png.

## Remaining integration boundary
M01 remains deferred. M06–M10 are local module commits on codex/tianyi-admin.
The teammate's uncommitted M11 server.js date serialization fixes remain untouched.
Ask the registration contributor to finish and commit that work with their own Git
identity, then combine it with the backend branch and run the joint regression
before final main-branch integration. M12 final assembly, actual cPanel deployment,
video and peer-assessment submission remain separate work.
