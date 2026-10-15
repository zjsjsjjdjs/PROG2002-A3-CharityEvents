// Real Express + disposable MariaDB/MySQL + Chrome acceptance for public Angular pages.
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const assert = require("node:assert/strict");
const mysql = require("../api/node_modules/mysql2/promise");
const dotenv = require("../api/node_modules/dotenv");
const { chromium, expect } = require("../api/node_modules/@playwright/test");
const root = path.resolve(__dirname, "..");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function main() {
  const envFile =
    process.env.ANGULAR_TEST_ENV_FILE || path.join(root, "api/.env");
  const local = fs.existsSync(envFile)
    ? dotenv.parse(fs.readFileSync(envFile))
    : {};
  const env = { ...process.env, ...local };
  const output = path.join(root, "submission/angular-public-checks");
  fs.mkdirSync(output, { recursive: true });
  const database =
    "a3_angular_public_" + Date.now() + "_" + randomBytes(4).toString("hex");
  const connection = await mysql.createConnection({
    host: env.DB_HOST || "localhost",
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  let created = false,
    browser;
  const children = [],
    checks = [],
    pageErrors = [];
  function start(name, args, childEnv) {
    const child = spawn(process.execPath, args, {
      cwd: name === "angular" ? path.join(root, "angular") : root,
      env: childEnv,
      windowsHide: true,
    });
    let log = "";
    child.stdout.on("data", (data) => (log += data));
    child.stderr.on("data", (data) => (log += data));
    child.on("error", (error) => (log += error.message));
    children.push({ child, name, log: () => log });
    return child;
  }
  async function ready(url, child) {
    for (let i = 0; i < 120; i++) {
      if (child.exitCode !== null)
        throw new Error("Server exited before readiness");
      try {
        if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok)
          return;
      } catch {}
      await delay(500);
    }
    throw new Error("Server readiness timed out");
  }
  const passed = (label) => {
    checks.push(label);
    console.log("PASS: " + label);
  };
  try {
    await connection.query(
      "CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4",
    );
    created = true;
    await connection.query("USE `" + database + "`");
    await connection.query(
      fs.readFileSync(path.join(root, "database/a3-fresh-install.sql"), "utf8"),
    );
    // Deterministic future event, independent of the sample dates or host timezone.
    await connection.query(
      "UPDATE events SET name = 'Angular acceptance event', location = 'Angular Test Hall', event_datetime = '2099-11-02 14:00:00', status = 'active' WHERE event_id = 1",
    );
    await connection.query(
      "UPDATE events SET status = 'suspended' WHERE event_id = 2",
    );
    const [[fixture]] = await connection.query(
      "SELECT category_id FROM events WHERE event_id = 1",
    );
    const apiPort = await freePort(),
      uiPort = await freePort();
    const apiOrigin = "http://127.0.0.1:" + apiPort,
      uiOrigin = "http://127.0.0.1:" + uiPort;
    const childEnv = {
      ...env,
      DB_NAME: database,
      HOST: "127.0.0.1",
      PORT: String(apiPort),
      NODE_ENV: "development",
      ADMIN_USERNAME: "",
      ADMIN_PASSWORD: "",
      PUBLIC_ORIGIN: "",
      CORS_ALLOWED_ORIGINS: "",
      NG_CLI_ANALYTICS: "false",
    };
    const api = start("api", [path.join(root, "api/app.js")], childEnv);
    await ready(apiOrigin + "/api/health", api);
    const ui = start(
      "angular",
      [
        "node_modules/@angular/cli/bin/ng.js",
        "serve",
        "public",
        "--port",
        String(uiPort),
      ],
      { ...childEnv, PORT: String(uiPort), API_PROXY_TARGET: apiOrigin },
    );
    await ready(uiOrigin, ui);
    browser = await chromium.launch({
      channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
      headless: true,
    });
    const page = await browser.newPage({
      viewport: { width: 1366, height: 1000 },
      timezoneId: "Asia/Shanghai",
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto(uiOrigin);
    await expect(
      page.getByRole("heading", {
        name: "Angular acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(output, "home-desktop.png"),
      fullPage: true,
    });
    passed("Home loads upcoming events from real Express and database");
    await page
      .getByRole("link", { name: "Search events", exact: true })
      .click();
    await page.getByLabel("Date", { exact: true }).fill("2099-11-02");
    await page
      .getByLabel("Location", { exact: true })
      .fill("Angular Test Hall");
    await page
      .getByLabel("Category", { exact: true })
      .selectOption(String(fixture.category_id));
    await page
      .getByRole("button", { name: "Search events", exact: true })
      .click();
    await expect(
      page.getByText("1 event found", { exact: true }),
    ).toBeVisible();
    assert.ok(
      page.url().includes("date=2099-11-02") &&
        page.url().includes("categoryId="),
    );
    await page.reload();
    await expect(
      page.getByText("1 event found", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Location", { exact: true })).toHaveValue(
      "Angular Test Hall",
    );
    await page.screenshot({
      path: path.join(output, "search-desktop.png"),
      fullPage: true,
    });
    passed("Combined date/location/category filters survive direct reload");
    await page
      .getByRole("link", {
        name: "View details for Angular acceptance event",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Angular acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".event-facts").first()).toContainText("2:00 pm");
    await page.screenshot({
      path: path.join(output, "detail-desktop.png"),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Back to search", exact: false })
      .click();
    await expect(
      page.getByText("1 event found", { exact: true }),
    ).toBeVisible();
    passed(
      "Detail shows Brisbane wall time on a UTC+8 browser and restores search",
    );
    await page
      .getByLabel("Location", { exact: true })
      .fill("No matching location");
    await page
      .getByRole("button", { name: "Search events", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "No matching events" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Angular acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Date", { exact: true })).toHaveValue("");
    passed("Empty results and clear filters recover correctly");
    await page.route("**/api/events/search*", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: "{}",
      }),
    );
    await page
      .getByRole("button", { name: "Search events", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("could not be loaded");
    assert.equal(await page.locator(".event-card").count(), 0);
    await page.unroute("**/api/events/search*");
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Angular acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    passed("Failed search hides stale results and retry recovers");
    await page.goto(uiOrigin + "/events/2");
    await expect(page.getByRole("alert")).toContainText("removed or suspended");
    assert.equal(await page.locator(".booking-panel").count(), 0);
    await page.goto(uiOrigin + "/events/not-valid");
    await expect(page.getByRole("alert")).toContainText("No valid event");
    passed("Suspended and invalid events cannot expose a registration action");
    await page.goto(uiOrigin + "/events/1?categoryId=" + fixture.category_id);
    await page
      .getByRole("link", { name: "Register for this event", exact: false })
      .click();
    await expect(page).toHaveURL(new RegExp("/events/1/register"));
    await expect(page.locator("#attendee-name")).toBeEnabled();
    await expect(
      page.getByRole("heading", {
        name: "Angular acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("highlighted fields");
    await page.locator("#attendee-name").fill("Angular Browser Guest");
    await page.locator("#attendee-email").fill("angular-browser@example.test");
    await page.locator("#attendee-tickets").fill("0");
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(page.locator("#tickets-hint")).toContainText("whole number");
    const [[before]] = await connection.query(
      "SELECT COUNT(*) AS count FROM registrations WHERE email = 'angular-browser@example.test'",
    );
    assert.equal(before.count, 0);
    passed("Angular form prevents invalid submissions before database writes");
    await page.locator("#attendee-tickets").fill("2");
    await page.screenshot({
      path: path.join(output, "registration-desktop.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Registration confirmed" }),
    ).toBeVisible();
    assert.equal(await page.locator("form").count(), 0);
    assert.ok(!page.url().includes("email") && !page.url().includes("Guest"));
    await page
      .getByRole("link", { name: "View event details", exact: false })
      .click();
    await expect(page).toHaveURL(new RegExp("/events/1\\?categoryId="));
    await expect(page.locator(".attendee-list li").first()).toContainText(
      "Angular Browser Guest",
    );
    const [[saved]] = await connection.query(
      "SELECT tickets FROM registrations WHERE event_id = 1 AND email = 'angular-browser@example.test'",
    );
    assert.equal(saved.tickets, 2);
    passed(
      "Angular registration confirms and refreshes real attendee data, retaining search filters",
    );
    async function fillRegistration(id, email, name = "Angular Browser Guest") {
      await page.goto(uiOrigin + "/events/" + id + "/register");
      await expect(page.locator("#attendee-name")).toBeEnabled();
      await page.locator("#attendee-name").fill(name);
      await page.locator("#attendee-email").fill(email);
      await page.locator("#attendee-tickets").fill("2");
    }
    await fillRegistration(1, " ANGULAR-BROWSER@EXAMPLE.TEST ");
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("already registered");
    await expect(page.locator("#attendee-name")).toHaveValue(
      "Angular Browser Guest",
    );
    const [[duplicates]] = await connection.query(
      "SELECT COUNT(*) AS count FROM registrations WHERE event_id=1 AND email='angular-browser@example.test'",
    );
    assert.equal(duplicates.count, 1);
    passed(
      "Duplicate email with changed case/spacing is rejected without losing input",
    );
    await connection.query(
      "UPDATE events SET status='active' WHERE event_id=3",
    );
    await fillRegistration(3, "angular-browser@example.test");
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Registration confirmed" }),
    ).toBeVisible();
    passed("The same email can register for a different event");
    await fillRegistration(1, "network-guest@example.test", "Network Guest");
    await page.route("**/api/events/1/registrations", (route) =>
      route.abort("failed"),
    );
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText(
      "could not be confirmed",
    );
    await expect(page.locator("#attendee-name")).toHaveValue("Network Guest");
    await expect(page.locator("#attendee-tickets")).toHaveValue("2");
    await page.unroute("**/api/events/1/registrations");
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Registration confirmed" }),
    ).toBeVisible();
    passed("Network failure keeps input and a deliberate retry can succeed");
    await fillRegistration(3, "suspended-guest@example.test");
    await connection.query(
      "UPDATE events SET status='suspended' WHERE event_id=3",
    );
    await page
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("no longer available");
    await expect(
      page.getByRole("button", { name: "Submit registration", exact: true }),
    ).toBeDisabled();
    passed("Suspension between loading and submit blocks registration safely");
    await page.goto(uiOrigin + "/register.html?id=1");
    await expect(page.locator("#attendee-name")).toBeEnabled();
    await page.goto(uiOrigin + "/register.html?id=1&id=2");
    await expect(page.getByRole("alert")).toContainText("No valid event");
    assert.equal(await page.locator("form").count(), 0);
    passed(
      "Legacy registration bookmarks open Angular; duplicate IDs are rejected",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [label, url, selector] of [
      ["home", "/", ".event-card"],
      ["search", "/search", ".event-card"],
      ["detail", "/events/1", ".booking-panel"],
      ["registration", "/events/1/register", ".registration-form"],
    ]) {
      await page.goto(uiOrigin + url);
      await page.locator(selector).first().waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        label + " overflows",
      );
      await page.screenshot({
        path: path.join(output, label + "-mobile.png"),
        fullPage: true,
      });
    }
    passed("All four public pages fit a 390 px viewport");
    assert.deepEqual(pageErrors, []);
    passed("No unhandled browser page errors");
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify({ passed: checks.length, checks, pageErrors }, null, 2),
    );
  } catch (error) {
    if (browser) {
      const page = browser.contexts()[0]?.pages()[0];
      if (page)
        await page
          .screenshot({
            path: path.join(output, "failure.png"),
            fullPage: true,
          })
          .catch(() => {});
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    for (const { child } of children) {
      if (child.exitCode === null) {
        const exited = new Promise((resolve) => child.once("exit", resolve));
        child.kill();
        await Promise.race([exited, delay(5000)]);
      }
    }
    for (const entry of children)
      fs.writeFileSync(path.join(output, entry.name + ".log"), entry.log());
    if (created) {
      await connection.query("DROP DATABASE `" + database + "`");
      console.log("Disposed this run's isolated database.");
    }
    await connection.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
