# CRM Integration 固定/百分比折扣券闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成新 CRM 固定金额折扣券和百分比折扣券从选择、SDK 校验、购物车变更重校验、折扣数据回写到订单提交的闭环。

**Architecture:** 只处理 `fixedDiscount` / `percentageDiscount` 两种 benefit，不接入赠菜、特价、m 件 n 折。每次调用 Market SDK 前，为本次校验的每个订单行生成唯一 `crmIntegrationSdkItemId`，SDK 返回后用该 id 把 `calculatedOrder.orderItems` 的折扣结果映射回 emenu cart item。选择状态继续放在 `crmIntegrationValidationSlice.selectedBenefit`，有效结果补充 `actualDiscount`、SDK rule、formattedOrder 和折扣映射数据。

**Tech Stack:** React 17、Redux Toolkit、react-hooks-global-state、MarketSDK coupon plugin、nanoid、现有 `crmIntegrationMarketSDK` / `crmIntegrationBenefitValidator`。

**Git 限制:** 不允许自动执行 `git commit`、`git push`、创建 PR 或部署。计划中的“检查点”只代表可提交边界，不代表允许自动提交。

---

## 文件结构

- 新建 `src/utils/crmIntegrationOrderFormatter.js`
  - 负责把 emenu 的 `cart + orders` 订单行转换成 Market SDK 的 `formattedOrder.orderItems`。
  - 每次格式化时为每个订单行生成 `crmIntegrationSdkItemId`，并保留 `sourceType/sourceKey/sourceIndex`，用于 SDK 返回后的反向映射。

- 修改 `src/services/crmIntegrationMarketSDK.js`
  - 保留现有 SDK 生命周期。
  - 允许 `getCouponPlugin` 透传 `selectedBenefit`、`memberInfo`、`orderContext` 给 formatter。

- 修改 `src/services/crmIntegrationBenefitValidator.js`
  - 增加固定/百分比券的校验结果归一。
  - 输出 `actualDiscount`、`calculatedOrder`、`orderDiscountInfo`、`itemDiscountMap`、`formattedOrder`。

- 修改 `src/utils/crmIntegrationDiscountMapping.js`
  - 新建纯函数，把 SDK 返回的 `calculatedOrder.orderItems` 映射回 emenu cart item。
  - 只给当前 cart 中可更新的 item 打标签；已下单的 `orders[].cart` 只参与 SDK 校验，不直接修改。

- 修改 `src/store/slices/crmIntegrationValidation.slice.js`
  - `selectedBenefit` 继续是唯一状态源。
  - 增加保存校验后 benefit 的 reducer，不引入 request 状态、不存 cart snapshot。

- 修改 `src/pages/Order/Order.jsx`
  - 点击固定/百分比券时先调用 SDK 校验，valid 后才写入 `selectedBenefit`。
  - 保留现有登录、单选、空购物车、门槛、参与商品校验。

- 修改 `src/hooks/useCrmIntegrationBenefitAutoValidation.js`
  - cart/order 变化后重新校验已选固定/百分比券。
  - invalid 清除选择并 toast。
  - valid 更新 `selectedBenefit` 和 cart item 折扣标签。

- 修改 `src/hooks/useSendDiscountOrder.js`
  - 让新 CRM 的 `selectedBenefit` 能复用现有 `discountOrderReward` 提交流程。
  - 不影响旧 CRM / Avocado 的 `selectedDiscountRule`。

- 修改 `src/services/orders.js`
  - 只在必要时识别新 CRM 折扣字段，确保 `orderRewards`、`rewardDiscount` 和税前/税后折扣计算能接上。

---

## Task 1: 实现 SDK 订单 formatter

**Files:**
- Create: `src/utils/crmIntegrationOrderFormatter.js`
- Modify: `src/services/crmIntegrationMarketSDK.js`

- [ ] **Step 1: 新建 formatter 的最小纯函数**

实现以下接口：

```js
import { nanoid } from 'nanoid'
import { getStorageValue } from '@/utils/storage'

export const CRM_INTEGRATION_PRODUCT_LINE = 'EMENU'
export const CRM_INTEGRATION_MEMBER_SCOPE = 'ALL'

export function getCrmIntegrationOrderItemSizeId(item) {
  return item?.priceItem?.sizeId ?? item?.sizeId ?? null
}

export function getCrmIntegrationOrderItemUnitPrice(item) {
  return Number(item?.realBenefitPrice ?? item?.realPrice ?? item?.price ?? 0)
}

export function getCrmIntegrationOrderItemQuantity(item) {
  return Number(item?.count ?? item?.quantity ?? 0)
}

export function attachCrmIntegrationSdkItemIds(items = [], sourceType) {
  return items.map((item, index) => ({
    ...item,
    crmIntegrationSdkItemId: nanoid(),
    crmIntegrationSourceType: sourceType,
    crmIntegrationSourceKey:
      item?.key || item?.orderItemId || item?.sequence || `${sourceType}-${index}`,
    crmIntegrationSourceIndex: index,
  }))
}
```

- [ ] **Step 2: 实现 `formatCrmIntegrationOrderStructure`**

该方法必须只依赖入参，不直接读 React hook。

```js
export function formatCrmIntegrationOrderStructure({
  allItems = [],
  selectedBenefit = null,
  memberInfo = null,
  orderType = 'DINE_IN',
  paymentType,
  merchantId = getStorageValue('emenu_company')?.merchantId,
} = {}) {
  const orderItems = allItems
    .filter((item) => Number(item?.count ?? item?.quantity ?? 0) > 0)
    .map((item) => {
      const quantity = getCrmIntegrationOrderItemQuantity(item)
      const unitPrice = getCrmIntegrationOrderItemUnitPrice(item)
      return {
        itemName: item.name || item.displayName || '',
        id: item.crmIntegrationSdkItemId,
        itemId: Number(item.id ?? item.saleItemId),
        merchantId,
        productLine: CRM_INTEGRATION_PRODUCT_LINE,
        categoryId:
          item.categoryId === undefined || item.categoryId === null
            ? null
            : String(item.categoryId),
        quantity,
        sizeId: getCrmIntegrationOrderItemSizeId(item),
        itemPrice: Number(item.price ?? unitPrice),
        itemTotalPrice: unitPrice,
        discounts: buildCrmIntegrationSdkDiscountList(selectedBenefit),
      }
    })

  const hasItemDiscounts = orderItems.some((item) => item.discounts?.length)

  return {
    orderType,
    paymentType,
    discounts: hasItemDiscounts ? orderItems.find((item) => item.discounts?.length).discounts : [],
    merchantId,
    orderItems,
    orderTime: new Date().toISOString(),
    channel: null,
    charges: [],
    productLine: CRM_INTEGRATION_PRODUCT_LINE,
    member: {
      memberId: memberInfo?.id || memberInfo?.userId,
    },
    memberScope: CRM_INTEGRATION_MEMBER_SCOPE,
  }
}
```

- [ ] **Step 3: 实现 `buildCrmIntegrationSdkDiscountList`**

初次选择时 `selectedBenefit.actualDiscount` 可能不存在，此时返回空数组；重校验时跟 KioskLite 一样把当前选中折扣带入订单。

```js
export function buildCrmIntegrationSdkDiscountList(selectedBenefit) {
  if (!selectedBenefit?.actualDiscount) return []
  return [
    {
      name: selectedBenefit.name,
      id: selectedBenefit.rawReward?.ruleId || selectedBenefit.rawVoucher?.rewardRule?.ruleId,
      amount: selectedBenefit.actualDiscount,
      type: selectedBenefit.crmIntegrationRewardSource,
      extraInfo: {
        enableBenefit: true,
      },
    },
  ]
}
```

- [ ] **Step 4: 修改 `crmIntegrationMarketSDK.getCouponPlugin`**

扩展参数，但保持旧调用兼容：

```js
async getCouponPlugin({
  coupons,
  metas,
  extraItems,
  allItems,
  selectedBenefit,
  memberInfo,
  orderContext,
} = {}) {
  const formattedOrder = await formatOrderStructure({
    extraItems,
    allItems,
    selectedBenefit,
    memberInfo,
    orderContext,
  })
  if (!this.api) await this.mount()
  const couponService = this.api?.getCouponPlugin?.()
  return {
    MarketGetOrderCoupons: async () => {
      const res = await couponService?.getOrderCoupons?.(
        formattedOrder,
        coupons,
        metas
      )
      return { ...res, formattedOrder }
    },
    MarketValidateCoupons: async () => {
      return couponService?.validateCoupons?.(formattedOrder, coupons, metas)
    },
  }
}
```

- [ ] **Step 5: 检查点**

运行：

```powershell
yarn eslint src\utils\crmIntegrationOrderFormatter.js src\services\crmIntegrationMarketSDK.js
```

预期：无 ESLint error。Browserslist 过期提示可以忽略。

---

## Task 2: 注册 formatter，并保证每次 SDK 调用有唯一订单行 id

**Files:**
- Modify: `src/pages/Order/Order.jsx`
- Modify: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`

- [ ] **Step 1: 在 `Order.jsx` 中构造 SDK allItems**

在现有 `currentOrderItems` 基础上，只在调用 SDK 前生成带 `crmIntegrationSdkItemId` 的数组，不把该 id 写回 cart 全局状态。

```js
const crmIntegrationSdkOrderItems = useMemo(() => {
  const orderedItems = attachCrmIntegrationSdkItemIds(
    orders.flatMap((order) => (Array.isArray(order?.cart) ? order.cart : [])),
    'order'
  )
  const cartItems = attachCrmIntegrationSdkItemIds(cart, 'cart')
  return [...orderedItems, ...cartItems]
}, [cart, orders])
```

- [ ] **Step 2: 注册 order formatter**

在 `Order.jsx` 中用 effect 注册 formatter，闭包里只读当前会员和订单上下文。

```js
useEffect(() => {
  crmIntegrationMarketSDK.setOrderFormatter((options = {}) =>
    formatCrmIntegrationOrderStructure({
      ...options,
      memberInfo,
      orderType: orders?.[0]?.type || 'DINE_IN',
      paymentType: orders?.[0]?.paymentType,
      merchantId: getStorageValue('emenu_company')?.merchantId,
    })
  )
}, [memberInfo, orders])
```

- [ ] **Step 3: auto validation hook 使用同一策略**

`useCrmIntegrationBenefitAutoValidation` 内也必须为本次 SDK 调用创建新的 `crmIntegrationSdkItemId`，不要复用旧随机 id。

```js
const currentOrderItemsForSdk = useMemo(() => {
  const orderItems = Array.isArray(orders)
    ? orders.flatMap((order) => (Array.isArray(order?.cart) ? order.cart : []))
    : []
  return [
    ...attachCrmIntegrationSdkItemIds(orderItems, 'order'),
    ...attachCrmIntegrationSdkItemIds(Array.isArray(cart) ? cart : [], 'cart'),
  ]
}, [cart, orders])
```

- [ ] **Step 4: 检查点**

运行：

```powershell
yarn eslint src\pages\Order\Order.jsx src\hooks\useCrmIntegrationBenefitAutoValidation.js
```

预期：无 ESLint error。

---

## Task 3: 归一 SDK 校验结果

**Files:**
- Modify: `src/services/crmIntegrationBenefitValidator.js`

- [ ] **Step 1: 限定只校验固定/百分比券**

加入类型判断，非固定/百分比券保持当前行为或直接返回 unsupported。

```js
import { CRM_INTEGRATION_REWARD_KIND } from '@/utils/crmIntegrationRewards'

function isDiscountBenefit(selectedBenefit) {
  return [
    CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT,
    CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT,
  ].includes(selectedBenefit?.crmIntegrationRewardKind)
}
```

- [ ] **Step 2: 提取 SDK 折扣结果**

```js
function getCalculatedOrder(rule) {
  return rule?.result?.[0]?.calculatedOrder || null
}

function getActualDiscountFromRule(rule) {
  return getCalculatedOrder(rule)?.discounts?.[0]?.amount || 0
}

function getOrderDiscountInfoFromRule(rule) {
  return getCalculatedOrder(rule)?.discounts || []
}
```

- [ ] **Step 3: 扩展 `validateCrmIntegrationSelectedBenefit` 返回值**

```js
export async function validateCrmIntegrationSelectedBenefit({
  selectedBenefit,
  metaData,
  allItems,
  memberInfo,
  includeSelectedDiscount = false,
}) {
  const coupon = getCrmIntegrationSelectedBenefitCoupon(selectedBenefit)
  const couponPlugin = await crmIntegrationMarketSDK.getCouponPlugin({
    coupons: [coupon],
    metas: metaData,
    allItems,
    selectedBenefit: includeSelectedDiscount ? selectedBenefit : null,
    memberInfo,
  })
  const response = await couponPlugin.MarketGetOrderCoupons()
  const rule = response?.data?.[0] || null
  const calculatedOrder = getCalculatedOrder(rule)

  return {
    isSupported: isDiscountBenefit(selectedBenefit),
    isValid: !!rule?.isValid,
    rule,
    formattedOrder: response?.formattedOrder,
    calculatedOrder,
    orderDiscountInfo: getOrderDiscountInfoFromRule(rule),
    invalidReason: rule?.invalidReason || [],
    actualDiscount: getActualDiscountFromRule(rule),
  }
}
```

- [ ] **Step 4: 增加 benefit 合并方法**

```js
export function mergeCrmIntegrationValidationResultToBenefit(
  selectedBenefit,
  validationResult
) {
  return {
    ...selectedBenefit,
    isValid: validationResult.isValid,
    actualDiscount: validationResult.actualDiscount,
    crmIntegrationRule: validationResult.rule,
    crmIntegrationFormattedOrder: validationResult.formattedOrder,
    crmIntegrationCalculatedOrder: validationResult.calculatedOrder,
    crmIntegrationOrderDiscountInfo: validationResult.orderDiscountInfo,
  }
}
```

- [ ] **Step 5: 检查点**

运行：

```powershell
yarn eslint src\services\crmIntegrationBenefitValidator.js
```

预期：无 ESLint error。

---

## Task 4: 映射 SDK 商品折扣到 cart item

**Files:**
- Create: `src/utils/crmIntegrationDiscountMapping.js`
- Modify: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`
- Modify: `src/pages/Order/Order.jsx`

- [ ] **Step 1: 创建映射工具**

只更新 `sourceType === 'cart'` 的 item；已下单商品参与 SDK 校验，但不在前端 cart 中直接改已下单数据。

```js
export function buildCrmIntegrationDiscountBySdkItemId(validationResult) {
  const orderItems =
    validationResult?.calculatedOrder?.orderItems ||
    validationResult?.rule?.result?.[0]?.calculatedOrder?.orderItems ||
    []

  return new Map(
    orderItems
      .filter((item) => item?.id)
      .map((item) => [
        String(item.id),
        {
          itemDiscountInfo: item.discounts || [],
          orderItem: item,
        },
      ])
  )
}

export function applyCrmIntegrationDiscountToCartItems({
  cart = [],
  allItems = [],
  selectedBenefit,
  validationResult,
}) {
  const discountMap = buildCrmIntegrationDiscountBySdkItemId(validationResult)
  const cartSdkItems = allItems.filter(
    (item) => item.crmIntegrationSourceType === 'cart'
  )

  return cart.map((cartItem) => {
    const sdkItem = cartSdkItems.find(
      (item) => item.crmIntegrationSourceKey === cartItem.key
    )
    if (!sdkItem) return cartItem
    const discountInfo = discountMap.get(String(sdkItem.crmIntegrationSdkItemId))
    if (!discountInfo) return cartItem

    return {
      ...cartItem,
      crmIntegrationBenefitId: selectedBenefit.id,
      crmIntegrationDiscountItem: true,
      crmIntegrationItemDiscountInfo: discountInfo.itemDiscountInfo,
      crmIntegrationOrderDiscountInfo: validationResult.orderDiscountInfo,
      crmIntegrationSdkOrderItem: discountInfo.orderItem,
    }
  })
}
```

- [ ] **Step 2: 增加清理工具**

```js
export function clearCrmIntegrationDiscountFromCartItems(cart = [], benefitId) {
  return cart.map((item) => {
    if (item.crmIntegrationBenefitId !== benefitId) return item
    const nextItem = { ...item }
    delete nextItem.crmIntegrationBenefitId
    delete nextItem.crmIntegrationDiscountItem
    delete nextItem.crmIntegrationItemDiscountInfo
    delete nextItem.crmIntegrationOrderDiscountInfo
    delete nextItem.crmIntegrationSdkOrderItem
    return nextItem
  })
}
```

- [ ] **Step 3: 检查点**

运行：

```powershell
yarn eslint src\utils\crmIntegrationDiscountMapping.js
```

预期：无 ESLint error。

---

## Task 5: 点击固定/百分比券时先 SDK 校验，再选中

**Files:**
- Modify: `src/pages/Order/Order.jsx`
- Modify: `src/store/slices/crmIntegrationValidation.slice.js`

- [ ] **Step 1: 扩展 slice reducer**

```js
setValidatedSelectedBenefit(state, action) {
  state.selectedBenefit = action.payload || null
}
```

- [ ] **Step 2: 把 `selectCrmIntegrationBenefit` 改成 async**

固定/百分比券的 `SELECT` 分支中，在基础校验后调用 SDK：

```js
const validationResult = await validateCrmIntegrationSelectedBenefit({
  selectedBenefit: benefit,
  metaData,
  allItems: crmIntegrationSdkOrderItems,
  memberInfo,
  includeSelectedDiscount: false,
})

if (!validationResult.isValid) {
  const reason = formatCrmIntegrationInvalidReason(
    validationResult.invalidReason,
    getI18n().language
  )
  if (reason) Toast.info(reason)
  return false
}

const validatedBenefit = mergeCrmIntegrationValidationResultToBenefit(
  benefit,
  validationResult
)

const nextCart = applyCrmIntegrationDiscountToCartItems({
  cart,
  allItems: crmIntegrationSdkOrderItems,
  selectedBenefit: validatedBenefit,
  validationResult,
})

setCart(nextCart)
setStoragedCart(nextCart)
dispatch(
  crmIntegrationValidationActions.setValidatedSelectedBenefit(validatedBenefit)
)
return selectionAction
```

- [ ] **Step 3: 清除选中时清理 cart 折扣标签**

```js
const nextCart = clearCrmIntegrationDiscountFromCartItems(
  cart,
  selectedCrmIntegrationBenefit?.id
)
setCart(nextCart)
setStoragedCart(nextCart)
dispatch(crmIntegrationValidationActions.clearSelectedBenefit())
```

- [ ] **Step 4: 检查点**

运行：

```powershell
yarn eslint src\pages\Order\Order.jsx src\store\slices\crmIntegrationValidation.slice.js
```

预期：无 ESLint error。

---

## Task 6: 购物车/已下单菜变化后重校验

**Files:**
- Modify: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`

- [ ] **Step 1: 保留 cartSignature 触发，但只作为触发条件**

签名不进 Redux，只用于 hook 内判断 `cart + orders` 是否变化。

```js
const cartSignature = useMemo(
  () => buildCrmIntegrationCartSignature(currentOrderItemsForSdk),
  [currentOrderItemsForSdk]
)
```

- [ ] **Step 2: valid 时更新 selectedBenefit 和 cart 标签**

```js
const result = await validateCrmIntegrationSelectedBenefit({
  selectedBenefit,
  metaData,
  allItems: currentOrderItemsForSdk,
  memberInfo,
  includeSelectedDiscount: true,
})

if (result.isValid) {
  const validatedBenefit = mergeCrmIntegrationValidationResultToBenefit(
    selectedBenefit,
    result
  )
  const nextCart = applyCrmIntegrationDiscountToCartItems({
    cart,
    allItems: currentOrderItemsForSdk,
    selectedBenefit: validatedBenefit,
    validationResult: result,
  })
  setCart(nextCart)
  setStoragedCart(nextCart)
  dispatch(
    crmIntegrationValidationActions.setValidatedSelectedBenefit(validatedBenefit)
  )
  return
}
```

- [ ] **Step 3: invalid 时清除 selectedBenefit 和 cart 标签**

```js
dispatch(
  crmIntegrationValidationActions.clearSelectedBenefitById(selectedBenefit.id)
)
const nextCart = clearCrmIntegrationDiscountFromCartItems(
  cart,
  selectedBenefit.id
)
setCart(nextCart)
setStoragedCart(nextCart)
```

- [ ] **Step 4: 保留当前产品决策**

不做 requestId 顺序保护。当前业务确认：一旦某次校验判定无效，直接清除，用户需要重新选择。

- [ ] **Step 5: 检查点**

运行：

```powershell
yarn eslint src\hooks\useCrmIntegrationBenefitAutoValidation.js
```

预期：无 ESLint error。

---

## Task 7: 提交订单时带上新 CRM 折扣信息

**Files:**
- Modify: `src/hooks/useSendDiscountOrder.js`
- Modify: `src/services/orders.js`

- [ ] **Step 1: 在 `useSendDiscountOrder` 读取 `selectedBenefit`**

```js
const selectedCrmIntegrationBenefit = useSelector(
  (state) => state.crmIntegrationValidationSlice.selectedBenefit
)
```

- [ ] **Step 2: 生成新 CRM 的 `discountOrderReward`**

旧 CRM 的 `selectedDiscountRule` 仍优先走原逻辑；新 CRM 只在 `selectedDiscountRule` 不存在时生效。

```js
const crmIntegrationDiscountOrderReward = useMemo(() => {
  if (!selectedCrmIntegrationBenefit?.actualDiscount) return null
  return {
    rewardId:
      selectedCrmIntegrationBenefit.rawReward?.ruleId ||
      selectedCrmIntegrationBenefit.rawVoucher?.rewardRule?.ruleId,
    rewardName: selectedCrmIntegrationBenefit.name,
    strategy:
      selectedCrmIntegrationBenefit.crmIntegrationRewardKind ===
      CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
        ? 'byPercentageOff'
        : 'byFixedAmount',
    point: selectedCrmIntegrationBenefit.points || 0,
    discountRate: selectedCrmIntegrationBenefit.discountValue,
    discount: selectedCrmIntegrationBenefit.actualDiscount,
    rewardType: selectedCrmIntegrationBenefit.crmIntegrationRewardSource,
    rewardDiscount: selectedCrmIntegrationBenefit.actualDiscount,
    crmIntegrationBenefit: true,
    crmIntegrationOrderDiscountInfo:
      selectedCrmIntegrationBenefit.crmIntegrationOrderDiscountInfo || [],
  }
}, [selectedCrmIntegrationBenefit])
```

- [ ] **Step 3: submit 时选择折扣来源**

```js
const finalDiscountOrderReward =
  discountOrderReward || crmIntegrationDiscountOrderReward
```

传给 `generateOrder` 的字段改为：

```js
discountOrderReward: finalDiscountOrderReward
  ? { id, ...finalDiscountOrderReward }
  : null
```

- [ ] **Step 4: `orders.js` 识别新 CRM 折扣**

如果 `discountOrderReward.crmIntegrationBenefit` 存在，保留现有 `orderRewards` / `rewardDiscount` 逻辑，并把 SDK 的订单级折扣信息写入可提交字段：

```js
if (discountOrderReward?.crmIntegrationBenefit) {
  newOrder.discountList = JSON.stringify(
    discountOrderReward.crmIntegrationOrderDiscountInfo || []
  )
}
```

- [ ] **Step 5: 检查点**

运行：

```powershell
yarn eslint src\hooks\useSendDiscountOrder.js src\services\orders.js
```

预期：无 ESLint error。

---

## Task 8: 清理旧的无效/重复代码

**Files:**
- Modify: `src/utils/crmIntegrationCartValidation.js`
- Search only: `src`

- [ ] **Step 1: 检查 `buildCrmIntegrationCartSignature` 是否仍由 hook 使用**

如果 hook 仍使用，保留。

- [ ] **Step 2: 删除不再使用的清理函数**

如果 `removeCrmIntegrationBenefitCartItems` 不再被任何文件引用，则删除。不要为了测试 fixture 保留业务兼容逻辑。

- [ ] **Step 3: 全局搜索确认**

运行：

```powershell
rg -n "removeCrmIntegrationBenefitCartItems|crmIntegrationGiftItemCandidate|createGiftCandidateCartItem" src
```

预期：没有无效残留。

---

## Task 9: 验证路径

**Files:**
- Verify only

- [ ] **Step 1: 静态检查**

运行：

```powershell
yarn eslint src\utils\crmIntegrationOrderFormatter.js src\services\crmIntegrationMarketSDK.js src\services\crmIntegrationBenefitValidator.js src\utils\crmIntegrationDiscountMapping.js src\pages\Order\Order.jsx src\hooks\useCrmIntegrationBenefitAutoValidation.js src\hooks\useSendDiscountOrder.js src\services\orders.js
```

预期：无 ESLint error。

- [ ] **Step 2: 手动验证固定折扣券**

流程：

1. 打开 emenu。
2. 登录新 CRM 会员。
3. 加入一个满足固定折扣券门槛的菜。
4. 点击固定金额折扣券。
5. 预期：SDK valid，卡片进入 selected 状态，购物车金额/提交折扣数据包含该券的 `actualDiscount`。
6. 删除菜导致门槛不足。
7. 预期：自动清除 selectedBenefit，toast SDK invalid reason。

- [ ] **Step 3: 手动验证百分比折扣券**

流程：

1. 加入参与商品。
2. 点击百分比折扣券。
3. 预期：SDK 返回 `actualDiscount`，selectedBenefit 保存该金额。
4. 修改菜品数量。
5. 预期：自动重校验并更新 `actualDiscount`。
6. 删除所有参与商品。
7. 预期：自动清除券。

- [ ] **Step 4: 验证不互相污染**

流程：

1. 已选择固定折扣券时点击百分比折扣券。
2. 预期：toast “只能选择一个 reward/voucher”，原选择不变。
3. 清除固定折扣券后再选择百分比折扣券。
4. 预期：可正常选择。

---

## 自检

- 覆盖范围：只包含固定金额折扣券和百分比折扣券，没有实现赠菜、特价、m 件 n 折。
- SDK 唯一 id：每次调用 SDK 前生成 `crmIntegrationSdkItemId`，用于映射 SDK 返回的折扣数据。
- 状态边界：`cartSignature` 不进 Redux；Redux 只保存 `selectedBenefit`。
- 失效策略：无 requestId 顺序保护；任何一次无效结果都会清除当前券，符合当前确认的业务规则。
- Git：计划没有自动提交步骤。
