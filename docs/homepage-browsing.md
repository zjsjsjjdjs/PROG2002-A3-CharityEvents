# Homepage Browsing Module

Author: Tianyi Li <id_09188388@foxmail.com>.

## Scope

- GET /api/events/upcoming, joining events with their categories.
- Active events on or after today's Brisbane calendar date; suspended and earlier-date events excluded.
- Homepage, shared responsive styles, native DOM event cards and same-origin API requests.
- Charity introduction and contact information, event timing, location, purpose, ticket price and Goal vs Progress.
- Loading, no events, API error and network failure messages.

Search and full event details belong to later module commits. This homepage does not link to pages that have not yet been included.

## Start and check

1. Start MySQL and follow data-local-setup.md. Do not reimport SQL over data you need to keep.
2. Run npm start in E:\workplace\user2\api.
3. Visit http://localhost:3000/ (or the port specified in .env).
4. Confirm cards load and display categories, prices and fundraising progress.
5. Resize to mobile width and test the Menu button, Events and Contact links.
6. Confirm the API contains no suspended events or events dated before today in Brisbane.

The sample event count changes as dates pass. Do not require a permanently fixed count of five.

## Verification performed on 2026-09-26

- Real MySQL health check and homepage API passed; the existing sample database returned 5 eligible events.
- Past sample IDs 6 and 7 and suspended ID 8 were excluded; results sorted by event date.
- Chrome rendered the same number of cards as the API returned, without page JavaScript errors.
- A browser using America/Los_Angeles still displayed Brisbane event time and correct same-day/past labels.
- Mobile navigation worked at 390 px width without horizontal overflow.
- Browser response fixtures verified loading, empty results, HTTP 500 and disconnected-network messages.
- Browser fixtures verified free entry, a zero fundraising goal and a progress bar capped at 100% for an exceeded goal.
- Requests for /.env and /api/event_db.js returned 404. Later search, category-list and detail routes remained absent.

Tests used a temporary server and did not modify the database. Temporary browser fixtures and screenshots are not part of the submitted module.
