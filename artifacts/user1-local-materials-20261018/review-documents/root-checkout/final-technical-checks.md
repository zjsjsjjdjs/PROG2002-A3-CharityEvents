# A3 final technical verification

Candidate code: 26cb134, checked 2026-10-07.
Runtime: Node.js v24.10.0; MariaDB 10.4.32; installed Chrome; Windows.

The three reported regressions failed before the changes (three failed child cases
and their parent). After the fixes the full suite passed: 80 tests, 0 failures,
0 skipped (67 child cases and 13 parents).

Command: node scripts/test-joint-acceptance.cjs.
The runner imported the complete SQL into a unique owned test database and disposed
of it afterwards. Existing teammate databases and api/.env were not overwritten.
The M10 anchored-startup check performs read-only health/page checks against the
local api/.env connection. The isolated setup helper preflight is additionally
verified with instrumented dependencies: existing .env causes zero file reads,
connection attempts, database queries or configuration writes.

SQL: database/a3-fresh-install.sql was regenerated and had no content diff against
Git. The real empty-database import test passed with four tables, eight events and
twelve registrations. Its source seeds contain one organisation and five categories.

Changes: admin list loading/readiness state, editor ID parameter validation, and
moving the existing-env check before any database access with exclusive file creation.
No update was made to user2's original module commits or source directory.

Local evidence: submission/final-before-fix.log and submission/final-after-fix.log.
The existing M02-M11 records retain their historical test counts. This result covers
the final fixes as well. No cPanel deployment or user manual acceptance is asserted.
Documentation sign-off, M12 commit, main merge and final packaging await user review.
