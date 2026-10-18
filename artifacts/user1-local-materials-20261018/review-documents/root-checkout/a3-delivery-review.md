# A3 Delivery Notes Review Draft

Status: Pending modification and confirmation by user2. The code version is 26cb134 and has passed local automated acceptance. This note and the related draft documents are not yet finalized. M12 has not been submitted, and main has not been merged.

## Project Summary

Harbour Hope A3 adds public registration and an activity management admin backend on top of the original A2 activity browsing system. Visitors can browse and search activities, view details and the registration list, and complete registration by entering a name, email, and number of tickets. Administrators can view all activities, create, edit, pause, and delete activities. Activities that already have registrations cannot be deleted. Editing or pausing an activity does not remove existing registration records.

Activity times are uniformly displayed in the Australia/Brisbane time zone. Registration emails have leading and trailing spaces removed and are converted to lowercase. The same email can register for different activities, but can only register once for the same activity. The public list shows name, number of tickets, and registration time; it does not show the registration email. This project does not include payment processing or ticket capacity control.

## Identities and Contributions of Both Parties

This delivery uses the following identities uniformly. Historical Git author information remains unchanged.

| Role | Name and Git Email | Main Contributions |
| --- | --- | --- |
| user1 | Hongke Ouyang，2838356314@qq.com | M02 registration database and samples; M03 details and list; M04 registration API; M05 registration page; M11 joint testing and time correction; three issue fixes in this round; M12 delivery materials organization pending review |
| user2 | Tianyi Li，id_09188388@foxmail.com | Original A2 author; M06 admin list; M07 create activity; M08 edit and list; M09 delete protection; M10 deployment configuration and instructions; team repository work has been confirmed completed by the author |

Hongke Ouyang’s registration module added registration constraints, frontend and backend validation, the activity details registration list, and the complete registration flow, and completed cross-module verification after integration. The subsequent fixes in this round were committed under Hongke’s Git identity, while the contribution records of Tianyi’s original admin modules are preserved.

Tianyi Li provided the original A2 baseline and completed admin activity management and deployment support, including the activity list, create, update, delete protection, admin access control, database connection configuration, and cPanel deployment guidance. The actual personal deployments, videos, and peer reviews of both individuals should be recorded separately and should not be replaced by local testing.

| Module | Commit | Author |
| --- | --- | --- |
| M02 | 4a73ac8 | Hongke Ouyang |
| M03 | 201b202 | Hongke Ouyang |
| M04 | 5dde68b | Hongke Ouyang |
| M05 | 43bc8f2 | Hongke Ouyang |
| M06 | becc5aa | Tianyi Li |
| M07 | b7cc357 | Tianyi Li |
| M08 | 7c65393 | Tianyi Li |
| M09 | bedb09c | Tianyi Li |
| M10 | 06c0b0a | Tianyi Li |
| M11 | 3972153 | Hongke Ouyang |
| Three subsequent fixes | 26cb134 | Hongke Ouyang |
| M12 | To be submitted after confirmation of this draft | Hongke Ouyang |

## Project Origin and Repository Notes

The original A2 author is Tianyi Li. The source is https://github.com/zjsjsjjdjs/prog2002-charity-events, and the baseline commit is 5c800ac884e4dc4c50e2ca01b87347416c116f0d. A3 retains the original A2 history and the existing module commits of both parties. No partner’s module was rewritten under another person’s authorship.

user2 has confirmed that team repository-related matters are complete. The new A3 repository address ishttps://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents，The A2 address above must not be used to impersonate the A3 address. No push was performed in this round.

The integrated code is located at E:\workplace\user1-A3 on the branch codex/user1-registration. user2’s original directory E:\workplace\user2-A3 remains unchanged. The M12 local commit and main merge will only be completed after the documents and final manual testing are confirmed. Upload will be arranged by the team after the final version is confirmed.

## Database and Final SQL

The complete installation file is database/a3-fresh-install.sql. It contains four tables: organisations, categories, events, and registrations. The sample data consists of 1 organisation, 5 categories, 8 activities, and 12 fictional registrations. The file includes primary and foreign keys, a unique constraint on email per activity, and a positive ticket quantity constraint. It does not contain DROP DATABASE, CREATE DATABASE, or fixed USE statements.

In a database tool, first create and select an empty database, then import this file. Do not overwrite an existing business database. To upgrade an existing A2 database, make a backup and then execute database/m02-registrations.sql and database/m02-registration-samples.sql in sequence. Do not re-import the complete installation file.

The complete SQL is a reproducible delivery version of the structure plus project sample data. It does not include temporary activities, real registrations, or personal connection configurations generated during the two individuals’ manual testing. The generation command is node scripts/build-deployment-sql.cjs. After regeneration in this round, the content is consistent with the file in the version, and empty-database import verification passed.

The main fields of registrations are registration_id, event_id, name, email, registered_at, and tickets. A composite unique constraint on event_id and email prevents duplicate registration. The foreign key on the associated activity prohibits deletion of activities that have registrations. Activity DATETIME values use Brisbane local time; the API returns times with a +10:00 offset. Registration times are returned as UTC ISO strings.

## Local Startup

The verification environment for this round is Windows, Node.js v24.10.0, MariaDB 10.4.32, and local Chrome.

1. Start MySQL or MariaDB, create an empty database, and import database/a3-fresh-install.sql.
2. Keep api and clientside as sibling directories. In the project root, run npm.cmd ci --prefix api.
3. If api/.env does not exist, copy api/.env.example to api/.env and fill in DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME. Use NODE_ENV=development locally.
4. Run npm.cmd start --prefix api. The entry point is api/app.js. It binds to 127.0.0.1 by default and uses port 3000 by default.
5. Open http://localhost:3000/ and http://localhost:3000/admin.html, and check that /api/health returns that the database is connected. If another port is configured, use the actual PORT value.

.env is kept only in the local or deployment environment and is not committed or packaged. Development mode without admin credentials configured allows access only from the local machine. After admin credentials are configured, the corresponding username and password are used. Production uses HTTPS, explicit database configuration, and an ADMIN_PASSWORD of at least 16 characters. Detailed steps are in docs/cpanel-deployment.md.

The current deployment plan uses the root path of the same domain or subdomain, with pages and /api on the same origin. The actual cPanel deployments of both individuals still require their own login and acceptance.

## 接口汇总

| Method| Path | Description |
| --- | --- | --- |
| GET | /api/health | Database health check |
| GET | /api/categories | Activity categories |
| GET | /api/events/upcoming | Public activities from today onward in Brisbane |
| GET | /api/events/search | Combined search by date, location, categoryId; allows past active activities |
| GET | /api/events/:id | Active activity details and reverse-ordered registration list |
| POST | /api/events/:id/registrations | Submit name, email, and ticket quantity |
| GET | /api/admin/events | All activities, status labels, and registration counts |
| GET | /api/admin/organisations | Optional organisations |
| GET | /api/admin/events/:id | Editable fields and list, including suspended activities |
| POST | /api/admin/events | Create activity |
| PUT | /api/admin/events/:id | Full update of activity fields; registrations are retained |
| DELETE | /api/admin/events/:id | Delete activity with no registrations; rejected if registrations exist |

Registration requests use Content-Type: application/json. Example request body:

```json
{"name":"Alex Chen","email":"alex@example.com","tickets":2}
```

On success, HTTP 201 is returned with {message, registration}. The registration object includes the registration ID, activity ID, name, normalized email, ticket quantity, and registration time. The success response received by the requester includes the submitted email; the public details list does not include the email.

The name must be 1 to 120 characters. Contact information uses email. tickets must be a JSON integer from 1 to 2147483647. Main errors are 400 parameter error, 404 activity does not exist or is paused, 409 DUPLICATE_REGISTRATION for duplicate registration, 409 EVENT_HAS_REGISTRATIONS when deletion is prohibited, 413 request too large, 415 content type error, and 500 internal error. The format is {code, message}. Admin field validation may also include fields. Admin access has additional 401, 403, and 503 responses for non-local access when credentials are not configured.

## Acceptance and Fixes in This Round

The full regression consists of 80 items passed, 0 failed, and 0 skipped, of which 67 are acceptance sub-items and 13 are parent tests. Coverage includes original A2 browsing and search, registration, admin CRUD, shared data between frontend and admin, concurrent registration and deletion, unified time handling, startup configuration, and complete SQL import.

Three new regression sub-items all failed before the fix and all passed after the fix:

- When list refresh fails or is still loading, search and filter do not restore the old list, nor do they erase the error or loading message. After the network is restored, refresh can display results normally.
- The edit page rejects duplicate ids, empty values, non-integers, and parameters outside the activity ID range, while retaining valid edit and create entry points.
- The test database initialization script checks the target .env before reading source configuration or connecting to the database, and exits immediately if it exists. Configuration writing uses exclusive creation to avoid overwriting.

The re-verification command is node scripts/test-joint-acceptance.cjs. It creates an independent test database, imports the complete SQL, runs the serial tests, and then cleans up only the database created in this run. The M10 startup test also reads the database pointed to by the local api/.env for a health check; that path does not write business data.

The complete test log is in submission/final-after-fix.log. Evidence from before the fix is in submission/final-before-fix.log. The three issue fixes have been committed locally. Manual final acceptance is pending completion by user2. Detailed steps are in docs/final-manual-checklist.md.

## Scope for Finalization

Please modify and confirm the project summary, identities and contributions of both parties, A3 repository address, and repository status in this draft. After confirmation, README.md、docs/a3-collaboration.md、docs/backend-guide.md、docs/backend-acceptance.md、docs/m11-acceptance.md、docs/README.md、api/README.md 和 database/README.md。

Existing A2 acceptance records are retained as history. The entry points will indicate the current A3 documents to avoid old statements such as “registration not implemented,” “no npm test,” or “DB_PORT not supported” being treated as the current status. The original 61-item records for M06–M10 and the original 76-item records for M11 retain their historical meaning. The current final regression is recorded separately as 80 items.

After this draft is confirmed and final manual testing is completed, M12 will be submitted as a separate commit, the local main will be merged, and the final package will be assembled. Actual cPanel deployment, videos of no more than 15 minutes each, and peer review will be completed separately by the two individuals.
