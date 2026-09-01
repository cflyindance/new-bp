# 菜单下单限制：限购数量置于应用范围之后 P0.2 Implementation Plan

> **For agentic workers:** 按 Task 勾选推进。改完双写主工作区。禁止自动 commit/push。

**Goal:** 将步骤改为「… → 应用范围 → 限购数量 → 确认」；数量矩阵只针对已选应用范围条目内的门店/产线/商品；条目创建时选择 `unified` 或 `per_store`。

**Spec:** `docs/superpowers/specs/2026-08-18-order-limit-rule-product-decoupling-design.md` §6  
**Worktree:** `…/order-limit-rule-product-decoupling`，分支 `wt/order-limit-rule-product-decoupling`  
**前置：** P0.1（scopeEntries 卡片+向导）已落地。

---

## 步骤映射（实现注释写死）

| Step | 标题 | 渲染 |
|------|------|------|
| 1 | 规则类型 | `renderStepOne` |
| 2 | 场景配置 | `renderStepThree` |
| 3 | 超限授权 | `renderStepSix` |
| 4 | 生效范围 | `renderStepFive`（无门店表） |
| 5 | 应用范围 | `renderStepScopeEntries`（向导末步改模式选择） |
| 6 | 限购数量 | **新/改** `renderStepEntryLimits`（原 default limits 改造） |
| 7 | 确认发布 | `renderStepSeven` + deploy 缩小 |

---

## Task 1: 数据模型升级 + 迁移

**Files:** `order-limit-flow.js`、`scripts/verify-order-limit-quantity-after-scope-p02.mjs`

- [ ] `quantityMode`: `"unified" | "per_store"`（规范化时把旧 `inherit`→`unified`，`override`→见迁移）
- [ ] 字段：`unifiedCells`、`storeCells`、`overrideCellsByStore`；停止以顶层 `quantityTemplate` 为编辑权威
- [ ] `migrateEntryQuantityModel(draft)` → `decoupledVersion = 3`
  - inherit + template → unifiedCells
  - override + overrideCells → unifiedCells（众数/原 template）+ overrideCellsByStore
- [ ] `resolveLimitValue` 按 §6 公式
- [ ] `materialize` / `syncStoreConfigsFromDecoupled` 读 entry 单元格
- [ ] `entryTargetPairs(entry)`；步 6 用当前 entry 的 pairs，不用全局 template 并集作为唯一来源
- [ ] verify：断言 `unifiedCells`、`per_store`、`migrateEntryQuantityModel`、步骤序「应用范围」在「限购数量」之前

---

## Task 2: 重排 steps + validate

- [ ] 更新 `steps` 数组标题顺序
- [ ] `validateStep`：3=授权；4=时间条件；5=entries+模式+商品；6=按模式矩阵完整；7=deploy
- [ ] `renderEditorContent` 映射上表
- [ ] `goToEditorStep`：scene spy 仍挂限购步（现为 6）；离开应用范围关向导

---

## Task 3: 应用范围向导末步改为模式选择

- [ ] 向导 step 4：两个 radio「统一数量 / 按店独立」，去掉数量矩阵表
- [ ] 卡片展示模式标签（统一数量 / 按店独立）
- [ ] 保存时写入 `quantityMode`；切换模式时确认清空对方单元格（`AppDialogs`）

---

## Task 4: 限购数量步（依赖应用范围）

- [ ] 空态：无 entries →「前往应用范围」→ step 5
- [ ] 条目切换：`data-entry-limit-tab` / select（当前 `activeScopeEntryId`）
- [ ] `unified`：复用现矩阵 UI，读写 `entry.unifiedCells`；P0.2 交付统一矩阵；`overrideCellsByStore` 可用「添加门店例外」最小入口（可选同 Task，至少数据结构就绪）
- [ ] `per_store`：门店下拉/Tab（仅该 entry.storeIds）+ 矩阵写 `storeCells[storeId]`
- [ ] 批量填数 / 产线复制作用于当前 entry 当前上下文
- [ ] 删除顶层「默认模板」文案，改为「当前应用范围：xxx」

---

## Task 5: 发布物化 + 确认页文案

- [ ] `buildPublishedDraft` / `resolveLimitValue` 走 entry 模式
- [ ] 确认页「数量」摘要区分统一/按店
- [ ] 列表 `storeLineLabel` 仍可用物化 storeConfigs

---

## Task 6: verify + 双写 + 手测

- [ ] P0.2 verify GREEN；必要时放宽 P0/P0.1 与旧步骤标题冲突的断言
- [ ] 双写主工作区
- [ ] 手测：统一模式一条 entry；按店独立两条店不同数量；无范围时步 6 空态；旧草稿打开可迁移

---

## DoD

- [ ] 步骤序与 §6 一致
- [ ] 数量商品集合 ⊆ 当前应用范围
- [ ] unified / per_store 均可发布
- [ ] 主工作区已同步；未自动 commit
