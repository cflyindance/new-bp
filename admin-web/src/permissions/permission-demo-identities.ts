/** Reserved identities for local permission-center examples, never arbitrary staff. */
export const PERMISSION_DEMO_EXTRAS=[
  {employeeId:'demo-permission-unassigned',employeeName:'演示·待授权员工',loginEmail:'permission.unassigned.demo@menusifu.cn',enabled:true},
  {employeeId:'demo-permission-disabled',employeeName:'演示·停用员工',loginEmail:'permission.disabled.demo@menusifu.cn',enabled:false},
];
const emails:Record<string,string>={ent002:'preset.zhou@menusifu.cn',ent003:'blueprint.wu@menusifu.cn',ent004:'audit.zheng@menusifu.cn',...Object.fromEntries(PERMISSION_DEMO_EXTRAS.map(a=>[a.employeeId,a.loginEmail]))};
export interface PermissionDemoAccount {id:string;employeeId:string;employeeName:string;loginEmail:string;enabled:boolean;isSystem?:boolean}
export function permissionDemoAccounts(accounts:readonly PermissionDemoAccount[]):PermissionDemoAccount[]{
  return accounts.filter(a=>a.isSystem===true&&a.id==='acct-'+a.employeeId&&emails[a.employeeId]===a.loginEmail.trim().toLowerCase());
}
export function permissionDemoExtraAccounts(existing:readonly {id?:string;employeeId?:string;loginEmail?:string}[]){
  return PERMISSION_DEMO_EXTRAS.filter(seed=>!existing.some(a=>(a.employeeId===seed.employeeId||a.id==='acct-'+seed.employeeId)&&(a.loginEmail??'').trim().toLowerCase()!==seed.loginEmail));
}
