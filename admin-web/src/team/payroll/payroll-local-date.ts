export function parseIsoDate(value:string):Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日期格式必须为 YYYY-MM-DD');
  const date=new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==value) throw new Error('无效日期');
  return date;
}
export function addCalendarDays(value:string,days:number):string {
  if (!Number.isInteger(days)) throw new Error('天数必须为整数');
  const d=parseIsoDate(value); d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
export function daysBetween(from:string,to:string):number {return Math.round((parseIsoDate(to).getTime()-parseIsoDate(from).getTime())/86400000);}
export function compareIsoDate(a:string,b:string):number {parseIsoDate(a);parseIsoDate(b);return a.localeCompare(b);}
export function monthDay(value:string,offset:number,day:number):string {
  const d=parseIsoDate(value);
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+offset+1,0,12));
  last.setUTCDate(Math.min(day,last.getUTCDate()));return last.toISOString().slice(0,10);
}
