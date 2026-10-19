/** Store-scoped, framework-free permission semantics. No network or implicit grants. */
export type Access = "hidden" | "read" | "edit";
export interface Resource { key: string; title: string; type: "module" | "navigation" | "page" | "content" | "field" | "action" | "setting"; parent?: string; path?: string; viewId?: string; seq?: number; help?: string; previewValue?: string; requires?: string[]; legacyGateKey?:string; compatibilityOnly?:boolean; relatedGrantKeys?:string[] }
export interface Store { id: string; title: string; brand: string; region: string }
export interface Scope { mode: "stores" | "brands" | "regions"; ids: string[] }
export interface Role { id: string; name: string; description: string; system: boolean; grants: Record<string, Access> }
export interface Binding { id: string; roleId: string; scope: Scope }
export interface Employee { id: string; name: string; email: string; status: "unopened" | "pending" | "revoked" | "enabled" | "disabled"; bindings: Binding[]; overrides: Record<string, Record<string, Access>>; migrationReview?: boolean }
export interface Audit { id: string; at: string; actor: string; objectId: string; action: string; before: string; after: string }
export interface CenterState { schema: 1; navigationVersion?: 1; version: number; roles: Role[]; employees: Employee[]; logs: Audit[] }
export const rank: Record<Access, number> = { hidden: 0, read: 1, edit: 2 };
function validAccess(resource:Resource,value:Access|undefined):Access {
  if(resource.type==='setting')return value==='read'||value==='edit'?value:'hidden';
  return resource.type==='action' ? value==='edit'?'edit':'hidden' : value==='read'?'read':'hidden';
}
export function scopeMatches(scope: Scope, store: Store): boolean {
  return scope.ids.includes(scope.mode === "stores" ? store.id : scope.mode === "brands" ? store.brand : store.region);
}
export function roleAccess(role: Role, key: string, resources: Map<string, Resource>, seen = new Set<string>()): Access {
  const resource = resources.get(key);
  if (!resource || seen.has(key)) return "hidden";
  seen.add(key);
  if(resource.legacyGateKey&&roleAccess(role,resource.legacyGateKey,resources,new Set(seen))==='hidden')return 'hidden';
  if (resource.parent && roleAccess(role, resource.parent, resources, new Set(seen)) === "hidden") return "hidden";
  if (resource.requires?.some(k=>roleAccess(role,k,resources,new Set(seen))==='hidden'))return 'hidden';
  const values=[validAccess(resource,role.grants[key]),...(resource.relatedGrantKeys??[]).map(k=>roleAccess(role,k,resources,new Set(seen)))];
  return values.reduce((a,b)=>rank[a]<rank[b]?a:b);
}
export function resolveAccess(state: CenterState, employeeId: string, storeId: string, key: string, stores: Store[], resources: Map<string, Resource>, seen = new Set<string>()): Access {
  const employee = state.employees.find(e => e.id === employeeId), store = stores.find(s => s.id === storeId), resource = resources.get(key);
  if (!employee || !store || !resource || seen.has(key)) return "hidden";
  seen.add(key);
  if(resource.legacyGateKey&&resolveAccess(state,employeeId,storeId,resource.legacyGateKey,stores,resources,new Set(seen))==='hidden')return 'hidden';
  if (resource.parent && resolveAccess(state, employeeId, storeId, resource.parent, stores, resources, new Set(seen)) === "hidden") return "hidden";
  if(resource.requires?.some(k=>resolveAccess(state,employeeId,storeId,k,stores,resources,new Set(seen))==='hidden'))return 'hidden';
  const override = employee.overrides[storeId]?.[key];
  const finish=(value:Access):Access=>(resource.relatedGrantKeys??[]).reduce<Access>((a,k)=>{const b=resolveAccess(state,employeeId,storeId,k,stores,resources,new Set(seen));return rank[a]<rank[b]?a:b;},value);
  if (override !== undefined) return finish(validAccess(resource,override));
  let value: Access = "hidden";
  for (const binding of employee.bindings) {
    if (!scopeMatches(binding.scope, store)) continue;
    const role = state.roles.find(r => r.id === binding.roleId);
    // Union applicable roles first. Ancestor gates use the same effective union above.
    const grant = validAccess(resource,role?.grants[key]);
    if (rank[grant] > rank[value]) value = grant;
  }
  return finish(value);
}
export function deniedStores(state: CenterState, employeeId: string, storeIds: string[], key: string, stores: Store[], resources: Map<string, Resource>): string[] {
  return [...new Set(storeIds)].filter(id => resolveAccess(state, employeeId, id, key, stores, resources) !== "edit");
}
export function validateRole(state: CenterState, role: Role): void {
  if (!role.name.trim() || role.name.trim().length > 30) throw Error("角色名称必填且不能超过 30 字");
  if (role.description.length > 160) throw Error("描述不能超过 160 字");
  if (state.roles.some(r => r.id !== role.id && r.name.trim() === role.name.trim())) throw Error("角色名称已存在");
}
export function validateInvite(state: CenterState, name: string, email: string): void {
  if (!name.trim() || name.trim().length > 30) throw Error("员工姓名必填且不能超过 30 字");
  if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw Error("请输入有效的员工邮箱");
  if (state.employees.some(e => e.email.toLowerCase() === email.trim().toLowerCase())) throw Error("邮箱已存在，请管理原员工账号");
}
