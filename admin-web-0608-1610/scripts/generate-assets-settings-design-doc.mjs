/**
 * 生成 docs/项目文档/素材中心-设置二级导航重设计方案.md
 * 运行：node admin-web/scripts/generate-assets-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { getSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "素材中心-设置二级导航重设计方案.md");

const HUB = "素材中心";

const assignMap = {};

const excludedFromCatalog = [
  { seq: 430, title: "叫号屏图片", page: "/marketing/ads" },
  { seq: 431, title: "客显屏图片", page: "/marketing/ads" },
  { seq: 432, title: "公司封面图", page: "/marketing/ads" },
  { seq: 433, title: "餐厅 LOGO", page: "/stores/settings · 门店档案" },
  { seq: 434, title: "打印小票 LOGO", page: "/print-templates/settings · 打印基础" },
  { seq: 555, title: "首页封面图", page: "/marketing/ads" },
  { seq: 556, title: "首页门店 LOGO（未填写）", page: "—（catalog 不展示）" },
];

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("LOGO")) return "LOGO";
  return "素材";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const allRows = parseConfigMd(md).filter((r) => getSettingsHub(r.seq, r.hub) === HUB);
const rows = allRows.filter((r) => !isSettingsCatalogExcluded(r.seq));
const order = Object.keys(assignMap);

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (rows.length && missing.length) {
  throw new Error(`catalog 未归类 seq: ${missing.join(", ")}`);
}

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  by.get(key).push({ ...r, area: inferArea(r.nav, r.moduleName, r.title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 素材中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.4  ",
  `> 设置 catalog：**${rows.length}** 条；终版 hub 原文 **${parseConfigMd(md).filter((r) => r.hub === HUB).length}** 条，经 hub override 后有效 **${allRows.length}** 条，其余见 §4 迁出说明  `,
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 变更说明（v1.4）",
  "",
  "| 调整 | 说明 |",
  "|------|------|",
  "| **433 餐厅 LOGO** | → **门店管理** `/stores/settings` · **门店档案**（门店级商户标识） |",
  "| 设置滑层 | 素材中心 **无 catalog 组**；屏显/封面/打印 LOGO 见 §4 |",
  "",
  "### 1.2 历史（v1.3 及以前）",
  "",
  "| 调整 | 说明 |",
  "|------|------|",
  "| 430/431/432/555 | → 营销中心 **广告** |",
  "| 434 打印小票 LOGO | → 打印中心 **打印基础** |",
  "",
  "### 1.3 设计目标",
  "",
  "- 避免素材中心与门店档案、广告、打印基础 **双入口**",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 推荐二级导航结构",
  "",
  rows.length === 0
    ? "当前 **无** 设置 catalog 二级组；各 seq 已迁出至 §4 对应模块。"
    : "",
  "",
);

if (rows.length > 0) {
  push(
    "| 序号 | groupTitle | groupKey | 条数 | 说明 |",
    "|------|------------|----------|------|------|",
  );
  let total = 0;
  for (let i = 0; i < order.length; i++) {
    const k = order[i];
    const n = by.get(k).length;
    total += n;
    push(`| ${i + 1} | **${k}** | \`${k}\` | ${n} | — |`);
  }
  push(`| | **合计** | | **${total}** | |`);
}

push("", "---", "", "## 3. 分类结果明细", "");

if (rows.length === 0) {
  push("（无 catalog 项）", "");
} else {
  for (let i = 0; i < order.length; i++) {
    const k = order[i];
    push(`### 3.${i + 1}（\`${k}\`）`, "");
    push("| seq | 场景 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
    push("|-----|------|--------|----------|----------|----------------------|");
    for (const r of [...by.get(k)].sort((a, b) => a.seq - b.seq)) {
      push(
        `| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`,
      );
    }
    push("");
  }
}

push(
  "---",
  "",
  "## 4. 已迁出 catalog",
  "",
  "| seq | 功能设置 | 维护入口 |",
  "|-----|----------|----------|",
);
for (const x of excludedFromCatalog) {
  push(`| ${x.seq} | ${x.title} | \`${x.page}\` |`);
}

push(
  "",
  "---",
  "",
  "## 5. 落地步骤",
  "",
  "1. `node admin-web/scripts/apply-assets-settings-mapping.mjs`（清理 433 等映射行）",
  "2. `node admin-web/scripts/apply-store-settings-mapping.mjs`（433 → store-profile）",
  "3. `cd admin-web && npm run build:settings-catalog`",
  "4. 素材中心模块 **无** 设置滑层入口（或隐藏空态）；餐厅 LOGO 在 **门店管理 → 设置 → 门店档案**",
  "",
  "### 5.1 映射表（CSV，catalog 项）",
  "",
  "```csv",
  "seq,groupTitle,groupKey",
  "(无)",
  "```",
  "",
  "---",
  "",
  "## 6. 边界说明",
  "",
  "- 430/431/432/433/434/555/556 终版 hub 仍为素材中心时，经 `settings-hub-override` 与 exclusions 归入对应模块 catalog。",
  "- **461/462** 仍在前厅 `cds`（客显结账副屏），与 431 图片库维护路径不同。",
  "- 屏保、海报 Pro 见营销中心对应功能页，不在本 hub 设置重复展示。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (catalog ${rows.length} items, ${order.length} groups)`);
