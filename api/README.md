# A3 API

Original A2 and administration: Tianyi Li (user2). Registration and integration:
Hongke Ouyang (user1). Original Git authorship is preserved.

Keep this directory beside clientside. Configure the ignored .env from .env.example,
including DB_PORT, and import ../database/a3-fresh-install.sql into an empty selected
database. From the project root run npm ci --prefix api and npm start --prefix api.
The startup entry is app.js. All supplied pages use the same-origin /api path.

The API includes health, categories, public event browsing/search/detail, registration
submission and protected admin CRUD. Public detail includes attendee lists; suspended
events are accessible only via admin routes. All event times serialize with +10:00.

See [complete route and error summary](../docs/a3-delivery.md),
[admin request fields](../docs/backend-guide.md) and
[environment and deployment](../docs/cpanel-deployment.md).

Run node scripts/test-joint-acceptance.cjs from the project root for fresh isolated
acceptance. Do not direct mutation tests at real or production data.
