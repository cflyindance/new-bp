# TipOut 原型还原 Design QA

## 验收范围

- 参考原型：`C:\Users\27273\Downloads\原型预览.html`
- 实现页面：`/TipOut/index.html`、`/TipOut/detail.html`、`/TipOut/rules.html`、`/TipOut/rule-add.html`
- 桌面视口：1280 × 720
- 移动视口：390 × 720（iframe 验收壳，仅用于走查，已清理）
- 原则：仅调整 UI 与交互呈现，不改变现有字段、数据计算、保存、复制、删除和分配业务逻辑。

## 同图视觉对照

- 汇总：`tipout-fidelity-qa/comparison-summary.png`
- 明细：`tipout-fidelity-qa/comparison-detail.png`
- 规则列表：`tipout-fidelity-qa/comparison-rules.png`
- 规则编辑：`tipout-fidelity-qa/comparison-rule-editor.png`
- 对照产物目录：`C:\Users\27273\.codex\visualizations\2026\08\31\01a05691-1562-70c1-a8da-ee58e4b8e18f\tipout-fidelity-qa`

桌面端同视口对照已完成。页面外壳、层级、留白、指标区、提醒区、筛选条、表格、规则卡片、上下文栏与底部操作区均按参考原型收敛；现有业务字段和真实状态仍以当前实现为准。

## 交互走查

- 汇总按日列表展示；鼠标点击、Enter 和 Space 均可从日期行进入独立明细页。
- 明细 URL 携带日期、门店及 `from=summary&return=history`；返回汇总后恢复原筛选、滚动位置和日期行焦点。
- 规则列表的新建池类型弹窗、更多菜单、复制、删除确认与空状态均通过。
- 规则编辑的两种分配模式、取值条件抽屉、只读上下文同步、取消确认和保存链路均通过。
- 明细页的公式说明、更新数据、比例调整、折叠/展开、删除/新增行、保存和保存并进入下一天均通过。
- 移动端侧栏展开、筛选折叠、规则弹窗、编辑页底部操作以及按日期进入独立明细页均通过。
- 浏览器控制台错误：0。

## 走查修正

- 修正 1280px 桌面视口下汇总筛选条换行。
- 修正规则“更多”菜单被表格容器裁切。
- 修正 390px 移动视口下“菜单”文字纵向换行。

## 自动化回归

- `verify:tipout-interaction-refresh`：通过
- `verify:tipout-work-hours-layout`：通过
- `verify-personal-sales-deduct.ts`：通过
- `verify-personal-sales-deduct-pipeline.ts`：通过
- `verify-personal-sales-pool.ts`：通过
- `git diff --check`（本轮 CSS 与验证脚本）：通过

## 构建说明

在隔离的干净 HEAD 工作树执行完整构建时，被仓库既有基线问题阻断：`src/config/json-menu-editor-ui.ts:25` 引用了未纳入干净 HEAD 的 `./json-menu-search-autofill-guard`。主工作树中存在同名用户未跟踪文件，本次未复制、修改或纳入提交；该失败与 TipOut 变更无关。隔离工作树与临时依赖连接均已清理。

final result: passed

---

# 老 B 平台升级提示对话框 Design QA（2026-09-14）

## 验证环境

- Route: `http://127.0.0.1:59813/#/legacy-b/merchants`
- Desktop visual check: Codex in-app Browser tab 6
- Commands: `node scripts/verify-legacy-b-platform.mjs`, `npx.cmd tsc --noEmit`, `npx.cmd vite build`

## 结果

- 每次刷新老 B 商户页均默认显示升级提示，主按钮获得初始焦点。
- 对话框标题、正文、主次按钮文案与需求一致；桌面端居中展示，无溢出。
- 遮罩点击不会关闭对话框；实现未绑定 Escape 关闭逻辑。
- 弹窗期间黄色 Demo 悬浮球保持可见，并通过 `inert` 与 `aria-hidden` 暂停交互。
- 点击「暂不切换」后弹窗移除，焦点落到「您的商户」标题，悬浮球恢复交互。
- 刷新路由后弹窗重新展示，不持久化关闭状态。
- 点击「立即切换到新版」后退出老 B 壳层、进入品牌版新版后台；应用把内部目标 `#/nav-home` 规范化显示为 `#/home`。
- 窄屏使用 `p-4`、`w-full max-w-[520px]` 和 `flex-col-reverse sm:flex-row`，确保卡片限宽、按钮纵向排列。
- 静态契约、TypeScript 检查和生产构建均通过；构建仅报告既有动态导入与大 chunk 警告。

final result: passed

---

# 老 B 平台静态商户页 Design QA

## 对比证据

- Source visual truth: `C:\Users\27273\AppData\Local\Temp\codex-clipboard-352b3e63-d251-471c-b0fc-e6d857e6c01f.png`
- Implementation: `http://127.0.0.1:59813/#/legacy-b/merchants`
- Implementation screenshot: Codex in-app Browser tab 6 inline capture（浏览器控制工具未提供本地截图文件路径）
- Desktop viewport: 1893 × 1079 CSS px，device scale 1；参考图 1893 × 1079 px，无需密度换算。
- Responsive viewport: 390 × 844 CSS px，device scale 1。
- State: 已登录，老 B 平台静态商户列表，悬浮球收起。

## Full-view comparison evidence

- 页面背景、品牌区、用户区、标题区、两列网格和四张卡片的整体构图与参考图一致。
- 桌面端卡片网格左边界约 238px、单卡宽约 700px、间距约 20px、卡片高约 340px，与参考图一致。
- 修正后标题区与参考图同在页面上方中央，商户卡片起始高度差控制在约 10px 内。
- 390px 窄屏下网格收为单列，没有横向溢出；长商户名和权限文本按设计截断。

## Focused region comparison evidence

- 顶部：MenuSifu 品牌锁定、`Fei Chen` 用户信息的位置、字号层级与参考图接近。
- 标题：`请选择` 与 `您的商户` 的字号、左边界和垂直层级已对齐。
- 卡片：Locations、商户名、用户图标、三行权限的顺序和文案逐项一致；渐变方向、圆角与低透明度水印保持参考图风格。
- 悬浮球：保留原有黄色悬浮球；展开后可见“老B平台”，并已实测切回门店版。

## Comparison history

1. 首轮发现卡片区比参考图偏上约 30px，标题字号偏小，退出老 B 后浏览器标题残留。
2. 调整标题宽度与字号、桌面网格上间距及横向边界，并移除独立页面对 `document.title` 的持久修改。
3. 第二轮同尺寸对比确认上述 P2 问题已消除；补充权限列表衬线字体以贴近参考图。

## Findings

- 无剩余 P0、P1 或 P2 问题。
- P3：品牌水印是按现有页面能力重绘的近似图形，与旧 B 平台原始商标路径存在细微差异，不影响页面层级与辨识。

## Primary interactions tested

- 登录后直接访问 `/legacy-b/merchants`：通过。
- 悬浮球展开并显示“老B平台”当前项：通过。
- 从老 B 平台切回门店版并恢复商家后台壳层：通过。
- 刷新老 B 专用路径：通过。
- 390px 单列响应式：通过。

## Implementation Checklist

- [x] 固定商户数据与文案一致。
- [x] 独立全屏壳层隐藏顶栏和侧栏。
- [x] 悬浮球保留并可退出。
- [x] 桌面同尺寸视觉对比通过。
- [x] 窄屏响应式通过。
- [x] 静态契约、TypeScript 与 Vite 构建通过。

final result: passed
