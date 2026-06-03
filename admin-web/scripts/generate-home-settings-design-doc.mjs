/**
 * 生成 docs/项目文档/主页-设置二级导航重设计方案.md
 * 运行：node scripts/generate-home-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "主页-设置二级导航重设计方案.md");

const HUB = "主页";

const titles = {
  "home-entry-display": "主页入口与展示",
  "idle-screensaver": "待机屏保",
};

const reasons = {
  "home-entry-display":
    "控制品牌页是否作为首页入口，影响门店操作员开机后的首屏路径；对标 Toast/Square 的首页入口偏好。",
  "idle-screensaver":
    "控制设备空闲时的屏保显示策略，保障门店前台终端的品牌一致性与防烧屏需求；对标 Clover/Snackpass 终端待机展示。",
};

/** seq → groupKey（主页 2 条） */
const assignMap = {
  "home-entry-display": [531],
  "idle-screensaver": [551],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("品牌")) return "首页入口";
  if (t.includes("屏保")) return "待机展示";
  return "主页";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = ["home-entry-display", "idle-screensaver"];

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
  "# 主页 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 主页** 共 **2** 条功能设置  ",
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
  "| 二级分组数 | **2 组** / 2 条 | 虽条数少，但组名语义弱（展示设置/屏保） |",
  "| 场景表达 | 主页入口与待机展示并列 | 缺少“开机入口”与“空闲状态”语义区分 |",
  "| 可扩展性 | 后续若增加首页卡片配置 | 现有组名难容纳新增项 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航保持 **2 组**，但按餐饮终端使用场景重命名",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（主页/概览设置维度）",
  "",
  "| 竞品 | 首页/概览设置组织方式 | 本项目借鉴 |",
  "|------|----------------------|------------|",
  "| **Square** | 经营概览入口与多模块概览页 | 首页入口偏好单独表达 |",
  "| **Clover** | 概览页结合设备显示策略 | 入口与设备待机展示分轨 |",
  "| **Snackpass** | 概览 + Kiosk 屏幕素材管理 | 屏保应明确归待机展示类 |",
  "| **Peblla** | 销售概览 + 社媒主页入口配置 | 首页入口属于品牌触点的一部分 |",
  "| **Toast** | 门店首页与运营概览分层 | 操作入口语义需清晰 |",
  "",
  "### 2.1 主页设置两维（商户心智）",
  "",
  "```text",
  "主页入口与展示 → 待机屏保",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（2 组）",
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
  "| 主页入口与展示 | 展示设置（品牌作为首页） |",
  "| 待机屏保 | 屏保 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-home-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 主页 → 设置（`/dashboard/settings`）验证",
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
  "- 2 条全部保留；`seq` 与终版表行号一致。",
  "- `seq 346`（主页密码权限）隶属权限管理中心，不在本次主页设置范围。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
