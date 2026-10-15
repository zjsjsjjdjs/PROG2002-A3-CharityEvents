# Angular management pages — first version

Implemented by user2, Tianyi Li <id_09188388@foxmail.com>, on top of the merged Angular foundation (main 00be5f9). Codex assisted with implementation, validation, tests and this record. Existing A2/A3 history and teammate authorship are retained.

## Scope and ownership

All changes are within `angular/projects/admin/`. Existing shared types and HTTP services, Express API, database schema, public application and workspace configuration are reused without modification.

- `/events`: all statuses, name/location/category search, status filtering, registration counts, loading/empty/error states and retry.
- `/events/new`: reactive create form, categories and organisations from the API, optional paired coordinates, field validation and saved confirmation.
- `/events/:id/edit`: prefilled form, existing registration list, update confirmation and preserved registrations.
- Dates display Brisbane UTC+10 and submit Brisbane wall time, regardless of browser timezone. Past is derived by the server; editable states are active/suspended.
- Failed saves retain the entered fields; repeated clicks while saving cannot issue a duplicate request.

Deletion controls, quick suspension actions, production sign-in/access integration and cPanel hosting are subsequent work. Existing API access protection remains in place; this version is a local development milestone, not final deployment acceptance.

## Start locally

Use the Node versions specified in `angular/package.json` (validated with Node 24.19.0). Start MySQL and the existing API using its local `.env` and the root README instructions. Do not commit real credentials.

From the repository's `angular` directory:

```sh
npm ci
npm run start:admin
```

Open http://127.0.0.1:4201/events. The existing proxy targets http://127.0.0.1:3000. Set `API_PROXY_TARGET` before starting Angular if using another API port. Development admin writes require a local API and compatible same-origin settings as described in the foundation README. A 401 response is reported as requiring administrator sign-in; this milestone does not bypass production authorization.

## Checks

From `angular`:

```sh
npm run ng -- test admin --watch=false
npm run ng -- build admin
node projects/admin/test-real-api.cjs
```

The last command requires Chrome, installed API development dependencies and a local MySQL account permitted to create and drop a database. It reads connection settings from `api/.env`, creates a uniquely named temporary database, imports `database/a3-fresh-install.sql`, starts temporary local servers, and cleans up its own database and servers. It never imports sample data into the configured application database. Screenshots are written to the ignored `submission/angular-admin-qa/` directory.

### Acceptance on 2026-10-15

- 14 Angular tests passed: routing, filtering, stale-data prevention, unauthorized/missing data, create/update validation, duplicate-click lock, server errors, registration preservation in form state, edit-ID navigation, date/money/coordinate boundaries.
- Production admin build passed with strict template/type checking.
- Real Chrome + Express + isolated MySQL: all eight seed events loaded; suspended filter worked; invalid create was blocked; valid create returned 201 and survived reload.
- Registration via the public API followed by editing in Angular preserved the registration and the Brisbane timestamp; public API returned the updated event name.
- Direct edit URL and reload worked; 390px mobile layouts had no whole-page horizontal overflow (wide tables scroll within their container).
- Simulated list service failure hid stale records, remained empty after filtering, and recovered on retry. No browser page errors occurred.
- Desktop/mobile list and edit screenshots were inspected. Temporary database and processes were removed.

This does not claim acceptance of user1's unmerged public Angular pages or cPanel: public synchronization above checks the actual existing public API.

## Manual review

1. View all statuses, search a name and a location, then clear filters.
2. Create an event; try blank required fields, a negative amount and one coordinate before saving valid values.
3. Reload the list and reopen the new event; verify stored fields and time.
4. Register using the public flow/API, then edit the event; verify the registration remains and the public data changes.
5. Directly reload an edit URL, test browser back/forward and a narrow viewport.
