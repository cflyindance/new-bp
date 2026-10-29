import type { ActivityStore } from './merchant-activity-domain';
import { getMerchantById, getStoreById } from './enterprise-merchant-store';
import { merchantDetailHref, storeDetailHref } from './enterprise-merchant-scope';
import { mCanVisit } from '../permissions/m-platform-runtime';
export function activityManagementLinks(store: ActivityStore, hiddenKind?: 'brand' | 'store' | 'both'): string {
  const links: string[] = [];
  const brand = getMerchantById(store.merchantId), managedStore = getStoreById(store.id);
  if (hiddenKind !== 'both' && hiddenKind !== 'brand' && brand && mCanVisit(merchantDetailHref(brand.merchantId).slice(1))) links.push(`<a class="ma-link" href="${merchantDetailHref(brand.merchantId)}">查看品牌详情</a>`);
  if (hiddenKind !== 'both' && hiddenKind !== 'store' && managedStore?.merchantId === store.merchantId && mCanVisit(storeDetailHref(store.id).slice(1))) links.push(`<a class="ma-link" href="${storeDetailHref(store.id)}">查看门店详情</a>`);
  return links.length ? `<div class="ma-context-links">${links.join('')}</div>` : '';
}
