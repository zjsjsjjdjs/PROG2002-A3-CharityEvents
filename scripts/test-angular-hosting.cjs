// Verify the actual Express hosting block without connecting to a business DB.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Module, createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
Object.assign(process.env, { NODE_ENV: 'production', PUBLIC_ORIGIN: 'https://hosting-test.example',
  ADMIN_USERNAME: 'hosting-test', ADMIN_PASSWORD: 'local-test-only-password',
  DB_HOST: '127.0.0.1', DB_PORT: '9', DB_USER: 'unused', DB_PASSWORD: '', DB_NAME: 'unused' });
const sourceFile = path.resolve(process.argv[2] || path.join(root, 'api/server.js'));
const source = fs.readFileSync(sourceFile, 'utf8');
const output = path.join(root, 'submission/hosting-check-' + Date.now());
const checks = [];
async function checkLayout(angular) {
  const layout = path.join(output, angular ? 'angular-installed' : 'legacy-only');
  fs.mkdirSync(path.join(layout, 'api'), { recursive: true });
  fs.cpSync(path.join(root, 'clientside'), path.join(layout, 'clientside'), { recursive: true });
  if (angular) fs.cpSync(path.join(root, 'angular/dist/public/browser'), path.join(layout, 'angular-public'), { recursive: true });
  const module = new Module(path.join(layout, 'api/server.js'));
  module.filename = path.join(layout, 'api/server.js');
  module.require = createRequire(path.join(root, 'api/server.js'));
  module._compile(source, module.filename);
  const app = module.exports;
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function check(url, expected, angularHtml, headers = {}) {
    const response = await fetch(base + url, { headers });
    assert.equal(response.status, expected, url);
    const body = await response.text();
    assert.equal(body.includes('<app-root>'), angularHtml, url);
    checks.push({ layout: angular ? 'angular' : 'legacy', url, status: expected });
  }
  try {
    if (angular) {
      for (const url of ['/', '/index.html', '/search?location=Brisbane', '/events/5', '/events/5/register',
        '/search.html?categoryId=1', '/detail.html?id=5', '/register.html?id=5', '/connection']) await check(url, 200, true);
      const assets = fs.readdirSync(path.join(layout, 'angular-public')).filter(name => /\.(?:js|css)$/.test(name));
      for (const asset of assets) await check('/' + asset, 200, false);
    } else {
      await check('/', 200, false); await check('/detail.html?id=5', 200, false);
    }
    for (const url of ['/api/not-a-route', '/missing.js', '/.env', '/api/.env']) await check(url, 404, false);
    await check('/api/admin/events', 401, false);
    await check('/admin.html', 401, false);
    await check('/admin-event.html?id=5', 401, false);
    const headers = { Authorization: 'Basic ' + Buffer.from('hosting-test:local-test-only-password').toString('base64') };
    await check('/admin.html', 200, false, headers);
    await check('/admin-event.html?id=5', 200, false, headers);
    await check('/assets/js/admin.js', 200, false);
  } finally { await new Promise(resolve => server.close(resolve)); }
}
(async () => {
  try {
    await checkLayout(true); await checkLayout(false);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ sourceFile, passed: checks.length, checks, businessDatabaseUsed: false }, null, 2));
    console.log(checks.length + ' hosting checks passed. Evidence: ' + output);
  } finally { await require('../api/event_db').pool.end(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
