/**
 * 导航蓝图 → 企业级平台预设同步
 */
import {
  PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES,
  PLATFORM_PRESET_PRODUCT_LINES,
  presetComboKey,
  type ProductLineId,
} from "./platform-preset-catalog";
import {
  getDefaultPresetSnapshot,
  getPublishedSnapshot,
  listCustomBusinessTypes,
  publishPlatformPresetSnapshot,
} from "./enterprise-platform-preset-store";
import { invalidatePlatformPresetTreeCache } from "./platform-preset-tree";
import {
  flattenPlatformPresetTree,
} from "./platform-preset-tree";
import {
  syncNodeDisplayWithEnabled,
  type PlatformPresetNodeSelection,
} from "./platform-preset-node-selection";
import type { PlatformPresetSnapshot } from "./platform-preset-types";
import {
  DEFAULT_NAV_BLUEPRINT_ID,
  getPublishedNavBlueprint,
  resolveActiveBlueprintModules,
  type NavBlueprintSnapshot,
} from "./nav-blueprint-store";
import { buildNavBlueprintGroups } from "./nav-blueprint-tree";

export interface BlueprintSyncTarget {
  businessTypeId: string;
  productLineId: ProductLineId;
}

export interface BlueprintSyncResult {
  updated: number;
  combos: BlueprintSyncTarget[];
}

function listAllSyncTargets(): BlueprintSyncTarget[] {
  const businessTypeIds = [
    ...PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.map((b) => b.id),
    ...listCustomBusinessTypes().map((c) => c.id),
  ];
  const targets: BlueprintSyncTarget[] = [];
  for (const businessTypeId of businessTypeIds) {
    for (const line of PLATFORM_PRESET_PRODUCT_LINES) {
      targets.push({ businessTypeId, productLineId: line.id });
    }
  }
  return targets;
}

/** 将蓝图树节点与既有 selection 合并（保留已有 enabled，新节点继承蓝图结构态） */
export function mergeSelectionWithBlueprintTree(
  blueprint: NavBlueprintSnapshot,
  productLineId: ProductLineId,
  businessTypeId: string,
  existingSelection?: Record<string, PlatformPresetNodeSelection>,
): Record<string, PlatformPresetNodeSelection> {
  const active = resolveActiveBlueprintModules(blueprint);
  const groups = buildNavBlueprintGroups({
    ...blueprint,
    navigationSource: blueprint.navigationSource,
  });
  const flat = flattenPlatformPresetTree(groups);
  const fallback =
    existingSelection ?? getDefaultPresetSnapshot(businessTypeId, productLineId).selection;

  const selection: Record<string, PlatformPresetNodeSelection> = {};
  for (const node of flat) {
    if (fallback[node.key]) {
      selection[node.key] = { ...fallback[node.key]! };
      continue;
    }
    const fromBlueprint = active.structureSelection[node.key];
    selection[node.key] = syncNodeDisplayWithEnabled(undefined, fromBlueprint?.enabled ?? false);
  }
  return selection;
}

function buildSyncedPresetSnapshot(
  blueprint: NavBlueprintSnapshot,
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetSnapshot {
  const existing = getPublishedSnapshot(businessTypeId, productLineId);
  const selection = mergeSelectionWithBlueprintTree(
    blueprint,
    productLineId,
    businessTypeId,
    existing?.selection,
  );
  return {
    businessTypeId,
    productLineId,
    version: existing?.version ?? 0,
    publishedAt: existing?.publishedAt ?? "",
    selection,
    blueprintVersion: blueprint.version,
    treeVersion: blueprint.version,
  };
}

/** 将已发布蓝图同步到企业级平台预设（默认全业态×产线） */
export function syncBlueprintToEnterprisePresets(
  blueprint: NavBlueprintSnapshot,
  targets?: BlueprintSyncTarget[],
): BlueprintSyncResult {
  const combos = targets?.length ? targets : listAllSyncTargets();
  let updated = 0;

  for (const { businessTypeId, productLineId } of combos) {
    const snapshot = buildSyncedPresetSnapshot(blueprint, businessTypeId, productLineId);
    publishPlatformPresetSnapshot(snapshot);
    updated += 1;
  }

  invalidatePlatformPresetTreeCache();
  return { updated, combos };
}

export function getActivePublishedBlueprint(): NavBlueprintSnapshot | undefined {
  return getPublishedNavBlueprint(DEFAULT_NAV_BLUEPRINT_ID);
}

export function formatBlueprintVersionLabel(blueprint?: NavBlueprintSnapshot): string {
  if (!blueprint || blueprint.version <= 0) return "系统默认（未发布蓝图）";
  const source = blueprint.navigationSource === "custom" ? "自定义" : "系统";
  return `导航蓝图 v${blueprint.version} · ${source}`;
}
