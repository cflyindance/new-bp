import {build} from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const temp='D:/Dev/Temp/Codex/ad-default-demo-20261123';fs.mkdirSync(temp,{recursive:true});
await build({entryPoints:['src/marketing-display/default-ad-demo.ts'],bundle:true,platform:'node',format:'esm',outfile:path.join(temp,'demo.mjs')});
await build({entryPoints:['src/marketing-display/ad-slot-catalog.ts'],bundle:true,platform:'node',format:'esm',outfile:path.join(temp,'slots.mjs')});
const {buildDefaultDemo,ensureDefaultAdDemo,DEFAULT_DEMO_VERSION}=await import(pathToFileURL(path.join(temp,'demo.mjs')));
const {defaults,newSpec}=await import(pathToFileURL(path.join(temp,'slots.mjs')));
const catalog=defaults();
for(const [key,line,w,h] of [['kiosk-cart','Kiosk',1280,720],['emenu-menu','eMenu',1280,720],['pickup-ready','取餐屏',1280,720],['waitlist-entry','Waitlist',720,1280]]){
 catalog.push({...defaults()[0],id:'display-demo-'+key,code:'demo.'+key,productLine:line,bindings:{[line]:{minimumVersion:'1',mediaKinds:['image','video']}},specs:[newSpec('demo-'+key,w,h)]});
}
const records=buildDefaultDemo([],catalog,'brand','http://localhost/ad-default-demo/','2026-11-23T10:00:00Z');
assert.equal(records.length,9);assert.equal(records.filter(ad=>ad.publishStatus==='published').length,8);
assert.equal(new Set(records.map(ad=>ad.adSlot.productLine)).size,5);
const unique=new Set();
for(const ad of records){
 assert.equal(ad.adPurpose,'default');assert.equal(ad.interactionScope,'brand');
 for(const mid of ad.defaultStoreIds){if(ad.publishStatus==='published'){const key=ad.adSlot.id+':'+mid;assert(!unique.has(key));unique.add(key);}}
 for(const assets of Object.values(ad.adSlotAssets))for(const asset of assets){
  assert.equal(asset.clickAction.type,'none');const file=fs.readFileSync(path.join('public/ad-default-demo',new URL(asset.src).pathname.split('/').at(-1)));
  assert.equal(file.length,asset.metadata.bytes);assert.equal(file.readUInt32BE(16),asset.metadata.width);assert.equal(file.readUInt32BE(20),asset.metadata.height);
 }
}
assert(JSON.stringify(records).length<100_000,'fixtures store static URLs, not duplicated image payloads');
const before=JSON.stringify(records);assert.equal(buildDefaultDemo(records,catalog,'brand','http://localhost/ad-default-demo/').length,9);assert.equal(JSON.stringify(records),before);
const custom={...records[0],id:'customer-existing',name:'Customer preserved',defaultStoreIds:['N789234560']};
const preserved=buildDefaultDemo([custom],catalog,'brand','http://localhost/ad-default-demo/');
assert.equal(JSON.stringify(preserved.find(ad=>ad.id===custom.id)),JSON.stringify(custom));
assert(!preserved.find(ad=>ad.id.endsWith('-kiosk-idle')).defaultStoreIds.includes('N789234560'));
const other=buildDefaultDemo([custom],catalog,'other','http://localhost/ad-default-demo/');assert(other.find(ad=>ad.id.endsWith('-kiosk-idle')&&ad.interactionScope==='other').defaultStoreIds.includes('N789234560'));
const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)},context={demo:true,scope:'brand',canWrite:true,assetBase:'http://localhost/ad-default-demo/'};
for(const change of [{demo:false},{scope:''},{canWrite:false}]){ensureDefaultAdDemo(storage,catalog,{...context,...change});assert.equal(data.size,0);}
ensureDefaultAdDemo(storage,catalog,context);const seeded=data.get('kiosk_themes');assert(data.get(DEFAULT_DEMO_VERSION+'brand'));
storage.setItem('kiosk_themes','[]');ensureDefaultAdDemo(storage,catalog,context);assert.equal(data.get('kiosk_themes'),'[]','deleted demo records never reappear');
storage.setItem('kiosk_themes',seeded);ensureDefaultAdDemo(storage,catalog,{...context,scope:'other'});assert.equal(JSON.parse(data.get('kiosk_themes')).length,18);
const disabled=catalog.map(slot=>({...slot,enabled:false}));assert.equal(buildDefaultDemo([],disabled,'brand','http://localhost/ad-default-demo/').length,0);
console.log('PASS 9 fixtures / 5 channels, media dimensions, scope and overlap isolation, no overwrite, gating and one-time initialization');
