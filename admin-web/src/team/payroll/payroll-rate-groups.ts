import type {CaPaySlice} from './payroll-ca-overtime';
export interface PayrollRateGroup {label:string;multiplier:number;rate:number;minutes:number;amount:number;regular:boolean}
/** Presentation-only grouping of already mutually exclusive final pay slices. */
export function groupPayrollRates(slices:CaPaySlice[]):PayrollRateGroup[]{
  const groups=new Map<string,PayrollRateGroup>();
  for(const s of slices){
    if(s.minutes<=0)continue;
    const regular=s.kind==='regular',rate=s.regularRate*s.multiplier;
    const key=[regular,s.multiplier,rate.toFixed(10)].join(':');
    const group=groups.get(key)||{label:regular?'Regular':`OT · ${s.multiplier}×`,multiplier:s.multiplier,rate,minutes:0,amount:0,regular};
    group.minutes+=s.minutes;group.amount+=s.amount;groups.set(key,group);
  }
  const result=[...groups.values()].sort((a,b)=>Number(b.regular)-Number(a.regular)||a.multiplier-b.multiplier||a.rate-b.rate);
  const counts=new Map<string,number>();for(const group of result)counts.set(group.label,(counts.get(group.label)||0)+1);
  for(const group of result)if((counts.get(group.label)||0)>1)group.label+=` · $${group.rate.toFixed(2)}/h`;
  return result;
}
