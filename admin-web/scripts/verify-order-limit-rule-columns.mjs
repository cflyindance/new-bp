import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlPath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);
const source = await readFile(htmlPath, "utf8");

assert.match(source, /RULE_COLUMN_PREFS_KEY = "order-limit:rule-list-columns:v1"/, "列偏好应使用独立版本化存储键");
assert.match(source, /RULE_DEFAULT_COLUMNS = \["name", "strategy", "persons", "productScope", "effectiveStores", "effectiveTime", "authorization", "status", "actions"\]/, "默认字段应采用已确认的平衡模式");
assert.match(source, /RULE_FIXED_COLUMNS = \["name", "status", "actions"\]/, "规则名称、状态、操作应固定展示");
assert.match(source, /function ruleColumnDefinitions\(\)[\s\S]*?步骤 1 · 规则类型[\s\S]*?步骤 2 · 场景配置[\s\S]*?步骤 3 · 限购数量[\s\S]*?步骤 4 · 超限授权[\s\S]*?步骤 5 · 生效范围/, "字段注册表应覆盖前五个配置步骤");
assert.match(source, /function normalizedVisibleRuleColumns[\s\S]*?RULE_FIXED_COLUMNS\.forEach/, "字段偏好归一化时应强制补回固定列");
assert.match(source, /function loadVisibleRuleColumns[\s\S]*?localStorage\.getItem\(RULE_COLUMN_PREFS_KEY\)/, "应从浏览器读取字段偏好");
assert.match(source, /function saveVisibleRuleColumns[\s\S]*?localStorage\.setItem\(RULE_COLUMN_PREFS_KEY/, "应将字段偏好保存到浏览器");
assert.match(source, /id="ruleColumnSettingsToggle"[\s\S]*?id="ruleColumnSettingsPanel"[\s\S]*?id="ruleColumnRestoreDefault"/, "应提供字段设置和恢复默认入口");
assert.match(source, /data-rule-column-head[\s\S]*?data-rule-column-cell/, "表头和表格行应按可见字段动态渲染");
assert.match(source, /function ruleDraft\(rule\)[\s\S]*?editorDraft \|\| rule\.authoringDraft/, "新规则应优先使用完整编辑草稿字段");
assert.match(source, /rule\.type \|\| "—"|rule\.persons \|\|/, "历史规则应保留扁平字段回退");

console.log("Menu order limit configurable rule columns verification passed");
