# PROG2002 A3 Charity Events

Harbour Hope combines the original A2 event browsing and search with public
registration and an activity management backend. Registered events cannot be
deleted; updates and suspension preserve their registration records.

- user1: Hongke Ouyang <2838356314@qq.com> — registration, integration and delivery assembly.
- user2: Tianyi Li <id_09188388@foxmail.com> — original A2 author, administration and deployment configuration.
- A2 source: https://github.com/zjsjsjjdjs/prog2002-charity-events (public).
- A2 baseline: 5c800ac884e4dc4c50e2ca01b87347416c116f0d. Original commits and authors are retained.
- A3 team repository: [PROG2002-A3-CharityEvents](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents) (public).
- GitHub accounts: user1 Sakitam630; user2/repository owner zjsjsjjdjs.
- M02-M11 and follow-up fix 26cb134 are merged into main through PR #12. M12 is delivered as a separate documentation PR.

## Start locally

1. Create an empty MySQL/MariaDB database and import database/a3-fresh-install.sql into it.
2. Install locked dependencies: npm ci --prefix api.
3. Copy api/.env.example to api/.env only if absent. Configure DB_HOST, DB_PORT,
   DB_USER, DB_PASSWORD and DB_NAME for that database.
4. Run npm start --prefix api, then open http://localhost:3000/ and /admin.html.
   Use the configured PORT if different. /api/health should report a connected database.

Keep api and clientside as siblings. The entry point is api/app.js. No frontend
build is required. Development administration without credentials is restricted
to loopback access. Production requires HTTPS and explicit admin credentials.

## Angular migration

The [Angular workspace](angular/README.md) contains public and admin applications.
Public home, search, detail, registration and event-day weather are implemented.
The current local snapshot includes user2's admin list/create/edit work; remaining
admin features and live hosting are coordinated separately. Start Angular using
its own README; the original `clientside` pages remain for regression coverage.
See [user1's local handoff](docs/user1-angular-handoff.md) and
[local acceptance evidence](docs/user1-local-acceptance.md) for production builds,
verified scope, packaging and outstanding deployment work.

## Verification and delivery

Code 26cb134 passed 80 tests on 2026-10-07 using Node 24.10.0, MariaDB 10.4.32 and Chrome. This is the recorded full regression result; the M12 documentation upload does not claim a new application test run.
Run node scripts/test-joint-acceptance.cjs using a local test connection with
permission to create disposable databases. It keeps api/.env unchanged.

- [Full delivery guide and contributions](docs/a3-delivery.md)
- [Backend operation and API](docs/backend-guide.md)
- [cPanel deployment](docs/cpanel-deployment.md)
- [Final technical checks](docs/final-technical-checks.md)
- [Manual acceptance checklist](docs/final-manual-checklist.md)
- [Collaboration and source](docs/a3-collaboration.md)
- [Documentation index](docs/README.md)
- [Historical A2 README](docs/a2-readme-history.md)

See the [M12 packaging and delivery checklist](docs/m12-delivery-checklist.md) for a reproducible source archive and remaining individual tasks. Manual acceptance and personal deployment evidence have not been supplied; do not infer completion from the automated results.
