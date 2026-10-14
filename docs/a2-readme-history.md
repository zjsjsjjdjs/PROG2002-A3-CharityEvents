# Historical A2 README

This records the inherited A2 implementation. For current A3 behaviour use the [project README](../README.md).



A public charity events website for **Harbour Hope Charity**, developed for PROG2002 Assessment 2. Visitors can browse upcoming events, search by date, location or category, and view event details, ticket prices, fundraising progress and charity contact information.

**Author:** Tianyi Li

**Repository:** [prog2002-charity-events](https://github.com/zjsjsjjdjs/prog2002-charity-events)

## Implemented features

- **Homepage:** lists active events dated today or later using the Brisbane calendar date, ordered by event date and time.
- **Event search:** supports date, partial location and category filters, individually or together. Combined filters must all match. Search can also return past active events.
- **Clear filters:** resets the search form and clears the displayed results.
- **Event details:** displays the description, date and time, location, ticket price, fundraising goal and progress, and charity contact details.
- **Loading and error states:** provides feedback for loading, no matching events, invalid or missing event IDs, and API or network failures.
- **Responsive layout:** adapts navigation, event cards and page layouts to smaller screens.

## Technology stack

- **Frontend:** HTML, CSS, vanilla JavaScript, DOM manipulation and the Fetch API.
- **Backend:** Node.js and Express, with `mysql2`, `dotenv` and `cors`.
- **Database:** MySQL, with schema and sample data provided in SQL.

Express serves the frontend and the read-only API from the same local server. No frontend build step is required.

## Project structure

```text
project/
├── api/                    # Express API, database connection and environment template
├── clientside/             # index.html, search.html, detail.html and shared assets
├── database/               # Database schema and sample data
├── docs/                   # Setup, API checks, regression results and delivery guides
├── scripts/                # PowerShell packaging script
├── submission/             # Generated local delivery files; ignored by Git
└── README.md
```

Keep `api/` and `clientside/` as sibling directories: the API serves the frontend from `../clientside`.

## Run locally

### 1. Prepare the environment

Install Node.js with npm and MySQL, then clone or download this repository. Start MySQL on **port 3306**. If using XAMPP, start its MySQL service from the control panel.

The commands below start from the project root. They assume the `mysql` command is available on your PATH; otherwise, use the full path to your MySQL executable. See the [local setup guide](a2-local-setup.md) for a Windows/XAMPP example.

### 2. Import the database

> **Warning:** `database/charityevents_db.sql` drops and recreates `charityevents_db`. Import it only into a fresh or disposable environment, or back up existing data before choosing to replace it. Skip this step if the correct database is already installed.

Connect to MySQL from the project root, replacing `root` if you use another local database account:

```sh
mysql --host=localhost --port=3306 --protocol=tcp --user=root --password
```

Enter your database password when prompted. At the MySQL prompt, run:

```sql
SOURCE database/charityevents_db.sql;
SHOW TABLES FROM charityevents_db;
EXIT;
```

The import creates `organisations`, `categories` and `events`, with 1 organisation, 5 categories and 8 sample events. The sample events include past and suspended events for filtering checks.

### 3. Configure the API

In `api/`, copy `.env.example` to `.env` if you do not already have a local configuration. For example, in PowerShell:

```powershell
cd api
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

Edit `api/.env` with your local database credentials:

```dotenv
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=charityevents_db
```

Replace the username and password placeholders with your own values. Keep `.env` private; it is excluded from Git and delivery archives. The database connection currently uses MySQL's default **port 3306**; there is no `DB_PORT` setting in the current implementation.

### 4. Install dependencies and start the API

Run these commands inside `api/`:

```sh
npm ci
npm start
```

`npm ci` installs the versions recorded in `package-lock.json` and requires internet access or a suitable npm cache. If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd start` instead.

Keep the terminal open while using the website. The API and frontend run on **port 3000**.

### 5. Open the website and check the connection

- Website: [http://localhost:3000/](http://localhost:3000/)
- Database health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

A successful health check returns:

```json
{"status":"ok","database":"connected"}
```

If events do not load, check that MySQL is running, `charityevents_db` exists, the credentials in `api/.env` are correct, and the API terminal is still running. Restart the API after changing `.env`. An empty upcoming-events list can also be valid when all sample event dates have passed.

For archive extraction instructions and more setup details, see the [local setup guide](a2-local-setup.md).

## API endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check database connectivity. |
| GET | `/api/categories` | Retrieve categories for the search dropdown. |
| GET | `/api/events/upcoming` | Retrieve active events dated today or later in Brisbane. |
| GET | `/api/events/search` | Search active events using optional `date`, `location` and `categoryId` filters. |
| GET | `/api/events/:id` | Retrieve an active event and its charity contact details. |

Example search: [events in Brisbane](http://localhost:3000/api/events/search?location=Brisbane). Dates use `YYYY-MM-DD`; category and event IDs must be positive safe integers. Invalid filter values or IDs return `400`, missing or suspended events return `404`, and database failures return `500` with a generic error response.

See the [API guide](../api/README.md) and [API demonstration checklist](a2-api-demo-checklist.md) for further details.

## Verification

After starting the application:

1. Check that `/api/health` returns `status: ok` and `database: connected`.
2. Open the homepage and follow an event's **View details** link. If there are no upcoming events, use the search page to find an active sample event.
3. Search by date, location and category, try combined filters and a search with no matches, then confirm **Clear filters** resets both the form and results.
4. Confirm the detail page displays ticket information, fundraising progress and charity contacts. Click **Register** to check the construction notice.
5. Open `/detail.html?id=abc` to check the invalid-ID message and `/api/events/search?date=2026-02-30` to check an HTTP `400` response.

The [regression checklist](a2-final-test-checklist.md) records checks performed on **2026-10-03**, including search combinations, invalid dates and parameters, missing or suspended events, database and network failures, and detail-page loading and error states. Its follow-up verification records fixes for the earlier failures. These are documented prior results, not a claim that every possible scenario has been tested. Upcoming-event counts change with the current date.

There is no `npm test` script in the current API package. Use the linked checklists for verification steps, recorded results and test limitations.

## A2 scope

The **Register** button displays:

> This feature is currently under construction.

It is disabled while event details are loading or after an error. This A2 version does not process registrations or payments; the API provides read-only event information.

## Documentation and delivery

- [Local setup and archive extraction](a2-local-setup.md)
- [API demonstration and error checks](a2-api-demo-checklist.md)
- [Regression results and test limitations](a2-final-test-checklist.md)
- [Packaging instructions](a2-packaging-checklist.md)
- [Reproducibility and delivery checklist](a2-delivery-checklist.md)
- [Full documentation index](README.md)

The packaging script writes the client/API archives, SQL copy and verification manifests to the ignored `submission/` directory. Packaging does not submit files to the school; the report, demonstration video, repository access and final upload remain separate delivery tasks.
