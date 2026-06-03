/**
 * 生成 docs/项目文档/素材中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-assets-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "素材中心-设置二级导航重设计方案.md");

const HUB = "素材中心";

const titles = {
  "brand-identity-assets": "品牌标识素材",
  "screen-terminal-assets": "屏显与终端素材",
  "cover-background-assets": "封面与背景素材",
};

const reasons = {
  "brand-identity-assets":
    "统一门店品牌识别素材（LOGO、打印LOGO）；对标 Clover/Square 品牌图片与票据Logo配置。",
  "screen-terminal-assets":
    "叫号屏与客显屏专用图片素材；对标 Snackpass/Peblla 的 Kiosk/副屏媒体管理。",
  "cover-background-assets":
    "首页封面与公司封面等背景视觉素材；对标竞品的品牌首页与社媒展示封面配置。",
};

/** seq → groupKey（素材中心 7 条） */
const assignMap = {
  "brand-identity-assets": [433, 434, 556],
  "screen-terminal-assets": [430, 431],
  "cover-background-assets": [432, 555],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("LOGO")) return "LOGO";
  if (t.includes("叫号屏") || t.includes("客显屏") || t.includes("双屏")) return "屏显";
  if (t.includes("封面") || t.includes("背景")) return "封面";
  return "素材";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = ["brand-identity-assets", "screen-terminal-assets", "cover-background-assets"];

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
  "# 素材中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.1（已确认）  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 素材中心** 共 **7** 条功能设置  ",
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
  "| 二级分组数 | **4 组** / 7 条 | `图片库`、`封面图`、`LOGO` 命名口径不一致 |",
  "| 场景混排 | 屏显图片与品牌LOGO混看 | 用户难按“品牌素材 vs 屏显素材”快速定位 |",
  "| 资产链路 | 首页封面与公司封面割裂 | 背景类素材缺少统一入口 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **3 组**，覆盖 7 条，匹配餐饮品牌素材管理场景",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（素材/品牌资产维度）",
  "",
  "| 竞品 | 素材设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Snackpass** | Kiosk 视频、电子收据图片、品牌主题素材 | 屏显素材与品牌素材分轨 |",
  "| **Peblla** | 副屏媒体（图/视频）+ 广告图片 | 屏显终端素材独立组 |",
  "| **Clover** | 支付小票/应用自定义图片、Logo | 品牌标识素材统一入口 |",
  "| **Square** | 图片库与品牌展示资产 | 封面背景素材单独分组 |",
  "| **Toast** | 网站/社媒品牌信息统一配置 | 品牌资产口径统一（Logo/封面） |",
  "",
  "### 2.1 素材设置三维（商户心智）",
  "",
  "```text",
  "品牌标识素材 → 屏显与终端素材 → 封面与背景素材",
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
  "| 品牌标识素材 | 餐厅LOGO、打印Logo、LOGO |",
  "| 屏显与终端素材 | 叫号屏、双屏 |",
  "| 封面与背景素材 | 公司封面、封面/背景图 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-assets-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 素材中心 → 设置验证",
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
  "- 7 条全部保留；`seq` 与终版表行号一致。",
  "- **与前厅分工（v1.1）**：**555/556/433** 等为 Kiosk、eMenu 等 **C 端首页封面与门店 Logo** 素材维护（默认展示，无显隐开关）；**461/462** 在前厅 **`cds`（客显屏）**，为 **客显结账副屏** 专用配置，**不与本 hub 重复**。",
  "- **eMenu 品牌露出显隐**（532、612）归前厅 `guest-menu-global`，非素材换图。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
