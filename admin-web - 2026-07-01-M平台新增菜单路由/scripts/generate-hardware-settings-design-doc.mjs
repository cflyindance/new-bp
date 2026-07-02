/**
 * 生成 docs/项目文档/硬件管理中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-hardware-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "硬件管理中心-设置二级导航重设计方案.md");

const HUB = "硬件管理中心";

const titles = {
  "device-integration-basics": "设备接入与基础外设",
  "printer-output-devices": "打印机与输出设备",
  "cash-payment-terminals": "钱箱与支付终端",
  "client-device-binding": "终端设备绑定与区域",
  "fiscal-bluetooth": "税控与蓝牙外设",
  "emenu-device-display": "eMenu设备与展示模式",
};

const reasons = {
  "device-integration-basics":
    "来电显示、等位打印、奶茶机对接及基础外设启用能力；对标 Toast/Square 设备中心的基础接入层。",
  "printer-output-devices":
    "打印机主档、语言、多语言名称、备用打印机与收据打印策略；对标 Peblla/Square 打印机配置文件。",
  "cash-payment-terminals":
    "钱箱开闭、钱箱绑定、支付终端参数、PINPad小费签名与Paypad打印；对标 Clover/Square 支付终端配置。",
  "client-device-binding":
    "客户端设备绑定、区域配置与设备清单；对标 Square 设备管理中的设备绑定模型。",
  "fiscal-bluetooth":
    "税控机配置与蓝牙设备列表；满足合规与外设连接需求。",
  "emenu-device-display":
    "eMenu设备绑定桌子、菜单组展示与展示模式；对标 Kiosk/自助终端展示策略。",
};

/** seq → groupKey（硬件管理中心 82 条） */
const assignMap = {
  "device-integration-basics": [1, 11, 15, 184, 185, 228, 379, 380, 381, 382, 383],
  "printer-output-devices": [
    352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 372, 373, 374, 375, 376, 385, 386, 387, 388, 389,
    391, 393, 394, 395, 498, 499,
  ],
  "cash-payment-terminals": [
    254, 255, 364, 365, 366, 367, 368, 377, 390, 392, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 668, 669,
    670,
  ],
  "client-device-binding": [370, 371, 378, 384, 550],
  "fiscal-bluetooth": [406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416],
  "emenu-device-display": [559, 560, 561, 562],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("打印机") || t.includes("收据")) return "打印";
  if (t.includes("钱箱") || t.includes("支付终端") || t.includes("PINPad") || t.includes("Paypad")) return "支付终端";
  if (t.includes("税控") || t.includes("蓝牙")) return "税控/蓝牙";
  if (t.includes("eMenu")) return "eMenu";
  if (t.includes("设备绑定") || t.includes("设备管理") || t.includes("区域")) return "设备绑定";
  if (t.includes("来电显示") || t.includes("奶茶机") || t.includes("等位")) return "接入";
  return "硬件";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const order = [
  "device-integration-basics",
  "printer-output-devices",
  "cash-payment-terminals",
  "client-device-binding",
  "fiscal-bluetooth",
  "emenu-device-display",
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
  "# 硬件管理中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 硬件管理中心** 共 **82** 条功能设置  ",
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
  "| 二级分组数 | **多来源分组** / 82 条 | 打印机、钱箱、终端、税控、eMenu、对接混排 |",
  "| 大组分散 | 客户端设置与默认设备设置并列 | 用户难判断是“设备主档”还是“默认路由” |",
  "| 专业项穿插 | 税控机/串口/Marketman 与日常收银设备并列 | 普通门店难快速定位常用配置 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **6 组**，覆盖 82 条，贴合餐饮门店硬件部署流程",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（硬件/设备设置维度）",
  "",
  "| 竞品 | 硬件设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | 设备中心 + 打印机与钱箱 + KDS | 设备接入与打印/收银分轨 |",
  "| **Square** | 设备管理、设备代码、打印机配置文件、Kiosk设备 | 设备绑定、打印、Kiosk展示分层 |",
  "| **Clover** | 设备与打印机、订单打印设备、支付终端偏好 | 钱箱与支付终端独立组 |",
  "| **Peblla** | 打印机（厨房/标签/取餐）+ 设备列表 + 读卡器 | 打印输出设备单独成组 |",
  "| **Snackpass** | 设备、Kiosk设备设置、硬件保修 | eMenu/Kiosk场景独立展示组 |",
  "",
  "### 2.1 硬件设置六维（商户心智）",
  "",
  "```text",
  "设备接入与基础外设 → 打印机与输出设备 → 钱箱与支付终端 → 终端设备绑定与区域 → 税控与蓝牙外设 → eMenu设备与展示模式",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（6 组）",
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
  "| 设备接入与基础外设 | 相关设备（来电显示/等位/高级设置）、Partner Integration、客户端设置（外设启用） |",
  "| 打印机与输出设备 | 打印机设置、默认设备设置（打印路由）、服务设置收据 |",
  "| 钱箱与支付终端 | 钱箱设置、支付相关钱箱、支付终端、Paypad打印设置 |",
  "| 终端设备绑定与区域 | 客户端设置（设备绑定）、设备管理 |",
  "| 税控与蓝牙外设 | 税控机、蓝牙设备管理 |",
  "| eMenu设备与展示模式 | eMenu 设备管理/菜单展示 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-hardware-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 硬件管理中心 → 设置验证",
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
  "- 82 条全部保留；`seq` 与终版表行号一致。",
  "- 税控与串口参数集中在“税控与蓝牙外设”，建议后续仅管理员可见。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
