# Kiosk 本地设置页固定中文 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 进入 Kiosk 本地配置「Kiosk 设置」时，嵌入的 kiosklite `configApp` 界面文案固定为中文。

**Architecture:** 复用 kiosklite 入口已有的 `language` URL 参数：在宿主壳层 `KIOSKLITE_SETTINGS_IFRAME_SRC` 查询串加入 `language=zh-cn`。不改 kiosklite 源码、不改预览 iframe、不改食客端默认语言配置。用仓库既有的 `scripts/verify-*.ts` + `node:assert` 做静态校验。

**Tech Stack:** TypeScript、Vite admin-web 壳层、kiosklite iframe embed、`npx tsx` 校验脚本

**Spec:** `docs/superpowers/specs/2026-08-16-kiosk-local-settings-zh-ui-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `admin-web/src/shell/kiosk-local-shell.ts` | 定义设置页 iframe `src`；唯一业务改动点 |
| `admin-web/scripts/verify-kiosk-local-settings-zh-ui.ts` | 断言设置 iframe 含 `language=zh-cn`，预览 iframe 不含 |
| 主工作区 `new-bp/admin-web/src/shell/kiosk-local-shell.ts` | 镜像同步，供 `npm run dev` HMR |

---

### Task 1: 新增失败的校验脚本

**Files:**
- Create: `admin-web/scripts/verify-kiosk-local-settings-zh-ui.ts`
- Test: same file (assert-based verify script)

- [ ] **Step 1: 写校验脚本（此时应失败）**

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shellSrc = readFileSync(join(root, "src/shell/kiosk-local-shell.ts"), "utf8");

const settingsMatch = shellSrc.match(
  /const KIOSKLITE_SETTINGS_IFRAME_SRC = `([^`]+)`/,
);
const previewMatch = shellSrc.match(/const KIOSKLITE_IFRAME_SRC = `([^`]+)`/);

assert.ok(settingsMatch, "KIOSKLITE_SETTINGS_IFRAME_SRC must exist");
assert.ok(previewMatch, "KIOSKLITE_IFRAME_SRC must exist");

const settingsSrc = settingsMatch[1];
const previewSrc = previewMatch[1];

assert.match(
  settingsSrc,
  /[?&]language=zh-cn(?:&|`|#|$)/,
  "settings iframe must pass language=zh-cn",
);
assert.doesNotMatch(
  previewSrc,
  /language=zh-cn/,
  "preview iframe must not force language=zh-cn",
);
assert.match(
  settingsSrc,
  /#\/configApp/,
  "settings iframe must still open #/configApp",
);

console.log("Kiosk local settings zh-ui verification passed.");
```

说明：正则里用 `` ` `` 只是为了在模板字面量边界终止；实际匹配的是常量字符串内容。更稳妥写法如下（推荐落地时用这一版）：

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shellSrc = readFileSync(join(root, "src/shell/kiosk-local-shell.ts"), "utf8");

const settingsMatch = shellSrc.match(
  /const KIOSKLITE_SETTINGS_IFRAME_SRC = `([^`]+)`/,
);
const previewMatch = shellSrc.match(/const KIOSKLITE_IFRAME_SRC = `([^`]+)`/);

assert.ok(settingsMatch, "KIOSKLITE_SETTINGS_IFRAME_SRC must exist");
assert.ok(previewMatch, "KIOSKLITE_IFRAME_SRC must exist");

const settingsSrc = settingsMatch![1];
const previewSrc = previewMatch![1];

assert.ok(
  settingsSrc.includes("language=zh-cn"),
  "settings iframe must pass language=zh-cn",
);
assert.ok(
  !previewSrc.includes("language=zh-cn"),
  "preview iframe must not force language=zh-cn",
);
assert.ok(
  settingsSrc.includes("#/configApp"),
  "settings iframe must still open #/configApp",
);

console.log("Kiosk local settings zh-ui verification passed.");
```

- [ ] **Step 2: 运行校验，确认失败**

Run（在 worktree 的 `admin-web/` 下）：

```bash
npx tsx scripts/verify-kiosk-local-settings-zh-ui.ts
```

Expected: FAIL，assertion 提示 settings iframe must pass `language=zh-cn`（当前常量尚无该参数）。

- [ ] **Step 3: Commit 校验脚本**

```bash
git add admin-web/scripts/verify-kiosk-local-settings-zh-ui.ts
git commit -m "test: add verify for kiosk settings zh-ui iframe lang"
```

---

### Task 2: 设置 iframe 增加 `language=zh-cn`

**Files:**
- Modify: `admin-web/src/shell/kiosk-local-shell.ts`（约第 21–24 行）
- Sync: `F:/米聚/GitHub仓库/new-bp/admin-web/src/shell/kiosk-local-shell.ts`（主工作区镜像）

- [ ] **Step 1: 改 worktree 常量**

将：

```typescript
const KIOSKLITE_SETTINGS_IFRAME_SRC = `./kpos/kiosklite/index.html?embedded=1&v=${BUILD_STAMP}#/configApp`;
```

改为：

```typescript
const KIOSKLITE_SETTINGS_IFRAME_SRC = `./kpos/kiosklite/index.html?embedded=1&language=zh-cn&v=${BUILD_STAMP}#/configApp`;
```

`KIOSKLITE_IFRAME_SRC` 保持不变。

依赖说明：kiosklite `dist/kiosklite/src/index.js` 已有：

```javascript
if (urlMap?.hasOwnProperty('language')) {
  let lang = 'en';
  if (urlMap.language === 'zh-cn') {
    lang = 'zh_cn';
  }
  i18n.changeLanguage(lang);
}
```

`getUrlParams` 从 `?` 后解析；`language=zh-cn` 位于 hash 之前，可正确解析。无需改 kiosklite。

- [ ] **Step 2: 运行校验，确认通过**

```bash
npx tsx scripts/verify-kiosk-local-settings-zh-ui.ts
```

Expected: 打印 `Kiosk local settings zh-ui verification passed.`，exit code 0。

- [ ] **Step 3: 同步主工作区（HMR）**

对主工作区同一相对路径应用相同一行改动：

`F:/米聚/GitHub仓库/new-bp/admin-web/src/shell/kiosk-local-shell.ts`

确认主工作区 `npm run dev` 已跑时会 reload；若未跑，在回复中提示在主工作区启动。

- [ ] **Step 4: Commit 实现**

```bash
git add admin-web/src/shell/kiosk-local-shell.ts
git commit -m "fix: default Kiosk local settings embed UI to Chinese"
```

---

### Task 3: 手动验收

**Files:** 无代码改动

- [ ] **Step 1: 浏览器检查**

1. 打开管理后台，进入 Kiosk 本地配置 →「Kiosk 设置」。
2. 确认嵌入 `configApp` 的开关/选项等 **i18n UI 文案**为中文（不以 POS 下发的菜品名/业务数据是否中文为判据）。
3. 将管理后台切到英文，再次进入「Kiosk 设置」，嵌入页仍为中文。
4. 打开「Kiosk」预览，语言行为与改前一致（未强制 `language=zh-cn`）。

- [ ] **Step 2:（可选）把 verify 脚本登记进 package.json**

若希望与其他 verify 一致，可增加：

```json
"verify:kiosk-local-settings-zh-ui": "npx tsx scripts/verify-kiosk-local-settings-zh-ui.ts"
```

非规格强制项；不做也可，以 `npx tsx` 直接运行为准。若改了 `package.json`，单独 commit：

```bash
git add admin-web/package.json
git commit -m "chore: add verify:kiosk-local-settings-zh-ui script"
```

---

## Self-review vs spec

| Spec 要求 | Plan 覆盖 |
|-----------|-----------|
| 设置 iframe 加 `language=zh-cn` | Task 2 |
| 不改预览 iframe | Task 1 assert + Task 2 保持 `KIOSKLITE_IFRAME_SRC` |
| 不改食客端默认语言 / 不跟随后台语言 | 无相关任务（YAGNI） |
| 验收：设置页中文、后台切英仍中文、预览不变 | Task 3 |
| worktree + 主工作区双写 | Task 2 Step 3 |

Placeholder scan: 无 TBD/TODO。类型与常量名与现有 `kiosk-local-shell.ts` 一致。
