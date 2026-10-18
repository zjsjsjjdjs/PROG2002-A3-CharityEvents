// Produces a new isolated release directory. Never reads or copies real .env files.
const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(command + " failed (" + result.status + ").");
}
function git(...args) {
  const result = spawnSync(
    "git",
    ["-c", "safe.directory=" + root.split(path.sep).join("/"), ...args],
    { cwd: root, encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0) throw new Error("Git source metadata unavailable.");
  return result.stdout.trim();
}
const args = process.argv.slice(2),
  nameIndex = args.indexOf("--username");
const username = nameIndex < 0 ? "user2" : args[nameIndex + 1];
if (!/^[a-zA-Z0-9_-]{1,50}$/.test(username || ""))
  throw new Error(
    "Username must contain only letters, numbers, underscore or hyphen.",
  );
const [major, minor, patch] = process.versions.node.split(".").map(Number);
if (!(
  (major === 22 && (minor > 22 || (minor === 22 && patch >= 3))) ||
  (major === 24 && minor >= 15) ||
  major >= 26
))
  throw new Error("Use Node 22.22.3+, 24.15+ or >=26 for Angular 22.");
const dirty = git("status", "--porcelain", "--untracked-files=no") !== "";
if (dirty && !args.includes("--allow-dirty"))
  throw new Error(
    "Commit tracked changes first, or use --allow-dirty for a labelled local candidate.",
  );
const revision = git("rev-parse", "HEAD");
const output = path.join(
  root,
  "submission",
  "angular-release-" + new Date().toISOString().replace(/[:.]/g, "-"),
);
fs.mkdirSync(path.join(root, "submission"), { recursive: true });
fs.mkdirSync(output, { recursive: false });
const release = path.join(output, "release");
fs.mkdirSync(release);
for (const app of ["public", "admin"]) {
  const build = path.join(output, "build", app);
  run(
    process.execPath,
    [
      path.join(root, "angular/node_modules/@angular/cli/bin/ng.js"),
      "build",
      app,
      "--base-href",
      app === "admin" ? "/admin/" : "/",
      "--output-path",
      build,
    ],
    path.join(root, "angular"),
  );
  fs.cpSync(path.join(build, "browser"), path.join(release, "frontend", app), {
    recursive: true,
    filter: (source) => !source.endsWith(".map"),
  });
  const licenses = path.join(build, "3rdpartylicenses.txt");
  if (fs.existsSync(licenses)) fs.copyFileSync(licenses, path.join(release, "frontend", app, "3rdpartylicenses.txt"));
}
fs.mkdirSync(path.join(release, "api"), { recursive: true });
for (const item of fs.readdirSync(path.join(root, "api"))) {
  if (
    item.endsWith(".js") ||
    ["package.json", "package-lock.json"].includes(item)
  )
    fs.copyFileSync(
      path.join(root, "api", item),
      path.join(release, "api", item),
    );
}
// API event validation still imports this module. Legacy HTML is not served by the Angular release.
for (const file of ["assets/js/admin-validation.js"]) {
  const target = path.join(release, "clientside", file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, "clientside", file), target);
}
fs.mkdirSync(path.join(release, "database"));
fs.copyFileSync(
  path.join(root, "database/a3-fresh-install.sql"),
  path.join(release, "database/a3-fresh-install.sql"),
);
fs.mkdirSync(path.join(release, "docs"));
for (const file of [
  "angular-cpanel-deployment.md",
  "user2-angular-acceptance.md",
])
  if (fs.existsSync(path.join(root, "docs", file)))
    fs.copyFileSync(
      path.join(root, "docs", file),
      path.join(release, "docs", file),
    );
const example = `# Example only: set actual values privately in cPanel. No credentials are included.
NODE_ENV=production
APP_FRONTEND=angular
ANGULAR_PUBLIC_DIR=../frontend/public
ANGULAR_ADMIN_DIR=../frontend/admin
HOST=127.0.0.1
PORT=3000
PUBLIC_ORIGIN=https://your-domain.example
ADMIN_USERNAME=
ADMIN_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_CONNECTION_LIMIT=5
DB_CONNECT_TIMEOUT=10000
CORS_ALLOWED_ORIGINS=
`;
fs.writeFileSync(path.join(release, "api/.env.example"), example);
fs.writeFileSync(
  path.join(release, "INSTALL.txt"),
  "For a fresh installation, use this portable api/frontend/clientside layout outside public_html and import the supplied SQL only into an empty database. For an existing cPanel application, back up files/configuration/data and KEEP its registered application root; do not point the panel at an already populated folder. Update the existing API directory and use absolute ANGULAR_PUBLIC_DIR and ANGULAR_ADMIN_DIR paths for separate frontend builds. Preserve DB credentials and existing data. Set APP_FRONTEND=angular, install API production dependencies and restart. Read docs/angular-cpanel-deployment.md for the actual user2 procedure and limitations. This generated candidate is not itself evidence of a new online acceptance run.\n",
);
const manifest = {
  sourceCommit: revision,
  trackedChanges: dirty,
  builtAt: new Date().toISOString(),
  node: process.version,
  username,
  publicBase: "/",
  adminBase: "/admin/",
  apiBase: "/api",
  status: "local-candidate",
  files: {},
};
const { createHash } = require("node:crypto");
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(file);
    else {
      const relative = path.relative(release, file).split(path.sep).join("/");
      if (entry.name === ".env" || entry.name.endsWith(".map"))
        throw new Error("Unexpected private artifact: " + relative);
      manifest.files[relative] = createHash("sha256")
        .update(fs.readFileSync(file))
        .digest("hex");
    }
  }
}
scan(release);
fs.writeFileSync(
  path.join(output, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
// Build source packages from tracked code; paired archives reconstruct the Angular workspace.
const tracked = git("ls-files", "-z").split("\0");
for (const [part, include] of Object.entries({
  clientside: (p) =>
    p.startsWith("angular/projects/public/") ||
    p.startsWith("angular/projects/shared/") ||
    /^angular\/[^/]+$/.test(p),
  adminside: (p) =>
    p.startsWith("angular/projects/admin/") ||
    p.startsWith("angular/projects/shared/") ||
    /^angular\/[^/]+$/.test(p),
  api: (p) =>
    p.startsWith("api/") ||
    p.startsWith("clientside/") ||
    p.startsWith("database/") ||
    p.startsWith("scripts/") ||
    p.startsWith("docs/"),
})) {
  const packageDir = path.join(output, "packages", username + "A3-" + part);
  fs.mkdirSync(packageDir, { recursive: true });
  for (const file of tracked.filter(include)) {
    if (file.endsWith("/.env") || file.includes("/node_modules/"))
      throw new Error("Unsafe tracked source: " + file);
    const target = path.join(packageDir, "source", file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  const runtime =
    part === "clientside"
      ? "frontend/public"
      : part === "adminside"
        ? "frontend/admin"
        : null;
  if (runtime)
    fs.cpSync(
      path.join(release, runtime),
      path.join(packageDir, "runtime", runtime),
      { recursive: true },
    );
  else
    for (const folder of ["api", "clientside", "database", "docs"])
      fs.cpSync(
        path.join(release, folder),
        path.join(packageDir, "runtime", folder),
        { recursive: true },
      );
  fs.writeFileSync(
    path.join(packageDir, "README.txt"),
    "source/ contains editable source; combine both Angular source trees for the workspace. runtime/ contains deployment files; combine all three runtime folders for the complete application. Node dependencies and real environment files are excluded. The companion release/ is the ready-to-configure complete tree.\n",
  );
}
console.log("RELEASE_DIRECTORY=" + output);
