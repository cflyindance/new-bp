# Declaration Store Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增语言模板能绑定指定单个门店，且管理和员工使用保持范围隔离。

**Architecture:** 保留现有单门店声明仓库，通过独立管理范围协调器选择目标仓库并聚合模板列表。设置控制器持有编辑草稿状态，员工运行时继续只读取当前门店范围，不使用管理列表。

**Tech Stack:** TypeScript、原生 DOM、现有浏览器演示/API 仓库、Node assert 测试、Vite。

**Spec:** `docs/superpowers/specs/2026-09-30-payroll-declaration-store-selection-design.md`

## Global Constraints

- 一份模板仅绑定一个指定门店；企业通用不传 storeId。
- 单店账号仅可选择本店；前端不代替服务端授权。
- 不改变员工显式 familyId 优先级、系统默认语言、历史快照和薪资算法。
- 切换模板范围不切换薪资主页面门店；请求失败保留输入。
- 不修改 vendor/emenu-new，不整理无关构建产物；只按用户要求提交/推送实现。

## Task 1: 管理范围与仓库路由

**Files:** Create `src/team/payroll/payroll-declaration-management.ts`; create `scripts/verify-payroll-declaration-management.ts`.

**Interfaces:** consumes `PayrollPageContext.getScope()` and `(organizationId: string, storeId?: string) => PayrollDeclarationRepository`; produces `createDeclarationManagement(context, factory)` returning `listTemplates()`, `repositoryFor(storeId?: string)` and `invalidate()`.

- [ ] 写失败测试：注入门店 A/B 假仓库，记录 factory 参数；A/B 列表均返回同一企业模板，验证去重；store C 不在允许列表必须抛错。返回列表包括 `families`, `versions`, `failedStores`，供 UI 提示部分失败。

```ts
assert.throws(() => manager.repositoryFor('C'), /门店/);
manager.repositoryFor('B');
assert.deepEqual(calls.at(-1), ['org', 'B']);
const result = await manager.listTemplates();
assert.equal(result.families.filter(x => x.familyId === 'enterprise').length, 1);
```

- [ ] 用 `tsc --module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck --outDir "$env:TEMP/payroll-store-tests" scripts/verify-payroll-declaration-management.ts` 编译并运行输出文件，确认 RED。
- [ ] 实现门店白名单验证、按企业和门店缓存仓库、`Promise.allSettled` 聚合和 `Map` 去重。仅合并请求所针对门店或企业通用的记录；版本必须属于已接收 family。企业/门店权限签名变化或 invalidate 时废弃旧缓存，旧请求结果抛出已失效错误，不覆盖新上下文。

```ts
const families = new Map<string, DeclarationTemplateFamily>();
const versions = new Map<string, DeclarationTemplateVersion>();
// Per settled result: validate organization and requested store before inserting.
for (const family of acceptedFamilies) families.set(family.familyId, family);
for (const version of acceptedVersions) {
  if (families.has(version.familyId)) versions.set(version.versionId, version);
}
```

- [ ] 补充单店、空门店、部分请求失败、企业切换期间延迟响应测试；运行到 GREEN。

## Task 2: 编辑表单和列表

**Files:** Modify `src/team/payroll/payroll-declaration-settings.ts`, `src/team/payroll-page.ts`; extend `scripts/verify-payroll-declaration-settings-ui.mjs`; create `scripts/verify-payroll-declaration-store-selection.mjs`.

**Interfaces:** consumes Task 1 manager and `scope.stores`; editor state stores `{ languageDisplayName, localeCode, source, scopeMode: 'enterprise' | 'store', storeId }`. Existing handle `open/close/refresh/destroy` stays unchanged.

- [ ] 添加 RED 断言：存在“指定门店”、`data-declaration-store`，创建时不再直接使用 `input.context.getScope().storeId` 作为提交门店。

```js
assert.match(source, /data-declaration-store/);
assert.match(source, /指定门店/);
assert.doesNotMatch(source, /storeId: input\.context\.getScope\(\)\.storeId/);
```

- [ ] 新增时初始化编辑状态；输入事件更新状态，范围切换重新渲染但不丢失文本。指定门店默认有效当前门店，全部门店入口为空；必须选择有效 ID 后才能保存。已有 family 的范围及店 ID 只读。
- [ ] 用模板范围构造请求；每次 save/publish/retire 都验证最新上下文。先验证源文本和语言必填再创建 family，避免输入无效时创建空模板；失败保留状态。创建 family 成功但 saveDraft 失败时保留返回的 familyId 供重试，不重复创建。

```ts
const storeId = family ? family.scope.storeId : draft.scopeMode === 'store' ? draft.storeId : undefined;
const repository = manager.repositoryFor(storeId);
family ??= await repository.createFamily({ localeCode: draft.localeCode, languageDisplayName: draft.languageDisplayName, ...(storeId ? { storeId } : {}) });
await repository.saveDraft({ familyId: family.familyId, source: draft.source, variableSchemaVersion: 'v1' });
```

- [ ] 页面为设置注入 repositoryFactory，不复用员工单店 repository；列表聚合可访问门店并显示门店名称。名称不可用时显示店 ID，不误标企业通用。保存成功刷新保留所选模板，部分失败有提示。
- [ ] 设置打开时刷新范围；订阅范围变化清理旧编辑状态并重新加载，destroy 注销订阅；每个异步处理在写状态前检查请求 generation，旧 finally 也不可清除新请求 busy。
- [ ] 运行两个 UI 合约脚本和 Task 1 测试，确认 GREEN。

## Task 3: 隔离回归与本地验收

**Files:** Extend `scripts/verify-payroll-declaration-management.ts`, `scripts/verify-payroll-declaration-language-options.mjs` as necessary; no automatic changes to employee selection semantics.

**Interfaces:** Existing browser repository `listTemplates/createFamily/saveDraft/publishVersion` and runtime `listPublishedTemplates` remain store-scoped.

- [ ] 构造企业、A、B 同语言已发布模板，验证 A 列表无 B、B 列表无 A，企业模板始终可见；保留版本与快照现有回归。
- [ ] 执行测试命令：

```powershell
node scripts/verify-payroll-declaration-settings-ui.mjs
node scripts/verify-payroll-declaration-store-selection.mjs
node scripts/verify-payroll-declaration-language-options.mjs
node scripts/verify-payroll-employee-identity-save.mjs
node scripts/verify-payroll-declaration-detail.mjs
node scripts/verify-payroll-declaration-merge.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

- [ ] 浏览器在本地演示页面打开员工声明设置；选指定门店 B，填写唯一测试语言与正文，保存草稿后发布；验证列表/详情 B 回显且薪资页面门店未变化。分别在 A/B 查看语言选择，检查隔离。不修改真实薪资、不确认工资、不清理用户模板。
- [ ] 验证切换企业通用/指定门店保留输入，已有模板范围只读、关闭重开正确；保存截图并报告已验证项及限制。
- [ ] 检查只涉及本计划文件；按用户后续“提交”要求再提交实现，不自动推送。

## Plan self-review

Spec 的交互由 Task 2 覆盖，范围隔离/异步失效/部分失败由 Task 1 与 2 覆盖，历史和打印回归由 Task 3 覆盖。所有新增接口在 Task 1/2 定义，保留现有 repository API。执行前读取计划与关联设计文档。

## Execution results — 2026-09-30

- [x] Task 1：新增 management 协调器；目标门店路由、单店限制、列表去重、部分失败、过期异步响应均有通过的测试。
- [x] Task 2：指定门店表单、输入保留、归属回显、草稿/发布范围路由、上下文失效处理已实现。页面不再将员工单店仓库注入管理界面。
- [x] Task 3：本地浏览器实测从上海页面创建广州模板，保存/发布成功且页面门店不变；上海员工不可选，广州员工可选；单店视角只有本店，重新打开回显已发布模板。
- [x] 类型检查、生产构建、settings UI、store selection、language options、employee identity save、detail、merge、API、acceptance、browser repository 与 preference 测试通过。
- [x] 已恢复浏览器原上海门店/门店版视角。保留一份明确标注“门店隔离验收中文”的本地演示模板，未修改员工偏好或真实薪资数据。
- [x] 用户已要求提交实现；仅提交本功能源码、测试和计划记录，不包含无关构建产物，不自动推送。

限制：本次端到端使用浏览器演示仓库；真实生产服务端的账号授权需部署后联调，不以客户端门店列表作为安全授权依据。构建存在既有大包及缺失 kiosklite 嵌入资源提示，命令成功退出，未修改这些无关模块。
