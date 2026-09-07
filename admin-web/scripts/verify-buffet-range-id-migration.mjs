import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8");
const window = {};
vm.runInNewContext(source, { window, Object, Array, Number, String, JSON, Set, Math });
const policy = window.BuffetRulePolicy;

const input = {
  partyRanges: [{ min: 1, max: 3 }, { min: 4, max: null }],
  roundRanges: [{ min: 1, max: 2 }, { min: 3, max: null }],
  activePartyIndex: 1,
  activeRoundIndex: 0,
  storeConfigs: {
    a: { periodValues: { multi_round: {
      totalBounds: { "0|0": { minConfigured: true, min: 1, maxConfigured: true, max: 4 } },
      tableTotalBounds: {},
      targetLimits: { "1|1|kiosk|dish:a": { configured: true, value: 2 } },
      tableTargetCaps: {}, defaultDishLimits: {}, exceptionDishLimits: {}
    } } }
  }
};

const result = policy.migrateRangeIdentities(input);
assert.equal(result.migrated, true);
assert.equal(result.repairIssues.length, 0);
assert.equal(result.draft.partyRanges.every(range => range.rangeId), true);
assert.equal(result.draft.roundRanges.every(range => range.rangeId), true);
assert.equal(result.draft.activePartyRangeId, result.draft.partyRanges[1].rangeId);
assert.equal(result.draft.activeRoundRangeId, result.draft.roundRanges[0].rangeId);
const values = result.draft.storeConfigs.a.periodValues.multi_round;
assert.deepEqual(JSON.parse(JSON.stringify(values.totalBounds[`${result.draft.partyRanges[0].rangeId}|${result.draft.roundRanges[0].rangeId}`])), { minConfigured: true, min: 1, maxConfigured: true, max: 4 });
assert.equal(values.targetLimits[`${result.draft.partyRanges[1].rangeId}|${result.draft.roundRanges[1].rangeId}|kiosk|dish:a`].value, 2);

const repeated = policy.migrateRangeIdentities(result.draft);
assert.equal(repeated.migrated, false);
assert.deepEqual(JSON.parse(JSON.stringify(repeated.draft)), JSON.parse(JSON.stringify(result.draft)));

const invalid = policy.migrateRangeIdentities({
  partyRanges: [{ rangeId: "same", min: 1, max: 2 }, { rangeId: "same", min: 3, max: null }],
  roundRanges: [{ min: 1, max: null }], storeConfigs: {}
});
assert.equal(invalid.repairIssues.some(issue => issue.code === "DUPLICATE_RANGE_ID"), true);

console.log("verify-buffet-range-id-migration: PASS");
