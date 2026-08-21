import assert from "node:assert/strict";
import type { MenuDocument, MenuNode } from "../src/config/json-menu-document-domain";
import { renderJsonMenuNodeFormPanel, type MenuNodeDialogState } from "../src/config/json-menu-node-form-ui";

const page: MenuNode = { id: "page", name: "商品列表", key: "product_list_key", path: "/products/list", type: "inner" };
const directory: MenuNode = { id: "directory", name: "商品中心", key: "product_directory_key", children: [page] };
const link: MenuNode = { id: "link", name: "快捷入口", key: "shortcut_key", type: "link", targetKey: "product_list_key", path: "/shortcut" };
const document: MenuDocument = {
  _id: "document",
  name: "菜单",
  menu: [directory, link],
  updatedBy: { userId: "qa", firstname: "QA", lastname: null, timestamp: new Date(0).toISOString() },
  createdDate: 0,
};

const state: MenuNodeDialogState = { mode: "edit", targetPath: [1], parentPath: [], draft: structuredClone(link), pageMode: "link", linkTargetOpen: true, linkTargetCollapsedPaths: new Set() };
const expanded = renderJsonMenuNodeFormPanel(document, state, []);
const expandedDialog = expanded.slice(expanded.indexOf('<div class="fixed inset-0 z-[150]'));
const visibleText = expandedDialog.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert.match(expanded, /data-jme-link-target-toggle="0"[^>]*aria-expanded="true"/);
assert.match(expanded, /data-jme-menu-purpose/);
assert.match(expanded, /data-jme-link-target-search/);
assert.match(expanded, /border-l border-slate-200/);
assert.match(expanded, /data-jme-link-target-key="product_list_key"[^>]*aria-current="true"/);
assert.match(visibleText, /商品中心/);
assert.match(visibleText, /商品列表/);
assert.doesNotMatch(visibleText, /product_list_key|product_directory_key|shortcut_key/);
assert.match(expanded, />商品列表<\/span><span class="text-slate-400">选择 ›/);
assert.doesNotMatch(expanded, /商品列表 · product_list_key/);

state.linkTargetCollapsedPaths = new Set(["0"]);
const collapsed = renderJsonMenuNodeFormPanel(document, state, []);
const collapsedDialog = collapsed.slice(collapsed.indexOf('<div class="fixed inset-0 z-[150]'));
const collapsedText = collapsedDialog.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
assert.match(collapsed, /data-jme-link-target-toggle="0"[^>]*aria-expanded="false"/);
assert.doesNotMatch(collapsedText, /商品列表/);
assert.equal(state.draft.targetKey, "product_list_key");

state.linkTargetCollapsedPaths = new Set(["0"]);
state.linkTargetSearch = "商品列表";
const searched = renderJsonMenuNodeFormPanel(document, state, []);
const searchedDialog = searched.slice(searched.indexOf('<div class="fixed inset-0 z-[150]'));
assert.match(searchedDialog, /商品中心/);
assert.match(searchedDialog, /商品列表/);
assert.match(searchedDialog, /aria-expanded="true"/);

state.parentPickerOpen = true;
state.parentPickerSearch = "商品列表";
state.parentPickerCollapsedPaths = new Set(["0"]);
const parentPicker = renderJsonMenuNodeFormPanel(document, state, []);
const parentDialog = parentPicker.slice(parentPicker.indexOf('<div class="fixed inset-0 z-[151]'));
assert.match(parentPicker, /data-jme-parent-picker-open/);
assert.match(parentDialog, /data-jme-parent-picker-search/);
assert.match(parentDialog, /商品中心/);
assert.match(parentDialog, /商品列表/);
assert.match(parentDialog, /data-jme-parent-picker-path="0\.0"/);
assert.doesNotMatch(parentDialog.replace(/<[^>]+>/g, " "), /product_list_key|product_directory_key/);

console.log("json-menu link target tree verification passed");
