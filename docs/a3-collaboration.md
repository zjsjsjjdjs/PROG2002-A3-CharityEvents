# A3 source and collaboration agreement

A3 starts from the A2 repository at `E:\workplace\aaaa\user2`, main commit
`5c800ac884e4dc4c50e2ca01b87347416c116f0d`.
Upstream: https://github.com/zjsjsjjdjs/prog2002-charity-events.git.
A2 author: **Tianyi Li <id_09188388@foxmail.com>**. Its nine mainline commits
and original authorship are retained unchanged.

A3 user1: **Hongke Ouyang <2838356314@qq.com>**, branch
`codex/user1-registration`. Each completed module has one separate commit,
in order M02, M03, M04, M05, M11, M12. Work stays local until the user supplies
the new shared remote. No push or teammate review is claimed before it happens.

The user relayed user2's agreement on 2026-10-07:

- user2 owns M01, the admin event list/create/update/delete modules, their APIs,
  and shared deployment configuration.
- user1 owns registration SQL, database helpers in `api/event_db.js`, public
  event detail/registration routes in `api/server.js`, the detail and registration
  pages, integration acceptance and delivery documentation.
- user2 should keep admin routes in a separate module and coordinate the router
  mount in `api/server.js`. Coordinate any further shared-file edits before merging.
- Both branches start from the same A2 baseline; M01 delivery remains user2's work.

## Shared contract

- Fields: `registration_id`, `event_id`, `name`, `email`, `registered_at`,
  `tickets`. Email is the contact method and attendee identity.
- Trim and lowercase email. One email can register for different events, once per
  event; the database unique constraint also handles concurrent requests.
- Tickets: JSON integer from 1 to 2147483647 (signed MySQL INT range).
- `GET /api/events/:id` retains the A2 event object and adds `registrations`.
  Entries contain ID, event ID, name, tickets and ISO UTC registration time;
  contact emails are not exposed publicly. Sort newest first, then ID descending.
- `POST /api/events/:id/registrations` accepts `{name,email,tickets}` and
  returns HTTP 201 `{message,registration}`. The database supplies the timestamp.
- A3 errors use `{code,message}`: 400 invalid input, 404 unavailable event
  (including suspended), 409 duplicate registration or event with registrations,
  500 generic internal error. Existing A2 clients can continue reading `message`.
- Admin deletion must map the registration foreign-key restriction to HTTP 409
  with code `EVENT_HAS_REGISTRATIONS`; do not cascade/delete registrations.
- A2 permits past active events in search/detail; A3 retains that behavior.
  Suspended events remain unavailable publicly. No payment/capacity restriction
  is part of the agreed scope.

## Handoff and remaining personal work

Review each module with user2 when the new shared remote or local patch exchange
is available. Obtain user2's actual branch and deployment instructions before
backend integration, final acceptance and main-branch merge.
Do not invent teammate work or test results.

The user must deploy the complete integrated project to their own cPanel, record
their own A3 demonstration (maximum 15 minutes), and submit their own peer review.
