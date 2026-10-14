# A3 public website and administration

Original A2 and admin M06-M10: Tianyi Li (user2). Registration M03-M05, M11 integration and follow-up fixes: Hongke Ouyang (user1). Original commit authorship is preserved.

Keep clientside beside api. Start the Express application with npm start --prefix api from the project root and open its HTTP URL (default http://localhost:3000/). The supplied pages use same-origin /api requests; open them through the server.

- index.html lists upcoming active events.
- search.html combines date, location and category filters and supports clearing filters.
- detail.html displays event information and the public attendee list, and links to registration.
- register.html validates name, email and ticket quantity, submits the registration and returns to the event detail.
- admin.html lists, searches and filters events, with create/edit/delete controls.
- admin-event.html creates or edits an event and displays its registrations.

Public lists omit attendee email. Suspended events are unavailable publicly. Existing registrations survive updates and suspension and prevent event deletion. Production admin access requires the configured credentials.

See [startup and delivery](../README.md), [backend operations](../docs/backend-guide.md) and [deployment](../docs/cpanel-deployment.md).
