// Run after `ng build admin`. Owns an isolated database and temporary local servers.
const path = require('node:path'),
  fs = require('node:fs'),
  http = require('node:http'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const mysql = require(path.join(root, 'api/node_modules/mysql2/promise'));
const dotenv = require(path.join(root, 'api/node_modules/dotenv'));
const express = require(path.join(root, 'api/node_modules/express'));
const { chromium, expect } = require(path.join(root, 'api/node_modules/@playwright/test'));
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
    // Dedicated status changes must preserve other fields and existing registrations.
    const beforeStatus = data;
    const eventRow = page.locator('tbody tr').filter({ hasText: 'Angular updated event' });
    await expect(eventRow.getByRole('button', { name: 'Delete', exact: true })).toBeDisabled();
    await eventRow.getByRole('button', { name: 'Suspend', exact: true }).click();
    await eventRow.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal((await (await fetch(base + '/api/admin/events/' + id)).json()).status, 'active');
    await eventRow.getByRole('button', { name: 'Suspend', exact: true }).click();
    await eventRow.getByRole('button', { name: 'Confirm suspend', exact: true }).click();
    await expect(eventRow.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
    data = await (await fetch(base + '/api/admin/events/' + id)).json();
    assert.deepEqual(data, { ...beforeStatus, status: 'suspended' });
    assert.equal((await fetch(base + '/api/events/' + id)).status, 404);
    const unavailableRegistration = await fetch(base + '/api/events/' + id + '/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Paused guest', email: 'paused@example.test', tickets: 1 }),
    });
    assert.equal(unavailableRegistration.status, 404);
    const apiSend = (url, method, body) =>
      fetch(base + url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    const statusUrl = '/api/admin/events/' + id + '/status';
    assert.equal((await apiSend(statusUrl, 'PATCH', { status: 'past' })).status, 400);
    assert.equal(
      (await apiSend(statusUrl, 'PATCH', { status: 'active', name: 'must not change' })).status,
      400,
    );
    assert.equal(
      (await apiSend('/api/admin/events/no/status', 'PATCH', { status: 'active' })).status,
      400,
    );
    assert.equal(
      (await apiSend('/api/admin/events/2147483647/status', 'PATCH', { status: 'active' })).status,
      404,
    );
    assert.equal(
      (
        await fetch(base + statusUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'text/plain' },
          body: 'suspended',
        })
      ).status,
      415,
    );
    assert.equal(
      (
        await fetch(base + statusUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://different-origin.invalid',
          },
          body: JSON.stringify({ status: 'active' }),
        })
      ).status,
      403,
    );
    await eventRow
      .getByRole('link', { name: 'View registrations for Angular updated event', exact: true })
      .click();
    await expect(page.getByText('1 registrations · 2 tickets', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Angular Test Guest', { exact: true })).toBeVisible();
    await page.getByLabel('Find a participant').fill('unknown');
    await expect(page.getByText('No matching participants.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    fs.mkdirSync(artifacts, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: path.join(artifacts, 'registrations-mobile.png'),
      fullPage: true,
    });
    await page.getByRole('link', { name: '← All events', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await eventRow.getByRole('button', { name: 'Resume', exact: true }).click();
    await eventRow.getByRole('button', { name: 'Confirm resume', exact: true }).click();
    await expect(eventRow.getByRole('button', { name: 'Suspend', exact: true })).toBeVisible();
    assert.equal((await fetch(base + '/api/events/' + id)).status, 200);
    assert.deepEqual(await (await fetch(base + '/api/admin/events/' + id)).json(), beforeStatus);

    // The stale list says zero, but a registration arrives before DELETE.
    const input = { ...values, organisation_id: 1, category_id: 1, status: 'active' };
    const createdEmpty = await apiSend('/api/admin/events', 'POST', {
      ...input,
      name: 'Delete race test',
    });
    assert.equal(createdEmpty.status, 201);
    const protectedId = (await createdEmpty.json()).event_id;
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    const staleRow = page.locator('tbody tr').filter({ hasText: 'Delete race test' });
    await expect(staleRow.getByRole('button', { name: 'Delete', exact: true })).toBeEnabled();
    assert.equal(
      (
        await apiSend('/api/events/' + protectedId + '/registrations', 'POST', {
          name: 'Late guest',
          email: 'late@example.test',
          tickets: 3,
        })
      ).status,
      201,
    );
    await staleRow.getByRole('button', { name: 'Delete', exact: true }).click();
    await staleRow.getByRole('button', { name: 'Confirm delete', exact: true }).click();
    await expect(staleRow.getByRole('alert')).toContainText('has registrations');
    await expect(staleRow.getByRole('button', { name: 'Delete', exact: true })).toBeDisabled();
    assert.equal(
      (await (await fetch(base + '/api/admin/events/' + protectedId)).json()).registrations.length,
      1,
    );
    const createdDeletable = await apiSend('/api/admin/events', 'POST', {
      ...input,
      name: 'Delete empty test',
    });
    const deleteId = (await createdDeletable.json()).event_id;
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    const emptyRow = page.locator('tbody tr').filter({ hasText: 'Delete empty test' });
    await emptyRow
      .getByRole('link', { name: 'View registrations for Delete empty test', exact: true })
      .click();
    await expect(page.getByText('No registrations yet.', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: '← All events', exact: true }).click();
    await emptyRow.getByRole('button', { name: 'Delete', exact: true }).click();
    await emptyRow.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal((await fetch(base + '/api/admin/events/' + deleteId)).status, 200);
    await emptyRow.getByRole('button', { name: 'Delete', exact: true }).click();
    await emptyRow.getByRole('button', { name: 'Confirm delete', exact: true }).click();
    await expect(emptyRow).toHaveCount(0);
    assert.equal((await fetch(base + '/api/admin/events/' + deleteId)).status, 404);
    assert.equal((await fetch(base + '/api/events/' + deleteId)).status, 404);

    // A concurrent public registration either wins and protects the event, or is rejected.
    for (let n = 0; n < 3; n++) {
      const createdRace = await apiSend('/api/admin/events', 'POST', {
        ...input,
        name: 'Concurrent delete ' + n,
      });
      const raceId = (await createdRace.json()).event_id;
      const [registration, deletion] = await Promise.all([
        apiSend('/api/events/' + raceId + '/registrations', 'POST', {
          name: 'Race guest',
          email: 'race' + n + '@example.test',
          tickets: 1,
        }),
        apiSend('/api/admin/events/' + raceId, 'DELETE'),
      ]);
      assert.ok(
        (registration.status === 201 && deletion.status === 409) ||
          (registration.status === 404 && deletion.status === 200),
      );
    }
    // Suspension and registration share a parent-row lock. Once paused, new registrations fail.
    const pausing = await apiSend('/api/admin/events', 'POST', {
      ...input,
      name: 'Concurrent suspension',
    });
    const pauseId = (await pausing.json()).event_id;
    const [firstRegistration, pauseResult] = await Promise.all([
      apiSend('/api/events/' + pauseId + '/registrations', 'POST', {
        name: 'Before pause',
        email: 'before-pause@example.test',
        tickets: 1,
      }),
      apiSend('/api/admin/events/' + pauseId + '/status', 'PATCH', { status: 'suspended' }),
    ]);
    assert.equal(pauseResult.status, 200);
    assert.ok([201, 404].includes(firstRegistration.status));
    const pausedData = await (await fetch(base + '/api/admin/events/' + pauseId)).json();
    assert.equal(pausedData.status, 'suspended');
    assert.equal(pausedData.registrations.length, firstRegistration.status === 201 ? 1 : 0);
    assert.equal(
      (
        await apiSend('/api/events/' + pauseId + '/registrations', 'POST', {
          name: 'After pause',
          email: 'after-pause@example.test',
          tickets: 1,
        })
      ).status,
      404,
    );
    const [[orphans]] = await connection.query(
      'SELECT COUNT(*) AS total FROM registrations r LEFT JOIN events e ON r.event_id=e.event_id WHERE e.event_id IS NULL',
    );
    assert.equal(orphans.total, 0);
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
      'PASS: real API list/filter/create/persist/edit/public sync/registration preservation/timezone/deep reload/mobile/error recovery; suspend/resume/registration rejection/roster/stale-count delete protection/cancel/delete/concurrent registration.',
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
