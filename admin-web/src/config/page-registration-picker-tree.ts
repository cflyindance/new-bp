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
    if(!matches.has(p.id))return '';
    return `<button type="button" data-page-pick="${esc(p.id)}" ${p.status==='retired'?'disabled':''} aria-pressed="${pending===p.id}" class="my-1 flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left disabled:opacity-40 ${pending===p.id?'border-blue-500 bg-blue-50':'border-transparent hover:bg-slate-50'}" style="padding-left:${16+depth*20}px"><span class="text-blue-600">${pending===p.id?'●':'○'}</span><span class="min-w-0 flex-1"><span class="block text-sm font-medium">${esc(p.title)}</span><span class="block break-all text-xs text-slate-400">${esc(p.routing.path)}</span></span></button>`;
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
      html+=`<div><div class="flex items-center"><button type="button" data-picker-tree-toggle="${esc(d.id)}" aria-label="展开或收起 ${esc(d.name)}" aria-expanded="${Boolean(expanded)}" class="h-8 w-8 shrink-0 text-xl text-slate-400">${expanded?'⌄':'›'}</button>${ownRow||`<span class="py-3 text-sm font-medium text-slate-600" style="padding-left:${depth*20}px">${esc(d.name)}</span>`}</div>${expanded?descendants:''}</div>`;
    }
    for(const a of w.assignments.filter(a=>a.projectId===pickerTree.project&&a.directoryId===parent&&!linked.has(a.pageId))) {const p=w.pages.find(p=>p.id===a.pageId);if(p)html+=page(p,depth);}
    return html;
  }
  const rows=pickerTree.project?nodes(null,0):getPageRegistrations().filter(p=>!w.assignments.some(a=>a.pageId===p.id)).map(p=>page(p,0)).join('');
  const projectButton=(id:string,name:string)=>`<button type="button" data-picker-project="${esc(id)}" aria-pressed="${pickerTree.project===id}" class="mb-2 block w-full rounded-xl px-3 py-3 text-left text-sm ${pickerTree.project===id?'bg-blue-50 font-semibold text-blue-600':'hover:bg-slate-100'}">${esc(name)}</button>`;
  return `<div class="flex min-h-[360px] gap-4"><aside class="w-48 shrink-0 border-r border-slate-100 pr-3"><h3 class="mb-4 text-sm font-semibold">项目</h3>${w.projects.map(p=>projectButton(p.id,p.name)).join('')}${projectButton('','未归类页面')}</aside><section class="min-w-0 flex-1"><h3 class="mb-3 text-sm font-semibold">页面结构</h3>${error?`<p role="alert" class="mb-3 text-xs text-red-600">${esc(error)}</p>`:''}${rows||'<p class="p-8 text-center text-sm text-slate-400">当前项目暂无匹配页面</p>'}</section></div>`;
}
