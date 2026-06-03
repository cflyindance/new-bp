/**
 * 生成 docs/项目文档/系统设置-设置二级导航重设计方案.md
 * 运行：node scripts/generate-system-settings-design-doc.mjs
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
const outPath = path.join(projectDocs, "系统设置-设置二级导航重设计方案.md");

const HUB = "系统设置";

const titles = {
  "language-localization": "语言与本地化",
  "ui-operation-preferences": "界面与操作偏好",
  "map-address-services": "地址与地图服务",
  "data-maintenance-backup": "数据维护与备份",
  "advanced-service-switches": "高级服务与运行模式",
};

const reasons = {
  "language-localization":
    "店员端（POS）系统默认界面语言（109）；C 端界面语言（652/653）归前厅 `guest-facing-locale`。",
  "ui-operation-preferences":
    "默认界面、时间制式、菜单模式等日常操作体验偏好；对标 Clover 的通用偏好设置。",
  "map-address-services":
    "地址自动填充与地图服务开关；对标门店信息与地址服务能力。",
  "data-maintenance-backup":
    "交易清理与数据备份，聚焦系统运维与安全回滚。",
  "advanced-service-switches":
    "测试模式、操作记录、公开接口、云等位与心跳上报等高级开关；对标系统级高级配置项。",
};

/** seq → groupKey（系统设置 catalog 条） */
const assignMap = {
  "language-localization": [109],
  "ui-operation-preferences": [165, 168, 174],
  "map-address-services": [182, 183],
  "data-maintenance-backup": [422, 423],
  "advanced-service-switches": [187, 188, 189, 190, 191, 192, 344],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("语言")) return "语言";
  if (t.includes("地图") || t.includes("地址")) return "地图";
  if (t.includes("备份") || t.includes("清除")) return "数据维护";
  if (t.includes("模式") || t.includes("服务") || t.includes("心跳") || t.includes("接口")) return "高级服务";
  if (t.includes("默认") || t.includes("24小时") || t.includes("菜单模式")) return "偏好";
  return "系统";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), HUB).filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = [
  "language-localization",
  "ui-operation-preferences",
  "map-address-services",
  "data-maintenance-backup",
  "advanced-service-switches",
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
  "# 系统设置 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.1（已确认）  ",
  "> 数据范围：系统设置 catalog **15** 条（终版归属系统 19 条；652/653 跨 hub 至前厅、513/514 去重见前厅 §3.10）  ",
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
  "| 二级分组数 | **约 6 组** / 19 条 | 基本设置、高级设置、语言、多语言、数据管理并列，口径不统一 |",
  "| 内容混排 | 语言项与服务开关项同层 | 商户难区分日常偏好与运维配置 |",
  "| 运维项分散 | 备份/清除与心跳/接口分散 | 排障与维护路径不连续 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **5 组**；catalog **15** 条（C 端语言 652/653 展示于前厅，见前厅 §3.10）",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（系统设置维度）",
  "",
  "| 竞品 | 系统设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Square** | 账户偏好（语言/时区）+ 登录安全 + 通知 | 语言与偏好独立组 |",
  "| **Clover** | 通知偏好、报表偏好、时区、订单偏好 | 偏好配置与高级服务分层 |",
  "| **Snackpass** | 店铺时区、敏感操作安全校验 | 基础偏好与安全运维分开 |",
  "| **Peblla** | 时区与系统级开关分离 | 系统级高级开关单独组 |",
  "| **Toast** | 门店信息、沟通偏好、系统总览 | 地址/地图与系统偏好分轨 |",
  "",
  "### 2.1 系统设置五维（商户心智）",
  "",
  "```text",
  "语言与本地化 → 界面与操作偏好 → 地址与地图服务 → 数据维护与备份 → 高级服务与运行模式",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（5 组）",
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
push(
  `| | **合计** | | **${total}** | |`,
  "",
  "### 3.1 v1.1 语言项迁出（已确认）",
  "",
  "| seq | 处理 | 说明 |",
  "|-----|------|------|",
  "| 652、653 | 前厅 · `guest-facing-locale` | C 端（eMenu/Kiosk/客显）界面语言 SSOT；`settings-hub-override.mjs` |",
  "| 513、514 | catalog 不展示 | 与 652/653 重复 |",
  "",
  "本 hub **语言与本地化** 仅保留 **109**（店员 POS 系统默认语言）。",
  "",
  "---",
  "",
  "## 4. 分类结果明细",
  "",
);

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
  "| 语言与本地化 | 系统默认语言（109）；652/653 见前厅食客端·界面语言 |",
  "| 界面与操作偏好 | 基本设置（默认主界面、24小时制、菜单模式） |",
  "| 地址与地图服务 | 地图 |",
  "| 数据维护与备份 | 数据管理（清除交易、备份数据） |",
  "| 高级服务与运行模式 | 高级设置、系统功能高级设置、云等位与公开接口服务 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-system-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 系统设置 → 设置验证",
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
  "- 19 条全部保留；`seq` 与终版表行号一致。",
  "- 本次仅重组系统设置二级导航，不改系统设置总揽与业务入口。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
