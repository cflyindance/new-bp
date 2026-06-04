/**
 * 生成 docs/项目文档/商品中心-设置二级导航重设计方案.md
 * v2.2：139/145 已迁前厅 pos-combo-ordering；商品中心无 settings catalog。
 * 运行：node scripts/generate-product-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const outPath = path.join(projectDocs, "商品中心-设置二级导航重设计方案.md");

const lines = [
  "# 商品中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v2.2（已确认）  ",
  "> 数据范围：商品设置 catalog **0** 条（主数据在商品管理/品牌菜单/门店管理业务页）  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "商品中心不设独立「设置」滑层 catalog（与硬件中心同模式）。套餐点单行为类配置已迁至 **前厅管理中心 · 套餐点单与展示**（`pos-combo-ordering`）。",
  "",
  "### 1.1 商品管理 vs 设置滑层",
  "",
  "| 能力 | 维护入口 | 原 seq |",
  "|------|----------|--------|",
  "| 菜品默认大小 | 商品管理 · 商品 | 112 |",
  "| 默认全局调味价格 | 商品管理 · 调味管理 | 146 |",
  "| 菜单文案多语言 | 商品管理 · 商品多语言 | 456 |",
  "| 菜谱管理 | 商品管理 · 配方管理 | 476 |",
  "| 按人数默认收费菜品 | 商品管理 · 菜单/商品 | 593 |",
  "",
  "### 1.2 v2.2 变更（套餐点单迁出 + 设置滑层下线）",
  "",
  "| seq | 功能设置 | 迁入 |",
  "|-----|----------|------|",
  "| 139 | 自动点完套餐 | 前厅 · `pos-combo-ordering` |",
  "| 145 | 可调套餐显示子菜价格 | 前厅 · `pos-combo-ordering` |",
  "",
  "侧滑层移除「设置」入口；`#/product-center-main/settings` 书签重定向至商品管理。",
  "",
  "---",
  "",
  "## 2. 推荐二级导航结构",
  "",
  "**无 catalog 分组。** 见前厅 `docs/项目文档/前厅管理中心-设置二级导航重设计方案.md` · **套餐点单与展示**。",
  "",
  "---",
  "",
  "## 3. 落地步骤",
  "",
  "1. `node scripts/apply-foh-settings-mapping.mjs`（写入 139/145 → pos-combo-ordering）",
  "2. `settings-hub-override.mjs`：139/145 → 前厅管理中心",
  "3. `SETTINGS_HUBS_WITHOUT_CATALOG` 增加「商品中心」",
  "4. `cd admin-web && npm run build:settings-catalog`",
  "5. 前厅 → 设置 → **套餐点单与展示**",
  "",
  "---",
  "",
  "## 4. 边界说明",
  "",
  "- 112/146/456/476/593 等在商品管理维护，catalog 不重复展示。",
  "- **139/145** 见前厅 `pos-combo-ordering`；POS 行项展示见 `pos-order-cart`。",
  "- 食客端套餐 UI（520 步骤导航、523 子项备注）仍在前厅对应分组。",
  "",
];

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (0 catalog groups)`);
