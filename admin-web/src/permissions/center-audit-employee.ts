import type { Audit, CenterState } from './center-domain';

/** Resolve only the directly changed employee, never current role members. */
export function auditEmployeeName(log:Audit,state:Pick<CenterState,'employees'|'roles'>):string {
  const parse=(raw:string):Record<string,unknown>=>{
    try {const value:unknown=JSON.parse(raw);return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};}catch{return {};}
  };
  const after=parse(log.after),before=parse(log.before),snapshots=[after,before];
  if(snapshots.some(s=>'grants' in s)||state.roles.some(r=>r.id===log.objectId))return '—';
  const current=state.employees.find(e=>e.id===log.objectId);
  const isEmployee=!!current||snapshots.some(s=>'bindings' in s||'email' in s||'status' in s||'overrides' in s);
  if(!isEmployee)return '—';
  for(const snapshot of snapshots)if(typeof snapshot.name==='string'&&snapshot.name.trim())return snapshot.name;
  return current?.name?.trim()?current.name:`名称不可用（${log.objectId}）`;
}
