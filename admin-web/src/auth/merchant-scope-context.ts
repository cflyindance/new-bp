/**
 * 商家后台 · 连锁数据范围视角（集团总部 / 品牌多门店 / 门店）
 */
import { readSidebarNavLayoutPreset } from "../config/sidebar-nav-order";
import { readActiveImpersonation } from "../config/enterprise-merchant-impersonate";
import { resolveChainBrandContext } from "../config/merchant-chain-brand-sync";

export type ChainDataPerspective = "group-hq" | "brand" | "store";

export const CHAIN_DATA_PERSPECTIVE_KEY = "menusifu:chain-data-perspective-v1";
export const CHAIN_ANCHOR_BRAND_KEY = "menusifu:chain-anchor-brand-v1";
export const CHAIN_ANCHOR_STORE_KEY = "menusifu:chain-anchor-store-v1";

export function readStoredChainDataPerspective(): ChainDataPerspective | null {
  try {
    const raw = sessionStorage.getItem(CHAIN_DATA_PERSPECTIVE_KEY);
    if (raw === "group-hq" || raw === "brand" || raw === "store") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function readChainAnchorBrandId(): string | null {
  try {
    return sessionStorage.getItem(CHAIN_ANCHOR_BRAND_KEY);
  } catch {
    return null;
  }
}

export function readChainAnchorStoreId(): string | null {
  try {
    return sessionStorage.getItem(CHAIN_ANCHOR_STORE_KEY);
  } catch {
    return null;
  }
}

export function clearChainDataPerspectiveState(): void {
  try {
    sessionStorage.removeItem(CHAIN_DATA_PERSPECTIVE_KEY);
    sessionStorage.removeItem(CHAIN_ANCHOR_BRAND_KEY);
    sessionStorage.removeItem(CHAIN_ANCHOR_STORE_KEY);
  } catch {
    /* ignore */
  }
}

/** 默认连锁数据视角（登录 / 切到连锁版布局时） */
export function getDefaultChainDataPerspective(): ChainDataPerspective {
  if (readActiveImpersonation()) return "brand";
  return "group-hq";
}

/** 解析当前生效的数据范围视角（结合布局层与存储；演示环境不按 storeAccess 降级） */
export function resolveChainDataPerspective(): ChainDataPerspective {
  if (readSidebarNavLayoutPreset() === "store") return "store";
  if (readActiveImpersonation()) return "brand";

  const stored = readStoredChainDataPerspective();
  if (stored === "group-hq" || stored === "brand") return stored;
  return getDefaultChainDataPerspective();
}

/** 顶栏视角菜单是否可选（演示：已登录即可切换；代登录仅品牌视角） */
export function canUseChainDataPerspective(perspective: "group-hq" | "brand"): boolean {
  if (readActiveImpersonation()) return perspective === "brand";
  return true;
}

export function resolveDefaultAnchorBrandId(): string | null {
  const stored = readChainAnchorBrandId();
  if (stored) return stored;
  return resolveChainBrandContext()?.anchorMerchantId ?? null;
}

export function writeChainDataPerspective(
  perspective: ChainDataPerspective,
  anchors?: { brandId?: string; storeId?: string },
): void {
  const effective =
    readActiveImpersonation() && perspective === "group-hq" ? "brand" : perspective;
  try {
    if (effective === "group-hq" || effective === "brand" || effective === "store") {
      sessionStorage.setItem(CHAIN_DATA_PERSPECTIVE_KEY, effective);
    }
    if (anchors?.brandId) {
      sessionStorage.setItem(CHAIN_ANCHOR_BRAND_KEY, anchors.brandId);
    } else if (effective === "brand") {
      const fallback = resolveChainBrandContext()?.anchorMerchantId;
      if (fallback) sessionStorage.setItem(CHAIN_ANCHOR_BRAND_KEY, fallback);
    } else if (effective === "group-hq") {
      sessionStorage.removeItem(CHAIN_ANCHOR_BRAND_KEY);
    }
    if (anchors?.storeId) {
      sessionStorage.setItem(CHAIN_ANCHOR_STORE_KEY, anchors.storeId);
    } else if (effective !== "store") {
      sessionStorage.removeItem(CHAIN_ANCHOR_STORE_KEY);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("menusifu:scope-perspective-change", {
      detail: { perspective: effective, ...anchors },
    }),
  );
}

export function ensureChainPerspectiveForCurrentLayout(): void {
  if (readSidebarNavLayoutPreset() !== "chain") return;
  const perspective = getDefaultChainDataPerspective();
  const brandId = perspective === "brand" ? resolveDefaultAnchorBrandId() ?? undefined : undefined;
  if (!readStoredChainDataPerspective()) {
    writeChainDataPerspective(perspective, brandId ? { brandId } : undefined);
  }
}

export function isGroupHqDataPerspective(): boolean {
  return resolveChainDataPerspective() === "group-hq";
}

export function isBrandDataPerspective(): boolean {
  return resolveChainDataPerspective() === "brand";
}

export function isStoreDataPerspective(): boolean {
  return resolveChainDataPerspective() === "store";
}
