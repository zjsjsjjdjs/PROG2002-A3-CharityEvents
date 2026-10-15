// Run after `ng build admin`. Owns an isolated database and temporary local servers.
const path = require('node:path'),
  fs = require('node:fs'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const mysql = require(path.join(root, 'api/node_modules/mysql2/promise'));
const dotenv = require(path.join(root, 'api/node_modules/dotenv'));
const express = require(path.join(root, 'api/node_modules/express'));
const { chromium } = require(path.join(root, 'api/node_modules/@playwright/test'));
const env = dotenv.parse(fs.readFileSync(path.join(root, 'api/.env')));
const database =
  'user2_angular_test_' + Date.now() + '_' + require('node:crypto').randomBytes(3).toString('hex');
const artifacts = path.join(root, 'submission/angular-admin-qa');
async function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}
async function close(server) {
  if (server) await new Promise((resolve) => server.close(resolve));
}
(async () => {
  let connection,
    apiServer,
    webServer,
    browser,
    pool,
    created = false;
  try {
    connection = await mysql.createConnection({
      host: env.DB_HOST || 'localhost',
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      multipleStatements: true,
    });
    await connection.query('CREATE DATABASE `' + database + '` CHARACTER SET utf8mb4');
    created = true;
    await connection.query('USE `' + database + '`');
    await connection.query(
      fs.readFileSync(path.join(root, 'database/a3-fresh-install.sql'), 'utf8'),
    );
    Object.assign(process.env, env, {
      DB_NAME: database,
      NODE_ENV: 'development',
      ADMIN_USERNAME: '',
      ADMIN_PASSWORD: '',
      PUBLIC_ORIGIN: '',
      CORS_ALLOWED_ORIGINS: '',
    });
    apiServer = await listen(require(path.join(root, 'api/server')));
    pool = require(path.join(root, 'api/event_db')).pool;
    const app = express();
    app.use('/api', (req, res) => {
      const upstream = http.request(
        {
          hostname: '127.0.0.1',
          port: apiServer.address().port,
          path: req.originalUrl,
          method: req.method,
          headers: req.headers,
        },
        (response) => {
          res.writeHead(response.statusCode, response.headers);
          response.pipe(res);
        },
      );
      upstream.on('error', () => res.status(502).end());
      req.pipe(upstream);
    });
    const dist = path.join(root, 'angular/dist/admin/browser');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
    webServer = await listen(app);
    const base = 'http://127.0.0.1:' + webServer.address().port;
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      timezoneId: 'Asia/Shanghai',
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto(base + '/');
    await page.getByRole('heading', { name: 'All events', exact: true }).waitFor();
    await page.locator('tbody tr').first().waitFor();
    const initial = await page.locator('tbody tr').count();
    assert.equal(initial, 8);
    await page.getByLabel('Status', { exact: true }).selectOption('Suspended');
    assert.ok((await page.locator('tbody tr').count()) > 0);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('link', { name: 'Create event', exact: true }).click();
    await page.locator('#name').waitFor();
    await page.getByRole('button', { name: 'Create event', exact: true }).click();
    await page.getByText('Event name is required.', { exact: true }).waitFor();
    const values = {
      name: 'Angular acceptance event',
      location: 'Brisbane',
      purpose: 'Support local food relief',
      short_description: 'Join the community',
      full_description: 'A charity event created through the Angular management form.',
      event_datetime: '2030-11-02T14:30:05',
      ticket_price: '12.50',
      fundraising_goal: '1000.00',
      current_progress: '0.00',
      latitude: '-27.4698',
      longitude: '153.0251',
    };
    for (const [key, value] of Object.entries(values)) await page.locator('#' + key).fill(value);
    await page.locator('#category_id').selectOption({ index: 1 });
    const posted = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/api/admin/events'),
    );
    await page.getByRole('button', { name: 'Create event', exact: true }).click();
    const response = await posted;
    assert.equal(response.status(), 201);
    const id = (await response.json()).event_id;
    await page.getByText('Event #' + id + ' created.', { exact: false }).waitFor();
    await page.reload();
    await page.getByRole('link', { name: 'Edit Angular acceptance event', exact: true }).waitFor();
    let data = await (await fetch(base + '/api/admin/events/' + id)).json();
    assert.equal(data.event_datetime, '2030-11-02T14:30:05+10:00');
    assert.equal(Number(data.latitude), -27.4698);
    const registered = await fetch(base + '/api/events/' + id + '/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Angular Test Guest',
        email: 'angular-test@example.test',
        tickets: 2,
      }),
    });
    assert.equal(registered.status, 201);
    await page.getByRole('link', { name: 'Edit Angular acceptance event', exact: true }).click();
    await page.getByText('Angular Test Guest', { exact: true }).waitFor();
    assert.equal(await page.locator('#event_datetime').inputValue(), '2030-11-02T14:30:05');
    await page.locator('#name').fill('Angular updated event');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.getByText('Event #' + id + ' updated.', { exact: false }).waitFor();
    data = await (await fetch(base + '/api/admin/events/' + id)).json();
    assert.equal(data.name, 'Angular updated event');
    assert.equal(data.registrations.length, 1);
    assert.equal(data.event_datetime, '2030-11-02T14:30:05+10:00');
    const publicData = await (await fetch(base + '/api/events/' + id)).json();
    assert.equal(publicData.name, 'Angular updated event');
    fs.mkdirSync(artifacts, { recursive: true });
    await page.screenshot({ path: path.join(artifacts, 'list-desktop.png'), fullPage: true });
    await page.goto(base + '/events/' + id + '/edit');
    await page.locator('#name').waitFor();
    await page.reload();
    await page.locator('#name').waitFor();
    assert.equal(await page.locator('#name').inputValue(), 'Angular updated event');
    await page.screenshot({ path: path.join(artifacts, 'edit-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifacts, 'edit-mobile.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('link', { name: '← All events', exact: true }).click();
    await page.locator('tbody tr').first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(artifacts, 'list-mobile.png'), fullPage: true });
    await page.route('**/api/admin/events', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
    );
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page.getByText('The service is unavailable.', { exact: false }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.getByLabel('Status', { exact: true }).selectOption('Active');
    assert.equal(await page.locator('tbody tr').count(), 0);
    await page.unroute('**/api/admin/events');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.locator('tbody tr').first().waitFor();
    assert.deepEqual(pageErrors, []);
    console.log(
      'PASS: real API list/filter/create/persist/edit/public sync/registration preservation/timezone/deep reload/mobile/error recovery.',
    );
  } finally {
    if (browser) await browser.close();
    await close(webServer);
    await close(apiServer);
    if (pool) await pool.end();
    if (connection) {
      if (created) await connection.query('DROP DATABASE `' + database + '`');
      await connection.end();
    }
    console.log('Disposed owned test resources.');
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
