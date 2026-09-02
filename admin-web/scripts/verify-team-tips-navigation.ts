import assert from "node:assert/strict";
import { parseTipsRoute, rewriteLegacyTipsUrl } from "../src/team/tips/tips-navigation";

assert.deepEqual(parseTipsRoute("#/team/tips/details?date=2026-01-04&shift=dinner"), { view: "details", query: "?date=2026-01-04&shift=dinner", href: "/team/tips/details?date=2026-01-04&shift=dinner" });
assert.deepEqual(parseTipsRoute("#/team/tips/rules/editor?poolKind=tip&id=r1"), { view: "rule-editor", query: "?poolKind=tip&id=r1", href: "/team/tips/rules/editor?poolKind=tip&id=r1" });
assert.equal(rewriteLegacyTipsUrl("index.html"), "/team/tips/distribution");
assert.equal(rewriteLegacyTipsUrl("detail.html?date=1"), "/team/tips/details?date=1");
assert.equal(rewriteLegacyTipsUrl("rules.html"), "/team/tips/rules");
assert.equal(rewriteLegacyTipsUrl("rule-add.html?poolKind=tip&id=r1"), "/team/tips/rules/editor?poolKind=tip&id=r1");
assert.equal(rewriteLegacyTipsUrl("https://example.com"), null);
console.log("Team tips navigation verification passed.");
