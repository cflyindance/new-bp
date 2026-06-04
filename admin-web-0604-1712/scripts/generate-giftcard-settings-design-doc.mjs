/**
 * 生成 docs/项目文档/礼品卡中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-giftcard-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "礼品卡中心-设置二级导航重设计方案.md");

const HUB = "礼品卡中心";

const titles = {
  "giftcard-rules": "礼品卡规则与参数",
  "giftcard-channels": "电子礼品卡渠道",
};

const reasons = {
  "giftcard-rules":
    "覆盖礼品卡金额、售价、有效期、查询方式等核心规则；对标 Toast/Square「礼品卡设置」中的基础参数配置。",
  "giftcard-channels":
    "覆盖 E-Card 渠道化礼品卡能力；对标 Square/Snackpass 的电子礼品卡销售与分发渠道。",
};

/** seq → groupKey（礼品卡中心 5 条） */
const assignMap = {
  "giftcard-rules": [16, 17, 18, 19],
  "giftcard-channels": [478],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("E-Card")) return "电子礼品卡";
  if (t.includes("金额") || t.includes("价格")) return "金额价格";
  if (t.includes("有效期")) return "有效期";
  if (t.includes("查询")) return "查询";
  return "规则";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = ["giftcard-rules", "giftcard-channels"];

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
  "# 礼品卡中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 礼品卡中心** 共 **5** 条功能设置  ",
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
  "| 二级分组数 | **2 组** / 5 条 | 语义弱：`礼品卡设置` 与 `E-Card礼品卡` 命名口径不统一 |",
  "| 规则可读性 | 金额、售价、有效期、查询方式集中在单组 | 缺少“基础规则”语义，不利于新商户理解 |",
  "| 渠道边界 | 电子礼品卡单独一条 | 应明确为“渠道能力”，与基础规则分轨 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航保持 **2 组**，但用行业语义重命名，覆盖 5 条",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（礼品卡设置维度）",
  "",
  "| 竞品 | 礼品卡设置组织方式 | 本项目借鉴 |",
  "|------|--------------------|------------|",
  "| **Toast** | 礼品卡设置 + 转移余额 + 购买查询入口 | 基础规则与扩展能力分层 |",
  "| **Square** | 实体/电子礼品卡分轨，金额、政策、第三方集成独立 | 将 E-Card 视为渠道化能力 |",
  "| **Snackpass** | 数字/实体礼品卡销售与门店可用范围配置 | 基础规则先行，渠道能力后置 |",
  "| **Peblla** | 礼品卡交易与会员体系联动 | 礼品卡规则需与会员/支付中心边界清晰 |",
  "| **Clover** | 礼品卡基础能力嵌入支付体系 | 本中心聚焦礼品卡参数与渠道，不重复支付细则 |",
  "",
  "### 2.1 礼品卡设置两维（商户心智）",
  "",
  "```text",
  "礼品卡规则与参数 → 电子礼品卡渠道",
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
  "| 礼品卡规则与参数 | 礼品卡设置 |",
  "| 电子礼品卡渠道 | E-Card礼品卡 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-giftcard-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 礼品卡中心 → 设置（`/gift-cards/settings`）验证",
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
  "- 5 条全部保留；`seq` 与终版表行号一致。",
  "- 本次仅重组礼品卡中心设置分组，不调整 Cards 主业务页逻辑。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
