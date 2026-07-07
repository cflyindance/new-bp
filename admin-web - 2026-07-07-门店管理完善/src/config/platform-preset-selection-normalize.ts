/**
 * 平台预设 · selection 归一化（依赖树索引，不依赖 store 实例）
 */
import {
  PLATFORM_PRESET_ALWAYS_ENABLED_L1_MODULE_IDS,
  type ProductLineId,
} from "./platform-preset-catalog";
import {
  syncNodeDisplayWithEnabled,
  type PlatformPresetNodeSelection,
} from "./platform-preset-node-selection";
import type { PlatformPresetSnapshot } from "./platform-preset-types";
import {
  buildPlatformPresetIndex,
  resolvePlatformPresetTreeOptionsFromSnapshot,
  type PlatformPresetTreeOptions,
} from "./platform-preset-tree";

export function normalizeSelectionForLine(
  selection: Record<string, PlatformPresetNodeSelection>,
  productLineId: ProductLineId,
  treeOptions?: PlatformPresetTreeOptions,
): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(productLineId, treeOptions);
  const { groups, getDescendantKeys } = index;
  const next = { ...selection };
  for (const n of index.flat) {
    if (!next[n.key]) next[n.key] = syncNodeDisplayWithEnabled(undefined, false);
    else next[n.key] = syncNodeDisplayWithEnabled(next[n.key], next[n.key].enabled);
  }
  for (const moduleId of PLATFORM_PRESET_ALWAYS_ENABLED_L1_MODULE_IDS) {
    const group = groups.find((g) => g.moduleId === moduleId);
    if (!group) continue;
    next[group.moduleKey] = syncNodeDisplayWithEnabled(next[group.moduleKey], true);
    for (const dk of getDescendantKeys(group.moduleKey)) {
      next[dk] = syncNodeDisplayWithEnabled(next[dk], true);
    }
  }
  return next;
}

export function normalizeSelectionForSnapshot(
  snapshot: Pick<PlatformPresetSnapshot, "productLineId" | "selection" | "blueprintVersion">,
): Record<string, PlatformPresetNodeSelection> {
  const treeOptions = resolvePlatformPresetTreeOptionsFromSnapshot(snapshot);
  return normalizeSelectionForLine(snapshot.selection, snapshot.productLineId, treeOptions);
}
