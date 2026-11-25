import {accountExtraStoreIds,accessibleEmployeeStores,roleBindingScope,type Scope} from './center-domain';
import {renderRoleTree,visibleRoleTree,treeChoices} from './center-role-tree';
import {createRoleTreeState,buildRoleTree,flattenRoleTree,roleSelectionTargets,roleSelectionState,toggleRoleSelection,roleTreePath,applyTreeChoice,applyTreeBatch,treeSelection,treeChanged} from './center-role-tree-model';
import {listStaffLoginAccounts} from './staff-account-store';
import {openCenterAccount,deleteCenterAccount} from './center-account-opening';
import {accountOpeningFields,accountPasswordFields,bindAccountOpening,invitationStatus} from './account-opening-ui';
import {renderStandalonePageHeader} from '../ui/standalone-page-header';
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
import {renderStaffRoles,renderScope,scopeStoreItems,scopeLabel,applicableRoles} from './center-staff-roles';
import { readCenterState, saveCenterState, centerStores,centerBrands } from './center-store';
import {bindScopePicker} from './center-scope-picker';
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
  let draft=structuredClone(state),dirty=false,storeId=stores[0]?.id??'';
  let page=[...catalog.resources.values()].find(r=>r.type==='page')?.key??'',group='',menuSearch='',query='',filter='';
  const roleRoute=rolePageRoute(path),roleId=roleRoute?.id??'',roleView=roleRoute?.readonly??false;
  const staffRoute=/^\/permissions\/staff\/([^/]+)(?:\/(authorization|security|records))?$/.exec(path);
  let employeeId='';
  try{employeeId=staffRoute?decodeURIComponent(staffRoute[1]):'';}catch{/* Invalid employee URL. */}
  const staffView=staffRoute?.[2]??'overview';
  const staffPath=(id:string)=>'/permissions/staff/'+encodeURIComponent(id);
  const staffEditable=staffView==='authorization'&&!!employeeId;
  const isDetail=!!roleId||path.startsWith('/permissions/staff/');
  const role=()=>draft.roles.find(r=>r.id===roleId);
  const roleTree=createRoleTreeState();
  const treeNodes=roleId&&!roleView?buildRoleTree(catalog):[];
  for(const n of flattenRoleTree(treeNodes))if(n.kind==='page'&&n.children.length)roleTree.collapsed.add(n.id);
  const treeNode=(id:string)=>flattenRoleTree(treeNodes).find(n=>n.id===id);
  const originalRole=()=>state.roles.find(r=>r.id===roleId)!;
  const employee=()=>draft.employees.find(e=>e.id===employeeId);
  const accountStatus=(e:Employee,a=listStaffLoginAccounts().find(a=>a.employeeId===e.id))=>a?.invitation?invitationStatus(a):statusLabels[e.status];
  const actor=()=>getUserSessionContext()?.employeeName??'本地管理员';
  const memberCount=(id:string)=>state.employees.filter(e=>e.bindings.some(b=>b.roleId===id)).length;
  const btn=(label:string,action:string,cls='')=>`<button type="button" class="${cls}" data-do="${action}">${label}</button>`;
  const link=(label:string,url:string)=>`<a class="pc-link" href="#${url}">${label}</a>`;
  const title=path.includes('/roles')?'角色与功能权限':path.includes('/staff')?'员工与账号':path.includes('/change-log')?'变更记录':'权限管理中心';
  const mark=()=>{dirty=true;activeHash=location.hash;leaveGuard=()=>confirm('有未保存的修改，确定放弃并离开？');};
  const value=(key:string):Access=>roleId&&role()?roleAccess(role()!,key,catalog.resources):resolveAccess(draft,employeeId,storeId,key,stores,catalog.resources);
  function editor(preview=false,selectedPage=page,selectedGroup=group,search=menuSearch):string {
    if(!preview&&roleId&&!roleView&&role())return renderRoleTree(catalog,role()!,originalRole(),roleTree);
    if(employeeId||roleView){
      const view=effectiveMenuView(catalog,value,selectedPage);
      if(view.page!==selectedPage)selectedGroup='';
      selectedPage=view.page;
      if(!preview){page=selectedPage;group=selectedGroup;}
    }
    return renderPermissionEditor({catalog,page:selectedPage,group:selectedGroup,preview,readonly:!!employeeId||roleView,staff:false,effectiveOnly:!!employeeId||roleView,grantedOnly:roleView,emptyMessage:roleView?'该角色暂无可访问菜单':undefined,value,own:key=>employeeId?'inherit':(role()?.grants[key]??catalog.resources.get(key)?.defaultAccess??'hidden'),parentInherited:key=>{const r=catalog.resources.get(key);const g=role()?.grants;return !employeeId&&!!r?.inheritFrom&&(g?.[r.parentChoiceKey!]==='read'||!employeeId&&g?.[key]===undefined);},search});
  }
  function logs(objectId?:string,limit?:number):string {
    const showEmployee=!objectId&&path.includes('/change-log');
    const rows=state.logs.filter(l=>!isRoleOnlyMigrationAudit(l)&&(!objectId||l.objectId===objectId)&&(!query||`${l.actor} ${l.action} ${l.objectId}${showEmployee?' '+auditEmployeeName(l,state):''}`.includes(query)));
    return `<table><thead><tr><th>时间</th><th>操作人</th>${showEmployee?'<th>授权员工</th>':''}<th>操作</th><th>变更内容</th></tr></thead><tbody>${rows.slice(0,limit??rows.length).map(l=>`<tr><td>${esc(new Date(l.at).toLocaleString())}</td><td>${esc(l.actor)}</td>${showEmployee?`<td>${esc(auditEmployeeName(l,state))}</td>`:''}<td>${esc(l.action)}</td><td><button type="button" data-log-id="${esc(l.id)}">查看前后值</button></td></tr>`).join('')||`<tr><td colspan="${showEmployee?5:4}" class="pc-empty">暂无变更记录</td></tr>`}</tbody></table>`;
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
  let accountNotice='';
  function staffDetail():string {
    const e=employee();if(!e)return '<div class="pc-empty">员工不存在</div>';
    if(staffEditable)return renderStaffRoles(e,draft.roles,stores,accountStatus(e));
    if(staffView==='security')return staffSecurityContent(e);
    if(staffView==='records')return `<div class="pc-card">${logs(e.id)}</div>`;
    const assigned=e.bindings.map(binding=>{
      const name=draft.roles.find(r=>r.id===binding.roleId)?.name??'失效角色';
      return `<li><strong>${esc(name)}</strong>${renderScope(roleBindingScope(binding,draft.roles.find(r=>r.id===binding.roleId)),stores,false,binding.id)}</li>`;
    }).join('');
    return `<div class="pc-staff-overview">
      <section class="pc-card"><header><h2>已分配角色</h2>${link('管理授权',staffPath(e.id)+'/authorization')}</header>${assigned?`<ul class="pc-staff-summary">${assigned}</ul>`:'<p class="pc-muted">尚未分配角色</p>'}</section>
    </div>`;
  }
  function render():void {
    const scroll=new Map([...root!.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll!,el.scrollTop]));
    const expanded=new Map([...root!.querySelectorAll<HTMLDetailsElement>('[data-menu-node]')].map(el=>[el.dataset.menuNode!,el.open]));
    if(isDetail){
      const staffEmployee=!roleId?employee():undefined;
      const staffTitle={overview:'门店与权限',authorization:'管理授权',security:'登录与安全',records:'变更记录'}[staffView];
      const staffSubtitle=staffEmployee&&!staffEditable?`<span>${esc(staffEmployee.name)}</span> <span class="pc-tag">${accountStatus(staffEmployee)}</span>`:'';
      root!.innerHTML=`<section class="pc-full${staffEditable?' pc-staff-authorization':''}">${renderStandalonePageHeader({className:'pc-heading',titleHtml:esc(role()?.name??(staffEmployee?staffTitle:'记录不存在')),backHtml:btn('← 返回','back'),subtitleHtml:staffEmployee?staffSubtitle:`<span class="pc-tag">${roleView?'查看权限':roleId?'编辑权限':staffEditable?'管理授权':'员工详情'}</span>`,actionsHtml:(roleId&&role()?(roleView?link('编辑权限',`/permissions/roles/edit/${encodeURIComponent(roleId)}`):btn('查看菜单效果','preview')):'')+(staffEditable?`<span class="pc-muted" role="status">${dirty?'有未保存修改':''}</span>${btn('取消','cancel')}<button type="button" class="primary" data-do="save" ${dirty?'':'disabled'}>保存更改</button>`:roleId&&!roleView?btn('取消','cancel')+btn('保存更改','save','primary'):'')})}<div class="pc-content">${roleId?(role()?`${roleView?'<div class="pc-toolbar"><h3>当前角色生效权限</h3></div>':''}${editor()}`:'<div class="pc-empty">角色不存在</div>'):staffDetail()}</div>${roleView?`<footer class="pc-footer"><span class="pc-muted">仅展示当前角色实际生效的菜单与已授权功能</span></footer>`:roleId?`<footer class="pc-footer"><span>${dirty?'有未保存修改':'所有修改已保存'}</span></footer>`:''}</section>`;
    }else{
      let body='';
      if(path.includes('/roles'))body=`<div class="pc-toolbar"><input data-query aria-label="搜索角色" placeholder="搜索角色名称" value="${esc(query)}">${btn('新建角色','create-role','primary')}</div><div class="pc-card"><table><thead><tr><th>角色</th><th>描述</th><th>成员数</th><th>授权门店</th><th>操作</th></tr></thead><tbody>${state.roles.filter(r=>r.name.includes(query)).map(r=>`<tr><td><strong>${link(esc(r.name),`/permissions/roles/view/${encodeURIComponent(r.id)}`)}</strong></td><td>${esc(roleDescription(r.description))||'—'}</td><td><button data-members="${esc(r.id)}">${memberCount(r.id)} 人</button></td><td><button type="button" data-view-role-stores="${esc(r.id)}">${r.defaultStoreIds?.length??0} 家</button></td><td><div class="pc-actions"><button data-role-info="${esc(r.id)}">编辑角色</button>${link('编辑权限',`/permissions/roles/edit/${encodeURIComponent(r.id)}`)}<button type="button" data-role-default-stores="${esc(r.id)}">授权门店</button><button data-copy="${esc(r.id)}">复制</button><button class="danger" data-delete="${esc(r.id)}">删除</button></div></td></tr>`).join('')||'<tr><td colspan="5" class="pc-empty">暂无匹配角色</td></tr>'}</tbody></table></div>`;
      else if(path.includes('/staff')){
        const logins=new Map(listStaffLoginAccounts().map(account=>[account.employeeId,account]));
        body=`<div class="pc-toolbar"><div class="pc-actions"><input data-query aria-label="搜索员工" placeholder="员工姓名或邮箱" value="${esc(query)}"><select data-status aria-label="账号状态"><option value="">全部账号状态</option>${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></div>${btn('新增员工账号','invite','primary')}</div>${accountNotice?`<p class="pc-notice" role="status">${esc(accountNotice)}</p>`:''}<div class="pc-card"><table><thead><tr><th>员工</th><th>登录邮箱</th><th>开通方式</th><th>账号状态</th><th>门店角色</th><th>已授权门店</th><th>操作</th></tr></thead><tbody>${state.employees.filter(e=>(!filter||e.status===filter)&&`${e.name} ${e.email}`.toLowerCase().includes(query.toLowerCase())).map(e=>{const login=logins.get(e.id);
          const storeCount=accessibleEmployeeStores(e,state.roles,stores).length;
          const method=login?.openedVia??(login?.invitation?'email':login?.isSystem?'password':undefined);
          const methodLabel=method==='email'?'邮箱邀请':method==='password'?'设置密码':'—';
          return `<tr><td>${esc(e.name)}</td><td>${esc(e.email)||"—"}</td><td>${methodLabel}</td><td><span class="pc-tag">${accountStatus(e,login)}</span></td><td>${[...new Set(e.bindings.map(b=>b.roleId))].map(id=>esc(state.roles.find(r=>r.id===id)?.name??"失效角色")).join("、")||"未授权"}</td><td><button type="button" data-view-staff-stores="${esc(e.id)}" aria-label="查看 ${esc(e.name)} 的已授权门店，${storeCount} 家">${storeCount} 家</button></td><td><div class="pc-actions">${link('管理授权',staffPath(e.id)+'/authorization')}${link('变更记录',staffPath(e.id)+'/records')}${staffAccountActions(e,login)}</div></td></tr>`;}).join('')||'<tr><td colspan="7" class="pc-empty">暂无匹配员工</td></tr>'}</tbody></table></div>`;
      }
      else if(path.includes('/change-log'))body=`<input data-query aria-label="筛选变更记录" placeholder="操作人、授权员工、操作或对象编号" value="${esc(query)}"><div class="pc-card">${logs()}</div>`;
      else body='<div class="pc-empty">未找到页面</div>';
      root!.innerHTML=`<header class="pc-heading"><h1>${title}</h1></header>${body}`;
    }
    if(roleId&&!roleView&&role()){
      const shown=visibleRoleTree(catalog,role()!,originalRole(),roleTree).nodes;
      for(const input of root!.querySelectorAll<HTMLInputElement>('[data-role-tree-select-all],[data-role-tree-select],[data-role-tree-category-select]')){
        const id=input.dataset.roleTreeCategorySelect??input.dataset.roleTreeSelect;
        const n=id?treeNode(id):undefined;
        input.indeterminate=roleSelectionState(n?[n]:shown,roleTree.selected).indeterminate;
      }
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
    modal(copy?'复制角色':original?'编辑角色':'新建角色',`<label>角色名称<input name="name" required maxlength="30" value="${esc(original?(copy?original.name+' 副本':original.name):'')}"></label><label>描述<textarea name="description" maxlength="160">${esc(original?.description??'')}</textarea></label>`,d=>{
      const source=original;
      const row:Role={...(source?structuredClone(source):{}),id:original&&!copy?original.id:crypto.randomUUID(),name:field(d,'name').trim(),description:field(d,'description'),system:original&&!copy?original.system:false,grants:structuredClone(source?.grants??{}),...(source?.readonlyChildren?{readonlyChildren:structuredClone(source.readonlyChildren)}:{}),...(source?.defaultedGrants?{defaultedGrants:[...source.defaultedGrants]}:{})};
      validateRole(state,row);const next=structuredClone(state);next.roles=next.roles.filter(r=>r.id!==row.id).concat(row);commit(next,row.id,original&&!copy?'编辑角色':copy?'复制角色':'新增角色');return true;
    },'保存');
  }
  function editRoleDefaultStores(id:string):void {
    const current=state.roles.find(item=>item.id===id);
    if(!current)return;
    const initial=current.defaultStoreIds??[];
    const dialog=modal('授权门店',`<p>角色：<strong>${esc(current.name)}</strong></p><select name="mode" hidden aria-hidden="true"><option value="stores">指定门店</option></select><div data-scope-options></div>`,()=>{
      const {ids}=readScope();
      if(current.defaultStoreIds!==undefined&&ids.length===initial.length&&ids.every(id=>initial.includes(id)))return true;
      const next=structuredClone(state);
      next.roles.find(item=>item.id===id)!.defaultStoreIds=ids;
      commit(next,id,'更新角色授权门店');
      return true;
    },'保存');
    const readScope=bindScopePicker(dialog,{mode:'stores',ids:initial},stores,brandNames,{allowEmptyStores:true});
  }
  function invite():void {
    const dialog=modal('新增员工账号',accountOpeningFields()+`<label>员工姓名<input name="name" required maxlength="30" autocomplete="name"></label><label>登录邮箱<input name="email" required type="email" maxlength="254" autocomplete="email" placeholder="name@menusifu.cn"></label>`+accountPasswordFields(),d=>{
      const name=field(d,'name').trim(),email=field(d,'email').trim().toLowerCase();validateInvite(state,name,email);
      state=openCenterAccount(state,crypto.randomUUID(),{name,email,password:field(d,'password'),confirmPassword:field(d,'confirmPassword'),method:d.querySelector<HTMLInputElement>('[name=openingMethod]:checked')?.value==='invite'?'invite':'password'},actor());
      draft=structuredClone(state);render();return true;
    },'创建邀请');
    bindAccountOpening(dialog);
  }
  function assign():void {
    if(!employee())return;
    const rows=draft.roles.map(role=>{
      const scope:Scope={mode:'stores',ids:role.defaultStoreIds??[]};
      const items=scopeStoreItems(scope,stores);
      return `<tr>
        <td><input type="checkbox" name="role" value="${esc(role.id)}" aria-label="选择 ${esc(role.name)}"></td>
        <td>${esc(role.name)}</td>
        <td>${items.length?items.slice(0,2).map(item=>esc(item.title)).join('、'):'<span class="pc-muted">未配置门店</span>'}
        ${items.length>2?`<button type="button" class="pc-scope-more" data-preview-assignment-stores="${esc(role.id)}">共 ${items.length} 家，查看全部</button>`:''}</td>
        <td><button type="button" data-preview-assignment-role="${esc(role.id)}" aria-label="查看 ${esc(role.name)} 的角色权限">查看角色权限</button></td>
      </tr>`;
    }).join('');
    const selectedRoleIds=(d:HTMLDialogElement)=>new Set([...d.querySelectorAll<HTMLInputElement>('[name="role"]:checked')].map(input=>input.value));
    const dialog=modal('分配员工角色',`<div class="pc-role-assignment-list"><table aria-label="角色列表">
      <thead><tr><th scope="col">选择</th><th scope="col">角色</th><th scope="col">授权门店</th><th scope="col">操作</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="4" class="pc-empty">暂无可分配角色</td></tr>'}</tbody>
    </table></div>`,d=>{
      const selected=selectedRoleIds(d);
      const roles=draft.roles.filter(role=>selected.has(role.id));
      if(!roles.length)throw Error('请至少选择一个角色');
      employee()!.bindings.push(...roles.map(role=>({
        id:crypto.randomUUID(),roleId:role.id,scope:{mode:'stores' as const,ids:[]},
      })));
      mark();
      render();
      return true;
    },'确认分配');
    dialog.classList.add('pc-assignment-dialog','pc-role-assignment-dialog');
    const next=dialog.querySelector<HTMLButtonElement>('[type="submit"]')!;
    next.disabled=true;
    dialog.addEventListener('change',()=>{next.disabled=selectedRoleIds(dialog).size===0;});
    dialog.addEventListener('click',event=>{
      const trigger=(event.target as Element).closest<HTMLButtonElement>('[data-preview-assignment-role]');
      if(trigger){showRolePermissions(trigger.dataset.previewAssignmentRole!);return;}
      const storesTrigger=(event.target as Element).closest<HTMLButtonElement>('[data-preview-assignment-stores]');
      const role=draft.roles.find(item=>item.id===storesTrigger?.dataset.previewAssignmentStores);
      if(role)showRoleStores(role.name,{mode:'stores',ids:role.defaultStoreIds??[]});
    });
  }
  function addStoreSupplement():void {
    const current=employee();
    if(!staffEditable||!current)return;
    const existing=accountExtraStoreIds(current);
    const candidates=stores.filter(store=>!existing.includes(store.id));
    const dialog=modal('添加门店','<select name="mode" hidden aria-hidden="true"><option value="stores">指定门店</option></select><div data-scope-options></div>',()=>{
      const {ids}=readScope();
      current.extraStoreIds=[...existing,...ids];
      delete current.supplementalStoreGrants;
      mark();
      render();
      return true;
    },'确认添加');
    const readScope=bindScopePicker(dialog,{mode:'stores',ids:[]},candidates,brandNames);
  }
  function showBindingStores(id:string):void {
    const binding=employee()?.bindings.find(b=>b.id===id);
    if(!binding){error('该角色授权不存在，请重新打开员工详情');return;}
    const name=draft.roles.find(r=>r.id===binding.roleId)?.name??'已失效角色';
    showRoleStores(name,roleBindingScope(binding,draft.roles.find(r=>r.id===binding.roleId)));
  }
  function showRoleStores(name:string,scope:Scope):void {
    const items=scopeStoreItems(scope,stores);
    showStoreList('查看角色授权门店',`<p>角色：<strong>${esc(name)}</strong></p><p>${esc(scopeLabel(scope))} · 共 ${items.length} 家门店</p>`,items,renderScope(scope,stores,true));
  }
  function showStoreList(title:string,summary:string,items:{id:string;title:string;sources?:string[]}[],empty:string):void {
    const showSources=items.some(item=>item.sources);
    const rows=items.map(item=>{
      const store=stores.find(row=>row.id===item.id);
      const searchText=[item.title,item.id,store?.address,store?.postalCode].join(' ');
      return `<tr data-store-list-row data-search="${esc(searchText)}"><td>${esc(item.title)} <small>${esc(item.id)}</small></td><td>${esc(store?.address?.trim()||'—')}</td><td>${esc(store?.postalCode?.trim()||'—')}</td>${showSources?`<td>${item.sources?.map(source=>`<div>${esc(source)}</div>`).join('')??''}</td>`:''}</tr>`;
    }).join('');
    const detail=rows?`<div class="pc-store-picker-toolbar"><input type="search" data-store-list-search aria-label="搜索门店" placeholder="搜索名称、编号、地址或邮编"></div><div class="pc-store-picker-scroll"><table class="pc-store-picker-table">
      <thead><tr><th scope="col">门店</th><th scope="col">地址</th><th scope="col">邮编</th>${showSources?`<th scope="col">授权来源</th>`:''}</tr></thead><tbody>${rows}<tr data-store-list-empty hidden><td colspan="${showSources?4:3}" class="pc-empty">没有匹配门店</td></tr></tbody>
    </table></div>`:empty;
    const dialog=modal(title,summary+detail,()=>true,'关闭');
    dialog.classList.add('pc-scope-dialog','pc-role-store-detail');
    const search=dialog.querySelector<HTMLInputElement>('[data-store-list-search]');
    search?.addEventListener('input',()=>{
      const query=search.value.trim().toLowerCase();
      let matched=0;
      for(const row of dialog.querySelectorAll<HTMLTableRowElement>('[data-store-list-row]')){
        row.hidden=!(row.dataset.search??'').toLowerCase().includes(query);
        if(!row.hidden)matched++;
      }
      dialog.querySelector<HTMLElement>('[data-store-list-empty]')!.hidden=matched>0;
    });
    dialog.setAttribute('aria-label',title);
    dialog.querySelector('footer [data-close]')?.remove();
  }
  function showConfiguredRoleStores(role:Role):void {
    const configured=role.defaultStoreIds??[];
    const rows=configured.map(id=>stores.find(store=>store.id===id)??{id,title:'已失效门店',brand:'',region:''});
    const dialog=modal('授权门店详情',`<p>角色：<strong>${esc(role.name)}</strong></p><select name="mode" hidden aria-hidden="true"><option value="stores">指定门店</option></select><div data-scope-options></div>`,()=>{
      confirmRemoval(readScope().ids);
      return false;
    },'批量移除');
    dialog.querySelector('footer [data-close]')!.textContent='关闭';
    const readScope=bindScopePicker(dialog,{mode:'stores',ids:[]},rows,brandNames);
    const batch=dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    batch.disabled=true;
    const sync=()=>{batch.disabled=!dialog.querySelector('[data-store-row] input:checked');};
    dialog.addEventListener('change',sync);
    const table=dialog.querySelector('table')!;
    const heading=table.querySelector('thead tr')!.appendChild(document.createElement('th'));
    heading.scope='col';
    heading.textContent='操作';
    table.querySelector<HTMLTableCellElement>('[data-store-empty] td')!.colSpan=6;
    for(const row of table.querySelectorAll<HTMLTableRowElement>('[data-store-row]')){
      const id=row.querySelector<HTMLInputElement>('input')!.value;
      const button=row.insertCell().appendChild(document.createElement('button'));
      button.type='button';
      button.className='danger';
      button.textContent='移除';
      button.addEventListener('click',()=>confirmRemoval([id]));
    }
    function confirmRemoval(ids:string[]):void {
      const removing=new Set(ids);
      modal('移除角色授权门店',`<p>确认移除该角色的 ${removing.size} 家授权门店？保存后同步更新员工的角色门店授权。</p>`,()=>{
        const next=structuredClone(state);
        const current=next.roles.find(item=>item.id===role.id)!;
        current.defaultStoreIds=(current.defaultStoreIds??[]).filter(id=>!removing.has(id));
        commit(next,role.id,'更新角色授权门店');
        dialog.close();
        showConfiguredRoleStores(current);
        return true;
      },'移除');
    }
  }
  function removeExtraStores(ids:string[]):void {
    const current=employee();
    if(!staffEditable||!current||!ids.length)return;
    const removing=new Set(ids);
    modal('移除额外授权门店',`<p>确认移除该账号的 ${removing.size} 家额外授权门店？</p>`,()=>{
      current.extraStoreIds=accountExtraStoreIds(current).filter(id=>!removing.has(id));
      delete current.supplementalStoreGrants;
      mark();
      render();
      return true;
    },'移除');
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
    const accessible=accessibleEmployeeStores(e,draft.roles,stores);
    if(!accessible.some(store=>store.id===storeId))storeId=accessible[0]?.id??'';
    let selected=page,category='',search='';
    const content=()=>{
      selected=effectiveMenuView(catalog,value,selected).page;
      const current=accessible.find(s=>s.id===storeId),roles=applicableRoles(e,draft.roles,current);
      const empty=!current?'暂无可选门店，暂时无法查看门店生效权限':roles.length?`当前门店匹配到 ${roles.length} 个角色，但合并后暂无可访问菜单，请检查角色权限配置。`:'当前门店暂无角色功能授权。';
      return `<div class="pc-toolbar"><label>查看门店<select data-effective-store ${accessible.length?'':'disabled'}>${accessible.length?accessible.map(s=>`<option value="${esc(s.id)}" ${s.id===storeId?'selected':''}>${esc(s.title)}</option>`).join(''):'<option>暂无可选门店</option>'}</select></label></div><p>当前生效角色：${roles.map(r=>`<span class="pc-tag">${esc(r.name)}</span>`).join('')||'<span class="pc-muted">暂无适用角色</span>'}</p>${renderPermissionEditor({catalog,page:selected,group:category,search,preview:false,readonly:true,staff:false,effectiveOnly:true,emptyMessage:empty,value,own:()=> 'inherit'})}`;
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
  function staffAccountActions(e:Employee,login:ReturnType<typeof listStaffLoginAccounts>[number]|undefined):string {
    return `<div class="pc-actions" data-staff-account="${esc(e.id)}">
      ${e.status==='pending'||e.status==='revoked'?btn('重发演示邀请','resend'):''}
      ${e.status==='pending'?btn('撤销邀请','revoke','danger')+btn('演示接受邀请','accept-invite'):''}
      ${e.status==='enabled'||e.status==='disabled'?btn(e.status==='enabled'?'停用账号':'启用账号','toggle-account'):''}
      ${e.status==='disabled'&&login&&!login.enabled&&!login.isSystem?btn('删除账号','delete-account','danger'):''}
    </div>`;
  }
  function staffSecurityContent(e:Employee):string {
    const login=listStaffLoginAccounts().find(account=>account.employeeId===e.id);
    return `<section class="pc-card pc-staff-security-panel"><h2>登录账号</h2>${accountNotice?`<p role="status">${esc(accountNotice)}</p>`:''}<dl><dt>登录邮箱</dt><dd>${esc(e.email)||'—'}</dd><dt>账号状态</dt><dd>${accountStatus(e,login)}</dd></dl>${staffAccountActions(e,login)}${e.status==='disabled'&&login?.isSystem?'<p class="pc-muted">系统预设账号不能删除。</p>':''}</section>`;
  }
  function handleStaffSecurity(action:string,e:Employee):void {
    const id=e.id;
    try{switch(action){
      case 'accept-invite':case 'resend':case 'revoke':{
        if(dirty)throw Error('请先保存或取消当前员工的授权草稿');
        const accepting=action==='accept-invite';
        modal(accepting?'演示接受邀请':action==='resend'?'重发演示邀请':'撤销邀请',accepting?`<label>登录密码<input name="password" type="password" required minlength="6" autocomplete="new-password"></label><label>确认密码<input name="confirmPassword" type="password" required minlength="6" autocomplete="new-password"></label>`:'<p>仅更新本地演示邀请，不发送真实邮件。</p>',d=>{
          state=openCenterAccount(state,e.id,{name:e.name,email:e.email,password:accepting?field(d,'password'):'',confirmPassword:accepting?field(d,'confirmPassword'):'',method:'invite'},actor(),accepting?'accept':action==='resend'?'resend':'revoke');draft=structuredClone(state);render();return true;
        },accepting?'设置密码并启用':'确认');break;
      }
      case 'delete-account':{
        if(dirty)throw Error('请先保存或取消当前员工的授权草稿');
        modal('删除账号',`<p>确定删除 <strong>${esc(e.name)}</strong> 的登录账号？</p><p>原登录凭据将被删除。员工资料、门店授权和变更记录会保留。</p>`,()=>{
          state=deleteCenterAccount(state,e.id,actor());
          draft=structuredClone(state);
          accountNotice=`${e.name}的登录账号已删除。`;
          render();
          return true;
        },'确认删除').querySelector('button[type="submit"]')?.classList.add('danger');
        break;
      }
      case 'toggle-account':{
        if(dirty)throw Error('请先保存或取消当前员工的授权草稿');
        const actionLabel=e.status==='enabled'?'停用':'启用';
        modal(actionLabel+'账号',`<p>确认${actionLabel} <strong>${esc(e.name)}</strong> 的登录账号？</p><p>角色及门店范围保留，确认后立即更新本地账号状态。</p>`,()=>{
          state=openCenterAccount(state,e.id,{name:e.name,email:e.email,password:'',confirmPassword:'',method:'password'},actor(),'toggle');draft=structuredClone(state);accountNotice=`${e.name}的登录账号已${actionLabel}。`;render();return true;
        });break;
      }
    }}catch(errorValue){error((errorValue as Error).message);}
  }
  root.addEventListener('click',ev=>{
    const b=(ev.target as Element).closest<HTMLElement>('button');if(!b||b.hasAttribute('disabled'))return;
    try{
      if(b.dataset.logId){logDetail(b.dataset.logId);return;}
      if(roleId&&!roleView&&role()){
        if(b.dataset.roleTreeCategory){roleTree.category=b.dataset.roleTreeCategory;roleTree.search='';render();root.querySelector<HTMLElement>('[data-role-tree-category="'+CSS.escape(b.dataset.roleTreeCategory)+'"]')?.focus({preventScroll:true});return;}
        if(b.dataset.roleTreeToggle){const id=b.dataset.roleTreeToggle;roleTree.collapsed.has(id)?roleTree.collapsed.delete(id):roleTree.collapsed.add(id);render();root.querySelector<HTMLElement>('[data-role-tree-toggle="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});return;}
        if(b.dataset.roleTreeExpand){for(const n of flattenRoleTree(treeNodes))b.dataset.roleTreeExpand==='all'?roleTree.collapsed.delete(n.id):roleTree.collapsed.add(n.id);render();root.querySelector<HTMLElement>('[data-role-tree-expand="'+b.dataset.roleTreeExpand+'"]')?.focus({preventScroll:true});return;}
        if(b.hasAttribute('data-role-tree-clear')){
          roleTree.selected.clear();
          render();
          root.querySelector<HTMLElement>('[data-role-tree-select-all]')?.focus();
          return;
        }
      }
      if(roleView && !(b.dataset.page||b.dataset.group||['back','preview'].includes(b.dataset.do??'')))return;
      if(employeeId&&(b.dataset.authorization||b.dataset.categoryGrant||b.dataset.grant||b.dataset.submenuMode))return;
      if(b.dataset.submenuMode){ev.preventDefault();if(!role())return;const v=b.dataset.value;if(v!=='hidden'&&v!=='read'&&v!=='edit')throw Error('子导航状态无效');if(applySubmenuMode(catalog,role()!,page,b.dataset.submenuMode,v)){mark();render();}return;}
      if(b.dataset.page){ev.preventDefault();page=b.dataset.page;group='';const list=root.querySelector('[data-scroll="settings"]');if(list)list.scrollTop=0;render();return;}
      if(b.dataset.group){group=b.dataset.group;const list=root.querySelector('[data-scroll="settings"]');if(list)list.scrollTop=0;render();return;}
      const accountActions=b.closest<HTMLElement>('[data-staff-account]');
      if(accountActions&&b.dataset.do){
        const employee=state.employees.find(item=>item.id===accountActions.dataset.staffAccount);
        if(employee)handleStaffSecurity(b.dataset.do,employee);
        return;
      }
      if(b.dataset.authorization){ev.preventDefault();const row=authorizationRows(catalog,page).find(r=>r.contentKey===b.dataset.authorization);if(!row)return;const v=b.dataset.value as Access|'inherit';assertPageFeatureChoice(page,row,v,value);if(page!=='page:/operations/queue-call/buffet-rules'&&(v==='edit'||row.mode==='visibility'&&v==='read'))for(const key of [row.contentKey,...row.editKeys])assertSettingChoice(catalog,catalog.resources.get(key)!,'edit',value);if(employeeId)return;if(role()&&v!=='inherit')applyPageAuthorization(catalog,page,role()!.grants,row,v);else return;mark();render();return;}
      if(b.dataset.categoryGrant){ev.preventDefault();if(employeeId)return;const v=b.dataset.value as Access|'inherit';if(role()&&v!=='inherit')applyCategoryGrant(catalog,page,b.dataset.categoryGrant,role()!.grants,v);else return;mark();render();return;}
      if(b.dataset.grant){ev.preventDefault();const key=b.dataset.grant,v=b.dataset.value as Access|'inherit';if(catalog.resources.get(key)?.type==='action'&&value(page)==='hidden'&&v!=='hidden')throw Error('页面不可见，不能开启功能授权');assertSettingChoice(catalog,catalog.resources.get(key)!,v,value);if(employeeId)return;if(role()&&v!=='inherit')applyPageResourceGrant(catalog,page,role()!.grants,catalog.resources.get(key)!,v);else return;mark();render();return;}
      if(b.dataset.roleDefaultStores){editRoleDefaultStores(b.dataset.roleDefaultStores);return;}
      if(b.dataset.roleInfo){roleDialog(b.dataset.roleInfo);return;}
      if(b.dataset.viewBindingStores){showBindingStores(b.dataset.viewBindingStores);return;}
      if(b.dataset.viewRole){showRolePermissions(b.dataset.viewRole);return;}
      if(b.dataset.copy){roleDialog(b.dataset.copy,true);return;}
      if(b.dataset.members){modal('角色成员',state.employees.filter(e=>e.bindings.some(x=>x.roleId===b.dataset.members)).map(e=>`<p>${link(esc(e.name),`/permissions/staff/${encodeURIComponent(e.id)}`)}</p>`).join('')||'<p>暂无成员</p>',()=>true,'关闭');return;}
      if(b.dataset.delete){const id=b.dataset.delete, members=roleBoundEmployees(state,id);if(members.length){modal('暂不能删除角色',`<p>当前角色已被以下 ${members.length} 位员工绑定，请先解除角色分配，再删除角色。</p><ul>${members.map(e=>`<li>${esc(e.name)}${e.email?`（${esc(e.email)}）`:''}</li>`).join('')}</ul>`,()=>true,'知道了');return;}modal('删除角色','<p>删除后无法恢复，确定删除此角色？</p>',()=>{const next=deleteUnassignedRole(state,id);commit(next,id,'删除角色');return true;},'删除');return;}
      if(b.dataset.removeExtraStore){removeExtraStores([b.dataset.removeExtraStore]);return;}
      if(b.dataset.viewStaffStores){
        const staff=state.employees.find(item=>item.id===b.dataset.viewStaffStores);
        if(!staff)return;
        const extras=new Set(accountExtraStoreIds(staff));
        const items=accessibleEmployeeStores(staff,state.roles,stores).map(store=>{
          const sources=applicableRoles(staff,state.roles,store).map(role=>`角色授权 · ${role.name}`);
          if(extras.has(store.id))sources.push('账号额外授权');
          return {...store,sources};
        });
        showStoreList('已授权门店',`<p>员工：<strong>${esc(staff.name)}</strong></p><p>共 ${items.length} 家门店</p>`,items,'<p class="pc-empty">该账号暂无授权门店</p>');
        return;
      }
      if(b.dataset.viewRoleStores){
        const current=state.roles.find(item=>item.id===b.dataset.viewRoleStores);
        if(current)showConfiguredRoleStores(current);
        return;
      }
      if(b.dataset.removeBinding){const binding=employee()?.bindings.find(x=>x.id===b.dataset.removeBinding);if(!binding)return;modal('解除角色授权',`<p>员工：${esc(employee()!.name)}</p><p>解除角色：${esc(draft.roles.find(r=>r.id===binding.roleId)?.name??'已失效角色')}</p>${renderScope(roleBindingScope(binding,draft.roles.find(r=>r.id===binding.roleId)),stores,true)}`,()=>{const current=employee()!;current.bindings=current.bindings.filter(x=>x.id!==binding.id);mark();render();return true;},'解除角色');return;}
      switch(b.dataset.do){
        case 'create-role':roleDialog();break;
        case 'invite':invite();break;
        case 'preview':preview();break;
        case 'assign':assign();break;
        case 'remove-extra-stores':removeExtraStores([...root!.querySelectorAll<HTMLInputElement>('[data-extra-store-selection]:checked')].map(box=>box.value));break;
        case 'add-store-supplement':addStoreSupplement();break;
        case 'staff-effective':showStaffEffective();break;

        case 'back':case 'cancel':if(!dirty||confirm('放弃未保存的修改？')){dirty=false;leaveGuard=undefined;location.hash=roleId?'/permissions/roles':'/permissions/staff';}break;
        case 'save':{
          if(!dirty){modal('无需保存','<p>当前没有未保存的修改。</p>',()=>true,'知道了');return;}
          const id=roleId||employeeId,old=roleId?state.roles.find(r=>r.id===id):state.employees.find(e=>e.id===id),next=roleId?role():employee();
          const action=roleId?'更新角色权限':'更新员工授权';
          const pendingChange:Audit={id:'draft',at:'',actor:actor(),objectId:id,action,before:JSON.stringify(old??null),after:JSON.stringify(next??null)};
          const confirmation=modal('确认保存更改',`<p>${roleId?`影响 ${memberCount(id)} 位已绑定员工。`:'仅更新当前员工的草稿，包含已编辑的各门店。'}</p><button type="button" data-view-pending-change>查看变更前后值</button>`,()=>{commit(draft,id,action);return true;},'确认保存');
          confirmation.querySelector('[data-view-pending-change]')!.addEventListener('click',()=>changeDetail(pendingChange,true));break;
        }

      }
    }catch(e){error((e as Error).message);}
  });
  root.addEventListener('change',event=>{
    const input=event.target as HTMLInputElement;
    if(!input.matches('[data-extra-store-all],[data-extra-store-selection]'))return;
    const all=root!.querySelector<HTMLInputElement>('[data-extra-store-all]')!;
    const boxes=[...root!.querySelectorAll<HTMLInputElement>('[data-extra-store-selection]')];
    if(input===all)for(const box of boxes)box.checked=all.checked;
    const count=boxes.filter(box=>box.checked).length;
    all.checked=count===boxes.length;
    all.indeterminate=count>0&&count<boxes.length;
    root!.querySelector<HTMLButtonElement>('[data-do="remove-extra-stores"]')!.disabled=!count;
  });
  root.addEventListener('input',ev=>{
    const target=ev.target as HTMLInputElement;
    if(target.hasAttribute('data-role-tree-search')){roleTree.search=target.value;const pos=target.selectionStart;render();const next=root.querySelector<HTMLInputElement>('[data-role-tree-search]');next?.focus();next?.setSelectionRange(pos,pos);return;}
    if(!target.matches('[data-query],[data-menu-search]'))return;
    const isMenu=target.hasAttribute('data-menu-search');if(isMenu)menuSearch=target.value;else query=target.value;
    const position=target.selectionStart;render();const input=root.querySelector<HTMLInputElement>(isMenu?'[data-menu-search]':'[data-query]');input?.focus();input?.setSelectionRange(position,position);
  });
  function openRoleBatch(mode:Access):void {
    if(dirty){
      modal('请先处理未保存的修改','<p>批量设置会直接保存。请先保存现有修改，或取消编辑后重新进入。</p>',()=>true,'返回编辑');
      return;
    }
    try {
      const nodes=roleSelectionTargets(treeNodes).filter(n=>roleTree.selected.has(n.id));
      const original=role()!;
      const candidate=structuredClone(original);
      if(!applyTreeBatch(catalog,candidate,nodes,mode))throw Error('所选项目已是目标权限');
      const changes=roleSelectionTargets(treeNodes).filter(node=>treeChanged(catalog,candidate,original,node));
      const label=(node:typeof changes[number],subject:Role)=>treeChoices(node).find(([value])=>value===treeSelection(catalog,subject,node))?.[1]??'—';
      const summary=[...new Set(changes.map(node=>label(node,candidate)))].map(status=>status+' '+changes.filter(node=>label(node,candidate)===status).length+' 项').join(' · ');
      const changedIds=new Set(changes.map(node=>node.id));
      const rows=treeNodes.map(category=>{
        const items=roleSelectionTargets([category]).filter(node=>changedIds.has(node.id));
        if(!items.length)return '';
        return `<tbody><tr class="pc-batch-group"><th colspan="3" scope="rowgroup">${esc(category.title)} · ${items.length} 项</th></tr>`+items.map(node=>`<tr><th scope="row">${esc(roleTreePath(treeNodes,node.id))}</th><td>${esc(label(node,original))}</td><td>${esc(label(node,candidate))}</td></tr>`).join('')+'</tbody>';
      }).join('');
      const confirmation=modal('批量设置权限',`<p>实际变更 ${changes.length} 项。确认保存后立即生效。</p><p>${esc(summary)}</p><div class="pc-batch-preview"><table><thead><tr><th>权限项目</th><th>变更前</th><th>变更后</th></tr></thead>${rows}</table></div>`,()=>{
        if(dirty)throw Error('请先处理未保存的修改，再重新预览批量设置');
        const next=structuredClone(state);
        next.roles=next.roles.map(item=>item.id===roleId?candidate:item);
        commit(next,roleId,'更新角色权限');
        return true;
      },'确认并保存');
      confirmation.classList.add('pc-batch-dialog');return;
    } catch(error){
      modal('批量设置暂不可应用',`<p>${esc((error as Error).message)}</p>`,()=>true,'返回调整');
    }
  }
  root.addEventListener('change',ev=>{const target=ev.target as HTMLSelectElement;
    if(roleId&&!roleView&&role())try{
      if(target.hasAttribute('data-role-tree-batch-mode')){
        const mode=target.value;
        target.value='';
        if(mode==='hidden'||mode==='read'||mode==='edit')openRoleBatch(mode);
        return;
      }
      if(target.hasAttribute('data-role-tree-grant')){const n=treeNode(target.dataset.roleTreeGrant!);if(n&&applyTreeChoice(catalog,role()!,n,target.value as Access))mark();render();root.querySelector<HTMLElement>('[data-role-tree-grant="'+CSS.escape(n?.id??'')+'"]')?.focus({preventScroll:true});return;}
      if(target.hasAttribute('data-role-tree-filter')){const checked=(target as unknown as HTMLInputElement).checked;if(target.dataset.roleTreeFilter==='granted')roleTree.onlyGranted=checked;else roleTree.onlyChanged=checked;render();root.querySelector<HTMLElement>('[data-role-tree-filter="'+target.dataset.roleTreeFilter+'"]')?.focus({preventScroll:true});return;}
      if(target.hasAttribute('data-role-tree-category-select')){const n=treeNode(target.dataset.roleTreeCategorySelect!);if(n)toggleRoleSelection(treeNodes,[n],roleTree.selected,(target as unknown as HTMLInputElement).checked);render();root.querySelector<HTMLElement>('[data-role-tree-category-select="'+CSS.escape(n?.id??'')+'"]')?.focus({preventScroll:true});return;}
      if(target.hasAttribute('data-role-tree-select')){const id=target.dataset.roleTreeSelect!;const n=treeNode(id);if(n)toggleRoleSelection(treeNodes,[n],roleTree.selected,(target as unknown as HTMLInputElement).checked);render();root.querySelector<HTMLElement>('[data-role-tree-select="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});return;}
      if(target.hasAttribute('data-role-tree-select-all')){const checked=(target as unknown as HTMLInputElement).checked;toggleRoleSelection(treeNodes,visibleRoleTree(catalog,role()!,originalRole(),roleTree).nodes,roleTree.selected,checked);render();root.querySelector<HTMLElement>('[data-role-tree-select-all]')?.focus({preventScroll:true});return;}
    }catch(e){render();error((e as Error).message);return;}
    if(target.hasAttribute('data-store')){storeId=target.value;render();}if(target.hasAttribute('data-status')){filter=target.value;render();}});
  render();
  if(path==='/permissions/roles/new')roleDialog();
}
import {assertSettingChoice} from './center-setting-levels';
