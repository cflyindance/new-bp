import assert from "node:assert/strict";
import {
  findFirstDescendantIssuePath,
  renderJsonMenuTree,
  summarizeMenuNodeIssues,
} from "../src/config/json-menu-tree-ui";

const document = {
  menu: [
    {
      id: "root",
      key: "root_key",
      name: "一级菜单",
      children: [
        { id: "warning-child", key: "warning_child", name: "警告子菜单", type: "inner", path: "/warning" },
        {
          id: "error-child",
          key: "error_child",
          name: "错误子菜单",
          children: [
            { id: "grandchild", key: "grandchild", name: "孙菜单", type: "inner", path: "/grandchild" },
          ],
        },
      ],
    },
  ],
} as any;

const issues = [
  { code: "OWN_ERROR", severity: "error", message: "一级错误", path: [0] },
  { code: "CHILD_WARNING", severity: "warning", message: "二级警告", path: [0, 0] },
  { code: "GRANDCHILD_ERROR", severity: "error", message: "三级错误", path: [0, 1, 0] },
  { code: "SIMILAR_PATH", severity: "error", message: "相似路径", path: [10, 0] },
  { code: "ROOT_ERROR", severity: "error", message: "根错误" },
] as any;

assert.deepEqual(summarizeMenuNodeIssues([0], issues), {
  ownError: 1,
  ownWarning: 0,
  descendantError: 1,
  descendantWarning: 1,
});
assert.deepEqual(findFirstDescendantIssuePath(document.menu, [0], issues, "error"), [0, 1, 0]);
assert.deepEqual(findFirstDescendantIssuePath(document.menu, [0], issues, "warning"), [0, 0]);

const html = renderJsonMenuTree(document, [0], issues, "", new Set(["0", "0.1"]));
assert.match(html, /data-jme-issue-kind="own"[^>]*data-jme-issue-severity="error"/);
assert.match(html, />1 错误</);
assert.match(html, />子菜单 1 错误</);
assert.match(html, />子菜单 1 警告</);
assert.doesNotMatch(html, /root_key/);
assert.match(html, />1 级</);

console.log("json-menu tree issue status verification passed");
