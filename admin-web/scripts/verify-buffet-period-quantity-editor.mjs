import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

// v4 数量页必须从旧的扁平商品规则列表切换为按门店、按周期的编辑器。
for (const marker of [
  "data-period-section",
  "data-buffet-quantity-store",
  "整个订单",
  "每轮菜品总数",
  "指定对象额度",
  "相同菜品保护",
  "data-table-target-cap",
  "data-buffet-measure-unit",
  "function quantityScenarioIndexes(draft, period)",
  "function readLimitCell(input)",
  "function readBoundCell(minInput, maxInput)",
]) {
  assert.ok(flow.includes(marker), `缺少 v4 周期数量编辑器标记：${marker}`);
}

const root = {};
const profile = {
  moduleId: "buffet-rule",
  storage: { rulesKey: "test", recoveryPrefix: "test:" },
  steps: [],
  allowedPeriods: ["order_lifetime", "per_round", "multi_round"],
  allowedTargetTypes: ["dish", "category", "dish_set"],
  usesV4Capability(draft) { return Number(draft?.schemaVersion) >= 4; },
  upgradeDraftToV4(draft) { return draft; }
};
const window = {
  ORDER_LIMIT_MODULE_PROFILE: profile,
  __BUFFET_PERIOD_QUANTITY_TEST__: true,
  location: { search: "" },
  BuffetRulePolicy: {
    scenarioKey: (party, round) => `${party}|${round}`,
    targetCellKey: (party, round, line, target) => `${party}|${round}|${line}|${target}`
  }
};
const document = {
  body: { getAttribute: () => "test" },
  getElementById: (id) => id === "orderLimitFlowRoot" ? root : null
};
vm.runInNewContext(flow, { window, document, URLSearchParams, Number, String, Array, Object, Math, JSON, Date, Set, console });
const api = window.BuffetPeriodQuantityTestApi;

assert.deepEqual(
  Array.from(api.quantityScenarioIndexes({ subject: "party_size", partyRanges: [{}, {}], roundRanges: [{}, {}, {}] }, "multi_round"), value => ({ ...value })),
  [
    { partyIndex: 0, roundIndex: 0 }, { partyIndex: 0, roundIndex: 1 }, { partyIndex: 0, roundIndex: 2 },
    { partyIndex: 1, roundIndex: 0 }, { partyIndex: 1, roundIndex: 1 }, { partyIndex: 1, roundIndex: 2 }
  ]
);
assert.deepEqual(
  Array.from(api.quantityScenarioIndexes({ subject: "order", partyRanges: [{}, {}], roundRanges: [{}, {}] }, "per_round"), value => ({ ...value })),
  [{ partyIndex: 0, roundIndex: 0 }]
);
assert.deepEqual({ ...api.readLimitCell({ value: "" }) }, { configured: false, value: null });
assert.deepEqual({ ...api.readLimitCell({ value: "0" }) }, { configured: true, value: 0 });
assert.deepEqual({ ...api.readLimitCell({ value: "   " }) }, { configured: false, value: null });
assert.deepEqual({ ...api.readLimitCell({ value: " 2 " }) }, { configured: false, value: null });
assert.deepEqual({ ...api.readLimitCell({ value: "1000000" }) }, { configured: false, value: null });
assert.deepEqual({ ...api.readBoundCell({ value: "2" }, { value: "" }) }, {
  minConfigured: true, min: 2, maxConfigured: false, max: null
});

const modernDraft = {
  schemaVersion: 4,
  subject: "party_size",
  targetType: "dish",
  enabledPeriods: ["multi_round", "per_round", "order_lifetime"],
  periodPolicies: {
    order_lifetime: { blocks: { targetEnabled: true } },
    per_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: true } },
    multi_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } }
  },
  partyRanges: [{ min: 1, max: 2 }],
  roundRanges: [{ min: 1, max: 1 }, { min: 2, max: null }],
  activeStoreId: "ny-midtown",
  activeLineId: "kiosk",
  storeConfigs: {
    "ny-midtown": { productLines: ["kiosk"], targetIds: ["dish:1"], dishTargets: [{ productLineId: "kiosk", dishId: "dish:1", name: "清蒸大闸蟹" }], dishSetMembers: [], periodValues: {} },
    flushing: { productLines: ["kiosk"], targetIds: ["dish:1"], dishTargets: [{ productLineId: "kiosk", dishId: "dish:1", name: "清蒸大闸蟹" }], dishSetMembers: [], periodValues: {} }
  },
  participatingStoreIds: ["ny-midtown", "flushing"]
};
const rendered = api.renderBuffetV4QuantityEditor(modernDraft, ["ny-midtown", "flushing"]);
assert.match(rendered, /data-buffet-quantity-store/);
assert.match(rendered, /data-buffet-store-copy/);
assert.match(rendered, /data-period-section="order_lifetime"[\s\S]*data-period-section="per_round"[\s\S]*data-period-section="multi_round"/);
const orderSection = rendered.match(/data-period-section="order_lifetime"[\s\S]*?(?=data-period-section="per_round")/)?.[0] ?? "";
assert.match(orderSection, /指定对象额度/);
assert.doesNotMatch(orderSection, /每轮菜品总数|相同菜品保护/);
assert.match(rendered, /data-table-target-cap/);

modernDraft.storeConfigs["ny-midtown"].periodValues.per_round.targetLimits = {
  "0|0|kiosk|dish:1": { configured: true, value: 3 },
  "0|0|emenu|dish:1": { configured: true, value: 9 }
};
modernDraft.storeConfigs["ny-midtown"].periodValues.per_round.totalBounds = {
  "0|0": { minConfigured: true, min: 1, maxConfigured: true, max: 8 }
};
modernDraft.storeConfigs["ny-midtown"].periodValues.per_round.defaultDishLimits = {
  "0|0": { configured: true, value: 4 }
};
modernDraft.storeConfigs.flushing.periodValues.per_round = { defaultDishLimits: {
  "0|0": { configured: true, value: 6 }
} };
assert.deepEqual(
  { ...api.copyBuffetV4StorePeriodValues(modernDraft, "ny-midtown", "flushing") },
  { copied: 1, pending: 1 }
);
assert.deepEqual(
  { ...modernDraft.storeConfigs.flushing.periodValues.per_round.targetLimits },
  { "0|0|kiosk|dish:1": { configured: true, value: 3 } },
  "跨门店复制只能保留目标门店实际存在的产线和商品身份"
);
assert.deepEqual(
  { ...modernDraft.storeConfigs.flushing.periodValues.per_round.totalBounds["0|0"] },
  { minConfigured: true, min: 1, maxConfigured: true, max: 8 }
);
assert.deepEqual(
  { ...modernDraft.storeConfigs.flushing.periodValues.per_round.defaultDishLimits["0|0"] },
  { configured: true, value: 6 },
  "Task4 跨店复制不得复制 Task5 的单品保护默认值"
);
assert.deepEqual(
  Array.from(api.pendingTargetIdentityEntries(modernDraft.storeConfigs.flushing, "per_round"), entry => ({ ...entry })),
  [{
    key: "per_round::targetLimits::0|0|emenu|dish:1", period: "per_round", map: "targetLimits", targetKey: "0|0|emenu|dish:1",
    cell: { configured: true, value: 9 }
  }],
  "未匹配的产线菜单身份必须原样保留为待完善项，不能并入 kiosk 同 ID 菜品"
);
modernDraft.activeStoreId = "flushing";
const renderedPending = api.renderBuffetV4QuantityEditor(modernDraft, ["ny-midtown", "flushing"]);
assert.match(renderedPending, /data-v4-pending-target/);
assert.match(renderedPending, /data-v4-pending-discard/);
modernDraft.deployStoreIds = ["flushing"];
assert.match(api.validateStep(5, modernDraft), /待完善的跨门店复制额度/);
modernDraft.storeConfigs.flushing.productLines.push("emenu");
modernDraft.storeConfigs.flushing.dishTargets.push({ productLineId: "emenu", dishId: "dish:1", name: "蒜蓉粉丝扇贝" });
assert.equal(api.reconcilePendingTargetIdentities(modernDraft, modernDraft.storeConfigs.flushing), 1);
assert.deepEqual(api.pendingTargetIdentityEntries(modernDraft.storeConfigs.flushing, "per_round"), []);
assert.deepEqual(
  { ...modernDraft.storeConfigs.flushing.periodValues.per_round.targetLimits["0|0|emenu|dish:1"] },
  { configured: true, value: 9 },
  "补充相同产线和菜单身份后应自动应用待完善额度"
);

const completionDraft = {
  schemaVersion: 4, subject: "order", targetType: "dish", enabledPeriods: ["order_lifetime"],
  periodPolicies: { order_lifetime: { blocks: { targetEnabled: true } } },
  partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }],
  targetIds: ["dish:1"], participatingStoreIds: ["ny-midtown"], deployStoreIds: ["ny-midtown"],
  storeConfigs: {
    "ny-midtown": {
      productLines: ["kiosk"], targetIds: ["dish:1"], dishTargets: [{ productLineId: "kiosk", dishId: "dish:1", name: "清蒸大闸蟹" }],
      periodValues: { order_lifetime: { targetLimits: { "0|0|kiosk|dish:1": { configured: true, value: 2 } } } }
    }
  }
};
assert.deepEqual({ ...api.v4QuantityCompletion(completionDraft) }, { complete: 1, total: 1 });
assert.equal(api.validateStep(3, completionDraft), null, "v4 periodValues 填写后应允许通过数量步骤");
assert.equal(api.validateDeployStores(completionDraft), null, "发布前门店校验应复用 v4 完成度");
completionDraft.storeConfigs["ny-midtown"].pendingTargetIdentities = {
  "per_round::targetLimits::0|0|emenu|dish:1": { period: "per_round", map: "targetLimits", targetKey: "0|0|emenu|dish:1", cell: { configured: true, value: 1 } }
};
assert.equal(api.validateDeployStores(completionDraft), null, "禁用周期的待完善草稿不得阻断发布");

const unconfiguredCopyDraft = {
  schemaVersion: 4, subject: "order", targetType: "dish", enabledPeriods: ["per_round"],
  periodPolicies: { per_round: { blocks: { targetEnabled: true } } },
  partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }],
  participatingStoreIds: ["ny-midtown", "flushing"], deployStoreIds: ["flushing"],
  storeConfigs: {
    "ny-midtown": {
      productLines: ["kiosk", "emenu"], targetIds: ["dish:1", "dish:2"],
      dishTargets: [
        { productLineId: "kiosk", dishId: "dish:1", name: "清蒸大闸蟹" },
        { productLineId: "emenu", dishId: "dish:2", name: "跨产线未配置商品" }
      ],
      periodValues: { per_round: { targetLimits: {
        "0|0|kiosk|dish:1": { configured: true, value: 2 },
        "0|0|emenu|dish:2": { configured: false, value: null }
      } } }
    },
    flushing: {
      productLines: ["kiosk"], targetIds: ["dish:1"],
      dishTargets: [{ productLineId: "kiosk", dishId: "dish:1", name: "清蒸大闸蟹" }],
      periodValues: {}
    }
  }
};
assert.deepEqual(
  { ...api.copyBuffetV4StorePeriodValues(unconfiguredCopyDraft, "ny-midtown", "flushing") },
  { copied: 1, pending: 0 },
  "跨产线的未配置单元格不得生成待完善项"
);
assert.deepEqual(api.pendingTargetIdentityEntries(unconfiguredCopyDraft.storeConfigs.flushing, "per_round"), []);
assert.deepEqual(
  { ...unconfiguredCopyDraft.storeConfigs.flushing.periodValues.per_round.targetLimits },
  { "0|0|kiosk|dish:1": { configured: true, value: 2 } },
  "未配置的跨产线单元格不得写入目标门店"
);
assert.equal(api.validateDeployStores(unconfiguredCopyDraft), null, "未配置跨产线单元格不得阻断发布");

console.log("verify-buffet-period-quantity-editor: PASS");
