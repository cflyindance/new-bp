# 菜单下单限制 · 规则列表页设计

> **文档状态：** 当前有效（2026-08-20）  
> **实现文件：** `dist/Configuration center/order-limit.html`  
> **关联需求：** MOL-04～MOL-12  
> **关联 SPEC：** [SPEC.md §5.2、§6.2、§3.8](../../../../产品PRD/exports/2026-08-19-menu-order-limit/SPEC.md)  
> **滚动布局：** [2026-08-13-menu-order-limit-rule-list-scroll-design.md](./2026-08-13-menu-order-limit-rule-list-scroll-design.md)

## 1. 页面定位

规则列表是「前厅管理中心 → 菜单下单限制 → 数量与频次限制」页签内的 iframe 主视图（`order-limit.html?embedded=1`）。负责展示本地 `restaurantRules` 中的全部规则，并提供筛选、列定制、新增与行级操作；编辑/发布走独立全屏 iframe 页（`order-limit-rule-editor.html` 等）。

**非目标：** 无规则名称关键词搜索、无分页、无批量操作、无云下发只读字段、无 HTTP 规则 API。

---

## 2. 页面结构

```
┌─ section-head（固定，不滚动）────────────────────────────┐
│  现有规则          [筛选 N / 共 M 条]  [+ 新增规则]        │
├─ section-body（唯一滚动视口）──────────────────────────────┤
│  筛选栏：门店 | 状态 | 人数 | 轮次 | 时间 | 重置 | 字段设置 │
│  ┌─ 字段设置面板（popover，Esc/外点关闭）──────────────┐  │
│  │ 列表字段 · 恢复默认 · 分组 checkbox                  │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─ table ────────────────────────────────────────────┐  │
│  │ thead（sticky）                                      │  │
│  │ tbody（数据行）                                      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- 标题区 `#ruleCountBadge` 文案：**筛选 {visible} / 共 {total} 条**。
- 空态：无规则 →「暂无规则」；有规则但筛选无匹配 →「暂无匹配规则」。

---

## 3. 数据来源与加载

| 项 | 说明 |
|---|---|
| 数据源 | `localStorage["restaurantRules"]`（键名 `STORAGE_KEY` / `RULES_KEY`） |
| 读取 | `loadRules()`：JSON 解析失败 → 空数组；列表页无数据时写入内置演示规则 seed |
| 归一化 | 加载后对旧「无限制」单元格 `{configured:true,value:null}` → `{configured:false,value:null}` 并写回 |
| 列偏好 | `localStorage["order-limit:rule-list-columns:v1"]`，结构 `{ version: 1, visible: string[] }` |
| 演示门店目录 | 页面内置 `RULE_STORE_CATALOG`（法拉盛店 / 布鲁克林店 / 波士顿店） |

列表展示字段优先读 `editorDraft` / `authoringDraft`；兼容顶层字段（`type`、`round`、`persons` 等）由发布时 `buildCompatibilityRule` 投影，供筛选与旧列渲染。

---

## 4. 筛选条件（MOL-05）

### 4.1 组合逻辑

五个筛选项 **AND** 组合：仅当规则同时满足所有非空条件时保留。

```javascript
// filteredRules 伪代码
(!storeId || ruleStoreIds(rule).includes(storeId)) &&
(!status || rule.status === status) &&
(!persons || trim(rule.persons) === persons) &&
(!round || rule.round === round) &&
(!time || ruleTimeText(rule) === time)
```

**无**规则名称模糊搜索。

### 4.2 筛选项定义

| 控件 ID | 标签 | 空值文案 | 选项来源 | 匹配字段 / 逻辑 |
|---|---|---|---|---|
| `ruleFilterStore` | 门店 | 全部门店 | 当前规则集中出现过的 `storeId`，映射 `RULE_STORE_CATALOG` 名称 | `ruleStoreIds(rule)` 含所选门店；优先级：`deployStoreIds` → `participatingStoreIds` → `storeConfigs` 键 |
| `ruleFilterStatus` | 状态 | 全部状态 | 固定枚举 | `rule.status` 精确匹配：`active` / `inactive` / `draft` |
| `ruleFilterPersons` | 人数 | 全部人数 | 全量规则 `rule.persons` 去重排序 | 字符串精确相等（兼容字段摘要，如 `1 人`、`2–4 人`） |
| `ruleFilterRound` | 轮次 | 全部轮次 | 固定三项 | `rule.round` 精确匹配：`每轮` / `多轮` / `与轮次无关` |
| `ruleFilterTime` | 时间 | 全部时间 | 全量规则 `ruleTimeText(rule)` 去重排序 | 字符串精确相等 |

**轮次筛选说明：** 匹配兼容顶层字段 `rule.round`（发布投影为中文：`每轮`/`多轮`/`与轮次无关`），**不是**轮次区间明细。

**时间筛选说明：** `ruleTimeText(rule)` 逻辑：

- `enableTimeSettings === true` → `timeLabel` 或营业时段模块选中项摘要；
- 否则 → **全天生效**。

与列表列「生效时间」(`ruleEffectiveTimeText`) 的拼接口径不同；筛选用的是较短的 `ruleTimeText`。

### 4.3 选项刷新与失效处理

每次 `renderRuleTable()` 调用 `renderRuleFilterOptions()`：

1. 从当前 **全量** `state.rules` 收集人数、时间、门店选项（非仅筛选后子集）。
2. 若当前选中值已不在新选项集中 → **自动清空**该筛选项（不弹提示）。
3. 状态下拉为固定枚举，不随数据变化。

### 4.4 重置筛选

按钮 `#ruleFilterReset`：将 `ruleFilters` 置为全空 `{ persons:"", round:"", time:"", storeId:"", status:"" }` 并重新渲染表格。**不修改**列偏好、不修改规则数据。

---

## 5. 字段展示（MOL-04、MOL-06）

### 5.1 默认列与固定列

| 类型 | 列 ID 列表 |
|---|---|
| **默认可见** | `name`, `strategy`, `persons`, `productScope`, `effectiveStores`, `effectiveTime`, `authorization`, `status`, `actions` |
| **固定列（不可取消）** | `name`, `status`, `actions` |

最终可见列 = 用户偏好 ∩ 列定义全集，再强制补回固定列，并按 `ruleColumnDefinitions()` 定义顺序输出。

### 5.2 全量列定义表

| 列 ID | 表头 | 分组 | 固定 | 数据来源与展示规则 |
|---|---|---|---|---|
| `name` | 规则名称 | 固定字段 | ✓ | `rule.name`；渲染为可点击链接 `data-rule-view`；空则「未命名规则」 |
| `strategy` | 规则策略 | 默认字段 | | `subject · period · target` 摘要；优先 `editorDraft.subject/period/targetType` 映射中文，否则兼容 `type/round/method` |
| `persons` | 人数场景 | 默认字段 | | 优先兼容字段 `rule.persons`；否则 `partyRanges` 格式化为 `N 人` / `A–B 人` / `N 人及以上` |
| `productScope` | 商品范围 | 默认字段 | | 统计 `storeConfigs[*].targetIds` 总数 → `{n} 个分类/菜品`；无则回退 `rule.dishes` |
| `effectiveStores` | 生效门店 | 默认字段 | | `deployStoreIds`（或参与门店）映射门店名称，顿号连接 |
| `effectiveTime` | 生效时间 | 默认字段 | | `有效日期 · 活动周期 · 营业时段` 拼接；任一段缺失则跳过 |
| `authorization` | 超限授权 | 默认字段 | | `authorization.enabled` ? **允许授权** : **硬性拒绝** |
| `description` | 规则描述 | 步骤 1 · 规则类型 | | `rule.description`；空显示 `—` |
| `subject` | 限购主体 | 步骤 1 · 规则类型 | | 按人数限购 / 按桌/订单限购 |
| `period` | 轮次规则 | 步骤 1 · 规则类型 | | 每轮 / 多轮 / 与轮次无关 |
| `targetType` | 限购对象 | 步骤 1 · 规则类型 | | 按分类 / 按菜品 |
| `childPolicy` | 儿童人数口径 | 步骤 1 · 规则类型 | | `include`→计入；`exclude`→不计入；其他→继承门店 |
| `partyRanges` | 人数区间 | 步骤 2 · 场景配置 | | `partyRanges` 区间摘要或 `rule.persons` |
| `roundRanges` | 轮次区间 | 步骤 2 · 场景配置 | | 仅 `multi_round` 显示轮次区间摘要；否则显示周期文案 |
| `participatingStores` | 参与门店 | 步骤 3 · 限购数量 | | 已添加商品的门店（`participatingStoreIds` / `storeConfigs` 键） |
| `lines` | 适用产线 | 步骤 3 · 限购数量 | | 全部门店产线并集 → Kiosk / eMenu / SDI |
| `targetCount` | 目标商品数 | 步骤 3 · 限购数量 | | 全门店 `targetIds` 计数 |
| `completion` | 数量完成度 | 步骤 3 · 限购数量 | | 已配置 limits 单元格 / 总单元格，如 `12/24` |
| `authScopes` | 授权范围 | 步骤 4 · 超限授权 | | `operation/round/order` → 本次操作/当前轮/当前订单 |
| `authDefault` | 默认授权范围 | 步骤 4 · 超限授权 | | `defaultScope` 映射中文 |
| `authPermissions` | 所需权限 | 步骤 4 · 超限授权 | | 每范围对应 `scopePermissions` 角色 |
| `authReason` | 授权原因 | 步骤 4 · 超限授权 | | `reasonRequired` ? 必填 : 选填 |
| `effectiveDates` | 有效日期 | 步骤 5 · 生效范围 | | `effectiveFrom` 至 `effectiveTo` 或长期 |
| `activityCycle` | 活动周期 | 步骤 5 · 生效范围 | | 每天 / 每周周几 / 每月日期 |
| `businessHours` | 营业时段 | 步骤 5 · 生效范围 | | 全天/午市/晚市及 custom 时间段 |
| `members` | 会员范围 | 步骤 5 · 生效范围 | | 全部顾客 / 指定等级名称列表 |
| `status` | 状态 | 固定字段 | ✓ | badge：启用(绿) / 草稿 / 禁用 |
| `actions` | 操作 | 固定字段 | ✓ | 见 §6 |

**单元格通用规则：**

- 空值 / 空字符串 → 显示 `—`（规则名称除外）。
- 长文本列使用 `rule-cell-clamp` + `title` 悬停全文。
- 缺失 `editorDraft` 时回退兼容顶层字段，仍尽量不为空。

### 5.3 生效时间列拼接细则

`ruleEffectiveTimeText(rule)` 三部分：

1. **有效日期：** `effectiveFrom`；有 `effectiveTo` 则 `A 至 B`，否则 `A 起长期`。
2. **活动周期：** `daily`→每天；`weekly`→每周+星期；`monthly`→每月+日期。
3. **营业时段：** `businessHourSlots` 中 `full` 显示时段名；`custom` 附加 `from–to`。

### 5.4 字段设置交互（MOL-06）

| 行为 | 说明 |
|---|---|
| 打开/关闭 | `#ruleColumnSettingsToggle` 切换 `#ruleColumnSettingsPanel`；同步 `aria-expanded` |
| 关闭方式 | Esc；点击面板外区域 |
| 勾选 | 非固定列 checkbox `data-rule-column={id}`；变更即写 `localStorage` 并重绘表头/表体 |
| 恢复默认 | `#ruleColumnRestoreDefault` → 重置为 `RULE_DEFAULT_COLUMNS` 并持久化 |
| 损坏偏好 | JSON 解析失败 → 使用默认列；未知列 ID 剔除；重复 ID 去重 |

---

## 6. 功能操作（MOL-07～MOL-12）

### 6.1 顶部操作

| 操作 | 触发 | 行为 |
|---|---|---|
| **新增规则** | `#btnOpenCreate` | 跳转 `order-limit-rule-editor.html?mode=create`（保留 `embedded=1`） |

### 6.2 行内操作（按状态）

| 状态 | 可用按钮 | 跳转 / 副作用 |
|---|---|---|
| `draft` | 编辑、复制、删除 | 编辑 → `?draftId=`；复制 → `?ruleId=&copy=1`；删除 → 确认后从数组移除 |
| `active` | 编辑、复制、**禁用**、删除 | 编辑 → `?ruleId=`（派生草稿）；禁用 → `status=inactive` 写 localStorage |
| `inactive` | 编辑、复制、**启用**、删除 | 启用前执行冲突检测（§6.4）；通过则 `status=active` |

**草稿不显示启停按钮。**

### 6.3 规则名称 · 只读查看（MOL-10）

点击 `data-rule-view={id}` → `order-limit-rule-editor.html?ruleId={id}&view=1`。

- 不创建新草稿；编辑器全步只读；不产生自动保存。

### 6.4 编辑 / 复制语义（MOL-08、MOL-09）

| 操作 | 正式规则 | 草稿 |
|---|---|---|
| **编辑** | 新建 draft，`sourceRuleId=源ID`；发布后替换源规则 | 继续原 `draftId` |
| **复制** | 新建独立 draft，名称加「(副本)」，**无** `sourceRuleId` | 同左 |

### 6.5 启用冲突检测（仅「启用」）

`findRuleConflict(candidate, rules, editingRuleId)` 在列表启用时执行：

1. 候选规则须为 `active` 且能展开菜品目标。
2. 与每条其他 **active** 规则比较共享菜品目标。
3. **轮次冲突：** 同一菜品、不同 `rule.round` 文案 → Toast 拒绝启用。
4. **同类型范围冲突：** `type|round|method` 相同 + 会员范围重叠 + 营业时段窗口重叠 → Toast 拒绝启用。

禁用无冲突校验，直接写回。

### 6.6 删除（MOL-12）

- API：`AppDialogs.confirm`（**禁止**原生 `confirm`）。
- 标题「确认删除」；确认文案「确定删除该规则？」；危险按钮「确认删除」。
- 取消不改动；确认后 `filter` 移除并 `saveRules`。

---

## 7. 状态展示

| `status` | Badge 文案 | CSS 类 |
|---|---|---|
| `active` | 启用 | `badge ok` |
| `draft` | 草稿 | `badge draft` |
| `inactive` | 禁用 | `badge off` |

---

## 8. 与编辑器的边界

| 列表页负责 | 编辑器 / 发布页负责 |
|---|---|
| 读全量规则、筛选、列偏好 | 六步编辑、`validateAll`、发布 |
| 启停、删除、跳转入口 | 草稿自动保存、`publishDraft` |
| 兼容字段投影展示 | `buildCompatibilityRule` 写入 |

列表页内仍保留 legacy 向导 DOM 与「点菜模拟验证」面板（`#simulatorPanel`，默认 `display:none`），**生产入口不暴露**；现行新增/编辑一律跳转 `order-limit-flow.js` 六步页。

---

## 9. 验收要点（MOL-04～MOL-12）

- [ ] 默认进入数量页签即见「现有规则」列表；标题区与表头 sticky（见滚动设计文档）。
- [ ] 计数 badge 随筛选实时更新；两种空态文案正确。
- [ ] 五维 AND 筛选 + 失效值自动清空 + 重置恢复全量。
- [ ] 字段设置分组、固定列不可取消、偏好持久化、恢复默认有效。
- [ ] 28 列定义与分组正确；默认 9 列；长文本 clamp + title。
- [ ] 草稿/正式操作按钮集合符合状态机；删除走自定义确认。
- [ ] 规则名称打开只读六步；新增/编辑/复制跳转 URL 参数正确且保留 embedded。
- [ ] 启用冲突时 Toast 提示且不变更状态；禁用即时生效。

---

## 10. 变更记录

| 日期 | 说明 |
|---|---|
| 2026-08-20 | 首版：基于 `order-limit.html` 与 SPEC MOL-04～12 整理筛选、字段、操作全量定义 |
| 2026-08-13 | 滚动区方案见同目录 scroll 设计文档 |
