import type {CaOvertimeResult,CaPaySlice} from './payroll-ca-overtime';
type Ready=Extract<CaOvertimeResult,{status:'ready'}>;
const fixed=(n:number)=>n.toFixed(2);
const escape=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const calculationBasisSlices=(rows:CaPaySlice[])=>rows.filter(s=>s.kind==='weekly'||s.kind==='continuous'||s.kind==='seventh-day'||s.kind!=='regular'&&s.evidence.includes('最高倍率'));

export function renderCalculationBasis(rows:CaPaySlice[],rule?:Ready['continuousRule']):string {
  const relevant=calculationBasisSlices(rows);
  const groups=new Map<string,{sample:CaPaySlice;minutes:number;amount:number}>();
  for(const s of relevant){
    const key=[s.kind,s.continuousTier,s.regularRate,s.multiplier].join(':');
    const group=groups.get(key)||{sample:s,minutes:0,amount:0};
    group.minutes+=s.minutes;group.amount+=s.amount;groups.set(key,group);
  }
  return [...groups.values()].map(({sample:s,minutes,amount})=>{
    const title=s.kind==='weekly'?'每周加班':s.kind==='continuous'?`连勤加班${rule?` · ${rule.dayNumber}天`:''}`:s.kind==='seventh-day'?'法定第7天加班':s.kind==='daily-double'?'OT2':'OT';
    const condition=s.kind==='weekly'?'周普通工时超过40小时':s.kind==='continuous'&&rule?(s.continuousTier===1?`连勤累计超过${rule.hoursBeforeOvertime}至${rule.secondaryHoursBeforeOvertime}小时`:`连勤累计超过${rule.secondaryHoursBeforeOvertime}小时`):s.kind==='seventh-day'?`同一工作周连续第7天 · ${s.multiplier===1.5?'前8小时':'超过8小时'}`:s.evidence;
    return `<section class="payroll-ca-basis-group"><strong>${escape(title)}</strong><p>${escape(condition)}</p><div class="payroll-ca-basis-result"><span>${fixed(minutes/60)} h × $${fixed(s.regularRate*s.multiplier)}/h</span><strong>$${fixed(amount)}</strong></div></section>`;
  }).join('')+(relevant.some(s=>s.evidence.includes('最高倍率'))?'<p class="payroll-ca-basis-note">同一工时命中多条规则时，按最高时薪计薪，不重复计入。</p>':'');
}

/** Click-only, non-modal native popover; all handlers belong to this bridge lifetime. */
export function createCalculationPopover(root:ShadowRoot,getResult:()=>CaOvertimeResult|null){
  const events=new AbortController(),doc=root.ownerDocument;
  const panel=doc.createElement('div');
  panel.id='payroll-ca-basis-popover';panel.className='payroll-ca-basis-popover';panel.setAttribute('popover','manual');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','payroll-ca-basis-heading');
  panel.hidden=true;root.append(panel);
  let trigger:HTMLButtonElement|null=null;
  const close=(restore=false)=>{const previous=trigger;trigger=null;previous?.setAttribute('aria-expanded','false');if(panel.matches(':popover-open'))panel.hidePopover();panel.hidden=true;panel.innerHTML='';if(restore&&previous?.isConnected)previous.focus({preventScroll:true});};
  const position=()=>{
    if(!trigger)return;
    const box=trigger.getBoundingClientRect(),win=doc.defaultView!;
    if(!trigger.isConnected||box.bottom<0||box.top>win.innerHeight){close();return;}
    const bounds=panel.getBoundingClientRect();
    panel.style.left=`${Math.max(8,Math.min(box.right-bounds.width,win.innerWidth-bounds.width-8))}px`;
    const below=box.bottom+8;
    panel.style.top=`${Math.max(8,Math.min(below+bounds.height<=win.innerHeight-8?below:box.top-bounds.height-8,win.innerHeight-bounds.height-8))}px`;
  };
  root.addEventListener('click',event=>{
    const target=event.target as Element;
    if(target.closest('[data-ca-basis-close]')){close(true);return;}
    const button=target.closest<HTMLButtonElement>('[data-ca-basis-date]');if(!button)return;
    if(trigger===button){close(true);return;}
    close();const result=getResult();if(result?.status!=='ready')return;
    const rows=result.slices.filter(s=>s.date===button.dataset.caBasisDate);if(!calculationBasisSlices(rows).length)return;
    trigger=button;button.setAttribute('aria-expanded','true');
    panel.innerHTML=`<header><strong id="payroll-ca-basis-heading">计算依据 · ${escape(button.dataset.caBasisDate)}</strong><button type="button" data-ca-basis-close aria-label="关闭计算依据">×</button></header>${renderCalculationBasis(rows,result.continuousRule)}`;
    panel.hidden=false;if(typeof panel.showPopover==='function')panel.showPopover();position();
    panel.querySelector<HTMLButtonElement>('[data-ca-basis-close]')?.focus({preventScroll:true});
  },{signal:events.signal});
  const outside=(event:Event)=>{if(trigger&&!event.composedPath().includes(panel)&&!event.composedPath().includes(trigger))close();};
  doc.addEventListener('pointerdown',outside,{capture:true,signal:events.signal});
  doc.addEventListener('focusin',outside,{signal:events.signal});
  doc.addEventListener('keydown',event=>{if(trigger&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},{capture:true,signal:events.signal});
  doc.addEventListener('scroll',position,{capture:true,signal:events.signal});
  root.addEventListener('scroll',position,{capture:true,signal:events.signal});
  doc.defaultView?.addEventListener('resize',position,{signal:events.signal});
  return {close,destroy(){close();events.abort();panel.remove();}};
}
