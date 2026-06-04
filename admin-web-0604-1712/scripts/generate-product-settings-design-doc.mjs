/**
 * 生成 docs/项目文档/商品中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-product-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";
import { buildCatalogTitle } from "./lib/settings-catalog-scene-supplement.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "商品中心-设置二级导航重设计方案.md");

const titles = {
  "combo-ordering": "套餐点单与展示",
};

const reasons = {
  "combo-ordering":
    "套餐点完流程与子菜价展示（139/145）；终版归属商品中心 SSOT；POS 点单页展示见前厅 `pos-order-cart`，订单分单/促销见各 hub 文档。",
};

const assignMap = {
  "combo-ordering": [139, 145],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), "商品中心").filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = ["combo-ordering"];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  by.get(key).push({ ...r, title: buildCatalogTitle(r.seq, r.title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 商品中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v2.1（已确认）  ",
  "> 数据范围：商品设置 catalog **2** 条（套餐点单 SSOT；其余主数据在商品管理业务页，见 §1.1）  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 商品管理 vs 设置滑层",
  "",
  "| 能力 | 维护入口 | 原 seq |",
  "|------|----------|--------|",
  "| 菜品默认大小 | 商品管理 · 商品 | 112 |",
  "| 默认全局调味价格 | 商品管理 · 调味管理 | 146 |",
  "| 菜单文案多语言 | 商品管理 · 商品多语言 | 456 |",
  "| 菜谱管理 | 商品管理 · 配方管理 | 476 |",
  "| 按人数默认收费菜品 | 商品管理 · 菜单/商品 | 593 |",
  "",
  "### 1.2 v2.1 变更（套餐点单归位商品中心）",
  "",
  "自订单中心 `combo-ordering` 迁回 **`combo-ordering`（套餐点单与展示）**：",
  "",
  "| seq | 功能设置 | 说明 |",
  "|-----|----------|------|",
  "| 139 | 自动点完套餐 | 套餐业务规则 SSOT |",
  "| 145 | 可调套餐显示子菜价格 | 套餐价格展示规则 |",
  "",
  "---",
  "",
  "## 2. 推荐二级导航结构（1 组）",
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
push(`| | **合计** | | **${total}** | |`, "");

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(
    `### 2.${i + 1} ${titles[k]}（\`${k}\`）`,
    "",
    `**归类理由**：${reasons[k]}`,
    "",
    "| seq | 功能模块 | 功能设置 | 功能场景描述（摘要） |",
    "|-----|----------|----------|----------------------|",
  );
  for (const r of [...by.get(k)].sort((a, b) => a.seq - b.seq)) {
    push(`| ${r.seq} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`);
  }
  push("");
}

push(
  "---",
  "",
  "## 3. 落地步骤",
  "",
  "1. `node scripts/apply-product-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 商品中心 → 设置 → **套餐点单与展示**",
  "",
  "### 3.1 映射表（CSV）",
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
  "## 4. 边界说明",
  "",
  "- 112/146/456/476/593 等在商品管理维护，catalog 不重复展示。",
  "- **139/145** 为套餐点单 SSOT；前厅 `pos-order-cart` 管 POS 行项展示，不重复套餐定义。",
  "- 订单中心管分单/结账/折扣删退（含 **150 子单促销重算** · `split-merge-edit`）。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
