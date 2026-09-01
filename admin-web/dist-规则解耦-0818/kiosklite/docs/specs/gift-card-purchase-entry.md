# 礼品卡购买入口规格文档

## 1. 概述

本文档定义 `PosterPro` 中 `BuyGiftCard` 组件的业务规格，以及其在 `bannerPro` 运行时中的接入方案。

目标是让运营人员可以在海报编辑器中配置礼品卡购买入口，并将礼品卡快捷充值金额配置作为完整对象保存到海报数据中，供运行时直接消费。当前运行时阶段已经接入礼品卡建单能力，支持弹出购买流程、输入手机号、确认购买信息、调用 SOAP `SaveOrderType` 创建礼品卡订单，并跳转到信用卡支付页继续支付。

本文档覆盖以下内容：
- `PosterPro` 中 `BuyGiftCard` block 的注册与编辑能力
- `PosterPro` 页面内 eCard 配置加载
- 基于 eCard 配置生成快捷充值金额数组
- `BuyGiftCard` 属性面板中的金额下拉选择能力
- 海报保存时 `quickAmount` 完整对象的持久化结构
- `bannerPro` 中 `BuyGiftCard` 运行时组件接入
- `BuyGiftCard` 全屏购买弹窗
- 礼品卡商品信息加载
- 礼品卡订单创建与跳转支付页
- 礼品卡未支付订单的删除

本文档不定义最终支付完成结果页、实体卡流程或完整售后链路。

## 2. 范围

### 2.1 范围内

- 新增 `BuyGiftCard` 海报组件
- 在 `PosterPro` 页面加载 eCard settings
- 基于 `defaultValues`、`purchaseChannels`、`loadDiscount.discountList` 生成快捷充值金额数组
- 将快捷充值金额数组写入全局 Redux `ecard.quickAmounts`
- 将 `Cloud Gift Card` 商品写入全局 Redux `ecard.cloudGiftCardItem`
- 在 `BuyGiftCard` 属性面板中提供下拉框配置
- 保存所选金额对象到 block props
- 新增用于快捷金额展示的多语言资源 key
- 在 `bannerPro` 运行时新增 `BuyGiftCard` case
- 新增 `BuyGiftCard` 运行时组件
- 新增全屏 `Dialog`，包含手机号输入、二次确认、购买确认三步流程
- 调用 SOAP `SaveOrderType` 创建礼品卡订单
- 成功后跳转 `/cardPayment`
- 支付完成后在 `orderFinish` 中打印礼品卡纸质收据
- 网络异常时删除未支付礼品卡订单

### 2.2 范围外

- 礼品卡绑卡接口调用
- 信用卡支付设备交互与支付完成页逻辑
- 礼品卡核销流程
- `mainPage` 中快捷充值金额数组的构建逻辑
- 邮箱、卡号等其他查询方式
- 前端生成礼品卡卡号

## 3. 业务规则

### 3.1 eCard 配置加载

- `PosterPro` 和 `mainPage` 为同层级路由
- 不能假设用户一定先进入 `mainPage`
- 因此 `PosterPro` 页面需要自行请求 `/kpos/api/ecard/settings`
- 请求成功后，需要将原始配置写入全局 Redux `ecard.settings`
- 仅 `PosterPro` 负责构建并写入 `ecard.quickAmounts`

### 3.1.1 Cloud Gift Card 商品加载

- `bannerPro` 挂载时会调用 `fetchCloudGiftCardItem`
- 数据来源于 `fetchAllMenu` 返回菜单树中的以下路径：
  - `menus -> menuGroups[name === 'Cloud Gift Card'] -> menuCategories[0] -> saleItems[0]`
- 提取出的商品对象写入全局 Redux `ecard.cloudGiftCardItem`
- `BuyGiftCard` 运行时点击前必须校验该商品是否存在

### 3.2 快捷充值金额数组生成规则

快捷充值金额数组默认值为 `[]`。

当满足以下任一条件时，直接返回空数组：
- `purchaseChannels` 不包含 `KIOSK`
- `defaultValues` 不存在或为空数组

数组中的每一项至少包含以下字段：
- `rechargeAmount`：充值金额
- `receivedAmount`：实际到账金额
- `paymentAmount`：实际收款金额
- `label`：用于展示文案的多语言 key

#### 3.2.1 无优惠

当 `loadDiscount.enable === false` 时：
- `rechargeAmount = defaultValues[i]`
- `receivedAmount = defaultValues[i]`
- `paymentAmount = defaultValues[i]`
- `label = ''`

#### 3.2.2 固定奖励模式

当 `loadDiscount.enable === true` 且优惠类型为 `fixed` 时：
- `rechargeAmount = 实际收款金额`
- `receivedAmount = rechargeAmount + 奖励金额`
- `paymentAmount = rechargeAmount`
- `bonusAmount = receivedAmount - rechargeAmount`
- `label = 'ecard_quick_amount_bonus_label'`
- 同时保留 `discountValue`

若某个默认金额未命中任何优惠档位：
- `bonusAmount = 0`
- 仍然保留 `label = 'ecard_quick_amount_bonus_label'`

#### 3.2.3 百分比优惠模式

当 `loadDiscount.enable === true` 且优惠类型为 `percentage` 时：
- `rechargeAmount = 实际到账金额`
- `receivedAmount = rechargeAmount`
- `paymentAmount = rechargeAmount * (1 - value / 100)`
- `saveAmount = rechargeAmount - paymentAmount`
- `label = 'ecard_quick_amount_save_label'`
- 同时保留 `discountValue`

若某个默认金额未命中任何优惠档位：
- `saveAmount = 0`
- 仍然保留 `label = 'ecard_quick_amount_save_label'`

### 3.3 优惠档位匹配规则

对于每个 `defaultValue`：
- 从 `discountList` 中筛选 `condition.amount.gte <= defaultValue` 的档位
- 取满足条件的最高档位作为最终优惠档位
- 若没有任何匹配档位，则按“未命中优惠档位”处理
- 固定赠送模式需要同时兼容 `fixed` 与 `fixAmount` 两种类型值

### 3.4 自定义金额字段说明

后端当前返回的 `customLoadAmount.value` 中：
- `gte` 实际表示最大值
- `lte` 实际表示最小值

当前 `BuyGiftCard` 编辑器和运行时均未消费该字段，但后续若接入自定义金额，需要在前端进行语义归一化。

## 4. 设计决策

### 4.1 为什么将快捷金额写入 Redux

虽然 `PosterPro` 最终会把所选金额对象保存到 block props 中，但编辑器属性面板仍需要从统一状态源读取下拉列表数据，因此将快捷充值金额数组写入 `ecard.quickAmounts` 更利于复用。

### 4.2 为什么保存完整对象而不是单一金额

`BuyGiftCard` 选中项保存完整对象，而不是只保存 `rechargeAmount`。原因如下：
- 后续运行时无需再次依赖 Redux 或重新计算
- 保存海报后，运行端可以直接消费固定的数据结构
- 即使后端 eCard 配置后续变化，历史海报也能保持一致行为

### 4.3 为什么运行时先只做手机号绑定弹窗

当前 `BuyGiftCard` 运行时继续采用前端分步弹窗，原因如下：
- 先打通 `PosterPro -> bannerPro -> saveOrder -> cardPayment` 的最小购买链路
- 将输入手机号、确认购买信息、建单与跳转支付拆成清晰步骤
- 保持 `BuyGiftCard` 组件负责弹窗流程，`useBuyGiftCard` 负责建单逻辑，职责边界清晰

## 5. 状态模型

### 5.1 Redux

`ecard` reducer 当前包含：
- `settings`：eCard 原始配置
- `quickAmounts`：快捷充值金额数组
- `cloudGiftCardItem`：菜单树中提取出的礼品卡商品

### 5.2 BuyGiftCard block props

`BuyGiftCard` 在海报数据中保存的金额配置结构如下：

```json
{
  "quickAmount": {
    "rechargeAmount": 500,
    "receivedAmount": 600,
    "paymentAmount": 500,
    "bonusAmount": 100,
    "label": "ecard_quick_amount_bonus_label"
  }
}
```

若为百分比优惠模式，则结构示例为：

```json
{
  "quickAmount": {
    "rechargeAmount": 500,
    "receivedAmount": 500,
    "paymentAmount": 425,
    "saveAmount": 75,
    "label": "ecard_quick_amount_save_label"
  }
}
```

### 5.3 BuyGiftCard 运行时本地状态

`bannerPro/components/buyGiftCard.js` 当前在组件内部维护：
- `visible`：是否显示全屏弹窗
- `step`：当前步骤，取值为 `input` / `confirmPhone` / `confirmPurchase`
- `phone`：第一次输入的手机号
- `confirmPhone`：第二次输入的手机号

这些状态仅存在于运行时组件内部，不写回 Redux。

## 6. 编辑器行为

### 6.1 BuyGiftCard 组件

`BuyGiftCard` 在编辑器中的能力与 `AddToCart` 基本一致：
- 可从左侧组件列表拖拽到画布
- 可上传图片
- 可调整位置和尺寸
- 可删除

与 `AddToCart` 的差异是：
- 不提供 `Bind Dish` 属性
- 额外提供“购买礼品卡”下拉属性

### 6.2 下拉框行为

“购买礼品卡”属性为一个下拉框：
- 数据源为 `state.ecard.quickAmounts`
- 每个选项展示文案使用 `label` 对应的 i18n key
- 透传变量至少包括 `amount`、`bonusAmount`、`saveAmount`
- 用户选中后，将完整对象保存到当前 block 的 `props.quickAmount`

### 6.3 多语言资源

快捷金额相关新增两个多语言 key：
- `ecard_quick_amount_bonus_label`
- `ecard_quick_amount_save_label`

手机号绑定弹窗当前使用的多语言 key 为：
- `gift_card_bind_phone_title`
- `gift_card_confirm_phone_title`
- `gift_card_confirm_phone_mismatch`
- `gift_card_bind_next`
- `gift_card_bind_confirm`
- `gift_card_valid_until_label`
- `gift_card_bound_phone_label`
- `gift_card_go_pay`
- `gift_card_item_not_found`
- `gift_card_credit_card_payment_required`

## 7. 运行时行为

### 7.1 bannerPro 与 PosterPro 的契约

运行时 `bannerPro` 消费的数据来源于 `img.bannerPro.posterData?.[0]?.children`。

`BuyGiftCard` 节点在运行时至少包含：
- `component: 'BuyGiftCard'`
- `style`
- `props.imgUrl`
- `props.defaultImg`
- `props.quickAmount`

### 7.2 BuyGiftCard case

在 `src/container/orderPage/bannerPro/index.js` 中：
- `switch (item.component)` 新增 `case 'BuyGiftCard'`
- 当前实现直接返回 `BuyGiftCard` 运行时组件
- 外层不再额外维护 `BuyGiftCard` 弹窗状态
- 组件内部自行处理点击与弹窗逻辑

### 7.3 全屏手机号绑定弹窗

`BuyGiftCard` 点击后打开一个全屏 `Dialog`：
- 样式和结构参考 `GiftCardPayment/QueryGiftCard` 当前页面
- header 直接复用 `ComboHeader`
- 标题区复用 `jingleBell` 图标和大标题排版
- 输入框与主按钮视觉保持和 `QueryGiftCard` 同风格
- 第三步确认页由独立组件 `BuyGiftCardConfirm` 承担

### 7.4 点击前置校验

在打开礼品卡弹窗前，`BuyGiftCard` 需要先完成以下校验：
- 使用 `handlePaymentTypeRoute(systemConfig, selfConfig)` 判断当前是否支持信用卡支付
- 若不支持信用卡支付，使用 `Toast` 提示 `gift_card_credit_card_payment_required`
- 若 `cloudGiftCardItem` 不存在，使用 `Toast` 提示 `gift_card_item_not_found`
- 仅当上述条件都满足时，才允许进入购买弹窗

### 7.5 三步流程

#### 第一步
- 标题：绑定手机号
- 输入手机号
- 手机号格式按美国手机号格式化显示
- 输入 10 位后“下一步”按钮进入可用状态
- 点击“下一步”进入确认页

#### 第二步
- 标题：再次确认手机号
- 再次输入手机号
- 默认带入第一步已输入的手机号
- 输入 10 位后“确定绑定”按钮进入可用状态
- 若两次手机号不一致，给出前端 Toast 提示
- 若一致，进入第三步购买确认页

#### 第三步
- 组件：`BuyGiftCardConfirm`
- 展示当前所选 `quickAmount` 的标题文案
- 展示有效期，当前固定展示为“永久有效”
- 展示绑定手机号
- 底部主按钮展示为“去支付 · $xx.xx”
- 点击按钮后调用 `useBuyGiftCard.createGiftCardOrder`
- 建单成功后关闭海报弹层，并通过 `history.push('/cardPayment')` 进入信用卡支付页

### 7.6 建单规则

`useBuyGiftCard` 当前负责最小礼品卡建单流程：
- 使用 `quickAmount.receivedAmount` 作为礼品卡实际面值
- 使用 `cloudGiftCardItem.id` 作为 `saleItemId`
- 手机号提交前会去掉格式化字符，仅保留纯数字
- `eCard.cardType` 固定为 `virtual`
- `eCard.expirationTime` 固定为 `2099-12-31`
- 当前不再由前端生成 `cardNumber`
- 当前不再由前端检查卡号是否存在
- 卡号生成与唯一性校验完全交由后端处理
- 虚拟卡在 `saveOrder` 建单阶段不会立即返回卡号，只有支付完成后才会有卡号
- 礼品卡首单创建不再走 REST `saveOrder`
- 当前改为走 SOAP `SaveOrderType`
- SOAP 成功响应会先保留一份“小写字段结构”给 `setCardPaidResult`
- 同时会通过 `parseSaveGiftCardOrderSoapResponse` 转成标准订单对象，给 `saveOrderResult` 使用

### 7.7 SOAP SaveOrderType 请求结构

当前礼品卡建单走 SOAP `SaveOrderType`，请求关键字段为：

```xml
<app:SaveOrderType>
  <app:order>
    <app:type>CLOUD_GIFT_CARD</app:type>
    <app:totalPrice>300</app:totalPrice>
    <app:userPassword>56854b3d95d5d154e1fbca66</app:userPassword>
    <app:orderItems>
      <app:saleItemId>5148</app:saleItemId>
      <app:quantity>1</app:quantity>
      <app:price>300</app:price>
      <app:eCard>
        <app:actionType>registration</app:actionType>
        <app:cardType>virtual</app:cardType>
        <app:to>5417770001</app:to>
        <app:toType>phone</app:toType>
        <app:expirationTime>2099-12-31</app:expirationTime>
      </app:eCard>
    </app:orderItems>
  </app:order>
  <app:userAuth>
    <app:sessionKey>...</app:sessionKey>
  </app:userAuth>
</app:SaveOrderType>
```

说明：
- `totalPrice` 与 `price` 使用实际面值，即 `receivedAmount`
- `to` 使用纯数字手机号
- 虚拟卡不再传 `cardNumber`
- 后端负责生成卡号并校验是否重复
- 当前 `saveOrder` 成功响应中的 `eCard` 不会回填卡号；虚拟卡号应在支付完成后获取

### 7.8 改价规则

当 `quickAmount` 含优惠时，需要在首单 SOAP 建单后再执行一次 REST `saveOrder` 改价：

- `saveAmount > 0` 时：
  - `discountRateType = 2`
  - `discount = saveAmount`
  - `discountRate = discountValue`
- `bonusAmount > 0` 时：
  - `discountRateType = 1`
  - `discount = bonusAmount`
  - `discountRate = discountValue`

二次改价成功后：
- 重新计算 `unpaidInfo`
- 通过 `getOrderInfo` 拉取最新订单
- 将拉到的 SOAP 小写结构继续写入 `setCardPaidResult`
- 将标准订单对象写入 `saveOrderResult`

### 7.9 信用卡支付完成后的跳转

礼品卡购买成功进入 `/cardPayment` 后：
- `cardPayment` 会通过 `isBuyGiftCard()` 判断当前是否为买礼品卡场景
- 判断来源同时兼容：
  - `cardPaidResult.type === 'CLOUD_GIFT_CARD'`
  - `currentOrder.saveOrderResult.type === 'CLOUD_GIFT_CARD'`
- 若为买礼品卡场景，信用卡支付成功后直接跳转 `/orderFinish`
- 不再进入 `afterCreditCardPay`

### 7.10 删除未支付礼品卡订单

当买礼品卡场景建单后进入支付，但支付过程中发生连接异常并触发取消订单时：
- `connectionError` 会先将当前订单与订单项状态改为 `CANCELED`
- 若订单类型为 `CLOUD_GIFT_CARD`，不再走普通 REST `saveOrder` 取消
- 改为调用 `removeGiftCard`
- `removeGiftCard` 当前走 SOAP `SaveOrderType`，用于删除已开但未支付的礼品卡订单
- 当前 `removeGiftCard` 请求结构中有多处写死字段，后续若服务端要求变化，需要优先检查该 SOAP 模板

### 7.11 支付完成后的纸质收据打印

礼品卡购买完成并进入 `/orderFinish` 后：
- `orderFinish` 挂载时会统一执行 `loadGiftCardInfo`
- 自动打印纸质收据与手动打印纸质收据都需要先判断当前订单是否为 `CLOUD_GIFT_CARD`
- 判断来源同时兼容：
  - `currentOrder.saveOrderResult.type === 'CLOUD_GIFT_CARD'`
  - `cardPaidResult.type === 'CLOUD_GIFT_CARD'`
- 若为普通订单，仍然沿用原来的 `printUnpaidReceiptHandler(orderId, paymentTotals)`
- 若为礼品卡订单，则不再直接传 `orderId` 打印

礼品卡纸质收据打印参数组织规则如下：
- 先从 `currentOrder.saveOrderResult.id` 获取订单 id
- 再调用 `getOrderInfo(orderId)` 拉取订单详情
- 从订单详情的 `orderItems[0].ecard.cardNumber` 中提取 `ecardNumber`
- 再调用 `searchECardCards({ cardNumber: ecardNumber })` 查询礼品卡详情
- 从卡查询结果中补齐：
  - `balance`
  - `giftCardExpiration`
- `giftCardExpiration` 的原始结构为 `2099-12-31T15:59:59.000Z`
- 前端使用 `dayjs` 将其格式化为 `YYYY-MM-DD`
- 组织打印 payload：

```json
{
  "ecardNumber": "....",
  "merchantCopy": false,
  "userAuth": {
    "sessionKey": "..."
  }
}
```

若 POS 开启 dual price，则仍需继续透传：
- `cashPaymentTotal`
- `creditPaymentTotal`

最终礼品卡纸质收据打印调用：
- `printECardInfo({ ecardNumber, merchantCopy, userAuth, ...paymentTotals })`

说明：
- 礼品卡卡号不是建单后立即可得，而是在支付完成后才能从订单详情中取到
- 因此礼品卡纸质收据打印必须发生在 `/orderFinish` 阶段，而不能复用建单后的即时打印参数

### 7.12 支付完成后的短信文案

礼品卡购买完成并进入 `/orderFinish` 后：
- `sendMsgReceiptHandler` 会额外接收 `giftCardInfo`
- `giftCardInfo` 由 `loadGiftCardInfo` 在页面挂载阶段统一准备
- 仅当“购买礼品卡 + 信用卡全额支付”时，才使用礼品卡专用短信文案

礼品卡短信文案结构如下：
- `sms-thank-you-order`
- `Card: {{ecardNumber}}`
- `Balance: {{balance}}`
- `EXP: {{expirationTime}}`
- `Thank you, Please Come Again!`

其中：
- `Card` 使用查询出来的礼品卡卡号
- `Balance` 使用卡查询接口返回的余额
- `EXP` 使用 `giftCardExpiration` 经过 `dayjs(...).format('YYYY-MM-DD')` 处理后的日期

信用卡购买礼品卡且部分支付时：
- 不发送短信
- 该规则仅在 `sendMsgReceiptHandler` 的“信用卡部分支付”分支内处理
- 不额外修改 `orderFinish` 中短信按钮显示与入口判断逻辑

## 8. 数据流总结

### 8.1 页面初始化

1. 进入 `PosterPro`
2. 请求海报配置
3. 请求菜单树
4. 请求 eCard settings
5. 将 eCard settings 写入 `ecard.settings`
6. 调用 `buildECardQuickAmounts`
7. 将结果写入 `ecard.quickAmounts`

### 8.2 配置 BuyGiftCard

1. 用户选中 `BuyGiftCard` block
2. 右侧属性面板展示下拉框
3. 下拉框读取 `ecard.quickAmounts`
4. 用户选择某一项快捷金额
5. 将完整对象写入 block props
6. 保存海报时随 `posterData` 一起持久化

### 8.3 运行时点击 BuyGiftCard

1. `bannerPro` 渲染 `BuyGiftCard` 组件
2. `bannerPro` 页面挂载时请求 `cloudGiftCardItem`
3. 组件接收 `quickAmount`
4. 用户点击海报上的 `BuyGiftCard` 图标
5. 点击前校验信用卡支付能力与礼品卡商品是否存在
6. 组件内部打开全屏 `Dialog`
7. 完成手机号输入与二次确认
8. 进入购买确认页
9. 点击支付按钮调用 SOAP `SaveOrderType` 创建礼品卡订单
10. 建单成功后关闭海报，并跳转 `/cardPayment`
11. 若含优惠，则继续二次 `saveOrder` 改价
12. 信用卡支付完成后直接跳转 `/orderFinish`
13. `orderFinish` 挂载时执行 `loadGiftCardInfo`
14. 先拉订单详情并提取 `ecard.cardNumber`
15. 再调用卡查询接口获取礼品卡详情
16. 使用 `dayjs` 将 `giftCardExpiration` 转成 `YYYY-MM-DD`
17. 自动打印或手动打印时调用 `printECardInfo` 打印礼品卡纸质收据
18. 若为信用卡全额支付，则短信发送复用 `giftCardInfo` 组织礼品卡短信文案
19. 若为信用卡购买礼品卡且部分支付，则不发送短信

## 9. 文件归属

当前实现涉及的主要文件：
- `src/container/PosterPro/index.js`
- `src/utils/buildECardQuickAmounts.js`
- `src/reducers/ecard.js`
- `src/actions/index.js`
- `src/constants/actionTypes.js`
- `src/component/PosterPro/Blocks/BuyGiftCard.jsx`
- `src/component/PosterPro/BlockProperty/BlockBuyGiftCardAmount.jsx`
- `src/constants/Blocks.jsx`
- `src/constants/BlockProperties.js`
- `src/utils/blockRegister.js`
- `src/container/orderPage/bannerPro/index.js`
- `src/container/orderPage/bannerPro/components/buyGiftCard.js`
- `src/container/orderPage/bannerPro/components/BuyGiftCardConfirm.js`
- `src/container/orderPage/bannerPro/components/buyGiftCard.module.scss`
- `src/container/orderPage/bannerPro/components/BuyGiftCardConfirm.module.scss`
- `src/hooks/useBuyGiftCard.js`
- `src/container/cardPayment/index.js`
- `src/container/orderFinish/index.js`
- `src/container/connectionError/index.js`
- `src/utils/structureOrderInfoKey.js`
- `src/api/eCard.js`
- `src/assets/i18n/locale/*.json`

## 10. 当前任务结论

当前阶段已完成：
- `BuyGiftCard` block 编辑器接入
- `PosterPro` 页面加载 eCard settings
- 快捷充值金额数组生成并写入 Redux
- `BuyGiftCard` 下拉属性接入
- 保存完整 `quickAmount` 对象
- 快捷金额相关多语言 key 接入
- `bannerPro` 中新增 `BuyGiftCard` 运行时 case
- `BuyGiftCard` 运行时组件接入
- 全屏手机号绑定弹窗接入
- 手机号输入与二次确认两步前端校验完成
- 第三步购买确认页接入
- `cloudGiftCardItem` 加载与运行时校验接入
- SOAP `SaveOrderType` 礼品卡建单接入
- 建单成功后跳转 `cardPayment`
- 前端卡号生成与重试逻辑已删除，统一交由后端处理
- 优惠礼品卡的二次改价存单接入
- 信用卡购买礼品卡后直接跳转 `orderFinish`
- `orderFinish` 中礼品卡纸质收据打印接入
- `orderFinish` 挂载阶段统一加载礼品卡详情接入
- 礼品卡短信文案接入
- 连接异常场景下删除未支付礼品卡订单接入

## 11. 开放任务

以下内容仍待后续实现：
- 绑卡接口调用
- 是否支持自定义输入充值金额
- 是否需要接入现有数字键盘能力
- 建单失败后的精细化错误码提示
- 奖励卡或优惠卡改价后的订单结构最终确认
- `removeGiftCard` SOAP 模板中硬编码字段的进一步收敛

## 12. 变更记录

### 第一阶段

- 新增 `BuyGiftCard` 组件
- 移除 `Bind Dish` 属性
- 复用 `AddToCart` 默认图片

### 第二阶段

- 在 `PosterPro` 中加载 eCard settings
- 新增快捷充值金额数组的 Redux 存储
- 新增金额计算工具方法

### 第三阶段

- 为 `BuyGiftCard` 新增下拉属性
- 保存完整金额对象
- 新增奖励与节省金额相关的多语言标签

### 第四阶段

- 在 `bannerPro` 中新增 `BuyGiftCard` 运行时组件
- `BuyGiftCard` 组件内部新增全屏 `Dialog`
- 弹窗样式对齐 `QueryGiftCard` 与 `ComboHeader`
- 实现手机号输入与二次确认流程

### 第五阶段

- 新增 `BuyGiftCardConfirm` 第三步购买确认页
- `BuyGiftCardConfirm` 接入 `withRouter`
- 确认页展示绑定手机号、永久有效、支付按钮金额
- `bannerPro` 挂载时加载 `cloudGiftCardItem`
- 点击 `BuyGiftCard` 前新增信用卡支付可用性校验

### 第六阶段

- 新增 `useBuyGiftCard` 建单流程
- 调用 SOAP `SaveOrderType` 创建虚拟礼品卡订单
- 建单成功后跳转 `/cardPayment`
- 前端删除 `cardNumber` 生成、查重、重试 5 次等逻辑
- 虚拟卡卡号生成与唯一性校验改由后端处理

### 第七阶段

- 新增优惠礼品卡的二次改价存单流程
- `buildECardQuickAmounts` 为优惠项补充 `discountValue`
- 赠金模式补充 `bonusAmount` 改价逻辑
- `cardPayment` 增加买礼品卡场景判断并在支付成功后直接进入 `orderFinish`
- `connectionError` 增加删除未支付礼品卡订单逻辑
- 新增 `removeGiftCard` SOAP 接口

### 第八阶段

- `orderFinish` 增加礼品卡纸质收据打印分支
- 自动打印与手动打印统一复用礼品卡打印入口
- 通过 `getOrderInfo(orderId)` 获取订单详情并提取 `ecard.cardNumber`
- 调用 `printECardInfo` 打印礼品卡收据

### 第九阶段

- `orderFinish` 挂载时统一执行 `loadGiftCardInfo`
- 在拿到新卡号后调用卡查询接口查询礼品卡详情
- 使用 `dayjs` 将 `giftCardExpiration` 转换为 `YYYY-MM-DD`
- 信用卡全额支付时新增礼品卡专用短信文案
- 信用卡购买礼品卡且部分支付时不发送短信

## 13. 维护规则

- `mainPage` 不负责构建 `ecard.quickAmounts`
- `PosterPro` 是当前唯一的快捷金额构建入口
- 若后续运行时直接消费 `quickAmount`，应优先信任海报中保存的对象，不应再次依赖 Redux 重算
- `bannerPro` 是当前 `cloudGiftCardItem` 的加载入口
- 当前 `BuyGiftCard` 已接入最小建单能力，但支付链路仍依赖现有 `cardPayment` 页面
- 虚拟卡场景下，前端不负责生成卡号，也不负责先查卡号唯一性
- 虚拟卡号不是建单即得，而是支付完成后才产生
- 礼品卡首单创建走 SOAP，优惠改价走 REST `saveOrder`
- 买礼品卡支付完成后直接进入 `orderFinish`
- 礼品卡纸质收据打印不再使用 `orderId`，而是先拉订单详情再使用 `ecardNumber`
- `orderFinish` 中礼品卡相关的打印与短信都应优先复用挂载阶段准备好的 `giftCardInfo`
- 礼品卡过期时间展示统一使用 `giftCardExpiration -> dayjs -> YYYY-MM-DD`
- “信用卡购买礼品卡且部分支付不发短信” 仅在 `sendMsgReceiptHandler` 内处理，不应扩散到页面入口判断
- 支付异常取消时，礼品卡订单删除走 `removeGiftCard` SOAP
- 若后端修正 `customLoadAmount.value` 字段语义，前端应同步清理兼容逻辑
