import {calculateContinuousOvertime} from './payroll-continuous-overtime';
import type {CaOvertimeInput,CaOvertimeResult,CaPaySlice} from './payroll-ca-overtime';
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
/** Reclassify mutually exclusive minute intervals; never add full candidate wages twice. */
export function mergeContinuousOvertime(base:CaOvertimeResult,input:CaOvertimeInput):CaOvertimeResult {
  if(base.status!=='ready'||!input.continuous)return base;
  const {rule,history}=input.continuous;
  const current=new Map(input.days.map(d=>[d.date,d]));
  const candidate=calculateContinuousOvertime({rule,periodStart:input.periodStart,periodEnd:input.periodEnd,days:history.map(d=>current.get(d.date)||d)});
  if(candidate.status==='blocked')return candidate;
  const slices:CaPaySlice[]=[];
  for(const original of base.slices){
    const overlaps=candidate.slices.filter(s=>s.date===original.date&&s.dayFromMinute<original.toMinute&&s.dayToMinute>original.fromMinute&&s.multiplier>original.multiplier);
    const cuts=[...new Set([original.fromMinute,original.toMinute,...overlaps.flatMap(s=>[Math.max(original.fromMinute,s.dayFromMinute),Math.min(original.toMinute,s.dayToMinute)])])].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const from=cuts[i],to=cuts[i+1],winner=overlaps.find(s=>s.dayFromMinute<=from&&s.dayToMinute>=to&&s.multiplier>original.multiplier);
      if(winner&&winner.regularRate!==original.regularRate)return {status:'blocked',reason:'连勤与原规则计薪基数不一致，请先核实。',slices:[],totalHours:null,totalAmount:null};
      const multiplier=winner?.multiplier??original.multiplier;
      slices.push({...original,fromMinute:from,toMinute:to,minutes:to-from,multiplier,kind:winner?'continuous':original.kind,continuousTier:winner?.tier,
        amount:round((to-from)/60*original.regularRate*multiplier),
        evidence:winner?`连勤满${rule.dayNumber}天，第${winner.streakDay}天新增工时；累计${((winner.streakFromMinute+from-winner.dayFromMinute)/60).toFixed(2)}–${((winner.streakFromMinute+to-winner.dayFromMinute)/60).toFixed(2)}小时，${multiplier}倍；同分钟取最高倍率。`:original.evidence});
    }
  }
  return {status:'ready',slices,continuousRule:structuredClone(rule),totalHours:round(slices.reduce((n,s)=>n+s.minutes,0)/60),totalAmount:round(slices.reduce((n,s)=>n+s.amount,0))};
}
