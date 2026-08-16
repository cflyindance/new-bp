# eMenu 调味 Detail 共用 DishDialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 有可展示调味候选项的菜在菜单显示 Detail；点 Detail 打开共用 DishDialog 并在 Option 下方选调味后加购；从加号进入的详情不展示调味。

**Architecture:** 领域规则仍以 `seasoning-terminal-rules.ts` 为 SSOT；eMenu（`vendor/emenu-new`）通过 `GET /api/v1/emenu-local/seasoning/snapshot` 拉门店快照，用本地 JS guest 工具（与 TS 规则对齐）判断 Detail 显隐与互斥选择；`DishDialog` 增加 `entrySource`，仅 `detail` 渲染 `SeasoningBlock`，加购写入 `seasoningSnapshots`。

**Tech Stack:** TypeScript（admin-web 调味领域）、React + MUI（vendor/emenu-new）、Vite 嵌入构建、`npx tsx` / node assert 校验脚本。

**Spec:** `admin-web/docs/superpowers/specs/2026-08-16-emenu-seasoning-detail-shared-dishdialog-design.md`

**Prerequisite:** 实现分支须已包含 `admin-web/src/emenu-local/seasoning/`（本地 `main` 上至少含 `feat: add eMenu local seasoning settings`）。若 worktree 基于落后的 `origin/main`，先 rebase/merge 到含调味模块的提交再开工。改动须 **worktree + 主工作区双写**（`sync-worktree-and-dev`），eMenu 改完后执行 `npm run build:emenu-new-embed` 才能在主仓 `npm run dev` 看到嵌入页效果。

---

## File map

| File | Responsibility |
| --- | --- |
| `admin-web/src/emenu-local/seasoning/seasoning-terminal-rules.ts` | 新增 `productHasGuestSeasoningDetail`、`buildOrderSeasoningSnapshots` |
| `admin-web/scripts/verify-emenu-local-seasoning-domain.ts` | 覆盖上述 helper 的断言 |
| `admin-web/vendor/emenu-new/src/utils/seasoningGuest.js` | 终端侧纯函数（与 TS 规则对齐的 JS 版） |
| `admin-web/vendor/emenu-new/src/services/seasoningSnapshot.js` | 拉取/缓存 `/snapshot`，按 productId 查 groups |
| `admin-web/vendor/emenu-new/src/components/DishDialog/SeasoningBlock.jsx` | 调味选择 UI |
| `admin-web/vendor/emenu-new/src/components/DishDialog/RightPanel.jsx` | OptionList 下方条件挂载 SeasoningBlock |
| `admin-web/vendor/emenu-new/src/components/DishDialog/index.jsx` | `entrySource`、调味 state、submit 写入 snapshots |
| `admin-web/vendor/emenu-new/src/components/DishItemCard/NormalItemContent.jsx` | Detail 按钮 + 双入口打开详情 |
| `admin-web/vendor/emenu-new/src/components/DishItemCard/SmallContent.jsx` / `LargeContent.jsx` | Detail 按钮布局 |
| `admin-web/vendor/emenu-new/src/pages/Order/.../AddToCartButton.jsx` | 若独立挂 DishDialog：加号路径 `entrySource='add'`；有候选项时补 Detail |
| `admin-web/scripts/verify-emenu-seasoning-guest-parity.mjs` | TS/JS guest 规则同夹具对齐 |
| `admin-web/package.json` | `verify:emenu-local-seasoning` 链入 parity 脚本 |

---

### Task 0: 对齐含调味模块的基线

**Files:**
- Worktree branch `wt/emenu-seasoning-detail`

- [ ] **Step 1: 确认 seasoning 目录存在**

Run:

```bash
Test-Path "admin-web/src/emenu-local/seasoning/seasoning-terminal-rules.ts"
```

Expected: `True`。若为 `False`，在 worktree 内：

```bash
git fetch origin
git merge main
# 或以本地已含 seasoning 的 tip 为准：git merge <commit-with-seasoning>
```

- [ ] **Step 2: 确认 snapshot API 仍可用**

Run:

```bash
rg "sub === \"/snapshot\"" admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs
```

Expected: 有匹配（`GET /api/v1/emenu-local/seasoning/snapshot`）。

- [ ] **Step 3: Commit（仅当 Step 1 产生 merge commit 时）**

```bash
git status
# 若有 merge，保留默认 merge message 即可
```

---

### Task 1: 领域 helper — 显隐与购物车 snapshot 映射

**Files:**
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-terminal-rules.ts`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-domain.ts`

- [ ] **Step 1: 先写失败断言（在 domain verify 末尾追加）**

在 `verify-emenu-local-seasoning-domain.ts` 现有 terminal 断言之后追加：

```typescript
import {
  buildTerminalSeasoningGroups,
  createOrderSeasoningSnapshot,
  productHasGuestSeasoningDetail,
  buildOrderSeasoningSnapshots,
  selectTerminalSeasoning,
} from "../src/emenu-local/seasoning/seasoning-terminal-rules";

const guestProduct = {
  id: "p1",
  code: "D1",
  name: "Dish",
  categoryId: "c1",
  categoryName: "Category",
  status: "active" as const,
  emenuSellable: true,
  sortOrder: 10,
};
const guestOptions = [
  { id: "o1", code: "CHILI", name: "辣椒", status: "active" as const, sortOrder: 10, createdAt: "", updatedAt: "" },
  { id: "o2", code: "SALT", name: "盐", status: "active" as const, sortOrder: 20, createdAt: "", updatedAt: "" },
];
const guestRelations = [
  { id: "r1", productId: "p1", action: "ADD" as const, optionId: "o1", priceDelta: 1, sortOrder: 10, status: "active" as const, createdAt: "", updatedAt: "" },
  { id: "r2", productId: "p1", action: "LESS" as const, optionId: "o1", priceDelta: 0, sortOrder: 10, status: "active" as const, createdAt: "", updatedAt: "" },
];

assert(
  productHasGuestSeasoningDetail({
    product: guestProduct,
    options: guestOptions,
    relations: guestRelations,
  }) === true,
  "Detail must show when at least one guest choice exists",
);
assert(
  productHasGuestSeasoningDetail({
    product: { ...guestProduct, status: "inactive" },
    options: guestOptions,
    relations: guestRelations,
  }) === false,
  "Detail must hide when product is inactive",
);

const groups = buildTerminalSeasoningGroups({
  product: guestProduct,
  options: guestOptions,
  relations: guestRelations,
});
let selections = selectTerminalSeasoning([], groups[0].choices[0]);
selections = selectTerminalSeasoning(selections, groups.find((g) => g.action === "LESS")!.choices[0]);
assert(selections.length === 1 && selections[0].action === "LESS", "Guest mutex must keep one action per option");

const snapshots = buildOrderSeasoningSnapshots(selections, groups);
assert(snapshots.length === 1, "Snapshots must map from current selections via TerminalSeasoningChoice");
assert(snapshots[0].optionCode === "CHILI" && snapshots[0].action === "LESS", "Snapshot must use choice fields, not slim selection alone");
assert(JSON.stringify(buildOrderSeasoningSnapshots([], groups)) === "[]", "Empty selection must yield empty snapshots array");
```

- [ ] **Step 2: 运行确认失败**

Run:

```bash
cd admin-web
npx tsx scripts/verify-emenu-local-seasoning-domain.ts
```

Expected: FAIL（`productHasGuestSeasoningDetail` / `buildOrderSeasoningSnapshots` 未导出）。

- [ ] **Step 3: 实现 helper**

在 `seasoning-terminal-rules.ts` 追加：

```typescript
export function productHasGuestSeasoningDetail(input: {
  product: SeasoningProduct;
  options: SeasoningOption[];
  relations: ProductSeasoningRelation[];
}): boolean {
  return buildTerminalSeasoningGroups(input).some((group) => group.choices.length > 0);
}

export function buildOrderSeasoningSnapshots(
  selections: OrderSeasoningSelection[],
  groups: { action: SeasoningActionCode; choices: TerminalSeasoningChoice[] }[],
): ReturnType<typeof createOrderSeasoningSnapshot>[] {
  const choiceByKey = new Map<string, TerminalSeasoningChoice>();
  for (const group of groups) {
    for (const choice of group.choices) {
      choiceByKey.set(`${choice.action}::${choice.optionId}`, choice);
    }
  }
  const snapshots: ReturnType<typeof createOrderSeasoningSnapshot>[] = [];
  for (const selection of selections) {
    const choice = choiceByKey.get(`${selection.action}::${selection.optionId}`);
    if (choice) snapshots.push(createOrderSeasoningSnapshot(choice));
  }
  return snapshots;
}
```

- [ ] **Step 4: 再跑 verify**

Run:

```bash
npx tsx scripts/verify-emenu-local-seasoning-domain.ts
```

Expected: `eMenu local seasoning domain verification passed`

- [ ] **Step 5: Commit**

```bash
git add admin-web/src/emenu-local/seasoning/seasoning-terminal-rules.ts admin-web/scripts/verify-emenu-local-seasoning-domain.ts
git commit -m "$(cat <<'EOF'
feat: add guest seasoning detail visibility and cart snapshot helpers

EOF
)"
```

（Windows PowerShell 可用：`git commit -m "feat: add guest seasoning detail visibility and cart snapshot helpers"`）

---

### Task 2: eMenu guest 纯函数 + 与 TS 对齐校验

**Files:**
- Create: `admin-web/vendor/emenu-new/src/utils/seasoningGuest.js`
- Create: `admin-web/scripts/verify-emenu-seasoning-guest-parity.mjs`
- Modify: `admin-web/package.json`（`verify:emenu-local-seasoning` 脚本追加 parity）

- [ ] **Step 1: 写 parity 脚本（先引用将创建的 JS API）**

`verify-emenu-seasoning-guest-parity.mjs`：

```javascript
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildTerminalSeasoningGroups as jsGroups, selectTerminalSeasoning as jsSelect, buildOrderSeasoningSnapshots as jsSnapshots, productHasGuestSeasoningDetail as jsHas } from "../vendor/emenu-new/src/utils/seasoningGuest.js";

// TS 侧通过 tsx 动态加载不方便时：对本夹具只断言 JS 行为，并与已知期望对齐（与 Task 1 夹具一致）
const product = { id: "p1", status: "active", emenuSellable: true };
const options = [
  { id: "o1", code: "CHILI", name: "辣椒", status: "active", sortOrder: 10 },
  { id: "o2", code: "SALT", name: "盐", status: "active", sortOrder: 20 },
];
const relations = [
  { productId: "p1", action: "ADD", optionId: "o1", priceDelta: 1, sortOrder: 10, status: "active" },
  { productId: "p1", action: "LESS", optionId: "o1", priceDelta: 0, sortOrder: 10, status: "active" },
];

assert.equal(jsHas({ product, options, relations }), true);
assert.equal(jsHas({ product: { ...product, status: "inactive" }, options, relations }), false);

const groups = jsGroups({ product, options, relations });
assert.equal(groups.some((g) => g.action === "ADD"), true);
let selections = jsSelect([], groups.find((g) => g.action === "ADD").choices[0]);
selections = jsSelect(selections, groups.find((g) => g.action === "LESS").choices[0]);
assert.equal(selections.length, 1);
assert.equal(selections[0].action, "LESS");
const snaps = jsSnapshots(selections, groups);
assert.equal(snaps[0].optionCode, "CHILI");
assert.equal(snaps[0].transactionPrice, 0);
assert.deepEqual(jsSnapshots([], groups), []);
console.log("eMenu seasoning guest parity verification passed");
```

- [ ] **Step 2: 运行确认失败**

Run:

```bash
node admin-web/scripts/verify-emenu-seasoning-guest-parity.mjs
```

Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 `seasoningGuest.js`**

行为必须与 `seasoning-terminal-rules.ts` 一致（动作顺序 ADD→LESS→MORE→NONE；过滤 inactive；同 Option 互斥；snapshot 字段：`action, optionId, optionCode, optionName, transactionPrice, sortOrder`）。

```javascript
export const SEASONING_ACTION_CODES = ["ADD", "LESS", "MORE", "NONE"];

export const SEASONING_ACTION_LABELS = {
  ADD: "Add",
  LESS: "Less",
  MORE: "More",
  NONE: "None",
};

export function buildTerminalSeasoningGroups({ product, options, relations }) {
  if (!product || product.status !== "active" || !product.emenuSellable) return [];
  const optionMap = new Map(options.filter((o) => o.status === "active").map((o) => [o.id, o]));
  return SEASONING_ACTION_CODES.map((action) => ({
    action,
    choices: relations
      .filter((r) => r.action === action && r.status === "active" && optionMap.has(r.optionId))
      .map((r) => {
        const option = optionMap.get(r.optionId);
        return {
          action,
          optionId: option.id,
          optionCode: option.code,
          optionName: option.name,
          priceDelta: r.priceDelta,
          sortOrder: r.sortOrder,
        };
      })
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          (optionMap.get(a.optionId)?.sortOrder ?? 0) - (optionMap.get(b.optionId)?.sortOrder ?? 0) ||
          a.optionName.localeCompare(b.optionName),
      ),
  })).filter((g) => g.choices.length > 0);
}

export function productHasGuestSeasoningDetail(input) {
  return buildTerminalSeasoningGroups(input).some((g) => g.choices.length > 0);
}

export function selectTerminalSeasoning(current, choice) {
  const next = (current || []).filter((s) => s.optionId !== choice.optionId);
  next.push({ action: choice.action, optionId: choice.optionId, priceDelta: choice.priceDelta });
  return next;
}

export function createOrderSeasoningSnapshot(choice) {
  return {
    action: choice.action,
    optionId: choice.optionId,
    optionCode: choice.optionCode,
    optionName: choice.optionName,
    transactionPrice: choice.priceDelta,
    sortOrder: choice.sortOrder,
  };
}

export function buildOrderSeasoningSnapshots(selections, groups) {
  const map = new Map();
  for (const g of groups) for (const c of g.choices) map.set(`${c.action}::${c.optionId}`, c);
  return (selections || [])
    .map((s) => map.get(`${s.action}::${s.optionId}`))
    .filter(Boolean)
    .map(createOrderSeasoningSnapshot);
}
```

- [ ] **Step 4: 挂到 package.json 并跑通**

在 `verify:emenu-local-seasoning` 字符串末尾追加：

`&& node scripts/verify-emenu-seasoning-guest-parity.mjs`

Run:

```bash
node admin-web/scripts/verify-emenu-seasoning-guest-parity.mjs
```

Expected: `eMenu seasoning guest parity verification passed`

- [ ] **Step 5: Commit**

```bash
git add admin-web/vendor/emenu-new/src/utils/seasoningGuest.js admin-web/scripts/verify-emenu-seasoning-guest-parity.mjs admin-web/package.json
git commit -m "feat: add eMenu seasoning guest utils with parity verify"
```

---

### Task 3: 终端 snapshot 服务（拉取 + 按菜查询）

**Files:**
- Create: `admin-web/vendor/emenu-new/src/services/seasoningSnapshot.js`

- [ ] **Step 1: 实现缓存客户端**

```javascript
import {
  buildTerminalSeasoningGroups,
  productHasGuestSeasoningDetail,
} from '@/utils/seasoningGuest'

const SNAPSHOT_URL = '/api/v1/emenu-local/seasoning/snapshot'
const STORAGE_KEY = 'emenu-local-seasoning-snapshot-v1'

let memoryCache = null
let inflight = null

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore quota */
  }
}

export async function ensureSeasoningSnapshot() {
  if (memoryCache) return memoryCache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await fetch(SNAPSHOT_URL, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(`snapshot_http_${res.status}`)
      const data = await res.json()
      if (!data || !Array.isArray(data.relations)) throw new Error('snapshot_invalid')
      memoryCache = data
      writeLocal(data)
      return data
    } catch (err) {
      const cached = readLocal()
      if (cached) {
        memoryCache = cached
        return cached
      }
      memoryCache = null
      throw err
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function getSeasoningGroupsForProduct(snapshot, productId) {
  if (!snapshot) return []
  const product = (snapshot.products || []).find((p) => String(p.id) === String(productId))
  if (!product) return []
  const relations = (snapshot.relations || []).filter((r) => String(r.productId) === String(productId))
  return buildTerminalSeasoningGroups({
    product,
    options: snapshot.options || [],
    relations,
  })
}

export function productShowsSeasoningDetail(snapshot, productId) {
  if (!snapshot) return false
  const product = (snapshot.products || []).find((p) => String(p.id) === String(productId))
  if (!product) return false
  const relations = (snapshot.relations || []).filter((r) => String(r.productId) === String(productId))
  return productHasGuestSeasoningDetail({
    product,
    options: snapshot.options || [],
    relations,
  })
}
```

- [ ] **Step 2: 手工冒烟（可选，需本地 seasoning API）**

```bash
# 另开终端：npm run dev:emenu-local 或已有 Vite 挂载 seasoning API
curl -s http://localhost:<admin-vite-port>/api/v1/emenu-local/seasoning/snapshot | head
```

Expected: JSON 含 `version` / `options` / `products` / `relations`。

- [ ] **Step 3: Commit**

```bash
git add admin-web/vendor/emenu-new/src/services/seasoningSnapshot.js
git commit -m "feat: add eMenu seasoning snapshot fetch and product lookup"
```

---

### Task 4: SeasoningBlock UI

**Files:**
- Create: `admin-web/vendor/emenu-new/src/components/DishDialog/SeasoningBlock.jsx`

- [ ] **Step 1: 实现组件**

样式对齐 RightPanel 的 option 区块（labelDot、optionButton、active）。`priceDelta > 0` 时显示加价，否则不显示金额。

```jsx
import React from 'react'
import { Box, Typography, Button } from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { SEASONING_ACTION_LABELS } from '@/utils/seasoningGuest'

const useStyles = makeStyles((theme) => ({
  optionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    lineHeight: 1.2,
    fontWeight: 700,
    marginBottom: 4,
  },
  labelDot: {
    display: 'inline-block',
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
  },
  optionButton: {
    minWidth: '100%',
    width: '100%',
    height: 50,
    fontSize: 16,
    color: '#4F4F4F',
    borderRadius: 15,
    boxShadow: 'none',
    backgroundColor: alpha(theme.palette.common.white, 0.5),
    '&:not(:last-child)': { marginBottom: theme.spacing(1) },
    '&.active': {
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
      backgroundColor: theme.palette.common.white,
    },
  },
}))

export default function SeasoningBlock({ groups, selections, onToggleChoice }) {
  const classes = useStyles()
  if (!groups?.length) return null

  const selectedKey = new Set((selections || []).map((s) => `${s.action}::${s.optionId}`))

  return (
    <Box marginBottom={4}>
      {groups.map((group) => (
        <Box key={group.action} marginBottom={3}>
          <Typography variant="h6" component="h6" className={classes.optionLabel}>
            <Box component="strong" display="flex" alignItems="center">
              <i className={classes.labelDot} />
              <Box component="span" marginLeft={-1}>
                {SEASONING_ACTION_LABELS[group.action] || group.action}
              </Box>
            </Box>
          </Typography>
          {group.choices.map((choice) => {
            const key = `${choice.action}::${choice.optionId}`
            const active = selectedKey.has(key)
            return (
              <Button
                key={key}
                className={`${classes.optionButton}${active ? ' active' : ''}`}
                onClick={() => onToggleChoice(choice)}
              >
                <Box width="100%" display="flex" justifyContent="space-between">
                  <span>{choice.optionName}</span>
                  {choice.priceDelta > 0 ? <span>+${Number(choice.priceDelta).toFixed(2)}</span> : null}
                </Box>
              </Button>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
```

（若产品文案要中文，可将 `SEASONING_ACTION_LABELS` 改为 Add→添加、Less→少放、More→多放、None→不要，或后续接 i18n。）

- [ ] **Step 2: Commit**

```bash
git add admin-web/vendor/emenu-new/src/components/DishDialog/SeasoningBlock.jsx
git commit -m "feat: add DishDialog SeasoningBlock UI"
```

---

### Task 5: DishDialog / RightPanel 接入 entrySource

**Files:**
- Modify: `admin-web/vendor/emenu-new/src/components/DishDialog/index.jsx`
- Modify: `admin-web/vendor/emenu-new/src/components/DishDialog/RightPanel.jsx`

- [ ] **Step 1: RightPanel 在 OptionList 循环之后、备注之前插入**

Props 增加：`showSeasoning`, `seasoningGroups`, `seasoningSelections`, `onToggleSeasoning`。

在 `optionsList.map(...)` 之后、`<Box hidden={!isShowDisplayNote}>` 之前：

```jsx
{showSeasoning ? (
  <SeasoningBlock
    groups={seasoningGroups}
    selections={seasoningSelections}
    onToggleChoice={onToggleSeasoning}
  />
) : null}
```

并 `import SeasoningBlock from './SeasoningBlock'`。

- [ ] **Step 2: DishDialog 增加 props 与状态**

```jsx
import { selectTerminalSeasoning, buildOrderSeasoningSnapshots } from '@/utils/seasoningGuest'

// props:
entrySource = 'add', // 'detail' | 'add'
seasoningGroups = [],

// state:
const [seasoningSelections, setSeasoningSelections] = useState([])

const showSeasoning = entrySource === 'detail' && seasoningGroups?.length > 0

const onToggleSeasoning = (choice) => {
  setSeasoningSelections((prev) => selectTerminalSeasoning(prev, choice))
}

// initData 内：setSeasoningSelections([])

// handleSubmit paramsItem：
if (entrySource === 'detail') {
  paramsItem.seasoningSnapshots = buildOrderSeasoningSnapshots(
    seasoningSelections,
    seasoningGroups,
  )
}
// entrySource === 'add' 时不要设置 seasoningSnapshots 字段
```

把 `showSeasoning`、`seasoningGroups`、`seasoningSelections`、`onToggleSeasoning` 传给 RightPanel。

`hasOption` 用于弹窗宽度：当 `showSeasoning` 时也应视为需要宽弹窗（`hasOption || showSeasoning`）。

- [ ] **Step 3: Commit**

```bash
git add admin-web/vendor/emenu-new/src/components/DishDialog/index.jsx admin-web/vendor/emenu-new/src/components/DishDialog/RightPanel.jsx
git commit -m "feat: wire seasoning block into DishDialog by entrySource"
```

---

### Task 6: 菜单卡片 Detail 按钮与双入口

**Files:**
- Modify: `admin-web/vendor/emenu-new/src/components/DishItemCard/NormalItemContent.jsx`
- Modify: `admin-web/vendor/emenu-new/src/components/DishItemCard/SmallContent.jsx`
- Modify: `admin-web/vendor/emenu-new/src/components/DishItemCard/LargeContent.jsx`
- Modify（如独立路径）: `admin-web/vendor/emenu-new/src/pages/Order/components/emenuProOrder/dynamicComponents/AddToCartButton.jsx`

- [ ] **Step 1: NormalItemContent 加载 snapshot 并分支打开**

```jsx
import { useEffect, useState } from 'react'
import {
  ensureSeasoningSnapshot,
  productShowsSeasoningDetail,
  getSeasoningGroupsForProduct,
} from '@/services/seasoningSnapshot'

// state
const [seasoningSnapshot, setSeasoningSnapshot] = useState(null)
const [entrySource, setEntrySource] = useState('add')

useEffect(() => {
  let cancelled = false
  ensureSeasoningSnapshot()
    .then((snap) => {
      if (!cancelled) setSeasoningSnapshot(snap)
    })
    .catch(() => {
      if (!cancelled) setSeasoningSnapshot(null)
    })
  return () => {
    cancelled = true
  }
}, [])

const showSeasoningDetailBtn = productShowsSeasoningDetail(seasoningSnapshot, id)
const seasoningGroups = getSeasoningGroupsForProduct(seasoningSnapshot, id)

const openAsDetail = () => {
  setEntrySource('detail')
  setTrue()
}
const openAsAdd = () => {
  setEntrySource('add')
  setTrue()
}
```

把原 `setTrue` 传给 Large/Small 的加号路径改为：需要弹窗时调用 `openAsAdd`；新增 `openAsDetail` / `showSeasoningDetailBtn` props。

`DishDialog`：

```jsx
<DishDialog
  ...
  entrySource={entrySource}
  seasoningGroups={entrySource === 'detail' ? seasoningGroups : []}
  open={openDishDialog}
  onClose={() => {
    setFalse()
    setEntrySource('add')
  }}
/>
```

- [ ] **Step 2: SmallContent / LargeContent 增加 Detail 按钮**

在加号旁（或价格行右侧）增加：

```jsx
{showSeasoningDetailBtn ? (
  <Button size="small" onClick={(e) => { e.stopPropagation(); openAsDetail() }}>
    Detail
  </Button>
) : null}
```

加号原逻辑保持：有规格/Option / isDisplayDishDetails 等仍 `openAsAdd`（或原 `setTrue`）；**不要**在加号路径设 `entrySource='detail'`。

- [ ] **Step 3: AddToCartButton 对齐**

若该组件也直接渲染 `DishDialog`：加号打开时 `entrySource='add'`；若卡片层已覆盖 Detail，可只保证 add 路径不传调味。若菜单主路径只走 DishItemCard，可跳过 UI，但仍检查不要默认 detail。

- [ ] **Step 4: 构建嵌入包**

```bash
cd admin-web
npm run build:emenu-new-embed
```

Expected: 成功产出 `dist/emenu-new`。

- [ ] **Step 5: Commit**

```bash
git add admin-web/vendor/emenu-new/src/components/DishItemCard admin-web/vendor/emenu-new/src/pages/Order/components/emenuProOrder/dynamicComponents/AddToCartButton.jsx admin-web/dist/emenu-new
git commit -m "feat: show Detail button and dual-entry DishDialog for seasoning"
```

（若仓库不提交 `dist/emenu-new`，则只 commit vendor 源码，并在 PR 说明需跑 embed build。）

---

### Task 7: 价格累加与购物车行验收

**Files:**
- Modify: `admin-web/vendor/emenu-new/src/components/DishDialog/index.jsx`（若 `realPrice` 计算处需加 seasoning）
- 视现有 `changeCart` 是否已透传未知字段；一般直接挂在 submit params 即可

- [ ] **Step 1: 在提交前累加调味价**

在 `handleSubmit` 组装 `paramsItem` 后：

```javascript
if (entrySource === 'detail') {
  const seasoningSnapshots = buildOrderSeasoningSnapshots(seasoningSelections, seasoningGroups)
  paramsItem.seasoningSnapshots = seasoningSnapshots
  const seasoningExtra = seasoningSnapshots.reduce((sum, s) => sum + (s.transactionPrice || 0), 0)
  paramsItem.realPrice = roundToPrecision((paramsItem.realPrice || 0) + seasoningExtra)
  // benefitPrice 路径若业务要求同步加价，按现有会员价规则同样累加；无要求则只加 realPrice
}
```

- [ ] **Step 2: 手工验收清单**

1. 调味设置给某菜建启用关联 → 菜单出现 Detail。  
2. Detail → 见调味在 Option 下 → 可不选直接加购 → 行上 `seasoningSnapshots: []`。  
3. Detail 选调味加购 → 行上有 snapshot，价含 delta。  
4. 加号进详情 → 无调味区；行上无 `seasoningSnapshots`。  
5. 同 Option 点另一动作 → 只保留最后动作。  

- [ ] **Step 3: Commit**

```bash
git add admin-web/vendor/emenu-new/src/components/DishDialog/index.jsx
git commit -m "feat: apply seasoning snapshot price on detail add-to-cart"
```

---

### Task 8: 回归脚本与双写

**Files:**
- 主工作区镜像：与 worktree 相同相对路径文件

- [ ] **Step 1: 跑调味 verify 链**

```bash
cd admin-web
npm run verify:emenu-local-seasoning
```

Expected: 全部子脚本通过（含 guest parity）。

- [ ] **Step 2: 同步主工作区**

将本计划改动的每个文件 copy/patch 到 `F:/米聚/GitHub仓库/new-bp/admin-web/...` 对应路径，保证主仓 `npm run dev` HMR/嵌入预览一致。

- [ ] **Step 3: 最终 commit（若双写仅在主仓、无 git 跟踪则跳过）**

Worktree 保持干净：`git status` → clean。

---

## Self-review (spec coverage)

| Spec 要求 | Task |
| --- | --- |
| Detail 显隐 = `buildTerminalSeasoningGroups` 非空 | Task 1 + 2 + 6 |
| 共用 DishDialog + `entrySource` | Task 5–6 |
| 调味在 Option 下方 | Task 4–5 |
| add 入口无调味 / 无 `seasoningSnapshots` 字段 | Task 5–6 |
| detail 空选 `[]`；有选走 choice→snapshot | Task 1 + 5 + 7 |
| 互斥 | Task 1–2 + SeasoningBlock toggle |
| 无规格可 Detail 加购 | Task 5（showSeasoning 仍开弹窗）+ 6 |
| 不改后台模型 / 不绑 27·608 | 无对应改动任务 |
| 快照 API / 缓存回退 | Task 3 |

无 TBD/占位步骤；类型名 `seasoningSnapshots` / `entrySource` / `TerminalSeasoningChoice` 前后一致。
