/**

 * 生成 docs/项目文档/财务中心-设置二级导航重设计方案.md

 * 运行：node scripts/generate-finance-settings-design-doc.mjs

 */

import fs from "node:fs";

import path from "node:path";

import { fileURLToPath } from "node:url";

import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";

import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";

import { INTRA_GROUP_SORT_BY_SEQ } from "./lib/settings-intra-group-sort.mjs";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, "..", "..");

const projectDocs = path.join(root, "docs", "项目文档");

const sourcePath = path.join(projectDocs, "配置归类-终版.md");

const outPath = path.join(projectDocs, "财务中心-设置二级导航重设计方案.md");



const HUB = "财务中心";



const titles = {

  "cash-drawer-reconciliation": "钱箱与现金平账",

  "daily-close-settlement": "日结与结算",

  "fees-tips-expense": "费用折扣与小费支出",

};



const reasons = {

  "cash-drawer-reconciliation":

    "现金内控策略 SSOT：开班备款（含可选硬币卷）、平账容差与超差提醒；对标 Clover/Square 现金抽屉班次平账规则。",

  "daily-close-settlement":

    "每日日结（现金班结）开关、班结界面展示与完成后现金报表；卡 Batch 调度见支付中心。",

  "fees-tips-expense":

    "现金付费折扣与小费支出等财务费用项；对标 Peblla/Toast 的折扣与小费财务核算。",

};



/** seq → groupKey（财务中心设置 catalog 9 条可见；64 合并进 63；449/450 迁业务页） */

const assignMap = {

  "cash-drawer-reconciliation": [63, 76, 181],

  "daily-close-settlement": [171, 65, 330],

  "fees-tips-expense": [305, 451, 307],

};



const assign = new Map();

for (const [key, seqs] of Object.entries(assignMap)) {

  for (const seq of seqs) assign.set(seq, key);

}



function inferArea(nav, mod, title) {

  const t = `${nav}${mod}${title}`;

  if (t.includes("钱箱") || t.includes("平账")) return "平账";

  if (t.includes("结算")) return "结算";

  if (t.includes("记录")) return "审计";

  if (t.includes("折扣") || t.includes("小费")) return "费用";

  return "财务";

}



function sceneSummary(scene) {

  const s = scene && scene !== "（未填写）" ? scene : "—";

  return s.length > 80 ? `${s.slice(0, 77)}...` : s;

}



function sortInGroup(a, b) {

  const sa = INTRA_GROUP_SORT_BY_SEQ.get(a.seq) ?? a.seq + 100000;

  const sb = INTRA_GROUP_SORT_BY_SEQ.get(b.seq) ?? b.seq + 100000;

  return sa - sb || a.seq - b.seq;

}



const md = fs.readFileSync(sourcePath, "utf8");

const allRows = filterRowsForSettingsHub(parseConfigMd(md), HUB);

const rows = allRows.filter((r) => !isSettingsCatalogExcluded(r.seq));

const order = [

  "cash-drawer-reconciliation",

  "daily-close-settlement",

  "fees-tips-expense",

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

  "# 财务中心 · 设置二级导航重设计方案",

  "",

  "> 文档版本：v1.3  ",

  `> 数据范围：财务中心设置 catalog **${rows.length}** 条可见（终版 hub **${allRows.length}** 条；**64** 合并进 **63**；**449/450** 迁业务页）  `,

  "> 语义细则：`docs/项目文档/财务中心-日结与结算-语义重设计方案.md`  ",

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

  "| 二级分组数 | **8 组** / 11 条 | 几乎一条一组（付款记录/钱箱记录/小费支出） |",

  "| 主流程断裂 | 钱箱、日结、记录、费用混排 | 无法按财务关账流程逐步配置 |",

  "| 命名来源 | 旧模块直出 | 商户难理解哪些属于平账，哪些属于费用核算 |",

  "",

  "### 1.2 设计目标",

  "",

  "- 二级导航收敛为 **3 组**（策略配置），匹配餐饮门店财务关账流程",

  "- v1.1：**钱箱组**收窄为内控策略；**班结 UX** 与 **日结** 同组",

  "- v1.2：**171** 语义定稿，与支付中心 Batch 调度去重",

  "- v1.3：**449/450** 自设置迁出 → 财务滑层一级「收银记录与审计」+ 三级查询子页（方案 A）",

  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",

  "- **不修改** `配置归类-终版.md` 原文",

  "",

  "---",

  "",

  "## 2. 竞品对照（财务/结算设置维度）",

  "",

  "| 竞品 | 财务设置组织方式 | 本项目借鉴 |",

  "|------|------------------|------------|",

  "| **Clover** | 财务下含结算、对账单、支付记录、结算设置 | 结算与记录审计分轨 |",

  "| **Square** | 账单结算、报告日结算时间、现金/小费核算字段 | 钱箱平账与日结分组 |",

  "| **Peblla** | 结算时间、支付记录、打款对账、批次结算时间 | 日结结算独立组 |",

  "| **Snackpass** | 结算周期、账单记录、支付处理 | 财务流程按“结算→记录→账单”拆分 |",

  "| **Toast** | 日结报表与支付财务项关联 | 结算后自动打印报表单独归日结组 |",

  "",

  "### 2.1 财务设置三维 + 收银稽核业务页",

  "",

  "```text",

  "设置：钱箱与现金平账 → 日结与结算 → 费用折扣与小费支出",

  "业务：收银记录与审计（449 POS 付款流水 / 450 钱箱登入退出记录）",

  "```",

  "",

  "---",

  "",

  "## 3. 推荐二级导航结构（设置 3 组）",

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

  for (const r of [...by.get(k)].sort(sortInGroup)) {

    push(`| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`);

  }

  push("");

}



push(

  "### 4.5 合并项（catalog 不单独展示）",

  "",

  "| seq | 并入 | 说明 |",

  "|-----|------|------|",

  "| 64 | 63 | 硬币卷数量为开班备款可选明细，非独立业务能力 |",

  "",

  "---",

  "",

  "## 5. v1.1 语义调整摘要",

  "",

  "| seq | 调整 | 说明 |",

  "|-----|------|------|",

  "| 64 | **合并 → 63** | catalog 排除；UI 在 63 下提供可选硬币卷折叠区 |",

  "| 65 | **迁入 daily-close-settlement** | 班结界面展示，与日结打印 330 同链：171 → 65 → 330 |",

  "| 63 / 76 / 181 | **保留于 cash-drawer-reconciliation** | 备款 + 容差 + 超差提醒三角 |",

  "",

  "**组内排序**",

  "",

  "- 钱箱与现金平账：`63 → 76 → 181`",

  "- 日结与结算：`171 → 65 → 330`",

  "",

  "---",

  "",

  "## 6. v1.3 收银记录与审计迁出（方案 A）",

  "",

  "| 项 | 说明 |",

  "|----|------|",

  "| 滑层结构 | 财务中心二级滑层分 **业务段** + **设置段**（同会员/预约中心） |",

  "| 一级入口 | 「收银记录与审计」可展开，子项 449 / 450 |",

  "| 主区布局 | 三级侧栏 + 占位列表页（`finance-register-audit-pages.ts`） |",

  "| 设置 catalog | **449/450 排除**；设置剩 3 组 9 条 |",

  "",

  "---",

  "",

  "## 7. v1.2 日结与结算语义定稿",

  "",

  "详见 **`财务中心-日结与结算-语义重设计方案.md`**。摘要：",

  "",

  "| seq | 定稿语义 |",

  "|-----|----------|",

  "| 171 | **启用每日日结（现金班结：即每日结算）**；≠ 238 关账时刻、≠ 230 到账周期 |",

  "| 65 | 班结界面展示系统现金销售额；依赖 171 |",

  "| 330 | 班结后自动打印现金报表；依赖 171；≠ 235 Batch 后打印 |",

  "",

  "---",

  "",

  "## 8. 与旧分组对照",

  "",

  "| 新 groupTitle | 吸收的旧分组 |",

  "|---------------|--------------|",

  "| 钱箱与现金平账 | 钱箱管理、系统安全、现金平账 |",

  "| 日结与结算 | 基本设置（每日结算）、现金备款/结算报表、班结展示（65） |",

  "| 费用折扣与小费支出 | 其他（现金付费折扣）、小费支出 |",

  "",

  "**迁出设置 → 财务滑层业务页**",

  "",

  "| seq | 标题 | 路由 | 说明 |",

  "|-----|------|------|------|",

  "| 449 | POS 付款流水 | `/finance/register-audit/payments` | 只读查询；≠ 收支流水全店视角 |",

  "| 450 | 钱箱登入退出记录 | `/finance/register-audit/cash-drawer` | 只读审计；容差规则见设置 · 钱箱 |",

  "",

  "---",

  "",

  "## 9. 邻域边界（不迁入本 hub 组）",

  "",

  "| seq | 标题 | 归属 | 关系 |",

  "|-----|------|------|------|",

  "| 1 | 钱箱开关 | 硬件管理中心 | 设备能力 |",

  "| 254/255 | 刷卡/付现自动开钱箱 | 硬件管理中心 | 支付完成动作 |",

  "| 238/230/235 | Batch 关账/周期/后打印 | 支付中心 | 卡收单调度 |",

  "| 319/320 | 总报表平账字段 | 报表中心 | 输出层 |",

  "| 369 | 允许开钱箱的员工 | 权限管理中心 | 授权 |",

  "",

  "---",

  "",

  "## 10. 落地步骤",

  "",

  "1. 运行 `node scripts/apply-finance-settings-mapping.mjs`",

  "2. `cd admin-web && npm run build:settings-catalog`",

  "3. `node scripts/generate-finance-settings-design-doc.mjs`",

  "4. 财务中心滑层：验证「收银记录与审计」子页 + `/finance/settings` 无 449/450",

  "",

  "### 10.1 映射表（CSV，仅设置项）",

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

  "## 11. 边界说明",

  "",

  "- 终版 **12** 条 hub 行保留；设置 catalog **9** 条可见（**64** 合并进 **63**；**449/450** 迁业务页）。",

  "- `seq` 与终版表行号一致；**64** 存储键保留供 UI 合并读取。",

  "- **451** 小费支出流水仍留「费用折扣与小费支出」，不并入收银稽核。",

  "",

);



fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Wrote ${outPath} (${rows.length} visible, ${allRows.length} hub rows, ${order.length} groups)`);

