# PROG2002 Charity Events Website

Author: Tianyi Li <id_09188388@foxmail.com>.

This project currently includes the MySQL database, Node.js runtime and public event browsing homepage.

## Run locally

Follow [database and local setup](docs/data-local-setup.md), then run npm start from api/ and open http://localhost:3000/ in a browser. If PORT changes, use that port for both the homepage and API; the homepage uses a relative API URL.

The homepage loads active events dated today or later in Brisbane, shows event categories, ticket prices and fundraising progress, and handles empty results and service failures.

See [homepage checks](docs/homepage-browsing.md). Search and event detail pages will be added in separate module commits.

Required database: charityevents_db. Required connection file: api/event_db.js.
