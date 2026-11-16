import { getBuiltInPageRegistrations, getPageRegistrations } from './page-registration-catalog';
import { readRegistryWorkspace } from './page-registry-projects';
import { searchPageRegistrations, type PageRegistration } from './page-registration-domain';
const esc = (s: string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const pickerTree = { project: '', collapsed: new Set<string>() };
export function focusPickerPage(id: string): void {
  const {workspace:w}=readRegistryWorkspace(getBuiltInPageRegistrations());
  pickerTree.project=w.assignments.find(a=>a.pageId===id)?.projectId ?? w.projects[0]?.id ?? '';
  if(id&&!w.assignments.some(a=>a.pageId===id))pickerTree.project='';
  pickerTree.collapsed.clear();
}
export function renderPickerTree(query: string, pending: string): string {
  const {workspace:w,error}=readRegistryWorkspace(getBuiltInPageRegistrations());
  if(pickerTree.project&&!w.projects.some(p=>p.id===pickerTree.project))pickerTree.project='';
  const matches=new Set(searchPageRegistrations(getPageRegistrations(),query).map(p=>p.id));
  function page(p:PageRegistration,depth:number):string {
    if (w.projects.some(project=>project.id===pickerTree.project&&project.status==='disabled')) p={...p,status:'retired'};
    if(!matches.has(p.id))return '';
    return `<button type="button" data-page-pick="${esc(p.id)}" ${p.status==='retired'?'disabled':''} aria-pressed="${pending===p.id}" class="my-1 flex min-h-16 w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${pending===p.id?'border-blue-500 bg-blue-50 text-blue-800':'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'}"><span aria-hidden="true" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500">▤</span><span class="min-w-0 flex-1"><span class="block text-sm font-medium">${esc(p.title)}</span><span class="mt-1 block break-all text-xs text-slate-400">${esc(p.routing.path)}</span></span><span aria-hidden="true" class="h-4 w-4 shrink-0 rounded-full border ${pending===p.id?'border-[5px] border-blue-500':'border-slate-300'}"></span></button>`;
  }
  const linked = new Set(w.directories.flatMap(d=>d.pageId?[d.pageId]:[]));
  function nodes(parent:string|null,depth:number):string {
    let html='';
    for(const d of w.directories.filter(d=>d.projectId===pickerTree.project&&d.parentId===parent)) {
      const own=w.pages.find(p=>p.id===d.pageId);
      const descendants=nodes(d.id,depth+1);
      const ownRow=own?page(own,depth):'';
      if(query.trim()&&!ownRow&&!descendants)continue;
      const expanded=query.trim()||!pickerTree.collapsed.has(d.id);
      const hasChildren=Boolean(descendants);
      const toggle=hasChildren?`<button type="button" data-picker-tree-toggle="${esc(d.id)}" aria-label="展开或收起 ${esc(d.name)}" aria-expanded="${Boolean(expanded)}" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xl text-slate-500 hover:bg-slate-200">${expanded?'⌄':'›'}</button>`:'<span class="w-8 shrink-0" aria-hidden="true"></span>';
      const row=ownRow?`<div class="flex items-center gap-1">${toggle}${ownRow}</div>`:`<div class="my-1 flex min-h-12 items-center gap-2 rounded-xl bg-slate-100 px-2">${toggle}<span aria-hidden="true" class="text-slate-400">▰</span><span class="min-w-0 flex-1 py-3 text-sm font-semibold text-slate-700">${esc(d.name)}</span><span class="pr-2 text-xs text-slate-400">${depth+1} 级</span></div>`;
      html+=`<div class="relative" data-picker-tree-node="${esc(d.id)}">${row}${expanded&&descendants?`<div class="relative ml-4 border-l border-slate-200 pl-5" data-picker-tree-children><span aria-hidden="true" class="absolute left-0 top-8 w-4 border-t border-slate-200"></span>${descendants}</div>`:''}</div>`;
    }
    for(const a of w.assignments.filter(a=>a.projectId===pickerTree.project&&a.directoryId===parent&&!linked.has(a.pageId))) {const p=w.pages.find(p=>p.id===a.pageId);if(p)html+=page(p,depth);}
    return html;
  }
  const rows=pickerTree.project?nodes(null,0):getPageRegistrations().filter(p=>!w.assignments.some(a=>a.pageId===p.id)).map(p=>page(p,0)).join('');
  const projectButton=(id:string,name:string)=>`<button type="button" data-picker-project="${esc(id)}" aria-pressed="${pickerTree.project===id}" class="mb-2 block w-full rounded-xl px-3 py-3 text-left text-sm ${pickerTree.project===id?'bg-blue-50 font-semibold text-blue-600':'hover:bg-slate-100'}">${esc(name)}</button>`;
  return `<div class="flex h-full min-h-0 gap-4 overflow-hidden"><aside class="flex min-h-0 w-48 shrink-0 flex-col overflow-hidden border-r border-slate-100 pr-3"><h3 class="mb-4 shrink-0 text-sm font-semibold">项目</h3><div class="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-picker-project-scroll>${w.projects.map(p=>projectButton(p.id,p.name)).join('')}${projectButton('','未归类页面')}</div></aside><section class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"><h3 class="mb-3 shrink-0 text-sm font-semibold">页面结构</h3><div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2" data-picker-page-scroll>${error?`<p role="alert" class="mb-3 text-xs text-red-600">${esc(error)}</p>`:''}${rows||'<p class="p-8 text-center text-sm text-slate-400">当前项目暂无匹配页面</p>'}</div></section></div>`;
}
