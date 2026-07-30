# 新增员工弹窗 · 分类导航锚点 — 设计文档

> 日期：2026-07-30
> 模块：团队管理 / 角色与员工（`/team/roles-employees`，内嵌 `dist/TipOut/employees.html`）
> 状态：已实现
> 主要改动文件：`dist/TipOut/employees.html`、`dist/TipOut/employees.css`、`dist/TipOut/employees.js`

## 1. 目标

「新增员工 / 编辑员工」弹窗表单较长，包含 6 个分类区块。把分类名称做成导航锚点，点击后快速定位到对应模块，并在滚动时同步高亮当前所处分类。

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 导航位置 | 方案 A：左侧纵向固定导航，右侧滚动表单 |
| 高亮方式 | 点击定位 + 滚动同步高亮（主题色 + 左侧指示条） |
| 窄屏 | ≤720px 时导航转为顶部横向滚动条 |
| 适用范围 | 新增与编辑员工共用同一弹窗，交互一致 |
| 字段与保存逻辑 | 不变 |

## 3. 结构

弹窗宽度由 `min(760px,96vw)` 调整为 `min(940px,96vw)`，`modal-body` 改为横向 flex：

- `[data-employee-form-nav]`：6 个 `button`，`data-employee-form-nav-item` 指向目标区块 id
- `[data-employee-form-scroll]`：唯一滚动容器（`position: relative`，供 `offsetTop` 取相对偏移）
- 每个 `section.employee-form-section` 带 id 与 `data-employee-form-section`

分类与锚点 id：

| 分类 | 锚点 id |
|------|---------|
| 基本信息 | `employee-sec-basic` |
| 联系与地址 | `employee-sec-contact` |
| POS 登录与刷卡 | `employee-sec-pos` |
| 考勤与收银 | `employee-sec-attendance` |
| 薪酬 | `employee-sec-pay` |
| 薪资报税（Payroll） | `employee-sec-payroll` |

## 4. 行为

- 点击导航项：`scrollTo({ top: section.offsetTop - 8, behavior: "smooth" })`，同时立即高亮该项
- 滚动高亮：取「顶部判定线（`scrollTop + 24`）之上最后一个区块」；滚动到底部时固定高亮末尾分类
- 高亮锁：点击后锁定高亮，滚动停止 150ms 或用户主动 `wheel / touchstart / keydown` 后解除，避免平滑滚动中间态改写目标高亮
- 底部留白：`updateEmployeeFormTailSpace()` 按 `滚动容器高度 − 末尾区块高度 − 16` 给 form 补 `padding-bottom`，使末尾分类也能定位到顶部；弹窗打开与窗口 resize 时重算
- 打开弹窗：滚动位置归零、导航横向滚动归零、高亮回到「基本信息」

## 5. 顺带修复

弹窗节点位于 `.layout.employees-page` 之外，`.employees-page` 前缀的弹窗样式（`.form-grid-add` 双列栅格、`.employee-form-section` 分区分隔线、`.employee-check-stack` 等）一直未生效，表单退化为单列且无分区分隔。为 `#addEmployeeModal` 补上 `employees-page` 类使其恢复预期样式；表单总高度由 1808px 降至 1669px，锚点定位更精确。新增的导航样式统一以 `#addEmployeeModal` 作用域，避免再次踩到同一坑。

## 6. 验收

- [x] 点击 6 个分类均滚动到对应区块顶部（偏移 8px 内）
- [x] 滚动表单时高亮跟随当前分类；滚动到底部高亮末尾分类
- [x] 重新打开弹窗回到「基本信息」且滚动归零
- [x] 编辑员工复用同一交互，回填数据正常
- [x] 窄屏（600px）导航转为顶部横向滚动
- [x] 岗位多选下拉在滚动容器内正常展开、未被裁剪
