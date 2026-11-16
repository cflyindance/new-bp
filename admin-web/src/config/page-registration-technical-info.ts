import type { PageRegistration } from './page-registration-domain';
import type { RegistryWorkspace } from './page-registry-projects';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function renderRegistrationTechnicalInfo(page:PageRegistration,w:RegistryWorkspace,error?:string):string {
 const assignment=w.assignments.find(a=>a.pageId===page.id);
 const project=w.projects.find(p=>p.id===assignment?.projectId);
 const treeNode=w.directories.find(d=>d.pageId===page.id&&d.projectId===project?.id);
 const hierarchy:string[]=treeNode?[]:[page.title];
 const seen=new Set<string>();
 let current=treeNode??w.directories.find(d=>d.id===assignment?.directoryId&&d.projectId===project?.id);
 while(current&&!seen.has(current.id)) {
  seen.add(current.id);hierarchy.unshift(current.name);
  current=w.directories.find(d=>d.id===current!.parentId&&d.projectId===project?.id);
 }
 const fields=[['所属项目',error?'暂不可读取':project?.name??'未归类'],['页面层级路径',error?'暂不可读取':project?hierarchy.join(' / '):'未归类'],['页面名称',page.title],['路径地址',page.routing.path]];
 return `<details class="mt-4 rounded-xl border border-slate-200 p-4" data-page-technical-info><summary class="cursor-pointer text-xs text-blue-600">技术信息（只读）</summary><dl class="mt-4 space-y-3 text-xs">${fields.map(([label,value])=>`<div class="flex gap-4"><dt class="w-16 shrink-0 text-slate-400">${escape(label)}</dt><dd class="min-w-0 break-all leading-5 text-slate-700">${escape(value||'未配置')}</dd></div>`).join('')}</dl></details>`;
}
