# 原生弹窗清理 · Implementation Plan

> **For agentic workers:** 按 Task 顺序实施；每 Task 完成后勾选。权威编辑在 worktree，业务源码按 `sync-worktree-and-dev` 双写主工作区。**禁止自动 commit / push。**

**Goal:** 清零 `src/**` 与 `dist/Configuration center/**` 中的 `window.alert` / `window.confirm` / `window.prompt`；确认框与输入框用自定义对话框，提示用 Toast。

**Architecture:** 新增 `src/ui/` 三件套（toast / confirm / prompt）；原型页新增 `assets/app-dialogs.js`。调用点同步→异步改造。`beforeunload` 保持浏览器原生。

**Tech Stack:** TypeScript（Vite admin-web）、Tailwind utility、原生 DOM Promise 对话框；原型页原生 JS + `.olf-*` 样式

**Spec:** `docs/superpowers/specs/2026-08-17-native-dialog-cleanup-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-scene-combo-nav`，分支 `wt/order-limit-scene-combo-nav`  
**主工作区预览:** `F:\米聚\GitHub仓库\new-bp\admin-web`

**映射:**

| 原生 | 替换为 |
|---|---|
| `window.confirm` | `await openConfirmDialog(...)` → `boolean` |
| `window.alert` | `showAppToast(...)` |
| `window.prompt` | `await openPromptDialog(...)` → `string \| null` |

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `src/ui/app-toast.ts` | 通用 Toast |
| `src/ui/app-confirm-dialog.ts` | 二次确认 Promise 对话框 |
| `src/ui/app-prompt-dialog.ts` | 单行输入 Promise 对话框 |
| `src/ui/index.ts` | 可选 re-export |
| `dist/Configuration center/assets/app-dialogs.js` | 原型页同款 API |
| `.cursor/rules/custom-confirm-dialog.mdc` | 补充「必须用上述 API」 |
| `scripts/verify-native-dialog-cleanup.mjs` | 验收：目标路径不得再出现原生三件套 |

---

### Task 0: 验收脚本（先红后绿）

**Files:**
- Create: `admin-web/scripts/verify-native-dialog-cleanup.mjs`

- [ ] **Step 1: 写入脚本**

扫描以下路径，若匹配 `window\.(alert|confirm|prompt)\s*\(` 则失败（允许命中本脚本自身与 docs/rules 说明文字不在扫描范围）：

- `src/**/*.ts`
- `dist/Configuration center/**/*.{html,js}`（排除 `app-dialogs.js` 内若有注释示例；实现时脚本正文勿写可执行 `window.alert(`）

- [ ] **Step 2: 跑一次确认当前失败**

```bash
node scripts/verify-native-dialog-cleanup.mjs
```

Expected: 非零退出，打印命中文件列表。

- [ ] **Step 3: 双写脚本到主工作区（可选，脚本不影响 HMR）**

---

### Task 1: 基础设施（src/ui + 规则）

**Files:**
- Create: `src/ui/app-toast.ts`
- Create: `src/ui/app-confirm-dialog.ts`
- Create: `src/ui/app-prompt-dialog.ts`
- Modify: `.cursor/rules/custom-confirm-dialog.mdc`

- [ ] **Step 1: 实现 `showAppToast`**

参考 `src/config/page-save-toast.ts`：右下角、`role="status"`、后写覆盖前一条、默认 ~4s。`variant`: `info` | `success` | `error`。

- [ ] **Step 2: 实现 `openConfirmDialog`**

参考 `hub-search-leave-confirm-dialog.ts` + 规格第 5 节：遮罩 `bg-black/45`、面板 `max-w-[500px] rounded-2xl p-6`、取消左确认右、`danger` 时确认钮危险色、Esc/遮罩取消、焦点归还。

- [ ] **Step 3: 实现 `openPromptDialog`**

同确认框外壳 + 单行 input；打开聚焦 input；Enter 提交；`required` 默认 true；取消/`Esc`/遮罩 → `null`。

- [ ] **Step 4: 更新规则**

在 `custom-confirm-dialog.mdc` 增加：新代码与存量替换必须使用 `src/ui/app-*.ts`（或原型 `app-dialogs.js`），禁止再写原生三件套。

- [ ] **Step 5: 双写 `src/ui/*` 与规则到主工作区**

- [ ] **Step 6: 手动点一次（任意临时调用或临时页面）确认 Toast/确认/输入可开关** — 或等 Task 2 第一个文件一起验

---

### Task 2: 设备管理族（模式重复，适合先打样）

**Files（各含 alert 校验 + confirm 删除）:**
- `src/config/device-management-printer-hardware-ui.ts` (2)
- `src/config/device-management-payment-hardware-ui.ts` (3)
- `src/config/device-management-kiosk-hardware-ui.ts` (2)
- `src/config/device-management-fiscal-hardware-ui.ts` (2)
- `src/config/device-management-emenu-hardware-ui.ts` (2)
- `src/config/device-management-cds-hardware-ui.ts` (2)
- `src/config/device-management-cash-drawer-hardware-ui.ts` (2)
- `src/config/device-management-caller-id-hardware-ui.ts` (2)

- [ ] **Step 1: 以 printer 为模板完整替换并改 async**

- [ ] **Step 2: 复制同一模式到其余 7 个文件**

- [ ] **Step 3: 双写上述文件到主工作区**

- [ ] **Step 4: 抽查删除确认 + 校验 Toast**

---

### Task 3: 高频模块

**Files:**
- `src/config/enterprise-merchant-ui.ts` (28) — 含 2 处 `prompt`（驳回原因）
- `src/config/nav-blueprint-ui.ts` (14)
- `src/config/nav-blueprint-add-l1-dialog.ts` (6)
- `src/config/json-menu-editor-ui.ts` (9)

- [ ] **Step 1: enterprise-merchant — confirm/alert/prompt 全替换；事件回调改为 async**

- [ ] **Step 2: nav-blueprint-ui + add-l1-dialog**

- [ ] **Step 3: json-menu-editor-ui（注意 publish 流程里嵌套 confirm）**

- [ ] **Step 4: 双写 + 抽查删除集团/发布蓝图/删除菜单节点**

---

### Task 4: 其余 src

**Files:**
- `src/config/page-save-guard.ts` (1) — **仅 hashchange**；加「对话框打开中」锁；`beforeunload` 不动
- `src/config/page-save-bar-ui.ts` (1)
- `src/config/platform-preset-ui.ts` (4) — 含 1 处 prompt
- `src/config/team-training-performance-ui.ts` (2) — 含 1 处 prompt
- `src/config/team-shift-scheduling-ui.ts` (4)
- `src/config/team-clock-in-ui.ts` (1)
- `src/config/floor-plan-ui.ts` (2)
- `src/config/foh-category-settings-ui.ts` (2)
- `src/config/module-settings-dish-rules-ui.ts` (1)
- `src/config/module-settings-tableside-service-call-ui.ts` (1)
- `src/config/module-settings-store-brand-logo-ui.ts` (5)
- `src/config/module-settings-promo-lottery-animation-ui.ts` (4)
- `src/config/deployment-ui.ts` (1)
- `src/main.ts` (1)
- `src/emenu-local/seasoning/seasoning-page.ts` (2)
- `src/emenu-local/seasoning/seasoning-product-drawer-ui.ts` (2)
- `src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts` (2)
- `src/emenu-local/seasoning/seasoning-option-category-manager-ui.ts` (5) — 含多处 prompt

说明：`foh-settings-name-dialog-ui.ts` 若仅注释提及 `window.prompt`，改为中性措辞即可，勿引入原生调用。

- [ ] **Step 1: page-save-guard 异步确认 + 锁**

- [ ] **Step 2: 批量替换其余文件**

- [ ] **Step 3: 双写**

- [ ] **Step 4: `rg "window\\.(alert|confirm|prompt)" --glob "src/**/*.ts"` 期望无业务命中**

---

### Task 5: 原型页

**Files:**
- Create: `dist/Configuration center/assets/app-dialogs.js`
- Modify: `dist/Configuration center/order-limit.html` (1)
- Modify: `dist/Configuration center/marketing-ads-list.html` (6)
- Modify: `dist/Configuration center/marketing-ads-edit.html` (20)
- Modify: `dist/Configuration center/marketing-poster-pro-settings.html` (5)

- [ ] **Step 1: 实现 `app-dialogs.js`（`window.AppDialogs.showToast/confirm/prompt`），样式用 `.olf-overlay` / `.olf-dialog` 或内联等价样式**

- [ ] **Step 2: 各 HTML 引入脚本后替换调用；confirm/prompt 处改为 async**

- [ ] **Step 3: order-limit.html 删除规则那一处 `window.confirm` 改掉（列表页若尚未用 flow.js 的 openDialog）**

- [ ] **Step 4: 双写 dist 对应文件到主工作区**

---

### Task 6: 验收收尾

- [ ] **Step 1: 跑 `node scripts/verify-native-dialog-cleanup.mjs` → 通过**

- [ ] **Step 2: 人工抽查**

  - 设备删除确认（danger）  
  - 未保存离开（hash 回退）  
  - 校验失败 Toast  
  - 驳回原因 / 分类名输入框  
  - 营销广告删除确认（原型）

- [ ] **Step 3: 汇报变更文件列表与验证结果；等待用户指示是否 commit**

---

## 实施注意

1. **不要**全局赋值劫持 `window.alert/confirm/prompt`  
2. 确认按钮文案写清动作；删除类加 `danger: true`  
3. 每完成一小批就双写，便于主工作区 `npm run dev` 预览  
4. 长 `alert` 文案（如邮件预览）用 Toast 纯文本；过长可截断前 200 字 +「…」  
5. 不改 `vendor/`、`dist/emenu-new`、`dist/kpos` 等

## 完成定义

- 验收脚本通过  
- 规格第 8 节验收标准全部满足  
- 用户确认后再考虑提交
