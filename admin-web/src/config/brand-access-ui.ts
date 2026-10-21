import { brandMenuRouteVersion } from './enterprise-merchant-services';
import './brand-access-ui.css';
import { esc } from '../permissions/center-editor';
import { buildCenterCatalog, type Catalog } from '../permissions/center-catalog';
import { roleAccess, type Role, type Binding, type Access } from '../permissions/center-domain';
import { type BrandAccessState, type BrandAccount, updateMenuKeys, brandAccountStores } from './brand-access-domain';
import { authorizeBrandManagement, brandCatalog, brandMenuChoices, brandRawMenuKeys, brandStores, currentBrandPrincipal, readBrandAccess, saveBrandAccess, type MenuChoice } from './brand-access-store';
import { ensureBrandCreationDemoStores, associateBrandStores, brandConfigurationVersion, createMerchant, getBusinessTypeOptions, getGroupsForSelect, getMerchantById, getMerchantCapability, getMerchantChangelog, getMerchantStores, getProductLineOptions, getStoreCapability, getStoreStatusLabel, listBrandAssociationCandidates, saveBrandStoreMenus, saveExplicitBrandMenus } from './enterprise-merchant-store';
import { merchantDetailHref } from './enterprise-merchant-scope';
import { showAppToast } from '../ui/app-toast';

type Source='m-platform'|'merchant';
const button=(text:string,action:string,primary=false)=>`<button type="button" class="ba-btn ${primary?'ba-primary':''}" data-ba="${action}">${text}</button>`;
const date=(value:string)=>new Date(value).toLocaleString('zh-CN');

/** A native dialog supplies focus containment, Escape handling and focus restoration. */
function dialog(title:string,subtitle:string,body:string,onSave:(form:HTMLFormElement,review:HTMLElement)=>boolean|void):HTMLDialogElement {
  const d=document.createElement('dialog');d.className='ba ba-modal';
  d.innerHTML=`<form><header class="ba-dialog-header"><div><h2>${esc(title)}</h2>${subtitle?`<p class="ba-muted">${esc(subtitle)}</p>`:''}</div><button type="button" class="ba-btn" data-close aria-label="关闭">×</button></header><section class="ba-dialog-body">${body}<div class="ba-review" data-review hidden></div><p role="alert" class="ba-error" data-error hidden></p><div class="ba-review" data-discard hidden>有未保存的修改，是否放弃？<div class="ba-actions">${button('继续编辑','keep')}${button('放弃修改','discard')}</div></div></section><footer class="ba-footer"><span class="ba-muted">保存前可核对变更；取消不会写入</span><div class="ba-actions"><button type="button" class="ba-btn" data-close>取消</button><button type="submit" class="ba-btn ba-primary">预览变更</button></div></footer></form>`;
  document.body.append(d);d.showModal();
  const form=d.querySelector('form')!,review=d.querySelector<HTMLElement>('[data-review]')!,error=d.querySelector<HTMLElement>('[data-error]')!;
  let dirty=false,busy=false;
  const close=()=>{if(dirty){d.querySelector<HTMLElement>('[data-discard]')!.hidden=false;}else{d.close();d.remove();}};
  d.addEventListener('cancel',e=>{e.preventDefault();close();});
  d.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',close));
  d.querySelector('[data-ba=keep]')?.addEventListener('click',()=>{d.querySelector<HTMLElement>('[data-discard]')!.hidden=true;});
  d.querySelector('[data-ba=discard]')?.addEventListener('click',()=>{dirty=false;close();});
  form.addEventListener('change',()=>{dirty=true;review.hidden=true;form.querySelector<HTMLButtonElement>('[type=submit]')!.textContent='预览变更';});
  form.addEventListener('input',e=>{if((e.target as HTMLElement).matches('[data-menu-search]'))return;dirty=true;review.hidden=true;form.querySelector<HTMLButtonElement>('[type=submit]')!.textContent='预览变更';});
  const unload=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};
  const originalHash=location.hash;
  const hashGuard=(e:HashChangeEvent)=>{if(location.hash===originalHash)return;if(dirty){e.stopImmediatePropagation();history.replaceState(null,'',originalHash);error.hidden=false;error.textContent='请先保存或关闭当前弹框，修改内容已保留。';}else{d.close();d.remove();}};
  window.addEventListener('hashchange',hashGuard,true);
  window.addEventListener('beforeunload',unload);d.addEventListener('close',()=>{window.removeEventListener('beforeunload',unload);window.removeEventListener('hashchange',hashGuard,true);});
  form.addEventListener('submit',e=>{e.preventDefault();if(busy)return;error.hidden=true;try{busy=true;if(onSave(form,review)===true){dirty=false;d.close();d.remove();}else form.querySelector<HTMLButtonElement>('[type=submit]')!.textContent='确认保存';}catch(err){error.textContent=(err as Error).message;error.hidden=false;}finally{busy=false;}});
  return d;
}

function bindMenuPicker(host:HTMLElement,choices:MenuChoice[],initial:string[],options:{allowed?:Set<string>;roles?:boolean;grants?:Record<string,Access>}={}):()=>string[] {
  const available=choices.filter(c=>!options.allowed||options.allowed.has(c.key));
  const selected=new Set(initial),grants=options.grants;
  const roots=available.filter(c=>c.level===1),byKey=new Map(available.map(c=>[c.key,c]));
  let active=roots[0]?.key??'',query='',selectedOnly=false,reviewAll=false;
  const collapsed=new Set<string>();
  const hiddenByParent=(c:MenuChoice)=>{let parent=c.parent;const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);if(collapsed.has(parent))return true;parent=byKey.get(parent)?.parent;}return false;};
  const rootOf=(c:MenuChoice):string=>{let node=c;const seen=new Set<string>();while(node.parent&&byKey.has(node.parent)&&!seen.has(node.key)){seen.add(node.key);node=byKey.get(node.parent)!;}return node.key;};
  const descendants=(key:string)=>available.filter(c=>{let parent=c.parent;const seen=new Set<string>();while(parent&&!seen.has(parent)){if(parent===key)return true;seen.add(parent);parent=byKey.get(parent)?.parent;}return false;});
  const stateOf=(c:MenuChoice)=>{const children=descendants(c.key);return selected.has(c.key)&&children.every(x=>selected.has(x.key))?'已开通':selected.has(c.key)||children.some(x=>selected.has(x.key))?'部分开通':'未开通';};
  const pathOf=(c:MenuChoice)=>{const names:string[]=[];let parent=c.parent;const seen=new Set<string>();while(parent&&byKey.has(parent)&&!seen.has(parent)){seen.add(parent);const node=byKey.get(parent)!;names.unshift(node.title);parent=node.parent;}return names.join(' / ');};
  const render=()=>{
    const pageCount=(key:string)=>{const pages=descendants(key).filter(c=>c.isPage===true);return `${pages.filter(c=>selected.has(c.key)).length}/${pages.length}`;};
    const matches=new Set<string>();
    const includeWithParents=(c:MenuChoice)=>{matches.add(c.key);let parent=c.parent;const seen=new Set<string>();while(parent&&!seen.has(parent)){seen.add(parent);matches.add(parent);parent=byKey.get(parent)?.parent;}};
    const filtered=Boolean(query||selectedOnly||reviewAll);
    if(filtered)for(const c of available){if(!reviewAll&&rootOf(c)!==active&&!query)continue;if((selectedOnly||reviewAll)&&!selected.has(c.key))continue;if(query&&!`${c.title} ${c.path??''} ${pathOf(c)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()))continue;includeWithParents(c);}
    const rows=available.filter(c=>((reviewAll||query)||rootOf(c)===active)&&(c.level!==1||reviewAll||query)&&(filtered?matches.has(c.key):!hiddenByParent(c)));
    const row=(c:MenuChoice)=>{const children=descendants(c.key),state=stateOf(c),type=c.level===1?'目录':c.isPage===true?'页面':c.kind==='setting'?'设置项':'分组';return `<tr data-menu-row="${esc(c.key)}"><td><div class="ba-tree-name" style="--menu-depth:${Math.max(0,c.level-(reviewAll||query?1:2))}">${children.length?`<button type="button" class="ba-menu-toggle" data-menu-toggle="${esc(c.key)}" aria-expanded="${filtered||!collapsed.has(c.key)}" aria-label="${!filtered&&collapsed.has(c.key)?'展开':'收起'}${esc(c.title)}" ${filtered?'disabled':''}>${!filtered&&collapsed.has(c.key)?'▸':'▾'}</button>`:'<span class="ba-menu-toggle-space" aria-hidden="true"></span>'}<input type="checkbox" data-key="${esc(c.key)}" aria-label="开通${esc(c.title)}" ${selected.has(c.key)?'checked':''}><span class="ba-tree-title">${esc(c.title)}</span><span class="ba-tree-type">${type}</span>${query&&pathOf(c)?`<span class="ba-tree-path">${esc(pathOf(c))}</span>`:''}</div></td><td><div class="ba-tree-grant">${options.roles&&c.kind==='setting'&&selected.has(c.key)?`<select data-edit="${esc(c.key)}" aria-label="${esc(c.title)}编辑权限"><option value="read" ${grants?.[c.key]!=='edit'?'selected':''}>仅查看</option><option value="edit" ${grants?.[c.key]==='edit'?'selected':''}>可编辑</option></select>`:''}${state==='部分开通'?'<span class="ba-tree-partial">部分开通</span>':''}</div></td></tr>`;};
    host.innerHTML=`<div class="ba-toolbar"><input data-menu-search aria-label="搜索菜单" placeholder="搜索菜单名称或路由" value="${esc(query)}"><span class="ba-tag" data-menu-count>已选 ${roots.filter(c=>selected.has(c.key)||descendants(c.key).some(x=>selected.has(x.key))).length} 个分类 · ${available.filter(c=>c.isPage===true&&selected.has(c.key)).length} 个页面</span><label class="ba-tree-select-all"><input type="checkbox" data-menu-select-all aria-label="全选全部菜单">全选全部菜单</label><button type="button" class="ba-btn" data-only-selected aria-pressed="${selectedOnly}">${selectedOnly?'✓ ':''}仅看已选</button><button type="button" class="ba-btn" data-menu-review aria-pressed="${reviewAll}">${reviewAll?'返回配置':'查看已选'}</button></div><div class="ba-menu ba-tree-picker"><nav aria-label="菜单分类">${roots.map(r=>`<div class="ba-tree-class"><input type="checkbox" data-key="${esc(r.key)}" aria-label="开通整个分类${esc(r.title)}" ${selected.has(r.key)?'checked':''}><button type="button" class="${active===r.key&&!reviewAll?'active':''}" data-module="${esc(r.key)}"><span>${esc(r.title)}</span><span class="ba-tree-nav-count">${pageCount(r.key)}</span></button></div>`).join('')}</nav><div class="ba-tree-pane"><header class="ba-tree-heading"><strong>${reviewAll?'已选菜单核对':query?'搜索结果':esc(byKey.get(active)?.title??'菜单选择')}</strong><div class="ba-actions">${button('展开全部','expand-all')}${button('收起全部','collapse-all')}${!reviewAll&&!query?button('全选当前分类','select-module')+button('清空当前分类','clear-module'):''}</div></header><div class="ba-menu-list"><table class="ba-tree-table"><thead><tr><th scope="col">菜单名称</th><th scope="col">${options.roles?'权限':'状态'}</th></tr></thead><tbody>${rows.map(row).join('')||`<tr><td colspan="2" class="ba-empty">${reviewAll||selectedOnly?'暂无已选菜单':'没有匹配菜单'}</td></tr>`}</tbody></table></div></div></div>`;
    host.querySelectorAll<HTMLButtonElement>('[data-ba=expand-all],[data-ba=collapse-all]').forEach(button=>{button.disabled=filtered;button.title=filtered?'筛选结果自动显示完整路径':'';});
    host.querySelector('[data-only-selected]')?.addEventListener('click',()=>{selectedOnly=!selectedOnly;render();});
    host.querySelector('[data-menu-review]')?.addEventListener('click',()=>{reviewAll=!reviewAll;render();});
    host.querySelector('[data-ba=expand-all]')?.addEventListener('click',()=>{for(const c of available.filter(c=>rootOf(c)===active))collapsed.delete(c.key);render();});
    host.querySelector('[data-ba=collapse-all]')?.addEventListener('click',()=>{for(const c of available.filter(c=>rootOf(c)===active&&c.level>1&&descendants(c.key).length))collapsed.add(c.key);render();});
    host.querySelectorAll<HTMLButtonElement>('[data-menu-toggle]').forEach(button=>button.onclick=()=>{const key=button.dataset.menuToggle!,scroll=host.querySelector('.ba-menu-list')!.scrollTop;collapsed.has(key)?collapsed.delete(key):collapsed.add(key);render();host.querySelector('.ba-menu-list')!.scrollTop=scroll;host.querySelectorAll<HTMLButtonElement>('[data-menu-toggle]').forEach(next=>{if(next.dataset.menuToggle===key)next.focus({preventScroll:true});});});
    const search=host.querySelector<HTMLInputElement>('[data-menu-search]')!;
    search.oninput=()=>{const pos=search.selectionStart;query=search.value;render();const next=host.querySelector<HTMLInputElement>('[data-menu-search]')!;next.focus();next.setSelectionRange(pos,pos);};
    host.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(b=>b.onclick=()=>{active=b.dataset.module!;reviewAll=false;render();});
    const toggle=(key:string,on:boolean)=>{
      for(const c of [byKey.get(key)!,...descendants(key)]){if(!c)continue;if(on){selected.add(c.key);if(grants)grants[c.key]=grants[c.key]??'read';}else{selected.delete(c.key);if(grants)grants[c.key]='hidden';}}
      if(on){let p=byKey.get(key)?.parent;while(p){selected.add(p);if(grants)grants[p]='read';p=byKey.get(p)?.parent;}}
      else{let p=byKey.get(key)?.parent;while(p){if(!descendants(p).some(c=>selected.has(c.key))){selected.delete(p);if(grants)grants[p]='hidden';}p=byKey.get(p)?.parent;}}
    };
    const all=host.querySelector<HTMLInputElement>('[data-menu-select-all]')!;all.checked=available.length>0&&available.every(c=>selected.has(c.key));all.indeterminate=available.some(c=>selected.has(c.key))&&!all.checked;all.disabled=!available.length;all.onchange=()=>{roots.forEach(root=>toggle(root.key,all.checked));render();host.dispatchEvent(new Event('change',{bubbles:true}));};
    host.querySelectorAll<HTMLInputElement>('[data-key]').forEach(c=>{c.onchange=()=>{toggle(c.dataset.key!,c.checked);render();};const children=descendants(c.dataset.key!);c.indeterminate=children.some(x=>selected.has(x.key))&&!children.every(x=>selected.has(x.key));});
    host.querySelectorAll<HTMLSelectElement>('[data-edit]').forEach(el=>el.onchange=()=>{if(grants)grants[el.dataset.edit!]=el.value as Access;});
    host.querySelector('[data-ba=select-module]')?.addEventListener('click',()=>{toggle(active,true);render();host.dispatchEvent(new Event('change',{bubbles:true}));});
    host.querySelector('[data-ba=clear-module]')?.addEventListener('click',()=>{toggle(active,false);render();host.dispatchEvent(new Event('change',{bubbles:true}));});
  };render();return()=>[...selected];
}

function brandMenuSelectionSummary(keys:string[],choices:MenuChoice[]):string {
  const selected=new Set(keys),byKey=new Map(choices.map(c=>[c.key,c]));
  const rootOf=(c:MenuChoice)=>{let current=c;const seen=new Set<string>();while(current.parent&&byKey.has(current.parent)&&!seen.has(current.key)){seen.add(current.key);current=byKey.get(current.parent)!;}return current.key;};
  const groups=choices.filter(c=>c.level===1).map(root=>{const items=choices.filter(c=>c.level>1&&selected.has(c.key)&&rootOf(c)===root.key);return items.length?`<details open><summary>${esc(root.title)} · ${items.filter(c=>c.isPage===true).length} 个页面</summary><ul>${items.map(c=>`<li>${esc(c.title)} <small>${c.isPage===true?'页面':c.kind==='setting'?'设置项':'分组'}</small></li>`).join('')}</ul></details>`:'';}).join('');
  return `<div class="ba-selection-summary"><h3>本次开通范围</h3>${groups||'<p>未选择功能菜单</p>'}</div>`;
}

function menuDiff(review:HTMLElement,before:string[],after:string[],choices:MenuChoice[],prefix=''):void {
  const names=new Map(choices.map(c=>[c.key,c.title]));
  const added=after.filter(k=>!before.includes(k)),removed=before.filter(k=>!after.includes(k));
  review.innerHTML+=`<h3>${esc(prefix)} · 新增 ${added.length} 项 / 关闭 ${removed.length} 项</h3><ul>${added.map(k=>`<li>开通：${esc(names.get(k)??k)}</li>`).join('')}${removed.map(k=>`<li>关闭：${esc(names.get(k)??k)}</li>`).join('')}</ul>`;
}

export function openBrandStoreMenuEditor(id:string,storeIds:string[],source:Source,onSaved:()=>void):void {
  authorizeBrandManagement(id,source);
  const cap=getMerchantCapability(id),version=brandConfigurationVersion(id);
  const stores=getMerchantStores(id).filter(s=>storeIds.includes(s.storeId));
  if(!cap||!stores.length)return;
  const ceiling=brandRawMenuKeys(id),choices=brandMenuChoices(cap.productLineIds);
  const initial=stores.length===1?getStoreCapability(stores[0]!.storeId)?.enabledKeys??[]:[];
  let read=()=>initial;
  const d=dialog(stores.length===1?`${stores[0]!.name} · 菜单开通`:`批量配置 ${stores.length} 家门店`,'',`<div class="ba-note">${stores.map(s=>esc(s.name)).join('、')}<br>品牌未开通的菜单不会出现在可选范围中。</div>${stores.length>1?'<label class="ba-field">配置方式<select name="mode"><option value="add">增量开通：保留各店原有菜单</option><option value="replace">替换配置：各店统一为本次选择</option></select></label><br>':'<input type="hidden" name="mode" value="replace">'}<div data-menu-picker></div>`,(form,review)=>{
    const selected=read(),mode=new FormData(form).get('mode') as 'add'|'replace';
    if(review.hidden){review.innerHTML='';for(const s of stores){const before=getStoreCapability(s.storeId)?.enabledKeys??[];menuDiff(review,before,updateMenuKeys(before,selected,mode,ceiling),choices,s.name);}review.hidden=false;return;}
    saveBrandStoreMenus(id,storeIds,selected,mode,version,authorizeBrandManagement(id,source),source==='merchant'?'品牌 Admin':'M 平台运营');
    showAppToast('门店菜单已保存',{variant:'success'});onSaved();return true;
  });
  read=bindMenuPicker(d.querySelector('[data-menu-picker]')!,choices,initial,{allowed:ceiling});
}

function openBrandMenus(id:string,onSaved:()=>void):void {
  const cap=getMerchantCapability(id)!;const version=brandConfigurationVersion(id),before=[...brandRawMenuKeys(id)];
  const choices=brandMenuChoices(cap.productLineIds);let read=()=>before;
  const d=dialog('编辑品牌菜单','从菜单路由选择品牌功能上限；不会自动给门店开通新增菜单。','<div class="ba-note">取消品牌菜单后，品牌门店对应菜单同步失效。账号角色中原授权保留记录，超出品牌上限的部分不生效。</div><div data-menu-picker></div>',(_form,review)=>{
    const next=read();if(review.hidden){review.innerHTML='';menuDiff(review,before,next,choices,'品牌菜单');const impacted=getMerchantStores(id).filter(s=>(getStoreCapability(s.storeId)?.enabledKeys??[]).some(k=>!next.includes(k)));review.innerHTML+=`<p class="ba-muted">受收回影响的门店：${impacted.map(s=>esc(s.name)).join('、')||'无'}</p>`;review.hidden=false;return;}
    saveExplicitBrandMenus(id,next,version,authorizeBrandManagement(id,'m-platform'));showAppToast('品牌菜单已保存',{variant:'success'});onSaved();return true;
  });read=bindMenuPicker(d.querySelector('[data-menu-picker]')!,choices,before);
}

function openAssociation(id:string,onSaved:()=>void):void {
  const merchant=getMerchantById(id)!;const version=brandConfigurationVersion(id),candidates=listBrandAssociationCandidates(merchant.groupId).filter(s=>s.merchantId!==id);
  const d=dialog('关联已有门店','仅选择同集团下可关联的独立门店；已有其他品牌归属的门店不能直接转移。',`<input data-store-search placeholder="搜索门店名称 / MID" aria-label="搜索门店"><div class="ba-checks">${candidates.map(s=>`<label data-candidate="${esc(s.name+' '+s.storeId)}"><input type="checkbox" name="storeIds" value="${esc(s.storeId)}"><span>${esc(s.name)}<br><small>${esc(s.storeId)} · ${esc(s.address??'暂无地址')}</small></span></label>`).join('')||'<p class="ba-empty">暂无可关联门店</p>'}</div>`,(form,review)=>{const ids=new FormData(form).getAll('storeIds').map(String);if(!ids.length)throw Error('请至少选择一家门店。');if(review.hidden){review.innerHTML=`将关联 ${ids.length} 家门店。保留原 MID，门店菜单默认关闭，保存后可单独或批量开通。`;review.hidden=false;return;}associateBrandStores(id,ids,version,authorizeBrandManagement(id,'m-platform'));onSaved();return true;});
  d.querySelector<HTMLInputElement>('[data-store-search]')!.oninput=e=>{const query=(e.target as HTMLInputElement).value.toLowerCase();d.querySelectorAll<HTMLElement>('[data-candidate]').forEach(el=>el.hidden=!el.dataset.candidate!.toLowerCase().includes(query));};
}

function resourceChoices(catalog:Catalog,ceiling:Set<string>):MenuChoice[]{
  return [...catalog.resources.values()].filter(r=>ceiling.has(r.key)&&!r.compatibilityOnly&&r.type!=='action').map(r=>({key:r.key,title:r.title,parent:r.parent,level:r.type==='module'?1:r.type==='page'||r.type==='navigation'?2:r.type==='setting'?4:3,path:r.path,kind:r.type==='setting'?'setting':'menu'}));
}

function openRole(id:string,roleId:string|undefined,source:Source,onSaved:()=>void):void {
  const state=readBrandAccess(id),draft=structuredClone(state),existing=draft.roles.find(r=>r.id===roleId);
  const role:Role=existing??{id:crypto.randomUUID(),name:'',description:'',system:false,grants:{}};
  const {catalog,ceiling}=brandCatalog(id);let read=()=>[] as string[];
  const actions=[...catalog.resources.values()].filter(r=>r.type==='action'&&ceiling.has(r.key));
  const d=dialog(existing?'编辑角色':'新建角色','角色在品牌内复用；为账号分配角色时，再选择各自生效的门店。',`<div class="ba-grid"><label class="ba-field">角色名称 *<input name="name" required maxlength="30" value="${esc(role.name)}"></label><label class="ba-field">描述<input name="description" maxlength="160" value="${esc(role.description)}"></label></div><br><div data-menu-picker></div><details class="ba-card" style="margin-top:16px"><summary>页面操作权限（${actions.length} 项）</summary><p class="ba-muted">仅在对应页面已授权且门店已开通时生效。</p><div class="ba-checks">${actions.map(a=>`<label><input type="checkbox" name="actions" value="${esc(a.key)}" ${role.grants[a.key]==='edit'?'checked':''}>${esc(catalog.resources.get(a.parent??'')?.title)} · ${esc(a.title)}</label>`).join('')}</div></details>`,(form,review)=>{
    const fd=new FormData(form);role.name=String(fd.get('name')??'').trim();role.description=String(fd.get('description')??'');
    const chosen=new Set(read());for(const c of resourceChoices(catalog,ceiling)){if(!chosen.has(c.key))role.grants[c.key]='hidden';else role.grants[c.key]=role.grants[c.key]==='edit'&&c.kind==='setting'?'edit':'read';}
    for(const a of actions)role.grants[a.key]=fd.getAll('actions').includes(a.key)?'edit':'hidden';
    if(review.hidden){review.textContent=`角色「${role.name}」：已选 ${chosen.size} 个菜单及内容项，允许 ${fd.getAll('actions').length} 项页面操作。角色变更对所有绑定账号生效。`;review.hidden=false;return;}
    if(!draft.roles.some(r=>r.id===role.id))draft.roles.push(role);saveBrandAccess(draft,state.version,authorizeBrandManagement(id,source),'保存角色');onSaved();return true;
  });read=bindMenuPicker(d.querySelector('[data-menu-picker]')!,resourceChoices(catalog,ceiling),Object.keys(role.grants).filter(k=>role.grants[k]!=='hidden'),{roles:true,grants:role.grants});
}

function openAccount(id:string,accountId:string|undefined,source:Source,onSaved:()=>void):void {
  const state=readBrandAccess(id),draft=structuredClone(state),existing=draft.accounts.find(a=>a.id===accountId),merchant=getMerchantById(id)!;
  const account:BrandAccount=existing??{id:crypto.randomUUID(),name:'',email:state.accounts.length?'':merchant.primaryAdminEmail??'',password:'',enabled:true,admin:!state.accounts.length};
  const bindings:Binding[]=structuredClone(draft.employees.find(e=>e.id===account.id)?.bindings??[]),stores=brandStores(id);
  const d=dialog(existing?'管理登录账号':'开通登录账号','品牌 Admin 管理全品牌；普通账号按每次角色分配的门店范围生效。',`<div class="ba-grid"><label class="ba-field">姓名 *<input required name="name" maxlength="30" value="${esc(account.name)}"></label><label class="ba-field">登录邮箱 *<input required type="email" name="email" value="${esc(account.email)}" placeholder="name@menusifu.cn" ${existing?'readonly':''}></label><label class="ba-field">${existing?'重设密码（留空不修改）':'登录密码 *'}<input type="password" name="password" minlength="6" autocomplete="new-password" ${existing?'':'required'}></label><label class="ba-field">账号身份<select name="admin"><option value="false" ${!account.admin?'selected':''}>普通账号</option><option value="true" ${account.admin?'selected':''}>品牌 Admin</option></select></label></div><p class="ba-muted" style="margin:12px 0">当前为本地演示登录，与项目现有登录方式一致。</p><label class="ba-actions"><input type="checkbox" name="enabled" ${account.enabled?'checked':''}>启用账号</label><section data-binding-panel style="margin-top:18px"><div class="ba-section-title"><h3>角色与生效门店</h3>${button('添加角色分配','add-binding')}</div><div data-bindings></div></section><p class="ba-note" data-admin-note>品牌 Admin 自动覆盖该品牌全部门店及后续新加入的门店；不影响具体门店的菜单开通状态。</p>`,(form,review)=>{
    const fd=new FormData(form);Object.assign(account,{name:String(fd.get('name')??'').trim(),email:String(fd.get('email')??'').trim().toLowerCase(),password:String(fd.get('password')??'')||account.password,enabled:fd.get('enabled')==='on',admin:fd.get('admin')==='true'});
    if(account.admin && !account.enabled && draft.accounts.filter(a=>a.admin&&a.enabled&&a.id!==account.id).length===0)throw Error('请先开通另一名品牌 Admin，再停用最后一名管理员。');
    if(!account.admin && bindings.length===0)throw Error('普通账号至少需要一次角色与门店分配。');
    if(review.hidden){review.textContent=`${account.name} · ${account.email} · ${account.admin?'品牌 Admin（全部品牌门店）':`${bindings.length} 次角色分配`} · ${account.enabled?'启用':'停用'}。`;review.hidden=false;return;}
    if(!draft.accounts.some(a=>a.id===account.id))draft.accounts.push(account);
    const employee={id:account.id,name:account.name,email:account.email,status:account.enabled?'enabled' as const:'disabled' as const,bindings:account.admin?[]:bindings,overrides:{}};
    draft.employees=draft.employees.filter(e=>e.id!==account.id);draft.employees.push(employee);
    saveBrandAccess(draft,state.version,authorizeBrandManagement(id,source),'保存账号及角色门店范围');onSaved();return true;
  });
  const form=d.querySelector('form')!;
  const renderBindings=()=>{
    d.querySelector('[data-bindings]')!.innerHTML=bindings.map((b,i)=>`<div class="ba-binding"><div class="ba-actions"><label class="ba-field" style="flex:1">角色<select data-role="${i}"><option value="">请选择角色</option>${draft.roles.map(r=>`<option value="${esc(r.id)}" ${b.roleId===r.id?'selected':''}>${esc(r.name)}</option>`).join('')}</select></label><button type="button" class="ba-btn" data-remove="${i}">移除</button></div><p class="ba-muted" style="margin-top:10px">该角色仅在以下门店生效</p><div class="ba-checks">${stores.map(s=>`<label><input type="checkbox" data-binding="${i}" value="${esc(s.id)}" ${b.scope.ids.includes(s.id)?'checked':''}>${esc(s.title)}</label>`).join('')||'<p class="ba-muted">请先关联门店</p>'}</div></div>`).join('')||'<div class="ba-empty">尚未分配角色；请先创建角色，再添加分配</div>';
    d.querySelectorAll<HTMLSelectElement>('[data-role]').forEach(el=>el.onchange=()=>bindings[Number(el.dataset.role)]!.roleId=el.value);
    d.querySelectorAll<HTMLInputElement>('[data-binding]').forEach(el=>el.onchange=()=>{const b=bindings[Number(el.dataset.binding)]!;b.scope.ids=el.checked?[...b.scope.ids,el.value]:b.scope.ids.filter(x=>x!==el.value);});
    d.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach(el=>el.onclick=()=>{bindings.splice(Number(el.dataset.remove),1);renderBindings();form.dispatchEvent(new Event('change',{bubbles:true}));});
  };renderBindings();
  d.querySelector('[data-ba=add-binding]')?.addEventListener('click',()=>{bindings.push({id:crypto.randomUUID(),roleId:'',scope:{mode:'stores',ids:[]}});renderBindings();form.dispatchEvent(new Event('change',{bubbles:true}));});
  const sync=()=>{const admin=(form.elements.namedItem('admin') as HTMLSelectElement).value==='true';d.querySelector<HTMLElement>('[data-binding-panel]')!.hidden=admin;d.querySelector<HTMLElement>('[data-admin-note]')!.hidden=!admin;};
  form.querySelector('[name=admin]')!.addEventListener('change',sync);sync();
}

export function renderBrandWorkspace(id:string,tab:string,source:Source='m-platform'):string {
  return `<section class="ba" data-brand-workbench data-brand="${esc(id)}" data-tab="${esc(tab)}" data-source="${source}"><div class="ba-empty">正在加载品牌配置…</div></section>`;
}

export function bindBrandWorkspaces():void {
  document.querySelectorAll<HTMLElement>('[data-brand-workbench]').forEach(root=>{
    if(root.dataset.bound)return;root.dataset.bound='true';
    const id=root.dataset.brand!,tab=root.dataset.tab!,source=root.dataset.source as Source;
    const render=()=>{
      const merchant=getMerchantById(id);if(!merchant){root.innerHTML='<p class="ba-error">品牌不存在</p>';return;}
      const state=readBrandAccess(id),cap=getMerchantCapability(id),stores=getMerchantStores(id).filter(s=>{const p=currentBrandPrincipal();return source==='m-platform'||p?.account.admin||!!p&&brandAccountStores(p.state,p.account,brandStores(id)).includes(s.storeId);}),keys=brandRawMenuKeys(id),choices=brandMenuChoices(cap?.productLineIds);
      const admin=source==='m-platform'||(currentBrandPrincipal()?.merchantId===id&&currentBrandPrincipal()?.account.admin);
      const pageCount=choices.filter(c=>c.isPage===true&&keys.has(c.key)).length;
      const stats=`<div class="ba-stats"><div class="ba-stat"><span class="ba-muted">品牌开通页面</span><strong>${pageCount}<small> 个</small></strong></div><div class="ba-stat"><span class="ba-muted">品牌门店</span><strong>${stores.length}<small> 家</small></strong></div><div class="ba-stat"><span class="ba-muted">已配置门店菜单</span><strong>${stores.filter(s=>getStoreCapability(s.storeId)?.enabledKeys.length).length}<small> 家</small></strong></div></div>`;
      if(tab==='capabilities'){
        root.innerHTML=`<header class="ba-head"><div><h2>品牌菜单</h2></div>${source==='m-platform'?button('编辑品牌菜单','edit-menu',true):'<span class="ba-tag">品牌菜单由 M 平台开通</span>'}</header>${stats}<div data-menu-read></div>`;
        const grouped=choices.filter(c=>c.level===1&&keys.has(c.key));
        root.querySelector('[data-menu-read]')!.innerHTML=grouped.map(g=>`<section class="ba-card"><div class="ba-section-title"><h3>${esc(g.title)}</h3><span class="ba-tag active">已开通</span></div><div class="ba-actions">${choices.filter(c=>c.isPage===true&&keys.has(c.key)&&c.parent===g.key).map(c=>`<span class="ba-tag">${esc(c.title)}</span>`).join('')||'<span class="ba-muted">仅目录开通，尚未选择页面</span>'}</div></section>`).join('')||'<div class="ba-card ba-empty">尚未开通菜单。由 M 平台选择品牌可用范围。</div>';
      }else if(tab==='accounts'){
        root.innerHTML=`<header class="ba-head"><div><h2>账号与角色</h2></div>${admin?`<div class="ba-actions">${button('新建角色','new-role')}${button('开通账号','new-account',true)}</div>`:''}</header><section class="ba-card"><h3 style="margin-bottom:16px">登录账号 <span class="ba-tag">${state.accounts.length}</span></h3><div class="ba-table-wrap"><table><thead><tr><th>账号</th><th>身份</th><th>角色与生效门店</th><th>状态</th><th>操作</th></tr></thead><tbody>${state.accounts.map(a=>{const e=state.employees.find(e=>e.id===a.id);return `<tr><td>${esc(a.name)}<br><small>${esc(a.email)}</small></td><td><span class="ba-tag ${a.admin?'active':''}">${a.admin?'品牌 Admin':'普通账号'}</span></td><td>${a.admin?'全部品牌门店（含新增门店）':e?.bindings.map(b=>`${esc(state.roles.find(r=>r.id===b.roleId)?.name??'角色缺失')} · ${b.scope.ids.length} 家门店`).join('<br>')||'未分配'}</td><td>${a.enabled?'已启用':'已停用'}</td><td>${admin?button('管理账号',`account:${a.id}`):'—'}</td></tr>`;}).join('')||`<tr><td colspan="5" class="ba-empty">尚未单独开通账号${merchant.accountProvisioningRequired?'，请先开通品牌 Admin':'；已有品牌管理员继续使用原登录方式'}</td></tr>`}</tbody></table></div></section><section class="ba-card"><h3>品牌角色 <span class="ba-tag">${state.roles.length}</span></h3>${state.roles.map(r=>`<div class="ba-role-line"><div><strong>${esc(r.name)}</strong><p class="ba-muted">${esc(r.description)||'未填写描述'} · ${state.employees.filter(e=>e.bindings.some(b=>b.roleId===r.id)).length} 个账号使用</p></div>${admin?button('编辑权限',`role:${r.id}`):''}</div>`).join('')||'<p class="ba-empty">尚未创建角色。建议按店长、财务等岗位建立，再分配给账号。</p>'}</section>`;
      }else if(tab==='changelog'){
        const rows=[...state.logs.map(l=>({at:l.at,actor:l.actor,detail:l.action})),...getMerchantChangelog(id).map(l=>({at:l.at,actor:l.operatorEmail,detail:l.detail}))].sort((a,b)=>b.at.localeCompare(a.at));
        root.innerHTML=`<header class="ba-head"><div><h2>变更记录</h2></div></header><div class="ba-table-wrap"><table><thead><tr><th>时间</th><th>操作人</th><th>变更内容</th></tr></thead><tbody>${rows.map(l=>`<tr><td>${esc(date(l.at))}</td><td>${esc(l.actor)}</td><td>${esc(l.detail)}</td></tr>`).join('')||'<tr><td colspan="3" class="ba-empty">暂无变更记录</td></tr>'}</tbody></table></div>`;
      }else{
        root.innerHTML=`<header class="ba-head"><div><h2>品牌门店</h2></div><div class="ba-actions">${source==='m-platform'?button('关联已有门店','associate'):''}${admin?button('批量开通菜单','batch',true):''}</div></header>${stats}<div class="ba-toolbar"><input data-store-query placeholder="搜索门店名称 / MID" aria-label="搜索品牌门店"><span class="ba-muted">${source==='merchant'?'门店归属由 M 平台维护；菜单可由品牌 Admin 配置':'关联新店后菜单默认关闭，可单独或批量开通'}</span></div><div class="ba-table-wrap"><table><thead><tr><th><input type="checkbox" data-select-all aria-label="选择全部可见门店"></th><th>门店名称 / MID</th><th>营业状态</th><th>菜单开通</th><th>最近配置</th><th>操作</th></tr></thead><tbody>${stores.map(s=>{const sc=getStoreCapability(s.storeId);return `<tr data-store-row="${esc(s.name+' '+s.storeId)}"><td><input type="checkbox" data-store-id="${esc(s.storeId)}" aria-label="选择${esc(s.name)}"></td><td><strong>${esc(s.name)}</strong><br><small>${esc(s.storeId)} · ${esc(s.address??'暂无地址')}</small></td><td><span class="ba-tag">${esc(getStoreStatusLabel(s.status))}</span></td><td><span class="ba-tag ${sc?.enabledKeys.length?'active':''}">${sc?.enabledKeys.length?`${choices.filter(c=>c.isPage===true&&sc.enabledKeys.includes(c.key)).length} 个页面`:'未开通'}</span></td><td><small>${sc?.updatedAt?esc(date(sc.updatedAt)):'—'}${sc?.updatedBy?`<br>${esc(sc.updatedBy)}`:''}</small></td><td>${admin?button('配置菜单',`store:${s.storeId}`):'—'}</td></tr>`;}).join('')||'<tr><td colspan="6" class="ba-empty">暂无品牌门店，请先关联已有门店。</td></tr>'}</tbody></table></div>`;
        root.querySelector<HTMLInputElement>('[data-store-query]')!.oninput=e=>{const q=(e.target as HTMLInputElement).value.toLowerCase();root.querySelectorAll<HTMLElement>('[data-store-row]').forEach(row=>row.hidden=!row.dataset.storeRow!.toLowerCase().includes(q));};
        root.querySelector<HTMLInputElement>('[data-select-all]')!.onchange=e=>root.querySelectorAll<HTMLInputElement>('[data-store-id]').forEach(c=>{if(!c.closest<HTMLElement>('tr')!.hidden)c.checked=(e.target as HTMLInputElement).checked;});
      }
      root.querySelectorAll<HTMLButtonElement>('[data-ba]').forEach(b=>b.onclick=()=>{try{
        const action=b.dataset.ba!;
        if(action==='edit-menu')openBrandMenus(id,render);
        if(action==='associate')openAssociation(id,render);
        if(action==='new-account')openAccount(id,undefined,source,render);
        if(action==='new-role')openRole(id,undefined,source,render);
        if(action.startsWith('account:'))openAccount(id,action.slice(8),source,render);
        if(action.startsWith('role:'))openRole(id,action.slice(5),source,render);
        if(action.startsWith('store:'))openBrandStoreMenuEditor(id,[action.slice(6)],source,render);
        if(action==='batch'){const ids=[...root.querySelectorAll<HTMLInputElement>('[data-store-id]:checked')].map(c=>c.dataset.storeId!);if(!ids.length)throw Error('请先选择需要配置的门店。');openBrandStoreMenuEditor(id,ids,source,render);}
      }catch(e){showAppToast((e as Error).message,{variant:'error'});}});
    };try{render();}catch(e){root.innerHTML=`<p class="ba-error">${esc((e as Error).message)}</p>`;}
  });
}

export function renderBrandCreateWizard():string {return '<section class="ba ba-create" data-brand-create></section>';}

export function bindBrandCreateWizard():void {
  const root=document.querySelector<HTMLElement>('[data-brand-create]');if(!root||root.dataset.bound)return;root.dataset.bound='true';
  const groups=getGroupsForSelect({allEnterprises:false}),business=getBusinessTypeOptions(),lines=getProductLineOptions();
  root.innerHTML=`<header class="ba-head"><div><a href="#/m-platform/merchants">← 返回品牌列表</a><h2 style="margin-top:12px">创建品牌</h2></div><span class="ba-tag">新门店菜单默认关闭</span></header><form><nav class="ba-stepper" aria-label="品牌创建步骤">${['品牌信息','选择品牌门店','开通品牌菜单'].map((t,i)=>`<button type="button" data-step="${i}" class="${i===0?'active':''}"><small>0${i+1}</small>　${t}</button>`).join('')}</nav><div class="ba-create-body"><section data-panel="0" class="ba-card"><h3 style="margin-bottom:18px">品牌基本信息</h3><div class="ba-grid"><label class="ba-field">品牌名称 *<input name="name" maxlength="60" required></label><label class="ba-field">所属集团 *<select name="groupId" required><option value="">请选择集团</option>${groups.map(g=>`<option value="${esc(g.groupId)}">${esc(g.name)}</option>`).join('')}</select></label><label class="ba-field">品牌编码<input name="code" placeholder="留空自动生成"></label><label class="ba-field">联系人 *<input name="contactName" required maxlength="30"></label><label class="ba-field">联系电话<input name="contactPhone"></label><label class="ba-field">时区<select name="timezone"><option>Asia/Shanghai</option><option>America/New_York</option><option>America/Los_Angeles</option></select></label></div><fieldset style="margin-top:20px"><legend>经营业态 *</legend><div class="ba-checks">${business.slice(0,8).map(b=>`<label><input type="checkbox" name="businessTypeIds" value="${esc(b.id)}">${esc(b.label)}</label>`).join('')}</div></fieldset><fieldset><legend>产线 *</legend><div class="ba-checks">${lines.map(l=>`<label><input type="checkbox" name="productLineIds" value="${esc(l.id)}" ${l.id==='pos'?'checked':''}>${esc(l.label)}</label>`).join('')}</div></fieldset></section><section data-panel="1" class="ba-card" hidden><h3>选择品牌门店</h3><div class="ba-toolbar" style="margin-top:16px"><input type="search" data-create-store-search aria-label="搜索可选门店" placeholder="搜索门店名称 / MID / 地址 / 邮编"></div><div data-create-stores></div></section><section data-panel="2" class="ba-card" hidden><h3>品牌菜单开通</h3><div data-create-picker></div><div class="ba-review" data-create-review hidden></div></section><p class="ba-error" data-create-error hidden role="alert"></p></div><footer class="ba-footer"><span class="ba-muted" data-step-hint>第 1 / 3 步</span><div class="ba-actions">${button('上一步','prev')}<button type="submit" class="ba-btn ba-primary" data-next>下一步</button></div></footer></form>`;
  const routeVersion=brandMenuRouteVersion();
  const form=root.querySelector('form')!;let step=0,read=()=>[] as string[],menuKeys:string[]=[],dirty=false,reviewed=false;
  const setStep=(next:number)=>{step=next;root.querySelectorAll<HTMLElement>('[data-panel]').forEach(el=>el.hidden=Number(el.dataset.panel)!==step);root.querySelectorAll<HTMLElement>('[data-step]').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===step));root.querySelector('[data-step-hint]')!.textContent=`第 ${step+1} / 3 步`;root.querySelector<HTMLButtonElement>('[data-ba=prev]')!.disabled=step===0;root.querySelector('[data-next]')!.textContent=step===2?(reviewed?'确认创建品牌':'核对创建信息'):'下一步';};
  const selections=()=>new FormData(form);
  const validate=()=>{if(brandMenuRouteVersion()!==routeVersion)throw Error('菜单路由已更新，请刷新后重新选择。');const fd=selections();if(!String(fd.get('name')??'').trim()||!fd.get('groupId')||!String(fd.get('contactName')??'').trim())throw Error('请填写品牌名称、所属集团和联系人。');if(!fd.getAll('businessTypeIds').length||!fd.getAll('productLineIds').length)throw Error('请至少选择一个业态和一条产线。');};
  const filterStores=()=>{
    const query=root.querySelector<HTMLInputElement>('[data-create-store-search]')!.value.trim().toLocaleLowerCase();
    let visible=0;
    root.querySelectorAll<HTMLElement>('[data-candidate-search]').forEach(row=>{row.hidden=!row.dataset.candidateSearch!.includes(query);if(!row.hidden)visible++;});
    const empty=root.querySelector<HTMLElement>('[data-candidate-empty]');if(empty)empty.hidden=visible>0;
  };
  const refreshStores=()=>{
    const group=String(selections().get('groupId')??'');ensureBrandCreationDemoStores(group);
    const candidates=listBrandAssociationCandidates(group);
    root.querySelector<HTMLInputElement>('[data-create-store-search]')!.value='';
    root.querySelector('[data-create-stores]')!.innerHTML=`<div class="ba-table-wrap"><table style="min-width:680px"><thead><tr><th>选择</th><th>门店名称</th><th>门店 MID</th><th>地址</th><th>邮编</th><th>营业状态</th></tr></thead><tbody>${candidates.map(store=>`<tr data-candidate-search="${esc([store.name,store.storeId,store.address??'',store.postalCode??''].join(' ').toLocaleLowerCase())}"><td><input type="checkbox" name="storeIds" value="${esc(store.storeId)}" aria-label="选择${esc(store.name)}"></td><td>${esc(store.name)}</td><td>${esc(store.storeId)}</td><td style="white-space:normal;overflow-wrap:anywhere;max-width:360px">${esc(store.address?.trim()||'—')}</td><td>${esc(store.postalCode?.trim()||'—')}</td><td>${esc(getStoreStatusLabel(store.status))}</td></tr>`).join('')}<tr data-candidate-empty ${candidates.length?'hidden':''}><td colspan="6" class="ba-empty">${candidates.length?'没有匹配门店，请调整搜索条件。':'当前集团暂无可关联门店。'}</td></tr></tbody></table></div>`;
  };
  root.querySelector<HTMLInputElement>('[data-create-store-search]')!.addEventListener('input',filterStores);

  const refreshPicker=()=>{menuKeys=read();read=bindMenuPicker(root.querySelector('[data-create-picker]')!,brandMenuChoices(selections().getAll('productLineIds').map(String)),menuKeys);};
  form.querySelector('[name=groupId]')!.addEventListener('change',refreshStores);
  root.querySelectorAll('[name=productLineIds]').forEach(el=>el.addEventListener('change',refreshPicker));refreshPicker();refreshStores();setStep(0);
  form.addEventListener('change',e=>{if((e.target as HTMLElement).matches('[data-create-store-search]'))return;dirty=true;reviewed=false;root.querySelector<HTMLElement>('[data-create-review]')!.hidden=true;setStep(step);});
  form.addEventListener('input',e=>{if(!(e.target as HTMLElement).matches('[data-menu-search],[data-create-store-search]'))dirty=true;});
  const unload=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);
  const original=location.hash;
  const guard=(e:HashChangeEvent)=>{if(!root.isConnected){window.removeEventListener('hashchange',guard,true);window.removeEventListener('beforeunload',unload);return;}if(dirty&&location.hash!==original&&!confirm('有未保存的品牌配置，是否放弃并离开？')){e.stopImmediatePropagation();history.replaceState(null,'',original);}else if(location.hash!==original){dirty=false;window.removeEventListener('beforeunload',unload);window.removeEventListener('hashchange',guard,true);}};window.addEventListener('hashchange',guard,true);
  root.querySelector('[data-ba=prev]')!.addEventListener('click',()=>setStep(Math.max(0,step-1)));
  root.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(b=>b.onclick=()=>{try{if(Number(b.dataset.step)>0)validate();setStep(Number(b.dataset.step));}catch(e){const error=root.querySelector<HTMLElement>('[data-create-error]')!;error.hidden=false;error.textContent=(e as Error).message;}});
  form.addEventListener('submit',e=>{e.preventDefault();const error=root.querySelector<HTMLElement>('[data-create-error]')!;error.hidden=true;try{validate();if(step<2){setStep(step+1);return;}const fd=selections();if(!reviewed){root.querySelector<HTMLElement>('[data-create-review]')!.innerHTML=`<h3>确认创建 ${esc(fd.get('name'))}</h3><p>所属集团：${esc(groups.find(g=>g.groupId===fd.get('groupId'))?.name)}<br>关联 ${fd.getAll('storeIds').length} 家门店；开通 ${read().length} 个菜单及设置节点。<br>品牌创建后，前往「账号与角色」开通登录账号。门店菜单默认关闭。</p>${brandMenuSelectionSummary(read(),brandMenuChoices(fd.getAll('productLineIds').map(String)))}`;root.querySelector<HTMLElement>('[data-create-review]')!.hidden=false;reviewed=true;setStep(2);return;}
    const merchant=createMerchant({name:String(fd.get('name')).trim(),code:String(fd.get('code')??''),groupId:String(fd.get('groupId')),orgType:'chain',timezone:String(fd.get('timezone')),contactName:String(fd.get('contactName')),contactPhone:String(fd.get('contactPhone')??''),primaryAdminEmail:'',businessTypeIds:fd.getAll('businessTypeIds').map(String),productLineIds:fd.getAll('productLineIds').map(String),initialMenuKeys:read(),initialStoreIds:fd.getAll('storeIds').map(String),accountProvisioningRequired:true,activateImmediately:true});
    dirty=false;window.removeEventListener('beforeunload',unload);window.removeEventListener('hashchange',guard,true);location.hash=merchantDetailHref(merchant.merchantId,'accounts');showAppToast('品牌已创建，请继续开通品牌 Admin',{variant:'success'});
  }catch(err){error.hidden=false;error.textContent=(err as Error).message;}});
}
