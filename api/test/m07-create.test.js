const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, expect } = require('@playwright/test');
if (!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME || '')) throw new Error('Use an isolated test DB.');
const app = require('../server'), { pool } = require('../event_db');
const prefix = 'M07-' + Date.now();
const valid = { organisation_id:1, category_id:1, name:prefix, event_datetime:'2030-04-20T14:30',
 location:'Brisbane', purpose:'Community support', short_description:'Short description', full_description:'Full description',
 ticket_price:'15.50', fundraising_goal:'2000', current_progress:'0', status:'active', latitude:'', longitude:'' };
test('M07 create and validate events', async (t) => {
 const server = app.listen(0,'127.0.0.1'); await new Promise((r)=>server.once('listening',r));
 const base='http://127.0.0.1:'+server.address().port;
 const post=(body)=>fetch(base+'/api/admin/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 let browser;
 try {
  await t.test('creates a persisted event with category and decimal prices', async()=>{
   const response=await post(valid); assert.equal(response.status,201);
   const result=await response.json(); const [[row]]=await pool.execute('SELECT * FROM events WHERE event_id=?',[result.event_id]);
   assert.equal(row.name,prefix); assert.equal(row.ticket_price,'15.50'); assert.equal(row.latitude,null);
   const list=await (await fetch(base+'/api/admin/events')).json(); assert.ok(list.some(e=>e.event_id===result.event_id));
  });
  await t.test('rejects malformed fields and foreign keys without inserting rows', async()=>{
   const invalid=[{name:' '},{name:'a'.repeat(151)},{event_datetime:'2026-02-30T12:00'},{event_datetime:'2030-04-20T25:00'},
    {ticket_price:-1},{ticket_price:1.001},{ticket_price:true},{fundraising_goal:'100000000'}, {current_progress:''},
    {category_id:'1 OR 1=1'},{category_id:2147483647},{status:'past'},{latitude:91,longitude:1},{latitude:1,longitude:''},
    {organisation_id:2147483647},{full_description:''}];
   for(const values of invalid){ const response=await post({...valid,...values}); assert.equal(response.status,400,JSON.stringify(values)); }
   assert.equal((await post(null)).status,400); assert.equal((await post([])).status,400);
   assert.equal((await fetch(base+'/api/admin/events',{method:'POST',headers:{'Content-Type':'text/plain'},body:'hello'})).status,415);
  });
  await t.test('browser validates, creates, refreshes and keeps safe text content',async()=>{
   browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
   const page=await browser.newPage(); await page.goto(base+'/admin-event.html');
   await expect(page.locator('#save-event')).toBeEnabled();
   await page.locator('#save-event').click(); await expect(page.locator('#form-status')).toContainText('name is required');
   for(const key of ['name','event_datetime','location','purpose','short_description','full_description','ticket_price','fundraising_goal','current_progress']){
    await page.locator('#'+key).fill(key==='name'?prefix+' <img src=x onerror=alert(1)>':String(valid[key]));
   }
   await page.locator('#category_id').selectOption('1');
   await page.locator('#save-event').click(); await expect(page).toHaveURL(/admin.html\?saved=\d+/);
   await expect(page.locator('#admin-events')).toContainText(prefix+' <img');
   assert.equal(await page.locator('#admin-events img').count(),0);
   await page.reload(); await expect(page.locator('#admin-events')).toContainText(prefix+' <img');
   await page.goto(base+'/admin-event.html'); await expect(page.locator('#save-event')).toBeEnabled();
   await page.setViewportSize({width:390,height:844}); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  });
 }finally{if(browser)await browser.close();await pool.execute('DELETE FROM events WHERE name LIKE ?',[prefix+'%']);await new Promise(r=>server.close(r));await pool.end();}
});
