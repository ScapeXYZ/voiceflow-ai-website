import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
for(const file of ['api/demo-request.js','tests/backend.mjs','app.js','scripts/build.mjs','scripts/serve.mjs','scripts/render.mjs','scripts/capture.mjs','tests/ui.mjs'])execFileSync(process.execPath,['--check',file]);
const html=readFileSync('index.html','utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error('Duplicate IDs');
for(const match of html.matchAll(/href="#([^"]+)"/g))if(!ids.includes(match[1]))throw Error('Broken anchor '+match[1]);
console.log('JavaScript syntax, unique IDs, and anchor checks passed.');
