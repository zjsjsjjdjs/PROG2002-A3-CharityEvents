const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) {
  throw new Error('Use an isolated user1_a3_test_* database.');
}
const app = require('../server');
const { pool } = require('../event_db');

test('M11 public A2 regression and registration integration', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    await t.test('health and categories remain available', async () => {
      const health = await (await fetch(base + '/api/health')).json();
      assert.deepEqual(health, { status: 'ok', database: 'connected' });
      const categories = await (await fetch(base + '/api/categories')).json();
      assert.equal(categories.length, 5);
    });
    await t.test('homepage contains active events from today onward in Brisbane order', async () => {
      const events = await (await fetch(base + '/api/events/upcoming')).json();
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(new Date());
      const part = (type) => parts.find((p) => p.type === type).value;
      const today = part('year') + '-' + part('month') + '-' + part('day');
      const fixtures = [[7, '2026-07-19'], [6, '2026-08-30'], [1, '2026-09-27'],
        [2, '2026-10-04'], [3, '2026-10-11'], [4, '2026-10-18'], [5, '2026-11-02']];
      assert.deepEqual(events.map((e) => e.event_id), fixtures.filter((e) => e[1] >= today).map((e) => e[0]));
      assert.ok(events.every((e) => e.status === 'active' && e.event_datetime.endsWith('+10:00')));
    });
    await t.test('search supports each filter, AND combinations, empty results and active past events', async () => {
      const cases = [
        ['', [7, 6, 1, 2, 3, 4, 5]],
        ['date=2026-10-04', [2]],
        ['location=Brisbane', [1, 2]],
        ['categoryId=1', [6, 1]],
        ['date=2026-10-04&location=Brisbane&categoryId=2', [2]],
        ['date=2026-10-04&categoryId=1', []],
        ['location=NoSuchPlace', []]
      ];
      for (const [query, ids] of cases) {
        const response = await fetch(base + '/api/events/search?' + query);
        assert.equal(response.status, 200);
        assert.deepEqual((await response.json()).map((e) => e.event_id), ids);
      }
    });
    await t.test('invalid filters remain 400 and SQL-like location input does not broaden results', async () => {
      for (const query of ['date=2026-02-30', 'categoryId=-1', 'categoryId=1.5',
        'date=2026-10-04&date=2026-10-11', 'location[x]=Brisbane']) {
        const response = await fetch(base + '/api/events/search?' + query);
        assert.equal(response.status, 400);
      }
      const result = await (await fetch(base + '/api/events/search?location=' + encodeURIComponent("' OR 1=1 --"))).json();
      assert.deepEqual(result, []);
    });
    await t.test('homepage, search and detail preserve the same Brisbane event timestamp', async () => {
      const detail = await (await fetch(base + '/api/events/3')).json();
      const search = await (await fetch(base + '/api/events/search?date=2026-10-11')).json();
      const upcoming = await (await fetch(base + '/api/events/upcoming')).json();
      assert.equal(detail.event_datetime, '2026-10-11T14:00:00+10:00');
      assert.equal(search[0].event_datetime, detail.event_datetime);
      const card = upcoming.find((e) => e.event_id === 3);
      if (card) assert.equal(card.event_datetime, detail.event_datetime);
    });
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await t.test('A2 homepage cards render and link to their own detail pages', async () => {
      const events = await (await fetch(base + '/api/events/upcoming')).json();
      await page.goto(base + '/');
      await expect(page.locator('#event-list .event-card')).toHaveCount(events.length);
      if (events.length > 0) {
        const card = page.locator('#event-list .event-card').first();
        await expect(card.locator('h3')).toHaveText(events[0].name);
        await card.getByRole('link', { name: 'View details' }).click();
        await expect(page).toHaveURL(base + '/detail.html?id=' + events[0].event_id);
        await expect(page.locator('#register-button')).toBeEnabled();
      } else {
        await expect(page.locator('#events-status')).toContainText('no upcoming events');
      }
    });
    await t.test('A2 search, combined filters, reset and no results work in the browser', async () => {
      await page.goto(base + '/search.html');
      await expect(page.locator('#event-category option')).toHaveCount(6);
      await page.getByLabel('Date', { exact: true }).fill('2026-10-04');
      await page.getByLabel('Location', { exact: true }).fill('Brisbane');
      await page.getByLabel('Category', { exact: true }).selectOption('2');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await expect(page.locator('#search-results .event-card')).toHaveCount(1);
      await expect(page.locator('#search-results')).toContainText('Hope Under the Stars Gala');
      await page.getByRole('button', { name: 'Clear filters' }).click();
      await expect(page.locator('#search-results .event-card')).toHaveCount(0);
      await expect(page.locator('#event-date')).toHaveValue('');
      await expect(page.locator('#event-location')).toHaveValue('');
      await expect(page.locator('#event-category')).toHaveValue('');
      await expect(page.locator('#search-status')).toContainText('Filters cleared');
      await page.getByLabel('Location', { exact: true }).fill('NoSuchPlace');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await expect(page.locator('#search-status')).toContainText('No events matched');
    });
    await t.test('detail and registration display the stored Brisbane time, not the host timezone', async () => {
      await page.goto(base + '/detail.html?id=3');
      await expect(page.locator('#registration-summary')).toContainText('2:00 pm');
      await page.locator('#register-button').click();
      await expect(page.locator('#selected-event')).toContainText('2:00 pm');
    });
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});
