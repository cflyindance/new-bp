export type SummaryView='hours'|'rate'|'amount';
type PaidBreakEmployee={rate?:unknown;segments?:Record<string,any>[]};
export interface PaidBreakGroup {rate:number;hours:number;amount:number}
export interface PaidBreakSummary {groups:PaidBreakGroup[];valid:boolean}
/** Mirrors legacy display precision only; never allocates breaks into CA wage slices. */
export function groupPaidBreaks(employee:PaidBreakEmployee):PaidBreakSummary{
  const groups=new Map<number,PaidBreakGroup>();let valid=true;
  for(const day of employee.segments||[]){
    const text=String(day.paidMealBreak??'').trim();if(!text)continue;
    const hm=text.match(/^(\d+):(\d{2})$/);
    const minutes=hm&&Number(hm[2])<60?Number(hm[1])*60+Number(hm[2]):/^\d+(?:\.\d+)?$/.test(text)?Number(text):NaN;
    if(!Number.isFinite(minutes)||minutes<0){valid=false;continue;}if(!minutes)continue;
    const value=day.rate!=null&&day.rate!==''?day.rate:employee.rate;
    const rate=value!=null&&value!==''?Number(value):NaN;
    if(!Number.isFinite(rate)||rate<0){valid=false;continue;}
    const hours=Math.round(minutes/60*100)/100;
    const group=groups.get(rate)||{rate,hours:0,amount:0};group.hours+=hours;group.amount+=hours*rate;groups.set(rate,group);
  }
  return {groups:[...groups.values()].sort((a,b)=>a.rate-b.rate),valid};
}
export function renderPaidBreakSummary(summary:PaidBreakSummary,view:SummaryView,available=true):string{
  const row=(label:string,value:string)=>`<div class="payroll-sum-row payroll-paid-break-row"><dt>${label}</dt><dd>${value}</dd></div>`;
  if(!summary.valid)return row('Paid Break','—');
  const groups=summary.groups;
  if(!groups.length)return row('Paid Break',view==='hours'?'0.00 h':view==='rate'?'—':'$0.00');
  if(!available)return row('Paid Break',view==='hours'?`${groups.reduce((n,g)=>n+g.hours,0).toFixed(2)} h`:'—');
  return groups.map(g=>row(groups.length>1?`Paid Break · $${g.rate.toFixed(2)}/h`:'Paid Break',view==='hours'?`${g.hours.toFixed(2)} h`:view==='rate'?`$${g.rate.toFixed(2)}/h`:`$${g.amount.toFixed(2)}`)).join('');
}
