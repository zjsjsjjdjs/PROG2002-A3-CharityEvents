# M02 acceptance — registration database

Verified on 2026-10-07 by Hongke Ouyang <2838356314@qq.com>.
Environment: Windows, XAMPP MariaDB 10.4.32, isolated database
`user1_a3_test_20261007`. The original `charityevents_db` was not changed.

The migration adds a primary key, required attendee/contact/time/ticket/event
fields, event foreign key with deletion restriction, event/email uniqueness,
positive-ticket checks and an index for event lists. Twelve fictional samples
span five events; Alex Chen appears in three different events.

Run after importing the A2 seed, `m02-registrations.sql` and
`m02-registration-samples.sql` into an isolated test database:

```powershell
$env:DB_HOST = '127.0.0.1'
$env:DB_NAME = 'user1_a3_test_20261007'
node --test api/test/m02-database.test.js
```

Result: 9 tests passed, 0 failed (8 acceptance cases plus their parent test).
Covered samples, cross-event registration, case-insensitive duplicates,
server timestamps, missing events, restricted deletion, zero/negative tickets,
required fields, list isolation/order/tie-breaks and omission of public email.
`node --check api/event_db.js` also passed. Test mutations roll back.

This verifies the real MariaDB engine. Target cPanel MySQL/MariaDB verification
and user2's admin HTTP error mapping are pending integration/deployment.
For existing A2 installations apply only the two M02 SQL files once; do not
re-import the destructive A2 seed over an existing database.
