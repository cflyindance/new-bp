import { mapSeasoningViewToBrandMenuTree } from "./emenu-local-seasoning-menu-map.mjs";
import { normalizeMenuProduct } from "./emenu-local-seasoning-menu-cache.mjs";
import { createLiveMenuProvider } from "./emenu-local-seasoning-menu-provider.mjs";

const LINE_TO_PRODUCT = {
  kiosk: "KIOSK",
  emenu: "EMENU",
  pos: "POS",
  sdi: "SDI",
};

export function lineIdToMenuProduct(lineId) {
  return LINE_TO_PRODUCT[String(lineId || "")] || "EMENU";
}

export async function resolveMenuCatalog({
  req,
  cacheDir,
  product,
  menuProvider = createLiveMenuProvider(),
} = {}) {
  const prod = normalizeMenuProduct(product);
  const view = await menuProvider.resolve({ req, cacheDir, product: prod });
  if (view.source === "live" || view.source === "cache") {
    return {
      tree: mapSeasoningViewToBrandMenuTree(view),
      source: view.source,
      fromCache: Boolean(view.fromCache),
      product: prod,
    };
  }
  return {
    tree: null,
    source: view.source || "static",
    fromCache: false,
    product: prod,
  };
}
