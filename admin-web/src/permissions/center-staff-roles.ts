import {scopeMatches,type Employee,type Role,type Scope,type Store} from './center-domain';
import {esc} from './center-editor';

export const scopeLabel=(scope:Scope):string=>scope.mode==='stores'?'指定门店':scope.mode==='brands'?'动态品牌':'动态区域';
export const bindingStores=(scope:Scope,stores:Store[]):Store[]=>stores.filter(s=>scopeMatches(scope,s));
export function applicableRoles(employee:Employee,roles:Role[],store:Store|undefined):Role[]{
  if(!store)return [];
  const ids=new Set(employee.bindings.filter(b=>scopeMatches(b.scope,store)).map(b=>b.roleId));
  return roles.filter(r=>ids.has(r.id));
}
/** Preserve unmatched stored IDs; reading or viewing never repairs authorization. */
export const scopeStoreItems=(scope:Scope,stores:Store[]):{id:string;title:string}[]=>scope.mode==='stores'?scope.ids.map(id=>({id,title:stores.find(s=>s.id===id)?.title??'已失效门店'})):bindingStores(scope,stores).map(s=>({id:s.id,title:s.title}));
export function renderScope(scope:Scope,stores:Store[],expanded=false,bindingId=''):string {
  const items=scopeStoreItems(scope,stores);
  const item=(s:{id:string;title:string})=>`<span class="pc-store-name">${esc(s.title)}<small>${esc(s.id)}</small></span>`;
  const list=items.map(item);
  const dynamic=scope.mode!=='regions'?'':`<p class="pc-muted">${scopeLabel(scope)}：${esc(scope.ids.join('、'))}；包括未来新增或纳入的门店。</p>`;
  const shown=expanded||list.length<=2||!bindingId?list.join(''):list.slice(0,2).join('')+`<button type="button" class="pc-scope-more" data-view-binding-stores="${esc(bindingId)}">共 ${list.length} 家，查看全部</button>`;
  return `<div class="pc-scope-list">${shown||'<span class="pc-muted">当前无匹配门店</span>'}</div>${dynamic}`;
}
export function renderStaffRoles(employee:Employee,roles:Role[],stores:Store[]):string {
  return `<section class="pc-card" data-staff-roles><div class="pc-toolbar"><div><h2>已分配角色</h2>${employee.demoAuthorization?'<span class="pc-tag">预设演示员工</span>':''}</div><div class="pc-actions"><button type="button" data-do="staff-effective">查看员工生效权限</button><button type="button" class="primary" data-do="assign">分配角色</button></div></div>${employee.migrationReview?'<p class="pc-notice">旧授权范围需复核：请明确门店范围后重新分配，旧数据未删除。</p>':''}<table class="pc-role-bindings"><thead><tr><th>角色</th><th>授权门店 / 范围</th><th>操作</th></tr></thead><tbody>${employee.bindings.map(b=>{const role=roles.find(r=>r.id===b.roleId);return `<tr><td><strong>${esc(role?.name??'已失效角色')}</strong><p class="pc-muted">${esc(scopeLabel(b.scope))}</p></td><td>${renderScope(b.scope,stores,false,b.id)}</td><td><div class="pc-actions"><button type="button" data-view-role="${esc(b.roleId)}" ${role?'':'disabled'}>查看权限</button><button type="button" data-edit-binding="${esc(b.id)}">修改门店</button><button type="button" class="danger" data-remove-binding="${esc(b.id)}">解除角色</button></div></td></tr>`;}).join('')||'<tr><td colspan="3" class="pc-empty">该员工尚未分配角色</td></tr>'}</tbody></table></section>`;
}
/** Atomically replace only this binding's scope. Equivalent sets are a no-op. */
export function updateBindingScope(employee:Employee,id:string,scope:Scope):boolean {
  if(!['stores','brands','regions'].includes(scope.mode))throw Error('授权范围无效');
  const ids=[...new Set(scope.ids)];if(!ids.length||ids.some(id=>!id.trim()))throw Error('请选择至少一个授权范围');
  const binding=employee.bindings.find(b=>b.id===id);if(!binding)throw Error('角色授权不存在，请重新打开');
  if(binding.scope.mode===scope.mode&&binding.scope.ids.length===ids.length&&binding.scope.ids.every(id=>ids.includes(id)))return false;
  binding.scope={mode:scope.mode,ids};return true;
}
