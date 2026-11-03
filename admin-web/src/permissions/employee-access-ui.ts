import {renderStandalonePageHeader} from '../ui/standalone-page-header';
import {employeeWorkbenchSurface} from './employee-access-domain';
import { esc } from './center-editor';
import { PERMISSION_ROLE_LABELS, mActionKey, mPageKey } from './m-platform-catalog';
import {bindMEmployeePreview} from './employee-m-preview';
import { currentMAccess, readMState, saveMState } from './m-platform-store';
import { listStaffLoginAccounts } from './enterprise-staff-account-store';
import { bindProviderAccess } from './provider-access-ui';
import './employee-access.css';
const prefix='/m-platform/permissions/staff';

export function bindEmployeeAccess(host:HTMLElement,id:string,preview:boolean,setLeave:(guard:(()=>boolean)|undefined)=>void):void {
  const account=listStaffLoginAccounts().find(a=>a.employeeId===id);
  if(!account){host.innerHTML=renderStandalonePageHeader({titleHtml:'员工不存在',backHtml:`<a class="pc-link" href="#${prefix}">返回列表</a>`});return;}
  let saved=readMState(),selected=[...(saved.employees.find(e=>e.id===id)?.roleIds??[])];
  let merchantGuard:(()=>boolean)|undefined,merchantMounted=false;
  let mode=preview?'effective':'config',surface:string=employeeWorkbenchSurface(location.hash);
  let generation=0,mPreviewGeneration=-1,merchantPreviewGeneration=-1,roleQuery='';
  const dirty=()=>JSON.stringify([...selected].sort())!==JSON.stringify([...(saved.employees.find(e=>e.id===id)?.roleIds??[])].sort());
  const canAssign=()=>currentMAccess(mActionKey('staff','assign'))==='edit';
  const guard=()=>{setLeave(dirty()||merchantGuard?()=>{
    const destination=location.hash;
    if(document.querySelector('[data-employee-leave-dialog]'))return false;
    const modal=document.createElement('dialog');modal.className='pc-dialog mp-permission-dialog';modal.setAttribute('data-employee-leave-dialog','');
    const parts=[dirty()?PERMISSION_ROLE_LABELS.platformRole:'',merchantGuard?'商户访问授权':''].filter(Boolean);
    modal.innerHTML=`<form class="pc"><h2>放弃未保存的修改？</h2><p>${esc(parts.join('、'))}有未保存的修改。离开后将丢弃这些草稿，已保存的权限不变。</p><footer><button type="button" data-cancel>继续编辑</button><button type="submit" class="primary">放弃并离开</button></footer></form>`;
    document.body.append(modal);modal.addEventListener('close',()=>modal.remove());modal.querySelector('[data-cancel]')!.addEventListener('click',()=>modal.close());
    modal.querySelector('form')!.onsubmit=event=>{event.preventDefault();setLeave(undefined);modal.close();location.hash=destination;};modal.showModal();return false;
  }:undefined);updateChrome();};
  const route=`${prefix}/${encodeURIComponent(id)}/roles`;
  host.innerHTML=`<div class="employee-access employee-workbench">${renderStandalonePageHeader({className:'employee-workbench-header',titleHtml:`员工权限 · ${esc(account.employeeName)}`,backHtml:`<a class="pc-link" href="#${prefix}">返回列表</a>`,subtitleHtml:`<p class="pc-muted">${esc(account.loginEmail)} <span class="pc-tag">${account.enabled?'已启用':'已停用，全部权限不生效'}</span></p>`,actionsHtml:'<span data-employee-header-actions="m"></span><span data-employee-header-actions="merchant" hidden></span>'})}<div class="employee-mode-tabs" role="tablist" aria-label="工作方式"><button type="button" role="tab" id="employee-mode-config" data-employee-mode="config">角色配置</button><button type="button" role="tab" id="employee-mode-effective" data-employee-mode="effective">生效权限</button></div><div class="employee-surface-tabs" role="tablist" aria-label="权限维度"><button type="button" role="tab" id="employee-surface-m" data-employee-surface="m">${PERMISSION_ROLE_LABELS.platformScope}<span data-employee-m-dot hidden> · 未保存</span></button><button type="button" role="tab" id="employee-surface-merchant" data-employee-surface="merchant">${PERMISSION_ROLE_LABELS.merchantScope}<span data-employee-provider-dot hidden> · 未保存</span></button></div><p class="pc-notice" role="status" data-employee-snapshot-note hidden></p><div class="employee-stage"><section class="employee-workbench-panel" role="tabpanel" aria-labelledby="employee-mode-config employee-surface-m" data-workbench-panel="config:m"><h2>${PERMISSION_ROLE_LABELS.platformRole}</h2><div data-employee-m></div></section><section class="employee-workbench-panel" role="tabpanel" aria-labelledby="employee-mode-config employee-surface-merchant" data-workbench-panel="config:merchant"><div data-employee-provider></div></section><section class="employee-workbench-panel employee-effective-panel" role="tabpanel" aria-labelledby="employee-mode-effective employee-surface-m" data-workbench-panel="effective:m"><div data-employee-m-preview></div></section><section class="employee-workbench-panel employee-effective-panel" role="tabpanel" aria-labelledby="employee-mode-effective employee-surface-merchant" data-workbench-panel="effective:merchant"><div data-employee-provider-preview></div></section></div></div>`;
  function updateChrome():void {
    host.querySelectorAll<HTMLElement>('[data-employee-header-actions]').forEach(slot=>{slot.hidden=mode!=='config'||slot.dataset.employeeHeaderActions!==surface;});
    host.querySelectorAll<HTMLElement>('[data-workbench-panel]').forEach(panel=>{panel.hidden=panel.dataset.workbenchPanel!==mode+':'+surface;});
    for(const attr of ['mode','surface'])host.querySelectorAll<HTMLButtonElement>(`[data-employee-${attr}]`).forEach(button=>{const active=button.getAttribute(`data-employee-${attr}`)===(attr==='mode'?mode:surface);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    host.querySelector<HTMLElement>('[data-employee-m-dot]')!.hidden=!dirty();
    host.querySelector<HTMLElement>('[data-employee-provider-dot]')!.hidden=!merchantGuard;
    const note=host.querySelector<HTMLElement>('[data-employee-snapshot-note]')!;
    note.hidden=mode!=='effective'||!dirty()&&!merchantGuard;
    note.textContent='存在未保存的修改，当前仅展示已保存的生效权限。';
  }
  const mActions=host.querySelector<HTMLElement>('[data-employee-header-actions="m"]')!;
  const merchantActions=host.querySelector<HTMLElement>('[data-employee-header-actions="merchant"]')!;
  const mHost=host.querySelector<HTMLElement>('[data-employee-m]')!;
  function renderM():void {
    mActions.innerHTML=`${canAssign()?`<button type="button" class="primary" data-mp-do="save-assignment" ${canAssign()&&dirty()?'':'disabled'}>保存${PERMISSION_ROLE_LABELS.platformRole}</button>`:'<span class="pc-muted">只读</span>'}`;
    mHost.innerHTML=`<p class="pc-muted">配置员工在 M 平台可以访问的菜单与操作。多角色权限取允许项并集。</p>${saved.roles.length>5?`<label>搜索角色<input data-employee-role-search value="${esc(roleQuery)}" placeholder="输入角色名称"></label>`:''}<p class="pc-muted">已选 ${selected.length} 个角色</p><div class="pc-choice-list">${saved.roles.filter(r=>!roleQuery||r.name.toLowerCase().includes(roleQuery.toLowerCase())).map(r=>`<label><input type="checkbox" data-employee-role="${esc(r.id)}" ${selected.includes(r.id)?'checked':''} ${canAssign()?'':'disabled'}>${esc(r.name)}</label>`).join('')||`<p>${roleQuery?'没有匹配角色':'暂无平台管理角色'}</p>`}</div><p class="pc-muted">清空选择后，该员工无平台管理权限。</p><p class="pc-error" role="alert" data-employee-m-error></p><footer class="employee-section-footer"><span role="status" data-employee-m-status>${dirty()?'有未保存的修改':'无未保存修改'}</span></footer>`;
  }
  renderM();
  function mountMerchant(target:HTMLElement,effective:boolean):void {
    if(currentMAccess(mPageKey('provider-roles'))==='hidden'){target.innerHTML='<h2>商户访问授权</h2><p class="pc-muted">暂无商户访问授权的查看权限</p>';return;}
    const child=document.createElement('div');target.replaceChildren(child);
    try{bindProviderAccess(child,`${prefix}/${encodeURIComponent(id)}/merchant-access`,effective?()=>{}:g=>{merchantGuard=g;guard();},{embedded:true,employeePreview:effective,workbench:true,actionsHost:effective?undefined:merchantActions});}
    catch(e){child.innerHTML=`<p class="pc-error" role="alert">${esc((e as Error).message)}</p>`;}
  }
  function ensurePanel():void {
    if(mode==='config'&&surface==='merchant'&&!merchantMounted){mountMerchant(host.querySelector('[data-employee-provider]')!,false);merchantMounted=true;}
    if(mode==='effective'&&surface==='m'&&mPreviewGeneration!==generation){
      const target=host.querySelector<HTMLElement>('[data-employee-m-preview]')!,child=document.createElement('div');target.replaceChildren(child);
      try{bindMEmployeePreview(child,id,listStaffLoginAccounts().find(a=>a.employeeId===id)?.enabled===true);}catch(e){child.innerHTML=`<p class="pc-error">${esc((e as Error).message)}</p>`;}
      mPreviewGeneration=generation;
    }
    if(mode==='effective'&&surface==='merchant'&&merchantPreviewGeneration!==generation){mountMerchant(host.querySelector('[data-employee-provider-preview]')!,true);merchantPreviewGeneration=generation;}
  }
  host.addEventListener('click',event=>{
    const button=(event.target as Element).closest<HTMLElement>('[data-employee-mode],[data-employee-surface]');if(!button)return;
    const nextMode=button.dataset.employeeMode??mode,nextSurface=button.dataset.employeeSurface??surface;
    if(mode===nextMode&&surface===nextSurface)return;
    if(nextMode==='effective'&&mode!=='effective')generation++;
    mode=nextMode;surface=nextSurface;
    history.replaceState(null,'',`#${route}${mode==='effective'?'/preview':''}${surface==='merchant'?'?surface=merchant':''}`);
    ensurePanel();guard();
  });
  host.querySelectorAll<HTMLElement>('[role="tablist"]').forEach(list=>list.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const buttons=[...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')],index=buttons.indexOf(event.target as HTMLButtonElement);if(index<0)return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length;buttons[next].focus();buttons[next].click();
  }));
  mHost.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(!input.matches('[data-employee-role-search]'))return;roleQuery=input.value;const pos=input.selectionStart;renderM();const next=mHost.querySelector<HTMLInputElement>('[data-employee-role-search]');next?.focus();next?.setSelectionRange(pos,pos);});
  mHost.addEventListener('change',event=>{
    const input=event.target as HTMLInputElement;
    if(!input.dataset.employeeRole||!canAssign())return;
    selected=input.checked?[...new Set([...selected,input.dataset.employeeRole])]:selected.filter(roleId=>roleId!==input.dataset.employeeRole);
    guard();renderM();
  });
  host.addEventListener('click',event=>{
    if(!(event.target as Element).closest('[data-mp-do="save-assignment"]')||!canAssign()||!dirty())return;
    const modal=document.createElement('dialog');modal.className='pc-dialog mp-permission-dialog';
    modal.innerHTML=`<form class="pc"><h2>确认平台管理角色变更</h2><p>员工：${esc(account!.employeeName)}</p><p>角色：${selected.map(roleId=>esc(saved.roles.find(r=>r.id===roleId)?.name??'失效角色')).join('、')||'未分配'}</p><p>仅保存平台管理角色，商户访问授权保持当前状态。</p><p class="pc-error" role="alert"></p><footer><button type="button" data-cancel>取消</button><button type="submit" class="primary">确认保存</button></footer></form>`;
    document.body.append(modal);modal.addEventListener('close',()=>modal.remove());modal.querySelector('[data-cancel]')!.addEventListener('click',()=>modal.close());
    modal.querySelector('form')!.onsubmit=ev=>{
      ev.preventDefault();try{
        if(!listStaffLoginAccounts().some(a=>a.employeeId===id))throw Error('员工不存在，请重新打开员工列表。');
        const next=structuredClone(saved),employee=next.employees.find(e=>e.id===id);
        if(employee)employee.roleIds=[...selected];else next.employees.push({id,roleIds:[...selected]});
        saved=saveMState(next,'分配角色',id,['staff','assign']);guard();renderM();modal.close();
      }catch(e){modal.querySelector('.pc-error')!.textContent=(e as Error).message;}
    };modal.showModal();
  });
  ensurePanel();guard();
}
