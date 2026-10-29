import { M_RESOURCES, mPageKey, mActionKey, type MAccess } from './m-platform-catalog';
export interface MRole { id: string; name: string; description: string; grants: Record<string, MAccess>; system?: boolean }
export interface MEmployee { id: string; roleIds: string[] }
export interface MLog { id: string; at: string; actor: string; action: string; object: string; before: string; after: string }
export interface MState { schema: 1; catalogVersion?: 2; revision: number; roles: MRole[]; employees: MEmployee[]; logs: MLog[] }
/** Preserve former effective ancestor gates without adding any page grants. */
export function migrateMActivityModule(state: MState): MState {
  if (state.catalogVersion === 2) return state;
  const next = structuredClone(state);
  next.catalogVersion = 2;
  for (const role of next.roles) {
    const key = 'm:module:activity-analysis';
    if (!Object.hasOwn(role.grants, key)) role.grants[key] = role.grants['m:module:merchants'] === 'read' ? 'read' : 'hidden';
  }
  return next;
}
export const mRank: Record<MAccess, number> = { hidden: 0, read: 1, edit: 2 };
/** Union raw role grants first, then apply the effective ancestor gates. */
export function mResolve(state: MState, employeeId: string, key: string, enabled = true, seen = new Set<string>()): MAccess {
  const resource = M_RESOURCES.get(key);
  if (!enabled || !resource || seen.has(key)) return 'hidden';
  seen.add(key);
  const employee = state.employees.find(e => e.id === employeeId);
  if (!employee) return 'hidden';
  let access: MAccess = 'hidden';
  for (const roleId of employee.roleIds) {
    const grant = state.roles.find(r => r.id === roleId)?.grants[key];
    if (grant && mRank[grant] > mRank[access]) access = grant;
  }
  if (resource.parent) {
    const parent = mResolve(state, employeeId, resource.parent, enabled, seen);
    if (parent === 'hidden') return 'hidden';
    if (resource.kind === 'action' && resource.editable && parent !== 'edit') return 'hidden';
  }
  return access;
}
export function mRoleState(role: MRole): MState {
  return { schema: 1, revision: 0, roles: [role], employees: [{ id: 'preview', roleIds: [role.id] }], logs: [] };
}
export function validateMState(state: MState): void {
  if (state.catalogVersion !== undefined && state.catalogVersion !== 2) throw Error('M 平台权限目录版本异常');
  if (state.schema !== 1 || !Number.isInteger(state.revision) || state.revision < 0 || !Array.isArray(state.roles) || !Array.isArray(state.employees) || !Array.isArray(state.logs)) throw Error('M 平台权限数据格式异常，未覆盖原数据');
  const ids = new Set<string>(), names = new Set<string>();
  for (const role of state.roles) {
    if (!role.id || ids.has(role.id)) throw Error('角色标识重复或为空');
    ids.add(role.id);
    if (!role.name.trim() || role.name.trim().length > 30) throw Error('角色名称必填，最多 30 字');
    if (names.has(role.name.trim().toLowerCase())) throw Error('角色名称已存在');
    names.add(role.name.trim().toLowerCase());
    if (role.description.length > 160) throw Error('角色描述最多 160 字');
    if (!role.grants || typeof role.grants !== 'object') throw Error('角色权限格式异常');
    for (const [key, value] of Object.entries(role.grants)) {
      const resource = M_RESOURCES.get(key);
      // Keep unknown historical resources but they never resolve to an allow.
      if (!['hidden', 'read', 'edit'].includes(value)) throw Error('权限状态无效');
      if (resource?.kind === 'module' && value === 'edit' || resource?.kind === 'page' && !resource.editable && value === 'edit' || resource?.kind === 'action' && value === 'read') throw Error('权限状态与资源类型不匹配');
    }
  }
  const employeeIds = new Set<string>();
  for (const employee of state.employees) {
    if (!employee.id || employeeIds.has(employee.id) || !Array.isArray(employee.roleIds)) throw Error('员工授权格式异常');
    employeeIds.add(employee.id);
    if (new Set(employee.roleIds).size !== employee.roleIds.length || employee.roleIds.some(id => !ids.has(id))) throw Error('员工绑定了重复或失效角色');
  }
}
export function mIsAdministrator(state: MState, id: string): boolean {
  return ['roles', 'staff'].every(p => mResolve(state, id, mPageKey(p)) === 'edit') &&
    mResolve(state, id, mActionKey('roles', 'edit')) === 'edit' && mResolve(state, id, mActionKey('staff', 'assign')) === 'edit';
}
export function assertMGrantCeiling(state: MState, actorId: string, grants: Record<string, MAccess>): void {
  for (const [key, value] of Object.entries(grants)) if (mRank[value] > mRank[mResolve(state, actorId, key)]) throw Error('不能授予超出自己权限范围的权限');
}
