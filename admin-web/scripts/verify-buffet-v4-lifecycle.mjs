import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const asset = (file) => fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8");
const flow = asset("order-limit-flow.js");
const list = fs.readFileSync(path.join(root, "dist/Configuration center/buffet-rule.html"), "utf8");

// 摘要必须展示真实周期、菜品集计量、门店差异和授权，而不是只显示完成格数。
for (const marker of ["periodSummary", "quantityPolicySummary", "按门店复核数量策略", "整桌兜底", "相同菜品", "实际数量项", "validateBuffetStaticFeasibility"]) {
  assert.ok(flow.includes(marker), `v4 发布复核缺少 ${marker}`);
}
assert.match(list, /菜品集/);
assert.match(list, /validateActivation/);

const storage = new Map();
const localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};
const window = {};
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) {
  vm.runInNewContext(asset(file), { window, Date, Math, Number, String, Array, Object, JSON, Error, Set });
}
vm.runInNewContext(asset("buffet-rule-profile.js"), { window, localStorage, Date, Math, Number, String, Array, Object, JSON, Error, Set });

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
const lifecycle = profile.lifecycle;
const authoring = {
  schemaVersion: 4,
  deployStoreIds: ["a"],
  participatingStoreIds: ["a", "b"],
  activeStoreId: "b",
  storeConfigs: { a: { periodValues: { per_round: { targetLimits: { "0|0": { configured: true, value: 2 } } } } }, b: { periodValues: { per_round: { targetLimits: { "0|0": { configured: true, value: 9 } } } } } },
  publishedAt: "old", runtimeSnapshotId: "snapshot-old", authorizationHistory: [{ id: "auth-old" }], processedOperationIds: ["op-old"]
};
const published = lifecycle.buildPublishedDraft(authoring);
assert.deepEqual(Object.keys(published.storeConfigs), ["a"], "发布只裁剪到生效门店");
assert.deepEqual(Object.keys(authoring.storeConfigs).sort(), ["a", "b"], "作者草稿保留取消生效门店的配置");
const copied = lifecycle.prepareDraftCopy(authoring);
assert.equal(copied.runtimeSnapshotId, undefined);
assert.equal(copied.authorizationHistory, undefined);
assert.equal(copied.processedOperationIds, undefined);
assert.equal(copied.storeConfigs.b.periodValues.per_round.targetLimits["0|0"].value, 9, "复制保留门店周期策略");

let check = lifecycle.validateActivation({ id: "r", editorDraft: { deployStoreIds: [], storeConfigs: {} } }, []);
assert.equal(check.valid, false);
window.BuffetRuleDomain.validateStaticFeasibility = () => ({ valid: false, violations: [{ message: "额度不可满足" }] });
check = lifecycle.validateActivation({ id: "r", editorDraft: { name: "静态校验", subject: "order", targetType: "dish", deployStoreIds: ["a"], storeConfigs: { a: { dishTargets: [{ productLineId: "kiosk", dishId: "dish-a" }] } } } }, []);
assert.equal(check.message, "额度不可满足");

// 禁用后启用必须等同发布校验，不能只检查 map 是否存在。
const incompleteV4 = {
  schemaVersion: 4, subject: "party_size", targetType: "dish", enabledPeriods: ["per_round"],
  periodPolicies: { per_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: true } } },
  partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }], deployStoreIds: ["a"],
  storeConfigs: { a: { dishTargets: [{ productLineId: "kiosk", dishId: "dish-a" }], periodValues: { per_round: { totalBounds: { "0|0": { minConfigured: false, maxConfigured: false } }, targetLimits: { "0|0|kiosk|dish-a": { configured: false } }, defaultDishLimits: {}, exceptionDishLimits: {} } } } }
};
window.BuffetRuleDomain.validateStaticFeasibility = () => ({ valid: true, violations: [] });
check = lifecycle.validateActivation({ id: "incomplete", authoringConfig: incompleteV4 }, []);
assert.equal(check.valid, false, "不完整 v4 规则不可重新启用");
check = lifecycle.validateActivation({ id: "missing-name", authoringConfig: { ...incompleteV4, name: "" } }, []);
assert.equal(check.message, "请输入规则名称", "重新启用校验规则名称");
check = lifecycle.validateActivation({ id: "bad-auth", authoringConfig: { ...incompleteV4, name: "测试", authorization: { enabled: true, allowedScopes: ["operation"], defaultScope: "operation", scopePermissions: {} } } }, []);
assert.equal(check.message, "请为每种授权范围选择所需权限", "重新启用校验授权权限");
check = lifecycle.validateActivation({ id: "bad-date", authoringConfig: { ...incompleteV4, name: "测试", authorization: { enabled: false }, conditions: { effectiveFrom: "2026-02-02", effectiveTo: "2026-02-01" } } }, []);
assert.equal(check.message, "结束日期不能早于开始日期", "重新启用校验生效日期");

// 发布态只保留生效门店。完整作者草稿仍能编辑；未生效门店既不进入冲突检测，也不进入快照运行时。
const fullAuthoring = {
  schemaVersion: 4, subject: "order", targetType: "dish", enabledPeriods: ["order_lifetime"],
  periodPolicies: { order_lifetime: { blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } } },
  deployStoreIds: ["store-a"],
  storeConfigs: {
    "store-a": { dishTargets: [{ productLineId: "kiosk", dishId: "dish-a" }], periodValues: { order_lifetime: { targetLimits: { "0|0|kiosk|dish-a": { configured: true, value: 1 } } } } },
    "store-b": { dishTargets: [{ productLineId: "kiosk", dishId: "dish-b" }], periodValues: { order_lifetime: { targetLimits: { "0|0|kiosk|dish-b": { configured: true, value: 9 } } } } }
  }
};
const publishedOnly = lifecycle.buildPublishedDraft(fullAuthoring);
const activeRecord = { id: "published", status: "active", authoringConfig: fullAuthoring, authoringDraft: fullAuthoring, editorDraft: fullAuthoring, publishedConfig: publishedOnly };
assert.deepEqual(Object.keys(activeRecord.authoringConfig.storeConfigs).sort(), ["store-a", "store-b"], "编辑草稿保留未生效门店");
assert.deepEqual(Object.keys(activeRecord.publishedConfig.storeConfigs), ["store-a"], "发布态只保留生效门店");
const conflictCandidate = { ...fullAuthoring, deployStoreIds: ["store-b"], storeConfigs: { "store-b": fullAuthoring.storeConfigs["store-b"] } };
assert.equal(window.BuffetRuleDomain.findConflict(conflictCandidate, [activeRecord], []), null, "未生效门店不参与冲突");
const runtime = window.BuffetRuleDomain.compileRuntimeRules([activeRecord], 7);
assert.deepEqual(Object.keys(runtime[0].storeConfigs), ["store-a"], "未生效门店不进入运行时");
profile.repository.saveRules([activeRecord]);
const saved = profile.repository.readEnvelope();
const snapshot = saved.snapshots[saved.currentSnapshotId];
assert.deepEqual(Object.keys(snapshot.rules[0].storeConfigs), ["store-a"], "repository.saveRules 生成的快照不包含未生效门店");

// 禁用后的编辑以作者草稿为准：旧发布态 A 不得随着重新启用继续进入新快照或冲突检测。
const reenabled = { ...activeRecord, status: "disabled", publishedConfig: publishedOnly, authoringConfig: { ...fullAuthoring, deployStoreIds: ["store-b"], storeConfigs: { "store-b": fullAuthoring.storeConfigs["store-b"] } } };
lifecycle.prepareActivation(reenabled);
assert.deepEqual(Object.keys(reenabled.publishedConfig.storeConfigs), ["store-b"], "重新启用从当前作者草稿重建发布态");
reenabled.status = "active";
assert.equal(window.BuffetRuleDomain.findConflict(conflictCandidate, [reenabled], []).code, "DUPLICATE_TARGET_RULE", "重新启用后的冲突仅反映新生效门店");
profile.repository.saveRules([reenabled]);
const rebuilt = profile.repository.readEnvelope();
assert.deepEqual(Object.keys(rebuilt.snapshots[rebuilt.currentSnapshotId].rules[0].storeConfigs), ["store-b"], "重新启用后的快照只包含新生效门店");
assert.match(flow, /built\.publishedConfig/);

console.log("verify-buffet-v4-lifecycle: PASS");
