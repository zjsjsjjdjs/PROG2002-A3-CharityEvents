const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) throw new Error('Use an isolated test DB.');
const app = require('../server'), { pool } = require('../event_db');

test('Final regression for the three reported backend issues', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
    await t.test('failed refresh preserves error through filtering and loading until successful retry', async () => {
      const page = await browser.newPage();
      try {
        await page.goto(base + '/admin.html');
        await expect(page.locator('#admin-events tr')).toHaveCount(8);
        await page.route('**/api/admin/events', route => route.abort());
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await expect(page.locator('#admin-status')).toHaveAttribute('data-error', 'true');
        const error = await page.locator('#admin-status').textContent();
        await page.getByLabel('Status', { exact: true }).selectOption('Suspended');
        await page.getByLabel('Find an event').fill('Paused');
        await expect(page.locator('#admin-events tr')).toHaveCount(0);
        await expect(page.locator('#admin-status')).toHaveText(error);
        await expect(page.locator('#admin-status')).toHaveAttribute('data-error', 'true');
        await page.unroute('**/api/admin/events');
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/admin/events', async route => { await gate; await route.continue(); });
        try {
          await page.getByRole('button', { name: 'Refresh', exact: true }).click();
          await page.getByLabel('Status', { exact: true }).selectOption('');
          await page.getByLabel('Find an event').fill('');
          await expect(page.locator('#admin-events tr')).toHaveCount(0);
          await expect(page.locator('#admin-status')).toContainText('Loading');
        } finally { release(); }
        await expect(page.locator('#admin-events tr')).toHaveCount(8);
        await expect(page.locator('#admin-status')).toHaveAttribute('data-error', 'false');
      } finally { await page.close(); }
    });
    await t.test('invalid editor IDs fail before event requests and valid and new forms load', async () => {
      const page = await browser.newPage(), requests = [];
      page.on('request', request => { if (request.url().includes('/api/admin/events/')) requests.push(request.url()); });
      try {
        for (const query of ['id=3&id=4', 'id=3&id=3', 'id=', 'id=0', 'id=-1', 'id=1.5', 'id=2147483648']) {
          await page.goto(base + '/admin-event.html?' + query);
          await expect(page.locator('#form-status')).toContainText('Invalid event ID');
          await expect(page.locator('#save-event')).toBeDisabled();
          await expect(page.locator('#name')).toBeDisabled();
        }
        assert.deepEqual(requests, []);
        await page.goto(base + '/admin-event.html?id=3');
        await expect(page.locator('#save-event')).toBeEnabled();
        await expect(page.locator('#name')).toHaveValue('Artists for Relief Silent Auction');
        await page.goto(base + '/admin-event.html');
        await expect(page.locator('#save-event')).toBeEnabled();
        await expect(page.locator('#name')).toHaveValue('');
      } finally { await page.close(); }
    });
    await t.test('existing .env aborts setup before any connection query or configuration write', async () => {
      const calls = [], messages = [];
      const script = path.resolve(__dirname, '../../scripts/prepare-admin-test-db.cjs');
      const localProcess = { argv: ['node', script, 'source.env'], exitCode: 0 };
      vm.runInNewContext(fs.readFileSync(script, 'utf8'), {
        __dirname: path.dirname(script), process: localProcess,
        console: { log() {}, error(message) { messages.push(message); } },
        require(name) {
          if (name === 'node:path') return path;
          if (name === 'node:fs') return {
            existsSync() { return true; }, readFileSync() { calls.push('read'); return ''; },
            writeFileSync() { calls.push('write'); }
          };
          if (name.endsWith('/dotenv')) return { parse() { return {}; } };
          if (name.endsWith('/mysql2/promise')) return { async createConnection() {
            calls.push('connect'); return { async query() { calls.push('query'); }, async end() {} };
          } };
          throw new Error('Unexpected dependency ' + name);
        }
      });
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(localProcess.exitCode, 1);
      assert.match(messages.join(' '), /api\/\.env already exists/);
      assert.deepEqual(calls, []);
    });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve)); await pool.end();
  }
});
