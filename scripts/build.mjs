import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','styles.css','app.js','favicon.svg','robots.txt','sitemap.xml']) await copyFile(file,`dist/${file}`);
await cp('public/demo','dist/demo',{recursive:true});
const html=await readFile('index.html','utf8');
for(const id of ['features','how','demo','contact','faq']) if(!html.includes(`id="${id}"`)) throw Error(`Missing section ${id}`);
console.log('Static production build ready in dist/');
