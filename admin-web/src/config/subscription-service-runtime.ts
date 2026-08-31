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
  getEffectiveSubscriptionRoutes,
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
  return getEffectiveSubscriptionRoutes(context);
}

export function filterNavModulesBySubscription(modules: NavModule[]): NavModule[] {
  const routeIds = currentRouteIds();
  if (!routeIds) return modules;
  return modules
    .map((module) => {
      const children = module.children.filter((child) => routeIds.has(child.id));
      if (!children.length) return null;
      return { ...module, children };
    })
    .filter((module): module is NavModule => module != null);
}

export function isPathAllowedBySubscription(path: string): boolean {
  if (path === "/nav-home" || path === "/login" || path.startsWith("/login/") || path === "/onboarding" || path.startsWith("/onboarding/")) return true;
  const routeIds = currentRouteIds();
  if (!routeIds) return true;
  const candidates = getSubscriptionRouteCatalog(NAV_MODULES)
    .filter((node) => path === node.path || path.startsWith(`${node.path}/`))
    .sort((a, b) => b.path.length - a.path.length);
  if (!candidates.length) return true;
  return routeIds.has(candidates[0]!.id);
}
