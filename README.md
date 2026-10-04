# PROG2002 Charity Events Website

Author: Tianyi Li <id_09188388@foxmail.com>.
Repository: https://github.com/zjsjsjjdjs/prog2002-charity-events

A2 public website for Harbour Hope Charity: homepage, event search, event details, a read-only Express API and MySQL sample data. Register displays the required construction notice; A2 does not process registrations.

## Run locally

Follow [local setup](docs/a2-local-setup.md). Keep `api/` and `clientside/` as sibling directories. Start MySQL, import the SQL only into an empty/disposable database environment, run `npm ci` and `npm start` in `api/`, then open http://localhost:3000/.

The SQL starts with DROP DATABASE. Do not import over existing data you need to keep. Required database: `charityevents_db`; connection file: `api/event_db.js`.

## Delivery and verification

- [Packaging instructions](docs/a2-packaging-checklist.md)
- [Reproducibility checks and personal handoff](docs/a2-delivery-checklist.md)
- [API checks](docs/a2-api-demo-checklist.md)
- [Regression results](docs/a2-final-test-checklist.md)

Generated archives, SQL copy and SHA-256 manifest are written to ignored `submission/`. They are local delivery artifacts, not automatically submitted to the school. Reports, video and account-access tasks remain the author's responsibility.
