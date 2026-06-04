/**
 * 生成 docs/项目文档/打印中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-print-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { INTRA_GROUP_SORT_BY_SEQ } from "./lib/settings-intra-group-sort.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "打印中心-设置二级导航重设计方案.md");

const HUB = "打印中心";

const titles = {
  "print-foundation-devices": "打印基础",
  "order-receipt-trigger": "订单收据触发",
  "payment-receipt-flow": "支付收据流程",
  "receipt-print-execution": "收据打印执行",
  "receipt-line-content": "收据明细与价格",
  "receipt-layout-format": "收据版式与辅助",
  "packing-slip-print": "打包单打印",
  "ticket-number-slip": "单号小票",
};

const reasons = {
  "print-foundation-devices":
    "页高、434 打印小票 LOGO 素材、256 是否印 Logo、轮打/265 快速打印、269 选机；全局打印引擎与设备路由，非票面字段。",
  "order-receipt-trigger":
    "654 下单后、500 部分付款后，按产线配置是否在门店收据机自动打订单收据；与支付收据流程分轨。",
  "payment-receipt-flow":
    "246 支付方式矩阵（含原 263/268）、261 付款前触发、247/250/272 签购单票面与删卡联次；260/245/249 已并入支付中心 465/669。",
  "receipt-print-execution":
    "262 首打份数、273 重打仅新菜；触发已满足后的收据出纸范围与份数（265 已迁打印基础）。",
  "receipt-line-content":
    "菜品/子菜/调味显隐、价格与折扣原价、数量、备注、厨房名等「票上写什么行」。",
  "receipt-layout-format":
    "菜间距、分割线、单号条码、自动加收提示与文案、重打显示日期等「怎么排、辅助信息」。",
  "packing-slip-print":
    "打包条份数、堂食标识（281）、显示价格、删菜样式；厨房单触发/版式见后厨。",
  "ticket-number-slip":
    "单号小票触发场景与份数；对标 Clover 订单号小票配置。",
};

/** seq → groupKey（打印中心 catalog 可见条；hub override 后挂载本路径） */
const assignMap = {
  "print-foundation-devices": [167, 434, 256, 259, 265, 269],
  "order-receipt-trigger": [654, 500],
  "payment-receipt-flow": [246, 247, 250, 261, 272],
  "receipt-print-execution": [262, 273],
  "receipt-line-content": [275, 274, 278, 276, 285, 289, 283, 284],
  "receipt-layout-format": [282, 286, 277, 279, 280, 264],
  "packing-slip-print": [34, 281, 297, 303],
  "ticket-number-slip": [291, 292],
};

const MOVED_OUT = [
  { seq: 455, to: "打印装修 · /print-templates/decoration", note: "小票模板/排版设计为独立功能页，非设置滑层项" },
  { seq: 180, to: "支付中心 · card-fees", note: "Merchantcopy 电子签名留存属卡交易合规，非打印基础" },
  { seq: 257, to: "外卖/来取 · platform-delivery-slips", note: "外卖平台订单在哪类小票上打印平台备注" },
  { seq: 267, to: "外卖/来取 · platform-delivery-slips", note: "外送/外卖订单收据打印份数" },
  {
    seq: 258,
    to: "后厨管理中心 · ticket-format",
    note: "外带订单厨房单/收据单增强显示；厨房单侧 SSOT 在后厨，收据侧同存储键",
  },
  {
    seq: 271,
    to: "后厨管理中心 · ticket-fields",
    note: "菜品编号三票种矩阵；厨房单列 SSOT 在后厨，打包/收据列见同 seq UI",
  },
  { seq: 301, to: "后厨管理中心 · line-merge-rules", note: "打包单合并相同菜（矩阵列）" },
  { seq: 302, to: "后厨管理中心 · line-merge-rules", note: "打包单合并相同子菜（矩阵列）" },
  { seq: 287, to: "后厨管理中心 · line-merge-rules", note: "食客收据合并相同子菜（矩阵列）" },
  { seq: 288, to: "后厨管理中心 · line-merge-rules", note: "食客收据合并相同菜（矩阵列）" },
  { seq: 260, to: "支付中心 · cds-checkout-ux · 465", note: "支付后自动打印收据小票 → 结账小票纸质通道「自动打印」" },
  { seq: 245, to: "支付中心 · cds-checkout-ux · 669", note: "信用卡支付打印签购单 → 刷卡签购单产线矩阵" },
  { seq: 249, to: "支付中心 · cds-checkout-ux · 669", note: "签购单联次四选一 → 669 商户/客户联分产线配置" },
  { seq: 172, to: "支付中心 · card-fees", note: "收据未付价格显示属卡付/双轨定价呈现" },
  { seq: 252, to: "（排除）", note: "订单收据小费行打印时机与 266 收据建议小费重叠，支付中心 catalog 不展示" },
  { seq: 266, to: "支付中心 · tip-policy", note: "收据建议小费行；预设见 295/296" },
  { seq: 290, to: "支付中心 · tax-rules", note: "按税别调整折扣/加收在收据上的打印位置" },
  { seq: 94, to: "前厅管理中心 · guest-order-rules", note: "网上点餐确认签名栏，C 端渠道规则" },
  {
    seq: 270,
    to: "打印中心 · print-foundation-devices · 269",
    note: "手持移动 POS 打印前选机 → 269「打印前选择打印机」POS Go 列",
  },
  {
    seq: 265,
    to: "打印中心 · print-foundation-devices",
    note: "快速打印收据模式由「收据打印执行」迁入，与 259 同属打印引擎策略",
  },
];

const MOVED_IN = [
  {
    seq: 434,
    from: "素材中心 · 品牌标识素材",
    note: "打印小票 LOGO 图片素材；与 256「是否打印 Logo」同组维护",
  },
];

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("厨房") || t.includes("打包")) return "厨房/打包";
  if (t.includes("单号")) return "单号";
  if (t.includes("支付") || t.includes("信用卡") || t.includes("小费")) return "支付收据";
  if (t.includes("收据") || t.includes("打印")) return "收据";
  if (t.includes("模板") || t.includes("Logo") || t.includes("页高") || t.includes("轮打")) return "基础";
  return "打印";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const allRows = parseConfigMd(md);
const allHubRows = allRows.filter((r) => r.hub === HUB);
const rows = filterRowsForSettingsHub(allRows, HUB).filter((r) => !isSettingsCatalogExcluded(r.seq));
const order = [
  "print-foundation-devices",
  "order-receipt-trigger",
  "payment-receipt-flow",
  "receipt-print-execution",
  "receipt-line-content",
  "receipt-layout-format",
  "packing-slip-print",
  "ticket-number-slip",
];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  by.get(key).push({ ...r, area: inferArea(r.nav, r.moduleName, r.title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 打印中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.10（「收据版式与明细」拆为「收据明细与价格」8 条 +「收据版式与辅助」6 条）  ",
  `> 数据范围：打印中心设置 catalog **${rows.length}** 条可见  `,
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
  "| 二级分组 | **8 组** / 34 条 | 原单组 14 条版式项拆为「明细与价格」+「版式与辅助」 |",
  "| 商户心智 | 触发 / 执行 / 版式 混排 | 配置「何时打」与「印什么行」易混淆 |",
  "",
  "### 1.2 设计目标",
  "",
  "- v1.10：版式类 **14 条** 拆为 **收据明细与价格（8）** + **收据版式与辅助（6）**",
  "- v1.9：**265** 迁入 **打印基础**；**收据打印执行** 仅 **262/273**",
  "- 新增 **收据打印执行**（份数、快速模式、仅新菜）",
  "- **打印基础** 吸收打印前选机（269/270）",
  "- 跨 hub：小费/未付价/税位 → 支付中心；线上签名栏 → 前厅；堂食标识 → 打包组",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（打印/小票设置维度）",
  "",
  "| 竞品 | 打印设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | 打印机与钱箱、账单小票设置、打印机/单据/KDS | 支付收据与厨房单分轨 |",
  "| **Clover** | 订单小票、支付小票、打印偏好、设备打印机 | 收据流程、执行、版式三层 |",
  "| **Square** | 打印机配置文件、收据打印选项、订单票与标签 | 触发逻辑与版式字段独立 |",
  "",
  "### 2.1 打印设置七维（商户心智）",
  "",
  "```text",
  "打印基础 → 订单触发 → 支付收据 → 打印执行 → 明细与价格 → 版式与辅助 → 打包单 → 单号小票",
  "",
  "**边界**：厨房单 → 后厨；平台备注/外送份数 → 外卖/来取；小费/未付价/税位 → 支付中心；C 端签名栏 → 前厅。",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（8 组）",
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
push(`| | **合计** | | **${total}** | |`, "", "---", "", "## 4. 分类结果明细", "");

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(`### 4.${i + 1} ${titles[k]}（\`${k}\`）`, "", `**归类理由**：${reasons[k]}`, "");
  push("| seq | 场景 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
  push("|-----|------|--------|----------|----------|----------------------|");
  const sorted = [...by.get(k)].sort(
    (a, b) => (INTRA_GROUP_SORT_BY_SEQ.get(a.seq) ?? a.seq) - (INTRA_GROUP_SORT_BY_SEQ.get(b.seq) ?? b.seq),
  );
  for (const r of sorted) {
    push(`| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`);
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
  "| 打印基础 | 页高、434 小票 LOGO 图、256 是否印 Logo、轮打/265、269 选机 |",
  "| 订单收据触发 | 654、500（按产线） |",
  "| 支付收据流程 | 246/261/247/250/272 |",
  "| 收据打印执行 | 262 首打份数、273 重打仅新菜 |",
  "| 收据明细与价格 | 菜品/调味/价格/备注等行项显隐 |",
  "| 收据版式与辅助 | 间距、条码、加收提示、重打日期等 |",
  "| 打包单打印 | 份数、281 堂食、价格、删菜样式 |",
  "| 单号小票 | 单号设置 |",
  "",
  "---",
  "",
  "## 6. 迁出本 hub 的 seq",
  "",
  "| seq | 迁入 | 说明 |",
  "|-----|------|------|",
);

for (const m of MOVED_OUT) {
  push(`| ${m.seq} | ${m.to} | ${m.note} |`);
}

push(
  "",
  "---",
  "",
  "## 6.1 自其它 hub 迁入",
  "",
  "| seq | 自 | 说明 |",
  "|-----|-----|------|",
);
for (const m of MOVED_IN) {
  push(`| ${m.seq} | ${m.from} | ${m.note} |`);
}

push(
  "",
  "---",
  "",
  "## 7. 落地步骤",
  "",
  "1. `node scripts/apply-print-settings-mapping.mjs`",
  "2. `node scripts/apply-payment-settings-mapping.mjs`（172/266/290）",
  "3. `node scripts/apply-foh-settings-mapping.mjs`（94）",
  "4. `cd admin-web && node scripts/build-module-settings-catalog.mjs`",
  "5. 打印 / 支付 / 前厅 设置页验证",
  "",
  "### 7.1 映射表（CSV，打印中心 catalog 可见项）",
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
  "## 8. 边界说明",
  "",
  `- 终版 **${allHubRows.length}** 条 hub 行保留；打印中心 catalog **${rows.length}** 条可见。`,
  "- `seq` 与终版表行号一致；跨 hub 项通过 `settings-hub-override.mjs` 挂载。",
  "- 厨房单主体配置见 `后厨管理中心-设置二级导航重设计方案.md`。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
