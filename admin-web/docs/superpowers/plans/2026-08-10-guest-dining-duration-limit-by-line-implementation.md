# “用餐时长限制”按产线配置与联动实施计划

> 依据：`docs/superpowers/specs/2026-08-10-guest-dining-duration-limit-by-line-design.md`

## 实施原则

- 采用方案 A，在现有 `module-settings-guest-dining-duration-ui.ts` 内扩展。
- 先写聚焦验证取得 RED，再修改实现取得 GREEN。
- `674-dining-duration-limit-by-line` 是唯一业务权威；`674-dining-duration-limit-lines` 仅为派生镜像。
- seq 674 没有通用总开关，任何写入路径都不得创建或改写 `bplant-module-setting-toggle:674`。
- 关闭限制只影响可操作与最终生效状态，不清空分钟数或 seq 577–580 的已选产线。
- 当前工作区包含其他任务修改；只增量编辑目标符号，不回滚、不覆盖无关差异。

## Task 1：建立 RED 验证与差异基线

目标文件：

- `scripts/verify-guest-dining-duration-limit-by-line.ts`（新增）
- 目标生成文件的实施前差异清单（保存在运行记录中，不覆盖用户文件）

步骤：

1. 断言分组顺序为 `[443, 571, 674, 577, 578, 579, 580]`。
2. 断言 seq 674 与 seq 577–580 的产线范围和顺序均为 POS、POS GO、PayPad、eMenu、SDI。
3. 断言 seq 674 目录项、无总开关分派、对象/镜像字段、范围和默认值。
4. 断言主对象/镜像三态、输入规范化、值保留、关联功能受限状态和即时刷新入口。
5. 断言 seq 674 被排除在 lines→toggle 镜像之外，按产线与 AI 写入使用专用同步入口。
6. 断言 seq 577–580 的存量 eMenu、显式空数组和 invalid 行为。
7. 运行验证并保存预期失败结果。

## Task 2：新增 seq 674 数据模型与配置表

目标文件：

- `src/config/module-settings-guest-dining-duration-ui.ts`
- `src/config/module-setting-storage-state.ts`（复用现有三态读取能力；只在需要时增量扩展）

步骤：

1. 新增 seq、字段 id、五产线 SSOT、分钟常量及配置类型。
2. 实现 presence-aware 主对象读取：`missing`、`configured`、`invalid`。
3. 实现 1–1440 整数规范化，非法值回退 120。
4. 实现主对象写入和派生 lines 镜像；加载阶段不自动修复镜像。
5. 实现按产线启用同步，保留分钟数和其他产线配置。
6. 渲染无总开关的三列表格，并绑定复选框、数字输入、失焦规范化。
7. 为每行添加 `FOH_LINE_CONFIG_ROW_ATTR` 及无障碍名称，支持按产线过滤。

## Task 3：扩展 seq 577–580 并实现依赖联动

目标文件：

- `src/config/module-settings-guest-dining-duration-ui.ts`
- `src/main.ts`

步骤：

1. 将关联功能合法产线从 eMenu 扩展到五条目标产线。
2. 修正读取迁移，显式空数组保持为空；missing 且历史总开关开启时只迁移 eMenu；invalid 不迁移、不写回。
3. 渲染时把已保存选择与 seq 674 启用产线相交，仅把限制状态用于禁用和最终生效，不改写保存数组。
4. 新增统一刷新函数，使 seq 674 改动后立即刷新所有可见关联控件。
5. 在四项总开关和按产线投影的通用副作用执行后重新应用限制条件。
6. 受限投影保留 `checked`/`aria-checked`，设置原生禁用和 `aria-disabled`，阻止鼠标、键盘及程序化写入。

## Task 4：接入设置入口、按产线写入和 toggle 镜像排除

目标文件：

- `src/main.ts`
- `src/config/module-settings-toggle-ui.ts`
- `src/config/foh-settings-by-line-toggle.ts`
- `src/config/module-settings-form-ui.ts`
- `src/config/page-settings-draft.ts`
- `src/config/module-settings-guest-menu-body-line-scope.ts`（复用当前共享 exclusion 谓词，保留 seq 607）

步骤：

1. 为 seq 674 增加专用行渲染、绑定和分派，确保不进入通用 toggle 集合。
2. 把 seq 674 加入现有共享 toggle-mirror exclusion 谓词。
3. 在 `readFohByLineToggleState` / `writeFohByLineToggleState` 中为 seq 674 调用主对象读取与专用 enabled 同步。
4. 对 seq 577–580 的按产线投影写入增加限制守卫；受限时直接忽略写入并保留数组。
5. 草稿保存/放弃和序列化继续使用主对象写入；lines 镜像由主对象派生，不产生 toggle key。
6. 确保 AI `foh-line` 复用按产线写入链路，写入后刷新 seq 674 与关联控件投影。

## Task 5：更新目录、分组、scope 与生成数据

目标文件：

- `scripts/lib/settings-catalog-virtual-items.mjs`
- `scripts/lib/settings-catalog-scene-supplement.mjs`
- `scripts/lib/foh-settings-groups.mjs`
- `scripts/lib/foh-line-scope-extract.mjs`（仅在抽取器不能识别新声明时调整）
- `scripts/lib/foh-settings-line-scope.seed.json`
- `src/config/foh-settings-line-scope.ts`（生成）
- `src/config/foh-settings-line-storage-registry.ts`（生成）
- `src/config/module-settings-catalog.ts`（生成）
- `scripts/generate-foh-settings-design-doc.mjs`
- `scripts/verify-foh-settings-22-group-ia.ts`
- `scripts/lib/foh-settings-22-group-baseline.json`

步骤：

1. 新增 seq 674 虚拟目录项与场景描述。
2. 更新目标分组顺序、seq 577–580 场景描述和设计文档生成说明。
3. 为 seq 674 登记五产线 scope 与 `674-dining-duration-limit-lines`；扩展 seq 577–580 scope。
4. 运行 catalog、分组、scope/registry 生成命令。
5. 对照实施前基线，确认只出现目标 seq、目标描述和预期生成变化；出现无关漂移立即停止。

## Task 6：GREEN、回归与浏览器验收

验证命令：

- `npx.cmd --yes tsx scripts/verify-guest-dining-duration-limit-by-line.ts`
- `npm.cmd run generate:settings-groups`
- `npm.cmd run generate:foh-line-scope`
- `npm.cmd run build:settings-catalog`
- `npm.cmd run verify:foh-line-scope`
- `npm.cmd run verify:foh-lines-store`
- `npm.cmd run verify:foh-settings-22-group-ia`
- `node_modules\.bin\tsc.cmd --noEmit`
- `npm.cmd run build`
- `git diff --check -- <目标文件>`

浏览器验收：

1. 核对设置顺序、五产线表格、默认 120 与输入边界。
2. 验证五产线可配置不同值，保存和刷新后保持。
3. 验证限制关闭/开启时四项关联功能禁用、失效和恢复，不丢选择。
4. 验证四项总开关与限制条件叠加。
5. 在按产线视图验证“已选但受限”“未选且受限”及写入守卫。
6. 验证保存、放弃修改和 AI `foh-line` 写入后主对象/镜像一致且无 seq 674 toggle key。
7. 检查浏览器控制台无新增错误或警告。

Build：required。CI Build：unknown。
