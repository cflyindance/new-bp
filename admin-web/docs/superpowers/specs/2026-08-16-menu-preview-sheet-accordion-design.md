# 商家菜单预览 · 滑层目录手风琴展开设计

## 1. 目标

修正 M 平台「菜单路由配置 → 商家菜单预览」中，一级滑层内**带子菜单的二级目录**的点击行为。

当前问题：滑层内三级子菜单常显，且点击「商品目录」这类目录会 `select` 该节点，主内容区进入「目录容器」页。

期望行为：有可见子菜单的目录**不可进入自身页面**；点击只做**真手风琴展开/收起**（同时只展开一个）；打开滑层时默认全部收起；只有叶子菜单才更新主内容区预览。

范围仅限全屏商家菜单预览滑层交互；不改菜单文档模型、发布 JSON、编辑树、底部小预览条。

## 2. 交互规则

### 2.1 状态

在 `json-menu-editor-ui.ts` 预览会话中新增：

- `fullscreenPreviewExpandedPath: MenuNodePath | null`
  - `null`：滑层内全部二级目录收起
  - 非空：当前唯一展开的二级目录 path（与 `fullscreenPreviewSheetRootPath` 同属预览会话状态）

已有 `fullscreenPreviewSheetRootPath` 继续控制打开哪个一级滑层。

### 2.2 「可展开目录」判定

手风琴**仅作用于滑层二级**（与现有 `renderSheet` 只渲染到三级一致）。

二级节点若存在至少一个 `display !== false` 的子节点，即为可展开目录。  
不以 `isMenuDirectory` 为唯一条件（以「有可见子菜单」为准）。

二级无可见子节点 → 按叶子处理。  
三级节点即使带有 `children`，预览滑层内仍按叶子 `select`（不套 toggle、不继续四级展开）。

### 2.3 点击矩阵

| 点击对象 | 行为 |
|---------|------|
| 一级且有可见子菜单 | 打开滑层；可照旧 `select` 该一级（主区允许显示目录容器）；`fullscreenPreviewExpandedPath = null` |
| 滑层内可展开二级目录 | 若 path 等于当前 `expandedPath` → 收起为 `null`；否则设为该项（单开）。**不**改 `selectedPath`，主内容区不变 |
| 滑层内叶子（含无子二级、全部三级） | 照旧 `select`，更新主内容区 |
| 滑层返回 / 关闭预览 / 切换另一一级 | `fullscreenPreviewExpandedPath = null` |

说明：§1「有子菜单的目录不可进入自身页面」仅指**滑层内二级**；一级有子菜单仍可 select，与现网一级 → 开滑层行为一致。

### 2.4 默认与单开

- 打开任一一级滑层时：全部收起（不根据当前选中叶子自动展开）。
- 同时最多展开一个二级目录；展开 B 时 A 自动收起。

## 3. 渲染与 UI

改动集中在 `json-menu-preview-ui.ts`：

- `renderJsonMenuFullscreenPreview` 增加参数 `expandedPath`。
- `renderSheet`：**默认不渲染**二级下的三级子项；仅当二级 path 与 `expandedPath` 相同才渲染其子列表（缩进 + 左侧竖线，沿用现有样式）。
- 可展开目录行：使用 `data-jme-sheet-toggle="<encoded-path>"`（不用 `data-jme-select`）；右侧 `›`，展开时旋转；可有轻微展开态背景，但不得触发主区「目录容器」页。
- 叶子行：继续 `data-jme-select`；选中高亮样式不变。

`json-menu-editor-ui.ts`：

- 点击 `data-jme-sheet-toggle`：更新 `fullscreenPreviewExpandedPath` 后 `onMount` 重绘。
- 打开预览、换一级、返回、关闭时重置 `expandedPath`。

## 4. 边界情况

- 二级无可见子节点：无 `›`、不可 toggle，按叶子 `select`。
- 有 `children` 但可见子为空：同「无可见子」。
- 选中叶子后关预览再开 / 换一级：不自动展开父目录。
- 底部 `renderJsonMenuPreview`、左侧编辑树 `expandedPaths`：**不改动**。
- 菜单节点数据、序列化、校验、发布：**不改动**。

## 5. 改动文件

| 文件 | 改动 |
|------|------|
| `admin-web/src/config/json-menu-preview-ui.ts` | 条件渲染子级；toggle 属性；`expandedPath` 入参 |
| `admin-web/src/config/json-menu-editor-ui.ts` | 预览展开状态；toggle 事件；重置时机 |

## 6. 验收

1. 打开「商家菜单预览」，点「商品中心」→ 滑层打开，二级目录（如商品目录）全部收起，看不到「商品列表」。
2. 点「商品目录」→ 展开「商品列表」；主内容区**不**变成「商品目录 / 目录容器」。
3. 再点「商品目录」→ 收起子菜单。
4. 展开「商品目录」后再点另一可展开二级 → 仅后者展开（单开）。
5. 点「商品列表」→ 主内容区更新为该叶子预览。
6. 点滑层返回或换一级后再进滑层 → 再次全部收起。
