import {
  emptyBrandMenuStructureByLine,
  mergeKeysOutsideTree,
  BRAND_MENU_STRUCTURE_TREE,
  BRAND_MENU_LINE_OPTIONS,
} from "../src/config/brand-menu-structure-picker-ui.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(BRAND_MENU_LINE_OPTIONS.some((line) => line.id === "pos"), "POS line exists");
const empty = emptyBrandMenuStructureByLine();
assert(Array.isArray(empty.pos) && empty.pos.length === 0, "empty includes pos");

const merged = mergeKeysOutsideTree(
  ["d:old:x:y", "d:g-chinese:c-chinese-hot:d-kungpao"],
  ["d:g-chinese:c-chinese-hot:d-mapo"],
  BRAND_MENU_STRUCTURE_TREE,
);
assert(merged.includes("d:old:x:y"), "keeps out-of-tree key");
assert(merged.includes("d:g-chinese:c-chinese-hot:d-mapo"), "keeps next key");
assert(!merged.includes("d:g-chinese:c-chinese-hot:d-kungpao"), "drops unchecked in-tree key");

console.log("verify-brand-menu-structure-picker: ok");
