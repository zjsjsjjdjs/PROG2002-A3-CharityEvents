# Charity Events API

Run npm ci and npm start from api/. Configure database credentials using .env.example; keep .env private.

- GET /api/health checks the MySQL connection.
- GET /api/events/upcoming returns active events dated today or later, with category names, prices and fundraising data, ordered by event time and ID.
- GET / serves the homepage; /assets/ serves its CSS and JavaScript.

Event DATETIME values represent Brisbane local time. The list uses the Brisbane calendar day (UTC+10), and returned event timestamps include +10:00 so browsers in other timezones display the same event time. Earlier events on the current date remain upcoming under this date-based rule.

Search, category-list and event-detail endpoints are reserved for later modules. Unknown routes return 404. Database errors return a generic 500 response.

See [local setup](../docs/data-local-setup.md) and [homepage checks](../docs/homepage-browsing.md).
