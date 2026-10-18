import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv.includes('--dist')?'dist':'.');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.mp4':'video/mp4','.vtt':'text/vtt','.txt':'text/plain','.xml':'application/xml'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 let name=decodeURIComponent(url.pathname);if(name==='/')name='/index.html';
 if(!process.argv.includes('--dist')&&name.startsWith('/demo/'))name='/public'+name;
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))throw Error();
 const info=await stat(file);const data=await readFile(file);
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 if(req.headers.range){const match=/bytes=(\d+)-(\d*)/.exec(req.headers.range);if(!match){res.writeHead(416);return res.end();}const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),info.size-1):info.size-1;if(start>end){res.writeHead(416);return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${info.size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});res.end(data.subarray(start,end+1));}
 else{res.setHeader('Content-Length',info.size);res.end(data);}
}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
