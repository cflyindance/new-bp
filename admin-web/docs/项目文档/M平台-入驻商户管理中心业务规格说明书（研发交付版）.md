# M 平台入驻商户管理中心业务规格说明书（研发交付版）

> V1.0 · 2026-10-21；职责：字段、状态、解析与测试。
> 产品权威：[V1.1](./M平台-入驻商户管理中心设计方案.md)；[个人规范版 V1.0](./M平台-入驻商户管理中心需求文档（个人规范版）.md)。
> 同一业务基线：品牌—门店—角色—账号四层模型；BRAND-ACCESS-20261021-01。
> 状态：功能分支实现，验证结果见文末；生产服务未接入。

## 版本记录

| 版本 | 日期 | 变更编号 | 内容 |
| --- | --- | --- | --- |
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
3. Admin 品牌视角取品牌上限，数据范围为全部所属门店（含新增门店）。门店业务视角取品牌上限与本店开通交集。
4. 普通账号只合并命中当前门店的角色，复用 center-domain 解析，包括祖先、兼容 deny gate、设置与操作约束；不会将 A 店角色合并到 C 店。
5. 品牌汇总视角的普通账号可看到至少一家生效门店可用的菜单；业务有效数据范围按当前页面过滤门店。编辑等聚合操作要求全部目标店均允许。
6. 在侧栏、直接地址、设置只读/编辑和已注册宿主页面操作处叠加限制；仍保留平台预设、发布与订阅过滤。原独立嵌入应用的服务端与其内部操作鉴权并非本地原型能够替代。
7. 品牌首页及管理门店入口允许到达；账号与角色管理、门店菜单修改仅当前品牌 Admin（或 M 平台运营）可操作。普通账号页面不显示修改入口。

## 3. 保存与异常

品牌及门店菜单以 brandConfigurationVersion 比较编辑时的品牌、门店归属、门店菜单快照。确认保存时重新校验上限、门店归属和版本。批量处理在克隆快照中完成，一次 localStorage 写入成功后才发布；一项越界则整批不写入。

账号角色保存比较品牌权限 version；角色不能新增上限外授权，绑定不得跨品牌，必须保留至少一名启用 Admin。存储失败保留草稿，不显示成功；重复邮箱、空角色范围、密码不足、角色缺失等在保存时报具体错误。

增量模式：next = (old ∪ selected) ∩ ceiling。替换模式：next = selected ∩ ceiling。保存前逐店展示 added = next − old 与 removed = old − next；取消无写入。

收回品牌菜单后裁剪所有所属门店超上限 enabledKeys；已有角色原记录保留，运行时受上限约束。关联门店保留 MID，清除原归属下本店开通配置，新归属默认关闭。本轮不做其他品牌间迁移。

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
