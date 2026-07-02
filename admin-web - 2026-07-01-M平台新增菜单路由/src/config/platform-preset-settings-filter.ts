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
import { FOH_SETTINGS_PATH } from "./foh-settings-by-line-ui";
import {
  fohPresetGroupKeyCandidates,
  fohPresetGroupKeyCandidatesForGroup,
  normalizeFohCatalogItemsForGrouping,
} from "./foh-settings-group-keys";
import {
  isPrintSettingsPath,
  normalizePrintCatalogItemsForGrouping,
  printPresetGroupKeyCandidates,
  printPresetGroupKeyCandidatesForGroup,
} from "./print-settings-group-keys";
import {
  isFinanceSettingsPath,
  financePresetGroupKeyCandidates,
  financePresetGroupKeyCandidatesForGroup,
  normalizeFinanceCatalogItemsForGrouping,
} from "./finance-settings-group-keys";
import {
  isOrderSettingsPath,
  orderPresetGroupKeyCandidates,
  orderPresetGroupKeyCandidatesForGroup,
  normalizeOrderCatalogItemsForGrouping,
} from "./order-settings-group-keys";
import { readPlatformPresetContext } from "./platform-preset-context";
import { getRuntimePresetSelection } from "./platform-preset-runtime-cache";

function isSettingsPresetFilterActive(): boolean {
  return readPlatformPresetContext() != null;
}

function isFohSettingsPath(settingsPath: string): boolean {
  return settingsPath === FOH_SETTINGS_PATH || settingsPath.startsWith(`${FOH_SETTINGS_PATH}/`);
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

function l2PresetKey(moduleId: string, featureId: string): string {
  return `${moduleId}:${featureId}`;
}

function isPresetL3EnabledWithKeys(
  moduleId: string,
  featureId: string,
  groupKeys: string[],
): boolean {
  const selection = getActiveSelection();
  if (!selection) return true;
  if (!selection[moduleId]?.enabled) return false;
  if (!selection[l2PresetKey(moduleId, featureId)]?.enabled) return false;
  return groupKeys.some((groupKey) => selection[l3PresetKey(moduleId, featureId, groupKey)]?.enabled === true);
}

export function isPresetL3Enabled(moduleId: string, featureId: string, groupKey: string): boolean {
  return isPresetL3EnabledWithKeys(moduleId, featureId, [groupKey]);
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
  return selection[key]?.enabled === true;
}

function isPresetL4VisibleWithKeys(
  moduleId: string,
  featureId: string,
  groupKeys: string[],
  seq: number,
): boolean {
  const selection = getActiveSelection();
  if (!selection) return true;
  return groupKeys.some((groupKey) => isPresetL4Visible(moduleId, featureId, groupKey, seq));
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

  const groupKeys = isFohSettingsPath(settingsPath)
    ? fohPresetGroupKeyCandidates(item)
    : isPrintSettingsPath(settingsPath)
      ? printPresetGroupKeyCandidates(item)
      : isFinanceSettingsPath(settingsPath)
        ? financePresetGroupKeyCandidates(item)
        : isOrderSettingsPath(settingsPath)
          ? orderPresetGroupKeyCandidates(item)
          : [item.groupKey];

  if (!isPresetL3EnabledWithKeys(feat.moduleId, feat.featureId, groupKeys)) return false;
  return isPresetL4VisibleWithKeys(feat.moduleId, feat.featureId, groupKeys, item.seq);
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
    .filter((g) => {
      const groupKeys = isFohSettingsPath(settingsPath)
        ? fohPresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
        : isPrintSettingsPath(settingsPath)
          ? printPresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
          : isFinanceSettingsPath(settingsPath)
            ? financePresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
            : isOrderSettingsPath(settingsPath)
              ? orderPresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
              : [g.groupKey];
      return isPresetL3EnabledWithKeys(feat.moduleId, feat.featureId, groupKeys);
    })
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

  const items =
    catalog.settingsPath === FOH_SETTINGS_PATH
      ? normalizeFohCatalogItemsForGrouping(catalog.items)
      : isPrintSettingsPath(catalog.settingsPath)
        ? normalizePrintCatalogItemsForGrouping(catalog.items)
        : isFinanceSettingsPath(catalog.settingsPath)
          ? normalizeFinanceCatalogItemsForGrouping(catalog.items)
          : isOrderSettingsPath(catalog.settingsPath)
            ? normalizeOrderCatalogItemsForGrouping(catalog.items)
            : catalog.items;
  const groups = groupCatalogItemsByCategory(items, catalog.groupOrder);
  const decodedSlug = decodeURIComponent(slug);
  const group = groups.find((g) => {
    const slugKeys = isFohSettingsPath(catalog.settingsPath)
      ? fohPresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
      : isPrintSettingsPath(catalog.settingsPath)
        ? printPresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
        : isFinanceSettingsPath(catalog.settingsPath)
          ? financePresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
          : isOrderSettingsPath(catalog.settingsPath)
            ? orderPresetGroupKeyCandidatesForGroup(g.groupKey, g.items)
            : [g.groupKey];
    return slugKeys.some(
      (key) => slugifyModuleSettingsGroupKey(key) === slugifyModuleSettingsGroupKey(decodedSlug),
    );
  });
  if (
    group &&
    !isPresetL3EnabledWithKeys(
      feat.moduleId,
      feat.featureId,
      isFohSettingsPath(catalog.settingsPath)
        ? fohPresetGroupKeyCandidatesForGroup(group.groupKey, group.items)
        : isPrintSettingsPath(catalog.settingsPath)
          ? printPresetGroupKeyCandidatesForGroup(group.groupKey, group.items)
          : isFinanceSettingsPath(catalog.settingsPath)
            ? financePresetGroupKeyCandidatesForGroup(group.groupKey, group.items)
            : isOrderSettingsPath(catalog.settingsPath)
              ? orderPresetGroupKeyCandidatesForGroup(group.groupKey, group.items)
              : [group.groupKey],
    )
  ) {
    return false;
  }
  return true;
}

export function getFirstAllowedModuleSettingsPath(catalog: ModuleSettingCatalogHub): string {
  const items =
    catalog.settingsPath === FOH_SETTINGS_PATH
      ? normalizeFohCatalogItemsForGrouping(catalog.items)
      : isPrintSettingsPath(catalog.settingsPath)
        ? normalizePrintCatalogItemsForGrouping(catalog.items)
        : isFinanceSettingsPath(catalog.settingsPath)
          ? normalizeFinanceCatalogItemsForGrouping(catalog.items)
          : isOrderSettingsPath(catalog.settingsPath)
            ? normalizeOrderCatalogItemsForGrouping(catalog.items)
            : catalog.items;
  const groups = filterModuleSettingsGroupsForPreset(
    catalog.settingsPath,
    groupCatalogItemsByCategory(items, catalog.groupOrder),
  );
  const first = groups[0];
  if (!first) return catalog.settingsPath;
  return getModuleSettingsCategoryPath(catalog.settingsPath, first.groupKey);
}
