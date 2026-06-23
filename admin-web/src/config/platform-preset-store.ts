/**
 * 平台预设 · 快照存储（localStorage，演示环境）
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
import { invalidatePlatformPresetRuntimeCache } from "./platform-preset-runtime-cache";
import { buildPlatformPresetIndex } from "./platform-preset-tree";

export interface PlatformPresetNodeSelection {
  enabled: boolean;
  /** L4：是否在设置页展示 */
  display?: boolean;
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
  /** 本次发布相对上一版的明细（便于追溯） */
  enabledAdded?: PresetChangeItem[];
  enabledRemoved?: PresetChangeItem[];
  displayAdded?: PresetChangeItem[];
  displayRemoved?: PresetChangeItem[];
}

export interface CustomBusinessType {
  id: string;
  label: string;
  moduleTiers?: Partial<Record<string, BusinessTypeTier>>;
  createdAt: string;
}

interface PlatformPresetStoreSnapshot {
  snapshots: Record<string, PlatformPresetSnapshot>;
  customBusinessTypes: CustomBusinessType[];
  changelog: PlatformPresetChangeLogEntry[];
  selectedBusinessTypeId?: string;
}

const STORAGE_KEY = "menusifu:platform-preset-v1";

let memoryStore: PlatformPresetStoreSnapshot | null = null;
let storeRevision = 0;
const effectiveSnapshotCache = new Map<string, PlatformPresetSnapshot>();
const defaultPresetSnapshotCache = new Map<string, PlatformPresetSnapshot>();
const enabledSettingsCountCache = new Map<string, number>();
const recommendedSettingsCountCache = new Map<string, number>();

export function getStoreRevision(): number {
  return storeRevision;
}

/** 读取内存中的 store 快照（避免每次 mount 解析 localStorage） */
export function readStoreSnapshot(): PlatformPresetStoreSnapshot {
  return readStore();
}

function emptyStore(): PlatformPresetStoreSnapshot {
  return { snapshots: {}, customBusinessTypes: [], changelog: [] };
}

function readStore(): PlatformPresetStoreSnapshot {
  if (memoryStore) return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  invalidatePlatformPresetRuntimeCache();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getPlatformPresetStore(): PlatformPresetStoreSnapshot {
  return readStore();
}

export function readSelectedBusinessTypeId(): string {
  const store = readStore();
  return store.selectedBusinessTypeId ?? "fast-food";
}

export function writeSelectedBusinessTypeId(id: string): void {
  const store = readStore();
  store.selectedBusinessTypeId = id;
  writeStore(store);
}

export function listCustomBusinessTypes(): CustomBusinessType[] {
  return readStore().customBusinessTypes;
}

export function upsertCustomBusinessType(label: string, id?: string): CustomBusinessType {
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
}

export function deleteCustomBusinessType(id: string): void {
  const store = readStore();
  store.customBusinessTypes = store.customBusinessTypes.filter((c) => c.id !== id);
  for (const line of PLATFORM_PRESET_PRODUCT_LINES) {
    delete store.snapshots[presetComboKey(id, line.id)];
  }
  writeStore(store);
}

export function getPublishedSnapshot(
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

/** 已发布快照；若无发布则回退为系统默认推荐（version 0） */
export function getEffectivePresetSnapshot(
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

/** 系统默认推荐快照（不含已发布覆盖，供列表页「业态推荐」统计） */
export function getDefaultPresetSnapshot(
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

export function countPublishedLinesForBusinessType(businessTypeId: string): number {
  const store = readStore();
  let count = 0;
  for (const line of PLATFORM_PRESET_PRODUCT_LINES) {
    if (store.snapshots[presetComboKey(businessTypeId, line.id)]) count += 1;
  }
  return count;
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
    next[group.moduleKey] = { enabled: true, display: next[group.moduleKey]?.display ?? true };
    for (const dk of getDescendantKeys(group.moduleKey)) {
      next[dk] = { enabled: true, display: next[dk]?.display ?? true };
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
    selection[n.key] = { enabled: true, display: true };
  }
  return selection;
}

/** 「全功能/不确定」：一级～四级预设节点全部启用（不受历史部分发布快照影响） */
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
  const custom = listCustomBusinessTypes().find((c) => c.id === businessTypeId);
  const customTiers = custom?.moduleTiers;

  const selection: Record<string, PlatformPresetNodeSelection> = {};
  for (const n of flat) {
    selection[n.key] = { enabled: false, display: true };
  }

  for (const g of groups) {
    if (!resolveDefaultModuleEnabled(g.moduleId, businessTypeId, productLineId, customTiers)) continue;
    selection[g.moduleKey] = { enabled: true, display: true };
    for (const dk of getDescendantKeys(g.moduleKey)) {
      selection[dk] = { enabled: true, display: true };
    }
  }

  return ensureAlwaysEnabledPresetModules(selection, productLineId, index);
}

export function getOrCreateDraftSelection(
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetSnapshot {
  if (isFullSelectionBusinessType(businessTypeId)) {
    const key = presetComboKey(businessTypeId, productLineId);
    const existing = readStore().snapshots[key];
    return buildFullSelectionSnapshot(businessTypeId, productLineId, existing);
  }

  const key = presetComboKey(businessTypeId, productLineId);
  const existing = readStore().snapshots[key];
  if (existing) return structuredClone(existing);
  return structuredClone(getEffectivePresetSnapshot(businessTypeId, productLineId));
}

export function publishPlatformPresetSnapshot(snapshot: PlatformPresetSnapshot): PlatformPresetSnapshot {
  const store = readStore();
  const key = presetComboKey(snapshot.businessTypeId, snapshot.productLineId);
  const nextVersion = (store.snapshots[key]?.version ?? 0) + 1;
  const actor = getAuthenticatedEmail() ?? "system";
  const selection = isFullSelectionBusinessType(snapshot.businessTypeId)
    ? defaultSelectionAllEnabled(snapshot.productLineId)
    : snapshot.selection;
  const published: PlatformPresetSnapshot = {
    ...snapshot,
    selection,
    version: nextVersion,
    publishedAt: new Date().toISOString(),
  };

  const enabledL1 = countEnabledLevel1(published);
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
}

export function countEnabledLevel1(snapshot: PlatformPresetSnapshot): number {
  const { groups } = buildPlatformPresetIndex(snapshot.productLineId);
  return groups.filter((g) => snapshot.selection[g.moduleKey]?.enabled).length;
}

export function countRecommendedLevel1(businessTypeId: string, productLineId: ProductLineId = "pos"): number {
  const draft = defaultEnabledFromRecommendations(businessTypeId, productLineId);
  const { groups } = buildPlatformPresetIndex(productLineId);
  return groups.filter((g) => draft[g.moduleKey]?.enabled).length;
}

export function countEnabledSettings(snapshot: PlatformPresetSnapshot): number {
  const cacheKey = `${snapshot.businessTypeId}:${snapshot.productLineId}:${snapshot.version}:${storeRevision}`;
  const cached = enabledSettingsCountCache.get(cacheKey);
  if (cached != null) return cached;
  const { flat } = buildPlatformPresetIndex(snapshot.productLineId);
  const count = flat.filter((n) => n.level === 4 && snapshot.selection[n.key]?.enabled).length;
  enabledSettingsCountCache.set(cacheKey, count);
  return count;
}

export function countRecommendedSettings(businessTypeId: string, productLineId: ProductLineId): number {
  const cacheKey = `${businessTypeId}:${productLineId}:${storeRevision}`;
  const cached = recommendedSettingsCountCache.get(cacheKey);
  if (cached != null) return cached;
  const count = Object.values(getDefaultPresetSnapshot(businessTypeId, productLineId).selection).filter(
    (s) => s.enabled,
  ).length;
  recommendedSettingsCountCache.set(cacheKey, count);
  return count;
}

export function getChangelogForCombo(
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetChangeLogEntry[] {
  return readStore().changelog.filter(
    (e) => e.businessTypeId === businessTypeId && e.productLineId === productLineId,
  );
}

export function getChangelogForBusinessType(businessTypeId: string): PlatformPresetChangeLogEntry[] {
  return readStore().changelog.filter((e) => e.businessTypeId === businessTypeId);
}

export function cascadeEnableSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
  productLineId: ProductLineId,
): Record<string, PlatformPresetNodeSelection> {
  const { getDescendantKeys } = buildPlatformPresetIndex(productLineId);
  const next = { ...selection };
  next[key] = { ...next[key], enabled, display: next[key]?.display ?? true };
  for (const dk of getDescendantKeys(key)) {
    next[dk] = { enabled, display: next[dk]?.display ?? true };
  }
  return next;
}

export function restoreBusinessRecommendationDefaults(
  businessTypeId: string,
  productLineId: ProductLineId,
): Record<string, PlatformPresetNodeSelection> {
  return defaultEnabledFromRecommendations(businessTypeId, productLineId);
}

export function normalizeSelectionForLine(
  selection: Record<string, PlatformPresetNodeSelection>,
  productLineId: ProductLineId,
): Record<string, PlatformPresetNodeSelection> {
  const index = buildPlatformPresetIndex(productLineId);
  const next = { ...selection };
  for (const n of index.flat) {
    if (!next[n.key]) next[n.key] = { enabled: false, display: true };
  }
  return ensureAlwaysEnabledPresetModules(next, productLineId, index);
}
