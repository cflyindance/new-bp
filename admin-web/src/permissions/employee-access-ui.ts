import { esc } from './center-editor';
import { M_MODULES, mActionKey, mPageKey } from './m-platform-catalog';
import { mResolve } from './m-platform-domain';
import { currentMAccess, readMState, saveMState } from './m-platform-store';
import { listStaffLoginAccounts } from './enterprise-staff-account-store';
import { bindProviderAccess } from './provider-access-ui';
import './employee-access.css';
const prefix='/m-platform/permissions/staff';

export function bindEmployeeAccess(host:HTMLElement,id:string,preview:boolean,setLeave:(guard:(()=>boolean)|undefined)=>void):void {
  const account=listStaffLoginAccounts().find(a=>a.employeeId===id);
  if(!account){host.innerHTML='<p class="pc-empty">员工不存在</p>';return;}
  let saved=readMState(),selected=[...(saved.employees.find(e=>e.id===id)?.roleIds??[])];
  let merchantGuard:(()=>boolean)|undefined;
  const dirty=()=>JSON.stringify([...selected].sort())!==JSON.stringify([...(saved.employees.find(e=>e.id===id)?.roleIds??[])].sort());
  const canAssign=()=>!preview&&currentMAccess(mActionKey('staff','assign'))==='edit';
  const guard=()=>setLeave(dirty()||merchantGuard?()=>{
    if(dirty()&&!confirm('M 平台角色有未保存的修改，确定放弃并离开？'))return false;
    return merchantGuard?.()??true;
  }:undefined);
  const route=`${prefix}/${encodeURIComponent(id)}/roles`;
  host.innerHTML=`<div class="employee-access"><header class="pc-heading"><div class="provider-title"><a class="pc-link" href="#${prefix}">返回列表</a><h1>${preview?'员工权限预览':'配置角色与权限'} · ${esc(account.employeeName)}</h1></div><a class="pc-link" href="#${route}${preview?'':'/preview'}">${preview?'返回配置':'权限预览'}</a></header><p class="pc-muted">${esc(account.loginEmail)} · ${account.enabled?'已启用':'已停用，全部权限不生效'}</p><section class="pc-card employee-m-section" aria-label="M 平台角色"><h2>${preview?'M 平台访问权限':'M 平台角色'}</h2><div data-employee-m></div></section><section class="pc-card employee-provider-section" aria-label="商户访问授权"><div data-employee-provider></div></section></div>`;
  const mHost=host.querySelector<HTMLElement>('[data-employee-m]')!;
  function renderM():void {
    const roleNames=(saved.employees.find(e=>e.id===id)?.roleIds??[]).map(roleId=>saved.roles.find(r=>r.id===roleId)?.name??'失效角色');
    if(preview){
      const value=(key:string)=>mResolve(saved,id,key,account!.enabled);
      mHost.innerHTML=`<p class="pc-muted">${roleNames.map(esc).join('、')||'未分配 M 平台角色'}</p>${M_MODULES.map(module=>{
        const pages=module.pages.filter(p=>value(mPageKey(p.id))!=='hidden');
        return pages.length?`<h3>${esc(module.title)}</h3><table><thead><tr><th>菜单</th><th>访问权限</th><th>允许操作</th></tr></thead><tbody>${pages.map(p=>`<tr><td>${esc(p.title)}</td><td>${value(mPageKey(p.id))==='edit'?'可编辑':'可查看'}</td><td>${p.actions.filter(a=>value(mActionKey(p.id,a.id))==='edit').map(a=>esc(a.title)).join('、')||'无'}</td></tr>`).join('')}</tbody></table>`:'';
      }).join('')||'<p class="pc-empty">暂无可访问的 M 平台菜单</p>'}`;
      return;
    }
    mHost.innerHTML=`<p class="pc-muted">配置员工在 M 平台可以访问的菜单与操作。多角色权限取允许项并集。</p><div class="pc-choice-list">${saved.roles.map(r=>`<label><input type="checkbox" data-employee-role="${esc(r.id)}" ${selected.includes(r.id)?'checked':''} ${canAssign()?'':'disabled'}>${esc(r.name)}</label>`).join('')||'<p>暂无 M 平台角色</p>'}</div><p class="pc-muted">清空选择后，该员工无 M 平台权限。</p><p class="pc-error" role="alert" data-employee-m-error></p><footer class="employee-section-footer"><span role="status" data-employee-m-status>${dirty()?'M 平台角色有未保存的修改':'M 平台角色已保存'}</span><button type="button" class="primary" data-mp-do="save-assignment" ${canAssign()&&dirty()?'':'disabled'}>保存 M 平台角色</button></footer>`;
  }
  renderM();
  const providerHost=host.querySelector<HTMLElement>('[data-employee-provider]')!;
  if(currentMAccess(mPageKey('provider-roles'))==='hidden')providerHost.innerHTML='<h2>商户访问授权</h2><p class="pc-muted">暂无商户访问授权的查看权限</p>';
  else try{bindProviderAccess(providerHost,`${prefix}/${encodeURIComponent(id)}/merchant-access`,g=>{merchantGuard=g;guard();},{embedded:true,employeePreview:preview});}
  catch(e){providerHost.innerHTML=`<h2>商户访问授权</h2><p class="pc-error" role="alert">${esc((e as Error).message)}</p>`;}
  mHost.addEventListener('change',event=>{
    const input=event.target as HTMLInputElement;
    if(!input.dataset.employeeRole||!canAssign())return;
    selected=input.checked?[...new Set([...selected,input.dataset.employeeRole])]:selected.filter(roleId=>roleId!==input.dataset.employeeRole);
    guard();renderM();
  });
  mHost.addEventListener('click',event=>{
    if(!(event.target as Element).closest('[data-mp-do="save-assignment"]')||!canAssign()||!dirty())return;
    const modal=document.createElement('dialog');modal.className='pc-dialog mp-permission-dialog';
    modal.innerHTML=`<form class="pc"><h2>确认 M 平台角色变更</h2><p>员工：${esc(account!.employeeName)}</p><p>角色：${selected.map(roleId=>esc(saved.roles.find(r=>r.id===roleId)?.name??'失效角色')).join('、')||'未分配'}</p><p>仅保存 M 平台角色，商户访问授权保持当前状态。</p><p class="pc-error" role="alert"></p><footer><button type="button" data-cancel>取消</button><button type="submit" class="primary">确认保存</button></footer></form>`;
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
  guard();
}
