import type { Catalog,MenuNode,SettingGroup } from './center-catalog';
import {getTeamEmbeddedSettingItems} from '../config/module-settings-catalog';
import {TEAM_SHIFT_SCHEDULING_SETTING_SEQS} from '../config/team-settings-embed-ui';
import type { Access,Resource } from './center-domain';

export interface AuthorizationRow { contentKey:string; title:string; editKeys:string[]; editTitle:string; help:string; mode?:'visibility' }
/** Only same-object editing and its corresponding save are grouped. Other actions remain independent. */
const saveActions:Record<string,string[]>={
  'action:/team/roles-employees:manage-employee':['save-employee'],
  'action:/team/shift-scheduling:save-schedule':['clear-schedule','reset-schedule','copy-week'],
  'action:/team/payroll-report:manage-declaration':['save-declaration'],
  'action:/team/tips/rules:manage-rule':['copy'],
};
/** Schedule-table writes share one object; shift-definition editing is separate. */
export function registerScheduleAuthorization(resources:Map<string,Resource>,tree:MenuNode[],groups:Map<string,SettingGroup[]>):void {
  const path='/team/shift-scheduling',page=`page:${path}/schedule`,key=`content:${path}:object-save-schedule`;
  if(!resources.has(page)||resources.has(key))throw Error('排班表授权目录不完整');
  resources.set(key,{key,title:'排班内容',type:'content',parent:page,path,previewValue:'排班表（示例）'});
  for(const id of ['save-schedule','clear-schedule','reset-schedule','copy-week']){
    const action=resources.get(`action:${path}:${id}`);if(!action)throw Error(`排班操作不存在：${id}`);
    action.parent=page;action.requires=[key];
  }
  const node=tree.find(n=>n.id==='team')?.children.find(n=>n.id==='team-shifts');
  const legacy=resources.get(`page:${path}`),nav=node?.key?resources.get(node.key):undefined;
  if(!node||!legacy||!nav)throw Error('排班导航不完整');
  node.children=node.children.filter(n=>n.key!==legacy.key);
  legacy.type='navigation';legacy.compatibilityOnly=true;legacy.parent=nav.parent;nav.legacyGateKey=legacy.key;
  for(const key of [`content:${path}:object-manage-shift`,`action:${path}:manage-shift`]){
    const resource=resources.get(key);if(!resource)throw Error(`班次授权缺失：${key}`);resource.parent=`page:${path}/shifts`;
  }
  const rules=`page:${path}/rules`;
  groups.set(rules,[{id:'schedule-rules',title:'规则设置',section:'',keys:getTeamEmbeddedSettingItems(TEAM_SHIFT_SCHEDULING_SETTING_SEQS).map(item=>{
    const key=`setting:${path}:${item.seq}`;if(resources.has(key))throw Error(`重复排班规则：${key}`);
    resources.set(key,{key,title:item.title,type:'setting',parent:rules,path:`${path}/rules`,seq:item.seq});return key;
  })}]);
}
export function authorizationRows(catalog:Catalog,page:string):AuthorizationRow[] {
  if(page==='page:/team/tips/distribution')return [
    {contentKey:'page:/team/tips/details',title:'小费分配',editKeys:[...['refresh-tip-data','confirm-allocation','confirm-payout'].map(id=>`action:/team/tips/details:${id}`),...['batch-allocate','cancel-allocation'].map(id=>`action:/team/tips/distribution:${id}`)],editTitle:'编辑小费分配',help:'不可见：隐藏分配内容及所有操作；可见不可编辑：仅查看；可编辑：允许更新小费数据、确认分配、确认已发放、批量分配及取消分配。导出单独授权。'},
    {contentKey:'content:/team/tips/distribution:export-results',title:'导出操作',editKeys:['export-pdf','export-csv','email-result'].map(id=>`action:/team/tips/distribution:${id}`),editTitle:'导出或发送结果',help:'可见：允许导出PDF、CSV及发送到邮箱；不可见：隐藏全部导出入口。小费分配不可见时不生效。',mode:'visibility'},
  ];
  return [...catalog.resources.values()].filter(r=>r.type==='content'&&r.parent===page).flatMap(content=>{
    const action=[...catalog.resources.values()].find(r=>r.type==='action'&&r.parent===page&&r.requires?.length===1&&r.requires[0]===content.key&&
      (content.key.endsWith(`:object-${r.key.split(':').at(-1)}`)||content.key.endsWith(':employee-info')&&r.key.endsWith(':edit-employee')));
    if(!action)return [];
    const editKeys=[action.key,...(saveActions[action.key]??[]).map(id=>`action:${content.path}:${id}`)];
    for(const key of editKeys){const r=catalog.resources.get(key);if(!r||r.type!=='action'||r.parent!==page||!r.requires?.includes(content.key))throw Error(`统一授权缺少对应操作：${key}`);}
    const object=action.title.replace(/^编辑/,'');
    if(action.key==='action:/team/tips/rules:manage-rule')return [{contentKey:content.key,title:'分配规则管理',editKeys,editTitle:'编辑分配规则',help:'不可见：隐藏规则及编辑入口；可见不可编辑：仅查看；可编辑：允许新增、修改、删除及复制分配规则。不包含小费分配、确认结果、确认发放或导出操作。'}];
    if(action.key==='action:/team/shift-scheduling:save-schedule')return [{contentKey:content.key,title:'排班管理',editKeys,editTitle:'编辑排班',help:'不可见：隐藏排班内容与全部操作；可见不可编辑：仅查看；可编辑：允许排班表内全部变更，包括调整、保存/批量保存、清除、恢复默认及同步下周排班。不包含班次或规则设置的编辑权限。'}];
    return [{contentKey:content.key,title:content.key.endsWith(':employee-info')?'员工信息管理':`${object}管理`,editKeys,editTitle:action.title,
      help:`不可见：隐藏内容及编辑入口；可见不可编辑：仅查看；可编辑：${action.title}，${action.help??`允许${action.title}`}${editKeys.length>1?'，包含对应保存操作':''}。导出、发布等特殊操作独立授权。`}];
  });
}
export function authorizationSelection(row:AuthorizationRow,own:(key:string)=>Access|'inherit'):Access|'inherit'|'mixed' {
  const content=own(row.contentKey),edits=row.editKeys.map(own);
  if(content==='inherit'&&edits.every(v=>v==='inherit'))return 'inherit';
  if(content==='hidden'&&edits.every(v=>v==='hidden'))return 'hidden';
  if(row.mode==='visibility')return content==='read'&&edits.every(v=>v==='edit')?'read':'mixed';
  if(content==='read'&&edits.every(v=>v==='hidden'))return 'read';
  if(content==='read'&&edits.every(v=>v==='edit'))return 'edit';
  return 'mixed';
}
export function applyAuthorization(target:Record<string,Access>,row:AuthorizationRow,value:Access|'inherit'):void {
  if(!['hidden','read','edit','inherit'].includes(value)||!row.editKeys.length)throw Error('授权状态无效');
  if(row.mode==='visibility'&&value==='edit')throw Error('导出仅支持可见或不可见');
  for(const key of [row.contentKey,...row.editKeys]){
    if(value==='inherit')delete target[key];
    else target[key]=key===row.contentKey?(value==='hidden'?'hidden':'read'):(value==='edit'||row.mode==='visibility'&&value==='read'?'edit':'hidden');
  }
}
