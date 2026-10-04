# Charity Events API

Author: Tianyi Li <id_09188388@foxmail.com>.

## Run from the delivered archives

Extract the API zip into `A2/api/` and the client zip into `A2/clientside/`. Keep these two directories beside each other; Express serves `../clientside`. Install Node.js/npm and start MySQL on port 3306. Import the separate SQL into a fresh environment; it drops and recreates `charityevents_db`.

From `A2/api/`:

```powershell
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
notepad .env
npm.cmd ci
npm.cmd start
```

Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME to your local settings. Keep PORT=3000. Never include the private `.env` in a submission or commit. Internet access (or a suitable npm cache) is required to install locked dependencies. Do not run `npm update` to reproduce this version.

Open http://localhost:3000/api/health and confirm `status: ok` / `database: connected`, then open http://localhost:3000/.

## Routes

- GET /api/health: database connectivity.
- GET /api/categories: category dropdown options.
- GET /api/events/upcoming: active events dated today or later in Brisbane.
- GET /api/events/search: optional date, location and categoryId filters combined with AND; active past events can appear.
- GET /api/events/:id: active event details and organisation contacts.
- GET /, /search.html, /detail.html?id=2: public pages when the sibling client directory is present.

Invalid filters/IDs return 400, missing resources return 404 and database failures return generic 500 responses. Dates require real calendar dates in YYYY-MM-DD form (years 1000-9999); duplicate or structured search filters are rejected. Registration is an A2 placeholder.

The API database connection currently uses MySQL's default port 3306. The homepage compares Brisbane calendar dates and includes +10:00 in its timestamps. Search and detail retain their existing timestamp serialization. The frontend uses same-origin API URLs when served over HTTP; direct local HTML files fall back to localhost:3000.
