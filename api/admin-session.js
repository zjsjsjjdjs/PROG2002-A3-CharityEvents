// Server-side admin sessions keep credentials out of Angular and browser storage.
const express = require("express");
const { randomBytes, createHash, timingSafeEqual } = require("node:crypto");
const { adminAccess } = require("./admin-access");
const COOKIE = "hh_admin";
const TTL = 60 * 60 * 1000;
const hash = (value) => createHash("sha256").update(value).digest();
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
function safeReturn(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/admin/") ||
    /[\\\r\n]/.test(value)
  )
    return "/admin/";
  const parsed = new URL(value, "https://local.invalid");
  if (
    !parsed.pathname.startsWith("/admin/") ||
    ["/admin/login", "/admin/logout"].includes(parsed.pathname)
  )
    return "/admin/";
  return parsed.pathname + parsed.search;
}
function adminSessions(config) {
  const sessions = new Map(),
    attempts = new Map();
  const basicAccess = adminAccess(config);
  const cookieOptions = {
    httpOnly: true,
    secure: config.production,
    sameSite: "strict",
    path: "/",
  };
  const token = (req) => {
    const match = /(?:^|;\s*)hh_admin=([a-f0-9]{64})(?:;|$)/.exec(
      req.headers.cookie || "",
    );
    return match ? hash(match[1]).toString("hex") : "";
  };
  const valid = (req) => (sessions.get(token(req)) || 0) > Date.now();
  function sameOrigin(req, res, next) {
    const expected =
      config.publicOrigin || req.protocol + "://" + req.get("host");
    if (
      (req.get("origin") && req.get("origin") !== expected) ||
      req.get("sec-fetch-site") === "cross-site"
    )
      return res
        .status(403)
        .json({
          code: "CROSS_SITE_ADMIN_REQUEST",
          message: "Open administration on the application domain.",
        });
    next();
  }
  function page(res, message = "", destination = "/admin/", status = 200) {
    res.set({
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      "X-Content-Type-Options": "nosniff",
    });
    return res
      .status(status)
      .type("html")
      .send(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Administrator sign in | Harbour Hope</title><style>body{font:16px/1.5 Arial,sans-serif;background:#fbfaf5;color:#153a36;margin:0}main{max-width:420px;margin:10vh auto;padding:28px}h1{color:#0f4c5c}label,input{display:block;width:100%;box-sizing:border-box}input{font:inherit;padding:12px;margin:6px 0 18px;border:1px solid #80958b;border-radius:4px}button{font:inherit;background:#0f4c5c;color:white;border:0;padding:12px 20px;border-radius:4px}a{color:#0f4c5c}.error{color:#9a2929}input:focus,button:focus,a:focus{outline:3px solid #2f7d5a;outline-offset:2px}</style></head><body><main><p>Harbour Hope · Event management</p><h1>Administrator sign in</h1><p>Use your deployment administrator account.</p>${message ? `<p class="error" role="alert">${escape(message)}</p>` : ""}<form method="post" action="/admin/login"><input type="hidden" name="returnTo" value="${escape(destination)}"><label for="username">Username</label><input id="username" name="username" autocomplete="username" maxlength="200" required><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="1000" required><button type="submit">Sign in</button></form><p><a href="/">Back to public events</a></p></main></body></html>`,
      );
  }
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  router.get("/login", (req, res) => {
    const destination = safeReturn(req.query.returnTo);
    if (valid(req)) return res.redirect(303, destination);
    if (!config.adminUser) return res.redirect(303, "/admin/");
    page(res, "", destination);
  });
  router.post(
    "/login",
    sameOrigin,
    express.urlencoded({ extended: false, limit: "4kb" }),
    (req, res) => {
      const now = Date.now(),
        key = req.socket.remoteAddress;
      for (const [key, expires] of sessions)
        if (expires <= now) sessions.delete(key);
      for (const [key, attempt] of attempts)
        if (attempt.expires <= now) attempts.delete(key);
      const attempt = attempts.get(key) || {
        count: 0,
        expires: now + 15 * 60 * 1000,
      };
      const destination = safeReturn(req.body?.returnTo);
      if (attempt.count >= 10) {
        res.set(
          "Retry-After",
          String(Math.ceil((attempt.expires - now) / 1000)),
        );
        return page(
          res,
          "Too many attempts. Try again in 15 minutes.",
          destination,
          429,
        );
      }
      const user =
        typeof req.body?.username === "string" ? req.body.username : "";
      const password =
        typeof req.body?.password === "string" ? req.body.password : "";
      if (
        !config.adminUser ||
        !timingSafeEqual(
          hash(user + ":" + password),
          hash(config.adminUser + ":" + config.adminPassword),
        )
      ) {
        if (attempts.size >= 1000 && !attempts.has(key))
          attempts.delete(attempts.keys().next().value);
        attempts.set(key, { ...attempt, count: attempt.count + 1 });
        return page(
          res,
          "Username or password is incorrect.",
          destination,
          401,
        );
      }
      attempts.delete(key);
      sessions.delete(token(req));
      if (sessions.size >= 200) sessions.delete(sessions.keys().next().value);
      const secret = randomBytes(32).toString("hex");
      sessions.set(hash(secret).toString("hex"), now + TTL);
      res.cookie(COOKIE, secret, { ...cookieOptions, maxAge: TTL });
      res.redirect(303, destination);
    },
  );
  router.post("/logout", sameOrigin, (req, res) => {
    sessions.delete(token(req));
    res.clearCookie(COOKIE, cookieOptions);
    res.redirect(303, "/admin/login");
  });
  function protect(isApi) {
    return (req, res, next) => {
      res.set("Cache-Control", "no-store");
      if (valid(req)) {
        // Existing API middleware still performs same-origin checks and credential validation.
        req.headers.authorization =
          "Basic " +
          Buffer.from(config.adminUser + ":" + config.adminPassword).toString(
            "base64",
          );
        return next();
      }
      if (!config.adminUser || req.get("authorization"))
        return basicAccess(req, res, next);
      if (isApi)
        return res
          .status(401)
          .json({
            code: "ADMIN_AUTH_REQUIRED",
            message: "Your session has expired. Sign in again.",
          });
      res.redirect(
        303,
        "/admin/login?returnTo=" +
          encodeURIComponent(safeReturn(req.originalUrl)),
      );
    };
  }
  return { router, protect, sameOrigin };
}
module.exports = { adminSessions, safeReturn };
