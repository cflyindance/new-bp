/**
 * 生成 docs/前厅管理中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-foh-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";
import { INTRA_GROUP_SORT_BY_SEQ } from "./lib/settings-intra-group-sort.mjs";
import { buildCatalogSceneDesc } from "./lib/settings-catalog-scene-supplement.mjs";
import {
  FOH_SETTINGS_GROUP_ORDER,
  FOH_SETTINGS_GROUP_TITLES,
  FOH_SETTINGS_ASSIGN_MAP,
} from "./lib/foh-settings-groups.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const docsDir = path.join(root, "docs");
const projectDocsDir = path.join(docsDir, "项目文档");
const sourcePath = [projectDocsDir, docsDir].map((d) => path.join(d, "配置归类-终版.md")).find((p) => fs.existsSync(p))
  ?? path.join(projectDocsDir, "配置归类-终版.md");
const outPath = path.join(projectDocsDir, "前厅管理中心-设置二级导航重设计方案.md");

const titles = { ...FOH_SETTINGS_GROUP_TITLES, cds: "客显屏" };

const reasons = {
  "foh-table-start-flow":
    "选桌页、人数页、就餐人数规则与开单前换桌/一桌多单；不含清桌与企台。",
  "foh-table-clear-ops":
    "付款后/超时/手动清桌、iPad 清桌通知与更换企台；餐位平面图 seq 428 为独立功能页。",
  "foh-pos-shell": "员工登录 POS 后的默认主界面与主页密码门禁。",
  "foh-pos-menu-scope": "收银端菜单搜索、比价与堂吃/外食/iPad 时段菜单；不含组/类/菜布局。",
  "foh-pos-menu-ui-layout": "POS 菜单区组/类/菜布局、价格展示、按钮样式与 iPad 电子菜单自定义消息。",
  "foh-pos-order-cart":
    "订单行展示结构（座位/合并拆分/菜序/序号/数量）、减菜交互与 POS 客户姓名/电话必填；不含套餐点单。",
  "foh-pos-combo-ordering": "自定义手写录菜、自动点完套餐与可调套餐子菜价格展示（139/145 按产线）。",
  "foh-pos-buttons": "点单页按钮是否收入「更多」及工具栏按钮排序（193–215、483–486）。",
  "foh-kitchen-send-timing":
    "收银侧送厨时机：延迟参数 → 手动送厨 → 打单/付款/结账自动送厨 → iPad 送厨密码；不含后厨出票规则。",
  "foh-pos-find-order-list":
    "POS/PayPad 找单列表默认筛选、汇总展示、批量关单与找单页打印收据类型。",
  "foh-pos-checkout-entry": "条码找单进付款界面、支付前服务员二次确认客户信息。",
  "foh-pos-notification-control":
    "POS/员工端通知类型总开关与新单语音播报；地基配置，须先于订单提醒与桌边 Service Request 联动。",
  "foh-pos-order-alerts":
    "扫码/线上下单等渠道的店内员工订单消息（不发顾客短信）；新单、追单、指定菜品按产线配置。",
  "foh-guest-order-type":
    "堂吃/外带/来取范围、订单类型与取餐方式页、号码牌与送餐到桌餐牌号；先定怎么吃、怎么取。",
  "foh-guest-registration":
    "点单前会员身份、短信验证码，及手机号/姓名登记与隐私条款默认勾选。",
  "foh-guest-pre-order":
    "点单须知弹框，及限制提前开单、下单前服务员授权、切换品类授权。",
  "foh-guest-menu-home":
    "菜单组、版式框架（eMenu Pro）、品类/分类浏览结构、纯展示、开始按钮与品牌露出。",
  "foh-guest-menu-body":
    "菜单页视觉（类名/图片/详情/字号）、积分露出、菜单树导航/瀑布流，及购物车展示。",
  "foh-guest-facing-locale": "食客端（eMenu/Kiosk/客显）可选语言列表与默认语言（652/653）。",
  "foh-guest-kitchen-send": "C 端菜单送厨方式与可自动送厨的支付状态；与 POS 送厨时机分轨。",
  "foh-guest-hotpot": "火锅页面提示、锅底必选/下单方式/加收与下单后仍展示；无火锅业态可跳过。",
  "foh-guest-duration-scenarios":
    "按时计价场景、自助餐品类先下单与用餐时长展示/提示/禁下单；无 KTV/自助餐/限时用餐可跳过。",
  "foh-tableside-service": "桌边呼叫服务员、服务类型与订单/商品/套餐备注。",
  "foh-wait-time-display":
    "Kiosk 点单页预计等待时长展示、区间规则与样式；主开关 + 产线多选（当前仅 Kiosk）。",
  cds:
    "客显屏封面/Logo（461/462）与 Pickup/Delivery 场景启用（466）；界面语言见 `foh-guest-facing-locale`。",
};

const assignMap = { ...FOH_SETTINGS_ASSIGN_MAP, cds: [461, 462, 466, 10] };

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferTerminal(seq, nav) {
  if (seq === 652 || seq === 653) return "eMenu/Kiosk/客显";
  if (seq >= 461 && seq <= 466) return "客显";
  if (nav === "iPad") return "iPad/POS";
  if (nav === "界面设置" || nav === "点单页配置" || nav === "点单") return "POS";
  if (nav === "桌子") return "POS";
  if (nav === "客显屏") return "客显";
  if (["服务设置", "全局设置", "附加费设置"].includes(nav)) return "eMenu";
  if (seq === 351) return "POS/iPad";
  return "前厅";
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
const rows = filterRowsForSettingsHub(parseConfigMd(md), "前厅管理中心").filter(
  (r) => !isSettingsCatalogExcluded(r.seq),
);
const order = [...FOH_SETTINGS_GROUP_ORDER, "cds"];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) {
  throw new Error(`未归类 seq: ${missing.join(", ")}`);
}

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  by.get(key).push({
    ...r,
    terminal: inferTerminal(r.seq, r.nav),
  });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 前厅管理中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v3.0（方案 E：员工端 7 组 + 食客端 7 组，共 14 组；按配置路径排序）  ",
  "> 数据范围：前厅设置 catalog 条数见 §3 合计（含 hub override 自会员中心 v1.20–v1.24）  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档及《餐饮行业竞品后台信息架构深度分析》",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 现状问题",
  "",
  "| 指标 | 现状 | 问题 |",
  "|------|------|------|",
  "| 二级分组数 | 曾达 **24+ 组** | 组过多、单组条目过多，侧栏难扫读 |",
  "| 命名来源 | 多为旧系统「功能模块」 | 如「常见按键」「其他按键」，商户难以理解 |",
  "| 重复组名 | 「展示设置」「菜单」等重复出现 | 无法区分 POS 与 eMenu |",
  "| 渠道不清 | POS / iPad / eMenu / 客显屏混排 | 不符合竞品「场景 + 渠道」心智 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **12 个** 有餐饮场景语义的分类（方案 D-紧凑；单组 ≤22 条；组名不含 POS/食客端等产品线）",
  "- 每条功能设置有明确归属与归类理由",
  "- 为 `docs/项目文档/配置归类-分组映射.csv` 提供可执行的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（前厅/前台设置维度）",
  "",
  "| 竞品 | 前厅/前台设置组织方式 | 本项目借鉴 |",
  "|------|----------------------|------------|",
  "| **Toast** | 独立「前厅」：点餐界面设置、快速点餐、桌边服务、服务区与餐位、移动点餐 | 桌台独立成组；操作按钮显隐、工具栏与菜单布局分轨 |",
  "| **Snackpass** | 设置→前台：全渠道 / 在线 / Kiosk与收银台；小费单独页 | 食客端规则与菜单分轨；终端用标签表达渠道 |",
  "| **Square** | 履行方式分 POS/线上；设备模式 | 组内用终端列标注 scope |",
  "| **Peblla** | 设置中心 + 表单「适用场景/渠道」 | 组内用终端列标注 scope |",
  "| **Clover** | 前厅弱，多在设置→交易 | 订单类型/折扣等留在订单/支付中心 |",
  "",
  "### 2.1 前厅设置五维（商户心智）",
  "",
  "```text",
  "桌台与餐位 → POS 收银点单 → 食客端扫码点餐 → 客显屏",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（12 组，方案 D-紧凑，已确认）",
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
  "### 3.0 v3.5 变更说明（场景点餐拆 3 组，已确认）",
  "",
  "原 **`foh-guest-scenario-dining`（场景点餐，13 条）** 拆为：",
  "",
  "| 新组 | groupKey | 条数 | seq |",
  "|------|----------|------|-----|",
  "| 食客端送厨 | `foh-guest-kitchen-send` | 2 | 581、502 |",
  "| 火锅点餐 | `foh-guest-hotpot` | 5 | 570、572、574、573、575 |",
  "| 时长与自助餐 | `foh-guest-duration-scenarios` | 6 | 443、571、577–580 |",
  "",
  "侧栏顺序：… → 菜单展示与购物车 → **食客端送厨 → 火锅点餐 → 时长与自助餐** → 桌边服务 → …",
  "",
  "书签：`foh-guest-scenario-dining` / `guest-scenario-dining` / `guest-channel-kitchen-send` → `foh-guest-kitchen-send`；`guest-hotpot` → `foh-guest-hotpot`；`guest-duration-scenarios` → `foh-guest-duration-scenarios`。",
  "",
  "### 3.0.1 v3.4 变更说明（侧栏员工端/食客端视觉分隔，已确认）",
  "",
  "前厅设置二级侧栏在 **清桌与企台** 与 **订单类型与取餐** 之间插入分段：",
  "",
  "- **员工端**（11 组）：`foh-pos-shell` … `foh-table-clear-ops`",
  "- **食客端**（11 组）：`foh-guest-order-type` … `foh-wait-time-display`",
  "",
  "catalog 字段 `groupNavSections`（`labelKey` + `groupKeys`）；UI 见 `renderModuleSettingsSubnavList`。",
  "",
  "### 3.0.2 v3.3 变更说明（侧栏动线重排，方案 A，已确认）",
  "",
  "20 组按 **员工端完整一单 → 食客端完整旅程** 重排侧栏（仅调整 `groupOrder`，不改 groupKey/归属）：",
  "",
  "**A 员工端（11）**：登录与主界面 → 选桌与开台流程 → 菜单查找与时段 → 菜单区界面布局 → 订单行与客户信息 → 套餐与自定义点单 → POS 操作按钮 → 送厨时机 → POS 找单列表 → POS 结账入口 → 清桌与企台",
  "",
  "**B 食客端（11）**：订单类型与取餐 → 食客登记与会员 → 点单前须知与授权 → 食客端语言 → 点餐首页与入口 → 菜单展示与购物车 → 食客端送厨 → 火锅点餐 → 时长与自助餐 → 桌边服务 → 排队与等待展示",
  "",
  "相对 v3.2 挪动：**登录与主界面** 置顶；**清桌与企台** 移至结账入口之后；**食客端语言** 提前至菜单展示之前。",
  "",
  "### 3.0.3 v3.2 变更说明（桌台与开台拆 2 组，已确认）",
  "",
  "原 **`foh-tables-start`（桌台与开台，13 条）** 拆为：",
  "",
  "| 新组 | groupKey | 条数 | seq |",
  "|------|----------|------|-----|",
  "| 选桌与开台流程 | `foh-table-start-flow` | 8 | 107、619、111、625、621、643、644、592 |",
  "| 清桌与企台 | `foh-table-clear-ops` | 5 | 169、534、642、351、347 |",
  "",
  "侧栏顺序：**选桌与开台流程 → 清桌与企台** → 登录与主界面 → …",
  "",
  "书签：`foh-tables-start` / `tables-floor` / `pos-order-init` → `foh-table-start-flow`；`table-clear-ops` → `foh-table-clear-ops`。",
  "",
  "### 3.0.4 v3.1 变更说明（POS 菜单布局拆 2 组，已确认）",
  "",
  "原 **`foh-pos-menu-layout`（POS 菜单布局，11 条）** 拆为：",
  "",
  "| 新组 | groupKey | 条数 | seq |",
  "|------|----------|------|-----|",
  "| 菜单查找与时段 | `foh-pos-menu-scope` | 5 | 118、148、176、177、348 |",
  "| 菜单区界面布局 | `foh-pos-menu-ui-layout` | 6 | 216–218、220、219、350 |",
  "",
  "侧栏顺序：… → 登录与主界面 → **菜单查找与时段 → 菜单区界面布局** → 订单行与客户信息 → …",
  "",
  "书签：`foh-pos-menu-layout` / `pos-menu-ui` → `foh-pos-menu-scope`；`pos-menu-ui-layout` → `foh-pos-menu-ui-layout`。",
  "",
  "### 3.0.5 v1.25 变更说明（默认主界面迁前厅，已确认）",
  "",
  "自系统设置 `ui-operation-preferences` 迁入 **`pos-shell-landing`（主界面与导航）**：",
  "",
  "| seq | 功能设置 | 说明 |",
  "|-----|----------|------|",
  "| 165 | 默认主界面 | 员工登录 POS / POS GO / PayPad 后的默认壳层页（MAIN / TABLE / ORDER / RECALL）；**门店 × 产线兜底**；UI：`module-settings-default-main-screen-ui.ts` |",
  "",
  "系统设置 **界面与操作偏好** 仅保留 168（24 小时制）、174（菜单模式）。侧栏置于 `tables-floor` 之后。",
  "",
  "### 3.1 v1.1 变更说明（已确认）",
  "",
  "将原 **POS 操作与按钮**（`pos-actions`，31 条）拆为两组，便于侧栏扫读与对标竞品「按钮显隐」与「工具栏布局」分轨：",
  "",
  "| 新组 | groupKey | 条数 | 范围 |",
  "|------|----------|------|------|",
  "| 操作按钮显隐 | `pos-button-visibility` | 26 | seq 118、164、193–215、196、347 |",
  "| POS 点单页工具栏 | `pos-order-toolbar` | 4 | seq 483–486（整单/菜品详情/订单信息/订单金额） |",
  "",
  "catalog 对 `/operations/queue-call/settings` 使用固定 `groupOrder`，保证侧栏顺序为：桌台 → **主界面与导航** → 开单 → 送厨 → 按钮 → 工具栏 → 点单页 → 找单列表 → **结账入口** → 菜单查找与时段 → 菜单区界面布局 → …",
  "",
  "### 3.2 v1.17 变更说明（结账入口迁前厅，已确认）",
  "",
  "自订单中心 `checkout-entry` 迁入 **`pos-checkout-entry`（POS 结账入口）**：",
  "",
  "| seq | 功能设置 |",
  "|-----|----------|",
  "| 248 | 当用条形码找单时打开单子付款界面 |",
  "| 221 | 支付前确认客户信息 |",
  "",
  "侧栏置于 `pos-find-order-list` 之后；订单中心不再保留结账入口组。",
  "",
  "### 3.2.1 v1.19 变更说明（订单类型范围 + Kiosk 履约流程迁前厅，已确认）",
  "",
  "自外卖/来取迁入 Kiosk 履约流程至 **`guest-order-rules`**：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 487 | 订单类型可用范围（堂吃/外带/来取） | 前厅 · `guest-order-rules` |",
  "| 488 | 展示订单类型选择页面 | 前厅 · `guest-order-rules` |",
  "| 489 | 送餐取餐服务方式（多选） | 前厅 · `guest-order-rules` |",
  "| 490 | 展示取餐方式 | 前厅 · `guest-order-rules` |",
  "| 491 | 打包展示输入号码牌 | 前厅 · `guest-order-rules` |",
  "",
  "外卖/来取仅保留线上下单基础与外送打包；订单中心保留默认新订单类型（126）。",
  "",
  "### 3.3 v1.16 变更说明（找单列表迁前厅，已确认）",
  "",
  "自订单中心 `find-order-list` 迁入 **`pos-find-order-list`（POS 找单列表）**：",
  "",
  "| seq | 功能设置 |",
  "|-----|----------|",
  "| 151 | 显示所有单的总计价格 |",
  "| 152 | 显示「关闭以下全部单子」按钮 |",
  "| 153 | 默认显示未加小费订单 |",
  "| 251 | 找单界面打印所选收据类型 |",
  "",
  "（seq 154「盘点模式」已下线，不再展示。）",
  "",
  "与 `pos-order-cart`（点单购物车）分轨。",
  "",
  "### 3.4 v1.15 变更说明（点单界面迁前厅，已确认）",
  "",
  "自订单中心移除 **`order-ui`**，新增 **`pos-order-cart`（点单页展示）**：",
  "",
  "| seq | 功能设置 | 说明 |",
  "|-----|----------|------|",
  "| 121 | 订单数量支持小数 | 行项数量 |",
  "| 122 | 减菜后自动重定向 | 点单交互 |",
  "| 132 | 点单显示座位 | 按订单类型 |",
  "| 133 | 相同菜品展示 | 与 134 合并单选（拆分/合并） |",
  "| 135–137 | 菜序/键盘/ASAP | 点单页展示 |",
  "| 178 | 显示单菜序号 | 单菜设置 |",
  "",
  "与 **`foh-pos-menu-scope` / `foh-pos-menu-ui-layout`**（菜单查找与布局）分工：本组管购物车行项，彼两组管菜单区。",
  "",
  "### 3.3 v1.14 变更说明（送厨策略迁前厅，已确认）",
  "",
  "自订单中心移除 **`kitchen-send`**，迁入 **`pos-kitchen-send`**：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 113 | 点击「送厨」整单送厨 | 前厅 · `pos-kitchen-send` |",
  "| 114 | 点击「付款」直接送厨 | 前厅 · `pos-kitchen-send` |",
  "| 120 | 结账后自动送厨 | 前厅 · `pos-kitchen-send` |",
  "| 123 | 打单后自动送厨 | 前厅 · `pos-kitchen-send` |",
  "| 125 | 延迟送厨时间 | 前厅 · `pos-kitchen-send` |",
  "",
  "订单中心现为 **6 组**（无 `kitchen-send`）；与后厨 **62/304**、按钮 **198/483** 分工见订单/后厨文档。",
  "",
  "### 3.4 v1.13 变更说明（开单·桌台部分迁前厅，已确认）",
  "",
  "自订单中心 `order-init-scenario` 迁入桌台/人数开单项；**126 默认新订单类型** 留订单中心：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 107 | 跳过选桌 | 前厅 · `tables-floor` |",
  "| 619 | 人数选择 | 前厅 · `tables-floor` |",
  "| 643 | 开单前,换桌 | 前厅 · `tables-floor` |",
  "| 644 | 开单前,必换桌 | 前厅 · `tables-floor` |",
  "| 592 | 不允许一桌多单 | 前厅 · `tables-floor` |",
  "| 108 | 跳过选择人数 | 前厅 · `pos-order-init` |",
  "| 111 | 每单最多客人数量 | 前厅 · `pos-order-init` |",
  "| 625 | 儿童不参与人数计算 | 前厅 · `pos-order-init` |",
  "",
  "订单中心 `order-init-scenario` 仅保留 **126**（1 条）。",
  "",
  "### 3.3 v1.12 变更说明（开单·桌台与场景方案 B，已确认）",
  "",
  "自订单中心 `order-init-scenario` 迁入场景与桌台/POS 相关项：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 571 | 品类先下单 | 前厅 · `guest-order-rules` |",
  "| 572 | 火锅锅底必选 | 前厅 · `guest-order-rules` |",
  "| 574 | 火锅锅底下单方式 | 前厅 · `guest-order-rules` |",
  "| 575 | 同一锅型锅底过半加收 | 前厅 · `guest-order-rules` |",
  "| 533 | 选择桌子页面 | 前厅 · `tables-floor` |",
  "| 110 | 点单超时提醒(分钟) | 前厅 · `pos-order-toolbar` |",
  "",
  "订单中心 `order-init-scenario` 仅保留 POS 通用开单 **107/108/111/126/619/625/643/644/592**（9 条；v1.13 再迁 8 条，仅留 126）；**593** 归商品管理（catalog 不展示）。",
  "",
  "### 3.4 v1.11 变更说明（送厨策略方案 B，已确认）",
  "",
  "历史曾将 **567 菜单延迟送厨** 迁入 `guest-order-rules`；现与 **125 延迟送厨时间**（`pos-kitchen-send`）合并，567 不再在设置滑层展示。",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "",
  "订单中心 `kitchen-send` 仅保留 POS/结账侧 **113/114/120/123/125**（5 条；**v1.14 已全部迁前厅 `pos-kitchen-send`**）。",
  "",
  "### 3.5 v1.10 变更说明（送厨策略方案 A，已确认）",
  "",
  "自订单中心 `kitchen-send` 迁入 C 端/Kiosk 送厨规则至 **`guest-order-rules`**：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 502 | 可自动送厨的订单支付状态 | 前厅 · `guest-order-rules` |",
  "| 581 | 菜单送厨方式 | 前厅 · `guest-order-rules` |",
  "",
  "订单中心 `kitchen-send` 保留 POS/结账侧 **113/114/120/123/125**（5 条；567 在 v1.11 迁出；**v1.14 已全部迁前厅 `pos-kitchen-send`**）。",
  "",
  "### 3.6 v1.9 变更说明（已确认）",
  "",
  "收紧 **操作按钮显隐** 边界，仅保留 seq **193–215**（是否收入「更多」）；其余迁出后，`148` 已在 v1.8 归位前厅；v1.9 将 `655–661` 自商品中心迁入前厅 `guest-menu-scenarios`：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 118 | 搜索菜单 | 前厅 · `pos-menu-ui` |",
  "| 196 | 自定义分割线名称 | 前厅 · `pos-order-toolbar` |",
  "| 347 | 允许更换企台 | 前厅 · `tables-floor` |",
  "| 164 | 自定义折扣原因 | 订单中心 · `discount-void`（与 162/163 同组） |",
  "| 148 | 比价功能模式 | 前厅 · `pos-menu-ui`（v1.8） |",
  "| 443 | 按时计价 | 前厅 · `guest-order-rules`（v1.8） |",
  "| 655–661 | 品类设置/分类设置（自助餐与场景菜单） | 前厅 · `guest-menu-scenarios`（v1.9） |",
  "",
  "设置 catalog 通过 `scripts/lib/settings-hub-override.mjs` 挂载跨 hub 项（**不修改**终版原文）。",
  "",
  "### 3.7 POS 菜单拆组后组内排序（已确认）",
  "",
  "- **`foh-pos-menu-scope`**：118 搜索 → 148 比价 → 176/177 时段 → 348 iPad 时段",
  "- **`foh-pos-menu-ui-layout`**：216 组 → 217 类 → 218 菜 → 220 价格 → 219 按钮样式 → 350 iPad 消息",
  "",
  "### 3.8 客显屏边界收紧（已确认）",
  "",
  "结账交互迁支付中心；**界面语言**迁 §3.14；客显屏组内封面/Logo/场景见 §3.15：",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 463 | 小费（客显屏展示小费页） | 支付中心 · `cds-checkout-ux` |",
  "| 465 | 小票（客显屏自主选择打印） | 支付中心 · `cds-checkout-ux` |",
  "| 467 | 语言设置 | catalog 不展示（SSOT 652/653，见 §3.14） |",
  "",
  "### 3.9 备注项去重（已确认）",
  "",
  "从 `guest-notes-fees` **移除** seq **609、610**（全局「展示菜品/订单备注」），与 **522 商品备注、521 订单备注** 场景重复；catalog 不展示 609/610。",
  "",
  "### 3.10 备注组边界收紧（已确认）",
  "",
  "seq **616、617、618**（购物车送厨状态/价格/售罄隐藏）自备注组迁入食客端菜单（v1.3 为 **`guest-menu-cart`**）；`guest-notes-fees` 仅保留备注 521–523 与附加费 544、545。",
  "",
  "### 3.11 下单与规则边界收紧（已确认）",
  "",
  "seq **600**（全局纯展示模式，不可加购）自下单规则迁入食客端菜单（v1.3 为 **`guest-menu-global`**）；v1.8 将 `443` 并入 `guest-order-rules`；v1.10/v1.11 送厨迁入；**v1.12** 并入火锅/品类 **571–575**，当前组内 18 条。",
  "",
  "| 配置 | seq | 说明 |",
  "|------|-----|------|",
  "| 全局纯展示 | 600 | 前厅 · `guest-menu-global`（v1.3） |",
  "| 单桌/设备纯展示 | 561 | 硬件管理中心（覆盖关系见硬件方案） |",
  "",
  "### 3.12 菜单展示去重与硬件分工（已确认）",
  "",
  "**catalog 去重**（保留服务设置 SSOT，不展示全局重复项）：",
  "",
  "| 保留（SSOT） | 排除（catalog 不展示） |",
  "|--------------|------------------------|",
  "| 515 展示菜单序号 | 614 展示菜品编号 |",
  "| 516 显示组名称 | 605 展示组名称 |",
  "| 524 瀑布流模式 | 603 瀑布流模式 |",
  "| 528 菜价为0展示价格 | 613 菜价为0,展示价格 |",
  "",
  "**全局 vs 硬件双入口**（均保留在前厅 catalog，文档约定覆盖关系）：",
  "",
  "| 能力 | 前厅 seq | 硬件 seq |",
  "|------|----------|----------|",
  "| 默认展示菜单组 | 599 | 560 |",
  "| 纯展示模式 | 600 | 561 |",
  "| eMenu Pro 版式 | 604 | 569 |",
  "",
  "### 3.13 食客端菜单展示拆组（v1.3，已确认）",
  "",
  "原 **`guest-menu`**（23 条）侧栏单组过长，并在 v1.9 吸收商品中心自助餐场景菜单（655–661），现按「菜单结构 / 品类与场景菜单 / 全局展示 / 购物车」拆为 4 个二级导航：",
  "",
  "| 新组 | groupKey | 条数 | seq |",
  "|------|----------|------|-----|",
  "| 食客端·菜单结构 | `guest-menu-structure` | 8 | 515–520、524、528 |",
  "| 食客端·品类与场景菜单 | `guest-menu-scenarios` | 7 | 655–661 |",
  "| 食客端·首页与版式 | `guest-menu-global` | 11 | 532、599–611、600、604、645 |",
  "| 食客端·购物车展示 | `guest-menu-cart` | 3 | 616–618 |",
  "",
  "侧栏顺序：… → POS 菜单与布局 → **菜单结构 → 品类与场景菜单 → 首页与版式 → 购物车** → 界面语言 → 下单与规则 → …",
  "",
  "### 3.14 对客界面语言（v1.4，已确认）",
  "",
  "**问题**：467 挂在客显屏，但 eMenu / Kiosk 等同属 C 端也需配置界面语言；513/514 与 652/653 为重复入口。",
  "",
  "| 能力 | catalog SSOT | 排除（不展示） | 生效渠道 |",
  "|------|--------------|----------------|----------|",
  "| 可选语言列表 | 652 | 513、467 | eMenu、Kiosk、客显等 C 端 UI |",
  "| 默认语言 | 653 | 514 | 同上 |",
  "",
  "- **挂载**：652/653 终版归属系统设置，经 `settings-hub-override.mjs` 在前厅 **`guest-facing-locale`** 展示（不改终版原文）。",
  "- **分工**：**109** 留在系统设置（店员 POS 默认语言）；**456** 在商品中心（菜单文案多语言）。",
  "",
  "### 3.15 C 端视觉与客显分工（v1.5–v1.7，已确认）",
  "",
  "侧栏为单一 **「客显屏」**（`cds`，3 条）；组内顺序：461 封面 → 462 Logo → 466 场景启用。",
  "",
  "| 能力 | 入口 hub | seq | 说明 |",
  "|------|----------|-----|------|",
  "| 客显屏封面、Logo | 前厅 · `cds` | 461、462 | 客显专用；滑层注明「维护请至素材中心」 |",
  "| Pickup/Delivery 启用客显 | 前厅 · `cds` | 466 | 前场渠道规则 |",
  "| Kiosk/eMenu 首页封面、门店 Logo | **营销中心 / 门店管理** | 555、556；433 餐厅 LOGO → 门店档案 | 默认展示，无显隐开关 |",
  "| eMenu/Kiosk MenuSifu 品牌露出 | 前厅 · `guest-menu-global` | 532 | 是否展示（显隐） |",
  "| 屏显图片库 | **素材中心** | 431 | 图片库维护 |",
  "",
  "---",
  "",
  "## 4. 分类结果明细",
  "",
);

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(`### 4.${i + 1} ${titles[k]}（\`${k}\`）`, "", `**归类理由**：${reasons[k]}`, "");
  if (k === "foh-table-start-flow") {
    push(
      "",
      "**组内展示顺序**：107 选桌页 → 619 人数页 → 111/625/621 人数规则 → 643/644 开单前换桌 → 592 一桌多单。",
      "",
      "**107/533** 为选桌 SSOT；**108/619** 为人数页 SSOT；**126** 默认单型留订单中心。",
      "",
    );
  }
  if (k === "foh-table-clear-ops") {
    push(
      "",
      "**组内展示顺序**：169 付款后清桌 → 534 自动清桌 → 642 清桌按钮 → 351 清桌通知 → 347 更换企台。",
      "",
    );
  }
  if (k === "pos-button-visibility") {
    push(
      "",
      "**组内展示顺序**：193–195 删单/移单/清桌 → 197–212 常见按键 → 213–215 其他按键。",
      "",
      "**193–215** 右侧**开关**（关闭/开启标签，保留功能场景描述；原型 localStorage）。**196** 归 `pos-order-toolbar`。",
      "",
    );
  }
  if (k === "guest-menu-structure") {
    push(
      "",
      "**组内展示顺序**：515–520 菜单树 → 524 瀑布流 → 528 零价展示。",
      "",
      "**SSOT**：515/516/524/528；不含全局重复项 603/605/613/614（见 §3.12）。",
      "",
    );
  }
  if (k === "guest-menu-scenarios") {
    push(
      "",
      "**组内展示顺序**：655–657 品类设置（自助餐）→ 658–661 分类设置（场景菜单）。",
      "",
      "**655–661** 统一归前厅 C 端运营配置，避免与商品主数据维护入口重叠。",
      "",
    );
  }
  if (k === "guest-menu-global") {
    push(
      "",
      "**组内展示顺序**：532 品牌 → 599/601/602/604 模式与菜单组 → 606–608 列表 → 611 首页 → 600 纯展示 → 645 字体。",
      "",
      "**532** 为 MenuSifu 品牌露出显隐（原 612 已合并）；**封面/门店 Logo 换图** 见素材中心 §3.15。**600/599/604** 与硬件 561/560/569 见 §3.12。",
      "",
      "**全组** 右侧**开关**（关闭/开启，保留功能场景描述）。**608 展示菜详情**：开启后可选无属性菜；**607 菜单图片展示模式**：原始/小图/大图 + 大图菜选择；**645 菜品名称字体大小**：字号（px，默认 16）。",
      "",
    );
  }
  if (k === "guest-menu-cart") {
    push(
      "",
      "**组内展示顺序**：616 送厨状态 → 617 订单价格 → 618 售罄隐藏。",
      "",
      "**616–618** 右侧**开关**（关闭/开启标签，保留功能场景描述；原型 localStorage）。",
      "",
    );
  }
  if (k === "guest-facing-locale") {
    push(
      "",
      "**组内展示顺序**：652 可选语言 → 653 默认语言。",
      "",
      "**SSOT**：652/653；不含 467/513/514（见 §3.14）。**109** 为店员端，归系统设置。",
      "",
      "**652 选择语言**：多选（英语、中文简体、中文繁体、法语、日语、俄语、西班牙语、越南语、泰语、韩语；默认勾选英语+中文简体）。**653 默认语言**：单选，选项随 652 已选语言联动（原型 localStorage）。",
      "",
    );
  }
  if (k === "foh-guest-kitchen-send") {
    push(
      "",
      "**组内展示顺序**：581 菜单送厨方式 → 502 可自动送厨的订单支付状态。",
      "",
    );
  }
  if (k === "foh-guest-hotpot") {
    push(
      "",
      "**组内展示顺序**：570 火锅页面提示 → 572 锅底必选 → 574 下单方式 → 573 下单后仍展示 → 575 过半加收。",
      "",
      "**570** 右侧**开关**；开启后展开**标题**（20 字）、**内容**（200 字）。**572–575、573** 右侧**开关** + 产线多选（原型 localStorage）。",
      "",
    );
  }
  if (k === "foh-guest-duration-scenarios") {
    push(
      "",
      "**组内展示顺序**：443 按时计价 → 571 品类先下单 → 577 展示用餐时长 → 578 倒计时 → 579 剩余提示 → 580 提示后禁下单。",
      "",
      "**577–580** 右侧**开关** + 产线多选（原型 localStorage）。",
      "",
    );
  }
  if (k === "guest-order-rules") {
    push(
      "",
      "**组内展示顺序**：502/581 送厨 → 443 计价 → 571/572/574/575/573 火锅·品类 → 569/570 提示 → 577–580 用餐时长 → 597/598 轮次规则。",
      "",
      "**571–575、573** 右侧**开关**（保留功能场景描述）：品类先下单、火锅锅底必选/下单方式/加收、锅底下单后仍展示等（原型 localStorage）。",
      "",
      "**569 点单须知 / 570 火锅页面提示**：右侧**开关**（保留功能场景描述）；开启后展开**标题**（20 字）、**内容**（200 字）及字数统计（原型 localStorage）。",
      "",
      "**573、577–580** 右侧**开关**（保留功能场景描述）：火锅锅底下单后仍展示锅底、展示用餐时长、用餐时长倒计时展示、用餐剩余时长提示、用餐剩余时长提示后不允许下单。",
      "",
      "**597 每轮菜品互斥下单**：主开关 + 规则行（下单菜品 ⇄ 互斥 ⇄ 不可再下单菜品），支持**增加**多条；**598 每轮菜品组合下单**：主开关 + **下单菜品**、**订单中必须再包含任意菜品 N 份**、必选菜品，支持**增加**多条（原型菜品标签 + localStorage）。",
      "",
    );
  }
  if (k === "guest-notes-fees") {
    push(
      "",
      "**SSOT 备注**：521 订单、522 商品、523 套餐子项；**附加服务**：544 餐具、545 打包带。",
      "",
      "**521–523** 右侧**开关**（保留功能场景描述）；**544/545** **关闭/开启**主开关，开启后展开**单选**：免费、`$1.5`、其他金额（原型 localStorage）。",
      "",
    );
  }
  if (k === "wait-time") {
    push(
      "",
      "**535/536** 主开关 + 子项（分钟/杯数）；**537** 多选（排队数量/等待时间）；**538** 字体大小（默认/倍数）；**539/540** 字体背景色/颜色（默认/自定义色块）。",
      "",
    );
  }
  if (k === "cds") {
    push(
      "",
      "**组内展示顺序**：461 封面 → 462 Logo → 466 场景启用。",
      "",
      "**461/462/466** 设置滑层右侧提供**开关**，控制是否展示（原型 localStorage）；461/462 附「维护请至素材中心」。Kiosk/eMenu 封面·Logo 见 §3.15。",
      "",
    );
  }
  if (k === "foh-pos-menu-scope") {
    push(
      "",
      "**组内展示顺序**：118 搜索菜单 → 148 比价 → 176/177 堂吃/外食时段 → 348 iPad 按时段。",
      "",
    );
  }
  if (k === "foh-pos-menu-ui-layout") {
    push(
      "",
      "**组内展示顺序**：216 组平铺 → 217 类展示 → 218 菜展示 → 220 显示价格 → 219 按钮颜色满铺 → 350 电子菜单自定义消息。",
      "",
    );
  }
  push("| seq | 终端 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
  push("|-----|------|--------|----------|----------|----------------------|");
  for (const r of sortItemsInGroup(by.get(k))) {
    const scene = buildCatalogSceneDesc(r.seq, r.sceneDesc);
    push(
      `| ${r.seq} | ${r.terminal} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(scene)} |`,
    );
  }
  push("");
}

push(
  "---",
  "",
  "## 5. 与旧分组对照（26 组 → 14 组）",
  "",
  "| 新 groupTitle | 吸收的旧分组示例 |",
  "|---------------|------------------|",
  "| 桌台与餐位 | 平面图、桌子设置、企台操作权限 |",
  "| 操作按钮显隐 | 常见按键、其他按键（隐藏到「更多」） |",
  "| POS 点单页工具栏 | 点单页配置、分割线命名 |",
  "| POS 菜单与布局 | 点餐界面模式、时段菜单、搜索菜单 |",
  "| 食客端·菜单结构 | 服务设置·菜单（515–520、524、528） |",
  "| 食客端·品类与场景菜单 | 自助餐品类与场景菜单（655–661） |",
  "| 食客端·首页与版式 | 全局展示设置、菜单样式、首页入口；不含全局重复项 |",
  "| 食客端·购物车展示 | 购物车送厨/价格/售罄展示（616–618） |",
  "| 食客端·界面语言 | 全局多语言 652/653（eMenu·Kiosk·客显 C 端 UI） |",
  "| 食客端·下单与规则 | 提示信息、下单设置（火锅/用餐时长/轮次，不含纯展示） |",
  "| 备注与附加服务 | 备注（521–523）、餐具/打包附加费（544、545） |",
  "| 等待时长提示 | 等待时长 |",
  "| 客显屏 | 封面、Logo（461/462）、场景启用（466）；语言见食客端·界面语言 |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 按本文 **第 4 节** 更新 `docs/项目文档/配置归类-分组映射.csv` 中对应 `seq` 的 `groupTitle`、`groupKey`",
  "2. 执行：`node scripts/apply-foh-settings-mapping.mjs`（可选，与本文映射一致）",
  "3. 执行：`cd admin-web && npm run build:settings-catalog`",
  "4. 执行：`apply-order-settings-mapping.mjs`、`apply-product-settings-mapping.mjs`、`apply-payment-settings-mapping.mjs`",
  "5. 在前厅 / 订单 / 商品 / 支付中心 → 设置 页验证二级导航",
  "",
  "### 6.1 映射表（可直接写入 CSV）",
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
  "- **送厨时机、支付方式、税率** 等以订单/支付/商品中心为主入口；前厅保留界面与交互项。",
  "- **客显屏**（`cds`）：461/462/466；与素材中心、guest-menu-global 分工见 §3.15。",
  "- **C 端界面语言**（652/653）在 `guest-facing-locale`；**小费页、小票**（463、465）在支付中心。",
  "- **菜单文案多语言**（456）在商品中心；**店员默认语言**（109）在系统设置。",
  "- 670 条中属于前厅的 100 条均已列入上文；另经 hub override 自商品/订单增补项，不删项。",
  "- **107/533** 选桌、**108/619** 人数页已合并至前厅；**126** 默认单型留订单中心；**593** 归商品管理。",
  "- **v1.25 自系统设置迁入**：**165** → `pos-shell-landing`（POS 登录默认主界面；门店 × 产线兜底；UI：`module-settings-default-main-screen-ui.ts`）。",
  "- **v1.24 自会员中心迁入**：**622** → `guest-order-rules`（紧挨 **623**；开通会员后各产线登录/注册是否须短信验证码；UI：`module-settings-member-sms-verification-ui.ts`）。",
  "- **v1.23 自会员中心迁入**：**505/507/510** → `guest-order-rules`（与 **504/506** 输入页配套：必填与隐私默认；取餐联络，非会员专属；UI：`module-settings-member-registration-fields-ui.ts`）。",
  "- **v1.22 自会员中心迁入**：**623** → `guest-order-rules`（点单前登录门禁，紧挨 504/506；UI：`module-settings-member-login-policy-ui.ts`）。",
  "- **v1.21 自会员中心迁入**：**509** → `guest-menu-global`；**525/526** → `guest-menu-structure`；**527** → `guest-order-rules`（UI：`module-settings-member-points-rewards-ui.ts`）。",
  "- **v1.20 自会员中心迁入**：**10** → `cds`；**222/223** → `pos-order-cart`；**504/506** → `guest-order-rules`（504 合并原 **30**）。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
