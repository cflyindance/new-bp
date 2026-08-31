import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profileSource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");
const listSource = fs.readFileSync(path.join(root, "dist/Configuration center/buffet-rule.html"), "utf8");

function storageMock(seed = {}) {
  const values = new Map(Object.entries(seed));
  let writes = 0;
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes += 1; values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values,
    get writes() { return writes; },
  };
}

function loadProfile(storage) {
  const window = {};
  vm.runInNewContext(profileSource, { window, localStorage: storage, Date, Math, JSON, Error });
  return window.ORDER_LIMIT_MODULE_PROFILE;
}

function factory(scenario, id) {
  return {
    id,
    status: "disabled",
    origin: "system_default",
    defaultScenarioKey: scenario.key,
    name: scenario.name,
    publishedSnapshotVersion: null,
    authoringConfig: {
      subject: scenario.subject,
      period: scenario.period,
      constraintKind: scenario.constraintKind,
      targetType: scenario.targetType,
      partyRanges: [{ min: 1, max: null }],
      roundRanges: [{ min: 1, max: null }],
      storeConfigs: {}, participatingStoreIds: [], deployStoreIds: [],
    },
  };
}

const repositoryKey = "buffet-rule:repository:v1";
const menuKey = "restaurantRules";
const storage = storageMock({ [menuKey]: "menu-rules-must-not-change" });
const profile = loadProfile(storage);
const repository = profile.repository;

const first = repository.loadForAuthoringList(profile.createDefaultScenarioRule);
assert.equal(first.length, 19);
assert.equal(first.every((rule) => rule.status === "disabled"), true);
assert.equal(new Set(first.map((rule) => rule.defaultScenarioKey)).size, 19);
assert.equal(storage.getItem(menuKey), "menu-rules-must-not-change");
const firstEnvelope = repository.readEnvelope();
assert.equal(firstEnvelope.revision, 1);
assert.equal(firstEnvelope.currentSnapshotId, null);
assert.deepEqual(Object.keys(firstEnvelope.snapshots), []);

const serialized = storage.getItem(repositoryKey);
const writesBeforeSecondLoad = storage.writes;
const second = repository.loadForAuthoringList(profile.createDefaultScenarioRule);
assert.equal(second.length, 19);
assert.equal(storage.getItem(repositoryKey), serialized, "场景完整时不得改写仓库");
assert.equal(storage.writes, writesBeforeSecondLoad, "幂等加载不得产生 storage 写入");

const partialStorage = storageMock({
  [repositoryKey]: JSON.stringify({
    schemaVersion: 1,
    revision: 7,
    rules: [{ id: 41, status: "active", name: "已有规则", authoringConfig: { subject: "order", period: "order_lifetime", targetType: "category" } }],
    drafts: [{ id: 42, status: "draft", name: "仅草稿", editorDraft: { subject: "order", period: "order_lifetime", targetType: "dish" } }],
    snapshots: { stable: { snapshotId: "stable", rules: [{ id: 41 }] } },
    currentSnapshotId: "stable",
  }),
});
const partialRepository = loadProfile(partialStorage).repository;
const partial = partialRepository.loadForAuthoringList(factory);
assert.equal(partial.length, 20, "1 条正式规则、1 条草稿和 18 条补齐规则");
const partialEnvelope = partialRepository.readEnvelope();
assert.equal(partialEnvelope.revision, 8);
assert.equal(partialEnvelope.rules.find((rule) => rule.id === 41).name, "已有规则");
assert.equal(partialEnvelope.drafts.length, 1);
assert.equal(partialEnvelope.currentSnapshotId, "stable");
assert.deepEqual(partialEnvelope.snapshots, { stable: { snapshotId: "stable", rules: [{ id: 41 }] } });
assert.equal(partialEnvelope.rules.some((rule) => rule.defaultScenarioKey === "order|order_lifetime|target_max|dish"), true, "草稿不应阻止正式默认规则补齐");
assert.equal(first.every((rule) => rule.authoringConfig && rule.editorDraft), true, "默认规则必须包含完整作者态配置");
assert.equal(first.find((rule) => rule.defaultScenarioKey === "party_size|multi_round|target_max|dish").authoringConfig.roundRanges.length, 1);

assert.match(listSource, /loadForAuthoringList/);
console.log("verify-buffet-default-scenario-rules: OK");
