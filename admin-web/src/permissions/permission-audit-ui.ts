import {currentMAccess,readMState} from './m-platform-store';
import {mPageKey} from './m-platform-catalog';
import {readProviderState} from './provider-access-store';
import {allowedAuditTypes,filterAuditRecords,type AuditRecord} from './permission-audit-domain';
const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const label=(type:string)=>type==='m'?'M 平台权限':'商家后台访问权限';
export function bindPermissionAudit(host:HTMLElement):void {
 const query=new URLSearchParams(location.hash.split('?')[1]??'');
 const legacy=location.hash.startsWith('#/m-platform/permissions/provider-roles/change-log');
 let type=query.get('type')??(legacy?'provider':'all'),roleId=query.get('role')??'';
 const draw=()=>{
  const allowed=allowedAuditTypes(currentMAccess(mPageKey('permission-log'))!=='hidden',currentMAccess(mPageKey('provider-roles'))!=='hidden');
  if(!allowed.length){host.innerHTML='<p class="pc-empty">暂无变更记录查看权限</p>';return;}
  const records:AuditRecord[]=[],errors:string[]=[];let roleName='';
  for(const source of allowed){try{const state=source==='m'?readMState():readProviderState();records.push(...state.logs.map(l=>({...l,type:source})));if(type===source)roleName=state.roles.find(r=>r.id===roleId)?.name??'';}catch{errors.push(label(source)+'记录无法读取，请保留原数据并联系管理员。');}}
  const visible=filterAuditRecords(records,allowed,type,roleId,roleName);
  host.innerHTML=`<section data-permission-audit><h1>变更记录</h1><div class="pc-card"><label>权限类型<select data-audit-type><option value="all" ${type==='all'?'selected':''}>全部</option>${allowed.map(t=>`<option value="${t}" ${type===t?'selected':''}>${label(t)}</option>`).join('')}</select></label>${roleId?`<p>角色筛选：${esc(roleName||roleId)} <button type="button" data-audit-clear>清除角色筛选</button></p>`:''}${!allowed.includes(type as any)&&type!=='all'?'<p class="pc-notice">暂无该类型变更记录查看权限。</p>':''}${errors.map(e=>`<p class="pc-error" role="alert">${esc(e)}</p>`).join('')}${visible.some(l=>l.id.startsWith('provider-demo-log-')||l.id.startsWith('m-demo-log-'))?'<p class="pc-notice">预设测试数据：标注“演示”的记录不是真实操作历史。</p>':''}<table><thead><tr><th>权限类型</th><th>时间</th><th>操作人</th><th>操作</th><th>对象</th><th>变更详情</th></tr></thead><tbody>${visible.map(l=>`<tr><td>${label(l.type)}</td><td>${esc(new Date(l.at).toLocaleString())}</td><td>${esc(l.actor)}</td><td>${esc(l.action)}</td><td>${esc(l.object)}</td><td>${l.type==='m'?`<details><summary>查看前后值</summary><p>变更前</p><pre class="pc-log-json">${esc(l.before)}</pre><p>变更后</p><pre class="pc-log-json">${esc(l.after)}</pre></details>`:'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="pc-empty">暂无匹配变更记录</td></tr>'}</tbody></table></div></section>`;
  host.querySelector<HTMLSelectElement>('[data-audit-type]')!.onchange=event=>{type=(event.target as HTMLSelectElement).value;roleId='';sync();draw();};
  host.querySelector('[data-audit-clear]')?.addEventListener('click',()=>{roleId='';sync();draw();});
 };
 const sync=()=>{const params=new URLSearchParams({type});if(roleId)params.set('role',roleId);history.replaceState(null,'','#/m-platform/permissions/change-log?'+params);};
 draw();
}
