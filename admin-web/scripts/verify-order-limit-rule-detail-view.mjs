import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlPath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);
const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const html = await readFile(htmlPath, "utf8");
const js = await readFile(jsPath, "utf8");
const css = await readFile(cssPath, "utf8");

// 列表页：点击规则名跳转编辑器只读查看，而非旧弹层
assert.match(html, /data-rule-view/, "规则名称应可点击查看");
assert.match(html, /class=['"]rule-name-link['"]/, "规则名称应使用可点击样式");
assert.match(
  html,
  /data-rule-view[\s\S]{0,260}order-limit-rule-editor\.html\?ruleId=[\s\S]{0,80}view=1/,
  "点击规则名应跳转编辑器 view=1 只读模式"
);

// 已移除旧的规则详情弹层及相关逻辑，避免两套详情
assert.doesNotMatch(html, /id=["']ruleDetailMask["']/, "旧规则详情弹层应已移除");
assert.doesNotMatch(html, /function buildRuleDetailHtml\(/, "旧详情组装函数应已移除");
assert.doesNotMatch(html, /openRuleDetail\(/, "旧打开详情逻辑应已移除");

// 编辑器：view=1 只读模式
assert.match(js, /var viewMode = new URLSearchParams\(window\.location\.search\)\.get\("view"\) === "1";/, "编辑器应识别 view=1");
assert.match(js, /function initializeViewRule\(/, "应提供只读加载规则，不创建草稿");
assert.match(js, /if \(viewMode\) return true;/, "只读模式不应写入草稿存储");
assert.match(js, /if \(viewMode\) return;[\s\S]{0,80}editorState\.dirty = true;/, "只读模式不应触发脏标记自动保存");
assert.match(js, /document\.body\.classList\.add\("olf-view-mode"\)/, "只读模式应挂载 olf-view-mode 标识");
assert.match(js, /viewMode \? "查看"/, "只读模式标题应为查看");
assert.match(js, /if \(viewMode\) \{ teardownSceneComboNavSpy\(\); go\(moduleProfile\.routes\.list\); return; \}/, "只读模式返回应直接回当前模块列表，不弹保存确认");
assert.match(js, /function applyViewMode\(/, "应提供只读态输入禁用逻辑");

// CSS：隐藏保存/下一步/添加商品等操作
assert.match(css, /\.olf-view-mode #editorContent \{ pointer-events: none; \}/, "只读模式应禁用内容区交互");
assert.match(css, /\.olf-view-mode \[data-product-add-open\]/, "只读模式应隐藏添加商品");
assert.match(css, /\.olf-view-mode #nextButton/, "只读模式应隐藏下一步");
assert.match(css, /\.olf-view-mode #headerSaveButton/, "只读模式应隐藏保存草稿");
assert.match(css, /\.olf-view-mode \[data-selected-preview-delete\]/, "只读模式应隐藏已选商品删除操作");

console.log("Order limit rule detail view verification passed");
