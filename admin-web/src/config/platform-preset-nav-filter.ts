/**
 * 平台预设 · 侧栏 L1 / 滑层 L2 运行时过滤
 */
import {
  NAV_MODULES,
  navModuleChildrenAsSheetSubnav,
  type NavItem,
  type NavModule,
  type ProductCenterSidebarSubItem,
} from "./navigation";
import { APP_NAV_HOME_PATH, isNavHomePath } from "./app-routes";
import { readPlatformPresetContext } from "./platform-preset-context";
import { readSidebarNavLayoutPreset } from "./sidebar-nav-order";
import { isBrandDataPerspective, isGroupHqDataPerspective } from "../auth/merchant-scope-context";
import { applyMvpNavPresentationFilters, isMvpHiddenSettingsNavChild } from "../permissions/nav-access";
import { isMvpProductVersion } from "./product-version";
import { getModuleSettingsCatalog } from "./module-settings-catalog";
import { isModuleSettingsPathAllowedByPreset } from "./platform-preset-settings-filter";
import { getRuntimePresetSelection } from "./platform-preset-runtime-cache";
import { filterNavModulesBySubscription, isPathAllowedBySubscription } from "./subscription-service-runtime";

export function l2PresetKey(moduleId: string, featureId: string): string {
  return `${moduleId}:${featureId}`;
}

function getActiveSelection(): Record<string, { enabled: boolean; display?: boolean }> | null {
  return getRuntimePresetSelection();
}

export function isPlatformPresetNavFilterActive(): boolean {
  return readPlatformPresetContext() != null;
}

export function isPresetL1Enabled(moduleId: string): boolean {
  const selection = getActiveSelection();
  if (!selection) return true;
  return selection[moduleId]?.enabled === true;
}

export function isPresetL2Enabled(moduleId: string, featureId: string): boolean {
  const selection = getActiveSelection();
  if (!selection) return true;
  if (!selection[moduleId]?.enabled) return false;
  return selection[l2PresetKey(moduleId, featureId)]?.enabled === true;
}

function isPresetL1EnabledInSelection(
  selection: Record<string, { enabled: boolean; display?: boolean }>,
  moduleId: string,
): boolean {
  return selection[moduleId]?.enabled === true;
}

function isPresetL2EnabledInSelection(
  selection: Record<string, { enabled: boolean; display?: boolean }>,
  moduleId: string,
  featureId: string,
): boolean {
  if (!selection[moduleId]?.enabled) return false;
  return selection[l2PresetKey(moduleId, featureId)]?.enabled === true;
}

export function filterNavModuleByPlatformPreset(m: NavModule): NavModule | null {
  if (!isPlatformPresetNavFilterActive()) return m;
  if (!isPresetL1Enabled(m.id)) return null;

  const children = m.children.filter((c) => isPresetL2Enabled(m.id, c.id));
  if (children.length === 0 && (m.subNavPlacement === "sheet" || m.subNavPlacement === "sidebar")) {
    return null;
  }
  return { ...m, children };
}

export function filterNavModulesByPlatformPreset(modules: NavModule[]): NavModule[] {
  const selection = getActiveSelection();
  if (!selection) return filterNavModulesBySubscription(applyMvpNavPresentationFilters(modules));
  let filtered = modules
    .map((m) => {
      if (!isPresetL1EnabledInSelection(selection, m.id)) return null;
      const children = m.children.filter((c) => isPresetL2EnabledInSelection(selection, m.id, c.id));
      if (children.length === 0 && (m.subNavPlacement === "sheet" || m.subNavPlacement === "sidebar")) {
        return null;
      }
      return { ...m, children };
    })
    .filter((m): m is NavModule => m != null);
  if (readSidebarNavLayoutPreset() === "chain" && isGroupHqDataPerspective() && !isMvpProductVersion()) {
    const extras: NavModule[] = [];
    if (!filtered.some((m) => m.id === "brand-mgmt")) {
      const brand = NAV_MODULES.find((m) => m.id === "brand-mgmt");
      if (brand) extras.push(brand);
    }
    if (!filtered.some((m) => m.id === "group-store-list")) {
      const groupStores = NAV_MODULES.find((m) => m.id === "group-store-list");
      if (groupStores) extras.push(groupStores);
    }
    if (extras.length) {
      const extraIds = new Set(extras.map((m) => m.id));
      filtered = [...extras, ...filtered.filter((m) => !extraIds.has(m.id))];
    }
  }
  if (readSidebarNavLayoutPreset() === "chain" && isBrandDataPerspective() && !isMvpProductVersion()) {
    if (!filtered.some((m) => m.id === "brand-store-list")) {
      const storeList = NAV_MODULES.find((m) => m.id === "brand-store-list");
      if (storeList) filtered = [storeList, ...filtered];
    }
  }
  return filterNavModulesBySubscription(applyMvpNavPresentationFilters(filtered));
}

export function filterSheetSubnavByPlatformPreset(
  moduleId: string,
  items: ProductCenterSidebarSubItem[],
): ProductCenterSidebarSubItem[] {
  const selection = getActiveSelection();
  if (!selection) return items;
  return items.filter((item) => isPresetL2EnabledInSelection(selection, moduleId, item.id));
}

export function filterNavItemsByPlatformPreset(moduleId: string, items: NavItem[]): NavItem[] {
  if (!isPlatformPresetNavFilterActive()) return items;
  return items.filter((item) => isPresetL2Enabled(moduleId, item.id));
}

function pathBelongsToModule(path: string, m: NavModule): boolean {
  const prefixes = m.matchPrefixes?.length ? m.matchPrefixes : [m.path];
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

function findMatchingL2Child(m: NavModule, path: string): NavItem | undefined {
  const sorted = [...m.children].sort((a, b) => b.path.length - a.path.length);
  for (const c of sorted) {
    if (path === c.path || path.startsWith(`${c.path}/`)) return c;
  }
  if (m.id === "product-center-main") {
    for (const c of sorted) {
      if (c.id === "pcm-brand-products" && path.startsWith("/brand-products")) return c;
      if (c.id === "pcm-brand-menu" && path.startsWith("/brand-menu")) return c;
      if (c.id === "pcm-store-mgmt" && (path.startsWith("/menu") || path === "/menu")) return c;
    }
  }
  return undefined;
}

/** 当前路由是否被平台预设允许（L1 + 可识别 L2） */
export function isPathAllowedByPlatformPreset(path: string): boolean {
  if (!isPathAllowedBySubscription(path)) return false;
  if (!isPlatformPresetNavFilterActive()) return true;
  if (isNavHomePath(path)) return true;
  if (path.startsWith("/settings/platform-preset")) return true;
  if (path === "/login" || path.startsWith("/login/")) return true;
  if (path === "/onboarding" || path.startsWith("/onboarding/")) return true;
  if ((path === "/brand/overview" || path === "/brand/list") && readSidebarNavLayoutPreset() === "chain" && isGroupHqDataPerspective()) {
    return true;
  }
  if (
    (path === "/group-stores/list" || path === "/group-stores/overview" || path.startsWith("/group-stores/")) &&
    readSidebarNavLayoutPreset() === "chain" &&
    isGroupHqDataPerspective()
  ) {
    return true;
  }
  if (
    (path === "/brand-stores/list" || path === "/brand-stores/overview" || path.startsWith("/brand-stores/")) &&
    readSidebarNavLayoutPreset() === "chain" &&
    isBrandDataPerspective()
  ) {
    return true;
  }

  const catalog = getModuleSettingsCatalog(path);
  if (catalog && !isModuleSettingsPathAllowedByPreset(path, catalog)) return false;

  const selection = getActiveSelection();
  if (!selection) return true;

  for (const m of NAV_MODULES) {
    if (!pathBelongsToModule(path, m)) continue;
    if (!isPresetL1EnabledInSelection(selection, m.id)) return false;
    const child = findMatchingL2Child(m, path);
    if (child && !isPresetL2EnabledInSelection(selection, m.id, child.id)) return false;
    return true;
  }
  return true;
}

export function getFirstAllowedNavPath(): string {
  return APP_NAV_HOME_PATH;
}

/** 滑层子导航（与 navModuleChildrenAsSheetSubnav 一致并过滤） */
export function getFilteredNavModuleSheetSubnav(m: NavModule): ProductCenterSidebarSubItem[] {
  let items = filterSheetSubnavByPlatformPreset(m.id, navModuleChildrenAsSheetSubnav(m));
  if (m.id === "settings") {
    items = items.filter((item) => !isMvpHiddenSettingsNavChild(item.id));
  }
  return items;
}
