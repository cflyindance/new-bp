# M 平台入驻商户管理中心业务规格说明书（研发交付版）

> V1.7 · 2026-10-21；职责：字段、状态、解析与测试。
> 产品权威：[V1.8](./M平台-入驻商户管理中心设计方案.md)；[个人规范版 V1.7](./M平台-入驻商户管理中心需求文档（个人规范版）.md)。
> 同一业务基线：品牌—门店—角色—账号四层模型；最新变更 BRAND-CREATE-FULLPAGE-20261021-07，权限基线 BRAND-ACCESS-20261021-01。
> 状态：功能分支实现，验证结果见文末；生产服务未接入。

## 版本记录

| 版本 | 日期 | 变更编号 | 内容 |
| --- | --- | --- | --- |
| V1.7 | 2026-10-21 | BRAND-CREATE-FULLPAGE-20261021-07 | 创建独立页，配对产品 V1.8 / 研发 V1.7 / 个人 V1.7 |
| V1.6 | 2026-10-21 | BRAND-FILTER-LAYOUT-20261021-06 | 品牌列表筛选栏布局，配对产品 V1.7 / 研发 V1.6 / 个人 V1.6 |
| V1.5 | 2026-10-21 | BRAND-LIST-COPY-20261021-05 | 移除三处说明，配对产品 V1.6 / 研发 V1.5 / 个人 V1.5 |
| V1.4 | 2026-10-21 | BRAND-DETAIL-COPY-20261021-04 | 品牌门店命名及六处说明移除，配对产品 V1.5 / 研发 V1.4 / 个人 V1.4 |
| V1.3 | 2026-10-21 | BRAND-DETAIL-HIDEGROUP-20261021-03 | 品牌详情五页签移除顶部集团区；配对产品 V1.4 / 研发 V1.3 / 个人 V1.3 |
| V1.2 | 2026-10-21 | BRAND-DETAIL-FULLPAGE-20261021-02 | 配对产品 V1.3 / 个人 V1.2，整体品牌详情独立展示，五页签和 Enterprise 区保留 |
| V1.1 | 2026-10-21 | BRAND-ACCOUNTS-FULLPAGE-20261021-01 | 配对产品 V1.2 / 个人 V1.1，初次账号与角色全窗口展示；范围已由 V1.2 完整品牌详情替代 |
| V1.0 | 2026-10-21 | BRAND-ACCESS-20261021-01 | 配对产品 V1.1，新增品牌隔离账号角色、显式菜单上限与门店双入口配置 |

## 1. 对象与字段

### 品牌主数据（复用 EnterpriseMerchant）

| 字段 | 逻辑说明 |
| --- | --- |
| merchantId | string，系统生成，不可编辑；本次品牌的内部主键，不新增第二个同名租户对象 |
| bid | string，已有 BID；与门店 MID 区分，沿用生成规则 |
| groupId | string，创建必选；候选门店限定同集团 |
| name | string，去首尾空格，品牌名必填，创建输入最长 60 字 |
| contactName | string，联系人必填，最长 30 字 |
| primaryAdminEmail | 历史主管理员邮箱；新流程账号独立开通，不凭空填入邮箱或自动授超管 |
| accountProvisioningRequired | boolean，可缺省；新向导写 true，要求显式开通登录账号；旧品牌缺省保留登录兼容 |
| orgType | 新向导创建 chain；单店仍可作为一店品牌，旧入口兼容 |
| status | 沿用已有生命周期；本向导确认后 active；品牌暂停等既有状态约束仍适用 |

### 品牌菜单（复用 MerchantCapabilitySnapshot）

| 字段 | 逻辑说明 |
| --- | --- |
| businessTypeIds | string[]，至少一项，创建选择；不替代菜单显式开通 |
| productLineIds | string[]，至少一项，按所选产线合并菜单候选 |
| services | 原节点记录数组，nodeKey/serviceId 引用现有路由树；启用项保存 enabled=true，基础/收费分类沿用既有模块分类 |
| menuGrantMode | 新流程写 explicit；空选择保持为空，不回填默认服务；旧值缺省保留旧解析 |
| menuResourceKeys | string[]，保存时冻结与当前路由对应的权限资源身份；新注册资源不自动进入既有品牌授权 |

### 门店与门店菜单

| 字段 | 逻辑说明 |
| --- | --- |
| storeId | MID，关联门店不重建身份 |
| merchantId | 组织归属的品牌 id；本轮普通关联只能选择同集团可挂接的独立门店 |
| linkedMerchantId | 保留旧挂载身份；不直接据此推断人员授权 |
| brandId / regionId | 使用目标品牌已有兼容组织节点；未配置必要组织时失败，避免悬空归属 |
| enabledKeys | string[]，本店显式开通节点；缺省 []；写入必须为品牌上限子集 |
| updatedAt | ISO string，保存时系统时间；未配置可缺省 |
| updatedBy | string，实际操作邮箱；两个入口均记录 |

### BrandAccessState（按品牌独立保存）

存储键 `menusifu:brand-access:v1:<merchantId>`。schema=1；version 初始 0，每次保存 +1；roles、accounts、employees、logs 初始为空。查看空状态不自动创建角色或账号。旧全局 RBAC、员工权限工作台数据不被覆盖或自动迁移。

| 字段 | 逻辑说明 |
| --- | --- |
| roles[].id | UUID，品牌内角色主键 |
| roles[].name | 去空白后必填，最长 30 字；品牌内名称唯一 |
| roles[].description | string，默认空，最长 160 字 |
| roles[].grants | 复用现有权限资源键及 hidden/read/edit 语义；页面可见、设置只读/编辑、实际已注册操作分别配置 |
| accounts[].id | UUID，对应 employees[].id |
| accounts[].name | 必填，最长 30 字 |
| accounts[].email | 去空白并小写；沿用当前演示登录的 menusifu.cn / menusifu.com；同品牌不重复，不复用另一品牌的账号身份 |
| accounts[].admin | boolean；明确的品牌 Admin 身份，不由“角色数量为空”推导 |
| accounts[].enabled | boolean；默认 true；停用后拒绝登录并在已有会话中收回有效范围 |
| accounts[].password | 原型本地演示凭据，新开通必填且至少 6 位；编辑留空保留原值；不写入审计。生产须接实际凭据服务，不把 localStorage 当生产安全边界 |
| employees[].bindings | 每一条为 id + roleId + scope；scope.mode=stores，scope.ids 为本品牌门店 MID 非空数组；不同绑定不互相扩展 |
| employees[].overrides | 本流程固定空对象，不新增个人例外授权 |
| logs[] | 操作人、时间、动作、品牌及脱敏前后值；账号密码从审计前后值中移除 |

## 2. 授权解析与运行链

1. 显式品牌账号优先按邮箱识别；旧主管理员仍可按已有品牌记录解析为 Admin。未纳入本模型的旧用户继续使用旧会话规则。
2. 从品牌当前路由节点及保存的资源身份快照生成菜单上限；目录容器只负责结构，不能授权兄弟页面。
3. Admin 品牌视角取品牌上限，数据范围为全部品牌门店（含新增门店）。门店业务视角取品牌上限与本店开通交集。
4. 普通账号只合并命中当前门店的角色，复用 center-domain 解析，包括祖先、兼容 deny gate、设置与操作约束；不会将 A 店角色合并到 C 店。
5. 品牌汇总视角的普通账号可看到至少一家生效门店可用的菜单；业务有效数据范围按当前页面过滤门店。编辑等聚合操作要求全部目标店均允许。
6. 在侧栏、直接地址、设置只读/编辑和已注册宿主页面操作处叠加限制；仍保留平台预设、发布与订阅过滤。原独立嵌入应用的服务端与其内部操作鉴权并非本地原型能够替代。
7. 品牌首页及管理门店入口允许到达；账号与角色管理、门店菜单修改仅当前品牌 Admin（或 M 平台运营）可操作。普通账号页面不显示修改入口。

## 3. 保存与异常

品牌及门店菜单以 brandConfigurationVersion 比较编辑时的品牌、门店归属、门店菜单快照。确认保存时重新校验上限、门店归属和版本。批量处理在克隆快照中完成，一次 localStorage 写入成功后才发布；一项越界则整批不写入。

账号角色保存比较品牌权限 version；角色不能新增上限外授权，绑定不得跨品牌，必须保留至少一名启用 Admin。存储失败保留草稿，不显示成功；重复邮箱、空角色范围、密码不足、角色缺失等在保存时报具体错误。

增量模式：next = (old ∪ selected) ∩ ceiling。替换模式：next = selected ∩ ceiling。保存前逐店展示 added = next − old 与 removed = old − next；取消无写入。

收回品牌菜单后裁剪所有品牌门店超上限 enabledKeys；已有角色原记录保留，运行时受上限约束。关联门店保留 MID，清除原归属下本店开通配置，新归属默认关闭。本轮不做其他品牌间迁移。

## 4. 可复算算例

| 场景 | 输入 | 预期 |
| --- | --- | --- |
| 按角色隔离门店 | 店长角色订单权限绑定 A/B；财务角色报表权限绑定 C | 订单数据只含 A/B，财务权限不扩展到 A/B；C 无店长订单权限 |
| 门店上限 | A 店关闭会员，店长角色有会员 | A 店会员不可用 |
| Admin 双视角 | 品牌开通报表，C 店未开通 | Admin 品牌视角可见；进入 C 店业务视角不可用 |
| 增量 | A=[订单]，B=[报表]，selected=[会员] | A=[订单,会员]；B=[报表,会员] |
| 替换 | 同上，selected=[会员] | A/B 均为 [会员]，预览提示订单/报表被关闭 |
| 并发 | 编辑读取 v3，另窗口保存为 v4，再提交 v3 | 拒绝，保留选择，提示刷新重试 |
| 跨品牌 | 当前品牌 A，提交 B 品牌 MID | 整批失败；B 不变 |
| 空菜单 | 显式清空品牌菜单 | 门店对应项被裁剪；刷新不恢复默认菜单 |
| 新路由 | 品牌保存后新增路由节点 | 不自动授予，需运营再次编辑品牌菜单 |
| 取消 | 修改后选择放弃 | 不变更版本、配置、日志 |
| 新门店 | 品牌新增关联门店 D | Admin 可见 D；D 菜单为空 |

## 4.1 M 平台完整品牌详情独立布局

![品牌详情全窗口概览](assets/brand-menu-access/detail-full-overview.png)

图注：codex/brand-detail-hide-group-20261021，main@f6712e85 基线，1920×1000 本地功能预览。

- 适用范围：现有 parseMerchantDetailPath 成功解析的品牌详情，包括 overview、org、capabilities、accounts、changelog；各入口、直接访问、刷新统一由 M 平台 Shell 渲染独立 main，宽度 100%、高度 100dvh；不渲染 sidebar、通用 header，也不套 90rem 内容容器。其他平台页面和商家后台不变。
- 移除品牌详情五个页签的顶部 Enterprise 信息及切换区；保留品牌身份、五个详情页签、返回品牌列表链接。概览基本信息里的所属集团字段不移除；其余平台页面的 Enterprise 区不受影响。各页签继续使用原地址、品牌 id 及工作区绑定；切换不退出独立布局。未知品牌沿用未找到提示。返回固定品牌列表路由，恢复平台导航。
- 保留原滚动容器及弹框；无持久化字段、接口、权限、默认值、版本冲突或保存语义变更。查看、页签切换和刷新不写入配置；编辑弹框沿用原有未保存保护。
- 验收：1920×1000 下五页签主页面均等于视口且无平台侧栏，Enterprise 区不存在；390×844 五页签无文档级横向溢出；刷新保持独立布局，账号弹框正常打开取消；返回恢复列表导航。浏览器无 pageerror。本次移除集团区域的改动本轮已获授权提交并合入本地 main，未获推送授权。

## 5. 实现与验证入口

- `src/config/brand-access-domain.ts`：纯授权与集合语义。
- `src/config/brand-access-store.ts`、`brand-menu-catalog.ts`：品牌隔离、目录映射、登录与运行时叠加。
- `src/config/brand-access-ui.ts`：共用创建、门店菜单、账号和角色交互。
- `src/config/enterprise-merchant-store.ts`：品牌主数据及原子菜单/关联写入。
- `scripts/verify-brand-menu-access.ts`：纯领域断言。
- `scripts/verify-brand-menu-access-browser.mjs`：真实浏览器创建、登录、双入口、角色门店绑定、冲突和截图。

测试状态以本次实际执行报告及 `assets/brand-menu-access/verification.json` 为准。CI、生产接口、部署及跨设备同步未在本任务验收。

### 本次执行记录

品牌领域断言、TypeScript、`verify-permission-staff-role-scope.ts`、`verify-subscription-navigation-default.ts`、`verify:subscription-service`、`verify:recursive-navigation` 和宿主 Vite 构建通过。浏览器无 pageerror；验收覆盖双入口、分角色门店范围、Admin 品牌/门店视角、版本冲突及刷新保持。产物位于本目录 assets/brand-menu-access，截图逐页见个人规范版。

既有 `verify-permission-center.ts` 在 `Operation page cannot be selected: /team/shift-scheduling` 处失败，干净 main@f848526b 同样失败。本次不扩展为排班权限模型修复。宿主构建输出在 `.cache/brand-access-build`，没有替换 dist 或重建 eMenu；本次未改 vendor/emenu-new。

## 品牌详情文案调整（BRAND-DETAIL-COPY-20261021-04）

界面原“所属门店”统一显示“品牌门店”，包括页签、标题、统计、列表及创建与提示中的同义文案；org 路由与数据字段保持原值。移除品牌门店页品牌名后的管理说明、品牌菜单页品牌名后的功能上限说明及 Admin 说明条、账号与角色页的角色复用说明及 Admin/普通账号说明条、变更记录页的范围说明。移除元素本身，不保留空白占位。只精简界面文案，品牌/门店/角色/账号权限、绑定、保存及审计规则不变。

## 列表与菜单弹框文案精简（BRAND-LIST-COPY-20261021-05）

移除品牌列表顶部“检索与管理企业名下所有入驻品牌……”整段说明；移除门店列表顶部“汇总全部 Enterprise……”整段动态数量说明；移除单店和批量门店菜单配置弹框标题下“可选菜单来自品牌开通范围；M 平台与品牌 Admin 共用本配置。”说明，不渲染空副标题。筛选、列表、组织树入口、新建品牌、菜单候选上限及保存行为不变，M 平台与商家 Admin 共用弹框均生效。最新页面截图见 assets/brand-menu-access/copy-clean-brand-list.png、copy-clean-store-list.png、copy-clean-store-dialog.png。本轮本轮已获授权提交并合入本地 main，未获推送授权。

## 品牌列表筛选栏布局（BRAND-FILTER-LAYOUT-20261021-06）

![品牌列表筛选栏](assets/brand-menu-access/brand-filter-layout.png)

图注：codex/brand-filter-layout-20261021，main@4fe20faa 起始，本地功能预览。

| 元素 | 逻辑说明 |
| --- | --- |
| 筛选栏 | 状态、所属集团、搜索依次排列；去掉外层白色卡片背景、边框与内边距，输入控件样式和筛选行为保持原值。 |
| 新建品牌 | 位于搜索条件之后，与筛选控件底部对齐；点击沿用原创建品牌地址。宽度不足时自然换行，始终在筛选条件之后；不提交筛选表单。 |

本次已获授权提交、合并 main 并推送 GitHub；不变更授权或数据。

## 新建品牌独立全窗口（BRAND-CREATE-FULLPAGE-20261021-07）

![创建品牌：基本信息](assets/brand-menu-access/create-full-basic.png)

图注：codex/brand-create-fullpage-20261021，main@4aebd008 基线，5201 本地功能预览；旧创建截图仅作字段参考，整体布局以本节为准。

| 元素或行为 | 逻辑说明 |
| --- | --- |
| 页面容器 | 原 /m-platform/merchants/new 地址独立占满视口（100% 宽、100dvh 高）；隐藏平台侧栏、通用顶栏、顶部 Enterprise 信息及切换器，不受 90rem 限宽。直接访问、刷新和列表入口一致。 |
| 返回品牌列表 | 保留现有返回地址和真实编辑后的草稿保护；无编辑查看后返回不提示。 |
| 创建品牌标题 | 保留标题，删除其下“先确认品牌、品牌门店与菜单范围，创建后再开通登录账号”说明，不留空段落。 |
| 所属集团字段 | 保留表单内必填所属集团及候选逻辑；本次仅移除页面顶部集团上下文区域。 |
| 三步创建与保存 | 品牌信息、选择品牌门店、开通品牌菜单继续复用原表单、校验、候选、预览、创建及跳转；步骤往返保留输入，权限和数据模型不变。 |
| 页面滚动 | 内容超过视口时创建区内部滚动，窄屏单列显示且底部操作可滚动到达。 |

![创建品牌：品牌门店](assets/brand-menu-access/create-full-stores.png)

图注：第二步，当前独立布局；字段与选择行为沿用原规则。

![创建品牌：菜单开通](assets/brand-menu-access/create-full-menus.png)

图注：第三步，当前独立布局；字段和菜单规则沿用原定义。

验证：1440×1000 独立窗口、无侧栏及顶部集团区、指定文案消失，三步切换及返回上步保留输入、刷新、390×844 内部滚动、返回列表通过。本轮已获授权提交并合入本地 main，未获推送授权。
