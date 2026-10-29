import {readSubscriptionServiceSnapshot, SUBSCRIPTION_SERVICE_CHANGE_EVENT} from './subscription-service-store';
import {getPublishedSubscriptionRouteCatalog} from './subscription-published-menu-tree';

// Menu filters query hundreds of links during one render. Reuse only within that
// synchronous turn; never cache entitlement time, account, or scope decisions.
let cached: {snapshot:ReturnType<typeof readSubscriptionServiceSnapshot>;catalog:ReturnType<typeof getPublishedSubscriptionRouteCatalog>}|undefined;
export function serviceEntitlementData():NonNullable<typeof cached> {
  if(cached)return cached;
  const snapshot=readSubscriptionServiceSnapshot();
  cached={snapshot,catalog:snapshot.packages.some(p=>p.commercial)?getPublishedSubscriptionRouteCatalog():[]};
  queueMicrotask(()=>{cached=undefined;});
  return cached;
}
if(typeof window!=='undefined') {
  window.addEventListener(SUBSCRIPTION_SERVICE_CHANGE_EVENT,()=>{cached=undefined;});
  window.addEventListener('storage',()=>{cached=undefined;});
}
