# 商家菜单预览 · 滑层目录手风琴实施计划

日期：2026-08-16  
设计规格：`docs/superpowers/specs/2026-08-16-menu-preview-sheet-accordion-design.md`  
工作分支：`wt/menu-preview-sheet-accordion`  
Worktree：`F:/米聚/GitHub仓库/admin-web-menu-preview-sheet-accordion`（权威提交）；改动同步到主工作区 `new-bp/admin-web/` 供 HMR 预览。

## 目标

全屏「商家菜单预览」滑层内：有可见子菜单的二级目录改为真手风琴（默认全收起、同时只开一个、点击不进入目录页）；仅叶子更新主内容区。不改文档模型、发布 JSON、编辑树、底部小预览条。

## 任务 1：预览滑层渲染（手风琴）

文件：`admin-web/src/config/json-menu-preview-ui.ts`

1. `renderJsonMenuFullscreenPreview` 增加参数 `expandedPath: MenuNodePath | null = null`，并传给 `renderSheet`。
2. 调整 `renderSheet(node, rootPath, locale, selectedPath, expandedPath)`：
   - 遍历二级 `children` 时，计算 `hasVisibleChildren`。
   - **有可见子**：调用可展开行渲染（见下），且**仅当** `samePath(childPath, expandedPath)` 时渲染三级列表（现有 `ml-5` + 竖线样式）。
   - **无可见子**：继续 `renderSheetItem` + `data-jme-select`。
3. 新增或扩展行渲染：
   - 可展开二级：`data-jme-sheet-toggle="${encodeMenuNodePath(path)}"`（**不要** `data-jme-select`）。
   - 右侧 `›`；展开时加旋转 class（与一级侧栏类似）。
   - 展开态可加轻微背景（如 `bg-teal-50/60`），但不要用叶子选中那套 inset 强调条冒充「进入页面」。
4. 三级行仍用 `renderSheetItem` + `data-jme-select`（即使节点带 `children` 也不再套 toggle）。
5. `renderJsonMenuPreview`（底部小预览）保持不动。

## 任务 2：预览会话状态与点击

文件：`admin-web/src/config/json-menu-editor-ui.ts`

1. 新增模块状态：`let fullscreenPreviewExpandedPath: MenuNodePath | null = null`。
2. `clearFullscreenEnvironment`：除关闭预览与清空 `fullscreenPreviewSheetRootPath` 外，同时 `fullscreenPreviewExpandedPath = null`。
3. 点击处理（在现有 `data-jme-select` / `data-jme-sheet-back` 附近）：
   - `data-jme-sheet-toggle`：解码 path；若与当前 `fullscreenPreviewExpandedPath` 相同则置 `null`，否则设为该 path（单开）；**不要**调用 `jsonMenuEditorStore.select`；`onMount` + 必要时 `applyFullscreenEnvironment`。
4. 重置 `fullscreenPreviewExpandedPath = null` 的时机：
   - 打开全屏预览（`data-jme-fullscreen-open`）时。
   - 全屏内 `data-jme-select` 导致换一级 / 重算 `fullscreenPreviewSheetRootPath` 时（一级切换开滑层后应收起）。
   - `data-jme-sheet-back` 时。
   - 关闭预览时（已在 clear 中）。
5. `renderJsonMenuFullscreenPreview(...)` 调用处传入 `fullscreenPreviewExpandedPath`。

注意：一级有子菜单仍走 `data-jme-select`（可进主区目录容器 + 开滑层），与规格 §2.3 一致。

## 任务 3：双写与验证

1. 在 worktree 改完后，将相同相对路径文件同步到 `new-bp/admin-web/src/config/`。
2. 主工作区 `npm run dev` 下打开菜单路由配置 → 商家菜单预览，按规格 §6 手工验收（商品中心 / 商品目录 / 商品列表）。
3. 有现成脚本则跑 `verify-json-menu-*`；无专项测试时以手工验收 + TypeScript/构建不报错为准。不新增无关文件。

## 完成标准

- [ ] 滑层打开时二级默认全收起，三级不可见。
- [ ] 点可展开二级只 toggle，主区不进入该目录页。
- [ ] 同时只展开一个二级；再点同一项收起。
- [ ] 点叶子才更新主内容区。
- [ ] 返回 / 换一级 / 关预览后再次打开滑层仍全收起。
- [ ] 编辑树、底部小预览、保存/发布行为无回归。
