# CRM Integration Market SDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 kiosk 的 `MarketSDK` 生命周期和 coupon/promotion plugin 使用方式完整移植到 eMenu，为后续 reward/voucher 校验、M 件 N 折凑单和云促销能力接入准备 SDK 边界。

**Architecture:** 新增独立 `src/services/crmIntegrationMarketSDK.js`，只负责加载/初始化/destroy 全局 MarketSDK，并封装 `getCouponPlugin` 和 `getPromotionPlugin`。现有 `src/services/crmIntegration.js` 继续负责 CRM Integration HTTP 接口、token 和 SDK meta 30 分钟刷新，两者不混用。订单数据转换暂时通过注入的 `formatOrder` 函数占位，不在本任务里猜 eMenu 订单结构。

**Tech Stack:** React/Vite、现有 `request` service、全局 `window.marketAPI || window.MarketSDK`、Node/Vite SSR 测试脚本。

---

## 已确认的 kiosk 事实

- kiosk SDK 入口：`D:\MenusifuStore\kiosklite\src\utils\CRMIntegration\marketSDK.js`
- SDK 来自全局对象：`window.marketAPI || window.MarketSDK`
- kiosk 通过 `public/index.html` 加载 `/kpos/img/gallery/js/market.js?update=TstNew2`
- `getCouponPlugin` 包装：
  - `couponService.getOrderCoupons(formattedOrder, coupons, metas)`
  - `couponService.validateCoupons(formattedOrder, coupons, metas)`
- `getPromotionPlugin` 包装：
  - `promotionService.matchItemPromotion(...)`
  - `promotionService.getOrderRules(...)`
  - `promotionService.recommendOrderPromotion(...)`
- kiosk 初始化参数：

```js
{
  environment: 'dev',
  cache: {
    ttl: 600,
    prefix: 'promo',
    maxSize: 5000,
  },
  monitor: {
    enabled: false,
  },
  business: {
    type: 'KIOSK',
    merchantId,
  },
}
```

## 需要确认但不阻塞 SDK 壳迁移的点

- eMenu 的 `business.type` 应该使用 `EMENU` 还是 SDK 另有指定值。计划先把默认值设为 `EMENU`，并允许通过配置覆盖。
- eMenu 是否也使用 `/kpos/img/gallery/js/market.js?update=TstNew2`。当前 `index.html` 只加载了 `calculator.js`，没有加载 `market.js`。计划用 service 动态加载，避免直接改 HTML。
- 订单转换函数本任务不实现，只提供 `setOrderFormatter(formatOrder)` 和调用时传 `formatOrder` 的能力；未设置 formatter 时抛明确错误。

## 文件结构

- Create: `src/services/crmIntegrationMarketSDK.js`
  - 负责 SDK script 动态加载。
  - 负责 SDK 单例 mount/unMount。
  - 负责并发初始化锁。
  - 负责 coupon/promotion plugin 方法封装。
  - 负责注入订单 formatter。
- Create: `scripts/crmIntegrationMarketSDK.test.mjs`
  - 使用 Vite SSR 加载 service。
  - mock `window.marketAPI`、`document.head.appendChild`、`window.setInterval` 不需要真实 SDK。
  - 验证生命周期、plugin 调用参数、并发初始化、未设置 formatter 的错误。
- Modify: `src/crm/providers/integrationCrmProvider.js`
  - provider bootstrap 时挂载 SDK，返回 `stopMarketSDK` 或合并进 cleanup。
  - 不接业务校验调用。
- Modify: `src/App.jsx`
  - 在 integration provider cleanup 时同时执行 SDK destroy。

## Task 1: 新增 Market SDK service 测试

**Files:**
- Create: `scripts/crmIntegrationMarketSDK.test.mjs`
- Create: `src/services/crmIntegrationMarketSDK.js`

- [ ] **Step 1: 写失败测试**

创建 `scripts/crmIntegrationMarketSDK.test.mjs`：

```js
import assert from 'node:assert/strict'
import { createServer } from 'vite'

async function loadService() {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    resolve: {
      alias: {
        '@': `${process.cwd()}/src`,
      },
    },
    server: {
      middlewareMode: true,
    },
  })

  try {
    const mod = await server.ssrLoadModule('/src/services/crmIntegrationMarketSDK.js')
    return { server, ...mod }
  } catch (error) {
    await server.close()
    throw error
  }
}

function installBrowserMocks() {
  const appendedScripts = []
  globalThis.window = {
    location: { hostname: 'localhost' },
    setTimeout,
    clearTimeout,
  }
  globalThis.document = {
    createElement(tagName) {
      return {
        tagName,
        async: false,
        src: '',
        onload: null,
        onerror: null,
      }
    },
    head: {
      appendChild(element) {
        appendedScripts.push(element)
        setTimeout(() => element.onload?.(), 0)
        return element
      },
    },
  }
  return appendedScripts
}

const appendedScripts = installBrowserMocks()
let initCount = 0
let destroyCount = 0
let lastInitOptions = null
let lastCouponArgs = null
let lastPromotionMatchArgs = null
let lastPromotionRulesArgs = null
let lastPromotionRecommendArgs = null

window.marketAPI = (options) => {
  lastInitOptions = options
  return {
    async init() {
      initCount += 1
    },
    async destroy() {
      destroyCount += 1
    },
    getCouponPlugin() {
      return {
        async getOrderCoupons(order, coupons, metas) {
          lastCouponArgs = { order, coupons, metas }
          return { data: [{ coupon: coupons[0], result: [] }] }
        },
        async validateCoupons(order, coupons, metas) {
          return { order, coupons, metas, validated: true }
        },
      }
    },
    getPromotionPlugin() {
      return {
        async matchItemPromotion(args) {
          lastPromotionMatchArgs = args
          return new Map([['item-1', ['promo-1']]])
        },
        async getOrderRules(order, rules, metas) {
          lastPromotionRulesArgs = { order, rules, metas }
          return { data: [] }
        },
        async recommendOrderPromotion(args) {
          lastPromotionRecommendArgs = args
          return [{ recommendType: 'NONE' }]
        },
      }
    },
  }
}

const {
  server,
  default: crmIntegrationMarketSDK,
  formatOrderStructure,
  CRM_INTEGRATION_MARKET_SDK_SCRIPT_URL,
} = await loadService()

try {
  await assert.rejects(
    () => formatOrderStructure({}),
    /CRM integration order formatter is not configured/
  )

  crmIntegrationMarketSDK.setMerchantId('M000020684')
  crmIntegrationMarketSDK.setOrderFormatter(async ({ allItems }) => ({
    orderType: 'DINE_IN',
    merchantId: 'M000020684',
    productLine: 'EMENU',
    orderItems: allItems || [],
  }))

  await Promise.all([
    crmIntegrationMarketSDK.mount(),
    crmIntegrationMarketSDK.mount(),
  ])

  assert.equal(initCount, 1)
  assert.equal(appendedScripts.length, 1)
  assert.equal(appendedScripts[0].src, CRM_INTEGRATION_MARKET_SDK_SCRIPT_URL)
  assert.equal(lastInitOptions.business.merchantId, 'M000020684')
  assert.equal(lastInitOptions.business.type, 'EMENU')
  assert.equal(lastInitOptions.cache.ttl, 600)

  const couponPlugin = await crmIntegrationMarketSDK.getCouponPlugin({
    coupons: [{ id: 'coupon-1' }],
    metas: [{ id: 'meta-1' }],
    allItems: [{ itemId: 'item-1' }],
  })
  const couponRes = await couponPlugin.MarketGetOrderCoupons()
  assert.equal(couponRes.formattedOrder.productLine, 'EMENU')
  assert.equal(lastCouponArgs.coupons[0].id, 'coupon-1')
  assert.equal(lastCouponArgs.metas[0].id, 'meta-1')

  const promotionPlugin = await crmIntegrationMarketSDK.getPromotionPlugin()
  const matchRes = await promotionPlugin.GetItemMatchedCampaign({
    orderItemList: [{ itemId: '1' }],
    promotionList: [{ id: 'promo-1' }],
    orderType: 'DINE_IN',
    appointItemFlag: true,
    merchantId: 'M000020684',
  })
  assert.ok(matchRes instanceof Map)
  assert.equal(lastPromotionMatchArgs.productLine, 'EMENU')
  assert.equal(lastPromotionMatchArgs.channel, null)

  await promotionPlugin.GetItemValidateStatus({
    rules: [{ id: 'rule-1' }],
    metas: [{ id: 'meta-1' }],
    allItems: [{ itemId: 'item-1' }],
  })
  assert.equal(lastPromotionRulesArgs.order.productLine, 'EMENU')

  await promotionPlugin.AddOnItem({
    promotionResult: [{ id: 'result-1' }],
    itemList: [{ itemId: 'item-1' }],
    promotionList: [{ id: 'promo-1' }],
    appointPromotionId: 'promo-1',
    allItems: [{ itemId: 'item-1' }],
  })
  assert.equal(lastPromotionRecommendArgs.needPromotionCodes, true)
  assert.equal(lastPromotionRecommendArgs.order.productLine, 'EMENU')

  await crmIntegrationMarketSDK.unMount()
  assert.equal(destroyCount, 1)

  console.log('crmIntegrationMarketSDK tests passed')
} finally {
  await server.close()
}
```

- [ ] **Step 2: 创建空 service 并确认测试失败**

创建 `src/services/crmIntegrationMarketSDK.js`：

```js
export const CRM_INTEGRATION_MARKET_SDK_SCRIPT_URL =
  'http://localhost:22080/kpos/img/gallery/js/market.js?update=TstNew2'

export async function formatOrderStructure() {
  throw new Error('CRM integration order formatter is not configured')
}

export default {}
```

Run:

```powershell
node scripts\crmIntegrationMarketSDK.test.mjs
```

Expected:
- FAIL，错误应指向 `crmIntegrationMarketSDK.setMerchantId is not a function` 或后续未实现方法。

## Task 2: 实现 SDK 生命周期和 script 加载

**Files:**
- Modify: `src/services/crmIntegrationMarketSDK.js`

- [ ] **Step 1: 实现完整 service**

用以下内容替换 `src/services/crmIntegrationMarketSDK.js`：

```js
import { getStorageValue } from '@/utils/storage'

const LOCAL_MARKET_SDK_SCRIPT_URL =
  'http://localhost:22080/kpos/img/gallery/js/market.js?update=TstNew2'
const MARKET_SDK_SCRIPT_URL = '/kpos/img/gallery/js/market.js?update=TstNew2'

export const CRM_INTEGRATION_MARKET_SDK_SCRIPT_URL =
  typeof window !== 'undefined' &&
  window.location?.hostname?.includes('localhost')
    ? LOCAL_MARKET_SDK_SCRIPT_URL
    : MARKET_SDK_SCRIPT_URL

const DEFAULT_PRODUCT_LINE = 'EMENU'
const DEFAULT_BUSINESS_TYPE = 'EMENU'
const DEFAULT_ENVIRONMENT = 'dev'

let orderFormatter = null
let sdkLoadPromise = null

function getGlobalMarketApi() {
  if (typeof window === 'undefined') return null
  return window.marketAPI || window.MarketSDK || null
}

function loadMarketSDKScript() {
  if (getGlobalMarketApi()) return Promise.resolve(getGlobalMarketApi())
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('CRM integration MarketSDK requires browser document'))
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = CRM_INTEGRATION_MARKET_SDK_SCRIPT_URL
    script.onload = () => {
      const globalMarketApi = getGlobalMarketApi()
      if (!globalMarketApi) {
        reject(new Error('CRM integration MarketSDK global API is missing'))
        return
      }
      resolve(globalMarketApi)
    }
    script.onerror = () => {
      reject(new Error('Failed to load CRM integration MarketSDK script'))
    }
    document.head.appendChild(script)
  }).finally(() => {
    sdkLoadPromise = null
  })

  return sdkLoadPromise
}

export function setCrmIntegrationOrderFormatter(formatter) {
  orderFormatter = formatter
}

export async function formatOrderStructure(options = {}) {
  if (typeof orderFormatter !== 'function') {
    throw new Error('CRM integration order formatter is not configured')
  }
  return orderFormatter(options)
}

class CrmIntegrationMarketSDK {
  constructor() {
    this.api = null
    this.mountPromise = null
    this.merchantId = null
    this.productLine = DEFAULT_PRODUCT_LINE
    this.businessType = DEFAULT_BUSINESS_TYPE
    this.environment = DEFAULT_ENVIRONMENT
  }

  setMerchantId(merchantId) {
    this.merchantId = merchantId
  }

  getMerchantId() {
    return this.merchantId || getStorageValue('emenu_company')?.merchantId || ''
  }

  setOrderFormatter(formatter) {
    setCrmIntegrationOrderFormatter(formatter)
  }

  configure(options = {}) {
    const { productLine, businessType, environment } = options
    if (productLine) this.productLine = productLine
    if (businessType) this.businessType = businessType
    if (environment) this.environment = environment
  }

  createOptions() {
    const merchantId = this.getMerchantId()
    if (!merchantId) {
      throw new Error('Missing CRM integration merchantId for MarketSDK')
    }

    return {
      environment: this.environment,
      cache: {
        ttl: 600,
        prefix: 'promo',
        maxSize: 5000,
      },
      monitor: {
        enabled: false,
      },
      business: {
        type: this.businessType,
        merchantId,
      },
    }
  }

  async createApi() {
    const globalMarketApi = await loadMarketSDKScript()
    this.api = globalMarketApi(this.createOptions())
  }

  async mount() {
    if (this.api) return this.api
    if (this.mountPromise) return this.mountPromise

    this.mountPromise = this.createApi()
      .then(async () => {
        await this.api?.init?.()
        return this.api
      })
      .finally(() => {
        this.mountPromise = null
      })

    return this.mountPromise
  }

  async unMount() {
    if (this.mountPromise) await this.mountPromise
    if (!this.api) return
    await this.api?.destroy?.()
    this.api = null
  }

  async getCouponPlugin({ coupons, metas, extraItems, allItems } = {}) {
    const formattedOrder = await formatOrderStructure({ extraItems, allItems })
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

  async getPromotionPlugin() {
    if (!this.api) await this.mount()
    const promotionService = this.api?.getPromotionPlugin?.()

    return {
      GetItemMatchedCampaign: async ({
        orderItemList,
        promotionList,
        orderType,
        appointItemFlag,
        merchantId,
      }) => {
        return promotionService?.matchItemPromotion?.({
          orderItemList,
          promotionList,
          productLine: this.productLine,
          channel: null,
          orderType,
          appointItemFlag,
          merchantId,
        })
      },
      GetItemValidateStatus: async ({ rules, metas, allItems }) => {
        const formattedOrder = await formatOrderStructure({ allItems })
        return promotionService?.getOrderRules?.(formattedOrder, rules, metas)
      },
      AddOnItem: async ({
        promotionResult,
        itemList,
        promotionList,
        appointPromotionId,
        allItems,
      }) => {
        const order = await formatOrderStructure({ allItems })
        return promotionService?.recommendOrderPromotion?.({
          order,
          promotionResult,
          itemList,
          promotionList,
          appointPromotionId,
          needPromotionCodes: true,
        })
      },
    }
  }
}

const crmIntegrationMarketSDK = new CrmIntegrationMarketSDK()

export default crmIntegrationMarketSDK
```

- [ ] **Step 2: 跑测试确认通过**

Run:

```powershell
node scripts\crmIntegrationMarketSDK.test.mjs
```

Expected:

```text
crmIntegrationMarketSDK tests passed
```

## Task 3: 将 SDK 生命周期接入 integration provider bootstrap

**Files:**
- Modify: `src/crm/providers/integrationCrmProvider.js`
- Modify: `src/App.jsx`
- Test: `scripts/integrationCrmProviderMember.test.mjs`

- [ ] **Step 1: provider 引入 SDK service**

在 `src/crm/providers/integrationCrmProvider.js` 顶部增加：

```js
import crmIntegrationMarketSDK from '@/services/crmIntegrationMarketSDK'
```

- [ ] **Step 2: provider 设置 merchantId 时同步设置 SDK merchantId**

修改：

```js
setMerchantId(merchantId) {
  crmIntegration.setMerchantId(merchantId)
  crmIntegrationMarketSDK.setMerchantId(merchantId)
},
```

- [ ] **Step 3: fetchBootstrapData 中 mount SDK**

在 `fetchBootstrapData` 里获取 rewards/meta 的同时挂载 SDK：

```js
const [rewards, metaData] = await Promise.all([
  crmIntegration.getMerchantReward(),
  crmIntegration.getSDKMeta({ force: true }),
  crmIntegrationMarketSDK.mount(),
])
```

返回值增加：

```js
stopMarketSDK: () => crmIntegrationMarketSDK.unMount(),
```

完整返回：

```js
return {
  rewards: filterEmenuRewards(rewards),
  metaData,
  stopMetaRefresh,
  stopMarketSDK: () => crmIntegrationMarketSDK.unMount(),
}
```

- [ ] **Step 4: App cleanup 同时销毁 SDK**

在 `src/App.jsx` 增加一个 ref：

```js
const stopMarketSDKRef = useRef(null)
```

在 cleanup 中增加：

```js
stopMarketSDKRef.current?.()
stopMarketSDKRef.current = null
```

在 `initIntegrationCrm` 重新初始化前也执行：

```js
stopMarketSDKRef.current?.()
stopMarketSDKRef.current = null
```

bootstrap 成功后：

```js
stopMarketSDKRef.current = data.stopMarketSDK
```

- [ ] **Step 5: 更新 provider 测试 mock**

`scripts/integrationCrmProviderMember.test.mjs` 当前 mock 了 `@/services/crmIntegration`。新增对 `@/services/crmIntegrationMarketSDK` 的 mock，至少包含：

```js
const crmIntegrationMarketSDK = {
  setMerchantId() {},
  mount() {
    return Promise.resolve({})
  },
  unMount() {
    return Promise.resolve()
  },
}
```

Run:

```powershell
node scripts\integrationCrmProviderMember.test.mjs
```

Expected:
- exit code 0。

## Task 4: 验证范围和构建

- [ ] **Step 1: 静态搜索**

Run:

```powershell
rg -n "KIOSK|businessType|market\\.js|window\\.marketAPI|window\\.MarketSDK" src/services/crmIntegrationMarketSDK.js src/crm/providers/integrationCrmProvider.js src/App.jsx
```

Expected:
- `src/services/crmIntegrationMarketSDK.js` 中允许出现 `window.marketAPI`、`window.MarketSDK`、`market.js`。
- 不应出现 `type: 'KIOSK'` 或 `productLine: 'KIOSK'`。

- [ ] **Step 2: 单测**

Run:

```powershell
node scripts\crmIntegrationMarketSDK.test.mjs
node scripts\integrationCrmProviderMember.test.mjs
node scripts\crmIntegrationRewards.test.mjs
```

Expected:
- 全部 exit code 0。

- [ ] **Step 3: ESLint**

Run:

```powershell
yarn eslint src\services\crmIntegrationMarketSDK.js src\crm\providers\integrationCrmProvider.js src\App.jsx scripts\crmIntegrationMarketSDK.test.mjs scripts\integrationCrmProviderMember.test.mjs
```

Expected:
- exit code 0；允许项目已有 Browserslist 提示。

- [ ] **Step 4: Build**

Run:

```powershell
yarn build
```

Expected:
- exit code 0；允许项目已有 Vite、CSS minify、chunk size、非 module script 警告。

## 后续任务边界

本计划完成后，eMenu 只具备：

- SDK script 加载。
- SDK init/destroy 生命周期。
- Coupon plugin 和 Promotion plugin 调用封装。
- provider bootstrap 时挂载 SDK。

本计划不完成：

- eMenu 订单格式转换。
- reward/voucher 点击时调用 `getCouponPlugin` 校验。
- M 件 N 折凑单 UI 和 `recommendOrderPromotion` 结果处理。
- 特价券/赠品券加入购物车后的折扣落点。

这些需要在 SDK 生命周期稳定后单独规划，避免猜 eMenu 订单结构。

## 不提交代码

- 本任务完成后只汇报变更和验证结果。
- 不自动 `git add`、不自动 `git commit`、不自动 `git push`。
