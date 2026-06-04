/**
 * 生成 docs/项目文档/库存管理中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-inventory-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "库存管理中心-设置二级导航重设计方案.md");

const HUB = "库存管理中心";

const titles = {
  "inventory-control-rules": "库存管控规则",
  "procurement-supplier": "采购与供应商",
  "master-data-locations": "库存主数据与库位",
  "stocktaking-operations": "盘点与运营视图",
  "integration-expiry": "系统对接与效期管理",
};

const reasons = {
  "inventory-control-rules":
    "库存增减原因、低库存策略、是否允许负库存单据等核心控制项；对标 Clover「库存追踪/允许负库存」。",
  "procurement-supplier":
    "自动购货单生成/发送/入库及默认供应商；对标 Square「供应商与采购管理」、Peblla 采购流程。",
  "master-data-locations":
    "库存货品、类别与库房地点主数据；对标 Square「库存项目与位置」模型。",
  "stocktaking-operations":
    "库存清点、库存概况等运营工作台；对标 Toast/Square 的库存历史与库存概览。",
  "integration-expiry":
    "Marketman 对接参数与效期管理；对标第三方库存系统集成与保质期治理场景。",
};

/** seq → groupKey（库存管理中心 21 条） */
const assignMap = {
  "inventory-control-rules": [20, 21, 22, 179],
  "procurement-supplier": [23, 24, 25, 26, 27, 28],
  "master-data-locations": [468, 469, 471],
  "stocktaking-operations": [472, 473, 475],
  "integration-expiry": [224, 225, 226, 227, 477],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("Marketman") || t.includes("API")) return "对接";
  if (t.includes("效期")) return "效期";
  if (t.includes("库存清点") || t.includes("清点")) return "盘点";
  if (t.includes("购货") || t.includes("供应商") || t.includes("入库")) return "采购";
  if (t.includes("货品") || t.includes("类别") || t.includes("库房")) return "主数据";
  if (t.includes("低库存") || t.includes("不足") || t.includes("增量") || t.includes("减量")) return "规则";
  return "库存";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = [
  "inventory-control-rules",
  "procurement-supplier",
  "master-data-locations",
  "stocktaking-operations",
  "integration-expiry",
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
  "# 库存管理中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 库存管理中心** 共 **21** 条功能设置  ",
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
  "| 二级分组数 | **约 9 组** / 21 条 | 库存设置、Marketman、物品、管理并列，路径分散 |",
  "| 规则与流程混排 | 控制规则与采购流程混在库存设置内 | 商户难按“管控→采购→盘点”理解 |",
  "| 技术项突兀 | Marketman API 参数与业务配置同层 | 非技术用户难区分该不该配置 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **5 组**，覆盖 21 条，匹配餐饮库存运营闭环",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（库存设置维度）",
  "",
  "| 竞品 | 库存设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Square** | 库存管理、供应商、库存历史、位置管理 | 主数据/采购/盘点分轨 |",
  "| **Clover** | 库存追踪、允许负库存、库存不足提醒 | 库存管控规则独立 |",
  "| **Toast** | 品项库存、低库存提示 | 低库存显示纳入规则组 |",
  "| **Peblla** | 报表与库存/采购联动，供应链视角明显 | 采购与入库流程单列 |",
  "| **Snackpass** | 供应商可用性与运营控制 | 对接类配置独立，避免误操作 |",
  "",
  "### 2.1 库存设置五维（商户心智）",
  "",
  "```text",
  "库存管控规则 → 采购与供应商 → 库存主数据与库位 → 盘点与运营视图 → 系统对接与效期管理",
  "```",
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
push(`| | **合计** | | **${total}** | |`, "", "---", "", "## 4. 分类结果明细", "");

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(`### 4.${i + 1} ${titles[k]}（\`${k}\`）`, "", `**归类理由**：${reasons[k]}`, "");
  push("| seq | 场景 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
  push("|-----|------|--------|----------|----------|----------------------|");
  for (const r of [...by.get(k)].sort((a, b) => a.seq - b.seq)) {
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
  "| 库存管控规则 | 库存设置、单菜设置（低库存菜） |",
  "| 采购与供应商 | 库存设置（自动购货单） |",
  "| 库存主数据与库位 | 物品、渠道（库房地点） |",
  "| 盘点与运营视图 | 管理（库存清点/概况/采购入库） |",
  "| 系统对接与效期管理 | Partner Integration（Marketman）、效期管理 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-inventory-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 库存管理中心 → 设置验证",
  "",
  "### 6.1 映射表（CSV）",
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
  "- 21 条全部保留；`seq` 与终版表行号一致。",
  "- Marketman 参数集中在“系统对接与效期管理”，可后续加权限限制为管理员可见。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
