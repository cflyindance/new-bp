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
  const assignment=w.assignments.find(a=>a.projectId===p.id);
  const page=w.pages.find(v=>v.id===assignment?.pageId);
  const directory=w.directories.find(d=>d.projectId===p.id&&!d.pageId);
  const names:string[]=[];let parent=directory;const seen=new Set<string>();
  while(parent&&!seen.has(parent.id)){seen.add(parent.id);names.unshift(parent.name);parent=w.directories.find(d=>d.id===parent!.parentId);}
  const destination=names.join(' / ')||'业务页面';
  const pageName=page?.title??`${p.name.replace(/中心$/,'')}列表`;
  const path=page?.routing.path.replace(/^\/__registry-test\/[^/]+/,'')||'/index';
  const registered={title:pageName,path,parent:'项目根级'};
  const edited={...registered,title:`${pageName}管理`,path:`${path.replace(/\/$/,'')}/manage`};
  const moved={...edited,parent:destination};
  const created={name:`${p.name}项目`,status:'active'};
  const active={name:p.name,status:'active'},disabled={name:p.name,status:'disabled'};
  const transitions:Array<{before:unknown;after:unknown;changes:OperationEntry['changes']}>= [
   {before:null,after:created,changes:[{field:'项目配置',before:null,after:created}]},
   {before:created,after:active,changes:[{field:'项目名称',before:created.name,after:p.name}]},
   {before:active,after:disabled,changes:[{field:'status',before:'active',after:'disabled'}]},
   {before:disabled,after:active,changes:[{field:'status',before:'disabled',after:'active'}]},
   {before:null,after:registered,changes:[{field:'页面配置',before:null,after:registered}]},
   {before:registered,after:edited,changes:[{field:'title',before:registered.title,after:edited.title},{field:'path',before:registered.path,after:edited.path}]},
   {before:edited,after:moved,changes:[{field:'parent',before:'项目根级',after:destination}]},
   {before:moved,after:null,changes:[{field:'页面配置',before:moved,after:null}]}
  ];
  return ['新增项目','编辑项目','停用项目','启用项目','注册页面','编辑页面','移动页面','删除页面'].map((action,i)=>{
   const id=`registry-demo-log-v1:${p.id}:${i}`;
   const projectAction=i<4;
   const name=projectAction?(i===0?created.name:p.name):i===4?pageName:edited.title;
   const object={id:projectAction?p.id:`${p.id}:demo-page`,name,kind:projectAction?'项目':'页面',path:projectAction?name:[p.name,i>=6?destination:undefined,name].filter(Boolean).join(' / ')};
   return {id,batchId:id,time:new Date(Date.UTC(2026,10,16,1,index*9+i)).toISOString(),scope:'registry',action,actor:['张明','李娜','王磊','陈晨','刘洋'][(index+i)%5],stage:'测试数据',result:'success',reason:'',...transitions[i],objects:[object,...(projectAction?[]:[{id:p.id,name:p.name,path:p.name,kind:'项目'}])],persistent:true} satisfies OperationEntry;
  });
 });
}
