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
  "每轮常用组合模板",
  "每轮原子规则",
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
  ["combo|per_round|dish|table", "per_round_combo"],
  ["combo|per_round|dish_set|piece|table", "per_round_combo"],
  ["combo|per_round|dish_set|kind|table", "per_round_combo"],
  ["combo|per_round|dish|party_size", "per_round_combo"],
  ["combo|per_round|dish_set|piece|party_size", "per_round_combo"],
  ["combo|per_round|dish_set|kind|party_size", "per_round_combo"],
  ["order|per_round|total", "per_round"],
  ["party_size|per_round|total", "per_round"],
  ["order|per_round|dish", "per_round"],
  ["party_size|per_round|dish", "per_round"],
  ["order|per_round|dish_set|piece", "per_round"],
  ["party_size|per_round|dish_set|piece", "per_round"],
  ["order|per_round|dish_set|kind", "per_round"],
  ["party_size|per_round|dish_set|kind", "per_round"],
].map(([key, group], index) => ({ key, group, legacyCapabilityIds: group === "order_lifetime" ? (index === 0 ? ["KPOS-O01", "KPOS-O05", "KPOS-O06"] : index === 1 ? ["KPOS-O02", "KPOS-O05", "KPOS-O07", "KPOS-O08"] : index === 2 ? ["KPOS-O03", "KPOS-O05", "KPOS-O06"] : ["KPOS-O04", "KPOS-O05", "KPOS-O07", "KPOS-O08"]) : ["KPOS-R01"], coverageStatus: group === "order_lifetime" && (index === 1 || index === 3) ? "defined_extension" : "complete" }));

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
      legacyCapabilities: Object.fromEntries([...Array.from({ length: 14 }, (_, index) => {
        const id = `KPOS-O${String(index + 1).padStart(2, "0")}`;
        return [id, { id, label: `整单能力${index + 1}`, coverageStatus: id === "KPOS-O08" ? "defined_extension" : id === "KPOS-O13" ? "product_redefined" : "complete", legacyEvidenceStatus: id === "KPOS-O08" ? "not_legacy" : "verified_config", gap: id === "KPOS-O13" ? "新旧额度语义不同" : "" }];
      }), ...Array.from({ length: 5 }, (_, index) => {
        const id = `KPOS-OV${String(index + 1).padStart(2, "0")}`;
        return [id, { id, label: `待验证能力${index + 1}`, coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime", gap: `新系统定义${index + 1}` }];
      }), ...Array.from({ length: 13 }, (_, index) => {
        const id = `KPOS-R${String(index + 1).padStart(2, "0")}`;
        return [id, { id, label: `旧能力${index + 1}`, coverageStatus: index > 10 ? "partial" : "complete", gap: `能力差距${index + 1}` }];
      })]),
      legacyCapabilityGroups: [
        { group: "order_lifetime", capabilityIds: ["KPOS-O09", "KPOS-O10", "KPOS-O11", "KPOS-O12", "KPOS-O13", "KPOS-O14"], evidenceIds: ["KPOS-OV01", "KPOS-OV02", "KPOS-OV03", "KPOS-OV04", "KPOS-OV05"] },
        { group: "per_round", capabilityIds: ["KPOS-R12", "KPOS-R13"], evidenceIds: [] },
      ],
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
const combo = rendered.indexOf("每轮常用组合模板");
const round = rendered.indexOf("每轮原子规则");
const custom = rendered.indexOf("其他规则");
assert.ok(whole >= 0 && combo > whole && round > combo && custom > round, "分组顺序应为整单、组合、每轮原子、其他规则");
for (let index = 1; index <= 18; index += 1) {
  const position = rendered.indexOf(`默认规则${index}`);
  if (index <= 4) assert.ok(position > whole && position < combo, `默认规则${index}应位于整单限制`);
  else if (index <= 10) assert.ok(position > combo && position < round, `默认规则${index}应位于组合模板`);
  else assert.ok(position > round && position < custom, `默认规则${index}应位于每轮原子规则`);
}
assert.ok(rendered.indexOf("自定义规则") > custom, "普通规则应位于其他规则");
assert.equal((rendered.match(/系统默认/g) || []).length, 18, "仅十八条默认规则显示系统默认标识");
for (const copy of ["旧 KPOS 调研能力", "覆盖结果", "完整覆盖", "新系统扩展定义", "产品重定义后覆盖", "旧 KPOS 运行行为待验证；新系统已明确定义", "KPOS-R12 部分覆盖", "KPOS-R13 部分覆盖"]) assert.ok(rendered.includes(copy), `映射列表缺少：${copy}`);
assert.equal(rendered.includes("本调研不适用"), false, "整单能力不得继续显示本调研不适用");

const api = context.window.__BUFFET_RULE_LIST_TEST_API__;
assert.ok(api, "列表页应暴露轻量测试接口");
assert.equal(api.groupFor(records[0]), "order_lifetime");
assert.equal(api.groupFor(records[5]), "per_round_combo");
assert.equal(api.groupFor(records[11]), "per_round");
assert.equal(api.groupFor(records[2]), "custom");
assert.match(api.deleteMessageFor(records[0]), /恢复为空白且禁用/);
assert.match(api.deleteMessageFor(records[2]), /无法恢复/);

console.log("verify-buffet-default-list-ui: OK");
