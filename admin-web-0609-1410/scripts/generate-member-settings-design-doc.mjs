/**
 * 生成 docs/项目文档/会员中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-member-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";
import { buildCatalogTitle } from "./lib/settings-catalog-scene-supplement.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "会员中心-设置二级导航重设计方案.md");

const HUB = "会员中心";

const titles = {
  "member-account-system": "会员账户与卡体系",
};

const reasons = {
  "member-account-system":
    "云/本地模式、使用模式、有效期与查卡方式；支付门槛（82）与 POS 本地档案/等级（479/480）已迁出（v1.2）；终端登录/采集/验证码已迁前厅（v1.6–v1.8）。",
};

/** seq → groupKey（会员中心 catalog；hub override / 排除后仍映射分组语义） */
const assignMap = {
  "member-account-system": [86, 87, 88, 89],
};

/** v1.8 迁出会员 hub catalog → 前厅（C 端登录页短信验证码） */
const migratedOutV18 = [
  {
    seq: 622,
    to: "前厅 · `guest-order-rules`",
    note: "开通会员后各产线登录/注册是否须短信验证码；紧挨 623",
  },
];

/** v1.7 迁出会员 hub catalog → 前厅（C 端取餐联络信息采集，非会员专属） */
const migratedOutV17 = [
  { seq: 505, to: "前厅 · `guest-order-rules`", note: "输入手机号页必填；与 504 配套，取餐联络等" },
  { seq: 507, to: "前厅 · `guest-order-rules`", note: "输入姓名页必填；与 506 配套，叫号等" },
  { seq: 510, to: "前厅 · `guest-order-rules`", note: "手机号页隐私条款默认勾选" },
];

/** v1.6 迁出会员 hub catalog → 前厅（点单动线登录门禁） */
const migratedOutV16 = [
  {
    seq: 623,
    to: "前厅 · `guest-order-rules`",
    note: "各产线点单前：可选/强制/不展示登录页；先于 504/506 信息采集页",
  },
];

/** v1.5 迁出会员 hub catalog → 前厅（终端菜单展示与纯积分单下单） */
const migratedOutV15 = [
  { seq: 509, to: "前厅 · `guest-menu-global`", note: "展示账户积分，C 端首页/菜单 chrome" },
  { seq: 525, to: "前厅 · `guest-menu-structure`", note: "菜单页面展示积分菜" },
  { seq: 526, to: "前厅 · `guest-menu-structure`", note: "菜单页面积分菜展示位置（顶部/尾部）" },
  { seq: 527, to: "前厅 · `guest-order-rules`", note: "订单仅有积分商品可以兑换" },
];

/** v1.4 排除 catalog（终端广告/弹窗/海报 → 功能页 SSOT） */
const excludedV14 = [
  { seq: 554, ssot: "/ordering/kiosk/login-guide", note: "登录引导图 — Kiosk 产线页" },
  { seq: 615, ssot: "/members/card/paid-config", note: "付费会员登录弹窗 — 付费会员配置" },
  { seq: 650, ssot: "/ordering/tablet/membership-benefits", note: "权益会员介绍海报 — eMenu 权益会员" },
];

/** v1.3 排除 catalog（POS 本地积分规则，云上已有） */
const excludedV13 = [
  { seq: 83, note: "消费金额兑换积分 — POS 本地发放比例" },
  { seq: 84, note: "积分兑换现金比例 — POS 本地兑换比例" },
  { seq: 85, note: "积分获取后立即兑换 — POS 本地即时兑换开关" },
];

/** v1.2 迁出会员 hub catalog（仍保留终版 seq） */
const migratedOutV12 = [
  { seq: 82, to: "支付中心 · `card-fees`", note: "会员卡最低消费额度，与 242 同类支付门槛" },
];

/** v1.2 排除 catalog（功能页/占位/schema） */
const excludedV12 = [
  { seq: 479, note: "POS 本地会员档案 → 卡券管理功能页" },
  { seq: 480, note: "POS 本地会员等级 → 卡券管理功能页" },
  { seq: 481, note: "终版占位，无独立设置语义" },
  { seq: 482, note: "顾客档案字段 schema，非卡体系开关" },
];

/** v1.1 迁出会员 hub catalog（仍保留终版 seq） */
const migratedOut = [
  { seq: 10, to: "前厅 · `cds`", note: "客显屏加入会员入口，非登录校验" },
  { seq: 222, to: "前厅 · `pos-order-cart`", note: "POS 点单页客户姓名必填" },
  { seq: 223, to: "前厅 · `pos-order-cart`", note: "POS 点单页客户电话必填" },
  { seq: 504, to: "前厅 · `guest-order-rules`", note: "食客端展示输入手机号（合并 seq 30）" },
  { seq: 506, to: "前厅 · `guest-order-rules`", note: "食客端展示输入姓名" },
];

const excludedMerged = [
  { seq: 30, into: 504, note: "终端/食客端手机号页 SSOT" },
  { seq: 508, into: 622, note: "短信验证码 SSOT" },
  { seq: 624, into: 623, note: "点单前身份策略单选（optional/required/hidden）" },
];

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("积分")) return "积分";
  if (t.includes("会员卡") || t.includes("会员等级") || t.includes("本地会员")) return "账户";
  if (t.includes("验证码") || t.includes("登录") || t.includes("注册")) return "登录";
  if (t.includes("手机号") || t.includes("姓名")) return "信息采集";
  if (t.includes("引导") || t.includes("权益")) return "引导";
  if (t.includes("菜单")) return "兑换商品";
  return "会员";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const hubRows = filterRowsForSettingsHub(parseConfigMd(md), HUB).filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = [
  "member-account-system",
];

const missing = hubRows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !hubRows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of hubRows) {
  const key = assign.get(r.seq);
  by.get(key).push({
    ...r,
    title: buildCatalogTitle(r.seq, r.title),
    area: inferArea(r.nav, r.moduleName, r.title),
  });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 会员中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.8（解散 login-verification · 622 → 前厅 guest-order-rules）  ",
  `> 数据范围：会员设置 catalog **${hubRows.length}** 条（终版 hub 32 条；${migratedOut.length + migratedOutV12.length + migratedOutV15.length + migratedOutV16.length + migratedOutV17.length + migratedOutV18.length} 条 hub override 迁出；${excludedMerged.length + excludedV12.length + excludedV13.length + excludedV14.length} 条合并/排除）  `,
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档  ",
  "> 语义方案：`会员中心-会员引导与权益展示-语义重设计方案.md`",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 现状问题（v1.0）",
  "",
  "| 指标 | 现状 | 问题 |",
  "|------|------|------|",
  "| `login-verification` | 14 条 | 混入 POS 开单必填、客显入会、C 端页面显隐 |",
  "| `member-account-system` | 9 条 | 混入支付门槛、POS 本地档案/等级、占位与 schema |",
  "| `points-rewards` | 7 条 | 混入 POS 本地积分发放/兑换规则（83–85），云上已有 |",
  "| `member-guidance-benefits` | 3 条 | 终端广告/弹窗/海报，与 login-verification 不同层 |",
  "| 重复 SSOT | 30/504、508/622、623/624 | 商户可配出矛盾组合 |",
  "| 产线分散 | 客显/POS/Kiosk 同组 | 改会员设置误以为只影响会员 |",
  "",
  "### 1.2 v1.8 变更（解散登录注册与信息校验）",
  "",
  "**迁出会员 catalog → 前厅管理中心**",
  "",
  "622 控制开通会员后、各 C 端产线登录/注册页是否要求短信验证码；与 623 登录门禁同轨，产线范围可独立配置。",
  "",
  "| seq | 功能设置 | 迁入 | 说明 |",
  "|-----|----------|------|------|",
);

for (const m of migratedOutV18) {
  const row = parseConfigMd(md).find((r) => r.seq === m.seq);
  push(`| ${m.seq} | ${row?.title ?? "—"} | ${m.to} | ${m.note} |`);
}

push(
  "",
  "**会员中心保留（1 组 4 条）**：仅 `member-account-system`（86–89）。",
  "",
  "**前厅登录链 SSOT**：623 登录门禁 → 622 短信验证码 → 504–507/510 取餐信息采集。",
  "",
  "### 1.3 v1.7 变更（食客信息采集迁前厅）",
  "",
  "**迁出会员 catalog → 前厅管理中心**",
  "",
  "505/507/510 控制 **输入手机号/姓名页** 的必填与隐私默认态，与 504/506 展示页同轨；**不依赖开通会员**，主要用于取餐联络与叫号。",
  "",
  "| seq | 功能设置 | 迁入 | 说明 |",
  "|-----|----------|------|------|",
);

for (const m of migratedOutV17) {
  const row = parseConfigMd(md).find((r) => r.seq === m.seq);
  push(`| ${m.seq} | ${row?.title ?? "—"} | ${m.to} | ${m.note} |`);
}

push(
  "",
  "**会员中心保留（1 组 4 条）**：仅 `member-account-system`。",
  "",
  "### 1.4 v1.6 变更（点单前登录门禁迁前厅）",
  "",
  "**迁出会员 catalog → 前厅管理中心**",
  "",
  "| seq | 功能设置 | 迁入 | 说明 |",
  "|-----|----------|------|------|",
);

for (const m of migratedOutV16) {
  const row = parseConfigMd(md).find((r) => r.seq === m.seq);
  push(`| ${m.seq} | ${row?.title ?? "—"} | ${m.to} | ${m.note} |`);
}

push(
  "",
  "### 1.5 v1.5 变更（解散积分规则与兑换商品）",
  "",
  "**迁出会员 catalog → 前厅管理中心**",
  "",
  "| seq | 功能设置 | 迁入 | 说明 |",
  "|-----|----------|------|------|",
);

for (const m of migratedOutV15) {
  const row = parseConfigMd(md).find((r) => r.seq === m.seq);
  push(`| ${m.seq} | ${row?.title ?? "—"} | ${m.to} | ${m.note} |`);
}

push(
  "",
  "### 1.6 v1.4 变更（解散会员引导与权益展示）",
  "",
  "**排除 catalog（SSOT 归功能页）**",
  "",
  "| seq | 功能设置 | SSOT | 说明 |",
  "|-----|----------|------|------|",
);

for (const x of excludedV14) {
  const row = parseConfigMd(md).find((r) => r.seq === x.seq);
  push(`| ${x.seq} | ${row?.title ?? "—"} | \`${x.ssot}\` | ${x.note} |`);
}

push(
  "",
  "### 1.7 v1.3 变更（积分规则 POS 本地项排除）",
  "",
  "**排除 catalog（不展示于设置滑层）**",
  "",
  "| seq | 功能设置 | 说明 |",
  "|-----|----------|------|",
);

for (const x of excludedV13) {
  const row = parseConfigMd(md).find((r) => r.seq === x.seq);
  push(`| ${x.seq} | ${row?.title ?? "—"} | ${x.note}；云上会员系统已有 SSOT |`);
}

push(
  "",
  "### 1.8 v1.2 变更（会员账户与卡体系瘦身）",
  "",
  "**迁出会员 catalog**",
  "",
  "| seq | 功能设置 | 迁入 | 说明 |",
  "|-----|----------|------|------|",
);

for (const m of migratedOutV12) {
  const row = parseConfigMd(md).find((r) => r.seq === m.seq);
  push(`| ${m.seq} | ${row?.title ?? "—"} | ${m.to} | ${m.note} |`);
}

push(
  "",
  "**排除 catalog（不展示于设置滑层）**",
  "",
  "| seq | 说明 |",
  "|-----|------|",
);

for (const x of excludedV12) {
  const row = parseConfigMd(md).find((r) => r.seq === x.seq);
  push(`| ${x.seq} | ${row?.title ?? "—"}：${x.note} |`);
}

push(
  "",
  "### 1.9 v1.1 变更（登录注册组瘦身）",
  "",
  "**迁出会员 catalog → 前厅管理中心**",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
);

for (const m of migratedOut) {
  const row = parseConfigMd(md).find((r) => r.seq === m.seq);
  push(`| ${m.seq} | ${row?.title ?? "—"} | ${m.to} |`);
}

push(
  "",
  "**合并排除（catalog 不展示）**",
  "",
  "| seq | 合并至 | 说明 |",
  "|-----|--------|------|",
);

for (const x of excludedMerged) {
  push(`| ${x.seq} | ${x.into} | ${x.note} |`);
}

push(
  "",
  "### 1.10 设计目标",
  "",
  "- 会员中心只承载 **账户与卡体系**（86–89）",
  "- 终端 **登录/验证码/信息采集** 归前厅 `guest-order-rules`（623→622→504–510）",
  "- 终端 **广告 / 弹窗 / 海报** 归产线功能页（554/615/650）",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（会员/忠诚度设置维度）",
  "",
  "| 竞品 | 会员/忠诚度组织方式 | 本项目借鉴 |",
  "|------|--------------------|------------|",
  "| **Square** | 忠诚度（积分、奖励、等级）、礼品卡、订阅并行 | 账户体系与积分规则分轨，权益引导独立 |",
  "| **Snackpass** | 奖励系统 + Kiosk 展示横幅 + 收银台兑换 | 积分兑换商品与店内引导位拆分 |",
  "| **Toast** | 会员加入入口与促销触达联动 | 入会触点归前厅/客显，身份策略留会员 |",
  "",
  "### 2.1 会员设置一维（商户心智）",
  "",
  "```text",
  "会员账户与卡体系",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（1 组）",
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
  "| 会员账户与卡体系 | 基础设置（会员卡规则）、会员卡、会员等级、（未填写）本地会员档案 |",
  "",
  "**v1.8 解散 `login-verification`**：622→前厅 `guest-order-rules`（紧挨 623）。",
  "**v1.7 自 login-verification 迁出**：505/507/510→前厅 `guest-order-rules`。",
  "**v1.6 自 login-verification 迁出**：623→前厅 `guest-order-rules`（点单动线登录门禁）。",
  "**v1.5 解散 `points-rewards`**：509→guest-menu-global；525/526→guest-menu-structure；527→guest-order-rules。",
  "**v1.4 解散 `member-guidance-benefits`**：554→Kiosk 登录引导；615→paid-config；650→eMenu 权益会员。",
  "**v1.3 自 points-rewards 排除**：83/84/85 POS 本地积分规则，云上 SSOT。",
  "**v1.2 自 member-account-system 迁出/排除**：82→支付 `card-fees`；479/480→卡券管理功能页；481 占位；482 顾客档案 schema。",
  "**v1.1 自 login-verification 迁出**：客显 10、POS 222/223、食客端 504/506；合并 30→504、508→622、624→623。",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. `node scripts/apply-member-settings-mapping.mjs`",
  "2. `node scripts/apply-payment-settings-mapping.mjs`（82 迁入 card-fees）",
  "3. `node scripts/apply-foh-settings-mapping.mjs`",
  "4. `cd admin-web && npm run build:settings-catalog`",
  "5. 会员中心 → 设置（`/members/settings`）与支付中心 `card-fees` 验证",
  "",
  "### 6.1 映射表（CSV，会员 hub catalog）",
  "",
  "```csv",
  "seq,groupTitle,groupKey",
);

for (const r of [...hubRows].sort((a, b) => a.seq - b.seq)) {
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
  `- 会员 catalog **${hubRows.length}** 条；终版 hub 仍 32 条。`,
  "- **222/223** 为 POS 开单顾客信息采集，非会员登录；见前厅 `pos-order-cart`。",
  "- **504/506** 为食客端下单路径页面显隐；见前厅 `guest-order-rules`（504 合并 30）。",
  "- **10** 为客显拉新触点；见前厅 `cds`。",
  "- **554/615/650** 为登录/点餐终端广告与海报，见功能页 SSOT（语义方案 v1.0）。",
  "- **83/84/85** 为 POS 本地积分发放/兑换规则，不在 B 端设置滑层展示；云上会员系统维护 SSOT。",
  "- **82** 为会员卡支付门槛，与 **242** 信用卡最低消费同类；见支付中心 `card-fees`。",
  "- **479/480** 为 POS 本地会员/等级业务页，非设置开关；见会员中心 · 卡券管理。",
  "- **509/525/526/527** 为食客端积分展示与纯积分单规则；见前厅 `guest-menu-global` / `guest-menu-structure` / `guest-order-rules`（UI 仍用 `module-settings-member-points-rewards-ui.ts`）。",
  "- **623/622** 为登录链：门禁 → 短信验证码；见前厅 `guest-order-rules`（UI：`module-settings-member-login-policy-ui.ts` / `module-settings-member-sms-verification-ui.ts`）。",
  "- **505/507/510** 为食客端输入手机号/姓名页规则（取餐联络等）；见前厅 `guest-order-rules`（504→505、506→507 配套；UI：`module-settings-member-registration-fields-ui.ts`）。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${hubRows.length} catalog items, ${order.length} groups)`);
