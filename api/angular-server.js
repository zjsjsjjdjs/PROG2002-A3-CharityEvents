// Same-origin Angular deployment wrapper. The shared API server is left unchanged.
const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const { config } = require("./config");
const { adminSessions } = require("./admin-session");
/**
 * Check that a built Angular entry point exists and has the expected deployment base.
 * @param {string} directory - Path to the browser build directory.
 * @param {string} baseHref - Expected base URL (/ or /admin/).
 * @returns {void}
 * @throws {Error} When index.html is missing or its base href does not match.
 */
function checkBuild(directory, baseHref) {
  const index = path.join(directory, "index.html");
  if (!fs.existsSync(index))
    throw new Error(
      "Angular build missing: " +
        index +
        ". Run scripts/build-angular-release.cjs first.",
    );
  const html = fs.readFileSync(index, "utf8");
  if (!html.includes('<base href="' + baseHref + '"'))
    throw new Error(
      "Incorrect Angular base href; expected " + baseHref + " in " + index,
    );
}
/**
 * Serve a browser build with SPA route fallback; missing asset/private paths return 404.
 * @param {string} directory - Absolute build directory.
 * @param {boolean} [privateFiles=false] - Apply no-store to all admin assets.
 * @returns {import("express").Router} Static assets and client-side route middleware.
 */
function spa(directory, privateFiles = false) {
  const router = express.Router();
  router.use(
    express.static(directory, {
      dotfiles: "deny",
      index: false,
      redirect: false,
      setHeaders(res, file) {
        res.set("X-Content-Type-Options", "nosniff");
        res.set(
          "Cache-Control",
          privateFiles || path.extname(file) === ".html"
            ? "no-store"
            : "public, max-age=3600",
        );
      },
    }),
  );
  router.get("*", (req, res) => {
    // A missing asset or private path must never receive HTML with a 200 response.
    if (
      req.path
        .split("/")
        .some((part) => part.startsWith(".") || part.includes("."))
    )
      return res.status(404).json({ message: "File not found." });
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(directory, "index.html"));
  });
  return router;
}
/**
 * Assemble the same-origin public Angular app, protected admin app and existing REST API.
 * @param {object} [options={}] - Optional config, publicDir, adminDir and API overrides for testing/hosting.
 * @returns {import("express").Express} Express app; the caller owns listening and shutdown.
 * @throws {Error} When either browser build is missing or has an incorrect base href.
 */
function createAngularServer(options = {}) {
  const settings = options.config || config;
  const publicDir = path.resolve(
    __dirname,
    options.publicDir ||
      process.env.ANGULAR_PUBLIC_DIR ||
      "../angular/dist/public/browser",
  );
  const adminDir = path.resolve(
    __dirname,
    options.adminDir ||
      process.env.ANGULAR_ADMIN_DIR ||
      "../angular/dist/admin/browser",
  );
  checkBuild(publicDir, "/");
  checkBuild(adminDir, "/admin/");
  const app = express(),
    sessions = adminSessions(settings);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
    });
    next();
  });
  app.use("/admin", sessions.router);
  app.use("/api/admin", sessions.protect(true));
  const api = options.api || require("./server");
  app.use((req, res, next) =>
    req.path === "/api" || req.path.startsWith("/api/")
      ? api(req, res, next)
      : next(),
  );
  app.get(/^\/admin$/, (req, res) => res.redirect(308, "/admin/"));
  app.use(
    "/admin",
    sessions.protect(false),
    (_req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    },
    spa(adminDir, true),
  );
  // The legacy registration URL is an Angular alias, never the old HTML form.
  app.get("/register.html", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.get(["/admin.html", "/admin-event.html"], (_req, res) =>
    res.redirect(303, "/admin/"),
  );
  app.get(["/index.html", "/search.html", "/detail.html"], (req, res) => {
    const url = new URL(req.originalUrl, "http://local.invalid");
    const target =
      req.path === "/search.html"
        ? "/search"
        : req.path === "/detail.html"
          ? "/events/" +
            encodeURIComponent(url.searchParams.get("id") || "invalid")
          : "/";
    if (req.path === "/detail.html") url.searchParams.delete("id");
    const query = url.searchParams.toString();
    res.redirect(302, target + (query ? "?" + query : ""));
  });
  app.use(spa(publicDir));
  app.use((_req, res) => res.status(404).json({ message: "Route not found." }));
  app.use((error, _req, res, _next) => {
    const status =
      error.type === "entity.too.large"
        ? 413
        : error.status === 400
          ? 400
          : 500;
    res
      .status(status)
      .json({
        code: "REQUEST_FAILED",
        message: status === 500 ? "Request failed." : "Invalid request.",
      });
  });
  return app;
}
module.exports = { createAngularServer, checkBuild };
