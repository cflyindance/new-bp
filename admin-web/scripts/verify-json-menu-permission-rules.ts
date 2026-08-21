import assert from "node:assert/strict";
import { validateMenuDocument, type MenuDocument, type MenuNode } from "../src/config/json-menu-document-domain";
import { serializeMenuDocument } from "../src/config/json-menu-document-serializer";
import { renderJsonMenuNodeFormPanel, type MenuNodeDialogState } from "../src/config/json-menu-node-form-ui";

function documentWith(node: MenuNode): MenuDocument {
  return {
    _id: "permission-rule-test",
    name: "Permission rule test",
    menu: [node],
    updatedBy: { userId: "test", timestamp: new Date(0).toISOString(), firstname: "Test", lastname: null },
    createdDate: 0,
  };
}

function stateFor(node: MenuNode): MenuNodeDialogState {
  return { mode: "edit", targetPath: [0], parentPath: [], pageMode: "inner", draft: structuredClone(node), servicePermissionOpen: true };
}

const base: MenuNode = { id: "rule-node", name: "Rule", key: "rule", path: "/rule", type: "inner" };

for (const rule of ["some", "every"] as const) {
  const node: MenuNode = { ...base, accessControl: { bool: true, serviceName: "service", permission: { rule, value: ["permission_a", "permission_b"] } } };
  assert.equal(validateMenuDocument(documentWith(node)).some((issue) => issue.code === "INVALID_PERMISSION_RULE"), false, `${rule} 必须是合法规则`);
  assert.equal(serializeMenuDocument(documentWith(node)).menu[0]?.accessControl?.permission?.rule, rule, `${rule} 必须原样序列化`);
  const html = renderJsonMenuNodeFormPanel(documentWith(node), stateFor(node), []);
  assert.match(html, new RegExp(`value="${rule}"[^>]*checked`), `${rule} 必须在编辑弹窗中反显`);
}

const missingRuleNode: MenuNode = { ...base, accessControl: { bool: true, serviceName: "service", permission: { value: ["permission_a"] } } };
assert.equal(validateMenuDocument(documentWith(missingRuleNode)).some((issue) => issue.code === "MISSING_PERMISSION_RULE"), true, "有权限无规则必须被领域校验拒绝");
const missingRuleHtml = renderJsonMenuNodeFormPanel(documentWith(missingRuleNode), stateFor(missingRuleNode), []);
assert.doesNotMatch(missingRuleHtml, /data-jme-service-permission-rule[^>]*checked/, "新增或缺失规则时不得默认选择");
assert.match(missingRuleHtml, /请选择权限满足规则/, "有权限无规则时必须展示校验提示");

const invalidRuleNode = {
  ...base,
  accessControl: { bool: true, serviceName: "service", permission: { rule: "all", value: ["permission_a"] } },
} as unknown as MenuNode;
assert.equal(validateMenuDocument(documentWith(invalidRuleNode)).some((issue) => issue.code === "INVALID_PERMISSION_RULE"), true, "未知规则必须被拒绝");

console.log("json-menu permission rule verification passed");
