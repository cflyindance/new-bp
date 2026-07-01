/**
 * 平台预设 · 快照存储（localStorage，演示环境 · 商家级）
 */
import {
  PLATFORM_PRESET_ALWAYS_ENABLED_L1_MODULE_IDS,
  type ProductLineId,
} from "./platform-preset-catalog";
import { invalidatePlatformPresetRuntimeCache } from "./platform-preset-runtime-cache";
import { createPlatformPresetStore } from "./platform-preset-store-factory";
import { listCustomBusinessTypes as listEnterpriseCustomBusinessTypes } from "./enterprise-platform-preset-store";
import { buildPlatformPresetIndex } from "./platform-preset-tree";

export type RbacL4EditMode = "editable" | "display-only";

export interface PlatformPresetNodeSelection {
  enabled: boolean;
  /** @deprecated 与 enabled 同步；勾选即展示，未勾选即不展示 */
  display?: boolean;
  /** RBAC L4：勾选=展示；可选「可编辑」，未勾选可编辑时为只读展示 */
  l4EditMode?: RbacL4EditMode;
}

/** 勾选即展示：display 始终与 enabled 一致 */
export function syncNodeDisplayWithEnabled(
  node: PlatformPresetNodeSelection | undefined,
  enabled: boolean,
): PlatformPresetNodeSelection {
  return { ...node, enabled, display: enabled };
}

export function syncSelectionDisplayWithEnabled(
  selection: Record<string, PlatformPresetNodeSelection>,
): Record<string, PlatformPresetNodeSelection> {
  const next: Record<string, PlatformPresetNodeSelection> = {};
  for (const [key, node] of Object.entries(selection)) {
    next[key] = syncNodeDisplayWithEnabled(node, node.enabled);
  }
  return next;
}

export interface PlatformPresetSnapshot {
  businessTypeId: string;
  productLineId: ProductLineId;
  version: number;
  publishedAt: string;
  selection: Record<string, PlatformPresetNodeSelection>;
}

export interface PlatformPresetChangeLogEntry {
  id: string;
  businessTypeId: string;
  productLineId: ProductLineId;
  version: number;
  at: string;
  actor: string;
  summary: string;
  enabledAdded?: import("./platform-preset-changelog-diff").PresetChangeItem[];
  enabledRemoved?: import("./platform-preset-changelog-diff").PresetChangeItem[];
  displayAdded?: import("./platform-preset-changelog-diff").PresetChangeItem[];
  displayRemoved?: import("./platform-preset-changelog-diff").PresetChangeItem[];
}

export interface CustomBusinessType {
  id: string;
  label: string;
  moduleTiers?: Partial<Record<string, import("./platform-preset-catalog").BusinessTypeTier>>;
  createdAt: string;
}

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
  getEffectivePresetSnapshot,
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

export function countEnabledLevel1(snapshot: PlatformPresetSnapshot): number {
  const { groups } = buildPlatformPresetIndex(snapshot.productLineId);
  return groups.filter((g) => snapshot.selection[g.moduleKey]?.enabled).length;
}

export function cascadeEnableSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
  productLineId: ProductLineId,
): Record<string, PlatformPresetNodeSelection> {
  const { getDescendantKeys } = buildPlatformPresetIndex(productLineId);
  const next = { ...selection };
  next[key] = syncNodeDisplayWithEnabled(next[key], enabled);
  for (const dk of getDescendantKeys(key)) {
    next[dk] = syncNodeDisplayWithEnabled(next[dk], enabled);
  }
  return next;
}

export function normalizeSelectionForLine(
  selection: Record<string, PlatformPresetNodeSelection>,
  productLineId: ProductLineId,
): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(productLineId);
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
