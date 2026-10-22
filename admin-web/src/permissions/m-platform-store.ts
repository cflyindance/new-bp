import { DEMO_LOGIN_ACCOUNT, getAuthenticatedEmail } from '../auth/login';
import { getStaffLoginAccountByEmail, listStaffLoginAccounts } from './enterprise-staff-account-store';
import { M_RESOURCES, mActionKey } from './m-platform-catalog';
import { assertMGrantCeiling, mIsAdministrator, mResolve, validateMState, type MState } from './m-platform-domain';
export const M_PERMISSION_STORAGE = 'menusifu:m-platform-permissions:v1';
export function createMState(): MState {
  // Explicit initial system role. No old merchant/enterprise selection is converted.
  return { schema: 1, revision: 0, roles: [{ id: 'm-system-admin', name: '服务商管理员', description: 'M 平台初始系统管理员', system: true,
    grants: Object.fromEntries([...M_RESOURCES].map(([key, resource]) => [key, resource.kind === 'module' || resource.kind === 'page' && !resource.editable ? 'read' : 'edit'])) }],
    employees: [{ id: 'ent001', roleIds: ['m-system-admin'] }], logs: [] };
}
export function readMState(): MState {
  const raw = localStorage.getItem(M_PERMISSION_STORAGE);
  if (!raw) return createMState();
  const state = JSON.parse(raw) as MState;
  validateMState(state);
  return state;
}
export function currentMAccount() {
  const email = getAuthenticatedEmail()?.trim().toLowerCase() ?? '';
  const account = getStaffLoginAccountByEmail(email);
  if (account) return account;
  // The project's default demo login uses the existing initial administrator's
  // role bindings. Real staff never fall back to this identity; grants and
  // account disablement still pass through the normal role resolver.
  return email === DEMO_LOGIN_ACCOUNT
    ? listStaffLoginAccounts().find(account => account.employeeId === 'ent001')
    : undefined;
}
export function currentMAccess(key: string) {
  try { const account = currentMAccount(); return mResolve(readMState(), account?.employeeId ?? '', key, account?.enabled === true); }
  catch { return 'hidden' as const; }
}
export function requireMAction(page: string, action: string): void {
  if (currentMAccess(mActionKey(page, action)) !== 'edit') throw Error('暂无操作权限');
}
export function saveMState(next: MState, action: string, object: string, gate: [string, string], audit?: { before: unknown; after: unknown }): MState {
  requireMAction(...gate);
  const before = readMState(), actor = currentMAccount();
  if (!actor?.enabled) throw Error('账号已停用或未登录');
  if (before.revision !== next.revision) throw Error('权限已被其他窗口修改，请重新打开后编辑；当前草稿未保存');
  validateMState(next);
  for (const old of before.roles) {
    const role = next.roles.find(role => role.id === old.id);
    if (old.system && (!role || !role.system)) throw Error('系统角色不可删除或更改系统标记');
    if (!role && next.employees.some(employee => employee.roleIds.includes(old.id))) throw Error('角色仍有关联员工');
  }
  const oldRoles = new Map(before.roles.map(role => [role.id, role]));
  for (const role of next.roles) {
    const old = oldRoles.get(role.id);
    if (JSON.stringify(old?.grants) !== JSON.stringify(role.grants)) assertMGrantCeiling(before, actor.employeeId, role.grants);
  }
  for (const employee of next.employees) {
    const old = before.employees.find(e => e.id === employee.id);
    for (const id of employee.roleIds.filter(id => !old?.roleIds.includes(id))) assertMGrantCeiling(before, actor.employeeId, next.roles.find(r => r.id === id)!.grants);
  }
  if (!listStaffLoginAccounts().some(account => account.enabled && mIsAdministrator(next, account.employeeId))) throw Error('至少保留一名已启用且能管理角色和员工授权的管理员');
  const saved = structuredClone(next);
  saved.revision++;
  // Permissions logs contain no password or account credential snapshots.
  saved.logs = [{ id: crypto.randomUUID(), at: new Date().toISOString(), actor: actor.employeeName, action, object,
    before: JSON.stringify(audit?.before ?? { roles: before.roles, employees: before.employees }), after: JSON.stringify(audit?.after ?? { roles: next.roles, employees: next.employees }) }, ...before.logs];
  localStorage.setItem(M_PERMISSION_STORAGE, JSON.stringify(saved));
  window.dispatchEvent(new Event('m-platform-permissions-changed'));
  return saved;
}
