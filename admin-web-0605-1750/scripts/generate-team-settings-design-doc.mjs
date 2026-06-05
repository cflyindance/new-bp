/**
 * 生成 docs/项目文档/团队管理-设置二级导航重设计方案.md
 * 运行：node scripts/generate-team-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "团队管理-设置二级导航重设计方案.md");

const titles = {
  scheduling: "排班",
  "time-attendance": "考勤与工时",
  "payroll-tips": "薪酬与小费",
};

const reasons = {
  scheduling:
    "排班表及打卡与排班联动；对标 Toast「Sling 排班 / 排班规则执行」、Snackpass「团队」排班能力。",
  "time-attendance":
    "强制休息、最长工时、开收工、打卡小票等工时规则；对标 Toast「考勤管理 / 排班规则执行」宽限与 Clover 工时。",
  "payroll-tips":
    "小费分配基数、分摊比例、工资/小费计算标准；对标 Toast「小费池政策 / 薪酬」、Clover 小费与薪酬配置。",
};

const EXCLUDED_TEAM_SETTING_SEQS = new Set([425, 427, 437]);

/** seq → groupKey（团队管理设置 13 条；方案B 迁出 425/427/437/78-81；241 回归考勤） */
const assignMap = {
  scheduling: [74],
  "time-attendance": [66, 67, 70, 71, 72, 73, 329, 241],
  "payroll-tips": [186, 306, 309, 310],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  if (mod.includes("对接") || mod.includes("高级") || title.includes("链接") || title.includes("同步")) return "集成";
  if (mod.includes("排班") || title.includes("排班")) return "排班";
  if (title.includes("小费") || title.includes("工资") || title.includes("薪酬")) return "薪酬";
  if (mod.includes("员工") && !mod.includes("工时")) return "档案";
  return "考勤";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), "团队管理").filter(
  (r) => !EXCLUDED_TEAM_SETTING_SEQS.has(r.seq),
);
const order = ["scheduling", "time-attendance", "payroll-tips"];

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
  "# 团队管理 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.3（241 回归考勤与工时；方案B 迁出 425/427/437，78-81→平台业务中心）  ",
  "> 数据范围：团队管理设置 catalog **13** 条（排除 425/427/437；迁出 78-81）  ",
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
  "| 二级分组数 | **3 组** / 13 条 | 组名细碎（基本设置、高级设置、报表…） |",
  "| 命名来源 | 旧「功能模块」 | 「员工工时」7 条堆在一起，难区分考勤 vs 薪酬 |",
  "| 与导航重复 | 团队滑层已有小费管理、排班等 | 设置页应偏 **规则与集成**，非重复业务操作 |",
  "| 跨 hub 项 | 分享小费、BATCH 检查、外部链接 | 需明确哪些在团队设置，哪些进支付/集成中心 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航 **3 组**，覆盖 13 条，符合「排班 → 打卡 → 算薪」心智",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（团队/员工设置维度）",
  "",
  "| 竞品 | 团队/员工设置组织方式 | 本项目借鉴 |",
  "|------|----------------------|------------|",
  "| **Toast** | 独立「员工」：档案、Sling 排班、打卡宽限、考勤、小费池、薪酬报表、POS 员工报表配置 | **排班 / 考勤 / 小费薪酬 / 集成** 分轨；档案与出勤独立 |",
  "| **Clover** | 设置→员工：角色、权限、PIN；薪酬在店铺运营 | 角色归「员工与出勤」；小费规则在团队设置（非支付战役） |",
  "| **Square** | 职员：团队、排班、时间追踪、工资单 | 与 Toast 类似五段式 |",
  "| **Peblla** | 员工、排班、第三方对接 | 对接能力可收敛到统一集成中心 |",
  "| **Snackpass** | 设置→团队：员工权限 | 本 hub 13 条偏 **规则参数**，权限矩阵在权限管理中心 |",
  "",
  "### 2.1 团队设置三维",
  "",
  "```text",
  "排班 → 考勤与工时 → 薪酬与小费",
  "```",
  "",
  "**边界**：",
  "- **权限管理中心**：功能权限、RBAC 矩阵不在此 13 条重复配置。",
  "- **团队滑层「小费管理」**：日常分配操作；本 hub「薪酬与小费」为 **计算规则/比例**。",
  "- **支付中心 BATCH**：`241`（BATCH 前检查下班卡）在本 hub **考勤与工时** 组；支付 batch 组首交叉引用。",
  "- **平台业务中心**：`78/79/80/81` 云员工与第三方排班/打卡链接迁至集成中心。",
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
    push(
      `| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`,
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
  "| 排班 | 员工排班、员工工时（打卡依赖排班） |",
  "| 考勤与工时 | 员工工时、报表（带薪休息） |",
  "| 薪酬与小费 | 分享小费、基本设置（分摊/计算标准） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 更新 `docs/项目文档/配置归类-分组映射.csv`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 团队管理 → 设置 页验证",
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
  "- 方案B：`425/427/437` 迁出团队设置，作为员工/出勤/排班业务功能页管理。",
  "- `241` 回归本 hub **考勤与工时**（BATCH 流程引用）；`78/79/80/81` 迁至平台业务中心（集成）。",
  "- 小费 **收取/分配操作** 在团队模块业务页；**基数与比例** 在本设置 hub。",
  "- 团队设置只保留团队规则参数，不承载跨系统链接配置。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
