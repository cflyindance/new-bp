import { getAuthenticatedEmail, setAuthenticated } from '../auth/login';
import * as accounts from './enterprise-staff-account-store';
import { M_PERMISSION_STORAGE, requireMAction, saveMState } from './m-platform-store';
import { mIsAdministrator, type MState } from './m-platform-domain';
type AccountPatch = { employeeId?: string; employeeName?: string; loginEmail?: string; password?: string; enabled?: boolean };
export function saveMAccountChange(state: MState, source: accounts.StaffLoginAccount | undefined, patch: AccountPatch): void {
  requireMAction('staff', 'account');
  if (source && patch.enabled === false && mIsAdministrator(state, source.employeeId) && !accounts.listStaffLoginAccounts().some(other => other.id !== source.id && other.enabled && mIsAdministrator(state, other.employeeId))) throw Error('不能停用最后一名管理员');
  const oldRaw = localStorage.getItem(M_PERMISSION_STORAGE);
  const safe = (a: AccountPatch) => ({ employeeId: a.employeeId, employeeName: a.employeeName, loginEmail: a.loginEmail, enabled: a.enabled });
  // Write audit first; a failed account write restores only this transaction's permissions snapshot.
  saveMState(state, source ? patch.enabled !== undefined ? '变更账号状态' : '编辑员工账号' : '新增员工账号', source?.employeeName ?? patch.employeeName ?? '', ['staff', 'account'], {
    before: source ? safe(source) : null, after: { ...safe(source ?? {}), ...safe({ ...source, ...patch }), passwordChanged: !!patch.password },
  });
  try {
    if (source) {
      const update = { employeeName: patch.employeeName ?? source.employeeName, loginEmail: patch.loginEmail ?? source.loginEmail, enabled: patch.enabled ?? source.enabled, ...(patch.password ? { password: patch.password } : {}) };
      if (!accounts.updateStaffLoginAccount(source.id, update)) throw Error('员工账号不存在');
      if (getAuthenticatedEmail()?.toLowerCase() === source.loginEmail.toLowerCase() && update.loginEmail !== source.loginEmail) setAuthenticated(update.loginEmail);
    } else {
      accounts.createStaffLoginAccount({ employeeId: patch.employeeId!, employeeName: patch.employeeName!, loginEmail: patch.loginEmail!, password: patch.password!, enabled: true });
    }
  } catch (error) {
    if (oldRaw === null) localStorage.removeItem(M_PERMISSION_STORAGE); else localStorage.setItem(M_PERMISSION_STORAGE, oldRaw);
    throw error;
  }
}
