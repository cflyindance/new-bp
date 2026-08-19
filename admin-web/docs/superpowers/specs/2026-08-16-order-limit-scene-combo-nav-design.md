# 组合平铺左侧场景导航设计

> **状态更新（2026-08-18）：已被替代，不再用于当前主区。** 「限购数量」现统一采用一行一条的完整商品规则列表，场景矩阵、组合平铺、锚点导航和 scrollspy 均不再渲染。本文仅保留历史设计背景，当前口径以 `2026-08-18-order-limit-product-quantity-merge-design.md` 为准。

## 背景

「限购数量」在多轮规则的**组合平铺**模式下，会按人数 × 轮次笛卡尔积纵向排列全部组合块。组合数达到 2×2 及以上时，运营需要持续滚动才能找到指定场景，二次核对与跳转成本高。

现有平铺已具备块标题、块级完成度与块内独立批量，但缺少「场景目录 → 定位到块」的快捷入口。

## 目标

- 在组合平铺下提供左侧场景导航，点击即可定位到对应组合块。
- 手动滚动时导航高亮跟随当前可见块（双向联动）。
- 不改变平铺「一眼看全、跨组合对照」的核心价值。
- 不改变 `limits` 键结构、门店 / 产线数据模型、批量作用域。

## 已确认方案

| 决策 | 结论 |
|---|---|
| 交互形态 | 左侧粘性场景导航 + 右侧全量组合块 + 锚点滚动 |
| 出现条件 | 多轮 + `sceneDisplayMode === "tile"` + 组合数 ≥ 2 |
| 高亮联动 | 双向：点击导航滚动；手动滚动用 scrollspy 回写高亮 |
| 完成度 | 导航项展示该组合 `已配/总数`（复用 `sceneComboCompletion`） |
| 折叠 | 不做块折叠（本迭代范围外） |
| 窄屏 | ≤980px 隐藏左导航，退回纯平铺 |
| 状态持久化 | 导航列表由 `sceneCombos` 派生；高亮为临时 DOM 状态，不入库 |

## 出现条件

同时满足才渲染左侧导航：

1. `draft.period === "multi_round"`
2. `editorState.sceneDisplayMode === "tile"`（即 `isSceneTileMode(draft)`）
3. `sceneCombos(draft).length >= 2`

不满足时：矩阵区保持现有全宽平铺（或分开选择 / 非多轮现有布局），不留空侧栏。

## 页面结构（平铺且组合 ≥ 2）

步骤 4 在现有顺序上，仅改「矩阵区」布局：

1. 配置门店  
2. 产线配置（含复制 / 查看已配置规则 + 产线 Tab）  
3. 场景展示分段控件  
4. **矩阵区两栏**：
   - 左：场景组合导航（`nav`）
   - 右：现有纵向 `renderSceneComboBlocks` 输出

分开选择、非多轮、单组合平铺：结构与现网一致，不引入两栏。

## 导航内容

- 顺序与 `sceneCombos(draft)` 一致（外层 party 升序、内层 round 升序）。
- 每项文案：组合标题 `formatRange(party, "人") + " · " + formatRange(round, "轮")`。
- 每项右侧：完成度 `sceneComboCompletion(...).label`（如 `2/4`）；当 `complete === total && total > 0` 时可用完成态样式区分。
- 控件：`<button type="button">`，整体包在 `<nav aria-label="场景组合">`（或等价）。

## 锚点与滚动

- 每个组合块保留 / 使用可定位标识：现有 `data-scene-block="{party}|{round}"`；并增加稳定锚点，例如 `id="scene-combo-{party}-{round}"`。
- 点击导航：`scrollIntoView({ behavior: "smooth", block: "start" })`（或等价）滚到对应块。
- 块头设置 `scroll-margin-top`，避免被页面顶部吸顶的步骤栏 / 其它粘性元素遮挡（具体数值与现有 `sticky top` 对齐，实现时以实测为准）。
- 点击后立即将该导航项标为当前高亮；滚动动画过程中 scrollspy 可继续校正。

## Scrollspy（双向联动）

- 滚动根：页面窗口滚动（与现有 `renderEditor` 用 `window.scrollY` 恢复一致），不是独立右侧 overflow 容器。
- 实现建议：对右侧各 `.olf-scene-combo-block` 使用 `IntersectionObserver`（或滚动节流后取「最靠近视口顶部且可见」的块）。
- 高亮规则：当前视口内最靠上的可见组合块对应导航项加 `is-active`（或等价）。
- 生命周期：
  - `renderEditor()` 重绘 DOM 后重新挂载观察器 / 监听。
  - 离开步骤 4、切到分开选择、组合数变为 &lt; 2、销毁编辑器时卸载。
- 高亮**不写入** `editorState`、`editorDraft`、发布快照。

## Sticky 与响应式

- 左导航：`position: sticky; align-self: start;`，`top` 与步骤导航等粘性元素协调（实现时对齐现有 `olf-step-nav` 的 top 量级）。
- 窄屏：沿用现有编辑器约 `≤980px` 单列断点；该断点下**隐藏**左导航，右侧组合块恢复全宽纵向排列。不要求窄屏仍可用导航跳转。

## 与现有行为的关系

| 行为 | 本设计影响 |
|---|---|
| 块内单格输入 / 批量 | 不变；仍按块显式带 party/round |
| `renderEditor` 保 scrollY | 不变；重绘后重挂 scrollspy |
| 切门店 / 产线 / 展示模式 | 清空批量勾选等现有规则不变；导航随新 DOM 重建 |
| 「查看已配置规则」弹层 | 不受影响 |
| `limits` 键 | 不变 |

## 非目标

- 组合块折叠 / 展开  
- 导航点击后只渲染单个组合（退化成另一种「分开选择」）  
- 顶部 chips 快捷条（可作为后续叠加，本迭代不做）  
- 导航高亮 / 折叠状态入库或按门店记忆  
- 改变「分开选择」两排 Tab  
- 宽表多列平铺  

## 验证

新增 / 扩展验证脚本，至少断言：

1. 平铺且 `sceneCombos.length >= 2` 时渲染场景导航标记（如 `data-scene-combo-nav` 或等价）  
2. 组合数 &lt; 2、分开选择、非多轮时不渲染该导航  
3. 导航项数量与顺序与 `sceneCombos` 一致，并带完成度文案  
4. 每个组合块具备可定位锚点（`id` 或等价），且与导航项可对应  
5. 不改动 `limits` 键拼装与块内 `data-scene-party` / `data-scene-round` 口径  

浏览器验收：

- 2×2 组合：左侧 4 项，点击第 3 项滚到对应块并高亮  
- 手动滚动：导航高亮随可见块变化  
- 切到「分开选择」：导航消失；切回平铺恢复  
- 仅 1 个组合：无左导航  
- 窄屏：无左导航，块仍可纵向滚动编辑  
- 输入数量 / 批量：数据与块作用域正确，滚动位置不异常跳动  

## 实现落点（提示）

主要改动文件（与现网一致）：

- `admin-web/dist/Configuration center/assets/order-limit-flow.js`：`renderStepFour` / `renderSceneComboBlocks`、点击处理、scrollspy 挂载  
- `admin-web/dist/Configuration center/assets/order-limit-flow.css`：两栏布局、粘性导航、高亮与完成态、窄屏隐藏  

权威编辑在 git worktree `wt/order-limit-scene-combo-nav`；业务改动需同步主工作区 `admin-web/` 供 `npm run dev` 预览。
