# 小费规则角色与员工数据源统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让小费规则、分配明细与员工对账统一读取“角色与员工”花名册，并补齐 Golden Dragon 默认接收方员工与失效引用阻断。

**Architecture:** 新增原生小费共享 `TipOutRosterDirectory`，集中处理门店规范化、角色目录、花名册 ID 迁移、接收方解析与规则引用校验。规则编辑器、分配明细和员工对账只调用该目录；默认员工由团队花名册初始化层幂等写入。手动工时扩展 employeeId 身份，同时兼容旧姓名记录。

**Tech Stack:** TypeScript、原生 JavaScript raw runtime、localStorage、Node.js VM/契约测试、Vite

**Spec:** `docs/superpowers/specs/2026-09-09-tipout-role-employee-source-unification-design.md`

## Global Constraints

- 只修改原生页面 `src/team/**` 及其测试，不回写旧 TipOut 页面。
- 小费页面不得继续以硬编码 `roleEmployees` 作为角色或员工选项来源。
- Golden Dragon 与上海陆家嘴店必须经过同一门店规范化能力匹配。
- 规则接收员工、分配明细和员工对账必须复用同一个 `resolveReceiverEmployees`。
- 失效引用阻止新分配，但不删除、重算或覆盖历史结果。
- 已有员工、规则和手动工时不可被默认数据覆盖。

---

### Task 1: 补齐 Golden Dragon 默认接收方员工

**Files:**
- Modify: `src/config/team-employee-roster-scope.ts`
- Test: `scripts/verify-team-tipout-roster-defaults.ts`

**Interfaces:**
- Consumes: `ensurePresetEmployeesPerStore(storeNames: string[])`
- Produces: Golden Dragon/上海陆家嘴店幂等包含 Carlos Lopez、Daniel Ortiz、Rachel Scott 三名稳定 ID 员工

- [ ] **Step 1: 写失败测试**

测试空花名册、已有同 ID、已有同门店+姓名+角色、其他门店和重复调用。必须断言以下 ID 只出现一次：

```ts
[
  "roster-tipout-golden-busser-carlos-lopez",
  "roster-tipout-golden-runner-daniel-ortiz",
  "roster-tipout-golden-host-rachel-scott",
]
```

- [ ] **Step 2: 运行并确认失败**

Run: `npx.cmd --yes tsx scripts/verify-team-tipout-roster-defaults.ts`

Expected: FAIL，三名员工尚未补齐。

- [ ] **Step 3: 实现幂等补齐**

在 `ensurePresetEmployeesPerStore` 的现有写入事务中，仅当规范化门店为“上海陆家嘴店”时追加：

```ts
{ id: "roster-tipout-golden-busser-carlos-lopez", name: "Carlos Lopez", role: "Busser", tipType: "receive", store: "上海陆家嘴店" }
{ id: "roster-tipout-golden-runner-daniel-ortiz", name: "Daniel Ortiz", role: "Runner", tipType: "receive", store: "上海陆家嘴店" }
{ id: "roster-tipout-golden-host-rachel-scott", name: "Rachel Scott", role: "Host", tipType: "receive", store: "上海陆家嘴店" }
```

使用“相同 ID 或规范门店+姓名+角色”判重，不覆盖已有字段。

- [ ] **Step 4: 运行测试并提交**

Run: `npx.cmd --yes tsx scripts/verify-team-tipout-roster-defaults.ts`

Expected: PASS。

Commit: `feat: seed tipout receiver employees`

### Task 2: 建立共享角色与员工目录

**Files:**
- Create: `src/team/tips/legacy/tipout-roster-directory.js.txt`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Test: `scripts/verify-team-tips-roster-directory.mjs`

**Interfaces:**
- Produces: `TipOutRosterDirectory.listRoles()`、`listEmployees(storeName)`、`resolveReceiverEmployees(rule, storeName)`、`validateRuleReferences(rule, storeName)`、`getEmployeeById(id)`
- Consumes: `tipout-employees-roster-v1`、角色 options/hidden keys、`TipOutGlobalScopeFilter.canonicalRosterStoreDisplayName`

- [ ] **Step 1: 写 VM 失败测试**

覆盖系统/自定义/隐藏角色合并、门店别名、缺失/重复员工 ID 迁移、哈希碰撞时 ordinal 递增、employeeRefs 优先、纯角色展开、员工 ID 去重和失效原因。

- [ ] **Step 2: 运行并确认失败**

Run: `node scripts/verify-team-tips-roster-directory.mjs`

Expected: FAIL，共享目录不存在。

- [ ] **Step 3: 实现目录及迁移**

目录初始化时规范化花名册；缺失/重复 ID 使用：

```js
'roster-legacy-' + stableHash(canonicalStore + '|' + role + '|' + name) + '-' + ordinal
```

若生成 ID 与已有 ID 冲突，确定性递增 ordinal 直到唯一。只有发生迁移时回写一次并派发 `tipout-roster-updated`。

`resolveReceiverEmployees` 返回：

```js
{ employees: [{ id, name, role, store }], issues: [{ code, receiverIndex, value }] }
```

纯角色规则展开当前门店有效员工；存在 employeeRefs 时按 ID 验证门店与角色。

- [ ] **Step 4: 注册原生运行时依赖**

在 `tips-legacy-runtime.ts` 中让 rules、rule-editor、details、distribution 与 employee-reconciliation 在各自 program 前加载 directory raw code。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-team-tips-roster-directory.mjs`

Expected: PASS。

Commit: `feat: add shared tipout roster directory`

### Task 3: 手动工时升级为 employeeId 身份

**Files:**
- Modify: `src/team/tips/legacy/tipout-manual-hours-store.js.txt`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Test: `scripts/verify-team-tips-manual-hours-store.mjs`

**Interfaces:**
- Produces: `get(ruleId, dateKey, employeeRef)`、`seed(entry)`、`listForEmployee(dateKey, employeeRef)` 同时兼容旧字符串姓名参数
- Entry 新增: `employeeId?: string`

- [ ] **Step 1: 扩展失败测试**

验证 employeeId 主键、同名不同 ID 隔离、改名后按 ID读取、旧姓名唯一匹配升级、升级后刷新无新旧重复项、歧义时不合并，以及旧字符串调用不回归。

- [ ] **Step 2: 运行并确认失败**

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Expected: FAIL，仓储尚不支持 employeeRef。

- [ ] **Step 3: 实现兼容迁移**

`normalize` 保留 employeeId；identity 有 ID 时使用 ID，否则使用姓名。`resolveEmployeeRef` 支持字符串或 `{ employeeId, name, legacyNames }`。唯一旧姓名匹配后原位补写 ID 和当前姓名，保存前按新 identity 去重。

- [ ] **Step 4: 更新调用方**

详情种子和输入保存同时传 employeeId/name；distribution 的对账行通过共享目录员工对象读取手动工时，不再只传姓名。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Run: `node scripts/verify-team-tips-default-manual-hours-demo.mjs`

Expected: PASS。

Commit: `feat: key manual hours by employee id`

### Task 4: 规则编辑器改用共享角色与员工

**Files:**
- Modify: `src/team/tips/programs/rule-editor.js.txt`
- Modify: `src/team/tips/programs/rules.js.txt`
- Test: `scripts/verify-team-tips-rule-roster-source.mjs`

**Interfaces:**
- Consumes: `TipOutRosterDirectory.listRoles/listEmployees/validateRuleReferences`
- Produces: 接收方 `employeeRefs`、规则列表“引用失效”状态、保存阻断

- [ ] **Step 1: 写失败契约测试**

断言 editor 不含硬编码 `roleEmployees =`；角色选项来自 listRoles；员工选项按规则门店和角色过滤；保存生成 employeeRefs；旧姓名唯一匹配；无效引用显示具体问题并阻止保存。

- [ ] **Step 2: 运行并确认失败**

Run: `node scripts/verify-team-tips-rule-roster-source.mjs`

Expected: FAIL，编辑器仍使用硬编码字典。

- [ ] **Step 3: 替换角色/员工解析**

将所有接收方、扣除方、条件和员工权重相关选择器统一调用目录。表单回填以 employeeId 为选中值、姓名为标签；保存时生成 `{ employeeId, name }`。

- [ ] **Step 4: 增加失效提示与保存阻断**

规则列表显示“引用失效”；编辑器在对应接收方展示缺失角色/员工，`collectFormData` 后、`saveRule` 前调用 validate，存在 issues 时停止并聚焦第一处问题。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-team-tips-rule-roster-source.mjs`

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS。

Commit: `feat: bind tip rules to team roster`

### Task 5: 分配明细与员工对账统一接收方范围

**Files:**
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Test: `scripts/verify-team-tips-receiver-scope.mjs`

**Interfaces:**
- Consumes: `resolveReceiverEmployees(rule, storeName)`
- Produces: 同一员工集合用于分配明细、默认 6h 种子、员工对账并集与去重

- [ ] **Step 1: 写失败测试**

验证两处 program 均调用同一解析器；详情不含 `const roleEmployees`；对账只包含当前门店有效规则接收方；多规则同员工按 ID 去重；失效规则不参与新结果。

- [ ] **Step 2: 运行并确认失败**

Run: `node scripts/verify-team-tips-receiver-scope.mjs`

Expected: FAIL。

- [ ] **Step 3: 改造分配明细**

按每个 receiver 调用解析器构建表格和工时分配。规则 `5`、2026-01-01 的默认补录只遍历解析出的未打卡员工，并写入 employeeId。

- [ ] **Step 4: 改造员工对账**

先取当前门店有效规则，为每条规则解析接收员工，构建 employeeId 并集，再生成逐日数据；金额聚合逻辑保持原样，只改变员工范围。

- [ ] **Step 5: 运行测试并提交**

Run: `node scripts/verify-team-tips-receiver-scope.mjs`

Run: `node scripts/verify-team-tips-employee-punch-sessions.mjs`

Run: `node scripts/verify-team-tips-employee-manual-hours-view.mjs`

Expected: PASS。

Commit: `feat: scope tip reconciliation to receivers`

### Task 6: 集成构建与浏览器验收

**Files:**
- Verify: `src/team/tips/**`
- Verify: `src/config/team-employee-roster-scope.ts`

- [ ] **Step 1: 运行回归测试**

Run:

```bash
node scripts/verify-team-tips-roster-directory.mjs
node scripts/verify-team-tips-manual-hours-store.mjs
node scripts/verify-team-tips-rule-roster-source.mjs
node scripts/verify-team-tips-receiver-scope.mjs
node scripts/verify-team-tips-default-manual-hours-demo.mjs
node scripts/verify-team-tips-native-views.mjs
npx.cmd --yes tsx scripts/verify-team-employees-data.mjs
```

Expected: 全部 PASS。

- [ ] **Step 2: 构建**

Run: `npm.cmd run build`

Expected: 成功退出。本次不修改 `vendor/emenu-new`，无需执行 eMenu embed 发布命令。

- [ ] **Step 3: 浏览器验收**

在全新端口验证：角色与员工出现三名默认员工；规则编辑器角色与员工来源一致；规则 `5` 可保存；1 月 1 日详情为未打卡接收员工显示 `6 h`；员工对账只出现接收方并显示同一工时；隐藏角色后规则失效并阻止分配，恢复后正常。

- [ ] **Step 4: 最终提交**

仅提交上述源文件和测试，不提交构建生成的无关文件。

Commit: `test: verify tipout roster source integration`

## Self-Review

- Spec coverage: 唯一数据源、ID 迁移、门店别名、默认员工、employeeRefs、旧规则、失效阻断、手动工时改名兼容、分配和对账共享范围均有任务。
- Placeholder scan: 无 TODO、TBD 或未定义接口。
- Type consistency: 员工目录统一返回 `id/name/role/store`；规则引用使用 `employeeId/name`；手动工时接受同一 employeeRef。
