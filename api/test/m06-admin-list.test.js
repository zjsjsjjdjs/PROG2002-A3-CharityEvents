const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) throw new Error('Use an isolated test DB.');
const app = require('../server');
const { pool } = require('../event_db');
test('M06 admin directory and public filtering', async (t) => {
  const server = app.listen(0, '127.0.0.1'); await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    await t.test('all events include Past and Suspended with accurate registration totals', async () => {
      const response = await fetch(base + '/api/admin/events'); assert.equal(response.status, 200);
      const rows = await response.json(); assert.equal(rows.length, 8);
      assert.equal(rows.find((e) => e.event_id === 8).display_status, 'Suspended');
      assert.equal(rows.find((e) => e.event_id === 6).display_status, 'Past');
      assert.equal(rows.find((e) => e.event_id === 3).registration_count, 3);
      assert.ok(rows.every((e) => e.event_datetime.endsWith('+10:00')));
    });
    await t.test('public search and detail continue hiding suspended events', async () => {
      const rows = await (await fetch(base + '/api/events/search')).json();
      assert.ok(rows.some((e) => e.event_id === 6)); assert.ok(rows.every((e) => e.status === 'active'));
      assert.equal((await fetch(base + '/api/events/8')).status, 404);
      const upcoming = await (await fetch(base + '/api/events/upcoming')).json();
      assert.ok(upcoming.every((e) => e.status === 'active' && e.event_id !== 6));
    });
    await t.test('browser filters, empty and failure feedback work on desktop and mobile', async () => {
      browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
      const page = await browser.newPage(); await page.goto(base + '/admin.html');
      await expect(page.locator('#admin-events tr')).toHaveCount(8);
      await page.getByLabel('Status', { exact: true }).selectOption('Suspended');
      await expect(page.locator('#admin-events tr')).toHaveCount(1);
      await expect(page.locator('#admin-events')).toContainText('Paused Premium Auction');
      await page.getByLabel('Find an event').fill('no such event'); await expect(page.locator('#admin-status')).toContainText('No events match');
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.route('**/api/admin/events', (route) => route.abort()); await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.locator('#admin-status')).toContainText('Check your connection');
      await page.unroute('**/api/admin/events'); await page.getByLabel('Find an event').fill(''); await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.locator('#admin-events tr')).toHaveCount(1);
    });
  } finally { if (browser) await browser.close(); await new Promise((resolve) => server.close(resolve)); await pool.end(); }
});
