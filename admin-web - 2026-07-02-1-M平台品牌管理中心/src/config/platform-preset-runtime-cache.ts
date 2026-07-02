/**
 * 平台预设 · 运行时 selection 缓存（避免每次路由 mount 重复解析 storage / 重建树）
 */
import { getMergedPlatformPresetSelection, readPlatformPresetContext } from "./platform-preset-context";
import { getStoreRevision } from "./platform-preset-store";
import type { PlatformPresetNodeSelection } from "./platform-preset-store";

let cachedSelectionKey = "";
let cachedSelection: Record<string, PlatformPresetNodeSelection> | null = null;

/** 当前会话上下文下的有效 selection（多组合并集） */
export function getRuntimePresetSelection(): Record<string, PlatformPresetNodeSelection> | null {
  const ctx = readPlatformPresetContext();
  if (!ctx) {
    invalidatePlatformPresetRuntimeCache();
    return null;
  }

  const key = `${ctx.appliedAt}:${getStoreRevision()}:${ctx.combos
    .map((c) => `${c.businessTypeId}:${c.productLineId}:v${c.version}`)
    .sort()
    .join("|")}`;

  if (cachedSelectionKey === key && cachedSelection) {
    return cachedSelection;
  }

  cachedSelectionKey = key;
  cachedSelection = getMergedPlatformPresetSelection(ctx);
  return cachedSelection;
}

export function invalidatePlatformPresetRuntimeCache(): void {
  cachedSelectionKey = "";
  cachedSelection = null;
}
