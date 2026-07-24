# 角色与员工 · 岗位管理双 Tab · 实现计划

> **依据**：`docs/项目文档/角色与员工-岗位管理双Tab设计方案.md`（v1.1）  
> **日期**：2026-07-24  
> **状态**：已实现  
> **落点**：`dist/TipOut/employees.html` / `employees.js` / `employees.css`  
> **参考交互**：排班页双 Tab（`team-shift-scheduling-ui.ts` · 排班表 / 班次）

## 任务拆分

### 1. 页面壳 · 双 Tab

`employees.html`：

- 内容区顶部增加 Tab：**员工**（默认）｜**岗位**
- 现有「员工列表」工具栏 + 表格包进 `data-employees-panel="employees"`
- 新增岗位面板 `data-employees-panel="roles"`：标题「岗位列表」、按钮「新增岗位」、表格壳（名称 / 类型 / 操作）
- 门店筛选保持在 Tab 下方、两面板共用（不随 Tab 隐藏）

`employees.js`：

- `activeTab`（内存或 `sessionStorage`）；默认 `employees`
- 切换 Tab：显隐面板；切到岗位时 `renderRoleTable()`
- 「新增员工」仅在员工 Tab 工具栏；岗位 Tab 用「新增岗位」

### 2. 岗位纯逻辑

`employees.js`（复用现有 `loadCustomRoles` / `saveCustomRoles` / `parseRoleValues` / `roleValuesEqual` / `DEFAULT_ROLE_OPTIONS`）：

- `isSystemRole(name)`
- `listRolesForManage()`：系统预设 ∪ 自定义，去重排序；每项带 `{ name, kind: "system" | "custom" }`
- `isRoleUsedByStoreEmployees(roleName, storeId, employees)`：对 `role` 做 `parseRoleValues` 后 **token 忽略大小写精确相等**
- `deleteCustomRole(name, { storeId, employees })` → `{ ok: true }` | `{ ok: false, reason: "system" | "no-store" | "in-use" }`
- `removeCustomRoleFromStorage(name)`：仅从自定义数组删除（调用方已通过校验）

### 3. 岗位列表渲染

- `renderRoleTable()`：填充岗位表格
- 系统行：类型「系统预设」，操作「—」
- 自定义行：类型「自定义」，「删除」按钮
  - 未选门店（页内筛选开启且 `storeId` 空）：删除 **disabled** + title「请先选择门店」
  - 已选门店：可点
- 门店筛选变更时：若在岗位 Tab，重渲列表（刷新删除禁用态）

### 4. 新增岗位（双入口）

- 岗位 Tab「新增岗位」→ 复用现有 `#employeeRoleAddModal`
- 员工表单「新增岗位」逻辑保持；`confirmNewRole` 成功后：
  - 若员工表单打开：勾选新岗位（现网行为）
  - 若岗位 Tab 可见：`renderRoleTable()`
- 重名拦截沿用现网（忽略大小写）；空名提示

### 5. 删除岗位

- 绑定自定义行「删除」：
  1. `deleteCustomRole` 校验
  2. `in-use` → `showNotification` / alert 设计文案，中止
  3. `no-store` / `system` → 不应出现（按钮已禁用或无入口）；兜底提示
  4. 通过 → 二次确认（可复用 TipOut `confirm` 或现有删除员工确认模式）
  5. `removeCustomRoleFromStorage` → `renderRoleTable()` → 若员工表单打开，从选中岗位中移除该项并 `populateRoleSelect`

### 6. 样式

`employees.css`：

- Tab 条（对齐 TipOut / 排班页气质：底边激活态）
- 岗位表格、禁用删除态
- 面板显隐（`.hidden` / `[hidden]`）

## 不做（对照设计 §1.3 / §4.3）

- 重命名、占用人数、门店级目录、规则引用校验、RBAC 打通
- 首版不接入集合变更下发 / `team.roles` 预览

## 冒烟验收

对照设计方案 §六。

| # | 检查项 |
|---|--------|
| 1 | 默认员工 Tab；切岗位见全部系统预设 |
| 2 | 新增自定义；重名拦截 |
| 3 | 系统无删除；自定义有删除 |
| 4 | 未选门店删除禁用 |
| 5 | 当前店占用不可删；无占用可删 |
| 6 | 删除后列表与表单选项同步消失 |
| 7 | 表单快捷「新增岗位」仍可用且数据一致 |
