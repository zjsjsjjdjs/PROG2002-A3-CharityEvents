# user1 Angular local handoff

This is a technical handoff for user2. It does not claim GitHub upload, cPanel
release, a submitted report or a recorded personal video. Local work continues
from registration commit `6e51688`, through weather `be6c9e8`, on
`user1-angular-local-delivery`. Use the generated package manifest for the exact
final source commit. Existing user2 admin source is preserved.

## Completed user1 scope

| Module | Result | Main source/evidence |
| --- | --- | --- |
| Angular foundation | Public/admin applications and shared API contracts | `angular/README.md` |
| Public home/search/detail | API data, URL filters, Brisbane dates, attendees, legacy links | `docs/angular-public-pages.md` |
| Registration | Reactive form, validation, duplicate handling, confirmation and keyboard focus | `docs/angular-registration.md` |
| Weather | Event-day Open-Meteo forecast, independent failure states and manual retry | `docs/angular-weather.md` |
| Joint acceptance | Production public/admin browser flow against real Express and isolated DB | `scripts/test-angular-integration.cjs` |
| Local delivery | Rebuildable source and public deploy archives with hashes | `scripts/package-user1-local.ps1` |
| Report/evidence preparation | Review material, requirements mapping and video outline | Local ignored `submission/user1-review/` |

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

The full source archive includes the current admin snapshot for reproducibility;
it is not a claim that user2's remaining admin work is complete. None of these
archives include real `.env`, node_modules, Git metadata, local backups, screenshots
or unapproved review drafts. The source archive is not directly deployable as a
public website. When preparing final school uploads, use the actual required
student username and agreed per-client/admin/API archive names. The old brief says
"2 zip files" but lists three names; do not silently drop the API source.

## Contract for user2's cPanel deployment

- Public bundle base href is `/`; public API base is same-origin `/api`.
- Serve public built files from the public document root. Uploading TypeScript
  source or running `ng serve` is not the production deployment.
- Route `/search`, `/events/:id`, `/events/:id/register` and public legacy aliases
  to public index.html on direct requests/reloads. Preserve query parameters.
- Keep `/api/**` handled by Express. API errors must not return Angular HTML.
  Missing JavaScript/CSS should remain 404. Keep admin routes/assets separate.
- If admin is mounted at `/admin/`, user2 must build it with the corresponding
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
  files in a private backup. No such live changes were performed here.

[Angular deployment and deep-link fallback](https://angular.dev/tools/cli/deployment)
and [Apache rewrite rule behaviour](https://httpd.apache.org/docs/2.4/rewrite/flags.html)
explain the server requirements; the local runner does not verify those server settings.

## Remaining shared/personal acceptance

User2 owns remaining admin deletion/confirmation, production access integration,
and cPanel configuration. The existing deletion API safeguard was checked locally;
that is distinct from testing a completed Angular delete button. Re-run joint
acceptance after integrating user2's later branch. No remote main status was checked
in this local-only task.

On each required personal deployment, check direct reloads, browser back navigation,
API health, full public registration, admin shared attendee data, update, suspension,
delete protection, and weather success/failure. Record real URLs and results.
Each student still supplies their personal video, final peer evaluation/submission
and truthful report approval. AI-assisted notes do not establish those personal actions.

## Time plan to 17 October, 24:00

- 15 October: user1 local functionality, regression and handoff; user2 reviews the
  remaining admin work and deployment layout.
- 16 October morning: review/integrate the local branches when uploads are approved;
  user2 deploys the agreed build. Each person checks their required account.
- 16 October afternoon/evening: joint online acceptance; fix blockers, capture
  actual deployment evidence, review report and contribution wording.
- 17 October morning: record personal videos and complete individual forms.
- 17 October afternoon: verify archive names, repo/video/deployment permissions and
  Moodle submission contents. Aim to submit by 22:00; retain the last two hours
  for corrections. These are planned actions, not completed milestones.
