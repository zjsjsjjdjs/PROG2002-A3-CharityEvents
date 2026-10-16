# Local restoration of the original public appearance

Date: 2026-10-16. Local branch: `user1-angular-restore-appearance`, based on `743f243`.

The public Angular templates now use the pre-Angular deployed site's typography, layout, navigation, colours, event cards and registration styling. The reference was the user's `a3-before-angular-backup.zip`, `clientside/` folder. `legacy.css` contains the original public and registration styles; `public.css` supplies Angular-specific validation, success, weather and accessibility states. Shared/admin styles and the backend are unchanged.

Restored pages: home, search, event detail, registration. New Angular functionality remains: URL filters, API error recovery, registration validation and confirmation, attendee refresh, weather states and keyboard support. Search still loads results immediately; weather and field-validation messages remain additions to the original site. Mobile navigation preserves the original menu layout and closes after navigation or Escape, returning focus on Escape.

Validation completed locally:
- Production public build passed.
- 53 public/shared unit tests passed, including Brisbane-day badge boundaries.
- 21 public browser checks passed against real Express and an isolated MariaDB database, including registration and weather states.
- 10 production public/admin integration checks passed, including 320/390 px and tablet layouts, direct reloads and legacy URLs.
- Separate final-built mobile Escape/focus check passed.
- Desktop and mobile screenshots compared with the actual old site, using the same local database.
- `git diff --check` passed.

## User review

Running local preview: http://127.0.0.1:4280/
Old site reference: http://127.0.0.1:4280/legacy/index.html

Both use a separate local sample database. Test registrations do not affect cPanel. The preview depends on the local Node and dedicated MariaDB processes and stops when the computer restarts. Preview process information and screenshots are under ignored `submission/legacy-appearance-reference/`.

Please review home, search, event details, weather, registration and a narrow/mobile viewport. No GitHub push, PR or cPanel deployment has been performed for this restoration. Upload requires the user's explicit confirmation after testing.
