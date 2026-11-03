import {M_RESOURCES,mModuleKey,mPageKey,mActionKey} from './m-platform-catalog';
import type {MRole,MState} from './m-platform-domain';
import {permissionDemoAccounts,type PermissionDemoAccount} from './permission-demo-identities';
export function createMDemoState(accounts:readonly PermissionDemoAccount[]=[]):MState {
  const role=(id:string,name:string,description:string,grants:MRole['grants']):MRole=>({id,name,description,grants});
  const merchant=role('m-demo-merchant','演示·商户访问员','品牌与门店查看、进入商户后台；不含商户状态维护。',{[mModuleKey('merchants')]:'read',[mPageKey('brands')]:'read',[mPageKey('stores')]:'read',[mActionKey('brands','impersonate')]:'edit',[mActionKey('stores','impersonate')]:'edit'});
  const preset=role('m-demo-presets','演示·预设配置员','预设可编辑，允许同步；发布与恢复默认禁止。',{[mModuleKey('presets')]:'read',[mPageKey('presets')]:'edit',[mActionKey('presets','sync')]:'edit'});
  const auditor=role('m-demo-auditor','演示·权限审计员','只读查看权限总览、角色、员工和两类变更记录。',{[mModuleKey('permissions')]:'read',...Object.fromEntries(['permission-overview','roles','provider-roles','staff','permission-log'].map(id=>[mPageKey(id),'read' as const]))});
  const exporter=role('m-demo-devices','演示·设备导出员','全量设备只读，独立允许导出。',{[mModuleKey('hardware')]:'read',[mPageKey('hardware-overview')]:'read',[mPageKey('devices')]:'read',[mActionKey('devices','export')]:'edit'});
  const empty=role('m-demo-empty','演示·空权限角色','没有菜单授权，可用于授权编辑、空态和复制测试。',{});
  const copy=role('m-demo-unused','演示·设备导出副本（可删除）','未关联员工，可用于编辑、复制及删除测试。',{...exporter.grants});
  const roles=[{id:'m-system-admin',name:'服务商管理员',description:'M 平台初始系统管理员',system:true,grants:Object.fromEntries([...M_RESOURCES].map(([key,r])=>[key,r.kind==='module'||r.kind==='page'&&!r.editable?'read' as const:'edit' as const]))},merchant,preset,auditor,exporter,empty,copy];
  const assignments:Record<string,string[]>={ent002:[preset.id,merchant.id],ent003:[merchant.id,exporter.id],ent004:[auditor.id],'demo-permission-disabled':[exporter.id]};
  const employees=[{id:'ent001',roleIds:['m-system-admin']},...permissionDemoAccounts(accounts).filter(a=>assignments[a.employeeId]).map(a=>({id:a.employeeId,roleIds:[...assignments[a.employeeId]]}))];
  const events:{action:string;object:string;before:unknown;after:unknown}[]=[];
  for(const r of roles.slice(1)){
    const created=r.id===auditor.id?{...r,description:'演示权限审计角色（初始）'}:r;
    events.push({action:r.id===copy.id?'复制角色':'新建角色',object:r.name,before:{roles:r.id===copy.id?[exporter]:[]},after:{roles:r.id===copy.id?[exporter,created]:[created]}});
  }
  events.push({action:'编辑角色',object:auditor.name,before:{roles:[{...auditor,description:'演示权限审计角色（初始）'}]},after:{roles:[auditor]}});
  const deleted=role('m-demo-deleted','演示·已删除角色（历史样例）','合成的删除前后值示例。',{});
  events.push({action:'新建角色',object:deleted.name,before:{roles:[]},after:{roles:[deleted]}},{action:'删除角色',object:deleted.name,before:{roles:[deleted]},after:{roles:[]}});
  for(const employee of employees.slice(1))events.push({action:'分配角色',object:accounts.find(a=>a.employeeId===employee.id)?.employeeName??employee.id,before:{employees:[]},after:{employees:[employee]}});
  const logs=events.map((e,index)=>({id:'m-demo-log-'+index,at:`2026-11-03T11:${String(index).padStart(2,'0')}:00+08:00`,actor:'演示数据（非真实操作人）',action:'演示：'+e.action,object:e.object,before:JSON.stringify(e.before),after:JSON.stringify(e.after)})).reverse();
  return {schema:1,catalogVersion:3,revision:0,roles,employees,logs};
}
export function mStateFromStorage(raw:string|null,accounts:()=>readonly PermissionDemoAccount[]):MState {
  return raw===null?createMDemoState(accounts()):JSON.parse(raw);
}
