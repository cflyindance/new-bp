import type {OperationEntry} from './operation-log';
import type {RegistryWorkspace} from './page-registry-projects';

export function belongsToProject(entry:OperationEntry,projectId:string):boolean {
 if(entry.objects.some(o=>o.id===projectId))return true;
 return [entry.before,entry.after].some(snapshot=>{
  if(!snapshot||typeof snapshot!=='object')return false;
  const w=snapshot as Partial<RegistryWorkspace>;
  const ids=new Set([projectId,...(w.directories??[]).filter(d=>d.projectId===projectId).map(d=>d.id),...(w.assignments??[]).filter(a=>a.projectId===projectId).map(a=>a.pageId)]);
  return entry.objects.some(o=>ids.has(o.id));
 });
}

/** View-only fixtures: stable IDs, no writes to the real audit store or business data. */
export function registryLogFixtures(w:RegistryWorkspace):OperationEntry[] {
 const allowed=new Set(['registry-test-product-center','registry-test-promotions','registry-test-members','registry-test-transactions','registry-test-orders']);
 return w.projects.filter(p=>allowed.has(p.id)).flatMap((p,index)=>{
  const directory=w.directories.find(d=>d.projectId===p.id);
  const assignment=w.assignments.find(a=>a.projectId===p.id);
  const page=w.pages.find(v=>v.id===assignment?.pageId);
  return ['新增项目','编辑项目','停用项目','启用项目','注册页面','编辑页面','移动页面','删除页面'].map((action,i)=>{
   const id=`registry-demo-log-v1:${p.id}:${i}`;
   const projectAction=i<4;
   const object={id:projectAction?p.id:`${p.id}:demo-page`,name:projectAction?p.name:page?.title??'示例页面',kind:projectAction?'项目':'页面',path:projectAction?p.name:[p.name,directory?.name,page?.title??'示例页面'].filter(Boolean).join(' / ')};
   const before=i===0?null:{name:object.name,status:i===3?'disabled':'active',parent:i===6?'原目录':directory?.name??'项目根级'};
   const after=i===7?null:{name:object.name,status:i===2?'disabled':'active',parent:directory?.name??'项目根级'};
   return {id,batchId:id,time:new Date(Date.UTC(2026,10,16,1,index*9+i)).toISOString(),scope:'registry',action,actor:'测试数据 · 示例操作员',stage:'测试数据',result:'success',reason:'演示记录，不代表真实操作，不修改项目或页面。',before,after,objects:[object,...(projectAction?[]:[{id:p.id,name:p.name,path:p.name,kind:'项目'}])],changes:[{field:projectAction?'项目配置':'页面配置',before,after}],persistent:true} satisfies OperationEntry;
  });
 });
}
