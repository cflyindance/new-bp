# 自助餐规则独立模块 Implementation Plan

> 全程在独立 worktree 中实施，按任务验证并提交；不得直接在 main 工作区开发。

**Goal:** 在前厅管理中心新增独立“自助餐规则”导航和固定六步规则管理模块，只开放已确认的 8 种组合，同时保持现有“菜单下单限制”的页面、12 场景、存储和交互不变。

**Architecture:** 将现有 `order-limit-flow.js` 抽成配置驱动共享引擎。菜单模块使用默认 `MENU_ORDER_LIMIT_PROFILE`；自助餐页面在加载共享引擎前注入 `BUFFET_RULE_PROFILE`，使用独立路由、单 envelope 数据仓和恢复键。两个模块按订单 `orderMode` 二选一运行。

**Tech Stack:** TypeScript、Vite、原生 JS/CSS iframe 页面、浏览器存储原型、Node assert 验证脚本、浏览器端到端自测。

**Spec:** `docs/superpowers/specs/2026-08-28-buffet-rule-module-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\buffet-rule-module-design`

**Branch:** `codex/buffet-rule-module-design`

**非目标:** 不修改 `vendor/emenu-new`；不改变菜单模块既有迁移；不增加后置发布门店页；不实现历史版本恢复；不让两个模块对同一订单共同计算。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| `src/main.ts` | 新导航路径、iframe 入口、路由分发 |
| `src/config/foh-menu-order-limits-ui.ts` | 抽取可复用 iframe 面板且保持菜单输出不变 |
| `src/config/foh-buffet-rules-ui.ts` | 新自助餐模块容器 |
| `src/config/deployment-config-domains.ts` | 独立配置域和导航引用 |
| `dist/Configuration center/buffet-rule*.html` | 新列表、编辑、发布确认页面 |
| `dist/Configuration center/assets/order-limit-flow.js` | 配置驱动共享引擎 |
| `dist/Configuration center/assets/buffet-rule-profile.js` | 自助餐 Profile、8 场景、存储契约 |
| `dist/Configuration center/assets/order-limit-flow.css` | 共享视觉样式 |
| `scripts/verify-buffet-rule-*.mjs` | 新模块和回归验证 |

## Task 1：建立菜单模块零回归护栏

**Files:** Create `scripts/verify-buffet-rule-menu-regression.mjs`

- [ ] 断言菜单权威键 `restaurantRules`、恢复前缀、12 场景、步骤和三个既有页面路径。
- [ ] 建立浏览器存储快照夹具，比较自助餐流程前后菜单键和值。
- [ ] 运行全部 `verify-order-limit-*.mjs` 并记录基线。
- [ ] Commit: `test: protect menu order limit behavior`

```powershell
node scripts/verify-buffet-rule-menu-regression.mjs
Get-ChildItem scripts/verify-order-limit-*.mjs | ForEach-Object { node $_.FullName }
```

## Task 2：改造成 Profile 驱动共享引擎

**Files:** Modify `assets/order-limit-flow.js`, `order-limit*.html`; create `scripts/verify-buffet-rule-profile-engine.mjs`

- [ ] 增加默认 `MENU_ORDER_LIMIT_PROFILE`，含 moduleId、标题、路由、存储 adapter、合法组合、步骤、数量列和冲突策略。
- [ ] 从 `window.ORDER_LIMIT_MODULE_PROFILE || MENU_ORDER_LIMIT_PROFILE` 读取配置，禁止用页面路径分支业务。
- [ ] 将写死的页面路径、存储键、恢复前缀和标题改为 Profile 读取。
- [ ] 菜单 HTML 显式/默认使用菜单 Profile，现有 DOM、文案和行为不变。
- [ ] 为纯函数提供仅测试环境可见的导出钩子。
- [ ] 运行 Task 1 回归至 GREEN。
- [ ] Commit: `refactor: make order limit flow profile driven`

## Task 3：实现自助餐独立仓库

**Files:** Create `assets/buffet-rule-profile.js`, `scripts/verify-buffet-rule-repository.mjs`; modify shared flow

- [ ] 实现 `buffet-rule:repository:v1` 单 envelope：schemaVersion、revision、StoredRule、drafts、snapshots、currentSnapshotId。
- [ ] StoredRule 保存完整 authoringConfig；列表摘要派生，运行快照只含编译后的 active 规则。
- [ ] 使用 `buffet-rule:recovery:v1:{draftId}` 及独立列偏好/筛选键。
- [ ] 实现 parser、幂等内存 normalizer、损坏/未知版本只读错误态。
- [ ] 实现模块锁、expectedRevision、按 ID 合并不相交变更，禁止静默覆盖。
- [ ] 发布只执行一次权威键写入；失败保留旧快照和草稿。
- [ ] 实现新建、复制、编辑、启用、禁用、删除状态机。
- [ ] 验证双标签编辑、自动保存与发布竞争及写入故障回滚。
- [ ] Commit: `feat: add isolated buffet rule repository`

## Task 4：实现 8 场景与固定六步

**Files:** Modify profile/shared flow; create `scripts/verify-buffet-rule-scenarios.mjs`

- [ ] order 仅开放整单 × dish/category；party_size 开放三个周期 × 两对象。
- [ ] partyRanges 固定为 `[{min:1,max:null}]`，页面不显示人数区间。
- [ ] 固定六步：规则类型、场景配置、限购数量、超限授权、生效范围、确认发布。
- [ ] 非 multi_round 的场景页只显示摘要；multi_round 只配置轮次区间。
- [ ] 实现四类数量文案和空值、0、正整数语义。
- [ ] 实现主体/周期/对象/轮次切换确认与数据清理。
- [ ] 参数化验证 8 个合法、4 个非法组合及区间连续性。
- [ ] Commit: `feat: add buffet rule scenario wizard`

## Task 5：复用商品、门店与数量交互

**Files:** Modify shared flow/CSS; create `scripts/verify-buffet-rule-product-configuration.mjs`

- [ ] 复用参与门店下拉、门店产线商品搜索、分类自动选择和已选商品预览。
- [ ] 商品范围与数量矩阵按配置门店独立保存；生效门店只在第 5 步选择。
- [ ] 复用筛选、全选、多选、批量应用/删除；不恢复状态、实际限额、设为不限制/禁止。
- [ ] 对象和产线使用稳定 ID；切店自动保存上一店配置。
- [ ] 生效门店至少一家且配置完整；取消生效不得删除作者态。
- [ ] 浏览器验证搜索、预览、删除确认和批量行为。
- [ ] Commit: `feat: reuse product quantity configuration for buffet rules`

## Task 6：冲突、生效条件与授权

**Files:** Modify shared flow; create `scripts/verify-buffet-rule-conflicts.mjs`, `scripts/verify-buffet-rule-authorization.mjs`

- [ ] 实现表驱动 4×4 口径矩阵。
- [ ] 冲突键包含门店、产线、对象；范围求交包含日期、活动周期、星期/月日、营业时段、会员。
- [ ] 草稿只提示；active 发布/启用硬阻断；编辑排除自身和 sourceRuleId；禁用不阻断。
- [ ] category 与 dish 可叠加，两个模块不跨模块冲突。
- [ ] 复用 Conditions 校验，覆盖 daily/weekly/monthly 与跨午夜。
- [ ] 实现三种授权凭证；当前轮缺 roundNo 时该范围不可用。
- [ ] 多条超限必须全部被凭证覆盖，版本变化使凭证失效，授权量仍计数。
- [ ] Commit: `feat: enforce buffet conflicts and authorization`

## Task 7：运行时编译与准入计算

**Files:** Modify shared flow; create `scripts/verify-buffet-rule-runtime.mjs`

- [ ] 编译 currentSnapshotId 中的 active 自助餐规则。
- [ ] 实现 `L` 与 `L × N`；N 缺失或非正整数时阻断按人数规则。
- [ ] 实现整单、每轮、分轮次及 dish/category 的 Used_i、Q_i 聚合。
- [ ] 批量逐规则验证 `Used_i + Q_i <= EffectiveLimit_i`，整批原子返回。
- [ ] 实现 operationId 幂等和订单版本冲突重算模型。
- [ ] 覆盖购物车去重、套餐、退菜/作废、转桌/并单/拆单/重开边界。
- [ ] orderMode 选择器：standard→菜单，buffet+session→自助餐，非法上下文阻断。
- [ ] Commit: `feat: add buffet rule runtime evaluator`

当前仓库若只承载管理端原型，本任务交付可测试的编译/准入契约；真实服务端订单事务接入须在订单服务仓库实施，不得用浏览器存储冒充生产原子性。

## Task 8：新增页面、主导航和配置域

**Files:** Create `buffet-rule.html`, `buffet-rule-editor.html`, `buffet-rule-publish-confirm.html`, `src/config/foh-buffet-rules-ui.ts`, `scripts/verify-buffet-rule-navigation.mjs`; modify `src/main.ts`, menu UI, deployment domains

- [ ] 新页面先加载 buffet profile，再加载共享 flow/CSS。
- [ ] 新增 `/operations/queue-call/buffet-rules` 和稳定节点 `foh-buffet-rules`。
- [ ] “自助餐规则”紧邻位于“菜单下单限制”下方。
- [ ] embedded、全屏、mode、draftId、ruleId 正确透传，返回不跨模块。
- [ ] 注册独立 deployment domain，不复用菜单域键。
- [ ] 运行 TypeScript 构建和导航断言。
- [ ] Commit: `feat: add buffet rules navigation and pages`

## Task 9：完成列表与发布闭环

**Files:** Modify shared flow/CSS; create `scripts/verify-buffet-rule-lifecycle.mjs`

- [ ] 支持新增、继续编辑、正式编辑、复制、只读查看、启停、删除、筛选、列设置和分页。
- [ ] 所有标题、按钮、返回和空状态使用“自助餐规则”。
- [ ] 第 6 步复核计算方式、商品、数量完成度、门店、条件和授权。
- [ ] 发布成功更新 envelope 并清恢复键；失败保留草稿和旧版本。
- [ ] 列表只从 StoredRule 派生，运行时只读当前不可变快照。
- [ ] Commit: `feat: complete buffet rule lifecycle`

## Task 10：全量验证与浏览器自测

- [ ] 运行全部 buffet 和既有 order-limit 专项脚本。
- [ ] 执行 `npm.cmd run build`。
- [ ] 启动 worktree 开发服务并强制刷新。
- [ ] 自测导航、8 场景、六步、恢复、复制、启停、冲突、授权、发布失败和双标签并发。
- [ ] 自测 standard/buffet 二选一及非法订单上下文。
- [ ] 比较完整自助餐流程前后的菜单存储快照。
- [ ] 截图记录导航、列表、场景、数量、授权、生效范围和发布确认。
- [ ] 执行 `git diff --check`、`git status --short`，排除缓存和无关文件。
- [ ] Commit: `test: verify independent buffet rules module`

```powershell
Get-ChildItem scripts/verify-buffet-rule-*.mjs | ForEach-Object { node $_.FullName }
Get-ChildItem scripts/verify-order-limit-*.mjs | ForEach-Object { node $_.FullName }
npm.cmd run build
git diff --check
git status --short
```

## 最终验收

1. 导航位置、固定六步的视觉与交互完全参照菜单下单限制。
2. 自助餐只开放 8 场景，按人数不显示人数区间。
3. 两模块路由、草稿、规则、快照、偏好和运行选择完全隔离。
4. 菜单下单限制全部既有验证无回归。
5. 写入失败、多标签竞争和非法订单上下文不会静默放行或丢数据。
6. 全部改动在 `codex/buffet-rule-module-design` worktree 分支形成可审阅提交。
