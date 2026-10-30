import type {SubscriptionAuditEntry} from './subscription-service-domain';

const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const date=(v?:string,empty='未记录')=>{if(!v)return empty;const t=new Date(v);return Number.isFinite(t.getTime())?t.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'时间无效';};
const method=(kind?:string)=>({free:'免费开通',trial:'开始试用',paid:'付费开通',gift:'赠送'})[kind??'']??'开通服务';
/** Format only times actually written into the historical text, never today's grant. */
export const readableAuditText=(text:string)=>text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g,v=>date(v)).replace(/(\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{2}):\d{2}/g,'$1').replace(/正式开通/g,'付费开通');

export function entitlementAuditPresentation(a:SubscriptionAuditEntry):{service:string;operation:string;summary:string;fields:Array<[string,string]>} {
 const c=a.entitlementChange,parts=a.detail.split(' · '),known=['entitlement.create','entitlement.demo','entitlement.extend','entitlement.disable'].includes(a.action);
 const marker=parts.findIndex((part,i)=>i>=2&&(a.action==='entitlement.extend'?part.startsWith('续期至：'):a.action==='entitlement.disable'?part.startsWith('停用：'):['免费开通','开始试用','正式开通','付费开通','赠送'].includes(part)));
 const service=c?.serviceName||(known&&marker>=2?parts.slice(1,marker).join(' · '):'服务名称未记录');
 const operation=a.action==='entitlement.demo'?'演示预设':a.action==='entitlement.extend'?'续期':a.action==='entitlement.disable'?'停用':a.action==='entitlement.create'?c?method(c.kind):parts.find(s=>['免费开通','开始试用','正式开通','付费开通','赠送'].includes(s))?.replace('正式开通','付费开通')??'开通服务':'其他变更';
 if(!c){
  const summary=known&&marker>=2?readableAuditText(parts.slice(marker).join('；')):readableAuditText(a.detail)||'变更内容未记录';
  return {service,operation,summary,fields:[['记录说明','历史文本记录，未保存的字段无法还原'],['原到期时间','未记录'],['历史变更内容',readableAuditText(a.detail)||'未记录']]};
 }
 const fields:Array<[string,string]>=[['开通方式',method(c.kind)],['适用范围',c.scope],['开始时间',date(c.startAt)],['到期时间',date(c.endAt,'长期')]];
 let summary=`${c.scope}；有效期：${date(c.startAt)} 至 ${date(c.endAt,'长期')}`;
 if(a.action==='entitlement.extend'){
  const old=c.previousEndRecorded?date(c.previousEndAt,'长期'):'未记录';
  summary=`到期时间：${old} → ${date(c.endAt,'长期')}`;fields.push(['原到期时间',old],['新到期时间',date(c.endAt,'长期')]);
  if(c.reason){summary+=`；延长原因：${c.reason}`;fields.push(['延长原因',c.reason]);}
 }
 if(a.action==='entitlement.disable'){summary=`权益已停用${c.reason?`；原因：${c.reason}`:''}`;fields.push(['停用原因',c.reason||'未记录']);}
 if(c.priceMinor!==undefined&&typeof c.priceMinor==='number'&&Number.isSafeInteger(c.priceMinor)&&c.priceMinor>=0){let amount=(c.priceMinor/100).toFixed(2);try{amount=new Intl.NumberFormat('zh-CN',{style:'currency',currency:c.currency!}).format(c.priceMinor/100);}catch{amount+='（币种未记录）';}fields.push(['成交金额',amount]);}
 if(c.reference)fields.push(['开通依据',c.reference]);
 return {service,operation,summary,fields};
}

export function renderEntitlementAudit(records:SubscriptionAuditEntry[]):string {
 const sorted=[...records].sort((a,b)=>(Number.isFinite(Date.parse(b.at))?Date.parse(b.at):-Infinity)-(Number.isFinite(Date.parse(a.at))?Date.parse(a.at):-Infinity));
 return `<section data-service-entitlement-browse data-audit-total="${sorted.length}"><div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4"><label class="ba-field">服务名称<input type="search" data-rights-audit-query placeholder="搜索服务名称"></label><label class="ba-field">操作类型<select data-rights-audit-operation><option value="">全部操作</option>${['免费开通','开始试用','付费开通','赠送','续期','停用','演示预设','开通服务','其他变更'].map(t=>`<option>${t}</option>`).join('')}</select></label><label class="ba-field">操作时间起<input type="date" data-rights-audit-from></label><label class="ba-field">操作时间止<input type="date" data-rights-audit-to></label></div><div class="ba-actions" style="justify-content:space-between;margin-bottom:12px"><span class="ba-muted" data-rights-audit-count></span><button type="button" class="ba-btn" data-rights-audit-reset>重置筛选</button></div><p class="ba-error" role="alert" data-rights-audit-error hidden></p><div class="ba-table-wrap" style="margin-top:16px"><table style="min-width:900px"><thead><tr><th>时间</th><th>服务名称</th><th>操作</th><th>变更内容</th><th>操作人</th><th>详情</th></tr></thead><tbody>${sorted.map((a,i)=>{const p=entitlementAuditPresentation(a);return `<tr data-rights-audit-row data-service="${esc(p.service.toLowerCase())}" data-operation="${esc(p.operation)}" data-at="${esc(a.at)}"${i>=20?' hidden':''}><td style="white-space:nowrap">${esc(date(a.at))}</td><td>${esc(p.service)}</td><td style="white-space:nowrap"><span class="ba-tag">${esc(p.operation)}</span></td><td style="max-width:440px;overflow-wrap:anywhere">${esc(p.summary)}</td><td style="overflow-wrap:anywhere">${esc(a.actor||'未记录')}</td><td><details><summary>查看详情</summary><dl style="min-width:200px;max-width:350px;overflow-wrap:anywhere">${p.fields.map(([k,v])=>`<dt class="ba-muted" style="margin-top:10px">${esc(k)}</dt><dd style="margin:4px 0">${esc(v)}</dd>`).join('')}</dl></details></td></tr>`;}).join('')}<tr data-rights-audit-empty${sorted.length?' hidden':''}><td colspan="6" class="ba-empty">${sorted.length?'没有符合条件的变更记录':'暂无服务变更记录'}</td></tr></tbody></table></div>${sorted.length>20?'<button type="button" class="ba-btn" style="margin-top:12px" data-rights-audit-more>显示更多记录</button>':''}</section>`;
}
const auditViews=new Map<string,{q:string;operation:string;from:string;to:string;limit:number}>();
export function bindEntitlementAudit(root:HTMLElement):void {
 const panel=root.querySelector<HTMLElement>('[data-service-entitlement-browse]');if(!panel)return;
 const key=root.dataset.brandEntitlements!,view=auditViews.get(key)??{q:'',operation:'',from:'',to:'',limit:20};auditViews.set(key,view);
 const q=panel.querySelector<HTMLInputElement>('[data-rights-audit-query]')!,op=panel.querySelector<HTMLSelectElement>('[data-rights-audit-operation]')!,from=panel.querySelector<HTMLInputElement>('[data-rights-audit-from]')!,to=panel.querySelector<HTMLInputElement>('[data-rights-audit-to]')!;
 q.value=view.q;op.value=view.operation;from.value=view.from;to.value=view.to;
 const rows=[...panel.querySelectorAll<HTMLElement>('[data-rights-audit-row]')],more=panel.querySelector<HTMLButtonElement>('[data-rights-audit-more]'),empty=panel.querySelector<HTMLElement>('[data-rights-audit-empty]')!,error=panel.querySelector<HTMLElement>('[data-rights-audit-error]')!,count=panel.querySelector<HTMLElement>('[data-rights-audit-count]')!;
 const apply=(reset=true)=>{view.q=q.value.trim().toLowerCase();view.operation=op.value;view.from=from.value;view.to=to.value;if(reset)view.limit=20;
  const invalid=!!(view.from&&view.to&&view.from>view.to);error.hidden=!invalid;error.textContent=invalid?'操作时间止不能早于操作时间起':'';
  const begin=view.from?new Date(view.from+'T00:00:00').getTime():-Infinity,end=new Date(view.to+'T00:00:00');end.setDate(end.getDate()+1);const finish=view.to?end.getTime():Infinity;
  const matched=rows.filter(row=>{const at=Date.parse(row.dataset.at??'');return !invalid&&(!view.q||row.dataset.service?.includes(view.q))&&(!view.operation||row.dataset.operation===view.operation)&&(!(view.from||view.to)||(Number.isFinite(at)&&at>=begin&&at<finish));});
  const visible=new Set(matched.slice(0,view.limit));rows.forEach(row=>row.hidden=!visible.has(row));empty.hidden=invalid||matched.length>0;count.textContent=invalid?'':`${matched.length===rows.length?`共 ${rows.length} 条记录`:`筛选结果 ${matched.length} 条（全部 ${rows.length} 条）`}${view.limit<matched.length?`，已显示 ${view.limit} 条`:''}`;if(more)more.hidden=invalid||matched.length<=view.limit;
 };
 q.oninput=()=>apply();[op,from,to].forEach(el=>el.onchange=()=>apply());if(more)more.onclick=()=>{view.limit+=20;apply(false);};
 panel.querySelector<HTMLButtonElement>('[data-rights-audit-reset]')!.onclick=()=>{q.value='';op.value='';from.value='';to.value='';apply();};
 apply(false);
}
