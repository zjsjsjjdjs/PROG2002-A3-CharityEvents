const fs = require('node:fs');
const path = require('node:path');
const mysql = require('../api/node_modules/mysql2/promise');
const dotenv = require('../api/node_modules/dotenv');
const { spawn } = require('node:child_process');

// Create and dispose only a database owned by this invocation; keep local .env intact.
async function main() {
  const root = path.resolve(__dirname, '..');
  const env = dotenv.parse(fs.readFileSync(path.join(root, 'api/.env')));
  const database = 'user1_a3_test_joint_' + Date.now() + '_' + require('node:crypto').randomBytes(4).toString('hex');
  const connection = await mysql.createConnection({
    host: env.DB_HOST || 'localhost', port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root', password: env.DB_PASSWORD || '', multipleStatements: true
  });
  let created = false;
  try {
    await connection.query('CREATE DATABASE `' + database + '` CHARACTER SET utf8mb4');
    created = true;
    await connection.query('USE `' + database + '`');
    await connection.query(fs.readFileSync(path.join(root, 'database/a3-fresh-install.sql'), 'utf8'));
    console.log('Fresh joint acceptance database: ' + database);
    const childEnv = { ...process.env, ...env, DB_NAME: database, NODE_ENV: 'development',
      ADMIN_USERNAME: '', ADMIN_PASSWORD: '', PUBLIC_ORIGIN: '', CORS_ALLOWED_ORIGINS: '' };
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath,
        ['--require', 'dotenv/config', '--test', '--test-concurrency=1'],
        { cwd: path.join(root, 'api'), env: childEnv, stdio: 'inherit', windowsHide: true });
      child.once('error', reject);
      child.once('exit', (code) => resolve(code === null ? 1 : code));
    });
    process.exitCode = code;
  } finally {
    if (created) {
      await connection.query('DROP DATABASE `' + database + '`');
      console.log('Disposed owned joint acceptance database: ' + database);
    }
    await connection.end();
  }
}
main().catch((error) => { console.error(error.code || error.message); process.exitCode = 1; });
