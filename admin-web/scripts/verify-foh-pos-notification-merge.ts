import assert from "node:assert/strict";
import {
  groupCatalogItemsByCategory,
  MODULE_SETTINGS_BY_PATH,
} from "../src/config/module-settings-catalog";
import {
  FOH_SETTINGS_GROUP_TITLES,
  normalizeFohCatalogGroupKey,
  normalizeFohCatalogItemsForGrouping,
  normalizeLegacyFohSettingsPath,
} from "../src/config/foh-settings-group-keys";

const SETTINGS_PATH = "/operations/queue-call/settings";
const OLD_GROUP_KEY = "foh-pos-notification-control";
const TARGET_GROUP_KEY = "foh-pos-order-alerts";
const EXPECTED_GROUP_TITLE = "消息类型提醒";
const EXPECTED_SEQS = [331, 332, 638, 639, 637, 110];

const catalog = MODULE_SETTINGS_BY_PATH[SETTINGS_PATH];
assert.ok(catalog, "前厅设置目录必须存在");

const normalizedItems = normalizeFohCatalogItemsForGrouping(catalog.items);
const groups = groupCatalogItemsByCategory(normalizedItems, catalog.groupOrder);
const targetGroup = groups.find((group) => group.groupKey === TARGET_GROUP_KEY);

assert.equal(
  groups.some((group) => group.groupKey === OLD_GROUP_KEY),
  false,
  "合并后不得继续生成 POS 通知总控分组",
);
assert.ok(targetGroup, "合并后必须保留消息类型提醒分组");
assert.equal(targetGroup.groupTitle, EXPECTED_GROUP_TITLE, "目标分组必须展示新文案");
assert.equal(
  targetGroup.items.every((item) => item.groupTitle === EXPECTED_GROUP_TITLE),
  true,
  "目标分组内的所有配置项必须使用新分组文案",
);
assert.deepEqual(
  targetGroup.items.map((item) => item.seq),
  EXPECTED_SEQS,
  "消息类型提醒中的功能顺序必须保持设计顺序",
);
assert.equal(
  normalizeFohCatalogGroupKey(OLD_GROUP_KEY),
  TARGET_GROUP_KEY,
  "旧规范分组键必须兼容映射到消息类型提醒",
);
assert.equal(
  normalizeFohCatalogGroupKey("notification-basics"),
  TARGET_GROUP_KEY,
  "员工端通知类型和新单语音播报的原始分组必须映射到消息类型提醒",
);
assert.equal(
  Object.hasOwn(FOH_SETTINGS_GROUP_TITLES, OLD_GROUP_KEY),
  false,
  "分组标题表不得继续暴露 POS 通知总控",
);
assert.equal(
  normalizeLegacyFohSettingsPath(`${SETTINGS_PATH}?group=${OLD_GROUP_KEY}`),
  `${SETTINGS_PATH}/${TARGET_GROUP_KEY}`,
  "旧查询链接必须跳转到消息类型提醒",
);
assert.equal(
  normalizeLegacyFohSettingsPath(`${SETTINGS_PATH}?group=unknown-future-group`),
  `${SETTINGS_PATH}?group=unknown-future-group`,
  "其他未知分组键必须保持现有回退行为",
);

console.log("FOH POS 通知分组合并校验通过");
