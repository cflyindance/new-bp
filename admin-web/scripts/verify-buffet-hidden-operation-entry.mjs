import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flow = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.js"), "utf8");
const renderStart = flow.indexOf("  function renderScopeRow(");
const renderEnd = flow.indexOf("  function namesFor(", renderStart);
const eventStart = flow.indexOf('    if (target.hasAttribute("data-auth-enabled"))');
const eventEnd = flow.indexOf("\n  }", eventStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart && eventStart >= 0 && eventEnd > eventStart);
let buffet = true;
let dirty = 0;
const context = vm.createContext({
  roles: ["值班经理", "主管", "店长"],
  esc: (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;"),
  isBuffetProfile: () => buffet,
  isBuffetV4Draft: (draft) => buffet && draft.schemaVersion >= 4,
  viewMode: false,
  markEditorDirty: () => dirty++,
  renderEditor: () => {},
});
vm.runInContext(flow.slice(renderStart, renderEnd), context);
vm.runInContext("function handleAuth(draft, target) {\n" + flow.slice(eventStart, eventEnd) + "\n}", context);

function draft(defaultScope = "round", allowedScopes = ["operation", "round", "order"], enabledPeriods = ["per_round"]) {
  return {
    schemaVersion: 4,
    enabledPeriods,
    authorization: {
      enabled: true,
      allowedScopes,
      defaultScope,
      scopePermissions: { operation: "值班经理", round: "主管", order: "店长" },
      reasonRequired: true,
    },
  };
}

function renderUnchanged(value) {
  const before = JSON.stringify(value.authorization);
  const oldDirty = dirty;
  const html = context.renderStepSix(value);
  assert.equal(JSON.stringify(value.authorization), before, "入口隐藏不能改写授权数据");
  assert.equal(dirty, oldDirty, "只隐藏入口不能触发脏标记");
  if (buffet) {
    assert.doesNotMatch(html, /data-auth-(?:scope|role)="operation"/, "自助餐不再展示本次操作配置行");
    assert.doesNotMatch(html, /<option[^>]*value="operation"/, "本次操作不再是默认范围选项");
  }
  return html;
}

for (const scope of ["round", "order"]) {
  const html = renderUnchanged(draft(scope));
  assert.match(html, new RegExp('<option value="' + scope + '" selected>'));
  assert.match(html, /data-auth-scope="round"/);
  assert.match(html, /data-auth-scope="order"/);
  assert.doesNotMatch(html, /沿用原默认授权范围/);
}

const legacy = draft("operation");
const legacyHtml = renderUnchanged(legacy);
assert.match(legacyHtml, /沿用原默认授权范围：本次操作/);
assert.match(legacyHtml, /<option value="" disabled selected>请选择以更改默认授权范围<\/option>/);
assert.doesNotMatch(legacyHtml, /<option value="(?:round|order)" selected>/, "不得假装已切换默认值");

const operationOnlyHtml = renderUnchanged(draft("operation", ["operation"]));
assert.match(operationOnlyHtml, /沿用原默认授权范围：本次操作/);
assert.doesNotMatch(operationOnlyHtml, /data-auth-default/, "无其他选项时不能出现空白可操作下拉框");

const emptyHtml = renderUnchanged(draft("", []));
assert.doesNotMatch(emptyHtml, /data-auth-default|沿用原默认授权范围/);
assert.match(emptyHtml, /请先启用至少一种授权范围/);

const orderOnly = draft("operation", ["operation", "order"], ["order_lifetime"]);
delete orderOnly.authorization.scopePermissions.round;
assert.doesNotMatch(renderUnchanged(orderOnly), /data-auth-scope="round"|<option value="round"/);

const normalizeOrder = draft("round", ["operation", "round", "order"], ["order_lifetime"]);
const normalizedHtml = context.renderStepSix(normalizeOrder);
assert.equal(normalizeOrder.authorization.defaultScope, "operation", "纯整单保留原有规范化规则");
assert.deepEqual(normalizeOrder.authorization.allowedScopes, ["operation", "order"]);
assert.match(normalizedHtml, /沿用原默认授权范围：本次操作/);
assert.doesNotMatch(normalizedHtml, /data-auth-scope="round"|<option value="round"/);

const disabled = draft("operation");
disabled.authorization.enabled = false;
assert.doesNotMatch(renderUnchanged(disabled), /data-auth-scope|data-auth-default|data-auth-role/);

context.viewMode = true;
assert.match(renderUnchanged(draft("operation")), /沿用原默认授权范围：本次操作/);
context.viewMode = false;

function event(attribute, value, checked, attrValue) {
  return { value, checked, hasAttribute: (name) => name === attribute, getAttribute: () => attrValue };
}

const retainedPermissions = JSON.stringify(legacy.authorization.scopePermissions);
context.handleAuth(legacy, event("data-auth-default", "order"));
assert.equal(legacy.authorization.defaultScope, "order", "显式更改才替换原默认值");
assert.deepEqual(legacy.authorization.allowedScopes, ["operation", "round", "order"]);
assert.equal(JSON.stringify(legacy.authorization.scopePermissions), retainedPermissions);
assert.match(renderUnchanged(JSON.parse(JSON.stringify(legacy))), /<option value="order" selected>/);

context.handleAuth(legacy, event("data-auth-scope", "", false, "round"));
assert.deepEqual(legacy.authorization.allowedScopes, ["operation", "order"]);
assert.equal(legacy.authorization.defaultScope, "order");
context.handleAuth(legacy, event("data-auth-reason", "", false));
assert.equal(legacy.authorization.reasonRequired, false);
context.handleAuth(legacy, event("data-auth-enabled", "", false));
assert.equal(legacy.authorization.enabled, false);
assert.equal(legacy.authorization.scopePermissions.operation, "值班经理");

buffet = false;
const menuHtml = renderUnchanged(draft("operation"));
assert.match(menuHtml, /data-auth-scope="operation"/);
assert.match(menuHtml, /data-auth-role="operation"/);
assert.match(menuHtml, /<option value="operation" selected>本次操作<\/option>/);
assert.doesNotMatch(menuHtml, /沿用原默认授权范围/);

console.log("verify-buffet-hidden-operation-entry: PASS");
