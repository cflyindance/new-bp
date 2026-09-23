import type {PayrollPageContext} from './payroll-context';
import type {PayrollBatchBridge} from './payroll-batch-export-types';
import type {PayrollScheduleRule,PayrollFrequency,PlannedPayDatePolicy} from './payroll-schedule-types';
import {scheduleHistory,editPendingRule,withdrawPendingRule} from './payroll-schedule-history';
import {generatePeriods,validateNewScheduleRule} from './payroll-schedule-engine';

const labels:Record<PayrollFrequency,string>={weekly:'单周',biweekly:'双周',semimonthly:'半月',monthly:'一月',custom:'自定义'};
const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function mountPayrollScheduleController(root:ShadowRoot,bridge:PayrollBatchBridge,context:PayrollPageContext){
  const abort=new AbortController();
  const entry=document.createElement('button');entry.type='button';entry.className='btn no-print';entry.textContent='发薪周期设置';
  root.querySelector('.payroll-store-bar-inner')?.append(entry);
  const panel=document.createElement('dialog');panel.className='payroll-schedule-dialog payroll-schedule-page';panel.setAttribute('aria-label','发薪周期设置');root.append(panel);
  const editor=document.createElement('dialog');editor.className='payroll-schedule-dialog';editor.setAttribute('aria-label','规则配置');root.append(editor);
  const confirmation=document.createElement('dialog');confirmation.className='payroll-schedule-dialog';confirmation.setAttribute('aria-label','确认规则');root.append(confirmation);
  let demoRules:PayrollScheduleRule[]=[];
  let selected=context.getScope().storeId||context.getScope().stores[0]?.id||'';
  let returnFocus:HTMLElement|null=null;
  const demo=()=>Boolean(bridge.getSnapshot().data.demo);
  const today=()=>new Date().toLocaleDateString('sv-SE');
  const rules=()=>demo()?demoRules:(bridge.getSnapshot().data.scheduleRules as PayrollScheduleRule[]||[]);
  const storeName=(id:string)=>context.getScope().stores.find(s=>s.id===id)?.labelZh||id;
  function options(value:string){return context.getScope().stores.map(s=>`<option value="${escape(s.id)}" ${value===s.id?'selected':''}>${escape(s.labelZh)}</option>`).join('');}
  function render(){
    if(demo()&&!demoRules.some(r=>r.storeId===selected)&&selected){
      demoRules.push(...(['monthly','semimonthly','weekly','biweekly'] as PayrollFrequency[]).map((frequency,i)=>({
        id:`demo-history-${selected}-${i}`,storeId:selected,version:i+1,effectiveFrom:`${Number(today().slice(0,4))-3+i}-01-01`,frequency,
        timezone:'UTC',status:'expired' as const,plannedPayDatePolicy:{kind:'daysAfterEnd' as const,days:6},
      })));
    }
    const rows=scheduleHistory(rules(),selected,today());
    const current=rows.find(row=>row.status==='active');
    panel.innerHTML=`<header><button type="button" data-close>返回薪资管理</button><h2>发薪周期设置</h2></header>
      <div class="payroll-schedule-tools"><label>门店 <select data-store>${options(selected)}</select></label><button type="button" data-add ${!demo()||!selected?'disabled':''}>新增规则</button></div>
      <p role="status">${demo()?'示例规则 · 仅保留在本次页面，不改变实际薪资记录':'实际规则只读；正式发布尚未接入，不能在此保存真实规则。'}</p>
      <section class="payroll-schedule-current"><strong>当前规则</strong><span>${current?labels[current.rule.frequency]:'暂无已生效规则'}</span><span>${current?`自 ${current.rule.effectiveFrom} 起`:''}</span></section>
      <h3>全部规则与历史</h3><div class="payroll-schedule-table"><table><thead><tr><th>版本</th><th>门店</th><th>发薪周期</th><th>开始日期</th><th>结束日期</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map(row=>`<tr><td>V${row.rule.version}</td><td>${escape(storeName(row.rule.storeId))}</td><td>${labels[row.rule.frequency]}</td><td>${row.rule.effectiveFrom}</td><td>${row.endDate||'持续生效'}</td><td>${{pending:'待生效',active:'生效中',expired:'已过期'}[row.status]}</td><td><button data-view="${escape(row.rule.id)}">查看</button>${demo()&&row.status==='pending'?` <button data-edit="${escape(row.rule.id)}">编辑</button> <button data-delete="${escape(row.rule.id)}">删除</button>`:''}</td></tr>`).join('')||'<tr><td colspan="7">暂无规则记录</td></tr>'}</tbody></table></div>`;
  }
  function openEditor(rule?:PayrollScheduleRule,readonly=false){
    const start=rule?.effectiveFrom||`${Number(today().slice(0,4))+1}-01-01`;
    editor.innerHTML=`<header><h2>${readonly?'查看规则':rule?'编辑规则':'新增规则'}</h2><button type="button" data-editor-close>关闭</button></header><form>
      <fieldset ${readonly?'disabled':''}><label>门店<select name="storeId" ${rule?'disabled':''}>${options(rule?.storeId||selected)}</select></label>
      <label>发薪频率<select name="frequency">${Object.entries(labels).map(([key,label])=>`<option value="${key}" ${key===(rule?.frequency||'biweekly')?'selected':''}>${label}</option>`).join('')}</select></label>
      <div class="payroll-schedule-grid"><label>生效日期<input name="effectiveFrom" type="date" required value="${start}"></label><label data-anchor>每期从哪天开始<input name="anchorDate" type="date" value="${rule?.anchorDate||start}"></label><label data-custom>每期天数<input name="customDays" type="number" min="1" max="31" value="${rule?.customDays||10}"></label></div>
      <h3>计划发薪日</h3><label>日期规则<select name="payKind"></select></label><div data-policy-fields></div></fieldset>
      <p data-error role="alert"></p><footer><button type="button" data-editor-close>取消</button>${readonly?'':'<button type="submit">确认规则</button>'}</footer></form>`;
    const form=editor.querySelector('form')!;
    const input=(name:string)=>form.elements.namedItem(name) as HTMLInputElement;
    let anchorEdited=Boolean(rule?.anchorDate&&rule.anchorDate!==rule.effectiveFrom);
    function policyFields(){
      const kind=input('payKind').value;
      editor.querySelector('[data-policy-fields]')!.innerHTML=kind==='daysAfterEnd'?'<label>统计期结束后第几天<input name="days" type="number" min="1" max="366" required value="6"></label>':kind==='weekdayAfterEnd'?`<label>期末后首次<select name="weekday">${['周日','周一','周二','周三','周四','周五','周六'].map((s,i)=>`<option value="${i}" ${i===5?'selected':''}>${s}</option>`).join('')}</select></label>`:kind==='monthlyFixed'?'<label>次月几日<input name="nextMonthDay" type="number" min="1" max="31" required value="5"></label>':'<div class="payroll-schedule-grid"><label>上半月 → 当月几日<input name="firstHalfDay" type="number" min="16" max="31" required value="20"></label><label>下半月 → 次月几日<input name="secondHalfNextMonthDay" type="number" min="1" max="31" required value="5"></label></div>';
    }
    function link(){
      const f=input('frequency').value;
      (editor.querySelector('[data-anchor]') as HTMLElement).hidden=['monthly','semimonthly'].includes(f);
      (editor.querySelector('[data-custom]') as HTMLElement).hidden=f!=='custom';
      input('payKind').innerHTML=`<option value="daysAfterEnd">期末后指定天数</option>${f==='monthly'?'<option value="monthlyFixed">次月固定日期</option>':f==='semimonthly'?'<option value="semiMonthlyFixed">每月两个固定日期</option>':'<option value="weekdayAfterEnd">期末后首次指定星期</option>'}`;
      policyFields();
    }
    link();
    if(rule?.plannedPayDatePolicy){input('payKind').value=rule.plannedPayDatePolicy.kind;policyFields();for(const [key,value] of Object.entries(rule.plannedPayDatePolicy))if(key!=='kind'&&input(key))input(key).value=String(value);}
    input('frequency').addEventListener('change',link);
    input('payKind').addEventListener('change',policyFields);
    input('anchorDate').addEventListener('input',()=>{anchorEdited=true;});
    input('effectiveFrom').addEventListener('input',()=>{if(!anchorEdited)input('anchorDate').value=input('effectiveFrom').value;});
    form.addEventListener('submit',event=>{
      event.preventDefault();
      try{
        if(!demo())throw new Error('请在示例场景中演示规则设置');
        const policy={kind:input('payKind').value} as Record<string,unknown>;
        for(const name of ['days','weekday','nextMonthDay','firstHalfDay','secondHalfNextMonthDay'])if(input(name))policy[name]=Number(input(name).value);
        const storeId=rule?.storeId||input('storeId').value;
        const next:PayrollScheduleRule={id:rule?.id||`demo-rule-${crypto.randomUUID()}`,storeId,version:rule?.version||Math.max(0,...demoRules.filter(r=>r.storeId===storeId).map(r=>r.version))+1,effectiveFrom:input('effectiveFrom').value,frequency:input('frequency').value as PayrollFrequency,anchorDate:input('anchorDate').value,customDays:Number(input('customDays').value),plannedPayDatePolicy:policy as unknown as PlannedPayDatePolicy,timezone:rule?.timezone||'UTC',status:'pending'};
        validateNewScheduleRule(next);
        if(next.effectiveFrom<=today())throw new Error('演示新增规则请选择未来生效日期');
        if(demoRules.some(r=>r.id!==next.id&&r.status!=='withdrawn'&&r.storeId===storeId&&r.effectiveFrom===next.effectiveFrom))throw new Error('该门店已有同日生效规则');
        const first=generatePeriods(next,next.effectiveFrom,next.effectiveFrom)[0];
        confirmAction(`门店：${storeName(storeId)}；${labels[next.frequency]}；生效日期：${next.effectiveFrom}；首期：${first.startDate}–${first.endDate}；计划发薪日：${first.plannedPayDate}`,()=>{
          demoRules=rule?editPendingRule(demoRules,next,today(),[]):[...demoRules,next];selected=storeId;editor.close();render();
        });
      }catch(error){editor.querySelector('[data-error]')!.textContent=String((error as Error).message);}
    });
    editor.showModal();
  }
  function confirmAction(message:string,action:()=>void){
    confirmation.innerHTML='<h3>确认操作</h3><p></p><p role="alert"></p><footer><button data-confirm-cancel>取消</button><button data-confirm-ok>确认</button></footer>';
    confirmation.querySelector('p')!.textContent=message;
    confirmation.querySelector('[data-confirm-cancel]')!.addEventListener('click',()=>confirmation.close());
    confirmation.querySelector('[data-confirm-ok]')!.addEventListener('click',()=>{try{if(!demo())throw new Error('当前不在示例场景');action();confirmation.close();}catch(error){confirmation.querySelector('[role="alert"]')!.textContent=(error as Error).message;}});
    confirmation.showModal();
  }
  entry.addEventListener('click',()=>{returnFocus=entry;render();panel.showModal();},{signal:abort.signal});
  panel.addEventListener('close',()=>returnFocus?.focus(),{signal:abort.signal});
  panel.addEventListener('change',event=>{const target=event.target as HTMLSelectElement;if(target.matches('[data-store]')){selected=target.value;render();}},{signal:abort.signal});
  panel.addEventListener('click',event=>{
    const button=(event.target as HTMLElement).closest('button');if(!button)return;
    if(button.hasAttribute('data-close'))panel.close();
    else if(button.hasAttribute('data-add'))openEditor();
    else{const id=button.dataset.view||button.dataset.edit||button.dataset.delete;const rule=rules().find(r=>r.id===id);if(!rule)return;
      if(button.dataset.delete)confirmAction(`删除待生效规则 V${rule.version}？`,()=>{demoRules=withdrawPendingRule(demoRules,rule.id,today(),[]);render();});
      else openEditor(rule,Boolean(button.dataset.view));}
  },{signal:abort.signal});
  editor.addEventListener('click',event=>{if((event.target as HTMLElement).closest('[data-editor-close]'))editor.close();},{signal:abort.signal});
  return {destroy(){abort.abort();entry.remove();panel.remove();editor.remove();confirmation.remove();}};
}
