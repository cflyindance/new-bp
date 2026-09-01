# 菜单下单限制：规则与商品解耦 P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将数量与频次编辑权威改为「规则模板 + 应用范围 + 稀疏例外」；P0 交付主路径：默认数量无门店下拉、范围三 Tab（含品牌选品 + 本地补选）、稀疏例外、读时迁移、发布物化、列表/摘要三块基础版。

**Architecture:** `editorDraft` 新增 `quantityTemplate` / `scope` / `overrides` 为编辑 SSOT；运行时取值 `override.cells[key] ?? template.cells[key]`；发布时对 `deployStoreIds` 物化只读 `storeConfigs` 供旧消费者。旧规则经 `migrateStoreConfigsToDecoupled(draft)` 读时升级。步骤重排为：类型 → 场景 → 默认数量 → 应用范围 → 例外 → 生效 → 授权+确认。

**Tech Stack:** 原生 JS（IIFE `order-limit-flow.js`）、现有 overlay/dialog（`AppDialogs`）、Node assert 专项脚本；改动后双写主工作区。

**Spec:** `docs/superpowers/specs/2026-08-18-order-limit-rule-product-decoupling-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-rule-product-decoupling`，分支 `wt/order-limit-rule-product-decoupling`

**P0 明确不包含：** 命名门店组展示名、区域级批量、迁移「拆回按店」、例外重叠可视化、N/M 有货强化动效（旁注可用简单计数）。

**评审 nits（本 plan 钉死）：**

1. 级联删单元格按 **`(lineId, targetKey)`**：仅当该对不再出现在 scope 并集时删除对应 `*|{line}|{targetKey}` 键（勿按裸 `targetKey` 跨产线误删）。
2. 迁移写 override：**P0 = 每店至多一组**（`match.storeIds = [storeId]`），差异键堆进该组；不跨店合并。
3. `lineIdsByStore[store] = []`（显式空数组）= 该店无允许产线；与「缺 key → 按目标推断」区分。

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `admin-web/scripts/verify-order-limit-rule-product-decoupling-p0.mjs` | P0 专项：模型字段、步骤标题、无 limit 门店下拉、scope/override API、迁移/物化符号 |
| `admin-web/scripts/verify-order-limit-store-specific-config.mjs` 等 | 按需改期望（去掉「步 4 必有 data-limit-store-select」等与 P0 冲突的断言） |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 模型、迁移、解析、步骤 UI、校验、发布 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 范围三 Tab、例外列表、迁移提示条 |
| （可选）`order-limit.html` / publish 页 | 若列表摘要文案写死在 HTML 则改；优先全在 JS |

---

## Task 0: 步骤表与空模型骨架（可编译、可导航）

**Files:**
- Modify: `order-limit-flow.js`（`steps`、`defaultDraft`、`normalize*`）
- Create: `verify-order-limit-rule-product-decoupling-p0.mjs`（先写 RED 断言）

- [ ] **Step 1: 新 verify 脚本（最小集）**

断言至少包含：

```js
assert.match(source, /quantityTemplate/);
assert.match(source, /brandTargetsByLine/);
assert.match(source, /localTargetsByStoreLine/);
assert.match(source, /function migrateStoreConfigsToDecoupled\(/);
assert.match(source, /function resolveLimitValue\(/);
assert.match(source, /function materializeStoreConfigsFromDecoupled\(/);
assert.match(source, /function allowedLines\(/);
assert.match(source, /function scopeTargets\(/);
// 新步骤标题
assert.match(source, /默认限购数量/);
assert.match(source, /应用范围/);
assert.match(source, /例外覆盖/);
// 步「限购/默认数量」主路径不得再渲染配置门店下拉
const stepDefaultQty = /* 抽取 render 默认数量步的函数体 */;
assert.doesNotMatch(stepDefaultQty, /data-limit-store-select/);
```

- [ ] **Step 2: 改 `steps` 数组**

```js
var steps = [
  { title: "规则类型", note: "确定计算口径" },
  { title: "场景配置", note: "人数与轮次区间" },
  { title: "默认限购数量", note: "规则级默认上限" },
  { title: "应用范围", note: "门店、产线与商品" },
  { title: "例外覆盖", note: "与默认不同的门店" },
  { title: "生效范围", note: "时间、会员与生效门店" },
  { title: "超限授权与确认", note: "授权并复核下发" }
];
```

说明：将原「超限授权」与「确认发布」合并为第 7 步（单页上下两段），避免步骤数膨胀；若合并成本过高，可保持 7 步把确认仍独立为第 7、授权为第 6——**二选一在实现时选改动更小者，但 titles 必须含「默认限购数量 / 应用范围 / 例外覆盖」且总数仍为 7。** 推荐：**不合并**，采用：

```text
1 规则类型
2 场景配置
3 默认限购数量
4 应用范围
5 例外覆盖
6 生效范围
7 超限授权   // 确认发布可仍为进入 publish-confirm 页，与现网一致：第 7 步授权后「保存并下发」
```

若现网第 7 步已是确认页内嵌，保持「第 7 = 确认发布」，授权保持第 6，**例外插入后把原 5/6/7 后移**。以「改 renderStep 映射最少」为准，在 PR 说明最终映射表。

- [ ] **Step 3: `defaultDraft` / normalize 增加字段**

```js
quantityTemplate: { cells: {} },
scope: {
  storeIds: [],
  lineIdsByStore: {},
  brandTargetsByLine: {},
  localTargetsByStoreLine: {}
},
overrides: [],
migratedFromStoreConfigs: false,
migrationSummary: null // { templateKeys, overrideGroups, ambiguousKeys }
```

- [ ] **Step 4: 跑 verify → RED；同步脚本到主工作区**

---

## Task 1: 解析与物化纯函数（无 UI）

**Files:** `order-limit-flow.js`

- [ ] **Step 1: 实现**

```js
function allowedLines(draft, storeId) { /* 显式 [] → []; 缺 key → inferred；有数组 → 用数组 */ }
function scopeTargets(draft, storeId, lineId) { /* brand ∩ 有货 ∪ local */ }
function limitCellKey(partyIndex, roundIndex, lineId, targetKey) { return ... }
function resolveLimitValue(draft, storeId, lineId, partyIndex, roundIndex, targetKey) { /* override ?? template */ }
function findOverrideFor(draft, storeId, lineId) { /* 命中组；重叠应在保存时已禁止 */ }
function overridesOverlap(a, b) { /* (store,line) 交集 */ }
function cascadeRemoveTargetCells(draft, lineId, targetKey) { /* 仅该 line+targetKey */ }
function materializeStoreConfigsFromDecoupled(draft, storeIds) { /* 返回 storeConfigs 快照 */ }
```

有货判定：复用现菜单数据 / picker 已有「店×产线结构」查询；若原型无真实差异，用「品牌目标默认全店有货；local 仅声明店有货」的简化规则，并在注释标明。

- [ ] **Step 2: verify 增加函数名与关键分支字符串断言（含 `lineIdsByStore` 空数组注释或 `length === 0`）**

- [ ] **Step 3: 双写主工作区**

---

## Task 2: 读时迁移 `migrateStoreConfigsToDecoupled`

**Files:** `order-limit-flow.js`

- [ ] **Step 1: 算法按 spec §4 B 实现**

- 已有 `quantityTemplate` 且 `scope.storeIds`（或显式 `decoupledVersion`）→ skip。
- 范围：added 店 → `scope.storeIds`；target 能映射品牌 key → `brandTargetsByLine` 并集，否则 → `localTargetsByStoreLine`。
- 数量：逐 key 全等 / 众数 / 字典序平局；差异 → **每店一组** override。
- 设 `migratedFromStoreConfigs = true` 与 `migrationSummary`。
- **忽略**顶层镜像 `limits` 作为来源。

- [ ] **Step 2: 在 `normalizeStoreDraft` 或 `loadEditor` 入口调用一次**

- [ ] **Step 3: verify 断言迁移函数内含 `ambiguousKeys` / 字典序或 `localeCompare` 平局逻辑**

- [ ] **Step 4: 双写**

---

## Task 3: 步骤重映射 + 默认限购数量 UI（原矩阵去门店）

**Files:** `order-limit-flow.js`、`order-limit-flow.css`

- [ ] **Step 1: 重挂 `renderStep*`**

建议映射（在注释中写死）：

| Step | 内容 | 主要来源 |
|------|------|----------|
| 1 | 规则类型 | 现 `renderStepOne` |
| 2 | 场景 | 现 `renderStepThree` |
| 3 | 默认数量 | 改造现 `renderStepFour`：读写 `quantityTemplate.cells`，**删除** `data-limit-store-select` |
| 4 | 应用范围 | **新** `renderStepScope` |
| 5 | 例外 | **新** `renderStepOverrides` |
| 6 | 生效 | 现 `renderStepFive`（生效门店 ⊆ `scope.storeIds`） |
| 7 | 授权 / 确认 | 现 `renderStepSix` + `renderStepSeven` 按最终映射 |

- [ ] **Step 2: 默认数量读写**

- 行目标 = scope 中 `(line, targetKey)` 并集。
- 输入写入 `quantityTemplate.cells[key]`。
- 产线间复制只动 template。
- 「查看已配置」基于 template 完整度。
- 空态：按钮「去应用范围」跳转 step 4；「添加品牌商品」打开品牌选品模式（写入 `brandTargetsByLine`）。

- [ ] **Step 3: `validateStep(3)`** — 草稿可软警告；硬拦放到发布 / 最后一步前：对 deploy（或若尚未选 deploy 则对 scope）可解析目标检查 template 完整。

- [ ] **Step 4: 更新 `clearAllStoreLimits` 类逻辑 → `clearQuantityTemplateAndOverrides`；`targetType` 变更按 spec 清 scope 商品**

- [ ] **Step 5: verify + 双写**

---

## Task 4: 应用范围三 Tab（品牌 + 本地）

**Files:** `order-limit-flow.js`、`order-limit-flow.css`

- [ ] **Step 1: UI**

- Tab：门店 / 产线 / 商品（`data-scope-tab`）。
- 门店：多选写入 `scope.storeIds`；移除店时确认 → 清例外匹配 + `deployStoreIds`。
- 产线：矩阵写入 `lineIdsByStore`；支持「全部店同产线一键」。
- 商品：
  - 「从品牌菜单添加」→ 复用 `productAddDialog`，**模式 `brand`**：无门店必选（可保留预览滤镜但不写入 storeConfigs）；提交 → `brandTargetsByLine`。
  - 「补选门店本地菜」→ 模式 `local`：必选门店；提交 → `localTargetsByStoreLine`。
- 「查看已选」：品牌按产线；本地按店分组。
- 删除目标 → `cascadeRemoveTargetCells(draft, lineId, targetKey)`。

- [ ] **Step 2: 停止将选品权威写入 `storeConfigs[*].structureByLine`（编辑态）**；`storeConfigs` 仅物化时生成。过渡期若列表仍读 storeConfigs，依赖 Task 5 物化或迁移后的兼容投影。

- [ ] **Step 3: `validateStep(4)`** — 进入后续步骤前建议 `storeIds.length > 0`；发布硬拦见 Task 6。

- [ ] **Step 4: verify 断言 `data-scope-tab`、`brandTargetsByLine` 写入路径、`data-product-add` 模式分支**

- [ ] **Step 5: 双写**

---

## Task 5: 例外覆盖（稀疏）

**Files:** `order-limit-flow.js`、`order-limit-flow.css`

- [ ] **Step 1: 列表 + 添加向导**

- 空态文案按 spec。
- 添加：多选门店 → 可选产线 → 展示模板值 → 改差异 → 保存时只写 `≠ template` 的 cells。
- 保存前 `overridesOverlap`；冲突用 `AppDialogs` / toast 拒绝。
- 编辑 / 删除 / 复制为新组（复制后改门店）。

- [ ] **Step 2: 例外可跳过**（`validateStep(5)` 恒成功或仅检查重叠）

- [ ] **Step 3: verify + 双写**

---

## Task 6: 生效门店、校验、发布物化、摘要

**Files:** `order-limit-flow.js`；列表渲染处

- [ ] **Step 1: 生效门店选项 = `scope.storeIds`**；零可解析目标的店禁用勾选。

- [ ] **Step 2: `validateAll` / 发布前**

按 spec：template 完整（相对 deploy 可解析目标）、overrides 合法、`deploy ⊆ scope`、每 deploy 店 ≥1 目标、无重叠。

- [ ] **Step 3: `buildPublishedDraft` / `buildCompatibilityRule`**

- 先 `materializeStoreConfigsFromDecoupled(draft, deployStoreIds)`。
- `participatingStoreIds = deployStoreIds`（仅物化快照）。
- `authoringDraft` 保留完整 decoupled 字段 + 未 deploy 范围。
- 列表摘要：优先 `范围 N 店 · 例外 M 组`，勿用第一家店镜像当真相。

- [ ] **Step 4: 首次进入编辑若 `migratedFromStoreConfigs`**：顶部提示条展示 `migrationSummary`（可用 toast 一次）。

- [ ] **Step 5: 调整冲突的旧 verify 脚本期望；跑 P0 专项 + 关键旧脚本**

- [ ] **Step 6: 双写主工作区；手测清单（见下）**

---

## 手测清单（P0 验收）

1. **A 路径：** 新建规则 → 场景 → 填默认数量 → 范围勾多店 + 品牌菜 → 跳过例外 → 生效全选 → 发布。确认未出现「配置门店」下拉，且不必按店填矩阵。
2. **B 路径：** 同上后加例外改 1 店 1 格 → 发布后该店物化 limits 为覆盖值，他店为模板值。
3. **本地菜：** 本地补选仅出现在声明店；他店 targets 不含该菜。
4. **迁移：** 用旧 `storeConfigs` 规则打开编辑 → 见迁移提示 → 可发布。
5. **targetType 切换：** 确认清空商品 scope + 数量；门店/产线可保留。
6. **iframe 确认：** 删店/删例外确认遮罩仍全窗（`AppDialogs`）。

---

## 旧脚本处理策略

| 脚本 | 策略 |
|------|------|
| 断言 `data-limit-store-select` 在限购步 | 改为 `doesNotMatch` 或删断言 |
| 断言 `storeConfigs` 为选品权威 | 改为 scope / 物化路径 |
| `verify-order-limit-add-product-dialog.mjs` | 保留弹层，增加 mode=brand\|local；品牌模式可不要求 `data-product-add-store-select` 必填 |
| 长期失败的无关脚本 | 不在本 P0 扩大修复，除非被本改动直接弄红 |

---

## 实现顺序与停点

```text
Task 0 → 1 → 2 → 3 → 4 → 5 → 6
```

每 Task 结束：worktree 改完 → 同步主仓 `admin-web/` 同路径 → 跑相关 verify。  
**禁止自动 commit / push**；完成后向用户汇报，待其确认再提交。

---

## 完成定义（DoD）

- [ ] P0 verify 脚本 GREEN
- [ ] 因本改动而调整的旧脚本 GREEN（或已文档化豁免）
- [ ] 手测清单 1–6 通过
- [ ] 设计成功标准 1–5 在 P0 主路径可演示
- [ ] 主工作区与 worktree 文件一致
