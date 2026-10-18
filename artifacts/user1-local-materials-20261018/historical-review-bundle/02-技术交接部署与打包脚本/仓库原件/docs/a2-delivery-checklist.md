# Reproducible A2 Delivery and Personal Handoff

Author: Tianyi Li <id_09188388@foxmail.com>.
Repository: https://github.com/zjsjsjjdjs/prog2002-charity-events

## Technical verification — 2026-10-04

Candidate archives were extracted into a new directory with no node_modules, then installed with `npm ci` using package-lock.json. 82 packages installed successfully. Runtime source is the accepted e599be7 code; this delivery module changes packaging and documentation only.

Environment: Windows, Node.js v24.10.0, npm 11.6.1, MariaDB 10.4.32, Google Chrome.

- Unmodified packaged SQL restored in a fresh isolated MariaDB instance: 1 organisation, 5 categories, 8 events.
- Clean-installed API passed health/categories/homepage/search/detail and 400/404 regressions using only restored data.
- Chrome opened the extracted client via the extracted API: homepage -> search -> detail, clear, registration placeholder and failed-detail state passed.
- Each zip contains the six listed source files; `.env.example` is present. Archive entries matched source bytes, the SQL copy matched the original SQL, and SHA-256 checks passed.
- Restored counts: 1 organisation, 5 categories and 8 events. The homepage returned 4 eligible events on the test date; the test compared against the restored database and current Brisbane date rather than a fixed count.
- Invalid calendar dates and repeated location parameters returned 400; health remained available. Suspended detail returned 404; its ticket sidebar resolved to an error and Register remained disabled.
- No JavaScript page errors were observed during browser checks.

Isolation: the unchanged SQL (including DROP/CREATE/USE) was imported into a fresh disposable MariaDB instance on loopback port 3308. The extracted API ran on 3096 with a temporary launcher overriding only the test child's database port. Delivered defaults remain API 3000 / MySQL 3306. Temporary services were stopped afterwards; existing databases and API services were not stopped, dropped or overwritten.

This is a clean extraction and fresh database test on this machine, not a second-computer or school-server test. The seed is packaged unchanged. Prior synthetic free-ticket/zero-goal browser checks do not establish corresponding active seed records.

## Regenerate and identify final artifacts

1. Commit the reviewed delivery version.
2. Run `scripts/package-a2.ps1` in PowerShell.
3. Check `submission/build-manifest.json`: `workingTreeClean` should be true and `sourceCommit` should identify the intended version.
4. Check `submission/SHA256SUMS.txt`. Regenerate packages if source changes.

Local artifacts:

- `submission/Tianyi LiA2-clientside.zip`
- `submission/Tianyi LiA2-api.zip`
- `submission/charityevents_db.sql`
- `submission/build-manifest.json` and `submission/SHA256SUMS.txt` for version/checksum verification.

The SQL drops the named database. Follow [local setup](a2-local-setup.md); do not import over data you need to retain.

## Author tasks — not completed by these checks

Stop at this handoff before treating the assignment as ready to submit. These actions require the author's content review or course/account access:

- Finish and review the official English report: correct name/student identifiers, repository/video links, final screenshots, testing evidence, references and an accurate GenAI declaration. This checklist is not the report.
- Record the personal demonstration video (at most 15 minutes under the current checklist), upload it to the required SCU OneDrive location, and test sharing access for the intended marker.
- Use the course instructions to identify the correct marker account; verify the GitHub repository is private and that the marker has access. Successful pushing does not establish marker access.
- Review Moodle fields and upload the two archives, SQL, official report and video link as required. The filenames use the provided `Tianyi Li` prefix; follow any explicit course filename rule if different.
- Verify the school's exact deadline/timezone (current plan: before 11 October), final upload status, filenames and receipt.

No school upload, report sign-off, video publication or access invitation was performed in this module.

## Suggested personal video sequence (under 15 minutes)

Use the original project's API/demo and report notes as prompts; explain the work in your own words.

1. 0-2 min: project overview, database tables, relations and sample records.
2. 2-5 min: API startup, health, categories, upcoming, search and detail requests.
3. 5-9 min: homepage, search filters/clear, details and the Register placeholder.
4. 9-12 min: fetch/Promise flow, DOM rendering, invalid dates/IDs and resolved error states.
5. 12-14 min: repository history, two archives, SQL and setup instructions.

Leave time for transitions. Check recording length, sound, readable text and sharing permissions yourself. Do not display private `.env` contents or passwords.
