# PROG2002 A3 Charity Events

Harbour Hope is an Angular 22 and TypeScript charity-event application with public browsing, search, registration and Open-Meteo weather, plus protected event administration. It extends Tianyi Li's A2 project and preserves both members' Git history.

Final application source baseline: `61f293c` (main after PR #21). Documentation and release-tool refinements in this working tree are local changes for final review; they have not been pushed. The older HTML client remains as a historical implementation and API validation dependency.

## Contributors and source

- Tianyi Li (user2, GitHub zjsjsjjdjs): original A2 code, management APIs and Angular pages, administrator access, hosting and deployment support.
- Hongke Ouyang (user1, GitHub Sakitam630): registration database/APIs, Angular foundation and public pages, weather, integration work, delivery coordination and restored public/admin appearance.
- A2: https://github.com/zjsjsjjdjs/prog2002-charity-events (public), baseline `5c800ac`.
- A3: https://github.com/zjsjsjjdjs/PROG2002-A3-CharityEvents (public).

## User2 deployed application

Public: https://24832371.it.scu.edu.au/

Management: https://24832371.it.scu.edu.au/admin/

Health: https://24832371.it.scu.edu.au/api/health

User2 confirmed the guided online acceptance checks on 17 October 2026. This is participant-reported manual evidence, separate from automated local tests. See [acceptance](docs/user2-angular-acceptance.md).

## Install and run the final Angular application locally

Use Node 24.19.0 for the recorded build environment. The Angular package declares compatible Node 22.22.3+ within 22.x, 24.15+ within 24.x, or >=26. The school's Node 18.20.8 runs the API and prebuilt static files; do not build Angular on that runtime.

1. Create and select an empty MySQL/MariaDB database; import `database/a3-fresh-install.sql`. Never import this seed into an existing deployment.
2. Run `npm ci --prefix api` and `npm ci --prefix angular`.
3. If absent, copy `api/.env.example` to `api/.env`. Configure the local database privately. For local HTTP use `NODE_ENV=development` and leave `PUBLIC_ORIGIN` empty. Set both administrator credentials if testing the login page; otherwise development administration is loopback-only.
4. Build each app from the `angular` directory:

```sh
npm run ng -- build public --base-href /
npm run ng -- build admin --base-href /admin/
```

5. Set `APP_FRONTEND=angular` in the local `api/.env`. Leave `ANGULAR_PUBLIC_DIR` and `ANGULAR_ADMIN_DIR` unset to use the default `angular/dist/.../browser` paths, or set them explicitly relative to `api`.
6. From the project root run `npm start --prefix api`. Open `http://127.0.0.1:3000/` and `/admin/`; use your configured PORT if different.

For separate development servers see [Angular workspace](angular/README.md). `ng serve` is not the production deployment method. If APP_FRONTEND is omitted, the original legacy startup remains available; it is not the final Angular launch mode.

## Reproduce and review

- [Final delivery and source map](docs/a3-delivery.md)
- [Actual cPanel deployment procedure](docs/angular-cpanel-deployment.md)
- [Administration and API guide](docs/backend-guide.md)
- [Local and online acceptance](docs/user2-angular-acceptance.md)
- [Contribution and AI assistance](docs/user2-contribution-ai.md)
- [Documentation index](docs/README.md)

Final review directories are deliberately uncompressed. No real `.env`, installed dependencies, Git credential data, live database exports or personal peer-assessment scores belong in the code hand-in. Personal reports, videos and evaluation forms are supplied separately by each member. No final coursework submission is implied by these files.
