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
assert(nodes.every(n=>n.key==="page:/stores/settings"));
assert(center.resources.has("setting:/stores/settings:418"));

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
