# M05 acceptance — registration page

Verified on 2026-10-07 by Hongke Ouyang <2838356314@qq.com>.
`node --test api/test/m05-browser.test.js`: 9 tests passed, 0 failed, using
installed Chrome, the Express API and isolated MariaDB database.

Completed flow: detail for event 3 -> Register -> selected event API information
-> attendee/contact/ticket entry -> successful POST -> confirmation alert ->
return to event 3 detail -> new registration displayed first and persisted once.

Also verified:

- Missing name, invalid email, zero/negative/fractional/overflow tickets show alerts.
- Duplicate email shows the server error, keeps input and permits correction.
- The same email can register for event 4; both events retain their own records.
- Invalid, nonexistent and suspended events cannot be submitted.
- Simulated network failures on load and submit show actionable feedback.
- Pending submission disables controls; a second submit does not send a request.
- HTML-like attendee names appear as literal text without creating image elements.
- Mobile layout at 390x844 has no horizontal overflow; no page JavaScript errors.

Desktop (1280x900) and mobile screenshots were visually inspected for layout and
readability: `submission/m05-register-desktop.jpg` and
`submission/m05-register-mobile.jpg` (local, ignored by Git).

An initial test assertion incorrectly applied Playwright's disabled matcher to
fieldset rather than its actual submit control. It was corrected to assert the
user-operable button state; all final tests above passed.

The visual check also identified the inherited A2 event-time discrepancy between
homepage and detail/search serialization on this machine. M11 will normalize and
regression-test these event timestamps. Registration timestamps already use UTC ISO.
User2 backend integration and personal cPanel deployment are still pending.
