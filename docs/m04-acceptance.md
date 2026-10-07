# M04 acceptance — registration submission API

Verified on 2026-10-07 by Hongke Ouyang <2838356314@qq.com> on the isolated
MariaDB 10.4.32 database. `node --test api/test/m04-registration.test.js`:
10 tests passed, 0 failed. JavaScript syntax checks also passed.

## API contract

`POST /api/events/:id/registrations`, `Content-Type: application/json`:

```json
{"name":"Alex Chen","email":"alex@example.com","tickets":2}
```

HTTP 201 returns `message` and `registration` with `registration_id`, `event_id`,
normalized `name`/`email`, integer `tickets`, and ISO UTC `registered_at`.
Contact email is returned only to the submitting request; public event lists omit it.

| HTTP | code | Meaning |
| --- | --- | --- |
| 400 | INVALID_EVENT_ID | ID is not a positive safe integer |
| 400 | INVALID_BODY / INVALID_JSON | Invalid request object / malformed JSON |
| 400 | INVALID_NAME | Missing/blank name, over 120 characters, control characters |
| 400 | INVALID_EMAIL | Invalid ASCII email, local part over 64 or total over 254 characters |
| 400 | INVALID_TICKETS | Not a JSON integer from 1 through 2147483647 |
| 404 | EVENT_NOT_FOUND | Missing or suspended event |
| 409 | DUPLICATE_REGISTRATION | Email already registered for this event |
| 413 | PAYLOAD_TOO_LARGE | Express JSON body limit exceeded |
| 415 | UNSUPPORTED_MEDIA_TYPE | Body is not application/json |
| 500 | INTERNAL_ERROR | Unexpected failure; no database details exposed |

All errors above use `{code,message}`. Email validation accepts ordinary ASCII
mailboxes with a dotted domain, without attempting to prove mailbox ownership.

Verified persisted values, whitespace/case normalization, server timestamps,
case-insensitive duplicates, same-email cross-event success, missing fields,
wrong types, malformed email, zero/negative/fractional/overflow ticket values,
missing/suspended events, malformed JSON and unsupported content type.
Two concurrent identical requests produced exactly one row (201 and 409).
A SQL-like attendee name was saved as literal text; all eight events remained.

Insertion locks the selected active event within a transaction and uses
parameterized SQL. The unique constraint remains the final duplicate guard;
the foreign key protects against deletion. Tests clean up only their uniquely
prefixed records. Admin HTTP integration and cPanel deployment remain pending.
