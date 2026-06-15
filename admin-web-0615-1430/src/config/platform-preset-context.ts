/**
 * 当前门店生效的业态 × 产线上下文（P1 侧栏过滤；P2 引导页写入）
 */
import type { ProductLineId } from "./platform-preset-catalog";
import { getEffectivePresetSnapshot } from "./platform-preset-store";
import { invalidatePlatformPresetRuntimeCache } from "./platform-preset-runtime-cache";

export interface PlatformPresetContext {
  businessTypeId: string;
  productLineId: ProductLineId;
  presetVersion: number;
  appliedAt: string;
}

const CONTEXT_STORAGE_KEY = "menusifu:platform-preset-context-v1";

let memoryContext: PlatformPresetContext | null | undefined;

export function readPlatformPresetContext(): PlatformPresetContext | null {
  if (memoryContext !== undefined) return memoryContext;
  try {
    const raw = sessionStorage.getItem(CONTEXT_STORAGE_KEY);
    if (!raw) {
      memoryContext = null;
      return memoryContext;
    }
    memoryContext = JSON.parse(raw) as PlatformPresetContext;
    return memoryContext;
  } catch {
    memoryContext = null;
    return memoryContext;
  }
}

export function writePlatformPresetContext(ctx: PlatformPresetContext | null): void {
  memoryContext = ctx;
  invalidatePlatformPresetRuntimeCache();
  try {
    if (!ctx) sessionStorage.removeItem(CONTEXT_STORAGE_KEY);
    else sessionStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

/** 将有效预设（已发布或系统默认）应用为当前门店侧栏上下文 */
export function applyPlatformPresetContext(
  businessTypeId: string,
  productLineId: ProductLineId,
): PlatformPresetContext {
  const snap = getEffectivePresetSnapshot(businessTypeId, productLineId);
  const ctx: PlatformPresetContext = {
    businessTypeId,
    productLineId,
    presetVersion: snap.version,
    appliedAt: new Date().toISOString(),
  };
  writePlatformPresetContext(ctx);
  return ctx;
}

export function clearPlatformPresetContext(): void {
  writePlatformPresetContext(null);
}

export function formatPlatformPresetContextLabel(ctx: PlatformPresetContext): string {
  return `${ctx.businessTypeId} · ${ctx.productLineId} · v${ctx.presetVersion}`;
}
