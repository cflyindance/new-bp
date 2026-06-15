/**
 * 平台预设树 — 模块「设置」二级入口 → catalog 分组 → 设置项（L3/L4）
 */
import { ALWAYS_VISIBLE_NAV_L1 } from "./feature-registry";
import {
  getModuleSettingsBasePath,
  getModuleSettingsCatalog,
  getModuleSettingsCategoryPath,
  getModuleSettingsItemHref,
  groupCatalogItemsByCategory,
  MODULE_SETTINGS_BY_PATH,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";
import { NAV_MODULES, type ProductCenterSidebarSubItem } from "./navigation";
export interface SettingsPathHit {
  moduleId: string;
  l2FeatureId: string;
  itemId: string;
  l4Path?: string;
}

export interface SettingsL2Ref {
  moduleId: string;
  l2FeatureId: string;
  settingsPath: string;
}

const SETTINGS_BASE_TO_L2 = new Map<string, SettingsL2Ref>();

function indexSettingsL2Refs(): void {
  if (SETTINGS_BASE_TO_L2.size > 0) return;
  for (const mod of NAV_MODULES) {
    for (const child of mod.children) {
      if (!shouldUseSettingsCatalogTree(mod.id, child.id)) continue;
      const catalog = getModuleSettingsCatalog(child.path);
      if (!catalog?.items.length) continue;
      const base = getModuleSettingsBasePath(child.path) ?? catalog.settingsPath;
      SETTINGS_BASE_TO_L2.set(base, {
        moduleId: mod.id,
        l2FeatureId: child.id,
        settingsPath: base,
      });
    }
  }
}

export function resolveSettingsL2ByBasePath(settingsPath: string): SettingsL2Ref | undefined {
  indexSettingsL2Refs();
  return SETTINGS_BASE_TO_L2.get(settingsPath);
}

export function presetSettingsGroupId(l2FeatureId: string, groupKey: string): string {
  return `set-grp:${l2FeatureId}:${groupKey}`;
}

export function presetSettingsItemId(seq: number): string {
  return `set:${seq}`;
}

/** 将 module-settings catalog 转为预设树三级 subnav（分组 + 叶子链接） */
export function buildSettingsCatalogAsTertiary(
  l2FeatureId: string,
  l2Path: string,
): ProductCenterSidebarSubItem[] | null {
  const catalog = getModuleSettingsCatalog(l2Path);
  if (!catalog?.items.length) return null;

  const settingsPath = catalog.settingsPath;
  const groups = groupCatalogItemsByCategory(catalog.items, catalog.groupOrder);

  return groups.map((group) => ({
    id: presetSettingsGroupId(l2FeatureId, group.groupKey),
    title: group.groupTitle,
    path: getModuleSettingsCategoryPath(settingsPath, group.groupKey),
    activePrefix: getModuleSettingsCategoryPath(settingsPath, group.groupKey),
    sidebarChildren: group.items.map((item) => ({
      title: item.title,
      path: getModuleSettingsItemHref(settingsPath, item),
    })),
  }));
}

function isSettingsLikeL2(
  moduleId: string,
  l2FeatureId: string,
): { path: string } | null {
  const mod = NAV_MODULES.find((m) => m.id === moduleId);
  const child = mod?.children.find((c) => c.id === l2FeatureId);
  if (!child) return null;
  if (moduleId === "settings") return { path: child.path };
  const en = child.titleEn?.toLowerCase() ?? "";
  const isSettings =
    child.title.includes("设置") ||
    en.includes("setting") ||
    child.id.endsWith("-settings") ||
    child.path.includes("/settings");
  return isSettings ? { path: child.path } : null;
}

export function shouldUseSettingsCatalogTree(moduleId: string, l2FeatureId: string): boolean {
  const mod = NAV_MODULES.find((m) => m.id === moduleId);
  const child = mod?.children.find((c) => c.id === l2FeatureId);
  if (!child) return false;
  return Boolean(getModuleSettingsCatalog(child.path)?.items.length);
}

export function isSettingsCatalogL2Path(l2Path: string): boolean {
  return Boolean(getModuleSettingsCatalog(l2Path)?.items.length);
}

export function resolveSettingsCatalogPathHit(path: string): SettingsPathHit | null {
  const hashIdx = path.indexOf("#");
  const pathPart = hashIdx >= 0 ? path.slice(0, hashIdx) : path;
  const hash = hashIdx >= 0 ? path.slice(hashIdx + 1) : "";

  const base = getModuleSettingsBasePath(pathPart);
  if (!base) return null;

  const l2Ref = resolveSettingsL2ByBasePath(base);
  if (!l2Ref) return null;

  const catalog = getModuleSettingsCatalog(base);
  if (!catalog?.items.length) return null;

  const groups = groupCatalogItemsByCategory(catalog.items, catalog.groupOrder);
  const rel = pathPart.slice(base.length).replace(/^\//, "");

  let matchedGroup = groups.find(
    (g) => getModuleSettingsCategoryPath(base, g.groupKey) === pathPart,
  );

  if (!matchedGroup && rel) {
    const slug = decodeURIComponent(rel.split("/")[0] ?? "");
    matchedGroup = groups.find((g) => {
      const catPath = getModuleSettingsCategoryPath(base, g.groupKey);
      return catPath === pathPart || catPath.endsWith(`/${slug}`);
    });
  }

  if (!matchedGroup && !rel && hash) {
    matchedGroup = groups.find((g) => g.items.some((i) => i.id === hash));
  }

  if (!matchedGroup) {
    if (!rel) return null;
    return null;
  }

  const groupId = presetSettingsGroupId(l2Ref.l2FeatureId, matchedGroup.groupKey);

  if (hash) {
    const item = matchedGroup.items.find((i) => i.id === hash);
    if (item) {
      return {
        moduleId: l2Ref.moduleId,
        l2FeatureId: l2Ref.l2FeatureId,
        itemId: groupId,
        l4Path: getModuleSettingsItemHref(base, item),
      };
    }
  }

  return {
    moduleId: l2Ref.moduleId,
    l2FeatureId: l2Ref.l2FeatureId,
    itemId: groupId,
  };
}

export function findCatalogItemBySeq(seq: number): { settingsPath: string; item: ModuleSettingCatalogItem } | undefined {
  for (const hub of Object.values(MODULE_SETTINGS_BY_PATH)) {
    const item = hub.items.find((i) => i.seq === seq);
    if (item) return { settingsPath: hub.settingsPath, item };
  }
  return undefined;
}

export function isCatalogSettingExcluded(
  item: ModuleSettingCatalogItem,
  settingsPath: string,
  l3Excludes: Set<string>,
  l3Includes: Set<string>,
  subtreeWhitelistMode: boolean,
  l2FeatureId: string,
  moduleId?: string,
): boolean {
  if (moduleId && (ALWAYS_VISIBLE_NAV_L1 as readonly string[]).includes(moduleId)) {
    return false;
  }
  const groupId = presetSettingsGroupId(l2FeatureId, item.groupKey);
  const itemId = presetSettingsItemId(item.seq);
  const href = getModuleSettingsItemHref(settingsPath, item);
  if (subtreeWhitelistMode) {
    if (l3Includes.has(groupId) || l3Includes.has(itemId) || l3Includes.has(`l4:${href}`)) return false;
    return true;
  }
  if (l3Excludes.has(groupId)) return true;
  if (l3Excludes.has(itemId)) return true;
  if (l3Excludes.has(`l4:${href}`)) return true;
  return false;
}
