// @ts-ignore The seed module is shared with the Node API and intentionally remains plain ESM.
import { createEmenuSeasoningSeedDb } from "../../../scripts/lib/emenu-local-seasoning-seed.mjs";

/** Browser / demo menu view (static; never fetches KPOS). */
const seed = createEmenuSeasoningSeedDb();

export const EMENU_SEASONING_MENU_SNAPSHOT = {
  menuGroups: seed.menuGroups,
  products: seed.products,
  categories: seed.categories,
  sourceMenuVersion: "snapshot-v1",
  fingerprint: "kpos:snapshot-v1",
};
