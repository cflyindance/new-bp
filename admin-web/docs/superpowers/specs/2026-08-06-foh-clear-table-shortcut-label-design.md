# 前厅“展示清桌快捷按钮”文案统一设计

## 背景

前厅管理中心的“清桌与换企台”分组中，seq 642 当前标题为“清桌”，描述为“设置是否展示清桌按钮（eMenu上）”。标题没有明确表达该开关控制的是快捷按钮显隐，容易与付款后自动清桌、清桌通知混淆。

## 目标

- 将 seq 642 的功能标题统一改为“展示清桌快捷按钮”。
- 将功能描述统一改为“设置是否展示清桌快捷按钮（eMenu）”。
- 同步当前有效的运行时目录、生成配置、平台预设和前厅设计文档。
- 保持 seq 642、存储键、开关逻辑和仅适用 eMenu 的范围不变。

## SSOT 与生成链

原始归类文档仍保留历史标题，因此 seq 642 的当前有效文案以
`scripts/lib/settings-catalog-scene-supplement.mjs` 中的标题覆盖和场景描述覆盖为 SSOT：

- 标题覆盖：“展示清桌快捷按钮”。
- 场景描述覆盖：“设置是否展示清桌快捷按钮（eMenu）”。

按以下顺序同步派生产物：

1. 修改 SSOT 覆盖项。
2. 执行 `npm run build:settings-catalog`，生成 `src/config/module-settings-catalog.ts`。
3. 修改 `scripts/generate-foh-settings-design-doc.mjs` 的 seq 642 组内顺序表述，并执行 `node scripts/generate-foh-settings-design-doc.mjs`，生成仓库根目录下的当前前厅设计文档。
4. 执行 `npm run generate:platform-preset-tree`，同步平台预设导出；只接受与 seq 642 文案直接相关的派生差异，避免混入其他生成漂移。
5. 定点同步 `admin-web/docs/项目文档/前厅管理中心-设置二级导航重设计方案.md` 兼容快照中的 seq 642 文案。

以 seq 642 作为功能身份，不创建新配置项，也不迁移任何存储数据。历史竞品分析、原始归类资料继续保留旧名称，用于记录配置来源，不参与当前运行目录生成。

## 影响范围

- `scripts/lib/settings-catalog-scene-supplement.mjs`：当前标题和场景描述的 SSOT。
- `src/config/module-settings-catalog.ts`：由目录生成命令产生的运行时标题和场景描述。
- `scripts/generate-foh-settings-design-doc.mjs`：组内顺序说明。
- 当前平台预设与前厅设计文档：同步标题和描述。
- 专项校验：断言 seq 642 新标题、新描述和原有分组顺序。

不修改清桌快捷按钮 UI、事件绑定、localStorage 字段、主开关行为或产线选择逻辑。

## 验收标准

1. “清桌与换企台”分组仍按 `534 → 642 → 351 → 347` 展示。
2. seq 642 标题为“展示清桌快捷按钮”。
3. seq 642 描述为“设置是否展示清桌快捷按钮（eMenu）”。
4. seq 642 仍仅适用于 eMenu，开关行为不变。
5. 当前有效配置与文档不再将 seq 642 显示为单独的“清桌”。
6. 专项校验、TypeScript 检查和生产构建通过。
7. 本次变更集不得包含以下历史资料：
   - `../docs/项目文档/配置归类-终版.md`
   - `docs/竞品综合分析/**`
   - `docs/多模型分析/**`

专项校验仅扫描以下当前有效范围，避免把历史溯源文本误判为旧文案残留：

- `src/config/module-settings-catalog.ts`
- `scripts/lib/settings-catalog-scene-supplement.mjs`
- `scripts/generate-foh-settings-design-doc.mjs`
- `docs/项目文档/平台预设-配置预设四级导航树.md`
- `docs/项目文档/前厅管理中心-设置二级导航重设计方案.md`
- `../docs/项目文档/前厅管理中心-设置二级导航重设计方案.md`

