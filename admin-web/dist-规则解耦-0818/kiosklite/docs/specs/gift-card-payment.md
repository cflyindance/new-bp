# Gift Card Payment Spec

## 1. Overview

本文档描述 `kiosklite` 中礼品卡支付相关业务的当前实现约定，覆盖：

- 礼品卡查询
- 礼品卡列表展示
- 礼品卡全额支付
- 礼品卡 partial pay
- 礼品卡后继续使用其他礼品卡支付
- 礼品卡后现金补款
- 礼品卡后信用卡补款
- `OrderFinish` 展示规则
- 礼品卡相关状态清理规则

本文档的目标不是记录历史过程，而是作为当前这条业务链路的单一事实源。

## 2. Scope

### In Scope

- 礼品卡全额支付
- 礼品卡查询与选卡流程
- 礼品卡 partial pay 页面与页面分流
- 礼品卡与现金/信用卡/其他礼品卡的组合支付
- 礼品卡相关状态建模与清理
- `OrderFinish` 与 `ConnectionError` 中的相关展示逻辑

## 3. Business Rules

### 3.1 礼品卡查询规则

- 支持通过手机号、邮箱、卡号查询礼品卡。
- 查询逻辑统一通过 Redux thunk 执行。
- 查询结果只保留余额大于 `0` 的礼品卡。
- 查询条件会记录到 `ecard.lastQuery`，用于 partial pay 下重新查卡。

### 3.2 Partial Pay 规则

- 礼品卡支付后，如果订单状态为 `PARTIALLY_PAID`，进入 `CardPartPayInfo`。
- `CardPartPayInfo` 展示：
  - 已支付金额
  - 待支付金额
  - Credit/Debit Card
  - Cash
  - Other Gift Card
- partial pay 过程中的累计礼品卡支付金额由 `giftCardPaidTotal` 表示。
- partial pay 过程中的礼品卡支付记录由 `giftCardPaymentHistory` 表示。

### 3.3 礼品卡继续支付规则

- 用户可以在 partial pay 后继续选择其他礼品卡支付。
- 继续支付时，不重新 `saveOrder`。
- 继续支付前会重新获取订单详情，使用最新订单上下文继续支付。
- 继续支付金额按“订单总金额 - 当前累计已支付金额”计算。

### 3.4 礼品卡 + 现金规则

- 礼品卡部分支付后，现金入口的业务语义是“去前台补款”。
- 不重新 `saveOrder`。
- 不重新 `orderLock`。
- 现金补款后进入 `OrderFinish`，由完成页展示已支付/未支付信息。

### 3.5 礼品卡 + 信用卡规则

- 礼品卡部分支付后，信用卡补款复用 `cardPayment` 主链路。
- 成功补款后，不再进入 `/afterCreditCardPay`。
- 礼品卡 + 信用卡补款成功后直接进入 `OrderFinish`。
- 在 `cardPayment` 页面中，混合支付场景下底部展示总额应显示“当前待支付金额”，而不是整单总额。
- 刷卡页面展示金额必须与实际发给刷卡机的支付金额保持一致。

### 3.6 OrderFinish 展示规则

- 是否为 partial pay，不再强依赖 `paymentType`。
- 只要当前 `cardPaidResult.status === 'PARTIALLY_PAID'`，就应按部分支付场景展示。
- 礼品卡部分支付后再选择现金/信用卡补款，`OrderFinish` 仍应能展示已支付/未支付信息。

### 3.7 送厨规则

- 当前已对重复送厨风险做防护。
- `postPaymentActions.kitchenSent` 用于标记当前订单是否已经送厨。
- 同一订单不应因礼品卡部分支付后再补款而重复送厨。

## 4. Design Decisions

### 4.1 `giftCardPaidTotal` 与 `giftCardPaymentHistory`

- 这两份状态当前定义为 partial pay 过程态。
- 它们用于：
  - 继续支付时的剩余金额计算
  - partial pay 页面展示
- 它们不承担最终审计态职责。

### 4.2 `paymentTypeTrail`

- `paymentTypeTrail` 表示当前订单经历过的支付方式轨迹。
- 它不等同于当前主支付类型。
- 典型取值：
  - `[]`
  - `['GIFT_CARD']`
  - `['GIFT_CARD', 'CASH']`
  - `['GIFT_CARD', 'CREDIT_CARD']`

### 4.3 金额计算约定

- 所有金额加减乘除优先使用精度工具处理。
- 不直接依赖原生浮点运算来做金额计算。
- 混合支付场景下，页面展示金额与实际支付金额必须使用同一业务口径。
- 对于礼品卡部分支付后进入 `cardPayment` 的场景：
  - 页面底部总额展示应优先使用 `cardPaidResult.unpaidInfo.unpaid`
  - 不应继续直接展示整单总额

## 5. State Model

### 5.1 Redux: `ecard`

- `selectedCard`
  - 当前选中的礼品卡
- `availableCards`
  - 当前可用礼品卡列表
- `lastQuery`
  - 最近一次查询条件
- `loading`
  - 礼品卡查询 loading

### 5.2 Redux: `currentOrder`

- `paymentType`
  - 当前主支付类型
- `paymentTypeTrail`
  - 当前订单支付方式轨迹
- `postPaymentActions`
  - 当前订单后置动作标记
  - 当前主要使用：
    - `kitchenSent`

### 5.3 Local State: `paymentType`

- `giftCardVisible`
  - 礼品卡弹窗是否打开
- `giftCardLoading`
  - 礼品卡弹窗内部 loading
- `giftCardErrorApiShow`
  - 礼品卡弹窗内部错误提示开关
- `giftCardErrorApiMsg`
  - 礼品卡弹窗内部错误提示内容
- `giftCardPaymentInfo`
  - partial pay 当前上下文
- `showGiftCardPartialPayInfo`
  - 当前是否显示 `CardPartPayInfo`
- `giftCardFlowMode`
  - 当前礼品卡支付流程模式
- `giftCardPaidTotal`
  - 当前订单礼品卡累计已支付金额
- `giftCardPaymentHistory`
  - 当前订单礼品卡支付记录
- `giftCardQueryFromPartialPay`
  - `QueryGiftCard` 是否从 partial pay fallback 进入

## 6. State Cleanup

### 6.1 查询态清理

以下状态在订单重置、新一单初始化、关闭礼品卡弹窗时应被清理：

- `ecard.selectedCard`
- `ecard.availableCards`
- `ecard.lastQuery`
- `ecard.loading`

当前实现：

- `resetCurrentOrder()` 已内聚 ecard 查询态清理。
- `orderPage.initializePage()` 会调用 `clearECardState()` 作为新一单初始化兜底。

### 6.2 礼品卡流程态清理

以下状态由 `resetGiftCardFlowState()` 统一清理：

- `giftCardVisible`
- `giftCardLoading`
- `giftCardErrorApiShow`
- `giftCardErrorApiMsg`
- `giftCardPaymentInfo`
- `showGiftCardPartialPayInfo`
- `giftCardFlowMode`
- `giftCardPaidTotal`
- `giftCardPaymentHistory`
- `giftCardQueryFromPartialPay`

### 6.3 订单级状态清理

以下状态在订单结束或回首页时应清理：

- `paymentType`
- `paymentTypeTrail`
- `postPaymentActions`
- `cardPaidResult`
- `saveOrderResult`
- `currentOrder.customer`

当前实现：

- `orderFinish.handleBackHome()` 已通过 `resetCurrentOrder()`、`clearPaymentTypeTrail()`、`clearPostPaymentActions()`、`setCardPaidResult({})` 做统一清理。

## 7. Flow Summary

### 7.1 首次礼品卡支付

1. 打开 GiftCardPayment 弹窗
2. 查询礼品卡
3. 选择礼品卡
4. 发起礼品卡支付
5. 根据结果分流：
   - `PAID` -> 正常完成链路
   - `PARTIALLY_PAID` -> `CardPartPayInfo`

### 7.2 其他礼品卡继续支付

1. 在 `CardPartPayInfo` 点击 `Other Gift Card`
2. 重新按 `lastQuery` 查询可用礼品卡
3. 排除当前已用礼品卡
4. 分流：
   - 有可用卡 -> `CardList`
   - 无可用卡 -> `QueryGiftCard`
   - 查询失败 -> 保留在 `CardPartPayInfo`

### 7.3 礼品卡后现金补款

1. 在 `CardPartPayInfo` 点击 `Cash`
2. 进入“去前台补款”流程
3. 最终进入 `OrderFinish`

### 7.4 礼品卡后信用卡补款

1. 在 `CardPartPayInfo` 点击 `Credit/Debit Card`
2. 跳转到 `cardPayment`
3. 复用信用卡支付主链路完成剩余金额支付
4. `cardPayment` 页面底部总额展示当前待支付金额
5. 成功后直接进入 `OrderFinish`

## 8. File Ownership

主要文件职责如下：

- `src/container/paymentType/index.js`
  - 礼品卡支付主控页面
  - partial pay 过程态维护
  - GiftCardPayment 弹窗开关与分流

- `src/component/GiftCardPayment/QueryGiftCard.js`
  - 礼品卡查询页

- `src/component/GiftCardPayment/CardList.js`
  - 礼品卡列表页

- `src/component/GiftCardPayment/CardPartPayInfo.js`
  - partial pay 页面

- `src/component/GiftCardPayment/CardPaymentWrapper.js`
  - GiftCardPayment 内部视图切换

- `src/container/cardPayment/index.js`
  - 礼品卡后信用卡补款主链路

- `src/container/orderFinish/index.js`
  - 完成页展示与订单结束清理

- `src/actions/index.js`
  - Redux actions
  - `resetCurrentOrder`
  - 支付类型及礼品卡相关 action

- `src/reducers/ecard.js`
  - 礼品卡查询态

- `src/reducers/order.js`
  - 订单支付轨迹与后置动作状态

## 9. Current Task

当前无进行中的礼品卡专项任务。

## 10. Open Tasks

当前无明确未完成的礼品卡专项任务。

如果后续新增需求，请直接在本节补充。

## 11. Change Log

已完成并归档的核心任务：

1. 礼品卡查询能力收口到 Redux thunk
2. CardList 仅展示有余额礼品卡
3. CardPartPayInfo partial pay 页面
4. partial pay 下重新获取其他礼品卡
5. GiftCardPayment 内部视图切换
6. 使用其他礼品卡继续支付
7. 礼品卡累计支付过程态
8. 每次礼品卡支付后重新检查支付状态
9. partial pay 下无其他可用礼品卡时回到查询页
10. QueryGiftCard 中新增“选择其他支付方式”返回入口
11. 新增礼品卡支付类型并修正 OrderFinish 展示逻辑
12. 新增 paymentTypeTrail 订单支付轨迹状态
13. 礼品卡部分支付后使用信用卡支付
14. 礼品卡与信用卡补款成功后直接跳转 OrderFinish
15. GiftCardPayment 弹窗内的 Loading / Alert 状态链路优化
16. 礼品卡相关状态清理策略收口
17. cardPayment 混合支付场景下展示总额修正为待支付金额

## 12. Maintenance Rules

- 任务开发完成并 review 通过后，应立即从当前任务中移出，并追加到 `Change Log`。
- 如果只是历史设计约定仍然有效，请写入 `Design Decisions` 或 `Review`，不要继续挂在待办中。
- 本文档统一使用 UTF-8 中文维护。

## 13. Supplement - CRM Auth Code Verification

### 13.1 Rule

- `QueryGiftCard` 中，只有手机号查询会触发“是否需要验证码”的判断。
- 该判断读取 Redux 字段 `crm.isCRMAuthCodeVerified`。
- 当 `crm.isCRMAuthCodeVerified === true` 时，手机号查询礼品卡可跳过验证码。

### 13.2 Who Can Set It

- 只有以下两个入口在验证码校验成功后可以写入 `crm.isCRMAuthCodeVerified = true`：
  - `src/component/CRM/LoginCRM/components/LoginModal.js`
  - `src/component/CRM/Rewards/index.js`

### 13.3 Who Must Not Set It

- `src/component/GiftCardPayment/QueryGiftCard.js` 自己的验证码流程，不负责写入 `crm.isCRMAuthCodeVerified`。
- 该页面只消费这个状态，不生产这个状态。

### 13.4 Reset Timing

- 下列场景需要将 `crm.isCRMAuthCodeVerified` 重置为 `false`：
  - 主动登出
  - 回首页触发 CRM 自动登出

### 13.5 Related State

- `crm.loginType`
  - 保留给 CRM / reward 原有登录流程使用。
- `crm.isCRMAuthCodeVerified`
  - 专门用于控制 `QueryGiftCard` 的手机号查卡是否跳过验证码。

### 13.6 Change Record

- 新增 Redux action type: `SET_CRM_AUTH_CODE_VERIFIED`
- 新增 Redux action: `setCRMAuthCodeVerified`
- 新增 Redux reducer state: `crm.isCRMAuthCodeVerified`
