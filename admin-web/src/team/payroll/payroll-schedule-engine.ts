import {addCalendarDays,daysBetween,monthDay,parseIsoDate} from './payroll-local-date';
import type {PayrollScheduleRule,PlannedPayDatePolicy,ScheduledPeriod} from './payroll-schedule-types';
const integer=(n:number,min:number,max:number)=>{if(!Number.isInteger(n)||n<min||n>max)throw new Error(`值须为 ${min}–${max} 的整数`);};
export function validateNewScheduleRule(rule:PayrollScheduleRule):void {
  if(!rule.storeId.trim()||!rule.id.trim())throw new Error('请选择门店');
  if(!rule.plannedPayDatePolicy)throw new Error('请配置计划发薪日');
  try {new Intl.DateTimeFormat('en',{timeZone:rule.timezone});}catch{throw new Error('无效门店时区');}
  generatePeriods(rule,rule.effectiveFrom,rule.effectiveFrom);
}
export function calculatePlannedPayDate(end:string,policy:PlannedPayDatePolicy):string {
  const d=parseIsoDate(end);
  switch(policy.kind){
    case 'daysAfterEnd': integer(policy.days,1,366);return addCalendarDays(end,policy.days);
    case 'weekdayAfterEnd': integer(policy.weekday,0,6);return addCalendarDays(end,(policy.weekday-d.getUTCDay()+7)%7||7);
    case 'monthlyFixed': integer(policy.nextMonthDay,1,31);return monthDay(end,1,policy.nextMonthDay);
    case 'semiMonthlyFixed':
      integer(policy.firstHalfDay,16,31);integer(policy.secondHalfNextMonthDay,1,31);
      return d.getUTCDate()<=15?monthDay(end,0,policy.firstHalfDay):monthDay(end,1,policy.secondHalfNextMonthDay);
    default: throw new Error('不支持的计划发薪日');
  }
}
export function generatePeriods(rule:PayrollScheduleRule,from:string,through:string):ScheduledPeriod[]{
  parseIsoDate(from);parseIsoDate(through);parseIsoDate(rule.effectiveFrom);
  const anchor=rule.anchorDate||rule.effectiveFrom;parseIsoDate(anchor);
  if(!['weekly','biweekly','semimonthly','monthly','custom'].includes(rule.frequency))throw new Error('不支持的周期');
  if(rule.frequency==='custom')integer(rule.customDays!,1,31);
  if(rule.plannedPayDatePolicy?.kind==='semiMonthlyFixed'&&rule.frequency!=='semimonthly')throw new Error('半月发薪日仅适用于半月周期');
  if(rule.plannedPayDatePolicy?.kind==='monthlyFixed'&&rule.frequency!=='monthly')throw new Error('每月发薪日仅适用于月周期');
  if(rule.plannedPayDatePolicy?.kind==='weekdayAfterEnd'&&['monthly','semimonthly'].includes(rule.frequency))throw new Error('指定星期仅适用于单周、双周和自定义周期');
  const result:ScheduledPeriod[]=[];
  for(let cursor=from<rule.effectiveFrom?rule.effectiveFrom:from;cursor<=through;){
    let end:string;
    if(rule.frequency==='monthly')end=monthDay(cursor,0,31);
    else if(rule.frequency==='semimonthly')end=monthDay(cursor,0,parseIsoDate(cursor).getUTCDate()<=15?15:31);
    else{
      const length=rule.frequency==='weekly'?7:rule.frequency==='biweekly'?14:rule.customDays!;
      const phase=((daysBetween(anchor,cursor)%length)+length)%length;
      end=addCalendarDays(cursor,length-phase-1);
    }
    result.push({storeId:rule.storeId,ruleVersionId:rule.id,startDate:cursor,endDate:end,status:'draft',
      plannedPayDate:rule.plannedPayDatePolicy?calculatePlannedPayDate(end,rule.plannedPayDatePolicy):undefined});
    cursor=addCalendarDays(end,1);
  }
  return result;
}
export function numberPeriods(periods:ScheduledPeriod[],previous:Array<{periodYear?:number;periodNumber?:number}>):ScheduledPeriod[]{
  const maximum=new Map<number,number>();
  for(const p of previous)if(p.periodYear&&p.periodNumber)maximum.set(p.periodYear,Math.max(maximum.get(p.periodYear)||0,p.periodNumber));
  return [...periods].sort((a,b)=>a.endDate.localeCompare(b.endDate)||a.startDate.localeCompare(b.startDate)).map(p=>{
    const year=Number(p.endDate.slice(0,4)),number=(maximum.get(year)||0)+1;maximum.set(year,number);
    return {...p,periodYear:year,periodNumber:number,numberingBasis:'period-end'};
  });
}
