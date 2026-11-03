/** Shared presentation for the two provider permission role lists. No persistence. */
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const ROLE_LIST_CREATE_LABEL = '新建角色';
export const ROLE_ACTION_LABELS = {permissions:'配置权限',edit:'编辑角色',copy:'复制',changes:'查看变更记录',delete:'删除'} as const;
const actionOrder = ['permissions','edit','copy','changes','delete'] as const;
export function renderRoleActions(actions: Partial<Record<typeof actionOrder[number], string>>): string {
  return `<div class="pc-actions permission-role-actions">${actionOrder.map(key => actions[key] ?? '').join('')}</div>`;
}
export function renderRoleListTable(rows: string): string {
  return `<div class="pc-card permission-role-list-card"><div class="permission-role-table-scroll"><table class="permission-role-table"><colgroup><col style="width:20%"><col style="width:32%"><col style="width:8%"><col style="width:40%"></colgroup><thead><tr>${['角色名称','描述','关联员工','操作'].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows || '<tr><td colspan="4" class="pc-empty">暂无角色，请先新建角色。</td></tr>'}</tbody></table></div></div>`;
}
export function uniqueRoleEmployeeIds(ids: readonly string[]): string[] { return [...new Set(ids)]; }
export function renderRoleMemberCount(count: number, attributes: string, roleName: string): string {
  return `<button type="button" class="permission-role-member-count" ${attributes} aria-label="${escapeHtml(roleName)}，关联员工 ${count} 人">${count} 人</button>`;
}
export interface RoleMemberAccount { employeeId: string; employeeName: string }
export function renderRoleMembersContent(roleName: string, ids: readonly string[], directory: readonly RoleMemberAccount[], titleId: string): string {
  const members = uniqueRoleEmployeeIds(ids);
  const body = members.length ? `<table class="permission-role-members-table"><thead><tr><th scope="col">员工姓名</th><th scope="col">工号</th></tr></thead><tbody>${members.map(id => `<tr><td>${escapeHtml(directory.find(account => account.employeeId === id)?.employeeName || '—')}</td><td>${escapeHtml(id)}</td></tr>`).join('')}</tbody></table>` : '<p class="pc-empty">暂无关联员工</p>';
  return `<div class="pc"><h2 id="${escapeHtml(titleId)}">关联员工 · ${escapeHtml(roleName)}</h2><p class="muted">${members.length} 人</p><div class="permission-role-members-scroll">${body}</div><footer><button type="button" data-role-members-close>关闭</button></footer></div>`;
}
export function openRoleMembersDialog(roleName: string, ids: readonly string[], directory: readonly RoleMemberAccount[], trigger?: HTMLElement): void {
  const dialog = document.createElement('dialog');
  const titleId = `role-members-${crypto.randomUUID()}`;
  dialog.className = 'pc-dialog permission-role-members-dialog';
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.innerHTML = renderRoleMembersContent(roleName, ids, directory, titleId);
  dialog.querySelector('[data-role-members-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { dialog.remove(); if (trigger?.isConnected) trigger.focus(); }, {once:true});
  document.body.append(dialog);
  dialog.showModal();
}
