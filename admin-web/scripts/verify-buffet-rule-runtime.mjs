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

assert.deepEqual({ ...domain.selectRuntimeModule({ orderMode: "standard" }) }, { allowed: true, moduleId: "menu-order-limit" });
assert.equal(domain.selectRuntimeModule({ orderMode: "buffet" }).code, "BUFFET_SESSION_REQUIRED");
assert.equal(domain.selectRuntimeModule({ orderMode: "buffet", buffetSessionId: "session-1" }).moduleId, "buffet-rule");
assert.equal(domain.selectRuntimeModule({}).code, "ORDER_MODE_REQUIRED");

assert.equal(domain.effectiveLimit({ subject: "order", period: "order_lifetime", limit: 5 }, {}).value, 5);
assert.equal(domain.effectiveLimit({ subject: "party_size", period: "order_lifetime", limit: 2 }, { partySize: 3 }).value, 6);
assert.equal(domain.effectiveLimit({ subject: "party_size", period: "per_round", limit: 2 }, { partySize: 3 }).code, "ROUND_REQUIRED");
assert.equal(domain.effectiveLimit({ subject: "party_size", period: "order_lifetime", limit: 2 }, { partySize: 0 }).code, "PARTY_SIZE_REQUIRED");
assert.equal(domain.effectiveLimit({ subject: "party_size", period: "multi_round", roundLimits: [{ min: 1, max: 2, limit: 3 }, { min: 3, max: null, limit: 1 }] }, { partySize: 2, roundNo: 3 }).value, 2);
const matrixRule = {
  subject: "party_size",
  period: "multi_round",
  partyRanges: [{ min: 1, max: 2 }, { min: 3, max: null }],
  roundRanges: [{ min: 1, max: 1 }, { min: 2, max: null }],
  limitMatrix: [[2, 1], [4, 3]],
};
assert.equal(domain.effectiveLimit(matrixRule, { partySize: 2, roundNo: 1 }).value, 4);
assert.equal(domain.effectiveLimit(matrixRule, { partySize: 3, roundNo: 1 }).value, 12);
assert.equal(domain.effectiveLimit(matrixRule, { partySize: 3, roundNo: 2 }).value, 9);
assert.equal(domain.effectiveLimit({ ...matrixRule, partyRanges: [{ min: 2, max: null }] }, { partySize: 1, roundNo: 1 }).code, "PARTY_RANGE_INVALID");
assert.equal(domain.effectiveLimit({ ...matrixRule, roundRanges: [{ min: 2, max: null }] }, { partySize: 3, roundNo: 1 }).code, "ROUND_RANGE_INVALID");

const input = {
  operationId: "op-1",
  context: { orderMode: "buffet", buffetSessionId: "session-1", partySize: 3, roundNo: 1 },
  rules: [
    { id: "category", version: 4, subject: "party_size", period: "per_round", limit: 2 },
    { id: "dish-a", version: 2, subject: "order", period: "order_lifetime", limit: 2 },
  ],
  usedByRule: { category: 3, "dish-a": 1 },
  quantityByRule: { category: 3, "dish-a": 1 },
};
assert.equal(domain.evaluateBatch(input).allowed, true, "分类剩余 3 与菜品剩余 1 应允许同时追加相应数量");
assert.equal(domain.evaluateBatch({ ...input, quantityByRule: { category: 4, "dish-a": 1 } }).allowed, false);
assert.equal(domain.evaluateBatch({ ...input, processedOperationIds: ["op-1"] }).duplicate, true);
assert.equal(domain.evaluateBatch({ ...input, operationId: "" }).code, "OPERATION_ID_REQUIRED");

console.log("verify-buffet-rule-runtime: OK");
