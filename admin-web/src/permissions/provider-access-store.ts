import {permissionDemoAccounts} from './permission-demo-identities';
import {listStaffLoginAccounts} from './enterprise-staff-account-store';
import { currentMAccount, currentMAccess, requireMAction } from './m-platform-store';
import { mActionKey, mPageKey } from './m-platform-catalog';
import { getEnterpriseMerchantSnapshotForAuthorization } from '../config/enterprise-merchant-store';
import { readActiveEnterpriseId, DEFAULT_ENTERPRISE_ID } from '../config/enterprise-merchant-enterprise-context';
import { buildCenterCatalog } from './center-catalog';
import { rank, type Access, type Resource } from './center-domain';
import { installProviderAccessRuntime } from '../auth/provider-access-runtime';
import { providerCanTarget, providerRoleAccess, validateProviderState, type ProviderAccessState, type ProviderTarget } from './provider-access-domain';
import { providerStateFromStorage } from './provider-access-demo';
export const PROVIDER_ACCESS_KEY='menusifu:provider-merchant-access:v1';
export const PROVIDER_ACCESS_EVENT='menusifu:provider-access-changed';
let cachedStateRaw:string|null|undefined,cachedState:ProviderAccessState|undefined;
let directoryTick:ReturnType<typeof getEnterpriseMerchantSnapshotForAuthorization>|undefined;
function directory(){if(!directoryTick){directoryTick=getEnterpriseMerchantSnapshotForAuthorization();queueMicrotask(()=>{directoryTick=undefined;});}return directoryTick;}
window.addEventListener('menusifu:enterprise-merchant-snapshot-changed',()=>{directoryTick=undefined;});
function runtimeState():ProviderAccessState {
  const raw=localStorage.getItem(PROVIDER_ACCESS_KEY);
  if(raw===cachedStateRaw&&cachedState)return cachedState;
  const state:ProviderAccessState=providerStateFromStorage(raw,()=>buildCenterCatalog().resources,()=>{
    const snapshot=directory(),brands=snapshot.merchants.filter(m=>m.enterpriseId===DEFAULT_ENTERPRISE_ID).sort((a,b)=>(a.bid??a.merchantId).localeCompare(b.bid??b.merchantId));
    const brandIds=brands.map(m=>m.merchantId);
    return {brandIds,storeIds:snapshot.stores.filter(s=>brandIds.includes(s.merchantId)).sort((a,b)=>a.storeId.localeCompare(b.storeId)).map(s=>s.storeId),employees:permissionDemoAccounts(listStaffLoginAccounts()).filter(a=>a.enabled||a.employeeId==='demo-permission-disabled').map(a=>({id:a.employeeId,name:a.employeeName}))};
  });
  validateProviderState(state);cachedStateRaw=raw;cachedState=state;return state;
}
export function readProviderState():ProviderAccessState{return structuredClone(runtimeState());}
export function providerTargetExists(target:ProviderTarget):boolean {
  const snapshot=directory(),brand=snapshot.merchants.find(m=>m.merchantId===target.brandId);
  return !!brand&&brand.enterpriseId===readActiveEnterpriseId()&&(!target.storeId||snapshot.stores.some(s=>s.storeId===target.storeId&&s.merchantId===brand.merchantId));
}
export function currentProviderCanTarget(brandId:string,storeId?:string):boolean {
  try{const a=currentMAccount(),t={brandId,storeId};return !!a?.enabled&&providerTargetExists(t)&&providerCanTarget(runtimeState(),a.employeeId,t);}catch{return false;}
}
export function currentProviderBrandListed(brandId:string):boolean {
  if(currentProviderCanTarget(brandId))return true;
  return directory().stores.some(s=>s.merchantId===brandId&&currentProviderCanTarget(brandId,s.storeId));
}
export function currentProviderAccess(brandId:string,storeId:string|undefined,key:string,resources:Map<string,Resource>):Access {
  try{const a=currentMAccount();return a?.enabled&&currentProviderCanTarget(brandId,storeId)?providerRoleAccess(runtimeState(),a.employeeId,{brandId,storeId},key,resources):'hidden';}catch{return 'hidden';}
}
export function canProviderEnter(brandId:string,storeId?:string):boolean {
  const page=storeId?'stores':'brands';
  return currentMAccess(mPageKey(page))!=='hidden'&&currentMAccess(mActionKey(page,'impersonate'))==='edit'&&currentProviderCanTarget(brandId,storeId);
}
export function saveProviderState(next:ProviderAccessState,expected:number,object:string,action:string):ProviderAccessState {
  requireMAction('provider-roles','manage');
  const before=readProviderState(),actor=currentMAccount();if(!actor?.enabled)throw Error('账号已停用或未登录。');
  if(before.revision!==expected||next.revision!==expected)throw Error('授权已被其他窗口修改，请保留草稿并重新打开。');
  validateProviderState(next);
  const accounts=new Set(listStaffLoginAccounts().map(a=>a.employeeId));
  if(next.employees.some(e=>!accounts.has(e.employeeId)&&!before.employees.some(old=>old.employeeId===e.employeeId)))throw Error('授权员工不存在，请重新打开员工列表。');
  if(JSON.stringify(next.systemEmployeeIds)!==JSON.stringify(before.systemEmployeeIds))throw Error('系统兼容授权不可修改或复制。');
  const resources=buildCenterCatalog().resources;
  const system=before.systemEmployeeIds.includes(actor.employeeId);
  for(const old of before.roles)if(!next.roles.some(r=>r.id===old.id)&&next.employees.some(e=>e.bindings.some(b=>b.roleId===old.id)))throw Error('请先解除员工绑定，再删除访问角色。');
  // Scope and role ceiling checks cover both new bindings and edited role grants.
  for(const employee of next.employees)for(const binding of employee.bindings){
    const role=next.roles.find(r=>r.id===binding.roleId)!;
    const prior=before.employees.find(e=>e.employeeId===employee.employeeId)?.bindings.find(b=>b.id===binding.id);
    const oldRole=before.roles.find(r=>r.id===binding.roleId);
    if(JSON.stringify(prior)===JSON.stringify(binding)&&JSON.stringify(oldRole)===JSON.stringify(role))continue;
    for(const id of binding.scope.ids){
      const snapshot=directory();
      const brandId=binding.scope.mode==='brands'?id:snapshot.stores.find(s=>s.storeId===id)?.merchantId;
      const target={brandId:brandId??'',storeId:binding.scope.mode==='stores'?id:undefined};
      if(!providerTargetExists(target)||!currentProviderCanTarget(target.brandId,target.storeId))throw Error('不能授予超出自己范围的品牌／门店。');
      for(const [key,value]of Object.entries(role.grants))if(resources.has(key)&&rank[value]>rank[currentProviderAccess(target.brandId,target.storeId,key,resources)])throw Error('不能授予超出自己权限的商家菜单或操作。');
    }
  }
  if(!system)for(const role of next.roles){
    const old=before.roles.find(r=>r.id===role.id);
    for(const [key,value]of Object.entries(role.grants)){
      if(old?.grants[key]===value||value==='hidden')continue;
      if(!resources.has(key))throw Error('不能新增失效的菜单权限。');
      const scopes=before.employees.find(e=>e.employeeId===actor.employeeId)?.bindings??[];
      if(!scopes.some(b=>b.scope.ids.some(id=>{
        const brand=b.scope.mode==='brands'?id:getEnterpriseMerchantSnapshotForAuthorization().stores.find(s=>s.storeId===id)?.merchantId;
        return !!brand&&rank[currentProviderAccess(brand,b.scope.mode==='stores'?id:undefined,key,resources)]>=rank[value];
      })))throw Error('不能配置超出自己权限的访问角色。');
    }
  }
  for(const role of next.roles)for(const [key,value]of Object.entries(role.grants)){
    const resource=resources.get(key);if(!resource){if(before.roles.find(r=>r.id===role.id)?.grants[key]!==value)throw Error('不能新增不属于当前菜单目录的权限。');continue;}
    if(resource.type==='action'&&value==='read'||!['action','setting'].includes(resource.type)&&value==='edit')throw Error('菜单权限值与资源类型不匹配。');
  }
  const saved=structuredClone(next);saved.revision=before.revision+1;
  saved.logs=[{id:crypto.randomUUID(),at:new Date().toISOString(),actor:actor.loginEmail,object,action,before:JSON.stringify({roles:before.roles,employees:before.employees}),after:JSON.stringify({roles:next.roles,employees:next.employees})},...before.logs];
  localStorage.setItem(PROVIDER_ACCESS_KEY,JSON.stringify(saved));
  window.dispatchEvent(new Event(PROVIDER_ACCESS_EVENT));return saved;
}
installProviderAccessRuntime({active:()=>!!currentMAccount()?.enabled,canTarget:currentProviderCanTarget,canListBrand:currentProviderBrandListed,access:currentProviderAccess});
