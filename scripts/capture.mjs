import {chromium} from 'playwright';
import {mkdir,rename} from 'node:fs/promises';
await mkdir('video/assets',{recursive:true});
const browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'video/recordings',size:{width:1440,height:900}},reducedMotion:'reduce'});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4173');
 await page.screenshot({path:'video/assets/website.jpg',type:'jpeg',quality:85});
 const clip=page.video();await page.waitForTimeout(2500);
 await page.evaluate(()=>document.getElementById('features').scrollIntoView());await page.waitForTimeout(3000);
 await page.evaluate(()=>document.getElementById('summary').scrollIntoView());await page.waitForTimeout(3000);
 await context.close();await clip.saveAs('video/assets/website.webm');
}finally{await browser.close();}
console.log('Captured local candidate website; no private interfaces recorded.');
