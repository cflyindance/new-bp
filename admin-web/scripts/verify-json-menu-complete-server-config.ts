import assert from "node:assert/strict";
import {
  MENU_MICRO_APP_FIELDS,
  MENU_NODE_FIELDS,
  resolveEffectiveMicroAppConfig,
  synchronizeMenuParentKeys,
  validateMenuDocument,
  type MenuDocument,
  type MenuNode,
} from "../src/config/json-menu-document-domain";
import { normalizeMenuNodeForPageMode } from "../src/config/json-menu-page-mode";
import { renderJsonMenuNodeFormPanel } from "../src/config/json-menu-node-form-ui";
import { renderJsonMenuPreview } from "../src/config/json-menu-preview-ui";
import { renderJsonMenuTree } from "../src/config/json-menu-tree-ui";

const base = (menu: MenuNode[]): MenuDocument => ({ _id: "doc", name: "菜单", menu, updatedBy: { userId: "u", timestamp: new Date(0).toISOString(), firstname: "U", lastname: null }, createdDate: 0 });
assert(MENU_NODE_FIELDS.includes("targetKey") && MENU_NODE_FIELDS.includes("parentKey") && MENU_NODE_FIELDS.includes("externalConfig") && MENU_NODE_FIELDS.includes("disabled") && MENU_NODE_FIELDS.includes("extraInfo"));
assert(MENU_MICRO_APP_FIELDS.includes("name") && MENU_MICRO_APP_FIELDS.includes("keepAlive") && MENU_MICRO_APP_FIELDS.includes("path"));

const child: MenuNode = { id: "child", name: "报表", key: "report_page", path: "/report/page" };
const root: MenuNode = { id: "root", name: "报表应用", key: "report", path: "/report", type: "micro-app", microAppConfig: { url: "https://report.example.com" }, children: [child] };
synchronizeMenuParentKeys([root]);
assert.equal(root.parentKey, undefined);
assert.equal(child.parentKey, "report");
assert.equal(resolveEffectiveMicroAppConfig(child, [root])?.url, "https://report.example.com");
assert(!validateMenuDocument(base([root])).some((issue) => issue.code === "LEGACY_TYPE" || issue.code === "INVALID_MICRO_APP_URL"));

const target: MenuNode = { id: "target", name: "首页", key: "home", path: "/home", type: "inner" };
const link: MenuNode = { id: "link", name: "首页入口", key: "home_link", type: "link", targetKey: "home" };
assert(!validateMenuDocument(base([target, link])).some((issue) => issue.code === "INVALID_LINK_TARGET"));
assert(validateMenuDocument(base([target, { ...link, targetKey: "missing" }])).some((issue) => issue.code === "INVALID_LINK_TARGET"));
assert(validateMenuDocument(base([{ ...link, key: "a", targetKey: "b" }, { ...link, id: "b", key: "b", targetKey: "a" }])).some((issue) => issue.code === "LINK_CYCLE"));

const external = normalizeMenuNodeForPageMode({ ...target, url: "https://example.com", externalConfig: { target: "_blank" } }, "external", { depth: 1, pageModeTouched: true });
assert(external.ok && external.node.type === "external" && external.node.externalConfig?.target === "_blank");
const normalizedLink = normalizeMenuNodeForPageMode({ ...target, targetKey: "home" }, "link", { depth: 1, pageModeTouched: true });
assert(normalizedLink.ok && normalizedLink.node.type === "link" && normalizedLink.node.path === undefined);
const micro = normalizeMenuNodeForPageMode({ ...target, microAppConfig: { url: "https://app.example.com", keepAlive: true } }, "micro-app", { depth: 1, pageModeTouched: true });
assert(micro.ok && micro.node.type === "micro-app" && micro.node.url === undefined);

const rich: MenuNode = { ...target, disabled: true, extraInfo: { source: "m-platform" } };
assert(!validateMenuDocument(base([rich])).some((issue) => issue.code === "INVALID_EXTRA_INFO"));
assert(validateMenuDocument(base([{ ...rich, extraInfo: "invalid" }])).some((issue) => issue.code === "INVALID_EXTRA_INFO"));

const form = renderJsonMenuNodeFormPanel(base([root, target]), { mode: "edit", targetPath: [0], parentPath: [], draft: root, pageMode: "micro-app", extraInfoText: "" }, []);
assert.match(form, /data-jme-advanced-settings/);
assert.match(form, /data-jme-form-anchors/);
assert.match(form, /data-jme-form-anchor="basic"[^>]*aria-current="location"/);
assert.match(form, /data-jme-form-anchor="page"/);
assert.match(form, /data-jme-form-anchor="advanced"/);
assert.match(form, /data-jme-form-section="basic"/);
assert.match(form, /data-jme-form-section="page"/);
assert.match(form, /data-jme-form-section="advanced"/);
assert.match(form, />高级设置</);
assert.match(form, />多语言设置</);
assert.match(form, />状态与权限</);
assert.match(form, />扩展信息</);
assert.doesNotMatch(form, /<details[^>]*data-jme-advanced-settings/);
for (const text of ["链接菜单", "微应用", "微应用访问地址", "iframe 沙箱", "保活", "extraInfo"]) assert(form.includes(text), `form missing ${text}`);
const tree = renderJsonMenuTree(base([{ ...link, disabled: true }]), [], [], "", new Set());
assert(tree.includes("链接") && tree.includes("已禁用"));
const preview = renderJsonMenuPreview(base([{ ...link, disabled: true }]), "zh-CN", [0], { ...link, disabled: true }, []);
assert(preview.includes("链接菜单") && preview.includes("目标菜单 Key") && preview.includes("已禁用"));
assert(!preview.includes("window.open") && !preview.includes("<iframe"));

console.log("json menu complete server config verification passed");
