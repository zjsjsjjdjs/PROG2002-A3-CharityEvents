const { test } = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const express = require("express");
const { createAngularServer, checkBuild } = require("../angular-server");
const { adminAccess } = require("../admin-access");
const { readConfig } = require("../config");
const { safeReturn } = require("../admin-session");
const account = {
  ADMIN_USERNAME: "local-test-admin",
  ADMIN_PASSWORD: "test-only-password-32-characters",
};
async function fixture(t, production = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "a3-hosting-"));
  const publicDir = path.join(directory, "public"),
    adminDir = path.join(directory, "admin");
  for (const [dir, base, name] of [
    [publicDir, "/", "public"],
    [adminDir, "/admin/", "management"],
  ]) {
    fs.mkdirSync(dir);
    fs.writeFileSync(
      path.join(dir, "index.html"),
      '<html><head><base href="' +
        base +
        '"></head><body>' +
        name +
        "</body></html>",
    );
    fs.writeFileSync(path.join(dir, "app.js"), "/* " + name + " */");
  }
  const config = readConfig({
    ...account,
    ...(production
      ? {
          NODE_ENV: "production",
          PUBLIC_ORIGIN: "https://events.example",
          DB_USER: "test",
          DB_NAME: "test",
        }
      : {}),
  });
  const api = express();
  api.use("/api/admin", adminAccess(config));
  api.all("/api/admin/example", (req, res) => res.json({ ok: true }));
  api.use((_req, res) => res.status(404).json({ message: "API not found" }));
  const app = createAngularServer({ config, publicDir, adminDir, api });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    const target = path.resolve(directory);
    if (
      !target.startsWith(path.resolve(os.tmpdir()) + path.sep) ||
      !path.basename(target).startsWith("a3-hosting-")
    )
      throw new Error("Unexpected temporary path");
    fs.rmSync(target, { recursive: true });
  });
  const request = (url, options = {}) =>
    fetch(base + url, { redirect: "manual", ...options });
  const login = (extra = {}) =>
    request("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: account.ADMIN_USERNAME,
        password: account.ADMIN_PASSWORD,
        ...extra,
      }),
    });
  return { request, login, base, publicDir, adminDir };
}
test("Angular deployment routing", async (t) => {
  const f = await fixture(t);
  await t.test(
    "public deep links fall back to public Angular; missing assets and API stay 404",
    async () => {
      for (const url of ["/", "/search", "/events/3"]) {
        const response = await f.request(url);
        assert.equal(response.status, 200);
        assert.match(await response.text(), /public/);
      }
      for (const url of [
        "/missing.js",
        "/.env",
        "/.git/config",
        "/api/.env",
        "/api/event_db.js",
        "/package.json",
        "/angular/src/main.ts",
      ])
        assert.equal((await f.request(url)).status, 404, url);
      const unknown = await f.request("/api/missing");
      assert.equal(unknown.status, 404);
      assert.match(unknown.headers.get("content-type"), /json/);
    },
  );
  await t.test(
    "admin HTML, deep links and scripts require authentication",
    async () => {
      for (const url of ["/admin/", "/admin/events/3/edit", "/admin/app.js"]) {
        const response = await f.request(url);
        assert.equal(response.status, 303);
        assert.match(response.headers.get("location"), /^\/admin\/login/);
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
      const denied = await f.request("/api/admin/example");
      assert.equal(denied.status, 401);
      assert.equal(denied.headers.get("www-authenticate"), null);
    },
  );
  await t.test(
    "login, session API calls, logout and invalidated-cookie rejection work",
    async () => {
      assert.equal((await f.login({ password: "wrong" })).status, 401);
      const login = await f.login({ returnTo: "/admin/events/3/edit" });
      assert.equal(login.status, 303);
      assert.equal(login.headers.get("location"), "/admin/events/3/edit");
      const cookie = login.headers.get("set-cookie");
      assert.match(cookie, /HttpOnly/);
      assert.match(cookie, /SameSite=Strict/);
      assert.doesNotMatch(cookie, /test-only/);
      const headers = { Cookie: cookie.split(";")[0] };
      const admin = await f.request("/admin/events/3/edit", { headers });
      assert.equal(admin.status, 200);
      assert.match(await admin.text(), /management/);
      assert.equal(
        (await f.request("/api/admin/example", { method: "PATCH", headers }))
          .status,
        200,
      );
      assert.equal(
        (
          await f.request("/api/admin/example", {
            method: "PATCH",
            headers: { ...headers, Origin: "https://evil.invalid" },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await f.request("/admin/logout", {
            method: "POST",
            headers: { ...headers, Origin: "https://evil.invalid" },
          })
        ).status,
        403,
      );
      assert.equal(
        (await f.request("/admin/logout", { method: "POST", headers })).status,
        303,
      );
      assert.equal(
        (await f.request("/api/admin/example", { headers })).status,
        401,
      );
    },
  );
  await t.test(
    "safe redirects never leave management; legacy public links return to Angular",
    async () => {
      for (const value of [
        "https://evil.invalid",
        "//evil.invalid",
        "/admin/../../evil",
        "/admin/login",
        "/admin/\\evil",
      ])
        assert.equal(safeReturn(value), "/admin/");
      assert.equal(
        (await f.login({ returnTo: "https://evil.invalid" })).headers.get(
          "location",
        ),
        "/admin/",
      );
      assert.equal(
        (await f.request("/index.html")).headers.get("location"),
        "/",
      );
      assert.equal(
        (await f.request("/detail.html?id=3")).headers.get("location"),
        "/events/3",
      );
    },
  );
  await t.test("missing or wrongly based builds fail at startup", () => {
    assert.throws(
      () => checkBuild(path.join(f.publicDir, "missing"), "/"),
      /build missing/,
    );
    assert.throws(() => checkBuild(f.publicDir, "/admin/"), /base href/);
  });
});
test("production session cookie and login limits", async (t) => {
  const f = await fixture(t, true);
  await t.test(
    "HTTPS deployments issue Secure cookies and block cross-origin login",
    async () => {
      assert.match((await f.login()).headers.get("set-cookie"), /Secure/);
      const response = await f.request("/admin/login", {
        method: "POST",
        headers: {
          Origin: "https://evil.invalid",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: account.ADMIN_USERNAME,
          password: account.ADMIN_PASSWORD,
        }),
      });
      assert.equal(response.status, 403);
    },
  );
  await t.test(
    "repeated invalid passwords receive a bounded retry response",
    async () => {
      for (let i = 0; i < 10; i++)
        assert.equal((await f.login({ password: "bad" })).status, 401);
      const limited = await f.login({ password: "bad" });
      assert.equal(limited.status, 429);
      assert.ok(Number(limited.headers.get("retry-after")) > 0);
      assert.doesNotMatch(await limited.text(), /test-only-password/);
    },
  );
});
