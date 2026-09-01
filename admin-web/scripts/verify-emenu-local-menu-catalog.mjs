import os from "node:os";
import { createFixtureMenuProvider } from "./lib/emenu-local-seasoning-menu-provider.mjs";
import { lineIdToMenuProduct, resolveMenuCatalog } from "./lib/emenu-local-menu-catalog.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(lineIdToMenuProduct("kiosk") === "KIOSK", "kiosk product");
assert(lineIdToMenuProduct("pos") === "POS", "pos product");
assert(lineIdToMenuProduct("unknown") === "EMENU", "default emenu");

const liveView = {
  menuGroups: [
    {
      id: "g1",
      name: "G",
      sortOrder: 10,
      categories: [{ id: "c1", name: "C", sortOrder: 10, productIds: ["77"] }],
    },
  ],
  products: [{ id: "77", code: "X", name: "菜", categoryId: "c1", categoryName: "C", status: "active", emenuSellable: true, sortOrder: 10 }],
  categories: [{ id: "c1", name: "C", sortOrder: 10 }],
  fingerprint: "live-fp",
  sourceMenuVersion: "v1",
};

const live = createFixtureMenuProvider(liveView);
live.resolve = async () => ({ ...liveView, fromCache: false, source: "live", product: "KIOSK" });

const catalog = await resolveMenuCatalog({
  req: { headers: {} },
  cacheDir: os.tmpdir(),
  product: "KIOSK",
  menuProvider: live,
});
assert(catalog.source === "live" && catalog.tree?.[0]?.categories[0]?.dishes[0]?.id === "77", "live tree");

const staticProvider = {
  async resolve() {
    return { menuGroups: [], products: [], categories: [], fingerprint: "static", source: "static", fromCache: false, product: "EMENU" };
  },
};
const fallback = await resolveMenuCatalog({
  req: { headers: {} },
  cacheDir: os.tmpdir(),
  product: "EMENU",
  menuProvider: staticProvider,
});
assert(fallback.source === "static" && fallback.tree === null, "static returns null tree");

console.log("verify-emenu-local-menu-catalog: ok");
