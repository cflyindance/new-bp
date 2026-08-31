# 自助餐规则“菜品集”限购对象实施计划

> 日期：2026-08-31  
> 分支：`codex/buffet-dish-set-limit`  
> 设计依据：[2026-08-31-buffet-dish-set-limit-design.md](../specs/2026-08-31-buffet-dish-set-limit-design.md)

## 1. 实施目标

在自助餐规则中新增 `dish_set` 限购对象，使每家门店选择的至少两个菜品跨产线共享一个数量额度，同时保持菜单下单限制以及现有 `dish`、`category` 自助餐规则不变。

交付完成标准：

- 规则类型新增“按菜品集限购”，自助餐 12 种合法组合全部可创建。
- 每店独立保存菜品集成员，至少两个有效成员才能发布或启用。
- 数量矩阵按“门店 × 人数区间 × 轮次区间”保存一个共享额度，不包含产线或单品维度。
- 同口径、同条件菜品集成员重叠时发布/启用失败；与单品和分类规则允许叠加。
- 运行时跨产线聚合集合成员数量并进行原子校验。
- 旧版规则、菜单下单限制和既有自助餐场景回归通过。

## 2. 影响文件

主要修改：

- `dist/Configuration center/assets/buffet-rule-profile.js`
- `dist/Configuration center/assets/buffet-rule-domain.js`
- `dist/Configuration center/assets/order-limit-flow.js`

新增聚焦验证：

- `scripts/verify-buffet-dish-set-profile.mjs`
- `scripts/verify-buffet-dish-set-schema.mjs`
- `scripts/verify-buffet-dish-set-product-configuration.mjs`
- `scripts/verify-buffet-dish-set-quantity-ui.mjs`
- `scripts/verify-buffet-dish-set-conflicts.mjs`
- `scripts/verify-buffet-dish-set-runtime.mjs`
- `scripts/verify-buffet-dish-set-lifecycle.mjs`

按调查结果决定是否需要修改，但不得预先扩大范围：

- `dist/Configuration center/assets/order-limit-flow.css`：只有现有布局类无法表达共享额度行时才修改。
- `dist/Configuration center/buffet-rule*.html`：只有脚本加载或可访问性标记需要调整时才修改。

明确不修改：

- 菜单下单限制 profile、数据空间和运行快照。
- `vendor/emenu-new`；因此本计划不触发 `build:emenu-new-embed`。
- 全局菜单分类或商品主数据。

## 3. 数据兼容策略

- 仓库键继续为 `buffet-rule:repository:v1`，envelope `schemaVersion` 保持 `1`。
- 规则级 `schemaVersion: 1` 继续承载 `dish` 和 `category`。
- 规则级 `schemaVersion: 2` 承载 `dish_set`。
- 未知规则版本只使该规则进入只读异常态，不影响其他已知版本规则。
- 菜品集门店配置使用 `dishSetMembers` 和 `dishSetLimits`；不把共享额度伪装成某条产线或某个菜品的 limit cell。
- 只有用户确认将旧规则切换为菜品集时，才清空原商品及数量并把草稿升级为规则级 v2。

## 4. 分步实施

### 步骤 1：锁定 profile 与合法场景

RED：新增 `verify-buffet-dish-set-profile.mjs`，断言：

- `allowedTargetTypes` 包含 `dish_set`，菜单下单限制 profile 不包含它。
- 默认场景从 8 种增加为 12 种，新增四种 mouth 均存在且默认禁用。
- `targetType` 文案为“按菜品集限购”，说明为“所选多个菜品共同使用一个数量上限”。

运行测试并保留失败证据：

```powershell
node scripts/verify-buffet-dish-set-profile.mjs
```

GREEN：修改 `buffet-rule-profile.js`：

- 增加四条 `dish_set` 场景。
- 将 `allowedTargetTypes` 扩展为 `category | dish | dish_set`。
- 保证默认规则播种以新的场景表补齐缺失场景，不重复已有规则。
- 对外输出菜品集对象标签和场景名称。

提交：

```text
feat: add buffet dish set scenarios
```

### 步骤 2：实现规则级 v2 与门店配置规范化

RED：新增 `verify-buffet-dish-set-schema.mjs`，覆盖：

- envelope v1 可同时读取规则 v1 与 v2。
- v1 菜品/分类规则加载结果不变。
- v2 菜品集按 `productLineId + dishId` 去重成员。
- 同一 dishId 位于两条产线时保留两个菜单身份。
- 未知规则版本进入只读异常态且不写回。
- 切换为菜品集后生成 `dishSetMembers`、`dishSetLimits`，并移除旧 `targetIds/limits` 的业务使用。

GREEN：在共享流程中增加有边界的适配函数：

- `isDishSetDraft(draft)`。
- `normalizeRuleSchemaVersion(draft)`。
- `normalizeDishSetStoreConfig(config)`。
- `dishSetLimitKey(partyIndex, roundIndex)`。
- `dishSetMembersForStore(draft, storeId)`。

要求：现有 `normalizeStoreDraft`、`cloneStoreConfig` 和恢复流程只在 `dish_set` 分支进入新结构；旧分支保持原代码路径。

提交：

```text
feat: add buffet dish set schema
```

### 步骤 3：扩展商品选择与已选商品预览

RED：新增 `verify-buffet-dish-set-product-configuration.mjs`，断言：

- 菜品集固定使用菜品叶子选择，不允许分类叶子。
- 门店切换分别保存成员。
- 搜索只匹配菜品/分类名称，并自动定位所属分类。
- 已选商品预览继续支持门店、产线、菜单搜索筛选。
- 单删、批删、全删后成员和失效数量同步更新。
- 少于两个成员允许保存草稿，但步骤状态显示待完善。

GREEN：修改 `order-limit-flow.js`：

- `targetShortLabel`、`targetSource`、选择器 leaf level 和搜索选择逻辑识别 `dish_set`。
- 复用 `structureByLine` 保存选择过程，提交到草稿时投影为 `dishSetMembers`。
- 已选商品行继续以 `storeId + lineId + dishId` 作为稳定 row ID。
- 删除成员时清理相关选择状态，但不得按成员删除共享额度；成员少于两个时把发布完整性标记为失败。
- 所有文案从二元 `dish/category` 判断改为显式三分支，避免菜品集误显示为分类。

提交：

```text
feat: configure buffet dish set members
```

### 步骤 4：实现共享数量矩阵与页面 A

RED：新增 `verify-buffet-dish-set-quantity-ui.mjs`，覆盖：

- 每个门店、人数区间、轮次区间只派生一个 cell。
- cell key 不含产线和菜品 ID。
- 跨 3 条产线选择 6 个成员仍只显示一个共享额度输入。
- 空输入为未配置，0 为禁止下单。
- “查看菜品”显示只读成员列表。
- 批量设置只作用于选中的人数/轮次场景，不出现商品行选择。

GREEN：在 `order-limit-flow.js` 中隔离菜品集数量分支：

- 新增 `eachDishSetLimitCell` 和 `dishSetCompletion`，不要复用逐 target 的 `eachLimitCell`。
- 新增 `renderDishSetLimitRuleList`，呈现字段：门店、人数场景、轮次、菜品集摘要、共享限额。
- 菜品集摘要显示 `N 个菜品 / M 条产线`，并绑定“查看菜品”。
- 数量输入、批量应用、重置、分页和门店筛选使用新 cell key。
- `renderLimitRuleList` 在 `dish_set` 时进入新渲染器，旧列表保持原样。

若现有 CSS 类不足，再对 `order-limit-flow.css` 做最小补充并增加对应结构验证。

提交：

```text
feat: add buffet dish set shared limits
```

### 步骤 5：补齐发布校验与冲突矩阵

RED：新增 `verify-buffet-dish-set-conflicts.mjs`，覆盖：

- 每个生效门店有效成员少于 2 个时返回 `DISH_SET_MIN_MEMBERS_REQUIRED`。
- 失效成员不计入最小数量。
- 共享矩阵缺失返回 `DISH_SET_LIMIT_INCOMPLETE`。
- 同门店、同统计 mouth、生效条件重叠的两个集合存在相同 `lineId + dishId` 时冲突。
- 同一 dishId 位于不同产线时不视为相同成员身份。
- 不同 mouth 的菜品集允许叠加。
- 菜品集与菜品、分类规则允许叠加。
- 编辑排除自身和 `sourceRuleId`；草稿仅提示，发布和启用硬阻断。

GREEN：修改 `buffet-rule-domain.js`：

- `targetEntries` 为菜品集输出成员身份列表，而不是一个集合伪 target。
- `sameTarget` 对菜品集按 `storeId + lineId + dishId` 比较。
- `findConflict` 仅在双方均为 `dish_set` 且 mouth 相同的情况下执行成员交集阻断；跨对象类型不阻断。
- 增加发布完整性错误码和可诊断详情。

修改 `order-limit-flow.js`：

- `validateStep`、发布前校验和启用校验接入最小成员、有效性、矩阵完整性与重叠冲突。
- 保存草稿保留非阻塞提示。

提交：

```text
feat: validate buffet dish set conflicts
```

### 步骤 6：实现跨产线运行时聚合

RED：新增 `verify-buffet-dish-set-runtime.mjs`，使用可执行输入断言：

- 整单上限 5，Used=4，跨产线新增 A1+B1 时整批拒绝。
- 3 人、每人每单 L=2 时 EffectiveLimit=6。
- 每轮和分轮次只统计当前轮，且正确命中人数/轮次区间。
- 单品、分类和菜品集规则同时命中时全部通过才允许。
- 集合成员限额为 0 时任一成员新增均拒绝。
- 授权放行后超量继续进入下一次 Used。
- operationId 幂等、订单版本重试和整批原子性保持不变。

GREEN：修改 `buffet-rule-domain.js`：

- 发布快照保留每店成员身份与共享矩阵。
- 增加菜品集成员匹配和 `quantityByRule` 聚合入口，使一条规则的跨产线成员汇总为单个 `Q`。
- `effectiveLimit` 复用现有人数/轮次计算，但从 `dishSetLimits` 读取配置值。
- 超限错误使用 `DISH_SET_LIMIT_EXCEEDED`，并携带 Used、increment、effectiveLimit。
- 不修改标准菜单模式的模块选择逻辑。

提交：

```text
feat: enforce buffet dish set quotas
```

### 步骤 7：完成列表、复制、恢复和发布生命周期

RED：新增 `verify-buffet-dish-set-lifecycle.mjs`，覆盖：

- 列表和确认页显示“按菜品集”及门店商品摘要。
- 草稿自动保存和 session recovery 保留 v2 数据。
- 复制产生独立 draftId，保留各店成员和共享矩阵，并重新校验冲突。
- 编辑旧 v1 规则不自动升级。
- 切换对象确认后清空不兼容配置并升级/保持正确规则版本。
- 新增、编辑、复制、发布确认进入全屏；返回列表退出全屏。

GREEN：补齐 `order-limit-flow.js` 与 `buffet-rule-profile.js` 的投影、摘要、复制和恢复分支。所有保存均继续通过现有 repository 事务，不新增存储键。

提交：

```text
feat: complete buffet dish set lifecycle
```

### 步骤 8：聚焦回归、构建与浏览器验收

先运行所有新增测试：

```powershell
Get-ChildItem scripts -Filter 'verify-buffet-dish-set-*.mjs' | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

再运行全部既有自助餐回归：

```powershell
Get-ChildItem scripts -Filter 'verify-buffet-*.mjs' | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

运行受影响的菜单下单限制回归，至少包括：

```powershell
node scripts/verify-order-limit-rule-product-decoupling-p0.mjs
node scripts/verify-order-limit-product-quantity-merge.mjs
node scripts/verify-order-limit-rule-detail-view.mjs
```

Build：`required`。原因是修改部署目录中的运行时脚本、规则 profile 和共享编辑器分支，属于用户运行路径和发布产物边界。

```powershell
npm.cmd run build
```

构建后检查：

- 命令成功退出。
- `dist/Configuration center/assets/buffet-rule-profile.js` 仍包含 `dish_set`。
- `dist/Configuration center/assets/buffet-rule-domain.js` 仍包含菜品集冲突和运行时逻辑。
- `dist/Configuration center/assets/order-limit-flow.js` 仍包含菜品集配置和数量 UI；防止构建步骤覆盖手工维护的部署资产。
- `git status --short` 仅包含本任务预期文件；构建生成的无关哈希产物不得混入功能提交。

浏览器 E2E 必须覆盖：

1. 登录本功能 worktree 的开发服务。
2. 打开“前厅管理中心 → 自助餐规则”。
3. 新增规则并选择“按菜品集限购”。
4. A 门店跨两条以上产线选择至少两个菜品；B 门店选择不同成员。
5. 查看已选商品筛选、单删二次确认、批删和全部删除。
6. 进入限购数量，确认每店每场景只有一个共享额度输入，并可查看成员。
7. 验证 0、空值和正整数状态。
8. 完成发布确认并返回列表，确认全屏进入/退出。
9. 复制规则并验证独立草稿。
10. 打开菜单下单限制，确认不存在“按菜品集”选项且原功能正常。

浏览器同时检查 console error；必要 E2E 未通过不得汇报完成。

最终提交：

```text
test: verify buffet dish set limits
```

## 5. 风险与回滚

主要风险：

- 共享编辑器中大量二元 `dish/category` 判断可能把 `dish_set` 错当分类。通过搜索全量 `targetType` 分支和聚焦回归控制。
- 旧数量矩阵以 target/line 为维度，若误复用会产生多个“共享”额度。菜品集必须使用独立 key 和遍历器。
- envelope 与规则级 schema 混淆可能导致仓库整体不可读。测试必须明确 envelope 始终 v1。
- 构建可能覆盖部署目录的直接资产。构建后必须检查关键标记和 Git 差异。

回滚方式：按独立提交逆序回滚菜品集功能提交；由于没有迁移仓库 envelope、没有改变旧规则结构，回滚后旧 v1 规则仍可读取。若已有 v2 草稿，旧代码应将该条规则显示为数据异常而不是覆盖仓库；正式回滚前应先禁用或导出 v2 规则。

## 6. 完成报告要求

最终报告必须包含：

- 实际修改文件和提交列表。
- 每个新增测试的 RED 与 GREEN 证据。
- 全部自助餐回归和受影响菜单下单限制回归结果。
- production build 结果及部署资产保留检查。
- 浏览器 E2E 路径、关键可见证据和 console 状态。
- 未验证范围；没有则明确写“无”。
