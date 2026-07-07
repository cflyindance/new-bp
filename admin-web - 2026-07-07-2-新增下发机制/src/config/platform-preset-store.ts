/**
 * 平台预设 · 快照存储（localStorage，演示环境 · 商家级）
 */
import type { ProductLineId } from "./platform-preset-catalog";
import { invalidatePlatformPresetRuntimeCache } from "./platform-preset-runtime-cache";
import { createPlatformPresetStore } from "./platform-preset-store-factory";
import {
  getEffectivePresetSnapshot as getEnterpriseEffectivePresetSnapshot,
  getPublishedSnapshot as getEnterprisePublishedSnapshot,
  listCustomBusinessTypes as listEnterpriseCustomBusinessTypes,
} from "./enterprise-platform-preset-store";
import { buildPlatformPresetIndex, resolvePlatformPresetTreeOptionsFromSnapshot, type PlatformPresetTreeOptions } from "./platform-preset-tree";
import {
  syncNodeDisplayWithEnabled,
  type PlatformPresetNodeSelection,
} from "./platform-preset-node-selection";
import { normalizeSelectionForLine } from "./platform-preset-selection-normalize";
import type {
  CustomBusinessType,
  PlatformPresetChangeLogEntry,
  PlatformPresetSnapshot,
} from "./platform-preset-types";

export type { RbacL4EditMode, PlatformPresetNodeSelection } from "./platform-preset-node-selection";
export type { CustomBusinessType, PlatformPresetChangeLogEntry, PlatformPresetSnapshot } from "./platform-preset-types";
export { syncNodeDisplayWithEnabled, syncSelectionDisplayWithEnabled } from "./platform-preset-node-selection";
export { normalizeSelectionForLine, normalizeSelectionForSnapshot } from "./platform-preset-selection-normalize";

const merchant = createPlatformPresetStore("menusifu:platform-preset-v1", {
  invalidateRuntimeCache: invalidatePlatformPresetRuntimeCache,
  resolveCustomBusinessType: (businessTypeId) =>
    listEnterpriseCustomBusinessTypes().find((c) => c.id === businessTypeId),
});

export const {
  getStoreRevision,
  readStoreSnapshot,
  getPlatformPresetStore,
  readSelectedBusinessTypeId,
  writeSelectedBusinessTypeId,
  listCustomBusinessTypes,
  upsertCustomBusinessType,
  deleteCustomBusinessType,
  getPublishedSnapshot,
  getDefaultPresetSnapshot,
  countPublishedLinesForBusinessType,
  getOrCreateDraftSelection,
  publishPlatformPresetSnapshot,
  countRecommendedLevel1,
  countEnabledSettings,
  countRecommendedSettings,
  getChangelogForCombo,
  getChangelogForBusinessType,
  restoreBusinessRecommendationDefaults,
} = merchant;

const getMerchantEffectivePresetSnapshot = merchant.getEffectivePresetSnapshot;

/** 商家无发布快照时回落企业级预设（引导与运行时共用） */
export function getEffectivePresetSnapshot(
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetSnapshot {
  if (getPublishedSnapshot(businessTypeId, productLineId)) {
    return getMerchantEffectivePresetSnapshot(businessTypeId, productLineId);
  }
  return (
    getEnterprisePublishedSnapshot(businessTypeId, productLineId) ??
    getEnterpriseEffectivePresetSnapshot(businessTypeId, productLineId)
  );
}

export function countEnabledLevel1(snapshot: PlatformPresetSnapshot): number {
  const treeOptions = resolvePlatformPresetTreeOptionsFromSnapshot(snapshot);
  const { groups } = buildPlatformPresetIndex(snapshot.productLineId, treeOptions);
  return groups.filter((g) => snapshot.selection[g.moduleKey]?.enabled).length;
}

export function cascadeEnableSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
  productLineId: ProductLineId,
  treeOptions?: PlatformPresetTreeOptions,
): Record<string, PlatformPresetNodeSelection> {
  const { getDescendantKeys } = buildPlatformPresetIndex(productLineId, treeOptions);
  const next = { ...selection };
  next[key] = syncNodeDisplayWithEnabled(next[key], enabled);
  for (const dk of getDescendantKeys(key)) {
    next[dk] = syncNodeDisplayWithEnabled(next[dk], enabled);
  }
  return next;
}
