const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Use an isolated user1_a3_test_* database.');
}
const app = require('../server');
const { pool } = require('../event_db');

test('M03 real browser acceptance', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await t.test('shows ordered attendees and preserves event ID when Register is clicked', async () => {
      await page.goto(base + '/detail.html?id=3');
      await expect(page.locator('#register-button')).toBeEnabled();
      assert.deepEqual(await page.locator('#attendee-list li strong').allTextContents(),
        ['Alex Chen', 'Riley Brown', 'Morgan Wu']);
      await expect(page.locator('#event-title')).toHaveText('Artists for Relief Silent Auction');
      const output = path.resolve(__dirname, '../../submission');
      fs.mkdirSync(output, { recursive: true });
      await page.screenshot({ path: path.join(output, 'm03-detail-desktop.png'), fullPage: true });
      await page.locator('#register-button').click();
      await expect(page).toHaveURL(base + '/register.html?id=3');
    });
    await t.test('mobile detail shows only the selected event and does not overflow', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + '/detail.html?id=5');
      await expect(page.locator('#register-button')).toBeEnabled();
      assert.deepEqual(await page.locator('#attendee-list li strong').allTextContents(),
        ['Drew Wilson', 'Robin Green', 'Avery Liu']);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.screenshot({ path: path.resolve(__dirname, '../../submission/m03-detail-mobile.png'), fullPage: true });
    });
    await t.test('empty and invalid event states are usable', async () => {
      await page.goto(base + '/detail.html?id=6');
      await expect(page.getByText('No registrations yet. Be the first to register.')).toBeVisible();
      await page.goto(base + '/detail.html?id=abc');
      await expect(page.locator('#register-button')).toBeDisabled();
      await expect(page.locator('#event-detail')).toContainText('No valid event was selected');
    });
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});

