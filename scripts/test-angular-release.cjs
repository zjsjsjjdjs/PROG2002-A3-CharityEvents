// Exercise the packaged app with real MySQL and browser sessions; no live data is changed.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { spawn } = require("node:child_process"),
  { randomBytes } = require("node:crypto");
const mysql = require("../api/node_modules/mysql2/promise"),
  dotenv = require("../api/node_modules/dotenv");
const { chromium, expect } = require("../api/node_modules/@playwright/test");
const root = path.resolve(__dirname, ".."),
  candidate = path.resolve(process.argv[2] || "");
if (!fs.existsSync(path.join(candidate, "manifest.json")))
  throw new Error(
    "Pass a generated release directory containing manifest.json.",
  );
const release = path.join(candidate, "release"),
  output = path.join(root, "submission/angular-deployment-qa");
async function main() {
  const env = dotenv.parse(fs.readFileSync(path.join(root, "api/.env")));
  const db =
    "user2_release_" + Date.now() + "_" + randomBytes(3).toString("hex");
  const username = "local-review-admin",
    password = randomBytes(24).toString("hex");
  let connection,
    created = false,
    child,
    browser;
  try {
    connection = await mysql.createConnection({
      host: env.DB_HOST || "localhost",
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER || "root",
      password: env.DB_PASSWORD || "",
      multipleStatements: true,
    });
    await connection.query(
      "CREATE DATABASE `" + db + "` CHARACTER SET utf8mb4",
    );
    created = true;
    await connection.query("USE `" + db + "`");
    await connection.query(
      fs.readFileSync(
        path.join(release, "database/a3-fresh-install.sql"),
        "utf8",
      ),
    );
    child = spawn(process.execPath, ["app.js"], {
      cwd: path.join(release, "api"),
      windowsHide: true,
      env: {
        ...process.env,
        ...env,
        DB_NAME: db,
        NODE_ENV: "development",
        APP_FRONTEND: "angular",
        ANGULAR_PUBLIC_DIR: "../frontend/public",
        ANGULAR_ADMIN_DIR: "../frontend/admin",
        HOST: "127.0.0.1",
        PORT: "0",
        PUBLIC_ORIGIN: "",
        CORS_ALLOWED_ORIGINS: "",
        ADMIN_USERNAME: username,
        ADMIN_PASSWORD: password,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const port = await new Promise((resolve, reject) => {
      let log = "";
      const timer = setTimeout(
        () => reject(new Error("Packaged app startup timed out.")),
        15000,
      );
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", () => {
        clearTimeout(timer);
        reject(new Error("Packaged app exited before startup."));
      });
      child.stdout.on("data", (data) => {
        log += data;
        const match = /listening on port (\d+)/.exec(log);
        if (match) {
          clearTimeout(timer);
          resolve(Number(match[1]));
        }
      });
    });
    const base = "http://127.0.0.1:" + port;
    assert.equal(
      (await (await fetch(base + "/api/health")).json()).database,
      "connected",
    );
    assert.equal((await fetch(base + "/api/admin/events")).status, 401);
    for (const url of [
      "/.env",
      "/api/.env",
      "/.git/config",
      "/api/event_db.js",
      "/missing.js",
    ])
      assert.equal((await fetch(base + url)).status, 404);
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext({
      viewport: { width: 1360, height: 960 },
      timezoneId: "Asia/Shanghai",
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto(base + "/admin/events");
    await expect(
      page.getByRole("heading", { name: "Administrator sign in", exact: true }),
    ).toBeVisible();
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({
      path: path.join(output, "login-desktop.png"),
      fullPage: true,
    });
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("incorrect");
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Manage events", exact: true }),
    ).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(8);
    const cookies = await context.cookies();
    assert.ok(
      cookies.some(
        (c) => c.name === "hh_admin" && c.httpOnly && c.sameSite === "Strict",
      ),
    );
    await page.getByRole("link", { name: "+ New event", exact: true }).click();
    for (const [key, value] of Object.entries({
      name: "Release acceptance event",
      location: "Brisbane",
      purpose: "Food relief",
      short_description: "Join the event",
      full_description: "Release acceptance via protected Angular management.",
      event_datetime: "2031-11-02T14:30:05",
      ticket_price: "5",
      latitude: "-27.4698",
      longitude: "153.0251",
    }))
      await page.locator("#" + key).fill(value);
    await page.locator("#category_id").selectOption({ index: 1 });
    const posted = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().endsWith("/api/admin/events"),
    );
    await page
      .getByRole("button", { name: "Create event", exact: true })
      .click();
    const response = await posted;
    assert.equal(response.status(), 201);
    const id = (await response.json()).event_id;
    await expect(
      page.getByRole("link", {
        name: "Edit Release acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    const row = page
      .locator("tbody tr")
      .filter({ hasText: "Release acceptance event" });
    await page.goto(base + "/events/" + id);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "Release acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    // Exercise the locally reviewed PR #17 Angular registration workflow.
    await page
      .getByRole("link", { name: "Register for this event", exact: false })
      .click();
    await page.locator("#attendee-name").fill("Release Test Participant");
    await page.locator("#attendee-email").fill("release@example.test");
    await page.locator("#attendee-tickets").fill("3");
    const registered = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" && r.url().includes("/registrations"),
    );
    await page.locator("#submit-registration").click();
    assert.equal((await registered).status(), 201);
    await page
      .getByRole("link", { name: "View event details", exact: false })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Release acceptance event",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Release Test Participant", { exact: true }),
    ).toBeVisible();
    await page.goto(base + "/index.html");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    assert.equal(new URL(page.url()).pathname, "/");
    await page.goto(base + "/admin/events");
    await row
      .getByRole("link", {
        name: "View registrations for Release acceptance event",
        exact: true,
      })
      .click();
    await page.reload();
    await expect(
      page.getByText("1 registrations · 3 tickets", { exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(output, "roster-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1360, height: 960 });
    await page.getByRole("link", { name: "← All events", exact: true }).click();
    await expect(
      row.getByRole("button", { name: "Delete", exact: true }),
    ).toBeDisabled();
    await row.getByRole("button", { name: "Suspend", exact: true }).click();
    await row
      .getByRole("button", { name: "Confirm suspend", exact: true })
      .click();
    await expect(
      row.getByRole("button", { name: "Resume", exact: true }),
    ).toBeVisible();
    assert.equal((await fetch(base + "/api/events/" + id)).status, 404);
    await row.getByRole("button", { name: "Resume", exact: true }).click();
    await row
      .getByRole("button", { name: "Confirm resume", exact: true })
      .click();
    await expect(
      row.getByRole("button", { name: "Suspend", exact: true }),
    ).toBeVisible();
    await row
      .getByRole("link", { name: "Edit Release acceptance event", exact: true })
      .click();
    await page.reload();
    await expect(page.locator("#event_datetime")).toHaveValue(
      "2031-11-02T14:30:05",
    );
    await page.locator("#purpose").fill("Updated release purpose");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(row).toBeVisible();
    const details = await (
      await context.request.get(base + "/api/admin/events/" + id)
    ).json();
    assert.equal(details.registrations.length, 1);
    assert.equal(details.purpose, "Updated release purpose");
    assert.equal(
      (await context.request.delete(base + "/api/admin/events/" + id)).status(),
      409,
    );
    await page.screenshot({
      path: path.join(output, "admin-desktop.png"),
      fullPage: true,
    });
    const storage = await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
      }),
    );
    assert.ok(!storage.includes(password));
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Administrator sign in", exact: true }),
    ).toBeVisible();
    assert.equal(
      (await context.request.get(base + "/api/admin/events")).status(),
      401,
    );
    await page.goto(base + "/admin/events/" + id + "/edit");
    await expect(
      page.getByRole("heading", { name: "Administrator sign in", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(output, "login-mobile.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(output, "result.json"),
      JSON.stringify(
        {
          time: new Date().toISOString(),
          release: candidate,
          result: "passed",
          checks: [
            "packaged startup",
            "public deep reload",
            "admin sign in/out",
            "cookie and API protection",
            "create",
            "Angular registration",
            "roster",
            "suspend/resume",
            "edit preserves registrations",
            "protected deletion",
            "mobile",
            "legacy home redirect",
            "private files blocked",
          ],
          limitation:
            "Local HTTP acceptance; live cPanel HTTPS, weather and live cPanel HTTPS remain pending; PR #17 was integrated locally for this review.",
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: packaged Angular/public/API integration, login/logout, admin CRUD protection, Angular registration, routes and mobile.",
    );
  } finally {
    if (browser) await browser.close();
    if (child && child.exitCode === null) {
      child.kill();
      await new Promise((resolve) =>
        child.exitCode !== null ? resolve() : child.once("exit", resolve),
      );
    }
    if (connection) {
      if (created) await connection.query("DROP DATABASE `" + db + "`");
      await connection.end();
    }
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
