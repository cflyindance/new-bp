# Declaration Batch Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 从声明模板详情批量设置范围内员工默认模板，立即保存且不改变历史确认记录。

**Architecture:** scoped repository 负责偏好读写，独立 batch 模块负责范围过滤、覆盖确认和逐项结果，runtime 员工适配器负责现有数据映射与局部同步。设置页面装配独立选择面板，不扩展五列表格。

**Tech Stack:** TypeScript、原生 DOM/Shadow DOM、legacy JavaScript、Node 验证脚本、浏览器演示存储与开发 Mock API。

**Spec:** `docs/superpowers/specs/2026-09-30-payroll-declaration-batch-assignment-design.md`

## Global Constraints

- 不修改考勤、薪资金额、已确认声明快照或周期覆盖设置。
- 保留员工现有打印模式，缺省沿用 employee-only，不重新增加打印格式字段。
- 正式 API 不能因失败静默降级到浏览器存储。
- 企业范围与授权门店取交集；店级模板只允许对应门店，身份为组织/门店/员工 ID。
- 当前 server/payroll-api-server.mjs 使用 scripts/lib/payroll-mock-api-handler.mjs；这是开发 Mock，不宣称生产鉴权已完成。
- 仅使用现有隔离 worktree；不提交无关 dist 产物。实施提交须遵循用户提交指令。

## Task 1: 偏好读取契约

**Files:** 修改 `src/team/payroll/payroll-declaration-api.ts`、`src/team/payroll/payroll-declaration-browser.ts`、`scripts/lib/payroll-mock-api-handler.mjs`；测试 `scripts/verify-payroll-declaration-browser.ts`、`scripts/verify-payroll-declaration-api.mjs`。

**Interfaces:** repository 增加 `loadEmployeePreference(employeeId: string): Promise<EmployeeDeclarationPreference | null>`；HTTP GET `/preferences/:employeeId` 返回 `{preference}`。沿用既有组织/门店 headers 和联合存储键。

- [ ] 写失败测试：同员工 ID 在两个门店互不串读，空值返回 null，view 可读不可写。
```ts
await repoA.saveEmployeePreference(input);
assert.equal((await repoA.loadEmployeePreference(input.employeeId))?.defaultFamilyId, input.defaultFamilyId);
assert.equal(await repoB.loadEmployeePreference(input.employeeId), null);
```
- [ ] 编译并运行 browser TS 测试及 `node scripts/verify-payroll-declaration-api.mjs`，确认因缺少读取方法失败。
- [ ] 实现 browser 读取及 Mock GET；HTTP adapter 只解包 preference，不吞异常。
```ts
loadEmployeePreference: async employeeId => {
  const result = await request<{preference: EmployeeDeclarationPreference | null}>(`/preferences/${encodeURIComponent(employeeId)}`);
  return result.preference;
}
```
- [ ] 更新所有 repository 测试替身并重跑上述测试和 `node node_modules/typescript/bin/tsc --noEmit`，必须通过。

## Task 2: 员工适配与持久化同步

**Files:** 新建 `src/team/payroll/payroll-declaration-employees.ts`；修改 `src/team/payroll/payroll-legacy-runtime.ts`、`src/team/payroll/legacy/payroll.js.txt`；测试新建 `scripts/verify-payroll-declaration-employees.ts`。

**Interfaces:** 定义 `AssignmentEmployee = {key:string; employeeId:string; storeId:string; name:string; employeeNumber:string; preference:EmployeeDeclarationPreference|null; unavailableReason?:string}`；`DeclarationEmployeeAdapter` 提供 `list(): Promise<AssignmentEmployee[]>` 和 `applySaved(employee:AssignmentEmployee, preference:EmployeeDeclarationPreference):void`。key 使用 JSON.stringify([organizationId,storeId,employeeId])。

- [ ] 失败测试覆盖跨期去重、同名跨店不合并、无本期考勤仍列出、含糊门店不可选、偏好读取错误阻止赋默认。
```ts
assert.notEqual(JSON.stringify(['org','A','1']), JSON.stringify(['org','B','1']));
```
- [ ] 编译运行新测试，确认适配器尚未提供导致失败。
- [ ] 从 runtime 既有薪资 snapshot 全部期次及统一名册取人；唯一稳定 ID/精确门店别名映射，无可靠薪资 ID 的名册项显示不可用，不凭姓名或数组索引生成写入目标。统一加载持久化偏好，null 才兼容已有员工偏好。
- [ ] 在单员工编辑打开、声明 resolve、批量候选加载中使用同一读取入口；applySaved 只同步默认偏好、对应编辑基线与未确认展示缓存，不调用全量薪资保存。
```ts
const saved = await repository.loadEmployeePreference(employee.id);
const effective = saved ?? employee.declarationPreference ?? null;
```
- [ ] 重跑员工适配测试及 `node scripts/verify-payroll-employee-identity-save.mjs`；确认冻结 snapshot 优先且其他草稿保留。

## Task 3: 批量编排

**Files:** 新建 `src/team/payroll/payroll-declaration-batch.ts`、`scripts/verify-payroll-declaration-batch.ts`。

**Interfaces:** 导出 `prepareAssignment(familyId:string, employees:AssignmentEmployee[]):Promise<AssignmentPreview>` 与 `executeAssignment(preview:AssignmentPreview):Promise<AssignmentResult>`，通过工厂注入 repositoryFor(storeId)、员工适配器和 scope generation。Preview 含员工原偏好指纹、有效发布版本、替换数；Result 含 succeeded、failed（员工与错误）、skipped、requiresConfirmation。

- [ ] 写并运行失败测试：已经应用跳过、系统默认不计替换、自定义计替换、第二人失败第一人成功、重试不重写成功者。
```ts
assert.equal(result.succeeded.length, 1);
assert.equal(result.failed.length, 1);
assert.equal(result.skipped.length, 1);
```
- [ ] 实现提交前重新读取模板发布状态与员工偏好、归属；指纹变化返回 requiresConfirmation，不按旧计数直接覆盖。逐项 await 保存，保留打印模式；每次写前检查 generation，变化停止后续请求；已成功不回滚。
```ts
const preference = await repository.saveEmployeePreference({
  employeeId: employee.employeeId,
  defaultFamilyId: family.familyId,
  defaultLocaleCode: family.localeCode,
  defaultPrintMode: employee.preference?.defaultPrintMode ?? 'employee-only',
});
adapter.applySaved(employee, preference);
```
- [ ] 重跑编排测试；增加发布版与草稿并存、停用、越界、读取失败、范围切换测试并全部通过。

## Task 4: 选择面板与装配

**Files:** 新建 `src/team/payroll/payroll-declaration-assignment-dialog.ts`；修改 `src/team/payroll/payroll-declaration-settings.ts`、`src/team/payroll-page.ts`、`src/team/payroll/payroll-page.css`；新建 `scripts/verify-payroll-declaration-assignment-ui.mjs`。

**Interfaces:** `createDeclarationAssignmentDialog({parent,management,adapter,onSaved})` 返回 `{open(familyId:string):Promise<void>,close():void,destroy():void}`；controller 内部使用 Task 3 编排，不直接读取 localStorage。

- [ ] DOM 渲染失败测试断言入口、五个员工字段、搜索、门店筛选、全选、零选禁用、替换提示及失败重试文案。
```js
assert.match(html, /批量分配员工/);
assert.match(html, /当前模板/);
assert.match(html, /确认分配/);
```
- [ ] 实现详情入口和可滚动选择面板，原五列表不变；有效发布版才允许进入。键盘焦点留在面板，关闭回入口；改变筛选清空勾选。
- [ ] 确认展示 X/Y；保存时禁用重复提交及选择变化；失败保留原因和重试按钮。scope 变化关闭失效面板，destroy 清理监听。
- [ ] 运行新 UI 测试、既有 settings/store-selection 测试及 tsc，全部通过。

## Task 5: 集成验收和文档

**Files:** 机械同步 `src/team/payroll/legacy/payroll.js.txt` 至 `dist/TipOut/payroll.js`；更新本计划执行记录、规格实施状态。不修改 eMenu。

- [ ] 执行 declaration browser/API、batch、employees、assignment-ui、identity-save、detail、export、merge、acceptance 回归；记录真实结果。
- [ ] 执行 `npm run build` 检查新增模块边界；不将全量生成目录加入暂存。
- [ ] 浏览器 57402 验证企业模板搜索并批量覆盖、详情即时显示、刷新保持；门店模板不可选择其他店；纯草稿禁用，部分失败仅重试失败者。
- [ ] 对比确认历史声明及当前未保存考勤草稿不变；打印声明沿用既有变量强调样式。恢复验收前界面范围，不清除用户数据。
- [ ] 更新执行记录，列明演示与 Mock 已验证范围、生产鉴权边界、未验证项和截图；用户要求提交时仅 stage 本任务文件。

## 自审

范围与身份映射对应 Task 2/3；持久化及刷新对应 Task 1/2；覆盖和重试对应 Task 3；选择交互对应 Task 4；历史保护、打印及现有功能回归对应 Task 5。无新增打印格式字段、无自动翻译、无改动确认快照。所有新增接口在对应任务中定义。

## 执行记录（2026-09-30）

- 已实现 repository 偏好读取与 Mock 门店联合键隔离、独立 batch 编排、模板详情批量选择面板及 runtime 偏好同步。员工适配目前随 dialog/runtime 实现，未单独拆出 employees 文件。
- 已补充启动恢复与员工编辑打开时读取持久化偏好，避免演示场景重建时仅依赖旧员工对象。
- 已通过：browser repository、batch 编排、API、员工即时保存、语言选项、声明 detail/export/merge/acceptance、settings/store-selection 验证及 TypeScript 检查。
- npm run build 成功；保留项目已有体积和嵌入资源警告。构建后追加的名册不可选处理及偏好恢复修改通过 TypeScript，未再次执行全量构建。
- 浏览器验证：上海陆家嘴店企业模板入口正常，已有模板员工显示已应用，选择“示例员工 陈”，确认提示 1 人/0 替换，保存后显示成功 1/失败 0，并立即显示已应用；截图 declaration-batch-result.png。
- 浏览器继续验证刷新/员工编辑时页面已转到小费管理，未抢占用户导航；该部分浏览器验收未完成。跨店、覆盖已有自定义模板、历史快照/打印及窄屏的完整浏览器验收未完成，不能视为全部验收通过。
- 本次功能修改未提交。正式生产鉴权不在当前 Mock 服务交付范围。
