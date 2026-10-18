import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const handler=createRequire(import.meta.url)('../api/demo-request.js');
const fields={name:'Alex',business:'Example',email:'alex@example.com',phone:'',message:'Demo'};
const env={DEMO_ALLOWED_ORIGIN:'https://example.com',DEMO_SCRIPT_SECRET:'x'.repeat(64),DEMO_SCRIPT_URL:'https://script.google.com/macros/s/test/exec',DEMO_REDIS_URL:'https://redis.example.com',DEMO_REDIS_TOKEN:'private'};
Object.assign(process.env,env);
const request=(body=fields,headers={})=>({method:'POST',headers:{origin:env.DEMO_ALLOWED_ORIGIN,'content-type':'application/json',...headers},body});
async function run(req){const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;}};await handler(req,res);return res;}
test('endpoint validates, rate limits, forwards privately and fails closed',async()=>{
 const original=globalThis.fetch;let calls=[];let count=1;let ok=true;
 globalThis.fetch=async(url,opts)=>{calls.push({url,opts});const body=JSON.parse(opts.body);return {ok:true,json:async()=>url===env.DEMO_REDIS_URL?{result:count}:{ok,id:body.id}};};
 try {
  assert.equal((await run({...request(),method:'GET'})).code,405);
  assert.equal((await run(request(fields,{origin:'https://evil.com'}))).code,403);
  assert.equal((await run(request(fields,{'content-type':'text/plain'}))).code,415);
  for(const body of [null,[],{...fields,name:' '},{...fields,email:'a\nb@example.com'},{...fields,phone:'abc'},{...fields,message:'x'.repeat(2001)},{...fields,website:'bot'}])assert.equal((await run(request(body))).code,400);
  assert.equal(calls.length,0);
  assert.equal((await run(request())).code,200);
  assert.equal(calls[0].opts.body.includes('alex@example.com'),false);
  assert.equal(JSON.parse(calls[1].opts.body).secret,env.DEMO_SCRIPT_SECRET);
  const first=JSON.parse(calls[1].opts.body).id;
  await run(request());assert.equal(JSON.parse(calls[3].opts.body).id,first);
  count=6;const rate=await run(request());assert.equal(rate.code,429);assert.equal(rate.headers['Retry-After'],'600');
  count=1;ok=false;assert.equal((await run(request())).code,503);
  globalThis.fetch=async()=>{throw Error('network');};assert.equal((await run(request())).code,503);
  delete process.env.DEMO_SCRIPT_SECRET;assert.equal((await run(request())).code,503);
 } finally {globalThis.fetch=original;Object.assign(process.env,env);}
});
test('Apps Script authenticates, deduplicates, and blocks ambiguous retry',()=>{
 const properties=new Map([['DEMO_SCRIPT_SECRET',env.DEMO_SCRIPT_SECRET],['DEMO_NOTIFY_EMAIL','owner@example.com']]);let sent=0;let fail=false;
 const context=vm.createContext({ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})},LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock(){}})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k),setProperty:(k,v)=>properties.set(k,v),deleteProperty:k=>properties.delete(k),getProperties:()=>Object.fromEntries(properties)})},MailApp:{getRemainingDailyQuota:()=>10,sendEmail:()=>{sent++;if(fail)throw Error('ambiguous');}}});
 vm.runInContext(readFileSync('docs/demo-request.gs','utf8'),context);
 const post=(data)=>context.doPost({postData:{contents:JSON.stringify(data)}});
 const data={secret:env.DEMO_SCRIPT_SECRET,id:'a'.repeat(64),fields};
 assert.equal(post({...data,secret:'wrong'}).ok,false);assert.equal(sent,0);
 assert.equal(post(data).ok,true);assert.equal(post(data).ok,true);assert.equal(sent,1);
 fail=true;const second={...data,id:'b'.repeat(64)};assert.equal(post(second).ok,false);assert.equal(post(second).ok,false);assert.equal(sent,2);
});
