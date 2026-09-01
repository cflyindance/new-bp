# 原生弹窗清理 · 统一自定义对话框 / Toast

日期：2026-08-17  
状态：已确认（2026-08-17）  
范围：`admin-web/src/**` + `admin-web/dist/Configuration center/**` 中的 `window.alert` / `window.confirm` / `window.prompt`

## 1. 背景与目标

存量代码大量使用浏览器原生 `alert` / `confirm` / `prompt`，样式与系统相关（Windows 系统对话框观感差），且无法与后台设计语言统一。

目标：

1. **二次确认**（删除、离开、重置、覆盖等）→ 自定义确认对话框  
2. **提示**（校验失败、成功、错误信息）→ 页面内 Toast，不用弹窗  
3. **简单输入**（分类名、驳回原因、分数等）→ 带输入框的自定义对话框  
4. 视觉与交互对齐「前厅 · 菜单下单限制」确认框（`.olf-overlay` / `.olf-dialog`）  
5. 禁止新增原生弹窗；存量清零（见排除项）

不在本次范围：

- `vendor/**`、`dist/emenu-new/**`、`dist/kpos/**`、`dist/kiosklite/**` 等第三方/构建产物  
- 浏览器 `beforeunload` 卸载提示（只能使用原生机制）  
- 已有复杂业务对话框（导航蓝图添加 L1/L2/L3、变更对比下发等）不重写，仅替换仍调用原生 API 的调用点

## 2. 存量统计（实施前快照）

| 区域 | alert → Toast | confirm → 确认框 | prompt → 输入框 |
|---|---:|---:|---:|
| `src/**/*.ts` | 72 | 38 | 8 |
| `dist/Configuration center/**` | 25 | 7 | 0 |
| **合计** | **97** | **45** | **8** |

`src` 中 `prompt` 调用点：

- `seasoning-option-category-manager-ui.ts`（分类名称 / 内部编码）  
- `team-training-performance-ui.ts`（测验分数）  
- `platform-preset-ui.ts`（自定义业态名称）  
- `enterprise-merchant-ui.ts`（驳回原因 ×2）

## 3. 方案选型

采用 **方案 A：共享 helper + 分批替换**。

| 方案 | 说明 | 结论 |
|---|---|---|
| A 共享 helper | 统一 API，分批改调用点 | **采用** |
| B 各文件内联 | 复制粘贴 DOM，易漂移 | 否 |
| C 全局劫持 `window.*` | 异步语义不匹配，难测 | 否 |

映射策略（已确认）：

- `confirm` → `openConfirmDialog`（自定义确认框）  
- `alert` → `showAppToast`（轻量 Toast）  
- `prompt` → `openPromptDialog`（带输入框的自定义对话框）

## 4. 公共 API 设计

新建目录：`src/ui/`（与业务 `src/config/` 解耦，供 config / emenu-local / shell 共用）。

### 4.1 Toast

文件：`src/ui/app-toast.ts`

```ts
export type AppToastVariant = "info" | "success" | "error";

export function showAppToast(
  message: string,
  opts?: { variant?: AppToastVariant; durationMs?: number },
): void;
```

行为：

- 挂到 `document.body`，右下角固定，`role="status"`  
- 同屏可只保留最新一条（后写覆盖前一条，避免堆叠）  
- 默认时长约 3.5–5s，与现有 `page-save-toast.ts` 观感接近  
- `variant` 仅影响左边色条/标题色，不改成模态框  
- 既有 `showPageSaveSuccessToast` 可保留为薄封装（内部可调用 `showAppToast` 或保持独立，不强制合并）

### 4.2 确认对话框

文件：`src/ui/app-confirm-dialog.ts`

```ts
export type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel: string; // 必须写具体动作，禁止只写「确定」
  cancelLabel?: string; // 默认「取消」
  danger?: boolean;     // 删除等破坏性操作 → 危险色按钮
};

export function openConfirmDialog(opts: ConfirmDialogOptions): Promise<boolean>;
```

行为：

- 返回 `true` = 确认，`false` = 取消 / Esc / 点遮罩  
- 打开时移除同 id 旧实例；焦点移入面板（优先取消按钮）  
- Esc、点遮罩空白 = 取消；关闭后焦点归还触发元素  
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`  
- 视觉规格见第 5 节（对齐菜单下单限制）

### 4.3 输入对话框

文件：`src/ui/app-prompt-dialog.ts`

```ts
export type PromptDialogOptions = {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string; // 默认「确认」
  cancelLabel?: string;
  required?: boolean;    // 默认 true：空串不可提交
};

export function openPromptDialog(opts: PromptDialogOptions): Promise<string | null>;
```

行为：

- 确认返回修剪后的字符串；取消返回 `null`  
- 打开后聚焦输入框；Enter 提交（`required` 时为空则不关）  
- 视觉与确认框同壳，仅中间多一行输入  
- 参考既有 `foh-settings-name-dialog-ui.ts`，但不复用其渠道多选逻辑；名称对话框可逐步迁移到本 API（非本次必做）

### 4.4 原型页共享脚本

路径：`dist/Configuration center/assets/app-dialogs.js`（必要时配套极薄 CSS，或复用 `order-limit-flow.css` 中 `.olf-*` 类名）

暴露同名语义 API（可挂 `window.AppDialogs`）：

- `showToast(message, opts?)`  
- `confirm(opts) → Promise<boolean>`  
- `prompt(opts) → Promise<string|null>`  

在有存量调用的 HTML 中引入后替换。不把该脚本塞进无关页面。

## 5. 视觉与交互规格（SSOT）

对齐：

- 原型：`dist/Configuration center/assets/order-limit-flow.css` 的 `.olf-overlay` / `.olf-dialog` / `.olf-dialog-actions` / `.olf-button--primary` / `.olf-button--danger`  
- 应用侧骨架：`src/config/hub-search-leave-confirm-dialog.ts`  
- 规则：`.cursor/rules/custom-confirm-dialog.mdc`

要点：

| 项 | 规格 |
|---|---|
| 遮罩 | `fixed inset-0`，`rgba(0,0,0,0.45)`，flex 居中，padding 24px |
| 面板 | `width: min(500px, 100%)`，圆角 16px，padding 24px，卡片背景 + 大阴影 |
| 标题 | 18px / 600，与正文间距 10px |
| 正文 | 14px / 行高 22px，次要色 |
| 按钮区 | 右对齐，间距 10px，取消左、确认右 |
| 危险确认 | danger 按钮样式；文案写清动作（「确认删除」「删除并重置」等） |

Tailwind 应用侧用等价 utility（如 `bg-black/45`、`rounded-2xl`、`max-w-[500px]`），不引入第二套视觉语言。

## 6. 调用迁移约定

### 6.1 同步 → 异步

原生 `confirm`/`prompt` 是同步的。替换后：

```ts
// 前
if (!window.confirm("确定删除？")) return;
doDelete();

// 后
const ok = await openConfirmDialog({
  title: "删除？",
  message: "确定删除该项？此操作不可恢复。",
  confirmLabel: "确认删除",
  danger: true,
});
if (!ok) return;
doDelete();
```

事件处理器若不能标 `async`，使用：

```ts
void (async () => { ... })();
```

或把处理函数改为 `async` 后在绑定处 `void handler(ev)`。

### 6.2 alert → toast

```ts
// 前
window.alert("请填写名称");

// 后
showAppToast("请填写名称", { variant: "error" }); // 校验失败
showAppToast("已保存", { variant: "success" });   // 成功
showAppToast(msg, { variant: "info" });           // 一般提示
```

多行文案（如邀请邮件预览）仍用 Toast 展示纯文本；若过长可截断或仅展示摘要（实施时按场景取舍，避免再开模态）。

### 6.3 page-save-guard 特例

文件：`src/config/page-save-guard.ts`

| 路径 | 处理 |
|---|---|
| `hashchange` 未保存离开 | **改为** `await openConfirmDialog`；取消时回退 `hash`（保持现有回退逻辑）。需加「对话框打开中」锁，避免连点导航导致竞态 |
| `beforeunload` | **保持** 浏览器原生 `preventDefault` + `returnValue`，无法自定义 UI |

### 6.4 文案

- 确认按钮禁止只写「确定」；写「确认删除」「保存并返回」「放弃修改」等  
- 取消默认「取消」；菜单下单限制里个别场景用「继续编辑」，业务需要时可覆盖 `cancelLabel`

## 7. 实施批次（建议）

1. **基础设施**：新增 `src/ui/app-toast.ts` / `app-confirm-dialog.ts` / `app-prompt-dialog.ts`；更新 `.cursor/rules/custom-confirm-dialog.mdc` 指向这些 API；原型页加 `assets/app-dialogs.js`  
2. **设备管理族**（模式高度重复的 confirm + alert）  
3. **enterprise-merchant / nav-blueprint / json-menu-editor**（调用最密集）  
4. **其余 src**（team / platform-preset / seasoning / floor-plan / foh / page-save 等）  
5. **dist Configuration center**（order-limit / marketing-*）  
6. **验收**：目标路径 `rg "window\\.(alert|confirm|prompt)"` 清零（排除 `beforeunload` 注释说明与规则文档示例）

每批在 worktree 权威编辑，并按 `sync-worktree-and-dev` 同步主工作区预览路径。

## 8. 验收标准

- [ ] `src/**/*.ts` 无 `window.alert` / `window.confirm` / `window.prompt`（`beforeunload` 除外，且该处本就不调用三者）  
- [ ] `dist/Configuration center` 目标 HTML/JS 无上述调用（或仅余文档字符串）  
- [ ] 新确认框视觉与菜单下单限制确认框一致（遮罩、圆角、按钮布局）  
- [ ] Toast 不阻塞操作；确认/输入框支持 Esc、遮罩取消、焦点归还  
- [ ] 破坏性确认使用 danger 样式  
- [ ] 未引入全局劫持 `window.alert/confirm/prompt`

## 9. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 异步改造漏改导致逻辑在 await 前继续执行 | 按文件机械替换 + 抽查危险路径（删除/离开） |
| hash 离开确认竞态 | 对话框打开锁 + 取消回退 hash |
| Toast 信息过长难读 | 长文案截断；必要时后续再做「详情」弹窗（本次不做） |
| 原型页与 src 样式漂移 | 原型复用 `.olf-*`；src 严格按规格写 Tailwind |

## 10. 非目标（明确不做）

- 不重写已有复杂对话框业务逻辑  
- 不统一全站所有 Modal 的视觉（仅统一「替代原生三件套」的路径）  
- 不自动 `git commit` / `push`（需用户明确要求）
