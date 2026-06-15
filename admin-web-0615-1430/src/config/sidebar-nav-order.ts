import { NAV_MODULES, type NavModule } from "./navigation";

export type SidebarNavSortMode = "system" | "custom";
export type SidebarNavLayoutPreset = "store" | "chain";

export const SIDEBAR_NAV_SORT_MODE_KEY = "sidebar-nav-sort-mode-v1";
export const SIDEBAR_NAV_CUSTOM_ORDER_KEY = "sidebar-nav-custom-order-v1";
export const SIDEBAR_NAV_MORE_EXPANDED_KEY = "sidebar-nav-more-expanded-v1";
export const SIDEBAR_NAV_LAYOUT_PRESET_KEY = "sidebar-nav-layout-preset-v1";
export const SIDEBAR_NAV_LAYOUT_PRESET_MANUAL_KEY = "sidebar-nav-layout-preset-manual-v1";

/**
 * 门店版：面向单店店长/值班经理，配置与平台类模块收入「更多」。
 * 详见 docs/侧栏导航布局-门店版与连锁版.md
 */
export const STORE_SIDEBAR_MORE_MODULE_IDS: readonly string[] = [
  "orders",
  "transactions",
  "marketing",
  "gift-cards",
  "inventory-ordering",
  "print-templates",
  "notifications",
  "device-management",
  "permission-mgmt",
  "asset-center",
  "log-management",
  "settings",
  "capital-turnover",
];

/**
 * 连锁版：权限、库存提升为 dominant 导航；其余配置类仍在「更多」。
 */
export const CHAIN_SIDEBAR_MORE_MODULE_IDS: readonly string[] = [
  "orders",
  "transactions",
  "marketing",
  "gift-cards",
  "print-templates",
  "notifications",
  "device-management",
  "asset-center",
  "log-management",
  "settings",
  "capital-turnover",
];

/** @deprecated 使用 getSidebarMoreModuleIds()；保留别名指向门店版列表 */
export const DEFAULT_SIDEBAR_MORE_MODULE_IDS = STORE_SIDEBAR_MORE_MODULE_IDS;

export function readSidebarNavLayoutPreset(): SidebarNavLayoutPreset {
  try {
    const v = localStorage.getItem(SIDEBAR_NAV_LAYOUT_PRESET_KEY);
    return v === "chain" ? "chain" : "store";
  } catch {
    return "store";
  }
}

export function writeSidebarNavLayoutPreset(preset: SidebarNavLayoutPreset): void {
  try {
    localStorage.setItem(SIDEBAR_NAV_LAYOUT_PRESET_KEY, preset);
  } catch {
    /* ignore */
  }
}

export function markSidebarNavLayoutPresetManual(): void {
  try {
    localStorage.setItem(SIDEBAR_NAV_LAYOUT_PRESET_MANUAL_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function applyDefaultLayoutPresetForOrgTier(tier: "store" | "chain"): void {
  try {
    if (localStorage.getItem(SIDEBAR_NAV_LAYOUT_PRESET_MANUAL_KEY) === "1") return;
  } catch {
    /* ignore */
  }
  writeSidebarNavLayoutPreset(tier === "chain" ? "chain" : "store");
}

export function getSidebarMoreModuleIds(preset: SidebarNavLayoutPreset = readSidebarNavLayoutPreset()): readonly string[] {
  return preset === "chain" ? CHAIN_SIDEBAR_MORE_MODULE_IDS : STORE_SIDEBAR_MORE_MODULE_IDS;
}

export function isSidebarMoreModule(moduleId: string, preset: SidebarNavLayoutPreset = readSidebarNavLayoutPreset()): boolean {
  return getSidebarMoreModuleIds(preset).includes(moduleId);
}

/** @deprecated 使用 isSidebarMoreModule */
export function isDefaultSidebarMoreModule(moduleId: string): boolean {
  return isSidebarMoreModule(moduleId);
}

export function splitSidebarNavModules(
  modules: NavModule[],
  preset: SidebarNavLayoutPreset = readSidebarNavLayoutPreset(),
): { primary: NavModule[]; more: NavModule[] } {
  const moreSet = new Set(getSidebarMoreModuleIds(preset));
  const primary: NavModule[] = [];
  const more: NavModule[] = [];
  for (const m of modules) {
    if (moreSet.has(m.id)) more.push(m);
    else primary.push(m);
  }
  return { primary, more };
}

export function readSidebarMoreExpandedExplicit(): boolean | null {
  try {
    const v = sessionStorage.getItem(SIDEBAR_NAV_MORE_EXPANDED_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeSidebarMoreExpanded(expanded: boolean): void {
  try {
    sessionStorage.setItem(SIDEBAR_NAV_MORE_EXPANDED_KEY, expanded ? "true" : "false");
  } catch {
    /* ignore */
  }
}

export function getDefaultNavModuleIds(): string[] {
  return NAV_MODULES.map((m) => m.id);
}

function mergeNavModuleOrder(savedIds: string[]): string[] {
  const allIds = getDefaultNavModuleIds();
  const known = new Set(allIds);
  const ordered: string[] = [];
  for (const id of savedIds) {
    if (known.has(id) && !ordered.includes(id)) ordered.push(id);
  }
  for (const id of allIds) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}

export function readSidebarNavSortMode(): SidebarNavSortMode {
  try {
    const v = localStorage.getItem(SIDEBAR_NAV_SORT_MODE_KEY);
    return v === "custom" ? "custom" : "system";
  } catch {
    return "system";
  }
}

export function writeSidebarNavSortMode(mode: SidebarNavSortMode): void {
  try {
    localStorage.setItem(SIDEBAR_NAV_SORT_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function hasSavedCustomNavModuleOrder(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_NAV_CUSTOM_ORDER_KEY) != null;
  } catch {
    return false;
  }
}

export function readCustomNavModuleOrder(): string[] {
  try {
    const raw = localStorage.getItem(SIDEBAR_NAV_CUSTOM_ORDER_KEY);
    if (raw == null) return getDefaultNavModuleIds();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultNavModuleIds();
    return mergeNavModuleOrder(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return getDefaultNavModuleIds();
  }
}

export function writeCustomNavModuleOrder(ids: string[]): void {
  try {
    localStorage.setItem(SIDEBAR_NAV_CUSTOM_ORDER_KEY, JSON.stringify(mergeNavModuleOrder(ids)));
  } catch {
    /* ignore */
  }
}

export function getSidebarOrderedNavModules(): NavModule[] {
  if (readSidebarNavSortMode() === "system") return NAV_MODULES;
  const byId = Object.fromEntries(NAV_MODULES.map((m) => [m.id, m]));
  return readCustomNavModuleOrder()
    .map((id) => byId[id])
    .filter((m): m is NavModule => m != null);
}
