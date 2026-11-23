import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
// Exercise the real native adapter, including the asynchronous confirmation boundary.
let opened, scope='brand',canWrite=true;
function element(){const nodes=new Map();return {style:{},className:'',hidden:false,isConnected:true,
  setAttribute(){},append(){},prepend(){},remove(){},focus(){},close(){},showModal(){opened=this;},
  querySelector(key){if(!nodes.has(key))nodes.set(key,element());return nodes.get(key);},
  createTHead(){return this;},insertRow(){return element();},insertCell(){return element();}};}
const slot={id:'slot',code:'home',productLine:'Kiosk',specs:[{id:'s',maxImages:5,maxVideos:1}],bindings:{Kiosk:{mediaKinds:['image']}}};
const make=(id)=>({id,name:id,adPurpose:'default',interactionScope:'brand',adSlot:slot,defaultStoreIds:['1','2'],distributedStores:[{mid:'1'},{mid:'2'}],publishStatus:'published',adSlotAssets:{s:[{type:'image',metadata:{kind:'image'}}]}});
const initial=[make('old'),{...make('new'),publishStatus:'draft'}];
const storage=new Map([['kiosk_themes',JSON.stringify(initial)]]);
const context={structuredClone,window:{},document:{activeElement:element(),createElement:element,body:element()},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  KioskAdActivities:{getContext:()=>({scope,canWrite}),validateThemeActions:async()=>{}},
  KioskAdSlots:{readCatalog:()=>[],validateSnapshot:()=>slot,validateMedia:()=>[]}};
vm.createContext(context);
for(const file of ['kiosk-default-ads.js','kiosk-default-ad-ui.js']){
  vm.runInContext(fs.readFileSync(new URL('../dist/Configuration center/assets/'+file,import.meta.url),'utf8'),context);
}
const enable=context.window.KioskDefaultAdUI.enable;
const before=storage.get('kiosk_themes');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let pending=enable('new',[{name:'Store A',mid:'1'}]);await tick();
assert.equal(storage.get('kiosk_themes'),before);
opened.querySelector('[data-cancel]').onclick();assert.equal(await pending,false);assert.equal(storage.get('kiosk_themes'),before);
pending=enable('new',[{mid:'1'}]);await tick();storage.set('kiosk_themes',before+' ');
opened.querySelector('[data-ok]').onclick();await assert.rejects(pending,/其他窗口修改/);assert.equal(storage.get('kiosk_themes'),before+' ');
storage.set('kiosk_themes',before);
pending=enable('new',[{mid:'1'}]);await tick();canWrite=false;
opened.querySelector('[data-ok]').onclick();await assert.rejects(pending,/权限已变化/);assert.equal(storage.get('kiosk_themes'),before);
canWrite=true;
pending=enable('new',[{mid:'1'}]);await tick();opened.querySelector('[data-ok]').onclick();assert.equal(await pending,true);
const saved=JSON.parse(storage.get('kiosk_themes'));assert.deepEqual(saved[0].defaultStoreIds,['2']);assert.deepEqual(saved[1].defaultStoreIds,['1']);
console.log('PASS native confirmation: cancel unchanged, stale revision blocked, permission recheck, atomic partial replacement');
