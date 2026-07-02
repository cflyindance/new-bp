/**
 * 生成 docs/项目文档/订单中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-order-settings-design-doc.mjs
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
const outPath = path.join(projectDocs, "订单中心-设置二级导航重设计方案.md");

const titles = {
  "order-init-scenario": "开单·桌台与场景",
  "order-numbering": "单号规则",
  "split-merge-edit": "分单合单与改单",
  "order-discount": "折扣",
  "order-surcharge": "加收",
  "order-settlement": "金额结算",
  "order-void": "删退与作废",
};

const reasons = {
  "order-init-scenario":
    "POS 新建单默认订单类型（126）；选桌/人数/送厨时机等 POS 流程规则已迁前厅（`tables-floor` / `pos-order-init` / `pos-kitchen-send` / `guest-order-rules`）。",
  "order-numbering":
    "单号模式、起始/上限、分类单号与重置；对标 Toast「单号」、Clover 订单流水。",
  "split-merge-edit":
    "分单/合单与订单编辑权限（改应收、部分支付、分单展示、送厨后改调味、跨产线合单）；对标 Clover「合并商品 / 分单」与 Toast 订单编辑策略。",
  "order-discount":
    "折扣预设（446）与原因策略（162–164）；对标 Toast「折扣」、经理授权折扣动线。",
  "order-surcharge":
    "加收预设（447）、合单加收重算（149）、线上服务费清除（161）、按菜品打包盒加收（546）；对标 Toast「加收」。",
  "order-settlement":
    "总价四舍五入（147）；应付金额落定规则，与加收预设分轨便于查找。",
  "order-void":
    "删单向厨房通知、失效/删单原因、未付单删除、按菜退款；对标 Clover「记录移除原因」、Toast「作废」。",
};

/** seq → groupKey（订单中心 catalog；v2.4 吸收跨产线计费规则 546） */
const assignMap = {
  "order-init-scenario": [126],
  "order-numbering": [127, 128, 129, 130, 131],
  "split-merge-edit": [115, 116, 117, 119, 124, 140, 141, 150],
  "order-discount": [446, 162, 163, 164],
  "order-surcharge": [447, 149, 161, 546],
  "order-settlement": [147],
  "order-void": [155, 156, 157, 158, 159],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (mod.includes("删单") || title.includes("删单") || title.includes("退款") || title.includes("失效"))
    return "删退";
  if (
    mod.includes("火锅") ||
    mod.includes("品类") ||
    title.includes("一桌多单") ||
    title.includes("人数") ||
    title.includes("锅底") ||
    title.includes("默认收取")
  )
    return "场景";
  if (mod.includes("折扣") || mod.includes("加收") || title.includes("折扣") || title.includes("服务费"))
    return "折扣";
  if (mod.includes("找单") || mod.includes("付款") || mod.includes("收据") || title.includes("找单"))
    return "收银";
  if (mod.includes("单号")) return "单号";
  if (title.includes("送厨") || mod.includes("送厨") || title.includes("Kiosk"))
    return "送厨";
  if (
    mod.includes("点单界面") ||
    mod.includes("界面") ||
    mod.includes("单菜") ||
    (mod.includes("价格") && title.includes("显示"))
  )
    return "界面";
  if (
    title.includes("分单") ||
    title.includes("合单") ||
    title.includes("编辑") ||
    title.includes("支付") ||
    title.includes("自动点完") ||
    title.includes("套餐")
  )
    return "改单";
  if (mod.includes("桌子") || title.includes("桌") || title.includes("开单")) return "桌台";
  return "开单";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), "订单中心").filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = [
  "order-init-scenario",
  "order-numbering",
  "split-merge-edit",
  "order-discount",
  "order-surcharge",
  "order-settlement",
  "order-void",
];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  const title = buildCatalogTitle(r.seq, r.title);
  by.get(key).push({ ...r, title, area: inferArea(r.nav, r.moduleName, title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 订单中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.22（已确认）  ",
  "> 数据范围：订单设置 catalog **27** 条（含跨产线计费项 546）  ",
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
  "| 二级分组数 | **17 组** / 61 条 | 「基础设置」单组 18 条，侧栏难扫读 |",
  "| 命名来源 | 旧「功能模块」 | 送厨、分单、找单、删单规则混在「基础设置」 |",
  "| 渠道不清 | 点单 / 网上点餐 / 服务设置 / 全局设置 | 同一业务规则分散在不同原导航下 |",
  "| 与 hub 重复 | 订单中心已有订单列表、找单业务页 | 设置页应表达 **规则与策略**，非操作入口 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **7 组**，覆盖 catalog 条目，符合「开单 → 编号 → 分单改单 → 折扣 → 加收 → 金额结算 → 删退」；**POS 找单/结账** 见前厅。",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（订单/点单设置维度）",
  "",
  "| 竞品 | 订单/点单设置组织方式 | 本项目借鉴 |",
  "|------|----------------------|------------|",
  "| **Toast** | 前厅→订单类型、点餐界面、快速点餐；设置→订单与发票、单号、自动关账；删单/折扣原因 | **开单 / 单号 / 界面 / 改单 / 找单结账 / 折扣作废** 分轨；送厨见前厅 POS |",
  "| **Clover** | 设置→订单类型、合并商品、移除原因、订单类型免税 | 合单、删单原因、订单类型归开单与删退组 |",
  "| **Square** | 履行方式、订单设置、折扣层级 | 找单与折扣工具分轨 |",
  "| **Peblla** | 设置→订单设置（序号、预约单）、POS 折扣选项 | 单号与折扣加收独立组 |",
  "| **Snackpass** | 设置→所有订单、自提订单设置 | 线上单送厨策略并入送厨组；桌台弱则并入开单 |",
  "",
  "### 2.1 订单设置七维（商户心智）",
  "",
  "```text",
  "开单·桌台与场景（126）→ 单号规则 → 分单合单与改单 → 折扣 → 加收 → 金额结算 → 删退与作废",
  "```",
  "",
  "**边界**：",
  "- **前厅管理中心**：POS 开单/送厨/点单页展示/套餐点单（139/145）/按钮与食客端规则。",
  "- **自定义折扣原因（164）** 与 162/163 同归订单 hub。",
  "- **后厨管理中心**：厨单打印触发/路由（`send-routing`），与 POS 送厨时机（前厅）分工见 §7。",
  "- **支付中心**：支付方式、BATCH、税率在支付 hub。",
  "- **商品中心**：商品主数据与默认定价在商品 hub；套餐点单、场景计价与订单金额策略在本 hub。",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（7 组）",
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
  "### 3.1 v1.4 变更（跨 hub 收敛）",
  "",
  "| seq | 功能设置 | groupKey | 说明 |",
  "|-----|----------|----------|------|",
  "| 164 | 自定义折扣原因 | `discount-surcharge` | 与 162/163 组成折扣原因策略；终版 B 平台仍标前厅，catalog 经 hub override 挂载本 hub。 |",
  "| 147 | 总价四舍五入设置 | `discount-surcharge` | 订单金额结算规则。 |",
  "| 446 | 折扣设置 | `discount-surcharge` | 订单/商品折扣预设选项。 |",
  "| 447 | 加收设置 | `discount-surcharge` | 订单/商品加收预设选项。 |",
  "| 139 | 自动点完套餐 | 前厅 · `pos-combo-ordering`（v2.0） | 自商品中心迁入。 |",
  "| 145 | 当套餐价钱规则是可调时,显示套餐子菜价格 | 前厅 · `pos-combo-ordering`（v2.0） | 与 139 同轨。 |",
  "",
  "### 3.2 v1.20 变更（加收与结算拆组，已确认）",
  "",
  "原 **`order-surcharge`（4 条）** 拆为：",
  "",
  "| 新组 | groupKey | 条数 | 范围 |",
  "|------|----------|------|------|",
  "| 加收 | `order-surcharge` | 3 | 447、149、161 |",
  "| 金额结算 | `order-settlement` | 1 | 147 |",
  "",
  "侧栏顺序：折扣 → **加收** → **金额结算** → 删退与作废。",
  "",
  "### 3.2.1 v1.21 变更（外卖打包费迁订单中心，已确认）",
  "",
  "| seq | 功能设置 | 迁入组 | 说明 |",
  "|-----|----------|--------|------|",
  "| 546 | 根据订单中每个菜品打包盒默认加收 | `order-surcharge` | 跨产线（Kiosk/Online/扫码）统一计费规则，SSOT 迁入订单中心。 |",
  "",
  "### 3.3 v1.19 变更（折扣与加收拆组，已确认）",
  "",
  "原 **`discount-surcharge`（8 条）** 拆为两组，便于按「减价 / 加价+结算」找配置：",
  "",
  "| 新组 | groupKey | 条数 | 范围 |",
  "|------|----------|------|------|",
  "| 折扣 | `order-discount` | 4 | 446、162–164 |",
  "| 加收与结算 | `order-surcharge` | 4 | 447、149、161、147 |",
  "",
  "侧栏顺序：分单合单与改单 → **折扣** → **加收与结算** → 删退与作废。",
  "",
  "### 3.3 v1.18 变更（结账入口迁前厅，已确认）",
  "",
  "POS 结账动线（221、248）迁入前厅 **`pos-checkout-entry`**；与 `pos-find-order-list` 衔接。",
  "",
  "| seq | 功能设置 | 迁出至 |",
  "|-----|----------|--------|",
  "| 248 | 条码找单时打开付款界面 | 前厅 · `pos-checkout-entry` |",
  "| 221 | 支付前确认客户信息 | 前厅 · `pos-checkout-entry` |",
  "",
  "订单中心仍为 **6 组 / 26 条**（拆组不增减条目）。",
  "",
  "### 3.4 v1.17 变更（找单列表迁前厅，已确认）",
  "",
  "POS 找单页展示与操作（151–154、251）迁入前厅 **`pos-find-order-list`**；订单中心仅保留 **`checkout-entry`**（221、248）。",
  "",
  "| seq | 功能设置 | 迁出至 |",
  "|-----|----------|--------|",
  "| 151–154 | 找单列表展示/筛选/盘点 | 前厅 · `pos-find-order-list` |",
  "| 251 | 找单界面打印收据类型 | 前厅 · `pos-find-order-list` |",
  "",
  "订单中心现为 **6 组 / 28 条**。",
  "",
  "### 3.4 v1.16 变更（找单与收银拆组，已确认）",
  "",
  "原 **`find-checkout`**（7 条）拆为两组：",
  "",
  "| 新组 | groupKey | 条数 | 范围 |",
  "|------|----------|------|------|",
  "| 找单列表 | `find-order-list` | 5 | 151–154、251 |",
  "| 结账入口 | `checkout-entry` | 2 | 221、248 |",
  "",
  "侧栏顺序：分单合单与改单 → **找单列表** → **结账入口** → 折扣与加收。",
  "",
  "### 3.5 v1.15 变更（折扣加收与删退拆组，已确认）",
  "",
  "原 **`discount-void`**（13 条）拆为两组：",
  "",
  "| 新组 | groupKey | 条数 | 范围 |",
  "|------|----------|------|------|",
  "| 折扣与加收 | `discount-surcharge` | 8 | 147/149/446/447/161–164 |",
  "| 删退与作废 | `order-void` | 5 | 155–159 |",
  "",
  "侧栏顺序：找单列表 → 结账入口 → **折扣与加收** → **删退与作废**（v1.16 已拆组）。",
  "",
  "### 3.4 v1.14 变更（套餐/促销归位，已确认）",
  "",
  "| seq | 功能设置 | 迁出至 |",
  "|-----|----------|--------|",
  "| 139 | 自动点完套餐 | 前厅 · `pos-combo-ordering` |",
  "| 145 | 可调套餐显示子菜价格 | 前厅 · `pos-combo-ordering` |",
  "| 150 | 子单促销自动重算 | `split-merge-edit` | 拆分子单后的促销重算（与 149 合单加收重算对称）。 |",
  "",
  "订单中心现为 **5 组 / 33 条**；专注编号、分合改单、找单结账、折扣删退。",
  "",
  "### 3.5 v1.13 变更（点单界面迁前厅，已确认）",
  "",
  "原订单中心 **`order-ui`（点单界面）** 整组迁入前厅 **`pos-order-cart`（点单页展示）**：",
  "",
  "| seq | 功能设置 | 迁出至 |",
  "|-----|----------|--------|",
  "| 121 | 订单数量支持小数 | 前厅 · `pos-order-cart` |",
  "| 122 | 减菜后自动重定向 | 前厅 · `pos-order-cart` |",
  "| 132 | 点单显示座位 | 前厅 · `pos-order-cart` |",
  "| 133 | 相同菜品展示（含原 134） | 前厅 · `pos-order-cart` |",
  "| 135 | 菜序模式 | 前厅 · `pos-order-cart` |",
  "| 137 | 显示ASAP订单时间 | 前厅 · `pos-order-cart` |",
  "| 178 | 显示单菜序号 | 前厅 · `pos-order-cart` |",
  "",
  "订单中心 `order-init-scenario` 仅保留 **126**（v1.13 点单页迁前厅；v1.14 套餐/促销迁出）。",
  "",
  "### 3.3 v1.12 变更（相同菜品展示合并交互，已确认）",
  "",
  "| seq | 调整 | 说明 |",
  "|-----|------|------|",
  "| 133 | 设置滑层 SSOT | 标题「相同菜品展示」；单选 **拆分显示** / **合并显示**。 |",
  "| 134 | catalog 不展示 | 与 133 互斥配置合并；映射表/终版保留。 |",
  "",
  "### 3.4 v1.11 变更（点单界面减负，已确认）",
  "",
  "新增 **`combo-ordering`（套餐点单）**；`order-ui` 仅保留界面展示类：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "| 139 | 自动点完套餐 | `combo-ordering` | 终版商品中心 SSOT；订单 catalog 便于 POS 配置。 |",
  "| 145 | 当套餐价钱规则是可调时,显示套餐子菜价格 | `combo-ordering` | 与 139 同轨。 |",
  "| 141 | 支持为已送厨的菜修改调味 | `split-merge-edit` | 送厨后改行项，归入改单权限。 |",
  "",
  "`order-ui` **8 条**（v1.12 合并 133/134）；`combo-ordering` **2 条**；`split-merge-edit` **7 条**。",
  "",
  "### 3.5 v1.10 变更（分单合单组减负，已确认）",
  "",
  "收紧 **`split-merge-edit`**，仅保留分单/合单/改单权限；点单流程与金额重算项归位：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "| 121 | 订单数量支持小数 | `order-ui` | 行项数量展示，非分单专题。 |",
  "| 122 | 减菜后自动重定向 | `order-ui` | 减菜后页面跳转，点单交互。 |",
  "| 139 | 自动点完套餐 | `order-ui`（v1.11→`combo-ordering`） | 与 145 套餐展示同轨。 |",
  "| 141 | 支持为已送厨的菜修改调味 | `order-ui`（v1.11→`split-merge-edit`） | 送厨后改行项。 |",
  "| 149 | 合单时自动加收重算 | `discount-void` | 与 447 加收预设同轨，触发条件为合单。 |",
  "| 150 | 子单促销自动重算 | `split-merge-edit` | 拆分子单后的促销重算。 |",
  "",
  "`split-merge-edit` 现为 **6 条**；`order-ui` **12 条**；`discount-void` **14 条**。",
  "",
  "### 3.6 v1.9 变更（送厨策略迁前厅 POS 一体化）",
  "",
  "订单中心移除 **`kitchen-send`** 组；POS 送厨时机迁入前厅 **`pos-kitchen-send`**：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "| 113 | 点击「送厨」整单送厨 | 前厅 · `pos-kitchen-send` | 与后厨 304（首次送厨打整单）分工见 §7。 |",
  "| 114 | 点击「付款」直接送厨 | 前厅 · `pos-kitchen-send` | 与后厨 62（未付单直接送厨）宜交叉引用。 |",
  "| 120 | 结账后自动送厨 | 前厅 · `pos-kitchen-send` | POS 结账链路送厨。 |",
  "| 123 | 打单后自动送厨 | 前厅 · `pos-kitchen-send` | 打单后触发送厨。 |",
  "| 125 | 延迟送厨时间 | 前厅 · `pos-kitchen-send` | 可配置多条延迟规则（分钟数 + 适用商品）。 |",
  "",
  "订单中心现为 **6 组**；C 端/Kiosk 送厨（502/581）已在 `guest-order-rules`；按菜延迟送厨见前厅 **125**。",
  "",
  "### 3.7 v1.8 变更（开单·桌台与场景部分迁前厅）",
  "",
  "桌台/人数开单步骤迁前厅；**126 默认新订单类型** 留订单中心：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "| 107 | 跳过选桌 | 前厅 · `tables-floor` | 与 533 合并 SSOT。 |",
  "| 619 | 人数选择 | 前厅 · `tables-floor` | 与 108 镜像。 |",
  "| 643 | 开单前,换桌 | 前厅 · `tables-floor` | 桌台开单校验。 |",
  "| 644 | 开单前,必换桌 | 前厅 · `tables-floor` | 强制选桌。 |",
  "| 592 | 不允许一桌多单 | 前厅 · `tables-floor` | 一桌多单策略。 |",
  "| 108 | 跳过选择人数 | 前厅 · `pos-order-init` | 人数页开关。 |",
  "| 111 | 每单最多客人数量 | 前厅 · `pos-order-init` | 人数上限。 |",
  "| 625 | 儿童不参与人数计算 | 前厅 · `pos-order-init` | 人数规则细化。 |",
  "",
  "订单中心 `order-init-scenario` 仅保留 **126** 共 1 条。",
  "",
  "### 3.8 v1.7 变更（开单·桌台与场景方案 B）",
  "",
  "「开单·桌台与场景」收敛为 **POS 通用开单**（9 条）；场景业态与桌台展示项迁前厅/商品：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "| 571 | 品类先下单 | 前厅 · `guest-order-rules` | 自助餐/品类模式先下单。 |",
  "| 572 | 火锅锅底必选 | 前厅 · `guest-order-rules` | 与 573/577–580 火锅组同轨。 |",
  "| 574 | 火锅锅底下单方式 | 前厅 · `guest-order-rules` | 锅底先下单 vs 进购物车。 |",
  "| 575 | 同一锅型锅底过半加收 | 前厅 · `guest-order-rules` | 火锅场景计价。 |",
  "| 533 | 选择桌子页面 | 前厅 · `tables-floor` | 与 107「跳过选桌」为同一能力镜像入口。 |",
  "| 110 | 点单超时提醒(分钟) | 前厅 · `pos-order-toolbar` | POS 点单页超时告警。 |",
  "| 593 | 根据人数默认收取费用的菜品 | 商品管理（catalog 不展示） | 按人数默认加菜/收费，终版本属商品。 |",
  "",
  "订单中心 `order-init-scenario` 保留 **107/108/111/126/619/625/643/644/592** 共 9 条（v1.8 再迁 8 条，仅留 126）。",
  "",
  "### 3.9 v1.5 变更（送厨策略方案 A）",
  "",
  "「送厨策略」仅保留 POS/结账侧送厨时序；C 端与 Kiosk 送厨规则迁前厅 `guest-order-rules`：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "| 502 | 可自动送厨的订单支付状态 | 前厅 · `guest-order-rules` | 各产线支付状态与自动送厨联动。 |",
  "| 581 | 菜单送厨方式 | 前厅 · `guest-order-rules` | 菜单维度送厨方式（C 端/Kiosk）。 |",
  "",
  "订单中心 `kitchen-send` 保留 **113/114/120/123/125** 共 5 条（v1.6 将 567 迁前厅）。",
  "",
  "### 3.10 v1.6 变更（送厨策略方案 B）",
  "",
  "「送厨策略」进一步收敛为 **POS/结账链路送厨时机**；按菜品延迟送厨迁前厅：",
  "",
  "| seq | 功能设置 | 迁出至 | 说明 |",
  "|-----|----------|--------|------|",
  "",
  "订单中心 `kitchen-send` 最终保留 **113/114/120/123/125** 共 5 条。",
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
  "| 开单·桌台与场景 | 默认新订单类型（126）；开单/桌台/人数/送厨 POS 规则迁前厅 |",
  "| 单号规则 | 单号设置（全部） |",
  "| 点单界面 / 套餐点单 | v1.13 迁前厅 `pos-order-cart`；v1.14→商品中心；**v2.0 139/145 迁前厅 `pos-combo-ordering`** |",
  "| 分单合单与改单 | 分单/合单/改单权限（含 141，7 条） |",
  "| 找单列表 / 结账入口 | v1.16 自 `find-checkout` 拆分；221/248 在结账入口 |",
  "| 折扣与加收 | 四舍五入、折扣/加收预设与原因、合单加收 149、161（v1.15） |",
  "| 删退与作废 | 删单厨打、原因、未付删单、按菜退款 155–159（v1.15） |",
  "| 折扣加收与删退（旧） | v1.15 拆为上述两组 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-order-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 订单中心 → 设置（`/orders/settings`）验证",
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
  "- 终版订单 61 条全部保留；hub override 增补 164、147、446、447 等；v1.15–v1.16 拆组见 §3.2–§3.3。",
  "- **155** 删单厨打与后厨删单展示宜交叉引用；**150** 在 **`split-merge-edit`**。",
  "- **126** 为 POS 默认单型；跨产线订单类型可用范围 **487** 与 Kiosk 履约流程 **488–491** 见前厅 `guest-order-rules`。",
  "- **POS 点单/找单/结账** 见前厅 **`pos-order-cart`** / **`pos-find-order-list`** / **`pos-checkout-entry`**。",
  "- **套餐 139/145** 见前厅 **`pos-combo-ordering`**；**141**、**150** 在 **`split-merge-edit`**。",
  "- **133/134** 相同菜品展示：前厅 `pos-order-cart` 单选；**134** 不进入 catalog。",
  "- 选桌/人数见前厅 **`tables-floor`** / **`pos-order-init`**。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
