import type { BrandMenuGroupNode } from "./brand-menu-structure-picker-ui";

export type BrandMenuCatalogSource = "live" | "cache" | "static" | "snapshot" | "fixture";

const LINE_TO_PRODUCT: Record<string, string> = {
  kiosk: "KIOSK",
  emenu: "EMENU",
  pos: "POS",
  sdi: "SDI",
};

export function lineIdToMenuProduct(lineId: string): string {
  return LINE_TO_PRODUCT[lineId] || "EMENU";
}

export async function fetchBrandMenuCatalog(product: string): Promise<{
  tree: BrandMenuGroupNode[] | null;
  source: BrandMenuCatalogSource;
  fromCache: boolean;
}> {
  try {
    const response = await fetch(`/api/v1/emenu-local/menu-catalog?product=${encodeURIComponent(product)}`, {
      credentials: "same-origin",
    });
    if (!response.ok) return { tree: null, source: "static", fromCache: false };
    const body = await response.json();
    if ((body.source === "live" || body.source === "cache") && Array.isArray(body.tree)) {
      return {
        tree: body.tree as BrandMenuGroupNode[],
        source: body.source,
        fromCache: Boolean(body.fromCache),
      };
    }
    return { tree: null, source: body.source || "static", fromCache: false };
  } catch {
    return { tree: null, source: "static", fromCache: false };
  }
}
