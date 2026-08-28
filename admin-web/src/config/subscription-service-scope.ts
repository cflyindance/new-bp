export const SUBSCRIPTION_SERVICE_ROUTE_PREFIX = "/m-platform/permissions/subscription-services";
export const SUBSCRIPTION_SERVICE_CREATE_PATH = `${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}/create`;
export const MERCHANT_SUBSCRIPTIONS_PATH = "/m-platform/permissions/merchant-subscriptions";

export function isSubscriptionServicePath(path: string): boolean {
  return path === SUBSCRIPTION_SERVICE_ROUTE_PREFIX || path.startsWith(`${SUBSCRIPTION_SERVICE_ROUTE_PREFIX}/`);
}

export function isSubscriptionServiceCreatePath(path: string): boolean {
  return path === SUBSCRIPTION_SERVICE_CREATE_PATH;
}

export function isMerchantSubscriptionsPath(path: string): boolean {
  return path === MERCHANT_SUBSCRIPTIONS_PATH || path.startsWith(`${MERCHANT_SUBSCRIPTIONS_PATH}/`);
}

export function isAnySubscriptionAdminPath(path: string): boolean {
  return isSubscriptionServicePath(path) || isMerchantSubscriptionsPath(path);
}

export function findSubscriptionAdminPageTitle(path: string): { title: string; module: string } | null {
  if (isSubscriptionServicePath(path)) return { title: "服务包管理", module: "权限管理中心 · 订阅服务" };
  if (isMerchantSubscriptionsPath(path)) return { title: "商家订阅", module: "权限管理中心 · 订阅服务" };
  return null;
}
