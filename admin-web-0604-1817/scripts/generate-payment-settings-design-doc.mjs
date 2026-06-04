/**
 * 生成 docs/项目文档/支付中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-payment-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { INTRA_GROUP_SORT_BY_SEQ } from "./lib/settings-intra-group-sort.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "支付中心-设置二级导航重设计方案.md");

const titles = {
  "payment-gateway": "支付网关与受理",
  "payment-methods": "支付方式",
  "tax-rules": "税务规则",
  "tip-policy": "小费政策与计算",
  "batch-settlement": "BATCH与日结",
  "card-fees": "卡支付规则与合规",
  "checkout-tip-card-order": "小费与刷卡顺序",
  "cds-checkout-ux": "结账与交互",
};

const reasons = {
  "payment-gateway":
    "刷卡机/支付服务连接（机型、商户号、账户密码等）；全组唯一「网关/受理」配置，与手段清单分离。",
  "payment-methods":
    "seq 234「支付方式」SSOT：以支付方式为维度，每种勾选适用产线（POS/Kiosk/eMenu/Paypad）；内置六类 + 自定义；原 233/448/29/511 已合并。",
  "tax-rules":
    "结账计税引擎：445 基础税率 → 144 外卖免税 → 143 折前/折后税基 → 142 加收是否应税 → 160 服务费是否按税后基数；组内顺序即配置依赖。",
  "tip-policy":
    "小费引擎：231 收取模式 → 293/294/253 基数 → 237/493/295/296 预设与收据 → 244/232 展示与风控；493 为 Kiosk 选项类型；494/496 已并入 463。",
  "batch-settlement":
    "Batch 与日切：238 关账时刻 → 230 收单结算周期 → 236 队列上限 → 239/240 前置 → 235 后置打印；241 已归团队考勤。",
  "card-fees":
    "82 会员卡最低消费 → 242 产线信用卡最低消费 → 243 产线签名门槛 → 180 Merchantcopy 签名留存 → 454 卡付加价策略；512/543 已合并。",
  "checkout-tip-card-order":
    "seq 9 产线矩阵 SSOT：CDS / Kiosk / PayPad 各设「刷卡前/后选小费」；原 495/663 已合并。",
  "cds-checkout-ux":
    "463 小费页（含三产线 494/496 子块）→ 464 签名 → 465 结账小票 → 669 签购单；8/492/497/662/664/501/665/666/670 已合并。PayPad 见本组产线列，不再单独成组。",
};

/** seq → groupKey（支付中心 catalog，含 hub override 迁入项） */
const assignMap = {
  "payment-gateway": [229],
  "payment-methods": [234],
  "tax-rules": [445, 144, 143, 142, 160],
  "tip-policy": [231, 293, 294, 253, 237, 493, 295, 296, 266, 244, 232],
  "batch-settlement": [238, 230, 236, 239, 240, 235],
  "card-fees": [82, 242, 243, 180, 454],
  "checkout-tip-card-order": [9],
  "cds-checkout-ux": [463, 464, 465, 669],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (mod.includes("Paypad") || title.includes("Paypad")) return "Paypad";
  if (mod.includes("客显") || nav.includes("相关设备")) return "客显";
  if (mod.includes("小费") || title.includes("小费")) return "小费";
  if (mod.includes("税") || title.includes("税")) return "税务";
  if (title.includes("Batch") || title.includes("batch") || title.includes("结账") || title.includes("结算"))
    return "日结";
  if (mod.includes("信用卡") || title.includes("信用卡") || title.includes("折扣") || title.includes("定价") || mod.includes("附加"))
    return "卡费";
  if (mod.includes("收据") || title.includes("签名") || title.includes("收据")) return "交互";
  return "支付";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

function sortItemsInGroup(items) {
  return [...items].sort((a, b) => {
    const oa = INTRA_GROUP_SORT_BY_SEQ.get(a.seq);
    const ob = INTRA_GROUP_SORT_BY_SEQ.get(b.seq);
    const hasA = oa !== undefined;
    const hasB = ob !== undefined;
    if (hasA && hasB && oa !== ob) return oa - ob;
    if (hasA !== hasB) return hasA ? -1 : 1;
    return a.seq - b.seq;
  });
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), "支付中心").filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = [
  "payment-gateway",
  "payment-methods",
  "tax-rules",
  "tip-policy",
  "batch-settlement",
  "card-fees",
  "checkout-tip-card-order",
  "cds-checkout-ux",
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
  "# 支付中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v2.6  ",
  `> 数据范围：支付设置 catalog **${rows.length}** 条（**252/452/512/543** 已排除；**307** 归财务；**180** 自打印中心迁入 card-fees）  `,
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
  "| 二级分组数 | **约 18 组** / 49 条 | 「基本设置」12 条堆叠支付方式、小费、BATCH |",
  "| 小费分散 | 基本设置 / 小费 / 小费设置 / 小费 / Paypad | 计算规则与交互流程未分轨 |",
  "| 终端不清 | 客显屏、服务设置、Paypad 混排 | 商户难按 **终端** 找结账页配置 |",
  "| 重复心智 | 建议小费比例在 237 与 295 | 分属 **政策** vs **收据展示**，需组内说明 |",
  "| 结账交互混组 | 原「食客端·结账交互」12 条 | 客显 CDS 与扫码/Kiosk 结账屏混在一组，**9↔495** 等平行项易配不一致 |",
  "| 支付手段重复 | 原「支付方式与网关」6 条 | **229 网关** 与 **29/234/511 手段清单** 混组，易配不一致 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **8 组**，覆盖 41 条（设置滑层），符合「**先接谁收 → 能用什么付（按产线）** → 税/小费 → 日结 → 卡规/加价 → 客显结账（含 CDS/Kiosk/PayPad 产线列）」",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（支付/结账设置维度）",
  "",
  "| 竞品 | 支付/结账设置组织方式 | 本项目借鉴 |",
  "|------|----------------------|------------|",
  "| **Toast** | 独立「支付」：支付选项（小费/预授权/小票）、自动关账、税率、附加费 | **支付方式 / 税务 / 小费政策 / BATCH / 卡费** 五轨 + **分终端** 结账交互 |",
  "| **Clover** | 设置→支付、订单类型免税、现金折扣 | 税务与支付方式分轨 |",
  "| **Square** | 支付处理、折扣层级、履行方式支付 | 卡交易门槛与手续费独立组 |",
  "| **Peblla** | 支付设置：税费、小费、自定义支付、现金折扣、双重定价 | **税务 / 小费 / 卡费** 三段与 Peblla 对齐 |",
  "| **Snackpass** | 设置→支付、小费页；渠道支付规则 | 客显与扫码端结账交互分轨；Kiosk 支付方式入方式组 |",
  "",
  "### 2.1 支付设置八维（商户心智）",
  "",
  "```text",
  "支付网关与受理 → 支付方式 → 税务规则 → 小费政策与计算 → BATCH与日结 → 卡交易与附加费用",
  "  → 小费与刷卡顺序 → 结账与交互（三产线矩阵）",
  "```",
  "",
  "**边界**：",
  "- **前厅管理中心**：客显屏 `cds`（461/462/466 展示）；**463、465** 结账步骤 SSOT 在支付中心 **`cds-checkout-ux`**。",
  "- **团队管理**：小费 **分配比例/工资计算** 在团队设置；`241`（BATCH 前检查下班卡）在 **考勤与工时** 组。",
  "- **财务中心**：`307` 收单通道成本率（对内报表）；对客加价见 **`card-fees`**。",
  "- **平行项同步**：`9`↔`495`（小费/刷卡顺序）。",
  "- **234 支付方式**：**以支付方式为维度**，每种勾选适用产线（例：现金勾选 POS+Kiosk，会员卡仅 POS）；原 233/448/29/511 已并入。",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（8 组）",
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
  "### 3.1 版本变更",
  "",
  "| 版本 | 变更 |",
  "|------|------|",
  "| v1.2 | 463/465 迁入；241 迁入 batch-settlement |",
  "| v1.3 | 原 `guest-checkout-ux` 拆为 `cds-checkout-ux` + `guest-self-checkout-ux` |",
  "| v1.4 | 原 `payment-methods`（6 条）拆为 **`payment-gateway`**（229）+ **`payment-methods`**（234/233/448/29/511） |",
  "| v1.5 | **`payment-methods`** 合并为 seq **234**（支付方式 × 产线矩阵）；233/448/29/511 排除 |",
  "| **v1.6** | **`tax-rules`** 组内顺序 **445→144→143→142→160**；445 基础税率输入、143 折前/折后单选；142/160 场景文案区分 |",
  "| v1.7 | **`tip-policy`** 方案 A：组内顺序与专用 UI（231 与 237 等已解耦，见 v1.9） |",
  "| v1.8 | **231** 标题改为「POS 服务员小费录入方式」；组首增加 POS/食客终端边界说明 |",
  "| **v1.9** | **231** 与 **237/295/296** 解耦：「不允许选择小费」不再联动灰显结账预设与收据建议 |",
  "| **v2.0** | **`batch-settlement`** 组内顺序 **238→230→236→239/240→235**；专用 UI（日切时刻、结算天数、队列上限、开关、打印多选）；**241** 迁回团队 **time-attendance** |",
  "| **v2.1** | 排除 **452**（现金折扣占位「未填写」，与 **454** 双重定价重复） |",
  "| **v2.2** | **`card-fees`** 语义重排：242 产线门槛 + 454 互斥加价 UI；243→cds；307→财务；排除 512/543 |",
  "| **v2.3** | 移除 **`paypad-checkout`**；**666**→463 展示 No Tip；**667**→237 默认预设；扫码组已收敛 |",
  "| **v2.4** | **82** 自会员中心迁入 **`card-fees`**（会员卡最低消费，与 242 同类门槛） |",
  "| **v2.5** | **180** 自打印中心迁入 **`card-fees`**（Merchantcopy 电子签名留存，卡交易合规） |",
  "| **v2.6** | 排除 **252**（订单收据小费行打印时机，与 **266/295/296** 收据建议小费重叠） |",
  "",
  "| seq | 功能设置 | 新 groupKey | 说明 |",
  "|-----|----------|-------------|------|",
  "| 229 | Payment Service | `payment-gateway` | 受理/网关 SSOT |",
  "| 234 | 支付方式 | `payment-methods` | 内置 + 自定义 + 产线矩阵 SSOT |",
  "| 233/448/29/511 | （合并入 234） | — | 设置滑层不单独展示 |",
  "| 8/9/463/464/465 | 客显结账步骤 | `cds-checkout-ux` | 客显屏 SSOT |",
  "| 492–497/501 | 扫码端结账步骤 | `guest-self-checkout-ux` | Kiosk/扫码食客自助结账屏 |",
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
  if (k === "cds-checkout-ux") {
    push(
      "",
      "**组内顺序**：**243** 签名金额门槛（全终端）→ 流程（9）→ 小费（463）→ 签名（8、464）→ 小票（465）。**8** 为刷卡后签名行为，**464** 为签名页显隐。",
      "",
    );
  }
  if (k === "guest-self-checkout-ux") {
    push(
      "",
      "**组内顺序**：流程（495）→ 小费（492–496）→ 签名（497）→ 短信收据（501）。**493→494** 为联动（仅百分比时展示换算金额）。**9 与 495** 宜与客显组同步。",
      "",
    );
  }
  if (k === "payment-gateway") {
    push(
      "",
      "全支付中心唯一 **网关/受理** 配置项；与「支付手段与展示」组分离，避免与 29/234/511 混淆。",
      "",
    );
  }
  if (k === "payment-methods") {
    push(
      "",
      "**设置滑层**：仅 **seq 234** 一条。矩阵表：行=支付方式，列=产线（POS/Kiosk/eMenu/Paypad），勾选该方式在哪些终端可用。",
      "",
    );
  }
  if (k === "tax-rules") {
    push(
      "",
      "**组内顺序（依赖）**：**445** 基础税率 → **144** 免税例外 → **143** 折前/折后税基 → **142** 加收是否应税 → **160** 服务费是否按税后基数。**142** 与 **160** 均涉及加收，语义不同，文案已区分。",
      "",
    );
  }
  if (k === "tip-policy") {
    push(
      "",
      "**组内顺序**：**231** → **293/294/253** → **237/295/296** → **244/232**。组首说明：本组含 POS 服务员规则；**493** 三产线收取方式；**237** 预设含默认项；食客端小费页见 **cds-checkout-ux**。小费分配见团队管理。",
      "",
    );
  }
  if (k === "batch-settlement") {
    push(
      "",
      "**组内顺序（流程）**：**238** 自动关账时刻（日切）→ **230** 收单结算周期（天数）→ **236** 未 batch 上限 → **239/240** batch 前处理 → **235** batch 后打印。**238** 与 **230** 文案已区分「何时关账」vs「结算周期」。**241** 员工下班卡检查见团队管理·考勤与工时；财务 **171/330** 日结打印见财务中心。",
      "",
    );
  }
  if (k === "card-fees") {
    push(
      "",
      "**组内顺序**：**82** 会员卡最低消费 → **242** 各产线信用卡最低消费 → **243** 产线签名门槛 → **180** Merchantcopy 签名留存 → **454** 卡付加价策略（无 / 双重定价 / 整单加收互斥 + 比例）。**307** 通道成本率见财务。",
      "",
    );
  }
  for (const r of sortItemsInGroup(by.get(k))) {
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
  "| 支付网关与受理 | Payment Service Settings（229） |",
  "| 支付方式 | seq 234（合并 234/233/448/29/511） |",
  "| 税务规则 | 税、税率、加收（税后服务费） |",
  "| 小费政策与计算 | 基本设置（小费算法/比例）、小费设置、付款收据、信用卡（隐藏现金小费） |",
  "| BATCH与日结 | 基本设置（结算/batch/自动结账） |",
  "| 卡交易与附加费用 | 信用卡、报表手续费、现金折扣、双重定价、附加费、服务设置支付门槛 |",
  "| 结账与交互 | 客显屏 8/9、服务 463–465/669；492–497/501/662–667 已合并入三产线矩阵 |",
  "| 小费与刷卡顺序 | seq 9（含原 495/663 等平行项） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-payment-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 支付中心 → 设置（`/transactions/settings`）验证",
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
  "- 终版 **52** 条 seq 保留；设置 catalog **48** 条（233/448/29/511 合并展示为 234）。",
  "- `seq 237`（基本设置建议小费比例）与 `seq 295`（收据建议百分比）同属小费政策组，前者偏 **POS/全局预设**，后者偏 **收据展示默认值**。",
  "- **小费政策**管「算多少」；**客显/扫码端结账交互**管「展不展示、顺序、No Tip」— 勿与小费政策组混淆。",
  "- `seq 8/9` 原属相关设备·客显屏；hub=支付中心后归入 **`cds-checkout-ux`**（v1.3 自合并组拆出）。",
  "- v1.4：`229` → **`payment-gateway`**；v1.5：`234` 为 **`payment-methods`** 唯一展示项。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
