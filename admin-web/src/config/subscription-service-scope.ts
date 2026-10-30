export const SUBSCRIPTION_SERVICE_ROUTE_PREFIX = "/m-platform/permissions/subscription-services";
export const SUBSCRIPTION_SERVICE_CREATE_PATH = `${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}/create`;
export const MERCHANT_SUBSCRIPTIONS_PATH = "/m-platform/permissions/merchant-subscriptions";

export function isSubscriptionServicePath(path: string): boolean {
  return path === SUBSCRIPTION_SERVICE_ROUTE_PREFIX || path.startsWith(`${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}/`);
}

export function isSubscriptionServiceCreatePath(path: string): boolean {
  return path === SUBSCRIPTION_SERVICE_CREATE_PATH;
}

/** Package detail uses the independent full-page shell, excluding creation and lists. */
export function isSubscriptionServiceDetailPath(path:string):boolean {
 const prefix=SUBSCRIPTION_SERVICE_ROUTE_PREFIX+'/';
 return path.startsWith(prefix)&&!isSubscriptionServiceCreatePath(path)&&/^[^/?#]+$/.test(path.slice(prefix.length));
}

export function subscriptionBrandRightsHref(brandId:string):string {return MERCHANT_SUBSCRIPTIONS_PATH+'/brands/'+encodeURIComponent(brandId)+'/services';}
export function parseSubscriptionBrandRightsPath(path:string):string|null {
 const prefix=MERCHANT_SUBSCRIPTIONS_PATH+'/brands/';if(!path.startsWith(prefix)||!path.endsWith('/services'))return null;
 const id=path.slice(prefix.length,-'/services'.length);if(!id||id.includes('/'))return null;try{return decodeURIComponent(id);}catch{return null;}
}

export function isMerchantSubscriptionsPath(path: string): boolean {
  return path === MERCHANT_SUBSCRIPTIONS_PATH || path.startsWith(`${MERCHANT_SUBSCRIPTIONS_PATH}/`);
}

export function isAnySubscriptionAdminPath(path: string): boolean {
  return isSubscriptionServicePath(path) || isMerchantSubscriptionsPath(path);
}

export function findSubscriptionAdminPageTitle(path: string): { title: string; module: string } | null {
  if (isSubscriptionServicePath(path)) return { title: "服务包管理", module: "服务与订阅" };
  if (isMerchantSubscriptionsPath(path)) return { title: "商家订阅", module: "服务与订阅" };
  return null;
}
