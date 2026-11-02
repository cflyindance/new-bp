import { resolveAccess, type Access, type Role, type Resource, type Store, type CenterState } from './center-domain';
export interface ProviderScope { mode:'brands'|'stores'; ids:string[] }
export interface ProviderBinding { id:string; roleId:string; scope:ProviderScope }
export interface ProviderEmployee { employeeId:string; bindings:ProviderBinding[] }
export interface ProviderAudit { id:string; at:string; actor:string; object:string; action:string; before:string; after:string }
export interface ProviderAccessState { schema:1; revision:number; systemEmployeeIds:string[]; roles:Role[]; employees:ProviderEmployee[]; logs:ProviderAudit[] }
export interface ProviderTarget { brandId:string; storeId?:string }
export const providerBindingMatches=(scope:ProviderScope,target:ProviderTarget):boolean=>scope.mode==='brands'?scope.ids.includes(target.brandId):!!target.storeId&&scope.ids.includes(target.storeId);
export function providerCanTarget(state:ProviderAccessState,id:string,target:ProviderTarget):boolean {
  if(!id||!target.brandId)return false;
  if(state.systemEmployeeIds.includes(id))return true;
  return !!state.employees.find(e=>e.employeeId===id)?.bindings.some(b=>state.roles.some(r=>r.id===b.roleId)&&providerBindingMatches(b.scope,target));
}
export function providerCenterState(state:ProviderAccessState,id:string,target:ProviderTarget):CenterState {
  const bindings=state.employees.find(e=>e.employeeId===id)?.bindings.filter(b=>providerBindingMatches(b.scope,target))??[];
  return {schema:1,version:state.revision,employeeAuthorization:'roles-only',roles:state.roles,logs:[],employees:[{id,name:id,email:'',status:'enabled',overrides:{},bindings:bindings.map(b=>({...b,scope:{mode:'stores' as const,ids:[target.storeId??'provider-brand:'+target.brandId]}}))}]};
}
export function providerRoleAccess(state:ProviderAccessState,id:string,target:ProviderTarget,key:string,resources:Map<string,Resource>):Access {
  if(!resources.has(key)||!providerCanTarget(state,id,target))return 'hidden';
  const resource=resources.get(key)!;
  if(state.systemEmployeeIds.includes(id))return resource.type==='action'||resource.type==='setting'?'edit':'read';
  const store:Store={id:target.storeId??'provider-brand:'+target.brandId,brand:target.brandId,region:'',title:''};
  return resolveAccess(providerCenterState(state,id,target),id,store.id,key,[store],resources);
}
export function validateProviderState(state:ProviderAccessState):void {
  if(state?.schema!==1||!Number.isInteger(state.revision)||state.revision<0||!Array.isArray(state.systemEmployeeIds)||!Array.isArray(state.roles)||!Array.isArray(state.employees)||!Array.isArray(state.logs))throw Error('商户访问授权数据无法读取，请保留原数据并联系管理员。');
  const unique=(ids:string[])=>ids.every(id=>typeof id==='string'&&!!id)&&new Set(ids).size===ids.length;
  if(!unique(state.roles.map(r=>r.id))||!unique(state.employees.map(e=>e.employeeId))||!unique(state.systemEmployeeIds))throw Error('商户访问授权标识重复或无效。');
  const names=new Set<string>();
  for(const r of state.roles){
    if(typeof r.name!=='string'||!r.name.trim()||r.name.trim().length>30||typeof r.description!=='string'||r.description.length>160||!r.grants||typeof r.grants!=='object'||Array.isArray(r.grants))throw Error('访问角色名称必填且最多30字，描述最多160字。');
    const name=r.name.trim().toLocaleLowerCase();if(names.has(name))throw Error('访问角色名称重复。');names.add(name);
    if(Object.values(r.grants).some(v=>!['hidden','read','edit'].includes(v)))throw Error('访问角色权限值无效。');
  }
  for(const e of state.employees){
    if(!Array.isArray(e.bindings)||!unique(e.bindings.map(b=>b.id)))throw Error('商户访问绑定无效。');
    for(const b of e.bindings)if(!state.roles.some(r=>r.id===b.roleId)||!b.scope||!['brands','stores'].includes(b.scope.mode)||!Array.isArray(b.scope.ids)||!b.scope.ids.length||!unique(b.scope.ids))throw Error('请选择有效的访问角色及品牌／门店范围。');
  }
}
