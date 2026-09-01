import assert from "node:assert/strict";
import { buildCurrentMerchantMenuDemoNodes, JSON_MENU_DEMO_ERROR_KEY, JSON_MENU_DEMO_ISSUE_ROOT_KEY, JSON_MENU_DEMO_WARNING_KEY } from "../src/config/json-menu-demo-data";
import { synchronizeMenuParentKeys, validateMenuDocument, type MenuDocument } from "../src/config/json-menu-document-domain";
import { renderJsonMenuTree } from "../src/config/json-menu-tree-ui";

const menu = buildCurrentMerchantMenuDemoNodes();
synchronizeMenuParentKeys(menu);
const document: MenuDocument = { _id: "demo", name: "Demo", menu, updatedBy: { userId: "u", timestamp: new Date(0).toISOString(), firstname: "U", lastname: null }, createdDate: 0 };
const issues = validateMenuDocument(document);
const html = renderJsonMenuTree(document, [], issues, "", new Set(["0"]));

assert.equal(menu[0]?.key, JSON_MENU_DEMO_ISSUE_ROOT_KEY);
assert.equal(menu[0]?.children?.[0]?.key, JSON_MENU_DEMO_ERROR_KEY);
assert.equal(menu[0]?.children?.[1]?.key, JSON_MENU_DEMO_WARNING_KEY);
assert(issues.some((issue) => issue.severity === "error" && issue.path?.join(".") === "0.0"));
assert(issues.some((issue) => issue.severity === "warning" && issue.path?.join(".") === "0.1"));
assert(html.includes("1 错误") && html.includes("1 警告"), "示例父菜单必须展示子菜单错误和警告汇总");
assert(html.includes('data-jme-issue-path="0.0"') && html.includes('data-jme-issue-path="0.1"'), "问题标记必须可定位到示例节点");

console.log("json-menu demo issue states verification passed");
