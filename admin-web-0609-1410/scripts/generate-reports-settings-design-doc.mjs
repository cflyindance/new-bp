/**
 * 生成 docs/项目文档/报表中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-reports-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "报表中心-设置二级导航重设计方案.md");

const HUB = "报表中心";

const titles = {
  "report-basics-export": "报表基础口径与导出",
  "summary-report-fields": "总报表字段与核算项",
  "topic-analysis-reports": "专题分析报表",
};

const reasons = {
  "report-basics-export":
    "报表标题、周起始日、云报表与收据导出等全局口径；对标 Square/Clover 的 Report day、报表偏好与导出设置。",
  "summary-report-fields":
    "总报表展示字段、页脚布局与核算开关（现金/折扣/成本/区域等）；对标 Toast「经理日结报表字段配置」、Square「打印在报告上字段」。",
  "topic-analysis-reports":
    "销售/工资/现金折扣等专题报表入口；对标 Toast/Clover/Peblla 的专题分析与交易报表分组。",
};

/** seq → groupKey（报表中心 23 条） */
const assignMap = {
  "report-basics-export": [308, 311, 312, 424],
  "summary-report-fields": [313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328],
  "topic-analysis-reports": [435, 436, 453],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("总报表")) return "总报表";
  if (t.includes("页脚") || t.includes("列数") || t.includes("行数")) return "报表布局";
  if (t.includes("工资")) return "工资";
  if (t.includes("销售")) return "销售";
  if (t.includes("现金折扣")) return "现金折扣";
  if (t.includes("打印") || t.includes("收据")) return "导出";
  if (t.includes("每周") || t.includes("标题") || t.includes("云报表")) return "基础口径";
  return "报表";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = ["report-basics-export", "summary-report-fields", "topic-analysis-reports"];

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
  "# 报表中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 报表中心** 共 **23** 条功能设置  ",
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
  "| 二级分组数 | **8 组** / 23 条 | `总报表`14条过重，且与基础口径/专题分析割裂 |",
  "| 命名来源 | 旧模块直出 | `报表界面`、`总报表`、`分析`并列，用户不清楚配置先后关系 |",
  "| 入口碎片化 | 销售/工资/现金折扣分散 | 难按“先定口径，再定总报表字段，再看专题”的流程使用 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **3 组**，覆盖 23 条，符合餐饮门店报表配置流程",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（报表配置维度）",
  "",
  "| 竞品 | 报表设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | POS 报表配置（班次回顾、经理日结）+ 相关报表专题 | 总报表字段单独成组 |",
  "| **Square** | 报告日时间范围、日终报告字段（打印在报告上） | 基础口径与报表字段分轨 |",
  "| **Clover** | 报表偏好（报表时间）+ 自定义报表 | 基础口径组先于专题报表 |",
  "| **Peblla** | 报表设置（营业时段、字段与排序）+ 交易/销售概览报表 | 总报表字段组 + 专题分析组 |",
  "| **Snackpass** | 报表与第三方平台汇总 | 导出能力纳入基础口径组 |",
  "",
  "### 2.1 报表设置三维（商户心智）",
  "",
  "```text",
  "报表基础口径与导出 → 总报表字段与核算项 → 专题分析报表",
  "```",
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
  "| 报表基础口径与导出 | 基本设置、数据管理（打印收据） |",
  "| 总报表字段与核算项 | 报表界面、总报表 |",
  "| 专题分析报表 | 分析（销售/工资）、现金折扣报表 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-reports-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 报表中心 → 设置（`/reports/settings`）验证",
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
  "- 23 条全部保留；`seq` 与终版表行号一致。",
  "- 本次仅重组报表中心设置导航，不改变报表业务页（销售汇总/商品报表/员工报表）结构。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
