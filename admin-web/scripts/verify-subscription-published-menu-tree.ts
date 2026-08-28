import assert from "node:assert/strict";
import { buildNavBlueprintGroupsForModule } from "../src/config/nav-blueprint-tree";
import type { NavBlueprintSnapshot } from "../src/config/nav-blueprint-store";
import type { PermissionTreeNode } from "../src/config/permission-registry";
import {
  buildSubscriptionMenuTreeFromPublishedMenuDocument,
  buildSubscriptionMenuTreeFromPublishedSnapshot,
  filterSubscriptionMenuTree,
  flattenSubscriptionMenuTree,
} from "../src/config/subscription-published-menu-tree";
import type { MenuDocument } from "../src/config/json-menu-document-domain";

const publishedMenuDocument: MenuDocument = {
  _id: "published-menu",
  name: "已发布导航",
  createdDate: 0,
  updatedBy: { userId: "tester", timestamp: "2026-08-26T02:04:00.000Z", firstname: "Test", lastname: null },
  menu: [
    { id: "root-b", key: "root-b", name: "Group B", i18nInfo: { "zh-CN": "  第二组中文  " }, children: [
      { id: "child-b1", key: "child-b1", name: "第二组页面", i18nInfo: { "zh-CN": "   " }, path: "/b/one" },
    ] },
    { id: "root-a", key: "root-a", name: "第一组", i18nInfo: { "zh-CN": 123 as unknown as string }, children: [
      { id: "child-a1", key: "child-a1", name: " ", path: "/a/one" },
      { id: "child-a2", key: " ", name: "", path: "/a/two" },
    ] },
  ],
};

const publishedDocumentTree = buildSubscriptionMenuTreeFromPublishedMenuDocument(publishedMenuDocument);
assert.ok(publishedDocumentTree, "存在发布时间的菜单文档必须被识别为已发布结构");
assert.equal(publishedDocumentTree.structureNodeCount, 5, "已发布菜单的节点数量必须完整保留");
assert.deepEqual(
  flattenSubscriptionMenuTree(publishedDocumentTree.roots).map((node) => node.title),
  ["第二组中文", "第二组页面", "第一组", "child-a1", "child-a2"],
  "菜单名称必须按中文、原始名称、Key、节点 ID 的顺序解析",
);
assert.deepEqual(
  publishedDocumentTree.roots.map((root) => ({ id: root.routeNodeId, children: root.children.map((child) => child.routeNodeId) })),
  [
    { id: "root-b", children: ["child-b1"] },
    { id: "root-a", children: ["child-a1", "child-a2"] },
  ],
  "已发布菜单的树形结构和顺序必须保持一致",
);
assert.equal(buildSubscriptionMenuTreeFromPublishedMenuDocument({ ...publishedMenuDocument, updatedBy: { ...publishedMenuDocument.updatedBy, timestamp: "" } }), null, "没有发布时间的菜单文档不得作为发布结构");

function snapshot(source: "system" | "custom"): NavBlueprintSnapshot {
  return {
    blueprintId: "system-default",
    version: 7,
    publishedAt: "2026-08-26T00:00:00.000Z",
    navigationSource: source,
    customNodes: source === "custom" ? [
      { id: "custom-l1", level: 1, label: "自定义中心", route: "/custom", l1MountKind: "page", parentKey: null, sortOrder: 0, createdAt: "" },
    ] : [],
    systemSeqAssignments: {},
    systemStructureSelection: {},
    customSeqAssignments: {},
    customStructureSelection: {},
    systemStructureOrder: {},
    customStructureOrder: {},
    systemSeqOrder: {},
    customSeqOrder: {},
  };
}

function expectedRows(value: NavBlueprintSnapshot): Array<{ id: string; parent?: string; children: string[] }> {
  const selection = value.navigationSource === "custom" ? value.customStructureSelection : value.systemStructureSelection;
  const output: Array<{ id: string; parent?: string; children: string[] }> = [];
  const visit = (node: PermissionTreeNode, parentEnabled: boolean, parent?: string): void => {
    const enabled = parentEnabled && (selection[node.resource.key]?.enabled ?? true);
    if (!enabled) return;
    const visibleChildren = node.children.filter((child) => selection[child.resource.key]?.enabled ?? true);
    output.push({ id: node.resource.key, parent, children: visibleChildren.map((child) => child.resource.key) });
    visibleChildren.forEach((child) => visit(child, enabled, node.resource.key));
  };
  buildNavBlueprintGroupsForModule(value, "active").forEach((group) => visit(group.tree, true));
  return output;
}

for (const source of ["system", "custom"] as const) {
  const value = snapshot(source);
  const actualTree = buildSubscriptionMenuTreeFromPublishedSnapshot(value);
  const actual = flattenSubscriptionMenuTree(actualTree.roots).map((node) => ({ id: node.routeNodeId, parent: node.parentRouteNodeId, children: node.children.map((child) => child.routeNodeId) }));
  assert.deepEqual(actual, expectedRows(value), `${source} 生效树的数量、结构或顺序不一致`);
  assert.equal(actualTree.source, source);
}

const disabled = snapshot("system");
const firstRoot = buildNavBlueprintGroupsForModule(disabled, "active")[0]?.tree;
assert.ok(firstRoot, "系统树必须存在根节点");
disabled.systemStructureSelection[firstRoot.resource.key] = { enabled: false };
const disabledIds = new Set(flattenSubscriptionMenuTree(buildSubscriptionMenuTreeFromPublishedSnapshot(disabled).roots).map((node) => node.routeNodeId));
assert.equal(disabledIds.has(firstRoot.resource.key), false, "禁用父节点不得出现在生效树");
const firstDescendant = firstRoot.children[0]?.resource.key;
if (firstDescendant) assert.equal(disabledIds.has(firstDescendant), false, "禁用父节点的后代必须一并过滤");

const searchable = buildSubscriptionMenuTreeFromPublishedSnapshot(snapshot("system"));
const selectableLeaf = flattenSubscriptionMenuTree(searchable.roots).find((node) => node.selectable && node.children.length === 0);
if (selectableLeaf) {
  const result = filterSubscriptionMenuTree(searchable.roots, selectableLeaf.path ?? selectableLeaf.title);
  const ids = flattenSubscriptionMenuTree(result).map((node) => node.routeNodeId);
  assert.ok(ids.includes(selectableLeaf.routeNodeId), "搜索结果必须保留命中节点");
  if (selectableLeaf.parentRouteNodeId) assert.ok(ids.includes(selectableLeaf.parentRouteNodeId), "搜索结果必须保留祖先链");
}

console.log("subscription published menu tree verification passed");
