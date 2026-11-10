/** Business evidence, independent of service/menu access and manual store lifecycle. */
export type StoreManualStatus = 'preparing'|'open'|'closed'|'terminated'|'archived';
export type StoreBusinessStatus = StoreManualStatus|'no-records'|'unknown';
export const storeBusinessLabels: Record<StoreBusinessStatus,string> = {
  preparing:'筹备中',open:'正常营业',closed:'暂停经营',terminated:'已关闭',archived:'已归档',
  'no-records':'近30天无营业记录',unknown:'营业情况未知',
};
export interface BusinessDayFacts {
  date:string; salesAmount:number; tipAmount:number;
  punchRecords: {source:string;status:string;hours:number}[];
  /** All three sources synced completely through updatedAt for this day. */
  complete:boolean;
}
export interface StoreBusinessFacts {
  storeId:string;timezone:string;updatedAt:string;source:'demo'|'integrated';days:BusinessDayFacts[];
}
export function localBusinessDate(now:Date,timezone:string):string {
  const p=new Intl.DateTimeFormat('en-US',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return `${p.find(x=>x.type==='year')!.value}-${p.find(x=>x.type==='month')!.value}-${p.find(x=>x.type==='day')!.value}`;
}
export function shiftBusinessDate(date:string,n:number):string {
  const d=new Date(date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('营业日期无效');
  d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);
}
export interface StoreBusinessResult {status:StoreBusinessStatus;label:string;start?:string;end?:string;source?:'demo'|'integrated';updatedAt?:string;}
export function resolveStoreBusinessStatus(store:{storeId:string;status:StoreManualStatus},timezone:string,facts:StoreBusinessFacts|undefined,now=new Date()):StoreBusinessResult {
  const result=(status:StoreBusinessStatus,period:Partial<StoreBusinessResult>={}):StoreBusinessResult=>({status,label:storeBusinessLabels[status],...period});
  if(store.status!=='open')return result(store.status);
  let end:string,start:string;
  try{end=localBusinessDate(now,timezone);start=shiftBusinessDate(end,-29);}catch{return result('unknown');}
  const period={start,end};
  if(!facts||facts.storeId!==store.storeId||facts.timezone!==timezone||!Array.isArray(facts.days)||!['demo','integrated'].includes(facts.source))return result('unknown',period);
  const at=new Date(facts.updatedAt);
  if(!Number.isFinite(at.getTime())||at>now)return result('unknown',period);
  const synced=localBusinessDate(at,timezone),meta={...period,source:facts.source,updatedAt:facts.updatedAt};
  const rows=facts.days.filter(d=>d&&typeof d.date==='string'&&d.date>=start&&d.date<=end&&d.date<=synced);
  const amount=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  const validPunch=(p:BusinessDayFacts['punchRecords'][number])=>p&&typeof p.source==='string'&&!!p.source&&typeof p.status==='string'&&amount(p.hours);
  const dates=new Map<string,BusinessDayFacts>();
  let complete=synced===end;
  for(const d of rows){
    try{shiftBusinessDate(d.date,0);}catch{complete=false;continue;}
    if(amount(d.salesAmount)&&d.salesAmount>0||amount(d.tipAmount)&&d.tipAmount>0||Array.isArray(d.punchRecords)&&d.punchRecords.some(p=>validPunch(p)&&p.source!=='manual'&&p.status==='complete'&&p.hours>0))return result('open',meta);
    if(dates.has(d.date)||d.complete!==true||!amount(d.salesAmount)||!amount(d.tipAmount)||!Array.isArray(d.punchRecords)||!d.punchRecords.every(validPunch))complete=false;
    dates.set(d.date,d);
  }
  return result(complete&&dates.size===30?'no-records':'unknown',meta);
}
