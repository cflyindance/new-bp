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
  "kitchen-order-send": "送厨范围",
  "kitchen-ticket-issue": "厨房单分张",
  "kitchen-printer-route": "打印机分配",
  "ticket-grouping": "菜品分区",
  "line-merge-rules": "相同行合并",
  "cross-ticket-fields": "多票种共用",
  "ticket-fields": "票面信息",
  "ticket-format": "票面版式",
  "packing-slip": "打包单",
};

const reasons = {
  "kitchen-order-send":
    "可送厨的订单范围：按订单类型排除不送厨（36）、未付款订单是否直接送厨（62）；不含收银送厨时机（见前厅送厨时机）。",
  "kitchen-ticket-issue":
    "厨房单分张方式：首次送厨是否打印整单（304）、零价菜品是否单独打印厨房小票（32）。",
  "kitchen-printer-route":
    "按菜品条件将送厨内容分配至指定厨房打印机（37）；设备绑定见硬件管理中心。",
  "ticket-grouping":
    "单张厨房单内按座位、菜序、语言、子菜与调味分区展示；KDS 多行展示（54）与「相同行合并」可独立配置。",
  "line-merge-rules":
    "相同主菜/子菜行在厨房单、打包单、食客收据上的合并规则（seq 52/53/301/302/288/287）；后厨为配置 SSOT 展示入口。",
  "cross-ticket-fields":
    "同时在厨房单、打包单、订单收据生效：菜品编号（271）、外带黑底白字强调（258）；均为「主开关 + 三票种多选」。",
  "ticket-fields":
    "厨房单票面字段：送厨次数、价格、数量、顾客信息、订单时间与合计等是否打印；不含多票种共用项与版式强调。",
  "ticket-format":
    "厨房单票面版式：边距、备注黑底白字（38）、非零价标记、分割线、数量格式、切纸分段序号等；258 见多票种共用。",
  "packing-slip":
    "打包单触发订单类型、重打与分张规则及票面字段（如 298 零价调味是否展示）；与 seq 36 独立配置。",
};

/** 设计文档场景摘要覆盖（不改终版原文） */
const SCENE_SUMMARY_OVERRIDE_BY_SEQ = new Map([
  [
    39,
    "控制哪些订单类型的订单需要打印打包单（与「不需要厨房单的单类」seq 36 独立，仅作用于打包单）",
  ],
]);

/** seq → groupKey（后厨设置 catalog，含 hub 覆盖挂载的打印中心项） */
const assignMap = {
  "kitchen-order-send": [36, 62],
  "kitchen-ticket-issue": [304, 32],
  "kitchen-printer-route": [37],
  "ticket-grouping": [40, 47, 54, 51, 61],
  "line-merge-rules": [52, 53, 287, 288, 301, 302],
  "cross-ticket-fields": [271, 258],
  "ticket-fields": [35, 42, 45, 46, 48, 49, 50, 55, 56, 57, 58],
  "ticket-format": [43, 44, 38, 41, 33, 59, 60],
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
  "kitchen-order-send",
  "kitchen-ticket-issue",
  "kitchen-printer-route",
  "ticket-grouping",
  "line-merge-rules",
  "cross-ticket-fields",
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
  "> 文档版本：v2.0（短标题 + 说明条补全；groupKey 不变）  ",
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
  "- 二级导航为 **9 个** 场景组（送厨前三组 + 厨房单/跨票种 + 打包单；含行级合并矩阵）",
  "- 按 **送厨范围 → 厨房单分张 → 打印机分配 → 菜品分区 → 相同行合并 → 多票种共用 → 票面信息 → 票面版式 → 打包单** 排列（侧栏短标题，组内说明条补全语义）",
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
  "送厨范围 → 厨房单分张 → 打印机分配 → 菜品分区 → 相同行合并 → 多票种共用 → 票面信息 → 票面版式 → 打包单",
  "```",
  "",
  "**边界**：备餐时长、ETA、道次主数据、打印机 IP 绑定等，若在订单/设备/打印中心 hub，本方案不重复收录，仅在边界说明中标注跳转。",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（9 组）",
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
  "### 3.7 v1.6 变更（侧栏可读性 + 跨 hub 提示）",
  "",
  "| 变更 | 说明 |",
  "|------|------|",
  "| 侧栏组名缩短 | 送厨与路由 / 菜品分组拆单 / 行级合并（三票种） / 厨房单字段 / 厨房单版式 / 打包单（`groupKey` 不变） |",
  "| 组级说明条 | `module-settings-kitchen-group-ui.ts`；设置页每组标题下展示边界与跳转 |",
  "| 送厨与路由 | 跳转前厅「登录开单与送厨」；提示 62/304 对照 |",
  "| 菜品分组拆单 | **54** 与行级合并矩阵互斥语义说明（sceneDesc 同步） |",
  "| 打包单 | 跳转打印中心「打包单打印」（份数/样式类 seq 34/281/297/303） |",
  "",
  "### 3.8 v1.7 变更（送厨与路由拆组）",
  "",
  "| 原组 `send-routing`（5 条） | 新组 | seq | 导航标题自解释 |",
  "|---------------------------|------|-----|----------------|",
  "| 送厨与路由 | **订单类型与送厨条件** `kitchen-order-send` | 36, 62 | 哪些单型不送、未付能否送 |",
  "| 送厨与路由 | **分票与首次送厨** `kitchen-ticket-issue` | 304, 32 | 首次是否打整单、0 元菜是否分票 |",
  "| 送厨与路由 | **厨房打印机路由** `kitchen-printer-route` | 37 | 按菜打到哪台厨房打印机 |",
  "",
  "### 3.9 v1.8 变更（271 迁组）",
  "",
  "| seq | 原组 | 新组 | 理由 |",
  "|-----|------|------|------|",
  "| 271 | 厨房单字段 | **跨票种字段** `cross-ticket-fields` | 主开关 + 厨房单/打包单/订单收据多选，非仅厨房单字段 |",
  "",
  "### 3.10 v1.9 变更（商户语义组名 + 258 迁组）",
  "",
  "| 变更 | 说明 |",
  "|------|------|",
  "| 组名 | 送厨资格与范围 / 厨房单出票规则 / 单内菜品怎么排 / 相同菜行是否合并 / 跨票种显示 / 厨房单显示什么 / 厨房单样式 |",
  "| 258 | 自厨房单样式迁至 **跨票种显示**（与 271 并列；三票种黑底白字强调） |",
  "",
  "### 3.11 v2.0 变更（短标题 + 说明条补全）",
  "",
  "| groupKey | v1.9 组名 | v2.0 短标题 | 说明条补全方向 |",
  "|----------|-----------|-------------|----------------|",
  "| `kitchen-order-send` | 送厨资格与范围 | **送厨范围** | 订单类型排除、未付是否送厨；送厨时机链前厅 |",
  "| `kitchen-ticket-issue` | 厨房单出票规则 | **厨房单分张** | 首次整单、零价菜分张 |",
  "| `kitchen-printer-route` | 厨房打印机路由 | **打印机分配** | 按菜分配厨房打印机；设备链硬件 |",
  "| `ticket-grouping` | 单内菜品怎么排 | **菜品分区** | 座位/菜序/语言/子菜；54 与合并独立 |",
  "| `line-merge-rules` | 相同菜行是否合并 | **相同行合并** | 三票种矩阵；SSOT 在后厨 |",
  "| `cross-ticket-fields` | 跨票种显示 | **多票种共用** | 271 编号、258 外带强调 |",
  "| `ticket-fields` | 厨房单显示什么 | **票面信息** | 仅厨房单字段开关 |",
  "| `ticket-format` | 厨房单样式 | **票面版式** | 边距与强调样式 |",
  "| `packing-slip` | 打包单 | **打包单** | 与原系统一致；触发、重打、分张；样式链打印中心 |",
  "",
  "`groupKey` 不变；侧栏控制在 4～5 字，语义由 `module-settings-kitchen-group-ui.ts` 组级说明条承担。",
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
  "| 送厨范围 | 原送厨与路由：订单类型排除（36）、未付送厨（62） |",
  "| 厨房单分张 | 原送厨与路由：首次整单（304）、0 元菜分票（32） |",
  "| 打印机分配 | 原送厨与路由：跨打印机分配（37） |",
  "| 菜品分区 | 厨房单排版（座位/菜序/多语言分行/KDS/子菜，含 seq 51） |",
  "| 相同行合并 | 厨房单排版合并项 + 打印中心 hub 覆盖的收据/打包单列 |",
  "| 多票种共用 | 271 菜品编号 + 258 外带强调（三票种） |",
  "| 票面信息 | 厨房单排版（字段开关）+ 打印设置（送厨次数 seq 35） |",
  "| 票面版式 | 厨房单排版（边距、分割线、数量格式、分段序号）+ 备注/行强调（38、41） |",
  "| 打包单 | 打包单设置、收据打印下打包单触发/重打/分张项 |",
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
  "| 送厨范围 · **36** | 订单类型多选（Dine In / To Go / Pick Up / Delivery） | `module-settings-kitchen-order-type-ui.ts` |",
  "| 送厨范围 · **62**；厨房单分张 · **304、32**；打印机分配 · **37** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_SEND_ROUTING_TOGGLE_SEQ` |",
  "| 各组 | 组级跨 hub 说明 | `module-settings-kitchen-group-ui.ts` |",
  "| 菜品分区 · **40、47、51、54、61** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_TICKET_GROUPING_TOGGLE_SEQ` |",
  "| 相同行合并 · **52（矩阵）** | 厨房单 / 打包单 / 食客收据 三列开关矩阵 | `module-settings-line-merge-matrix-ui.ts` |",
  "| 多票种共用 · **271** | 主开关 + 三票种多选 | `module-settings-print-dish-code-ui.ts` |",
  "| 多票种共用 · **258** | 主开关 + 三票种多选 | `module-settings-takeout-enhanced-display-ui.ts` |",
  "| 票面信息 · **35、42、45、46、48、49、50、55、56、57、58** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_TICKET_FIELDS_TOGGLE_SEQ` |",
  "| 票面版式 · **43+44** | 边距数值输入 + 边距范围下拉（合并一行） | `module-settings-kitchen-ticket-margin-ui.ts` |",
  "| 票面版式 · **38、41、33、59、60** | 右侧开关 | `module-settings-toggle-ui.ts` → `KITCHEN_TICKET_FORMAT_TOGGLE_SEQ` |",
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
  "- **前厅管理中心**：POS 送厨时机（点击送厨/付款/结账/打单、延迟送厨）见 **登录开单与送厨**；本 hub 前三组侧重 **送不送、出几张票、打到哪台机**。",
  "- **打印中心**：小票模板装修、打包单份数/样式（34/281/297/303）见 **打包单打印**；后厨保留触发与业务字段。",
  "- **硬件管理中心**：打印机 IP、绑定厨房名称等设备台账不在此重复。",
  "- **40** 条全部保留，不删项；组级说明见 `module-settings-kitchen-group-ui.ts`。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
