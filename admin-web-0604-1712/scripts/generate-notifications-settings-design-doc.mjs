/**
 * 生成 docs/项目文档/消息中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-notifications-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "消息中心-设置二级导航重设计方案.md");

const HUB = "消息中心";

const titles = {
  "notification-basics": "通知基础与渠道",
  "order-pickup-messages": "订单与取餐通知",
  "service-call-alerts": "呼叫服务员与现场提醒",
};

const reasons = {
  "notification-basics":
    "消息主题与语音提醒等全局基础能力；对标 Clover/Square 的通知偏好与通知通道总开关。",
  "order-pickup-messages":
    "下单、追加、出餐、取餐相关短信模板与渠道策略；对标 Toast「可取餐短信」与 Snackpass 订单短信通知。",
  "service-call-alerts":
    "食客呼叫服务员事项、频率与开单前限制；对标 Toast POS 服务提醒与店内实时通知能力。",
};

/** seq → groupKey（消息中心 23 条） */
const assignMap = {
  "notification-basics": [331, 332],
  "order-pickup-messages": [334, 335, 336, 337, 338, 339, 340, 638, 639],
  "service-call-alerts": [333, 629, 630, 631, 632, 633, 634, 635, 636, 637, 640, 641],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("短信") || t.includes("取餐") || t.includes("下单") || t.includes("订单")) return "订单短信";
  if (t.includes("呼叫服务员") || t.includes("加水") || t.includes("加餐具") || t.includes("点酒水")) return "服务呼叫";
  if (t.includes("语音") || t.includes("主题")) return "基础通知";
  if (t.includes("时间间隔") || t.includes("未开单")) return "呼叫规则";
  return "消息";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = ["notification-basics", "order-pickup-messages", "service-call-alerts"];

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
  "# 消息中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 消息中心** 共 **23** 条功能设置  ",
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
  "| 二级分组数 | **2 组** / 23 条 | `消息中心` 10 条与 `消息通知` 13 条边界模糊 |",
  "| 内容混排 | 订单短信模板与呼叫服务员开关并列 | 运营人员难定位“顾客消息”vs“店内提醒” |",
  "| 扩展性 | 新增提醒类型时难扩展 | 需要按场景分层组织 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航重组为 **3 组**，覆盖 23 条，符合餐饮门店消息链路",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（消息/通知设置维度）",
  "",
  "| 竞品 | 消息通知组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | POS 通知、服务提醒、订位等位短信模板分轨 | 订单短信与店内服务提醒拆分 |",
  "| **Square** | 通知中心按邮件/短信/推送与业务事件分类 | 通知基础与业务通知分层 |",
  "| **Clover** | 通知偏好（邮箱/短信）+ 库存/交易提醒 | 全局通知渠道独立组 |",
  "| **Peblla** | 订单短信、消息通知、邮件通知并行 | 订单触达与管理通知分轨 |",
  "| **Snackpass** | 短信通知与店内屏提醒分离 | 订单通知与现场服务提醒分轨 |",
  "",
  "### 2.1 消息设置三维（商户心智）",
  "",
  "```text",
  "通知基础与渠道 → 订单与取餐通知 → 呼叫服务员与现场提醒",
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
  "| 通知基础与渠道 | 消息中心（主题、语音） |",
  "| 订单与取餐通知 | 消息中心（短信模板/渠道）+ 消息通知（新订单/追加） |",
  "| 呼叫服务员与现场提醒 | 消息中心（服务类型）+ 消息通知（呼叫服务员系列） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-notifications-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 消息中心 → 设置（`/notifications/settings`）验证",
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
  "- 本次仅重组消息中心设置，不改消息中心主业务页。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
