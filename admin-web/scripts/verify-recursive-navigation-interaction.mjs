import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

const openHandlers = [
  "setInventorySecondarySheetOpen(true)",
  "setProductCenterMainSecondarySheetOpen(true)",
  "setMarketingSecondarySheetOpen(true)",
  "setPromotionsSecondarySheetOpen(true)",
  "setMembersSecondarySheetOpen(true)",
  "setReportsSecondarySheetOpen(true)",
  "setPrintSecondarySheetOpen(true)",
  "setReservationsSecondarySheetOpen(true)",
  "setGiftCardsSecondarySheetOpen(true)",
  "setNavModuleSheetOpen(sid, true)",
];

for (const marker of openHandlers) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing primary sheet handler: ${marker}`);
  const handlerTail = source.slice(start, source.indexOf("return;", start));
  assert.doesNotMatch(handlerTail, /replaceHashPath\(/, `${marker} must not navigate to a default child`);
}

assert.match(source, /let activeTertiarySheetTrail: string\[\] = \[\];/);
assert.match(source, /data-tertiary-sheet-frame=/);
assert.match(source, /data-tertiary-sheet-back/);
assert.match(source, /activeTertiarySheetTrail\.push\(groupId\);\s+clearAllHubSheetSearch\(\);\s+mount\(\);/);
assert.doesNotMatch(
  source.slice(source.indexOf('closest("[data-tertiary-sidebar-toggle]")'), source.indexOf('document.getElementById("theme-toggle")')),
  /replaceHashPath\(/,
  "drilling into a branch must not navigate",
);
assert.match(source, /navLink\.closest\("\[data-hub-sheet-root\]"\)[\s\S]*closeAllSidebarSecondarySheets\(\)/);

console.log("recursive navigation interaction verified");
