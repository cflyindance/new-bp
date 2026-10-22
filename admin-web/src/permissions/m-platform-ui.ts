import './center.css';
import './m-platform.css';
import { M_MODULES, M_PAGES, mModuleKey, mPageKey, mActionKey, type MAccess, type MPage } from './m-platform-catalog';
import { mResolve, mRoleState, mIsAdministrator, type MRole, type MState } from './m-platform-domain';
import { currentMAccess, readMState, saveMState, requireMAction } from './m-platform-store';
import * as accounts from './enterprise-staff-account-store';
import { saveMAccountChange } from './m-platform-account-actions';
export const mEsc = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const prefix = '/m-platform/permissions';
let canLeave: (() => boolean) | undefined;
let editorHash = '';
window.addEventListener('beforeunload', event => { if (canLeave) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('hashchange', event => {
  if (canLeave && !canLeave()) { event.stopImmediatePropagation(); history.replaceState(null, '', editorHash); return; }
  canLeave = undefined;
}, true);
export function renderMCenter(path: string): string {
  return `<div class="pc mp-center" id="m-permission-center" data-path="${mEsc(path)}"><p class="pc-empty">正在加载权限中心…</p></div>`;
}
export function bindMCenter(onMount: () => void): void {
  const root = document.getElementById('m-permission-center');
  if (!root) return;
  const host: HTMLElement = root;
  let state: MState;
  try { state = readMState(); } catch { host.innerHTML = '<p class="pc-error">权限数据无法读取，请保留原数据并联系管理员。</p>'; return; }
  const path = host.dataset.path ?? '';
  const decodeId = (id: string) => { try { return decodeURIComponent(id); } catch { return id; } };
  const staffView = path.includes('/staff');
  const roleId = path.startsWith(`${prefix}/roles/edit/`) ? decodeId(path.slice(`${prefix}/roles/edit/`.length)) : '';
  const employeeId = path.startsWith(`${prefix}/staff/`) ? decodeId(path.slice(`${prefix}/staff/`.length)) : '';
  let draft = structuredClone(state), dirty = false, selected = M_PAGES[0].id, preview = false, query = '';
  const role = () => draft.roles.find(r => r.id === roleId);
  const account = () => accounts.listStaffLoginAccounts().find(a => a.employeeId === employeeId);
  const allowed = (page: string, action: string) => currentMAccess(mActionKey(page, action)) === 'edit';
  const button = (text: string, attr: string, enabled = true, primary = false) => `<button type="button" ${attr} ${enabled ? '' : 'disabled title="暂无操作权限"'} class="${primary ? 'primary' : ''}">${mEsc(text)}</button>`;
  const members = (id: string) => draft.employees.filter(e => e.roleIds.includes(id));
  function mark(): void {
    const before = state.roles.find(r => r.id === roleId)?.grants ?? {}, after = role()?.grants ?? {};
    dirty = [...new Set([...Object.keys(before), ...Object.keys(after)])].some(key => (before[key] ?? 'hidden') !== (after[key] ?? 'hidden'));
    editorHash = location.hash;
    canLeave = dirty ? () => confirm('有未保存的修改，确定放弃并离开？') : undefined;
  }
  function persist(action: string, object: string, gate: [string, string], next = draft): void {
    state = saveMState(next, action, object, gate); draft = structuredClone(state); dirty = false; canLeave = undefined;
  }
  function error(message: string): void { const target = host.querySelector<HTMLElement>('[data-mp-error]'); if (target) target.textContent = message; }
  const access = (key: string): MAccess => roleId && role() ? mResolve(mRoleState(role()!), 'preview', key) : mResolve(draft, employeeId, key, account()?.enabled === true);
  const resourceTitle = (key: string): string => {
    for (const module of M_MODULES) {
      if (key === mModuleKey(module.id)) return module.title;
      for (const page of module.pages) {
        if (key === mPageKey(page.id)) return `${module.title} / ${page.title}`;
        for (const action of page.actions) if (key === mActionKey(page.id, action.id)) return `${page.title} / ${action.title}`;
      }
    }
    return '历史权限';
  };
  const options = (key: string, values: [MAccess, string][], editable: boolean) => `<div class="pc-segment" role="group" aria-label="${mEsc(resourceTitle(key))}权限">${values.map(([value, text]) => `<button type="button" data-mp-grant="${mEsc(key)}" data-value="${value}" aria-pressed="${(role()?.grants[key] ?? 'hidden') === value}" ${editable ? '' : 'disabled'}>${text}</button>`).join('')}</div>`;
  function editor(): string {
    const visiblePages = M_PAGES.filter(p => !preview && !employeeId || access(mPageKey(p.id)) !== 'hidden');
    if (!visiblePages.some(p => p.id === selected)) selected = visiblePages[0]?.id ?? '';
    const selectedPage = visiblePages.find(p => p.id === selected);
    const readonly = preview || !!employeeId || !allowed('roles', 'edit');
    const tree = M_MODULES.map(module => {
      const pages = visiblePages.filter(p => p.moduleId === module.id && (!query || `${module.title} ${p.title}`.includes(query)));
      if (!pages.length) return '';
      return `<div class="mp-module"><div class="mp-module-heading"><strong>${mEsc(module.title)}</strong>${readonly ? '' : options(mModuleKey(module.id), [['hidden', '不可见'], ['read', '可见']], true)}</div>${pages.map(p => `<button type="button" data-mp-page="${p.id}" class="pc-tree-item ${selected === p.id ? 'active' : ''}">${mEsc(p.title)}</button>`).join('')}</div>`;
    }).join('');
    const detail = (p: MPage) => {
      const gate = access(mModuleKey(M_PAGES.find(entry => entry.id === p.id)!.moduleId)) !== 'hidden';
      const label = (value: MAccess) => value === 'hidden' ? '不可见' : value === 'read' ? '可见不可编辑' : '可编辑';
      return `<header class="pc-detail-heading"><h2>${mEsc(p.title)}</h2>${readonly ? `<span class="pc-tag">${label(access(mPageKey(p.id)))}</span>` : options(mPageKey(p.id), p.editable ? [['hidden', '不可见'], ['read', '可见不可编辑'], ['edit', '可编辑']] : [['hidden', '不可见'], ['read', '可见']], gate)}</header>${!gate ? '<p class="pc-notice">上级菜单不可见，下级配置保留但不生效。</p>' : ''}<table><thead><tr><th>页面操作</th><th>${readonly ? '最终权限' : '授权'}</th></tr></thead><tbody>${p.actions.map(a => `<tr><td>${mEsc(a.title)}${a.write ? '' : '（输出操作）'}</td><td>${readonly ? `<span class="pc-tag">${access(mActionKey(p.id, a.id)) === 'edit' ? '允许' : '禁止'}</span>` : options(mActionKey(p.id, a.id), [['hidden', '禁止'], ['edit', '允许']], gate && access(mPageKey(p.id)) !== 'hidden' && (!a.write || access(mPageKey(p.id)) === 'edit'))}</td></tr>`).join('') || '<tr><td colspan="2">本页按页面权限控制，无独立操作。</td></tr>'}</tbody></table>`;
    };
    return `<div class="pc-editor"><aside class="pc-tree" data-mp-scroll="tree"><label class="pc-search">搜索菜单<input data-mp-menu-search value="${mEsc(query)}" placeholder="搜索 M 平台菜单"></label>${tree || '<p class="pc-empty">没有可见菜单</p>'}</aside><section class="pc-detail" data-mp-scroll="detail">${selectedPage ? detail(selectedPage) : '<p class="pc-empty">该员工暂无可访问菜单</p>'}</section></div>`;
  }
  function logs(): string {
    return `<table><thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>对象</th><th>变更详情</th></tr></thead><tbody>${state.logs.map(log => `<tr><td>${mEsc(new Date(log.at).toLocaleString())}</td><td>${mEsc(log.actor)}</td><td>${mEsc(log.action)}</td><td>${mEsc(log.object)}</td><td><details><summary>查看前后值</summary><p>变更前</p><pre class="pc-log-json">${mEsc(log.before)}</pre><p>变更后</p><pre class="pc-log-json">${mEsc(log.after)}</pre></details></td></tr>`).join('') || '<tr><td colspan="5" class="pc-empty">暂无变更记录</td></tr>'}</tbody></table>`;
  }
  function render(): void {
    const positions = [...host.querySelectorAll<HTMLElement>('[data-mp-scroll]')].map(el => [el.dataset.mpScroll!, el.scrollTop] as const);
    const message = '<p class="pc-error" data-mp-error role="alert"></p>';
    if (roleId || employeeId) {
      const object = roleId ? role() : account();
      if (!object) { host.innerHTML = '<p class="pc-empty">角色或员工不存在</p>'; return; }
      const name = roleId ? role()!.name : account()!.employeeName;
      host.innerHTML = `<div class="pc-full"><header class="pc-heading"><div><h1>${roleId ? '编辑权限' : '员工权限'} · ${mEsc(name)}</h1><p class="pc-muted">${roleId ? '设置角色可以访问、查看和设置的 M 平台菜单。' : '最终权限由已分配角色合并计算。'}</p></div><div class="pc-actions">${roleId ? button(preview ? '返回编辑' : '效果预览', 'data-mp-do="preview"') : button('分配角色', `data-mp-assign="${mEsc(employeeId)}"`, allowed('staff', 'assign'))}</div></header>${message}${employeeId ? `<div class="mp-role-summary">${(draft.employees.find(e => e.id === employeeId)?.roleIds ?? []).map(id => `<span class="pc-tag">${mEsc(draft.roles.find(r => r.id === id)?.name ?? '失效角色')}</span>`).join('') || '尚未分配角色'}${account()?.enabled ? '' : '<span class="pc-tag">账号已停用，全部权限不生效</span>'}</div>` : ''}<div class="pc-content">${editor()}</div><footer class="pc-footer"><span>${dirty ? '有未保存的修改' : ''}</span><div class="pc-actions">${button('返回', 'data-mp-do="back"')}${roleId ? button('保存', 'data-mp-do="save-grants"', allowed('roles', 'edit') && dirty, true) : ''}</div></footer></div>`;
    } else if (path.endsWith('/roles') || path.endsWith('/roles/new')) {
      host.innerHTML = `<header class="pc-heading"><h1>角色与功能权限</h1>${button('新建角色', 'data-mp-do="new-role"', allowed('roles', 'create'), true)}</header>${message}<div class="pc-card"><table><thead><tr><th>角色名称</th><th>描述</th><th>成员数</th><th>操作</th></tr></thead><tbody>${state.roles.map(r => `<tr><td>${mEsc(r.name)}${r.system ? '<span class="pc-tag">系统角色</span>' : ''}</td><td>${mEsc(r.description) || '—'}</td><td>${button(String(members(r.id).length), `data-mp-members="${mEsc(r.id)}"`)}</td><td><div class="pc-actions">${button('编辑角色', `data-mp-edit="${mEsc(r.id)}"`, allowed('roles', 'edit'))}<a class="pc-link" href="#${prefix}/roles/edit/${encodeURIComponent(r.id)}">编辑权限</a>${button('复制', `data-mp-copy="${mEsc(r.id)}"`, allowed('roles', 'create'))}${button('删除', `data-mp-delete="${mEsc(r.id)}"`, allowed('roles', 'delete') && !r.system)}</div></td></tr>`).join('')}</tbody></table></div>`;
    } else if (staffView) {
      const rows = accounts.listStaffLoginAccounts().filter(a => `${a.employeeId} ${a.employeeName} ${a.loginEmail}`.toLowerCase().includes(query.toLowerCase()));
      host.innerHTML = `<header class="pc-heading"><h1>员工与账号</h1>${button('新增员工账号', 'data-mp-do="new-account"', allowed('staff', 'account'), true)}</header>${message}<div class="pc-card"><label>搜索员工<input data-mp-staff-search value="${mEsc(query)}" placeholder="姓名、工号或邮箱"></label><table><thead><tr><th>员工</th><th>登录邮箱</th><th>账号状态</th><th>角色</th><th>操作</th></tr></thead><tbody>${rows.map(a => `<tr><td>${mEsc(a.employeeName)}<small> ${mEsc(a.employeeId)}</small></td><td>${mEsc(a.loginEmail)}</td><td>${a.enabled ? '已启用' : '已停用'}</td><td>${(state.employees.find(e => e.id === a.employeeId)?.roleIds ?? []).map(id => mEsc(state.roles.find(r => r.id === id)?.name ?? '失效角色')).join('、') || '未分配'}</td><td><div class="pc-actions"><a class="pc-link" href="#${prefix}/staff/${encodeURIComponent(a.employeeId)}">查看权限</a>${button('分配角色', `data-mp-assign="${mEsc(a.employeeId)}"`, allowed('staff', 'assign'))}${button('编辑账号', `data-mp-account="${mEsc(a.id)}"`, allowed('staff', 'account'))}${button(a.enabled ? '停用' : '启用', `data-mp-toggle="${mEsc(a.id)}"`, allowed('staff', 'account'))}</div></td></tr>`).join('') || '<tr><td colspan="5" class="pc-empty">没有匹配员工</td></tr>'}</tbody></table></div>`;
    } else if (path.endsWith('/change-log')) {
      host.innerHTML = `<h1>变更记录</h1>${message}<div class="pc-card">${logs()}</div>`;
    } else {
      const stats = [['角色', state.roles.length], ['员工账号', accounts.listStaffLoginAccounts().length], ['已授权员工', state.employees.filter(e => e.roleIds.length).length], ['可授权菜单页', M_PAGES.length]];
      host.innerHTML = `<h1>权限总览</h1><p class="pc-muted">通过角色管理服务商内部员工的 M 平台菜单与操作权限。</p>${message}<div class="pc-stats">${stats.map(([label, count]) => `<div class="pc-card">${label}<strong>${count}</strong></div>`).join('')}</div><section class="pc-card"><h2>最近变更</h2>${logs()}</section>`;
    }
    for (const [id, top] of positions) { const el = host.querySelector<HTMLElement>(`[data-mp-scroll="${id}"]`); if (el) el.scrollTop = top; }
  }
  function dialog(title: string, body: string, save: (form: HTMLFormElement) => void): void {
    const modal = document.createElement('dialog'); modal.className = 'pc-dialog mp-permission-dialog';
    modal.innerHTML = `<form class="pc" novalidate><h2>${mEsc(title)}</h2><div class="pc-form">${body}</div><p class="pc-error" role="alert"></p><footer><button type="button" data-cancel>取消</button><button class="primary" type="submit">保存</button></footer></form>`;
    document.body.append(modal);
    modal.addEventListener('close', () => modal.remove());
    modal.querySelector('[data-cancel]')!.addEventListener('click', () => modal.close());
    modal.querySelector('form')!.addEventListener('submit', event => {
      event.preventDefault();
      try { save(event.currentTarget as HTMLFormElement); modal.close(); render(); }
      catch (e) { modal.querySelector('.pc-error')!.textContent = (e as Error).message; }
    }); modal.showModal();
  }
  const field = (label: string, name: string, value = '', type = 'text', extra = '') => `<label>${label}<input name="${name}" type="${type}" value="${mEsc(value)}" ${extra}></label>`;
  function editRole(id?: string, copy = false): void {
    requireMAction('roles', id && !copy ? 'edit' : 'create');
    const source = state.roles.find(r => r.id === id);
    dialog(copy ? '复制角色' : source ? '编辑角色' : '新建角色', field('角色名称', 'name', copy ? '' : source?.name, 'text', 'maxlength="30" required') + `<label>角色描述<textarea name="description" maxlength="160">${mEsc(source?.description)}</textarea></label>`, form => {
      const data = new FormData(form), name = String(data.get('name') ?? '').trim(), description = String(data.get('description') ?? '').trim();
      const next = structuredClone(state);
      if (source && !copy) Object.assign(next.roles.find(r => r.id === id)!, { name, description });
      else next.roles.push({ id: crypto.randomUUID(), name, description, grants: copy ? { ...source!.grants } : {} });
      persist(source && !copy ? '编辑角色' : copy ? '复制角色' : '新建角色', name, ['roles', source && !copy ? 'edit' : 'create'], next);
    });
  }
  function assign(id: string): void {
    requireMAction('staff', 'assign');
    const employee = state.employees.find(e => e.id === id);
    dialog('分配角色', `<p>员工：${mEsc(accounts.listStaffLoginAccounts().find(a => a.employeeId === id)?.employeeName ?? id)}</p><div class="pc-choice-list">${state.roles.map(r => `<label><input type="checkbox" name="roles" value="${mEsc(r.id)}" ${employee?.roleIds.includes(r.id) ? 'checked' : ''}>${mEsc(r.name)}</label>`).join('')}</div><p class="pc-muted">多角色权限取允许项的并集；清空选择后，该员工无 M 平台权限。</p>`, form => {
      const next = structuredClone(state), roleIds = new FormData(form).getAll('roles').map(String);
      const target = next.employees.find(e => e.id === id);
      if (target) target.roleIds = roleIds; else next.employees.push({ id, roleIds });
      persist('分配角色', id, ['staff', 'assign'], next);
    });
  }
  function editAccount(id?: string): void {
    requireMAction('staff', 'account');
    const source = accounts.getStaffLoginAccountById(id ?? '');
    dialog(source ? '编辑员工账号' : '新增员工账号', field('员工工号', 'employeeId', source?.employeeId, 'text', source ? 'readonly' : 'required') + field('员工姓名', 'employeeName', source?.employeeName, 'text', 'required maxlength="30"') + field('登录邮箱', 'email', source?.loginEmail, 'email', 'required') + field(source ? '新密码（留空保留原密码）' : '密码', 'password', '', 'password', 'autocomplete="new-password"') + field('确认密码', 'confirmPassword', '', 'password', 'autocomplete="new-password"'), form => {
      requireMAction('staff', 'account');
      const data = new FormData(form), employeeId = String(data.get('employeeId') ?? '').trim(), employeeName = String(data.get('employeeName') ?? '').trim(), loginEmail = String(data.get('email') ?? '').trim(), password = String(data.get('password') ?? ''), confirmPassword = String(data.get('confirmPassword') ?? '');
      const problem = accounts.validateStaffAccountInput({ employeeId, employeeName, loginEmail, password, confirmPassword, requirePassword: !source || !!password, excludeId: source?.id });
      if (problem) throw Error(problem);
      if (employeeName.length > 30) throw Error('员工姓名最多 30 字');
      saveMAccountChange(state, source, { employeeId, employeeName, loginEmail, password });
      state = readMState(); draft = structuredClone(state);
    });
  }
  host.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button'); if (!target || target.hasAttribute('disabled')) return;
    try {
      if (target.dataset.mpPage) { selected = target.dataset.mpPage; render(); }
      if (target.dataset.mpGrant && role()) {
        requireMAction('roles', 'edit'); role()!.grants[target.dataset.mpGrant] = target.dataset.value as MAccess; mark(); render();
      }
      if (target.dataset.mpEdit) editRole(target.dataset.mpEdit);
      if (target.dataset.mpCopy) editRole(target.dataset.mpCopy, true);
      if (target.dataset.mpAssign) assign(target.dataset.mpAssign);
      if (target.dataset.mpAccount) editAccount(target.dataset.mpAccount);
      if (target.dataset.mpToggle) {
        requireMAction('staff', 'account');
        const a = accounts.getStaffLoginAccountById(target.dataset.mpToggle)!;
        if (a.enabled && mIsAdministrator(state, a.employeeId) && !accounts.listStaffLoginAccounts().some(other => other.id !== a.id && other.enabled && mIsAdministrator(state, other.employeeId))) throw Error('不能停用最后一名管理员');
        if (confirm(`确定${a.enabled ? '停用' : '启用'} ${a.employeeName} 的账号？`)) { saveMAccountChange(state, a, { enabled: !a.enabled }); state = readMState(); draft = structuredClone(state); onMount(); }
      }
      if (target.dataset.mpMembers) {
        const list = members(target.dataset.mpMembers).map(e => accounts.listStaffLoginAccounts().find(a => a.employeeId === e.id)?.employeeName ?? e.id);
        dialog('角色成员', `<p>${list.map(mEsc).join('、') || '暂无成员'}</p>`, () => {});
      }
      if (target.dataset.mpDelete) {
        requireMAction('roles', 'delete');
        const r = state.roles.find(r => r.id === target.dataset.mpDelete)!;
        if (r.system) throw Error('系统角色不可删除');
        if (members(r.id).length) throw Error('该角色仍有关联员工，请先解除角色绑定');
        if (confirm(`确定删除角色“${r.name}”？`)) { const next = structuredClone(state); next.roles = next.roles.filter(role => role.id !== r.id); persist('删除角色', r.name, ['roles', 'delete'], next); render(); }
      }
      switch (target.dataset.mpDo) {
        case 'new-role': editRole(); break;
        case 'new-account': editAccount(); break;
        case 'preview': preview = !preview; render(); break;
        case 'back': location.hash = `${prefix}/${employeeId ? 'staff' : 'roles'}`; break;
        case 'save-grants': {
          if (!dirty) break;
          const before = state.roles.find(r => r.id === roleId)!.grants;
          const changed = Object.keys(role()!.grants).filter(key => (before[key] ?? 'hidden') !== role()!.grants[key]);
          const labels = { hidden: '不可见 / 禁止', read: '可见 / 只读', edit: '可编辑 / 允许' };
          dialog('确认权限变更', `<p>角色：${mEsc(role()!.name)}；影响 ${members(roleId).length} 名员工。</p><div class="pc-choice-list">${changed.map(key => `<p>${mEsc(resourceTitle(key))}：${labels[before[key] ?? 'hidden']} → ${labels[role()!.grants[key]]}</p>`).join('') || '<p>没有权限差异。</p>'}</div>`, () => { persist('编辑角色权限', role()!.name, ['roles', 'edit']); onMount(); }); break;
        }
      }
    } catch (e) { error((e as Error).message); }
  });
  host.addEventListener('input', event => {
    const input = event.target as HTMLInputElement;
    if (!input.matches('[data-mp-menu-search],[data-mp-staff-search]')) return;
    const pos = input.selectionStart, attr = input.hasAttribute('data-mp-menu-search') ? 'data-mp-menu-search' : 'data-mp-staff-search';
    query = input.value; render(); const next = host.querySelector<HTMLInputElement>(`[${attr}]`); next?.focus(); next?.setSelectionRange(pos, pos);
  });
  render();
  if (path.endsWith('/roles/new') && allowed('roles', 'create')) editRole();
}
