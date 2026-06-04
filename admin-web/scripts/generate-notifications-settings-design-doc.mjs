/**
 * 生成 docs/项目文档/消息中心-设置二级导航重设计方案.md
 * 运行：node admin-web/scripts/generate-notifications-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "消息中心-设置二级导航重设计方案.md");

const HUB = "消息中心";

const titles = {
  "notification-basics": "通知基础与渠道",
  "staff-order-alerts": "店内员工订单提醒",
  "customer-order-sms": "顾客短信与取餐通知",
};

const reasons = {
  "notification-basics":
    "消息主题与语音提醒等全局基础能力；对标 Clover/Square 的通知偏好与通道总开关。",
  "staff-order-alerts":
    "eMenu→POS 新单/追单及指定菜品跟单等**店内员工消息**（不发顾客短信）；桌边呼叫能力在前厅，员工 Service Request 须在主题中勾选。",
  "customer-order-sms":
    "点单完成/取餐等**发给顾客手机**的短信渠道与文案模板；与员工店内提醒分轨，避免误配。",
};

/** seq → groupKey（消息中心 catalog） */
const assignMap = {
  "notification-basics": [331, 332],
  "staff-order-alerts": [638, 639, 637],
  "customer-order-sms": [334, 335, 336, 337, 338, 339, 340],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("短信") || t.includes("取餐") || t.includes("下单短信")) return "顾客短信";
  if (t.includes("消息通知") || t.includes("新订单") || t.includes("追加") || t.includes("指定菜品")) return "员工提醒";
  if (t.includes("语音") || t.includes("主题")) return "基础通知";
  return "消息";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), HUB).filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = ["notification-basics", "staff-order-alerts", "customer-order-sms"];

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
  "> 文档版本：v1.1  ",
  `> 数据范围：消息中心设置 catalog 共 **${rows.length}** 条；桌边呼叫 333/629/640/641 已迁前厅，630–636 已迁并至 333  `,
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
  "| 二级分组 | 原「订单与取餐通知」10 条混排 | 顾客短信模板与员工店内提醒并列，运营易误配 |",
  "| 场景标签 | 637–639 原归类「订单短信」 | 名实不符：不发短信，仅员工跟单 |",
  "| 扩展性 | 新增提醒类型时难扩展 | 需按触达对象（员工 vs 顾客）分层 |",
  "",
  "### 1.2 设计目标",
  "",
  `- 二级导航 **${order.length} 组**，员工提醒优先于顾客短信（服务员关注路径）`,
  "- 组首说明 + 场景描述区分「店内消息」与「顾客短信」",
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
  "通知基础与渠道 → 店内员工订单提醒 → 顾客短信与取餐通知",
  "```",
  "",
  "---",
  "",
  `## 3. 推荐二级导航结构（${order.length} 组）`,
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
  const sortOrder = assignMap[k];
  const sorted = [...by.get(k)].sort(
    (a, b) => sortOrder.indexOf(a.seq) - sortOrder.indexOf(b.seq) || a.seq - b.seq,
  );
  for (const r of sorted) {
    push(`| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`);
  }
  push("");
}

push(
  "---",
  "",
  "## 5. 组首文案（设置页展示）",
  "",
  "| groupKey | 组首说明要点 |",
  "|----------|----------------|",
  "| `notification-basics` | 全局主题 + 新单语音；eMenu 店内文字消息见「店内员工订单提醒」；桌边呼叫在前厅 |",
  "| `staff-order-alerts` | 仅店内员工；不发顾客短信；须启用主题 Emenu；非桌边呼叫 |",
  "| `customer-order-sms` | 仅顾客手机短信；渠道 + ASAP/预点单/配送文案 |",
  "",
  "---",
  "",
  "## 6. 与旧分组对照",
  "",
  "| 新 groupTitle | 吸收的旧分组 |",
  "|---------------|--------------|",
  "| 通知基础与渠道 | 消息中心（主题、语音） |",
  "| 店内员工订单提醒 | 消息通知（638/639/637） |",
  "| 顾客短信与取餐通知 | 消息中心（334–340 短信模板/渠道） |",
  "| （已迁出） | 呼叫服务员系列 → 前厅 · 桌边·呼叫服务员 |",
  "",
  "---",
  "",
  "## 7. 落地步骤",
  "",
  "1. 运行 `node admin-web/scripts/apply-notifications-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 可选：`node admin-web/scripts/generate-notifications-settings-design-doc.mjs` 同步本文档",
  "4. 消息中心 → 设置（`/notifications/settings`）验证组首说明与开关",
  "",
  "### 7.1 映射表（CSV）",
  "",
  "```csv",
  "seq,groupTitle,groupKey",
);

for (const k of order) {
  for (const seq of assignMap[k]) {
    lines.push(`${seq},${titles[k]},${k}`);
  }
}

push(
  "```",
  "",
  "---",
  "",
  "## 8. 边界说明",
  "",
  "- catalog 条数与终版 `seq` 一致；本次仅重组消息中心设置 catalog 与文案。",
  "- 637 指定菜品列表维护入口可在菜单/前厅另设，**通知开关**保留本中心。",
  "- 桌边呼叫：前厅配置能力；员工 Service Request 提醒依赖 331 主题 + 前厅 333 类型。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
