import assert from 'node:assert/strict';
import { createManagedActivityDemo, ACTIVITY_DEMO_STORE_MIDS, resolveActivityStoreId, type ManagedActivityStoreRow } from '../src/config/merchant-activity-managed-demo';
import { createActivityDemo } from '../src/config/merchant-activity-demo';
import { resolveOrders, summarizeActivity, PRODUCT_LINES, shiftDate } from '../src/config/merchant-activity-domain';
import { globalDeviceRows } from '../src/config/device-activity-domain';
import { scopedActivityStores, canonicalActivityContext } from '../src/config/merchant-activity-context';
import { parseActivityScope } from '../src/config/merchant-activity-drilldown';
const definitions=[
 ['M00000001','merchant-zhangji','张记火锅','上海陆家嘴店'],['M00000002','merchant-zhangji','张记火锅','广州天河店'],
 ['M00000003','merchant-tea-one','茶语一家','茶语一家'],['M00000004','merchant-menusifu-na','MenuSifu NA Demo','Flagship · NYC'],
 ['M00000005','merchant-expired-demo','湘味小厨（到期演示）','湘味小厨（到期演示）'],['M00000006','merchant-sakura-sushi','Sakura Sushi Group','Sakura Sushi Group'],
 ['M00000007','merchant-burger-co','Burger Co. West','Burger Co. West'],['M00000009','merchant-zhangji-skewers','张记串串','张记串串'],
];
const rows:ManagedActivityStoreRow[]=definitions.map(([storeId,merchantId,merchantName,name])=>({merchantId,merchantName,store:{storeId,name,merchantId}}));
const before=JSON.stringify(rows),asOf='2026-10-29',d=createManagedActivityDemo(rows,asOf),raw=createActivityDemo(asOf),o=resolveOrders(d),r=resolveOrders(raw);
assert.equal(JSON.stringify(rows),before,'analysis never mutates management records');
assert.deepEqual(d,createManagedActivityDemo(rows,asOf),'same day and management identities yield deterministic fixtures');
assert.deepEqual(new Set(d.stores.map(s=>s.id)),new Set(definitions.map(r=>r[0])));assert.equal(d.stores.length,8);assert.equal(new Set(d.stores.map(s=>s.merchantId)).size,7);
assert(d.stores.every(s=>{const row=rows.find(r=>r.store.storeId===s.id)!;return s.merchantId===row.merchantId&&s.merchantName===row.merchantName&&s.name===row.store.name}));
assert(d.orders.every(x=>d.stores.some(s=>s.id===x.storeId)));assert(d.bindings.every(x=>d.stores.some(s=>s.id===x.storeId)));assert.equal(d.devices.length,raw.devices.length);assert.equal(o.length,r.length);
for(const days of [1,7,30,90]){const period={start:shiftDate(asOf,1-days),end:asOf};const m=(id:string)=>summarizeActivity(d,o,{storeId:id},period);const old=(id:string)=>summarizeActivity(raw,r,{storeId:id},period);
 assert.equal(m('M00000002').count,old('demo-mixed').count!+old('demo-unknown').count!,'M2 merged count reconciles');
 assert.equal(m('M00000002').unknown,old('demo-mixed').unknown!+old('demo-unknown').unknown!);
 for(const s of d.stores.filter(s=>s.quality!=='error'))assert.equal(m(s.id).count,PRODUCT_LINES.reduce((n,line)=>n+(summarizeActivity(d,o,{storeId:s.id,line},period).count??0),0)+m(s.id).unknown!,'store reconciles to lines + unknown');
}
const week={start:shiftDate(asOf,-6),end:asOf},metrics=(storeId:string)=>summarizeActivity(d,o,{storeId},week);
assert.equal(metrics('M00000001').status,'active');assert.equal(metrics('M00000004').status,'never');assert.equal(metrics('M00000005').status,'suspected');assert.equal(metrics('M00000006').status,'long');assert.equal(metrics('M00000007').status,'recent');assert.equal(metrics('M00000009').status,'error');assert.equal(metrics('M00000009').count,null);
const kiosk=summarizeActivity(d,o,{storeId:'M00000003',line:'Kiosk'},week);assert.equal(kiosk.boundDevices,5);assert.equal(kiosk.usedDevices,3);assert(metrics('M00000002').unknown!>0);
assert.equal(globalDeviceRows(d,o,week).filter(x=>x.metrics.status==='unconfigured').length,1);
for(const [alias,mid]of Object.entries(ACTIVITY_DEMO_STORE_MIDS)){assert.equal(resolveActivityStoreId(d,alias),mid);assert.equal(parseActivityScope('/m-platform/merchants/activity/store/'+alias,d)?.storeId,mid)}
assert.deepEqual(canonicalActivityContext(d,{kind:'store',id:'demo-all'}),{kind:'store',id:'M00000001'});
assert.equal(parseActivityScope('/m-platform/merchants/activity/context/brand/merchant-tea-one/store/demo-all',d),undefined,'alias cannot cross current brand boundary');
assert.equal(scopedActivityStores(d,{kind:'brand',id:'merchant-zhangji'}).length,2);
const renamed=structuredClone(rows);renamed[0]={merchantId:'new-owner',merchantName:'新品牌',store:{storeId:'M00000001',merchantId:'new-owner',name:'新门店名'}};const moved=createManagedActivityDemo(renamed,asOf);assert.equal(moved.stores.find(s=>s.id==='M00000001')?.name,'新门店名');assert.equal(scopedActivityStores(moved,{kind:'brand',id:'merchant-zhangji'}).length,1);assert.equal(scopedActivityStores(moved,{kind:'brand',id:'new-owner'}).length,1);assert.equal(resolveOrders(moved).length,o.length);
const removed=createManagedActivityDemo(rows.filter(r=>r.store.storeId!=='M00000002'),asOf);assert.equal(resolveActivityStoreId(removed,'demo-mixed'),undefined);assert(!removed.orders.some(x=>x.storeId==='M00000002'));assert(!removed.bindings.some(x=>x.storeId==='M00000002'));
assert.equal(createManagedActivityDemo([...rows,{merchantId:'custom',merchantName:'custom',store:{storeId:'custom',name:'custom'}}],asOf).stores.length,8,'unregistered stores stay empty');
assert.equal(createManagedActivityDemo([...rows,{merchantId:'conflict',merchantName:'conflict',store:{storeId:'M00000001',name:'conflict'}}],asOf).stores.length,7,'ambiguous MID owners fail closed');
assert.equal(createManagedActivityDemo([{merchantId:'a',merchantName:'a',store:{storeId:'M00000001',merchantId:'b',name:'x'}}],asOf).stores.length,0,'inconsistent ownership fails closed');
console.log('PASS managed demo identities: 9 fixtures -> 8 MIDs / 7 brands, four-period reconciliation, states, aliases, rename/ownership/removal and no input writes');
