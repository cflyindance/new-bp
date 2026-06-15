/**
 * 平台预设 · 运行时 selection 缓存（避免每次路由 mount 重复解析 storage / 重建树）
 */
import { readPlatformPresetContext } from "./platform-preset-context";
import { presetComboKey, type ProductLineId } from "./platform-preset-catalog";
import type { PlatformPresetNodeSelection } from "./platform-preset-store";
import { getEffectivePresetSnapshot, getStoreRevision, readStoreSnapshot } from "./platform-preset-store";

let cachedSelectionKey = "";
let cachedSelection: Record<string, PlatformPresetNodeSelection> | null = null;

function buildRuntimeSelectionCacheKey(
  businessTypeId: string,
  productLineId: ProductLineId,
  publishedVersion: number,
  appliedAt: string,
): string {
  return `${presetComboKey(businessTypeId, productLineId)}:${publishedVersion}:${getStoreRevision()}:${appliedAt}`;
}

/** 当前会话上下文下的有效 selection（已发布或系统默认） */
export function getRuntimePresetSelection(): Record<string, PlatformPresetNodeSelection> | null {
  const ctx = readPlatformPresetContext();
  if (!ctx) {
    invalidatePlatformPresetRuntimeCache();
    return null;
  }

  const publishedVersion =
    readStoreSnapshot().snapshots[presetComboKey(ctx.businessTypeId, ctx.productLineId)]?.version ?? 0;
  const key = buildRuntimeSelectionCacheKey(
    ctx.businessTypeId,
    ctx.productLineId,
    publishedVersion,
    ctx.appliedAt,
  );

  if (cachedSelectionKey === key && cachedSelection) {
    return cachedSelection;
  }

  const snap = getEffectivePresetSnapshot(ctx.businessTypeId, ctx.productLineId);

  cachedSelectionKey = key;
  cachedSelection = snap.selection;
  return cachedSelection;
}

export function invalidatePlatformPresetRuntimeCache(): void {
  cachedSelectionKey = "";
  cachedSelection = null;
}
