import type { Catalog } from './center-catalog';
import type { Access } from './center-domain';

export interface AuthorizationRow { contentKey:string; title:string; editKeys:string[]; editTitle:string; help:string }
/** Only same-object editing and its corresponding save are grouped. Other actions remain independent. */
const saveActions:Record<string,string[]>={
  'action:/team/roles-employees:manage-employee':['save-employee'],
  'action:/team/shift-scheduling:manage-shift':['save-schedule'],
  'action:/team/payroll-report:manage-declaration':['save-declaration'],
};
export function authorizationRows(catalog:Catalog,page:string):AuthorizationRow[] {
  return [...catalog.resources.values()].filter(r=>r.type==='content'&&r.parent===page).flatMap(content=>{
    const action=[...catalog.resources.values()].find(r=>r.type==='action'&&r.parent===page&&r.requires?.length===1&&r.requires[0]===content.key&&
      (content.key.endsWith(`:object-${r.key.split(':').at(-1)}`)||content.key.endsWith(':employee-info')&&r.key.endsWith(':edit-employee')));
    if(!action)return [];
    const editKeys=[action.key,...(saveActions[action.key]??[]).map(id=>`action:${content.path}:${id}`)];
    for(const key of editKeys){const r=catalog.resources.get(key);if(!r||r.type!=='action'||r.parent!==page||!r.requires?.includes(content.key))throw Error(`统一授权缺少对应操作：${key}`);}
    const object=action.title.replace(/^编辑/,'');
    return [{contentKey:content.key,title:content.key.endsWith(':employee-info')?'员工信息管理':`${object}管理`,editKeys,editTitle:action.title,
      help:`不可见：隐藏内容及编辑入口；可见不可编辑：仅查看；可编辑：${action.title}，${action.help??`允许${action.title}`}${editKeys.length>1?'，包含对应保存操作':''}。导出、发布等特殊操作独立授权。`}];
  });
}
export function authorizationSelection(row:AuthorizationRow,own:(key:string)=>Access|'inherit'):Access|'inherit'|'mixed' {
  const content=own(row.contentKey),edits=row.editKeys.map(own);
  if(content==='inherit'&&edits.every(v=>v==='inherit'))return 'inherit';
  if(content==='hidden'&&edits.every(v=>v==='hidden'))return 'hidden';
  if(content==='read'&&edits.every(v=>v==='hidden'))return 'read';
  if(content==='read'&&edits.every(v=>v==='edit'))return 'edit';
  return 'mixed';
}
export function applyAuthorization(target:Record<string,Access>,row:AuthorizationRow,value:Access|'inherit'):void {
  if(!['hidden','read','edit','inherit'].includes(value)||!row.editKeys.length)throw Error('授权状态无效');
  for(const key of [row.contentKey,...row.editKeys]){
    if(value==='inherit')delete target[key];
    else target[key]=key===row.contentKey?(value==='hidden'?'hidden':'read'):(value==='edit'?'edit':'hidden');
  }
}
