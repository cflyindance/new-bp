import {getBuiltInPageRegistrations} from './page-registration-catalog';
import {readRegistryWorkspace,updateRegistryWorkspace,validateProjectMicroApp,type RegistryWorkspace,type RegistryDirectory} from './page-registry-projects';
import {buildLocalPageRegistration} from './local-page-registration';
import {renderStandalonePageHeader} from '../ui/standalone-page-header';
import {openConfirmDialog} from '../ui/app-confirm-dialog';
import {showAppToast} from '../ui/app-toast';
import {currentMAccess} from '../permissions/m-platform-store';
import {mPageKey} from '../permissions/m-platform-catalog';
const root='/m-platform/nav-blueprint/page-registry/project-pages';
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const btn='rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40';
const input='mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500';
interface Editor {project:string;mode:'new'|'edit'|'move';id:string;parent:string;name:string;path:string;error:string;dirty:boolean}
const state={query:'',collapsed:new Set<string>(),scroll:0,project:'',editor:undefined as Editor|undefined,busy:false};
let bound=false;
const projectId=()=>new URLSearchParams(location.hash.split('?')[1]??'').get('project')??'';
const route=()=>location.hash.split('?')[0]===`#${root}`;
const read=()=>readRegistryWorkspace(getBuiltInPageRegistrations());
const canEdit=(w:RegistryWorkspace,id:string,existing=false)=>currentMAccess(mPageKey('routing'))==='edit'&&w.projects.some(p=>p.id===id&&(existing||p.status!=='disabled'));
function parentOptions(w:RegistryWorkspace,id:string,exclude=''):string {
 const nodes=w.directories.filter(d=>d.projectId===id),blocked=new Set([exclude]);let size=-1;
 while(size!==blocked.size){size=blocked.size;nodes.forEach(d=>{if(d.parentId&&blocked.has(d.parentId))blocked.add(d.id);});}
 const path=(d:RegistryDirectory)=>{const names=[d.name],seen=new Set([d.id]);let p=nodes.find(n=>n.id===d.parentId);while(p&&!seen.has(p.id)){seen.add(p.id);names.unshift(p.name);p=nodes.find(n=>n.id===p!.parentId);}return names.join(' / ');};
 return '<option value="">项目根级</option>'+nodes.filter(d=>!blocked.has(d.id)).map(d=>`<option value="${esc(d.id)}">${esc(path(d))}</option>`).join('')+w.assignments.filter(a=>a.projectId===id&&!nodes.some(d=>d.pageId===a.pageId)&&`page:${a.pageId}`!==exclude).map(a=>`<option value="page:${esc(a.pageId)}">${esc(w.pages.find(p=>p.id===a.pageId)?.title??'页面')}</option>`).join('');
}
export function bindProjectPageTable(mount:()=>void):void {
 const form=document.querySelector<HTMLFormElement>('[data-pt-form]');if(form&&state.editor)(form.elements.namedItem('parent') as HTMLSelectElement).value=state.editor.parent;
 requestAnimationFrame(()=>{const host=document.querySelector('[data-pt-scroll]');if(host)host.scrollTop=state.scroll;});
 if(bound)return;bound=true;
 const refresh=(focus?:string)=>{state.scroll=document.querySelector('[data-pt-scroll]')?.scrollTop??state.scroll;mount();if(focus)requestAnimationFrame(()=>document.querySelector<HTMLElement>(`[data-pt-row="${CSS.escape(focus)}"]`)?.scrollIntoView({block:'nearest'}));};
 const leaveEditor=()=>{if(state.editor?.dirty&&!window.confirm('页面信息尚未保存，关闭将丢失输入。确认关闭？'))return false;state.editor=undefined;return true;};
 const write=(mutate:(w:RegistryWorkspace)=>void,existing=false)=>{if(state.busy)throw new Error('正在保存，请稍后');state.busy=true;try{return updateRegistryWorkspace(getBuiltInPageRegistrations(),w=>{if(!canEdit(w,projectId(),existing))throw new Error('项目已停用或暂无编辑权限');mutate(w);});}finally{state.busy=false;}};
 const promote=(w:RegistryWorkspace,key:string):RegistryDirectory=>{if(!key.startsWith('page:')){const node=w.directories.find(d=>d.id===key&&d.projectId===projectId());if(!node)throw new Error('页面不存在');return node;}const pid=key.slice(5),p=w.pages.find(p=>p.id===pid),a=w.assignments.find(a=>a.pageId===pid&&a.projectId===projectId());if(!p||!a)throw new Error('页面不存在');let node=w.directories.find(d=>d.pageId===pid);if(!node){node={id:crypto.randomUUID(),name:p.title,projectId:projectId(),parentId:a.directoryId,pageId:pid};w.directories.push(node);}return node;};
 const openEditor=(mode:Editor['mode'],key='',parent='')=>{if(!leaveEditor())return;const w=read().workspace;const d=w.directories.find(d=>d.id===key),p=w.pages.find(p=>p.id===(d?.pageId??(key.startsWith('page:')?key.slice(5):''))),a=w.assignments.find(a=>a.pageId===p?.id);state.editor={project:projectId(),mode,id:key,parent:mode==='new'?parent:d?.parentId??a?.directoryId??'',name:d?.name??p?.title??'',path:p?.routing.path??'',error:'',dirty:false};refresh();requestAnimationFrame(()=>document.querySelector<HTMLInputElement>('[data-pt-form] [name="name"]')?.focus());};
 document.body.addEventListener('click',async event=>{const t=event.target as HTMLElement;
  if(t.closest('[data-pt-back]')){if(leaveEditor())location.hash='/m-platform/nav-blueprint/page-registry/projects';return;}
  if(t.closest('[data-pt-cancel]')||t.matches('[data-pt-overlay]')){if(leaveEditor())refresh();return;}
  if(!route()||document.querySelector('[data-app-confirm-panel]'))return;
  if(t.closest('[data-pt-new]')){openEditor('new');return;}
  const toggle=t.closest<HTMLElement>('[data-pt-toggle]');if(toggle){const id=toggle.dataset.ptToggle!;state.collapsed.has(id)?state.collapsed.delete(id):state.collapsed.add(id);refresh();return;}
  if(t.closest('[data-pt-toggle-all]')){const w=read().workspace,nodes=w.directories.filter(d=>d.projectId===projectId());const all=nodes.every(d=>!state.collapsed.has(d.id));nodes.forEach(d=>all?state.collapsed.add(d.id):state.collapsed.delete(d.id));refresh();return;}
  const button=t.closest<HTMLButtonElement>('[data-pt-action]');if(!button||button.disabled)return;
  const key=button.dataset.ptId!,action=button.dataset.ptAction!;document.querySelectorAll<HTMLDetailsElement>('[data-pt-more]').forEach(d=>d.open=false);
  if(action==='child'){openEditor('new','',key);return;}if(action==='edit'||action==='move'){openEditor(action==='move'?'move':'edit',key);return;}
  try {
   if(!leaveEditor())return;
   if(action==='delete') {const w=read().workspace,d=w.directories.find(d=>d.id===key),p=w.pages.find(p=>p.id===(d?.pageId??key.slice(5))),name=d?.name??p?.title;if(!name)throw new Error('页面不存在');const ok=await openConfirmDialog({title:`删除“${name}”？`,message:'该页面及其所有子级将被删除，已有菜单路由快照不会自动删除。请输入名称确认。',confirmLabel:'删除',danger:true,requireText:name});if(!ok)return;}
   let selected='';
   write(w=>{
    if((action==='up'||action==='down')&&key.startsWith('page:')){const a=w.assignments.find(a=>a.pageId===key.slice(5))!;const peers=w.assignments.filter(p=>p.projectId===a.projectId&&p.directoryId===a.directoryId&&!w.directories.some(d=>d.pageId===p.pageId));const index=peers.indexOf(a),other=peers[index+(action==='up'?-1:1)];if(other){const i=w.assignments.indexOf(a),j=w.assignments.indexOf(other);[w.assignments[i],w.assignments[j]]=[w.assignments[j],w.assignments[i]];}return;}
    const node=promote(w,key),nodes=[...w.directories],assignments=[...w.assignments],pages=[...w.pages];selected=node.id;
    const ids=new Set([node.id]);let count=-1;while(count!==ids.size){count=ids.size;nodes.forEach(d=>{if(d.parentId&&ids.has(d.parentId))ids.add(d.id);});}
    if(action==='delete'){const pageIds=new Set([...nodes.filter(d=>ids.has(d.id)).flatMap(d=>d.pageId?[d.pageId]:[]),...assignments.filter(a=>a.directoryId&&ids.has(a.directoryId)).map(a=>a.pageId)]);w.directories=w.directories.filter(d=>!ids.has(d.id));w.pages=w.pages.filter(p=>!pageIds.has(p.id));w.assignments=w.assignments.filter(a=>!pageIds.has(a.pageId));selected='';return;}
    if(action==='copy') {const map=new Map([...ids].map(id=>[id,crypto.randomUUID()]));selected=map.get(node.id)!;for(const old of nodes.filter(d=>ids.has(d.id))){const copy={...old,id:map.get(old.id)!,parentId:old.id===node.id?node.parentId:map.get(old.parentId!)!,name:old.id===node.id?`${old.name} 副本 ${selected.slice(0,4)}`:old.name};if(old.pageId){const page=structuredClone(pages.find(p=>p.id===old.pageId)!);page.id=`${page.id}_copy_${copy.id}`;page.title=copy.name;page.routing.path=`${page.routing.path}-copy-${copy.id.slice(0,8)}`;copy.pageId=page.id;w.pages.push(page);w.assignments.push({pageId:page.id,projectId:node.projectId,directoryId:copy.parentId});}w.directories.push(copy);}for(const a of assignments.filter(a=>a.directoryId&&ids.has(a.directoryId)&&!nodes.some(d=>d.pageId===a.pageId))){const page=structuredClone(pages.find(p=>p.id===a.pageId)!);page.id+=`_copy_${crypto.randomUUID()}`;page.routing.path+=`-copy-${crypto.randomUUID().slice(0,8)}`;w.pages.push(page);w.assignments.push({...a,pageId:page.id,directoryId:map.get(a.directoryId!)!});}return;}
    const peers=w.directories.filter(d=>d.projectId===node.projectId&&d.parentId===node.parentId),index=peers.indexOf(node),other=peers[index+(action==='up'?-1:1)];if(other){const i=w.directories.indexOf(node),j=w.directories.indexOf(other);[w.directories[i],w.directories[j]]=[w.directories[j],w.directories[i]];}
   });refresh(selected||undefined);
  }catch(error){showAppToast(error instanceof Error?error.message:'操作失败',{variant:'error'});}
 });
 document.body.addEventListener('input',event=>{const t=event.target as HTMLInputElement;if(t.matches('[data-pt-search]')){const position=t.selectionStart;state.query=t.value;refresh();const next=document.querySelector<HTMLInputElement>('[data-pt-search]');next?.focus();if(next&&position!==null)try{next.setSelectionRange(position,position);}catch{}return;}if(t.closest('[data-pt-form]')&&state.editor){if(t.name==='name')state.editor.name=t.value;if(t.name==='path')state.editor.path=t.value;state.editor.dirty=true;}});
 document.body.addEventListener('change',event=>{const t=event.target as HTMLSelectElement;if(t.closest('[data-pt-form]')&&state.editor&&t.name==='parent'){state.editor.parent=t.value;state.editor.dirty=true;}});
 document.body.addEventListener('submit',event=>{const form=event.target as HTMLFormElement;if(!form.matches('[data-pt-form]')||!state.editor)return;event.preventDefault();const editor=state.editor,data=new FormData(form),name=String(data.get('name')??'').trim(),path=String(data.get('path')??'').trim(),parent=String(data.get('parent')??editor.parent);
  try{let focus='';write(w=>{let parentId:string|null=parent||null;if(w.projects.find(p=>p.id===projectId())?.status==='disabled'){
   const current=w.directories.find(d=>d.id===editor.id&&d.projectId===projectId());
   const assigned=w.assignments.find(a=>a.projectId===projectId()&&`page:${a.pageId}`===editor.id);
   if(editor.mode!=='edit'||(!current&&!assigned)||(current?current.parentId:assigned?.directoryId)!==parentId||(path&&!current?.pageId&&!assigned))throw new Error('停用项目仅可编辑已有页面或重命名目录');
  }if(parentId?.startsWith('page:'))parentId=promote(w,parentId).id;const node=editor.mode==='new'?{id:crypto.randomUUID(),name,projectId:projectId(),parentId}:promote(w,editor.id);if(editor.mode==='new')w.directories.push(node);node.parentId=parentId;focus=node.id;
   if(editor.mode==='move'){if(node.pageId){const a=w.assignments.find(a=>a.pageId===node.pageId)!;a.directoryId=parentId;}return;}
   node.name=name;const old=w.pages.find(p=>p.id===node.pageId);if(old&&!path)throw new Error('已注册页面的路径地址不能为空');
   if(path){const project=w.projects.find(p=>p.id===projectId())!;validateProjectMicroApp(project);const page=buildLocalPageRegistration({id:old?.id??`page_${node.id}`,title:name,titleEn:old?.titleEn,module:old?.module??project.name,type:'micro-app',path,microName:project.microName,microUrl:project.microUrl});page.routing.microAppConfig!.path=project.microRoute;w.pages=w.pages.filter(p=>p.id!==page.id);w.pages.push(page);w.assignments=w.assignments.filter(a=>a.pageId!==page.id);w.assignments.push({pageId:page.id,projectId:projectId(),directoryId:parentId});node.pageId=page.id;}
  },editor.mode==='edit');state.editor=undefined;if(parent)state.collapsed.delete(parent);refresh(focus);showAppToast('页面配置已保存');}catch(error){editor.error=error instanceof Error?error.message:'保存失败，输入已保留';const message=form.querySelector('[data-pt-error]');if(message)message.textContent=editor.error;}
 });
 document.addEventListener('keydown',event=>{
  if(!route()||document.querySelector('[data-app-confirm-panel]'))return;
  if(event.key==='Escape'&&state.editor){if(leaveEditor())refresh();return;}
  if(event.key==='Tab'){
   const host=document.querySelector(state.editor?'[data-pt-form]':'[data-project-page-table]');
   const controls=[...(host?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href]')??[])].filter(e=>e.getClientRects().length);
   const first=controls[0],last=controls.at(-1),active=document.activeElement;
   if(first&&(!host?.contains(active)||event.shiftKey&&active===first)){event.preventDefault();(event.shiftKey?last:first)?.focus();}
   else if(last&&!event.shiftKey&&active===last){event.preventDefault();first?.focus();}
  }
 });
 document.addEventListener('click',event=>{if(!(event.target as Element).closest('[data-pt-more]'))document.querySelectorAll<HTMLDetailsElement>('[data-pt-more]').forEach(d=>d.open=false);});
 window.addEventListener('beforeunload',event=>{if(state.editor?.dirty){event.preventDefault();event.returnValue='';}});
 window.addEventListener('hashchange',()=>{const editor=state.editor;if(editor?.dirty&&(!route()||projectId()!==editor.project)){if(!window.confirm('页面信息尚未保存，离开将丢失输入。确认离开？')){history.replaceState(null,'',`#${root}?project=${encodeURIComponent(editor.project)}`);mount();}else state.editor=undefined;}});
}
export function renderProjectPageTable():string {
 const {workspace:w,error}=read(),id=projectId(),project=w.projects.find(p=>p.id===id);
 if(!project||error)return `<section class="fixed inset-0 z-[100] grid place-items-center bg-slate-50 p-8"><div><h1 class="text-xl font-semibold">项目页面管理</h1><p role="alert" class="my-4">${esc(error??'项目不存在或入口已失效')}</p><a href="#/m-platform/nav-blueprint/page-registry/projects" class="${btn}">返回项目管理</a></div></section>`;
 if(state.project!==id){state.project=id;state.query='';state.scroll=0;}
 const editable=canEdit(w,id)&&!error,nodes=w.directories.filter(d=>d.projectId===id),q=state.query.trim().toLowerCase();
 const linked=new Set(nodes.flatMap(d=>d.pageId?[d.pageId]:[]));
 const loose=w.assignments.filter(a=>a.projectId===id&&!linked.has(a.pageId));
 const selectedIds=new Set<string>();
 for(const d of nodes){const p=w.pages.find(p=>p.id===d.pageId);if(!q||`${d.name} ${p?.routing.path??''}`.toLowerCase().includes(q))selectedIds.add(d.id);}
 for(const a of loose){const p=w.pages.find(p=>p.id===a.pageId);if(p&&(!q||`${p.title} ${p.routing.path}`.toLowerCase().includes(q))&&a.directoryId)selectedIds.add(a.directoryId);}
 for(const key of [...selectedIds]){let d=nodes.find(d=>d.id===key);const seen=new Set<string>();while(d?.parentId&&!seen.has(d.parentId)){seen.add(d.parentId);selectedIds.add(d.parentId);d=nodes.find(n=>n.id===d!.parentId);}}
 const branches=nodes.filter(d=>nodes.some(n=>n.parentId===d.id)||loose.some(a=>a.directoryId===d.id)).map(d=>d.id);
 const allOpen=branches.every(key=>!state.collapsed.has(key));
 function actions(key:string):string {return `<div class="flex items-center justify-end gap-3 whitespace-nowrap"><button type="button" data-pt-action="child" data-pt-id="${esc(key)}" ${!editable?'disabled':''} class="text-blue-600 disabled:opacity-40">新增子级</button><button type="button" data-pt-action="edit" data-pt-id="${esc(key)}" ${!canEdit(w,id,true)?'disabled':''} class="text-blue-600 disabled:opacity-40">编辑</button><details class="relative" data-pt-more><summary class="cursor-pointer px-2 text-lg" aria-label="更多操作">⋯</summary><div class="absolute right-0 z-20 mt-2 w-36 rounded-xl border border-slate-100 bg-white p-2 shadow-xl">${[['copy','复制及子级'],['move','指定移动'],['up','上移'],['down','下移'],['delete','删除']].map(([a,t])=>`<button type="button" data-pt-action="${a}" data-pt-id="${esc(key)}" ${!editable?'disabled':''} class="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40 ${a==='delete'?'text-red-500':''}">${t}</button>`).join('')}</div></details></div>`;}
 function rows(parent:string|null,depth:number):string {
  let html='';
  for(const d of nodes.filter(d=>d.parentId===parent&&selectedIds.has(d.id))){const p=w.pages.find(p=>p.id===d.pageId),has=branches.includes(d.id),open=Boolean(q)||!state.collapsed.has(d.id);
   html+=`<tr class="border-b border-slate-100 hover:bg-blue-50/30" data-pt-row="${esc(d.id)}"><td class="px-5 py-4"><div class="flex items-center gap-3" style="padding-left:${depth*24}px">${has?`<button type="button" data-pt-toggle="${esc(d.id)}" aria-label="展开或收起 ${esc(d.name)}" aria-expanded="${open}" class="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-500">${open?'−':'+'}</button>`:'<span class="w-7 shrink-0"></span>'}<span class="font-semibold text-slate-800">${esc(d.name)}</span><span class="text-xs text-slate-400">${depth+1} 级</span></div></td><td class="break-all px-5 py-4 font-mono text-xs text-slate-500">${esc(p?.routing.path??'—')}</td><td class="px-5 py-4 text-slate-500">${p?'微应用':'目录'}</td><td class="px-5 py-4">${actions(d.id)}</td></tr>`;
   if(open)html+=rows(d.id,depth+1);
  }
  for(const a of loose.filter(a=>a.directoryId===parent)){const p=w.pages.find(p=>p.id===a.pageId);if(!p||q&&!`${p.title} ${p.routing.path}`.toLowerCase().includes(q))continue;html+=`<tr class="border-b border-slate-100" data-pt-row="page:${esc(p.id)}"><td class="px-5 py-4"><span class="font-semibold" style="padding-left:${depth*24+40}px">${esc(p.title)}</span></td><td class="break-all px-5 py-4 font-mono text-xs">${esc(p.routing.path)}</td><td class="px-5 py-4">微应用</td><td class="px-5 py-4">${actions(`page:${p.id}`)}</td></tr>`;}
  return html;
 }
 const editor=state.editor?.project===id?state.editor:undefined;
 return `<section class="fixed inset-0 z-[100] flex min-h-0 flex-col bg-[#f7f8fa] p-6 sm:p-8" data-project-page-table>${renderStandalonePageHeader({titleHtml:`${esc(project.name)} · 页面管理`,backHtml:'<button type="button" data-pt-back>返回项目管理</button>',subtitleHtml:`${nodes.length+loose.length} 项 · ${project.status==='disabled'?'项目已停用，可编辑已有页面':'项目内页面结构'}`,actionsHtml:`<button type="button" data-pt-new ${!editable?'disabled':''} class="${btn} !border-blue-600 !bg-blue-600 !text-white">＋ 新增一级页面</button>`})}<div class="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"><div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><input type="search" data-pt-search aria-label="搜索项目页面" value="${esc(state.query)}" placeholder="搜索页面名称或路径" class="h-11 w-full max-w-md rounded-xl border border-slate-200 px-4 text-sm"><button type="button" data-pt-toggle-all ${!branches.length?'disabled':''} class="${btn}">${allOpen?'全部收起':'全部展开'}</button></div><div class="min-h-0 flex-1 overflow-auto" data-pt-scroll><table class="w-full text-left text-sm"><thead class="sticky top-0 z-10 bg-slate-50 text-slate-500"><tr><th class="min-w-72 px-5 py-4">页面名称</th><th class="min-w-72 px-5 py-4">路径地址</th><th class="w-28 px-5 py-4">页面类型</th><th class="w-64 px-5 py-4 text-right">操作</th></tr></thead><tbody>${rows(null,0)||'<tr><td colspan="4" class="p-16 text-center text-slate-400">暂无匹配页面</td></tr>'}</tbody></table></div></div>${editor?`<div class="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/40 p-4" data-pt-overlay><section role="dialog" aria-modal="true" aria-label="${editor.mode==='move'?'移动页面':editor.mode==='new'?'新增页面':'编辑页面'}" class="w-full max-w-xl rounded-2xl bg-white p-6"><h2 class="mb-5 text-lg font-semibold">${editor.mode==='move'?'移动页面':editor.mode==='new'?'新增页面':'编辑页面'}</h2><form data-pt-form class="space-y-4"><label class="block text-sm">父级页面<select name="parent" ${project.status==='disabled'?'disabled':''} class="${input}">${parentOptions(w,id,editor.id)}</select></label>${editor.mode!=='move'?`<label class="block text-sm">页面名称 *<input name="name" required value="${esc(editor.name)}" class="${input}"></label><label class="block text-sm">路径地址<input name="path" value="${esc(editor.path)}" placeholder="目录可留空，例如：/products/list" class="${input}"></label><p class="text-xs text-slate-400">类型为微应用，加载参数复用项目配置；路径留空表示仅组织子级的目录。</p>`:''}<p role="alert" class="text-sm text-red-600" data-pt-error>${esc(editor.error)}</p><footer class="flex justify-end gap-3"><button type="button" data-pt-cancel class="${btn}">取消</button><button type="submit" class="${btn}">${editor.mode==='move'?'确认移动':'保存'}</button></footer></form></section></div>`:''}</section>`;
}
