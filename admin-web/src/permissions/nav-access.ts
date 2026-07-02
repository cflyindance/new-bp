/**
 * 当前登录用户的侧栏一级模块可见性（RBAC 会话快照 + 组织层级）。
 * 切门店只改数据 scope，不重算 permissionSnapshot。
 */
import { getUserSessionContext } from "../auth/session-permissions";
import {
  getAccountOrgTier,
  isBrandPerspectiveOnlyNavModule,
  isChainScopeMode,
  isGroupHqPerspectiveOnlyNavModule,
  isPerspectiveHiddenNavModule,
  isStoreTierHiddenNavModule,
} from "../auth/session-scope";
import {
  isBrandDataPerspective,
  isGroupHqDataPerspective,
  resolveChainDataPerspective,
} from "../auth/merchant-scope-context";
import { buildPermissionModuleGroups, type PermissionModuleGroup } from "../config/permission-registry";
import { NAV_MODULES, type NavModule } from "../config/navigation";
import { readSidebarNavLayoutPreset } from "../config/sidebar-nav-order";

function getSessionModuleEnabled(): Record<string, boolean> | null {
  const ctx = getUserSessionContext();
  if (!ctx) return null;

  const merged: Record<string, boolean> = {};
  for (const g of buildPermissionModuleGroups()) {
    merged[g.moduleKey] = ctx.permissionSnapshot[g.moduleKey]?.enabled === true;
  }
  return merged;
}

export function isNavModuleVisible(moduleId: string): boolean {
  if (isBrandPerspectiveOnlyNavModule(moduleId)) {
    return isChainScopeMode() && isBrandDataPerspective();
  }
  if (isGroupHqPerspectiveOnlyNavModule(moduleId)) {
    return isChainScopeMode() && isGroupHqDataPerspective();
  }
  if (isPerspectiveHiddenNavModule(moduleId)) return false;

  const enabledMap = getSessionModuleEnabled();
  if (!enabledMap) return true;

  return enabledMap[moduleId] === true;
}

export function filterVisibleNavModules(modules: NavModule[]): NavModule[] {
  let visible = modules.filter((m) => isNavModuleVisible(m.id));
  if (readSidebarNavLayoutPreset() === "chain" && isGroupHqDataPerspective()) {
    const extras: NavModule[] = [];
    if (!visible.some((m) => m.id === "brand-mgmt")) {
      const brand = NAV_MODULES.find((m) => m.id === "brand-mgmt");
      if (brand) extras.push(brand);
    }
    if (!visible.some((m) => m.id === "group-store-list")) {
      const groupStores = NAV_MODULES.find((m) => m.id === "group-store-list");
      if (groupStores) extras.push(groupStores);
    }
    if (extras.length) {
      const extraIds = new Set(extras.map((m) => m.id));
      visible = [...extras, ...visible.filter((m) => !extraIds.has(m.id))];
    }
  }
  if (readSidebarNavLayoutPreset() === "chain" && isBrandDataPerspective()) {
    if (!visible.some((m) => m.id === "brand-store-list")) {
      const storeList = NAV_MODULES.find((m) => m.id === "brand-store-list");
      if (storeList) visible = [storeList, ...visible];
    }
  }
  return visible;
}

/** RBAC 角色矩阵：一级导航可见性（与侧栏视角规则一致，不按当前角色快照过滤） */
export function isRbacMatrixNavModuleVisible(moduleId: string): boolean {
  if (isBrandPerspectiveOnlyNavModule(moduleId)) {
    return isChainScopeMode() && isBrandDataPerspective();
  }
  if (isGroupHqPerspectiveOnlyNavModule(moduleId)) {
    return isChainScopeMode() && isGroupHqDataPerspective();
  }
  if (isPerspectiveHiddenNavModule(moduleId)) return false;
  if (isStoreTierHiddenNavModule(moduleId)) return false;
  return true;
}

export function filterRbacPermissionModuleGroups(
  groups: PermissionModuleGroup[],
): PermissionModuleGroup[] {
  return groups.filter((g) => isRbacMatrixNavModuleVisible(g.moduleId));
}

export function getRbacNavVisibilityCacheKey(): string {
  return `${readSidebarNavLayoutPreset()}:${resolveChainDataPerspective()}:${getAccountOrgTier()}`;
}
