# Activity administration

Tianyi Li <id_09188388@foxmail.com> implemented the A3 backend modules M06–M10.
Registration schema, registration APIs and public registration pages are Hongke
Ouyang's M02–M05 work. Their original Git commits remain in this branch.

## Open and use the backend

Start the API with `npm start --prefix api`. Open `/admin.html` on the same
host and port as the public website. The development default port is 3000;
the prepared isolated acceptance environment uses 3001.

1. Find an event by name/location or filter Active, Past or Suspended.
2. Choose **New event**, select a category/organisation and complete the form.
   All text fields, Brisbane date/time, visibility and monetary amounts are required.
   Use zero for free admission or no fundraising target. Coordinates are optional
   but must be supplied together.
3. Choose **Edit** to change an event or inspect its registration list. Saving keeps
   the event ID and every registration. Active events remain visible publicly;
   suspended events are hidden from public search, detail and registration.
4. Choose **Delete** and confirm. An event without registrations is removed.
   An event with registrations is refused with a reason; suspend it instead.
5. After a network interruption, check the list before retrying a create operation,
   because a lost response does not prove that the database rejected the save.

Past is a date label, not a third database status. An active event on a date before
today in Brisbane is labelled Past. A suspended event is always labelled Suspended.

In production the browser prompts for the administrator username/password before
opening the backend. Each cPanel owner supplies their own credentials through
environment variables; no real credentials are shipped in source code.

## Backend API

The base path is `/api/admin`. Admin requests use the same origin as the admin UI.
Production requires HTTP Basic authentication over HTTPS.

| Method | Path | Response |
| --- | --- | --- |
| GET | /events | Array of all events, including display_status and registration_count |
| GET | /organisations | Array of organisation_id and name |
| GET | /events/:id | Event object with all editable fields and registrations |
| POST | /events | 201 with message and event_id |
| PUT | /events/:id | 200 with message and event_id |
| DELETE | /events/:id | 200 with message and event_id, or 409 if registrations exist |

The edit detail endpoint reuses the registration module's
`getEventRegistrations`. Its separate admin route permits suspended events
without weakening the public `GET /api/events/:id` active-only filter.
Registration entries omit contact emails and retain newest-first ordering.

POST and PUT take a complete JSON event object:

```json
{
  "organisation_id": 1,
  "category_id": 1,
  "name": "Community care walk",
  "event_datetime": "2030-04-20T09:30:00",
  "location": "Brisbane",
  "purpose": "Support community meals",
  "short_description": "A charity walk for local families.",
  "full_description": "Meet at the park entrance for a guided community walk.",
  "ticket_price": "10.00",
  "fundraising_goal": "2500.00",
  "current_progress": "0.00",
  "status": "active",
  "latitude": null,
  "longitude": null
}
```

Category/organisation IDs must exist. Status is active or suspended. Date input is
Brisbane local time with no zone suffix; backend detail output includes +10:00.
Text limits match the schema except full_description, capped at 16000 Unicode
characters to fit the TEXT byte limit. Monetary values are nonnegative with at
most two decimal places; ticket price is at most 999999.99 and fundraising values
at most 99999999.99. Coordinates allow six decimal places within geographic bounds.
Financial totals are editable event metadata; registrations do not process payments
or automatically change funds raised.

Errors use `{code,message}`, with optional `fields` for validation errors.
400 means invalid input/reference, 401 requires admin login, 403 rejects cross-site
admin mutation, 404 means missing event, 409 EVENT_HAS_REGISTRATIONS prevents
deletion, 413 means oversized JSON, 415 requires JSON, and 500 is a generic failure.
An unconfigured nonlocal development admin returns 503.

Both registration and deletion lock the parent event first. Deletion also checks
registrations inside its transaction; the restrictive foreign key remains the
last line of protection. No route cascades registration deletion.

## Historical M06-M10 file handoff

- api/server.js: admin router and page protection, configurable CORS, startup hook,
  and generic error logging. Public route logic is unchanged.
- api/event_db.js: only pool/environment configuration changed; registration
  functions are unchanged.
- api/package.json: start entry point and test command.
- New admin routes, data operations, shared validation, UI and tests are separate files.
- Public HTML, site.js and registration.js are unchanged.
- M11 time serialization is integrated in commit 3972153. The admin/deployment hooks and original contributors remain intact.
- Follow-up fixes in 26cb134 preserve list error/loading states, reject ambiguous editor IDs and preflight test setup before database access.

## Personal contribution and delivery

Tianyi's module commits cover directory/navigation, create, edit, delete and
deployment configuration. M09 tests exercise public registration followed by admin
visibility and restricted deletion. See backend-acceptance.md for executed checks.

The [A3 team repository](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents) contains the merged modules through M11 and follow-up fixes (PR #12). The recorded full regression on 2026-10-07 passed 80 tests. M12 assembles the delivery documentation in a separate PR. Each participant records their own manual acceptance, cPanel deployment, video of at most 15 minutes and peer-assessment submission; these tasks are not certified by local tests. See [contributions](a3-delivery.md) and the [delivery checklist](m12-delivery-checklist.md).
