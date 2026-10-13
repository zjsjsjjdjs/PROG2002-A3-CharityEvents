const { test }=require('node:test'), assert=require('node:assert/strict');
const { chromium,expect }=require('@playwright/test');
if(!/^user1_a3_test_[a-z0-9_]+$/.test(process.env.DB_NAME||''))throw new Error('Use an isolated test DB.');
const app=require('../server'),{pool}=require('../event_db');
test('M08 editing and registration preservation',async(t)=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const send=(url,method,body)=>fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data={organisation_id:1,category_id:2,name:'M08-'+Date.now(),event_datetime:'2031-05-15T14:30:00',location:'Town Hall',purpose:'Community care',short_description:'Summary',full_description:'Details',ticket_price:20,fundraising_goal:1000,current_progress:50,status:'active',latitude:-27.47,longitude:153.02};
 let id,browser,registrationId;
 try{
  id=(await(await send('/api/admin/events','POST',data)).json()).event_id;assert.ok(id);
  registrationId=(await(await send('/api/events/'+id+'/registrations','POST',{name:'M08 Attendee',email:'m08@example.com',tickets:2})).json()).registration.registration_id;
  await t.test('detail returns every form field and uses the shared attendee helper',async()=>{
   const response=await fetch(base+'/api/admin/events/'+id);assert.equal(response.status,200);const event=await response.json();
   assert.equal(event.event_datetime,'2031-05-15T14:30:00+10:00');assert.equal(event.organisation_id,1);
   assert.equal(event.registrations[0].registration_id,registrationId);assert.ok(!('email' in event.registrations[0]));
  });
  await t.test('update changes public data, preserves registrations and accepts unchanged saves',async()=>{
   for(let i=0;i<2;i++)assert.equal((await send('/api/admin/events/'+id,'PUT',{...data,name:data.name+' updated'})).status,200);
   const event=await(await fetch(base+'/api/events/'+id)).json();assert.equal(event.name,data.name+' updated');
   assert.equal(event.registrations[0].registration_id,registrationId);
  });
  await t.test('suspended events stay editable and keep registrations while hidden publicly',async()=>{
   assert.equal((await send('/api/admin/events/'+id,'PUT',{...data,status:'suspended'})).status,200);
   assert.equal((await fetch(base+'/api/events/'+id)).status,404);
   const event=await(await fetch(base+'/api/admin/events/'+id)).json();assert.equal(event.status,'suspended');assert.equal(event.registrations.length,1);
  });
  await t.test('invalid IDs, missing events and invalid update values are rejected',async()=>{
   for(const method of ['GET','PUT']){
    assert.equal((await send('/api/admin/events/abc',method,method==='GET'?undefined:data)).status,400);
    assert.equal((await send('/api/admin/events/2147483647',method,method==='GET'?undefined:data)).status,404);
   }
   assert.equal((await send('/api/admin/events/'+id,'PUT',{...data,ticket_price:-1})).status,400);
   assert.equal((await send('/api/admin/events/'+id,'PUT',{...data,category_id:2147483647})).status,400);
  });
  await t.test('browser prefills Brisbane time, shows attendees and saves changes',async()=>{
   browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});const page=await browser.newPage();
   await page.goto(base+'/admin-event.html?id='+id);await expect(page.locator('#save-event')).toBeEnabled();
   await expect(page.locator('#event_datetime')).toHaveValue('2031-05-15T14:30');await expect(page.locator('#status')).toHaveValue('suspended');
   await expect(page.locator('#registration-list')).toContainText('M08 Attendee');await expect(page.locator('#registration-list')).toContainText('2 tickets');
   await page.locator('#name').fill(data.name+' browser');await page.locator('#status').selectOption('active');await page.locator('#save-event').click();
   await expect(page).toHaveURL(/admin.html\?saved=/);
   const event=await(await fetch(base+'/api/events/'+id)).json();assert.equal(event.name,data.name+' browser');assert.equal(event.registrations.length,1);
   await page.goto(base+'/admin-event.html?id=abc');await expect(page.locator('#form-status')).toContainText('Invalid event ID');await expect(page.locator('#save-event')).toBeDisabled();
  });
 }finally{if(browser)await browser.close();if(id){await pool.execute('DELETE FROM registrations WHERE event_id=?',[id]);await pool.execute('DELETE FROM events WHERE event_id=?',[id]);}await new Promise(r=>server.close(r));await pool.end();}
});
