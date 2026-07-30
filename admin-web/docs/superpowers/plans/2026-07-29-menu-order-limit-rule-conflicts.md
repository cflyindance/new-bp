# 菜单下单限制 · 同商品规则冲突 — 实现计划

> 依据：`docs/superpowers/specs/2026-07-29-menu-order-limit-rule-conflicts-design.md`  
> 日期：2026-07-29  
> 主文件：`dist/Configuration center/order-limit.html`  
> 辅助文件：`dist/Configuration center/assets/brand-menu-structure-picker.js`

## 1. 实施原则

- 不改规则持久化结构。
- 冲突判断集中在纯函数，保存和启用共用同一入口。
- 当前选择器数据使用完整 `产线 + 层级菜品 key`。
- 旧数据只做读时兼容，不回写迁移。
- 复制仍生成停用副本；启用时再校验。
- 本期不改选品 UI、模拟器和 597/598 规则。

## 2. 任务拆分

### 任务 1：补齐商品目标展开能力

改动位置：`order-limit.html`，放在现有 `getDraftStructureByLine` / `syncEntitiesFromStructure` 一带。

新增：

| 函数 | 职责 |
|------|------|
| `parseStoredEntityKey(value)` | 解析 `lineId|key` |
| `restoreStructureByLine(values)` | 将持久化键恢复为选择器结构 |
| `legacyRuleDishTargets(rule)` | 展开数字型旧菜品/分类，包括 `rounds[]` |
| `expandRuleDishTargets(rule)` | 按规格兼容顺序返回目标并集 |

实现要点：

1. 有 `structureByLine` 时直接交给 `MenuPicker.listSelectedDishes`。
2. 顶层有现行字符串型 `selectedDishes/selectedCategories` 时，先恢复 `{ lineId: [key] }`，再调用 `listSelectedDishes`；禁止直接拿分类键比较。
3. 顶层为空时合并 `rounds[].structureByLine` 和各轮选品，规则级取并集。
4. 数字型旧数据通过现有 `dishes`、`dishCategories` 展开为 `legacy|dish:<id>`。
5. 结果按 `targetKey` 去重，保留稳定遍历顺序和可读 `dishName`。

验证：

- 新选择器按分类选择能展开为该分类全部菜品。
- 同一菜在多轮多个区间中只返回一次。
- 初始规则 `id:2` 能从 `rounds[]` 读到旧菜品。
- 不同产线的同末级 ID 生成不同 `targetKey`。

### 任务 2：实现会员域相交与表单校验

改动位置：现有 `validateDraftStep4` 附近，并增加会员步骤校验函数。

新增：

| 函数 | 职责 |
|------|------|
| `validateDraftStep5(draft)` | 启用会员限制时至少选择一个等级 |
| `memberScopesOverlap(a, b)` | 判断两条规则会员域是否相交 |

接线：

- `wizardNext` 第 5 步离开前调用 `validateDraftStep5`。
- 第 6 步保存前再次调用，防止异常草稿绕过。
- 任一规则未启用会员限制时返回相交。
- 两边均启用时按 `memberLevels` 集合交集判断。

错误文案：`请至少选择一个会员等级`。

### 任务 3：实现营业时间窗口标准化

改动位置：现有 `normalizeBusinessHourSchedule`、`getBusinessHourActiveDays` 附近。

新增：

| 函数 | 职责 |
|------|------|
| `parseClockMinutes(value)` | `HH:mm` 转分钟，保留 `24:00 = 1440` |
| `splitScheduleWindows(schedule)` | 生成普通或跨午夜的日期/星期/分钟窗口 |
| `dateRangesShareActiveDay(a, b)` | 日期交集内是否真实存在共同有效星期 |
| `businessHourWindowsOverlap(a, b, schedules)` | 判断两条规则时间域是否相交 |

算法：

1. 任一规则未启用时间限制 → 相交。
2. 读取 `selectedBusinessHourIds`；缺失、空值或引用失效 → 保守返回相交。
3. 遍历两边营业时间组合。
4. 日期范围无交集 → 下一组。
5. 日期交集内无共同有效星期 → 下一组。
6. 时分半开区间有交集 → 相交。
7. 跨午夜拆成当日和次日片段；次日片段可超过原 `toDate`，按开始日窗口延续处理。
8. 所有组合均不相交 → 不相交。

边界用例：

- `09:00–11:00` 与 `11:00–14:00` 不相交。
- `09:00–11:01` 与 `11:00–14:00` 相交。
- `18:00–24:00` 不应误判跨午夜。
- `22:00–02:00` 正确拆分并比较次日星期。
- 星期集合相同但日期交集内没有该星期时不相交。

### 任务 4：实现结构化规则冲突判断

改动位置：放在目标展开与域相交函数之后、`wizardNext` 之前。

新增：

| 函数 | 职责 |
|------|------|
| `ruleTypeKey(rule)` | 生成三维规则类型键 |
| `findSharedDishTarget(a, b)` | 返回首个共同目标 |
| `findRuleConflict(candidate, rules, editingRuleId)` | 返回首个冲突 |
| `formatRuleConflict(conflict)` | 生成 Toast 文案 |

`findRuleConflict` 顺序：

1. 候选为停用时返回无冲突。
2. 仅遍历其他启用规则，并排除 `editingRuleId`。
3. 无共同商品则跳过。
4. `round` 不同 → 返回 `round` 冲突。
5. `round` 相同但三维键不同 → 允许叠加。
6. 三维键相同且时间域、会员域都相交 → 返回 `sameTypeScope` 冲突。
7. 按规则列表顺序返回第一条冲突。

冲突对象：

```js
{
  kind: "round" | "sameTypeScope",
  existingRuleId,
  existingRuleName,
  dishName,
  candidateRound,
  existingRound
}
```

文案：

- 轮次：`「{商品}」已在规则「{规则名}」中使用「{原轮次}」，不可再设置为「{新轮次}」`
- 同型：`「{商品}」与规则「{规则名}」的规则类型相同，且时间和会员范围均有重叠`

### 任务 5：接入新建与编辑保存

改动位置：`wizardNext()` 第 6 步分支。

重构为：

1. 再次校验会员步骤。
2. 用 `draftToRule` 构造候选规则，编辑时保留原 ID/状态。
3. 调用 `findRuleConflict(candidate, state.rules, state.editingRuleId)`。
4. 有冲突：`showToast(formatRuleConflict(conflict))` 并 `return`。
5. 无冲突：沿用现有新增/替换、`saveRules`、`closeWizard`、`renderAll`。

失败路径不得先修改 `state.rules`，确保 UI 和 localStorage 原子性。

### 任务 6：接入规则启用

改动位置：`handleRuleAction(action, id)` 的 `toggle` 分支。

行为：

- 启用 → 停用：直接保存。
- 停用 → 启用：
  1. 浅拷贝候选并把 `status` 设为 `active`。
  2. 调用 `findRuleConflict(candidate, state.rules, id)`。
  3. 冲突时 Toast，原对象状态不变，不写盘。
  4. 通过后再修改原对象状态、保存并重绘。
- `copy` 分支保持不变，副本仍为 `inactive`。

### 任务 7：参数化验收矩阵

不维护 12×12 静态表，按三维参数组合验证：

#### 轮次

- 共同商品 + 三种轮次任意两种不同 → 拦截。
- 无共同商品 → 允许。

#### 类型与方式

- 同轮次，按桌 + 按人 → 允许。
- 同轮次，按分类 + 按菜品 → 允许。
- 类型和方式同时不同但轮次相同 → 允许。

#### 同型生效域

- 时间相交 + 会员相交 → 拦截。
- 时间不交 + 会员相交 → 允许。
- 时间相交 + 会员不交 → 允许。
- 时间不交 + 会员不交 → 允许。
- 未限制时间按全时段；未限制会员按全员。

#### 状态与入口

- 停用规则不参与冲突。
- 复制停用副本成功。
- 冲突副本启用失败并保持停用。
- 编辑排除自身；改成与其他规则冲突时失败。
- 保存失败后向导不关闭，规则数组和 localStorage 不变化。

#### 兼容

- 新分类规则与分类下新菜品规则能找到共同商品。
- 旧多轮 `rounds[]` 选品参与冲突。
- 数字型旧规则之间可比较。
- 新旧无法映射的商品不误判。

### 任务 8：回归验证

执行：

1. 浏览器手工走完任务 7 的核心用例。
2. `npm run build`，确认嵌入静态页与主应用构建成功。
3. 回归新建、编辑、复制、启停、删除。
4. 回归规则向导 6 步和限购数量场景条。
5. 回归菜单下单限制页面能正常加载，控制台无新增错误。

## 3. 建议实施顺序

`商品展开` → `会员校验` → `时间域` → `冲突引擎` → `保存接入` → `启用接入` → `参数化验收` → `构建回归`

## 4. 完成定义

- 规格中的 15 条验收标准全部通过。
- 保存与启用共用同一冲突判断，不存在入口绕过。
- 分类与旧多轮规则能正确展开到商品。
- 冲突失败不修改内存和 localStorage。
- 不改变既有规则存储格式、复制行为和模拟器逻辑。
