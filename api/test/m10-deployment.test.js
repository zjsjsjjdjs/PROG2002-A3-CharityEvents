const {test}=require('node:test'),assert=require('node:assert/strict');
const express=require('express'),cors=require('cors');
const {readConfig,config}=require('../config'),{adminAccess}=require('../admin-access');
const {spawn}=require('node:child_process'),path=require('node:path');
const production={NODE_ENV:'production',PUBLIC_ORIGIN:'https://events.example.com',ADMIN_USERNAME:'acceptance-admin',ADMIN_PASSWORD:'test-only-not-a-real-password',DB_USER:'test',DB_NAME:'test'};
test('M10 deployment settings and protected administration',async(t)=>{
 await t.test('validates ports, explicit production identity and HTTPS configuration',()=>{
  assert.equal(readConfig({DB_PORT:'3307'}).database.port,3307);
  for(const patch of [{ADMIN_PASSWORD:''},{ADMIN_PASSWORD:'short'},{PUBLIC_ORIGIN:'http://example.com'},{DB_NAME:''},{DB_PORT:'abc'},{CORS_ALLOWED_ORIGINS:'*'}])
   assert.throws(()=>readConfig({...production,...patch}));
  assert.deepEqual(readConfig({CORS_ALLOWED_ORIGINS:'https://public.example.com, https://second.example.com'}).allowedOrigins,['https://public.example.com','https://second.example.com']);
 });
 await t.test('protects page and API, accepts correct auth, rejects cross-site writes',async()=>{
  const app=express(),cfg=readConfig(production);
  app.use(adminAccess(cfg));app.all('/admin',(req,res)=>res.json({ok:true}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const url='http://127.0.0.1:'+server.address().port+'/admin';
  const auth='Basic '+Buffer.from(cfg.adminUser+':'+cfg.adminPassword).toString('base64');
  try{
   assert.equal((await fetch(url)).status,401);
   assert.equal((await fetch(url,{headers:{Authorization:'Basic d3Jvbmc='}})).status,401);
   assert.equal((await fetch(url,{headers:{Authorization:auth}})).status,200);
   assert.equal((await fetch(url,{method:'DELETE',headers:{Authorization:auth,Origin:'https://evil.example'}})).status,403);
   assert.equal((await fetch(url,{method:'DELETE',headers:{Authorization:auth,Origin:cfg.publicOrigin}})).status,200);
  }finally{await new Promise(r=>server.close(r));}
 });
 await t.test('fresh cPanel SQL imports into an empty selected database with all four tables and samples',async()=>{
  if(!/^user1_a3_test_[a-z0-9_]+$/.test(config.database.database))throw new Error('Use an isolated test DB.');
  const mysql=require('mysql2/promise'),fs=require('node:fs');
  const {connectionLimit,...database}=config.database;
  const connection=await mysql.createConnection({...database,multipleStatements:true});
  const name='user1_a3_test_install_'+Date.now();
  let created=false;
  try{
   await connection.query('CREATE DATABASE '+name);created=true;await connection.query('USE '+name);
   const sql=fs.readFileSync(path.resolve(__dirname,'../../database/a3-fresh-install.sql'),'utf8');
   assert.ok(!/^\s*(DROP DATABASE|CREATE DATABASE|USE )/mi.test(sql));
   await connection.query(sql);
   const [tables]=await connection.query('SHOW TABLES');assert.equal(tables.length,4);
   const [[events]]=await connection.query('SELECT COUNT(*) AS total FROM events');assert.equal(events.total,8);
   const [[registrations]]=await connection.query('SELECT COUNT(*) AS total FROM registrations');assert.equal(registrations.total,12);
  }finally{if(created)await connection.query('DROP DATABASE '+name);await connection.end();}
 });
 await t.test('root-directory Passenger entry loads api/.env and serves real DB without exposing credentials',async()=>{
  if(!/^user1_a3_test_[a-z0-9_]+$/.test(config.database.database))throw new Error('Use an isolated test DB.');
  const childEnv={...process.env,PORT:'0',HOST:'127.0.0.1',CORS_ALLOWED_ORIGINS:'https://allowed.example'};
  for(const key of ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME']) delete childEnv[key];
  const child=spawn(process.execPath,['api/app.js'],{cwd:path.resolve(__dirname,'../..'),env:childEnv,stdio:['ignore','pipe','pipe']});
  try{
   const port=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Startup timeout')),10000);
    child.once('exit',code=>{clearTimeout(timeout);reject(new Error('Startup failed '+code));});
    let output='';child.stdout.on('data',chunk=>{output+=chunk;const match=/listening on port (\d+)/.exec(output);if(match){clearTimeout(timeout);resolve(match[1]);}});
   });
   const base='http://127.0.0.1:'+port;
   assert.equal((await(await fetch(base+'/api/health')).json()).database,'connected');
   assert.equal((await fetch(base+'/admin.html')).status,200);
   for(const endpoint of ['/.env','/api/.env','/.git/config','/api/event_db.js'])assert.equal((await fetch(base+endpoint)).status,404);
   const allowed=await fetch(base+'/api/categories',{headers:{Origin:'https://allowed.example'}});assert.equal(allowed.headers.get('access-control-allow-origin'),'https://allowed.example');
   const noCors=await fetch(base+'/api/categories',{headers:{Origin:'https://unlisted.example'}});assert.equal(noCors.headers.get('access-control-allow-origin'),null);
  }finally{child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));}
 });
});
