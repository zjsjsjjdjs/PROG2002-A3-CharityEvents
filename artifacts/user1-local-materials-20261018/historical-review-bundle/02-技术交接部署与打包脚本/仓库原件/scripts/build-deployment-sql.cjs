// Generate a portable fresh-install SQL file for an already-created cPanel database.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname,'..');
let seed = fs.readFileSync(path.join(root,'database/charityevents_db.sql'),'utf8')
  .replace(/^\s*(?:DROP DATABASE|CREATE DATABASE|USE )[^;]*;\s*/gm,'');
const header = '-- A3 fresh installation into an EMPTY database selected by the operator.\n' +
  '-- No DROP/CREATE DATABASE or hard-coded USE statements. Never import over live data.\n' +
  '-- A2: Tianyi Li <id_09188388@foxmail.com>.\n' +
  '-- Registration schema and samples: Hongke Ouyang <2838356314@qq.com>.\n' +
  '-- Deployment assembly: Tianyi Li <id_09188388@foxmail.com>.\n\n';
const parts = ['m02-registrations.sql','m02-registration-samples.sql'].map(file=>fs.readFileSync(path.join(root,'database',file),'utf8'));
fs.writeFileSync(path.join(root,'database/a3-fresh-install.sql'),header+seed+'\n'+parts.join('\n'));
console.log('Wrote database/a3-fresh-install.sql (fresh database only).');
