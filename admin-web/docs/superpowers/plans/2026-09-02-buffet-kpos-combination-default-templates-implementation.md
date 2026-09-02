# 自助餐 KPOS 每轮组合默认模板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变现有 12 条原子默认规则的前提下，新增 6 条按人数区间配置的每轮组合模板，用一个模板的两个默认人数区间完整承载旧 KPOS 的 12 个组合场景。

**Architecture:** `buffet-rule-profile.js` 继续作为系统默认模板、版本和对账的唯一来源；组合模板仍持久化为标准 v4 `storeConfigs[*].periodValues`，只增加稳定 `rangeId` 键协议，不新增 repository 空间。编辑器把 v4 map 投影为“人数区间分区式”页面，domain 使用同一倍率推导函数编译运行约束和冲突约束，系统默认身份与展示名称不参与业务计算。

**Tech Stack:** 原生 JavaScript IIFE、HTML/CSS、localStorage repository、Node.js `assert` 验证脚本、Vite 生产构建。

**Spec:** `docs/superpowers/specs/2026-09-02-buffet-kpos-combination-default-templates-design.md`

## Global Constraints

- 系统默认目录固定为 4 条整单原子规则、6 条每轮常用组合模板、8 条每轮原子规则，共 18 条。
- 六个组合稳定键必须逐字使用规格 §3 的规范值，禁止从名称生成、改名或复用。
- 组合模板统一使用 `subject=party_size` 和 `period=per_round`，但只有写入 `targetLimits` 的 X 乘有效人数。
- M/N 写 `tableTotalBounds`；C01～C03 的 X 写 `tableTargetCaps`；C04～C06 的 X 写 `targetLimits`；P 写 `defaultDishLimits`。
- 新组合模板只使用 `party:<rangeId>|round:0` 协议；历史原子规则继续使用索引键，禁止自动迁移或单规则混写。
- 默认人数区间为“3 人及以下”和“4 人及以上”，连续、互斥并完整覆盖有效人数。
- M/N/X 以及菜品集模板的 P 为发布必填；空值可保存草稿，`0` 是有效禁止额度，且必须满足 `M <= N`。
- 草稿可保存重叠配置；启用和发布按编译后的业务约束阻断冲突，并返回全部冲突区块。
- 不修改菜单下单限制的数据、路由或交互；不修改 `vendor/emenu-new`，因此不触发 eMenu 嵌入包构建。

## File Structure

- Modify: `dist/Configuration center/assets/buffet-rule-profile.js` — 六条模板目录、空白草稿、稳定区间身份、发布校验、幂等对账。
- Modify: `dist/Configuration center/assets/order-limit-flow.js` — 人数区间操作、组合数量投影与写回、六步编辑、发布摘要和默认列表分组。
- Modify: `dist/Configuration center/assets/order-limit-flow.css` — 组合模板分组与区间分区式数量编辑样式。
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js` — 倍率推导、运行时限制编译、全区块冲突诊断和静态可满足性。
- Modify: `scripts/verify-buffet-default-catalog.mjs` — 18 条目录和六个永久键。
- Modify: `scripts/verify-buffet-default-reconciliation.mjs` — 对账、重复候选、并发和业务数据不变量。
- Create: `scripts/verify-buffet-combo-range-identity.mjs` — `rangeId` 生命周期和孤儿键。
- Create: `scripts/verify-buffet-combo-template-editor.mjs` — 六模板字段映射、编辑和校验。
- Create: `scripts/verify-buffet-combo-template-runtime.mjs` — 12 场景、倍率、累计和跨产线运行行为。
- Create: `scripts/verify-buffet-combo-template-conflicts.mjs` — 约束层与完整规则层冲突矩阵。
- Create: `scripts/verify-buffet-combo-template-list-ui.mjs` — 4/6/8 分组、入口和摘要文案。

---

### Task 1: 注册六条组合模板并安全补齐默认目录

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:53-180,500-590`
- Modify: `scripts/verify-buffet-default-catalog.mjs`
- Modify: `scripts/verify-buffet-default-reconciliation.mjs`

**Interfaces:**
- Produces: `DEFAULT_SCENARIOS` 中六个 `group: "per_round_combo"` 模板。
- Produces: `createDefaultPartyRanges(): Array<{rangeId,min,max}>`。
- Consumes: 现有 `reconcileDefaultScenarios(envelope)` 的 revision/锁和候选优先级。

- [ ] **Step 1: 写 18 条目录失败测试**

在 `verify-buffet-default-catalog.mjs` 断言精确分组、顺序和稳定键：

```js
assert.deepEqual(
  profile.defaultScenarios.reduce((out, item) => ((out[item.group] = (out[item.group] || 0) + 1), out), {}),
  { order_lifetime: 4, per_round_combo: 6, per_round: 8 }
);
assert.deepEqual(
  profile.defaultScenarios.filter((item) => item.group === "per_round_combo").map((item) => item.key),
  [
    "combo|per_round|dish|table",
    "combo|per_round|dish_set|piece|table",
    "combo|per_round|dish_set|kind|table",
    "combo|per_round|dish|party_size",
    "combo|per_round|dish_set|piece|party_size",
    "combo|per_round|dish_set|kind|party_size"
  ]
);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-default-catalog.mjs`

Expected: FAIL，当前目录只有 12 条且没有 `per_round_combo`。

- [ ] **Step 3: 实现规范模板元数据和默认区间**

六条模板都写入 `subject: "party_size"`、`enabledPeriods: ["per_round"]`、`targetType`、`measureUnit` 和以下 blocks：

```js
function comboBlocks(hasSameDish) {
  return { totalEnabled: true, targetEnabled: true, sameDishEnabled: !!hasSameDish };
}
function createDefaultPartyRanges() {
  return [
    { rangeId: createRangeId(), min: 1, max: 3 },
    { rangeId: createRangeId(), min: 4, max: null }
  ];
}
```

C01/C04 使用 `comboBlocks(false)`；C02/C03/C05/C06 使用 `comboBlocks(true)`。模板初始化时只创建区间和空 v4 maps，不预填 M/N/X/P。

- [ ] **Step 4: 写并验证原子幂等对账**

在 `verify-buffet-default-reconciliation.mjs` 覆盖：空库只生成 18 条、12 条旧目录只追加 6 条、二次执行不增加 revision/规则数、同键重复按“快照＞发布＞启用＞配置完整度＞时间＞ID”选主记录。有业务数据/草稿/快照引用的重复记录只剥离系统身份；仅空白禁用无引用副本可删除。

Run: `node scripts/verify-buffet-default-catalog.mjs && node scripts/verify-buffet-default-reconciliation.mjs`

Expected: PASS。

- [ ] **Step 5: 提交目录与对账**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-default-catalog.mjs scripts/verify-buffet-default-reconciliation.mjs
git commit -m "feat: add buffet combination default templates"
```

### Task 2: 建立稳定 rangeId 键协议

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:2100-2440,3720-4030`
- Create: `scripts/verify-buffet-combo-range-identity.mjs`

**Interfaces:**
- Produces: `comboScenarioKey(rangeId): string`。
- Produces: `comboTargetKey(rangeId, productLineId, dishId): string`。
- Produces: `reconcileComboRangeEdit(previousRanges, nextRanges, storeConfigs)`。

- [ ] **Step 1: 写 rangeId 生命周期失败测试**

测试固定键格式并覆盖四类操作：边界修改保留 ID/额度；插入生成新 ID 且新额度为空；删除只清理被删 ID 的所有门店 M/N/X/P；无法确定的合并生成新 ID、清理旧孤儿且不复制数量。

```js
assert.equal(api.comboScenarioKey("pr_a"), "party:pr_a|round:0");
assert.equal(api.comboTargetKey("pr_a", "kiosk", "dish:1"), "party:pr_a|round:0|line:kiosk|target:dish:1");
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-combo-range-identity.mjs`

Expected: FAIL，新脚本找不到稳定键接口，现有实现仍按数组索引生成场景键。

- [ ] **Step 3: 实现稳定键和类型识别**

新增严格识别器：组合规则的所有 `partyRanges` 必须有唯一非空 `rangeId`，所有数量键必须以当前有效 `party:<rangeId>|round:0` 开头；历史规则未声明组合稳定键时继续走现有索引逻辑。单条规则一旦出现两种键，返回 `MIXED_SCENARIO_KEY_MODE`，不得尝试猜测迁移。

- [ ] **Step 4: 实现区间增删改清理和发布净化**

所有 map 统一遍历：

```js
var COMBO_VALUE_MAPS = [
  "tableTotalBounds", "tableTargetCaps", "targetLimits",
  "defaultDishLimits", "totalBounds", "exceptionDishLimits"
];
```

删除区间时按场景键前缀精确删除；编译发布快照时过滤无法命中现存 `rangeId` 的键。`productLineId + dishId` 共同构成菜品身份。

- [ ] **Step 5: 运行范围身份与历史回归**

Run: `node scripts/verify-buffet-combo-range-identity.mjs && node scripts/verify-buffet-period-scenario-editor.mjs && node scripts/verify-buffet-v4-profile.mjs`

Expected: PASS，历史索引键夹具深等值不变。

- [ ] **Step 6: 提交稳定区间身份**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-combo-range-identity.mjs
git commit -m "feat: add stable buffet combo range keys"
```

### Task 3: 实现组合数量投影、写回和发布校验

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:3760-4250`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:644-910`
- Create: `scripts/verify-buffet-combo-template-editor.mjs`

**Interfaces:**
- Produces: `comboRangeProjection(draft, storeId, rangeId)`。
- Produces: `writeComboRangeValue(draft, storeId, rangeId, field, target, cell)`。
- Produces: `validateComboPublication(draft, storeIds): {ok,code?,storeId?,rangeId?,block?}`。

- [ ] **Step 1: 写六模板字段映射失败测试**

逐模板写入 M=1、N=8、X=2、P=1，并断言：M/N 只进入 `tableTotalBounds`；C01～C03 的 X 只进入 `tableTargetCaps`；C04～C06 的 X 只进入 `targetLimits`；P 只进入 `defaultDishLimits`；C01/C04 不生成 P。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-combo-template-editor.mjs`

Expected: FAIL，尚无组合投影与规范 map 写回。

- [ ] **Step 3: 实现按门店、区间和对象的投影/写回**

菜品 X 使用带 `productLineId + dishId` 的 target key；菜品集 X/P 使用场景键共享值。写固定 X 时清空同键 `targetLimits`；写人均 X 时清空同键 `tableTargetCaps`，确保单模板不会同时产生两种倍率父额度。

- [ ] **Step 4: 实现草稿与发布两级校验**

草稿允许空值；启用/发布要求每个实际生效门店的每个区间 M/N/X 完整，C02/C03/C05/C06 还要求 P。允许 `0`，拒绝负数、小数、非有限数和 `M > N`，错误对象必须包含 `storeId`、`rangeId`、`block`。不要用 `M > X` 或 `M > P` 推断无解。

- [ ] **Step 5: 运行编辑、校验和部署门店回归**

Run: `node scripts/verify-buffet-combo-template-editor.mjs && node scripts/verify-buffet-v4-validation.mjs && node scripts/verify-buffet-period-quantity-editor.mjs`

Expected: PASS。

- [ ] **Step 6: 提交数量模型**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-combo-template-editor.mjs
git commit -m "feat: edit buffet combination quantities"
```

### Task 4: 统一倍率推导并执行 12 个运行场景

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js:500-900`
- Create: `scripts/verify-buffet-combo-template-runtime.mjs`
- Modify: `scripts/verify-buffet-v4-runtime.mjs`

**Interfaces:**
- Produces: `limitMultiplierMode(subject, mapName): "table_fixed" | "party_multiplier"`。
- Produces: 标准 v4 运行时约束，不读取 `defaultVariant`、名称或系统默认身份。

- [ ] **Step 1: 写倍率和累计失败测试**

对 2 人与 4 人分别运行 C01～C06：M/N/P 始终固定；C01～C03 的 X 固定；C04～C06 的 X 分别得到 `2X`、`4X`。断言当前轮累计包含此前已下单量，新轮次重置；菜品集跨产线合并，按份统计总份数、按种统计不同 `productLineId+dishId` 数量。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-combo-template-runtime.mjs`

Expected: FAIL，运行时尚不能解析 rangeId 场景键或字段级倍率。

- [ ] **Step 3: 实现唯一倍率推导函数**

```js
function limitMultiplierMode(subject, mapName) {
  if (mapName === "targetLimits" && subject === "party_size") return "party_multiplier";
  return "table_fixed";
}
```

运行时和后续冲突编译必须共同调用此函数。回归断言现有 `subject=order + targetLimits` 仍为固定整桌额度。

- [ ] **Step 4: 实现 rangeId 命中与组合执行顺序**

按有效人数命中唯一 rangeId，读取当前门店 M/N/X/P，计算总量、对象父额度和内部保护。加购与提交都检查上限，只有提交当前轮检查 M 下限；人数变化只影响后续校验，不改写历史已用量。

- [ ] **Step 5: 运行 12 场景与原子规则回归**

Run: `node scripts/verify-buffet-combo-template-runtime.mjs && node scripts/verify-buffet-v4-runtime.mjs && node scripts/verify-buffet-rule-runtime.mjs`

Expected: PASS。

- [ ] **Step 6: 提交运行时实现**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-combo-template-runtime.mjs scripts/verify-buffet-v4-runtime.mjs
git commit -m "feat: enforce buffet combination limits"
```

### Task 5: 编译多区块冲突并返回完整诊断

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js:180-380`
- Create: `scripts/verify-buffet-combo-template-conflicts.mjs`
- Modify: `scripts/verify-buffet-v4-conflicts.mjs`

**Interfaces:**
- Produces: `compileRuleConstraints(rule): CompiledConstraint[]`。
- Produces: `findConflicts(candidate, records, excludeIds): Conflict[]`，并由现有 `findConflict` 兼容返回首个摘要。
- Consumes: Task 4 的 `limitMultiplierMode`。

- [ ] **Step 1: 写约束层冲突矩阵失败测试**

断言固定 X 与人均 X 父约束因倍率不同而兼容；菜品集 piece 与 kind 父约束兼容；对象无交集不冲突；C02/C03 成员重叠时 P 都编译为 `same_dish|table_fixed` 并冲突。

- [ ] **Step 2: 写完整规则端到端失败测试**

断言任意两条生效域和人数区间重叠的 C01～C06 至少报告 `total`；组合总量与原子总量即使商品不相交也冲突；C02/C03 成员重叠时同时报告 `total` 与 `same_dish`，不得命中第一个后提前返回。

- [ ] **Step 3: 运行测试确认失败**

Run: `node scripts/verify-buffet-combo-template-conflicts.mjs`

Expected: FAIL，现有冲突接口没有按 rangeId/倍率拆区块或只返回一个冲突。

- [ ] **Step 4: 实现规范约束编译和全量收集**

编译 `total`、`dish`、`dish_set_piece`、`dish_set_kind`、`same_dish`；公共维度包含门店、人数区间交集、生效时间/会员域和周期。单品身份使用 `productLineId+dishId`；总量不读取商品范围。草稿调用返回诊断但不阻止保存，启用/发布把非空冲突数组转为阻断错误。

- [ ] **Step 5: 运行冲突专项与旧规则回归**

Run: `node scripts/verify-buffet-combo-template-conflicts.mjs && node scripts/verify-buffet-v4-conflicts.mjs && node scripts/verify-buffet-rule-conflicts.mjs`

Expected: PASS。

- [ ] **Step 6: 提交冲突编译**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-combo-template-conflicts.mjs scripts/verify-buffet-v4-conflicts.mjs
git commit -m "feat: detect buffet combination conflicts"
```

### Task 6: 完成 4/6/8 列表、六步编辑和发布摘要

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:2300-2450,3820-4425`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-combo-template-list-ui.mjs`
- Modify: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Consumes: Tasks 1–5 的模板、投影、校验和冲突接口。
- Produces: 组合模板完整六步编辑和按门店/人数区间发布摘要。

- [ ] **Step 1: 写列表与编辑状态失败测试**

断言列表分组标题和数量为“整单限制(4) / 每轮常用组合模板(6) / 每轮原子规则(8)”；六条组合规则默认禁用并可进入编辑；名称/描述可改，核心口径偏离时按现有规则剥离系统默认身份，恢复核心口径后按 source template 恢复身份。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-buffet-combo-template-list-ui.mjs && node scripts/verify-buffet-system-default-editor.mjs`

Expected: FAIL，列表缺少组合分组，数量页仍是原子矩阵。

- [ ] **Step 3: 实现场景配置与数量分区 UI**

场景配置只展示人数区间，不展示轮次区间。数量页按人数区间卡片展示 M/N/X/P：C01/C04 隐藏 P；C02/C05 文案为“相同菜品每轮最多”；C03/C06 为“每种菜品最多”；C04～C06 的 X 标记“每人每轮”，其余标记“整桌每轮”。切换门店、人数区间或产线前写回当前输入。

- [ ] **Step 4: 实现发布摘要与错误定位**

按门店和 rangeId 展示人数区间、M/N、对象和 X、X 是否乘人数、P 固定整桌口径、授权、生效时间、会员和门店。数量错误滚动并聚焦对应门店/区间/区块；删除区间二次确认且文案明确删除该区间全部门店额度。

- [ ] **Step 5: 添加响应式样式并验证六步流程**

窄屏保持 M/N/X/P 标签和错误可见，不通过 `display:none` 隐藏业务信息。

Run: `node scripts/verify-buffet-combo-template-list-ui.mjs && node scripts/verify-buffet-system-default-editor.mjs && node scripts/verify-buffet-rule-fullscreen.mjs && node scripts/verify-buffet-rule-product-configuration.mjs`

Expected: PASS。

- [ ] **Step 6: 提交页面流程**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-combo-template-list-ui.mjs scripts/verify-buffet-system-default-editor.mjs
git commit -m "feat: add buffet combination template flow"
```

### Task 7: 完整回归、构建和浏览器验收

**Files:**
- Verify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Verify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Verify: `dist/Configuration center/assets/order-limit-flow.js`
- Verify: `dist/Configuration center/assets/order-limit-flow.css`
- Verify: `scripts/verify-buffet-*.mjs`
- Verify: `docs/superpowers/specs/2026-09-02-buffet-kpos-combination-default-templates-design.md`

**Interfaces:**
- Consumes: Tasks 1–6 的全部产物。
- Produces: 可构建、可在浏览器逐模板核对的最终分支。

- [ ] **Step 1: 运行全部自助餐专项脚本**

```powershell
Get-ChildItem scripts -Filter 'verify-buffet-*.mjs' | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" }
}
```

Expected: 每个脚本输出 `OK` 或 `PASS`，进程退出 0。

- [ ] **Step 2: 运行菜单下单限制隔离回归**

Run: `node scripts/verify-buffet-rule-menu-regression.mjs && node scripts/verify-order-limit-rule-columns.mjs && node scripts/verify-order-limit-quantity-table-simplification.mjs`

Expected: PASS；菜单下单限制不读取组合模板元数据或 rangeId 键。

- [ ] **Step 3: 运行生产构建**

Run: `npm.cmd run build`

Expected: exit 0，无 esbuild 重复声明、语法或资源错误。

- [ ] **Step 4: 启动 worktree 服务并浏览器核对**

Run: `npm run dev -- --host 127.0.0.1 --port 65166`

打开：

```text
http://127.0.0.1:65166/Configuration%20center/buffet-rule.html?embedded=1
```

逐项核对：列表为 4/6/8；六条组合默认禁用；每条默认两个区间；六步均可编辑；门店商品独立；M/N/X/P 映射和文案正确；空额度可存草稿但启用/发布阻断；0 可保存并表达禁止；发布摘要正确；冲突同时展示全部命中区块。

- [ ] **Step 5: 浏览器执行关键运行场景**

至少配置并核对 C02 与 C05：2 人时 C02 的 X/P 固定，C05 的 X 为 `2X` 且 P 固定；切换 4 人后 C05 为 `4X`；跨产线成员合并统计；新轮次清零；当前轮累计包含历史已下单量。

- [ ] **Step 6: 检查工作树并提交验收修复**

Run: `git diff --check && git status --short`

若浏览器验收产生修复，只提交本计划涉及文件：

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js" "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-*.mjs
git commit -m "test: verify buffet combination templates"
```

- [ ] **Step 7: 记录最终验收结果**

交付消息列出：最终 commit、专项脚本数量和结果、构建结果、浏览器 URL、18 条目录数量、12 个场景映射、未修改 `vendor/emenu-new` 的事实，以及任何已知但不属于本期的限制。
