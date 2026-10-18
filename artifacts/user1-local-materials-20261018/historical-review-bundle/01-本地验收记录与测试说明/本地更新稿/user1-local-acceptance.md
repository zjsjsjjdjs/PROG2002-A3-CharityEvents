# user1 local acceptance — status updated 16 October 2026

This local review revision consolidates existing evidence. No application tests,
GitHub upload or deployment were performed as part of this document update.

## Repository status and version boundary

User1's public implementation, weather/error states, joint tests, technical
materials, optional public hosting and restored appearance were uploaded in
[PR #19](https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents/pull/19)
and merged as `bea6b17`. The last verified `origin/main` snapshot is `8d4b71c`,
which also includes user2's admin actions (PR #18) and deployment work (PR #20).
This is a recorded snapshot, not a claim that the remote has remained unchanged.

The user1 test results below cover the earlier user1 integration stack and the
appearance-restoration version committed as `d3f3878`. They do not establish a
fresh user1 acceptance of all changes in `8d4b71c`. User2's separate acceptance
record on main is complementary evidence, not a test execution by user1.

## Recorded local executions

Environment: Node 24.19.0, MariaDB 10.4.32 and headless Chrome. Scope: public
home/search/detail/registration/weather, keyboard and small-screen use, and
integration with the Angular admin snapshot available at each run.

| Layer | 15 October execution | 16 October appearance-restoration execution |
| --- | --- | --- |
| Public/shared Angular tests | 52 passed | 53 passed |
| Admin Angular tests | 14 passed | No separate rerun claimed |
| Production builds | Public and admin passed | Final public build passed |
| Public browser checks | 20 passed | 21 passed |
| Production-built public/admin integration | 10 passed | 10 passed |
| API, schema, concurrency and legacy browser regression | 80 passed, 0 failed, 0 skipped | No separate rerun claimed |
| Final-built mobile Escape/focus check | Not separately recorded | Passed |
| Desktop/mobile visual comparison with the old site | Not this restoration run | Reviewed using the same local database |

Counts describe different layers and must not be added together as independent
requirements. The 80-result backend total includes parent tests. The 16 October
changes added coverage for Brisbane-day badge boundaries and mobile navigation.
See `docs/angular-appearance-restoration.md` for the historical restoration
record; its original pending-upload paragraph describes that earlier point in time.

Commands used for the corresponding layers:

```powershell
npm test --prefix angular
npm run build --prefix angular
node scripts/test-angular-public.cjs
node scripts/test-angular-integration.cjs
node scripts/test-joint-acceptance.cjs
```

## Joint production-build scenario

1. Create a future event in Angular admin with coordinates and 14:00 Brisbane
   wall time, using a browser set to America/New_York.
2. Find it through public search, open and directly reload its detail, and match
   weather to the event date using controlled provider data.
3. Register through the Angular form, receive confirmation, continue with
   keyboard Tab/Enter, and verify the same attendee appears in admin.
4. Change the event name/time in admin. Public reload shows 09:30 and retains
   the attendee. The API rejects deletion with EVENT_HAS_REGISTRATIONS.
5. Leave a registration form open, suspend in admin, then submit: registration
   is rejected, public detail becomes unavailable, and admin retains the attendee.
6. Check direct/legacy URLs, unknown routes, skip link, API/error fallback,
   missing assets, and public widths of 320, 390 and 768 pixels.

No unhandled page errors or unintended extra registrations were recorded in
these runs. Automated weather cases use controlled responses for determinism;
the earlier live Open-Meteo contract check is described in `angular-weather.md`.
These local runs do not verify cPanel, Apache, Passenger or production login.
The historical admin snapshot lacked the later delete UI; API protection checks
must not be presented as acceptance of that subsequently merged UI.

## Evidence and cleanup

Ignored local evidence, also copied into the local review bundle:

- `submission/angular-public-checks/results.json` and screenshots: latest retained
  public run, 21 checks.
- `submission/angular-integration-checks/results.json` and screenshots: latest
  retained integration run, 10 checks.
- `submission/test-joint-acceptance.cjs.log`: the historical 80-result run.
- `submission/test-angular-public.cjs.log` and
  `submission/test-angular-integration.cjs.log`: earlier retained terminal logs.
  Their counts need not match later-overwritten results.json files.

The 53-unit-test and final Escape/focus results were observed in tool execution;
no separately saved complete terminal log was found for those checks. Existing
records are retained without manufacturing replacement raw logs.

The runners used uniquely named databases and removed only their own databases.
The dedicated test servers and database instance were stopped after the recorded
15 October acceptance. A later local appearance preview used separate processes;
the earlier cleanup statement does not describe its current running status.
Those tests did not overwrite business configuration/data or modify cPanel.
Subsequent user-authorized uploads and deployment are recorded separately below.

## Online evidence available on 16 October

The user manually deployed the restored public bundle from `d3f3878` on
https://24832591.it.scu.edu.au/ and supplied screenshots showing:

- The restored homepage layout loaded successfully.
- The event-detail weather card displayed a forecast for 18 October 2026,
  including condition, daily low/high and Open-Meteo attribution.

These screenshots establish those visible states only. They do not establish
that the full merged Angular admin/session deployment from main was installed.
The public bundle deployment and the later integrated main release are distinct
versions. Forecast values are observations at capture time, not fixed expected values.

## Acceptance still requiring evidence

- Re-run the relevant combined checks on the exact agreed final main/release
  commit, including user2's merged admin actions and session/deployment changes.
- On each required personal deployment, record actual URLs and verify direct
  reloads/back navigation, API health and access/session behaviour.
- Complete the online registration-to-admin flow: saved registration, duplicate
  rejection, shared attendee data, update, suspend/resume and protected deletion.
- Record live weather fallback/out-of-range and retry behaviour, and confirm
  that weather failure does not block registration.
- Preserve dated screenshots/results and package manifests for the final release.

This update supplies current status for student review. It does not mark the
final integrated release, school submission or both personal deployments accepted.
