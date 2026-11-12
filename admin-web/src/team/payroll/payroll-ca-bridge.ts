import { calculateCaliforniaOvertime } from './payroll-ca-overtime';
import { createContinuousTooltip } from './payroll-ca-continuous-tooltip';
import {mergeContinuousOvertime} from './payroll-continuous-merge';
import {validateContinuousRule} from './payroll-overtime-migration';
import {calculateContinuousOvertime} from './payroll-continuous-overtime';
import type { CaOvertimeInput, CaOvertimeResult, CaPaySlice, CaHourKind } from './payroll-ca-overtime';

type Employee = { confirmed?: boolean; californiaOvertimeInput?: CaOvertimeInput; californiaOvertimeSnapshot?: CaOvertimeResult; segments?: Record<string, any>[]; [key:string]:any };
const labels:Record<CaHourKind,string>={regular:'Regular',daily:'OT','daily-double':'OT2',weekly:'每周加班','seventh-day':'法定第7天加班',continuous:'连勤加班'};
const money=(n:number)=>n.toFixed(2);
const escape=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function iso(s:unknown):string {const v=String(s??'');const m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`:v;}
function workMinutes(day:Record<string,any>):number|null {
  if(!Array.isArray(day.slots))return null;
  let total=0;let previousEnd=-1;
  for(const slot of day.slots){
    if(!slot.in&&!slot.out)continue;
    const parse=(x:string)=>{const m=String(x).match(/^(\d{1,2}):(\d{2})$/);return m&&+m[1]<24&&+m[2]<60?+m[1]*60 + +m[2]:NaN};
    const from=parse(slot.in),to=parse(slot.out);if(!Number.isFinite(from)||!Number.isFinite(to)||to<from||from<previousEnd)return null;total+=to-from;previousEnd=to;
  }
  const rest=String(day.unpaidMealBreak||'');const m=rest.match(/^(\d+):(\d{2})$/);
  if(rest&&!m&&!/^\d+(?:\.\d+)?$/.test(rest))return null;
  if(m&&+m[2]>=60)return null;
  const unpaid=m?+m[1]*60 + +m[2]:Number(rest||0);
  if(!Number.isInteger(unpaid)||unpaid<0||unpaid>total)return null;
  return total-unpaid;
}
const blocked=(reason:string):CaOvertimeResult=>({status:'blocked',reason,slices:[],totalHours:null,totalAmount:null});
export function assertSupportedLegacyExport(result:CaOvertimeResult|null):void {
  if(result?.status==='blocked')throw new Error(result.reason);
  if(result?.status==='ready'&&result.slices.some(s=>![1,1.5,2].includes(s.multiplier)))throw new Error('当前报表格式尚不支持连勤自定义倍率，已阻止导出，避免工时或金额缺失。');
}
export function resolveCaliforniaPayroll(employee:Employee,period?:Record<string,any>):CaOvertimeResult|null {
  if(employee.confirmed)return employee.californiaOvertimeSnapshot??null;
  if(!employee.californiaOvertimeInput)return null;
  const input=structuredClone(employee.californiaOvertimeInput);
  if(['incentive','svcw','breakfast','lunch','dinner','sickHours'].some(k=>Number(employee.adjustments?.[k]))||String(employee.adjustments?.exempt||'').trim())return blocked('存在额外收入或豁免信息，需由薪资数据源先完成资格与regular rate核对，不能套用单一基础时薪。');
  const range=String(period?.rangeLabel||'').split(/\s+[–-]\s+/);
  const start=iso(period?.startDate||range[0]),end=iso(period?.endDate||range[1]);
  if(start&&start!==input.periodStart||end&&end!==input.periodEnd)return blocked('加州核算上下文与当前薪资周期不一致，请重新获取。');
  const byDate=new Map(input.days.map(d=>[d.date,d]));
  const currentDates=new Set((employee.segments||[]).map(d=>iso(d.date)));
  if(currentDates.size!==(employee.segments||[]).length)return blocked('当前考勤存在重复工作日，需要先合并。');
  if(input.days.some(d=>d.date>=input.periodStart&&d.date<=input.periodEnd&&!currentDates.has(d.date)))return blocked('当前周期有缺失考勤行，需重新获取完整记录。');
  for(const day of employee.segments||[]){
    const date=iso(day.date),context=byDate.get(date);
    if(!context)return blocked('缺少当前工作日的核算上下文。');
    // Paid rest timing and bonus/multi-rate reconciliation need an upstream verified allocation.
    if(day.paidMealBreak&&String(day.paidMealBreak)!=='0'&&String(day.paidMealBreak)!=='0:00')return blocked('带薪休息需由薪资数据源提供完整工时分配，不能重复计入。');
    const base=Number(day.rate??employee.rate);
    if(context.workedMinutes>0&&base!==context.regularRate)return blocked('基础时薪与核实regular rate不同，需要薪资数据源先完成收入基数核对。');
    const current=workMinutes(day);if(current===null)return blocked('考勤时间不完整或跨工作日未拆分，请先核对。');
    context.workedMinutes=current;
  }
  return mergeContinuousOvertime(calculateCaliforniaOvertime(input),input);
}
export function applyCaliforniaPayroll(employee:Employee,period?:Record<string,any>):CaOvertimeResult|null {
  const result=resolveCaliforniaPayroll(employee,period);
  if(employee.confirmed||!result||result.status!=='ready')return result;
  for(const day of employee.segments||[]){
    const rows=result.slices.filter(s=>s.date===iso(day.date));
    day.reg=rows.filter(s=>s.multiplier===1).reduce((n,s)=>n+s.minutes,0)/60;
    day.ot=rows.filter(s=>s.multiplier>1&&s.multiplier<2).reduce((n,s)=>n+s.minutes,0)/60;
    day.ot2=rows.filter(s=>s.multiplier>=2).reduce((n,s)=>n+s.minutes,0)/60;
    const rate=rows[0]?.regularRate;
    if(rate){day.otRate=rate*1.5;day.ot2Rate=rate*2;}
  }
  return result;
}
export function availableContinuousRules(){
  try{const config=JSON.parse(localStorage.getItem('bplant-team-breaks-overtime-v1')||'{}');return (Array.isArray(config.overtimeRules)?config.overtimeRules:[]).filter((r:any)=>r.scope==='continuous'&&!validateContinuousRule(r));}catch{return [];}
}
export function buildCaliforniaPayrollInput(employee:Employee,period:Record<string,any>,history:Employee[],regularRate:number,reviewed:boolean,continuousRuleId?:string):CaOvertimeInput {
  if(employee.confirmed)throw new Error('已确认工资不允许自动切换核算规则。');
  if(!reviewed||!Number.isFinite(regularRate)||regularRate<=0)throw new Error('请核实标准非豁免资格、固定工作日边界及regular rate后确认。');
  const dates=new Map<string,{date:string;workedMinutes:number;regularRate:number}>();
  for(const record of [...history.filter(e=>e.id===employee.id&&e.store===employee.store),employee]){
    for(const day of record.segments||[]){
      const minutes=workMinutes(day);if(minutes===null)throw new Error('考勤未按固定工作日拆分或缺少上下班时间。');
      const date=iso(day.date);dates.set(date,{date,workedMinutes:minutes,regularRate});
    }
  }
  let weekStart=1;
  try{const settings=JSON.parse(localStorage.getItem('bplant-team-breaks-overtime-v1')||'{}');if(Number.isInteger(settings.workWeekStartDay))weekStart=settings.workWeekStartDay}catch{/* engine validates the boundary */}
  const range=String(period.rangeLabel||'').split(/\s+[–-]\s+/);
  const input:CaOvertimeInput={jurisdiction:'US-CA',eligibility:'standard-nonexempt',workWeekStartDay:weekStart,workdayBoundaryVerified:true,periodStart:iso(period.startDate||range[0]),periodEnd:iso(period.endDate||range[1]),days:[...dates.values()]};
  const previous=employee.californiaOvertimeInput?.continuous;
  const id=continuousRuleId===undefined?previous?.rule.id:continuousRuleId;
  if(id){
    const rule=previous?.rule.id===id?previous.rule:availableContinuousRules().find((r:any)=>r.id===id);
    if(!rule)throw new Error('所选连勤规则不存在或配置不完整，请先在休息与加班中配置。');
    const sorted=[...dates.values()].sort((a,b)=>a.date.localeCompare(b.date));
    const boundary=sorted.map(d=>d.date<=input.periodStart&&d.workedMinutes===0).lastIndexOf(true);
    if(boundary<0)throw new Error('缺少连勤开始前的明确休息日记录，请先获取完整历史考勤。');
    input.continuous={rule:structuredClone(rule),history:sorted.slice(boundary)};
    const check=calculateContinuousOvertime({rule:input.continuous.rule,days:input.continuous.history,periodStart:input.periodStart,periodEnd:input.periodEnd});
    if(check.status==='blocked')throw new Error(check.reason);
  }
  return input;
}
function sum(rows:CaPaySlice[],cash:boolean){return rows.reduce((n,s)=>n+(cash?s.amount:s.minutes/60),0);}
export function renderCaliforniaSummary(result:Extract<CaOvertimeResult,{status:'ready'}>,cash:boolean):string {
  const row=(name:string,value:number,help=false)=>`<div class="payroll-sum-row"><dt>${escape(name)}${help?'<button type="button" class="payroll-ca-continuous-help" data-ca-continuous-help aria-label="查看连勤加班倍率拆分" aria-describedby="payroll-ca-continuous-tooltip"><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 6v1" stroke-width="1.5"/></svg></button>':''}</dt><dd>${cash?'$':''}${money(value)}${cash?'':' h'}</dd></div>`;
  return (['regular','daily','daily-double','weekly','seventh-day','continuous'] as CaHourKind[]).filter(kind=>kind==='continuous'?!!result.continuousRule:kind!=='seventh-day'||result.slices.some(s=>s.kind===kind)).map(kind=>{
    const rows=result.slices.filter(s=>s.kind===kind);
    const name=kind==='continuous'&&result.continuousRule?`连勤加班 · ${result.continuousRule.dayNumber}天`:labels[kind];
    return row(name,sum(rows,cash),kind==='continuous');
  }).join('')+`<div class="payroll-sum-row"><dt>合计</dt><dd>${cash?'$':''}${money(cash?result.totalAmount:result.totalHours)}${cash?'':' h'}</dd></div>`;
}
export function renderCaliforniaDayBreakdown(rows:CaPaySlice[]):string {
  if(!rows.some(s=>s.kind!=='regular'))return '';
  return `<details class="payroll-ca-day-details"><summary>计薪明细 · ${escape(rows[0].date)}</summary><ul>${rows.map(s=>`<li><strong>${escape(labels[s.kind])}</strong><span class="payroll-ca-interval">当日累计 ${money(s.fromMinute/60)}–${money(s.toMinute/60)} h</span><span class="payroll-ca-formula">${money(s.minutes/60)} h × $${money(s.regularRate)} × ${s.multiplier} = $${money(s.amount)}</span><span class="payroll-ca-evidence">${escape(s.evidence)}</span></li>`).join('')}</ul><p>当日合计 ${money(sum(rows,false))} h · $${money(sum(rows,true))}</p></details>`;
}
export function californiaPayrollStatusMessage(employee:Employee,result:CaOvertimeResult|null):string {
  if(result?.status==='blocked')return result.reason;
  if(result?.status==='ready')return '';
  return employee.confirmed ? '当前为已确认的历史薪资结果，未启用加州加班核算。' : '未启用加州加班核算，可在“更多 → 编辑”中设置。';
}
export function createCaliforniaPayrollBridge(root:ShadowRoot){
  root.host.setAttribute('data-payroll-ca-version','20261111');
  let current:CaOvertimeResult|null=null;
  const tooltip=createContinuousTooltip(root,()=>current);
  return {
    buildInput:buildCaliforniaPayrollInput,
    continuousRules:availableContinuousRules,
    assertLegacyExport(employee:Employee,period:Record<string,any>){assertSupportedLegacyExport(resolveCaliforniaPayroll(employee,period));},
    apply:applyCaliforniaPayroll,
    resolve:resolveCaliforniaPayroll,
    amounts(employee:Employee,date?:string){
      const result=resolveCaliforniaPayroll(employee);
      if(result?.status!=='ready')return null;
      const rows=date?result.slices.filter(s=>s.date===iso(date)):result.slices;
      const regAmt=sum(rows.filter(s=>s.multiplier===1),true);
      const otAmt=sum(rows.filter(s=>s.multiplier>1&&s.multiplier<2),true);
      const ot2Amt=sum(rows.filter(s=>s.multiplier>=2),true);
      return {regAmt,paidBreakAmt:0,otAmt,ot2Amt,totalAmt:sum(rows,true)};
    },
    freeze(employee:Employee,period:Record<string,any>){const result=resolveCaliforniaPayroll(employee,period);if(result?.status==='ready')employee.californiaOvertimeSnapshot=structuredClone(result);},
    render(employee:Employee,period:Record<string,any>){
      tooltip.close();
      current=resolveCaliforniaPayroll(employee,period);
      const cards=root.querySelectorAll<HTMLElement>('.payroll-sum-dl');
      let status=root.querySelector<HTMLElement>('[data-ca-overtime-status]');
      if(!status){status=document.createElement('p');status.dataset.caOvertimeStatus='';status.setAttribute('role','status');root.querySelector('.payroll-period-summary')?.prepend(status)}
      status.textContent=californiaPayrollStatusMessage(employee,current);status.hidden=!status.textContent;
      status.dataset.caOvertimeState=current?.status||'not-enabled';
      cards.forEach((card,i)=>{
        let display=card.parentElement?.querySelector<HTMLElement>('[data-ca-summary]');
        card.hidden=current?.status==='ready';card.style.display=card.hidden?'none':'';
        if(current?.status==='ready'){
          if(!display){display=document.createElement('dl');display.dataset.caSummary='';display.className='payroll-ca-summary';card.after(display)}
          display.innerHTML=renderCaliforniaSummary(current as Extract<CaOvertimeResult,{status:'ready'}>,i!==0);
        }else display?.remove();
      });
      root.querySelectorAll('[data-ca-day-detail-row]').forEach(row=>row.remove());
      root.querySelectorAll<HTMLElement>('[data-ca-day-kind]').forEach(cell=>{
        if(current?.status!=='ready'){cell.textContent='—';return;}
        const rows=current.slices.filter(s=>s.date===iso(cell.dataset.caDayDate));
        const kind=cell.dataset.caDayKind;
        cell.textContent=money(sum(kind==='total'||kind==='amount'?rows:rows.filter(s=>s.kind===kind),kind==='amount'));
        if(kind==='amount'){
          const html=renderCaliforniaDayBreakdown(rows),primary=cell.closest('tr');
          if(!html||!primary) return;
          const siblings=Array.from(primary.parentElement!.querySelectorAll<HTMLTableRowElement>('tr[data-day-index]')).filter(row=>row.dataset.dayIndex===primary.dataset.dayIndex);
          const detail=document.createElement('tr');detail.dataset.caDayDetailRow=cell.dataset.caDayDate;
          const content=document.createElement('td');content.colSpan=Array.from(primary.cells).reduce((n,td)=>n+td.colSpan,0);
          content.innerHTML=html;detail.append(content);(siblings.at(-1)||primary).after(detail);
        }
      });
      if(employee.californiaOvertimeInput||employee.californiaOvertimeSnapshot)root.querySelectorAll<HTMLElement>('.payroll-seg-week-block').forEach(block=>{
        const summary=block.querySelector<HTMLElement>('.payroll-seg-week-summary');if(!summary)return;
        if(current?.status!=='ready'){summary.textContent='等待完整核算';return;}
        const dates=new Set(Array.from(block.querySelectorAll<HTMLInputElement>('[data-field="date"]')).map(e=>iso(e.value)));
        const rows=current.slices.filter(s=>dates.has(s.date));
        summary.innerHTML=`<span>工作总时长：<strong>${money(sum(rows,false))}</strong></span>`+
          (Object.keys(labels) as CaHourKind[]).map(kind=>`<span>${labels[kind]}：<strong>${money(sum(rows.filter(s=>s.kind===kind),false))}</strong></span>`).join('');
      });
      return current;
    },
    destroy(){tooltip.destroy();root.host.removeAttribute('data-payroll-ca-version');},
  };
}
