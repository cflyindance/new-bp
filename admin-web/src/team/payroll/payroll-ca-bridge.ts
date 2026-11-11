import { calculateCaliforniaOvertime } from './payroll-ca-overtime';
import type { CaOvertimeInput, CaOvertimeResult, CaPaySlice, CaHourKind } from './payroll-ca-overtime';

type Employee = { confirmed?: boolean; californiaOvertimeInput?: CaOvertimeInput; californiaOvertimeSnapshot?: CaOvertimeResult; segments?: Record<string, any>[]; [key:string]:any };
const labels:Record<CaHourKind,string>={regular:'Regular',daily:'OT','daily-double':'OT2',weekly:'每周加班','seventh-day':'第7天加班'};
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
  return calculateCaliforniaOvertime(input);
}
export function applyCaliforniaPayroll(employee:Employee,period?:Record<string,any>):CaOvertimeResult|null {
  const result=resolveCaliforniaPayroll(employee,period);
  if(employee.confirmed||!result||result.status!=='ready')return result;
  for(const day of employee.segments||[]){
    const rows=result.slices.filter(s=>s.date===iso(day.date));
    day.reg=rows.filter(s=>s.multiplier===1).reduce((n,s)=>n+s.minutes,0)/60;
    day.ot=rows.filter(s=>s.multiplier===1.5).reduce((n,s)=>n+s.minutes,0)/60;
    day.ot2=rows.filter(s=>s.multiplier===2).reduce((n,s)=>n+s.minutes,0)/60;
    const rate=rows[0]?.regularRate;
    if(rate){day.otRate=rate*1.5;day.ot2Rate=rate*2;}
  }
  return result;
}
export function buildCaliforniaPayrollInput(employee:Employee,period:Record<string,any>,history:Employee[],regularRate:number,reviewed:boolean):CaOvertimeInput {
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
  return {jurisdiction:'US-CA',eligibility:'standard-nonexempt',workWeekStartDay:weekStart,workdayBoundaryVerified:true,periodStart:iso(period.startDate||range[0]),periodEnd:iso(period.endDate||range[1]),days:[...dates.values()]};
}
function sum(rows:CaPaySlice[],cash:boolean){return rows.reduce((n,s)=>n+(cash?s.amount:s.minutes/60),0);}
export function renderCaliforniaSummary(result:Extract<CaOvertimeResult,{status:'ready'}>,cash:boolean):string {
  const row=(name:string,value:number,kind?:CaHourKind)=>`<div class="payroll-sum-row"><dt>${kind?`<button type="button" class="payroll-overtime-link" data-ca-overtime="${kind}">${escape(name)}</button>`:escape(name)}</dt><dd>${cash?'$':''}${money(value)}${cash?'':' h'}</dd></div>`;
  return (['regular','daily','daily-double','weekly','seventh-day'] as CaHourKind[]).map(kind=>{
    const rows=result.slices.filter(s=>s.kind===kind);
    return row(labels[kind],sum(rows,cash),kind)+(kind==='seventh-day'?[1.5,2].map(m=>row(m===1.5?'前8小时 · 1.5倍':'超8小时 · 2倍',sum(rows.filter(s=>s.multiplier===m),cash))).join(''):'');
  }).join('')+`<div class="payroll-sum-row"><dt>合计</dt><dd>${cash?'$':''}${money(cash?result.totalAmount:result.totalHours)}${cash?'':' h'}</dd></div>`;
}
export function createCaliforniaPayrollBridge(root:ShadowRoot){
  root.host.setAttribute('data-payroll-ca-version','20261111');
  const events=new AbortController();
  let current:CaOvertimeResult|null=null;
  let currentName='';let activeKind:CaHourKind='daily';let trigger:HTMLElement|null=null;
  const dialog=document.createElement('dialog');dialog.className='payroll-overtime-dialog';dialog.setAttribute('aria-label','加班明细');root.append(dialog);
  const close=()=>{dialog.close();trigger?.focus()};
  window.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||!dialog.open)return;
    e.preventDefault();e.stopImmediatePropagation();close();
  },{capture:true,signal:events.signal});
  dialog.addEventListener('click',e=>{if(e.target===dialog||((e.target as HTMLElement).closest('[data-ca-close]')))close()});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  function draw(){
    if(!current||current.status!=='ready')return;
    const date=dialog.querySelector<HTMLSelectElement>('[data-ca-date]')?.value||'all';
    const rate=dialog.querySelector<HTMLSelectElement>('[data-ca-rate]')?.value||'all';
    const dates=[...new Set(current.slices.filter(s=>s.kind===activeKind).map(s=>s.date))];
    const rows=current.slices.filter(s=>s.kind===activeKind&&(date==='all'||s.date===date)&&(rate==='all'||s.multiplier===Number(rate)));
    dialog.innerHTML=`<header><button type="button" data-ca-close aria-label="关闭加班明细">×</button><h2>加班明细 · ${labels[activeKind]}</h2></header><p>${escape(currentName)}</p><div class="payroll-overtime-filters"><label>日期<select data-ca-date><option value="all">全部日期</option>${dates.map(d=>`<option ${date===d?'selected':''}>${d}</option>`).join('')}</select></label><label>倍率<select data-ca-rate><option value="all">全部倍率</option>${[1,1.5,2].map(m=>`<option value="${m}" ${rate===String(m)?'selected':''}>${m}倍</option>`).join('')}</select></label></div><div class="payroll-overtime-table"><table><thead><tr><th>日期</th><th>工时区间</th><th>工时</th><th>Regular rate</th><th>倍率</th><th>金额</th></tr></thead><tbody>${rows.map(s=>`<tr><td>${s.date}</td><td>${money(s.fromMinute/60)}–${money(s.toMinute/60)} h</td><td>${money(s.minutes/60)} h</td><td>$${money(s.regularRate)}</td><td>${s.multiplier}倍</td><td>$${money(s.amount)}</td></tr><tr><td colspan="6">${escape(s.evidence)}</td></tr>`).join('')||'<tr><td colspan="6">当前条件无记录</td></tr>'}</tbody></table></div><p>合计 ${money(sum(rows,false))} h · $${money(sum(rows,true))}</p>`;
    dialog.querySelectorAll('select').forEach(s=>s.addEventListener('change',draw));
  }
  root.addEventListener('click',e=>{
    const target=(e.target as HTMLElement).closest<HTMLElement>('[data-ca-overtime]');if(!target)return;
    activeKind=target.dataset.caOvertime as CaHourKind;trigger=target;dialog.innerHTML='';draw();dialog.showModal();dialog.querySelector<HTMLElement>('button')?.focus();
  },{signal:events.signal});
  return {
    buildInput:buildCaliforniaPayrollInput,
    apply:applyCaliforniaPayroll,
    resolve:resolveCaliforniaPayroll,
    amounts(employee:Employee,date?:string){
      const result=resolveCaliforniaPayroll(employee);
      if(result?.status!=='ready')return null;
      const rows=date?result.slices.filter(s=>s.date===iso(date)):result.slices;
      const regAmt=sum(rows.filter(s=>s.multiplier===1),true);
      const otAmt=sum(rows.filter(s=>s.multiplier===1.5),true);
      const ot2Amt=sum(rows.filter(s=>s.multiplier===2),true);
      return {regAmt,paidBreakAmt:0,otAmt,ot2Amt,totalAmt:sum(rows,true)};
    },
    freeze(employee:Employee,period:Record<string,any>){const result=resolveCaliforniaPayroll(employee,period);if(result?.status==='ready')employee.californiaOvertimeSnapshot=structuredClone(result);},
    render(employee:Employee,period:Record<string,any>){
      current=resolveCaliforniaPayroll(employee,period);currentName=String(employee.name||'');
      const cards=root.querySelectorAll<HTMLElement>('.payroll-sum-dl');
      let status=root.querySelector<HTMLElement>('[data-ca-overtime-status]');
      if(!status){status=document.createElement('p');status.dataset.caOvertimeStatus='';status.setAttribute('role','status');root.querySelector('.payroll-period-summary')?.prepend(status)}
      status.hidden=current?.status!=='blocked';status.textContent=current?.status==='blocked'?current.reason:'';
      cards.forEach((card,i)=>{
        let display=card.parentElement?.querySelector<HTMLElement>('[data-ca-summary]');
        card.hidden=current?.status==='ready';card.style.display=card.hidden?'none':'';
        if(current?.status==='ready'){
          if(!display){display=document.createElement('dl');display.dataset.caSummary='';display.className='payroll-ca-summary';card.after(display)}
          display.innerHTML=renderCaliforniaSummary(current as Extract<CaOvertimeResult,{status:'ready'}>,i!==0);
        }else display?.remove();
      });
      root.querySelectorAll<HTMLElement>('[data-ca-day-kind]').forEach(cell=>{
        if(current?.status!=='ready'){cell.textContent='—';return;}
        const rows=current.slices.filter(s=>s.date===iso(cell.dataset.caDayDate));
        const kind=cell.dataset.caDayKind;
        cell.textContent=money(sum(kind==='total'||kind==='amount'?rows:rows.filter(s=>s.kind===kind),kind==='amount'));
      });
      if(employee.californiaOvertimeInput)root.querySelectorAll<HTMLElement>('.payroll-seg-week-block').forEach(block=>{
        const summary=block.querySelector<HTMLElement>('.payroll-seg-week-summary');if(!summary)return;
        if(current?.status!=='ready'){summary.textContent='等待完整核算';return;}
        const dates=new Set(Array.from(block.querySelectorAll<HTMLInputElement>('[data-field="date"]')).map(e=>iso(e.value)));
        const rows=current.slices.filter(s=>dates.has(s.date));
        summary.innerHTML=`<span>工作总时长：<strong>${money(sum(rows,false))}</strong></span>`+
          (Object.keys(labels) as CaHourKind[]).map(kind=>`<span>${labels[kind]}：<strong>${money(sum(rows.filter(s=>s.kind===kind),false))}</strong></span>`).join('');
      });
      return current;
    },
    destroy(){events.abort();dialog.remove();},
  };
}
