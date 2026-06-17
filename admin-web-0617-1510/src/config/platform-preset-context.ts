/**
 * 当前门店生效的业态 × 产线上下文（P1 侧栏过滤；P2 引导页写入，支持多选并集）
 */
import type { ProductLineId } from "./platform-preset-catalog";
import { getEffectivePresetSnapshot } from "./platform-preset-store";
import { mergePresetSelections } from "./platform-preset-selection-merge";
import { invalidatePlatformPresetRuntimeCache } from "./platform-preset-runtime-cache";

export interface PlatformPresetContextCombo {
  businessTypeId: string;
  productLineId: ProductLineId;
  version: number;
}

export interface PlatformPresetContext {
  businessTypeIds: string[];
  productLineIds: ProductLineId[];
  combos: PlatformPresetContextCombo[];
  presetVersion: number;
  appliedAt: string;
}

const CONTEXT_STORAGE_KEY = "menusifu:platform-preset-context-v1";

let memoryContext: PlatformPresetContext | null | undefined;

function normalizeStoredContext(raw: unknown): PlatformPresetContext | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<
    PlatformPresetContext & { businessTypeId?: string; productLineId?: ProductLineId }
  >;

  if (Array.isArray(r.businessTypeIds) && Array.isArray(r.productLineIds) && Array.isArray(r.combos)) {
    return {
      businessTypeIds: r.businessTypeIds,
      productLineIds: r.productLineIds,
      combos: r.combos,
      presetVersion: r.presetVersion ?? 0,
      appliedAt: r.appliedAt ?? new Date().toISOString(),
    };
  }

  if (r.businessTypeId && r.productLineId) {
    const snap = getEffectivePresetSnapshot(r.businessTypeId, r.productLineId);
    return {
      businessTypeIds: [r.businessTypeId],
      productLineIds: [r.productLineId],
      combos: [{ businessTypeId: r.businessTypeId, productLineId: r.productLineId, version: snap.version }],
      presetVersion: r.presetVersion ?? snap.version,
      appliedAt: r.appliedAt ?? new Date().toISOString(),
    };
  }

  return null;
}

export function readPlatformPresetContext(): PlatformPresetContext | null {
  if (memoryContext !== undefined) return memoryContext;
  try {
    const raw = sessionStorage.getItem(CONTEXT_STORAGE_KEY);
    if (!raw) {
      memoryContext = null;
      return memoryContext;
    }
    memoryContext = normalizeStoredContext(JSON.parse(raw));
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

export function buildPlatformPresetCombos(
  businessTypeIds: string[],
  productLineIds: ProductLineId[],
): PlatformPresetContextCombo[] {
  return businessTypeIds.flatMap((businessTypeId) =>
    productLineIds.map((productLineId) => {
      const snap = getEffectivePresetSnapshot(businessTypeId, productLineId);
      return { businessTypeId, productLineId, version: snap.version };
    }),
  );
}

/** 将有效预设（已发布或系统默认）应用为当前门店侧栏上下文（多选并集） */
export function applyPlatformPresetContext(
  businessTypeIds: string[],
  productLineIds: ProductLineId[],
): PlatformPresetContext {
  const combos = buildPlatformPresetCombos(businessTypeIds, productLineIds);
  const ctx: PlatformPresetContext = {
    businessTypeIds,
    productLineIds,
    combos,
    presetVersion: combos.reduce((max, c) => Math.max(max, c.version), 0),
    appliedAt: new Date().toISOString(),
  };
  writePlatformPresetContext(ctx);
  return ctx;
}

/** 当前上下文下合并后的 selection（多组合并集） */
export function getMergedPlatformPresetSelection(
  ctx: PlatformPresetContext,
): Record<string, import("./platform-preset-store").PlatformPresetNodeSelection> {
  const selections = ctx.combos.map(
    (c) => getEffectivePresetSnapshot(c.businessTypeId, c.productLineId).selection,
  );
  return mergePresetSelections(selections);
}

export function clearPlatformPresetContext(): void {
  writePlatformPresetContext(null);
}

export function formatPlatformPresetContextLabel(ctx: PlatformPresetContext): string {
  return `${ctx.businessTypeIds.length} 业态 · ${ctx.productLineIds.length} 产线 · ${ctx.combos.length} 组并集`;
}
