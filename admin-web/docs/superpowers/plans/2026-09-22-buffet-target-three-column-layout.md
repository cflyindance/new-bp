# 自助餐限购对象三列布局 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 自助餐规则类型页的三种限购对象在桌面宽度下一行等宽展示，同时保留非自助餐双列与窄屏单列。

**Architecture:** 复用现有 `.olf-choice-grid` 三列和 `.olf-choice-grid--two` 双列样式，只让 `renderStepOne` 根据 `isBuffetProfile()` 为限购对象容器选择类名。移动端沿用现有断点规则，无业务数据变化。

**Tech Stack:** 原生 JavaScript、CSS、Node.js 静态验证脚本。

**Spec:** `docs/superpowers/specs/2026-09-22-buffet-target-three-column-layout-design.md`

## Global Constraints

- 三张选项卡保持当前顺序、文案、交互和配置数据不变。
- 非自助餐配置继续双列；限购主体等其他区域不变。
- 窄屏沿用现有 `@media` 单列布局。

---

### Task 1: 限购对象响应式列数

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js` 的 `renderStepOne`
- Modify: `scripts/verify-buffet-rule-type-field-order.mjs`
- Read only: `dist/Configuration center/assets/order-limit-flow.css` 的 `.olf-choice-grid` 与移动端断点

**Interfaces:**
- Consumes: `isBuffetProfile(): boolean`；现有 `.olf-choice-grid`（三列）和 `.olf-choice-grid--two`（双列）样式。
- Produces: 自助餐限购对象容器仅带 `olf-choice-grid`；其他配置限购对象容器额外带 `olf-choice-grid--two`。

- [x] **Step 1: 写失败的静态断言**

在 `scripts/verify-buffet-rule-type-field-order.mjs` 的 `orderedMarkers` 检查后添加：

```js
assert.match(stepOne, /var targetGridClass = isBuffetProfile\(\) \? "olf-choice-grid" : "olf-choice-grid olf-choice-grid--two";/);
assert.match(markup, /<h3>限购对象<\/h3><div class="' \+ targetGridClass \+ '">/);
const css = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.css", "utf8");
assert.match(css, /\.olf-choice-grid \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(css, /\.olf-choice-grid--two \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /\.olf-choice-grid, \.olf-choice-grid--two,[^}]*grid-template-columns: 1fr/);
```

- [x] **Step 2: 运行验证确认失败**

```powershell
node scripts/verify-buffet-rule-type-field-order.mjs
```

预期：失败于 `targetGridClass` 断言，因为当前限购对象容器强制双列。

- [x] **Step 3: 最小代码修改**

在 `renderStepOne` 中、`targetChoices` 定义后添加：

```js
var targetGridClass = isBuffetProfile() ? "olf-choice-grid" : "olf-choice-grid olf-choice-grid--two";
```

把限购对象容器的固定双列类改为：

```js
'<section class="olf-section"><h3>限购对象</h3><div class="' + targetGridClass + '">' +
  targetChoices + '</div></section>' +
```

- [x] **Step 4: 验证**

```powershell
node scripts/verify-buffet-rule-type-field-order.mjs
$files = Get-ChildItem -LiteralPath 'scripts' -Filter 'verify-buffet-*.mjs'
foreach ($file in $files) { & node $file.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

预期：所有脚本通过。再用本地浏览器检查桌面三列等宽、非自助餐双列和窄屏单列，三项切换均保持原行为。

- [x] **Step 5: 范围核查**

```powershell
git diff --check
git diff -- 'dist/Configuration center/assets/order-limit-flow.js' 'scripts/verify-buffet-rule-type-field-order.mjs'
```

预期：只含容器类选择与回归断言；不包含其他已有工作区修改。用户另行要求提交时，仅提交本任务两个文件。
