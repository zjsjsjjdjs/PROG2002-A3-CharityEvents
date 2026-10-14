# Deploy Harbour Hope to cPanel

Deploy the complete A3 application under each student's own cPanel account. The
supported layout serves the public pages, administration and /api from one
HTTPS domain or subdomain at its root. Do not upload the API directory into a
publicly served document root or run this Node application as a static-only site.

## Local startup

Install Node.js and dependencies with `npm ci --prefix api`.
Copy api/.env.example to api/.env only if the latter does not exist. Configure the
database, then run `npm start --prefix api`. The .env path is resolved relative
to api, so `node api/app.js` from the project root also works.
The start entry is app.js; server.js remains importable by tests.

Use http://localhost:3000 by default. /api/health must report a connected database.
The prepared acceptance environment has PORT=3001 and an isolated database.
Do not change the original A2 or teammate database to run tests.

## Environment settings

Store real values in the cPanel environment UI or a private api/.env, never in Git.

| Setting | Meaning |
| --- | --- |
| NODE_ENV | production on cPanel; development locally |
| HOST | 127.0.0.1 by default; use the hosting provider's required listener interface |
| PORT | 3000 by default; use the provider's assigned port when required |
| DB_HOST, DB_PORT | Account's database endpoint; default localhost and 3306 |
| DB_USER, DB_PASSWORD, DB_NAME | Each account's own prefixed database credentials |
| DB_CONNECTION_LIMIT | 10 by default; lower it to meet account connection quotas |
| DB_CONNECT_TIMEOUT | 10000 milliseconds by default |
| PUBLIC_ORIGIN | Production HTTPS origin, e.g. https://events.example.com, without a path |
| ADMIN_USERNAME | Administrator name; no colon |
| ADMIN_PASSWORD | Your own unique password, at least 16 characters in production |
| CORS_ALLOWED_ORIGINS | Optional comma-separated exact HTTP(S) origins; empty for this deployment |

Existing process environment variables take precedence over api/.env.
Production refuses to start without HTTPS PUBLIC_ORIGIN, both administrator
credentials and explicit DB_USER/DB_NAME. The local unauthenticated admin is
restricted to loopback clients and a localhost/loopback Host name. Do not use that
development mode as a public deployment.

The browser API base is the same-origin path /api in the existing public site.js
and the admin scripts. Changing domains therefore requires no frontend host edit.
Open the site through its server, not by double-clicking HTML files. This guide
uses a dedicated domain/subdomain root; a subdirectory installation needs coordinated
frontend path changes and is outside the validated layout. CORS does not provide
authentication. Allowed origins enable separate API consumers; they do not relocate
the supplied UI. Administrator writes must originate from PUBLIC_ORIGIN.

## Prepare files and a fresh database

1. In cPanel create a fresh database and database user, assign the user the required
   privileges, and record the actual account-prefixed names privately.
2. Generate the install script with `node scripts/build-deployment-sql.cjs`.
   In phpMyAdmin select that EMPTY database and import database/a3-fresh-install.sql.
   It contains organisations, categories, events, registrations and fictional samples.
   It does not contain DROP DATABASE, CREATE DATABASE or a hard-coded USE statement.
   Never import it over existing data. Existing A2 installations use the original
   M02 migration and sample scripts once, after backup, instead.
3. Upload api and clientside as siblings, for example under ~/apps/harbour-hope/.
   Exclude .git, node_modules, api/.env, submission, logs and local test captures.
   Install dependencies on the server using `npm ci --omit=dev` inside api.
   Keep database scripts outside the public document root.

## Register the Node application

Check which interface your hosting account provides. Application Manager requires
provider-enabled Node.js/Passenger support. In that interface register the
application path apps/harbour-hope/api, select the HTTPS domain, use base URL /,
and choose production mode. The supplied app.js follows Passenger's expected
startup filename. Set the environment variables above, install dependencies and
enable the app. Restart after changes using the interface or by updating
api/tmp/restart.txt when required by the provider.
[cPanel Application Manager](https://docs.cpanel.net/cpanel/software/application-manager/),
[cPanel Node application guide](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/).

If the account instead has CloudLinux **Setup Node.js App**, select an available
supported Node version, production mode, the same application root and URL, and
startup file app.js. Add environment variables and use its dependency installation
and restart controls. Follow the activation command shown by that account before
using its terminal npm.
[CloudLinux Node application controls](https://docs.cloudlinux.com/cloudlinuxos/lve_manager/).

Local acceptance used Node 24.10.0. The code uses Node's built-in test runner and
fetch, so use Node 22 or 24 for reproducing the full checks. The actual hosting
runtime must be verified on that account. If Node application support is absent,
ask the hosting administrator to enable it; uploading HTML alone cannot run Express.

## Verify each personal deployment

1. Open /api/health and verify the database is connected.
2. Check homepage, search, detail, categories and registration with fictional input.
3. Visit /admin.html. Verify a private browser window requires administrator login.
4. Create an event, refresh, edit it, and confirm the public page reflects the change.
5. Register for that event publicly, inspect it in admin, and confirm deletion is
   refused. Verify an event with no registrations can be deleted after confirmation.
6. Suspend an event and verify it is still editable in admin and hidden publicly.
7. Confirm /.env, /api/.env, /.git/config and /api/event_db.js return 404.
8. Record your own deployed URL, runtime, date and results in the final handoff.
   Restart after environment changes. Do not put credentials in screenshots or video.

A 503 or startup error can indicate missing production settings; a health-check
failure can indicate database service, hostname, credentials or privileges.
A missing Node interface requires the hosting provider. Application logs should
be checked privately. No actual cPanel deployment was performed during local
development; these are the steps for the account owner to execute.

## Demonstration and individual work

For your personal video of at most 15 minutes, demonstrate the original browsing
flow, registration, all admin operations and the protected-delete case, then show
your own module commits and deployment configuration without revealing secrets.
Record your own explanation and complete your own peer-assessment form.
