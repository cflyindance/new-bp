import {addCalendarDays,parseIsoDate} from './payroll-local-date';
import {validateNewScheduleRule} from './payroll-schedule-engine';
import type {PayrollScheduleRule} from './payroll-schedule-types';
export interface ScheduleHistoryRow {rule:PayrollScheduleRule;endDate?:string;status:'pending'|'active'|'expired';}
/** Derive lifecycle from store-local dates. Never use a cached status to grant editing. */
export function scheduleHistory(rules:PayrollScheduleRule[],storeId:string,today:string):ScheduleHistoryRow[]{
  parseIsoDate(today);
  const list=rules.filter(r=>r.storeId===storeId&&r.status!=='withdrawn').sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom));
  return list.map((rule,i)=>{
    const endDate=list[i+1]?addCalendarDays(list[i+1].effectiveFrom,-1):undefined;
    return {rule:structuredClone(rule),endDate,status:rule.effectiveFrom>today?'pending':endDate&&endDate<today?'expired':'active'};
  });
}
/** Pure pending-version editing; the repository must additionally enforce revision and lock checks. */
export function editPendingRule(rules:PayrollScheduleRule[],next:PayrollScheduleRule,today:string,usedRuleIds:string[]):PayrollScheduleRule[]{
  const previous=rules.find(r=>r.id===next.id);
  if(!previous)throw new Error('规则不存在');
  const row=scheduleHistory(rules,previous.storeId,today).find(r=>r.rule.id===previous.id);
  if(row?.status!=='pending'||usedRuleIds.includes(next.id))throw new Error('规则已生效或已被使用，只能查看');
  if(next.storeId!==previous.storeId||next.version!==previous.version)throw new Error('编辑时不可变更门店或版本');
  validateNewScheduleRule(next);
  if(next.effectiveFrom<=today)throw new Error('待生效规则须使用未来日期');
  if(rules.some(r=>r.id!==next.id&&r.status!=='withdrawn'&&r.storeId===next.storeId&&r.effectiveFrom===next.effectiveFrom))throw new Error('该门店已有同日生效规则');
  return rules.map(r=>structuredClone(r.id===next.id?{...next,status:'pending' as const}:r));
}
export function withdrawPendingRule(rules:PayrollScheduleRule[],id:string,today:string,usedRuleIds:string[]):PayrollScheduleRule[]{
  const rule=rules.find(r=>r.id===id);
  if(!rule||scheduleHistory(rules,rule.storeId,today).find(r=>r.rule.id===id)?.status!=='pending'||usedRuleIds.includes(id))throw new Error('仅未使用的待生效规则可删除');
  return rules.map(r=>structuredClone(r.id===id?{...r,status:'withdrawn' as const}:r));
}
