# CRM Integration 校验结果 Redux 化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **重要约束：** 不自动执行 `git commit`，不自动提交代码。计划中的所有步骤只代表实施检查点。测试由用户自行完成；实施者只做必要的静态检查和残留引用检查。

**Goal:** 将 CRM Integration reward/voucher 校验结果从购物车 item 写回模型改为 Redux 校验结果模型，并在 `generateOrder` 中最终聚合订单级和菜品级折扣数据。

**Architecture:** `useCrmIntegrationBenefitAutoValidation` 和用户点击选择券的即时校验只负责调用 SDK 并写入 Redux；不再调用 `setCart` / `setStoragedCart`。Redux 保存 `selectedBenefit` 与 `selectedBenefitValidation`，后者包含原始校验结果、订单级折扣信息、有折扣菜品的完整折扣信息。`generateOrder` 根据 Redux 传入的折扣提交信息，在最终订单 payload 中写入订单级 `discountList` 和 item 级 `discountList`。

**Tech Stack:** React, Redux Toolkit, existing CRM Integration Market SDK, existing `generateOrder` order aggregation.

---

## 文件结构

- 修改：`src/store/slices/crmIntegrationValidation.slice.js`
  - 新增 `selectedBenefitValidation`
  - 新增设置和清理 validation 的 reducer

- 修改：`src/services/crmIntegrationBenefitValidator.js`
  - 保留现有 SDK 校验流程
  - 不再把订单级折扣信息塞回 `selectedBenefit`

- 修改：`src/utils/crmIntegrationDiscountMapping.js`
  - 改造为纯解析工具，负责从 SDK result 中提取校验结果结构
  - 删除对 cart item 的写回逻辑

- 修改：`src/hooks/useCrmIntegrationBenefitAutoValidation.js`
  - 校验成功写 Redux validation
  - 校验失败清理 selected benefit 和 validation
  - 删除 `setCart` / `setStoragedCart` / `isEqual`

- 修改：`src/pages/Order/Order.jsx`
  - 用户点击选择固定折扣 / 百分比折扣券时，校验成功后写 Redux validation
  - 删除校验成功后的 cart 写回
  - 取消选择时清理 validation

- 修改：`src/utils/crmIntegrationDiscountSubmitInfo.js`
  - 改为接收 `selectedBenefit` 和 `selectedBenefitValidation`
  - 返回订单级折扣信息和菜品级折扣信息

- 修改：`src/components/OrderBaseContent/index.jsx`
  - 从 Redux 读取 `selectedBenefitValidation`
  - 调用新的 `buildCrmIntegrationDiscountSubmitInfo`

- 修改：`src/components/ShoppingCart/PendingOrders.jsx`
  - 同上，保证购物车提交入口一致

- 修改：`src/services/orders.js`
  - 在 `generateOrder` / `resolveDishItem` 中使用 `discountOrderReward.discountedItemInfoByKey`
  - 根据 `item.key` 写 item 级 `discountList`
  - 使用 `discountOrderReward.orderDiscountInfo` 写订单级 `discountList`

---

### Task 1: 扩展 CRM Integration validation slice

**Files:**
- Modify: `src/store/slices/crmIntegrationValidation.slice.js`

- [ ] **Step 1: 扩展 state**

将初始状态调整为：

```js
const initialState = {
  selectedBenefit: null,
  selectedBenefitValidation: null,
}
```

- [ ] **Step 2: 新增 reducer**

新增：

```js
setSelectedBenefitValidation(state, action) {
  state.selectedBenefitValidation = action.payload || null
},
clearSelectedBenefitValidation(state) {
  state.selectedBenefitValidation = null
},
clearSelectedBenefitById(state, action) {
  if (state.selectedBenefit?.id === action.payload) {
    state.selectedBenefit = null
    state.selectedBenefitValidation = null
  }
},
clearSelectedBenefit(state) {
  state.selectedBenefit = null
  state.selectedBenefitValidation = null
},
```

保留 `setSelectedBenefit`，但选择新 benefit 时要清理旧 validation，避免旧折扣结果误用于新券：

```js
setSelectedBenefit(state, action) {
  state.selectedBenefit = action.payload || null
  state.selectedBenefitValidation = null
}
```

---

### Task 2: 把折扣映射工具改成纯解析工具

**Files:**
- Modify: `src/utils/crmIntegrationDiscountMapping.js`

- [ ] **Step 1: 保留 SDK orderItems 提取能力**

保留或改写为：

```js
export function getCrmIntegrationCalculatedOrder(validationResult) {
  return (
    validationResult?.calculatedOrder ||
    validationResult?.rule?.result?.[0]?.calculatedOrder ||
    null
  )
}
```

- [ ] **Step 2: 新增 validation 结构构建函数**

新增：

```js
export function buildCrmIntegrationBenefitValidation(validationResult) {
  const calculatedOrder = getCrmIntegrationCalculatedOrder(validationResult)
  const orderDiscountInfo = Array.isArray(calculatedOrder?.discounts)
    ? calculatedOrder.discounts
    : []
  const orderItems = Array.isArray(calculatedOrder?.orderItems)
    ? calculatedOrder.orderItems
    : []

  const discountedItemInfoByKey = orderItems.reduce((result, orderItem) => {
    const discounts = Array.isArray(orderItem?.discounts)
      ? orderItem.discounts
      : []
    if (!orderItem?.id || !discounts.length) return result

    result[String(orderItem.id)] = {
      orderItem,
      discounts,
    }
    return result
  }, {})

  return {
    result: validationResult,
    orderDiscountInfo,
    discountedItemInfoByKey,
  }
}
```

- [ ] **Step 3: 删除 cart 写回函数**

删除：

- `applyCrmIntegrationDiscountToCartItems`
- `clearCrmIntegrationDiscountFromCartItem`
- `clearCrmIntegrationDiscountFromCartItems`

如果其他文件仍引用这些函数，后续任务必须同步移除。

---

### Task 3: 修改自动校验 hook，不再写 cart

**Files:**
- Modify: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`

- [ ] **Step 1: 删除 cart 写回依赖**

删除 imports：

```js
import { isEqual } from 'lodash-es'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  applyCrmIntegrationDiscountToCartItems,
  clearCrmIntegrationDiscountFromCartItems,
} from '@/utils/crmIntegrationDiscountMapping'
```

新增：

```js
import { buildCrmIntegrationBenefitValidation } from '@/utils/crmIntegrationDiscountMapping'
```

- [ ] **Step 2: 删除 setter**

删除：

```js
const [cart, setCart] = useGlobalState('Cart')
const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
```

保留读取 cart：

```js
const [cart] = useGlobalState('Cart')
```

- [ ] **Step 3: 校验成功只写 Redux**

替换校验成功分支为：

```js
const validatedBenefit = mergeCrmIntegrationValidationResultToBenefit(
  selectedBenefit,
  result
)

dispatch(
  crmIntegrationValidationActions.setValidatedSelectedBenefit(
    validatedBenefit
  )
)
dispatch(
  crmIntegrationValidationActions.setSelectedBenefitValidation(
    buildCrmIntegrationBenefitValidation(result)
  )
)
```

- [ ] **Step 4: 校验失败只清 Redux**

失败分支只保留：

```js
dispatch(
  crmIntegrationValidationActions.clearSelectedBenefitById(selectedBenefit.id)
)
```

不要再清 cart item 字段。

---

### Task 4: 修改用户点击选择券流程，不再写 cart

**Files:**
- Modify: `src/pages/Order/Order.jsx`

- [ ] **Step 1: 删除 cart 写回工具 import**

删除：

```js
import {
  applyCrmIntegrationDiscountToCartItems,
  clearCrmIntegrationDiscountFromCartItems,
} from '@/utils/crmIntegrationDiscountMapping'
```

新增：

```js
import { buildCrmIntegrationBenefitValidation } from '@/utils/crmIntegrationDiscountMapping'
```

- [ ] **Step 2: 选择券校验成功写 Redux**

将原来的：

```js
const nextCart = applyCrmIntegrationDiscountToCartItems(...)
setCart(nextCart)
setStoragedCart(nextCart)
dispatch(setValidatedSelectedBenefit(validatedBenefit))
```

改为：

```js
dispatch(
  crmIntegrationValidationActions.setValidatedSelectedBenefit(
    validatedBenefit
  )
)
dispatch(
  crmIntegrationValidationActions.setSelectedBenefitValidation(
    buildCrmIntegrationBenefitValidation(validationResult)
  )
)
```

- [ ] **Step 3: 取消券时只清 Redux**

将 CLEAR 分支中的 cart 清理删除，只保留：

```js
dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
return selectionAction
```

---

### Task 5: 改造下单折扣提交信息构建

**Files:**
- Modify: `src/utils/crmIntegrationDiscountSubmitInfo.js`
- Modify: `src/components/OrderBaseContent/index.jsx`
- Modify: `src/components/ShoppingCart/PendingOrders.jsx`

- [ ] **Step 1: 修改构建函数签名**

改为：

```js
export function buildCrmIntegrationDiscountSubmitInfo(
  selectedBenefit,
  selectedBenefitValidation
) {
  if (!selectedBenefit?.id || !selectedBenefit?.actualDiscount) return null
  if (!selectedBenefitValidation?.orderDiscountInfo?.length) return null

  return {
    crmIntegrationBenefit: true,
    selectedBenefitId: selectedBenefit.id,
    orderDiscountInfo: selectedBenefitValidation.orderDiscountInfo,
    discountedItemInfoByKey:
      selectedBenefitValidation.discountedItemInfoByKey || {},
    result: selectedBenefitValidation.result || null,
  }
}
```

这里不再返回 `crmIntegrationBenefitId` 和 `crmIntegrationOrderDiscountInfo`。

- [ ] **Step 2: 修改 `OrderBaseContent` 调用**

读取：

```js
const selectedCrmIntegrationBenefitValidation = useSelector(
  (state) => state.crmIntegrationValidationSlice.selectedBenefitValidation
)
```

调用：

```js
const crmIntegrationDiscountSubmitInfo = useMemo(
  () =>
    buildCrmIntegrationDiscountSubmitInfo(
      selectedCrmIntegrationBenefit,
      selectedCrmIntegrationBenefitValidation
    ),
  [selectedCrmIntegrationBenefit, selectedCrmIntegrationBenefitValidation]
)
```

- [ ] **Step 3: 修改 `PendingOrders` 调用**

同 `OrderBaseContent`。

---

### Task 6: 在 generateOrder 中最终聚合 CRM Integration 折扣

**Files:**
- Modify: `src/services/orders.js`

- [ ] **Step 1: item 级折扣写入 `resolveDishItem`**

在 `resolveDishItem(item)` 中，替换：

```js
if (item.crmIntegrationDiscountItem) {
  cartItem.discountList = JSON.stringify(
    item.crmIntegrationItemDiscountInfo || []
  )
}
```

为：

```js
const crmIntegrationItemDiscountInfo =
  discountOrderReward?.discountedItemInfoByKey?.[String(item.key)]

if (crmIntegrationItemDiscountInfo?.discounts?.length) {
  cartItem.discountList = JSON.stringify(
    crmIntegrationItemDiscountInfo.discounts
  )
}
```

- [ ] **Step 2: 订单级折扣写入 `newOrder`**

替换：

```js
newOrder.discountList = JSON.stringify(
  discountOrderReward.crmIntegrationOrderDiscountInfo || []
)
```

为：

```js
newOrder.discountList = JSON.stringify(
  discountOrderReward.orderDiscountInfo || []
)
```

---

### Task 7: 清理旧 cart 字段引用

**Files:**
- Search all `src`

- [ ] **Step 1: 删除旧字段引用**

用 `rg` 检查：

```powershell
rg -n "crmIntegrationOrderDiscountInfo|crmIntegrationSdkOrderItem|crmIntegrationDiscountItem|crmIntegrationBenefitId|crmIntegrationItemDiscountInfo" src
```

预期：

- `crmIntegrationOrderDiscountInfo` 不再出现在 item 写回链路
- `crmIntegrationSdkOrderItem` 无残留
- `crmIntegrationDiscountItem` 无残留
- `crmIntegrationBenefitId` 不再作为 cart item 字段
- `crmIntegrationItemDiscountInfo` 不再作为 cart item 字段

如果 `crmIntegrationBenefitId` 仍出现在 `buildCrmIntegrationDiscountSubmitInfo` 旧返回中，也要删除。

- [ ] **Step 2: 检查旧函数残留**

```powershell
rg -n "applyCrmIntegrationDiscountToCartItems|clearCrmIntegrationDiscountFromCartItems|clearCrmIntegrationDiscountFromCartItem" src
```

预期无结果。

---

### Task 8: 非测试验证

**Files:**
- No source edit expected

- [ ] **Step 1: 运行目标 ESLint**

```powershell
npx eslint --max-warnings=0 src/store/slices/crmIntegrationValidation.slice.js src/utils/crmIntegrationDiscountMapping.js src/hooks/useCrmIntegrationBenefitAutoValidation.js src/pages/Order/Order.jsx src/utils/crmIntegrationDiscountSubmitInfo.js src/components/OrderBaseContent/index.jsx src/components/ShoppingCart/PendingOrders.jsx src/services/orders.js
```

预期：无 ESLint error。Browserslist 过期提示可以忽略。

- [ ] **Step 2: 汇报工作区状态**

```powershell
git status --short
```

只汇报，不提交。

---

## 明确不做

- 不修改旧 CRM / Avocado 兑换逻辑。
- 不新增自动化测试；用户自行做业务测试。
- 不在 `useEffect` 中写 `Cart` 或 `emenu_cart`。
- 不在 cart item 上保留 CRM Integration 折扣字段。
- 不自动 `git commit` / `git push`。
