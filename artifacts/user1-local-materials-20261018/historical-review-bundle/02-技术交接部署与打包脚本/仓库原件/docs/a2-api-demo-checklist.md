# A2 API Demo Checklist

Author: Tianyi Li <id_09188388@foxmail.com>.

Repository: https://github.com/zjsjsjjdjs/prog2002-charity-events

Use this checklist when testing the REST API in a browser or Postman before recording the A2 demonstration video.

## Before Testing

1. Start XAMPP MySQL.
2. Confirm `charityevents_db` has been imported.
3. Start the API:

```powershell
cd E:\workplace\user2\api
npm start
```

The API base URL is:

```text
http://localhost:3000/api
```

## 1. Health Check

URL:

```text
GET http://localhost:3000/api/health
```

Expected result:

```json
{"status":"ok","database":"connected"}
```

What to explain:

- The Express server is running.
- The API can connect to the MySQL database.

## 2. Category List

URL:

```text
GET http://localhost:3000/api/categories
```

Expected result:

- Returns 5 categories.
- Includes categories such as Fun Run, Gala Dinner, Auction, Concert, and Workshop.

What to explain:

- The frontend search page uses this endpoint to fill the category dropdown.

## 3. Homepage Upcoming Events

URL:

```text
GET http://localhost:3000/api/events/upcoming
```

Expected result:

- Returns upcoming active events according to the current Brisbane calendar date; do not expect a permanently fixed count.
- Does not return past events.
- Does not return suspended events.

What to explain:

- The homepage calls this endpoint.
- Filtering happens in SQL with `status = 'active'` and `event_datetime >= DATE(UTC_TIMESTAMP() + INTERVAL 10 HOUR)`.

## 4. Search by Location

URL:

```text
GET http://localhost:3000/api/events/search?location=Brisbane
```

Expected result:

- Returns active events with Brisbane in the location.

What to explain:

- The search API accepts optional query parameters.
- Location search uses a partial match.

## 5. Search by Date and Category

URL:

```text
GET http://localhost:3000/api/events/search?date=2026-10-04&categoryId=2
```

Expected result:

- Returns `Hope Under the Stars Gala`.

What to explain:

- Multiple filters can be combined.
- The API builds the SQL conditions based on the query parameters that were supplied.

## 6. Search with No Results

URL:

```text
GET http://localhost:3000/api/events/search?date=2026-01-01&categoryId=5
```

Expected result:

```json
[]
```

What to explain:

- An empty result is valid.
- The frontend displays a friendly empty-state message instead of a blank page.

## 7. Invalid Search Date

URL:

```text
GET http://localhost:3000/api/events/search?date=bad-date
```

Expected result:

```json
{"message":"Date must be a valid calendar date in YYYY-MM-DD format (years 1000-9999)."}
```

What to explain:

- The API validates input and returns a clear error message.

## 8. Event Detail

URL:

```text
GET http://localhost:3000/api/events/1
```

Expected result:

- Returns full event details for `Spring Steps Fun Run`.
- Includes the category, organisation details, full description, ticket price, fundraising goal, and current progress.

What to explain:

- The detail page reads the event ID from the URL query string.
- The frontend calls this endpoint and renders the response with DOM methods.

## 9. Suspended Event Detail

URL:

```text
GET http://localhost:3000/api/events/8
```

Expected result:

```json
{"message":"Event not found."}
```

What to explain:

- Suspended events are not exposed through the public detail endpoint.

## 10. Invalid Event ID

URL:

```text
GET http://localhost:3000/api/events/abc
```

Expected result:

```json
{"message":"Event ID must be a positive number."}
```

What to explain:

- The API validates route parameters before querying the database.

## Regression status

See [the dated regression results](a2-final-test-checklist.md#regression-results--2026-10-03) for observed HTTP status codes, database failures and known gaps. The previously recorded date, non-string filter and detail-sidebar failures were fixed and retested; see the follow-up verification section in that checklist.
