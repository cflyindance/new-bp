import type {PayrollData,PayrollPeriod} from './payroll-types';
import {parseIsoDate} from './payroll-local-date';
export interface ScheduleLock {periodId:string;reason:string;}
const lockedStatuses=new Set(['confirmed','partial_confirmed','partially_confirmed','exported','paid','locked']);
/** Input store membership must be resolved by ID before invoking this guard. */
export function findScheduleLocks(data:PayrollData,storeId:string,effectiveFrom:string,employeeIds:ReadonlySet<string>):ScheduleLock[]{
  parseIsoDate(effectiveFrom);
  return data.periods.flatMap((period:PayrollPeriod)=>{
    if(period.storeId&&period.storeId!==storeId)return [];
    const employees=(data.employees[period.id]||[]).filter(e=>employeeIds.has(e.id));
    if(!employees.length&&period.storeId!==storeId)return [];
    // Unknown dates cannot safely be excluded from a rule change.
    if(typeof period.endDate!=='string')return [{periodId:period.id,reason:'期次缺少明确结束日期，需先完成迁移'}];
    try{parseIsoDate(period.endDate);}catch{return [{periodId:period.id,reason:'历史日期无效，需人工核对'}];}
    if(period.endDate<effectiveFrom)return [];
    if(lockedStatuses.has(String(period.status))||period.exportedAt||period.actualPayDate||period.exportBatchId)
      return [{periodId:period.id,reason:'期次已确认、正式导出或记录实际发薪，不可重新分期'}];
    if(employees.some(e=>e.confirmed||e.confirmedAt||e.exportedAt||e.actualPayDate))
      return [{periodId:period.id,reason:'已有员工确认或正式导出，不可重新分期'}];
    return [];
  });
}
