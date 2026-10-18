# Angular cPanel deployment and upgrade

Updated 17 October 2026 by user2, Tianyi Li. This records the actual user2 upgrade and the procedure confirmed during guided manual acceptance. Public and API content came from `8d4b71c`; the restored management build came from `57fafcc`. Both are included in final main `61f293c`.

## Confirmed user2 configuration

| Setting | Value |
| --- | --- |
| Account home | `/home/tli30` |
| Application root | `a3-api` (retained) |
| Startup file | `app.js` |
| School Node runtime | 18.20.8 |
| Application mode | Production |
| Application URL | Domain root, path field empty |
| PUBLIC_ORIGIN | `https://24832371.it.scu.edu.au` |
| APP_FRONTEND | `angular` |
| ANGULAR_PUBLIC_DIR | `/home/tli30/a3-angular-57fafcc/frontend/public` |
| ANGULAR_ADMIN_DIR | `/home/tli30/a3-angular-57fafcc/frontend/admin` |
| Database name | `tli30_charityevents_db`, original A3 database retained |

Database and administrator passwords are intentionally excluded. The application's admin account is separate from the cPanel account. Each member must use their own account paths, database credentials and domain.

## Build versus server runtime

Angular was built locally with Node 24.19.0, Angular 22.2.3, CLI 22.2.2 and TypeScript 6.0.3. The cPanel Node 18.20.8 process runs Express and serves prebuilt JavaScript/CSS; it does not run Angular CLI or ng serve. Local Node 18 hosting tests and the teammate's exact 18.20.8 startup smoke test preceded deployment; participant-confirmed live health/login checks verified this installation. These are compatibility observations, not a claim that Node 18 is an appropriate long-term runtime for every deployment.

## Upgrade the existing A3 installation

1. Back up `a3-api`, `clientside` and `public_html`, including existing hidden configuration files, and download a separate MySQL database backup. Keep backups outside public web directories.
2. Record the existing Node application settings and privately save environment values. This installation stores credentials in the Node application panel; a `.env` file is not required.
3. Keep **Application root = a3-api**. On the teammate's account, changing it to an already populated directory partially moved the runtime and failed on existing files. Do not manually relocate `nodevenv`, copy its runtime or replace `.htaccess` as part of this upgrade.
4. Update the API code in `/home/tli30/a3-api`. Retain the cPanel-managed `node_modules` link and private settings. Place both Angular builds under `/home/tli30/a3-angular-57fafcc/frontend/`. Keep `clientside/assets/js/admin-validation.js` at its original sibling path; the API still imports it.
5. Preserve existing DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and administrator variables. Add APP_FRONTEND and the two absolute Angular directories above. PUBLIC_ORIGIN must be the actual HTTPS origin without a page path. Do not duplicate environment-variable names.
6. Save, install production API dependencies in the panel's application environment (`npm ci --omit=dev`, or the panel's Run NPM Install action), and Restart. Application availability may be interrupted during replacement and restart.
7. Check `/api/health`, public `/`, and `/admin/login`, then execute the business acceptance checklist. A successful restart alone is not acceptance.

The upgrade does not reinitialise the existing database. Do not import `a3-fresh-install.sql` into it. If only an A2 database is present, inspect its schema and use the documented registration migration after backup; do not assume it is already A3.

## Fresh installation and portable review files

For a genuinely new installation, create an empty database, grant a dedicated user the required rights, and import `database/a3-fresh-install.sql`. It contains four tables, one organisation, five categories, eight activities and twelve fictional registrations.

The review folders use a portable layout: `api/`, `frontend/public/`, `frontend/admin/` and `clientside/assets/js/admin-validation.js`. Merge the three `runtime` directories into one empty local directory. For that portable layout, Angular directories may be `../frontend/public` and `../frontend/admin` relative to `api`. The existing cPanel upgrade uses the absolute paths above instead. These are different layouts; do not mix their path values.

Required production settings are NODE_ENV=production, APP_FRONTEND=angular, HTTPS PUBLIC_ORIGIN, DB connection fields, ADMIN_USERNAME and ADMIN_PASSWORD (at least 16 characters). Use `.env.example` only as a template; keep real values private. Preserve the host's working HOST/PORT settings. Both apps use `/api` on the same origin; CORS_ALLOWED_ORIGINS can remain empty. Weather is requested directly from `https://api.open-meteo.com`; a host-level CSP must permit that connection.

## Access and routing

Management pages, assets and APIs are protected. Browser login uses an HttpOnly, SameSite=Strict cookie; production adds Secure. Sessions expire after one hour and disappear when the process restarts. Login retry limits and same-origin write checks are implemented. Existing explicitly supplied HTTP Basic API clients remain supported, but the normal Angular flow uses the login form.

Sessions are stored in one Node process. Live login/logout worked in the observed account, but the Passenger worker count was not independently inspected. Multiple workers require a shared session store or verified single-process configuration. This is a known operational limitation, not a tested multi-worker deployment.

Public and admin deep links return their respective Angular index files. Unknown API routes and missing assets must not become successful HTML responses. `/admin.html` and `/admin-event.html` redirect to Angular administration. Keep base href `/` for public and `/admin/` for admin.

## Recovery and evidence

If an update fails, restore the backed-up API/frontend files and previous environment values, then restart. Retain the existing database; restoring old SQL could erase newer registrations. Read the application log privately and redact credentials before sharing it. Static-only appearance updates do not normally require restarting Node, but replacing server code or environment settings does.

User2 confirmed health, login/logout, public display, CRUD, registration synchronisation, duplicate-email/invalid-ticket rejection, pause/resume, deletion protection, deep-link refresh, mobile display, weather display and missing-coordinate fallback. Weather network-failure injection remains local-test evidence only. See [acceptance](user2-angular-acceptance.md).

References: [Angular deployment](https://angular.dev/tools/cli/deployment), [CloudLinux Manager](https://docs.cloudlinux.com/cloudlinuxos/lve_manager/).
