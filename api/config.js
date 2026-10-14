const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
function integer(value, fallback, name, minimum, maximum) {
  const raw = value === undefined || value === '' ? String(fallback) : String(value);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < minimum || Number(raw) > maximum)
    throw new Error(name + ' is outside its supported integer range.');
  return Number(raw);
}
function origin(value, name) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(name + ' must be an HTTP(S) origin.'); }
  if (!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error(name + ' must be an HTTP(S) origin without a path or credentials.');
  return parsed.origin;
}
function readConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const publicOrigin = env.PUBLIC_ORIGIN ? origin(env.PUBLIC_ORIGIN,'PUBLIC_ORIGIN') : '';
  const adminUser = env.ADMIN_USERNAME || '', adminPassword = env.ADMIN_PASSWORD || '';
  if (Boolean(adminUser) !== Boolean(adminPassword)) throw new Error('Set both ADMIN_USERNAME and ADMIN_PASSWORD.');
  if (adminUser.includes(':')) throw new Error('ADMIN_USERNAME cannot contain a colon.');
  if (production && (!adminUser || adminPassword.length < 16 || !publicOrigin.startsWith('https://')))
    throw new Error('Production requires HTTPS PUBLIC_ORIGIN and ADMIN_USERNAME/ADMIN_PASSWORD (at least 16 characters).');
  if (production && (!env.DB_USER || !env.DB_NAME)) throw new Error('Production requires explicit DB_USER and DB_NAME.');
  return {
    production, publicOrigin, adminUser, adminPassword,
    port:integer(env.PORT,3000,'PORT',0,65535), host:env.HOST || '127.0.0.1',
    allowedOrigins:(env.CORS_ALLOWED_ORIGINS || '').split(',').map(v=>v.trim()).filter(Boolean).map(v=>origin(v,'CORS_ALLOWED_ORIGINS')),
    database:{host:env.DB_HOST || 'localhost',port:integer(env.DB_PORT,3306,'DB_PORT',1,65535),
      user:env.DB_USER || 'root',password:env.DB_PASSWORD || '',database:env.DB_NAME || 'charityevents_db',
      connectionLimit:integer(env.DB_CONNECTION_LIMIT,10,'DB_CONNECTION_LIMIT',1,100),
      connectTimeout:integer(env.DB_CONNECT_TIMEOUT,10000,'DB_CONNECT_TIMEOUT',100,120000)}
  };
}
const config = readConfig();
module.exports = { config, readConfig };
