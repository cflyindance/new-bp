/**
 * 生成 docs/项目文档/预约等位中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-reservation-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "预约等位中心-设置二级导航重设计方案.md");

const HUB = "预约等位中心";

const titles = {
  "waitlist-queue-rules": "等位排队规则",
  "caller-screen-display": "叫号屏与显示策略",
  "reservation-automation": "预约提醒与自动化",
};

const reasons = {
  "waitlist-queue-rules":
    "控制是否开启等位模式、按团体人数分队与团体标识；对标 Toast「等位政策/线上等位」与 Peblla「排队与预约」。",
  "caller-screen-display":
    "叫号屏开关、显示时长、数量上限、付款后移除等屏显规则；对标 Toast「等位叫号」与门店现场屏展示配置。",
  "reservation-automation":
    "预约提前提醒与自动填充策略；对标 Toast「订位提醒」与预约流程自动化配置。",
};

/** seq → groupKey（预约等位中心 12 条） */
const assignMap = {
  "waitlist-queue-rules": [12, 13, 14, 529],
  "caller-screen-display": [2, 3, 4, 5, 6, 7],
  "reservation-automation": [341, 342],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("叫号屏")) return "叫号屏";
  if (t.includes("团体") || t.includes("等位")) return "排队";
  if (t.includes("提醒")) return "提醒";
  if (t.includes("自动")) return "自动化";
  return "预约";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = ["waitlist-queue-rules", "caller-screen-display", "reservation-automation"];

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
  "# 预约等位中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 预约等位中心** 共 **12** 条功能设置  ",
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
  "| 二级分组数 | **4 组** / 12 条 | `叫号屏` 6 条集中，`等位` 3 条与 `产品对接` 分离 |",
  "| 命名来源 | 旧模块直出 | 预约提醒与排队策略边界不清晰 |",
  "| 商户路径 | 现场叫号与线上预约混看 | 难按“排队规则→屏显策略→预约自动化”顺序配置 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **3 组**，覆盖 12 条，符合门店预约/等位运维场景",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（预约/等位设置维度）",
  "",
  "| 竞品 | 预约/等位组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | 等位与订位分轨：等位政策、线上等位、订位提醒/模板、第三方集成 | 排队规则、屏显叫号、预约提醒三轨分组 |",
  "| **Peblla** | 排队与预约、预约订单设置（启用、天数） | 预约提醒与自动化单列 |",
  "| **Square** | 预约流程与顾客触点配置 | 屏显与顾客提醒边界清晰 |",
  "| **Clover** | 预约点餐与排班能力 | 预约配置从排队规则中独立 |",
  "| **Snackpass** | 配送/取号等队列与顾客通知能力 | 等位入口/模式开关单列 |",
  "",
  "### 2.1 预约等位设置三维（商户心智）",
  "",
  "```text",
  "等位排队规则 → 叫号屏与显示策略 → 预约提醒与自动化",
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
  "| 等位排队规则 | 等位、产品对接（等位模式） |",
  "| 叫号屏与显示策略 | 叫号屏 |",
  "| 预约提醒与自动化 | Default（预约消息提前提醒、自动填充） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-reservation-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 预约等位中心 → 设置（`/operations/reservations/settings`）验证",
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
  "- 12 条全部保留；`seq` 与终版表行号一致。",
  "- 本次不改等位主业务页（Waitlist/RSV/History/Section），仅优化设置二级导航。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
