# CRM Integration 订单级折扣 Redux 化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 new CRM integration 的订单级折扣信息从 benefit item 属性中拆出，统一存入 Redux，并由 `generateOrder` 在下单聚合时统一读取。

**Architecture:** 商品级命中信息仍写回 cart item，用来标识真正享受 SDK 折扣的菜；订单级 `crmIntegrationOrderDiscountInfo` 单独保存在 `crmIntegrationValidationSlice`。`generateOrder` 内部只对 new CRM integration 从 Redux 读取订单级折扣信息，旧 CRM / Avocado 的 `discountOrderReward` 入参链路保持不变。

**Tech Stack:** React 17、Redux Toolkit、react-hooks-global-state、MarketSDK coupon plugin、现有 `generateOrder` / `crmIntegrationBenefitValidator` / `crmIntegrationOrderFormatter`。

**Git 限制:** 不允许自动执行 `git commit`、`git push`、创建 PR 或部署。计划中的检查点只代表可检查边界，不代表允许自动提交。

---

## 文件结构

- Modify: `src/store/slices/crmIntegrationValidation.slice.js`
  - 新增 `orderDiscountInfo`，与 `selectedBenefit` 同级。
  - `selectedBenefit` 不再承载 `crmIntegrationOrderDiscountInfo` 或订单级 `actualDiscount`。
  - 清除 selected benefit 时同步清空 `orderDiscountInfo`。

- Modify: `src/services/crmIntegrationBenefitValidator.js`
  - 校验结果仍返回 `orderDiscountInfo`。
  - `mergeCrmIntegrationValidationResultToBenefit` 不再把 `crmIntegrationOrderDiscountInfo` 和订单级 `actualDiscount` 写进 benefit。

- Modify: `src/utils/crmIntegrationOrderFormatter.js`
  - `buildCrmIntegrationSdkDiscountList` 改为从 `orderDiscountInfo` 推导 SDK 需要的折扣金额。
  - `formatCrmIntegrationOrderStructure` 接收 `orderDiscountInfo`。

- Modify: `src/services/crmIntegrationMarketSDK.js`
  - `getCouponPlugin` 透传 `orderDiscountInfo` 给 order formatter。

- Modify: `src/utils/crmIntegrationDiscountSubmitInfo.js`
  - 新增 Redux selector：从 `crmIntegrationValidationSlice.selectedBenefit + orderDiscountInfo` 生成 new CRM integration 的提交折扣信息。

- Modify: `src/services/orders.js`
  - `generateOrder` 内部从 Redux selector 读取 new CRM integration 订单级折扣信息。
  - 旧 CRM / Avocado 的 `discountOrderReward` 分支保留，不做业务修改。

- Modify: `src/pages/Order/Order.jsx`
  - 用户选择固定折扣/百分比折扣券后，将订单级 `orderDiscountInfo` 写 Redux。
  - 商品级折扣标签仍写 cart item。

- Modify: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`
  - 自动校验时读取 Redux 中的 `orderDiscountInfo`，重新传给 SDK。
  - valid 时更新 Redux `orderDiscountInfo` 并刷新 cart item 商品级标签。
  - invalid 时清空 selected benefit、`orderDiscountInfo`，并清理 cart item 标签。

- Modify: `src/components/OrderBaseContent/index.jsx`
  - 删除 new CRM integration 的 `crmIntegrationDiscountSubmitInfo` 组装和传参。

- Modify: `src/components/ShoppingCart/PendingOrders.jsx`
  - 删除 new CRM integration 的 `crmIntegrationDiscountSubmitInfo` 组装和传参。

---

## Task 1: Redux 状态拆分

**Files:**
- Modify: `src/store/slices/crmIntegrationValidation.slice.js`

- [ ] **Step 1: 扩展 initialState**

将 state 改为：

```js
const initialState = {
  selectedBenefit: null,
  orderDiscountInfo: [],
}
```

- [ ] **Step 2: 修改 reducer 语义**

将 reducers 调整为以下行为：

```js
setSelectedBenefit(state, action) {
  state.selectedBenefit = action.payload || null
  state.orderDiscountInfo = []
},
setValidatedSelectedBenefit(state, action) {
  state.selectedBenefit = action.payload?.selectedBenefit || null
  state.orderDiscountInfo = Array.isArray(action.payload?.orderDiscountInfo)
    ? action.payload.orderDiscountInfo
    : []
},
clearSelectedBenefit(state) {
  state.selectedBenefit = null
  state.orderDiscountInfo = []
},
clearSelectedBenefitById(state, action) {
  if (state.selectedBenefit?.id === action.payload) {
    state.selectedBenefit = null
    state.orderDiscountInfo = []
  }
},
```

- [ ] **Step 3: 检查点**

Run:

```powershell
yarn eslint src\store\slices\crmIntegrationValidation.slice.js
```

Expected: no ESLint error。Browserslist 过期提示可以忽略。

---

## Task 2: 校验结果不再污染 benefit item

**Files:**
- Modify: `src/services/crmIntegrationBenefitValidator.js`

- [ ] **Step 1: 保留校验返回的 `orderDiscountInfo`**

`validateCrmIntegrationSelectedBenefit` 的返回结构继续保留：

```js
return {
  isSupported,
  isValid: !!rule?.isValid,
  rule,
  formattedOrder: response?.formattedOrder,
  calculatedOrder,
  orderDiscountInfo: getOrderDiscountInfoFromRule(rule),
  invalidReason: rule?.invalidReason || [],
  actualDiscount: getActualDiscountFromRule(rule),
}
```

- [ ] **Step 2: 修改 benefit merge 函数**

`mergeCrmIntegrationValidationResultToBenefit` 不再写入订单级折扣字段：

```js
export function mergeCrmIntegrationValidationResultToBenefit(
  selectedBenefit,
  validationResult
) {
  return {
    ...selectedBenefit,
    isValid: validationResult.isValid,
    crmIntegrationRule: validationResult.rule,
    crmIntegrationFormattedOrder: validationResult.formattedOrder,
    crmIntegrationCalculatedOrder: validationResult.calculatedOrder,
  }
}
```

- [ ] **Step 3: 检查点**

Run:

```powershell
yarn eslint src\services\crmIntegrationBenefitValidator.js
```

Expected: no ESLint error。

---

## Task 3: SDK formatter 使用 Redux 中的订单级折扣信息

**Files:**
- Modify: `src/utils/crmIntegrationOrderFormatter.js`
- Modify: `src/services/crmIntegrationMarketSDK.js`
- Modify: `src/services/crmIntegrationBenefitValidator.js`

- [ ] **Step 1: 改造 `buildCrmIntegrationSdkDiscountList`**

将函数签名改为：

```js
export function getCrmIntegrationOrderDiscountAmount(orderDiscountInfo = []) {
  if (!Array.isArray(orderDiscountInfo) || !orderDiscountInfo.length) return 0
  return Number(orderDiscountInfo[0]?.amount || 0)
}

export function buildCrmIntegrationSdkDiscountList(
  selectedBenefit,
  orderDiscountInfo = []
) {
  const amount = getCrmIntegrationOrderDiscountAmount(orderDiscountInfo)
  if (!selectedBenefit?.id || !amount) return []

  return [
    {
      name: selectedBenefit.name,
      id:
        selectedBenefit.rawReward?.ruleId ||
        selectedBenefit.rawVoucher?.rewardRule?.ruleId,
      amount,
      type: selectedBenefit.crmIntegrationRewardSource,
      extraInfo: {
        enableBenefit: true,
      },
    },
  ]
}
```

- [ ] **Step 2: `formatCrmIntegrationOrderStructure` 接收 `orderDiscountInfo`**

函数参数增加：

```js
export function formatCrmIntegrationOrderStructure({
  allItems = [],
  selectedBenefit = null,
  orderDiscountInfo = [],
  memberInfo = null,
  orderType,
  paymentType,
  merchantId = getStorageValue('emenu_company')?.merchantId,
  orderContext = {},
} = {}) {
  const discounts = buildCrmIntegrationSdkDiscountList(
    selectedBenefit,
    orderDiscountInfo
  )
}
```

- [ ] **Step 3: `crmIntegrationMarketSDK.getCouponPlugin` 透传参数**

在 `getCouponPlugin` 入参和 formatter 调用里加入 `orderDiscountInfo`：

```js
async getCouponPlugin({
  coupons,
  metas,
  extraItems,
  allItems,
  selectedBenefit,
  orderDiscountInfo,
  memberInfo,
  orderContext,
} = {}) {
  const formattedOrder = await formatOrderStructure({
    extraItems,
    allItems,
    selectedBenefit,
    orderDiscountInfo,
    memberInfo,
    orderContext,
  })
}
```

- [ ] **Step 4: validator 透传 `orderDiscountInfo`**

`validateCrmIntegrationSelectedBenefit` 增加入参并传给 SDK：

```js
export async function validateCrmIntegrationSelectedBenefit({
  selectedBenefit,
  metaData,
  allItems,
  memberInfo,
  orderDiscountInfo = [],
  includeSelectedDiscount = false,
}) {
  const couponPlugin = await crmIntegrationMarketSDK.getCouponPlugin({
    coupons: [coupon],
    metas: metaData,
    allItems,
    selectedBenefit: includeSelectedDiscount ? selectedBenefit : null,
    orderDiscountInfo: includeSelectedDiscount ? orderDiscountInfo : [],
    memberInfo,
  })
}
```

- [ ] **Step 5: 检查点**

Run:

```powershell
yarn eslint src\utils\crmIntegrationOrderFormatter.js src\services\crmIntegrationMarketSDK.js src\services\crmIntegrationBenefitValidator.js
```

Expected: no ESLint error。

---

## Task 4: 选择券和自动校验写入 Redux orderDiscountInfo

**Files:**
- Modify: `src/pages/Order/Order.jsx`
- Modify: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`

- [ ] **Step 1: 用户主动选择券时写入新 payload**

在 `Order.jsx` 中，SDK valid 后 dispatch 改为：

```js
dispatch(
  crmIntegrationValidationActions.setValidatedSelectedBenefit({
    selectedBenefit: validatedBenefit,
    orderDiscountInfo: validationResult.orderDiscountInfo,
  })
)
```

`setSelectedBenefit(benefit)` 只用于不需要 SDK 校验的 benefit，保持清空 `orderDiscountInfo` 的语义。

- [ ] **Step 2: auto validation 读取 `orderDiscountInfo`**

在 `useCrmIntegrationBenefitAutoValidation` 中增加 selector：

```js
const orderDiscountInfo = useSelector(
  (state) => state.crmIntegrationValidationSlice.orderDiscountInfo
)
```

调用 SDK 时加入：

```js
const result = await validateCrmIntegrationSelectedBenefit({
  selectedBenefit,
  metaData,
  allItems: currentOrderItemsForSdk,
  memberInfo,
  orderDiscountInfo,
  includeSelectedDiscount: true,
})
```

- [ ] **Step 3: auto validation valid 时更新 Redux**

将原来的 `selectedBenefit.actualDiscount !== result.actualDiscount` 判断替换为 `orderDiscountInfo` 比较：

```js
if (!isEqual(orderDiscountInfo, result.orderDiscountInfo)) {
  dispatch(
    crmIntegrationValidationActions.setValidatedSelectedBenefit({
      selectedBenefit: validatedBenefit,
      orderDiscountInfo: result.orderDiscountInfo,
    })
  )
}
```

- [ ] **Step 4: 删除 debug log**

删除：

```js
console.log('result', result)
```

- [ ] **Step 5: 检查点**

Run:

```powershell
yarn eslint src\pages\Order\Order.jsx src\hooks\useCrmIntegrationBenefitAutoValidation.js
```

Expected: no ESLint error。

---

## Task 5: `generateOrder` 统一从 Redux 读取 new CRM integration 订单级折扣

**Files:**
- Modify: `src/utils/crmIntegrationDiscountSubmitInfo.js`
- Modify: `src/services/orders.js`
- Modify: `src/components/OrderBaseContent/index.jsx`
- Modify: `src/components/ShoppingCart/PendingOrders.jsx`

- [ ] **Step 1: 增加 Redux selector**

将 `buildCrmIntegrationDiscountSubmitInfo` 改为接收 `{ selectedBenefit, orderDiscountInfo }`，并新增 selector：

```js
export function buildCrmIntegrationDiscountSubmitInfo({
  selectedBenefit,
  orderDiscountInfo,
} = {}) {
  if (!selectedBenefit?.id) return null
  if (!Array.isArray(orderDiscountInfo) || !orderDiscountInfo.length) {
    return null
  }

  return {
    crmIntegrationBenefit: true,
    crmIntegrationBenefitId: selectedBenefit.id,
    crmIntegrationOrderDiscountInfo: orderDiscountInfo,
  }
}

export function selectCrmIntegrationDiscountSubmitInfo(state) {
  return buildCrmIntegrationDiscountSubmitInfo(
    state.crmIntegrationValidationSlice
  )
}
```

- [ ] **Step 2: `generateOrder` 读取 Redux**

在 `src/services/orders.js` 顶部加入：

```js
import store from '@/store'
import { selectCrmIntegrationDiscountSubmitInfo } from '@/utils/crmIntegrationDiscountSubmitInfo'
```

在 `generateOrder` 中旧 CRM 折扣块之前增加：

```js
const crmIntegrationDiscountSubmitInfo =
  selectCrmIntegrationDiscountSubmitInfo(store.getState())

if (crmIntegrationDiscountSubmitInfo) {
  newOrder.discountList = JSON.stringify(
    crmIntegrationDiscountSubmitInfo.crmIntegrationOrderDiscountInfo || []
  )
}
```

- [ ] **Step 3: 保留旧 CRM / Avocado 入参链路**

将原来的 `discountOrderReward` 处理收敛为只处理旧链路：

```js
if (discountOrderReward && !discountOrderReward.crmIntegrationBenefit) {
  const { rewardDiscount, ...rest } = discountOrderReward
  newOrder.orderRewards = [
    ...(newOrder.orderRewards || []),
    { ...rest, transactionCommitId },
  ]
  newOrder.rewardDiscount = rewardDiscount
}
```

不得修改旧 CRM / Avocado 的字段结构和业务含义。

- [ ] **Step 4: 删除前两个入口的新 CRM integration 传参**

在 `OrderBaseContent` 和 `PendingOrders` 中删除：

```js
const selectedCrmIntegrationBenefit = useSelector(
  (state) => state.crmIntegrationValidationSlice.selectedBenefit
)
const crmIntegrationDiscountSubmitInfo = useMemo(
  () => buildCrmIntegrationDiscountSubmitInfo(selectedCrmIntegrationBenefit),
  [selectedCrmIntegrationBenefit]
)
```

并删除 `generateOrder({ ... discountOrderReward: crmIntegrationDiscountSubmitInfo })` 里的 new CRM integration 传参。

- [ ] **Step 5: 检查点**

Run:

```powershell
yarn eslint src\utils\crmIntegrationDiscountSubmitInfo.js src\services\orders.js src\components\OrderBaseContent\index.jsx src\components\ShoppingCart\PendingOrders.jsx
```

Expected: no ESLint error。

---

## Task 6: 回归验证

**Files:**
- Verify only

- [ ] **Step 1: 搜索旧传参是否还残留在 new CRM integration 入口**

Run:

```powershell
rg -n "crmIntegrationDiscountSubmitInfo|buildCrmIntegrationDiscountSubmitInfo|crmIntegrationOrderDiscountInfo|actualDiscount" src
```

Expected:

- `crmIntegrationDiscountSubmitInfo` 只作为 selector / `generateOrder` 内部读取使用。
- `crmIntegrationOrderDiscountInfo` 不再作为 benefit item 属性写入。
- 订单级 `actualDiscount` 不再作为 new CRM integration Redux 状态单独保存。
- 旧 CRM / Avocado 的 `discountOrderReward` 仍然存在。

- [ ] **Step 2: 静态检查所有修改文件**

Run:

```powershell
yarn eslint src\store\slices\crmIntegrationValidation.slice.js src\services\crmIntegrationBenefitValidator.js src\utils\crmIntegrationOrderFormatter.js src\services\crmIntegrationMarketSDK.js src\pages\Order\Order.jsx src\hooks\useCrmIntegrationBenefitAutoValidation.js src\utils\crmIntegrationDiscountSubmitInfo.js src\services\orders.js src\components\OrderBaseContent\index.jsx src\components\ShoppingCart\PendingOrders.jsx
```

Expected: no ESLint error。

- [ ] **Step 3: 手动业务验证**

在本地页面执行以下路径：

1. 登录 new CRM integration 会员。
2. 加购物车商品。
3. 选择固定折扣券，确认命中的 cart item 带有 `crmIntegrationDiscountItem` 和 `crmIntegrationItemDiscountInfo`。
4. 下单前确认 `generateOrder` 生成的 `newOrder.discountList` 来自 Redux 的 `orderDiscountInfo`。
5. 修改购物车后确认 auto validation 会刷新命中商品标签。
6. 让购物车不满足券条件，确认 selected benefit 被清空，cart item 上该券标签被清理。
7. 使用旧 CRM / Avocado 兑换路径做冒烟检查，确认旧 `discountOrderReward` 分支未被破坏。

---

## 自检

- 覆盖范围：Redux 状态、SDK formatter、用户选择、自动校验、`generateOrder`、前两个已接入入口清理、验证步骤均已覆盖。
- 旧系统边界：旧 CRM / Avocado 不改字段、不改入口、不改业务含义。
- 风险点：`generateOrder` 直接读 Redux 是为了统一下单入口，但必须只读取 new CRM integration selector，不能把旧 CRM / Avocado 也迁入 Redux。
- 提交限制：本计划不包含自动 commit / push 步骤。
