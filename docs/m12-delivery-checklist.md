# M12 delivery assembly

Historical record: retained for its original stage. Current Angular deployment, online acceptance and delivery status are in [deployment](angular-cpanel-deployment.md), [acceptance](user2-angular-acceptance.md) and [final delivery](a3-delivery.md). Do not treat old pending items or HTML startup steps below as the final status.

Prepared by Hongke Ouyang (user1, GitHub Sakitam630), 2026-10-14.
Team repository: [PROG2002-A3-CharityEvents](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents).

## Scope and source

M12 updates project documentation, contributor attribution, repository status, database installation instructions and delivery packaging. It introduces no application, test or schema changes. Base main f0b51ec contains M02-M11 and the three follow-up fixes merged via PR #12; its code tree matches tested commit 26cb134. This branch is user1-m12-delivery and remains subject to teammate PR review.

The [delivery guide](a3-delivery.md) records both contributors and original commits. The [technical record](final-technical-checks.md) records 80 passes on 2026-10-07. Those results are historical; M12 does not claim a fresh application test run. The full SQL already belongs to M10 and remains unchanged.

## Reproduce the source archive

After fetching the M12 branch, run from the repository root:

```powershell
New-Item -ItemType Directory -Force submission | Out-Null
git -c core.autocrlf=false archive --format=zip --prefix=PROG2002-A3/ --output=submission/A3-M12-delivery.zip user1-m12-delivery
Get-FileHash -Algorithm SHA256 submission/A3-M12-delivery.zip
```

Record the exact source commit with `git rev-parse user1-m12-delivery`. The archive contains tracked files from that commit only, including api, clientside, database, docs, scripts, lockfile and api/.env.example. It excludes the Git metadata, real environment configuration, installed dependencies, logs, submission artifacts, local SQL backups and untracked review notes. Install dependencies after extraction and use [the startup instructions](../README.md). Source archives do not contain Git history; the repository retains the original history.

For a fresh installation select an empty database and import [a3-fresh-install.sql](../database/a3-fresh-install.sql). For an existing A2 installation follow [the migration instructions](../database/README.md). The SQL contains four tables, one organisation, five categories, eight events and twelve fictional registrations. It contains no database creation/deletion or fixed USE statement.

## M12 verification

The M12 upload checks Markdown file links, whitespace, SQL reproduction with `node scripts/build-deployment-sql.cjs`, and absence of application/schema changes. After committing, the local archive is checked against every tracked file in that commit and hashed. Verification output and archive hashes are kept in the local ignored submission directory; the source archive itself is not committed.

## Individual evidence still to record

| Item | Current evidence |
| --- | --- |
| Final manual acceptance | Checklist supplied; results not provided. See [manual checks](final-manual-checklist.md). |
| user1 cPanel deployment | Live URL and execution results not recorded. |
| user2 cPanel deployment | Live URL and execution results not recorded. |
| Personal videos | Each participant records their own video of at most 15 minutes; completion not recorded. |
| Peer assessment | user1 form prepared separately; final personal submission not confirmed. Each participant submits their own form. |
| Coursework submission | Source package prepared locally; school upload not performed by this M12 GitHub upload. |

Do not mark these items complete until the responsible person supplies the evidence. A source PR or local test result does not establish a live deployment or a submitted assessment.
