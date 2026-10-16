// Production-built Angular public + admin, real Express and an owned temporary DB.
// This local static host models root hosting; it does not validate Apache/cPanel.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const express = require("../api/node_modules/express");
const mysql = require("../api/node_modules/mysql2/promise");
const dotenv = require("../api/node_modules/dotenv");
const { chromium, expect } = require("../api/node_modules/@playwright/test");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "submission/angular-integration-checks");
const listen = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
const close = (server) =>
  server && new Promise((resolve) => server.close(resolve));
async function main() {
  fs.mkdirSync(output, { recursive: true });
  for (const name of ["public", "admin"])
    assert.ok(
      fs.existsSync(
        path.join(root, "angular/dist", name, "browser/index.html"),
      ),
      "Run npm run build first",
    );
  const env = dotenv.parse(
    fs.readFileSync(
      process.env.ANGULAR_TEST_ENV_FILE || path.join(root, "api/.env"),
    ),
  );
  const database =
    "a3_angular_joint_" + Date.now() + "_" + randomBytes(4).toString("hex");
  let connection,
    pool,
    apiServer,
    browser,
    created = false;
  const hosts = [],
    checks = [],
    pageErrors = [];
  const passed = (label) => {
    checks.push(label);
    console.log("PASS: " + label);
  };
  const staticHost = async (name) => {
    const app = express();
    app.use("/api", (req, res) => {
      const upstream = http.request(
        {
          hostname: "127.0.0.1",
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
      upstream.on("error", () => {
        if (!res.headersSent) res.status(502).end();
        else res.end();
      });
      req.pipe(upstream);
    });
    const dist = path.join(root, "angular/dist", name, "browser");
    app.use(express.static(dist));
    app.get("*", (req, res) => {
      // Do not turn missing assets, source files or hidden files into the SPA.
      const legacy = [
        "/index.html",
        "/search.html",
        "/detail.html",
        "/register.html",
      ];
      if (
        req.path.split("/").some((part) => part.startsWith(".")) ||
        (path.extname(req.path) && !legacy.includes(req.path))
      )
        return res.status(404).end();
      res.sendFile(path.join(dist, "index.html"));
    });
    const server = await listen(app);
    hosts.push(server);
    return "http://127.0.0.1:" + server.address().port;
  };
  try {
    connection = await mysql.createConnection({
      host: env.DB_HOST || "localhost",
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER || "root",
      password: env.DB_PASSWORD || "",
      multipleStatements: true,
    });
    await connection.query(
      "CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4",
    );
    created = true;
    await connection.query("USE `" + database + "`");
    await connection.query(
      fs.readFileSync(path.join(root, "database/a3-fresh-install.sql"), "utf8"),
    );
    Object.assign(process.env, env, {
      DB_NAME: database,
      NODE_ENV: "development",
      ADMIN_USERNAME: "",
      ADMIN_PASSWORD: "",
      PUBLIC_ORIGIN: "",
      CORS_ALLOWED_ORIGINS: "",
    });
    apiServer = await listen(require("../api/server"));
    pool = require("../api/event_db").pool;
    const publicOrigin = await staticHost("public"),
      adminOrigin = await staticHost("admin");
    browser = await chromium.launch({
      channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
      headless: true,
    });
    const context = await browser.newContext({
      viewport: { width: 1366, height: 1000 },
      timezoneId: "America/New_York",
    });
    const publicPage = await context.newPage(),
      adminPage = await context.newPage();
    for (const page of [publicPage, adminPage])
      page.on("pageerror", (error) => pageErrors.push(error.message));
    await adminPage.goto(adminOrigin + "/events/new");
    await expect(adminPage.locator("#name")).toBeEnabled();
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Brisbane",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(Date.now() + 86400000));
    const date = ["year", "month", "day"]
      .map((key) => parts.find((p) => p.type === key).value)
      .join("-");
    const values = {
      name: "Joint Angular acceptance",
      location: "Joint Brisbane Hall",
      purpose: "Community relief",
      short_description: "An integrated community event.",
      full_description:
        "Created in Angular admin and registered through Angular public.",
      event_datetime: date + "T14:00",
      ticket_price: "12.50",
      fundraising_goal: "1000.00",
      current_progress: "0.00",
      latitude: "-27.47",
      longitude: "153.03",
    };
    for (const [key, value] of Object.entries(values))
      await adminPage.locator("#" + key).fill(value);
    await adminPage.locator("#category_id").selectOption({ index: 1 });
    await adminPage.locator("#organisation_id").selectOption({ index: 1 });
    const createdResponse = adminPage.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        r.url().endsWith("/api/admin/events"),
    );
    await adminPage
      .getByRole("button", { name: "Create event", exact: true })
      .click();
    const response = await createdResponse;
    assert.equal(response.status(), 201);
    const id = (await response.json()).event_id;
    await expect(
      adminPage.getByRole("link", {
        name: "Edit Joint Angular acceptance",
        exact: true,
      }),
    ).toBeVisible();
    passed(
      "Production admin creates a persisted event with Brisbane time and coordinates",
    );
    await publicPage.route("https://api.open-meteo.com/**", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          daily_units: { temperature_2m_min: "°C", temperature_2m_max: "°C" },
          daily: {
            time: [date],
            weather_code: [2],
            temperature_2m_min: [18],
            temperature_2m_max: [26],
          },
        }),
      }),
    );
    await publicPage.goto(
      publicOrigin + "/search?location=Joint%20Brisbane%20Hall",
    );
    await expect(
      publicPage.getByRole("heading", { name: values.name, exact: true }),
    ).toBeVisible();
    await publicPage
      .getByRole("link", {
        name: "View details for " + values.name,
        exact: true,
      })
      .click();
    await expect(publicPage.locator(".event-facts").first()).toContainText(
      "2:00 pm",
    );
    await expect(publicPage.locator(".weather-panel")).toContainText(
      "Partly cloudy",
    );
    await publicPage.reload();
    await expect(publicPage.locator(".weather-panel")).toContainText("26 °C");
    passed(
      "Production public search/detail reload and event-day weather consume admin-created data",
    );
    await publicPage
      .getByRole("link", { name: "Register for this event", exact: false })
      .click();
    await publicPage.locator("#attendee-name").fill("Joint Browser Guest");
    await publicPage
      .locator("#attendee-email")
      .fill("joint-browser@example.test");
    await publicPage.locator("#attendee-tickets").fill("2");
    await publicPage
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(publicPage.locator("#success-title")).toBeFocused();
    await publicPage.keyboard.press("Tab");
    await expect(
      publicPage.getByRole("link", {
        name: "View event details",
        exact: false,
      }),
    ).toBeFocused();
    await publicPage.keyboard.press("Enter");
    await expect(publicPage.locator(".attendee-list")).toContainText(
      "Joint Browser Guest",
    );
    await adminPage.goto(adminOrigin + "/events/" + id + "/edit");
    await expect(adminPage.locator(".registrations")).toContainText(
      "Joint Browser Guest",
    );
    await expect(adminPage.locator("#event_datetime")).toHaveValue(
      date + "T14:00",
    );
    passed(
      "Public registration appears in Angular admin; keyboard confirmation and Brisbane time are consistent",
    );
    await adminPage.locator("#name").fill("Joint Angular updated");
    await adminPage.locator("#event_datetime").fill(date + "T09:30");
    await adminPage
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      adminPage.getByRole("link", {
        name: "Edit Joint Angular updated",
        exact: true,
      }),
    ).toBeVisible();
    await publicPage.reload();
    await expect(
      publicPage.getByRole("heading", {
        name: "Joint Angular updated",
        exact: true,
      }),
    ).toBeVisible();
    await expect(publicPage.locator(".event-facts").first()).toContainText(
      "9:30 am",
    );
    await expect(publicPage.locator(".attendee-list")).toContainText(
      "Joint Browser Guest",
    );
    await publicPage.screenshot({
      path: path.join(output, "public-joint-desktop.png"),
      fullPage: true,
    });
    passed("Admin updates propagate to public without losing registrations");
    // Existing API safeguard; no claim that the admin deletion UI is finished.
    const deletion = await fetch(adminOrigin + "/api/admin/events/" + id, {
      method: "DELETE",
      headers: { Origin: adminOrigin },
    });
    assert.equal(deletion.status, 409);
    assert.equal((await deletion.json()).code, "EVENT_HAS_REGISTRATIONS");
    passed("Existing API refuses deletion of the publicly registered event");
    await publicPage.goto(publicOrigin + "/events/" + id + "/register");
    await expect(publicPage.locator("#attendee-name")).toBeEnabled();
    await adminPage.goto(adminOrigin + "/events/" + id + "/edit");
    await adminPage.locator("#status").selectOption("suspended");
    await adminPage
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      adminPage.getByRole("link", {
        name: "Edit Joint Angular updated",
        exact: true,
      }),
    ).toBeVisible();
    await publicPage.locator("#attendee-name").fill("Blocked Guest");
    await publicPage
      .locator("#attendee-email")
      .fill("blocked-joint@example.test");
    await publicPage
      .getByRole("button", { name: "Submit registration", exact: true })
      .click();
    await expect(publicPage.getByRole("alert")).toContainText(
      "no longer available",
    );
    await publicPage.goto(publicOrigin + "/events/" + id);
    await expect(publicPage.getByRole("alert")).toContainText(
      "removed or suspended",
    );
    await adminPage.goto(adminOrigin + "/events/" + id + "/edit");
    await expect(adminPage.locator(".registrations")).toContainText(
      "Joint Browser Guest",
    );
    passed(
      "Angular admin suspension blocks an already-open public form and retains existing attendees",
    );
    for (const [url, heading] of [
      [
        "/index.html",
        "Local events that turn ticket sales into practical help.",
      ],
      [
        "/search.html?location=none-joint",
        "Search by date, location, or category.",
      ],
      ["/detail.html?id=1", null],
      ["/register.html?id=1", "Register for an event"],
      ["/not-a-real-page", "Page not found"],
    ]) {
      await publicPage.goto(publicOrigin + url);
      if (heading)
        await expect(
          publicPage
            .getByRole("heading", { name: heading, exact: false })
            .first(),
        ).toBeVisible();
      else await expect(publicPage.locator(".booking-panel")).toBeVisible();
    }
    await publicPage.goto(publicOrigin + "/search");
    await publicPage.keyboard.press("Tab");
    await expect(
      publicPage.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await publicPage.keyboard.press("Enter");
    await expect(publicPage.locator("#main")).toBeFocused();
    passed(
      "Built SPA supports legacy bookmarks, direct routes, unknown-page recovery and keyboard skip link",
    );
    for (const route of [
      "/api/not-a-route",
      "/missing.js",
      "/.env",
      "/api/.env",
      "/.git/config",
    ]) {
      const result = await fetch(publicOrigin + route);
      assert.equal(result.status, 404, route);
      assert.ok(
        !(await result.text()).includes("<app-root>"),
        route + " swallowed by SPA fallback",
      );
    }
    passed(
      "Local deployment model keeps API errors and missing assets outside SPA fallback",
    );
    for (const size of [320, 390, 768]) {
      await publicPage.setViewportSize({ width: size, height: 900 });
      for (const route of ["/search", "/events/1", "/events/1/register"]) {
        await publicPage.goto(publicOrigin + route);
        await expect(publicPage.locator("h1")).toBeVisible();
        await expect(
          publicPage.locator('.status-panel[role="status"]'),
        ).toHaveCount(0);
        assert.ok(
          await publicPage.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          route + " overflow at " + size,
        );
      }
    }
    await publicPage.screenshot({
      path: path.join(output, "public-registration-tablet.png"),
      fullPage: true,
    });
    passed("Public built pages fit 320 px, 390 px and tablet widths");
    assert.deepEqual(pageErrors, []);
    const [[row]] = await connection.query(
      "SELECT COUNT(*) AS count FROM registrations WHERE event_id=?",
      [id],
    );
    assert.equal(row.count, 1);
    passed("No unhandled browser errors or unintended extra registration");
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify(
        {
          passed: checks.length,
          checks,
          pageErrors,
          builtOutput: true,
          deployedToCpanel: false,
        },
        null,
        2,
      ),
    );
  } finally {
    if (browser) await browser.close();
    for (const host of hosts) await close(host);
    await close(apiServer);
    if (pool) await pool.end();
    if (connection) {
      if (created) await connection.query("DROP DATABASE `" + database + "`");
      await connection.end();
    }
    console.log("Disposed this run\'s isolated database and servers.");
  }
}
main().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
