# TipOut · 手动上报小费取值条件扩展设计方案

> **模块**：TipOut → 小费池贡献规则 → 手动上报小费 → 取值条件  
> **版本**：v1.1  
> **日期**：2026-07-24  
> **状态**：已落地  
> **关联**：`dist/TipOut/rule-add.html`（`manualDrawer`）、`dist/TipOut/detail.html`、`dist/TipOut/docs/TipOut.md`

---

## 一、场景与现状

小费池贡献规则中的「手动上报小费」卡片支持设置取值条件，用于限定哪些手动上报金额计入该卡片进池基数。

**现状**：`manualDrawer` 的「+ 新增条件」仅提供 **周期（星期）**；角色、员工、营业时间段、班次不可配。同模块的「小费」「加收服务费」抽屉已支持上述维度（及更多订单类条件）。

**目标**：手动上报小费取值条件扩展为以下五项，交互与控件对齐小费侧对应子集：

| 条件 | 说明 |
|------|------|
| 角色 | 角色多选 |
| 员工 | **筛选角色 + 员工** 双多选（对齐 `getStandaloneEmployeeConditionBodyHtml`） |
| 营业时间段 | 起止时间 |
| 班次 | 多选 + 班次设置（独立 DOM id，如 `manualShiftConditionSelect`） |
| 周期 | 多选星期（现有能力保留） |

---

## 二、方案（已采用：方案 A）

在现有 `manualDrawer` 上扩展条件菜单与增删/收集/回显逻辑，**不**整抽屉复用小费条件（避免带出订单区域、小费类型、商品等无关项），**不**本期抽公共条件构建器。

### 2.1 交互约束

| 项 | 约定 |
|----|------|
| 五项均可选 | 不默认带出；不强制至少填一项 |
| 角色 ↔ 员工 | **互斥**（与小费侧相同，见下） |
| 未设条件 | 摘要「未设置」；计算侧不按人/时/班/星期额外过滤（与现行为一致） |
| 条件必填 | **否**（手动上报卡片取值条件保持非必填） |

**角色 / 员工互斥（UI + 落库，对齐小费侧）**：

1. `addManualCondition`：若已有员工则不可再加角色（及反向），警告提示与小费侧一致。  
2. `updateManualConditionMenu`：用 `roleEmployeeMenuItemHidden(existingManualConditions, t)` 隐藏互斥项；已添加条件类型本身也从菜单隐藏。  
3. `saveManualCondition`：收集后调用 `normalizeConditionsRoleEmployeeExclusive` 再写入 `poolRuleConditions`。

### 2.2 配置入口

小费池贡献规则 →「手动上报小费」卡片 →「设置取值条件」→「+ 新增条件」可选上述五项；已添加项从菜单隐藏；可删（无必留项）。

---

## 三、落库示意

挂在该 `type: "manual"` 卡片的 `conditions`，字段与小费侧同构：

```json
{
  "type": "manual",
  "id": "manual_1",
  "pct": 100,
  "conditions": {
    "role": ["Server"],
    "hours": { "start": "11:00", "end": "14:00" },
    "shift": ["午餐班"],
    "weekdays": ["mon", "tue", "wed", "thu", "fri"]
  }
}
```

员工条件示例（与角色互斥，不同时出现）：

```json
{
  "type": "manual",
  "pct": 100,
  "conditions": {
    "employeeRoles": ["Server"],
    "employee": ["Alice", "Bob"],
    "shift": ["午餐班"]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `role` | `string[]` | 与 `employee` / `employeeRoles` 互斥 |
| `employeeRoles` | `string[]` | 员工条件的「筛选角色」；与 `role` 互斥 |
| `employee` | `string[]` | 员工多选；与 `role` 互斥 |
| `hours` | `{ start?, end? }` | 营业时间段 |
| `shift` | `string[]` | 班次 |
| `weekdays` | `string[]` | 周期（星期）；旧数据可仅含此项 |

**收集与空值语义**（对齐 `collectTipsConditions`）：

- 抽屉内**有对应条件卡片则收集**该字段（含可能为空的数组 / 空时间）。  
- 卡片摘要与详情展示：**仅输出非空维度**（有值才拼接）。  
- 规则级「未设置」：无任何非空维度时展示「未设置」。  
- 缺省字段 / 仅旧 `weekdays` 的规则合法；不做存量迁移。

---

## 四、实现要点

| 项 | 说明 |
|----|------|
| 菜单 | `manualConditionMenu`：角色 / 员工 / 营业时间段 / 班次 / 周期；`updateManualConditionMenu` 含已选项隐藏 + 角色/员工互斥隐藏 |
| 增删 | 扩展 `addManualCondition` / `removeManualCondition`；角色/员工添加拦截；员工体用 `getStandaloneEmployeeConditionBodyHtml('manualEmployeeCondRoleSelect', 'manualEmployeeCondStaffSelect')`；班次 id 用 `manualShiftConditionSelect` |
| 回显赋值 | 扩展 `setManualConditionValue`（role / employee / hours / shift / weekday）；员工入参形态为 `{ employeeRoles, employees }`（对齐 `loadTipsConditionsForRule`） |
| 加载回显 | 重写 `loadManualConditionsForRule`：对齐 `loadTipsConditionsForRule`——先 `normalizeConditionsRoleEmployeeExclusive`，再 `sortPoolConditionLoadKeys`，按类型 `addManualCondition(type, true)` + `setManualConditionValue` |
| 收集保存 | 扩展 `collectManualConditions`；`saveManualCondition` 保存前 `normalizeConditionsRoleEmployeeExclusive` |
| 摘要 | 扩展 `formatManualCondForDisplay`：有值才拼接角色 / 员工筛选角色 / 员工 / 营业时间段 / 班次 / 周期 |
| 详情 | `detail.html`：手动上报条件展示与 `formatManualCondForDisplay` 同源（或复用小费五项子集文案）；标签统一为「营业时间段」 |
| 校验 | 不把手动上报条件改为必填；不改占比字段与池公式主路径结构 |

### 非本期

- 公共条件构建器抽象  
- 订单区域 / 订单类型 / 小费类型 / 订单需包含商品等  
- 默认带出角色或强制必选  
- 旧规则自动改写迁移  
- `TipOut.md` 产品说明同步（可选跟进，非阻塞实现）

---

## 五、验收标准

1. 「+ 新增条件」可见并可添加：角色、员工、营业时间段、班次、周期。  
2. 已添加的条件类型从菜单消失；已配角色时菜单不显示员工（及反向）。  
3. 添加角色时若已有员工（及反向）→ 警告且不添加；保存后落库亦互斥。  
4. 五项均可不配；无任何非空维度时摘要为「未设置」。  
5. 配置角色 + 班次 + 周期后保存，再次打开抽屉：条件卡片与选中值均正确回显。  
6. 配置员工条件后落库含 `employeeRoles` + `employee`；摘要/详情可见「员工筛选角色」与「员工」（有值时）。  
7. 仅含 `weekdays` 的旧规则可打开、回显、再保存且行为不变。  
8. 添加条件卡片但未选值：可保存；摘要不展示空维度（与小费侧一致）。  
9. 详情页：角色 + 营业时间段 + 班次等非员工组合文案正确（标签「营业时间段」）。  

---

## 六、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-24 | 初稿：方案 A；五项可选；角色/员工互斥；兼容仅周期旧数据 |
| v1.1 | 2026-07-24 | 补齐：`employeeRoles`、加载回显套路、UI 互斥三处、空值收集语义、验收细化 |
| v1.1.1 | 2026-07-24 | 补充员工回显入参形态与详情页非员工组合验收 |
| v1.2 | 2026-07-24 | 落地：`manualDrawer` 五项条件 + 互斥/回显/摘要/详情 |
