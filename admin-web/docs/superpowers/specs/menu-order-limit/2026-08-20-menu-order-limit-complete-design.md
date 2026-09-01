
# 菜单下单限制：数量与频次限制完整设计方案

状态：已确认并已实现（后台配置原型；运行时判定为目标态）
日期：2026-08-20
模块：前厅管理中心 / 菜单下单限制 / 数量与频次限制
版本：v1.1（与 PRD/SPEC MOL-01～MOL-31、专项 specs 对齐）
方案：统一规则模型、统一计算语义；配置侧已落地，服务端最终裁决为目标态
代码依据：order-limit-flow.js、order-limit.html、foh-menu-order-limits-ui.ts

# 1. 背景与目标

> **落地状态：配置侧已落地；订单运行时判定为目标态**

前厅管理中心「菜单下单限制 > 数量与频次限制」已完成规则设计器、人数/轮次场景、按门店分类/菜品数量矩阵、生效范围（活动周期/营业时段/会员/门店）、超限授权配置、规则列表与六步发布确认。规则保存在浏览器 localStorage，尚未接入 POS/Kiosk/eMenu/SDI 订单事务与服务端统一判定引擎。
本方案「频次」指每轮、多轮、与轮次无关三种统计周期，不包含「两次提交间隔秒数」等时间节流（属于「其他设置」Tab，不在本文范围）。

## 1.1 核心目标

- 统一 12 种限购主体×统计周期×限购对象组合的配置、展示与计算公式解释。
- 按人数限购 = 人均配置 L × 有效人数 N，不追踪具体食客。
- 统一 storeConfigs[storeId] 数据模型：structureByLine、limits 数量矩阵。
- 六步向导：规则类型→场景配置→限购数量→超限授权→生效范围→确认发布。
- 商品选品并入限购数量；完整商品规则列表一行一条（门店×人数×轮次×产线×商品）。
- 草稿 900ms 自动保存；sessionStorage 恢复副本仅写入/清理，不读取恢复。
- 发布前全量校验 + 独立发布确认页；正式规则编辑派生草稿，发布后替换源 ID。
- 数量三态：空=未配置、0=禁止、正整数=上限；不支持显式「不限制」。
- 二次确认一律页面内自定义对话框（非 alert/confirm）。

## 1.2 非目标

- 首期不建立独立远程规则微服务；运行时引擎随订单服务部署（未落地）。
- 不追踪每份商品属于哪位食客。
- 首期不支持离线点单写入或运行时超限授权（未落地）。
- 数量授权不绕过售罄、停售、支付等其他限制（运行时未接入）。
- 不自动将旧 localStorage 发布为正式服务端规则；仅本地原型存储。
- 隐藏的点菜模拟验证、其他两个 Tab 内部业务不在交付范围。

# 2. 术语

| 术语 | 定义 | 配置/运行时 |
| --- | --- | --- |
| 按订单限购 | subject=order；EffectiveLimit=L | 已配置 / 目标运行时 |
| 按人数限购 | subject=party_size；EffectiveLimit=L×N | 已配置 / 目标运行时 |
| 每轮 | period=per_round；各轮独立数量池 | 已配置 / 目标运行时 |
| 多轮 | period=multi_round；轮次区间不同 L | 已配置 / 目标运行时 |
| 与轮次无关 | period=order_lifetime；全单累计 | 已配置 / 目标运行时 |
| 按分类限购 | targetType=category；分类内共享池 | 已配置 / 目标运行时 |
| 按菜品限购 | targetType=dish；每菜独立池 | 已配置 / 目标运行时 |
| 有效人数 N | adult+child 或仅 adult（childCountPolicy） | 已配置 / 目标运行时 |
| Committed | 已提交且未释放占用量 | 目标运行时 |
| CandidateCart | 应用本次变更后的候选数量 | 目标运行时 |
| 本次操作 | authorization scope=operation | 已配置 / 目标运行时 |
| 当前轮授权 | scope=round | 已配置 / 目标运行时 |
| 当前订单授权 | scope=order | 已配置 / 目标运行时 |
| 参与门店 | participatingStoreIds；有 targetIds 的门店 | 已落地 |
| 生效门店 | deployStoreIds；发布快照门店 | 已落地 |


# 3. 总体架构


## 3.1 当前落地架构（已实现）

```text
应用壳 /operations/queue-call/menu-order-limits
  foh-menu-order-limits-ui.ts（三页签 + iframe 全屏）
    order-limit.html（列表 + 筛选 + 字段设置）
    order-limit-rule-editor.html（六步编辑器）
    order-limit-publish-confirm.html（发布确认）
      order-limit-flow.js
        localStorage.restaurantRules
        sessionStorage.restaurantRuleRecovery:{draftId}
```


## 3.2 目标态架构（模板原方案，未落地）

```text
后台设计器 → 规则管理 API → 门店规则存储 → 统一限购判定引擎
POS/Kiosk/eMenu/SDI → 客户端预校验 → 判定引擎 → 加购/提交
超限 → 服务员授权 → 凭证 → 重新判定 → 审计
```


## 3.3 架构原则

| 原则 | 配置侧现状 | 目标态 |
| --- | --- | --- |
| 统一 DTO/语义 | EditorDraft + 兼容顶层投影 | 服务端/终端共用 |
| 客户端预校验 | 无 | 及时提示剩余额度 |
| 服务端最终裁决 | 无 | 写订单事务内校验 |
| 规则版本 | 本地覆盖写，无 version 字段 | 不可变版本 + 回滚 |
| 多终端共享池 | 无 | 同一 orderId 共享额度 |
| 多规则 AND | 可配多条规则 | 运行时 AND 判定 |


# 4. 统一计算模型

定义：N=有效就餐人数；L=当前人数/轮次区间、分类或菜品配置数量。
```text
按订单：EffectiveLimit = L
按人数：EffectiveLimit = L × N
允许增加（目标态）：Committed + CandidateCart <= EffectiveLimit
```

配置侧在步骤 1 实时展示规则解释与公式；运行时 Committed/CandidateCart 由订单服务维护（未落地）。

## 4.1 数量三态（已确认）

| 配置状态 | configured | value | UI 含义 | 校验 |
| --- | --- | --- | --- | --- |
| 留空/未配置 | false 或缺失 | null | placeholder「未配置」 | 不能离开步骤 3/发布 |
| 禁止 | true | 0 | 明确禁止 | 已配置，可发布 |
| 正整数 | true | >0 | 限购上限 | 已配置，可发布 |

已移除：configured=true,value=null（旧「不限制」）→ 归一化为未配置。已移除：批量工具栏单独「设为禁止」按钮；输入 0 后「应用数量」表达禁止。

# 5. 十二种场景

| 场景 | 实际限额 | 统计范围 | 配置 |
| --- | --- | --- | --- |
| 按订单+每轮+分类 | L | 当前订单、当前轮、分类总数 | 已支持 |
| 按订单+每轮+菜品 | L | 当前订单、当前轮、菜品总数 | 已支持 |
| 按订单+多轮+分类 | 当前轮次区间 L | 当前订单、当前轮、分类总数 | 已支持 |
| 按订单+多轮+菜品 | 当前轮次区间 L | 当前订单、当前轮、菜品总数 | 已支持 |
| 按订单+与轮次无关+分类 | L | 订单全部轮次、分类总数 | 已支持 |
| 按订单+与轮次无关+菜品 | L | 订单全部轮次、菜品总数 | 已支持 |
| 按人数+每轮+分类 | L×N | 当前订单、当前轮、分类总数 | 已支持 |
| 按人数+每轮+菜品 | L×N | 当前订单、当前轮、菜品总数 | 已支持 |
| 按人数+多轮+分类 | 轮次区间 L×N | 当前订单、当前轮、分类总数 | 已支持 |
| 按人数+多轮+菜品 | 轮次区间 L×N | 当前订单、当前轮、菜品总数 | 已支持 |
| 按人数+与轮次无关+分类 | L×N | 订单全部轮次、分类总数 | 已支持 |
| 按人数+与轮次无关+菜品 | L×N | 订单全部轮次、菜品总数 | 已支持 |


## 5.1 分类规则示例

分类 A 含 a,b,c；按人数每轮 L=2，N=4 → 当前轮实际限额 2×4=8 份。

## 5.2 菜品规则示例

四人按人数每轮：a 1/人→4；b 2/人→8；c 3/人→12。a 达上限只限 a。

## 5.3 多轮规则示例

分类 A 按订单多轮：第1轮3、第2轮2、第3轮1、第4轮及以后0；各轮独立池。

# 6. 多规则叠加和重复校验

> **落地状态：配置侧允许多规则；运行时 AND 与冲突检测为目标态**

- 不同维度可叠加：分类总量+单品、按订单+按人数、每轮+整单等（目标态 AND）。
- 禁止重复：三核心维度完全相同 + 目标交集 + 门店/产线/时间/会员交集 + 同型无优先级（目标态发布校验）。
- 当前原型：列表可存多条规则；发布时不做自动冲突检测；无服务端判定。

# 7. 后台配置流程

> **落地状态：已落地（六步；原模板七步中「基础信息+商品」已合并）**


### 7.0 规则列表（入口页，order-limit.html）

| 能力 | 说明 |
| --- | --- |
| 新增规则 | 创建 draft，进入步骤1 |
| 编辑 | draft 继续；正式规则派生 sourceRuleId 草稿 |
| 复制 | 独立 draft，名称加「(副本)」 |
| 查看 | ruleId + view=1 只读六步 |
| 启停 | active↔inactive；draft 无 |
| 删除 | 自定义确认框 |
| 筛选 | 门店/状态/人数/轮次/时间 AND；重置 |
| 字段设置 | 分组显隐列；固定 name/status/actions |
| 滚动 | 标题+表头固定，.section-body 内滚动 |


### 7.1 第一步：规则类型

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | string | 是 | 规则名称，maxlength=60 |
| description | string | 否 | 规则描述，maxlength=200 |
| subject | order|party_size | 是 | 限购主体 |
| period | per_round|multi_round|order_lifetime | 是 | 统计周期/频次 |
| targetType | category|dish | 是 | 限购对象；切换清空已选商品 |
| conditions.childCountPolicy | inherit|include|exclude | 条件 | 仅 party_size 展示 |

实时展示规则类型解释与计算公式。校验：四维必选 + 名称非空。

### 7.2 第二步：场景配置（原模板第三步）

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| partyRanges[] | Range{min,max} | 从1连续、末段及以上、可自动补全 |
| roundRanges[] | Range{min,max} | 仅 multi_round；同上连续规则 |

区间变更（含自动补全）清空全部门店 limits；删除区间前确认。

### 7.3 第三步：限购数量（合并原第二步商品范围 + 第四步数量）

- 全局「添加商品」→ 门店 + 产线 + 分类/菜品；临时 productAddDialog 差异提交。
- storeConfigs[storeId].structureByLine / targetIds / limits。
- 完整规则列表：筛选（门店/人数/轮次/产线/状态/搜索）、分页 10/20/50/100、批量填数/删商品。
- 跨场景复制、跨产线复制、已选预览、已配数量预览。
- 已移除：场景矩阵主区、产线 Tab 平铺、独立商品配置步骤、批量「设为禁止」/「设为不限制」。
- 已移除模板四附加字段：每轮最大总份数、最大生效轮次、每人每轮上限、单次下单上限。
商品弹层 productAddDialog 字段：open, storeId, structureByLine, dirty, query, searchComposing。
规则行展开：门店 × partyRanges ×（multi_round ? roundRanges : 1）× 产线 × target → 一行。
规则行字段：勾选、配置门店、人数场景、轮次（多轮/每轮/与轮次无关文案）、产线、菜单、限购数量、移除。
| limitRuleList 字段 | 默认 | 行为 |
| --- | --- | --- |
| storeId | "" | 门店筛选；变更回第1页清勾选 |
| partyKey / roundKey | "" | 人数/轮次筛选 |
| lineId | "" | 产线筛选 kiosk|emenu|sdi |
| status | "" | configured|unconfigured |
| query | "" | 菜品/分类名称搜索 |
| page / pageSize | 1 / 20 | 10|20|50|100 |
| selectedRowIds | [] | 跨页保留；筛选重置清空 |

批量：勾选 selectedRowIds 后输入数量点「应用数量」；0=禁止；空输入校验不应用。批量删除按门店+产线+商品去重；有数量时一次汇总确认。

### 7.4 第四步：超限授权（原模板第六步）

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| authorization.enabled | boolean | true | false=硬性拒绝 |
| allowedScopes | operation|round|order[] | 全开 | 至少一项 |
| defaultScope | scope | round | 须属于 allowedScopes |
| scopePermissions | Record<scope,role> | 各范围角色 | 值班经理/主管/店长/区域经理 |
| reasonRequired | boolean | true | 授权原因必填（配置项） |


### 7.5 第五步：生效范围（原模板第五步）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| effectiveFrom / effectiveTo | date | 结束空=长期；结束≥开始 |
| activityCycle | daily|weekly|monthly | 活动周期 |
| daysOfWeek | weekday[] | weekly 至少一天 |
| daysOfMonth | 1-31[] | monthly 至少一日 |
| businessHourSlots | {id,mode,from,to}[] | all|lunch|dinner；full|custom |
| businessHourSetupMode | all_full|per_slot | 全时段/逐时段 |
| memberMode / memberLevelIds | all|specified | 指定会员非空 |
| deployStoreIds | string[] | 须为已添加商品门店，≥1 |
| deployExcludedStoreIds | string[] | 用户主动取消生效的记忆 |

营业时段边界：全天 00:00-23:59；午市 11:00-16:59；晚市 17:00-23:00。custom 须在父边界内。
| businessHourSlots[] | 类型 | 说明 |
| --- | --- | --- |
| id | all|lunch|dinner | 全天与午/晚互斥 |
| mode | full|custom | 该时段全段或指定时间 |
| from / to | HH:MM | 仅 custom；开始<结束；在父边界内 |

activityCycle=daily 无额外日控件；weekly 用 daysOfWeek；monthly 用 daysOfMonth（当月无则跳过）。

### 7.6 第六步：确认与发布（原模板第七步）

- 汇总：规则公式、商品范围、人数/轮次矩阵完成度、生效条件、授权策略、生效门店。
- 失败项「前往修正」跳转对应步骤。
- 「保存并下发」→ order-limit-publish-confirm.html 二次 validateAll。

### 7.7 生命周期

```text
draft → active ↔ inactive
编辑正式规则：sourceRuleId 草稿 → 发布替换源 ID
复制：独立 draft，无 sourceRuleId
```

当前无 pending/archived 状态；启停仅正式规则。

# 8. 规则数据模型

> **落地状态：已落地（localStorage JSON）**


## 8.1 StoredRule

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| id | number|string | 是 | maxId+1 | 规则 ID |
| sourceRuleId | id|null | 否 | null | 编辑正式规则来源 |
| status | draft|active|inactive | 是 | draft | 无 pending/archived |
| created | YYYY-MM-DD | 是 | 当日 | 发布覆盖保留源 created |
| publishedAt | ISO | 正式 | 发布时 | 仅展示 |
| editorDraft | EditorDraft | 是 | defaultDraft() | 运行/编辑快照 |
| authoringDraft | EditorDraft | 正式 | 发布保存 | 编辑正式时优先读 |
| 兼容顶层字段 | 派生 | 是 | buildCompatibilityRule | 列表/旧消费者 |


## 8.2 EditorDraft

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| currentStep / highestStep | 1-6 | 是 | 1 | 步骤导航 |
| subject/period/targetType | enum|null | 是 | null | 步骤1 |
| name/description | string | 名称必填 | "" | 步骤1 |
| partyRanges/roundRanges | Range[] | 是 | [{1,null}] | 步骤2 |
| conditions | Conditions | 是 | 见8.4 | 步骤5 |
| authorization | Authorization | 是 | 见8.5 | 步骤4 |
| participatingStoreIds | string[] | 是 | [] | 归一化=已添加门店 |
| storeConfigs | Record<storeId,StoreConfig> | 是 | {} | 权威数据 |
| deployStoreIds | string[] | 是 | [] | 生效门店 |
| deployExcludedStoreIds | string[] | 是 | [] | 排除记忆 |
| productQuantityMergedVersion | number | 迁移 | 2 | 步骤结构版本 |
| legacyCompatibilityFallback | StoreConfig | 是 | 空 | 旧数据留存 |


## 8.3 StoreConfig 与 LimitCell

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| structureByLine | {kiosk,emenu,sdi:[]} | 选品树 |
| productLines | string[] | 有目标的产线 |
| targetIds | string[] | 限购目标 ID |
| limits | Record<LimitKey,LimitCell> | 数量矩阵 |
| LimitKey | party|round|line|targetId | targetId 可含 | |
| LimitCell.configured | boolean | 是否显式配置 |
| LimitCell.value | 0|正整数|null | null=未配置 |


## 8.4 Conditions 完整字段

| 字段 | 类型 | 默认 | 校验 |
| --- | --- | --- | --- |
| effectiveFrom | date | 当日 | ≤ effectiveTo |
| effectiveTo | date|"" | "" | 可空=长期 |
| activityCycle | daily|weekly|monthly | weekly | 周/月非空 |
| daysOfWeek | weekday[] | 全周 | weekly |
| daysOfMonth | 1-31[] | [] | monthly 去重升序 |
| businessHourSlots | slot[] | 晚市 full | ≥1 时段 |
| businessHourSetupMode | all_full|per_slot | all_full | 非法值推导 |
| memberMode | all|specified | all | specified 选等级 |
| memberLevelIds | string[] | [] | specified 非空 |
| childCountPolicy | inherit|include|exclude | inherit | 步骤1 按人数 |
| businessHour* 旧字段 | 兼容 | 镜像 | 由 slots 同步 |


## 8.5 Authorization 完整字段

| 字段 | 类型 | 默认 | 校验 |
| --- | --- | --- | --- |
| enabled | boolean | true | false=汇总硬性拒绝 |
| allowedScopes | scope[] | 三种 | enabled 时 ≥1 |
| defaultScope | scope|"" | round | ∈ allowedScopes |
| scopePermissions | Record | 静态角色 | 每启用范围非空 |
| reasonRequired | boolean | true | 配置项 |


## 8.6 界面临时状态（不持久化）

| 对象 | 字段 | 说明 |
| --- | --- | --- |
| limitRuleList | storeId,partyKey,roundKey,lineId,status,query,page,pageSize,selectedRowIds | 数量列表 UI |
| productAddDialog | open,storeId,structureByLine,dirty,query | 添加商品弹层 |
| 列偏好 | version,visible[] | order-limit:rule-list-columns:v1 |


## 8.7 规则列表列定义（已落地）

固定列：name, status, actions。默认可见：name, strategy, persons, productScope, effectiveStores, effectiveTime, authorization, status, actions。
可选列按六步分组：描述、主体、周期、对象、儿童口径、人数/轮次区间、参与门店、产线、目标数、完成度、授权范围/默认值/权限/原因、日期/周期/营业时段/会员。
列表筛选（AND）：门店、状态(draft/active/inactive)、人数场景、轮次、时间组合；无规则名称关键词筛选。

## 8.8 六步渲染与校验映射

| 步骤 | 渲染函数 | 离开校验 |
| --- | --- | --- |
| 1 规则类型 | renderStepOne | 主体/周期/对象/名称 |
| 2 场景配置 | renderStepThree | 区间连续+末段及以上 |
| 3 限购数量 | renderStepFour | ≥1目标；全部 limits configured |
| 4 超限授权 | renderStepSix | 范围/默认/每范围权限 |
| 5 生效范围 | renderStepFive | 门店/周期/会员/日期/时段 |
| 6 确认发布 | renderStepSeven + 发布页 | validateAll + validateDeployStores |


## 8.9 目标态 OrderLimitRule（模板原 TypeScript，未落地）

服务端正式版可增加 version、storeIds、menuIds、orderTypes、scenes 扁平结构、createdBy/updatedBy 等；当前原型以 EditorDraft 为准，发布时 buildPublishedDraft 裁剪门店。

# 9. 判定接口

> **落地状态：目标态（模板）；当前无 HTTP 接口**


### 9.1 OrderLimitWriteRequest / OrderLimitContext

客户端只提交 orderId、operationId、orderVersion、menuId、mutation、authorizationTokens；人数/轮次/已下单/购物车由服务端读取。当前原型不实现。

### 9.2 OrderLimitDecision

violations 含 ruleId、targetId、configuredLimit、effectiveLimit、各 quantity、exceededQuantity、allowedAuthorizationScopes、message。

### 9.3 判定顺序

- 加载门店正式规则→过滤门店/产线/菜单/订单类型→日期/时段/会员→有效人数→区间匹配→展开分类→统计 Committed+Candidate→计算 EffectiveLimit→校验授权→返回全部违反项。

# 10. 轮次与数量占用

> **落地状态：目标态**


### 10.1 轮次边界

- 新单第1轮
- 提交成功完成轮次
- 失败不增轮
- 重试保持 operationId

### 10.2 释放限额

| 操作 | 释放 |
| --- | --- |
| 未提交删购物车 | 是 |
| 提交前取消 | 是 |
| 送厨前撤销 | 是 |
| 已送厨退菜 | 否 |
| 提交失败 | 不占用 |

OrderItemLimitSnapshot / occupancies 按规则+目标逐条保存（目标态）。

# 11. 人数变化

> **落地状态：配置已落地 childCountPolicy；运行时重算为目标态**

```text
包含儿童：adultCount+childCount
排除儿童：adultCount
```

人数区间在步骤2配置；运行时人数变更重算限额、不追溯删历史（目标态）。

# 12. 服务员密码授权


## 12.1 三种范围（配置已落地）

| 范围 | 配置字段 | 目标态生效 | 目标态失效 |
| --- | --- | --- | --- |
| 本次操作 | operation | 当前请求 | 成功后消费 |
| 当前轮 | round | 当前轮内免重复验密 | 换轮/关单 |
| 当前订单 | order | 订单内免重复验密 | 关单/规则版本变 |


## 12.2 授权流程（目标态）

- 超限→拒绝写入→选范围→密码→签凭证→重试→事务写入→审计

## 12.3 OrderLimitAuthorization 凭证（目标态）

authorizationId、ruleRefs、scope、operationId、requestDigest、roundNo、expiresAt、status…

# 13. 客户端交互

> **落地状态：目标态；配置 UI 已落地列表/编辑器交互**


### 13.1 正常状态

展示剩余额度文案（目标态 POS/Kiosk/eMenu/SDI）。

### 13.2 超限弹窗

展示规则、目标、N、L、EffectiveLimit、已下单/购物车/本次增量、超出量、可用授权范围。

### 13.3 多规则批量

原子批量加购；套餐按子商品展开（目标态）。

### 13.4 错误文案

须说明受限对象、原因、下一步（联系服务员授权）。

# 14. 并发、幂等和版本

> **落地状态：目标态**

- orderVersion + operationId 乐观锁/事务。
- 规则发布不可变 version；旧授权随 version 失效。
- 客户端剩余额度仅提示，不作裁决依据。

# 15. 接口设计


## 15.1 当前原型契约（已落地）

| 类型 | 键/路径 | 说明 |
| --- | --- | --- |
| localStorage | restaurantRules | 规则数组整表覆盖 |
| localStorage | order-limit:rule-list-columns:v1 | 列偏好 |
| sessionStorage | restaurantRuleRecovery:{draftId} | 恢复副本，不读取 |
| 路由 | /operations/queue-call/menu-order-limits | 主入口 |
| iframe | order-limit.html | 列表 |
| iframe | order-limit-rule-editor.html?draftId= | 六步编辑 |
| iframe | order-limit-publish-confirm.html?draftId= | 发布确认 |
| 参数 | mode=create|draftId|ruleId|copy=1|view=1|embedded=1 | 见 SPEC 7.3 |


## 15.2 目标态 HTTP API（模板，未落地）

```text
GET/POST/PUT .../order-limit-rules
POST .../publish|disable|archive|rollback
POST .../limit-evaluate|limit-authorizations
GET .../order-limit-audits
POST .../order-limit-rules/simulate
```


# 16. 存储


## 16.1 当前（已落地）

| 键 | 结构 | 读写 |
| --- | --- | --- |
| restaurantRules | StoredRule[] | 列表/编辑/发布 |
| 列偏好 | {version:1,visible[]} | 列表字段设置 |
| 恢复副本 | editorDraft JSON | 仅写/删 |


## 16.2 目标态表（模板，未落地）

- order_limit_rules / order_limit_rule_versions / order_limit_rule_scopes
- order_limit_authorizations / order_limit_audit_logs
- order_limit_operation_idempotency / 订单明细占用快照

# 17. 发布与终端下发


## 17.1 当前发布流程（已落地）

```text
步骤1-5校验 → 步骤6汇总 → 发布确认页 validateAll
→ validateDeployStores → buildPublishedDraft
→ status=active 写 restaurantRules → 返回列表
```


## 17.2 发布校验清单（已落地）

- 人数/轮次区间连续且末段及以上。
- 全部 limits 单元格 configured（含0）。
- 至少1生效门店且均有商品。
- 活动周期/会员/日期/时段完整。
- 授权范围/默认范围/每范围权限完整。
- 自定义确认框；禁止原生弹窗。

## 17.3 终端下发（目标态）

签名规则快照推送终端；版本变化失效缓存；离线失败关闭策略见模板。

# 18. 旧数据迁移

> **落地状态：已落地**

- normalizeUnlimitedLimitCells：不限制→未配置，发现即写回。
- normalizeMergedProductQuantitySteps：七步→六步（v1/v2）。
- normalizeStoreDraft / normalizeDeploymentSelection。
- mapLegacyType/Period/Target；max>=99→null。
- 无 storeConfigs 时从 legacy 字段生成；深拷贝隔离门店。

# 19. 异常处理

| 异常 | 当前处理 | 目标态 |
| --- | --- | --- |
| 规则非法 | 步骤禁用/发布阻止 | 拒绝发布 |
| JSON 损坏 | 空数组或演示数据 | — |
| 草稿不存在 | 错误态返回 | — |
| 保存失败 | 阻止离开 | — |
| 服务端不可用 | — | 终端只读 |
| 版本冲突 | — | 刷新重试 |
| 发布失败 | 保留草稿，重新发布 | 保持上一完整版本 |


# 20. 权限与审计

| 项 | 当前 | 目标态 |
| --- | --- | --- |
| 后台按钮 RBAC | 无，全员可操作 | 查看/编辑/发布/回滚分级 |
| 规则内所需权限 | 已配置静态角色 | 运行时校验员工角色 |
| 授权审计 | 无 | 原限额/超限/员工/终端/范围/原因/版本 |


# 21. 验收标准

> 完整表格版（参数化矩阵、MOL-01～31、30 条运行时验收、非功能/成功指标、风险、实施阶段）见  
> [PRD-2026-07-23-template-format.md](../../../产品PRD/exports/2026-08-19-menu-order-limit/PRD-2026-07-23-template-format.md) 第九部分。


## 21.1 配置原型（已确认，MOL-01～MOL-31）

- 六步无独立商品步骤；列表滚动区固定表头；字段设置持久化。
- 12场景可配；数量三态；活动周期/多时段/自定义时间。
- 添加商品差异提交；完整规则行；批量/复制/预览。
- 草稿900ms保存；session 恢复副本；发布二次确认。
- 正式编辑不覆盖源规则；复制独立；view=1 只读。
- 旧数据幂等迁移；自定义对话框。
- 逐条验收表见 PRD 模板格式文档「配置原型验收（MOL-01～MOL-31）」。

## 21.2 运行时（目标态，对齐模板 26 条 + 扩展 4 条）

| 序号 | 验收标准 | 备注 |
| --- | --- | --- |
| 1 | 分类限购统计分类内所有商品总数 | |
| 2 | 一个分类达到上限不影响其他分类 | |
| 3 | 菜品达到上限只限制对应菜品 | |
| 4 | 每轮规则换轮后重新获得额度 | |
| 5 | 多轮规则按当前轮次区间读取不同上限 | |
| 6 | 与轮次无关规则累计订单全部轮次 | |
| 7 | 按人数实际限额=人均×有效人数 | EffectiveLimit=L×N |
| 8 | 按人数限购不要求绑定具体食客 | |
| 9 | 儿童计数策略正确影响有效人数 | childCountPolicy |
| 10 | 人数减少后不追溯删历史，但阻止新增超限 | |
| 11 | 空值和 0 含义严格不同 | 配置：空=未配置，0=禁止 |
| 12–14 | 分类+菜品、每轮+整单多规则 AND | |
| 15–16 | 客户端预校验与服务端一致；并发不突破 | orderVersion+事务 |
| 17–18 | 未送厨撤销释放；已送厨退菜不释放 | |
| 19–23 | 授权三范围绑定/失效；新版本旧授权失效 | |
| 24–26 | 时间/会员/门店过滤；发布失败沿用旧版；审计 100% | |
| 27–30 | 防伪造；加购提交互斥；幂等；批量最小授权范围 | 项目扩展 |

每种 12 场景须测：小于上限、达上限、超出、0、留空及三档授权范围（见 PRD 模板「参数化测试矩阵」）。

# 22. 非功能指标

| 指标 | 配置原型 | 目标态 |
| --- | --- | --- |
| 判定 P95 | N/A（本地） | <50ms 引擎 / <150ms API |
| 授权 P95 | N/A | <500ms |
| 幂等 | N/A | operationId+摘要 |
| 可访问性 | tablist/对话框/a11y | 同左+终端 |
| 验证 | verify-order-limit-*.mjs | CI+集成测试 |


# 23. 成功指标

配置阶段：PRD/SPEC 与代码一致、verify 脚本通过。运行阶段（目标）：判定不一致率0、并发突破0、无审计授权0、发布失败<0.5%。

# 24. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 仅 localStorage，非生产数据源 | 明确原型边界；后续 API 迁移 |
| 旧「不限制」数据 | normalize 即时写回 |
| 多规则难理解 | 步骤6/发布预览汇总 |
| 运行时未接入 | 配置与目标态 DTO 对齐，减少二次改造 |
| iframe 对话框遮罩 | 挂 top.document + pagehide 清理 |


# 25. 实施阶段与资源


## 25.1 已完成（当前仓库）

- 六步编辑器、列表、发布、迁移、专项 specs、PRD/SPEC、verify 脚本。

## 25.2 后续（目标态，模板估算）

- 规则 DTO 与服务端引擎 2-3 周；终端接入 3-4 周；联调灰度 3-4 周（参考模板）。

# 26. 完成定义


## 26.1 当前版本（已达成）

- 12 场景配置语义与数量矩阵展开完整可用。
- StoredRule/EditorDraft 字段与 SPEC 一致；MOL-01～MOL-31 可达。
- 六步发布闭环；localStorage 为唯一数据源；文档归类 menu-order-limit/。

## 26.2 目标态完成定义（模板）

- 12 场景运行时判定一致；服务端事务+终端下发+授权审计闭环；38 条运行时验收通过；localStorage 不再为正式数据源。