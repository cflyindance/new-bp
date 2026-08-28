import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const list = fs.readFileSync(path.join(root, "dist/Configuration center/buffet-rule.html"), "utf8");
const flow = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.js"), "utf8");
const profile = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");

for (const marker of ["data-view", "data-edit", "data-copy", "data-toggle", "data-delete"]) {
  assert.ok(list.includes(marker), `列表缺少生命周期操作 ${marker}`);
}
assert.match(list, /AppDialogs\.confirm/);
assert.match(list, /BuffetRuleDomain\.findConflict/);
assert.match(list, /rule\.status='disabled'/, "禁用应直接生成 disabled 状态");
assert.match(list, /rule\.status='active'/, "启用校验通过后应生成 active 状态");
assert.match(list, /copy=1/);
assert.match(flow, /validateBuffetRuleConflict/);
assert.match(flow, /publishDraft\(draftRule\)/);
assert.match(profile, /currentSnapshotId/);
assert.match(profile, /authoringConfig/);
assert.match(profile, /buffet-snapshot-/);

console.log("verify-buffet-rule-lifecycle: OK");
