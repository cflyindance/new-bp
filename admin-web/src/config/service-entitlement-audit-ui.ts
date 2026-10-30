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
 }
 if(a.action==='entitlement.disable'){summary=`权益已停用${c.reason?`；原因：${c.reason}`:''}`;fields.push(['停用原因',c.reason||'未记录']);}
 if(c.priceMinor!==undefined&&typeof c.priceMinor==='number'&&Number.isSafeInteger(c.priceMinor)&&c.priceMinor>=0){let amount=(c.priceMinor/100).toFixed(2);try{amount=new Intl.NumberFormat('zh-CN',{style:'currency',currency:c.currency!}).format(c.priceMinor/100);}catch{amount+='（币种未记录）';}fields.push(['成交金额',amount]);}
 if(c.reference)fields.push(['开通依据',c.reference]);
 return {service,operation,summary,fields};
}

export function renderEntitlementAudit(records:SubscriptionAuditEntry[]):string {
 const sorted=[...records].sort((a,b)=>(Number.isFinite(Date.parse(b.at))?Date.parse(b.at):-Infinity)-(Number.isFinite(Date.parse(a.at))?Date.parse(a.at):-Infinity));
 return `<details style="margin-top:24px" data-service-entitlement-browse><summary style="font-weight:600">服务变更记录（${sorted.length}）</summary><div class="ba-table-wrap" style="margin-top:16px"><table style="min-width:900px"><thead><tr><th>时间</th><th>服务名称</th><th>操作</th><th>变更内容</th><th>操作人</th><th>详情</th></tr></thead><tbody>${sorted.map((a,i)=>{const p=entitlementAuditPresentation(a);return `<tr data-rights-audit-row${i>=20?' hidden':''}><td style="white-space:nowrap">${esc(date(a.at))}</td><td>${esc(p.service)}</td><td style="white-space:nowrap"><span class="ba-tag">${esc(p.operation)}</span></td><td style="max-width:440px;overflow-wrap:anywhere">${esc(p.summary)}</td><td style="overflow-wrap:anywhere">${esc(a.actor||'未记录')}</td><td><details><summary>查看详情</summary><dl style="min-width:200px;max-width:350px;overflow-wrap:anywhere">${p.fields.map(([k,v])=>`<dt class="ba-muted" style="margin-top:10px">${esc(k)}</dt><dd style="margin:4px 0">${esc(v)}</dd>`).join('')}</dl></details></td></tr>`;}).join('')||'<tr><td colspan="6" class="ba-empty">暂无服务变更记录</td></tr>'}</tbody></table></div>${sorted.length>20?'<button type="button" class="ba-btn" style="margin-top:12px" data-rights-audit-more>显示更多记录</button>':''}</details>`;
}
export function bindEntitlementAudit(root:HTMLElement):void {
 const button=root.querySelector<HTMLButtonElement>('[data-rights-audit-more]');if(!button)return;
 button.onclick=()=>{const hidden=[...root.querySelectorAll<HTMLElement>('[data-rights-audit-row][hidden]')];hidden.slice(0,20).forEach(row=>row.hidden=false);button.hidden=hidden.length<=20;};
}
