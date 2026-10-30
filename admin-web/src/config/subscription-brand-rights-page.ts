import {renderBrandServiceEntitlements} from './service-entitlement-ui';
import {openServiceMenuPreview} from './service-entitlement-menu-preview';
import {getMerchantById} from './enterprise-merchant-store';
import {mCanVisit} from '../permissions/m-platform-runtime';
import {MERCHANT_SUBSCRIPTIONS_PATH,subscriptionBrandRightsHref} from './subscription-service-scope';
import {showAppToast} from '../ui/app-toast';
import {templateEsc as esc} from './business-menu-template-ui';

let listPosition=0,pendingRestore=false;
export function openSubscriptionBrandRights(brandId:string):void {
 const path=subscriptionBrandRightsHref(brandId);
 if(location.hash!=='#'+MERCHANT_SUBSCRIPTIONS_PATH||!mCanVisit(path))return;
 if(!getMerchantById(brandId)){showAppToast('品牌不存在，请刷新列表后重试。');return;}
 listPosition=document.querySelector<HTMLElement>('[data-subscription-service-page] > div.overflow-auto')?.scrollTop??0;
 pendingRestore=true;location.hash='#'+path;
}
export function renderSubscriptionBrandRightsPage(brandId:string):string {
 const brand=getMerchantById(brandId);
 return `<section class="ba flex h-full min-h-0 flex-col" data-subscription-brand-rights-page="${esc(brandId)}"><header class="shrink-0 border-b border-border bg-card px-6 py-5"><a class="text-sm text-primary" href="#${MERCHANT_SUBSCRIPTIONS_PATH}" data-sub-brand-rights-back>← 返回订阅明细</a><h2 class="mt-4">${esc(brand?.name??'品牌不存在')} · 服务权益</h2>${brand?`<p class="ba-muted mt-2">${esc(brand.code)}</p>`:''}</header><div class="min-h-0 flex-1 overflow-auto bg-muted/20 p-6"><div class="mx-auto max-w-[92rem]">${brand?renderBrandServiceEntitlements(brandId,{readOnly:true,embedded:true}):'<p class="ba-empty">品牌不存在或已移除，请返回订阅明细。</p>'}</div></div></section>`;
}
export function bindSubscriptionBrandRightsPage():void {
 document.querySelectorAll<HTMLButtonElement>('[data-subscription-brand-rights-page] [data-ent-menu]').forEach(button=>button.addEventListener('click',()=>{void openServiceMenuPreview(button.dataset.entMenu!);}));
}
export function restoreSubscriptionListScroll():void {
 if(!pendingRestore||location.hash!=='#'+MERCHANT_SUBSCRIPTIONS_PATH)return;
 const host=document.querySelector<HTMLElement>('[data-subscription-service-page] > div.overflow-auto');if(!host)return;
 pendingRestore=false;requestAnimationFrame(()=>{if(host.isConnected)host.scrollTop=listPosition;});
}
