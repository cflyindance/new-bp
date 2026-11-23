import { getAuthenticatedEmail, setAuthenticated } from '../auth/login';
import * as accounts from './enterprise-staff-account-store';
import { M_PERMISSION_STORAGE, requireMAction, saveMState } from './m-platform-store';
import { mIsAdministrator, type MState } from './m-platform-domain';
type AccountPatch = { employeeId?: string; employeeName?: string; loginEmail?: string; password?: string; enabled?: boolean; openingMethod?: "invite" | "password"; invitation?: accounts.StaffLoginAccount["invitation"] };
export function saveMAccountChange(state: MState, source: accounts.StaffLoginAccount | undefined, patch: AccountPatch): void {
  requireMAction('staff', 'account');
  if (source && patch.enabled === false && mIsAdministrator(state, source.employeeId) && !accounts.listStaffLoginAccounts().some(other => other.id !== source.id && other.enabled && mIsAdministrator(state, other.employeeId))) throw Error('不能停用最后一名管理员');
  const oldRaw = localStorage.getItem(M_PERMISSION_STORAGE);
  const safe = (a: AccountPatch & {openedVia?: "email" | "password"}) => ({ employeeId: a.employeeId, employeeName: a.employeeName, loginEmail: a.loginEmail, enabled: a.openingMethod === "invite" ? false : a.enabled, openedVia: a.openingMethod === "invite" ? "email" : a.openingMethod === "password" ? "password" : a.openedVia, invitation: a.invitation });
  // Write audit first; a failed account write restores only this transaction's permissions snapshot.
  const action=patch.openingMethod==='invite'&&!source?'创建演示邀请':Object.prototype.hasOwnProperty.call(patch,'invitation')?(patch.invitation?.revoked?'撤销邀请':patch.invitation?'重发演示邀请':'演示接受邀请'):undefined;
  saveMState(state, action ?? (source ? patch.enabled !== undefined ? '变更账号状态' : '编辑员工账号' : '新增员工账号'), source?.employeeName ?? patch.employeeName ?? '', ['staff', 'account'], {
    before: source ? safe(source) : null, after: { ...safe(source ?? {}), ...safe({ ...source, ...patch, enabled: patch.enabled ?? source?.enabled ?? true }), passwordChanged: !!patch.password },
  });
  try {
    if (source) {
      const update = { employeeName: patch.employeeName ?? source.employeeName, loginEmail: patch.loginEmail ?? source.loginEmail, enabled: patch.enabled ?? source.enabled, ...(patch.password ? { password: patch.password } : {}), ...(Object.prototype.hasOwnProperty.call(patch, "invitation") ? { invitation: patch.invitation } : {}) };
      if (!accounts.updateStaffLoginAccount(source.id, update)) throw Error('员工账号不存在');
      if (getAuthenticatedEmail()?.toLowerCase() === source.loginEmail.toLowerCase() && update.loginEmail !== source.loginEmail) setAuthenticated(update.loginEmail);
    } else {
      accounts.createStaffLoginAccount({ employeeId: patch.employeeId!, employeeName: patch.employeeName!, loginEmail: patch.loginEmail!, password: patch.password ?? "", enabled: true, openingMethod: patch.openingMethod });
    }
  } catch (error) {
    if (oldRaw === null) localStorage.removeItem(M_PERMISSION_STORAGE); else localStorage.setItem(M_PERMISSION_STORAGE, oldRaw);
    throw error;
  }
}
