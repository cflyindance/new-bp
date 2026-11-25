import type {Audit, CenterState} from './center-domain';

export function auditDisplayText(value:string):string {
  return value.replace(/（演示）|【演示】|演示\s*·\s*|演示/g,'').trim();
}

const record=(raw:string):Record<string,unknown>=>{
  try{
    const parsed:unknown=JSON.parse(raw);
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return parsed as Record<string,unknown>;
  }catch{ /* Older malformed logs still have a searchable object ID. */ }
  return {};
};
const array=(value:unknown):unknown[]=>Array.isArray(value)?value:[];
const countChanges=(before:unknown[],after:unknown[])=>({added:after.filter(item=>!before.includes(item)).length,removed:before.filter(item=>!after.includes(item)).length});
const describeCounts=({added,removed}:ReturnType<typeof countChanges>,unit:string)=>[added?`新增 ${added} ${unit}`:'',removed?`移除 ${removed} ${unit}`:''].filter(Boolean).join('、');

export function presentAudit(log:Audit,state:CenterState,employeeId?:string) {
  const before=record(log.before),after=record(log.after);
  const role='grants' in before||'grants' in after||state.roles.some(item=>item.id===log.objectId);
  const target=(role?state.roles:state.employees).find(item=>item.id===log.objectId);
  const name=[after.name,before.name,target?.name].find((value):value is string=>typeof value==='string'&&!!value.trim())?.trim()??log.objectId;
  const category=role?'角色':/账号|邀请|开通/.test(log.action)?'账号':'员工授权';
  let action=auditDisplayText(log.action);
  let summary='';
  if(action==='变更账号状态'&&['enabled','disabled'].includes(String(after.status)))action=after.status==='enabled'?'启用账号':'停用账号';
  if(role&&action.includes('授权门店'))summary=describeCounts(countChanges(array(before.defaultStoreIds),array(after.defaultStoreIds)),'家');
  if(role&&action.includes('权限')){
    const left=(before.grants??{}) as Record<string,unknown>,right=(after.grants??{}) as Record<string,unknown>;
    const count=[...new Set([...Object.keys(left),...Object.keys(right)])].filter(key=>left[key]!==right[key]).length;
    if(count)summary=`调整 ${count} 项功能权限`;
  }
  if(!role&&category==='员工授权'){
    const roleIds=(value:unknown)=>[...new Set(array(value).flatMap(item=>item&&typeof item==='object'&&'roleId' in item?[String(item.roleId)]:[]))];
    const oldRoles=roleIds(before.bindings),newRoles=roleIds(after.bindings);
    const roles=countChanges(oldRoles,newRoles);
    const roleName=(id:string)=>log.names?.roles[id]??state.roles.find(role=>role.id===id)?.name??id;
    const extraIds=(value:Record<string,unknown>)=>array(value.extraStoreIds??array(value.supplementalStoreGrants).flatMap(item=>item&&typeof item==='object'&&'storeId' in item?[item.storeId]:[]));
    const extras=countChanges(extraIds(before),extraIds(after));
    const updates=[roles.added===1?`分配角色 · ${roleName(newRoles.find(id=>!oldRoles.includes(id))!)}`:roles.added?`分配 ${roles.added} 个角色`:'',roles.removed===1?`解除角色 · ${roleName(oldRoles.find(id=>!newRoles.includes(id))!)}`:roles.removed?`解除 ${roles.removed} 个角色`:'',extras.added?`添加 ${extras.added} 家额外门店`:'',extras.removed?`移除 ${extras.removed} 家额外门店`:''].filter(Boolean);
    if(updates.length){
      summary=updates.join('、');
      const actions=[roles.added?'分配角色':'',roles.removed?'解除角色':'',extras.added?'添加账号额外门店':'',extras.removed?'移除账号额外门店':''].filter(Boolean);
      if(actions.length===1)action=actions[0]!;
    }
  }
  const account=log.account;
  if(!summary&&account&&/重发/.test(action)&&(account.before?.sentAt!==account.after?.sentAt||account.before?.expiresAt!==account.after?.expiresAt))summary='更新邀请发送时间和有效期';
  if(!summary&&before.status!==after.status){
    const labels:Record<string,string>={unopened:'未开通',pending:'待接受邀请',revoked:'邀请已撤销',enabled:'已启用',disabled:'已停用'};
    summary=`${labels[String(before.status)]??'无'} → ${labels[String(after.status)]??'无'}`;
  }
  const impacts=employeeId?log.storeChanges?.filter(change=>change.employeeId===employeeId):log.storeChanges;
  if(impacts?.length){
    const rows=impacts.flatMap(change=>change.stores);
    const added=rows.filter(row=>!row.before.length).length,removed=rows.filter(row=>!row.after.length).length;
    if(role&&!employeeId)summary=[summary,`影响 ${impacts.length} 位员工`].filter(Boolean).join(' · ');
    else if(!added&&!removed)summary=[summary,'可访问门店数不变'].filter(Boolean).join(' · ');
    else summary=[summary,added?`新增可访问 ${added} 家`:'',removed?`移除可访问 ${removed} 家`:''].filter(Boolean).join(' · ');
  }
  if(!summary&&before.name!==after.name&&before.name&&after.name)summary=`${String(before.name)} → ${String(after.name)}`;
  return {name:auditDisplayText(name)||log.objectId,actor:auditDisplayText(log.actor)||'—',category,action,summary:auditDisplayText(summary)||'—'};
}
