# CRM Provider Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立通用 CRM provider 层，移除 Avocado 运行链路，为传统 CRM 与新 CRM 共存提供清晰边界。

**Architecture:** 用 `none | legacy | integration` 替代原来的 `0 | 1 | 2` CRM 类型；所有页面、菜单、购物车、订单回显只依赖 provider 契约，不再直接读取 Avocado slice 或 Avocado 字段。第一阶段不实现新 CRM 真实接口字段映射；新 CRM API 文档可用后，基于本 provider 契约单独编写接口映射计划。

**Tech Stack:** React 17、Vite 2、Redux Toolkit、react-hooks-global-state、ahooks、axios、lodash-es、dayjs。

---

## 强制执行规则

- 不得自动执行 `git commit`、`git push`、创建 PR 或发布操作。
- 本计划中所有 `Commit` 步骤只表示“可以提交的检查点”，不是自动执行指令。
- 每个任务完成后，执行者必须先停下汇报变更、验证结果和当前 `git status`。
- 只有在用户明确回复要求提交后，才允许执行 `git commit`。
- 如需删除 Avocado 相关废弃文件，必须先列出删除清单并获得用户明确确认。
- Provider 层只定义 `none | legacy | integration`，不定义 Avocado provider。
- 兼容期不得复用旧 `crmType === 2` 表示新 CRM；新 CRM 的兼容数字使用 `crmType === 3`，业务判断优先使用 `crmProvider === 'integration'`。

---

## 范围

本计划覆盖：

- 替换 CRM 类型判断：`CRM_INTEGRATION_SERVICE_ENABLED > POS_CRM_SERVICE_ENABLED / CRM_SERVICE_ENABLED > none`。
- 新建 provider 契约：`legacy` 与 `integration`。
- 从运行链路中移除 Avocado 判断、Avocado Redux 状态、Avocado 菜单注入、Avocado transaction commit。
- 保留传统 CRM 现有行为。
- 为新 CRM 留出清晰接入点，但不猜测新 CRM 网络接口 URL、字段、核销协议。

本计划不覆盖：

- 新 CRM 真实登录接口。
- 新 CRM 活动、积分、券、核销接口字段映射。
- 新 CRM 与 POS 后端的协议定义。

这些内容需要在新 CRM API 文档确认后单独制定计划。

## 文件结构

新增文件：

- `src/crm/providerType.js`：CRM provider 类型、配置开关解析。
- `src/crm/providerRegistry.js`：按 provider 类型返回 provider 实例。
- `src/crm/index.js`：统一导出 provider API。
- `src/crm/providers/legacyCrmProvider.js`：传统 CRM provider 外壳，复用现有传统 CRM service。
- `src/crm/providers/integrationCrmProvider.js`：新 CRM provider 外壳，第一阶段只返回受控空数据。
- `src/crm/adapters/rewardRuleAdapter.js`：统一兑换菜与折扣规则的内部结构。
- `src/crm/redemption/redemptionLifecycle.js`：统一兑换生命周期。
- `src/store/slices/crmProvider.slice.js`：通用 CRM provider 相关 Redux 状态。

修改文件：

- `src/services/crm.js`：移除 `ADVOCADO_SERVICE_ENABLED` 判断，导出 provider 类型判断。
- `src/hooks/useIsMemberLogin.js`：返回 `crmProvider`，保留兼容字段。
- `src/App.jsx`：用 provider 初始化分支替代 `crmType === 2`。
- `src/store/index.js`：注册 `crmProviderSlice`，迁移完成后移除 `avocadoSlice`。
- `src/components/CRMLogin/index.jsx`：会员 ID 回查走 provider。
- `src/components/CRMLogin/LoginContent.jsx`：登录分支走 provider。
- `src/components/CRMLogin/MemberInfo.jsx`：会员信息展示走统一 member 模型。
- `src/pages/Order/Order.jsx`：菜单兑换注入走 provider 数据。
- `src/pages/Order/components/emenuProOrder/index.jsx`：Pro 菜单兑换注入走 provider 数据。
- `src/components/DishItemCard/index.jsx`：移除 `isAvocadoCampaign` 特殊组件入口。
- `src/components/CrmDiscount/index.jsx`：折扣规则走统一 provider 数据。
- `src/components/ShoppingCart/PendingOrders.jsx`：下单前兑换准备与下单后兑换确认走 lifecycle。
- `src/hooks/useSendDiscountOrder.js`：整单折扣兑换走 lifecycle。
- `src/hooks/useFetchOrder.js`：订单回显不再传 Avocado campaign 列表。
- `src/services/orders.js`：用 `providerId` 解析 reward，不再判断 `isAvocadoCampaign`。
- `src/hooks/useGlobalState.js`：移除 `avocadoItemVoucher` 使用点后清理状态。
- `src/utils/request.js`：移除 `/advocado` 特殊响应分支。
- `src/pages/Order/components/OrderListWrapper.jsx`：移除 Avocado 固定分类名。

删除候选文件：

- `src/services/avocado.js`
- `src/store/slices/avocado.slice.js`
- `src/components/AvocadoVoucherItem/index.jsx`
- `src/components/AvocadoVoucherItem/index.module.less`
- `src/components/AvocadoVoucherDialog/index.jsx`
- `src/components/AvocadoVoucherDialog/index.module.less`
- `src/utils/resolveAvocadoSku.js`
- `src/utils/resolveAvocadoDiscount.js`
- `src/hooks/useMultiCommitTransaction.js`

删除文件必须在实施时单独获得用户确认。

---

### Task 1: 新建 CRM provider 类型解析

**Files:**

- Create: `src/crm/providerType.js`
- Modify: `src/services/crm.js`
- Modify: `src/hooks/useIsMemberLogin.js`

- [ ] **Step 1: 创建 provider 类型文件**

Create `src/crm/providerType.js`:

```js
export const CRM_PROVIDER = Object.freeze({
  NONE: 'none',
  LEGACY: 'legacy',
  INTEGRATION: 'integration',
})

export const CRM_CONFIG = Object.freeze({
  LEGACY_POS: 'POS_CRM_SERVICE_ENABLED',
  LEGACY_CRM: 'CRM_SERVICE_ENABLED',
  INTEGRATION: 'CRM_INTEGRATION_SERVICE_ENABLED',
})

export function isConfigEnabled(systemInfo = [], configName) {
  return systemInfo.find((config) => config.name === configName)?.value === 'true'
}

export function resolveCrmProviderType(systemInfo = []) {
  const isLegacyEnabled =
    isConfigEnabled(systemInfo, CRM_CONFIG.LEGACY_POS) ||
    isConfigEnabled(systemInfo, CRM_CONFIG.LEGACY_CRM)
  const isIntegrationEnabled = isConfigEnabled(
    systemInfo,
    CRM_CONFIG.INTEGRATION
  )

  if (isIntegrationEnabled) return CRM_PROVIDER.INTEGRATION
  if (isLegacyEnabled) return CRM_PROVIDER.LEGACY
  return CRM_PROVIDER.NONE
}

export function isCrmEnabled(systemInfo = []) {
  return resolveCrmProviderType(systemInfo) !== CRM_PROVIDER.NONE
}
```

- [ ] **Step 2: 更新传统 CRM service 的状态判断**

Modify `src/services/crm.js`:

```js
import request from '@/utils/request'
import { isCrmEnabled, resolveCrmProviderType } from '@/crm/providerType'

export const checkCRMStatus = (allSysConfig) => {
  return isCrmEnabled(allSysConfig)
}

export const getCRMProviderType = (allSysConfig) => {
  return resolveCrmProviderType(allSysConfig)
}
```

保留文件中已有的传统 CRM 网络方法：`getAuthCode`、`verifyAuthCode`、`searchCRMMember`、`createCRMMember`、`getCRMMemberInfo`、`searchPrivileges`、`getPointRule`、`getAllMenu`、`searchRewardRule`。

- [ ] **Step 3: 更新登录状态 hook**

Modify `src/hooks/useIsMemberLogin.js`:

```js
import { useGlobalState } from '@/hooks/useGlobalState'
import { useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { checkCRMStatus, getCRMProviderType } from '@/services/crm'
import { CRM_PROVIDER } from '@/crm/providerType'

const useIsMemberLogin = () => {
  const [memberInfo] = useGlobalState('memberInfo')
  const [systemInfo] = useLocalStorage('emenu_system', [])
  const crmStatus = checkCRMStatus(systemInfo)

  const crmProvider = useMemo(() => {
    return getCRMProviderType(systemInfo)
  }, [systemInfo])

  const crmType = useMemo(() => {
    if (crmProvider === CRM_PROVIDER.LEGACY) return 1
    if (crmProvider === CRM_PROVIDER.INTEGRATION) return 3
    return 0
  }, [crmProvider])

  const isLogin = useMemo(() => {
    return Object.keys(memberInfo).length > 0
  }, [memberInfo])

  const isHideBar = useMemo(() => {
    return isLogin || !crmStatus
  }, [isLogin, crmStatus])

  return { isLogin, crmStatus, isHideBar, crmType, crmProvider }
}

export default useIsMemberLogin
```

- [ ] **Step 4: 验证 provider 类型解析无 Avocado 配置依赖**

Run:

```bash
rg -n "crmProvider === CRM_PROVIDER.INTEGRATION\\) return 2|crmType === 2.*integration" src/services/crm.js src/hooks/useIsMemberLogin.js src/crm/providerType.js
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/crm/providerType.js src/services/crm.js src/hooks/useIsMemberLogin.js
git commit -m "refactor: add crm provider type resolution"
```

---

### Task 2: 新建 provider registry 和 provider 外壳

**Files:**

- Create: `src/crm/providerRegistry.js`
- Create: `src/crm/index.js`
- Create: `src/crm/providers/legacyCrmProvider.js`
- Create: `src/crm/providers/integrationCrmProvider.js`

- [ ] **Step 1: 创建传统 CRM provider**

Create `src/crm/providers/legacyCrmProvider.js`:

```js
import { CRM_PROVIDER } from '@/crm/providerType'
import {
  createCRMMember,
  getAllMenu,
  getCRMMemberInfo,
  getPointRule,
  searchCRMMember,
  searchPrivileges,
  searchRewardRule,
} from '@/services/crm'

export const legacyCrmProvider = {
  id: CRM_PROVIDER.LEGACY,
  capabilities: {
    memberLogin: true,
    memberPrivilege: true,
    redeemItems: true,
    discountRules: true,
    redemptionCommit: false,
  },
  async fetchBootstrapData() {
    const [pointRules, rewardRules, privileges, allMenu] = await Promise.all([
      getPointRule(),
      searchRewardRule(),
      searchPrivileges(),
      getAllMenu(),
    ])

    return {
      pointRules,
      rewardRules,
      privileges,
      allMenu,
    }
  },
  async searchMemberByPhone(phone) {
    const res = await searchCRMMember({
      pageNo: 1,
      pageSize: 15,
      searchField: 'phone',
      searchKey: phone,
    })

    return res?.total > 0 ? res.data?.[0] : null
  },
  async createMember(phone) {
    return createCRMMember({
      firstname: '',
      lastname: '',
      phone,
      email: '',
    })
  },
  async getMemberById(userId) {
    return getCRMMemberInfo(userId)
  },
  async prepareRedemption() {
    return null
  },
  async commitRedemption() {
    return null
  },
}
```

- [ ] **Step 2: 创建新 CRM provider 外壳**

Create `src/crm/providers/integrationCrmProvider.js`:

```js
import { CRM_PROVIDER } from '@/crm/providerType'

export const integrationCrmProvider = {
  id: CRM_PROVIDER.INTEGRATION,
  capabilities: {
    memberLogin: false,
    memberPrivilege: false,
    redeemItems: false,
    discountRules: false,
    redemptionCommit: false,
  },
  async fetchBootstrapData() {
    return {
      pointRules: [],
      rewardRules: [],
      privileges: [],
      allMenu: null,
      campaigns: [],
    }
  },
  async searchMemberByPhone() {
    throw new Error('CRM integration member login service is not connected')
  },
  async createMember() {
    throw new Error('CRM integration member creation service is not connected')
  },
  async getMemberById() {
    throw new Error('CRM integration member lookup service is not connected')
  },
  async prepareRedemption() {
    return null
  },
  async commitRedemption() {
    return null
  },
}
```

- [ ] **Step 3: 创建 provider registry**

Create `src/crm/providerRegistry.js`:

```js
import { CRM_PROVIDER } from '@/crm/providerType'
import { legacyCrmProvider } from '@/crm/providers/legacyCrmProvider'
import { integrationCrmProvider } from '@/crm/providers/integrationCrmProvider'

const providerMap = {
  [CRM_PROVIDER.LEGACY]: legacyCrmProvider,
  [CRM_PROVIDER.INTEGRATION]: integrationCrmProvider,
}

export function getCrmProvider(providerType) {
  return providerMap[providerType] || null
}
```

- [ ] **Step 4: 创建统一导出入口**

Create `src/crm/index.js`:

```js
export { CRM_PROVIDER, resolveCrmProviderType } from './providerType'
export { getCrmProvider } from './providerRegistry'
```

- [ ] **Step 5: 验证 registry 可被 alias 解析**

Run:

```bash
yarn build
```

Expected: build succeeds or fails only on files not touched by this task. If alias `@/crm` cannot resolve, fix import paths before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/crm
git commit -m "refactor: add crm provider registry"
```

---

### Task 3: 新建通用 CRM provider Redux 状态

**Files:**

- Create: `src/store/slices/crmProvider.slice.js`
- Modify: `src/store/index.js`

- [ ] **Step 1: 创建通用 CRM provider slice**

Create `src/store/slices/crmProvider.slice.js`:

```js
import { createSlice } from '@reduxjs/toolkit'
import { CRM_PROVIDER } from '@/crm/providerType'

export const crmProviderSlice = createSlice({
  name: 'crmProviderSlice',
  initialState: {
    providerType: CRM_PROVIDER.NONE,
    bootstrapStatus: 'idle',
    bootstrapError: '',
    rewardRules: [],
    pointRules: [],
    privileges: [],
    allMenu: null,
    campaigns: [],
    redeemItems: [],
    discountRules: [],
  },
  reducers: {
    setProviderType(state, action) {
      state.providerType = action.payload
    },
    setBootstrapLoading(state) {
      state.bootstrapStatus = 'loading'
      state.bootstrapError = ''
    },
    setBootstrapData(state, action) {
      state.bootstrapStatus = 'success'
      state.bootstrapError = ''
      state.rewardRules = action.payload.rewardRules || []
      state.pointRules = action.payload.pointRules || []
      state.privileges = action.payload.privileges || []
      state.allMenu = action.payload.allMenu || null
      state.campaigns = action.payload.campaigns || []
      state.redeemItems = action.payload.redeemItems || []
      state.discountRules = action.payload.discountRules || []
    },
    setBootstrapError(state, action) {
      state.bootstrapStatus = 'error'
      state.bootstrapError = action.payload || ''
    },
  },
})

export default crmProviderSlice.reducer
export const actions = crmProviderSlice.actions
```

- [ ] **Step 2: 注册新 slice，暂时保留 avocadoSlice**

Modify `src/store/index.js`:

```js
import { configureStore } from '@reduxjs/toolkit'
import systemConfigSlice from './slices/systemConfig.slice'
import avocadoSlice from './slices/avocado.slice'
import system from './slices/system.slice'
import crmProviderSlice from './slices/crmProvider.slice'

export default configureStore({
  reducer: { systemConfigSlice, avocadoSlice, system, crmProviderSlice },
})
```

- [ ] **Step 3: 验证 Redux 注册**

Run:

```bash
yarn build
```

Expected: build succeeds or fails only on pre-existing unrelated issues.

- [ ] **Step 4: Commit**

```bash
git add src/store/index.js src/store/slices/crmProvider.slice.js
git commit -m "refactor: add crm provider store"
```

---

### Task 4: 迁移 App 启动初始化

**Files:**

- Modify: `src/App.jsx`

- [ ] **Step 1: 替换 Avocado 初始化 import**

Modify `src/App.jsx` imports:

```js
import { getCrmProvider, CRM_PROVIDER } from '@/crm'
import { actions as crmProviderActions } from '@/store/slices/crmProvider.slice'
```

Remove:

```js
import { effects as adEffects } from '@/store/slices/avocado.slice'
```

- [ ] **Step 2: 新增 provider bootstrap 函数**

Add inside `App` component:

```js
const bootstrapCrmProvider = async () => {
  const provider = getCrmProvider(crmProvider)
  dispatch(crmProviderActions.setProviderType(crmProvider))

  if (!provider) return

  dispatch(crmProviderActions.setBootstrapLoading())
  try {
    const data = await provider.fetchBootstrapData()
    dispatch(crmProviderActions.setBootstrapData(data))
  } catch (e) {
    dispatch(crmProviderActions.setBootstrapError(e?.message || String(e)))
  }
}
```

- [ ] **Step 3: 替换原 crmType 初始化分支**

Replace the existing CRM initialization effect with:

```js
useEffect(() => {
  if (!crmStatus || crmProvider === CRM_PROVIDER.NONE) return

  if (crmProvider === CRM_PROVIDER.LEGACY) {
    getRewardRule()
    handleGetPointRule()
    initPrivileges()
    initPrivilegeItem()
    return
  }

  bootstrapCrmProvider()
}, [crmStatus, crmProvider])
```

- [ ] **Step 4: 验证 App 不再触发 Avocado effects**

Run:

```bash
rg -n "adEffects|fetchMerchantCampaignList|crmType === 2" src/App.jsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: bootstrap crm provider from app"
```

---

### Task 5: 迁移会员登录和会员信息展示

**Files:**

- Modify: `src/components/CRMLogin/index.jsx`
- Modify: `src/components/CRMLogin/LoginContent.jsx`
- Modify: `src/components/CRMLogin/MemberInfo.jsx`

- [ ] **Step 1: CRMLogin 按 provider 回查会员**

In `src/components/CRMLogin/index.jsx`, replace Avocado member lookup imports with:

```js
import { getCrmProvider } from '@/crm'
```

Update `fetchCRMMemberInfo`:

```js
const fetchCRMMemberInfo = useMemoizedFn(async (userId) => {
  try {
    const provider = getCrmProvider(crmProvider)
    if (!provider) return

    const res = await provider.getMemberById(userId)
    if (res && Object.keys(res)?.length > 0) {
      setMemberInfo(res)
    }
  } catch (e) {
    throw new Error(e)
  } finally {
    setLoading(false)
  }
})
```

Use `const { crmProvider } = useIsMemberLogin()` in the component.

- [ ] **Step 2: LoginContent 移除 Avocado 登录分支**

In `src/components/CRMLogin/LoginContent.jsx`, replace Avocado imports with:

```js
import { getCrmProvider, CRM_PROVIDER } from '@/crm'
```

Use:

```js
const { crmProvider } = useIsMemberLogin()
```

Add:

```js
const getActiveProvider = () => getCrmProvider(crmProvider)
```

Replace the old Avocado branch in `onVerifySuccess` with:

```js
if (crmProvider === CRM_PROVIDER.INTEGRATION) {
  const provider = getActiveProvider()
  if (!provider?.capabilities.memberLogin) {
    Toast.error(t('crm.loginUnavailable'))
    return
  }
}
```

Keep the existing traditional CRM branch unchanged for `CRM_PROVIDER.LEGACY`.

- [ ] **Step 3: Add login unavailable copy**

Add key to every locale file under `src/locales/*.json` in the `crm` object:

```json
"loginUnavailable": "Member login is not available"
```

For Chinese locale files, use:

```json
"loginUnavailable": "会员登录暂不可用"
```

- [ ] **Step 4: MemberInfo 使用统一字段展示**

In `src/components/CRMLogin/MemberInfo.jsx`, remove `AvocadoMemberInfo` and render one member info component based on unified fields:

```js
const memberName = useMemo(() => {
  if (memberInfo.name) return memberInfo.name
  if (memberInfo.firstName || memberInfo.lastName) {
    return `${memberInfo.firstName || ''} ${memberInfo.lastName || ''}`.trim()
  }
  return '-'
}, [memberInfo])
```

Use `memberInfo.phone || memberInfo.phoneNumber` for phone display and `memberInfo.membershipTier` for tier display.

- [ ] **Step 5: 验证 CRMLogin 不再依赖 avocado service/slice**

Run:

```bash
rg -n "avocado|advocado|outletInfo|state\\.avocadoSlice" src/components/CRMLogin
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/components/CRMLogin src/locales
git commit -m "refactor: route member login through crm provider"
```

---

### Task 6: 迁移菜单兑换注入

**Files:**

- Create: `src/crm/adapters/rewardRuleAdapter.js`
- Modify: `src/pages/Order/Order.jsx`
- Modify: `src/pages/Order/components/emenuProOrder/index.jsx`
- Modify: `src/components/DishItemCard/index.jsx`
- Modify: `src/pages/Order/components/OrderListWrapper.jsx`

- [ ] **Step 1: 创建统一 reward adapter**

Create `src/crm/adapters/rewardRuleAdapter.js`:

```js
export function withProviderRewardRule(item, rewardRule) {
  return {
    ...item,
    rewardRule,
    itemMax: 1,
    benefitPrice: undefined,
    realBenefitPrice: undefined,
  }
}

export function createRedeemCategory({ id, items }) {
  return {
    id,
    name: id,
    hidden: false,
    list: [
      {
        id,
        hidden: false,
        list: items,
      },
    ],
  }
}

export function isProviderRewardItem(item) {
  return !!item?.rewardRule?.providerId
}
```

- [ ] **Step 2: 普通点单页移除 Avocado 菜单注入**

In `src/pages/Order/Order.jsx`, remove imports:

```js
import {
  resolveAvocadoLoyaltySku,
  resolveAvocadoItemVoucher,
} from '@/utils/resolveAvocadoSku'
import AvocadoVoucherDialog from '@/components/AvocadoVoucherDialog'
```

Use provider slice:

```js
const { redeemItems } = useSelector((state) => state.crmProviderSlice)
```

Build provider redeem category:

```js
const providerRedeemCategory = useMemo(() => {
  if (!redeemItems?.length) return {}
  return createRedeemCategory({
    id: 'crm-provider-redeem-item',
    items: redeemItems,
  })
}, [redeemItems])
```

Insert `providerRedeemCategory` before normal menus when non-empty.

- [ ] **Step 3: Pro 点单页移除 Avocado 菜单注入**

In `src/pages/Order/components/emenuProOrder/index.jsx`, remove Avocado imports and selectors, then read:

```js
const { redeemItems } = useSelector((state) => state.crmProviderSlice)
```

Insert `redeemItems` into the same sale item map that currently accepts CRM reward items.

- [ ] **Step 4: DishItemCard 移除 Avocado 专用组件入口**

In `src/components/DishItemCard/index.jsx`, remove:

```js
import AvocadoItemCampaign from '@/components/AvocadoVoucherItem'
```

Remove:

```js
if (props.isAvocadoCampaign) {
  return <AvocadoItemCampaign {...props} />
}
```

- [ ] **Step 5: OrderListWrapper 更新固定分类名**

In `src/pages/Order/components/OrderListWrapper.jsx`, replace:

```js
const CONSTANT_CATEGORY_NAME = [
  'crm-point-item',
  'avocado-item-loyalty',
  'avocado-item-voucher',
]
```

with:

```js
const CONSTANT_CATEGORY_NAME = ['crm-point-item', 'crm-provider-redeem-item']
```

- [ ] **Step 6: 验证菜单层不再引用 Avocado**

Run:

```bash
rg -n "Avocado|avocado|resolveAvocado|isAvocadoCampaign" src/pages/Order src/components/DishItemCard src/pages/Order/components/OrderListWrapper.jsx
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/crm/adapters/rewardRuleAdapter.js src/pages/Order src/components/DishItemCard
git commit -m "refactor: use crm provider redeem items in menus"
```

---

### Task 7: 迁移整单折扣兑换

**Files:**

- Modify: `src/components/CrmDiscount/index.jsx`
- Modify: `src/components/CrmDiscount/index.module.less`

- [ ] **Step 1: 移除 Avocado 折扣计算 import**

Remove:

```js
import { resolveAvocadoDiscount } from '@/utils/resolveAvocadoDiscount'
```

Read provider discount rules:

```js
const { discountRules } = useSelector((state) => state.crmProviderSlice)
```

- [ ] **Step 2: 保留传统 CRM 折扣计算，新增 provider 折扣入口**

Replace Avocado-specific `discountRule` with:

```js
const discountRule = useMemo(() => {
  if (discountRules?.length > 0) return discountRules
  const discountRuleSet = ['byPercentageOff', 'byFixedAmount']
  return crmRewardRules?.filter((each) =>
    discountRuleSet.includes(each.redeemRule.strategy)
  )
}, [crmRewardRules, discountRules])
```

Replace `sortedDiscountRules` with:

```js
const sortedDiscountRules = useMemo(() => {
  if (discountRules?.length > 0) return discountRules
  return getRewardDiscountByRules(items, discountRule, orders?.[0])
}, [items, discountRule, orders, discountRules])
```

- [ ] **Step 3: 折扣 tab 不再使用 Avocado 文案命名**

Replace `avocado.discount_point` and `avocado.discount_voucher` usage with CRM-neutral keys:

```json
"discount_point": "积分折扣",
"discount_voucher": "优惠券折扣"
```

Add these keys under `crm` for every locale file. Chinese locale files use the Chinese values above; English uses:

```json
"discount_point": "Points discount",
"discount_voucher": "Voucher discount"
```

- [ ] **Step 4: 验证 CrmDiscount 不再依赖 Avocado**

Run:

```bash
rg -n "avocado|Avocado|resolveAvocado|outletInfo|campaignBalances|dollarValueVouchers|dollarPercentageVouchers" src/components/CrmDiscount
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/CrmDiscount src/locales
git commit -m "refactor: normalize crm discount redemption"
```

---

### Task 8: 迁移兑换生命周期和下单提交

**Files:**

- Create: `src/crm/redemption/redemptionLifecycle.js`
- Modify: `src/components/ShoppingCart/PendingOrders.jsx`
- Modify: `src/hooks/useSendDiscountOrder.js`

- [ ] **Step 1: 创建兑换生命周期**

Create `src/crm/redemption/redemptionLifecycle.js`:

```js
export async function prepareRedemption(provider, context) {
  if (!provider?.prepareRedemption) return null
  return provider.prepareRedemption(context)
}

export async function commitRedemption(provider, context) {
  if (!provider?.commitRedemption) return null
  return provider.commitRedemption(context)
}

export function hasProviderRedeemItem(cart = []) {
  return cart.some((item) => item.rewardRule?.providerId)
}
```

- [ ] **Step 2: PendingOrders 移除 Avocado commit hook**

In `src/components/ShoppingCart/PendingOrders.jsx`, remove:

```js
import useMultiCommitTransaction from '@/hooks/useMultiCommitTransaction'
```

Add:

```js
import { getCrmProvider } from '@/crm'
import {
  commitRedemption,
  hasProviderRedeemItem,
  prepareRedemption,
} from '@/crm/redemption/redemptionLifecycle'
```

Replace `isHasAvocadoRedeemItem` with:

```js
const isHasProviderRedeemItem = useMemo(() => {
  return hasProviderRedeemItem(cart)
}, [cart])
```

- [ ] **Step 3: PendingOrders 使用 provider prepare**

Before tax and order save:

```js
let redemptionSession = null
if (isHasProviderRedeemItem) {
  const provider = getCrmProvider(crmProvider)
  redemptionSession = await prepareRedemption(provider, {
    cart,
    memberInfo,
    orders,
  })
}
```

Pass `redemptionSession?.transactionCommitId` into `generateOrder` as `transactionCommitId`.

- [ ] **Step 4: PendingOrders 保存成功后使用 provider commit**

After `setOrders(orders)`:

```js
if (redemptionSession) {
  const provider = getCrmProvider(crmProvider)
  await commitRedemption(provider, {
    redemptionSession,
    orders,
    memberInfo,
  })
}
```

- [ ] **Step 5: useSendDiscountOrder 迁移 lifecycle**

In `src/hooks/useSendDiscountOrder.js`, remove `useMultiCommitTransaction` and replace the Avocado-specific branch with:

```js
const provider = getCrmProvider(crmProvider)
const redemptionSession = selectedDiscountRule
  ? await prepareRedemption(provider, {
      selectedDiscountRule,
      orders,
      memberInfo,
    })
  : null
```

Pass `redemptionSession?.transactionCommitId` into `generateOrder`.

- [ ] **Step 6: 验证提交链路不再引用 Avocado commit**

Run:

```bash
rg -n "useMultiCommitTransaction|handleGetCommitId|handleTransactionCommitId|isHasAvocadoRedeemItem|outletInfo\\?\\.enabled" src/components/ShoppingCart/PendingOrders.jsx src/hooks/useSendDiscountOrder.js
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/crm/redemption/redemptionLifecycle.js src/components/ShoppingCart/PendingOrders.jsx src/hooks/useSendDiscountOrder.js
git commit -m "refactor: route redemption lifecycle through crm provider"
```

---

### Task 9: 迁移订单回显与 orderRewards 解析

**Files:**

- Modify: `src/hooks/useFetchOrder.js`
- Modify: `src/services/orders.js`

- [ ] **Step 1: useFetchOrder 不再传 Avocado campaign**

In `src/hooks/useFetchOrder.js`, remove:

```js
const { outletInfo, loyalty, itemVouchers } = useSelector(
  (state) => state.avocadoSlice
)
```

Add:

```js
const { rewardRules } = useSelector((state) => state.crmProviderSlice)
```

Replace transform call:

```js
crmRewardRules:
  outletInfo?.enabled === 1
    ? [loyalty, ...itemVouchers]
    : crmRewardRules,
```

with:

```js
crmRewardRules: rewardRules?.length > 0 ? rewardRules : crmRewardRules,
```

- [ ] **Step 2: orders.js 用 providerId 判断 provider reward**

In `src/services/orders.js`, replace:

```js
if (crmRewardRules[0].hasOwnProperty('isAvocadoCampaign')) {
```

with:

```js
if (itemReward?.providerId || itemReward?.rewardType === 'voucher') {
```

When building `rewardRule`, include:

```js
providerId: itemReward.providerId,
```

Inside `newOrder.orderRewards`, include:

```js
providerId: rewardRule.providerId,
```

- [ ] **Step 3: 验证订单服务不再依赖 Avocado 标记**

Run:

```bash
rg -n "isAvocadoCampaign|Avocado|avocado|outletInfo" src/hooks/useFetchOrder.js src/services/orders.js
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useFetchOrder.js src/services/orders.js
git commit -m "refactor: resolve order rewards by provider id"
```

---

### Task 10: 移除 Avocado Redux 和 request 特殊处理

**Files:**

- Modify: `src/store/index.js`
- Modify: `src/utils/request.js`

- [ ] **Step 1: store 移除 avocadoSlice 注册**

In `src/store/index.js`, replace:

```js
import avocadoSlice from './slices/avocado.slice'
```

and:

```js
reducer: { systemConfigSlice, avocadoSlice, system, crmProviderSlice },
```

with:

```js
reducer: { systemConfigSlice, system, crmProviderSlice },
```

- [ ] **Step 2: request 移除 `/advocado` 分支**

In `src/utils/request.js`, remove:

```js
if (response.config?.url.includes('/advocado')) {
  if (res.code === 200 && res.success && res.status === 'success') {
    return { data: res }
  }
  return Promise.reject({ ...res, message: res?.message })
}
```

- [ ] **Step 3: 验证运行代码不再读取 avocadoSlice**

Run:

```bash
rg -n "avocadoSlice|state\\.avocadoSlice|/advocado|ADVOCADO_SERVICE_ENABLED" src
```

Expected: no output except files in the deletion candidate list if they still exist before deletion approval.

- [ ] **Step 4: Commit**

```bash
git add src/store/index.js src/utils/request.js
git commit -m "refactor: remove avocado runtime state"
```

---

### Task 11: 删除 Avocado 文件

**Files:**

- Delete: `src/services/avocado.js`
- Delete: `src/store/slices/avocado.slice.js`
- Delete: `src/components/AvocadoVoucherItem/index.jsx`
- Delete: `src/components/AvocadoVoucherItem/index.module.less`
- Delete: `src/components/AvocadoVoucherDialog/index.jsx`
- Delete: `src/components/AvocadoVoucherDialog/index.module.less`
- Delete: `src/utils/resolveAvocadoSku.js`
- Delete: `src/utils/resolveAvocadoDiscount.js`
- Delete: `src/hooks/useMultiCommitTransaction.js`

- [ ] **Step 1: 请求删除确认**

Before deleting files, ask the user:

```txt
准备删除 Avocado 废弃文件清单。请确认是否允许删除这些文件。
```

- [ ] **Step 2: 删除文件**

After approval, remove the files listed above.

- [ ] **Step 3: 验证没有运行引用**

Run:

```bash
rg -n "avocado|Avocado|advocado|ADVOCADO_SERVICE_ENABLED|isAvocadoCampaign|useMultiCommitTransaction|resolveAvocado" src
```

Expected: only locale keys or historical docs may remain. If runtime files under `src/App.jsx`、`src/hooks`、`src/pages`、`src/components`、`src/services`、`src/store` still appear, remove those references before continuing.

- [ ] **Step 4: Commit**

```bash
git add src
git commit -m "refactor: remove deprecated avocado integration"
```

---

### Task 12: 清理文案与最终验证

**Files:**

- Modify: `src/locales/*.json`

- [ ] **Step 1: 移除 Avocado 专用文案**

Remove top-level `avocado` sections and `avocado-item-*` dish labels from locale files only after runtime references are gone.

- [ ] **Step 2: 验证文案引用**

Run:

```bash
rg -n "t\\('avocado|t\\(`avocado|avocado\\." src
```

Expected: no output.

- [ ] **Step 3: 运行 lint**

Run:

```bash
yarn lint
```

Expected: command completes without new errors. If auto-fix modifies files, review the diff before committing.

- [ ] **Step 4: 运行 build**

Run:

```bash
yarn build
```

Expected: Vite build completes successfully.

- [ ] **Step 5: 做关键业务手工验证**

Manual validation checklist:

- 传统 CRM 开启、新 CRM 关闭：登录入口显示；传统 CRM 登录仍可用；传统 CRM 兑换菜仍显示。
- 新 CRM 开启、传统 CRM 开启：provider 选择为 `integration`。
- 新 CRM 开启但接口未接入：不触发 Avocado 请求；不显示 Avocado 菜单分类；登录不可用时展示明确提示。
- 无 CRM：登录 banner 和会员图标隐藏。
- 购物车普通下单：不受 CRM provider 改造影响。
- 已下单页：订单价格、税、加收、已下单菜展示正常。

- [ ] **Step 6: Commit**

```bash
git add src/locales src
git commit -m "chore: clean deprecated avocado copy"
```

---

## 自检结果

- 规格覆盖：本计划覆盖 provider 识别、provider 外壳、状态迁移、登录迁移、菜单注入迁移、折扣迁移、下单核销生命周期、查单回显、Avocado 删除和验证。
- 范围控制：本计划不猜测新 CRM 网络接口。真实接口对接单独规划，避免硬编码和暗猜接口。
- 类型一致性：统一使用 `CRM_PROVIDER.NONE`、`CRM_PROVIDER.LEGACY`、`CRM_PROVIDER.INTEGRATION`；统一来源字段使用 `rewardRule.providerId`。
- 删除安全：Avocado 文件删除被拆成独立任务，并要求实施时先获得用户确认。
- 验证路径：每个关键迁移任务都有 `rg` 检查，最终用 `yarn lint` 和 `yarn build` 验证。
