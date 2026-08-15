# CRM Integration Benefit Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 CRM Integration reward/voucher 建立基于购物车变化的实时 SDK 校验流程：已选券在购物车操作后如果不再满足条件，就自动清除并提示用户。

**Architecture:** 新建独立 Redux slice，只保存 `selectedBenefit`。`cartSignature` 和 SDK 校验用的 cart snapshot 只在 hook 内通过 `useMemo` 派生，不进入 Redux。单一 hook 监听 `selectedBenefit` 与 `cartSignature`，不 debounce，使用 hook 内部 `requestIdRef` 丢弃旧 Promise 返回，校验无效时先清 `selectedBenefit`，再清理相关 CRM cart item。

**Tech Stack:** React 17、Redux Toolkit、react-hooks-global-state、Vite SSR script tests、现有 `crmIntegrationMarketSDK.getCouponPlugin()`。

---

## 已确认设计

- Redux 只存：

```js
{
  selectedBenefit: null,
}
```

- 不存 `status`、`requestId`、`validatedCartSignature`、`validationResult`。
- invalid reason 只通过 Toast 展示，不进 Redux。
- `requestIdRef` 只存在 hook 内，用于只处理最后一次 SDK 校验结果，不保证 Promise 返回顺序。
- 不做 debounce。
- `cartSignature/cartSnapshot` 只在 hook 内 `useMemo`。
- 只有一个集中 hook 做实时校验，不在卡片、购物车项、菜品卡里散落多个 `useEffect`。
- 下单前最终校验仍然是后续任务，本计划只做实时校验框架和选中态。

## 文件结构

- Create: `src/store/slices/crmIntegrationValidation.slice.js`
  - 只保存当前已选 CRM Integration benefit。
  - actions: `setSelectedBenefit`、`clearSelectedBenefit`。
- Modify: `src/store/index.js`
  - 注册 `crmIntegrationValidationSlice`。
- Create: `src/utils/crmIntegrationCartValidation.js`
  - 根据当前 cart 生成稳定签名。
  - 根据 selected benefit 清理由该 benefit 加入的 cart item。
- Create: `src/services/crmIntegrationBenefitValidator.js`
  - 从 selected benefit 中取真实 SDK coupon。
  - 调用 `crmIntegrationMarketSDK.getCouponPlugin(...).MarketGetOrderCoupons()`。
  - 提供 invalid reason 格式化。
- Create: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`
  - 集中监听 `selectedBenefit` 与 `cartSignature`。
  - 执行 SDK 校验。
  - 无效时清 selected benefit、清相关 cart item、toast invalid reason。
- Modify: `src/pages/Order/Order.jsx`
  - 挂载实时校验 hook。
  - 处理 CRM Integration reward/voucher 卡片选择。
- Modify: `src/pages/Order/components/OrderListWrapper.jsx`
  - 传递 `onCrmIntegrationBenefitSelect`。
- Modify: `src/components/RightContent/index.jsx`
  - 传递 `onSelect` 给 `CrmIntegrationRewardCard`。
- Modify: `src/components/CrmIntegrationRewardCard/index.jsx`
  - 支持点击非弹窗型卡片选择 benefit。
- Tests:
  - Create: `scripts/crmIntegrationValidationSlice.test.mjs`
  - Create: `scripts/crmIntegrationCartValidation.test.mjs`
  - Create: `scripts/crmIntegrationBenefitValidator.test.mjs`

## 不提交代码

- 本计划执行完成后只汇报变更和验证结果。
- 不自动 `git add`、不自动 `git commit`、不自动 `git push`。
- 本文中不会包含 commit 步骤。

---

## Task 1: 新增轻量 Redux slice

**Files:**
- Create: `scripts/crmIntegrationValidationSlice.test.mjs`
- Create: `src/store/slices/crmIntegrationValidation.slice.js`
- Modify: `src/store/index.js`

- [ ] **Step 1: 写失败测试**

创建 `scripts/crmIntegrationValidationSlice.test.mjs`：

```js
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const sliceModule = await server.ssrLoadModule(
    '/src/store/slices/crmIntegrationValidation.slice.js'
  )
  const reducer = sliceModule.default
  const { actions } = sliceModule

  let state = reducer(undefined, { type: '@@INIT' })
  assert.deepEqual(state, { selectedBenefit: null })

  state = reducer(
    state,
    actions.setSelectedBenefit({
      id: 'crm-integration-reward-rule-1',
      crmIntegrationRewardSource: 'reward',
    })
  )
  assert.equal(state.selectedBenefit.id, 'crm-integration-reward-rule-1')
  assert.equal(state.selectedBenefit.crmIntegrationRewardSource, 'reward')

  state = reducer(state, actions.clearSelectedBenefit())
  assert.deepEqual(state, { selectedBenefit: null })

  console.log('crmIntegrationValidationSlice tests passed')
} finally {
  await server.close()
}
```

Run:

```powershell
node scripts\crmIntegrationValidationSlice.test.mjs
```

Expected:
- FAIL，模块不存在。

- [ ] **Step 2: 创建 slice**

创建 `src/store/slices/crmIntegrationValidation.slice.js`：

```js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedBenefit: null,
}

export const crmIntegrationValidationSlice = createSlice({
  name: 'crmIntegrationValidationSlice',
  initialState,
  reducers: {
    setSelectedBenefit(state, action) {
      state.selectedBenefit = action.payload || null
    },
    clearSelectedBenefit(state) {
      state.selectedBenefit = null
    },
  },
})

export default crmIntegrationValidationSlice.reducer
export const actions = crmIntegrationValidationSlice.actions
```

- [ ] **Step 3: 注册 reducer**

修改 `src/store/index.js`：

```js
import { configureStore } from '@reduxjs/toolkit'
import systemConfigSlice from './slices/systemConfig.slice'
import avocadoSlice from './slices/avocado.slice'
import system from './slices/system.slice'
import crmProviderSlice from './slices/crmProvider.slice'
import crmIntegrationValidationSlice from './slices/crmIntegrationValidation.slice'

export default configureStore({
  reducer: {
    systemConfigSlice,
    avocadoSlice,
    system,
    crmProviderSlice,
    crmIntegrationValidationSlice,
  },
})
```

- [ ] **Step 4: 跑 slice 测试**

Run:

```powershell
node scripts\crmIntegrationValidationSlice.test.mjs
```

Expected:

```text
crmIntegrationValidationSlice tests passed
```

---

## Task 2: 新增 cart signature 与清理工具

**Files:**
- Create: `scripts/crmIntegrationCartValidation.test.mjs`
- Create: `src/utils/crmIntegrationCartValidation.js`

- [ ] **Step 1: 写失败测试**

创建 `scripts/crmIntegrationCartValidation.test.mjs`：

```js
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const {
    buildCrmIntegrationCartSignature,
    getCrmIntegrationValidationCart,
    removeCrmIntegrationBenefitCartItems,
  } = await server.ssrLoadModule('/src/utils/crmIntegrationCartValidation.js')

  const cartA = [
    {
      key: 'b',
      id: 2,
      count: 1,
      price: 8,
      realPrice: 7,
      priceItem: { sizeId: 22 },
      instructions: 'extra spicy',
    },
    {
      key: 'a',
      id: 1,
      count: 2,
      price: 5,
      realPrice: 5,
      instructions: 'no onion',
    },
    {
      key: 'buffet',
      id: 9,
      count: 10,
      price: 0,
      isBuffetItem: true,
    },
  ]
  const cartB = [
    {
      key: 'a',
      id: 1,
      count: 2,
      price: 5,
      realPrice: 5,
      instructions: 'changed note',
    },
    {
      key: 'b',
      id: 2,
      count: 1,
      price: 8,
      realPrice: 7,
      priceItem: { sizeId: 22 },
    },
  ]
  const cartC = [
    {
      key: 'a',
      id: 1,
      count: 3,
      price: 5,
      realPrice: 5,
    },
    {
      key: 'b',
      id: 2,
      count: 1,
      price: 8,
      realPrice: 7,
      priceItem: { sizeId: 22 },
    },
  ]

  assert.equal(
    buildCrmIntegrationCartSignature(cartA),
    buildCrmIntegrationCartSignature(cartB)
  )
  assert.notEqual(
    buildCrmIntegrationCartSignature(cartA),
    buildCrmIntegrationCartSignature(cartC)
  )
  assert.deepEqual(
    getCrmIntegrationValidationCart(cartA).map((item) => item.key),
    ['b', 'a']
  )

  const selectedBenefit = {
    id: 'crm-integration-reward-rule-1',
  }
  const cartWithBenefitItem = [
    { key: 'normal', id: 1, count: 1 },
    {
      key: 'benefit',
      id: 2,
      count: 1,
      crmIntegrationBenefitId: 'crm-integration-reward-rule-1',
    },
  ]
  const cleanedCart = removeCrmIntegrationBenefitCartItems(
    cartWithBenefitItem,
    selectedBenefit
  )
  assert.deepEqual(
    cleanedCart.map((item) => item.key),
    ['normal']
  )

  const untouchedCart = removeCrmIntegrationBenefitCartItems(cartWithBenefitItem, {
    id: 'other-benefit',
  })
  assert.equal(untouchedCart, cartWithBenefitItem)

  console.log('crmIntegrationCartValidation tests passed')
} finally {
  await server.close()
}
```

Run:

```powershell
node scripts\crmIntegrationCartValidation.test.mjs
```

Expected:
- FAIL，模块不存在。

- [ ] **Step 2: 创建 cart 工具**

创建 `src/utils/crmIntegrationCartValidation.js`：

```js
function getCartItemSizeId(item) {
  return item?.priceItem?.sizeId ?? item?.sizeId ?? null
}

function getCartItemUnitPrice(item) {
  return Number(item?.realPrice ?? item?.price ?? 0)
}

function buildSignatureItems(cart = []) {
  return getCrmIntegrationValidationCart(cart)
    .map((item) => ({
      itemId: Number(item.id),
      sizeId: getCartItemSizeId(item),
      quantity: Number(item.count || 0),
      price: getCartItemUnitPrice(item),
    }))
    .sort((a, b) => {
      if (a.itemId !== b.itemId) return a.itemId - b.itemId
      return String(a.sizeId ?? '').localeCompare(String(b.sizeId ?? ''))
    })
}

export function getCrmIntegrationValidationCart(cart = []) {
  if (!Array.isArray(cart)) return []
  return cart.filter((item) => !item?.isBuffetItem)
}

export function buildCrmIntegrationCartSignature(cart = []) {
  return JSON.stringify(buildSignatureItems(cart))
}

export function removeCrmIntegrationBenefitCartItems(cart = [], selectedBenefit) {
  const benefitId = selectedBenefit?.id
  if (!benefitId || !Array.isArray(cart)) return cart

  const nextCart = cart.filter(
    (item) => item?.crmIntegrationBenefitId !== benefitId
  )
  return nextCart.length === cart.length ? cart : nextCart
}
```

- [ ] **Step 3: 跑 cart 工具测试**

Run:

```powershell
node scripts\crmIntegrationCartValidation.test.mjs
```

Expected:

```text
crmIntegrationCartValidation tests passed
```

---

## Task 3: 新增 SDK benefit validator

**Files:**
- Create: `scripts/crmIntegrationBenefitValidator.test.mjs`
- Create: `src/services/crmIntegrationBenefitValidator.js`

- [ ] **Step 1: 写失败测试**

创建 `scripts/crmIntegrationBenefitValidator.test.mjs`：

```js
import assert from 'node:assert/strict'
import { createServer } from 'vite'

function createMarketSDKMock() {
  const calls = {
    getCouponPlugin: [],
    marketGetOrderCoupons: 0,
  }

  return {
    calls,
    async getCouponPlugin(args) {
      calls.getCouponPlugin.push(args)
      return {
        async MarketGetOrderCoupons() {
          calls.marketGetOrderCoupons += 1
          return {
            formattedOrder: { orderId: 'formatted-order' },
            data: [
              {
                coupon: args.coupons[0],
                isValid: false,
                invalidReason: [
                  {
                    en: 'Minimum quantity not met',
                    'zh-cn': '未满足最低数量',
                  },
                ],
                result: [
                  {
                    calculatedOrder: {
                      discounts: [{ amount: 3.25 }],
                    },
                  },
                ],
              },
            ],
          }
        },
      }
    },
  }
}

async function loadValidator(marketSDKMock) {
  globalThis.__crmIntegrationBenefitValidatorMarketSDKMock = marketSDKMock

  const server = await createServer({
    configFile: './vite.config.js',
    server: { middlewareMode: true },
    appType: 'custom',
    plugins: [
      {
        name: 'mock-crm-integration-market-sdk',
        enforce: 'pre',
        resolveId(id) {
          if (id === '@/services/crmIntegrationMarketSDK') {
            return '\0mock-crm-integration-market-sdk'
          }
          return null
        },
        load(id) {
          if (id === '\0mock-crm-integration-market-sdk') {
            return `
              const crmIntegrationMarketSDK = globalThis.__crmIntegrationBenefitValidatorMarketSDKMock
              export default crmIntegrationMarketSDK
            `
          }
          return null
        },
      },
    ],
  })

  const module = await server.ssrLoadModule(
    '/src/services/crmIntegrationBenefitValidator.js'
  )
  return { server, ...module }
}

const marketSDKMock = createMarketSDKMock()
const {
  server,
  getCrmIntegrationSelectedBenefitCoupon,
  validateCrmIntegrationSelectedBenefit,
  formatCrmIntegrationInvalidReason,
} = await loadValidator(marketSDKMock)

try {
  const rewardBenefit = {
    id: 'crm-integration-reward-rule-1',
    crmIntegrationVoucher: false,
    rawReward: {
      ruleId: 'reward-rule-1',
      couponTemplate: { id: 'reward-template-1' },
    },
  }
  const voucherBenefit = {
    id: 'crm-integration-voucher-rule-1',
    crmIntegrationVoucher: true,
    rawVoucher: {
      rewardRule: {
        ruleId: 'voucher-rule-1',
        couponTemplate: { id: 'voucher-template-1' },
      },
    },
  }

  assert.equal(
    getCrmIntegrationSelectedBenefitCoupon(rewardBenefit).ruleId,
    'reward-rule-1'
  )
  assert.equal(
    getCrmIntegrationSelectedBenefitCoupon(voucherBenefit).ruleId,
    'voucher-rule-1'
  )
  assert.throws(
    () => getCrmIntegrationSelectedBenefitCoupon({ id: 'missing-raw' }),
    /Missing CRM integration selected benefit coupon/
  )

  const validation = await validateCrmIntegrationSelectedBenefit({
    selectedBenefit: voucherBenefit,
    metaData: [{ id: 'meta-1' }],
    allItems: [{ id: 1, count: 1 }],
  })

  assert.equal(marketSDKMock.calls.getCouponPlugin.length, 1)
  assert.equal(
    marketSDKMock.calls.getCouponPlugin[0].coupons[0].ruleId,
    'voucher-rule-1'
  )
  assert.equal(marketSDKMock.calls.getCouponPlugin[0].metas[0].id, 'meta-1')
  assert.equal(marketSDKMock.calls.getCouponPlugin[0].allItems[0].id, 1)
  assert.equal(marketSDKMock.calls.marketGetOrderCoupons, 1)
  assert.equal(validation.isValid, false)
  assert.equal(validation.actualDiscount, 3.25)
  assert.equal(validation.formattedOrder.orderId, 'formatted-order')
  assert.equal(
    formatCrmIntegrationInvalidReason(validation.invalidReason, 'zh_cn'),
    '未满足最低数量'
  )

  console.log('crmIntegrationBenefitValidator tests passed')
} finally {
  await server.close()
}
```

Run:

```powershell
node scripts\crmIntegrationBenefitValidator.test.mjs
```

Expected:
- FAIL，模块不存在。

- [ ] **Step 2: 创建 validator**

创建 `src/services/crmIntegrationBenefitValidator.js`：

```js
import crmIntegrationMarketSDK from '@/services/crmIntegrationMarketSDK'

function normalizeLanguage(language) {
  return language?.includes?.('zh') ? 'zh-cn' : language || 'en'
}

export function getCrmIntegrationSelectedBenefitCoupon(selectedBenefit) {
  if (selectedBenefit?.crmIntegrationVoucher) {
    const voucherCoupon = selectedBenefit?.rawVoucher?.rewardRule
    if (!voucherCoupon) {
      throw new Error('Missing CRM integration selected benefit coupon')
    }
    return voucherCoupon
  }

  const rewardCoupon = selectedBenefit?.rawReward
  if (!rewardCoupon) {
    throw new Error('Missing CRM integration selected benefit coupon')
  }
  return rewardCoupon
}

export async function validateCrmIntegrationSelectedBenefit({
  selectedBenefit,
  metaData,
  allItems,
}) {
  const coupon = getCrmIntegrationSelectedBenefitCoupon(selectedBenefit)
  const couponPlugin = await crmIntegrationMarketSDK.getCouponPlugin({
    coupons: [coupon],
    metas: metaData,
    allItems,
  })
  const response = await couponPlugin.MarketGetOrderCoupons()
  const rule = response?.data?.[0] || null

  return {
    isValid: !!rule?.isValid,
    rule,
    formattedOrder: response?.formattedOrder,
    invalidReason: rule?.invalidReason || [],
    actualDiscount:
      rule?.result?.[0]?.calculatedOrder?.discounts?.[0]?.amount || 0,
  }
}

export function formatCrmIntegrationInvalidReason(invalidReason, language) {
  if (!Array.isArray(invalidReason) || !invalidReason.length) return ''

  const actualLanguage = normalizeLanguage(language)
  return invalidReason
    .map((reason, index) => {
      const message = reason?.[actualLanguage] || reason?.en || ''
      if (!message) return ''
      return invalidReason.length > 1 ? `${index + 1}: ${message}` : message
    })
    .filter(Boolean)
    .join(' ')
}
```

- [ ] **Step 3: 跑 validator 测试**

Run:

```powershell
node scripts\crmIntegrationBenefitValidator.test.mjs
```

Expected:

```text
crmIntegrationBenefitValidator tests passed
```

---

## Task 4: 新增集中式实时校验 hook

**Files:**
- Create: `src/hooks/useCrmIntegrationBenefitAutoValidation.js`
- Modify: `src/pages/Order/Order.jsx`

- [ ] **Step 1: 创建 hook**

创建 `src/hooks/useCrmIntegrationBenefitAutoValidation.js`：

```js
import { useEffect, useMemo, useRef } from 'react'
import { getI18n } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Toast from '@/components/Toast'
import { useGlobalState } from '@/hooks/useGlobalState'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  buildCrmIntegrationCartSignature,
  getCrmIntegrationValidationCart,
  removeCrmIntegrationBenefitCartItems,
} from '@/utils/crmIntegrationCartValidation'
import {
  formatCrmIntegrationInvalidReason,
  validateCrmIntegrationSelectedBenefit,
} from '@/services/crmIntegrationBenefitValidator'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'

export default function useCrmIntegrationBenefitAutoValidation() {
  const dispatch = useDispatch()
  const [cart, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const selectedBenefit = useSelector(
    (state) => state.crmIntegrationValidationSlice.selectedBenefit
  )
  const metaData = useSelector((state) => state.crmProviderSlice.metaData)
  const latestRequestRef = useRef(0)

  const validationCart = useMemo(
    () => getCrmIntegrationValidationCart(cart),
    [cart]
  )
  const cartSignature = useMemo(
    () => buildCrmIntegrationCartSignature(validationCart),
    [validationCart]
  )

  useEffect(() => {
    if (!selectedBenefit) return
    if (!metaData) return

    const requestId = ++latestRequestRef.current

    const validate = async () => {
      try {
        const result = await validateCrmIntegrationSelectedBenefit({
          selectedBenefit,
          metaData,
          allItems: validationCart,
        })

        if (requestId !== latestRequestRef.current) return
        if (result.isValid) return

        dispatch(crmIntegrationValidationActions.clearSelectedBenefit())

        const nextCart = removeCrmIntegrationBenefitCartItems(
          cart,
          selectedBenefit
        )
        if (nextCart !== cart) {
          setCart(nextCart)
          setStoragedCart(nextCart)
        }

        const reason = formatCrmIntegrationInvalidReason(
          result.invalidReason,
          getI18n().language
        )
        if (reason) {
          Toast.info(reason)
        }
      } catch (error) {
        if (requestId !== latestRequestRef.current) return
        console.warn(error?.message || error)
      }
    }

    validate()
  }, [
    cart,
    cartSignature,
    dispatch,
    metaData,
    selectedBenefit,
    setCart,
    setStoragedCart,
    validationCart,
  ])
}
```

Implementation notes:
- 这个 hook 是唯一允许监听 `cartSignature` 并触发 SDK 校验的位置。
- 不 debounce。
- 不把 `cartSignature` 写入 Redux。
- `requestId` 只在 hook ref 内部，用于丢弃旧 Promise 返回。
- SDK error 不代表券无效，所以只 `console.warn`，不清 `selectedBenefit`。

- [ ] **Step 2: 在 Order 页挂载 hook**

修改 `src/pages/Order/Order.jsx`，增加 import：

```js
import useCrmIntegrationBenefitAutoValidation from '@/hooks/useCrmIntegrationBenefitAutoValidation'
```

在 `Order()` 内靠近其它 hooks 的位置调用一次：

```js
useCrmIntegrationBenefitAutoValidation()
```

- [ ] **Step 3: ESLint 检查 hook**

Run:

```powershell
yarn eslint src\hooks\useCrmIntegrationBenefitAutoValidation.js src\pages\Order\Order.jsx
```

Expected:
- exit code 0；允许项目已有 Browserslist 提示。

---

## Task 5: 接入 selectedBenefit 选择入口

**Files:**
- Modify: `src/components/CrmIntegrationRewardCard/index.jsx`
- Modify: `src/components/RightContent/index.jsx`
- Modify: `src/pages/Order/components/OrderListWrapper.jsx`
- Modify: `src/pages/Order/Order.jsx`

- [ ] **Step 1: Card 支持选择回调**

修改 `src/components/CrmIntegrationRewardCard/index.jsx`：

```js
const {
  name,
  points,
  discountValue,
  crmIntegrationRewardKind,
  giftQuantity,
  eligibleItemScope,
  eligibleItemCount,
  minSpend,
  expireAt,
  isPermanent,
  specialPrice,
  discountQuantity,
  bundleDiscountRule,
  buyQuantity,
  crmIntegrationRewardSource,
  crmIntegrationVoucher,
  voucherCount,
  hasCouponItemDialog,
  onClick,
  onSelect,
} = props
```

替换 `handleClick`：

```js
const handleClick = () => {
  if (hasCouponItemDialog) {
    onClick?.(props)
    return
  }
  onSelect?.(props)
}
```

说明：
- 有菜品弹窗的券仍然打开弹窗，不在这里直接选择。
- 没有菜品弹窗的整单折扣、百分比折扣、代金券等，点击后进入 `selectedBenefit`。

- [ ] **Step 2: RightContent 透传选择回调**

修改 `src/components/RightContent/index.jsx` props 解构：

```js
const {
  allCateList,
  listRef,
  setRightListCateId,
  keyword,
  listGap,
  rightListCateId,
  onCrmIntegrationRewardClick,
  onCrmIntegrationBenefitSelect,
} = props
```

修改卡片渲染：

```jsx
<CrmIntegrationRewardCard
  {...d}
  onClick={onCrmIntegrationRewardClick}
  onSelect={onCrmIntegrationBenefitSelect}
/>
```

更新 `rowRender` 依赖：

```js
[cateListWithValidDish, onCrmIntegrationBenefitSelect, onCrmIntegrationRewardClick, t_category]
```

- [ ] **Step 3: OrderListWrapper 透传选择回调**

修改 `src/pages/Order/components/OrderListWrapper.jsx` props：

```js
const { baseMenu, keyword, onCrmIntegrationRewardClick, onCrmIntegrationBenefitSelect } = props
```

传给 `RightContent`：

```jsx
<RightContent
  listGap={listGap}
  allCateList={allCateList}
  listRef={listRef}
  setRightListCateId={setRightListCateId}
  keyword={keyword}
  rightListCateId={rightListCateId}
  onCrmIntegrationRewardClick={onCrmIntegrationRewardClick}
  onCrmIntegrationBenefitSelect={onCrmIntegrationBenefitSelect}
/>
```

- [ ] **Step 4: Order 写入 selectedBenefit**

修改 `src/pages/Order/Order.jsx`，增加 import：

```js
import { useDispatch } from 'react-redux'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'
```

如果当前已有 `useSelector` import，合并为：

```js
import { useDispatch, useSelector } from 'react-redux'
```

在 `Order()` 内：

```js
const dispatch = useDispatch()
```

新增 handler：

```js
const selectCrmIntegrationBenefit = (benefit) => {
  dispatch(crmIntegrationValidationActions.setSelectedBenefit(benefit))
}
```

传给两套订单组件：

```jsx
<OrderListWrapper
  keyword={keyword}
  baseMenu={baseMenu}
  onCrmIntegrationRewardClick={openCrmIntegrationRewardDialog}
  onCrmIntegrationBenefitSelect={selectCrmIntegrationBenefit}
/>
```

```jsx
<OldOrderPage
  keyword={keyword}
  baseMenu={baseMenu}
  onCrmIntegrationRewardClick={openCrmIntegrationRewardDialog}
  onCrmIntegrationBenefitSelect={selectCrmIntegrationBenefit}
/>
```

Implementation notes:
- 如果 `OldOrderPage` 未使用 `onCrmIntegrationBenefitSelect`，本任务只传入 prop，不强行改内部结构；如果它内部也渲染 `RightContent` 或 `CrmIntegrationRewardCard`，再按同样方式透传。
- 本任务不做选中态 UI 样式。
- 本任务不实现赠菜、特价券、M 件 N 折的菜品选择后加入购物车逻辑。

- [ ] **Step 5: ESLint 检查选择入口**

Run:

```powershell
yarn eslint src\components\CrmIntegrationRewardCard\index.jsx src\components\RightContent\index.jsx src\pages\Order\components\OrderListWrapper.jsx src\pages\Order\Order.jsx
```

Expected:
- exit code 0；允许项目已有 Browserslist 提示。

---

## Task 6: 验证范围

- [ ] **Step 1: 新增测试**

Run:

```powershell
node scripts\crmIntegrationValidationSlice.test.mjs
node scripts\crmIntegrationCartValidation.test.mjs
node scripts\crmIntegrationBenefitValidator.test.mjs
```

Expected:
- 三个脚本全部 exit code 0。

- [ ] **Step 2: 既有 CRM Integration 测试**

Run:

```powershell
node scripts\crmIntegrationMarketSDK.test.mjs
node scripts\crmIntegrationRewards.test.mjs
node scripts\integrationCrmProviderMember.test.mjs
```

Expected:
- 全部 exit code 0。

- [ ] **Step 3: 静态搜索**

Run:

```powershell
rg -n "selectedBenefit|crmIntegrationBenefitId|buildCrmIntegrationCartSignature|useCrmIntegrationBenefitAutoValidation" src scripts
```

Expected:
- `selectedBenefit` 只存在新 slice、hook、Order 选择入口、测试中。
- `crmIntegrationBenefitId` 只存在 cart 清理工具和未来需要标记 CRM 加入购物车菜品的位置；本计划不会硬编码到普通菜品。

- [ ] **Step 4: ESLint**

Run:

```powershell
yarn eslint src\store\slices\crmIntegrationValidation.slice.js src\utils\crmIntegrationCartValidation.js src\services\crmIntegrationBenefitValidator.js src\hooks\useCrmIntegrationBenefitAutoValidation.js src\pages\Order\Order.jsx src\pages\Order\components\OrderListWrapper.jsx src\components\RightContent\index.jsx src\components\CrmIntegrationRewardCard\index.jsx scripts\crmIntegrationValidationSlice.test.mjs scripts\crmIntegrationCartValidation.test.mjs scripts\crmIntegrationBenefitValidator.test.mjs
```

Expected:
- exit code 0；允许项目已有 Browserslist 提示。

- [ ] **Step 5: Build**

Run:

```powershell
yarn build
```

Expected:
- exit code 0；允许项目已有 Vite、CSS minify、chunk size、非 module script、Browserslist 警告。

---

## 后续任务边界

本计划完成后具备：

- CRM Integration 当前选中的 reward/voucher 状态。
- 购物车变化后的实时 SDK 校验。
- SDK 返回无效时清除 selected benefit，并清理由该 benefit 加入的 cart item。
- 避免 `cart -> 校验 -> 改 cart -> 再校验` 死循环。

本计划不完成：

- eMenu 订单 formatter 的完整实现。
- reward/voucher 点击后的折扣落点。
- 赠菜、特价券、M 件 N 折的加入购物车逻辑。
- 下单前最终 SDK 校验。
- 选中态 UI 样式。

这些应在实时校验框架稳定后单独规划。

