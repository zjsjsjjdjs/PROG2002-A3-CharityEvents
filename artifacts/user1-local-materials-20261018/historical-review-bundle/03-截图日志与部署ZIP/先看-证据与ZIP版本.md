# Screenshots, Logs, and Deployment ZIPs

- Local test evidence: The most recently saved public-frontend, joint-testing, and hosting-check results, along with screenshots.
- Historical original logs: Command output retained from 2026-10-15; do not mislabel these as the latest round.
- Old-version and restored-version screenshots: Side-by-side comparison of the old site and the Angular appearance, both using the same local sample database.
- Online screenshots – user-provided: Screenshots of the restored homepage and weather card received in this conversation; source attribution is preserved.
- Deployment & source packages / cpanel-public-restored-d3f3878: Public-frontend deployment ZIP that restores the old appearance; already uploaded to cPanel by the user. Does not include new API/admin deployments.
- Deployment & source packages / user1-local-delivery-82e14e7-20261015-222124: Older complete source, API/database source, and public build package. For historical review only; not the latest final delivery package.
- Historical single-module packages: Earlier registration and weather build packages. For historical review only.

The original ZIP files remain byte-for-byte unchanged. After extraction on the server, the d3f3878 package showed 0666 permissions; the user has already adjusted them to 0644 per guidance. If reusing this original package, please check the extracted permissions. The original packages are not quietly rewritten here.

No real .env files, GitHub authorization tools, personal database backups, or cPanel session screenshots were included. Test logs retain their original content; the logs may contain local paths and temporary test database names and are not suitable as public promotional material.