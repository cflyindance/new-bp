# 指定菜品每人每轮/每轮独立配置实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 让每条指定菜品限制独立选择“每轮”或“每人每轮”，同时保证缺少新字段的存量全局配置和设备配置继续保持原行为。

**架构：** 在现有 `specificDishLimit` 对象中增加 `perType`，后台复用现有选择器和兼容初始化模式，前台读取时使用“内层字段优先、外层字段回退”。不修改服务端接口、枚举、翻译和组件结构，不抽取 helper。

**技术栈：** React 17、Ant Design 4、Material UI 4、Redux Toolkit、Vite 2、Yarn 3。

## 全局约束

- `perType === 0` 表示每轮，数量不乘有效就餐人数。
- `perType === 1` 表示每人每轮，数量乘有效就餐人数。
- “每种菜品最多 N 份”跟随指定规则的 `perType`。
- “每轮相同菜品最多 N 份”始终不乘人数。
- 老数据缺少 `specificDishLimit[].perType` 时必须回退到外层规则的 `perType`。
- 新增指定规则默认使用当前外层规则的 `perType`。
- 不新增依赖、翻译键、枚举、helper 或无关重构。
- 不修改或覆盖现有 `.env.development` 和 `src/pages/Index.jsx` 用户改动。
- 不执行 `git commit`、`git push`、创建 PR、发布或部署。

---

## 文件结构

- 修改：`src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx`
  - 为每条指定规则展示并保存独立的 `perType`。
  - 对存量规则补充页面状态默认值。
- 修改：`src/hooks/useCheckDishBeforeOrder.js`
  - 使用指定规则自身的 `perType` 计算限制。
  - 对存量规则回退到外层 `perType`。
- 保留：`docs/superpowers/specs/2026-07-28-specific-dish-per-type-design.md`
  - 已确认的需求和兼容设计。

不创建运行时代码文件，不修改常量、翻译或服务层。

---

### Task 1：后台指定规则增加独立选择器

**文件：**

- 修改：`src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx:133`
- 修改：`src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx:446`
- 修改：`src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx:846`

**接口：**

- 输入：外层区间规则 `item.perType`，值为 `perTypes.perRound` 或 `perTypes.perPerson_perRound`。
- 输出：每条 `specificDishLimit` 保存自身 `perType`。
- 兼容：内层字段缺失时，后台页面状态使用外层值初始化。

- [ ] **Step 1：记录改造前的失败行为**

在 Chrome 后台 `http://localhost:8000/#/setting/global` 定位首个就餐人数区间：

1. 将总数规则从“每轮”切换为“每人每轮”，不要保存。
2. 确认下面所有“每轮指定”文案同步变成“每人每轮指定”。
3. 确认指定规则前没有独立选择器。
4. 将总数规则恢复原值，不保存。

预期：需求尚未实现，指定规则只能跟随外层规则。

- [ ] **Step 2：让新增指定规则带上外层默认值**

在 `addSpecificDishLimit` 中，将新对象从 `{}` 改为包含外层默认值：

```js
specificDishLimit: [
  ...(item.specificDishLimit || []),
  {
    perType: item.perType ?? perTypes.perRound,
  },
],
```

保留当前数组更新方式和 `handleConfigChange` 调用，不调整函数结构。

- [ ] **Step 3：将渲染参数从标签改为外层枚举值**

外层规则映射中使用归一化值：

```js
const currentPerType = item.perType ?? perTypeOptions[0].value
```

外层旧数据初始化继续调用现有逻辑：

```js
if (typeof item.perType === 'undefined') {
  onDishQuantityPerRoundChange(index, 'perType')(perTypeOptions[0].value)
}
```

调用指定规则渲染函数时传入 `currentPerType`：

```js
{
  renderSpecificDishQuantityPerRoundOptions(
    item.specificDishLimit,
    index,
    currentPerType
  )
}
```

删除只用于静态文案的 `perTypeLabel` 计算。

- [ ] **Step 4：兼容初始化存量指定规则**

在 `renderSpecificDishQuantityPerRoundOptions` 的规则映射中，为缺失字段的数据沿用现有兼容写法：

```js
const currentPerType = item.perType ?? perType

if (typeof item.perType === 'undefined') {
  onSpecificDishLimitChange(dishQuantityLimitIndex, index, 'perType')(perType)
}
```

这里的 `perType` 是当前区间外层归一化后的值，因此：

- 老外层每轮规则补成内层每轮。
- 老外层每人每轮规则补成内层每人每轮。
- 页面初始化后，外层和内层成为两个独立字段。

- [ ] **Step 5：将静态前缀替换为选择器**

复用 `dishQuantityPerRoundSpecificDishLimit` 的第一个插槽，把原来的字符串替换为：

```jsx
<Select
  dropdownMatchSelectWidth={false}
  options={perTypeOptions}
  value={currentPerType}
  onChange={onSpecificDishLimitChange(dishQuantityLimitIndex, index, 'perType')}
  key="perType"
/>
```

其余“菜品/菜品集”、菜品选择、数量和单位控件保持原样。

- [ ] **Step 6：格式和静态检查后台文件**

运行：

```powershell
yarn prettier --check src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx
yarn eslint src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx --max-warnings=0
```

预期：两个命令退出码均为 `0`，没有格式或 ESLint 错误。

- [ ] **Step 7：浏览器验证后台独立状态**

在两个就餐人数区间分别验证：

1. 每条指定规则前出现独立的“每轮/每人每轮”选择器。
2. 新增规则默认等于该区间总数规则。
3. 切换某条指定规则不影响同区间其他指定规则。
4. 切换总数规则不影响已初始化的指定规则。
5. 删除、增加规则后选择器和值没有错位。
6. 保存并刷新后，各条选择器保持各自值。

预期：后台配置数据中每条有效指定规则都有独立 `perType`。

---

### Task 2：前台使用指定规则自身的作用范围

**文件：**

- 修改：`src/hooks/useCheckDishBeforeOrder.js:523`
- 修改：`src/hooks/useCheckDishBeforeOrder.js:532`
- 修改：`src/hooks/useCheckDishBeforeOrder.js:551`
- 修改：`src/hooks/useCheckDishBeforeOrder.js:582`
- 修改：`src/hooks/useCheckDishBeforeOrder.js:621`

**接口：**

- 输入：命中的 `isDishInConfig` 和外层 `matchedRule`。
- 输出：布尔值 `isSpecificDishPerPersonPerRound`，控制指定规则是否乘有效就餐人数。
- 兼容表达式：

```js
;(isDishInConfig.perType ?? matchedRule?.perType) ===
  perTypes.perPerson_perRound
```

- [ ] **Step 1：在命中指定规则后计算兼容作用范围**

紧跟 `if (isDishInConfig) {` 增加局部变量：

```js
const isSpecificDishPerPersonPerRound =
  (isDishInConfig.perType ?? matchedRule?.perType) ===
  perTypes.perPerson_perRound
```

保留外层 `isPerPersonPerRound`，它仍只服务总数限制。

- [ ] **Step 2：菜品集按种的总种数使用内层作用范围**

将 `dishTypeMaxCartNum` 的乘数条件改为：

```js
const dishTypeMaxCartNum =
  (isDishInConfig.quantity || 0) *
  (isSpecificDishPerPersonPerRound ? partySize : 1)
```

类型统计继续按不同菜品 `id` 计数，不修改 `typeCount` 的归并逻辑。

- [ ] **Step 3：“每种菜品”上限使用内层作用范围**

将 `maxDishCount` 的乘数条件改为：

```js
const maxDishCount =
  (maxDishCountConfig || 0) * (isSpecificDishPerPersonPerRound ? partySize : 1)
```

这样内层选择“每人每轮”时，每种菜品上限乘人数；选择“每轮”时不乘。

- [ ] **Step 4：菜品集按份的总份数使用内层作用范围**

将 `dishMaxCartNum` 改为：

```js
const dishMaxCartNum =
  (isDishInConfig.quantity || 0) *
  (isSpecificDishPerPersonPerRound ? partySize : 1)
```

不要修改下面的 `specificPieceSameDishLimit`：

```js
const maxDishCount = isDishInConfig.specificPieceSameDishLimit?.find((item) =>
  item.dishes?.includes(id)
)?.quantity
```

该子限制必须继续固定按每轮。

- [ ] **Step 5：单个指定菜品使用内层作用范围**

将单菜品分支的 `dishMaxCartNum` 改为：

```js
const dishMaxCartNum =
  (isDishInConfig.quantity || 0) *
  (isSpecificDishPerPersonPerRound ? partySize : 1)
```

返回结构、权限提示标记和 `maxCartNum` 保持原样。

- [ ] **Step 6：格式和静态检查前台文件**

运行：

```powershell
yarn prettier --check src/hooks/useCheckDishBeforeOrder.js
yarn eslint src/hooks/useCheckDishBeforeOrder.js --max-warnings=0
```

预期：两个命令退出码均为 `0`，没有格式或 ESLint 错误。

---

### Task 3：兼容性和四种独立组合验证

**文件：**

- 验证：`src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx`
- 验证：`src/hooks/useCheckDishBeforeOrder.js`

**接口：**

- 后台保存的 `specificDishLimit[].perType` 必须被前台直接消费。
- 缺少内层字段的旧数据必须通过外层 `matchedRule.perType` 回退。

- [ ] **Step 1：验证旧数据回退表达式**

检查最终差异中仅存在以下兼容方向：

```js
isDishInConfig.perType ?? matchedRule?.perType
```

不得使用：

```js
isDishInConfig.perType || matchedRule?.perType
```

原因：`perTypes.perRound` 的值是 `0`，使用 `||` 会错误回退到外层值。

- [ ] **Step 2：验证单菜品四种组合**

使用有效就餐人数 `2`、指定菜品数量 `1`，把总数上限设置得足够大，分别保存并验证：

| 总数规则 | 指定规则 | 指定菜品允许数量 | 首次被限制的操作 |
| -------- | -------- | ---------------: | ---------------- |
| 每轮     | 每轮     |                1 | 添加第 2 份      |
| 每轮     | 每人每轮 |                2 | 添加第 3 份      |
| 每人每轮 | 每轮     |                1 | 添加第 2 份      |
| 每人每轮 | 每人每轮 |                2 | 添加第 3 份      |

每种组合都检查菜品卡加购和购物车加号；至少一种组合检查菜品详情页。

- [ ] **Step 3：验证旧配置行为不变**

分别准备没有 `specificDishLimit[].perType` 的旧结构：

```js
{
  perType: perTypes.perRound,
  specificDishLimit: [
    {
      specificDishType: specificDishTypes.specificDish,
      dishes: [12998],
      quantity: 1,
      unit: specificDishUnits.pieces,
    },
  ],
}
```

预期：有效人数为 `2` 时，第 `2` 份被限制。

再将外层改为：

```js
perType: perTypes.perPerson_perRound
```

预期：有效人数为 `2` 时允许 `2` 份，第 `3` 份被限制。

- [ ] **Step 4：验证菜品集按份**

设置菜品集总份数 `1`：

- 指定规则每轮：集合内累计第 `2` 份被限制。
- 指定规则每人每轮、有效人数 `2`：累计第 `3` 份被限制。

再设置“每轮相同菜品最多 `1` 份”：

- 即使指定规则为每人每轮，同一菜品第 `2` 份仍被限制。
- 集合内另一菜品仍可添加，直到达到集合总份数上限。

- [ ] **Step 5：验证菜品集按种**

设置菜品集总种数 `1`：

- 指定规则每轮：第 `2` 个不同菜品被限制。
- 指定规则每人每轮、有效人数 `2`：允许 `2` 个不同菜品，第 `3` 个不同菜品被限制。

设置某菜品“每种菜品最多 `1` 份”：

- 指定规则每轮：该菜品第 `2` 份被限制。
- 指定规则每人每轮、有效人数 `2`：允许 `2` 份，第 `3` 份被限制。

- [ ] **Step 6：验证人数区间和有效人数**

至少覆盖首尾两个区间：

- 有效人数命中“及以下”规则时，使用该区间的内层 `perType`。
- 有效人数命中“及以上”规则时，使用该区间的内层 `perType`。
- 开启不计人数配置时，乘数使用扣除后的 `partySize`，与总数规则现有口径一致。

- [ ] **Step 7：回归不受影响的规则**

验证：

- 总数每轮/每人每轮最小值和最大值。
- `minCountPerRound`、`maxCountPerRound` 兜底值。
- Buffet 菜品不计入当前购物车限制。
- 配置关闭时不触发限制。
- 原有 id `7` 和 id `46` 冲突屏蔽逻辑不变。
- 提交购物车时的总数权限提示不变。

---

### Task 4：工程检查、状态恢复和交付审计

**文件：**

- 检查：`src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx`
- 检查：`src/hooks/useCheckDishBeforeOrder.js`
- 检查：`docs/superpowers/specs/2026-07-28-specific-dish-per-type-design.md`
- 检查：`docs/superpowers/plans/2026-07-28-specific-dish-per-type.md`

**接口：**

- 交付只包含两个业务文件和两份已确认文档。
- `.env.development`、`src/pages/Index.jsx` 的既有改动必须保持不变。

- [ ] **Step 1：运行项目构建**

运行：

```powershell
yarn build
```

预期：Vite 构建成功，退出码为 `0`。

- [ ] **Step 2：检查差异和空白错误**

运行：

```powershell
yarn prettier --check src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx src/hooks/useCheckDishBeforeOrder.js docs/superpowers/specs/2026-07-28-specific-dish-per-type-design.md docs/superpowers/plans/2026-07-28-specific-dish-per-type.md
git diff --check -- src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx src/hooks/useCheckDishBeforeOrder.js
git status --short
git diff -- src/components/ConfigCommon/DishQuantityPerRoundConfig.jsx src/hooks/useCheckDishBeforeOrder.js
```

预期：

- 本任务文件的 Prettier 检查通过。
- 范围内 `git diff --check` 无输出。
- 业务差异只围绕内层 `perType` 展示、初始化和乘数选择。
- `.env.development` 和 `src/pages/Index.jsx` 仍显示为用户原有修改，没有被本任务覆盖。
- 全局 `git diff --check` 仍可能报告 `.env.development:22` 的既有行尾空格，本任务不修改该文件。

- [ ] **Step 3：恢复浏览器测试状态**

验证结束后：

1. 将配置 id `57` 恢复为测试前保存的完整值。
2. 将测试中临时修改的其他配置恢复原值。
3. 清空本次测试加入购物车但未提交的菜品。
4. 不删除、清空或作废已有订单。
5. 刷新后台和前台，确认恢复结果。

- [ ] **Step 4：完成需求逐项审计**

逐项确认：

- 后台每条指定规则可以独立选择。
- 每人每轮乘人数，每轮不乘人数。
- “每种菜品”跟随指定规则。
- “每轮相同菜品”不乘人数。
- 老数据前台回退行为不变。
- 新规则默认继承外层值。
- 四种独立组合、单菜品、菜品集按份和按种均有浏览器证据。
- 构建、静态检查和差异检查通过。
- 测试配置和购物车已恢复。

完成后汇报变更文件、验证证据、未覆盖风险和当前工作区状态，不提交代码。
