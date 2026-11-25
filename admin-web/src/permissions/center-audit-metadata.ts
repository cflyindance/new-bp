import { accountExtraStoreIds, roleBindingScope, scopeMatches, type Audit, type AuditAccount, type AuditStoreChange, type CenterState, type Employee, type Role, type Store } from './center-domain';

export function describeAuditStoreChange(change:AuditStoreChange):string {
  if(!change.before.length)return '新增可访问门店';
  if(!change.after.length)return '移除可访问门店';
  return '授权来源变化，门店仍可访问';
}

function storeSources(employee:Employee|undefined,roles:Role[],store:Store):string[] {
  if(!employee)return [];
  const sources=roles.filter(role=>employee.bindings.some(binding=>
    binding.roleId===role.id&&scopeMatches(roleBindingScope(binding,role),store)
  )).map(role=>`角色授权 · ${role.name}`);
  if(accountExtraStoreIds(employee).includes(store.id))sources.push('账号额外授权');
  return [...new Set(sources)];
}

export function auditMetadata(before:CenterState,after:CenterState,objectId:string,stores:Store[],brands:{id:string;name:string}[],account?:{before?:AuditAccount;after?:AuditAccount}):Partial<Audit> {
  const targetRole=after.roles.find(role=>role.id===objectId)??before.roles.find(role=>role.id===objectId);
  const beforeEmployee=before.employees.find(employee=>employee.id===objectId);
  const afterEmployee=after.employees.find(employee=>employee.id===objectId);
  const oldRole=before.roles.find(role=>role.id===objectId);
  const newRole=after.roles.find(role=>role.id===objectId);
  const scopeChanged=JSON.stringify(oldRole?.defaultStoreIds?.slice().sort())!==JSON.stringify(newRole?.defaultStoreIds?.slice().sort());
  const changes:NonNullable<Audit['storeChanges']>=[];
  const targets=targetRole&&scopeChanged
    ? before.employees.filter(employee=>employee.bindings.some(binding=>binding.roleId===objectId))
    : [afterEmployee??beforeEmployee].filter((employee):employee is Employee=>!!employee);
  for(const employee of targets){
    const left=before.employees.find(item=>item.id===employee.id);
    const right=after.employees.find(item=>item.id===employee.id);
    if(!targetRole&&left&&right&&JSON.stringify(left.bindings)===JSON.stringify(right.bindings)&&
      JSON.stringify(accountExtraStoreIds(left))===JSON.stringify(accountExtraStoreIds(right)))continue;
    const rows=stores.flatMap(store=>{
      const from=storeSources(left,before.roles,store);
      const to=storeSources(right,after.roles,store);
      if(from.length===to.length&&from.every(source=>to.includes(source)))return [];
      return [{id:store.id,name:store.title,before:from,after:to}];
    });
    if(rows.length)changes.push({employeeId:employee.id,employeeName:employee.name,stores:rows});
  }
  const serialized=JSON.stringify([oldRole,newRole,beforeEmployee,afterEmployee]);
  const referenced=(id:string)=>serialized.includes(JSON.stringify(id));
  const names={
    roles:Object.fromEntries([...before.roles,...after.roles].filter(role=>referenced(role.id)).map(role=>[role.id,role.name])),
    stores:Object.fromEntries(stores.filter(store=>referenced(store.id)).map(store=>[store.id,store.title])),
    brands:Object.fromEntries(brands.filter(brand=>referenced(brand.id)).map(brand=>[brand.id,brand.name])),
  };
  return {names,...(account?{account}:{}),...(changes.length?{storeChanges:changes}:{})};
}
