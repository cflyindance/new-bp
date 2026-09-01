# MarginApp KIOSKLITE 配置字段说明文档

> 基于当前仓库 `feat/4.9.5` 源码整理。本文的“存储”特指
> `webapp/marginapp/config` 中 `product = KIOSKLITE` 的 `data` JSON。
> MarginApp 服务端可能还会给配置记录增加数据库元数据；前端只读取
> `product` 和 `data`，因此未在源码中出现的服务端元数据不在本文范围内。

## 1. 接口与存储层级

保存请求的外层结构如下。`data` 不是对象，而是经过 `JSON.stringify` 的字符串。

```json
{
  "marginAppConfigType": {
    "product": "KIOSKLITE",
    "data": "{...字符串化的 Kiosk 配置...}"
  },
  "userAuth": {
    "sessionKey": "当前配置会话",
    "userId": "当前配置用户 ID"
  }
}
```

| 路径 | 类型 | 含义 |
|---|---|---|
| `marginAppConfigType.product` | `string` | 产品标识；KioskLite 固定为 `KIOSKLITE` |
| `marginAppConfigType.data` | `string` | 完整 Kiosk 配置 JSON 字符串，真正的数据字典见下文 |
| `userAuth.sessionKey` | `string` | 配置页面取得的登录会话，用于鉴权，不属于 Kiosk 配置内容 |
| `userAuth.userId` | `string/number/null` | 配置用户 ID，用于鉴权，不属于 Kiosk 配置内容 |

读取接口返回 `marginAppConfigTypes[]`，前端用 `product === 'KIOSKLITE'` 找到记录，再对该记录的 `data` 执行 `JSON.parse`。

## 2. `data` 顶层字段

默认配置形状：

```json
{
  "charge": [],
  "configList": [],
  "soldOut": [],
  "brandManage": [],
  "promotion": [],
  "promotionEnableType": "",
  "kioskVersion": {
    "current": { "version": "", "updateTime": "" },
    "pre": { "version": "", "updateTime": "" },
    "pre2": { "version": "", "updateTime": "" }
  }
}
```

| 字段 | 类型 | 默认值/是否一定存在 | 含义 |
|---|---|---|---|
| `charge` | `ChargeConfig[]` | `[]` | Kiosk 附加费选择，共 4 个业务槽位 |
| `configList` | `ConfigItem[]` | 69 个默认项 | Kiosk 的通用配置主表；每项由 `id/key/value` 描述 |
| `soldOut` | `(number|string)[]` | `[]` | 本地售罄的菜品 `saleItemId` 列表 |
| `brandManage` | `Brand[]` | `[]` | 本地品牌及品牌适用菜品配置 |
| `promotion` | `Promotion[]` | `[]` | Kiosk 本地促销活动 |
| `promotionEnableType` | `string` | `''` | 当前启用的本地促销类型；空串表示没有指定类型 |
| `kioskVersion` | `object` | 运行后按需写入 | 店级 Kiosk 前端版本链，不在初始常量中，但由主页版本控制写入 |

### 不会持久化的 `configMap`

Redux reducer 会根据 `configList` 临时生成 `configMap`：`id: N` 映射为
`configMap.id_N = item.value`。例如 `id: 20` 在运行时可用
`selfConfig.configMap.id_20` 读取。保存代码均基于重新拉取并解析的 MarginApp
数据，默认配置中也没有 `configMap`；所以它是运行时索引，不应作为数据库字段依赖。

### 兼容性说明

- 读取时会过滤没有有效 `id` 的 `configList` 项，并补齐当前默认配置缺少的 ID。
- 未识别的顶层字段通常会因对象展开而被原样带回。它们不等于当前版本正式定义的字段。
- 历史脏数据中可能出现顶层 `updatedConfig`；当前默认结构和正常调用链均不定义该字段，不能把它当成合法配置协议。

## 配置项列表

| ID | Key | 中文名称 | 默认值 | 说明 |
|---|---|---|---|---|
| 1 | `enter-name` | 输入姓名 | `true` | 是否启用输入姓名功能 |
| 2 | `order-special-instructions` | 订单备注 | `true` | 是否启用订单备注功能 |
| 3 | `dish-special-instructions` | 产品备注 | `false` | 是否启用产品备注功能 |
| 4 | `meal-delivery-service-mode` | 送餐取餐服务方式 | `[]` | 送餐取餐服务方式配置（数组） |
| 5 | `tipping-mode` | 显示小费选项 | `true` | 是否显示小费选项 |
| 6 | `choose-languge-mode` | 选择语言 | `true` | 是否启用语言选择功能 |
| 7 | `signature-print-mode` | 打印纸质支付收据方式 | `2` | 0-自动打印, 1-手动打印, 2-不打印 |
| 8 | `print-mode` | 打印纸质订单收据方式 | `0` | 0-自动打印, 1-手动打印, 2-不打印 |
| 9 | `sms-mode` | 发送短信收据方式 | `1` | 0-自动发送, 1-手动发送, 2-不发送 |
| 10 | `languageChoose` | 选择语言 | `['en', 'zh_cn']` | 可选语言列表 |
| 11 | `default-language` | 默认语言 | `'en'` | 默认语言设置 |
| 12 | `phone-required` | 手机号必填 | `false` | 是否要求必填手机号 |
| 13 | `wait-list-mode` | 等位模式 | `false` | 是否启用等位模式 |
| 14 | `tip-collect-method` | 小费收取方式 | `[2, [15, 20, 25]]` | 小费收取方式配置（数组格式） |
| 15 | `name-required` | 姓名必填 | `false` | 是否要求必填姓名 |
| 16 | `menu-number` | 展示菜单序号 | `true` | 是否展示菜单序号 |
| 17 | `display-group-name` | 显示组名称 | `false` | 是否显示组名称 |
| 18 | `menu-image-proportional-display` | 菜单图片裁切显示 | `true` | 菜单图片是否按比例裁切显示 |
| 19 | `display-combo-navbar` | 套餐展示导航栏 | `false` | 是否显示套餐导航栏 |
| 20 | `send-kitchen-order-type` | 可自动送厨的Kiosk订单支付类型 | `[0]` | 可自动送厨的订单支付类型（数组） |
| 21 | `credit-card-min-amount` | 信用卡最低消费要求 | `0` | 信用卡支付的最低消费金额 |
| 22 | `Expand-the-first-group-by-default` | 默认展开第一组 | `true` | 是否默认展开第一组 |
| 23 | `display-signature` | 展示签名页面 | `true` | 是否展示签名页面 |
| 24 | `tip-procedure` | 选择小费流程 | `0` | 0-刷卡之前, 1-刷卡之后 |
| 25 | `show-order-type-page` | 展示订单类型选择页面 | `true` | 是否展示订单类型选择页面 |
| 26 | `brand-setting` | 品牌设置 | `false` | 是否启用品牌设置 |
| 27 | `no-tip-selection` | 展示No Tip | `true` | 是否展示"没有小费"选项 |
| 28 | `callBoard-method` | 送餐到桌餐牌号获取方式 | `0` | 0-纸质号码牌, 1-实体号码牌 |
| 29 | `show-send-dish-method` | 展示取餐方式 | `true` | 是否展示取餐方式 |
| 30 | `sub-dish-instructions` | 套餐子项备注 | `true` | 是否启用套餐子项备注 |
| 31 | `brand-home-page` | 品牌作为首页 | `false` | 是否将品牌作为首页 |
| 32 | `lazy-load-mode` | 瀑布流模式 | `true` | 是否启用瀑布流模式 |
| 33 | `menu-display-position` | 菜单展示位置 | `0` | 0-侧边展示, 1-顶部展示 |
| 34 | `licenes-device-info` | 使用licenes硬件的设备信息 | `[]` | 使用licenes硬件的设备信息（数组） |
| 35 | `screen-saver` | 屏保 | `{...}` | 屏保配置对象（包含状态、延迟时间、图片/视频列表等） |
| 36 | `togo-show-num-cards` | 打包展示输入号码牌 | `true` | 打包时是否展示号码牌输入 |
| 37 | `login-crm-need-auth` | 会员登录需要短信验证码 | `true` | 会员登录是否需要短信验证码 |
| 38 | `menu-label` | 菜单标签 | `[]` | 菜单标签配置（数组） |
| 39 | `show-choose-table-page` | 选择桌子页面 | `false` | 是否显示选择桌子页面 |
| 40 | `auto-clear-table` | 自动清桌 | `{status: false, delayTime: 0}` | 自动清桌配置（状态和延迟时间） |
| 41 | `table-in-use-by-lisense` | - | `[]` | 通过license使用的桌子信息（数组） |
| 42 | `menu-promotionlist-show` | 菜单页面展示积分菜 | `true` | 是否在菜单页面展示积分菜 |
| 43 | `menu-promotionlist-position` | 菜单页面积分菜展示位置 | `0` | 0-顶部展示, 1-底部展示 |
| 44 | `show-waiting-time` | 展示当前订单预计等待时长 | `{status: false, overTimeClose: 30, overTimeShowModal: ''}` | 等待时长展示配置 |
| 45 | `login-guide` | 登录引导图 | `{dialog: {...}, banner: {...}}` | 登录引导图配置（对话框和横幅） |
| 46 | `order-checkable-only-reward` | 订单仅有积分商品可以兑换 | `true` | 订单是否仅有积分商品可以兑换 |
| 47 | `show-waiting-time-range` | 预计等待时长区间设置 | `{status: false, overNumber: 10, overTimeMinutes: 10, rangeSubMinutes: 2, rangeAddMinutes: 2}` | 等待时长区间配置 |
| 48 | `show-points-info` | 展示账户积分 | `true` | 是否展示账户积分信息 |
| 49 | `policy-default-status` | 默认选中隐私条款 | `false` | 是否默认选中隐私条款 |
| 50 | `menusifu-footer-logo` | 展示MenuSifu品牌LOGO | `true` | 是否展示MenuSifu品牌LOGO |
| 51 | `zero-price` | 菜价为0展示价格 | `true` | 菜价为0时是否展示价格 |
| 52 | `local-promotion-status` | 开启Kiosk本地促销后台 | `true` | 是否开启Kiosk本地促销后台 |
| 53 | `local-inventory-status` | 开启Kiosk本地库存设置 | `true` | 是否开启Kiosk本地库存设置 |
| 54 | `local-label-status` | 开启Kiosk本地菜单标签设置 | `true` | 是否开启Kiosk本地菜单标签设置 |
| 55 | `tip-price-detail` | 展示百分比小费的具体金额 | `true` | 是否展示百分比小费的具体金额 |
| 56 | `waiting-time-show-type` | 等待时长展示类型 | `['count', 'time']` | 等待时长展示类型（数组：count-展示排队数量, time-展示等待时间） |
| 57 | `font-size` | 等待时长字体大小 | `{type: 'default', fontsizeMultiple: 1}` | 等待时长字体大小配置（default-系统默认, multiple-倍数） |
| 58 | `font-background-color` | 等待时长背景色 | `{type: 'default', customColor: '#000000b3'}` | 等待时长背景色配置（default-系统默认, custom-自定义） |
| 59 | `font-color` | 等待时长字体颜色 | `{type: 'default', customColor: '#FFFFFF'}` | 等待时长字体颜色配置（default-系统默认, custom-自定义） |
| 60 | `partial-payment-auto-print-receipt` | 部分支付自动打印订单收据 | `true` | 订单收据为自动打印时生效：信用卡部分支付成功后是否自动打印纸质订单收据 |
| 61 | `simple-dish-detail-display` | 展示菜详情（仅对仅含图片、名称、价格的菜品生效） | `{status: false, dishIds: []}` | 主开关 `status`；`dishIds` 为适用菜品的 saleItemId 数组（服务配置中树形多选）。树形菜单数据与「菜单标签-生效菜品」一致（不含兑换菜、促销类套餐关联菜）。关闭开关时不清空 `dishIds` |
| 62 | `show-party-size-selection` | 展示选择就餐人数 | `false` | 是否在点餐流程中展示就餐人数选择 |
| 63 | `party-size-required` | 就餐人数必选 | `false` | 是否要求用户必须选择就餐人数；建议在 `show-party-size-selection` 开启时生效 |
| 64 | `promotion-center-activity-name` | 促销中心活动标签标题来源 | `0` | 0-系统默认, 1-活动名称；控制菜单页促销中心活动列表的展示文案来源 |
| 65 | `home-language-btn-display` | 首页切换语言按钮语言设置 | `['en', 'zh_cn']` | 控制首页/语言弹窗中语言切换按钮展示哪些语言（数组，选项来源于 id:10） |
| 66 | `menu-name-bilingual-display` | 菜单名称双语展示 | `{status: false, displayLangs: [], primaryLang: ''}` | 主开关 `status`；`displayLangs` 为展示语言列表；`primaryLang` 为主语言。开启后菜品名称按「主语言 / 次语言」拼接展示 |
| 67 | `show-promotion-deals-card` | 展示促销活动卡片 | `true` | 是否展示菜单组「优惠活动」（`promotion-deals-list`）及其促销卡片 |
| 68 | `cash-pay-confirm-dialog` | 现金支付确认弹窗 | `false` | Dual Price 开启时，选择现金支付是否先展示去柜台支付确认弹窗 |
| 69 | `number-plate-page-image` | 餐牌号页面图片 | `{status: false, horizontalImg: '', verticalImg: ''}` | 是否启用餐牌号页面图片，以及横屏/竖屏图片路径 |

### `show-party-size-selection` / `party-size-required`（id: 62、63）

- 开启 `show-party-size-selection` 后，购物车确认及后续流程（选桌、取餐方式、打包选项等）完成后，在进入手机号/姓名/支付等步骤前，会先进入 `/partySizeSelection` 人数选择页。
- 选择结果写入 `currentOrder.numOfGuests`，提交订单时写入 `order.numOfGuests`（未选择且跳过时默认 `1`）。
- `party-size-required` 为 `true` 时仅展示「确认」；为 `false` 时展示「跳过」与「确认」。

### `promotion-center-activity-name`（id: 64）

- 位于「服务设置 → 展示设置」分类。
- 运行时可通过 `configMap.id_64` 读取。
- 仅影响 **促销中心活动** 在 `PromotionDealList` 中的 `text` 展示，不影响 Kiosk 本地促销、旧云 promotion 等其它促销来源。
- `0`（系统默认）：沿用 `activityRule` 生成的规则文案（与改配置前行为一致）。
- `1`（活动名称）：`text` 取促销中心活动数据中的 `promotionName`。

### `home-language-btn-display`（id: 65）

- 位于「服务设置 → 语言设置」分类（`cate-language`）。
- 运行时可通过 `configMap.id_65` 读取，值为语言 code 数组（如 `['en', 'zh_cn']`）。
- 控制首页语言切换按钮文案（`mainPage`）及语言选择弹窗（`lanModal`）中展示哪些语言选项。
- 可选项来源于「选择语言」（id: 10）中已勾选的语言；默认与 id: 10 一致。

### `menu-name-bilingual-display`（id: 66）

- 位于「服务设置 → 菜单设置」分类（`cate-menu`）。
- 运行时可通过 `configMap.id_66` 读取完整对象。
- 开启 `status` 后，点餐页菜品名称通过 `getDishItemLanguage` 按双语规则展示：
  - 仅配置 1 种展示语言：显示该语言名称。
  - 配置 2 种展示语言：按 `primaryLang`（主语言）与次语言拼接，格式为 `主语言 / 次语言`。
- 关闭 `status` 时，仍按当前界面语言单语展示（与改配置前行为一致）。
- **限制**：系统「选择语言」（id: 10）仅配置 1 种语言时，不允许开启此开关（配置页会提示「系统仅设置了一种语言」）。

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | `boolean` | 是否启用菜单名称双语展示；默认 `false` |
| `displayLangs` | `string[]` | 参与展示的语言 code 列表，最多 2 种 |
| `primaryLang` | `string` | 主语言 code；需在 `displayLangs` 内 |

### `show-promotion-deals-card`（id: 67）

- 位于「服务设置 → 展示设置」分类（`cate-display-setting`）。
- 运行时可通过 `configMap.id_67` 读取；默认 `true`（展示）。
- 控制是否在点餐页展示菜单组 **「优惠活动」**（菜单 id：`promotion-deals-list`）及其下的促销卡片（`PromotionDealList`）。
- **开启**（`true`）：存在有效促销数据时，在 `processMenuGroup` 中将「优惠活动」插入菜单组头部；促销数据变更时由 `updatePromotionDealsInMenuGroup` 刷新。
- **关闭**（`false`）：初始化菜单时不插入该菜单组；`updatePromotionDealsInMenuGroup` 直接返回，不更新促销菜单。
- 未配置此项时（旧数据），按默认 `true` 处理（`id_67 !== false` 即视为开启）。

### `cash-pay-confirm-dialog`（id: 68）

- 位于「服务设置 → 支付」分类（`cate-payment`），仅在开通 DP（Dual Price）时于配置页展示。
- 运行时可通过 `configMap.id_68` 读取；默认 `false`（关闭）。
- **开启**（`true`）且已开通 DP：在支付方式页选择现金支付时，先弹出确认对话框，提示前往柜台支付；用户可选择「柜台支付」（继续原现金流程）或「信用卡支付」（走信用卡流程）。
- **关闭**（`false`）或未开通 DP：选择现金支付时不弹出该对话框。

## 配置项结构补充说明

### `partial-payment-auto-print-receipt`（id: 60）

- 仅在 **订单收据** `print-mode`（id: 8）为 `0`（自动打印）时，在「服务配置」里与收据相关项一起展示。
- 订单完成页自动打印纸质订单收据时：若订单为信用卡部分支付，此项为 `true` 才会打印；全额支付或非部分支付场景不受此项单独限制（与 `orderFinish` 中打印判断逻辑一致）。

### `simple-dish-detail-display`（id: 61）

| 字段 | 类型 | 说明 |
|---|---|---|
| `status` | `boolean` | 是否启用「展示菜详情」能力；默认 `false` |
| `dishIds` | `number[]` | 手动勾选的无属性适用菜品 ID 列表；持久保存，与 `status` 独立 |

- 运行时可通过 `configMap.id_61` 读取完整对象。
- 仅当菜品本身仅为图片、名称、价格（无规格/选项/描述等）时，业务侧才会按此配置展示详情；具体以点餐页逻辑为准。

### `menu-name-bilingual-display`（id: 66）

- 关闭开关时不清空 `displayLangs` / `primaryLang`，与 id: 61 的 `dishIds` 行为类似。

### `tip-collect-method`（id: 14）附加字段

- 配置项上可能存在 `Authorization`（布尔）：与「先刷卡后小费」等敏感切换时的密码授权有关，以实际保存数据为准。

### `local-inventory-status` / `local-label-status`（id: 53、54）

- 可能包含 `init`（布尔）：用于首次从商户档案同步默认开关，以代码与接口为准。

## 特殊值说明

### 打印/发送模式值
- `0`: 自动打印/自动发送
- `1`: 手动打印/手动发送
- `2`: 不打印/不发送

### 小费流程值
- `0`: 刷卡之前
- `1`: 刷卡之后

### 餐牌号获取方式值
- `0`: 纸质号码牌
- `1`: 实体号码牌

### 菜单展示位置值
- `0`: 侧边展示
- `1`: 顶部展示

### 积分菜展示位置值
- `0`: 顶部展示
- `1`: 底部展示

### 促销中心活动标签标题来源值
- `0`: 系统默认（使用活动规则生成的文案）
- `1`: 活动名称（使用 `promotionName`）

### 展示促销活动卡片值
- `true`: 展示菜单组「优惠活动」及促销卡片（默认）
- `false`: 隐藏菜单组「优惠活动」及促销卡片

### 等待时长展示类型值
- `count`: 展示排队数量
- `time`: 展示等待时间

### 字体大小类型值
- `default`: 系统默认大小
- `multiple`: 系统默认大小的倍数

---

## 3. `ConfigItem` 公共结构

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | `number` | 稳定配置编号；业务代码主要用它读取配置 |
| `key` | `string` | 配置语义名及 i18n key；大小写和历史拼写均属于存储协议，不应擅自修正 |
| `value` | 任意 JSON 类型 | 配置值；具体类型和枚举见上表及下文 |
| `Authorization` | `boolean` | 可选扩展字段。目前用于 id 24，表示切换小费流程时曾完成密码授权 |
| `settingValue` | `object` | id 26 默认带有的历史扩展字段；当前品牌配置实际保存在顶层 `brandManage` |
| `init` | `boolean` | id 53、54 的初始化标记；用于首次按商户配置决定本地库存/标签开关 |

布尔型 `value` 均遵循：`true` 为开启/展示/启用，`false` 为关闭/隐藏/禁用；个别字段的前置条件见表内说明。

## 4. `configList[].value` 复合值与枚举

### id 4 `meal-delivery-service-mode`

数组可同时包含多个值：

| 值 | 含义 |
|---|---|
| `0` | 顾客取餐（Pick up） |
| `1` | 送餐到桌（Deliver to table） |

### id 7、8、9 打印/发送方式

| 值 | id 7 支付收据 | id 8 订单收据 | id 9 短信收据 |
|---|---|---|---|
| `0` | 自动打印 | 自动打印 | 自动发送 |
| `1` | 手动打印 | 手动打印 | 手动发送 |
| `2` | 不打印 | 不打印 | 不发送 |

id 8 和 id 9 不能同时为 `0`。

### id 10、11、65 语言 code

id 10 是点餐系统可选语言，id 11 是默认语言，id 65 是首页语言按钮展示语言（最多 2 个，且应来自 id 10）。配置页当前可选 code：

| code | 语言 |
|---|---|
| `en` | English |
| `zh_cn` | 中文简体 |
| `zh_tc` | 中文繁体 |
| `french` | Français |
| `jan` | 日本語（历史 code 拼写） |
| `russian` | Русский |
| `spanish` | Español |

运行时语言表还认识 `korean`、`thai`、`vietnamese`，但当前 id 10 配置页选项未提供这三项。

### id 14 `tip-collect-method`

值格式为 `[method, [option1, option2, option3]]`。

| 路径/值 | 含义 |
|---|---|
| `[0] = 1` | 固定金额小费 |
| `[0] = 2` | 百分比小费 |
| `[1]` | 3 个小费快捷值；固定金额范围为 0–999.99，百分比范围为 0–100 |

### id 20 `send-kitchen-order-type`

数组可同时包含多个值，表示哪些支付结果允许 Kiosk 自动送厨：

| 值 | 含义 |
|---|---|
| `0` | 信用卡全额支付订单 |
| `1` | 信用卡部分支付订单 |
| `2` | 现金支付订单 |

### id 24 `tip-procedure`

| 值 | 含义 |
|---|---|
| `0` | 刷卡前选择小费 |
| `1` | 刷卡后选择小费 |

同一个 `ConfigItem` 上的 `Authorization: true` 表示切换该敏感配置时已输入过授权密码。

### id 28、33、43、64 的数字枚举

| ID | `0` | `1` |
|---|---|---|
| 28 `callBoard-method` | 纸质号码牌 | 实体号码牌 |
| 33 `menu-display-position` | 左侧菜单 | 顶部菜单 |
| 43 `menu-promotionlist-position` | 积分菜置顶 | 积分菜置底 |
| 64 `promotion-center-activity-name` | 使用规则生成的默认文案 | 使用促销中心 `promotionName` |

### id 34 `licenes-device-info`

`value` 是设备数组。`licenes` 是历史存储拼写，不能当作普通拼写错误修改。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | `number|string` | POS License ID |
| `displayname` | `string` | License 显示名，也是当前 Kiosk License 名称 |
| `type` | `string` | License 类型，例如 `KIOSK` |
| `appVersion` | `string` | Kiosk 壳版本与 versionCode，格式如 `2.9.3 - 123` |
| `deviceName` | `string` | 设备名称/型号 |
| `deviceId` | `string` | 壳上报的设备唯一 ID；列表按它去重和更新 |
| `deviceType` | `string` | 设备系统类型，通常为 Android |
| `deviceSysVersion` | `string` | 设备操作系统版本 |
| `webviewVersion` | `string` | 当前 WebView 版本 |
| `horizontalDisplay` | `boolean` | 写入时屏幕是否为横屏（宽大于高） |
| `updateTime` | `string` | 最近上报时间；比较变更时按 `YYYY-MM-DD` 归一化 |
| `devicePaymentType.canPayByCard` | `boolean` | 此设备是否允许信用卡/借记卡 |
| `devicePaymentType.canPayByCash` | `boolean` | 此设备是否允许现金 |
| `devicePaymentType.canPayByEcard` | `boolean` | 此设备是否允许电子/礼品卡 |
| `menuDisplay` | `2\|3\|4\|5` | 菜单布局列数：1 行 2/3/4/5 列 |
| `brandDisplay` | `1\|2\|3` | 品牌布局列数：1 行 1/2/3 列 |

`menuDisplay`、`brandDisplay` 和 `devicePaymentType` 会在设备再次上报基础信息时从旧记录保留。支付能力还会受 POS 全局支付方式和 Dual Price 配置约束。

### id 35 `screen-saver`

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否开启屏保 |
| `dataSource` | `local\|cloud` | 使用 MarginApp 本地素材或云屏保布局 |
| `showHomePage` | `boolean` | 是否展示首页；设为 `false` 时 `delayTime` 自动变为 0 |
| `delayTime` | `number` | 无操作多少秒后进入屏保 |
| `imageAnimation` | `slide\|fade\|zoom\|rotate\|bounce\|flip` | 图片切换动画；历史数据也可能有 `fadeIn` |
| `swiperTime` | `number` | 每张图片轮播秒数 |
| `horizontalData` | `MediaGroup` | 源码历史命名存在横竖含义反置兼容，见下方说明 |
| `verticalityData` | `MediaGroup` | 源码历史命名存在横竖含义反置兼容，见下方说明 |

`MediaGroup`：

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `type` | `image\|video` | 当前播放图片还是视频 |
| `imageList` | `MediaFile[]` | 图片素材列表 |
| `videoList` | `MediaFile[]` | 视频素材列表 |
| `MediaFile.url` | `string` | Company Profile 图片/视频相对路径 |
| `MediaFile.name` 等 | 服务返回字段 | 上传后把 Company Profile 中匹配的素材对象整体存入，除 `url` 外前端没有稳定字段契约 |

历史本地配置曾把 `horizontalData` / `verticalityData` 的朝向含义写反；运行时通过 `normalizeScreenSaverDataSource` 兼容，不能仅按字段英文名判断实际屏幕方向。

### id 38 `menu-label`

`value` 是标签数组：

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `id` | `string` | 本地生成的标签 ID，格式类似 `id_xxxxxxxxx` |
| `labelName` | `string` | 标签名称/文字 |
| `labelType` | `text\|img` | 文字标签或图片标签 |
| `dish` | `(number|string)[]` | 生效菜品 ID 列表 |
| `labelImg` | `Image[]` | 图片标签素材；文字标签通常为空数组 |
| `labelImg[].url` | `string` | 图片相对路径；当前保存时会在服务路径前增加 `../` |
| `labelImg[].name` 等 | 服务返回字段 | 上传图片后把 Company Profile 图片对象整体保留，无更窄的前端契约 |

### id 41 `table-in-use-by-lisense`

`value` 是 Kiosk 选桌流程使用的临时占用数组。`lisense` 是现有存储协议中的历史拼写。

| 字段 | 类型 | 含义 |
|---|---|---|
| `lisense` | `string` | 占用该桌的 Kiosk License 名称 |
| `id` | `number|string` | 被占用的桌台 ID |

同一 License 重新选桌前会先移除自己的旧记录；离开/清理流程会按 License 删除记录。它不是 POS 订单本身的桌台占用状态。

### id 40 `auto-clear-table`

| 字段 | 类型 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否启用自动清桌 |
| `delayTime` | `number` | 自动清桌延迟时间（配置页保存为整数） |

### id 44 `show-waiting-time`

| 字段 | 类型 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否展示当前订单预计等待时长 |
| `overTimeClose` | `number` | 超过多少分钟后关闭/停止展示，默认 30 |
| `overTimeShowModal` | `number\|''` | 超过多少分钟弹窗提示；必须小于 `overTimeClose`，空串表示不弹 |

### id 45 `login-guide`

| 路径 | 类型 | 含义 |
|---|---|---|
| `dialog.status` | `boolean` | 是否开启登录引导弹窗 |
| `dialog.horizontalImg` | `string` | 弹窗横屏图片路径 |
| `dialog.verticalImg` | `string` | 弹窗竖屏图片路径 |
| `banner.status` | `boolean` | 是否开启登录引导横幅 |
| `banner.horizontalImg` | `string` | 横幅横屏图片路径 |
| `banner.verticalImg` | `string` | 横幅竖屏图片路径 |

### id 47 `show-waiting-time-range`

| 字段 | 类型 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否用区间方式展示预计等待时长 |
| `overNumber` | `number` | 触发区间算法的排队数量阈值 |
| `overTimeMinutes` | `number` | 超过该预计分钟数时使用区间 |
| `rangeSubMinutes` | `number` | 区间下界从基准时间减去的分钟数 |
| `rangeAddMinutes` | `number` | 区间上界在基准时间加上的分钟数 |

### id 56–59 等待时间展示样式

| ID/路径 | 类型/值 | 含义 |
|---|---|---|
| 56 `value[]` | `count` | 展示排队数量 |
| 56 `value[]` | `time` | 展示预计等待时间 |
| 57 `type` | `default\|multiple` | 默认字号或按倍数缩放 |
| 57 `fontsizeMultiple` | `number` | 字号倍数，非法/空值保存为 1 |
| 58 `type` | `default\|custom` | 默认背景或自定义背景色 |
| 58 `customColor` | CSS color 字符串 | 自定义背景色，默认 `#000000b3` |
| 59 `type` | `default\|custom` | 默认文字色或自定义文字色 |
| 59 `customColor` | CSS color 字符串 | 自定义文字色，默认 `#FFFFFF` |

### id 61 `simple-dish-detail-display`

| 字段 | 类型 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否为简单菜品启用菜品详情 |
| `dishIds` | `(number|string)[]` | 适用的 `saleItemId`；关闭开关不清空 |

### id 66 `menu-name-bilingual-display`

| 字段 | 类型 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否显示双语菜名 |
| `displayLangs` | `string[]` | 参与显示的语言 code，最多 2 个，必须来自 id 10 |
| `primaryLang` | `string` | 主语言 code，必须包含在 `displayLangs` 中 |

### id 69 `number-plate-page-image`

| 字段 | 类型 | 含义 |
|---|---|---|
| `status` | `boolean` | 是否在餐牌号页面显示配置图片 |
| `horizontalImg` | `string` | 横屏图片的 Company Profile 相对路径，空串表示未配置 |
| `verticalImg` | `string` | 竖屏图片的 Company Profile 相对路径，空串表示未配置 |

## 5. `charge` 附加费字段

`charge` 固定维护 4 个槽位：

| `id` | `title` | 含义 |
|---|---|---|
| `1` | `entire-order-charge` | 整单附加费；可使用固定金额或百分比 |
| `2` | `utensil-charge` | 餐具费；仅选择固定金额附加费 |
| `3` | `bag-charge` | 袋费；仅选择固定金额附加费 |
| `4` | `takeout-box-charge` | 打包盒费；固定金额会按商品数量计算 |

每个槽位结构：

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | `1\|2\|3\|4` | 上表的业务槽位 ID，不是 POS Charge ID |
| `title` | `string` | 配置页标题 i18n key |
| `select` | `object` | 当前选择的 POS Charge；`{}` 表示未选择 |
| `select.id` | `number|string` | POS Charge ID；本地虚拟 `-1` 表示 Free/不收费 |
| `select.name` | `string` | POS Charge 名称 |
| `select.rate` | `number` | 固定金额或百分比数值 |
| `select.ratetype` | `1\|2` | `1` 固定金额，`2` 百分比 |
| `select.type` | `string` | POS Charge 类型；会映射给 CRM 市场 SDK；Free 项为 `DEFAULT` |

配置页临时使用的 `data` 候选列表不会保存进 MarginApp。

## 6. `brandManage` 品牌字段

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | UUID `string` | 本地品牌唯一 ID |
| `name` | `string` | 品牌名称，配置页限制 50 字符 |
| `imgSrc` | `string\|null` | 品牌图片的 Company Profile 相对路径 |
| `dishIds` | `(number|string)[]\|null` | 归入该品牌的菜品 ID；清空时可能保存为 `null` |
| `bsTime` | `BusinessHour[]` | 品牌适用营业时段 |

`BusinessHour` 来自 POS restaurant hour 对象并整体保存，当前代码明确使用：

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | `number|string` | 营业时段 ID |
| `name` | `string` | 营业时段名称 |
| `from` | `string` | 开始时间 |
| `to` | `string` | 结束时间 |
| `fromDayOfWeek` | `SUN`–`SAT`/空 | POS 原始开始星期 |
| `toDayOfWeek` | `SUN`–`SAT`/空 | POS 原始结束星期 |
| `bsDay` | `string[]` | 前端展开后的有效星期列表 |

由于源对象采用整体保留，POS 返回的其他营业时段字段也可能随记录存储，但当前前端没有为其定义稳定语义。

## 7. `promotion` 本地促销字段

### 活动公共字段

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `id` | `string` | `nanoid` 生成的活动唯一 ID |
| `activityType` | 见下表 | 活动类型 |
| `enable` | `boolean` | 此活动是否启用 |
| `effectiveType` | `single\|multi` | 单个活动生效或多个活动共同生效；默认 `single` |
| `timeInfo` | `object` | 活动有效日期、星期及时段 |
| `activityRule` | `object` | 各活动类型专属规则 |

`activityType` / `promotionEnableType` 值：

| 值 | 含义 |
|---|---|
| `buyGifts` | 买 A 赠 B |
| `buyDiscount` | M 件 N 折 |
| `orderDiscount` | 满减/整单折扣 |
| `exchangePurchase` | 加价换购 |
| `''` | `promotionEnableType` 未指定活动类型 |

### `timeInfo`

| 字段 | 类型 | 含义 |
|---|---|---|
| `startDate` | `YYYY/MM/DD\|null` | 开始日期 |
| `endDate` | `YYYY/MM/DD\|null` | 结束日期 |
| `weekDay` | `(SUN\|MON\|TUE\|WED\|THU\|FRI\|SAT)[]` | 生效星期 |
| `startTime` | `HH:mm\|null` | 每日开始时间 |
| `endTime` | `HH:mm\|null` | 每日结束时间 |

日期、星期、每日时段三组至少要有一组有效；日期和时间若填写必须成对填写。

### 菜品选择与折扣通用值

| 字段/值 | 含义 |
|---|---|
| `buyType: random` | 购买集合内任意菜品 |
| `buyType: identical` | 购买相同菜品 |
| `giftsType: random` | 赠送/换购集合内任意菜品 |
| `giftsDishesType: manual` | 顾客手动选择赠品/换购品 |
| `discountType: fixDiscount` | 固定金额优惠 |
| `discountType: rateDiscount` | 百分比优惠 |
| `buyDishes` / `giftsDishes` | 选中的菜品 ID 数组 |

### `buyGifts` 的 `activityRule`

| 字段 | 类型 | 含义 |
|---|---|---|
| `buyType` | `random\|identical` | 购买项匹配方式 |
| `buyNumber` | `number` | 需购买数量 |
| `buyDishes` | ID 数组 | 购买菜品范围 |
| `giftsType` | `random` | 赠品匹配方式 |
| `giftsNumber` | `number` | 可赠数量 |
| `giftsDishes` | ID 数组 | 赠品范围 |
| `giftsDishesType` | `manual` | 赠品由顾客手选 |

### `buyDiscount` 的 `activityRule`

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `buyType` | `random\|identical` | 购买项匹配方式 |
| `buyNumber` | `number` | 件数门槛 |
| `buyDishes` | ID 数组 | 生效菜品范围 |
| `giftsDiscount` | `number` | 折扣百分比 |
| `giftsDiscountRule` | `'0'\|'1'` | `'0'` 第 X 件享受折扣；`'1'` 超过 X 件的部分享受折扣 |

### `orderDiscount` 的 `activityRule`

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `satisfyPrice` | `number` | 订单金额门槛 |
| `discountType` | `fixDiscount\|rateDiscount` | 固定金额或百分比优惠 |
| `discountNumber` | `number` | 优惠金额或百分比；百分比不得超过 100 |
| `isFirstOrderDiscount` | `'0'\|'1'` | `'1'` 仅首单生效，`'0'` 不限首单 |
| `usePromotionCode` | `'0'\|'1'` | 是否需要优惠码 |
| `promotionCodeName` | `string\|null` | 优惠码展示名称 |
| `promotionCode` | `string\|null` | 实际优惠码，配置页限制 15 字符 |

### `exchangePurchase` 的 `activityRule`

| 字段 | 类型/值 | 含义 |
|---|---|---|
| `conditionType` | `orderAmount\|itemQuantity` | `orderAmount` 按订单金额门槛；`itemQuantity` 按购买菜品数量条件 |
| `satisfyPrice` | `number\|null` | 按订单金额时的门槛 |
| `buyType` | `random\|identical` | 按菜品时的匹配方式 |
| `buyNumber` | `number\|null` | 按菜品时的购买数量 |
| `buyDishes` | ID 数组 | 按菜品时的购买范围 |
| `giftsDishesType` | `manual` | 换购菜品由顾客手选 |
| `giftsType` | `random` | 换购集合匹配方式 |
| `giftsNumber` | `number` | 可换购数量 |
| `giftsDishes` | ID 数组 | 可换购菜品范围 |
| `discountType` | `fixDiscount\|rateDiscount` | 换购优惠方式 |
| `discountNumber` | `number` | 换购优惠金额或百分比 |

## 8. `kioskVersion` 版本链

| 路径 | 类型 | 含义 |
|---|---|---|
| `current.version` | `string` | 当前检测到的 Kiosk 前端版本 |
| `current.updateTime` | `YYYY-MM-DD` | 当前版本写入日期 |
| `pre.version` | `string` | 上一个版本 |
| `pre.updateTime` | `YYYY-MM-DD\|''` | 上一个版本原来的更新时间 |
| `pre2.version` | `string` | 再上一个版本 |
| `pre2.updateTime` | `YYYY-MM-DD\|''` | 再上一个版本更新时间 |

该结构是店级共享版本链，不是每个 id 34 设备各自的版本历史。

## 9. 字段来源与维护原则

- 默认顶层字段和 id 1–69：`src/constants/selfConfig.js`。
- API 外壳：`src/api/kioskConfigApi.js`。
- `configMap` 派生规则：`src/reducers/selfConfig.js`。
- 设备字段：主页设备上报、`configSyncUtils.js` 与设备设置页。
- 品牌、库存、标签、屏保、促销、附加费字段：对应的 `src/container/configApp/*` 页面。
- 文档描述的是当前源码能确认的键和值。对于上传图片、营业时段、POS Charge 这类“把服务返回对象整体保存”的位置，只把前端实际读取/构造的字段视为稳定契约。


