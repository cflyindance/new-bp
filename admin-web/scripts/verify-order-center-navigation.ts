import assert from 'node:assert/strict';
import { NAV_MODULES } from '../src/config/navigation';
import { getModuleSettingsCatalog, getModuleSettingsItemHref, groupCatalogItemsByCategory } from '../src/config/module-settings-catalog';
import { orderCenterViewGroups, orderPresetSeq, orderCenterLegacyRedirect, orderCenterGateId } from '../src/config/order-center-navigation';
import { resolvePageSaveKey } from '../src/config/page-settings-draft';
import { buildPermissionModuleGroups } from '../src/config/permission-registry';
import { buildCenterCatalog } from '../src/permissions/center-catalog';
import { getSubscriptionRouteCatalog } from '../src/config/subscription-service-domain';
import { l2PresetKey } from '../src/config/platform-preset-nav-filter';

const module = NAV_MODULES.find(m=>m.id==='orders')!;
assert.deepEqual(module.children.map(c=>[c.title,c.path]),[
 ['订单列表','/orders/all'],['折扣管理','/orders/discounts'],['附加费与服务费','/orders/surcharges'],['设置','/orders/settings'],
]);
const catalog = getModuleSettingsCatalog('/orders/settings')!;
const original = groupCatalogItemsByCategory(catalog.items,catalog.groupOrder);
const settings = orderCenterViewGroups(original,'/orders/settings');
assert.deepEqual(settings.map(g=>[g.groupTitle,g.items.length]),[['订单基础与单号',6],['改单与分合单',6],['删单与退款',4],['金额与结算',5]]);
assert.deepEqual(settings.flatMap(g=>g.items).map(i=>i.seq).sort((a,b)=>a-b),catalog.items.filter(i=>i.seq!==446&&i.seq!==447).map(i=>i.seq).sort((a,b)=>a-b));
for(const [path,seq] of [['/orders/discounts',446],['/orders/surcharges',447]] as const){
 assert.equal(orderPresetSeq(path),seq);
 assert.equal(getModuleSettingsCatalog(path),catalog);
 assert.equal(resolvePageSaveKey(path),'/orders/settings');
 assert.deepEqual(orderCenterViewGroups(original,path).flatMap(g=>g.items).map(i=>i.seq),[seq]);
 assert.equal(orderCenterViewGroups(original.map(g=>({...g,items:g.items.filter(i=>i.seq!==seq)})),path).length,0,'denied item must not reappear');
 const item=catalog.items.find(i=>i.seq===seq)!;
 assert.equal(getModuleSettingsItemHref(catalog.settingsPath,item),`${path}#${item.id}`);
 assert.equal(orderCenterLegacyRedirect(`/orders/settings/${item.groupKey}`,`#/orders/settings/${item.groupKey}#${item.id}`),`${path}#${item.id}`);
 assert.equal(orderCenterLegacyRedirect(`/orders/settings/${item.groupKey}/s${seq}`,''),path);
}
assert.equal(orderCenterLegacyRedirect('/orders/settings/order-discount/s162',''),'/orders/settings/order-pricing/s162');
assert.equal(orderCenterLegacyRedirect('/orders/settings/order-settlement',''),'/orders/settings/order-pricing');
for(const id of ['orders-discounts','orders-surcharges']){
 assert.equal(orderCenterGateId(id),'orders-settings');
 assert.equal(l2PresetKey('orders',id),'orders:orders-settings');
}
assert.deepEqual(buildPermissionModuleGroups().find(m=>m.moduleId==='orders')!.tree.children.map(n=>n.resource.key),['orders:orders-list','orders:orders-settings']);
assert.deepEqual(getSubscriptionRouteCatalog().filter(n=>n.moduleId==='orders').map(n=>n.id),['orders-list','orders-settings']);
const center=buildCenterCatalog();
assert(!center.resources.has('page:/orders/discounts'));
assert(center.resources.has('setting:/orders/settings:446'));
const memory=new Map<string,string>();
const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)};
const location={hash:'#/orders/discounts'};
Object.assign(globalThis,{localStorage:storage,location,window:Object.assign(new EventTarget(),{location,localStorage:storage})});
const {readAppHashPath}=await import('../src/config/app-routes');
location.hash='#/orders/discounts#s446-example';
assert.equal(readAppHashPath(),'/orders/discounts');
const {initPageSaveSession,readPageDraftField,discardPageDraft}=await import('../src/config/page-settings-draft');
const {writeModuleSettingText}=await import('../src/config/module-settings-form-ui');
initPageSaveSession('/orders/settings');
writeModuleSettingText('446-discount-presets','[]');
assert.equal(readPageDraftField(resolvePageSaveKey('/orders/surcharges'),'446-discount-presets'),'[]');
assert.equal(memory.get('bplant-module-setting-field:446-discount-presets'),undefined);
discardPageDraft('/orders/settings');
assert.equal(readPageDraftField('/orders/settings','446-discount-presets'),undefined);
const {buildHubSearchIndex}=await import('../src/config/hub-sheet-search');
for(const entry of buildHubSearchIndex('orders')!.entries.filter(e=>e.kind==='setting')){
 const item=catalog.items.find(i=>i.seq===entry.seq)!;
 assert.equal(entry.navPath,getModuleSettingsItemHref(catalog.settingsPath,item).split('#')[0]);
}
console.log('PASS orders: 23 unique items, four setting groups, preset lists, inherited gates, shared drafts, legacy bookmarks and search');

Object.assign(globalThis,{sessionStorage:storage});
const {writePlatformPresetContext}=await import('../src/config/platform-preset-context');
const {getRuntimePresetSelection}=await import('../src/config/platform-preset-runtime-cache');
const {isModuleSettingsPathAllowedByPreset}=await import('../src/config/platform-preset-settings-filter');
writePlatformPresetContext({businessTypeIds:[],productLineIds:[],combos:[],presetVersion:0,appliedAt:'orders-test'});
const selection=getRuntimePresetSelection()!;
Object.assign(selection,{
 'orders':{enabled:true},'orders:orders-settings':{enabled:true},
 'orders:orders-settings:order-discount':{enabled:true},
 'orders:orders-settings:order-discount:s446':{enabled:false},
 'orders:orders-settings:order-surcharge-fees':{enabled:true},
 'orders:orders-settings:order-surcharge-fees:s447':{enabled:true},
});
assert.equal(isModuleSettingsPathAllowedByPreset('/orders/discounts',catalog),false);
assert.equal(isModuleSettingsPathAllowedByPreset('/orders/surcharges',catalog),true);
selection['orders:orders-settings'].enabled=false;
assert.equal(isModuleSettingsPathAllowedByPreset('/orders/surcharges',catalog),false);
writePlatformPresetContext(null);
console.log('PASS active preset: disabled original L4 and L2 deny new management routes');
