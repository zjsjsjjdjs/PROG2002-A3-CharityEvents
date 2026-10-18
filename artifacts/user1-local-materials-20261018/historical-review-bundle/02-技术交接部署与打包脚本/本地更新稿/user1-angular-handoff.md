# user1 Angular local handoff

Status updated: 16 October 2026. This revision is local and awaiting student
review; no upload, deployment or new application test was performed for this edit.

User1's completed implementation and technical materials were uploaded in
[PR #19](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents/pull/19), merged
as `bea6b17`. The last verified main snapshot is `8d4b71c`, including user2's
admin actions (PR #18) and deployment changes (PR #20). The local user1 worktree
remains on `user1-angular-restore-appearance` at `d3f3878`; it is not the full
latest integrated main tree. Use the manifest/commit for every package.

Relevant user1 commits: registration `6e51688`, weather/errors `be6c9e8`,
joint tests/focus correction `ca2cbe0`, technical materials `82e14e7`, optional
public hosting `743f243`, and restored appearance `d3f3878`. Earlier statements
that all work was local or user2's admin actions were still unimplemented are
historical. Merged code does not by itself prove live deployment or final acceptance.

## Completed user1 scope

| Module | Result | Main source/evidence |
| --- | --- | --- |
| Angular foundation | Public/admin applications and shared API contracts | `angular/README.md` |
| Public home/search/detail | API data, URL filters, Brisbane dates, attendees, legacy links | `docs/angular-public-pages.md` |
| Registration | Reactive form, validation, duplicate handling, confirmation and keyboard focus | `docs/angular-registration.md` |
| Weather | Event-day Open-Meteo forecast, independent failure states and manual retry | `docs/angular-weather.md` |
| Joint acceptance | Production public/admin browser flow against real Express and isolated DB | `scripts/test-angular-integration.cjs` |
| Restored appearance | Original public layout with Angular functionality retained | `docs/angular-appearance-restoration.md` |
| Local delivery | Rebuildable source and public deploy archives with hashes | `scripts/package-user1-local.ps1` |
| Report/evidence preparation | Review material, requirements mapping and video outline | Local drafts in `submission/user1-review/`; consolidated review bundle kept outside Git |

## Acceptance boundary

See `docs/user1-local-acceptance.md` for dated results. On 15 October: 52
public/shared tests, 14 admin tests, 20 public browser checks, 10 integration
checks and 80 API/legacy results. On 16 October, appearance restoration: 53
public/shared tests, 21 public browser checks, 10 integration checks, public
production build and final mobile Escape/focus check passed. These are existing
executions on the earlier user1 stack, not a new user1 test of `8d4b71c`.

## Reproduce local checks

Install API and Angular dependencies using their lockfiles. Use a supported Node
runtime (24.19.0 used). Run from the repository root:

```powershell
npm ci --prefix api
npm ci --prefix angular
npm test --prefix angular
npm run build --prefix angular
# A dedicated local DB account; this file stays outside version control.
$env:ANGULAR_TEST_ENV_FILE = 'C:\your-private-path\test.env'
node scripts/test-angular-integration.cjs
node scripts/test-angular-public.cjs
node scripts/test-joint-acceptance.cjs
```

The runners create uniquely named databases, import the fresh-install SQL there,
and remove only their own databases afterwards. The database service itself must
already be running. They do not overwrite application `.env` or a business database.
The new joint runner serves built files from `angular/dist`, not ng serve. It uses
a local static host with separate public/admin origins, proxying both to the same
API. This is a local deployment model, not an Apache/Passenger authentication test.

## Packaging

On a clean committed working tree, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-user1-local.ps1 -NodeExe 'C:\path\to\supported-node.exe'
```

The script builds the public application locally and creates a timestamped folder
under `submission/`. It does not push, publish or connect to cPanel.

| File | Use |
| --- | --- |
| `user1-public-built.zip` | Public static files at archive root; includes third-party licence notices |
| `public-root/` | Same files unpacked for inspection |
| `A3-complete-source.zip` | Exact tracked source snapshot, including both Angular apps, shared code, existing API, SQL, tests and docs |
| `A3-api-database-source.zip` | Existing API and database source; install dependencies separately and keep SQL private |
| `manifest.json` | Exact commit, runtime, hashes, file inventory and local-only status |

Each source archive includes the admin snapshot at its own recorded commit.
An older archive does not contain later merged user2 changes. None of these
archives include real `.env`, node_modules, Git metadata, local backups, screenshots
or unapproved review drafts. The source archive is not directly deployable as a
public website. When preparing final school uploads, use the actual required
student username and agreed per-client/admin/API archive names. The old brief says
"2 zip files" but lists three names; do not silently drop the API source.

## Package versions and the integrated release

- The retained `user1-local-delivery-82e14e7-*` source/API/public archives are
  historical packages. They predate restored appearance and later user2 merges.
- `user1-public-restored-d3f3878.zip` is the restored public static bundle used
  for the user's public-site update. It does not contain a complete integrated
  admin/API runtime.
- The review bundle's `SOURCE-REVIEW-main-8d4b71c.zip` is a source snapshot for
  inspection, not an accepted final deployment package.
- Main now contains user2's `scripts/build-angular-release.cjs` and
  `scripts/zip-angular-release.ps1` for the integrated release. Use them from
  the agreed integrated checkout, with its
  [deployment guide](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents/blob/8d4b71cb36b1a479a5fdcdc28dd32584ef7aea19/docs/angular-cpanel-deployment.md).
  The layout includes `api/`, `frontend/public/` and `frontend/admin/`, with
  public `/`, admin `/admin/` and API `/api/`. Date-specific pending-work notes
  in that guide should be read alongside this updated status.

Do not combine files from different package generations without rebuilding and
checking the chosen release. Keep original archive manifests intact; this document
revision does not rewrite historical ZIPs or their source snapshots.

## Contract for cPanel deployment

- Public bundle base href is `/`; public API base is same-origin `/api`.
- Serve public built files from the public document root. Uploading TypeScript
  source or running `ng serve` is not the production deployment.
- Route `/search`, `/events/:id`, `/events/:id/register` and public legacy aliases
  to public index.html on direct requests/reloads. Preserve query parameters.
- Keep `/api/**` handled by Express. API errors must not return Angular HTML.
  Missing JavaScript/CSS should remain 404. Keep admin routes/assets separate.
- The integrated admin is mounted at `/admin/`; build it with the corresponding
  base href and configure its own fallback and access protection. Do not upload
  both root-built applications over the same index.html/main files.
- If Express currently serves the old `clientside` directory or Passenger owns
  `/`, coordinate its static routing with the chosen cPanel layout. Replacing an
  unrelated public_html index alone does not replace the pages served by Node.
- Do not replace cPanel-generated `.htaccess` or Passenger directives with a
  generic SPA rewrite. The working API/admin mappings must remain ahead of the
  public fallback; final configuration depends on the actual host setup.
- Browser weather requests use HTTPS `https://api.open-meteo.com`. If CSP is used,
  permit that host in connect-src. The API needs no weather key.
- Publish the new hashed assets before index.html and retain previous assets
  during transition so an already-open page can finish loading. Keep rollback
  files in a private backup. The user has already performed the public-only update
  recorded below; installing the integrated runtime is a separate release action.

[Angular deployment and deep-link fallback](https://angular.dev/tools/cli/deployment)
and [Apache rewrite rule behaviour](https://httpd.apache.org/docs/2.4/rewrite/flags.html)
explain the server requirements; the local runner does not verify those server settings.

## Deployment observed so far

The user's cPanel site is https://24832591.it.scu.edu.au/, account `houyan10`.
The observed Node application root is `/home/houyan10/a3-api`, startup `app.js`,
mounted at the domain root. The restored public build was extracted to
`/home/houyan10/angular-public`, served through the previously configured
optional public hosting. This directory is distinct from the integrated release's
`frontend/public` layout.

The user backed up the prior public directory, installed the `d3f3878` public
bundle, retained previous hashed assets, and selected 0644 permissions for the
new files. Supplied screenshots show the restored homepage and event-day weather
card. They do not prove the integrated Angular admin/login runtime is deployed,
or that the complete registration/admin flow has passed online acceptance.

The earlier cPanel screenshot showed Node 18.20.8. Local Angular builds used
Node 24.19.0. The old panel setting must not be treated as a verified supported
runtime for the final integrated release; check the selected release's runtime
requirements before installing it.

## Remaining shared and personal work

User2's admin actions and deployment implementation are now merged. The remaining
shared work is to agree the exact release commit, run the relevant joint checks
on it, deploy that build and gather end-to-end online evidence. User2 leads the
admin/session and integrated deployment checks; user1 checks public pages,
registration, weather, appearance and public-to-admin data consistency.

On each required personal deployment, check direct reloads, back navigation,
API health, login/logout/access, full registration, duplicate rejection, shared
attendee data, update, suspension/resumption, deletion protection and weather
success/failure. Record actual URLs, dates, version and results. The observed
homepage/weather screenshots are only part of that checklist.

Report supplements, personal contributions, identity/repository descriptions and
AI-use wording remain student review items. The project used OpenAI Codex for
requirements/planning, test code, debugging,
local tool execution/acceptance, and technical/review materials.

Each student completes their personal video, checks their peer evaluation and
submits it through the required channel. Final report approval, final named
submission archives and Moodle submission/receipt are not established by these
technical materials. The local Chinese peer-evaluation copy `E:\1.docx` is for
review and is not evidence of submission.

