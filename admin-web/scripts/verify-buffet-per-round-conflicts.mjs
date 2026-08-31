import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-domain.js"), "utf8");
const window = {};
vm.runInNewContext(source, { window, Date, Math, Number, String, Array, JSON, Error });
const domain = window.BuffetRuleDomain;

const conditions = { effectiveFrom: "2026-08-01", effectiveTo: "2026-09-30", memberMode: "all" };
const base = {
  schemaVersion: 3,
  subject: "order",
  period: "per_round",
  targetType: null,
  conditions,
  deployStoreIds: ["store-a"],
  storeConfigs: { "store-a": { included: true } },
};
const active = (id, config) => ({ id, status: "active", authoringConfig: config });

assert.equal(domain.mouth({ subject: "order", period: "per_round" }), "order_per_round");
assert.equal(domain.findConflict({ ...base, constraintKind: "round_total" }, [active("total", { ...base, constraintKind: "round_total" })], []).ruleId, "total");
assert.equal(domain.findConflict({ ...base, constraintKind: "round_total" }, [active("same", { ...base, constraintKind: "same_dish_max" })], []), null, "different constraint kinds are independently composable");
assert.equal(domain.findConflict({ ...base, constraintKind: "round_total" }, [active("party-total", { ...base, constraintKind: "round_total", subject: "party_size", partyRanges: [{ min: 1, max: null }] })], []), null, "fixed and per-person mouths compose");

const compiled = domain.compileRuntimeRules([active("total", {
  ...base,
  constraintKind: "round_total",
  partyRanges: [{ min: 1, max: null }],
  roundRanges: [],
  supportedPartySizeMax: 12,
})], 9)[0];
assert.equal(compiled.schemaVersion, 3);
assert.equal(compiled.constraintKind, "round_total");
assert.equal(compiled.supportedPartySizeMax, 12);
assert.deepEqual(Array.from(compiled.partyRanges, value => ({ ...value })), [{ min: 1, max: null }]);

console.log("verify-buffet-per-round-conflicts: OK");
