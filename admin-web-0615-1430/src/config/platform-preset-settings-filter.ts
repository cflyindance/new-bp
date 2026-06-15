/**
 * 平台预设 · 设置页 L3 分组 / L4 设置项过滤
 */
import { NAV_MODULES, PRODUCT_CENTER_DEEP_NAV } from "./navigation";
import {
  groupCatalogItemsByCategory,
  getModuleSettingsCategoryPath,
  slugifyModuleSettingsGroupKey,
  type ModuleSettingCatalogGroup,
  type ModuleSettingCatalogHub,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";
import { fohSeqAppliesToLine } from "./foh-settings-line-scope";
import type { FohLineNavId } from "./foh-settings-line-scope";
import { readPlatformPresetContext } from "./platform-preset-context";
import { getRuntimePresetSelection } from "./platform-preset-runtime-cache";

function isSettingsPresetFilterActive(): boolean {
  return readPlatformPresetContext() != null;
}

export interface SettingsFeatureRef {
  moduleId: string;
  featureId: string;
}

function getActiveSelection(): Record<string, { enabled: boolean; display?: boolean }> | null {
  return getRuntimePresetSelection();
}

export function resolveSettingsFeature(settingsPath: string): SettingsFeatureRef | null {
  for (const mod of NAV_MODULES) {
    for (const child of mod.children) {
      if (settingsPath === child.path || settingsPath.startsWith(`${child.path}/`)) {
        return { moduleId: mod.id, featureId: child.id };
      }
    }
    if (mod.id === "product-center-main") {
      for (const deep of PRODUCT_CENTER_DEEP_NAV) {
        if (settingsPath === deep.path || settingsPath.startsWith(`${deep.path}/`)) {
          return { moduleId: mod.id, featureId: deep.id };
        }
      }
    }
  }
  return null;
}

export function l3PresetKey(moduleId: string, featureId: string, groupKey: string): string {
  return `${moduleId}:${featureId}:${groupKey}`;
}

export function l4PresetKey(moduleId: string, featureId: string, groupKey: string, seq: number): string {
  return `${moduleId}:${featureId}:${groupKey}:s${seq}`;
}

export function isPresetL3Enabled(moduleId: string, featureId: string, groupKey: string): boolean {
  const selection = getActiveSelection();
  if (!selection) return true;
  if (!selection[moduleId]?.enabled) return false;
  if (!selection[l2PresetKey(moduleId, featureId)]?.enabled) return false;
  return selection[l3PresetKey(moduleId, featureId, groupKey)]?.enabled === true;
}

function l2PresetKey(moduleId: string, featureId: string): string {
  return `${moduleId}:${featureId}`;
}

export function isPresetL4Visible(
  moduleId: string,
  featureId: string,
  groupKey: string,
  seq: number,
): boolean {
  const selection = getActiveSelection();
  if (!selection) return true;
  const key = l4PresetKey(moduleId, featureId, groupKey, seq);
  const node = selection[key];
  if (!node?.enabled) return false;
  return node.display !== false;
}

export function filterCatalogItemForPreset(
  settingsPath: string,
  item: ModuleSettingCatalogItem,
  lineId?: FohLineNavId | null,
): boolean {
  if (!isSettingsPresetFilterActive()) return true;
  const feat = resolveSettingsFeature(settingsPath);
  if (!feat) return true;
  if (lineId && !fohSeqAppliesToLine(item.seq, lineId)) return false;
  if (!isPresetL3Enabled(feat.moduleId, feat.featureId, item.groupKey)) return false;
  return isPresetL4Visible(feat.moduleId, feat.featureId, item.groupKey, item.seq);
}

export function filterModuleSettingsGroupsForPreset(
  settingsPath: string,
  groups: ModuleSettingCatalogGroup[],
  lineId?: FohLineNavId | null,
): ModuleSettingCatalogGroup[] {
  if (!isSettingsPresetFilterActive()) return groups;
  const feat = resolveSettingsFeature(settingsPath);
  if (!feat) return groups;

  return groups
    .filter((g) => isPresetL3Enabled(feat.moduleId, feat.featureId, g.groupKey))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => filterCatalogItemForPreset(settingsPath, item, lineId)),
    }))
    .filter((g) => g.items.length > 0);
}

export function filterCatalogItemsForPreset(
  settingsPath: string,
  items: ModuleSettingCatalogItem[],
  lineId?: FohLineNavId | null,
): ModuleSettingCatalogItem[] {
  return items.filter((item) => filterCatalogItemForPreset(settingsPath, item, lineId));
}

export function isModuleSettingsPathAllowedByPreset(path: string, catalog: ModuleSettingCatalogHub): boolean {
  if (!isSettingsPresetFilterActive()) return true;
  const feat = resolveSettingsFeature(catalog.settingsPath);
  if (!feat) return true;

  const slug = path.startsWith(`${catalog.settingsPath}/`)
    ? path.slice(catalog.settingsPath.length + 1).split("/")[0] ?? ""
    : "";
  if (!slug) return true;

  const groups = groupCatalogItemsByCategory(catalog.items, catalog.groupOrder);
  const group = groups.find(
    (g) => slugifyModuleSettingsGroupKey(g.groupKey) === slugifyModuleSettingsGroupKey(decodeURIComponent(slug)),
  );
  if (group && !isPresetL3Enabled(feat.moduleId, feat.featureId, group.groupKey)) {
    return false;
  }
  return true;
}

export function getFirstAllowedModuleSettingsPath(catalog: ModuleSettingCatalogHub): string {
  const groups = filterModuleSettingsGroupsForPreset(
    catalog.settingsPath,
    groupCatalogItemsByCategory(catalog.items, catalog.groupOrder),
  );
  const first = groups[0];
  if (!first) return catalog.settingsPath;
  return getModuleSettingsCategoryPath(catalog.settingsPath, first.groupKey);
}
