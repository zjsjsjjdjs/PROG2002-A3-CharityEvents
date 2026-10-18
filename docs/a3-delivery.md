# A3 final delivery guide

Updated 17 October 2026. The final application baseline is main `61f293c`, after PR #21. The local review copy adds current documentation and two release-tool metadata/instruction refinements. It does not change application behaviour or represent a new remote commit.

## Project and ownership

Harbour Hope extends Tianyi Li's A2 codebase at `5c800ac` with registration and activity administration. Original Git history and authors are retained in the team repository: https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents. A2 source: https://github.com/zjsjsjjdjs/prog2002-charity-events.

| Contributor | Actual contribution |
| --- | --- |
| Tianyi Li, user2, zjsjsjjdjs | A2; M06-M10 administration and deployment; Angular management PR #16; actions/roster PR #18; sessions, hosting and release tools PR #20; personal cPanel deployment |
| Hongke Ouyang, user1, Sakitam630 | M02-M05 registration; M11/M12 integration and delivery; Angular foundation/public/registration/weather; public and management appearance restoration including PR #21; personal deployment |

User2's individual contribution and AI disclosure are in [the contribution record](user2-contribution-ai.md). Each member's evaluation scores remain private and are not included in code directories.

## Final architecture and behaviour

One Angular workspace contains `projects/public`, `projects/admin` and shared types/services. Public paths are `/`, `/search`, `/events/:id` and `/events/:id/register`; deployed management is under `/admin/`. Both call the Express API under `/api`. Open-Meteo is called from the public weather service. The two apps share one MySQL/MariaDB database.

An email may register once per event and may register for different events. Editing or suspending does not remove registrations. Deletion is refused if registrations exist, using transactions and a restrictive foreign key. Past is a derived display label, not a stored status. Fundraising metadata is editable; this project does not process payments or impose ticket capacity.

See [backend API](backend-guide.md), [database](../database/README.md), [current startup](../README.md), and [weather](angular-weather.md).

## Uncompressed review directories

The current handoff deliberately has no new ZIP archive. The three code folders are:

- `tli30A3-clientside`: public Angular source, shared workspace files and built public runtime.
- `tli30A3-adminside`: management Angular source, shared workspace files and built admin runtime.
- `tli30A3-api`: API/source tests, SQL, supporting validation source, scripts, documentation and API runtime.

Each has `source/` and `runtime/`. Merge the contents of all three source directories into one empty project directory to recreate the workspace. Their overlapping workspace files must be identical. Merge all three runtime directories into one empty runtime directory to obtain `api`, `frontend/public`, `frontend/admin`, `clientside`, `database` and `docs`. Then install API production dependencies and privately configure the environment. Source root README and .gitignore are supplied with the API source directory.

The `source` trees retain the root build/test scripts and lockfiles. `runtime` uses already verified production file bytes, including PR #21 administration. `REVIEW_MANIFEST.json` records the base commit, local changes, runtime provenance and file hashes. Code directories exclude real .env files, node_modules, .git, private SQL exports, reports, videos and peer assessments. Reports and personal materials are reviewed separately and will only be combined when the student authorises final packaging.

The original brief mentions two ZIPs but lists three names. The three logical components are prepared without compression; the final teacher-facing layout will follow the student's confirmed submission process.

## SQL and installation

`database/a3-fresh-install.sql` contains organisations, categories, events and registrations; one organisation, five categories, eight activities and twelve fictional registrations. It contains foreign keys and same-event email uniqueness, and no fixed CREATE/DROP DATABASE or USE statement. Import into an empty selected database only. Do not replace existing deployed data with seed SQL.

The full installer was previously imported into disposable local databases during regression tests. No production database export is included. Historical A2 SQL is retained for provenance and must not be mistaken for the A3 installer.

## Status and evidence

User2's site is https://24832371.it.scu.edu.au/ with admin `/admin/` and API `/api/`. User2 confirmed deployment and online core acceptance, and reported the personal video and peer evaluation complete. Local video duration is approximately 9 minutes 33 seconds. See [acceptance](user2-angular-acceptance.md) for exact scope and limitations.

The final report includes Angular, weather, deployment, testing, contribution and actual AI assistance. The student reviews it before submission. Final compression, combination with personal materials and teacher submission have not been performed in this review preparation.
