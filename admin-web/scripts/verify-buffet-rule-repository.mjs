import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"),
  "utf8",
);

function storageMock() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    values,
  };
}

const localStorage = storageMock();
const window = {};
vm.runInNewContext(source, { window, localStorage, Date, Math, JSON, Error });

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
assert.equal(profile.moduleId, "buffet-rule");
assert.equal(profile.storage.rulesKey, "buffet-rule:repository:v1");
assert.equal(profile.storage.recoveryPrefix, "buffet-rule:recovery:v1:");
assert.deepEqual(Array.from(profile.allowedPeriodsBySubject.order), ["order_lifetime"]);
assert.equal(profile.allowedPeriodsBySubject.party_size.length, 3);

const repository = profile.repository;
const empty = repository.readEnvelope();
assert.equal(empty.schemaVersion, 1);
assert.equal(empty.revision, 0);

repository.saveRules([
  { id: 1, status: "active", name: "正式规则" },
  { id: 2, status: "draft", name: "草稿" },
]);
const saved = repository.readEnvelope();
assert.equal(saved.revision, 1);
assert.equal(saved.rules.length, 1);
assert.equal(saved.drafts.length, 1);
assert.equal(repository.loadRules().length, 2);

assert.throws(
  () => repository.mutateEnvelope(0, (next) => next),
  (error) => error && error.code === "BUFFET_REPOSITORY_REVISION_CONFLICT",
);

localStorage.setItem(profile.storage.rulesKey, "{broken");
assert.throws(
  () => repository.readEnvelope(),
  (error) => error && error.code === "BUFFET_REPOSITORY_READ_ONLY",
);
assert.equal(localStorage.getItem(profile.storage.rulesKey), "{broken", "损坏数据不得被自动覆盖");

assert.match(source, /localStorage\.setItem\(REPOSITORY_KEY, JSON\.stringify\(next\)\)/);
assert.match(source, /buffet-rule:rule-list-columns:v1/);
assert.match(source, /buffet-rule:rule-list-filters:v1/);

console.log("verify-buffet-rule-repository: OK");
