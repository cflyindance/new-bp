/**
 * 生成 docs/项目文档/后厨管理中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-kitchen-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { getSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "后厨管理中心-设置二级导航重设计方案.md");

const titles = {
  "send-routing": "送厨触发与路由",
  "ticket-grouping": "厨房单·分组与拆单",
  "line-merge-rules": "行级合并规则",
  "ticket-fields": "厨房单·票面信息",
  "ticket-format": "厨房单·版式格式",
  "packing-slip": "打包单",
};

const reasons = {
  "send-routing":
    "何时送厨、订单类型/未付规则、跨打印机路由，及价格为 0 的菜品是否单独出一张厨房小票（分票）、首次送厨是否打整单；对标 Toast 推单与打印触发（不含票面字段展示）。",
  "ticket-grouping":
    "单张厨房单内按座位/菜序分区、多语言分行、子菜/调味拆分与 KDS 多行展示（行级合并见「行级合并规则」矩阵）；对标 Toast 按顾客与备餐站分解。",
  "line-merge-rules":
    "合并相同主菜/子菜行是否在三类票据上生效：厨房单、打包单、食客收据（seq 52/53/301/302/288/287）；后厨为配置 SSOT 展示入口。",
  "ticket-fields":
    "厨房单上是否打印业务字段（送厨次数、价格、数量、顾客姓名/电话/地址、订单时间与合计等）；对标 Toast「票据信息」字段开关（不含样式强调）。",
  "ticket-format":
    "边距、备注/价格强调样式、菜品间分割线、数量格式、切纸分段序号等版式与呈现参数；与「印什么字段」「行级分组」分离便于查找。",
  "packing-slip":
    "打包单（非厨房单）的触发类型、重打/拆分规则及票面字段（如 298 是否显示 0 元调味）；与厨房单 seq 36 的订单类型规则对称、独立配置。",
};

/** 设计文档场景摘要覆盖（不改终版原文） */
const SCENE_SUMMARY_OVERRIDE_BY_SEQ = new Map([
  [
    39,
    "控制哪些订单类型的订单需要打印打包单（与「不需要厨房单的单类」seq 36 独立，仅作用于打包条）",
  ],
]);

/** seq → groupKey（后厨设置 catalog，含 hub 覆盖挂载的打印中心项） */
const assignMap = {
  "send-routing": [36, 37, 62, 32, 304],
  "ticket-grouping": [40, 47, 54, 51, 61],
  "line-merge-rules": [52, 53, 287, 288, 301, 302],
  "ticket-fields": [35, 42, 45, 46, 48, 49, 50, 55, 56, 57, 58, 271],
  "ticket-format": [43, 44, 38, 41, 33, 59, 60, 258],
  "packing-slip": [39, 298, 299, 300],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferTerminal(nav, mod) {
  if (mod.includes("打包")) return "打包单";
  if (nav.includes("厨房") || mod.includes("厨房")) return "厨房单/打印机";
  if (mod.includes("上菜")) return "送厨流程";
  return "后厨";
}

function sceneSummary(scene, seq) {
  const override = SCENE_SUMMARY_OVERRIDE_BY_SEQ.get(seq);
  const s = override ?? (scene && scene !== "（未填写）" ? scene : "—");
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => getSettingsHub(r) === "后厨管理中心");
const order = [
  "send-routing",
  "ticket-grouping",
  "line-merge-rules",
  "ticket-fields",
  "ticket-format",
  "packing-slip",
];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq（非后厨）: ${extra.join(", ")}`);
const mappedCount = [...assign.keys()].filter((s) => rows.some((r) => r.seq === s)).length;
if (mappedCount !== rows.length) throw new Error(`映射条数 ${mappedCount} ≠ 后厨 ${rows.length} 条`);

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  by.get(key).push({ ...r, terminal: inferTerminal(r.nav, r.moduleName) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 后厨管理中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.5（方案 A：258/271 自打印中心迁入）  ",
  "> 数据范围：后厨设置 catalog（终版本 hub + hub 覆盖 **40** 条）  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 现状问题",
  "",
  "| 指标 | 现状 | 问题 |",
  "|------|------|------|",
  "| 二级分组数 | **5 组** / 34 条 | 组数不多，但 **「厨房单排版」单组 22 条** |",
  "| 命名来源 | 旧系统「功能模块」 | 「打印设置」「厨房单排版」偏技术，非经营场景 |",
  "| 票据类型混杂 | 厨房单 + 打包单在同一组排版下 | 商户难区分「炒单」与「打包条」 |",
  "| 触发 vs 版式 | 送厨规则与边距、字段打印混在一起 | 改「是否送厨」要在 22 条里翻找 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **6 个** 餐饮后厨场景组（含跨票种「行级合并规则」矩阵）",
  "- 按 **先「何时送」→「怎么排」→「印什么」→「版式」→「打包单」** 的认知顺序排列",
  "- 为 `docs/项目文档/配置归类-分组映射.csv` 提供 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（后厨/出品设置维度）",
  "",
  "| 竞品 | 后厨/出品设置组织方式 | 本项目借鉴 |",
  "|------|----------------------|------------|",
  "| **Toast** | 独立「后厨」：打印机与 KDS、备餐站/流水线、品项路由、备餐时效、出菜节奏（道次） | **送厨触发** 独立；**票据版式** 与 **工位路由** 分轨（工位主数据若在设备/菜单 hub） |",
  "| **Snackpass** | 设置→后厨：订单流程、备餐区、桌位 | 本 hub 聚焦 **单据打印/KDS 展示**，流程类送厨时机部分在订单中心 |",
  "| **Square** | 设备→KDS/打印机配置；履行方式影响后厨 | **打印路由**（发到哪台厨房打印机）单独成组 |",
  "| **Peblla** | 打印中心 + 设备分产线 | 厨房单 vs 打包单 **分票据类型** |",
  "| **Clover** | 设备与打印机；少独立后厨域 | 版式细项归入「版式格式」，不扩一级导航 |",
  "",
  "### 2.1 后厨设置四维（本 hub 覆盖范围）",
  "",
  "```text",
  "送厨触发与路由 → 厨房单怎么排（分组/拆单）→ 印哪些字段 → 版式参数 → 打包单（另一类票据）",
  "```",
  "",
  "**边界**：备餐时长、ETA、道次主数据、打印机 IP 绑定等，若在订单/设备/打印中心 hub，本方案不重复收录，仅在边界说明中标注跳转。",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（5 组）",
  "",
  "| 序号 | groupTitle | groupKey | 条数 | 说明 |",
  "|------|------------|----------|------|------|",
);

let total = 0;
for (let i = 0; i < order.length; i++) {
  const k = order[i];
  const n = by.get(k).length;
  total += n;
  push(`| ${i + 1} | **${titles[k]}** | \`${k}\` | ${n} | ${reasons[k]} |`);
}
push(
  `| | **合计** | | **${total}** | |`,
  "",
  "### 3.1 v1.1 微调说明",
  "",
  "| 调整 | seq | 原组 | 新组 | 理由 |",
  "|------|-----|------|------|------|",
  "| 分票规则 | 32 | 厨房单·分组与拆单 | 送厨触发与路由 | 0 元菜单独出一张厨房小票，属打印/分票触发 |",
  "| 行分隔 | 33 | 厨房单·分组与拆单 | 厨房单·版式格式 | 菜品间分割线为版式视觉，非行级分组逻辑 |",
  "",
  "### 3.2 v1.2 微调说明（已确认）",
  "",
  "| 调整 | seq | 原组 | 新组 | 理由 |",
  "|------|-----|------|------|------|",
  "| 送厨次数展示 | 35 | 送厨触发与路由 | 厨房单·票面信息 | 控制厨房单**是否展示**送厨次数，属票面字段而非何时送/路由 |",
  "",
  "**送厨触发与路由** 边界：仅保留「要不要送、何时送、打哪台机、出几张票、首次送厨范围」；票面展示类归入 **厨房单·票面信息**。",
  "",
  "### 3.3 v1.3 微调说明（已确认）",
  "",
  "| 调整 | seq | 原组 | 新组 | 理由 |",
  "|------|-----|------|------|------|",
  "| 备注强调样式 | 38 | 厨房单·票面信息 | 厨房单·版式格式 | 黑底白字为备注**呈现方式**，非「是否印备注」字段开关 |",
  "| 非零价标记 | 41 | 厨房单·票面信息 | 厨房单·版式格式 | 对行的**高亮/标记**属版式强调，非新增票面字段 |",
  "| 多语言分行 | 51 | 厨房单·票面信息 | 厨房单·分组与拆单 | 不同语言**分开显示**属行/块排布，与合并、菜序同类 |",
  "",
  "**厨房单·票面信息** 边界：仅保留「印不印」类开关（价、人、时、合计、送厨次数等）；样式强调与行结构归入版式/分组组。",
  "",
  "### 3.4 打包单组边界说明（已确认）",
  "",
  "- **39** 选择需打印**打包单**的订单类型（To Go / Pick Up / Delivery **多选**），与 **36**（多选、含 Dine In）独立。",
  "- **298** 属打包条**票面字段**（0 元调味是否展示），与触发/重打/拆分同组是为避免 4 条再拆子导航。",
  "- **299 / 300** 分别为重打范围、按座位/分割线分张。",
  "",
  "### 3.5 行级合并规则（v1.4，已确认）",
  "",
  "- 后厨设置新增 **「行级合并规则」** 组，以 **3×2 矩阵** 配置：行 = 合并相同菜 / 合并相同子菜；列 = 厨房单、打包单、食客收据。",
  "- seq **287、288、301、302** 终版归属打印中心，经 `settings-hub-override.mjs` 挂载至后厨 catalog，与 **52、53** 同组展示；UI 仅 **seq 52** 为矩阵宿主行。",
  "- 打印中心设置中上述 4 条不再重复出现（配置入口统一在后厨）。",
  "",
  "### 3.6 v1.5 自打印中心迁入（方案 A）",
  "",
  "| seq | 迁入组 | 说明 |",
  "|-----|--------|------|",
  "| 258 | 厨房单·版式格式 | 外带订单厨房单/收据单黑底白字强调；同存储键，收据侧与打印收据版式联动 |",
  "| 271 | 厨房单·票面信息 | 菜品编号三票种；UI 矩阵含打包单/收据列，厨房列为 SSOT |",
  "",
  "组内展示顺序见 `admin-web/scripts/lib/settings-intra-group-sort.mjs`。",
  "",
  "---",
  "",
  "## 4. 分类结果明细",
  "",
);

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(`### 4.${i + 1} ${titles[k]}（\`${k}\`）`, "", `**归类理由**：${reasons[k]}`, "");
  push("| seq | 票据/终端 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
  push("|-----|-----------|--------|----------|----------|----------------------|");
  for (const r of [...by.get(k)].sort((a, b) => a.seq - b.seq)) {
    push(
      `| ${r.seq} | ${r.terminal} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc, r.seq)} |`,
    );
  }
  push("");
}

push(
  "---",
  "",
  "## 5. 与旧分组对照",
  "",
  "| 新 groupTitle | 吸收的旧分组 |",
  "|---------------|--------------|",
  "| 送厨触发与路由 | 打印设置（触发与路由、0 元菜分票）、上菜单设置、其他（未付送厨） |",
  "| 厨房单·分组与拆单 | 厨房单排版（合并/座位/菜序/多语言分行/KDS/子菜，含 seq 51） |",
  "| 厨房单·票面信息 | 厨房单排版（字段开关）+ 打印设置（送厨次数 seq 35）；不含样式强调 |",
  "| 厨房单·版式格式 | 厨房单排版（边距、分割线、数量格式、分段序号）+ 打印/排版强调（38、41） |",
  "| 打包单 | 打包单设置、收据打印下打包单相关项 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 按本文更新 `docs/项目文档/配置归类-分组映射.csv` 中后厨相关 `seq`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 在后厨管理中心 → 设置 验证二级导航",
  "",
  "### 6.2 设置滑层控件（原型）",
  "",
  "| 组 / seq | 控件 | 实现 |",
  "|----------|------|------|",
  "| 送厨触发与路由 · **36** | 订单类型多选（Dine In / To Go / Pick Up / Delivery） | `module-settings-kitchen-order-type-ui.ts` |",
  "| 送厨触发与路由 · **32、37、62、304** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_SEND_ROUTING_TOGGLE_SEQ` |",
  "| 厨房单·分组与拆单 · **40、47、51、54、61** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_TICKET_GROUPING_TOGGLE_SEQ` |",
  "| 行级合并规则 · **52（矩阵）** | 厨房单 / 打包单 / 食客收据 三列开关矩阵 | `module-settings-line-merge-matrix-ui.ts`（53/287/288/301/302 合并展示） |",
  "| 厨房单·票面信息 · **35、42、45、46、48、49、50、55、56、57、58** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_TICKET_FIELDS_TOGGLE_SEQ` |",
  "| 厨房单·版式格式 · **43+44** | 边距数值输入 + 边距范围下拉（合并一行） | `module-settings-kitchen-ticket-margin-ui.ts` |",
  "| 厨房单·版式格式 · **38、41、33、59、60** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_TICKET_FORMAT_TOGGLE_SEQ` |",
  "| 打包单 · **39** | 订单类型多选（To Go / Pick Up / Delivery） | `module-settings-packing-slip-order-type-ui.ts` |",
  "| 打包单 · **298、299、300** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_PACKING_SLIP_TOGGLE_SEQ` |",
  "",
  "### 6.1 映射表（可直接写入 CSV）",
  "",
  "```csv",
  "seq,groupTitle,groupKey",
);

for (const r of [...rows].sort((a, b) => a.seq - b.seq)) {
  const key = assign.get(r.seq);
  lines.push(`${r.seq},${titles[key]},${key}`);
}

push(
  "```",
  "",
  "---",
  "",
  "## 7. 边界说明",
  "",
  "- **订单中心**：点击送厨/付款后送厨、延迟送厨等 **流程时机** 建议以订单中心为 SSOT；本 hub「送厨触发」侧重 **厨房单是否打印/路由**。",
  "- **打印中心**：小票模板装修、通用打印规则若已在打印中心配置，后厨 hub 仅保留 **厨房单/打包单业务字段**。",
  "- **硬件管理中心**：打印机 IP、绑定厨房名称等设备台账不在此重复。",
  "- 34 条全部保留，不删项。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
