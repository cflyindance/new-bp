import assert from "node:assert/strict";
import { parseTipsRoute, rewriteLegacyTipsUrl, isTipsFullscreenRoute, isTrustedTipsHistoryState } from "../src/team/tips/tips-navigation";

assert.deepEqual(parseTipsRoute("#/team/tips/details?date=2026-01-04&shift=dinner"), { view: "details", query: "?date=2026-01-04&shift=dinner", href: "/team/tips/details?date=2026-01-04&shift=dinner" });
assert.deepEqual(parseTipsRoute("#/team/tips/rules/editor?poolKind=tip&id=r1"), { view: "rule-editor", query: "?poolKind=tip&id=r1", href: "/team/tips/rules/editor?poolKind=tip&id=r1" });
assert.deepEqual(parseTipsRoute("#/team/tips/employee-reconciliation?employeeId=e1"), { view: "employee-reconciliation", query: "?employeeId=e1", href: "/team/tips/employee-reconciliation?employeeId=e1" });
assert.equal(rewriteLegacyTipsUrl("index.html"), "/team/tips/distribution");
assert.equal(rewriteLegacyTipsUrl("detail.html?date=1"), "/team/tips/details?date=1");
assert.equal(rewriteLegacyTipsUrl("employee-reconciliation-detail.html?employeeId=e1"), "/team/tips/employee-reconciliation?employeeId=e1");
assert.equal(rewriteLegacyTipsUrl("rules.html"), "/team/tips/rules");
assert.equal(rewriteLegacyTipsUrl("rule-add.html?poolKind=tip&id=r1"), "/team/tips/rules/editor?poolKind=tip&id=r1");
assert.equal(rewriteLegacyTipsUrl("https://example.com"), null);
console.log("Team tips navigation verification passed.");

assert.equal(isTipsFullscreenRoute(parseTipsRoute('#/team/tips/distribution')),false);
assert.equal(isTipsFullscreenRoute(parseTipsRoute('#/team/tips/distribution?screen=store&store=A')),true);
assert.equal(isTipsFullscreenRoute(parseTipsRoute('#/team/tips/distribution?view=employee')),true);
assert.ok(isTrustedTipsHistoryState({flowId:'f',viewHref:'/team/tips/details?date=2026-11-02',parentHref:'/team/tips/distribution?screen=store',summaryHref:'/team/tips/distribution?screen=store&store=A&startDate=2026-11-02',scrollTop:0,summaryScrollTop:180},'/team/tips/details?date=2026-11-02'));
console.log('PASS dashboard/store fullscreen boundary and trusted store return context');
