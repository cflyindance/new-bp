import {validateContinuousRule} from './payroll-overtime-migration';
import type {ContinuousRuleCandidate} from './payroll-overtime-migration';

export interface ContinuousWorkday {date:string;workedMinutes:number;regularRate:number}
export interface ContinuousOvertimeInput {
  rule:ContinuousRuleCandidate;
  periodStart:string;
  periodEnd:string;
  /** Complete consecutive dates, starting with an explicit rest day before the current streak. */
  days:ContinuousWorkday[];
}
export interface ContinuousPaySlice {
  date:string;ruleId:string;streakDay:number;
  dayFromMinute:number;dayToMinute:number;
  streakFromMinute:number;streakToMinute:number;
  minutes:number;multiplier:number;regularRate:number;amount:number;tier:1|2;
}
export type ContinuousOvertimeResult =
  | {status:'ready';slices:ContinuousPaySlice[];totalHours:number;totalAmount:number}
  | {status:'blocked';reason:string;slices:[];totalHours:null;totalAmount:null};
const DAY=86400000;
const number=(s:string)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return NaN;
  const n=Date.parse(s+'T00:00:00Z');
  return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?n:NaN;
};
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const blocked=(reason:string):ContinuousOvertimeResult=>({status:'blocked',reason,slices:[],totalHours:null,totalAmount:null});

/** Enterprise continuous-work candidates, NOT a replacement for any statutory overtime calculation. */
export function calculateContinuousOvertime(input:ContinuousOvertimeInput):ContinuousOvertimeResult {
  const {rule}=input;
  if(rule.scope!=='continuous')return blocked('需要独立的连勤累计规则，不能把法定第7天规则改名套用。');
  const error=validateContinuousRule(rule);if(error)return blocked(error);
  const start=number(input.periodStart),end=number(input.periodEnd);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start>end)return blocked('薪资周期日期无效。');
  const first=rule.hoursBeforeOvertime*60,second=Number(rule.secondaryHoursBeforeOvertime)*60;
  if(!Number.isSafeInteger(first)||!Number.isSafeInteger(second))return blocked('连勤累计门槛需精确到整分钟。');
  const days=input.days.map(d=>({...d})).sort((a,b)=>a.date.localeCompare(b.date));
  if(!days.length||number(days[0].date)>start||days[0].workedMinutes!==0)return blocked('需要从明确休息日开始的完整连勤历史，不能推测连勤起点。');
  if(number(days.at(-1)!.date)<end)return blocked('缺少当前薪资周期结束日考勤，未知日期不能当休息日。');
  let previous:number|undefined,streakDay=0,cumulative=0;
  const slices:ContinuousPaySlice[]=[];
  for(const day of days){
    const date=number(day.date);
    if(!Number.isFinite(date)||previous!==undefined&&date!==previous+DAY)return blocked('连勤历史日期无效、重复或缺失，需提供逐日完整考勤。');
    previous=date;
    if(!Number.isInteger(day.workedMinutes)||day.workedMinutes<0||day.workedMinutes>1440)return blocked('工作分钟数无效。');
    if(day.workedMinutes===0){streakDay=0;cumulative=0;continue;}
    if(!Number.isFinite(day.regularRate)||day.regularRate<=0)return blocked('缺少已核实的计薪时薪。');
    streakDay++;
    const before=cumulative;cumulative+=day.workedMinutes;
    // Earlier days count toward thresholds but never receive retroactive continuous overtime.
    if(streakDay<Number(rule.dayNumber)||date<start||date>end)continue;
    for(const [lower,upper,multiplier] of [[first,second,rule.wageMultiplier],[second,Infinity,Number(rule.secondaryWageMultiplier)]]){
      const from=Math.max(before,lower),to=Math.min(cumulative,upper);
      if(to<=from)continue;
      const minutes=to-from;
      slices.push({date:day.date,ruleId:rule.id,streakDay,tier:lower===first?1:2,dayFromMinute:from-before,dayToMinute:to-before,
        streakFromMinute:from,streakToMinute:to,minutes,multiplier,regularRate:day.regularRate,
        amount:round(minutes/60*day.regularRate*multiplier)});
    }
  }
  return {status:'ready',slices,totalHours:round(slices.reduce((n,s)=>n+s.minutes,0)/60),totalAmount:round(slices.reduce((n,s)=>n+s.amount,0))};
}
