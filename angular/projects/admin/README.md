# Angular management pages

Implemented by user2, Tianyi Li <id_09188388@foxmail.com>, on top of the merged Angular foundation (main 00be5f9). Codex assisted with implementation, validation, tests and this record. Existing A2/A3 history and teammate authorship are retained.

## Scope and ownership

Management pages live within `angular/projects/admin/`. The status-only endpoint extends user2-owned `api/admin.js` and `api/admin_db.js`. Existing shared types/services, database schema, public application, `api/server.js`, `api/event_db.js` and workspace configuration are unchanged.

- `/events`: all statuses, name/location/category search, status filtering, registration counts, loading/empty/error states and retry.
- `/events/:id/registrations`: independent participant list, name search, refresh, empty/error states, registration count and total tickets; no email addresses.
- List row actions confirm suspend/resume/delete, lock while pending and refresh after success. Known registrations disable deletion; stale counts are rechecked by the existing transactional DELETE endpoint.
- `/events/new`: reactive create form, categories and organisations from the API, optional paired coordinates, field validation and saved confirmation.
- `/events/:id/edit`: prefilled form, existing registration list, update confirmation and preserved registrations.
- Dates display Brisbane UTC+10 and submit Brisbane wall time, regardless of browser timezone. Past is derived by the server; editable states are active/suspended.
- Failed saves retain the entered fields; repeated clicks while saving cannot issue a duplicate request.

Production sign-in/access integration and cPanel hosting are subsequent work. Existing API access protection remains in place; this version is a local development milestone, not final deployment acceptance.

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

- 28 Angular tests passed (including confirmation/cancel/duplicate lock, status-only payload and API prefix, deletion denial, list locking, registration filtering/counts/error recovery): routing, filtering, stale-data prevention, unauthorized/missing data, create/update validation, duplicate-click lock, server errors, registration preservation in form state, edit-ID navigation, date/money/coordinate boundaries.
- Production admin build passed with strict template/type checking.
- Real Chrome + Express + isolated MySQL: all eight seed events loaded; suspended filter worked; invalid create was blocked; valid create returned 201 and survived reload.
- Registration via the public API followed by editing in Angular preserved the registration and the Brisbane timestamp; public API returned the updated event name.
- Direct edit URL and reload worked; 390px mobile layouts had no whole-page horizontal overflow (wide tables scroll within their container).
- Simulated list service failure hid stale records, remained empty after filtering, and recovered on retry. No browser page errors occurred.
- Real pause/resume verified: public detail and registration are unavailable while suspended, restored after resume, and all other fields/registrations remain unchanged.
- Delete confirmation/cancel, unregistered deletion, registered deletion refusal, stale-zero-count refusal, concurrent registration/delete, and concurrent registration/pause were verified against MySQL.
- Status endpoint rejected invalid values, extra fields, malformed IDs, missing events, wrong content types and cross-origin writes.
- Desktop/mobile list, edit and registration screenshots were inspected. Temporary database and processes were removed.

This does not claim acceptance of user1's unmerged public Angular pages or cPanel: public synchronization above checks the actual existing public API.

## Manual review

1. View all statuses, search a name and a location, then clear filters.
2. Create an event; try blank required fields, a negative amount and one coordinate before saving valid values.
3. Reload the list and reopen the new event; verify stored fields and time.
4. Register using the public flow/API, then edit the event; verify the registration remains and the public data changes.
5. Directly reload an edit URL, test browser back/forward and a narrow viewport.

## Status-only management API

`PATCH /api/admin/events/:id/status` accepts JSON containing exactly `{"status":"suspended"}` or `{"status":"active"}`. Success returns `{message, event_id}`. It locks the event row and updates only its status, preserving all content and registrations. Repeating the same state is safe. Existing admin authentication and same-origin write protection also apply to this route.

Errors: 400 invalid ID/status/payload, 404 missing event, 415 wrong media type; existing 401/403 access responses remain unchanged. `DELETE /api/admin/events/:id` still refuses registered events with 409 `EVENT_HAS_REGISTRATIONS`; the frontend count is only an early warning. `Past` remains a derived list label, not a stored state.

## Additional manual review

1. Suspend a future active event, cancel once, then confirm. Verify public detail and registration are unavailable and the registration list remains readable.
2. Resume it and verify public access returns with unchanged fields and registrations.
3. Open the registration count link; check participant search, ticket totals, refresh and a direct-route reload.
4. Delete an empty event: cancel first, then confirm; it must disappear after success.
5. Try deleting an event with registrations; read the refusal. To test a stale count, open an empty event's list row, register in a second client, then confirm deletion without refreshing: the API must reject it.
