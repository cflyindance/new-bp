# 滑层搜索结果直接编辑完整设置实施计划

> 依据：`docs/superpowers/specs/2026-08-10-hub-sheet-search-direct-setting-edit-design.md`
> 目标：所有已启用 Hub 搜索的滑层中，设置命中项完整展开并可直接编辑；未持久化修改按当前搜索会话统一保存和离开保护。

## 实施原则

- 复用正式设置页的渲染、校验、草稿和产线状态，不复制搜索专用表单。
- 先把“页面路径即编辑作用域”的隐式依赖改成显式上下文，再接搜索结果 UI。
- 每个任务先补聚焦验证并取得 RED，再做最小实现取得 GREEN。
- 当前工作区的 `src/main.ts`、`page-settings-draft.ts`、产线与表单模块已有未提交修改；实施时以现有工作树为基线逐块补丁，禁止 reset、restore 或生成后整文件覆盖。
- 首次落地先由前厅 Hub 验证，通用接口完成后再解除搜索 Hub 白名单；最终能力覆盖全部已启用搜索的滑层。

## 实施任务

### 任务 1：建立专项回归护栏和现状基线

**文件**

- `scripts/verify-hub-search-direct-setting-edit.ts`（新增）
- `package.json`

**步骤**

1. 用 Node `assert` 固化以下当前事实：搜索索引能返回 `settingsPath + seq`、同一规范设置可去重、页面草稿按保存键隔离、前厅产线三态读取不退化。
2. 为尚未实现的接口增加失败断言：搜索会话状态机、显式编辑上下文、完整设置表面、跨来源保存协调器和下发重试移交。
3. 增加 `verify:hub-search-direct-edit` 脚本并先运行，确认因缺少新接口而 RED，而不是因环境或既有改动失败。
4. 保存以下命令的基线结果：TypeScript、前厅 lines store、22 组 IA、产线 scope 和生产构建。

**验证**

- `npx.cmd --yes tsx scripts/verify-hub-search-direct-setting-edit.ts` → 预期 RED
- `npx.cmd --yes tsx scripts/verify-foh-lines-store.ts`
- `npx.cmd --yes tsx scripts/verify-foh-settings-22-group-ia.ts`
- `npm.cmd run verify:foh-line-scope`
- `.\node_modules\.bin\tsc.cmd --noEmit`

### 任务 2：引入显式设置编辑上下文

**文件**

- `src/config/module-setting-edit-context.ts`（新增）
- `src/config/page-settings-draft.ts`
- `src/config/module-settings-toggle-ui.ts`
- `src/config/module-settings-form-ui.ts`
- `src/config/foh-settings-by-line-toggle.ts`
- `src/config/module-settings-deployment-change.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 定义 `SettingEditContext`：`mode`、`scopeKey`、真实 `settingsPath`、可选 `seq` 和 `lineId`。
2. 为草稿读写新增显式 `scopeKey/settingsPath` API；保留现有 `ForCurrentPath` 方法作为页面模式兼容包装。
3. 让通用开关、表单字段、JSON 和前厅按产线写入接受可选编辑上下文，不再强制从 `window.location.hash` 推断归属。
4. 变更记录始终保存真实来源 `settingsPath`；`scopeKey` 只用于隔离草稿与脏状态。
5. 增加契约测试：页面上下文行为不变；搜索上下文写入独立桶；相同 seq 在不同来源路径不会串值。

**完成条件**

- 现有设置页调用不需要一次性全部改写。
- 新搜索上下文可以在不改变 URL 的情况下正确读写草稿。
- 前厅未配置、显式全关和默认全选语义保持不变。

### 任务 3：建立搜索会话状态机与待执行操作

**文件**

- `src/config/hub-search-edit-session.ts`（新增）
- `src/config/hub-sheet-search.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 实现按 Hub 隔离的 `SearchEditSession`：会话 id、已接受关键词、草稿键集合、脏状态和单一 `pendingAction`。
2. 草稿键使用 `settingsPath + canonicalSeq + field identity/lineId`，禁止按 DOM id 或标题计数。
3. 实现清洁状态下直接接受关键词；脏状态下只记录待处理关键词，不替换正式查询。
4. 实现三种离开结果：保存成功后接受待执行操作、放弃后接受、取消后恢复原关键词和上下文。
5. 明确会话销毁点：关闭滑层或切换 Hub 且离开保护处理完成后销毁；保存成功但仍停留搜索页时保留清洁会话。

**测试场景**

- 脏状态下连续输入只保留最后一个待处理关键词。
- 取消不改变关键词、草稿和滚动标识。
- 保存或放弃后旧草稿归零，新关键词才生效。
- 相同结果重渲染或分批挂载继续读取当前关键词下的草稿。

### 任务 4：抽出公共完整设置编辑表面

**文件**

- `src/config/module-setting-surface.ts`（新增）
- `src/main.ts`
- 现有 `src/config/module-settings-*-ui.ts` 专用渲染模块（仅在需要传递上下文时修改）
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 定义公共入口：按 catalog item 渲染、绑定、验证、聚焦首错和刷新依赖状态。
2. 将 `renderModuleSettingRow` 的规范分派与对应绑定序列迁入公共表面或其注册表；正式设置页先改为调用公共入口。
3. 迁移时保持现有隐藏、合并和虚拟主项规则，确保被合并承载的旧 seq 不产生第二个编辑入口。
4. 所有控件根节点带显式编辑上下文标识；事件处理从触发元素解析上下文，并传入任务 2 的读写 API。
5. 为代表性控件建立页面模式/搜索模式契约：普通开关、单选/多选、数值/文本、JSON、复杂矩阵、适用产线和按产线专用配置。
6. 若某规范设置尚未接入公共表面，专项验证必须失败；不得降级为只跳转。

**安全拆分**

- 先迁移基础开关和通用表单，再迁移产线设置，最后迁移复杂矩阵和专用控件。
- 每一类迁移后运行专项验证和 TypeScript，避免一次移动 `main.ts` 的全部设置逻辑。

### 任务 5：扩展搜索命中描述并渲染完整结果

**文件**

- `src/config/hub-sheet-search.ts`
- `src/config/hub-search-settings-results.ts`（新增）
- `src/main.ts`
- `src/i18n.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 设置索引条目显式携带 `settingsPath`、规范 seq、来源分组和可编辑性信息。
2. 查询后按 `settingsPath + canonicalSeq` 去重，并继续应用平台预设、版本、RBAC、隐藏和合并规则。
3. 导航命中保持当前点击进入页面行为；设置命中调用公共设置表面并全部完整展开。
4. 支持查看但无编辑权限的设置使用同一完整表面只读渲染，并显示禁用原因；不得进入草稿队列。
5. 结果卡展示标题、seq、面包屑、说明、完整功能设置、适用产线、草稿与错误状态。
6. 首屏优先分批挂载；复杂矩阵进入视口后初始化。已编辑卡不得卸载，状态不得依赖 DOM 存活。
7. 使用结果根节点事件委托，避免每张卡重复注册全局监听。

**验证**

- 搜索“菜单”时代表性前厅设置完整展开并展示产线。
- 同一设置多字段命中只出现一张卡。
- 宽泛关键词显示总数与挂载进度，导航与输入不被长任务明显阻塞。

### 任务 6：实现跨来源统一保存协调器

**文件**

- `src/config/hub-search-save-coordinator.ts`（新增）
- `src/config/page-settings-draft.ts`
- `src/config/deployment-change-buffer.ts`
- `src/config/page-save-registry.ts`
- `src/config/deployment-page-trigger.ts`
- `src/config/page-save-bar-ui.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 按搜索 `scopeKey` 收集草稿，同时保留每项真实 `settingsPath` 和配置域。
2. 保存前运行所有已修改项及受依赖影响项的校验；任一失败时不进入持久化，并返回首错定位信息。
3. 生成一次变更预览，内部按 `settingsPath + domainKey` 拆分来源批次。
4. 持久化采用逐来源确认结果：成功来源清除草稿，失败来源保留；只要存在持久化失败，就不执行当前待处理的搜索、导航或关闭动作。
5. 若所有来源持久化成功，保存动作成立；随后触发下发。保存成功后保留当前查询和结果，或执行用户原先的待处理动作。
6. 保存栏显示去重后的“待保存 N 项”，提供预览、放弃和保存全部；无草稿时隐藏搜索保存操作。

**关键测试**

- 不同设置页的修改只出现一次统一预览。
- 部分持久化失败时，成功来源不重复保存、失败来源草稿仍在、待处理离开动作不执行。
- 全部持久化成功后搜索会话进入清洁状态。

### 任务 7：实现下发失败的幂等重试移交

**文件**

- `src/config/deployment-retry-queue.ts`（新增）
- `src/config/hub-search-save-coordinator.ts`
- `src/config/deployment-store.ts`
- `src/config/page-save-bar-ui.ts`
- `src/config/deployment-ui.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 定义来源阶段：`draft`、`validated`、`persisted-awaiting-deploy`、`deployed`。
2. 每次保存生成稳定 `saveOperationId`；来源幂等键为 `saveOperationId + settingsPath + domainKey`。
3. 下发失败时构造包含设置快照、变更记录引用和幂等键的重试记录。
4. 只有重试队列确认记录已持久接受后，搜索会话才能清除对应草稿；若移交失败，保留草稿并视为保存未完成。
5. 移交成功后显示“设置已保存，等待下发”，允许继续搜索、导航或关闭滑层；该状态不触发未保存离开保护。
6. 重试只执行下发，不重复写配置或生成变更记录；成功后移除队列记录。

**测试场景**

- 持久化成功、即时下发失败、移交成功：草稿清除，导航可继续，重试只下发。
- 持久化成功、即时下发失败、移交失败：草稿保留，待处理离开动作不执行。
- 重复点击重试不产生重复配置记录或重复下发批次。

### 任务 8：统一搜索词、导航与滑层离开保护

**文件**

- `src/config/page-save-guard.ts`
- `src/config/page-save-confirm-dialog.ts`
- `src/config/hub-sheet-search.ts`
- `src/main.ts`
- `src/i18n.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 让离开保护接受搜索会话 `scopeKey` 和待执行动作，而不仅是当前页面路径。
2. 接入搜索词更换/清空、左侧导航、功能入口、关闭滑层和切换 Hub。
3. 对话框提供“保存并继续 / 放弃修改 / 取消”；打开期间冻结搜索防抖和重复导航。
4. 取消时恢复原关键词、焦点、草稿和滚动位置。
5. `beforeunload` 只在存在未持久化草稿时启用；已移交重试队列的待下发记录不触发未保存提示。
6. 保存并继续发生部分持久化失败或重试队列移交失败时，不执行原待处理动作。

### 任务 9：完成性能、无障碍和全 Hub 接入

**文件**

- `src/config/hub-search-settings-results.ts`
- `src/config/hub-sheet-search.ts`
- `src/main.ts`
- `src/i18n.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`

**步骤**

1. 增加首屏批次、后续批次和复杂控件延迟初始化的调度；记录并验证 300ms/1s 目标。
2. 设置卡使用正确标题层级、控件 label、只读原因、错误摘要和 `aria-live` 保存/下发状态。
3. 键盘可访问搜索结果、全部控件、保存栏和离开对话框；对话框关闭后焦点回到触发点。
4. 前厅验证通过后，将公共结果编排器接入所有 `listHubSheetSearchHubIds()` 返回的通用和专用滑层。
5. 删除临时前厅灰度白名单，保留单一能力开关用于紧急回退，不保留永久双实现。

### 任务 10：全量验证与人工验收

**自动验证**

- `npx.cmd --yes tsx scripts/verify-hub-search-direct-setting-edit.ts`
- `npx.cmd --yes tsx scripts/verify-foh-lines-store.ts`
- `npx.cmd --yes tsx scripts/verify-foh-settings-22-group-ia.ts`
- `npm.cmd run verify:foh-line-scope`
- `npm.cmd run verify:foh-platform-preset-l3`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- `npm.cmd run build`

**浏览器验收**

1. 前厅搜索“菜单”，确认所有规范设置完整展开，代表项展示完整产线。
2. 同时修改普通开关、复杂表单和产线设置，确认修改计数去重、统一预览和保存。
3. 分别验证更换关键词、清空、点击导航、关闭滑层和切换 Hub 的三选项离开保护。
4. 验证取消后关键词、草稿、焦点和滚动位置不变。
5. 注入校验失败、持久化失败、下发失败和重试队列移交失败，核对各阶段行为。
6. 验证只读权限、平台预设和版本过滤。
7. 在至少一个通用滑层和一个专用滑层重复完整编辑与保存流程。
8. 检查控制台无错误，宽泛搜索滚动和输入无明显卡顿。

## 主要目标文件

- `src/config/module-setting-edit-context.ts`（新增）
- `src/config/module-setting-surface.ts`（新增）
- `src/config/hub-search-edit-session.ts`（新增）
- `src/config/hub-search-settings-results.ts`（新增）
- `src/config/hub-search-save-coordinator.ts`（新增）
- `src/config/deployment-retry-queue.ts`（新增）
- `src/config/hub-sheet-search.ts`
- `src/config/page-settings-draft.ts`
- `src/config/page-save-registry.ts`
- `src/config/page-save-guard.ts`
- `src/config/page-save-confirm-dialog.ts`
- `src/config/page-save-bar-ui.ts`
- `src/config/deployment-change-buffer.ts`
- `src/config/deployment-page-trigger.ts`
- `src/config/deployment-store.ts`
- `src/config/module-settings-toggle-ui.ts`
- `src/config/module-settings-form-ui.ts`
- `src/config/foh-settings-by-line-toggle.ts`
- `src/config/module-settings-deployment-change.ts`
- `src/main.ts`
- `src/i18n.ts`
- `scripts/verify-hub-search-direct-setting-edit.ts`（新增）
- `package.json`

## 完成定义

- 设计文档 12 节的 10 条验收标准全部通过。
- 正式设置页和搜索结果共用同一设置编辑表面与产线状态。
- 所有搜索滑层均支持设置结果完整展开和直接编辑。
- 未持久化草稿的保存、放弃、取消状态转换可测试且无竞态。
- 下发失败可幂等重试，不重复持久化或生成变更记录。
- 专项验证、现有前厅验证、TypeScript 和生产构建全部通过。
- 浏览器验收覆盖通用滑层、专用滑层、只读权限和失败路径。
