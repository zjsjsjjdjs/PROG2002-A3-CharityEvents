# A3 source and collaboration

A2 baseline: 5c800ac884e4dc4c50e2ca01b87347416c116f0d.
Original source: https://github.com/zjsjsjjdjs/prog2002-charity-events.
Original author: Tianyi Li <id_09188388@foxmail.com>.

user1 is Hongke Ouyang <2838356314@qq.com>, responsible for M02-M05,
M11 integration, final follow-up fixes and M12 delivery assembly.
user2 is Tianyi Li <id_09188388@foxmail.com>, responsible for M06-M10,
team repository work and deployment configuration. These labels supersede any
inconsistent labels in earlier conversation exports. Commit authors are unchanged.

The private A3 repository is [PROG2002-A3-CharityEvents](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents).
user1 uploads as Sakitam630; user2 owns the repository as zjsjsjjdjs.
M02-M11 and follow-up fix 26cb134 are merged through PR #12. Original authorship is preserved.

The combined candidate is E:/workplace/user1-A3 on codex/user1-registration.
It includes user2's original module commits through 06c0b0a, M11 3972153 and
follow-up fixes 26cb134. E:/workplace/user2-A3 remains the unmodified source copy.
M12 documentation is prepared on user1-m12-delivery from main f0b51ec. It is submitted for teammate review without an automatic merge. The original local working branch remains available.

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


## Delivery

Both participants retain responsibility for their own actual cPanel deployment,
video of at most 15 minutes and individual peer assessment. Local test passes do
not claim these personal tasks are complete. Contributions and module commits
are listed in [the delivery guide](a3-delivery.md). The [M12 checklist](m12-delivery-checklist.md) separates the source archive from outstanding personal evidence.
