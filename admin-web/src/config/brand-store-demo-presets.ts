import type {EnterpriseMerchantSnapshot,EnterpriseMerchant} from './enterprise-merchant-types';
import type {BrandAccessState,BrandAccount} from './brand-access-domain';
import {brandMenuChoices} from './brand-menu-choices';
import {brandStorePerspectiveCeiling} from './enterprise-merchant-services';
function demoIds(){return ['merchant-zhangji','merchant-tea-one','merchant-menusifu-na'];}
export const DEMO_PRESET_AT='2026-10-21T00:00:00.000Z';
function isAdminScenarioBrand(merchant:EnterpriseMerchant):boolean {
 return merchant.merchantId==='merchant-zhangji'&&!merchant.accountProvisioningRequired&&merchant.primaryAdminEmail==='zhangji.admin@menusifu.cn';
}

export function demoPendingAdminInvitation(merchant:EnterpriseMerchant,accounts:BrandAccount[]):BrandAccount|undefined {
 if(!isAdminScenarioBrand(merchant))return;
 const now=Date.now();
 if(accounts.some(account=>account.id.startsWith('demo-admin-scenario:')&&account.invitation&&
    !account.invitation.revoked&&Date.parse(account.invitation.expiresAt)>now))return;
 const id='demo-admin-scenario:pending-extra',email='zhangji.admin.demo.pending-extra@menusifu.cn';
 if(accounts.some(account=>account.id===id||account.email.toLowerCase()===email))return;
 return {id,name:'沈佳宁',email,enabled:false,admin:true,password:'',openedVia:'email',
  invitation:{sentAt:new Date(now).toISOString(),expiresAt:new Date(now+72*60*60*1000).toISOString()}};
}

export function demoEmailOpenedAdmins(merchant:EnterpriseMerchant,password:string):BrandAccount[]{
 if(!isAdminScenarioBrand(merchant))return [];
 return [
  {id:'demo-admin-scenario:email-enabled',name:'梁思敏',email:'zhangji.admin.demo.email-enabled@menusifu.cn',enabled:true,admin:true,password,openedVia:'email',createdAt:DEMO_PRESET_AT},
  {id:'demo-admin-scenario:email-disabled',name:'赵宇航',email:'zhangji.admin.demo.email-disabled@menusifu.cn',enabled:false,admin:true,password,openedVia:'email',createdAt:DEMO_PRESET_AT},
 ];
}
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
 const accounts:BrandAccount[]=[{id:'demo-admin:'+merchant.merchantId,name:merchant.contactName??'演示品牌管理员',email:merchant.primaryAdminEmail,enabled:true,admin:true,password,openedVia:'password',createdAt:DEMO_PRESET_AT}];
 if(merchant.merchantId==='merchant-zhangji'){
  const hour=60*60*1000,now=Date.now();
  const invitation=(sentHoursAgo:number,revoked=false)=>({
   sentAt:new Date(now-sentHoursAgo*hour).toISOString(),
   expiresAt:new Date(now+(72-sentHoursAgo)*hour).toISOString(),
   ...(revoked?{revoked:true}:{}),
  });
  accounts.push(
   {id:'demo-admin-scenario:disabled',name:'周倩',email:'zhangji.admin.demo.disabled@menusifu.cn',enabled:false,admin:true,password,openedVia:'password',createdAt:DEMO_PRESET_AT},
   {id:'demo-admin-scenario:pending',name:'陈嘉宁',email:'zhangji.admin.demo.pending@menusifu.cn',enabled:false,admin:true,password:'',invitation:invitation(12)},
   {id:'demo-admin-scenario:expired',name:'许明远',email:'zhangji.admin.demo.expired@menusifu.cn',enabled:false,admin:true,password:'',invitation:invitation(96)},
   {id:'demo-admin-scenario:revoked',name:'林晓芸',email:'zhangji.admin.demo.revoked@menusifu.cn',enabled:false,admin:true,password:'',invitation:invitation(36,true)},
   ...demoEmailOpenedAdmins(merchant,password),
  );
 }
 return {schema:1,employeeAuthorization:'roles-only',merchantId:merchant.merchantId,version:0,accounts,roles:[],employees:[],logs:[]};
}
