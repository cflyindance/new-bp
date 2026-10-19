import assert from "node:assert/strict";
import { NAV_MODULES } from "../src/config/navigation";
import { getModuleSettingsCatalog, getModuleSettingsItemHref } from "../src/config/module-settings-catalog";
import { storeInformationLegacyRedirect, storeInformationItemsForPage, storeInformationGateId } from "../src/config/store-information-navigation";
import { resolvePageSaveKey } from "../src/config/page-settings-draft";
import { buildPermissionModuleGroups } from "../src/config/permission-registry";
import { buildCenterCatalog } from "../src/permissions/center-catalog";
import { getSubscriptionRouteCatalog } from "../src/config/subscription-service-domain";

const module = NAV_MODULES.find(m=>m.id==="store-mgmt")!;
assert.equal(module.defaultChildPath,"/stores/profile");
assert.deepEqual(module.children.map(c=>[c.title,c.path]),[
  ["门店档案","/stores/profile"],["营业时间","/stores/hours"],["设置","/stores/settings"],
]);
const catalog = getModuleSettingsCatalog("/stores/profile")!;
assert.deepEqual(catalog.items.map(i=>i.seq).sort(),[417,418,433,582]);
for (const [path,seqs] of [["/stores/profile",[417,433]],["/stores/hours",[418]],["/stores/settings",[582]]] as const) {
  assert.equal(getModuleSettingsCatalog(path),catalog);
  assert.equal(resolvePageSaveKey(`${path}#item`),"/stores/settings");
  assert.deepEqual(storeInformationItemsForPage(path,catalog.items).map(i=>i.seq),seqs);
  for(const item of storeInformationItemsForPage(path,catalog.items)) assert.equal(getModuleSettingsItemHref(catalog.settingsPath,item),`${path}#${item.id}`);
}
for(const [old,target] of [["/stores","/stores/profile"],["/store/basic","/stores/profile"],["/store/business-hours","/stores/hours"],["/stores/settings/store-hours-operation","/stores/hours"],["/stores/settings/brand-identity-assets","/stores/profile#s433-brand-identity-assets-餐厅LOGO"]]) {
  assert.equal(storeInformationLegacyRedirect(old,`#${old}`),target);
}
const closing=catalog.items.find(i=>i.seq===582)!;
assert.equal(storeInformationLegacyRedirect(`/stores/settings/store-hours-operation#${closing.id}`,`#/stores/settings/store-hours-operation#${closing.id}`),`/stores/settings#${closing.id}`);
assert.equal(storeInformationLegacyRedirect("/stores/profile","#/stores/profile"),undefined);
const permission=buildPermissionModuleGroups().find(m=>m.moduleId==="store-mgmt")!;
assert.deepEqual(permission.tree.children.map(c=>c.resource.key),["store-mgmt:st-settings"]);
assert.equal(storeInformationGateId("st-profile"),"st-settings");
assert.equal(storeInformationGateId("st-hours"),"st-settings");
assert.deepEqual(getSubscriptionRouteCatalog().filter(r=>r.moduleId==="store-mgmt").map(r=>r.id),["st-settings"]);
const center=buildCenterCatalog();
const nodes=center.tree.find(m=>m.id==="store-mgmt")!.children;
assert.deepEqual(nodes.map(n=>[n.title,n.key]),module.children.map(c=>[c.title,`page:${c.path}`]));
assert(center.resources.has("setting:/stores/settings:418"));
for(const [path,seqs] of [["/stores/profile",[417,433]],["/stores/hours",[418]],["/stores/settings",[582]]] as const) {
  const keys=center.groups.get(`page:${path}`)!.flatMap(g=>g.keys).flatMap(k=>[k,...center.resources.get(k)!.relatedGrantKeys??[]]);
  assert.deepEqual(keys.map(k=>center.resources.get(k)!.seq).sort(),[...seqs].sort());
  for(const key of keys)assert.equal(center.resources.get(key)!.parent,`page:${path}`);
}
const {roleAccess}=await import('../src/permissions/center-domain');
const {renderPermissionEditor}=await import('../src/permissions/center-editor');
const grants:Record<string,'hidden'|'read'|'edit'>={'module:store-mgmt':'read','page:/stores/profile':'read','page:/stores/hours':'hidden','page:/stores/settings':'read','setting:/stores/settings:417':'edit','setting:/stores/settings:418':'edit'};
const role={id:'test',name:'test',description:'',system:false,grants};
grants['setting:/stores/settings:433']='edit';
const value=(k:string)=>roleAccess(role,k,center.resources);
assert.equal(value('setting:/stores/settings:417'),'edit');
assert.equal(value('setting:/stores/settings:418'),'hidden');
const html=renderPermissionEditor({catalog:center,page:'page:/stores/profile',group:'',preview:true,readonly:false,staff:false,value,own:k=>grants[k]??'hidden',search:'门店信息'});
assert.match(html,/data-page="page:\/stores\/profile"/);
assert.doesNotMatch(html,/data-page="page:\/stores\/hours"|门店档案、营业时间与设置/);
grants['module:store-mgmt']='hidden';
assert.equal(value('setting:/stores/settings:417'),'hidden');
assert.equal(grants['setting:/stores/settings:417'],'edit');
delete grants['page:/stores/profile'];grants['module:store-mgmt']='read';
assert.equal(value('setting:/stores/settings:417'),'hidden','Missing new page grant must not expand existing access');
grants['page:/stores/profile']='read';grants['page:/stores/hours']='read';
const {resolveAccess}=await import('../src/permissions/center-domain');
const stores=[{id:'a',title:'A',brand:'b',region:'e'},{id:'b',title:'B',brand:'b',region:'e'}];
const state={schema:1 as const,navigationVersion:1 as const,version:0,logs:[],roles:[role],employees:[{id:'e',name:'test',email:'test@example.com',status:'enabled' as const,bindings:[{id:'binding',roleId:'test',scope:{mode:'stores' as const,ids:['a','b']}}],overrides:{a:{'page:/stores/profile':'hidden' as const}}}]};
assert.equal(resolveAccess(state,'e','a','setting:/stores/settings:417',stores,center.resources),'hidden');
assert.equal(resolveAccess(state,'e','b','setting:/stores/settings:417',stores,center.resources),'edit');
assert.equal(resolveAccess(state,'e','a','setting:/stores/settings:418',stores,center.resources),'edit');
for(const readonly of [false,true]) {
  const editor=renderPermissionEditor({catalog:center,page:'page:/stores/profile',group:'',preview:false,readonly,staff:true,value,own:k=>grants[k]??'inherit',search:'门店信息'});
  for(const path of ['/stores/profile','/stores/hours','/stores/settings'])assert(editor.includes(`data-page="page:${path}"`));
  assert.doesNotMatch(editor,/门店档案、营业时间与设置/);
}
const profileGroups=center.groups.get('page:/stores/profile')!;
for(const path of ['/stores/profile','/stores/hours','/stores/settings'])for(const preview of [false,true])for(const readonly of [false,true]) {
  const html=renderPermissionEditor({catalog:center,page:`page:${path}`,group:'obsolete-group',preview,readonly,staff:true,value:()=> 'read',own:()=> 'read',search:''});
  assert.match(html,/<nav class="pc-categories"/,'Settings retain page/category/item levels, including single-item pages');
  assert.match(html,/data-scroll="settings"/);
  assert.match(html,/功能设置项/);
  for(const key of center.groups.get(`page:${path}`)!.flatMap(g=>g.keys))assert(html.includes(center.resources.get(key)!.title));
}
const foh=renderPermissionEditor({catalog:center,page:'page:/operations/queue-call/settings',group:'',preview:false,readonly:false,staff:false,value:()=> 'read',own:()=> 'read',search:''});
assert.match(foh,/<nav class="pc-categories"/,'Other multi-category pages retain navigation');
assert.equal(profileGroups.length,1);
assert.equal(profileGroups[0].title,'门店档案');
assert.deepEqual(profileGroups[0].keys,['setting:/stores/settings:417']);
const {applyResourceGrant,resourceOwn}=await import('../src/permissions/center-employee-pages');
const profileResource=center.resources.get('setting:/stores/settings:417')!;
grants['setting:/stores/settings:433']='hidden';
assert.equal(resourceOwn(profileResource,k=>grants[k]??'hidden'),'mixed');
assert.equal(value(profileResource.key),'hidden');
applyResourceGrant(grants,profileResource,'read');
assert.equal(grants['setting:/stores/settings:433'],'read');
assert.equal(value(profileResource.key),'read');
applyResourceGrant(grants,profileResource,'edit');
assert.equal(grants['setting:/stores/settings:433'],'edit');
assert.equal(value(profileResource.key),'edit');
applyResourceGrant(grants,profileResource,'inherit');
assert.equal(grants['setting:/stores/settings:417'],undefined);
assert.equal(grants['setting:/stores/settings:433'],undefined);

const memory=new Map<string,string>();
const storage={getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)};
const location={hash:"#/stores/profile"};
Object.assign(globalThis,{localStorage:storage,location,window:Object.assign(new EventTarget(),{location,localStorage:storage})});
const {readAppHashPath}=await import("../src/config/app-routes");
location.hash="#/stores/settings#s582-example";
assert.equal(readAppHashPath(),"/stores/settings");
location.hash="#/stores/profile";
const {initPageSaveSession,readPageDraftField,discardPageDraft}=await import("../src/config/page-settings-draft");
const {writeModuleSettingText}=await import("../src/config/module-settings-form-ui");
const {buildHubSearchIndex}=await import("../src/config/hub-sheet-search");
initPageSaveSession("/stores/settings");
writeModuleSettingText("417-website","https://example.com");
location.hash="#/stores/hours";
assert.equal(readPageDraftField(resolvePageSaveKey("/stores/hours"),"417-website"),"https://example.com");
assert.equal(memory.get("bplant-module-setting-field:417-website"),undefined);
discardPageDraft("/stores/settings");
assert.equal(readPageDraftField("/stores/settings","417-website"),undefined);
for(const entry of buildHubSearchIndex("store-mgmt")!.entries.filter(e=>e.kind==="setting")) {
  const item=catalog.items.find(i=>i.seq===entry.seq)!;
  assert.equal(entry.navPath,getModuleSettingsItemHref(catalog.settingsPath,item).split("#")[0]);
  assert.equal(entry.sheetNavPath,entry.navPath);
}
console.log("PASS store information: page scope, legacy anchors, existing permission gates, shared drafts, search destinations");
