import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function shouldShowSceneComboNav\(/, "应提供导航出现条件助手");
assert.match(source, /function sceneComboAnchorId\(/, "应提供组合块锚点 id 助手");
assert.match(source, /function renderSceneComboNav\(/, "应渲染左侧场景导航");
assert.match(source, /function mountSceneComboNavSpy\(/, "应挂载 scrollspy");
assert.match(source, /function teardownSceneComboNavSpy\(/, "应卸载 scrollspy");
assert.match(source, /function scrollToSceneCombo\(/, "应提供点击滚动助手");

assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /sceneComboNav|activeSceneCombo/,
  "导航高亮不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function toast)/)?.[0] ?? "",
  /sceneComboNav|activeSceneCombo/,
  "导航高亮不得进入兼容规则或发布快照",
);

assert.match(source, /data-scene-combo-nav/, "应有导航容器标记");
assert.match(source, /data-scene-combo-nav-item/, "应有导航项标记");
assert.match(source, /id="scene-combo-|['"]scene-combo-/, "组合块应有 scene-combo 锚点 id");
assert.match(source, /sceneComboCompletion\(/, "导航完成度应复用 sceneComboCompletion");
assert.match(source, /olf-scene-combo-layout/, "平铺矩阵区应使用两栏布局类名");

const shouldShowFn = source.match(/function shouldShowSceneComboNav\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(shouldShowFn, /isSceneTileMode/, "出现条件须依赖平铺模式");
assert.match(shouldShowFn, /sceneCombos\(draft\)\.length\s*>=\s*2|combos\.length\s*>=\s*2/, "出现条件须要求组合数 ≥ 2");

const renderEditorFn = source.match(/function renderEditor\([\s\S]*?(?=\n\s*function openDialog)/)?.[0] ?? "";
assert.match(renderEditorFn, /mountSceneComboNavSpy|teardownSceneComboNavSpy/, "renderEditor 后应同步 scrollspy 生命周期");

assert.match(css, /\.olf-scene-combo-layout/, "应提供两栏布局样式");
assert.match(css, /\.olf-scene-combo-nav/, "应提供导航样式");
assert.match(css, /scroll-margin-top/, "组合块应设置 scroll-margin-top");
assert.match(css, /@media\s*\(max-width:\s*960px\)[\s\S]*?olf-scene-combo-nav[\s\S]*?display:\s*none/, "≤960px 应隐藏左导航");

console.log("Menu order limit scene combo nav verification passed");
