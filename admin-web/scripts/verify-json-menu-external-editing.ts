import assert from "node:assert/strict";
import {
  EDITABLE_MENU_TYPES,
  getCompatibilityRootPath,
  isExplicitCompatibilityType,
  resolveEffectiveExternalUrl,
  validateMenuDocument,
  type MenuDocument,
  type MenuNode,
} from "../src/config/json-menu-document-domain";
import { normalizeMenuNodeForPageMode } from "../src/config/json-menu-page-mode";
import { renderJsonMenuNodeFormPanel } from "../src/config/json-menu-node-form-ui";
import { renderJsonMenuFullscreenPreview, renderJsonMenuPreview } from "../src/config/json-menu-preview-ui";
import { renderJsonMenuTree } from "../src/config/json-menu-tree-ui";

const external: MenuNode = { id: "e", key: "external", name: "帮助中心", path: "help", type: "external", url: "https://example.com/help" };
const document: MenuDocument = { _id: "doc", name: "菜单", menu: [external], updatedBy: { userId: "u", timestamp: new Date(0).toISOString(), firstname: "U", lastname: null }, createdDate: 0 };

assert(EDITABLE_MENU_TYPES.includes("external"));
assert.equal(isExplicitCompatibilityType(external), false);
assert.equal(isExplicitCompatibilityType({ type: "micro-app" }), false);
assert.equal(getCompatibilityRootPath([external], [0]), null);
assert.equal(resolveEffectiveExternalUrl({ id: "c", key: "c", name: "子项", path: "child" }, [external]), external.url);

const issues = validateMenuDocument(document);
assert(!issues.some((issue) => issue.code === "LEGACY_TYPE" || issue.code === "MISSING_EDITABLE_TYPE"));
assert(validateMenuDocument({ ...document, menu: [{ ...external, url: "javascript:alert(1)" }] }).some((issue) => issue.code === "INVALID_EXTERNAL_URL"));
assert(validateMenuDocument({ ...document, menu: [{ ...external, microAppConfig: { url: "https://app.example.com" } }] }).some((issue) => issue.code === "EXTERNAL_MICRO_CONFIG"));

const switched = normalizeMenuNodeForPageMode({ ...external, type: "iframe" }, "external", { depth: 1, initialExplicitType: "iframe", pageModeTouched: true });
assert(switched.ok && switched.node.type === "external" && switched.node.url === external.url && !switched.node.microAppConfig);
const inherited = normalizeMenuNodeForPageMode({ id: "c", key: "c", name: "子项", path: "relative" }, "external", { depth: 2, inheritedExternalUrl: external.url, pageModeTouched: false });
assert(inherited.ok && inherited.node.type === undefined && inherited.node.url === undefined, "非页面字段编辑不得物化继承外链");
const materialized = normalizeMenuNodeForPageMode({ id: "c", key: "c", name: "子项", path: "relative" }, "external", { depth: 2, inheritedExternalUrl: external.url, pageModeTouched: true });
assert(materialized.ok && materialized.node.type === "external" && materialized.node.url === external.url);

const form = renderJsonMenuNodeFormPanel(document, { mode: "edit", targetPath: [0], parentPath: [], draft: external, pageMode: "external", initialExplicitType: "external" }, []);
assert(form.includes('data-jme-page-mode="external"') && form.includes("外部链接地址") && form.includes("窗口设置打开"));
const tree = renderJsonMenuTree(document, [], [], "", new Set());
assert(tree.includes("外链") && tree.includes("border-violet-200"));
const fullscreen = renderJsonMenuFullscreenPreview(document, "zh-CN", [0], external, []);
const compact = renderJsonMenuPreview(document, "zh-CN", [0], external, []);
for (const html of [fullscreen, compact]) {
  assert(html.includes("外部链接") && html.includes(external.url!) && html.includes("新窗口打开"));
  assert(!html.includes(`<a href="${external.url}`) && !html.includes(`<iframe`) && !html.includes("window.open"));
}

console.log("json menu external editing verification passed");
