import {serviceEntitlementData} from './service-entitlement-data';
import {matchServicePackages} from './service-entitlement-domain';
import { orderCenterGateId } from "./order-center-navigation";
import { isStoreInformationPage, storeInformationGateId } from "./store-information-navigation";
import {
  readChainAnchorStoreId,
  resolveChainDataPerspective,
  resolveDefaultAnchorBrandId,
} from "../auth/merchant-scope-context";
import { readActiveImpersonation } from "./enterprise-merchant-impersonate";
import { getMerchantById, getStoreById } from "./enterprise-merchant-store";
import { NAV_MODULES, type NavModule } from "./navigation";
import { getSubscriptionRouteCatalog } from "./subscription-service-domain";
import {
  getEffectiveLegacySubscriptionRoutes,
  hasConfiguredSubscriptionForContext,
} from "./subscription-service-store";

export interface CurrentSubscriptionContext {
  groupId?: string;
  brandId?: string;
  storeId?: string;
}

export function resolveCurrentSubscriptionContext(): CurrentSubscriptionContext | null {
  const impersonation = readActiveImpersonation();
  const perspective = resolveChainDataPerspective();
  const storeId = perspective === "store" ? readChainAnchorStoreId() ?? undefined : undefined;
  const store = storeId ? getStoreById(storeId) : undefined;
  const brandId = store?.merchantId ?? impersonation?.merchantId ?? resolveDefaultAnchorBrandId() ?? undefined;
  const merchant = brandId ? getMerchantById(brandId) : undefined;
  if (!impersonation && !store && !merchant) return null;
  return {
    groupId: merchant?.groupId,
    brandId: perspective === "group-hq" ? undefined : brandId,
    storeId,
  };
}

function currentRouteIds(): Set<string> | null {
  const context = resolveCurrentSubscriptionContext();
  if (!context) return null;
  if (!hasConfiguredSubscriptionForContext(context)) return null;
  return getEffectiveLegacySubscriptionRoutes(context);
}

export function filterNavModulesBySubscription(modules: NavModule[]): NavModule[] {
  const routeIds = currentRouteIds();
  if (!routeIds) return modules;
  return modules
    .map((module) => {
      const children = module.children.filter((child) => hasCommercialRoute(child.path) || routeIds.has(child.id === "qc-tables" ? "qc-floor-plan" : orderCenterGateId(storeInformationGateId(child.id))));
      if (!children.length) return null;
      return { ...module, children };
    })
    .filter((module): module is NavModule => module != null);
}

export function isPathAllowedBySubscription(path: string): boolean {
  path = path.split("?")[0] ?? path;
  if (isStoreInformationPage(path)) path = "/stores/settings";
  if (path === "/nav-home" || path === "/login" || path.startsWith("/login/") || path === "/onboarding" || path.startsWith("/onboarding/")) return true;
  if (hasCommercialRoute(path)) return true;
  const routeIds = currentRouteIds();
  if (!routeIds) return true;
  const candidates = getSubscriptionRouteCatalog(NAV_MODULES)
    .filter((node) => path === node.path || path.startsWith(`${node.path}/`))
    .sort((a, b) => b.path.length - a.path.length);
  if (!candidates.length) return true;
  const id = candidates[0]!.id;
  return routeIds.has(id === "qc-tables" ? "qc-floor-plan" : orderCenterGateId(storeInformationGateId(id)));
}

function hasCommercialRoute(path:string):boolean {
  const {snapshot,catalog}=serviceEntitlementData();
  if(!snapshot.packages.some(p=>p.commercial))return false;
  if(matchServicePackages(snapshot,catalog,path).length)return true;
  return (snapshot.protectedRoutes??[]).some(r=>r.path.startsWith(path.replace(/\/$/,'')+'/')&&snapshot.packages.some(p=>p.id===r.packageId&&p.commercial));
}
