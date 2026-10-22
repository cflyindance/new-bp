import { bindNavigationSubmenuActions } from '../src/shell/navigation-submenu-actions';
/** Run in the task-owned browser: await (await import('/scripts/verify-m-platform-persistence.browser.ts')).runMPersistenceChecks() */
import { currentMAccount, currentMAccess, readMState, saveMState, M_PERMISSION_STORAGE } from '../src/permissions/m-platform-store';
import { saveMAccountChange } from '../src/permissions/m-platform-account-actions';
import { createStaffLoginAccount, listStaffLoginAccounts } from '../src/permissions/enterprise-staff-account-store';
import { validateLoginCredentials } from '../src/auth/login';
import { mPageKey } from '../src/permissions/m-platform-catalog';
export function runMPersistenceChecks(): string[] {
  const results: string[] = [], accountKey = 'menusifu:enterprise-staff-login-accounts:v1';
  const stateRaw = localStorage.getItem(M_PERMISSION_STORAGE), accountsRaw = localStorage.getItem(accountKey);
  const originalSet = Storage.prototype.setItem;
  function check(test: boolean, message: string): void { if (!test) throw Error(message); results.push(message); }
  function rejects(fn: () => void, text: string): boolean { try { fn(); return false; } catch (e) { return String((e as Error).message).includes(text); } }
  try {
    const state = readMState(), actor = currentMAccount();
    if (!actor || currentMAccess(mPageKey('roles')) !== 'edit') throw Error('Run as M platform administrator');
    const stale = structuredClone(state); stale.revision++;
    check(rejects(() => saveMState(stale, 'test', '', ['roles', 'edit']), '其他窗口'), 'stale revision rejected');
    const noAdmin = structuredClone(state); noAdmin.employees = noAdmin.employees.map(e => ({ ...e, roleIds: [] }));
    check(rejects(() => saveMState(noAdmin, 'test', '', ['staff', 'assign']), '至少保留'), 'last administrator role removal rejected');
    check(rejects(() => saveMAccountChange(state, actor, { enabled: false }), '最后一名'), 'last administrator disable rejected');
    Storage.prototype.setItem = function (key, value) { if (key === M_PERMISSION_STORAGE) throw new Error('simulated quota'); originalSet.call(this, key, value); };
    check(rejects(() => saveMState(structuredClone(state), 'test', '', ['roles', 'edit']), 'quota'), 'permission storage failure propagated');
    check(localStorage.getItem(M_PERMISSION_STORAGE) === stateRaw, 'failed permission write preserves saved data');
    Storage.prototype.setItem = function (key, value) { if (key === accountKey) throw new Error('simulated account quota'); originalSet.call(this, key, value); };
    check(rejects(() => saveMAccountChange(state, undefined, { employeeId: 'quota-check', employeeName: 'Quota check', loginEmail: 'quota.check@menusifu.cn', password: 'quota-test-only' }), 'quota'), 'account storage failure propagated');
    check(localStorage.getItem(M_PERMISSION_STORAGE) === stateRaw, 'account transaction failure restores audit revision');
    check(!listStaffLoginAccounts().some(a => a.employeeId === 'quota-check'), 'failed account write never enters memory or persisted account list');
    check(rejects(() => createStaffLoginAccount({ employeeId: actor.employeeId, employeeName: 'duplicate', loginEmail: 'duplicate.check@menusifu.cn', password: 'test-only', enabled: true }), '工号'), 'duplicate employee identity rejected');
    Storage.prototype.setItem = originalSet;
    const stored = JSON.parse(accountsRaw!) as typeof actor[];
    stored.find(a => a.employeeId === actor.employeeId)!.enabled = false;
    localStorage.setItem(accountKey, JSON.stringify(stored));
    check(currentMAccess(mPageKey('roles')) === 'hidden', 'account disabled in another window denies current session');
    check(validateLoginCredentials(actor.loginEmail, actor.password)?.includes('停用') === true, 'disabled enterprise login cannot fall back to demo authentication');
    return results;
  } finally {
    Storage.prototype.setItem = originalSet;
    if (stateRaw === null) localStorage.removeItem(M_PERMISSION_STORAGE); else originalSet.call(localStorage, M_PERMISSION_STORAGE, stateRaw);
    if (accountsRaw === null) localStorage.removeItem(accountKey); else originalSet.call(localStorage, accountKey, accountsRaw);
  }
}

export function runMNavigationChecks(): string[] {
  const root = document.createElement('div'); root.className = 'mp-center'; root.style.display = 'none';
  root.innerHTML = `<div data-hub-sheet-root="fixture"><button id="fixture-open" aria-controls="fixture-child"><span>一级</span></button><div id="fixture-child"><button id="fixture-deep" aria-controls="fixture-grandchild"><span>二级</span></button><a href="${location.hash}" id="fixture-leaf">叶子</a></div><div id="fixture-grandchild"><a href="${location.hash}">孙页面</a></div><button id="fixture-back" data-navigation-sheet-back>返回</button></div>`;
  document.body.append(root);
  const stack: string[] = []; let bubbled = 0;
  bindNavigationSubmenuActions(root, { open: (_hub, controls) => stack.push(controls), back: () => { stack.pop(); }, keepLeaf: () => stack.length > 0 });
  root.addEventListener('click', () => { bubbled++; });
  const check = (ok: boolean, text: string) => { if (!ok) throw Error(text); return text; };
  const results: string[] = [];
  try {
    root.querySelector<HTMLElement>('#fixture-open')!.click();
    results.push(check(stack.length === 1 && stack[0] === 'fixture-child', 'shared parent click opens child without navigation'));
    root.querySelector<HTMLElement>('#fixture-deep')!.click();
    results.push(check(stack.length === 2, 'shared nested branch pushes one layer'));
    root.querySelector<HTMLElement>('#fixture-back')!.click();
    results.push(check(stack.length === 1, 'shared back removes exactly one layer'));
    root.querySelector<HTMLElement>('#fixture-leaf')!.click();
    results.push(check(stack.length === 1 && bubbled === 0, 'shared leaf keeps layer and suppresses outer close handler'));
    root.querySelector<HTMLElement>('#fixture-back')!.click();
    results.push(check(stack.length === 0, 'shared final back returns to parent'));
    return results;
  } finally { root.remove(); }
}

export function runMDefaultDemoChecks(): string[] {
  const authKey = 'menusifu-admin-auth-email', oldEmail = sessionStorage.getItem(authKey);
  const accountsKey = 'menusifu:enterprise-staff-login-accounts:v1', oldAccounts = localStorage.getItem(accountsKey);
  const before = localStorage.getItem(M_PERMISSION_STORAGE);
  const results: string[] = [];
  const check = (ok: boolean, text: string) => { if (!ok) throw Error(text); results.push(text); };
  try {
    sessionStorage.setItem(authKey, 'demo.menusifu.cn');
    check(currentMAccount()?.employeeId === 'ent001', 'default demo uses the initial service-provider administrator role identity');
    check(currentMAccess(mPageKey('brands')) === 'edit', 'default demo can see existing M platform brand data');
    check(currentMAccess(mPageKey('roles')) === 'edit', 'default demo can configure M platform roles');
    check(currentMAccess('m:page:unregistered') === 'hidden', 'unknown resources remain denied for default demo');
    sessionStorage.setItem(authKey, 'preset.zhou@menusifu.cn');
    check(currentMAccess(mPageKey('roles')) === 'hidden', 'real unassigned staff does not inherit demo privileges');
    sessionStorage.setItem(authKey, 'unknown@menusifu.cn');
    check(currentMAccess(mPageKey('brands')) === 'hidden', 'unknown employees do not inherit demo privileges');
    const accountRows = JSON.parse(oldAccounts!) as { employeeId: string; enabled: boolean }[];
    accountRows.find(row => row.employeeId === 'ent001')!.enabled = false;
    localStorage.setItem(accountsKey, JSON.stringify(accountRows));
    sessionStorage.setItem(authKey, 'demo.menusifu.cn');
    check(currentMAccess(mPageKey('brands')) === 'hidden', 'default demo respects administrator account disablement');
    check(localStorage.getItem(M_PERMISSION_STORAGE) === before, 'default demo resolution does not rewrite existing role bindings');
    return results;
  } finally {
    if (oldEmail === null) sessionStorage.removeItem(authKey); else sessionStorage.setItem(authKey, oldEmail);
    if (oldAccounts === null) localStorage.removeItem(accountsKey); else localStorage.setItem(accountsKey, oldAccounts);
  }
}
