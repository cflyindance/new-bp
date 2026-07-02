/**
 * 平台预设 · 快照存储工厂（localStorage，演示环境）
 */
import { getAuthenticatedEmail } from "../auth/login";
import {
  PLATFORM_PRESET_ALWAYS_ENABLED_L1_MODULE_IDS,
  PLATFORM_PRESET_PRODUCT_LINES,
  presetComboKey,
  type BusinessTypeTier,
  type ProductLineId,
} from "./platform-preset-catalog";
import { isFullSelectionBusinessType, resolveDefaultModuleEnabled } from "./platform-preset-recommendations";
import type { PresetChangeItem } from "./platform-preset-changelog-diff";
import { buildPresetChangelogSummary, diffPresetSelections } from "./platform-preset-changelog-diff";
import { buildPlatformPresetIndex } from "./platform-preset-tree";
import {
  syncNodeDisplayWithEnabled,
  syncSelectionDisplayWithEnabled,
  type PlatformPresetNodeSelection,
} from "./platform-preset-node-selection";
import { normalizeSelectionForLine } from "./platform-preset-selection-normalize";
import type {
  CustomBusinessType,
  PlatformPresetChangeLogEntry,
  PlatformPresetSnapshot,
} from "./platform-preset-types";

interface PlatformPresetStoreSnapshot {
  snapshots: Record<string, PlatformPresetSnapshot>;
  customBusinessTypes: CustomBusinessType[];
  changelog: PlatformPresetChangeLogEntry[];
  selectedBusinessTypeId?: string;
}

export interface PlatformPresetStoreApi {
  getStoreRevision: () => number;
  readStoreSnapshot: () => PlatformPresetStoreSnapshot;
  getPlatformPresetStore: () => PlatformPresetStoreSnapshot;
  readSelectedBusinessTypeId: () => string;
  writeSelectedBusinessTypeId: (id: string) => void;
  listCustomBusinessTypes: () => CustomBusinessType[];
  upsertCustomBusinessType: (label: string, id?: string) => CustomBusinessType;
  deleteCustomBusinessType: (id: string) => void;
  getPublishedSnapshot: (
    businessTypeId: string,
    productLineId: ProductLineId,
  ) => PlatformPresetSnapshot | undefined;
  getEffectivePresetSnapshot: (businessTypeId: string, productLineId: ProductLineId) => PlatformPresetSnapshot;
  getDefaultPresetSnapshot: (businessTypeId: string, productLineId: ProductLineId) => PlatformPresetSnapshot;
  countPublishedLinesForBusinessType: (businessTypeId: string) => number;
  getOrCreateDraftSelection: (businessTypeId: string, productLineId: ProductLineId) => PlatformPresetSnapshot;
  publishPlatformPresetSnapshot: (snapshot: PlatformPresetSnapshot) => PlatformPresetSnapshot;
  countRecommendedLevel1: (businessTypeId: string, productLineId?: ProductLineId) => number;
  countEnabledSettings: (snapshot: PlatformPresetSnapshot) => number;
  countRecommendedSettings: (businessTypeId: string, productLineId: ProductLineId) => number;
  getChangelogForCombo: (businessTypeId: string, productLineId: ProductLineId) => PlatformPresetChangeLogEntry[];
  getChangelogForBusinessType: (businessTypeId: string) => PlatformPresetChangeLogEntry[];
  restoreBusinessRecommendationDefaults: (
    businessTypeId: string,
    productLineId: ProductLineId,
  ) => Record<string, PlatformPresetNodeSelection>;
}

export function createPlatformPresetStore(
  storageKey: string,
  options?: {
    invalidateRuntimeCache?: () => void;
    /** 商家后台等场景：从 M 平台解析自定义业态画像 */
    resolveCustomBusinessType?: (businessTypeId: string) => CustomBusinessType | undefined;
  },
): PlatformPresetStoreApi {
  let memoryStore: PlatformPresetStoreSnapshot | null = null;
  let storeRevision = 0;
  const effectiveSnapshotCache = new Map<string, PlatformPresetSnapshot>();
  const defaultPresetSnapshotCache = new Map<string, PlatformPresetSnapshot>();
  const enabledSettingsCountCache = new Map<string, number>();
  const recommendedSettingsCountCache = new Map<string, number>();

  function emptyStore(): PlatformPresetStoreSnapshot {
    return { snapshots: {}, customBusinessTypes: [], changelog: [] };
  }

  function readStore(): PlatformPresetStoreSnapshot {
    if (memoryStore) return memoryStore;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        memoryStore = emptyStore();
        return memoryStore;
      }
      const parsed = JSON.parse(raw) as PlatformPresetStoreSnapshot;
      memoryStore = {
        snapshots: parsed.snapshots ?? {},
        customBusinessTypes: parsed.customBusinessTypes ?? [],
        changelog: parsed.changelog ?? [],
        selectedBusinessTypeId: parsed.selectedBusinessTypeId,
      };
      return memoryStore;
    } catch {
      memoryStore = emptyStore();
      return memoryStore;
    }
  }

  function writeStore(store: PlatformPresetStoreSnapshot): void {
    memoryStore = store;
    storeRevision += 1;
    effectiveSnapshotCache.clear();
    defaultPresetSnapshotCache.clear();
    enabledSettingsCountCache.clear();
    recommendedSettingsCountCache.clear();
    options?.invalidateRuntimeCache?.();
    try {
      localStorage.setItem(storageKey, JSON.stringify(store));
    } catch {
      /* ignore */
    }
  }

  function listCustomBusinessTypes(): CustomBusinessType[] {
    return readStore().customBusinessTypes;
  }

  function ensureAlwaysEnabledPresetModules(
    selection: Record<string, PlatformPresetNodeSelection>,
    productLineId: ProductLineId,
    index = buildPlatformPresetIndex(productLineId),
  ): Record<string, PlatformPresetNodeSelection> {
    const { groups, getDescendantKeys } = index;
    const next = { ...selection };

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

  function defaultSelectionAllEnabled(
    productLineId: ProductLineId,
  ): Record<string, PlatformPresetNodeSelection> {
    const { flat } = buildPlatformPresetIndex(productLineId);
    const selection: Record<string, PlatformPresetNodeSelection> = {};
    for (const n of flat) {
      selection[n.key] = syncNodeDisplayWithEnabled(undefined, true);
    }
    return selection;
  }

  function buildFullSelectionSnapshot(
    businessTypeId: string,
    productLineId: ProductLineId,
    meta?: Pick<PlatformPresetSnapshot, "version" | "publishedAt">,
  ): PlatformPresetSnapshot {
    return {
      businessTypeId,
      productLineId,
      version: meta?.version ?? 0,
      publishedAt: meta?.publishedAt ?? "",
      selection: defaultSelectionAllEnabled(productLineId),
    };
  }

  function defaultEnabledFromRecommendations(
    businessTypeId: string,
    productLineId: ProductLineId,
  ): Record<string, PlatformPresetNodeSelection> {
    if (isFullSelectionBusinessType(businessTypeId)) {
      return defaultSelectionAllEnabled(productLineId);
    }

    const index = buildPlatformPresetIndex(productLineId);
    const { flat, getDescendantKeys, groups } = index;
    const custom =
      options?.resolveCustomBusinessType?.(businessTypeId) ??
      listCustomBusinessTypes().find((c) => c.id === businessTypeId);
    const customTiers = custom?.moduleTiers;

    const selection: Record<string, PlatformPresetNodeSelection> = {};
    for (const n of flat) {
      selection[n.key] = syncNodeDisplayWithEnabled(undefined, false);
    }

    for (const g of groups) {
      if (!resolveDefaultModuleEnabled(g.moduleId, businessTypeId, productLineId, customTiers)) continue;
      selection[g.moduleKey] = syncNodeDisplayWithEnabled(selection[g.moduleKey], true);
      for (const dk of getDescendantKeys(g.moduleKey)) {
        selection[dk] = syncNodeDisplayWithEnabled(selection[dk], true);
      }
    }

    return ensureAlwaysEnabledPresetModules(selection, productLineId, index);
  }

  function getPublishedSnapshot(
    businessTypeId: string,
    productLineId: ProductLineId,
  ): PlatformPresetSnapshot | undefined {
    const snap = readStore().snapshots[presetComboKey(businessTypeId, productLineId)];
    if (!snap) return undefined;
    return {
      ...snap,
      selection: normalizeSelectionForLine(snap.selection, productLineId),
    };
  }

  function getEffectivePresetSnapshot(
    businessTypeId: string,
    productLineId: ProductLineId,
  ): PlatformPresetSnapshot {
    const cacheKey = `${businessTypeId}:${productLineId}:${storeRevision}:${
      readStore().snapshots[presetComboKey(businessTypeId, productLineId)]?.version ?? 0
    }`;
    const cached = effectiveSnapshotCache.get(cacheKey);
    if (cached) return cached;

    if (isFullSelectionBusinessType(businessTypeId)) {
      const published = getPublishedSnapshot(businessTypeId, productLineId);
      const snap = buildFullSelectionSnapshot(businessTypeId, productLineId, published);
      effectiveSnapshotCache.set(cacheKey, snap);
      return snap;
    }

    const published = getPublishedSnapshot(businessTypeId, productLineId);
    const snap =
      published ??
      ({
        businessTypeId,
        productLineId,
        version: 0,
        publishedAt: "",
        selection: defaultEnabledFromRecommendations(businessTypeId, productLineId),
      } satisfies PlatformPresetSnapshot);

    effectiveSnapshotCache.set(cacheKey, snap);
    return snap;
  }

  function getDefaultPresetSnapshot(
    businessTypeId: string,
    productLineId: ProductLineId,
  ): PlatformPresetSnapshot {
    const cacheKey = `${businessTypeId}:${productLineId}:${storeRevision}`;
    const cached = defaultPresetSnapshotCache.get(cacheKey);
    if (cached) return cached;

    const snap: PlatformPresetSnapshot = {
      businessTypeId,
      productLineId,
      version: 0,
      publishedAt: "",
      selection: defaultEnabledFromRecommendations(businessTypeId, productLineId),
    };
    defaultPresetSnapshotCache.set(cacheKey, snap);
    return snap;
  }

  return {
    getStoreRevision: () => storeRevision,
    readStoreSnapshot: () => readStore(),
    getPlatformPresetStore: () => readStore(),
    readSelectedBusinessTypeId: () => readStore().selectedBusinessTypeId ?? "full-service",
    writeSelectedBusinessTypeId: (id: string) => {
      const store = readStore();
      store.selectedBusinessTypeId = id;
      writeStore(store);
    },
    listCustomBusinessTypes,
    upsertCustomBusinessType: (label: string, id?: string) => {
      const store = readStore();
      const entry: CustomBusinessType = {
        id: id ?? `custom-${Date.now()}`,
        label: label.trim(),
        createdAt: new Date().toISOString(),
      };
      const idx = store.customBusinessTypes.findIndex((c) => c.id === entry.id);
      if (idx >= 0) store.customBusinessTypes[idx] = { ...store.customBusinessTypes[idx], label: entry.label };
      else store.customBusinessTypes.push(entry);
      writeStore(store);
      return entry;
    },
    deleteCustomBusinessType: (id: string) => {
      const store = readStore();
      store.customBusinessTypes = store.customBusinessTypes.filter((c) => c.id !== id);
      for (const line of PLATFORM_PRESET_PRODUCT_LINES) {
        delete store.snapshots[presetComboKey(id, line.id)];
      }
      writeStore(store);
    },
    getPublishedSnapshot,
    getEffectivePresetSnapshot,
    getDefaultPresetSnapshot,
    countPublishedLinesForBusinessType: (businessTypeId: string) => {
      const store = readStore();
      let count = 0;
      for (const line of PLATFORM_PRESET_PRODUCT_LINES) {
        if (store.snapshots[presetComboKey(businessTypeId, line.id)]) count += 1;
      }
      return count;
    },
    getOrCreateDraftSelection: (businessTypeId: string, productLineId: ProductLineId) => {
      if (isFullSelectionBusinessType(businessTypeId)) {
        const key = presetComboKey(businessTypeId, productLineId);
        const existing = readStore().snapshots[key];
        return buildFullSelectionSnapshot(businessTypeId, productLineId, existing);
      }

      const key = presetComboKey(businessTypeId, productLineId);
      const existing = readStore().snapshots[key];
      if (existing) {
        return {
          ...structuredClone(existing),
          selection: normalizeSelectionForLine(existing.selection, productLineId),
        };
      }
      return structuredClone(getEffectivePresetSnapshot(businessTypeId, productLineId));
    },
    publishPlatformPresetSnapshot: (snapshot: PlatformPresetSnapshot) => {
      const store = readStore();
      const key = presetComboKey(snapshot.businessTypeId, snapshot.productLineId);
      const nextVersion = (store.snapshots[key]?.version ?? 0) + 1;
      const actor = getAuthenticatedEmail() ?? "system";
      const selection = isFullSelectionBusinessType(snapshot.businessTypeId)
        ? defaultSelectionAllEnabled(snapshot.productLineId)
        : syncSelectionDisplayWithEnabled(snapshot.selection);
      const published: PlatformPresetSnapshot = {
        ...snapshot,
        selection,
        version: nextVersion,
        publishedAt: new Date().toISOString(),
      };

      const enabledL1 = (() => {
        const { groups } = buildPlatformPresetIndex(snapshot.productLineId);
        return groups.filter((g) => published.selection[g.moduleKey]?.enabled).length;
      })();
      const previous = store.snapshots[key];
      const diff = diffPresetSelections(previous?.selection, published.selection, snapshot.productLineId);

      store.snapshots[key] = published;
      store.changelog.unshift({
        id: `pp-${Date.now()}`,
        businessTypeId: snapshot.businessTypeId,
        productLineId: snapshot.productLineId,
        version: nextVersion,
        at: published.publishedAt,
        actor,
        summary: buildPresetChangelogSummary(diff, enabledL1),
        enabledAdded: diff.enabledAdded,
        enabledRemoved: diff.enabledRemoved,
        displayAdded: diff.displayAdded,
        displayRemoved: diff.displayRemoved,
      });
      store.changelog = store.changelog.slice(0, 200);
      writeStore(store);
      return published;
    },
    countRecommendedLevel1: (businessTypeId: string, productLineId: ProductLineId = "pos") => {
      const draft = defaultEnabledFromRecommendations(businessTypeId, productLineId);
      const { groups } = buildPlatformPresetIndex(productLineId);
      return groups.filter((g) => draft[g.moduleKey]?.enabled).length;
    },
    countEnabledSettings: (snapshot: PlatformPresetSnapshot) => {
      const cacheKey = `${snapshot.businessTypeId}:${snapshot.productLineId}:${snapshot.version}:${storeRevision}`;
      const cached = enabledSettingsCountCache.get(cacheKey);
      if (cached != null) return cached;
      const { flat } = buildPlatformPresetIndex(snapshot.productLineId);
      const count = flat.filter((n) => n.level === 4 && snapshot.selection[n.key]?.enabled).length;
      enabledSettingsCountCache.set(cacheKey, count);
      return count;
    },
    countRecommendedSettings: (businessTypeId: string, productLineId: ProductLineId) => {
      const cacheKey = `${businessTypeId}:${productLineId}:${storeRevision}`;
      const cached = recommendedSettingsCountCache.get(cacheKey);
      if (cached != null) return cached;
      const count = Object.values(getDefaultPresetSnapshot(businessTypeId, productLineId).selection).filter(
        (s) => s.enabled,
      ).length;
      recommendedSettingsCountCache.set(cacheKey, count);
      return count;
    },
    getChangelogForCombo: (businessTypeId: string, productLineId: ProductLineId) =>
      readStore().changelog.filter(
        (e) => e.businessTypeId === businessTypeId && e.productLineId === productLineId,
      ),
    getChangelogForBusinessType: (businessTypeId: string) =>
      readStore().changelog.filter((e) => e.businessTypeId === businessTypeId),
    restoreBusinessRecommendationDefaults: (businessTypeId: string, productLineId: ProductLineId) =>
      defaultEnabledFromRecommendations(businessTypeId, productLineId),
  };
}
