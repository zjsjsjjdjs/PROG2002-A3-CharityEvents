// Local-only acceptance setup. Creates a new isolated DB; never drops a database.
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('../api/node_modules/mysql2/promise');
const dotenv = require('../api/node_modules/dotenv');

async function main() {
  const sourceEnv = process.argv[2];
  if (!sourceEnv) throw new Error('Pass the path to a local connection .env file.');
  const root = path.resolve(__dirname, '..');
  const envPath = path.join(root, 'api/.env');
  if (fs.existsSync(envPath)) throw new Error('api/.env already exists; refusing to overwrite it.');
  const source = dotenv.parse(fs.readFileSync(sourceEnv));
  const name = 'user1_a3_test_admin_' + Date.now();
  const connection = await mysql.createConnection({
    host: source.DB_HOST || 'localhost', port: Number(source.DB_PORT || 3306),
    user: source.DB_USER || 'root', password: source.DB_PASSWORD || '', multipleStatements: true
  });
  try {
    await connection.query('CREATE DATABASE `' + name + '` CHARACTER SET utf8mb4');
    await connection.query('USE `' + name + '`');
    const seed = fs.readFileSync(path.join(root, 'database/charityevents_db.sql'), 'utf8')
      .replace(/^\s*(?:DROP DATABASE|CREATE DATABASE|USE )[^;]*;\s*/gm, '');
    await connection.query(seed);
    for (const file of ['m02-registrations.sql', 'm02-registration-samples.sql']) {
      await connection.query(fs.readFileSync(path.join(root, 'database', file), 'utf8'));
    }
    const local = { PORT: '3001', DB_HOST: source.DB_HOST || 'localhost', DB_PORT: source.DB_PORT || '3306',
      DB_USER: source.DB_USER || 'root', DB_PASSWORD: source.DB_PASSWORD || '', DB_NAME: name };
    fs.writeFileSync(envPath, Object.entries(local).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n', { flag: 'wx' });
    console.log('Isolated database created: ' + name + '. Connection saved to ignored api/.env.');
  } finally { await connection.end(); }
}
main().catch((error) => { console.error(error.code || error.message); process.exitCode = 1; });
