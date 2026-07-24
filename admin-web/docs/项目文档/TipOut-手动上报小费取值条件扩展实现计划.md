# TipOut · 手动上报小费取值条件扩展 · 实现计划

> **依据**：`docs/项目文档/TipOut-手动上报小费取值条件扩展设计方案.md`（v1.1.1）  
> **日期**：2026-07-24  
> **状态**：已实现  
> **主文件**：`dist/TipOut/rule-add.html`；顺带 `dist/TipOut/detail.html`

---

## 任务拆分

### 1. 菜单 HTML

`manualConditionMenu` 增加四项（周期已有）：

- 角色 `role`
- 员工 `employee`
- 营业时间段 `hours`
- 班次 `shift`

### 2. 菜单互斥

`updateManualConditionMenu`：

- 已添加类型隐藏
- `roleEmployeeMenuItemHidden(existingManualConditions, t)`（对齐小费侧）

### 3. 增删条件卡片

扩展 `addManualCondition` / `removeManualCondition`：

| type | 控件 |
|------|------|
| `role` | 角色多选（对齐 `addTipsCondition('role')`） |
| `employee` | `getStandaloneEmployeeConditionBodyHtml('manualEmployeeCondRoleSelect', 'manualEmployeeCondStaffSelect')` |
| `hours` | 起止 `time` |
| `shift` | `manualShiftConditionSelect` + `openShiftManageModal` |
| `weekday` | 现有逻辑保留 |

`addManualCondition`：角色/员工互斥拦截（对齐 `addTipsCondition`）。

### 4. 回显赋值

扩展 `setManualConditionValue`：

- `role` / `hours` / `shift` / `weekday`：对齐小费侧
- `employee`：入参 `{ employeeRoles, employees }` → `applyStandaloneEmployeeConditionToCard`

### 5. 加载回显

重写 `loadManualConditionsForRule`，对齐 `loadTipsConditionsForRule`：

1. 清空容器与 `existingManualConditions`
2. `normalizeConditionsRoleEmployeeExclusive(cond)`
3. `sortPoolConditionLoadKeys` 遍历
4. `weekdays` → `addManualCondition('weekday')` + set
5. 其余 type → add + set（employee 用 `{ employeeRoles, employees: cond.employee }`）
6. `updateManualConditionMenu`

### 6. 收集与保存

- 扩展 `collectManualConditions`：对齐 `collectTipsConditions` 五项字段（含 `employeeRoles` + `employee`）
- `saveManualCondition`：收集后 `normalizeConditionsRoleEmployeeExclusive` 再写入

### 7. 摘要展示

扩展 `formatManualCondForDisplay`：有值才拼接

`角色 | 员工筛选角色 | 员工 | 营业时间段 | 班次 | 周期`

### 8. 详情页

`detail.html`：手动上报条件展示与摘要同源（或小费五项子集）；标签统一「营业时间段」。

---

## 冒烟验收

对照设计方案 §五（共 9 条）。

重点手测：

1. 五项可加、菜单隐藏已选项与角色/员工互斥项  
2. 角色 + 班次 + 周期保存后重开抽屉回显  
3. 员工条件落库 `employeeRoles` + `employee`  
4. 仅 `weekdays` 旧数据不回归  
5. 详情页角色 + 营业时间段 + 班次文案  
