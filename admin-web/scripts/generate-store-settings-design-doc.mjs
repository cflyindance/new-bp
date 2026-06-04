/**
 * 生成 docs/项目文档/门店管理-设置二级导航重设计方案.md
 * 运行：node scripts/generate-store-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { getSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "门店管理-设置二级导航重设计方案.md");

const HUB = "门店管理";

const titles = {
  "store-profile": "门店档案",
  "store-hours-operation": "营业与运营",
  "brand-menu-presentation": "品牌与菜单展示",
  "address-data-maintenance": "地址数据维护",
};

const reasons = {
  "store-profile":
    "门店静态档案（名称、联系、地址、国家/地区、餐厅 LOGO）；433 自素材中心迁入；打印小票专用 LOGO 见打印中心。",
  "store-hours-operation":
    "营业时段、营业周期、打烊前提示与餐厅模式；418 与 582 同组配置，减少跨导航查找。",
  "brand-menu-presentation":
    "本店品牌启用、品牌↔菜单绑定及多品牌展示模式（547 为数据，530 为展示；548 已并入 547）；对标连锁「Location 级品牌配置」。",
  "address-data-maintenance":
    "地址数据批量上传/删除等运维动作；终版 hub 为空项，暂归门店实施维护（若确认为外送地址库 SSOT 可迁至外卖/来取）。",
};

/** seq → groupKey（门店管理设置 catalog 11 条；421 已迁评价中心） */
const MERGED_EXCLUDED_SEQS = new Set([548]);

/** seq → groupKey（门店管理设置 catalog 10 条；421 已迁评价中心；548 并入 547） */
const assignMap = {
  "store-profile": [173, 417, 433],
  "store-hours-operation": [418, 77, 582, 170],
  "brand-menu-presentation": [530, 547],
  "address-data-maintenance": [419, 420],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

const SCENE_SUMMARY_OVERRIDE_BY_SEQ = new Map([
  [419, "批量上传地址数据（运维；若为外送顾客地址库则与外卖/来取边界待产品确认）"],
  [420, "批量删除地址数据（运维；同上）"],
  [530, "菜单是否按多品牌分类展示（先选品牌再点餐）；展示模式，非品牌主数据"],
  [547, "配置一个门店有哪些品牌，并为每个品牌绑定营业时间与菜单（原 seq 548 并入）"],
  [582, "营业时间结束前 N 分钟提示（与 seq 418 营业时段联动；对客点单时展示）"],
]);

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("营业") || t.includes("周期")) return "营业";
  if (t.includes("品牌") || t.includes("菜单")) return "品牌菜单";
  if (t.includes("地址") || t.includes("删除")) return "数据维护";
  if (t.includes("模式") || t.includes("提醒")) return "运营";
  return "门店信息";
}

function sceneSummary(scene, seq) {
  const override = SCENE_SUMMARY_OVERRIDE_BY_SEQ.get(seq);
  const s = override ?? (scene && scene !== "（未填写）" ? scene : "—");
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => getSettingsHub(r) === HUB && !MERGED_EXCLUDED_SEQS.has(r.seq));
const order = [
  "store-profile",
  "store-hours-operation",
  "brand-menu-presentation",
  "address-data-maintenance",
];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);
if (rows.length !== [...assign.values()].flat().length) {
  throw new Error(`映射条数 ${[...assign.values()].flat().length} ≠ 门店 catalog ${rows.length} 条`);
}

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  by.get(assign.get(r.seq)).push({ ...r, area: inferArea(r.nav, r.moduleName, r.title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 门店管理 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.3（档案/营业拆分；418 自 417 迁出；营业与运营同组）  ",
  "> 数据范围：门店设置 catalog **10** 条（终版本 hub + hub 覆盖；不含 seq 421；seq 548 并入 547）  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 现状问题",
  "",
  "| 指标 | v1.2 问题 | v1.3 处理 |",
  "|------|-----------|-----------|",
  "| 营业配置分散 | 418 在档案组、582 在运营组，商户需跨导航 | **418/77/582/170** 合并为 **营业与运营** |",
  "| 档案组语义混杂 | 「门店档案与营业信息」含档案 + 营业时段 | 拆为 **门店档案** 与 **营业与运营** |",
  "| 跨 hub 项 | seq 421 继承门店 hub | 仍迁至评价中心（v1.1） |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航 **4 组**、**10 条**，符合「先档案 → 再营业 → 再品牌 → 再维护」链路",
  "- seq **421** 迁至 **评价中心**（见 `评价中心-设置二级导航重设计方案.md`）",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（门店设置维度）",
  "",
  "| 竞品 | 门店设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | 门店档案与营业时段分轨 | v1.3 档案与营业分组 |",
  "| **Square** | 位置信息 + 营业规则 + 提醒偏好 | **营业与运营** 同组 |",
  "| **Clover** | 店铺信息、营业时间、经营偏好 | 418+582 同导航 |",
  "",
  "### 2.1 门店设置四维（商户心智）",
  "",
  "```text",
  "门店档案 → 营业与运营 → 品牌与菜单展示 → 地址数据维护",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（4 组）",
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
  "### 3.1 版本沿革（已确认）",
  "",
  "| 版本 | 调整 | 说明 |",
  "|------|------|------|",
  "| v1.1 | 421→评价中心；地址组更名 | 评价治理迁出；419/420 独立为地址数据维护 |",
  "| v1.2 | 417 不单独成组；417 五区表单 | 418 暂合并进 417「营业」分区 |",
  "| **v1.3** | **档案/营业拆分** | 417 去掉营业分区；418 独立行；77/582/170 与 418 同组 |",
  "",
  "### 3.2 v1.3 调整明细",
  "",
  "| 调整 | seq | 原组 | 新组 | 理由 |",
  "|------|-----|------|------|------|",
  "| 档案组瘦身 | 173、417 | `store-profile-hours` | **`store-profile` / 门店档案** | 仅保留静态档案与国家/地区 |",
  "| 营业迁出 417 | 418 | 417 表单内字段 | **`store-hours-operation` / 营业与运营** | 营业时段与打烊提示宜同导航 |",
  "| 运营组合并 | 77、582、170 | `operation-mode-alerts` | **`store-hours-operation`** | 营业周期、打烊提示、餐厅模式与 418 一条链路 |",
  "",
  "### 3.3 组内边界说明",
  "",
  "- **530 vs 547**：547 配置本店启用品牌并绑定菜单；530 为 C 端「先选品牌再点餐」展示模式（与 `/brand` 品牌主数据分工）。",
  "- **418 vs 582**：418 定义营业时段；582 定义结束前 N 分钟对客提示；**同组相邻排序**（418 → 77 → 582 → 170）。",
  "- **419/420**：终版 B 平台 hub 为空；暂归门店运维。若产品确认为外送顾客地址库，可迁至 **外卖/来取** hub。",
  "- **417 vs 419/420**：417 为本店档案地址；419/420 为外送顾客地址库批量运维，**不得**合并组。",
  "- **173 vs 417**：173 为系统国家/地区（US/CA）；417 含地区/邮编。同组展示，173 置于 417 之前（地址区联动待后续迭代）。",
  "",
  "### 3.4 417 表单分区（门店档案 · 四区，已实现）",
  "",
  "| 分区 | 字段 |",
  "|------|------|",
  "| 门店标识 | 餐馆名、门店编号 |",
  "| 联系信息 | 电话1、电话2、传真、网站、邮箱地址 |",
  "| 地址 | 地址栏1、地址栏2、城市、邮编、地区 |",
  "| 商户与证书 | 商家组编号、商家代号、商户编号、经销商、版本证书信息 |",
  "",
  "营业时段不在 417 内；见 **seq 418**：对话框新建营业时间（年月/星期/时间），列表管理；不再单独展示按星期分配的营业时段表。",
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
      `| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc, r.seq)} |`,
    );
  }
  push("");
}

push(
  "---",
  "",
  "## 5. 与旧分组对照",
  "",
  "| 新 groupTitle | 吸收的旧分组 / 变更 |",
  "|---------------|---------------------|",
  "| 门店档案 | 原「门店档案与营业信息」之 173、417（不含 418） |",
  "| 营业与运营 | 原 418 + 原「运营模式与营业提醒」之 77、170、582 |",
  "| 品牌与菜单展示 | 品牌设置、品牌管理（菜单设置并入品牌管理） |",
  "| 地址数据维护 | 数据管理（上传/删除地址；不含评价删除）（不变） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. `node scripts/apply-store-settings-mapping.mjs`",
  "2. `node scripts/apply-reviews-settings-mapping.mjs`",
  "3. `cd admin-web && npm run build:settings-catalog`",
  "4. 门店管理 → 设置、`/reviews/settings` 验证",
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
  "### 6.2 设置滑层控件（原型）",
  "",
  "| 组 / seq | 控件 | 实现 |",
  "|----------|------|------|",
  "| 门店档案 · **173** | 国家/地区单选（United States / Canada） | `module-settings-store-profile-ui.ts` |",
  "| 门店档案 · **417（表单）** | 档案 **17 字段**；四区布局（标识/联系/地址/商户与证书） | `module-settings-store-basic-info-ui.ts` |",
  "| 营业与运营 · **418** | 营业时间库（对话框新建 + 列表；含年月/星期/时间） | `module-settings-store-business-hours-ui.ts` |",
  "| 营业与运营 · **77、582** | 右侧开关 | `module-settings-toggle-ui.ts` → `STORE_HOURS_OPERATION_TOGGLE_SEQ` |",
  "| 营业与运营 · **170** | 餐厅模式单选（Dining / Fast Food） | `module-settings-store-operation-mode-ui.ts` |",
  "| 品牌与菜单展示 · **547** | 本店品牌列表；新增/编辑（名称、图片、418 营业时间多选、品牌菜单多选） | `module-settings-store-brand-management-ui.ts` |",
  "| 品牌与菜单展示 · **530** | 展示开关（先选品牌再点餐） | — |",
  "",
  "**组内排序**（`settings-intra-group-sort.mjs`）：档案 173→417；营业 418→77→582→170。",
  "",
  "---",
  "",
  "## 7. 边界说明",
  "",
  "- **品牌管理**（`/brand`）：品牌主数据与集团策略；本 hub 仅 **本店** 启用哪些品牌及菜单绑定。",
  "- **评价中心**：seq **421** 评价治理；门店设置不再展示。",
  "- **前厅管理中心**：582 若仅强调食客端交互，可在前厅文档加镜像说明；SSOT 与 418 同在 **营业与运营**。",
  "- **外卖/来取**：419/420 若确认为配送地址库，再评估 hub 迁移。",
  "- **417 不单独成二级导航**（v1.2 决策仍有效）；v1.3 仅将 **营业** 从 417 迁至 418 组。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
