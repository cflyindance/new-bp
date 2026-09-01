import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "dist/Configuration center/buffet-rule.html"), "utf8");
const inlineScripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), match => match[1]);
assert.equal(inlineScripts.length, 1, "列表页应只有一个内联业务脚本");

for (const copy of [
  "整单限制",
  "每轮限制",
  "其他规则",
  "系统默认",
  "删除后，下次进入列表会恢复为空白且禁用的默认规则",
]) {
  assert.ok(html.includes(copy), `列表缺少文案：${copy}`);
}

const templates = [
  ["order|order_lifetime|dish", "order_lifetime"],
  ["order|order_lifetime|dish_set", "order_lifetime"],
  ["party_size|order_lifetime|dish", "order_lifetime"],
  ["party_size|order_lifetime|dish_set", "order_lifetime"],
  ["order|per_round|dish", "per_round"],
  ["order|per_round|dish_set", "per_round"],
  ["party_size|per_round|dish", "per_round"],
  ["party_size|per_round|dish_set", "per_round"],
].map(([key, group]) => ({ key, group }));

const records = templates.map((template, index) => ({
  id: `default-${index + 1}`,
  origin: "system_default",
  defaultScenarioKey: template.key,
  status: "disabled",
  authoringConfig: { name: `默认规则${index + 1}`, subject: template.key.startsWith("party_size") ? "party_size" : "order", targetType: template.key.endsWith("dish_set") ? "dish_set" : "dish", enabledPeriods: [template.group], deployStoreIds: [] },
}));
records.splice(2, 0, {
  id: "custom-1",
  status: "disabled",
  authoringConfig: { name: "自定义规则", subject: "order", targetType: "category", enabledPeriods: ["multi_round"], deployStoreIds: [] },
});

const list = { innerHTML: "", onclick: null };
const createRule = { onclick: null };
const context = {
  window: {
    ORDER_LIMIT_MODULE_PROFILE: {
      defaultScenarios: templates,
      createDefaultScenarioRule() {},
      routes: { editor: "buffet-rule-editor.html" },
      repository: { loadForAuthoringList: () => records, saveRules() {} },
      lifecycle: {},
    },
  },
  document: { getElementById: id => id === "ruleList" ? list : createRule },
  location: { href: "" },
  AppDialogs: { showToast() {}, confirm: async () => false },
  console,
};
context.window.window = context.window;
context.window.AppDialogs = context.AppDialogs;
vm.runInNewContext(inlineScripts[0], context, { filename: "buffet-rule.html" });

const rendered = list.innerHTML;
const whole = rendered.indexOf("整单限制");
const round = rendered.indexOf("每轮限制");
const custom = rendered.indexOf("其他规则");
assert.ok(whole >= 0 && round > whole && custom > round, "分组顺序应为整单、每轮、其他规则");
for (let index = 1; index <= 8; index += 1) {
  const position = rendered.indexOf(`默认规则${index}`);
  if (index <= 4) assert.ok(position > whole && position < round, `默认规则${index}应位于整单限制`);
  else assert.ok(position > round && position < custom, `默认规则${index}应位于每轮限制`);
}
assert.ok(rendered.indexOf("自定义规则") > custom, "普通规则应位于其他规则");
assert.equal((rendered.match(/系统默认/g) || []).length, 8, "仅八条默认规则显示系统默认标识");

const api = context.window.__BUFFET_RULE_LIST_TEST_API__;
assert.ok(api, "列表页应暴露轻量测试接口");
assert.equal(api.groupFor(records[0]), "order_lifetime");
assert.equal(api.groupFor(records[5]), "per_round");
assert.equal(api.groupFor(records[2]), "custom");
assert.match(api.deleteMessageFor(records[0]), /恢复为空白且禁用/);
assert.match(api.deleteMessageFor(records[2]), /无法恢复/);

console.log("verify-buffet-default-list-ui: OK");
