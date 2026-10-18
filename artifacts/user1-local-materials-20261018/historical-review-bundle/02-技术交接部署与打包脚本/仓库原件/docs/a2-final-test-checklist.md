# A2 Final Test Checklist

Author: Tianyi Li <id_09188388@foxmail.com>.

Repository: https://github.com/zjsjsjjdjs/prog2002-charity-events

Use this checklist before recording the A2 demo video and before creating the final submission files.

## Required Local Services

- XAMPP MySQL is running.
- `charityevents_db` is imported.
- API is running with `npm start` from `api/`.

## API Smoke Tests

Run these in a browser, Postman, or PowerShell.

```text
GET http://localhost:3000/api/health
GET http://localhost:3000/api/categories
GET http://localhost:3000/api/events/upcoming
GET http://localhost:3000/api/events/search?location=Brisbane
GET http://localhost:3000/api/events/search?date=2026-10-04&categoryId=2
GET http://localhost:3000/api/events/1
```

Expected results:

- Health check returns `database: connected`.
- Categories returns 5 rows.
- Upcoming events returns active events dated today or later in Brisbane; the count changes as dates pass.
- Search returns matching active events.
- Event detail returns the selected event with full details.

## Frontend Smoke Tests

### Homepage

- Open `clientside/index.html`.
- Confirm event cards load from the API.
- Confirm only upcoming active events appear.
- Confirm cards show category, date, location, ticket price, and Goal vs Progress.
- Confirm `View details` opens `detail.html?id=...`.

### Search Page

- Open `clientside/search.html`.
- Confirm category dropdown loads from the API.
- Search by location.
- Search by category.
- Search by date and category together.
- Search for a combination with no results.
- Click `Clear filters`.
- Confirm form fields and results are cleared by DOM behavior.

### Detail Page

- Open `clientside/detail.html?id=1`.
- Confirm full event details load from the API.
- Confirm ticket price and Goal vs Progress are displayed.
- Click `Register`.
- Confirm the alert says:

```text
This feature is currently under construction.
```

### Error Cases

- Open `clientside/detail.html` with no `id`.
- Open `clientside/detail.html?id=abc`.
- Open `clientside/detail.html?id=8`.

Expected results:

- Missing or invalid IDs show a clear page message.
- Suspended event ID 8 displays `Event not found.`

## GitHub Check

- Latest commits are pushed to the private GitHub repository.
- Repository remains private.
- Commit messages describe each module clearly.

## Submission Check

- Client zip exists.
- API zip exists.
- SQL file is ready.
- Report template is completed separately.
- Demo video covers database, API, frontend fetch/DOM rendering, search filters, validation, and detail page behavior.

## Regression results — 2026-10-03

Baseline: `1096b44`. This checklist was copied from the complete A2 project, with user2 paths, port 3000 and author information. The fixed upcoming-event count and homepage SQL description were aligned with the already committed user2 homepage. No API, frontend or database implementation was changed in this module. The submission checklist above remains a checklist, not a claim that delivery artifacts are ready.

### Passed checks

- Health and five categories.
- Homepage date/status filtering and ordering.
- Search empty/single/combined filters and no matches.
- SQL-like location input remains data.
- Malformed date, category and ID return 400.
- Missing/suspended events and unknown routes return 404.
- Detail fields and past active event.
- Refused database connection returns generic 500.
- Browser homepage -> search -> detail and Clear filters.
- No-result search message.
- Missing, invalid, absent and suspended detail messages.
- Real database failure is visible on all three pages.
- Network failure messages.
- Fixture-only free ticket, zero goal and capped progress.
- Register retains A2 placeholder.

Current sample observations: 5 categories, 7 active search results and 4 upcoming events. The upcoming count is date-sensitive.

Status checks: malformed date text, invalid category and invalid event ID returned 400; missing/suspended events and unknown API routes returned 404. Refused database connections returned 500 with a generic JSON message. The browser displayed the API/database/network failures rather than silently rendering an empty result.

### Historical gaps — before the follow-up fix

| Case | Expected | Observed |
| --- | --- | --- |
| `date=2026-02-30` | HTTP 400 for an impossible calendar date | HTTP 200; the original regex/Date.parse check accepts this value. |
| `location=Brisbane&location=Sydney` | HTTP 400 for duplicate/non-string input | Connection reset and API test process exit code 1. |
| `location[x]=Brisbane` | HTTP 400 for structured/non-string input | Connection reset and API test process exit code 1. |
| Detail page for suspended ID 8 | Resolved error/empty state throughout the page | Main error appears, but registration sidebar remains `Loading ticket information...`. |

The non-string location cases call `location.trim()` before the route's try/catch. In the tested Node/Express setup, the unhandled async rejection terminates the process. Each of those two cases was tested in an isolated process. Do not run these cases against a shared API that must remain available.

These were the observed behaviors at baseline 1096b44, preserved as historical evidence. They were subsequently fixed after source-project testing and user acceptance; see the follow-up verification below. This checklist does not establish complete final assessment acceptance.

### Test isolation and limits

- Normal checks used a temporary API on port 3096 with the existing MySQL database. Invalid structured/duplicate location probes used isolated processes on 3098.
- An isolated API on 3097 used the real mysql2 driver with its connection directed, only within the temporary launcher, to an unused loopback port. This produced actual connection-refused errors without stopping shared MySQL or modifying project configuration.
- Browser network failures used aborted browser requests. Free entry, zero goal and progress exceeding the goal used browser response fixtures; they do not prove those scenarios exist in the stored sample data.
- The normal API and browser checks read existing data; no SQL import, insert, update or deletion was performed. Existing API services were not restarted.
- Temporary launchers, fixtures and test output remain outside the repository. Project defaults remain port 3000. No JavaScript page errors were observed in the completed browser checks.

## Follow-up fix verification — 2026-10-03

The user accepted the fixes in the complete A2 project before synchronization. The date/integer helpers, search input validation and detail loading/error states were copied into user2. Port 3000, same-origin API requests, existing homepage date rules and other module behavior were preserved.

- Impossible dates, including 2026-02-30, 2026-02-29, 1900-02-29 and 2026-04-31, return 400. Valid leap dates 2000-02-29 and 2028-02-29 are accepted. Supported year boundaries 1000 and 9999 were checked.
- Repeated, array and object values for search filters return 400. Non-positive or unsafe integer categories/IDs are rejected. Health and a normal combined search succeeded immediately after every malformed-parameter request.
- The entire search handler now catches unexpected exceptions. An isolated API with a refused database connection still returned generic 500 responses for health, search and detail requests.
- Detail loading disables Register and marks both content areas busy. Missing, invalid, suspended and absent IDs show resolved error text in both areas, without an indefinite ticket-loading message.
- Database and network failure checks kept Register disabled. A successful retry cleared errors, rendered ticket information and re-enabled Register. Its original A2 placeholder alert remains unchanged.
- Existing homepage, category loading, search and detail routes passed regression checks. No browser JavaScript errors were observed.

These automated checks ran against user2 using temporary API ports 3096/3097 and the existing database. Browser requests from the target files were directed to those temporary servers during testing; stored application settings stayed on port 3000. Database contents were not changed. The earlier four failing cases across three categories now pass their targeted checks.
