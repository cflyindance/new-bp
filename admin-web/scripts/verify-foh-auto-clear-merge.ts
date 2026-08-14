import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SETTINGS_CATALOG_EXCLUDED_BY_SEQ } from "./lib/settings-catalog-exclusions.mjs";
import { RETIRED_MODULE_SETTING_SEQS } from "../src/config/product-version";
import {
  MODULE_SETTINGS_BY_PATH,
  groupCatalogItemsByCategory,
} from "../src/config/module-settings-catalog";
import { normalizeFohCatalogItemsForGrouping } from "../src/config/foh-settings-group-keys";
import { mergePostPaymentAutoClearMigrationState } from "../src/config/module-settings-auto-clear-table-ui";

const SETTINGS_PATH = "/operations/queue-call/settings";
const GROUP_KEY = "foh-table-clear-ops";
const EXPECTED_SEQS = [534, 642, 351, 347];
const EXPECTED_TITLE = "付款后自动清桌";
const EXPECTED_CLEAR_TABLE_BUTTON_TITLE = "展示清桌快捷按钮";
const EXPECTED_CLEAR_TABLE_BUTTON_DESC = "设置是否展示清桌快捷按钮（eMenu）";

const catalog = MODULE_SETTINGS_BY_PATH[SETTINGS_PATH];
assert.ok(catalog, "前厅设置目录必须存在");
const groups = groupCatalogItemsByCategory(
  normalizeFohCatalogItemsForGrouping(catalog.items),
  catalog.groupOrder,
);
const group = groups.find((entry) => entry.groupKey === GROUP_KEY);
assert.ok(group, "清桌与换企台分组必须存在");
assert.deepEqual(group.items.map((item) => item.seq), EXPECTED_SEQS, "清桌分组只保留合并后的 4 项");
assert.equal(group.items[0]?.title, EXPECTED_TITLE, "合并后的 534 必须使用新标题");
const clearTableButton = group.items.find((item) => item.seq === 642);
assert.ok(clearTableButton, "清桌分组必须保留 seq 642");
assert.equal(
  clearTableButton.title,
  EXPECTED_CLEAR_TABLE_BUTTON_TITLE,
  "seq 642 必须明确表示控制清桌快捷按钮",
);
assert.equal(
  clearTableButton.sceneDesc,
  EXPECTED_CLEAR_TABLE_BUTTON_DESC,
  "seq 642 场景描述必须统一使用清桌快捷按钮文案",
);
assert.equal(catalog.items.some((item) => item.seq === 169), false, "运行时目录不得继续包含 169");
assert.equal(SETTINGS_CATALOG_EXCLUDED_BY_SEQ.has(169), true, "生成目录必须排除已合并的 169");
assert.equal(
  (RETIRED_MODULE_SETTING_SEQS as readonly number[]).includes(169),
  true,
  "所有产品版本均不得展示已退役的 169",
);

const currentLabelFiles = [
  new URL("../src/config/module-settings-catalog.ts", import.meta.url),
  new URL("./lib/settings-catalog-scene-supplement.mjs", import.meta.url),
  new URL("./generate-foh-settings-design-doc.mjs", import.meta.url),
  new URL("../docs/项目文档/平台预设-配置预设四级导航树.md", import.meta.url),
  new URL("../docs/项目文档/前厅管理中心-设置二级导航重设计方案.md", import.meta.url),
  new URL("../../docs/项目文档/前厅管理中心-设置二级导航重设计方案.md", import.meta.url),
];
const staleClearTableButtonLabel =
  /(?:title:\s*"清桌"[^\n]*seq:\s*642|\|\s*642\s*\|[^\n]*\|\s*清桌\s*\||-\s*清桌\s*·[^\n]*seq:\s*642|642\s+清桌按钮)/;
for (const fileUrl of currentLabelFiles) {
  const text = readFileSync(fileUrl, "utf8");
  assert.match(text, /展示清桌快捷按钮/, `${fileUrl.pathname} 必须使用 seq 642 新标题`);
  assert.doesNotMatch(text, staleClearTableButtonLabel, `${fileUrl.pathname} 不得保留 seq 642 旧标题`);
}

const emptyMinutes = {
  emenu: 0,
  kiosk: 0,
  pos: 0,
  "pos-go": 0,
  paypad: 0,
  sdi: 0,
};

const legacyOnly = mergePostPaymentAutoClearMigrationState({
  targetToggleOn: false,
  targetMinutes: emptyMinutes,
  legacyToggleOn: true,
  legacyLines: ["emenu", "pos"],
});
assert.equal(legacyOnly.toggleOn, true, "仅 169 开启时合并开关必须开启");
assert.equal(legacyOnly.minutes.emenu, 60);
assert.equal(legacyOnly.minutes.pos, 60);
assert.equal(legacyOnly.minutes.kiosk, 0, "169 不得为 Kiosk 生成迁移值");

const targetWins = mergePostPaymentAutoClearMigrationState({
  targetToggleOn: true,
  targetMinutes: { ...emptyMinutes, emenu: 25, pos: "0", paypad: -9, sdi: "invalid" },
  legacyToggleOn: false,
  legacyLines: ["emenu", "pos", "paypad", "sdi"],
});
assert.equal(targetWins.toggleOn, true, "仅 534 开启时合并开关必须开启");
assert.equal(targetWins.minutes.emenu, 25, "有效非零 534 值不得被覆盖");
assert.equal(targetWins.minutes.pos, 60, "字符串 0 必须按 0 迁移");
assert.equal(targetWins.minutes.paypad, 60, "负数必须按 0 迁移");
assert.equal(targetWins.minutes.sdi, 60, "非法值必须按 0 迁移");

assert.equal(
  mergePostPaymentAutoClearMigrationState({
    targetToggleOn: false,
    targetMinutes: emptyMinutes,
    legacyToggleOn: false,
    legacyLines: [],
  }).toggleOn,
  false,
  "两个旧开关均关闭时合并开关必须关闭",
);
assert.equal(
  mergePostPaymentAutoClearMigrationState({
    targetToggleOn: true,
    targetMinutes: emptyMinutes,
    legacyToggleOn: true,
    legacyLines: [],
  }).toggleOn,
  true,
  "两个旧开关均开启时合并开关必须开启",
);

console.log("FOH 付款后自动清桌合并校验通过");
