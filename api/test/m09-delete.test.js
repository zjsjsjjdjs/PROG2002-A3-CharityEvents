const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,expect}=require('@playwright/test');
if(!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME||''))throw new Error('Use an isolated test DB.');
const app=require('../server'),{pool}=require('../event_db');
test('M09 restricted deletion and registration integration',async(t)=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const send=(path,method,body)=>fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const prefix='M09-'+Date.now(),ids=[];
 const create=async(name)=>{const response=await send('/api/admin/events','POST',{organisation_id:1,category_id:1,name:prefix+name,event_datetime:'2032-04-11T10:00',location:'Brisbane',purpose:'Care',short_description:'Summary',full_description:'Details',ticket_price:0,fundraising_goal:0,current_progress:0,status:'active'});assert.equal(response.status,201);const id=(await response.json()).event_id;ids.push(id);return id;};
 const register=id=>send('/api/events/'+id+'/registrations','POST',{name:'Integration attendee',email:'m09@example.com',tickets:1});
 let browser;
 try{
  await t.test('unregistered event deletes and is absent from public and admin APIs',async()=>{
   const id=await create(' empty');assert.equal((await send('/api/admin/events/'+id,'DELETE')).status,200);
   assert.equal((await fetch(base+'/api/admin/events/'+id)).status,404);assert.equal((await fetch(base+'/api/events/'+id)).status,404);
   assert.equal((await send('/api/admin/events/'+id,'DELETE')).status,404);assert.equal((await send('/api/admin/events/no','DELETE')).status,400);
  });
  await t.test('public registration appears in admin and forbids deletion with 409',async()=>{
   const id=await create(' protected');assert.equal((await register(id)).status,201);
   const event=await(await fetch(base+'/api/admin/events/'+id)).json();assert.equal(event.registrations[0].name,'Integration attendee');
   const response=await send('/api/admin/events/'+id,'DELETE');assert.equal(response.status,409);assert.equal((await response.json()).code,'EVENT_HAS_REGISTRATIONS');
   const [[row]]=await pool.execute('SELECT COUNT(*) AS total FROM registrations WHERE event_id=?',[id]);assert.equal(row.total,1);
  });
  await t.test('concurrent registration and deletion cannot produce an orphan or delete a successful registration',async()=>{
   for(let i=0;i<5;i++){
    const id=await create(' race '+i);const [reg,del]=await Promise.all([register(id),send('/api/admin/events/'+id,'DELETE')]);
    assert.ok((reg.status===201&&del.status===409)||(reg.status===404&&del.status===200),'registration='+reg.status+' delete='+del.status);
    const [[row]]=await pool.execute('SELECT COUNT(*) AS total FROM registrations r LEFT JOIN events e ON r.event_id=e.event_id WHERE e.event_id IS NULL');assert.equal(row.total,0);
   }
  });
  await t.test('browser cancel keeps event, confirm deletes, registered event shows refusal',async()=>{
   const id=await create(' browser');browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
   const page=await browser.newPage();await page.goto(base+'/admin.html');
   const row=page.locator('#admin-events tr').filter({hasText:prefix+' browser'});await expect(row).toHaveCount(1);
   page.once('dialog',dialog=>dialog.dismiss());await row.getByRole('button',{name:'Delete',exact:true}).click();await expect(row).toHaveCount(1);
   page.once('dialog',dialog=>dialog.accept());await row.getByRole('button',{name:'Delete',exact:true}).click();await expect(row).toHaveCount(0);
   await expect(page.locator('#save-notice')).toContainText('deleted');
   const protectedRow=page.locator('#admin-events tr').filter({hasText:prefix+' protected'});
   page.once('dialog',dialog=>dialog.accept());await protectedRow.getByRole('button',{name:'Delete',exact:true}).click();
   await expect(page.locator('#admin-status')).toContainText('registrations');await expect(protectedRow).toHaveCount(1);
  });
 }finally{if(browser)await browser.close();for(const id of ids){await pool.execute('DELETE FROM registrations WHERE event_id=?',[id]);await pool.execute('DELETE FROM events WHERE event_id=?',[id]);}await new Promise(r=>server.close(r));await pool.end();}
});
