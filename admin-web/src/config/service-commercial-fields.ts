import type { ServiceCommercialPolicy } from './subscription-service-domain';

export function renderCommercialFields(policy?: ServiceCommercialPolicy, newService=false): string {
  const p=policy??{chargeType:'free',billingUnit:'brand',trialEnabled:false,trialDays:14};
  return `<section class="mt-5 space-y-4 border-t border-border pt-4" data-commercial-fields>
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="commercialEnabled" ${policy||newService?'checked':''} ${policy?'data-commercial-fixed':''}>按服务权益控制使用</label>
    <p class="text-xs leading-5 text-muted-foreground">启用并发布后，未开通的菜单保留入口，但只显示服务说明。旧服务包未启用时沿用原规则；已有真实订阅仍按原有效期使用。</p>
    <div class="grid gap-4 sm:grid-cols-2">
    <label class="text-xs font-semibold">收费类型<select name="chargeType" class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"><option value="free" ${p.chargeType==='free'?'selected':''}>免费服务</option><option value="paid" ${p.chargeType==='paid'?'selected':''}>收费服务</option></select></label>
    <label class="text-xs font-semibold">计费单位<select name="billingUnit" class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"><option value="brand" ${p.billingUnit==='brand'?'selected':''}>按品牌</option><option value="store" ${p.billingUnit==='store'?'selected':''}>按门店</option></select></label>
    </div>
    <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="trialEnabled" ${p.trialEnabled?'checked':''}>允许免费试用</label>
    <label class="block text-xs font-semibold">默认试用天数<input name="trialDays" type="number" min="1" max="90" step="1" value="${p.trialDays||14}" class="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"></label>
    <p class="text-xs leading-5 text-muted-foreground">同一品牌同一服务限试用一次，明确确认后开始计时。到期不自动扣款；修改价格和试用时长不影响已记录的成交价与试用结束时间。</p>
  </section>`;
}
export function readCommercialFields(form: HTMLFormElement, existing?:ServiceCommercialPolicy):ServiceCommercialPolicy|undefined {
  const data=new FormData(form);
  if(!data.has('commercialEnabled')) {
    if(existing)throw Error('已启用的服务权益控制不能直接取消。');
    return undefined;
  }
  return {chargeType:String(data.get('chargeType')) as 'free'|'paid',billingUnit:String(data.get('billingUnit')) as 'brand'|'store',trialEnabled:data.has('trialEnabled'),trialDays:Number(data.get('trialDays')??0)};
}
