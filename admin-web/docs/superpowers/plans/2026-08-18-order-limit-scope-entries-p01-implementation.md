# 菜单下单限制：scopeEntries 流程重排 P0.1 Implementation Plan

> **For agentic workers:** 按 Task 勾选推进。改完双写主工作区。禁止自动 commit/push。

**Goal:** 将已落地的 P0（`quantityTemplate` + `scope` + `overrides` + 旧步骤序）升级为修订 B：步骤「类型 → 场景 → 限购数量 → 超限授权 → 生效范围(无门店) → 应用范围(卡片+向导) → 确认发布」；用 `scopeEntries[]` 吸收原 scope 与例外。

**Spec:** `docs/superpowers/specs/2026-08-18-order-limit-rule-product-decoupling-design.md` §5  
**Mockup:** `docs/superpowers/mockups/2026-08-18-order-limit-scope-entries-mockup.html`  
**Worktree:** `…/order-limit-rule-product-decoupling`，分支 `wt/order-limit-rule-product-decoupling`  
**前置：** P0 已在同分支落地；本计划在其上增量修改。

---

## 步骤映射（实现时写进注释）

| Step | 标题 | 渲染 |
|------|------|------|
| 1 | 规则类型 | `renderStepOne` |
| 2 | 场景配置 | `renderStepThree` |
| 3 | 限购数量 | `renderStepDefaultLimits`（目标来自全部 entries 并集；可先空再去第 6 步） |
| 4 | 超限授权 | `renderStepSix` |
| 5 | 生效范围 | `renderStepFive` **去掉生效门店表** |
| 6 | 应用范围 | **新** `renderStepScopeEntries`（替换 Tab 版 scope + 独立 overrides 步） |
| 7 | 确认发布 | 复核 + **可缩小** `deployStoreIds` + 下发 |

---

## Task 1: 模型 `scopeEntries` + 迁移 + 解析

**Files:** `order-limit-flow.js`、新 verify `verify-order-limit-scope-entries-p01.mjs`

- [ ] `createEmptyScopeEntry()` / `ensureScopeEntries(draft)`
- [ ] `migrateScopeAndOverridesToEntries(draft)`：`scope`+`overrides` → `scopeEntries`；设 `decoupledVersion = 2`
- [ ] `allScopeStoreIds` / `findEntryFor(store, line)` / `resolveLimitValue` 改为读 entry
- [ ] `(store, line)` 重叠检测 `scopeEntriesOverlap`
- [ ] `materializeStoreConfigsFromDecoupled` / `syncStoreConfigsFromDecoupled` 基于 entries
- [ ] `defaultDraft` 带 `scopeEntries: []`；读时若无 entries 则迁移
- [ ] verify：断言 `scopeEntries`、`migrateScopeAndOverridesToEntries`、`quantityMode`

---

## Task 2: 重排 `steps` + `validateStep` + `renderEditorContent`

- [ ] 更新 `steps` 标题数组为 7 步新序
- [ ] `validateStep`：3=模板（相对 entries 并集目标，可空跳过）；4=授权；5=时间/会员（无门店）；6=`scopeEntries.length≥1` 且每条有店+可解析目标、无重叠；7=deploy ⊆ 并集且非空 + 授权若未在 4 已校验则补
- [ ] `validateAll` 1–7
- [ ] `goToEditorStep`：离开第 6 步关向导/商品弹层；scene spy 挂在 step 3
- [ ] 删除或停用独立 `renderStepOverrides` 作为步骤入口（函数可暂留给迁移调试）

---

## Task 3: 第 5 步去掉生效门店；第 7 步缩小 deploy

- [ ] `renderStepFive`：去掉「生效门店」表格与相关文案
- [ ] 进入第 6/7 步或保存时：若 `deployStoreIds` 空 → 设为 entries 门店并集；从并集移除的店同步从 deploy 去掉
- [ ] `renderStepSeven`：增加生效门店勾选（选项 = 并集，可取消）；摘要三块：规则与默认数量 / 应用条目列表 / 授权与时间条件
- [ ] `buildPublishedDraft`：deploy ⊆ 并集后再物化

---

## Task 4: 应用范围卡片列表 + 新增向导

**Files:** `order-limit-flow.js`、`order-limit-flow.css`

- [ ] `renderStepScopeEntries`：空态 + 卡片列表（店数/产线/商品/沿用或覆盖 N 格）+「新增应用范围」
- [ ] 向导状态 `scopeEntryWizard`：`open, step(1-4), draftEntry, dirty`
- [ ] 向导 UI：1 门店多选 → 2 产线矩阵 → 3 商品（复用 brand/local 弹层写入当前 draftEntry）→ 4 inherit/override + 稀疏格
- [ ] 保存：重叠硬拦（`AppDialogs`/toast）；写入 `scopeEntries`；`syncStoreConfigsFromDecoupled`
- [ ] 编辑/删除卡片；删店级联清理 deploy
- [ ] CSS：复用/扩展 `.olf-override-card` 为 entry 卡；向导 overlay 对齐 product-add 弹层规格
- [ ] 规则名称/描述：放在第 1 步末或第 7 步前均可——**推荐第 1 步类型页下方或第 6 步页顶**；实现选改动更小者并在 verify 断言存在 `data-field="name"`

---

## Task 5: 限购数量步与商品并集

- [ ] `scopeTargetPairs` 改为扫描全部 entries
- [ ] 第 3 步空态：「前往应用范围」→ step 6；仍允许先添加品牌目标时写入**草稿临时 entry** 或提示必须先有 entry——**P0.1 钉死：空态只引导去第 6 步，不在第 3 步直接加品**
- [ ] `clearScopeProducts` / `targetType` 变更：清空各 entry 商品 + overrideCells；可保留 storeIds/lineIds

---

## Task 6: verify + 双写 + 手测

- [ ] `verify-order-limit-scope-entries-p01.mjs` GREEN
- [ ] 更新 P0 verify 中与旧步骤标题/例外步冲突的断言（或标记仅测模型函数）
- [ ] 双写主工作区 `order-limit-flow.js/.css` + scripts + docs
- [ ] 手测：A 全 inherit 一条 entry；B 一条 override；第 7 步取消一店备发；旧 P0 草稿打开能迁移

---

## DoD

- [ ] 步骤序与 §5 一致
- [ ] 无独立例外步；覆盖在 entry 内
- [ ] 第 5 步无门店；第 7 步可缩小 deploy
- [ ] P0.1 verify GREEN；主工作区已同步
- [ ] 未自动 commit
