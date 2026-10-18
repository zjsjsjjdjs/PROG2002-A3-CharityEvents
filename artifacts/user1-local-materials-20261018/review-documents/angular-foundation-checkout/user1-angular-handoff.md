# user1 Angular technical handoff — updated 17 October 2026

Public and admin Angular functionality, restored appearance and the student's
cPanel deployment are complete to the acceptance scope recorded in
[user1-local-acceptance.md](user1-local-acceptance.md). This update records the
current handoff; final report/video review and final packaging remain with the
student. No deployment or final packaging is performed by this document update.

## Repository and release versions

Repository: [PROG2002-A3-CharityEvents](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents).

| Version | Meaning |
| --- | --- |
| `d3f3878` / PR #19 merged as `bea6b17` | User1 public registration/weather/joint work and public appearance restoration |
| `8d4b71c` | Integrated main snapshot including user2 admin actions and deployment work |
| `57fafcc` / PR #21 merged as `61f293c` | Restored admin appearance while retaining Angular management functions |
| `4e31bee` | Assessment-feedback comments, ERD and documentation generator; no runtime token changes |

Main was verified at `61f293c` during this update. The feedback and these two
status documents are delivered on `codex/user1-a2-feedback-fixes` for PR review;
this document does not claim that branch is already merged.

Earlier user1 milestones include registration `6e51688`, weather/errors
`be6c9e8`, joint tests/focus correction `ca2cbe0`, technical materials `82e14e7`
and optional public hosting `743f243`. Those snapshots and old archives remain
historical evidence, not interchangeable final releases.

## Implemented scope

| Module | Result / reference |
| --- | --- |
| Angular foundation | Public/admin applications and shared API contracts; `angular/README.md` |
| Public home/search/detail | API data, URL filters, Brisbane dates, attendees and legacy links; `angular-public-pages.md` |
| Registration | Reactive form, validation, duplicate handling, confirmation and keyboard focus; `angular-registration.md` |
| Weather | Event-day Open-Meteo forecast, independent unavailable/error states and manual retry; `angular-weather.md` |
| Public appearance | Original public layout restored with Angular behaviour retained; `angular-appearance-restoration.md` |
| Admin appearance | Original list/edit layout restored with login, CRUD, roster, filters, suspend/resume and deletion protection retained |
| Joint integration | Public registration and admin share the real Express/database contract; local isolated-DB checks and subsequent student-confirmed online flow |
| Feedback documentation | JSDoc contracts, ERD source/images and reproducible reference generator |

Shared page shells supply common header/navigation/footer structure; routed
pages supply their body content. The feedback work documents existing behaviour
and schema. It does not replace Angular, redesign pages or change business rules.

## Acceptance and reproduction

Full dates, evidence paths and limits are in the acceptance record. Historical
15–16 October public results include 53 public/shared tests, 21 public browser
checks and 10 earlier integration checks. The later admin restoration has a
production build, 28 admin tests, 13 packaged integration checks and 7
appearance/interaction checks. The earlier backend/legacy run reported 80
results including parent tests. These totals must not be added or described as
one fresh final-main execution.

For a future local rerun, install locked dependencies using a compatible local
Node runtime (24.19.0 was used), with a dedicated local database service:

```powershell
npm ci --prefix api
npm ci --prefix angular
npm test --prefix angular
npm run build --prefix angular
$env:ANGULAR_TEST_ENV_FILE = 'C:\your-private-path\test.env'
node scripts/test-angular-integration.cjs
node scripts/test-angular-public.cjs
node scripts/test-joint-acceptance.cjs
```

Those scripts' own configuration requirements still apply. The separate packaged
runner is `node scripts/test-angular-release.cjs <candidate-directory>` and
requires an existing candidate with `manifest.json`. It reads database connection
settings from the local `api/.env`, rather than `ANGULAR_TEST_ENV_FILE`. Configure
that file for a dedicated local service before use; do not supply the school
production database. It creates/imports/drops its uniquely named test database.
The raw packaged result's PR #17/pending-cPanel boilerplate is historical and is
superseded by the dated acceptance record, without rewriting the raw evidence.

No full application-suite rerun is claimed for the comments/documentation-only
feedback change. Instead, lexical comparison verified identical non-comment
tokens and no parse errors in all 17 changed application source files. The
reference generator ran successfully and emitted 49 documented blocks.

## ERD and generated documentation

- [ERD PNG](a3-erd.png): convenient for the student's final report.
- [ERD SVG](a3-erd.svg): scalable diagram.
- [ERD Mermaid source](a3-erd.mmd): editable relationship source.
- Schema authority: `database/a3-fresh-install.sql`.

The ERD covers organisations, categories, events and registrations, including
primary/foreign keys, required parent relationships and registration uniqueness
by event/email. Admin environment credentials/sessions and weather responses are
not invented database entities. The student still needs to check the ERD appears
in the actual final report; adding an image to GitHub does not insert it there.

After installing Angular's locked dependencies, generate the source reference:

```powershell
node scripts/generate-code-reference.cjs
```

The generator reads JSDoc using the project's TypeScript dependency and writes
HTML/JSON under ignored `submission/a2-feedback-review/`. It adds no application
runtime dependency. Generated local output is separate from final submission
material and does not imply complete documentation of every source member.

## Working cPanel configuration

Public URL: [https://24832591.it.scu.edu.au/](https://24832591.it.scu.edu.au/).
Admin URL: [https://24832591.it.scu.edu.au/admin/](https://24832591.it.scu.edu.au/admin/).

| Setting | Recorded deployed value |
| --- | --- |
| cPanel account | `houyan10` |
| Node application root | `/home/houyan10/a3-api` |
| Startup file | `app.js` |
| Mode / runtime | Production / Node 18.20.8 |
| `APP_FRONTEND` | `angular` |
| `ANGULAR_PUBLIC_DIR` | `/home/houyan10/a3-angular-8d4b71c/frontend/public` |
| `ANGULAR_ADMIN_DIR` | `/home/houyan10/a3-angular-8d4b71c/frontend/admin` |
| `PUBLIC_ORIGIN` | `https://24832591.it.scu.edu.au` |
| Routes | Public `/`, admin `/admin/`, same-origin API `/api/` |

Existing database/admin environment values remain in the private server
configuration; credentials are deliberately not reproduced here. Keep the working
application root at `a3-api`. Changing it during migration previously produced a
virtual-environment/file-move conflict; no further root migration is required.

The integrated in-place update used `user1-cpanel-inplace-8d4b71c.zip`; the later
`admin-restored-57fafcc.zip` updated the admin static bundle. The prior
`/home/houyan10/angular-public` path belongs to the earlier public-only deployment.
It is not the current integrated public directory listed above.

Angular assets were compiled locally using Node 24.19.0. The school Node 18.20.8
runtime serves the prebuilt assets and Express API; it was checked separately
for packaged startup/static/login behaviour. This does not assert that Angular's
build tools run on Node 18 or that the local smoke check reproduced Passenger.

Preserve existing private rollback archives, including
`a3-before-angular-admin-20261016.zip` and `admin-before-restore-20261016.zip`.
Keep source, database dumps, credentials and backups out of public static routes.
For future asset updates, publish matching hashed assets before index.html and
retain previous assets during transition; regular uploaded static files use
0644 permissions. Preserve the working Passenger/.htaccess setup.

Direct public/admin routes must return the appropriate Angular entry page;
`/api/**` must retain JSON/API handling and missing JS/CSS must remain 404.
Weather uses HTTPS Open-Meteo requests independently of registration. If a CSP
is configured, its connection policy must allow the required weather endpoint.

The student confirmed the deployed registration-to-roster flow, suspend/resume,
login/access behaviour, direct reloads, navigation and restored layouts. A
17 October read-only check returned 200 for public/API health and confirmed the
admin login redirect. Exact scope and untested live failure cases are recorded
in the acceptance document. No additional cPanel update is needed for the
comments/ERD/documentation changes in this handoff.

## Repository access and personal submission

The repository remains public by the student's explicit choice. The repository
owner is `zjsjsjjdjs`; user1's GitHub identity is `Sakitam630` (Hongke Ouyang).
The current user1 credential has push access, not repository administration access.
Include both the repository URL and the actual
public/admin website URLs in the final submission where required; localhost
addresses are development previews, not teacher-accessible deployment URLs.

The student reports the video, peer evaluation and cPanel deployment complete.
Final report/video files will be placed by the student during final review.
Report supplements, personal contributions, identity details and AI-use wording
remain subject to the student's approval; none of those approved files are
modified by this update.

Actual AI assistance included requirements/planning,  test code, debugging, local tool execution/acceptance and technical
review materials.The student is responsible for reviewing the final declaration against the
course rules and approving the final submission.
