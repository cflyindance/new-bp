import type {CaOvertimeResult} from './payroll-ca-overtime';
type Ready = Extract<CaOvertimeResult,{status:'ready'}>;
const fixed=(value:number)=>value.toFixed(2);
export function renderContinuousBreakdown(result:Ready):string {
  const rule=result.continuousRule;
  if(!rule)return '';
  const slices=result.slices.filter(s=>s.kind==='continuous');
  const total=(tier:number|null,cash:boolean)=>slices.filter(s=>tier===null||s.continuousTier===tier).reduce((n,s)=>n+(cash?s.amount:s.minutes/60),0);
  const tiers=[{label:`累计超${rule.hoursBeforeOvertime}至${rule.secondaryHoursBeforeOvertime}小时`,multiplier:rule.wageMultiplier},{label:`累计超${rule.secondaryHoursBeforeOvertime}小时`,multiplier:Number(rule.secondaryWageMultiplier)}];
  return `<p>第${rule.dayNumber}天起计薪</p><table><thead><tr><th>累计区间 / 倍率</th><th>工时</th><th>金额</th></tr></thead><tbody>${tiers.map((t,i)=>`<tr><th>${t.label}<br>${t.multiplier}倍</th><td>${fixed(total(i+1,false))} h</td><td>$${fixed(total(i+1,true))}</td></tr>`).join('')}</tbody><tfoot><tr><th>合计</th><td>${fixed(total(null,false))} h</td><td>$${fixed(total(null,true))}</td></tr></tfoot></table>`;
}

/** Read-only, non-modal tooltip. All listeners are scoped to this bridge lifetime. */
export function createContinuousTooltip(root:ShadowRoot,getResult:()=>CaOvertimeResult|null){
  const events=new AbortController();
  const tooltip=document.createElement('div');
  tooltip.id='payroll-ca-continuous-tooltip';tooltip.className='payroll-ca-continuous-tooltip';
  tooltip.setAttribute('role','tooltip');tooltip.hidden=true;root.append(tooltip);
  let trigger:HTMLElement|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const clearTimer=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;};
  const close=()=>{clearTimer();tooltip.hidden=true;tooltip.innerHTML='';trigger=null;};
  const show=(button:HTMLElement)=>{
    if(root.querySelector('.modal-overlay.show,dialog[open]')){close();return;}
    const result=getResult();if(result?.status!=='ready'||!result.continuousRule){close();return;}
    clearTimer();trigger=button;tooltip.innerHTML=renderContinuousBreakdown(result);tooltip.hidden=false;
    const box=button.getBoundingClientRect(),tip=tooltip.getBoundingClientRect();
    const left=Math.max(8,Math.min(box.left,window.innerWidth-tip.width-8));
    const top=box.bottom+8+tip.height<=window.innerHeight-8?box.bottom+8:Math.max(8,box.top-tip.height-8);
    tooltip.style.left=`${left}px`;tooltip.style.top=`${top}px`;
  };
  const scheduleClose=()=>{
    clearTimer();timer=setTimeout(()=>{
      if(trigger?.matches(':hover')||tooltip.matches(':hover')||root.activeElement===trigger)return;
      close();
    },150);
  };
  const help=(event:Event)=>(event.target as Element).closest<HTMLElement>('[data-ca-continuous-help]');
  root.addEventListener('pointerover',event=>{const button=help(event);if(button)show(button);else if(tooltip.contains(event.target as Node))clearTimer();},{signal:events.signal});
  root.addEventListener('pointerout',event=>{
    if(!trigger)return;
    const next=(event as PointerEvent).relatedTarget as Node|null;
    if(next&&(trigger.contains(next)||tooltip.contains(next)))return;
    if(trigger.contains(event.target as Node)||tooltip.contains(event.target as Node))scheduleClose();
  },{signal:events.signal});
  root.addEventListener('focusin',event=>{const button=help(event);if(button)show(button);else close();},{signal:events.signal});
  root.addEventListener('focusout',()=>scheduleClose(),{signal:events.signal});
  root.addEventListener('keydown',event=>{
    if((event as KeyboardEvent).key==='Escape'&&!tooltip.hidden){event.preventDefault();event.stopImmediatePropagation();close();}
  },{capture:true,signal:events.signal});
  window.addEventListener('scroll',close,{capture:true,signal:events.signal});
  window.addEventListener('resize',close,{signal:events.signal});
  return {close,destroy(){close();events.abort();tooltip.remove();}};
}
