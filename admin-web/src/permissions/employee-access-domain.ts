import { providerRoleAccess, type ProviderAccessState, type ProviderTarget } from './provider-access-domain';
import type { Access,Resource } from './center-domain';

export function employeeAccessRoute(path:string):{id:string;preview:boolean}|undefined {
  const match=/^\/m-platform\/permissions\/staff\/([^/]+)(?:\/(roles(?:\/preview)?|merchant-access))?$/.exec(path.split('?')[0]);
  if(!match)return;
  try{return {id:decodeURIComponent(match[1]),preview:!match[2]||match[2]==='roles/preview'};}catch{return;}
}
export function providerEmployeeSummary(state:ProviderAccessState,id:string):string {
  if(state.systemEmployeeIds.includes(id))return '系统管理员 · 全部品牌／门店';
  const bindings=state.employees.find(e=>e.employeeId===id)?.bindings??[];
  return bindings.map(b=>`${state.roles.find(r=>r.id===b.roleId)?.name??'失效角色'} · ${b.scope.ids.length} ${b.scope.mode==='brands'?'个品牌':'家门店'}`).join('；')||'未配置';
}

/** Employee grants and both menu ceilings must allow the selected target. */
export function employeeMerchantPreviewAccess(state:ProviderAccessState,id:string,target:ProviderTarget,key:string,resources:Map<string,Resource>,brandCeiling:Set<string>,storeCeiling:Set<string>|undefined,enabled:boolean):Access {
  if(!enabled||!brandCeiling.has(key)||storeCeiling&&!storeCeiling.has(key))return 'hidden';
  return providerRoleAccess(state,id,target,key,resources);
}
