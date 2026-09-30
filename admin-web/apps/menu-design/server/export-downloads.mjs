import crypto from 'node:crypto';
const files=new Map();
const prefix='/menu-design/exports';
const origins=new Set([5173,5174,4173,4174].flatMap(p=>['http://localhost:'+p,'http://127.0.0.1:'+p]));
export function menuDesignDownloads(req,res,next){
  const url=(req.url||'').split('?')[0];
  if(url!==prefix&&!url.startsWith(prefix+'/'))return next();
  const origin='http://'+req.headers.host;
  if(!origins.has(origin)){res.writeHead(403);res.end();return;}
  for(const [id,item] of files)if(Date.now()-item.time>3600000)files.delete(id);
  if(url===prefix&&req.method==='POST'){
    if(req.headers.origin!==origin){res.writeHead(403);res.end();return;}
    let name;try{name=decodeURIComponent(req.headers['x-menu-filename']||'menu.bin').replace(/[\r\n\\/]/g,'_').slice(0,180);}catch{res.writeHead(400);res.end();return;}
    const chunks=[];let size=0;
    req.on('data',chunk=>{size+=chunk.length;if(size>40*1024*1024){if(!res.writableEnded){res.writeHead(413);res.end('File too large');}return;}chunks.push(chunk);});
    req.on('end',()=>{if(res.writableEnded)return;while(files.size>=6)files.delete(files.keys().next().value);const id=crypto.randomUUID();const type=['image/png','image/jpeg','application/pdf','application/zip'].includes(req.headers['content-type'])?req.headers['content-type']:'application/octet-stream';files.set(id,{bytes:Buffer.concat(chunks),type,name,time:Date.now()});res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({url:prefix+'/'+id}));});
    return;
  }
  if(req.method==='GET'){
    const item=files.get(url.slice(prefix.length+1));if(!item){res.writeHead(404);res.end('Export expired; export again.');return;}
    res.writeHead(200,{'Content-Type':item.type,'Content-Length':item.bytes.length,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(item.name),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(item.bytes);return;
  }
  res.writeHead(405);res.end();
}
