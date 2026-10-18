import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
await mkdir('artifacts',{recursive:true});await mkdir('video/assets',{recursive:true});
const errors=[];
try{
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173');
  assert.equal(await page.locator('h1').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label} overflow`);
  if(width<700){await page.getByRole('button',{name:'Menu',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Menu',exact:true}).getAttribute('aria-expanded'),'true');}
  await page.locator('nav').getByRole('link',{name:'Features',exact:true}).click();await page.waitForURL('**/#features');
  if(width<700)await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.locator('nav .btn').click();await page.waitForURL('**/#contact');
  const submit=page.getByRole('button',{name:'Prepare demo request'});
  await submit.click();assert.equal(await page.locator('#name').evaluate(e=>e.validity.valueMissing),true);
  await page.locator('#name').fill('   ');await page.locator('#business').fill('Example Plumbing');await page.locator('#email').fill('not-an-email');await page.locator('#message').fill('Tailored intake demo');
  assert.equal(await page.locator('#email').evaluate(e=>e.validity.typeMismatch),true);
  await page.locator('#email').fill('alex@example.com');await submit.click();assert.equal(await page.locator('#name').evaluate(e=>e.validity.customError),true);
  await page.locator('#name').fill('Alex Example');await page.locator('#phone').fill('abc');assert.equal(await page.locator('#phone').evaluate(e=>e.validity.patternMismatch),true);await page.locator('#phone').fill('(512) 555-0142');
  await submit.click();await page.waitForFunction(()=>document.getElementById('form-status').textContent.includes('Draft ready'));
  const href=await page.locator('#email-draft').getAttribute('href');assert.ok(href.startsWith('mailto:tishola396@gmail.com?'));assert.ok(decodeURIComponent(href).includes('Example Plumbing'));
  assert.ok((await page.locator('#form-status').textContent()).includes('Nothing has been sent or stored'));
  await page.locator('summary').first().click();assert.equal(await page.locator('details').first().getAttribute('open'),'');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/${label}.png`,fullPage:true});await page.screenshot({path:`artifacts/${label}-hero.png`});
  if(label==='desktop')await page.screenshot({path:'video/assets/website.jpg',type:'jpeg',quality:85});
  if(!process.argv.includes('--capture-only')){
   await page.locator('video').evaluate(v=>{v.muted=true;v.load();});
   await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
   assert.ok(Math.abs(await page.locator('video').evaluate(v=>v.duration)-75)<.2);
   await page.locator('video').evaluate(v=>v.play());await page.waitForFunction(()=>document.querySelector('video').currentTime>0.1);
   await page.locator('video').evaluate(v=>v.pause());
  }
  await page.close();console.log(`${label}: navigation, validation, draft, FAQ, layout${process.argv.includes('--capture-only')?'':', video'} passed`);
 }
 assert.deepEqual(errors,[],'Browser errors');
 // Exercise the form's error recovery without any network or email delivery.
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4173');
 for(const [id,value] of [['name','Alex'],['business','Example'],['email','alex@example.com'],['message','Demo']])await page.locator(`#${id}`).fill(value);
 await page.evaluate(()=>{window.encodeURIComponent=()=>{throw Error('Simulated preparation failure');};});
 await page.getByRole('button',{name:'Prepare demo request'}).click();await page.waitForFunction(()=>document.getElementById('form-status').classList.contains('error'));
 assert.equal(await page.getByRole('button',{name:'Prepare demo request'}).isEnabled(),true);await page.close();
 console.log('Error recovery passed; no browser console errors.');
}finally{await browser.close();}
