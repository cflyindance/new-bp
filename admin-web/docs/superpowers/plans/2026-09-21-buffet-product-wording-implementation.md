# 自助餐菜品集“成员”文案统一为“商品” Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将自助餐规则中指代菜品集具体菜品的中文“成员”统一改为“商品”，同时保持全部内部数据契约、错误码和旧数据兼容。

**Architecture:** 先用一个范围明确的静态验证脚本锁定允许保留与必须替换的中文文案，再修改配置中心用户界面和列表文案，最后同步权威设计、相关规格和实施计划。内部 `member` 标识完全不动，通过既有运行时、冲突与汇总模型测试证明兼容性。

**Tech Stack:** Vanilla JavaScript、Node.js ESM 验证脚本、Markdown、Vite/TypeScript 构建

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-product-wording-design.md`

## Global Constraints

- 所有描述菜品集具体菜品的中文“成员”改为“商品”。
- 不修改 `dishSetMembers`、`memberDishId`、`effectiveMemberProtection` 等字段名。
- 不修改包含 `member` 的函数名、变量名、序列化键和 `DISH_SET_MEMBER_*` 错误码。
- 不修改真实 POS、Kiosk、eMenu 客户端运行界面或非自助餐模块。
- 保留用户已有的 `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts` 修改，不得纳入提交。

---

### Task 1: 建立商品术语静态回归门禁

**Files:**
- Create: `scripts/verify-buffet-product-wording.mjs`

**Interfaces:**
- Consumes: 自助餐代码、测试与文档文本。
- Produces: `node scripts/verify-buffet-product-wording.mjs`，发现商品语义“成员”残留时非零退出。

- [ ] **Step 1: 编写失败的范围扫描脚本**

脚本递归读取以下范围：

```js
const roots = [
  'dist/Configuration center/assets/order-limit-flow.js',
  'dist/Configuration center/assets/buffet-rule-list-view.js',
  'dist/Configuration center/assets/buffet-rule-profile.js',
  'scripts',
  'docs/superpowers/specs',
  'docs/superpowers/plans',
];
```

只纳入 `verify-buffet-*.mjs`、`*buffet*.md` 和上述三个 JS 文件。匹配下列商品语义短语：

```js
const forbidden = [
  /菜品集成员/g,
  /成员跨产线/g,
  /个成员/g,
  /成员保护/g,
  /成员例外/g,
  /成员重叠/g,
  /成员不足/g,
  /成员表/g,
  /该成员/g,
  /全部成员/g,
  /额度与成员/g,
];
```

允许规格文件 `2026-09-21-buffet-product-wording-design.md` 在“原文案”示例和兼容边界中引用旧词；允许真实内部标识与错误码所在行。输出每个未允许命中的文件、行号和文本，并设置 `process.exitCode = 1`。

- [ ] **Step 2: 运行并确认当前失败**

Run: `node scripts/verify-buffet-product-wording.mjs`

Expected: FAIL，至少报告 `order-limit-flow.js` 中“全部成员跨产线合并统计”和“N 个成员”。

- [ ] **Step 3: 提交测试门禁**

```bash
git add scripts/verify-buffet-product-wording.mjs
git commit -m "test: guard buffet product wording"
```

### Task 2: 统一配置中心用户可见文案

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/buffet-rule-list-view.js`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `scripts/verify-buffet-all-scene-summary-model.mjs`
- Modify: other `scripts/verify-buffet-*.mjs` files reported by Task 1

**Interfaces:**
- Consumes: Task 1 的禁词门禁。
- Produces: 界面、列表、提示与校验统一使用“商品”，内部数据字段与错误码不变。

- [ ] **Step 1: 替换用户可见业务文案**

至少完成以下映射：

```text
全部成员跨产线合并统计 → 全部商品跨产线合并统计
N 个成员 → N 个商品
菜品集成员 → 菜品集商品
菜品集额度与成员 → 菜品集额度与商品
成员保护 → 商品保护
成员例外 → 商品例外
成员重叠 → 商品重叠
成员不足 → 商品不足
该成员禁止下单 → 该商品禁止下单
该成员未设置保护 → 该商品未设置保护
至少保留/需要 2 个成员 → 至少保留/需要 2 个商品
```

只修改字符串、注释和测试消息；不得重命名任何 `member` 标识。

- [ ] **Step 2: 更新文案断言并运行门禁**

Run: `node scripts/verify-buffet-product-wording.mjs`

Expected: 代码与验证脚本范围无未允许命中；文档范围仍失败并指向 Task 3 待处理文件。

- [ ] **Step 3: 运行代码回归**

```bash
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-scene-unified-picker.mjs
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-v4-conflicts.mjs
```

Expected: 全部 PASS；汇总模型仍包含 `memberDishId`、`effectiveMemberProtection` 且值不变，冲突测试仍返回原 `DISH_SET_MEMBER_*` 错误码。

- [ ] **Step 4: 提交界面与测试文案**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/buffet-rule-list-view.js" "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-*.mjs
git commit -m "fix: unify buffet product wording"
```

### Task 3: 同步权威文档与相关设计记录

**Files:**
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`
- Modify: matching `docs/superpowers/specs/*buffet*.md`
- Modify: matching `docs/superpowers/plans/*buffet*.md`

**Interfaces:**
- Consumes: Task 1 禁词清单与规格中的替换规则。
- Produces: 自助餐业务文档统一采用“商品”术语。

- [ ] **Step 1: 更新权威文档**

在《自助餐规则场景配置融合设计》中把菜品集的业务描述统一为“商品”“商品保护”“商品例外”“商品重叠”。字段表、错误码表保留真实英文标识，但中文解释改为商品术语。

- [ ] **Step 2: 更新其他自助餐规格与计划**

根据 Task 1 输出逐行处理。仅当“成员”指菜品集中的具体商品时替换；人员、组织等非商品语义不替换。规格文件中的历史“原文案”对照可保留并加入允许清单。

- [ ] **Step 3: 运行全范围术语门禁**

Run: `node scripts/verify-buffet-product-wording.mjs`

Expected: PASS，无未允许的商品语义“成员”残留。

- [ ] **Step 4: 提交文档同步**

```bash
git add docs/superpowers/specs docs/superpowers/plans scripts/verify-buffet-product-wording.mjs
git commit -m "docs: use product wording in buffet rules"
```

### Task 4: 兼容性、构建与浏览器验收

**Files:**
- Test: `scripts/verify-buffet-product-wording.mjs`
- Test: existing buffet fixture/runtime/summary scripts

**Interfaces:**
- Consumes: Tasks 1–3 完整实现。
- Produces: 可提交、可浏览器验收且不改变数据契约的最终结果。

- [ ] **Step 1: 验证旧数据和派生模型**

运行：

```bash
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-v4-conflicts.mjs
```

Expected: 旧草稿/发布快照仍按 `dishSetMembers` 加载；汇总派生字段及错误码保持原名和值；所有脚本 PASS。

- [ ] **Step 2: 执行项目构建**

Run: `npm.cmd run build`

Expected: exit 0。构建产生但与本功能无关的哈希产物不纳入提交；保留用户已有 seasoning 修改。

- [ ] **Step 3: 本地浏览器验收**

打开自助餐规则配置额度页，验证：

```text
菜品集共享额度·按份/按种（SPU）
全部商品跨产线合并统计，只需设置一次
当前菜品集
N 个商品，跨产线合并统计
```

再触发菜品集不足、移除商品和全部场景汇总状态，确认提示使用“商品”，页面不再显示商品语义“成员”。

- [ ] **Step 4: 最终检查与提交**

```bash
node scripts/verify-buffet-product-wording.mjs
git diff --check
git status --short
```

Expected: 门禁 PASS；无空白错误；只剩本功能文件和用户原有 `seasoning-browser-handler.ts` 修改。若验收产生必要修正，单独提交：

```bash
git add <本功能修正文件>
git commit -m "test: complete buffet product wording validation"
```

