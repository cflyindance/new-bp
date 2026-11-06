import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flow = fs.readFileSync(path.join(root, "dist/Configuration center/assets/order-limit-flow.js"), "utf8");
const listView = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-list-view.js"), "utf8");
assert.doesNotMatch(listView, /defaultAuthorizationScope|authorizationReason/, "列表不再注册或展示隐藏字段");
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
  assert.doesNotMatch(html, /data-auth-default|data-auth-reason|默认授权范围|授权原因必须填写/);
  assert.match(html, /data-auth-scope="round"/);
  assert.match(html, /data-auth-scope="order"/);
  assert.doesNotMatch(html, /沿用原默认授权范围/);
}

const legacy = draft("operation");
const legacyHtml = renderUnchanged(legacy);
assert.doesNotMatch(legacyHtml, /默认授权范围|data-auth-default|data-auth-reason/);
assert.doesNotMatch(legacyHtml, /<option value="(?:round|order)" selected>/, "不得假装已切换默认值");

const operationOnlyHtml = renderUnchanged(draft("operation", ["operation"]));
assert.doesNotMatch(operationOnlyHtml, /默认授权范围|data-auth-reason/);
assert.doesNotMatch(operationOnlyHtml, /data-auth-default/, "无其他选项时不能出现空白可操作下拉框");

const emptyHtml = renderUnchanged(draft("", []));
assert.doesNotMatch(emptyHtml, /data-auth-default|沿用原默认授权范围/);
assert.doesNotMatch(emptyHtml, /授权原因必须填写/);

const orderOnly = draft("operation", ["operation", "order"], ["order_lifetime"]);
delete orderOnly.authorization.scopePermissions.round;
assert.doesNotMatch(renderUnchanged(orderOnly), /data-auth-scope="round"|<option value="round"/);

const normalizeOrder = draft("round", ["operation", "round", "order"], ["order_lifetime"]);
const normalizedHtml = context.renderStepSix(normalizeOrder);
assert.equal(normalizeOrder.authorization.defaultScope, "operation", "纯整单保留原有规范化规则");
assert.deepEqual(normalizeOrder.authorization.allowedScopes, ["operation", "order"]);
assert.doesNotMatch(normalizedHtml, /默认授权范围|data-auth-reason/);
assert.doesNotMatch(normalizedHtml, /data-auth-scope="round"|<option value="round"/);

const disabled = draft("operation");
disabled.authorization.enabled = false;
assert.doesNotMatch(renderUnchanged(disabled), /data-auth-scope|data-auth-default|data-auth-role/);

context.viewMode = true;
assert.doesNotMatch(renderUnchanged(draft("operation")), /默认授权范围|data-auth-reason/);
context.viewMode = false;

function event(attribute, value, checked, attrValue) {
  return { value, checked, hasAttribute: (name) => name === attribute, getAttribute: () => attrValue };
}

const retainedPermissions = JSON.stringify(legacy.authorization.scopePermissions);
context.handleAuth(legacy, event("data-auth-default", "order"));
assert.equal(legacy.authorization.defaultScope, "operation", "隐藏字段事件不得修改历史默认值");
assert.deepEqual(legacy.authorization.allowedScopes, ["operation", "round", "order"]);
assert.equal(JSON.stringify(legacy.authorization.scopePermissions), retainedPermissions);
assert.doesNotMatch(renderUnchanged(JSON.parse(JSON.stringify(legacy))), /data-auth-default|data-auth-reason/);

context.handleAuth(legacy, event("data-auth-scope", "", false, "round"));
assert.deepEqual(legacy.authorization.allowedScopes, ["operation", "order"]);
assert.equal(legacy.authorization.defaultScope, "operation");
context.handleAuth(legacy, event("data-auth-reason", "", false));
assert.equal(legacy.authorization.reasonRequired, true, "隐藏原因事件不得修改历史配置");
context.handleAuth(legacy, event("data-auth-enabled", "", false));
assert.equal(legacy.authorization.enabled, false);
assert.equal(legacy.authorization.scopePermissions.operation, "值班经理");

buffet = false;
const menuHtml = renderUnchanged(draft("operation"));
assert.match(menuHtml, /data-auth-scope="operation"/);
assert.match(menuHtml, /data-auth-role="operation"/);
assert.match(menuHtml, /<option value="operation" selected>本次操作<\/option>/);
assert.match(menuHtml, /data-auth-reason/);
assert.doesNotMatch(menuHtml, /沿用原默认授权范围/);
const menuDraft = draft("operation");
context.handleAuth(menuDraft, event("data-auth-default", "order"));
context.handleAuth(menuDraft, event("data-auth-reason", "", false));
assert.equal(menuDraft.authorization.defaultScope, "order");
assert.equal(menuDraft.authorization.reasonRequired, false);

console.log("verify-buffet-hidden-operation-entry: PASS");
