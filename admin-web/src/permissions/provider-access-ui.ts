import {brandCatalog,mappedRuntimeKeys} from '../config/brand-access-store';
import {getStoreCapability} from '../config/enterprise-merchant-store';
import { esc, renderPermissionEditor } from './center-editor';
import { buildCenterCatalog } from './center-catalog';
import { roleAccess, type Access, type Role } from './center-domain';
import { applySubmenuMode } from './center-page-mode';
import { applyPageAuthorization, applyPageResourceGrant, assertPageFeatureChoice } from './center-page-policy';
import { authorizationRows } from './center-authorization';
import { applyCategoryGrant } from './center-category-grants';
import { assertSettingChoice } from './center-setting-levels';
import { readProviderState, saveProviderState, currentProviderCanTarget } from './provider-access-store';
import { currentMAccess } from './m-platform-store';
import { mActionKey } from './m-platform-catalog';
import { getEnterpriseMerchantSnapshot } from '../config/enterprise-merchant-store';
import { listStaffLoginAccounts } from './enterprise-staff-account-store';
import { providerRoleAccess, type ProviderBinding } from './provider-access-domain';
import './provider-access.css';
const prefix='/m-platform/permissions/provider-roles';
const link=(path:string,text:string)=>`<a class="pc-link" href="#${path}">${esc(text)}</a>`;
export function bindProviderAccess(host:HTMLElement,path:string,setLeave:(guard:(()=>boolean)|undefined)=>void):void {
  let saved=readProviderState(),draft=structuredClone(saved),page='module:dashboard',group='',query='',preview=false,target='',dirty=false;
  const catalog=buildCenterCatalog(),accounts=listStaffLoginAccounts();
  const roleId=path.startsWith(prefix+'/edit/')?decodeURIComponent(path.slice((prefix+'/edit/').length)):'';
  const staffMatch=/\/staff\/([^/]+)\/merchant-access$/.exec(path);
  const employeeId=staffMatch?decodeURIComponent(staffMatch[1]):'';
  const account=accounts.find(a=>a.employeeId===employeeId);
  const canEdit=()=>currentMAccess(mActionKey('provider-roles','manage'))==='edit';
  const role=()=>draft.roles.find(r=>r.id===roleId);
  const snap=getEnterpriseMerchantSnapshot();
  const brandOptions=snap.merchants.filter(m=>currentProviderCanTarget(m.merchantId)).map(m=>({id:m.merchantId,title:m.name+' · '+m.bid}));
  const storeOptions=snap.stores.filter(s=>currentProviderCanTarget(s.merchantId,s.storeId)).map(s=>({id:s.storeId,title:s.name+' · '+s.storeId}));
  const mark=()=>{dirty=JSON.stringify({roles:draft.roles,employees:draft.employees})!==JSON.stringify({roles:saved.roles,employees:saved.employees});setLeave(dirty?()=>{const destination=location.hash;modal('放弃未保存的修改？','<p>尚未保存的授权修改将被丢弃。</p>',()=>{dirty=false;setLeave(undefined);location.hash=destination;},'放弃修改');return false;}:undefined);};
  const error=(e:unknown)=>{const el=host.querySelector('[data-provider-error]');if(el)el.textContent=(e as Error).message;};
  const members=(id:string)=>draft.employees.filter(e=>e.bindings.some(b=>b.roleId===id)).length;
  function persist(action:string,object:string):void {saved=saveProviderState(draft,saved.revision,object,action);draft=structuredClone(saved);mark();}
  function modal(title:string,body:string,save:(form:HTMLFormElement)=>void,button='保存'):void {
    const el=document.createElement('dialog');el.className='pc-dialog provider-dialog';
    el.innerHTML=`<form class="pc" novalidate><h2>${esc(title)}</h2><div class="pc-form">${body}</div><p class="pc-error" role="alert"></p><footer><button type="button" data-cancel>取消</button><button type="submit" class="primary">${esc(button)}</button></footer></form>`;
    document.body.append(el);el.addEventListener('close',()=>el.remove());
    el.querySelector('[data-cancel]')!.addEventListener('click',()=>el.close());
    el.querySelector('form')!.onsubmit=ev=>{ev.preventDefault();try{save(ev.currentTarget as HTMLFormElement);el.close();render();}catch(e){el.querySelector('.pc-error')!.textContent=(e as Error).message;}};
    el.showModal();
  }
  function roleDialog(id?:string,copy=false):void {
    const original=draft.roles.find(r=>r.id===id);
    modal(copy?'复制访问角色':original?'编辑访问角色':'新建访问角色',`<label>角色名称<input name="name" maxlength="30" value="${esc(copy?'':original?.name??'')}" required></label><label>描述<textarea name="description" maxlength="160">${esc(original?.description??'')}</textarea></label>`,form=>{
      if(!canEdit())throw Error('暂无授权管理权限。');
      const fd=new FormData(form),name=String(fd.get('name')??'').trim(),description=String(fd.get('description')??'').trim();
      if(original&&!copy)Object.assign(draft.roles.find(r=>r.id===id)!,{name,description});
      else draft.roles.push({id:crypto.randomUUID(),name,description,system:false,grants:copy?{...original!.grants}:{}});
      try{persist(copy?'复制访问角色':original?'编辑访问角色':'新建访问角色',name);}catch(e){draft=structuredClone(saved);throw e;}
    });
  }
  const bindings=():ProviderBinding[]=>draft.employees.find(e=>e.employeeId===employeeId)?.bindings??[];
  function bindingDialog(id?:string):void {
    const old=bindings().find(b=>b.id===id);let mode: 'brands'|'stores'=old?.scope.mode??'stores';
    const selected=new Set(old?.scope.ids??[]);
    modal(old?'编辑商户访问范围':'添加商户访问授权',`<label>访问角色<select name="role" required><option value="">请选择角色</option>${draft.roles.map(r=>`<option value="${esc(r.id)}" ${old?.roleId===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label><label>范围类型<select name="mode"><option value="stores" ${mode==='stores'?'selected':''}>指定门店</option><option value="brands" ${mode==='brands'?'selected':''}>指定品牌（含新增门店）</option></select></label><label>查找品牌／门店<input data-scope-search placeholder="名称、BID 或 MID"></label><div class="provider-choices" data-scope-choices></div>`,form=>{
      const fd=new FormData(form),roleId=String(fd.get('role')??'');
      if(!roleId||!selected.size)throw Error('请选择访问角色和至少一个品牌／门店。');
      let employee=draft.employees.find(e=>e.employeeId===employeeId);
      if(!employee){employee={employeeId,bindings:[]};draft.employees.push(employee);}
      const b:ProviderBinding={id:old?.id??crypto.randomUUID(),roleId,scope:{mode,ids:[...selected]}};
      if(old)employee.bindings=employee.bindings.map(x=>x.id===old.id?b:x);else employee.bindings.push(b);
      mark();
    },'加入待保存配置');
    const el=document.querySelector<HTMLDialogElement>('dialog.provider-dialog:last-of-type')!,form=el.querySelector('form')!;
    const draw=()=>{const q=(form.querySelector('[data-scope-search]') as HTMLInputElement).value.trim().toLowerCase();const options=mode==='brands'?brandOptions:storeOptions;
      form.querySelector('[data-scope-choices]')!.innerHTML=options.filter(o=>!q||o.title.toLowerCase().includes(q)).map(o=>`<label><input type="checkbox" data-scope-id="${esc(o.id)}" ${selected.has(o.id)?'checked':''}>${esc(o.title)}</label>`).join('')||'<p>没有可授权的对象</p>';};
    (form.elements.namedItem('mode') as HTMLSelectElement).onchange=ev=>{
      if(selected.size&&!confirm('切换范围类型将清空已选对象，是否继续？')){(ev.target as HTMLSelectElement).value=mode;return;}
      mode=(ev.target as HTMLSelectElement).value as typeof mode;selected.clear();draw();
    };
    form.addEventListener('change',ev=>{const input=ev.target as HTMLInputElement;if(input.dataset.scopeId){if(input.checked)selected.add(input.dataset.scopeId);else selected.delete(input.dataset.scopeId);}});
    form.querySelector('[data-scope-search]')!.addEventListener('input',draw);draw();
  }
  function render():void {
    const positions=[...host.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll,el.scrollTop] as const);
    const readOnly=!canEdit();
    let body='',title='商家后台访问角色与权限';
    if(path===prefix+'/change-log'){
      title='变更记录';
      body=`<table><thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>对象</th></tr></thead><tbody>${saved.logs.map(l=>`<tr><td>${esc(new Date(l.at).toLocaleString())}</td><td>${esc(l.actor)}</td><td>${esc(l.action)}</td><td>${esc(l.object)}</td></tr>`).join('')||'<tr><td colspan="4" class="pc-empty">暂无商家后台访问角色变更记录</td></tr>'}</tbody></table>`;
    }else if(employeeId){
      title='商户访问授权 · '+(account?.employeeName??employeeId);
      if(!account){host.innerHTML='<p class="pc-empty">员工不存在</p>';return;}
      body=`<p class="pc-muted">${esc(account.loginEmail)} · ${account.enabled?'已启用':'已停用，授权不生效'}</p>${draft.systemEmployeeIds.includes(employeeId)?'<p class="pc-notice">系统管理员：全部品牌／门店，按商户菜单上限访问。</p>':`<button type="button" data-provider-add-binding ${readOnly?'disabled':''}>添加访问授权</button><table><thead><tr><th>访问角色</th><th>适用范围</th><th>操作</th></tr></thead><tbody>${bindings().map(b=>`<tr><td>${esc(draft.roles.find(r=>r.id===b.roleId)?.name??'角色失效')}</td><td>${b.scope.mode==='brands'?'品牌（含新增门店）':'指定门店'}<br>${b.scope.ids.map(id=>esc((b.scope.mode==='brands'?snap.merchants.map(m=>({id:m.merchantId,name:m.name})):snap.stores.map(s=>({id:s.storeId,name:s.name}))).find(o=>o.id===id)?.name??id)).join('、')}</td><td><button type="button" data-provider-binding="${esc(b.id)}" ${readOnly?'disabled':''}>编辑</button> <button type="button" data-provider-remove="${esc(b.id)}" ${readOnly?'disabled':''}>移除</button></td></tr>`).join('')||'<tr><td colspan="3">未配置商户访问权限</td></tr>'}</tbody></table>`}`;
    }else if(roleId){
      const r=role();if(!r){host.innerHTML='<p class="pc-empty">访问角色不存在</p>';return;}title=r.name;
      const targetParts=target.split('|'),previewTarget={brandId:targetParts[0]??'',storeId:targetParts[1]||undefined};
      const value=(key:string):Access=>{
        if(preview&&target){
          const ceiling=brandCatalog(previewTarget.brandId,catalog).ceiling;
          const storeCeiling=previewTarget.storeId?mappedRuntimeKeys(new Set(getStoreCapability(previewTarget.storeId)?.enabledKeys??[]),catalog):undefined;
          if(!ceiling.has(key)||storeCeiling&&!storeCeiling.has(key))return 'hidden';
        }
        return roleAccess(r,key,catalog.resources);
      };
      body=`<div class="pc-actions"><button type="button" data-provider-preview>${preview?'返回编辑':'权限预览'}</button>${preview?`<label>预览对象<select data-provider-target><option value="">仅查看角色权限</option>${brandOptions.map(o=>`<option value="${esc(o.id)}" ${target===o.id?'selected':''}>${esc(o.title)}</option>`).join('')}${snap.stores.filter(s=>currentProviderCanTarget(s.merchantId,s.storeId)).map(s=>`<option value="${esc(s.merchantId+'|'+s.storeId)}" ${target===s.merchantId+'|'+s.storeId?'selected':''}>${esc(s.name+' · '+s.storeId)}</option>`).join('')}</select></label>`:''}</div>${renderPermissionEditor({catalog,page,group,preview,readonly:readOnly||preview,staff:false,search:query,own:key=>r.grants[key]??'inherit',value})}`;
    }else{
      body=`<div class="pc-actions"><button type="button" class="primary" data-provider-new ${readOnly?'disabled':''}>新建访问角色</button></div><table><thead><tr><th>访问角色</th><th>描述</th><th>关联员工</th><th>操作</th></tr></thead><tbody>${draft.roles.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.description)||'—'}</td><td>${members(r.id)} 人</td><td>${link(prefix+'/edit/'+encodeURIComponent(r.id),'配置权限')} ${link('/m-platform/permissions/change-log?type=provider&role='+encodeURIComponent(r.id),'查看变更记录')} <button type="button" data-provider-info="${esc(r.id)}" ${readOnly?'disabled':''}>编辑</button> <button type="button" data-provider-copy="${esc(r.id)}" ${readOnly?'disabled':''}>复制</button> <button type="button" data-provider-delete="${esc(r.id)}" ${readOnly?'disabled':''}>删除</button></td></tr>`).join('')||'<tr><td colspan="4" class="pc-empty">暂无商家后台访问角色，请先新建角色。</td></tr>'}</tbody></table>`;
    }
    host.innerHTML=`<div class="provider-access ${roleId?'provider-editor':''}"><header class="pc-heading"><h1>${esc(title)}</h1>${(employeeId||roleId)?link(employeeId?'/m-platform/permissions/staff':prefix,'返回列表'):''}</header><p class="pc-error" data-provider-error role="alert"></p><div class="provider-body">${!employeeId&&!roleId&&draft.roles.some(r=>r.id.startsWith('provider-demo-'))?'<p class="pc-notice">预设测试数据：演示角色未关联员工，标注“演示”的记录不是真实操作历史。</p>':''}${body}</div>${(employeeId||roleId)?`<footer class="pc-footer"><span>${dirty?'有未保存的修改':'已保存'}</span><button type="button" class="primary" data-provider-save ${!dirty||readOnly?'disabled':''}>保存授权</button></footer>`:''}</div>`;
    for(const [id,top]of positions){const el=host.querySelector<HTMLElement>(`[data-scroll="${id}"]`);if(el)el.scrollTop=top;}
  }
  host.addEventListener('click',ev=>{
    const b=(ev.target as Element).closest<HTMLElement>('button');if(!b||b.hasAttribute('disabled'))return;
    try{
      if(b.dataset.page){page=b.dataset.page;group='';render();return;}
      if(b.dataset.group){group=b.dataset.group;render();return;}
      if(b.hasAttribute('data-provider-preview')){preview=!preview;render();return;}
      if(!canEdit())throw Error('暂无授权管理权限。');
      if(b.hasAttribute('data-provider-new')){roleDialog();return;}
      if(b.dataset.providerInfo){roleDialog(b.dataset.providerInfo);return;}
      if(b.dataset.providerCopy){roleDialog(b.dataset.providerCopy,true);return;}
      if(b.dataset.providerDelete){const id=b.dataset.providerDelete;if(members(id))throw Error('此角色仍有员工绑定，请先解除绑定。');modal('删除访问角色','<p>删除后无法恢复。</p>',()=>{draft.roles=draft.roles.filter(r=>r.id!==id);persist('删除访问角色',id);},'确认删除');return;}
      if(b.hasAttribute('data-provider-add-binding')){bindingDialog();return;}
      if(b.dataset.providerBinding){bindingDialog(b.dataset.providerBinding);return;}
      if(b.dataset.providerRemove){const employee=draft.employees.find(e=>e.employeeId===employeeId);if(employee)employee.bindings=employee.bindings.filter(x=>x.id!==b.dataset.providerRemove);mark();render();return;}
      if(b.hasAttribute('data-provider-save')){modal('保存授权',`<p>${roleId?'角色权限调整将影响 '+members(roleId)+' 位已绑定员工。':'保存后将按新的角色及范围计算该员工访问权限。'}</p><p>已进入商家后台的会话会重新校验。</p>`,()=>persist(roleId?'更新访问角色权限':'更新商户访问范围',role()?.name??account?.employeeName??employeeId),'确认保存');return;}
      if(preview||!role())return;
      const value=(key:string)=>roleAccess(role()!,key,catalog.resources),v=b.dataset.value as Access;
      if(b.dataset.submenuMode)applySubmenuMode(catalog,role()!,page,b.dataset.submenuMode,v);
      else if(b.dataset.authorization){const row=authorizationRows(catalog,page).find(r=>r.contentKey===b.dataset.authorization);if(!row)return;assertPageFeatureChoice(page,row,v,value);applyPageAuthorization(catalog,page,role()!.grants,row,v);}
      else if(b.dataset.categoryGrant)applyCategoryGrant(catalog,page,b.dataset.categoryGrant,role()!.grants,v);
      else if(b.dataset.grant){const resource=catalog.resources.get(b.dataset.grant);if(!resource)return;assertSettingChoice(catalog,resource,v,value);applyPageResourceGrant(catalog,page,role()!.grants,resource,v);}
      else return;
      mark();render();
    }catch(e){error(e);}
  });
  host.addEventListener('input',ev=>{const el=ev.target as HTMLInputElement;if(!el.matches('[data-menu-search]'))return;query=el.value;const pos=el.selectionStart;render();const input=host.querySelector<HTMLInputElement>('[data-menu-search]');input?.focus();input?.setSelectionRange(pos,pos);});
  host.addEventListener('change',ev=>{const el=ev.target as HTMLSelectElement;if(el.hasAttribute('data-provider-target')){target=el.value;render();}});
  page=catalog.tree[0]?.key??'';render();
}
