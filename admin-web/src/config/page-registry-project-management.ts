import { getBuiltInPageRegistrations } from './page-registration-catalog';
import { readRegistryWorkspace, updateRegistryWorkspace, validateProjectMicroApp, type RegistryProject } from './page-registry-projects';
import { currentMAccess } from '../permissions/m-platform-store';
import { mPageKey } from '../permissions/m-platform-catalog';
import { openConfirmDialog } from '../ui/app-confirm-dialog';
const e=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const button='rounded-lg border border-slate-200 px-3 py-2 text-sm text-blue-600 disabled:opacity-40';
const input='mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm';
import {showAppToast} from '../ui/app-toast';
const state={query:'',status:'all',editing:'',deleting:'',error:'',savedProject:''};let bound=false;
const canEdit=()=>currentMAccess(mPageKey('routing'))==='edit';
export function renderProjectManagement():string {
 const {workspace:w,error}=readRegistryWorkspace(getBuiltInPageRegistrations());
 const projects=w.projects.filter(p=>(state.status==='all'||(p.status??'active')===state.status)&&`${p.name} ${p.microName??''}`.toLowerCase().includes(state.query.trim().toLowerCase()));
 const target=w.projects.find(p=>p.id===(state.editing||state.deleting));
 const creating=state.editing==='new';
 const ids=new Set(w.assignments.filter(a=>a.projectId===target?.id).map(a=>a.pageId));
 const affected=w.pages.filter(p=>ids.has(p.id));
 const count=affected.length;
 const affectedList=count?`<div data-project-impact hidden class="rounded-lg bg-muted p-3 text-sm"><div class="flex flex-wrap items-center justify-between gap-2"><p>此项目下有 <strong>${count}</strong> 个已注册页面，保存后不会自动更新。</p><button type="button" data-impact-open class="rounded-lg px-3 py-2 text-blue-600 hover:bg-background">查看页面</button></div><dialog data-impact-drawer aria-label="需核查的页面" class="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-lg overflow-hidden border-l border-border bg-background text-foreground backdrop:bg-black/35 open:flex open:flex-col"><header class="flex items-center justify-between border-b border-border p-6"><h3 class="text-lg font-semibold">需核查的页面</h3><button type="button" data-impact-close class="${button}" aria-label="关闭页面明细">关闭</button></header><div class="p-6 pb-3"><input type="search" data-impact-search aria-label="搜索页面名称或路径" placeholder="搜索页面名称或路径" class="${input}"></div><ul class="min-h-0 flex-1 divide-y divide-border overflow-auto px-6">${affected.map(p=>{
 const linked=w.directories.find(d=>d.projectId===target?.id&&d.pageId===p.id);
 let parentId=linked?.parentId??w.assignments.find(a=>a.pageId===p.id)?.directoryId;
 const names=[p.title],seen=new Set<string>();
 while(parentId&&!seen.has(parentId)){seen.add(parentId);const parent=w.directories.find(d=>d.id===parentId&&d.projectId===target?.id);if(!parent)break;names.unshift(parent.name);parentId=parent.parentId;}
 return `<li data-impact-item class="space-y-1 py-4"><p class="font-semibold">${e(p.title)}</p><p class="break-words text-muted-foreground">${e(names.join(' / '))}</p><p class="break-all">${e(p.routing.path)}</p></li>`;
 }).join('')}</ul><p data-impact-empty hidden class="p-6 text-center text-muted-foreground">暂无匹配页面</p></dialog></div>`:'';
 const fields=(target||creating)?[['项目名称','name'],['微应用标识','microName'],['应用入口 URL','microUrl'],['微应用路由','microRoute'],['研发负责人','engineeringOwner'],['产品负责人','productOwner']].map(([label,key])=>`<label class="block text-sm">${label} *<input name="${key}" required value="${e(String(target?.[key as keyof RegistryProject]??''))}" class="${input}"></label>`).join('')+`<label class="block text-sm">项目描述<textarea name="description" rows="3" class="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2">${e(target?.description??'')}</textarea></label>`:'';
 return `<section class="flex min-w-0 grow shrink-0 flex-col rounded-2xl bg-white p-4 sm:p-6" data-reg-projects><header class="flex shrink-0 items-center justify-between"><h2 class="text-lg font-semibold">项目管理</h2><button type="button" data-project-create ${!canEdit()||error?'disabled':''} class="${button}">＋ 新增项目</button></header>${state.savedProject?`<div role="status" class="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-muted p-4 text-sm"><span>项目配置已保存，已有页面和已发布菜单未自动更新。</span><a class="${button}" href="#/m-platform/nav-blueprint/page-registry/project-pages?project=${encodeURIComponent(state.savedProject)}">管理页面</a><button type="button" data-impact-dismiss class="${button}">关闭提示</button></div>`:""}<form data-project-filter class="my-6 flex shrink-0 flex-wrap items-end gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-4"><input name="query" aria-label="项目名称或微应用标识" value="${e(state.query)}" placeholder="项目名称／微应用标识" class="${input} min-w-52 flex-1 basis-72"><select name="status" aria-label="项目状态" class="${input} !w-40 shrink-0">${[['all','全部状态'],['active','启用'],['disabled','停用']].map(([v,t])=>`<option value="${v}" ${state.status===v?'selected':''}>${t}</option>`).join('')}</select><div class="flex shrink-0 items-center gap-3"><button class="h-11 whitespace-nowrap rounded-xl bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700" type="submit">查询</button><button class="h-11 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-6 text-sm text-slate-600 hover:bg-slate-100" type="button" data-project-reset>重置</button></div></form>${error?`<p role="alert">${e(error)}</p>`:''}<p data-project-error role="alert" class="text-sm text-red-600">${e(state.error)}</p><div data-project-table-scroll role="region" aria-label="项目列表" tabindex="0" class="mt-4 min-w-0 overflow-x-auto"><table class="w-full text-left text-sm" style="min-width:60rem"><thead class="bg-slate-50"><tr>${['项目名称','微应用标识','应用入口 URL','微应用路由','研发负责人','产品负责人','状态','操作'].map(t=>`<th class="p-3">${t}</th>`).join('')}</tr></thead><tbody>${projects.map(p=>`<tr class="border-b border-slate-100"><td class="p-3">${e(p.name)}</td><td class="p-3">${e(p.microName??'未配置')}</td><td class="break-all p-3">${e(p.microUrl??'未配置')}</td><td class="p-3">${e(p.microRoute??'未配置')}</td><td class="p-3 break-words">${e(p.engineeringOwner||'—')}</td><td class="p-3 break-words">${e(p.productOwner||'—')}</td><td class="p-3">${p.status==='disabled'?'停用':'启用'}</td><td class="p-3"><div class="flex flex-wrap gap-2"><a class="${button}" href="#/m-platform/nav-blueprint/page-registry/project-pages?project=${encodeURIComponent(p.id)}&directory=">管理页面</a><a class="${button}" href="#/m-platform/nav-blueprint/page-registry/project-logs?object=${encodeURIComponent(p.id)}">查看记录</a>${[['edit','编辑'],['toggle',p.status==='disabled'?'启用':'停用'],['delete','删除']].map(([a,t])=>`<button type="button" data-project-action="${a}" data-project-id="${e(p.id)}" ${!canEdit()||error?'disabled':''} class="${button}">${t}</button>`).join('')}</div></td></tr>`).join('')||'<tr><td colspan="8" class="p-10 text-center text-slate-400">暂无匹配项目</td></tr>'}</tbody></table></div>${target||creating?`<div data-project-overlay class="fixed inset-0 z-[170] grid place-items-center bg-slate-950/40 p-4"><section role="dialog" aria-modal="true" aria-label="${state.editing?(creating?'新增项目':'编辑项目'):'删除项目'}" class="w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl bg-background p-6"><header class="mb-5 flex items-center gap-3"><button type="button" aria-label="关闭" data-project-close class="size-9 rounded-lg bg-muted">×</button><h3 class="flex-1 text-lg font-semibold">${state.editing?(creating?'新增项目':'编辑项目'):`删除“${e(target?.name??'')}”`}</h3>${state.editing?`<button type="submit" form="project-config-form" class="rounded-lg bg-blue-600 px-4 py-2 text-white">保存</button>`:""}</header><form id="project-config-form" data-project-save class="space-y-4">${state.editing?fields+affectedList:`<p class="text-sm">此操作不可撤销，请输入项目名称精确确认。包含目录或页面的项目不能删除。</p><input name="confirmation" required placeholder="${e(target?.name??'')}" class="${input}">`}<p role="alert" data-project-modal-error class="text-sm text-red-600"></p>${!state.editing?`<footer class="flex justify-end gap-3"><button type="button" data-project-close class="${button}">取消</button><button type="submit" class="${button}">${state.editing?'保存':'删除'}</button></footer>`:""}</form></section></div>`:''}</section>`;
}
export function bindProjectManagement(mount:()=>void):void {
 if(bound)return;bound=true;
 const write=(mutate:Parameters<typeof updateRegistryWorkspace>[1])=>{if(!canEdit())throw new Error('暂无编辑权限');updateRegistryWorkspace(getBuiltInPageRegistrations(),mutate);};
 let togglePending=false, closing=false, restoring=false;
 const dirty=(form:HTMLFormElement|null)=>[...(form?.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('input,textarea')??[])].some(input=>!input.matches('[data-impact-search]')&&input.value!==input.defaultValue);
 document.body.addEventListener('input',event=>{
  const input=event.target as HTMLInputElement,form=input.closest<HTMLFormElement>('[data-project-save]');
  const panel=form?.querySelector<HTMLElement>('[data-project-impact]');
  if(input.matches('[data-impact-search]')){
   const items=[...(form?.querySelectorAll<HTMLElement>('[data-impact-item]')??[])];
   const query=input.value.trim().toLowerCase();
   for(const item of items)item.hidden=!(item.textContent??'').toLowerCase().includes(query);
   const empty=form?.querySelector<HTMLElement>('[data-impact-empty]');
   if(empty)empty.hidden=items.some(item=>!item.hidden);
   return;
  }
  if(panel)panel.hidden=![...form!.querySelectorAll<HTMLInputElement>('[name=microName],[name=microUrl],[name=microRoute]')].some(field=>field.value.trim()!==field.defaultValue);
 });
 window.addEventListener('beforeunload',event=>{if(dirty(document.querySelector('[data-project-save]'))){event.preventDefault();event.returnValue='';}});
 window.addEventListener('hashchange',event=>{
  if(restoring)return;
  const form=document.querySelector<HTMLFormElement>('[data-project-save]');
  if(!form)return;
  if(dirty(form)&&!window.confirm('内容尚未保存，离开将丢失修改。确认离开？')){
   event.stopImmediatePropagation();
   restoring=true;history.replaceState(history.state,'',event.oldURL);restoring=false;
   return;
  }
  state.editing='';state.deleting='';
 },true);
 const close=async()=>{
  if(closing)return;
  closing=true;
  try{
   const form=document.querySelector<HTMLFormElement>('[data-project-save]');
   if(dirty(form)&&!await openConfirmDialog({title:'放弃未保存的修改？',message:'内容尚未保存，关闭将丢失修改。',confirmLabel:'放弃修改',cancelLabel:'继续编辑'}))return;
   state.editing='';state.deleting='';mount();
  }finally{closing=false;}
 };
 document.body.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const drawer=document.querySelector<HTMLDialogElement>('[data-impact-drawer][open]');if(drawer){event.preventDefault();event.stopPropagation();drawer.close();return;}if(!document.querySelector('#app-confirm-dialog')&&document.querySelector('[data-project-save]'))window.setTimeout(()=>void close(),0);},true);
 document.body.addEventListener('click',async event=>{const t=event.target as HTMLElement;
 if(t.closest('[data-impact-dismiss]')){state.savedProject='';mount();return;}
 if(t.closest('[data-impact-open]')){document.querySelector<HTMLDialogElement>('[data-impact-drawer]')?.showModal();return;}
 const drawer=t.closest<HTMLDialogElement>('[data-impact-drawer]');
 if(drawer&&(t===drawer||t.closest('[data-impact-close]'))){drawer.close();return;}
 if(t.closest('[data-project-create]')){if(canEdit()){state.editing='new';mount();}return;}
 if(t.closest('[data-project-close]')||t.matches('[data-project-overlay]')){await close();return;}
 if(t.closest('[data-project-reset]')){state.query='';state.status='all';mount();return;}
 const action=t.closest<HTMLElement>('[data-project-action]');if(!action)return;state.error='';const id=action.dataset.projectId!;
 try{if(!canEdit())throw new Error('暂无编辑权限');if(action.dataset.projectAction==='edit')state.editing=id;else if(action.dataset.projectAction==='delete'){const {workspace:w}=readRegistryWorkspace(getBuiltInPageRegistrations());if(w.directories.some(d=>d.projectId===id)||w.assignments.some(a=>a.projectId===id)){ const project=w.projects.find(p=>p.id===id); await openConfirmDialog({title:'无法删除项目',message:`“${project?.name??'该项目'}”包含目录或页面，请先处理下属数据后再删除。`,confirmLabel:'知道了',cancelLabel:'关闭'}); return; }state.deleting=id;}else { if(togglePending)return; const project=readRegistryWorkspace(getBuiltInPageRegistrations()).workspace.projects.find(p=>p.id===id); if(!project)throw new Error('项目不存在'); const status=project.status??'active'; const disabling=status!=='disabled'; togglePending=true; let confirmed=false; try { confirmed=await openConfirmDialog({title:`${disabling?'停用':'启用'}“${project.name}”？`,message:disabling?'停用后将禁止新增页面和新增菜单关联，已有页面仍可编辑，已发布菜单不受影响。':'启用后将恢复页面新增及导航关联能力。',confirmLabel:disabling?'确认停用':'确认启用',danger:disabling}); } finally {togglePending=false;} if(!confirmed)return; write(w=>{const p=w.projects.find(p=>p.id===id);if(!p)throw new Error('项目不存在');if((p.status??'active')!==status)throw new Error('项目状态已变化，请刷新后重试');p.status=disabling?'disabled':'active';}); }mount();}catch(error){state.error=error instanceof Error?error.message:'操作失败';mount();}
 });
 document.body.addEventListener('submit',event=>{const f=event.target as HTMLFormElement;if(!f.matches('[data-project-filter],[data-project-save]'))return;event.preventDefault();const data=new FormData(f),v=(k:string)=>String(data.get(k)??'').trim();
 if(f.matches('[data-project-filter]')){state.query=v('query');state.status=v('status');mount();return;}
 const owners={engineeringOwner:v('engineeringOwner'),productOwner:v('productOwner'),description:v('description')};
 let savedMessage='',savedProject='';
 try{if(state.editing&&(!owners.engineeringOwner||!owners.productOwner))throw new Error(!owners.engineeringOwner?'请填写研发负责人':'请填写产品负责人');write(w=>{if(state.editing==='new'){
 const p={id:crypto.randomUUID(),name:v('name'),microName:v('microName'),microUrl:v('microUrl'),microRoute:v('microRoute'),...owners};validateProjectMicroApp(p);w.projects.push(p);savedMessage='项目配置已保存';return;
 }const id=state.editing||state.deleting;const p=w.projects.find(p=>p.id===id);if(!p)throw new Error('项目不存在');if(state.editing){const next={...p,name:v('name'),microName:v('microName'),microUrl:v('microUrl'),microRoute:v('microRoute'),...owners};validateProjectMicroApp(next);
 const count=new Set(w.assignments.filter(a=>a.projectId===id).map(a=>a.pageId)).size;
 const changed=(['microName','microUrl','microRoute'] as const).some(key=>p[key]!==next[key]);
 if(changed&&count)savedProject=id;else savedMessage='项目配置已保存';
 Object.assign(p,next);}else{if(v('confirmation')!==p.name)throw new Error('项目名称不匹配');if(w.directories.some(d=>d.projectId===id)||w.assignments.some(a=>a.projectId===id))throw new Error('项目包含目录或页面，不能删除');w.projects=w.projects.filter(p=>p.id!==id);}});state.editing='';state.deleting='';state.savedProject=savedProject;mount();if(savedMessage)showAppToast(savedMessage);}catch(error){const message=error instanceof Error?error.message:'保存失败，输入已保留';
 const field=message.startsWith('微应用标识已被')?'microName':message.startsWith('微应用路由已被')?'microRoute':'';
 const input=field?f.querySelector<HTMLInputElement>(`[name="${field}"]`):null;
 const el=f.querySelector('[data-project-modal-error]');
 if(input&&el){input.closest('label')?.after(el);input.focus();}if(el)el.textContent=error instanceof Error?error.message:'保存失败，输入已保留';}
 });
}
