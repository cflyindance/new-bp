import * as accounts from './staff-account-store';
import {saveCenterState} from './center-store';
import type {CenterState} from './center-domain';
const ACCOUNT_KEY='menusifu:staff-login-accounts:v1';
/** Both local stores roll back together; credentials never enter the permission audit. */
export function openCenterAccount(state:CenterState, employeeId:string, input:{name:string;email:string;password:string;confirmPassword:string;method:'invite'|'password'}, actor:string, operation:'create'|'accept'|'resend'|'revoke'|'toggle'='create'):CenterState {
  const previous=accounts.listStaffLoginAccounts().find(a=>a.employeeId===employeeId);
  if(operation!=='create' && !state.employees.some(e=>e.id===employeeId))throw Error('员工不存在');
  if(operation==='accept'&&(!previous?.invitation||previous.invitation.revoked||Date.parse(previous.invitation.expiresAt)<=Date.now()))throw Error('邀请已过期、撤销或不存在，请重新邀请');
  const requiresPassword=operation==='accept'||operation==='create'&&input.method==='password';
  const problem=accounts.validateStaffAccountInput({employeeId,employeeName:input.name,loginEmail:input.email,password:input.password,confirmPassword:input.confirmPassword,requirePassword:requiresPassword,excludeId:previous?.id});
  if(problem)throw Error(problem);
  if(operation==='create'&&previous)throw Error('该员工已有账号');
  if(operation==='resend'&&previous&&!previous.invitation)throw Error('账号已开通，不能重新邀请');
  if(operation==='revoke'&&!previous?.invitation)throw Error('邀请不存在或已接受');
  const beforeAccounts=localStorage.getItem(ACCOUNT_KEY);
  try {
    let account;
    if(!previous) account=accounts.createStaffLoginAccount({employeeId,employeeName:input.name,loginEmail:input.email,password:input.password,enabled:true,openingMethod:input.method});
    else if(operation==='toggle')account=accounts.updateStaffLoginAccount(previous.id,{enabled:!previous.enabled});
    else if(operation==='accept')account=accounts.updateStaffLoginAccount(previous.id,{password:input.password,enabled:true,invitation:undefined});
    else account=accounts.updateStaffLoginAccount(previous.id,{invitation:operation==='revoke'?{...previous.invitation!,revoked:true}:{sentAt:new Date().toISOString(),expiresAt:new Date(Date.now()+72*60*60*1000).toISOString()}});
    if(!account)throw Error('账号不存在');
    const next=structuredClone(state); let employee=next.employees.find(e=>e.id===employeeId);
    if(!employee){employee={id:employeeId,name:input.name,email:input.email,status:'unopened',bindings:[],overrides:{}};next.employees.push(employee);}
    employee.status=account.invitation?account.invitation.revoked?'revoked':'pending':account.enabled?'enabled':'disabled';
    return saveCenterState(next,state.version,employeeId,operation==='create'?(input.method==='invite'?'创建演示邀请':'设置密码开通账号'):operation==='accept'?'演示接受邀请':operation==='resend'?'重发演示邀请':operation==='toggle'?'变更账号状态':'撤销邀请',actor);
  } catch(error) {
    if(beforeAccounts===null)localStorage.removeItem(ACCOUNT_KEY);else localStorage.setItem(ACCOUNT_KEY,beforeAccounts);
    throw error;
  }
}

/** Delete only the disabled login credential and preserve the employee and their authorization history. */
export function deleteCenterAccount(state:CenterState,employeeId:string,actor:string):CenterState {
  const employee=state.employees.find(e=>e.id===employeeId);
  const account=accounts.listStaffLoginAccounts().find(a=>a.employeeId===employeeId);
  if(!employee||!account)throw Error('账号不存在，请刷新后重试');
  if(employee.status!=='disabled'||account.enabled)throw Error('请先停用账号');
  if(account.isSystem)throw Error('系统预设账号不能删除');
  const beforeAccounts=localStorage.getItem(ACCOUNT_KEY);
  const next=structuredClone(state);
  const target=next.employees.find(e=>e.id===employeeId)!;
  target.status='unopened';
  target.email='';
  try {
    if(!accounts.deleteStaffLoginAccount(account.id))throw Error('账号删除失败，请刷新后重试');
    return saveCenterState(next,state.version,employeeId,'删除登录账号',actor);
  } catch(error){
    if(beforeAccounts===null)localStorage.removeItem(ACCOUNT_KEY);
    else localStorage.setItem(ACCOUNT_KEY,beforeAccounts);
    throw error;
  }
}
