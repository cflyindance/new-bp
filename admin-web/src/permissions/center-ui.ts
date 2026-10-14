import './center.css';
import { buildCenterCatalog, type Catalog } from './center-catalog';
import { esc, renderPermissionEditor } from './center-editor';
import { readCenterState, saveCenterState, centerStores } from './center-store';
import { resolveAccess, roleAccess, scopeMatches, validateInvite, validateRole, type Access, type CenterState, type Employee, type Role, type Scope } from './center-domain';
import { getUserSessionContext } from '../auth/session-permissions';

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
  const catalog:Catalog=buildCenterCatalog(),stores=centerStores();
  let path=root.dataset.path??'/permissions/overview';
  if(path==='/permissions/staff-accounts')path='/permissions/staff';
  let draft=structuredClone(state),dirty=false,storeId=stores[0]?.id??'',tab='permissions',exception=false;
  let page=[...catalog.resources.values()].find(r=>r.type==='page')?.key??'',group='',menuSearch='',query='',filter='';
  const roleId=path.startsWith('/permissions/roles/edit/')?decodeURIComponent(path.slice('/permissions/roles/edit/'.length)):'';
  const employeeId=path.startsWith('/permissions/staff/')?decodeURIComponent(path.slice('/permissions/staff/'.length)):'';
  const isDetail=!!roleId||!!employeeId;
  const role=()=>draft.roles.find(r=>r.id===roleId);
  const employee=()=>draft.employees.find(e=>e.id===employeeId);
  const actor=()=>getUserSessionContext()?.employeeName??'本地管理员';
  const memberCount=(id:string)=>state.employees.filter(e=>e.bindings.some(b=>b.roleId===id)).length;
  const btn=(label:string,action:string,cls='')=>`<button type="button" class="${cls}" data-do="${action}">${label}</button>`;
  const link=(label:string,url:string)=>`<a class="pc-link" href="#${url}">${label}</a>`;
  const title=path.includes('/roles')?'角色与功能权限':path.includes('/staff')?'员工与账号':path.includes('/change-log')?'变更记录':'权限总览';
  const mark=()=>{dirty=true;activeHash=location.hash;leaveGuard=()=>confirm('有未保存的修改，确定放弃并离开？');};
  const value=(key:string):Access=>roleId&&role()?roleAccess(role()!,key,catalog.resources):resolveAccess(draft,employeeId,storeId,key,stores,catalog.resources);
  function editor(preview=false,selectedPage=page,selectedGroup=group,search=menuSearch):string {
    return renderPermissionEditor({catalog,page:selectedPage,group:selectedGroup,preview,readonly:!!employeeId&&!exception,staff:!!employeeId,value,own:key=>employeeId?(employee()?.overrides[storeId]?.[key]??'inherit'):(role()?.grants[key]??'hidden'),search});
  }
  function logs(objectId?:string):string {
    const rows=state.logs.filter(l=>(!objectId||l.objectId===objectId)&&(!query||`${l.actor} ${l.action} ${l.objectId}`.includes(query)));
    return `<table><thead><tr><th>时间</th><th>操作人</th><th>操作</th><th>变更内容</th></tr></thead><tbody>${rows.map(l=>`<tr><td>${esc(new Date(l.at).toLocaleString())}</td><td>${esc(l.actor)}</td><td>${esc(l.action)}</td><td><details><summary>查看前后值</summary><p>变更前</p><pre class="pc-log-json">${esc(l.before)}</pre><p>变更后</p><pre class="pc-log-json">${esc(l.after)}</pre></details></td></tr>`).join('')||'<tr><td colspan="4" class="pc-empty">暂无变更记录</td></tr>'}</tbody></table>`;
  }
  function staffDetail():string {
    const e=employee();if(!e)return '<div class="pc-empty">员工不存在</div>';
    const current=stores.find(s=>s.id===storeId);
    const bindings=e.bindings.filter(b=>current&&scopeMatches(b.scope,current));
    const tabs=`<div class="pc-tabs">${[['permissions','门店与权限'],['account','登录与安全'],['logs','变更记录']].map(([v,l])=>`<button data-tab="${v}" class="${tab===v?'active':''}">${l}</button>`).join('')}</div>`;
    if(tab==='logs')return tabs+`<div class="pc-card">${logs(e.id)}</div>`;
    if(tab==='account')return tabs+`<section class="pc-card"><h2>登录与安全</h2><p>登录邮箱：${esc(e.email)||'—'}</p><p>账号状态：<span class="pc-tag">${statusLabels[e.status]}</span></p><div class="pc-actions">${e.status==='pending'||e.status==='revoked'?btn('重新发送邀请','resend'):''}${e.status==='pending'?btn('撤销邀请','revoke','danger'):''}${e.status==='enabled'||e.status==='disabled'?btn(e.status==='enabled'?'停用账号':'启用账号','toggle-account'):''}</div><p class="pc-muted">账号变更仅保存在本地权限工作台；实际登录、凭据及会话服务尚未接入。</p></section>`;
    return tabs+`<section class="pc-card"><div class="pc-toolbar"><label>查看门店<select data-store>${stores.map(s=>`<option value="${esc(s.id)}" ${s.id===storeId?'selected':''}>${esc(s.title)}</option>`).join('')}</select></label><div class="pc-actions">${btn('分配角色','assign','primary')}${btn(exception?'结束例外编辑':'设置个人例外','exception')}</div></div>${e.migrationReview?'<p class="pc-notice">旧授权范围需复核：请明确门店范围后重新分配，旧数据未删除。</p>':''}${bindings.map(b=>`<div class="pc-binding"><div><strong>${esc(draft.roles.find(r=>r.id===b.roleId)?.name??'已失效角色')}</strong><span class="pc-tag">${b.scope.mode==='stores'?'指定门店':b.scope.mode==='brands'?'动态品牌':'动态区域'}</span><small>${esc(b.scope.ids.join('、'))}</small></div><button data-remove-binding="${esc(b.id)}">移除</button></div>`).join('')||'<p class="pc-muted">本门店暂无角色授权</p>'}</section><div class="pc-toolbar"><h3>当前门店生效权限</h3>${btn('查看菜单效果','preview')}</div>${editor()}`;
  }
  function render():void {
    const scroll=new Map([...root!.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll!,el.scrollTop]));
    const expanded=new Map([...root!.querySelectorAll<HTMLDetailsElement>('[data-menu-node]')].map(el=>[el.dataset.menuNode!,el.open]));
    if(isDetail){
      root!.innerHTML=`<section class="pc-full"><header class="pc-heading"><div class="pc-actions">${btn('← 返回','back')}<h1>${esc(role()?.name??employee()?.name??'记录不存在')}</h1><span class="pc-tag">${roleId?'编辑权限':'员工管理'}</span></div><span class="pc-muted">本地配置 · 业务鉴权尚未切换</span></header><div class="pc-content">${roleId?(role()?`<div class="pc-toolbar"><h3>功能权限</h3>${btn('查看菜单效果','preview')}</div>${editor()}`:'<div class="pc-empty">角色不存在</div>'):staffDetail()}</div><footer class="pc-footer"><span>${dirty?'有未保存修改':'所有修改已保存'}</span><div class="pc-actions">${btn('取消','cancel')}${btn('保存更改','save','primary')}</div></footer></section>`;
    }else{
      let body='';
      if(path.includes('/roles'))body=`<div class="pc-toolbar"><input data-query aria-label="搜索角色" placeholder="搜索角色名称" value="${esc(query)}">${btn('新建角色','create-role','primary')}</div><div class="pc-card"><table><thead><tr><th>角色</th><th>描述</th><th>成员数</th><th>操作</th></tr></thead><tbody>${state.roles.filter(r=>r.name.includes(query)).map(r=>`<tr><td><strong>${esc(r.name)}</strong>${r.system?'<span class="pc-tag">系统</span>':''}</td><td>${esc(r.description)||'—'}</td><td><button data-members="${esc(r.id)}">${memberCount(r.id)} 人</button></td><td><div class="pc-actions"><button data-role-info="${esc(r.id)}">编辑角色</button>${link('编辑权限',`/permissions/roles/edit/${encodeURIComponent(r.id)}`)}<button data-copy="${esc(r.id)}">复制</button><button class="danger" data-delete="${esc(r.id)}" ${r.system||memberCount(r.id)?'disabled title="系统角色或有关联员工不能删除"':''}>删除</button></div></td></tr>`).join('')||'<tr><td colspan="4" class="pc-empty">暂无匹配角色</td></tr>'}</tbody></table></div>`;
      else if(path.includes('/staff'))body=`<div class="pc-toolbar"><div class="pc-actions"><input data-query aria-label="搜索员工" placeholder="员工姓名或邮箱" value="${esc(query)}"><select data-status aria-label="账号状态"><option value="">全部账号状态</option>${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('')}</select></div>${btn('邀请员工','invite','primary')}</div><div class="pc-card"><table><thead><tr><th>员工</th><th>登录邮箱</th><th>账号状态</th><th>门店角色</th><th>个人例外</th><th>操作</th></tr></thead><tbody>${state.employees.filter(e=>(!filter||e.status===filter)&&`${e.name} ${e.email}`.toLowerCase().includes(query.toLowerCase())).map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.email)||'—'}</td><td><span class="pc-tag">${statusLabels[e.status]}</span></td><td>${e.migrationReview?'待复核':e.bindings.map(b=>esc(state.roles.find(r=>r.id===b.roleId)?.name??'失效角色')).join('、')||'未授权'}</td><td>${Object.values(e.overrides).reduce((n,v)=>n+Object.keys(v).length,0)} 项</td><td>${link('管理详情',`/permissions/staff/${encodeURIComponent(e.id)}`)}</td></tr>`).join('')||'<tr><td colspan="6" class="pc-empty">暂无匹配员工</td></tr>'}</tbody></table></div>`;
      else if(path.includes('/change-log'))body=`<input data-query aria-label="筛选变更记录" placeholder="操作人、操作或对象编号" value="${esc(query)}"><div class="pc-card">${logs()}</div>`;
      else body=`<div class="pc-stats">${[['角色',state.roles.length],['员工',state.employees.length],['已授权员工',state.employees.filter(e=>e.bindings.length).length],['个人例外',state.employees.reduce((n,e)=>n+Object.values(e.overrides).reduce((m,v)=>m+Object.keys(v).length,0),0)]].map(([l,n])=>`<div class="pc-stat">${l}<strong>${n}</strong></div>`).join('')}</div><section class="pc-card"><h2>最近变更</h2>${logs()}</section>`;
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
    modal('邀请员工',`<p class="pc-muted">通过邮箱建立员工账号。本地模式仅记录邀请，不发送邮件。</p><label>员工姓名<input name="name" required maxlength="30" autocomplete="name"></label><label>员工邮箱<input name="email" required type="email" maxlength="254" autocomplete="email" placeholder="name@example.com"></label>`,d=>{
      const name=field(d,'name').trim(),email=field(d,'email').trim().toLowerCase();validateInvite(state,name,email);
      const id=crypto.randomUUID(),next=structuredClone(state);next.employees.push({id,name,email,status:'pending',bindings:[],overrides:{}});commit(next,id,'发起邀请（本地模拟，未发送邮件）');return true;
    },'记录邀请');
  }
  function assign():void {
    if(!employee())return;
    const dialog=modal('分配角色 · 选择范围',`<label>角色<select name="role" required><option value="">请选择角色</option>${draft.roles.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join('')}</select></label><label>授权范围<select name="mode"><option value="stores">指定门店</option><option value="brands">动态品牌</option><option value="regions">动态区域</option></select></label><div data-scope-options></div>`,d=>{
      const roleId=field(d,'role'),mode=field(d,'mode') as Scope['mode'];
      const ids=[...d.querySelectorAll<HTMLInputElement>('[name="scope"]:checked')].map(x=>x.value);
      if(!roleId||!ids.length)throw Error('请选择角色及至少一个授权范围');
      modal('确认分配角色',`<p>角色：${esc(draft.roles.find(r=>r.id===roleId)?.name)}</p><p>范围：${esc(ids.map(id=>mode==='stores'?stores.find(s=>s.id===id)?.title??id:id).join('、'))}</p>${mode!=='stores'?'<p class="pc-notice">动态范围包含未来新增或纳入的门店。</p>':''}<p>确认后加入草稿，保存员工详情后生效。</p>`,()=>{employee()!.bindings.push({id:crypto.randomUUID(),roleId,scope:{mode,ids}});employee()!.migrationReview=false;mark();render();return true;},'加入草稿');return true;
    },'下一步');
    const options=()=>{const mode=field(dialog,'mode');const list=mode==='stores'?stores.map(s=>[s.id,s.title]):[...new Set(stores.map(s=>mode==='brands'?s.brand:s.region).filter(Boolean))].map(v=>[v,v]);dialog.querySelector('[data-scope-options]')!.innerHTML=`<div class="pc-choice-list">${list.map(([id,title])=>`<label><input type="checkbox" name="scope" value="${esc(id)}" ${mode==='stores'&&id===storeId?'checked':''}>${esc(title)}</label>`).join('')}</div>`;};
    dialog.querySelector('[name="mode"]')!.addEventListener('change',options);options();
  }
  function preview():void {
    let previewPage=page,previewGroup=group,previewSearch='';
    const first=[...catalog.resources.values()].find(r=>r.type==='page'&&value(r.key)!=='hidden');if(value(previewPage)==='hidden')previewPage=first?.key??'';
    const previewEditor=()=>editor(true,previewPage,previewGroup,previewSearch);
    const dialog=modal('菜单效果预览',`<p class="pc-preview-note">当前草稿${employeeId?' · '+esc(stores.find(s=>s.id===storeId)?.title):''}；仅展示权限，不执行真实业务操作。</p><div data-preview>${previewEditor()}</div>`,()=>true,'关闭');dialog.classList.add('pc-preview');
    const area=dialog.querySelector<HTMLElement>('[data-preview]')!;
    area.addEventListener('click',ev=>{const target=(ev.target as Element).closest<HTMLElement>('[data-page],[data-group],[data-demo]');if(!target)return;if(target.hasAttribute('data-demo'))return;ev.preventDefault();if(target.dataset.page){previewPage=target.dataset.page;previewGroup='';}if(target.dataset.group)previewGroup=target.dataset.group;const scroll=new Map([...area.querySelectorAll<HTMLElement>('[data-scroll]')].map(el=>[el.dataset.scroll!,el.scrollTop]));const expanded=new Map([...area.querySelectorAll<HTMLDetailsElement>('[data-menu-node]')].map(el=>[el.dataset.menuNode!,el.open]));area.innerHTML=previewEditor();for(const el of area.querySelectorAll<HTMLElement>('[data-scroll]'))el.scrollTop=el.dataset.scroll==='settings'?0:scroll.get(el.dataset.scroll!)??0;for(const el of area.querySelectorAll<HTMLDetailsElement>('[data-menu-node]'))if(expanded.has(el.dataset.menuNode!))el.open=expanded.get(el.dataset.menuNode!)!;});
    area.addEventListener('input',ev=>{if((ev.target as HTMLElement).hasAttribute('data-menu-search')){previewSearch=(ev.target as HTMLInputElement).value;const pos=(ev.target as HTMLInputElement).selectionStart;area.innerHTML=previewEditor();const input=area.querySelector<HTMLInputElement>('[data-menu-search]')!;input.focus();input.setSelectionRange(pos,pos);}});
  }
  root.addEventListener('click',ev=>{
    const b=(ev.target as Element).closest<HTMLElement>('button');if(!b||b.hasAttribute('disabled'))return;
    try{
      if(b.dataset.page){ev.preventDefault();page=b.dataset.page;group='';const list=root.querySelector('[data-scroll="settings"]');if(list)list.scrollTop=0;render();return;}
      if(b.dataset.group){group=b.dataset.group;const list=root.querySelector('[data-scroll="settings"]');if(list)list.scrollTop=0;render();return;}
      if(b.dataset.tab){tab=b.dataset.tab;render();return;}
      if(b.dataset.grant){const key=b.dataset.grant,v=b.dataset.value as Access|'inherit';if(employeeId){if(!exception||!employee())return;const overrides=employee()!.overrides[storeId]??={};if(v==='inherit')delete overrides[key];else overrides[key]=v;}else if(role()&&v!=='inherit')role()!.grants[key]=v;mark();render();return;}
      if(b.dataset.roleInfo){roleDialog(b.dataset.roleInfo);return;}
      if(b.dataset.copy){roleDialog(b.dataset.copy,true);return;}
      if(b.dataset.members){modal('角色成员',state.employees.filter(e=>e.bindings.some(x=>x.roleId===b.dataset.members)).map(e=>`<p>${link(esc(e.name),`/permissions/staff/${encodeURIComponent(e.id)}`)}</p>`).join('')||'<p>暂无成员</p>',()=>true,'关闭');return;}
      if(b.dataset.delete){const id=b.dataset.delete;modal('删除角色','<p>删除后无法恢复，确定删除此角色？</p>',()=>{const next=structuredClone(state);next.roles=next.roles.filter(r=>r.id!==id);commit(next,id,'删除角色');return true;},'删除');return;}
      if(b.dataset.removeBinding){const binding=employee()?.bindings.find(x=>x.id===b.dataset.removeBinding);if(!binding)return;modal('移除角色',`<p>${binding.scope.mode==='stores'?'将移除此指定门店绑定。':'将影响该动态范围内的全部门店。'}个人例外及其他绑定保留。</p>`,()=>{employee()!.bindings=employee()!.bindings.filter(x=>x.id!==binding.id);mark();render();return true;},'移除');return;}
      switch(b.dataset.do){
        case 'create-role':roleDialog();break;
        case 'invite':invite();break;
        case 'preview':preview();break;
        case 'assign':assign();break;
        case 'exception':exception=!exception;render();break;
        case 'back':case 'cancel':if(!dirty||confirm('放弃未保存的修改？')){dirty=false;leaveGuard=undefined;location.hash=roleId?'/permissions/roles':'/permissions/staff';}break;
        case 'save':{
          if(!dirty)return;
          const id=roleId||employeeId,old=roleId?state.roles.find(r=>r.id===id):state.employees.find(e=>e.id===id),next=roleId?role():employee();
          modal('确认保存更改',`<p>${roleId?`影响 ${memberCount(id)} 位已绑定员工。`:'仅更新当前员工的草稿，包含已编辑的各门店。'}</p><details><summary>查看变更前后值</summary><p>变更前</p><pre class="pc-log-json">${esc(JSON.stringify(old,null,2))}</pre><p>变更后</p><pre class="pc-log-json">${esc(JSON.stringify(next,null,2))}</pre></details>`,()=>{commit(draft,id,roleId?'更新角色权限':'更新员工授权');return true;},'确认保存');break;
        }
        case 'resend':case 'revoke':case 'toggle-account':{
          const e=employee();if(!e)return;const action=b.dataset.do;
          const nextStatus=action==='resend'?'pending':action==='revoke'?'revoked':e.status==='enabled'?'disabled':'enabled';
          modal(action==='resend'?'重新记录邀请':action==='revoke'?'撤销邀请':'变更账号状态','<p>仅修改本地工作台状态，不调用真实账号服务。角色和个人例外均保留；保存员工详情后记录此变更。</p>',()=>{e.status=nextStatus;mark();render();return true;},'加入草稿');break;
        }
      }
    }catch(e){error((e as Error).message);}
  });
  root.addEventListener('input',ev=>{
    const target=ev.target as HTMLInputElement;if(!target.matches('[data-query],[data-menu-search]'))return;
    const isMenu=target.hasAttribute('data-menu-search');if(isMenu)menuSearch=target.value;else query=target.value;
    const position=target.selectionStart;render();const input=root.querySelector<HTMLInputElement>(isMenu?'[data-menu-search]':'[data-query]');input?.focus();input?.setSelectionRange(position,position);
  });
  root.addEventListener('change',ev=>{const target=ev.target as HTMLSelectElement;if(target.hasAttribute('data-store')){storeId=target.value;exception=false;render();}if(target.hasAttribute('data-status')){filter=target.value;render();}});
  render();
  if(path==='/permissions/roles/new')roleDialog();
}
