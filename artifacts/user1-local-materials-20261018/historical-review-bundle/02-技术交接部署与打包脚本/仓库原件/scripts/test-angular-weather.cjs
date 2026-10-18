// Called by test-angular-public.cjs against its disposable database and local servers.
const path = require("node:path");
const assert = require("node:assert/strict");
const { expect } = require("../api/node_modules/@playwright/test");
module.exports = async function weatherChecks({
  page,
  connection,
  uiOrigin,
  output,
  passed,
}) {
  const tomorrow = new Date(Date.now() + 86400000);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(tomorrow);
  const day = ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k).value)
    .join("-");
  await connection.query(
    "UPDATE events SET event_datetime=?, latitude=-27.47, longitude=153.03 WHERE event_id=1",
    [day + " 14:00:00"],
  );
  const payload = {
    daily_units: { temperature_2m_min: "°C", temperature_2m_max: "°C" },
    daily: {
      time: [day],
      weather_code: [3],
      temperature_2m_min: [18.5],
      temperature_2m_max: [27.2],
    },
  };
  let mode = "hold",
    release,
    requests = 0;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route("https://api.open-meteo.com/**", async (route) => {
    requests++;
    const url = new URL(route.request().url());
    assert.equal(url.searchParams.get("timezone"), "Australia/Brisbane");
    assert.equal(url.searchParams.get("forecast_days"), "16");
    if (mode === "hold") await gate;
    if (mode === "fail") return route.abort("failed");
    const body =
      mode === "invalid"
        ? { daily: {} }
        : mode === "empty"
          ? { ...payload, daily: { ...payload.daily, time: [] } }
          : payload;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  const panel = page.locator(".weather-panel");
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.goto(uiOrigin + "/events/1");
  await expect(panel).toContainText("Loading the event-day forecast");
  await expect(
    page.getByRole("link", { name: "Register for this event", exact: false }),
  ).toBeVisible();
  mode = "ready";
  release();
  await expect(panel).toContainText("Overcast");
  await expect(panel).toContainText("18.5 °C");
  await expect(panel).toContainText("27.2 °C");
  await expect(panel.locator("a")).toHaveAttribute(
    "href",
    "https://open-meteo.com/",
  );
  await panel.screenshot({
    path: path.join(output, "weather-ready-desktop.png"),
  });
  passed(
    "Weather loading is independent; event-day forecast, Celsius and attribution render",
  );
  mode = "fail";
  await page.reload();
  await expect(panel).toContainText("Weather could not be loaded");
  await expect(panel).not.toContainText("27.2");
  await page
    .getByRole("link", { name: "Register for this event", exact: false })
    .click();
  await expect(page.locator("#attendee-name")).toBeEnabled();
  await page.goto(uiOrigin + "/events/1");
  await expect(
    panel.getByRole("button", { name: "Retry weather" }),
  ).toBeVisible();
  mode = "ready";
  await panel.getByRole("button", { name: "Retry weather" }).click();
  await expect(panel).toContainText("Overcast");
  passed(
    "Failed weather does not block registration; deliberate retry recovers",
  );
  for (const [value, expected] of [
    ["invalid", "Weather could not be loaded"],
    ["empty", "no forecast for this event date"],
  ]) {
    mode = value;
    await page.reload();
    await expect(panel).toContainText(expected);
    await expect(panel).not.toContainText("27.2");
  }
  passed(
    "Malformed and missing-day provider data never show fabricated temperatures",
  );
  for (const [sql, message] of [
    [
      "UPDATE events SET latitude=NULL WHERE event_id=1",
      "no valid map coordinates",
    ],
    [
      "UPDATE events SET latitude=-27.47, event_datetime='2099-11-02 14:00:00' WHERE event_id=1",
      "today and the next 15 days",
    ],
    [
      "UPDATE events SET event_datetime='2000-01-01 14:00:00' WHERE event_id=1",
      "date has passed",
    ],
  ]) {
    await connection.query(sql);
    const before = requests;
    await page.reload();
    await expect(panel).toContainText(message);
    assert.equal(requests, before);
  }
  passed(
    "Missing coordinates, distant and past dates avoid unnecessary provider requests",
  );
  await connection.query(
    "UPDATE events SET event_datetime=? WHERE event_id=1",
    [day + " 14:00:00"],
  );
  mode = "ready";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(panel).toContainText("Overcast");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await panel.screenshot({
    path: path.join(output, "weather-ready-mobile.png"),
  });
  mode = "fail";
  await page.reload();
  await expect(panel).toContainText("Weather could not be loaded");
  await panel.screenshot({
    path: path.join(output, "weather-error-mobile.png"),
  });
  passed("Weather success and retry states fit mobile screens");
  await page.unroute("https://api.open-meteo.com/**");
};
