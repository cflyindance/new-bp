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
 const fields=[['所属项目',error?'暂不可读取':project?.name??'未关联项目'],['页面层级',error?'暂不可读取':project?hierarchy.join(' / '):'未关联项目'],['路径地址',page.routing.path]];
 return `<div class="border-t border-border bg-muted/40 p-5" data-page-technical-info><dl class="space-y-4 text-sm">${fields.map(([label,value])=>`<div class="flex flex-wrap items-start gap-x-5 gap-y-2"><dt class="w-20 shrink-0 leading-6 text-muted-foreground">${escape(label)}</dt><dd class="min-w-0 flex-1 break-all leading-6 text-foreground">${escape(value||'未配置')}</dd>${label==='路径地址'&&value?`<button type="button" data-page-copy-path="${escape(value)}" aria-label="复制路径地址" class="shrink-0 rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">复制</button>`:''}</div>`).join('')}</dl></div>`;
}
