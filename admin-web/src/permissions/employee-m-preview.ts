import {esc} from './center-editor';
import {readMState} from './m-platform-store';
import {mEmployeePermissionPages} from './employee-access-domain';

/** A fresh saved snapshot, deliberately independent from the assignment draft. */
export function bindMEmployeePreview(host:HTMLElement,id:string,enabled:boolean):void {
  const saved=readMState(),pages=mEmployeePermissionPages(saved,id,enabled);
  const roles=(saved.employees.find(e=>e.id===id)?.roleIds??[]).map(roleId=>saved.roles.find(r=>r.id===roleId)?.name??'失效角色');
  let query='',all=false,selected='';
  const label=(access:string)=>access==='hidden'?'不可见':access==='edit'?'可编辑':'可查看';
  function render():void {
    const visible=pages.filter(item=>(all||item.access!=='hidden')&&(!query||`${item.module} ${item.page.title}`.toLowerCase().includes(query.trim().toLowerCase())));
    if(!visible.some(item=>item.page.id===selected))selected=visible[0]?.page.id??'';
    const current=visible.find(item=>item.page.id===selected);
    const group=(allowed:boolean)=>{
      const items=current?.actions.filter(a=>a.allowed===allowed)??[];
      return `<details class="employee-action-group" ${allowed?'open':''}><summary>${allowed?'允许':'禁止'}的操作（${items.length}）</summary>${items.length?`<ul>${items.map(a=>`<li>${esc(a.title)}</li>`).join('')}</ul>`:'<p class="pc-muted">无</p>'}</details>`;
    };
    host.innerHTML=`<div class="employee-preview-heading"><h2>M 平台生效权限</h2><span class="pc-muted">${roles.map(esc).join('、')||'未分配角色'}</span></div><div class="pc-editor employee-effective-editor"><aside class="pc-tree"><label class="pc-search">搜索菜单<input data-employee-menu-search value="${esc(query)}" placeholder="输入菜单名称"></label><label class="pc-search">显示范围<select data-employee-menu-filter><option value="visible" ${!all?'selected':''}>可访问菜单</option><option value="all" ${all?'selected':''}>全部权限</option></select></label>${[...new Set(visible.map(item=>item.module))].map(module=>`<div class="employee-tree-group"><h3>${esc(module)}</h3>${visible.filter(item=>item.module===module).map(item=>`<button type="button" class="pc-tree-item ${selected===item.page.id?'active':''}" data-employee-menu="${esc(item.page.id)}" ${selected===item.page.id?'aria-current="page"':''}><span>${esc(item.page.title)}</span>${item.access==='hidden'?'<small>不可见</small>':''}</button>`).join('')}</div>`).join('')||'<p class="pc-empty">没有匹配菜单</p>'}</aside><section class="pc-detail">${current?`<header class="pc-detail-heading"><h2>${esc(current.page.title)}</h2><span class="pc-tag">${label(current.access)}</span></header>${current.access==='hidden'?'<p class="pc-muted">当前菜单不可访问，下级操作不生效。</p>':''}${current.actions.length?group(true)+group(false):'<p class="pc-muted">本菜单没有独立操作。</p>'}`:`<p class="pc-empty">${query?'没有匹配菜单':enabled?'暂无可访问的 M 平台菜单，可切换“全部权限”查看不可见菜单。':'账号已停用，全部权限不生效。'}</p>`}</section></div>`;
  }
  host.addEventListener('click',event=>{const button=(event.target as Element).closest<HTMLElement>('[data-employee-menu]');if(!button)return;selected=button.dataset.employeeMenu!;render();});
  host.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(!input.matches('[data-employee-menu-search]'))return;query=input.value;const pos=input.selectionStart;render();const next=host.querySelector<HTMLInputElement>('[data-employee-menu-search]');next?.focus();next?.setSelectionRange(pos,pos);});
  host.addEventListener('change',event=>{const input=event.target as HTMLSelectElement;if(!input.matches('[data-employee-menu-filter]'))return;all=input.value==='all';render();});
  render();
}
