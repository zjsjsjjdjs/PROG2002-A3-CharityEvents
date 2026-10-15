# Local PR description draft

Title: feat(admin): add suspension, protected deletion and registration lists

The Angular management list now supports confirmed suspend/resume and delete actions, and links to an independent registration list. Administrators can refresh/search participants and distinguish registration count from ticket totals. Registered events cannot be deleted, including when a registration arrives after the list loaded.

Status changes use a new `PATCH /api/admin/events/:id/status` endpoint that changes only the status under a row lock. It shares the existing admin access protection and does not replay other event fields. Existing transactional deletion and registration endpoints are reused. No changes to user1-owned public pages, shared models/services, server wiring or registration database code.

Validation: 28 Angular tests; production build; Chrome with real Express/MySQL using an isolated temporary database. Covered pause/resume and public registration rejection, preserving existing fields/registrations, confirmation/cancel, deletion of empty events, stale-count rejection, registration/delete and registration/pause races, independent roster refresh/search/deep reload, and mobile layouts. See README for reproducible checks.

Deployment/authentication UI acceptance remains a later module. Implemented by user2, Tianyi Li, with Codex assistance recorded in README. This file is a local draft: it does not create or update a GitHub PR.
