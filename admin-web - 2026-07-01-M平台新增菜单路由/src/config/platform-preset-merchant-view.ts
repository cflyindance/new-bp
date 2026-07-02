/**
 * 商家后台 · 平台预设列表可见范围（严格对齐登录引导所选业态×产线）
 */
import {
  PLATFORM_PRESET_PRODUCT_LINES,
  businessTypeLabel,
  productLineLabel,
  type ProductLineId,
} from "./platform-preset-catalog";
import { readPlatformPresetContext } from "./platform-preset-context";
import { listCustomBusinessTypes } from "./enterprise-platform-preset-store";

export interface MerchantPresetViewScope {
  hasContext: boolean;
  businessTypeIds: string[];
  productLineIds: ProductLineId[];
  comboCount: number;
  appliedAt?: string;
}

export function resolveMerchantPresetViewScope(): MerchantPresetViewScope {
  const ctx = readPlatformPresetContext();
  if (!ctx?.businessTypeIds.length || !ctx.productLineIds.length) {
    return { hasContext: false, businessTypeIds: [], productLineIds: [], comboCount: 0 };
  }
  return {
    hasContext: true,
    businessTypeIds: [...ctx.businessTypeIds],
    productLineIds: [...ctx.productLineIds],
    comboCount: ctx.combos.length,
    appliedAt: ctx.appliedAt,
  };
}

export function isComboInMerchantViewScope(
  businessTypeId: string,
  productLineId: ProductLineId,
  viewScope: MerchantPresetViewScope = resolveMerchantPresetViewScope(),
): boolean {
  if (!viewScope.hasContext) return false;
  return (
    viewScope.businessTypeIds.includes(businessTypeId) &&
    viewScope.productLineIds.includes(productLineId)
  );
}

export function clampSelectedBusinessTypeId(preferred: string, allowed: string[]): string {
  if (!allowed.length) return preferred;
  return allowed.includes(preferred) ? preferred : allowed[0]!;
}

export function filterProductLinesForMerchantView(
  viewScope: MerchantPresetViewScope,
): (typeof PLATFORM_PRESET_PRODUCT_LINES)[number][] {
  if (!viewScope.hasContext) return [];
  const allowed = new Set(viewScope.productLineIds);
  return PLATFORM_PRESET_PRODUCT_LINES.filter((l) => allowed.has(l.id));
}

export function formatMerchantViewScopeLabels(viewScope: MerchantPresetViewScope): {
  businessTypes: string;
  productLines: string;
} {
  const custom = listCustomBusinessTypes();
  return {
    businessTypes: viewScope.businessTypeIds
      .map((id) => businessTypeLabel(id, custom.find((c) => c.id === id)?.label))
      .join("、"),
    productLines: viewScope.productLineIds.map((id) => productLineLabel(id)).join("、"),
  };
}

export function formatMerchantViewAppliedAt(appliedAt?: string): string {
  if (!appliedAt) return "";
  return appliedAt.slice(0, 19).replace("T", " ");
}
