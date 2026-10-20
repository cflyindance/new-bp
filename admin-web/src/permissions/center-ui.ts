import {isRoleOnlyMigrationAudit} from './center-audit-visibility';
import {auditEmployeeName} from './center-audit-employee';
import {renderAuditDiff} from './center-audit-diff';
import { applyCategoryGrant } from './center-category-grants';
import {deleteUnassignedRole,roleBoundEmployees} from './center-role-delete';
import './center.css';
import { buildCenterCatalog, type Catalog } from './center-catalog';
import { esc, renderPermissionEditor } from './center-editor';
import {effectiveMenuView} from './center-effective-menu';
import {rolePageRoute} from './center-role-route';
import {normalizePermissionCenterPath} from './center-routes';
import {applySubmenuMode} from './center-page-mode';
import {bindDialogBackdropClose} from './center-dialog-backdrop';
import {renderStaffRoles,renderScope,scopeStoreItems,scopeLabel,applicableRoles,updateBindingScope} from './center-staff-roles';
import { readCenterState, saveCenterState, centerStores,centerBrands } from './center-store';
import {bindScopePicker,scopePickerOptions,renderGroupedScope} from './center-scope-picker';
import { resolveAccess, roleAccess, validateInvite, validateRole, type Access, type CenterState, type Audit, type Employee, type Role } from './center-domain';
import { getUserSessionContext } from '../auth/session-permissions';
import { authorizationRows } from './center-authorization';
import {applyPageAuthorization,applyPageResourceGrant,assertPageFeatureChoice} from './center-page-policy';

const roleDescription=(description:string)=>description==='门店全量管理，含财务与报表操作'?'':description;
const statusLabels: Record<Employee['status'],string> = {unopened:'未开通',pending:'待接受邀请',revoked:'邀请已撤销',enabled:'已启用',disabled:'已停用'};
let leaveGuard: (()=>boolean)|undefined;
let activeHash='';
window.addEventListener('beforeunload',e=>{if(leaveGuard){e.preventDefault();e.returnValue='';}});
window.addEventListener('hashchange',e=>{
  if(leaveGuard && location.hash!==activeHash && !leaveGuard()) {
    e.stopImmediatePropagation(); history.replaceState(null,'',activeHash);return;
  }
  leaveGuard=undefined;
},true);
export function renderCenterPage(path:string):string {
  return `<div class="pc" id="permission-center" data-path="${esc(path)}"><div class="pc-empty">正在加载权限中心…</div></div>`;
}
export function bindCenterPage(): void {
  const root=document.getElementById('permission-center');if(!root)return;
  let state:CenterState;
  try{state=readCenterState();}catch(e){root.innerHTML=`<div class="pc-error">${esc((e as Error).message)}</div>`;return;}
  const catalog:Catalog=buildCenterCatalog(),stores=centerStores(),brandNames=centerBrands();
  let path=normalizePermissionCenterPath(root.dataset.path??'/permissions/roles');
  if(path==='/permissions/staff-accounts')path='/permissions/staff';
  let draft=structuredClone(state),dirty=false,storeId=stores[0]?.id??'',tab='permissions';
  let page=[...catalog.resources.values()].find(r=>r.type==='page')?.key??'',group='',menuSearch='',query='',filter='';
  const roleRoute=rolePageRoute(path),roleId=roleRoute?.id??'',roleView=roleRoute?.readonly??false;
  const employeeId=path.startsWith('/permissions/staff/')?decodeURIComponent(path.slice('/permissions/staff/'.length)):'';
  const isDetail=!!roleId||!!employeeId;
  const role=()=>draft.roles.find(r=>r.id===roleId);
  const employee=()=>draft.employees.find(e=>e.id===employeeId);
  const actor=()=>getUserSessionContext()?.employeeName??'本地管理员';
  const memberCount=(id:string)=>state.employees.filter(e=>e.bindings.some(b=>b.roleId===id)).length;
  const btn=(label:string,action:string,cls='')=>`<button type="button" class="${cls}" data-do="${action}">${label}</button>`;
  const link=(label:string,url:string)=>`<a class="pc-link" href="#${url}">${label}</a>`;
  const title=path.includes('/roles')?'角色与功能权限':path.includes('/staff')?'员工与账号':path.includes('/change-log')?'变更记录':'权限管理中心';
  const mark=()=>{dirty=true;activeHash=location.hash;leaveGuard=()=>confirm('有未保存的修改，确定放弃并离开？');};
  const value=(key:string):Access=>roleId&&role()?roleAccess(role()!,key,catalog.resources):resolveAccess(draft,employeeId,storeId,key,stores,catalog.resources);
  function editor(preview=false,selectedPage=page,selectedGroup=group,search=menuSearch):string {
    if(employeeId||roleView){
      const view=effectiveMenuView(catalog,value,selectedPage);
      if(view.page!==selectedPage)selectedGroup='';
      selectedPage=view.page;
      if(!preview){page=selectedPage;group=selectedGroup;}
    }
    return renderPermissionEditor({catalog,page:selectedPage,group:selectedGroup,preview,readonly:!!employeeId||roleView,staff:false,effectiveOnly:!!employeeId||roleView,grantedOnly:roleView,emptyMessage:roleView?'该角色暂无可访问菜单':undefined,value,own:key=>employeeId?'inherit':(role()?.grants[key]??catalog.resources.get(key)?.defaultAccess??'hidden'),parentInherited:key=>{const r=catalog.resources.get(key);const g=role()?.grants;return !employeeId&&!!r?.inheritFrom&&(g?.[r.parentChoiceKey!]==='read'||!employeeId&&g?.[key]===undefined);},search});
  }
  function logs(objectId?:string):string {
    const showEmployee=!objectId&&path.includes('/change-log');
    const rows=state.logs.filter(l=>!isRoleOnlyMigrationAudit(l)&&(!objectId||l.objectId===objectId)&&(!query||`${l.actor} ${l.action} ${l.objectId}${showEmployee?' '+auditEmployeeName(l,state):''}`.includes(query)));
    return `<table><thead><tr><th>时间</th><th>操作人</th>${showEmployee?'<th>授权员工</th>':''}<th>操作</th><th>变更内容</th></tr></thead><tbody>${rows.map(l=>`<tr><td>${esc(new Date(l.at).toLocaleString())}</td><td>${esc(l.actor)}</td>${showEmployee?`<td>${esc(auditEmployeeName(l,state))}</td>`:''}<td>${esc(l.action)}</td><td><button type="button" data-log-id="${esc(l.id)}">查看前后值</button></td></tr>`).join('')||`<tr><td colspan="${showEmployee?5:4}" class="pc-empty">暂无变更记录</td></tr>`}</tbody></table>`;
  }
  function logDetail(id:string):void {
    const log=state.logs.find(row=>row.id===id);
    if(!log){error('该变更记录不存在，请刷新后重试');return;}
    changeDetail(log);
  }
  function changeDetail(log:Audit,pending=false):void {
    const dialog=modal('变更详情',`${log.source==='demo'?'<p class="pc-notice">演示记录，仅用于展示示例，不代表真实操作历史。</p>':''}<dl class="pc-log-meta">${pending?'':`<div><dt>时间</dt><dd>${esc(new Date(log.at).toLocaleString())}</dd></div>`}<div><dt>操作人</dt><dd>${esc(log.actor)}</dd></div><div><dt>操作</dt><dd>${esc(log.action)}</dd></div></dl>${renderAuditDiff(log,{state,stores,brands:centerBrands(),resources:catalog.resources})}`,()=>true,'关闭');
    dialog.classList.add('pc-log-dialog');
    dialog.setAttribute('aria-label','变更详情');
    dialog.querySelector('footer [data-close]')?.remove();
  }
  function staffDetail():string {
    const e=employee();if(!e)return '<div class="pc-empty">员工不存在</div>';
    const tabs=`<div class="pc-tabs">${[['permissions','门店与权限'],['account','登录与安全'],['logs','变更记录']].map(([v,l])=>`<button data-tab="${v}" class="${tab===v?'active':''}">${l}</button>`).join('')}</div>`;
    if(tab==='logs')return tabs+`<div class="pc-card">${logs(e.id)}</div>`;
    if(tab==='account')return tabs+`<section class="pc-card"><h2>登录与安全</h2><p>登录邮箱：${esc(e.email)||'—'}</p><p>账号状态：<span class="pc-tag">${statusLabels[e.status]}</span></p><div class="pc-actions">${e.status==='pending'||e.status==='revoked'?btn('重新发送邀请','resend'):''}${e.status==='pending'?btn('撤销邀请','revoke','danger'):''}${e.status==='enabled'||e.status==='disabled'?btn(e.status==='enabled'?'停用账号':'启用账号','toggle-account'):''}</div></section>`;
    return tabs+renderStaffRoles(e,draft.roles,stores);
  }
  function render():void {
    const scroll=new Map([...root!.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll!,el.scrollTop]));
    const expanded=new Map([...root!.querySelectorAll<HTMLDetailsElement>('[data-menu-node]')].map(el=>[el.dataset.menuNode!,el.open]));
    if(isDetail){
      root!.innerHTML=`<section class="pc-full"><header class="pc-heading"><div class="pc-actions">${btn('← 返回','back')}<h1>${esc(role()?.name??employee()?.name??'记录不存在')}</h1><span class="pc-tag">${roleView?'查看权限':roleId?'编辑权限':'员工管理'}</span></div></header><div class="pc-content">${roleId?(role()?`<div class="pc-toolbar"><h3>${roleView?'当前角色生效权限':'功能权限'}</h3><div class="pc-actions">${roleView?link('编辑权限',`/permissions/roles/edit/${encodeURIComponent(roleId)}`):''}${roleView?'':btn('查看菜单效果','preview')}</div></div>${editor()}`:'<div class="pc-empty">角色不存在</div>'):staffDetail()}</div>${roleView?`<footer class="pc-footer"><span class="pc-muted">仅展示当前角色实际生效的菜单与已授权功能</span>${btn('返回角色列表','back')}</footer>`:`<footer class="pc-footer"><span>${dirty?'有未保存修改':'所有修改已保存'}</span><div class="pc-actions">${btn('取消','cancel')}${btn('保存更改','save','primary')}</div></footer>`}</section>`;
    }else{
      let body='';
      if(path.includes('/roles'))body=`<div class="pc-toolbar"><input data-query aria-label="搜索角色" placeholder="搜索角色名称" value="${esc(query)}">${btn('新建角色','create-role','primary')}</div><div class="pc-card"><table><thead><tr><th>角色</th><th>描述</th><th>成员数</th><th>操作</th></tr></thead><tbody>${state.roles.filter(r=>r.name.includes(query)).map(r=>`<tr><td><strong>${link(esc(r.name),`/permissions/roles/view/${encodeURIComponent(r.id)}`)}</strong></td><td>${esc(roleDescription(r.description))||'—'}</td><td><button data-members="${esc(r.id)}">${memberCount(r.id)} 人</button></td><td><div class="pc-actions"><button data-role-info="${esc(r.id)}">编辑角色</button>${link('编辑权限',`/permissions/roles/edit/${encodeURIComponent(r.id)}`)}<button data-copy="${esc(r.id)}">复制</button><button class="danger" data-delete="${esc(r.id)}">删除</button></div></td></tr>`).join('')||'<tr><td colspan="4" class="pc-empty">暂无匹配角色</td></tr>'}</tbody></table></div>`;
      else if(path.includes('/staff'))body=`<div class="pc-toolbar"><div class="pc-actions"><input data-query aria-label="搜索员工" placeholder="员工姓名或邮箱" value="${esc(query)}"><select data-status aria-label="账号状态"><option value="">全部账号状态</option>${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></div>${btn('邀请员工','invite','primary')}</div><div class="pc-card"><table><thead><tr><th>员工</th><th>登录邮箱</th><th>账号状态</th><th>门店角色</th><th>操作</th></tr></thead><tbody>${state.employees.filter(e=>(!filter||e.status===filter)&&`${e.name} ${e.email}`.toLowerCase().includes(query.toLowerCase())).map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.email)||'—'}</td><td><span class="pc-tag">${statusLabels[e.status]}</span></td><td>${e.migrationReview?'待复核':e.bindings.map(b=>esc(state.roles.find(r=>r.id===b.roleId)?.name??'失效角色')).join('、')||'未授权'}</td><td>${link('管理详情',`/permissions/staff/${encodeURIComponent(e.id)}`)}</td></tr>`).join('')||'<tr><td colspan="5" class="pc-empty">暂无匹配员工</td></tr>'}</tbody></table></div>`;
      else if(path.includes('/change-log'))body=`<input data-query aria-label="筛选变更记录" placeholder="操作人、授权员工、操作或对象编号" value="${esc(query)}"><div class="pc-card">${logs()}</div>`;
      else body='<div class="pc-empty">未找到页面</div>';
      root!.innerHTML=`<header class="pc-heading"><h1>${title}</h1></header>${body}`;
    }
    for(const el of root!.querySelectorAll<HTMLElement>('[data-scroll]'))el.scrollTop=scroll.get(el.dataset.scroll!)??0;
    for(const el of root!.querySelectorAll<HTMLDetailsElement>('[data-menu-node]'))if(expanded.has(el.dataset.menuNode!))el.open=expanded.get(el.dataset.menuNode!)!;
  }
  function error(message:string):void{modal('操作未完成',`<p class="pc-error">${esc(message)}</p>`,()=>true,'知道了');}
  function modal(title:string,body:string,submit:(dialog:HTMLDialogElement)=>boolean,primary='确认'):HTMLDialogElement {
    const trigger=document.activeElement as HTMLElement|null;
    const dialog=document.createElement('dialog');dialog.className='pc-dialog';
    dialog.innerHTML=`<form class="pc"><header class="pc-heading"><h2>${esc(title)}</h2><button type="button" data-close aria-label="关闭">×</button></header><div class="pc-form">${body}</div><div class="pc-error" role="alert" data-error></div><footer><button type="button" data-close>取消</button><button type="submit" class="primary">${primary}</button></footer></form>`;
    document.body.append(dialog);dialog.showModal();
    // Keep native Escape-to-close, without triggering the shell's navigation redraw.
    dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape')ev.stopPropagation();});
    dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',ev=>{if((ev.target as Element).closest('a[href]'))dialog.close();});
    dialog.addEventListener('close',()=>{dialog.remove();trigger?.focus();});
    dialog.querySelector('form')!.addEventListener('submit',ev=>{ev.preventDefault();try{if(submit(dialog))dialog.close();}catch(e){dialog.querySelector('[data-error]')!.textContent=(e as Error).message;}});
    return dialog;
  }
  const field=(d:HTMLDialogElement,id:string)=>(d.querySelector(`[name="${id}"]`) as HTMLInputElement|HTMLSelectElement).value;
  function commit(next:CenterState,id:string,action:string):void {state=saveCenterState(next,state.version,id,action,actor());draft=structuredClone(state);dirty=false;leaveGuard=undefined;render();}
  function roleDialog(id='',copy=false):void {
    const original=state.roles.find(r=>r.id===id);
    modal(copy?'复制角色':original?'编辑角色':'新建角色',`<label>角色名称<input name="name" required maxlength="30" value="${esc(original?(copy?original.name+' 副本':original.name):'')}"></label><label>描述<textarea name="description" maxlength="160">${esc(original?.description??'')}</textarea></label>${!original?`<label>初始功能权限<select name="source"><option value="">空白权限（默认拒绝）</option>${state.roles.map(r=>`<option value="${esc(r.id)}">复制 ${esc(r.name)}</option>`).join('')}</select></label>`:''}`,d=>{
      const source=original??state.roles.find(r=>r.id===field(d,'source'));
      const row:Role={id:original&&!copy?original.id:crypto.randomUUID(),name:field(d,'name').trim(),description:field(d,'description'),system:original&&!copy?original.system:false,grants:structuredClone(source?.grants??{})};
      validateRole(state,row);const next=structuredClone(state);next.roles=next.roles.filter(r=>r.id!==row.id).concat(row);commit(next,row.id,original&&!copy?'编辑角色':copy?'复制角色':'新增角色');return true;
    },'保存');
  }
  function invite():void {
    modal('邀请员工',`<label>员工姓名<input name="name" required maxlength="30" autocomplete="name"></label><label>员工邮箱<input name="email" required type="email" maxlength="254" autocomplete="email" placeholder="name@example.com"></label>`,d=>{
      const name=field(d,'name').trim(),email=field(d,'email').trim().toLowerCase();validateInvite(state,name,email);
      const id=crypto.randomUUID(),next=structuredClone(state);next.employees.push({id,name,email,status:'pending',bindings:[],overrides:{}});commit(next,id,'发起邀请（本地模拟，未发送邮件）');return true;
    },'记录邀请');
  }
  function assign():void {
    if(!employee())return;
    const dialog=modal('分配角色 · 选择范围',`<div class="pc-role-picker"><label>角色<select name="role" required><option value="">请选择角色</option>${draft.roles.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('')}</select></label><button type="button" data-view-selected-role disabled>查看角色权限</button></div><label>授权范围<select name="mode">${scopePickerOptions()}</select></label><div data-scope-options></div>`,d=>{
      const roleId=field(d,'role'),scope=readScope();
      if(!roleId)throw Error('请选择角色');
      modal('确认分配角色',`<p>员工：${esc(employee()!.name)}</p><p>角色：${esc(draft.roles.find(r=>r.id===roleId)?.name)}</p><p>授权范围：${field(d,'mode')==='brand-stores'?'品牌 / 已选门店':esc(scopeLabel(scope))}</p>${renderGroupedScope(scope,stores,brandNames)}${scope.mode==='stores'?'<p>按已选门店授权，未来新增门店不自动加入。</p>':''}`,()=>{employee()!.bindings.push({id:crypto.randomUUID(),roleId,scope});employee()!.migrationReview=false;mark();render();return true;},'确定').classList.add('pc-assignment-confirm');return true;
    },'下一步');
    const readScope=bindScopePicker(dialog,{mode:'stores',ids:storeId?[storeId]:[]},stores,brandNames);
    dialog.classList.add('pc-assignment-dialog');
    dialog.querySelector('[name="role"]')!.addEventListener('change',()=>{(dialog.querySelector('[data-view-selected-role]') as HTMLButtonElement).disabled=!draft.roles.some(r=>r.id===field(dialog,'role'));});
    dialog.addEventListener('click',ev=>{if((ev.target as Element).closest('[data-view-selected-role]'))showRolePermissions(field(dialog,'role'));});
  }
  function editBinding(id:string):void {
    const binding=employee()?.bindings.find(b=>b.id===id);if(!binding)return;
    const dialog=modal('修改授权门店',`<p>员工：${esc(employee()!.name)} · 角色：${esc(draft.roles.find(r=>r.id===binding.roleId)?.name??'已失效角色')}</p><label>授权范围<select name="mode">${scopePickerOptions(binding.scope)}</select></label><div data-scope-options></div><p class="pc-muted">仅修改这条角色授权的门店范围，不影响其他角色；保存员工详情后生效。</p>`,()=>{
      const scope=readScope();
      const apply=()=>{if(updateBindingScope(employee()!,id,scope)){mark();render();}return true;};
      if((binding.scope.mode==='brands'||binding.scope.mode==='regions')&&scope.mode!==binding.scope.mode){
        modal('确认更改授权范围',`<p>原授权为${esc(scopeLabel(binding.scope))}，本次确认后将改为${esc(scopeLabel(scope))}。</p>${renderGroupedScope(scope,stores,brandNames)}<p>按已选门店授权，未来新增门店不自动加入。保存员工详情后生效。</p>`,apply,'确定');return true;
      }
      return apply();
    },'确定');const readScope=bindScopePicker(dialog,binding.scope,stores,brandNames);
  }
  function showBindingStores(id:string):void {
    const binding=employee()?.bindings.find(b=>b.id===id);
    if(!binding){error('该角色授权不存在，请重新打开员工详情');return;}
    const name=draft.roles.find(r=>r.id===binding.roleId)?.name??'已失效角色';
    const count=scopeStoreItems(binding.scope,stores).length;
    const dialog=modal('授权门店',`<p>角色：<strong>${esc(name)}</strong></p><p>${esc(scopeLabel(binding.scope))} · 共 ${count} 家门店</p><div class="pc-authorized-stores">${renderScope(binding.scope,stores,true)}</div>`,()=>true,'关闭');
    dialog.classList.add('pc-scope-dialog');dialog.setAttribute('aria-label','授权门店');
    dialog.querySelector('footer [data-close]')?.remove();
  }
  function showRolePermissions(id:string):void {
    const r=draft.roles.find(r=>r.id===id);if(!r){error('角色不存在');return;}
    const roleValue=(key:string)=>roleAccess(r,key,catalog.resources);
    let selected=effectiveMenuView(catalog,roleValue,'').page,category='',search='';
    const body=()=>renderPermissionEditor({catalog,page:selected,group:category,search,preview:false,readonly:true,staff:false,effectiveOnly:true,grantedOnly:true,emptyMessage:'该角色暂无可访问菜单',value:roleValue,own:key=>r.grants[key]??'hidden'});
    const dialog=modal(`${r.name} · 角色权限`,`${r.description&&!roleDescription(r.description)?'':`<p>${esc(roleDescription(r.description))||'该角色暂无描述'}</p>`}<div data-role-permissions>${body()}</div>`,()=>true,'关闭');dialog.classList.add('pc-role-permissions');
    const area=dialog.querySelector<HTMLElement>('[data-role-permissions]')!;
    area.addEventListener('click',ev=>{const b=(ev.target as Element).closest<HTMLElement>('[data-page],[data-group]');if(!b)return;ev.preventDefault();if(b.dataset.page){selected=b.dataset.page;category='';}if(b.dataset.group)category=b.dataset.group;area.innerHTML=body();[...area.querySelectorAll<HTMLButtonElement>('[data-page],[data-group]')].find(x=>b.dataset.group?x.dataset.group===category:x.dataset.page===selected)?.focus({preventScroll:true});});
    area.addEventListener('input',ev=>{const input=ev.target as HTMLInputElement;if(!input.hasAttribute('data-menu-search'))return;search=input.value;const pos=input.selectionStart;area.innerHTML=body();const next=area.querySelector<HTMLInputElement>('[data-menu-search]');next?.focus();next?.setSelectionRange(pos,pos);});
  }
  function showStaffEffective():void {
    const e=employee();if(!e)return;
    let selected=page,category='',search='';
    const content=()=>{
      selected=effectiveMenuView(catalog,value,selected).page;
      const current=stores.find(s=>s.id===storeId),roles=applicableRoles(e,draft.roles,current);
      const empty=!current?'暂无可选门店，暂时无法查看门店生效权限':roles.length?`当前门店匹配到 ${roles.length} 个角色，但合并后暂无可访问菜单，请检查角色权限配置。`:'该员工在当前门店暂无适用角色，请先分配角色。';
      return `<div class="pc-toolbar"><label>查看门店<select data-effective-store ${stores.length?'':'disabled'}>${stores.length?stores.map(s=>`<option value="${esc(s.id)}" ${s.id===storeId?'selected':''}>${esc(s.title)}</option>`).join(''):'<option>暂无可选门店</option>'}</select></label></div><p>当前生效角色：${roles.map(r=>`<span class="pc-tag">${esc(r.name)}</span>`).join('')||'<span class="pc-muted">暂无适用角色</span>'}</p>${renderPermissionEditor({catalog,page:selected,group:category,search,preview:false,readonly:true,staff:false,effectiveOnly:true,emptyMessage:empty,value,own:()=> 'inherit'})}`;
    };
    const dialog=modal(`${e.name} · 员工生效权限`,`<div data-effective-content>${content()}</div>`,()=>true,'关闭');dialog.classList.add('pc-effective-drawer');
    bindDialogBackdropClose(dialog);
    const area=dialog.querySelector<HTMLElement>('[data-effective-content]')!;
    const redraw=()=>{const scroll=new Map([...area.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll!,el.scrollTop]));area.innerHTML=content();for(const el of area.querySelectorAll<HTMLElement>('[data-scroll]'))el.scrollTop=scroll.get(el.dataset.scroll!)??0;};
    area.addEventListener('change',ev=>{const input=ev.target as HTMLSelectElement;if(!input.hasAttribute('data-effective-store'))return;storeId=input.value;category='';search='';redraw();area.querySelector<HTMLSelectElement>('[data-effective-store]')?.focus();});
    area.addEventListener('click',ev=>{const b=(ev.target as Element).closest<HTMLElement>('[data-page],[data-group]');if(!b||b.hasAttribute('disabled'))return;ev.preventDefault();if(b.dataset.page){selected=b.dataset.page;category='';}if(b.dataset.group)category=b.dataset.group;redraw();const selector=b.dataset.group?'[data-group]':'[data-page]';[...area.querySelectorAll<HTMLButtonElement>(selector)].find(x=>b.dataset.group?x.dataset.group===category:x.dataset.page===selected)?.focus({preventScroll:true});});
    area.addEventListener('input',ev=>{const input=ev.target as HTMLInputElement;if(!input.hasAttribute('data-menu-search'))return;search=input.value;const pos=input.selectionStart;redraw();const next=area.querySelector<HTMLInputElement>('[data-menu-search]');next?.focus();next?.setSelectionRange(pos,pos);});
  }
  function preview():void {
    let previewPage=page,previewGroup=group,previewSearch='';
    const first=[...catalog.resources.values()].find(r=>r.type==='page'&&value(r.key)!=='hidden');if(value(previewPage)==='hidden')previewPage=first?.key??'';
    const previewEditor=()=>editor(true,previewPage,previewGroup,previewSearch);
    const dialog=modal('菜单效果预览',`<p class="pc-preview-note">当前草稿${employeeId?' · '+esc(stores.find(s=>s.id===storeId)?.title):''}；仅展示权限，不执行真实业务操作。</p><div data-preview>${previewEditor()}</div>`,()=>true,'关闭');dialog.classList.add('pc-preview');
    const area=dialog.querySelector<HTMLElement>('[data-preview]')!;
    area.addEventListener('click',ev=>{const target=(ev.target as Element).closest<HTMLElement>('[data-page],[data-group],[data-demo]');if(!target)return;if(target.hasAttribute('data-demo'))return;ev.preventDefault();if(target.dataset.page){previewPage=target.dataset.page;previewGroup='';}if(target.dataset.group)previewGroup=target.dataset.group;const scroll=new Map([...area.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll!,el.scrollTop]));const expanded=new Map([...area.querySelectorAll<HTMLDetailsElement>('[data-menu-node]')].map(el=>[el.dataset.menuNode!,el.open]));area.innerHTML=previewEditor();for(const el of area.querySelectorAll<HTMLElement>('[data-scroll]'))el.scrollTop=el.dataset.scroll==='settings'?0:scroll.get(el.dataset.scroll!)??0;for(const el of area.querySelectorAll<HTMLDetailsElement>('[data-menu-node]'))if(expanded.has(el.dataset.menuNode!))el.open=expanded.get(el.dataset.menuNode!)!;
      // Replaced buttons lose focus to body: keep Escape inside the preview dialog.
      [...area.querySelectorAll<HTMLButtonElement>('[data-page],[data-group]')].find(b=>target.dataset.group?b.dataset.group===previewGroup:b.dataset.page===previewPage)?.focus({preventScroll:true});
    });
    area.addEventListener('input',ev=>{if((ev.target as HTMLElement).hasAttribute('data-menu-search')){previewSearch=(ev.target as HTMLInputElement).value;const pos=(ev.target as HTMLInputElement).selectionStart;area.innerHTML=previewEditor();const input=area.querySelector<HTMLInputElement>('[data-menu-search]')!;input.focus();input.setSelectionRange(pos,pos);}});
  }
  root.addEventListener('click',ev=>{
    const b=(ev.target as Element).closest<HTMLElement>('button');if(!b||b.hasAttribute('disabled'))return;
    try{
      if(b.dataset.logId){logDetail(b.dataset.logId);return;}
      if(roleView && !(b.dataset.page||b.dataset.group||['back','preview'].includes(b.dataset.do??'')))return;
      if(employeeId&&(b.dataset.authorization||b.dataset.categoryGrant||b.dataset.grant||b.dataset.submenuMode))return;
      if(b.dataset.submenuMode){ev.preventDefault();if(!role())return;const v=b.dataset.value;if(v!=='hidden'&&v!=='read'&&v!=='edit')throw Error('子导航状态无效');if(applySubmenuMode(catalog,role()!,page,b.dataset.submenuMode,v)){mark();render();}return;}
      if(b.dataset.page){ev.preventDefault();page=b.dataset.page;group='';const list=root.querySelector('[data-scroll="settings"]');if(list)list.scrollTop=0;render();return;}
      if(b.dataset.group){group=b.dataset.group;const list=root.querySelector('[data-scroll="settings"]');if(list)list.scrollTop=0;render();return;}
      if(b.dataset.tab){tab=b.dataset.tab;render();return;}
      if(b.dataset.authorization){ev.preventDefault();const row=authorizationRows(catalog,page).find(r=>r.contentKey===b.dataset.authorization);if(!row)return;const v=b.dataset.value as Access|'inherit';assertPageFeatureChoice(page,row,v,value);if(page!=='page:/operations/queue-call/buffet-rules'&&(v==='edit'||row.mode==='visibility'&&v==='read'))for(const key of [row.contentKey,...row.editKeys])assertSettingChoice(catalog,catalog.resources.get(key)!,'edit',value);if(employeeId)return;if(role()&&v!=='inherit')applyPageAuthorization(catalog,page,role()!.grants,row,v);else return;mark();render();return;}
      if(b.dataset.categoryGrant){ev.preventDefault();if(employeeId)return;const v=b.dataset.value as Access|'inherit';if(role()&&v!=='inherit')applyCategoryGrant(catalog,page,b.dataset.categoryGrant,role()!.grants,v);else return;mark();render();return;}
      if(b.dataset.grant){ev.preventDefault();const key=b.dataset.grant,v=b.dataset.value as Access|'inherit';if(catalog.resources.get(key)?.type==='action'&&value(page)==='hidden'&&v!=='hidden')throw Error('页面不可见，不能开启功能授权');assertSettingChoice(catalog,catalog.resources.get(key)!,v,value);if(employeeId)return;if(role()&&v!=='inherit')applyPageResourceGrant(catalog,page,role()!.grants,catalog.resources.get(key)!,v);else return;mark();render();return;}
      if(b.dataset.roleInfo){roleDialog(b.dataset.roleInfo);return;}
      if(b.dataset.viewBindingStores){showBindingStores(b.dataset.viewBindingStores);return;}
      if(b.dataset.viewRole){showRolePermissions(b.dataset.viewRole);return;}
      if(b.dataset.editBinding){editBinding(b.dataset.editBinding);return;}
      if(b.dataset.copy){roleDialog(b.dataset.copy,true);return;}
      if(b.dataset.members){modal('角色成员',state.employees.filter(e=>e.bindings.some(x=>x.roleId===b.dataset.members)).map(e=>`<p>${link(esc(e.name),`/permissions/staff/${encodeURIComponent(e.id)}`)}</p>`).join('')||'<p>暂无成员</p>',()=>true,'关闭');return;}
      if(b.dataset.delete){const id=b.dataset.delete, members=roleBoundEmployees(state,id);if(members.length){modal('暂不能删除角色',`<p>当前角色已被以下 ${members.length} 位员工绑定，请先解除角色分配，再删除角色。</p><ul>${members.map(e=>`<li>${esc(e.name)}${e.email?`（${esc(e.email)}）`:''}</li>`).join('')}</ul>`,()=>true,'知道了');return;}modal('删除角色','<p>删除后无法恢复，确定删除此角色？</p>',()=>{const next=deleteUnassignedRole(state,id);commit(next,id,'删除角色');return true;},'删除');return;}
      if(b.dataset.removeBinding){const binding=employee()?.bindings.find(x=>x.id===b.dataset.removeBinding);if(!binding)return;modal('解除角色授权',`<p>员工：${esc(employee()!.name)}</p><p>解除角色：${esc(draft.roles.find(r=>r.id===binding.roleId)?.name??'已失效角色')}</p>${renderScope(binding.scope,stores,true)}`,()=>{employee()!.bindings=employee()!.bindings.filter(x=>x.id!==binding.id);mark();render();return true;},'解除角色');return;}
      switch(b.dataset.do){
        case 'create-role':roleDialog();break;
        case 'invite':invite();break;
        case 'preview':preview();break;
        case 'assign':assign();break;
        case 'staff-effective':showStaffEffective();break;

        case 'back':case 'cancel':if(!dirty||confirm('放弃未保存的修改？')){dirty=false;leaveGuard=undefined;location.hash=roleId?'/permissions/roles':'/permissions/staff';}break;
        case 'save':{
          if(!dirty)return;
          const id=roleId||employeeId,old=roleId?state.roles.find(r=>r.id===id):state.employees.find(e=>e.id===id),next=roleId?role():employee();
          const action=roleId?'更新角色权限':'更新员工授权';
          const pendingChange:Audit={id:'draft',at:'',actor:actor(),objectId:id,action,before:JSON.stringify(old??null),after:JSON.stringify(next??null)};
          const confirmation=modal('确认保存更改',`<p>${roleId?`影响 ${memberCount(id)} 位已绑定员工。`:'仅更新当前员工的草稿，包含已编辑的各门店。'}</p><button type="button" data-view-pending-change>查看变更前后值</button>`,()=>{commit(draft,id,action);return true;},'确认保存');
          confirmation.querySelector('[data-view-pending-change]')!.addEventListener('click',()=>changeDetail(pendingChange,true));break;
        }
        case 'resend':case 'revoke':case 'toggle-account':{
          const e=employee();if(!e)return;const action=b.dataset.do;
          const nextStatus=action==='resend'?'pending':action==='revoke'?'revoked':e.status==='enabled'?'disabled':'enabled';
          modal(action==='resend'?'重新记录邀请':action==='revoke'?'撤销邀请':'变更账号状态','<p>仅修改本地工作台状态，不调用真实账号服务。角色及门店范围保留；保存员工详情后记录此变更。</p>',()=>{e.status=nextStatus;mark();render();return true;},'加入草稿');break;
        }
      }
    }catch(e){error((e as Error).message);}
  });
  root.addEventListener('input',ev=>{
    const target=ev.target as HTMLInputElement;if(!target.matches('[data-query],[data-menu-search]'))return;
    const isMenu=target.hasAttribute('data-menu-search');if(isMenu)menuSearch=target.value;else query=target.value;
    const position=target.selectionStart;render();const input=root.querySelector<HTMLInputElement>(isMenu?'[data-menu-search]':'[data-query]');input?.focus();input?.setSelectionRange(position,position);
  });
  root.addEventListener('change',ev=>{const target=ev.target as HTMLSelectElement;if(target.hasAttribute('data-store')){storeId=target.value;render();}if(target.hasAttribute('data-status')){filter=target.value;render();}});
  render();
  if(path==='/permissions/roles/new')roleDialog();
}
import {assertSettingChoice} from './center-setting-levels';
