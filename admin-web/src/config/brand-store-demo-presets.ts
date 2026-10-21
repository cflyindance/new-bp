import type {EnterpriseMerchantSnapshot,EnterpriseMerchant} from './enterprise-merchant-types';
import type {BrandAccessState} from './brand-access-domain';
import {brandMenuChoices} from './brand-menu-choices';
import {brandStorePerspectiveCeiling} from './enterprise-merchant-services';
function demoIds(){return ['merchant-zhangji','merchant-tea-one','merchant-menusifu-na'];}
export const DEMO_PRESET_AT='2026-10-21T00:00:00.000Z';
/** Only first-party fixtures, never user-created brands. Existing component snapshots win. */
export function fillBrandStoreDemoPresets(snap:EnterpriseMerchantSnapshot,fresh=false):boolean{
 if(snap.brandStoreDemoVersion===1)return false;
 const existingActions=new Set(snap.changelog.filter(l=>l.storeId).map(l=>l.storeId));
 snap.storeCapabilities??=[];
 for(const id of demoIds()){
  const merchant=snap.merchants.find(m=>m.merchantId===id),cap=snap.capabilities.find(c=>c.merchantId===id);if(!merchant||!cap)continue;
  if(fresh&&cap.menuGrantMode!=="explicit"&&!snap.changelog.some(l=>l.merchantId===id&&(l.action==="brand.menu.update"||l.action==="capability.update"))){
   // Keep the third fixture pending activation; no status migration on existing browsers.
   const choices=brandMenuChoices(cap.productLineIds);
   cap.menuGrantMode='explicit';cap.services=choices.map(c=>({serviceId:c.key,nodeKey:c.key,enabled:true,storeScope:'all'}));
  }
  const ceiling=[...brandStorePerspectiveCeiling(cap)],choices=brandMenuChoices(cap.productLineIds),map=new Map(choices.map(c=>[c.key,c]));
  // An independent fixture with a complete small subtree, including all ancestors.
  const selected=new Set<string>();
  const page=choices.find(c=>c.isPage&&ceiling.includes(c.key)&&c.path?.startsWith('/orders/'))??choices.find(c=>c.isPage&&ceiling.includes(c.key));
  if(page){let current:typeof page|undefined=page;while(current&&!selected.has(current.key)){selected.add(current.key);current=current.parent?map.get(current.parent):undefined;}}
  const stores=snap.stores.filter(s=>s.merchantId===id&&['M00000001','M00000002','M00000003','M00000004'].includes(s.storeId));
  for(const store of stores){
   if(snap.storeCapabilities.some(c=>c.storeId===store.storeId)||existingActions.has(store.storeId))continue;
   const independent=id==='merchant-zhangji'&&store.code==='gz-tzh';
   snap.storeCapabilities.push({storeId:store.storeId,merchantId:id,menuMode:independent?'independent':'inherit',enabledKeys:independent?[...selected].filter(k=>ceiling.includes(k)):[],updatedAt:DEMO_PRESET_AT,updatedBy:'演示预设'});
  }
 }
 snap.brandStoreDemoVersion=1;return true;
}
export function demoBrandAccess(merchant:EnterpriseMerchant,password:string):BrandAccessState|undefined{
 const emails:Record<string,string>={'merchant-zhangji':'zhangji.admin@menusifu.cn','merchant-tea-one':'tea.one@menusifu.cn','merchant-menusifu-na':'na.demo@menusifu.cn'};
 if(!demoIds().includes(merchant.merchantId)||merchant.accountProvisioningRequired||merchant.primaryAdminEmail!==emails[merchant.merchantId])return undefined;
 return {schema:1,employeeAuthorization:'roles-only',merchantId:merchant.merchantId,version:0,accounts:[{id:'demo-admin:'+merchant.merchantId,name:merchant.contactName??'演示品牌管理员',email:merchant.primaryAdminEmail,enabled:true,admin:true,password,createdAt:"2026-10-21T00:00:00.000Z"}],roles:[],employees:[],logs:[]};
}
