import assert from "node:assert/strict";
import { NAV_MODULES } from "../src/config/navigation";
import { getModuleSettingsCatalog, getModuleSettingsItemHref } from "../src/config/module-settings-catalog";
import { resolvePageSaveKey } from "../src/config/page-settings-draft";
import { renderFohBrandMenuPage, FOH_BRAND_MENU_PATH, FOH_BRAND_MANAGEMENT_PATH, FOH_BRAND_SETTINGS_PATH } from "../src/config/foh-brand-menu-settings-ui";

const branch = NAV_MODULES.find((m) => m.id === "queue-call")!.children.find((c) => c.id === "qc-brand-menu")!;
assert.deepEqual(branch.children!.map((c) => [c.title, c.path]), [
  ["品牌管理", FOH_BRAND_MANAGEMENT_PATH], ["设置", FOH_BRAND_SETTINGS_PATH],
]);
for (const path of [FOH_BRAND_MENU_PATH, FOH_BRAND_MANAGEMENT_PATH, FOH_BRAND_SETTINGS_PATH]) {
  assert.equal(resolvePageSaveKey(path), FOH_BRAND_MENU_PATH, "child navigation must retain the existing draft bucket");
}
const catalog = getModuleSettingsCatalog(FOH_BRAND_MANAGEMENT_PATH)!;
assert.deepEqual(catalog.items.map((item) => item.seq).sort(), [530, 531, 547]);
for (const item of catalog.items) {
  assert.equal(item.groupKey, "brand-menu-presentation", "existing preset keys must stay stable");
  assert.equal(getModuleSettingsItemHref(catalog.settingsPath, item),
    `${item.seq === 547 ? FOH_BRAND_MANAGEMENT_PATH : FOH_BRAND_SETTINGS_PATH}#${item.id}`);
}
for (const path of [FOH_BRAND_SETTINGS_PATH, `${FOH_BRAND_SETTINGS_PATH}#s530-example`]) {
  const html = renderFohBrandMenuPage({ path, brandsPanelHtml: "BRAND_LIST", settingsPanelHtml: "CHANNEL_SETTINGS" });
  assert(html.includes("CHANNEL_SETTINGS")); assert(!html.includes("BRAND_LIST"));
  assert(!html.includes('role="tab"'));
}
const brands = renderFohBrandMenuPage({ path: FOH_BRAND_MANAGEMENT_PATH, brandsPanelHtml: "BRAND_LIST", settingsPanelHtml: "CHANNEL_SETTINGS" });
assert(brands.includes("BRAND_LIST")); assert(!brands.includes("CHANNEL_SETTINGS"));
console.log("PASS shop-in-shop routes, existing preset identifiers, shared save bucket, setting deep links and page separation");

// A fresh default-on field must record its very first off edit instead of treating off as its old default.
const memory = new Map<string, string>();
const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) };
const location = { hash: `#${FOH_BRAND_SETTINGS_PATH}` };
const mockWindow = Object.assign(new EventTarget(), { location, localStorage: storage });
Object.assign(globalThis, { window: mockWindow, location, localStorage: storage });
const { initPageSaveSession, readPageDraftField, isPageSaveDirty, discardPageDraft } = await import("../src/config/page-settings-draft");
const { writeModuleSettingCheckbox } = await import("../src/config/module-settings-form-ui");
initPageSaveSession(FOH_BRAND_MENU_PATH);
writeModuleSettingCheckbox("531-c-line-kiosk", false, true);
assert.equal(readPageDraftField(FOH_BRAND_MENU_PATH, "531-c-line-kiosk"), "0");
assert(isPageSaveDirty(FOH_BRAND_MENU_PATH));
assert.equal(memory.get("bplant-module-setting-field:531-c-line-kiosk"), undefined, "edit must remain a draft");
discardPageDraft(FOH_BRAND_MENU_PATH);
assert.equal(readPageDraftField(FOH_BRAND_MENU_PATH, "531-c-line-kiosk"), undefined);
console.log("PASS first default-on checkbox edit and discard");
