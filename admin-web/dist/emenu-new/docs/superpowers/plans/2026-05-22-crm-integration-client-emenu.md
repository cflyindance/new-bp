# CRM Integration Client for eMenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 kiosk 的 `crm-integration.js` 新 CRM 接口方案转换为 eMenu 可用的接口 client，并为 provider 层接入会员登录、资产、reward、meta 刷新做好边界。

**Architecture:** 新建 eMenu 专用 `crmIntegration` service，复用 eMenu 的 `request`、`serverUrl`、`emenu_company.merchantId`。Token 由 POS 本地接口获取并内存缓存，带并发锁和过期前刷新；SDK meta 由 POS 本地接口获取，内存缓存 30 分钟，并提供启动/停止 30 分钟后台刷新能力。业务层后续只通过 `integrationCrmProvider` 调用该 service，不直接在 UI 中拼接口。

**Tech Stack:** React 17、Vite 2、axios request wrapper、Redux Toolkit、react-hooks-global-state。

---

## 强制执行规则

- 不得自动执行 `git commit`、`git push`、创建 PR 或发布操作。
- 本计划中所有 `Commit` 步骤只表示“可以提交的检查点”，不是自动执行指令。
- 每个任务完成后必须先汇报变更、验证结果和当前 `git status`，等待用户明确要求后才允许提交。
- 不删除 Avocado 文件；删除必须另列清单并获得用户明确确认。
- Provider 类型仍然只允许 `none | legacy | integration`；新 CRM 的兼容数字仍为 `crmType === 3`，不复用旧 Avocado 的 `crmType === 2`。
- 不暗猜后端字段；本计划只使用 kiosk 参考实现中已经出现的接口和字段。

---

## 当前执行状态

- 已完成 Task 1：`src/services/crmIntegration.js` 已新增。
- 已完成最小接入链路：`integrationCrmProvider`、`providerRegistry`、`crmProviderSlice`、`App.jsx` 初始化。
- 当前最小接入只负责获取 `merchant reward` 和 `SDK meta`，并启动 30 分钟 meta refresh。
- 当前尚未接入会员登录、会员资产适配、兑换菜、折扣、核销。
- 当前未实现未知 token 失效响应识别；只按 `expiredTime` 刷新 token。
- 当前未执行任何 `git commit`。

---

## 已确认的接口来源

参考文件：`D:/MenusifuStore/kiosklite/src/api/crm-integration.js`

已确认接口：

- Token：`${serverURL}api/crmToken/getToken`
- 查询客户：`${cloudHost}/integration/customers/search`
- 查询客户资产：`${cloudHost}/integration/promotion/assets`
- 查询客户详情：`${cloudHost}/integration/customers/get`
- 创建客户：`${cloudHost}/integration/customers/create`
- 查询商户 reward：`${cloudHost}/integration/promotion/reward`
- 查询 SDK meta：`${serverURL}api/promotion/runtime/couponTemplate/querySdkMetas`

eMenu 对应基础地址：

- POS 本地接口使用 `src/utils/env_var.js` 的 `serverUrl`。
- Cloud host 使用 `import.meta.env.VITE_ENV`：
  - `development` -> `https://cloud.menusifudev.com/api/crm-integration`
  - `production` -> `https://cloud.menusifucloud.com/api/crm-integration`
  - `test` / `integration` -> `https://cloud.menusifucloudqa.com/api/crm-integration`

需要用户确认的业务常量：

- 创建新客户的 `channelCode` 建议使用 `EMENU`。kiosk 参考实现使用 `KIOSK`，eMenu 不应直接复用。

---

## 文件结构

新增文件：

- `src/services/crmIntegration.js`：eMenu 新 CRM integration API client，负责 host、token、merchantId、meta 缓存刷新、基础接口调用。
- `src/crm/adapters/integrationMemberAdapter.js`：把新 CRM customer + assets 规范化为 eMenu 当前 `memberInfo` 可消费的结构。

后续修改文件：

- `src/crm/providers/integrationCrmProvider.js`：通过 `crmIntegration` service 实现 provider 方法。
- `src/store/slices/crmProvider.slice.js`：增加 `metaData`、`rewards`、`vouchers`、`metaUpdatedAt` 等新 CRM 状态。
- `src/App.jsx`：在 `crmProvider === integration` 时初始化新 CRM provider，并在卸载或 provider 切换时停止 meta timer。

---

### Task 1: 新建 eMenu CRM Integration API client

**Files:**

- Create: `src/services/crmIntegration.js`

- [x] **Step 1: 创建 client 常量与响应解析**

Create `src/services/crmIntegration.js`:

```js
import request from '@/utils/request'
import { serverUrl } from '@/utils/env_var'
import { getStorageValue } from '@/utils/storage'

export const CRM_INTEGRATION_META_REFRESH_INTERVAL = 30 * 60 * 1000
const TOKEN_REFRESH_BUFFER = 60 * 1000
const DEFAULT_CHANNEL_CODE = 'EMENU'

const apiMap = {
  development: 'https://cloud.menusifudev.com/api/crm-integration',
  production: 'https://cloud.menusifucloud.com/api/crm-integration',
  test: 'https://cloud.menusifucloudqa.com/api/crm-integration',
  integration: 'https://cloud.menusifucloudqa.com/api/crm-integration',
}

function getHost() {
  const host = apiMap[import.meta.env.VITE_ENV]

  if (!host) {
    throw new Error(
      `Unsupported CRM integration environment: ${import.meta.env.VITE_ENV}`
    )
  }

  return host
}

function unwrapResponseData(response) {
  if (response?.data?.data !== undefined) return response.data.data
  if (response?.data !== undefined) return response.data
  return response
}

```

- [x] **Step 2: 实现 token 获取、缓存、并发刷新锁**

Append to `src/services/crmIntegration.js`:

```js
class CRMIntegrationClient {
  constructor() {
    this.token = null
    this.tokenExpireAt = 0
    this.refreshTokenPromise = null
    this.merchantId = null
    this.metaData = null
    this.metaFetchedAt = 0
    this.metaRefreshTimer = null
  }

  setMerchantId(merchantId) {
    this.merchantId = merchantId
  }

  getMerchantId() {
    return this.merchantId || getStorageValue('emenu_company')?.merchantId || ''
  }

  clearToken() {
    this.token = null
    this.tokenExpireAt = 0
  }

  isTokenValid() {
    return (
      this.token &&
      this.tokenExpireAt &&
      Date.now() < Number(this.tokenExpireAt) - TOKEN_REFRESH_BUFFER
    )
  }

  async refreshToken() {
    if (this.refreshTokenPromise) return this.refreshTokenPromise

    this.refreshTokenPromise = request({
      url: `${serverUrl}api/crmToken/getToken`,
      method: 'get',
    })
      .then((response) => {
        const data = unwrapResponseData(response)
        const token = data?.token
        const expiredTime = Number(data?.expiredTime || 0)

        if (!token || !expiredTime) {
          throw new Error('Failed to refresh CRM integration token')
        }

        this.token = token
        this.tokenExpireAt = expiredTime
        return token
      })
      .finally(() => {
        this.refreshTokenPromise = null
      })

    return this.refreshTokenPromise
  }

  async getValidToken(options = {}) {
    const { force = false } = options
    if (!force && this.isTokenValid()) return this.token
    return this.refreshToken()
  }
```

- [x] **Step 3: 实现带 token header 的请求封装**

Append inside `CRMIntegrationClient`:

```js
  getAuthHeaders(token) {
    const merchantId = this.getMerchantId()

    if (!merchantId) {
      throw new Error('Missing CRM integration merchantId')
    }

    return {
      'x-api-token': token,
      'x-merchant-id': merchantId,
    }
  }

  async requestWithToken(config) {
    const token = await this.getValidToken()
    const requestConfig = {
      ...config,
      headers: {
        ...(config.headers || {}),
        ...this.getAuthHeaders(token),
      },
    }

    const response = await request(requestConfig)
    return unwrapResponseData(response)
  }
```

- [x] **Step 4: 实现 kiosk 已确认的新 CRM 接口**

Append inside `CRMIntegrationClient`:

```js
  searchCustomers(params) {
    return this.requestWithToken({
      url: `${getHost()}/integration/customers/search`,
      method: 'get',
      params,
      data: {},
    })
  }

  getCustomerAssets(customerId) {
    return this.requestWithToken({
      url: `${getHost()}/integration/promotion/assets`,
      method: 'get',
      params: { customerId },
      data: {},
    })
  }

  getCustomerInfo(id) {
    return this.requestWithToken({
      url: `${getHost()}/integration/customers/get`,
      method: 'get',
      params: { id },
      data: {},
    })
  }

  createNewCustomer(data) {
    return this.requestWithToken({
      url: `${getHost()}/integration/customers/create`,
      method: 'post',
      data: {
        channelCode: DEFAULT_CHANNEL_CODE,
        ...data,
      },
    })
  }

  getMerchantReward() {
    return this.requestWithToken({
      url: `${getHost()}/integration/promotion/reward`,
      method: 'get',
      data: {},
    })
  }
```

- [x] **Step 5: 实现 30 分钟 meta 缓存与刷新 timer**

Append inside `CRMIntegrationClient`:

```js
  isMetaFresh() {
    return (
      this.metaData &&
      this.metaFetchedAt &&
      Date.now() - this.metaFetchedAt < CRM_INTEGRATION_META_REFRESH_INTERVAL
    )
  }

  async refreshSDKMeta() {
    const response = await request({
      url: `${serverUrl}api/promotion/runtime/couponTemplate/querySdkMetas`,
      method: 'get',
      data: {},
      headers: {},
    })
    const metaData = unwrapResponseData(response)
    this.metaData = metaData
    this.metaFetchedAt = Date.now()
    return metaData
  }

  async getSDKMeta(options = {}) {
    const { force = false } = options
    if (!force && this.isMetaFresh()) return this.metaData
    return this.refreshSDKMeta()
  }

  startMetaRefresh(onMeta, onError) {
    this.stopMetaRefresh()

    const refresh = async () => {
      try {
        const metaData = await this.getSDKMeta({ force: true })
        onMeta?.(metaData)
        return metaData
      } catch (error) {
        onError?.(error)
        return null
      }
    }

    refresh()
    this.metaRefreshTimer = window.setInterval(
      refresh,
      CRM_INTEGRATION_META_REFRESH_INTERVAL
    )

    return () => this.stopMetaRefresh()
  }

  stopMetaRefresh() {
    if (this.metaRefreshTimer) {
      window.clearInterval(this.metaRefreshTimer)
      this.metaRefreshTimer = null
    }
  }
}

const crmIntegration = new CRMIntegrationClient()

export default crmIntegration
```

- [x] **Step 6: 验证接口 client 不依赖 Avocado**

Run:

```bash
rg -n "avocado|advocado|ADVOCADO|crmType === 2|KIOSK" src/services/crmIntegration.js
```

Expected: no output except no output at all. If `KIOSK` appears, it means错误复用了 kiosk 的 `channelCode`。

- [x] **Step 7: 验证构建**

Run:

```bash
yarn build
```

Expected: build succeeds, or only fails on pre-existing unrelated issues.

- [ ] **Step 8: Commit checkpoint**

```bash
git add src/services/crmIntegration.js
git commit -m "feat: add crm integration client"
```

Do not run this commit command unless the user explicitly asks to commit.

---

### Task 2: 新 CRM member 数据适配

**Files:**

- Create: `src/crm/adapters/integrationMemberAdapter.js`

- [ ] **Step 1: 创建 customer + assets 到 eMenu memberInfo 的适配器**

Create `src/crm/adapters/integrationMemberAdapter.js`:

```js
export function normalizeIntegrationMember(customerInfo = {}, assets = {}) {
  const customerId = customerInfo.id || customerInfo.userId
  const pointBalance = assets?.loyaltyAccount?.pointBalance || 0
  const vouchers = assets?.vouchers || []

  return {
    ...customerInfo,
    userId: customerId,
    pointBalance,
    vouchers,
    giftVoucher: vouchers,
    campaignBalances: customerInfo.campaignBalances || [],
  }
}
```

- [ ] **Step 2: 验证适配器不猜测复杂字段**

Run:

```bash
rg -n "membershipTier|campaignBalances: \\[\\{|couponTemplate|MarketSDK|marketAPI" src/crm/adapters/integrationMemberAdapter.js
```

Expected: no output. 当前阶段只适配 kiosk 参考中已确认的 `id`、`loyaltyAccount.pointBalance`、`vouchers`。

- [ ] **Step 3: Commit checkpoint**

```bash
git add src/crm/adapters/integrationMemberAdapter.js
git commit -m "feat: normalize crm integration member"
```

Do not run this commit command unless the user explicitly asks to commit.

---

### Task 3: 将 integration provider 接到新 client

**Files:**

- Modify: `src/crm/providers/integrationCrmProvider.js`

- [ ] **Step 1: 引入新 client 和 member adapter**

Modify `src/crm/providers/integrationCrmProvider.js`:

```js
import { CRM_PROVIDER } from '@/crm/providerType'
import crmIntegration from '@/services/crmIntegration'
import { normalizeIntegrationMember } from '@/crm/adapters/integrationMemberAdapter'
```

- [ ] **Step 2: 实现 provider 登录和初始化方法**

Replace the provider body with:

```js
export const integrationCrmProvider = {
  id: CRM_PROVIDER.INTEGRATION,
  capabilities: {
    memberLogin: true,
    memberPrivilege: false,
    redeemItems: true,
    discountRules: true,
    redemptionCommit: false,
  },
  setMerchantId(merchantId) {
    crmIntegration.setMerchantId(merchantId)
  },
  async fetchBootstrapData(options = {}) {
    const { onMeta, onError } = options
    const [rewards, metaData] = await Promise.all([
      crmIntegration.getMerchantReward(),
      crmIntegration.getSDKMeta({ force: true }),
    ])

    const stopMetaRefresh = crmIntegration.startMetaRefresh(onMeta, onError)

    return {
      rewards,
      metaData,
      stopMetaRefresh,
      pointRules: [],
      rewardRules: [],
      privileges: [],
      allMenu: null,
      campaigns: [],
      redeemItems: [],
      discountRules: [],
    }
  },
  async searchMemberByPhone(phone) {
    const customers = await crmIntegration.searchCustomers({
      areaCode: 1,
      phone,
    })

    return Array.isArray(customers) && customers.length > 0
      ? customers[0]
      : null
  },
  async createMember(phone) {
    return crmIntegration.createNewCustomer({
      areaCode: 1,
      phone,
      channelCode: 'EMENU',
    })
  },
  async getMemberById(userId) {
    const customerInfo = await crmIntegration.getCustomerInfo(userId)
    const customerId = customerInfo?.id || userId
    const assets = await crmIntegration.getCustomerAssets(customerId)
    return normalizeIntegrationMember(customerInfo, assets)
  },
  async prepareRedemption() {
    return null
  },
  async commitRedemption() {
    return null
  },
}
```

- [ ] **Step 3: 验证 provider 不再是空壳**

Run:

```bash
rg -n "not connected|memberLogin: false|CRM integration member login service is not connected" src/crm/providers/integrationCrmProvider.js
```

Expected: no output.

- [ ] **Step 4: Commit checkpoint**

```bash
git add src/crm/providers/integrationCrmProvider.js
git commit -m "feat: connect integration crm provider"
```

Do not run this commit command unless the user explicitly asks to commit.

---

### Task 4: 在 App 初始化时启动并清理 meta refresh

**Files:**

- Modify: `src/store/slices/crmProvider.slice.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: 给 provider slice 增加 meta 状态**

Add fields to `initialState` in `src/store/slices/crmProvider.slice.js`:

```js
rewards: [],
metaData: null,
metaUpdatedAt: 0,
```

Add reducers:

```js
setIntegrationRewards(state, action) {
  state.rewards = action.payload || []
},
setIntegrationMeta(state, action) {
  state.metaData = action.payload || null
  state.metaUpdatedAt = Date.now()
},
```

- [ ] **Step 2: App 初始化 integration provider 时设置 merchantId 并启动 meta refresh**

In `src/App.jsx`, when `crmProvider === CRM_PROVIDER.INTEGRATION`, call provider bootstrap with callbacks:

```js
const companyInfo = getStorageValue('emenu_company')
provider.setMerchantId?.(companyInfo?.merchantId)
const data = await provider.fetchBootstrapData({
  onMeta: (metaData) => {
    dispatch(crmProviderActions.setIntegrationMeta(metaData))
  },
  onError: (error) => {
    console.warn(error?.message || error)
  },
})
dispatch(crmProviderActions.setIntegrationRewards(data.rewards || []))
dispatch(crmProviderActions.setIntegrationMeta(data.metaData))
```

Keep `data.stopMetaRefresh` in a ref and call it in the effect cleanup before provider changes or App unmounts.

- [ ] **Step 3: 验证 meta refresh 有清理路径**

Run:

```bash
rg -n "stopMetaRefresh|setIntegrationMeta|setIntegrationRewards" src/App.jsx src/store/slices/crmProvider.slice.js
```

Expected: all three names appear.

- [ ] **Step 4: Commit checkpoint**

```bash
git add src/App.jsx src/store/slices/crmProvider.slice.js
git commit -m "feat: bootstrap crm integration meta"
```

Do not run this commit command unless the user explicitly asks to commit.

---

## 验证清单

- `rg -n "KIOSK|crmType === 2|ADVOCADO_SERVICE_ENABLED" src/services/crmIntegration.js src/crm/providers/integrationCrmProvider.js` 没有输出。
- `yarn build` 通过，或只存在实施前已经确认的无关错误。
- 新 CRM 开启时会请求 token，再请求 merchant reward 和 SDK meta。
- SDK meta 初次加载后每 30 分钟刷新一次，provider 切换或 App 卸载时停止 timer。
- Token 未过期时复用；过期前 60 秒刷新；并发请求只触发一次 refreshToken。
- 当前不识别未知 token 失效响应格式；后端明确返回结构后再补精确处理。
- 传统 CRM 行为不变，Avocado 逻辑不在本计划中删除。

## 自检结果

- 规格覆盖：覆盖了 kiosk 参考接口、eMenu host 映射、30 分钟 meta 刷新、token 缓存/刷新、merchantId header。
- 范围控制：没有接入 MarketSDK、没有实现 coupon/promotion 计算、没有删除 Avocado 文件。
- 风险点：`channelCode: 'EMENU'` 需要用户确认；后端 token 强制失效时的响应结构未在参考实现中出现，需要拿到真实接口约定后再补精确处理。
