import {createPayrollScheduleDemo} from './payroll-schedule-demo';
import type {CaHourKind,CaOvertimeResult,CaPaySlice} from './payroll-ca-overtime';
import type {PayrollSegment} from './payroll-types';
export const payrollRateScenarios=['multi-different','two-different','two-same','multi-same'] as const;
export type PayrollRateScenario=typeof payrollRateScenarios[number];
/** Precomputed presentation fixtures, not a custom-rule payroll calculation engine. */
export function createPayrollRateDemo(scenario:PayrollRateScenario,store:string){
  if(!payrollRateScenarios.includes(scenario))throw Error('Unknown overtime demo scenario');
  const data=createPayrollScheduleDemo('biweekly',store),period=data.periods.find(p=>p.startDate==='2027-06-20')!;
  const employee=data.employees[period.id][0];
  const sources:{kind:CaHourKind;hours:number;multiplier:number;tier?:1|2}[]=scenario==='multi-different'?
    [{kind:'daily',hours:4,multiplier:1.5},{kind:'daily-double',hours:2,multiplier:1.6},{kind:'weekly',hours:6,multiplier:1.8},{kind:'continuous',hours:3,multiplier:2,tier:1},{kind:'continuous',hours:1,multiplier:2.5,tier:2}]:
    scenario==='two-different'?[{kind:'daily',hours:4,multiplier:1.5},{kind:'weekly',hours:6,multiplier:2}]:
    scenario==='two-same'?[{kind:'daily',hours:4,multiplier:1.5},{kind:'weekly',hours:6,multiplier:1.5}]:
    [{kind:'daily',hours:4,multiplier:1.5},{kind:'daily-double',hours:2,multiplier:1.5},{kind:'weekly',hours:6,multiplier:1.5},{kind:'continuous',hours:3,multiplier:1.5,tier:1},{kind:'continuous',hours:1,multiplier:1.5,tier:2}];
  const slices:CaPaySlice[]=[],segments:PayrollSegment[]=[];
  for(let index=0;index<14;index++){
    const date=new Date(Date.UTC(2027,5,20+index)).toISOString().slice(0,10),regular=index<5?8:0,overtime=sources[index];
    const push=(kind:CaHourKind,hours:number,multiplier:number,from:number,tier?:1|2)=>{
      if(!hours)return;
      slices.push({date,weekStart:'2027-06-20',kind,fromMinute:from*60,toMinute:(from+hours)*60,minutes:hours*60,multiplier,regularRate:20,amount:Math.round(hours*20*multiplier*100)/100,continuousTier:tier,
        evidence:kind==='daily'?'当日累计超过8小时':kind==='daily-double'?'当日累计超过10小时':kind==='weekly'?'周普通工时超过40小时':kind==='continuous'?'连勤累计规则归属（预置展示结果）':'普通工时'});
    };
    push('regular',regular,1,0);if(overtime)push(overtime.kind,overtime.hours,overtime.multiplier,regular,overtime.tier);
    const hours=regular+(overtime?.hours||0),end=360+hours*60+30;
    segments.push({date:`${date.slice(5,7)}/${date.slice(8)}/${date.slice(0,4)}`,role:employee.role,rate:20,reg:regular,ot:overtime&&overtime.multiplier<2?overtime.hours:0,ot2:overtime&&overtime.multiplier>=2?overtime.hours:0,otRate:overtime?20*overtime.multiplier:30,ot2Rate:overtime?20*overtime.multiplier:40,paidMealBreak:'',unpaidMealBreak:hours?'0:30':'',slots:[{in:hours?'06:00':'',out:hours?`${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`:''}]});
  }
  const result:Extract<CaOvertimeResult,{status:'ready'}>={status:'ready',slices,totalHours:slices.reduce((n,s)=>n+s.minutes/60,0),totalAmount:slices.reduce((n,s)=>n+s.amount,0)};
  if(sources.some(s=>s.kind==='continuous'))result.continuousRule={id:'demo-rate-continuous',scope:'continuous',dayNumber:3,hoursBeforeOvertime:40,secondaryHoursBeforeOvertime:50,wageMultiplier:scenario==='multi-same'?1.5:2,secondaryWageMultiplier:scenario==='multi-same'?1.5:2.5};
  // Frozen demo results prevent editing/recalculation; existing demo storage guard blocks persistence.
  return {...data,periods:[period],employees:{[period.id]:[{...employee,confirmed:true,segments,adjustments:{},californiaOvertimeInput:undefined,californiaOvertimeSnapshot:result,ratePresentationDemo:true}]},rateScenario:scenario};
}
