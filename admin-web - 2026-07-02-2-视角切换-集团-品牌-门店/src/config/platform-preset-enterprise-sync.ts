/**
 * 企业级平台预设 → 商家级平台预设同步
 */
import {
  PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES,
  PLATFORM_PRESET_PRODUCT_LINES,
  presetComboKey,
  type ProductLineId,
} from "./platform-preset-catalog";
import {
  getEffectivePresetSnapshot as getEnterpriseEffectivePresetSnapshot,
  getPublishedSnapshot as getEnterprisePublishedSnapshot,
} from "./enterprise-platform-preset-store";
import { invalidatePlatformPresetRuntimeCache } from "./platform-preset-runtime-cache";
import {
  getPublishedSnapshot as getMerchantPublishedSnapshot,
  publishPlatformPresetSnapshot,
  type PlatformPresetSnapshot,
} from "./platform-preset-store";
import { listCustomBusinessTypes } from "./enterprise-platform-preset-store";
import { getActivePublishedBlueprint } from "./nav-blueprint-sync";

export interface SyncedFromEnterpriseMeta {
  enterpriseVersion: number;
  blueprintVersion?: number;
  syncedAt: string;
}

interface MerchantPresetSyncStore {
  combos: Record<string, SyncedFromEnterpriseMeta>;
}

const SYNC_META_KEY = "menusifu:merchant-preset-sync-meta-v1";

let memorySyncStore: MerchantPresetSyncStore | null = null;

function readSyncStore(): MerchantPresetSyncStore {
  if (memorySyncStore) return memorySyncStore;
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) {
      memorySyncStore = { combos: {} };
      return memorySyncStore;
    }
    const parsed = JSON.parse(raw) as MerchantPresetSyncStore;
    memorySyncStore = { combos: parsed.combos ?? {} };
    return memorySyncStore;
  } catch {
    memorySyncStore = { combos: {} };
    return memorySyncStore;
  }
}

function writeSyncStore(store: MerchantPresetSyncStore): void {
  memorySyncStore = store;
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getMerchantPresetSyncMeta(
  businessTypeId: string,
  productLineId: ProductLineId,
): SyncedFromEnterpriseMeta | undefined {
  return readSyncStore().combos[presetComboKey(businessTypeId, productLineId)];
}

function writeMerchantPresetSyncMeta(
  businessTypeId: string,
  productLineId: ProductLineId,
  meta: SyncedFromEnterpriseMeta,
): void {
  const store = readSyncStore();
  store.combos[presetComboKey(businessTypeId, productLineId)] = meta;
  writeSyncStore(store);
}

export function shouldOverwriteOnEnterpriseSync(
  merchantSnap: PlatformPresetSnapshot | undefined,
  syncedMeta: SyncedFromEnterpriseMeta | undefined,
  newEnterpriseVersion: number,
): boolean {
  if (!merchantSnap || merchantSnap.version === 0) return true;
  if (!syncedMeta) return false;
  if (merchantSnap.version > syncedMeta.enterpriseVersion) return false;
  return newEnterpriseVersion >= syncedMeta.enterpriseVersion;
}

export type EnterpriseSyncTarget = {
  businessTypeId: string;
  productLineId: ProductLineId;
};

export interface EnterpriseToMerchantSyncResult {
  updated: number;
  skipped: number;
}

function listDefaultSyncTargets(): EnterpriseSyncTarget[] {
  const businessTypeIds = [
    ...PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.map((b) => b.id),
    ...listCustomBusinessTypes().map((c) => c.id),
  ];
  const targets: EnterpriseSyncTarget[] = [];
  for (const businessTypeId of businessTypeIds) {
    for (const line of PLATFORM_PRESET_PRODUCT_LINES) {
      targets.push({ businessTypeId, productLineId: line.id });
    }
  }
  return targets;
}

function resolveEnterpriseSnapshot(
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetSnapshot {
  return (
    getEnterprisePublishedSnapshot(businessTypeId, productLineId) ??
    getEnterpriseEffectivePresetSnapshot(businessTypeId, productLineId)
  );
}

/** 商家无快照时，优先读企业级预设（引导 / 运行时回落） */
export function getMerchantEffectivePresetWithEnterpriseFallback(
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetSnapshot {
  const merchantPublished = getMerchantPublishedSnapshot(businessTypeId, productLineId);
  if (merchantPublished) return merchantPublished;
  return resolveEnterpriseSnapshot(businessTypeId, productLineId);
}

export function syncEnterprisePresetsToMerchant(options?: {
  targets?: EnterpriseSyncTarget[];
  force?: boolean;
}): EnterpriseToMerchantSyncResult {
  const targets = options?.targets?.length ? options.targets : listDefaultSyncTargets();
  let updated = 0;
  let skipped = 0;

  for (const { businessTypeId, productLineId } of targets) {
    const enterpriseSnap = resolveEnterpriseSnapshot(businessTypeId, productLineId);
    const merchantSnap = getMerchantPublishedSnapshot(businessTypeId, productLineId);
    const meta = getMerchantPresetSyncMeta(businessTypeId, productLineId);

    if (
      !options?.force &&
      !shouldOverwriteOnEnterpriseSync(merchantSnap, meta, enterpriseSnap.version)
    ) {
      skipped += 1;
      continue;
    }

    const published = publishPlatformPresetSnapshot({
      businessTypeId,
      productLineId,
      version: merchantSnap?.version ?? 0,
      publishedAt: merchantSnap?.publishedAt ?? "",
      selection: structuredClone(enterpriseSnap.selection),
      blueprintVersion: enterpriseSnap.blueprintVersion,
      treeVersion: enterpriseSnap.treeVersion,
    });

    writeMerchantPresetSyncMeta(businessTypeId, productLineId, {
      enterpriseVersion: published.version,
      blueprintVersion: enterpriseSnap.blueprintVersion,
      syncedAt: published.publishedAt,
    });
    updated += 1;
  }

  invalidatePlatformPresetRuntimeCache();
  return { updated, skipped };
}

/** 首次引导：仅为尚无商家快照的组合写入企业默认 */
export function seedMerchantPresetsFromEnterprise(
  businessTypeIds: string[],
  productLineIds: ProductLineId[],
): EnterpriseToMerchantSyncResult {
  const targets: EnterpriseSyncTarget[] = [];
  for (const businessTypeId of businessTypeIds) {
    for (const productLineId of productLineIds) {
      targets.push({ businessTypeId, productLineId });
    }
  }

  let updated = 0;
  let skipped = 0;

  for (const { businessTypeId, productLineId } of targets) {
    const merchantSnap = getMerchantPublishedSnapshot(businessTypeId, productLineId);
    if (merchantSnap && merchantSnap.version > 0) {
      skipped += 1;
      continue;
    }

    const enterpriseSnap = resolveEnterpriseSnapshot(businessTypeId, productLineId);
    const published = publishPlatformPresetSnapshot({
      businessTypeId,
      productLineId,
      version: 0,
      publishedAt: "",
      selection: structuredClone(enterpriseSnap.selection),
      blueprintVersion: enterpriseSnap.blueprintVersion,
      treeVersion: enterpriseSnap.treeVersion,
    });

    writeMerchantPresetSyncMeta(businessTypeId, productLineId, {
      enterpriseVersion: published.version,
      blueprintVersion: enterpriseSnap.blueprintVersion,
      syncedAt: published.publishedAt,
    });
    updated += 1;
  }

  invalidatePlatformPresetRuntimeCache();
  return { updated, skipped };
}

export type MerchantPresetSyncStatus = "aligned" | "customized" | "outdated" | "unsynced";

export function resolveMerchantPresetSyncStatus(
  businessTypeId: string,
  productLineId: ProductLineId,
): MerchantPresetSyncStatus {
  const merchantSnap = getMerchantPublishedSnapshot(businessTypeId, productLineId);
  const meta = getMerchantPresetSyncMeta(businessTypeId, productLineId);
  const enterpriseSnap = getEnterprisePublishedSnapshot(businessTypeId, productLineId);

  if (!merchantSnap || merchantSnap.version === 0) return "unsynced";
  if (!meta) return "customized";
  if (merchantSnap.version > meta.enterpriseVersion) return "customized";

  const blueprint = getActivePublishedBlueprint();
  const enterpriseBlueprintVersion = enterpriseSnap?.blueprintVersion ?? blueprint?.version;
  if (
    enterpriseBlueprintVersion &&
    meta.blueprintVersion &&
    meta.blueprintVersion < enterpriseBlueprintVersion
  ) {
    return "outdated";
  }

  if (enterpriseSnap && merchantSnap.version < enterpriseSnap.version) return "outdated";
  return "aligned";
}

export function formatMerchantPresetSyncStatusLabel(status: MerchantPresetSyncStatus): string {
  switch (status) {
    case "aligned":
      return "与企业默认一致";
    case "customized":
      return "已自定义";
    case "outdated":
      return "企业已更新";
    case "unsynced":
      return "未同步";
  }
}
