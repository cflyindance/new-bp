/**
 * 设置 catalog 按租户功能画像过滤（P1）
 */
import {
  getModuleSettingsBasePath,
  getModuleSettingsCatalog,
  listAllModuleSettingCatalogEntries,
  type ModuleSettingCatalogHub,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";
import {
  isCatalogSettingExcluded,
  resolveSettingsL2ByBasePath,
} from "./feature-presets-settings-tree";
import { getFeatureSeqScope } from "./feature-seq-scope";
import { NAV_MODULES } from "./navigation";
import {
  collectL2Excludes,
  isModuleVisible,
  isProfileFilteringActive,
  profileToInput,
  resolveVisibilityContext,
} from "./feature-visibility";
import { loadTenantProfile, type TenantProfile } from "./tenant-profile-storage";
import type { ProductLineTag } from "./feature-registry";

/** 引导完成后设置 catalog 与导航同步按租户画像过滤 */
function shouldFilterSettingsCatalog(profile: TenantProfile): boolean {
  return isProfileFilteringActive(profile);
}

/** settingsPath → 一级 moduleId */
const SETTINGS_PATH_TO_MODULE: Record<string, string> = {
  "/device-management/settings": "device-management",
  "/finance/settings": "finance-center",
  "/gift-cards/settings": "gift-cards",
  "/operations/inventory-ordering/settings": "inventory-ordering",
  "/operations/kitchen-kds/settings": "kitchen-kds",
  "/operations/kitchen-kds/display": "kitchen-kds",
  "/operations/kitchen-kds/workflow": "kitchen-kds",
  "/operations/queue-call/settings": "queue-call",
  "/operations/reservations/settings": "reservations",
  "/operations/waitlist/settings": "waitlist",
  "/brand/settings": "brand-mgmt",
  "/stores/settings": "store-mgmt",
  "/dashboard/settings": "dashboard",
  "/team/settings": "team",
  "/transactions/settings": "transactions",
  "/orders/settings": "orders",
  "/marketing/settings": "marketing",
  "/promotions/settings": "promotions",
  "/members/settings": "members",
  "/reviews/settings": "reviews",
  "/reports/settings": "reports-finance",
  "/print-templates/settings": "print-templates",
  "/notifications/settings": "notifications",
  "/permissions/settings": "permission-mgmt",
  "/asset-center/settings": "asset-center",
  "/settings/locale-display": "settings",
  "/settings/data-backup": "settings",
  "/settings/connections": "settings",
  "/settings/advanced": "settings",
};

function resolveModuleIdForSettingsBase(settingsPath: string): string | undefined {
  const direct = SETTINGS_PATH_TO_MODULE[settingsPath];
  if (direct) return direct;
  for (const mod of NAV_MODULES) {
    for (const child of mod.children) {
      if (child.path === settingsPath) return mod.id;
    }
  }
  return undefined;
}

function isSettingSeqVisibleForProfile(seq: number, profile: TenantProfile, settingsPath: string): boolean {
  const lines = new Set(profile.productLines);
  const scope = getFeatureSeqScope(seq);

  if (!scope) return true;
  if (scope.settingsPath && scope.settingsPath !== settingsPath) return true;
  if (scope.lines.length === 0) return true;

  return scope.lines.some((line) => lines.has(line));
}

function filterCatalogItems(
  items: ModuleSettingCatalogItem[],
  profile: TenantProfile,
  settingsPath: string,
): ModuleSettingCatalogItem[] {
  return items.filter((item) => isSettingSeqVisible(item.seq, settingsPath, profile));
}

export function getVisibleModuleSettingsCatalog(path: string, profile?: TenantProfile | null): ModuleSettingCatalogHub | undefined {
  const catalog = getModuleSettingsCatalog(path);
  if (!catalog) return undefined;

  const p = profile ?? loadTenantProfile();
  if (!p || !shouldFilterSettingsCatalog(p)) return catalog;

  const base = getModuleSettingsBasePath(path) ?? catalog.settingsPath;
  const moduleId = resolveModuleIdForSettingsBase(base);
  if (moduleId && !isModuleVisible(moduleId, p)) {
    return { ...catalog, items: [] };
  }

  const items = filterCatalogItems(catalog.items, p, base);
  return { ...catalog, items };
}

/** L4：单条设置 seq 是否对当前租户可见 */
export function isSettingSeqVisible(seq: number, settingsPath: string, profile?: TenantProfile | null): boolean {
  const p = profile ?? loadTenantProfile();
  if (!p || !shouldFilterSettingsCatalog(p)) return true;
  const moduleId = resolveModuleIdForSettingsBase(settingsPath);
  if (moduleId && !isModuleVisible(moduleId, p)) return false;

  const base = settingsPath;
  const l2Ref = resolveSettingsL2ByBasePath(base);
  if (l2Ref) {
    const ctx = resolveVisibilityContext(p);
    const presetWhitelist = { l2Includes: ctx.l2Includes, subtreeWhitelistMode: ctx.subtreeWhitelistMode };
    if (collectL2Excludes(profileToInput(p), presetWhitelist).has(l2Ref.l2FeatureId)) return false;
    if (!ctx.l2.has(l2Ref.l2FeatureId)) return false;
    const catalog = getModuleSettingsCatalog(base);
    const item = catalog?.items.find((i) => i.seq === seq);
    if (item && isCatalogSettingExcluded(item, base, ctx.l3Excludes, ctx.l3Includes, ctx.subtreeWhitelistMode, l2Ref.l2FeatureId, moduleId)) {
      return false;
    }
  }

  return isSettingSeqVisibleForProfile(seq, p, settingsPath);
}

/** AI 搜索 / 全局检索：仅返回可见 catalog 条目（L4 过滤） */
export function listVisibleModuleSettingCatalogEntries(profile?: TenantProfile | null): Array<{
  hubTitle: string;
  settingsPath: string;
  item: ModuleSettingCatalogItem;
}> {
  const p = profile ?? loadTenantProfile();
  if (!p || !shouldFilterSettingsCatalog(p)) {
    return listAllModuleSettingCatalogEntries();
  }
  return listAllModuleSettingCatalogEntries().filter((row) =>
    isSettingSeqVisible(row.item.seq, row.settingsPath, p),
  );
}

export function getSettingsPathModuleId(settingsPath: string): string | undefined {
  return resolveModuleIdForSettingsBase(settingsPath);
}
