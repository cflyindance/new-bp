export type AuditType='m'|'provider';
export interface AuditRecord {id:string;at:string;actor:string;action:string;object:string;before:string;after:string;type:AuditType}
export function allowedAuditTypes(m:boolean,provider:boolean):AuditType[]{return [...(m?['m' as const]:[]),...(provider?['provider' as const]:[])];}
export function auditMatchesRole(log:AuditRecord,id:string,name?:string):boolean {
  if(!id)return true;
  try {
    const before=JSON.parse(log.before),after=JSON.parse(log.after);
    const role=(value:any)=>Array.isArray(value?.roles)?value.roles.find((r:any)=>r.id===id):value?.id===id?value:undefined;
    if(JSON.stringify(role(before))!==JSON.stringify(role(after)))return true;
    const bindings=(value:any)=>(value?.employees??[]).filter((e:any)=>e.roleIds?.includes(id)||e.bindings?.some((b:any)=>b.roleId===id)).map((e:any)=>({id:e.id??e.employeeId,roleIds:e.roleIds?.filter((r:string)=>r===id),bindings:e.bindings?.filter((b:any)=>b.roleId===id)}));
    if(JSON.stringify(bindings(before))!==JSON.stringify(bindings(after)))return true;
  }catch{/* Older summary-only records can still match the exact role name. */}
  return !!name&&log.object===name;
}
export function filterAuditRecords(records:AuditRecord[],allowed:AuditType[],type:string,roleId='',name?:string):AuditRecord[]{
 return records.filter(log=>allowed.includes(log.type)&&(type==='all'||log.type===type)&&auditMatchesRole(log,roleId,name)).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
}
