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
import { installPublishedPaidMenuPathReader } from "./enterprise-merchant-services";
import { NAV_MODULES, type NavItem, type NavModule } from "./navigation";
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
      const retain = (child: NavItem): NavItem[] => {
        if (!isPaidMenuVisible(child.path)) return [];
        const routeId = child.id === "qc-tables" ? "qc-floor-plan" : orderCenterGateId(storeInformationGateId(child.id));
        if (hasCommercialRoute(child.path) || isMenuVisibleToAllMerchants(child.path) || routeIds.has(routeId)) return [child];
        const children = child.children?.flatMap(retain);
        return children?.length ? [{ ...child, children }] : [];
      };
      const children = module.children.flatMap(retain);
      if (!children.length) return null;
      return { ...module, children };
    })
    .filter((module): module is NavModule => module != null);
}

export function matchingPaidMenus(rawPath: string) {
  const path = rawPath.split("?")[0]?.replace(/\/$/, "");
  const { catalog } = serviceEntitlementData();
  return catalog.filter(node => {
    const menuPath = node.path.replace(/\/$/, "");
    return node.paidMenu && (path === menuPath || path?.startsWith(menuPath + "/"));
  });
}

export function publishedPaidServicesForMenu(menuId: string) {
  const { snapshot } = serviceEntitlementData();
  return snapshot.packages.filter(pkg => pkg.status === "published" && pkg.commercial?.chargeType === "paid" &&
    snapshot.releases.some(release => release.id === pkg.activeReleaseId && release.packageId === pkg.id && release.routeNodeIds.includes(menuId)));
}

installPublishedPaidMenuPathReader(() => new Set(serviceEntitlementData().catalog
  .filter(node => node.paidMenu && publishedPaidServicesForMenu(node.id).length)
  .map(node => node.path)));

export function isPaidMenuVisible(path: string): boolean {
  return matchingPaidMenus(path).every(node => publishedPaidServicesForMenu(node.id).length > 0);
}

export function isMenuVisibleToAllMerchants(rawPath: string): boolean {
  const path = rawPath.split("?")[0]?.replace(/\/$/, "");
  return serviceEntitlementData().catalog.some(node => node.visibleToAllMerchants === true && node.path.replace(/\/$/, "") === path);
}

export function isPathAllowedBySubscription(path: string): boolean {
  if (!isPaidMenuVisible(path)) return false;
  if (isMenuVisibleToAllMerchants(path)) return true;
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
