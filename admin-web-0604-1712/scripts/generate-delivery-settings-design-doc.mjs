/**
 * 生成 docs/项目文档/外卖来取-设置二级导航重设计方案.md
 * 运行：node scripts/generate-delivery-settings-design-doc.mjs
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
const outPath = path.join(projectDocs, "外卖来取-设置二级导航重设计方案.md");

const HUB = "外卖/来取";

const titles = {
  "scan-online-basics": "扫码·线上下单基础",
  "platform-delivery-slips": "平台订单与小票",
  "delivery-packaging": "外送区域与打包费",
};

const reasons = {
  "scan-online-basics":
    "商户可理解的线上下单开关与单号策略；技术端口/签名栏已迁出（见 §3.2）。",
  "platform-delivery-slips":
    "外卖/第三方平台订单的小票字段与份数；v2.5 自打印中心迁入 257/267。",
  "delivery-packaging":
    "外送可配送区域；按菜品打包盒加收（546）已迁订单中心「加收」作为跨产线计费规则。",
};

/** 外卖/来取 catalog 保留 seq（hub override 后仍挂载本路径） */
const assignMap = {
  "scan-online-basics": [90, 92],
  "platform-delivery-slips": [257, 267],
  "delivery-packaging": [429],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

const MOVED_OUT = [
  { seq: 31, to: "（排除）", note: "与 487 语义重复，设置滑层不单独展示" },
  { seq: 487, to: "前厅管理中心", note: "订单类型可用范围（多产线 C 端展示策略）" },
  { seq: 488, to: "前厅管理中心", note: "Kiosk：展示订单类型选择页面" },
  { seq: 489, to: "前厅管理中心", note: "Kiosk：送餐取餐服务方式（多选）" },
  { seq: 490, to: "前厅管理中心", note: "Kiosk：展示取餐方式" },
  { seq: 491, to: "前厅管理中心", note: "Kiosk：打包展示输入号码牌" },
  { seq: 93, to: "平台业务中心", note: "网上点餐免开端口 · online-order-service" },
  { seq: 94, to: "打印中心", note: "收据确认签名栏 · payment-receipt-flow" },
  { seq: 95, to: "平台业务中心", note: "Online order service host" },
  { seq: 96, to: "平台业务中心", note: "merchant ID" },
  { seq: 97, to: "平台业务中心", note: "external port" },
  { seq: 98, to: "前厅管理中心", note: "self dine-in host · guest-order-rules" },
  { seq: 99, to: "平台业务中心", note: "callback remotehost" },
  { seq: 100, to: "平台业务中心", note: "callback remoteport" },
  { seq: 101, to: "平台业务中心", note: "callback lan host" },
  { seq: 102, to: "平台业务中心", note: "callback lan port" },
  { seq: 103, to: "平台业务中心", note: "callback delay" },
  { seq: 104, to: "平台业务中心", note: "callback interval" },
  { seq: 105, to: "平台业务中心", note: "callback hash1" },
  { seq: 106, to: "平台业务中心", note: "callback hash2" },
  { seq: 503, to: "前厅管理中心", note: "送餐到桌餐牌号 · guest-order-rules" },
  { seq: 546, to: "订单中心", note: "按菜品打包盒默认加收（跨产线计费规则）" },
];

const MOVED_IN = [
  { seq: 257, from: "打印中心 · kitchen-ticket-packaging", note: "外卖平台订单打印平台备注" },
  { seq: 267, from: "打印中心 · kitchen-ticket-packaging", note: "外送小票打印份数" },
];

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (mod.includes("区域") || title.includes("外送")) return "外送";
  if (mod.includes("附加") || title.includes("打包")) return "打包";
  if (mod.includes("订单类型") || title.includes("取餐") || title.includes("订单类型")) return "履约";
  return "线上";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

function sortItemsInGroup(items) {
  return [...items].sort((a, b) => {
    const oa = INTRA_GROUP_SORT_BY_SEQ.get(a.seq);
    const ob = INTRA_GROUP_SORT_BY_SEQ.get(b.seq);
    const hasA = oa !== undefined;
    const hasB = ob !== undefined;
    if (hasA && hasB) return oa - ob;
    if (hasA) return -1;
    if (hasB) return 1;
    return a.seq - b.seq;
  });
}

const md = fs.readFileSync(sourcePath, "utf8");
const allRows = parseConfigMd(md);
const allHubRows = allRows.filter((r) => r.hub === HUB);
const catalogRows = filterRowsForSettingsHub(allRows, HUB).filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = ["scan-online-basics", "platform-delivery-slips", "delivery-packaging"];

const missing = catalogRows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`catalog 未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !catalogRows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of catalogRows) {
  const key = assign.get(r.seq);
  by.get(key).push({ ...r, area: inferArea(r.nav, r.moduleName, r.title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 外卖/来取 · 设置二级导航重设计方案",
  "",
  "> 文档版本：**v2.5**（257/267 自打印中心迁入 · 平台订单与小票）  ",
  `> 设置滑层 catalog：**${catalogRows.length}** 条（终版 hub 仍为外卖/来取共 ${allHubRows.length} 条）  `,
  "> 设置路径：`/operations/waitlist/settings`  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 现状问题（v1.0 → v2.0）",
  "",
  "| 指标 | v1.0 | v2.0 目标 |",
  "|------|------|-----------|",
  "| 本 hub 展示条数 | 25 条混排 | **3 条** 聚焦线上下单基础与外送区域 |",
  "| 技术参数 | 与商户配置同页 | **12 条** 迁 **平台业务中心** `online-order-service` |",
  "| 订单类型与履约流程 | 31/487/488–491 分散 | **31 排除**；**487–491→前厅** |",
  "| 跨域项 | 堂食 host、签名栏、送餐到桌 | 分别迁 **前厅** / **打印** |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **3 组**：线上下单基础 → 平台订单与小票 → 外送区域",
  "- 终版 `配置归类-终版.md` **不改**；通过 `settings-hub-override` + 映射表调整 catalog 挂载",
  "",
  "---",
  "",
  "## 2. 竞品对照（外卖/来取/线上点餐维度）",
  "",
  "| 竞品 | 外卖/来取/线上点餐组织方式 | 本项目借鉴 |",
  "|------|---------------------------|------------|",
  "| **Toast** | 外带与外送、配送范围、包装 | 外送区域在本 hub；跨产线打包费归订单中心计费规则 |",
  "| **Clover** | 订单类型、第三方对接分轨 | 订单类型/履约流程迁订单与前厅；对接迁集成中心 |",
  "| **Square** | 履行方式与渠道对接分离 | 商户配置 vs IT 配置分 hub |",
  "",
  "### 2.1 本 hub 商户心智（v2.0）",
  "",
  "```text",
  "扫码·线上下单基础 → 平台订单与小票 → 外送区域与打包费",
  "```",
  "",
  "**边界**：",
  "- **平台业务中心**：`93/95–106` 线上订餐 host/callback（IT 实施）",
  "- **前厅管理中心**：`488–491` Kiosk 履约流程、`98` self dine-in host、`503` 送餐到桌餐牌",
  "- **打印中心**：`94` 线上订单小票确认签名栏；打包条版式见 `packing-slip-print`",
  "- **后厨管理中心**：厨房单/258/271/行级合并矩阵",
  "- **支付中心**：外卖免税 (144)",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（3 组）",
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
push(`| | **合计** | | **${total}** | |`, "", "---", "", "## 3.2 迁出本 hub 的 seq（catalog 挂载变更）", "", "| seq | 迁入 | 说明 |", "|-----|------|------|");
for (const m of MOVED_OUT) {
  push(`| ${m.seq} | ${m.to} | ${m.note} |`);
}
push("", "### 3.3 自打印中心迁入（v2.5）", "", "| seq | 原归属 | 说明 |", "|-----|--------|------|");
for (const m of MOVED_IN) {
  push(`| ${m.seq} | ${m.from} | ${m.note} |`);
}
push("", "---", "", "## 4. 分类结果明细", "");

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(`### 4.${i + 1} ${titles[k]}（\`${k}\`）`, "", `**归类理由**：${reasons[k]}`, "");
  if (k === "scan-online-basics") {
    push(
      "",
      "**组内交互**：**90**、**92** 右侧**开关**（关闭/开启，保留功能场景描述；原型 localStorage）。",
      "",
    );
  }
  push("| seq | 场景 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
  push("|-----|------|--------|----------|----------|----------------------|");
  for (const r of sortItemsInGroup(by.get(k))) {
    push(
      `| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`,
    );
  }
  push("");
}

push(
  "---",
  "",
  "## 5. 版本变更",
  "",
  "| 版本 | 变更 |",
  "|------|------|",
  "| v1.0 | 4 组 / 25 条（含 online-integration） |",
  "| **v2.1** | **3 组 / 8 条**；31 排除；487–491→前厅；93/95–106→平台业务中心；94→打印；98/503→前厅 |",
  "| **v2.2** | **2 组 / 4 条**；488–491→前厅（Kiosk 履约流程）；外卖/来取仅保留 90/92/429/546 |",
  "| **v2.3** | **90/92** 扫码·线上下单基础项改为右侧开关控件 |",
  "| **v2.4** | **2 组 / 3 条**；546→订单中心 `order-surcharge`；外卖/来取仅保留 90/92/429 |",
  "| **v2.5** | **3 组 / 5 条**；257/267 自打印中心迁入 `platform-delivery-slips`（方案 A） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. `node scripts/apply-delivery-settings-mapping.mjs`",
  "2. `node scripts/apply-online-order-integration-mapping.mjs`",
  "3. `node scripts/apply-foh-settings-mapping.mjs`",
  "4. `node scripts/apply-print-settings-mapping.mjs`",
  "5. `cd admin-web && npm run build:settings-catalog`",
  "6. 外卖/来取、平台业务中心、前厅、打印 → 设置页验证",
  "",
  "### 6.1 映射表（CSV，仅本 hub catalog 条）",
  "",
  "```csv",
  "seq,groupTitle,groupKey",
);

for (const r of sortItemsInGroup(catalogRows)) {
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
  "- 终版表 **25** 条 `seq` 不变；设置滑层按 **hub override** 展示。",
  "- 本 hub 仅保留与 **线上下单基础 + 外送打包** 直接相关的商户配置。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${catalogRows.length} catalog items, ${allHubRows.length} 终版 hub rows)`);
