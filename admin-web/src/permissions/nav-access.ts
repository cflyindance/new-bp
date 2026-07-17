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
import {
  isMvpProductVersion,
  MVP_BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS,
  MVP_GLOBAL_HIDDEN_NAV_MODULE_IDS,
  MVP_GROUP_HQ_HIDDEN_NAV_MODULE_IDS,
  MVP_HIDDEN_SETTINGS_NAV_CHILD_IDS,
} from "../config/product-version";

function getSessionModuleEnabled(): Record<string, boolean> | null {
  const ctx = getUserSessionContext();
  if (!ctx) return null;

  const merged: Record<string, boolean> = {};
  for (const g of buildPermissionModuleGroups()) {
    merged[g.moduleKey] = ctx.permissionSnapshot[g.moduleKey]?.enabled === true;
  }
  return merged;
}

/** MVP 版本下按规则隐藏的一级导航（仅隐藏，不删除配置） */
export function isMvpHiddenNavModule(moduleId: string): boolean {
  if (!isMvpProductVersion()) return false;
  if ((MVP_GLOBAL_HIDDEN_NAV_MODULE_IDS as readonly string[]).includes(moduleId)) {
    return true;
  }
  if (readSidebarNavLayoutPreset() !== "chain") return false;
  if (
    isGroupHqDataPerspective() &&
    (MVP_GROUP_HQ_HIDDEN_NAV_MODULE_IDS as readonly string[]).includes(moduleId)
  ) {
    return true;
  }
  if (
    isBrandDataPerspective() &&
    (MVP_BRAND_PERSPECTIVE_HIDDEN_NAV_MODULE_IDS as readonly string[]).includes(moduleId)
  ) {
    return true;
  }
  return false;
}

/** MVP 版本下系统设置内隐藏的二级导航项 */
export function isMvpHiddenSettingsNavChild(childId: string): boolean {
  return (
    isMvpProductVersion() &&
    (MVP_HIDDEN_SETTINGS_NAV_CHILD_IDS as readonly string[]).includes(childId)
  );
}

export function filterNavModuleChildrenForMvp(module: NavModule): NavModule {
  if (!isMvpProductVersion() || module.id !== "settings" || module.children.length === 0) {
    return module;
  }
  const children = module.children.filter((c) => !isMvpHiddenSettingsNavChild(c.id));
  if (children.length === module.children.length) return module;
  return { ...module, children };
}

/** 侧栏展示用：过滤 MVP 隐藏的一级模块，并裁剪系统设置子导航 */
export function applyMvpNavPresentationFilters(modules: NavModule[]): NavModule[] {
  return modules.filter((m) => !isMvpHiddenNavModule(m.id)).map(filterNavModuleChildrenForMvp);
}

/** @deprecated 使用 isMvpHiddenNavModule */
export function isMvpGroupHqHiddenNavModule(moduleId: string): boolean {
  return isMvpHiddenNavModule(moduleId);
}

export function isNavModuleVisible(moduleId: string): boolean {
  if (isMvpHiddenNavModule(moduleId)) return false;
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
  if (readSidebarNavLayoutPreset() === "chain" && isGroupHqDataPerspective() && !isMvpProductVersion()) {
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
  if (readSidebarNavLayoutPreset() === "chain" && isBrandDataPerspective() && !isMvpProductVersion()) {
    if (!visible.some((m) => m.id === "brand-store-list")) {
      const storeList = NAV_MODULES.find((m) => m.id === "brand-store-list");
      if (storeList) visible = [storeList, ...visible];
    }
  }
  return applyMvpNavPresentationFilters(visible);
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

const RBAC_STORE_LIST_MODULE_IDS = ["group-store-list", "brand-store-list"] as const;

/** 四级矩阵编辑页（RBAC / 平台预设）：按视角过滤一级导航，避免「门店管理」等重复项 */
export function filterMatrixNavModuleGroups<T extends { moduleId: string }>(groups: T[]): T[] {
  const filtered = groups.filter((g) => isRbacMatrixNavModuleVisible(g.moduleId));
  const storeListModules = filtered.filter((g) =>
    (RBAC_STORE_LIST_MODULE_IDS as readonly string[]).includes(g.moduleId),
  );
  if (storeListModules.length <= 1) return filtered;

  const preferredId =
    isChainScopeMode() && isBrandDataPerspective()
      ? "brand-store-list"
      : isChainScopeMode() && isGroupHqDataPerspective()
        ? "group-store-list"
        : storeListModules[0]!.moduleId;

  return filtered.filter(
    (g) =>
      !(RBAC_STORE_LIST_MODULE_IDS as readonly string[]).includes(g.moduleId) ||
      g.moduleId === preferredId,
  );
}

export function filterRbacPermissionModuleGroups(
  groups: PermissionModuleGroup[],
): PermissionModuleGroup[] {
  return filterMatrixNavModuleGroups(groups);
}

export function getRbacNavVisibilityCacheKey(): string {
  return `${readSidebarNavLayoutPreset()}:${resolveChainDataPerspective()}:${getAccountOrgTier()}`;
}
