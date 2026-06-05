/**
 * 生成 docs/项目文档/主页-设置二级导航重设计方案.md
 * 主页 catalog 已清空（551 → 营销中心；531 → 门店管理品牌与菜单）
 * 运行：node scripts/generate-home-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const outPath = path.join(projectDocs, "主页-设置二级导航重设计方案.md");

const migratedOut = [
  { seq: 551, title: "屏保", page: "/marketing/screensaver" },
  {
    seq: 531,
    title: "品牌页作为首页",
    page: "/stores/brand-menu",
    note: "已并入 seq 530「品牌页作为首页」单开关 + 产线多选",
  },
];

const lines = [
  "# 主页 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.2（catalog 已清空）  ",
  "> 数据范围：主页 **无** 设置 catalog 条目；终版 hub 2 条均已迁出  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "主页定位为**经营工作台**（KPI、待办、快捷入口），不承担终端壳层配置 SSOT。",
  "",
  "| 指标 | 结论 |",
  "|------|------|",
  "| 设置滑层 | **移除**「主页 → 设置」入口 |",
  "| 遗留路由 | `#/dashboard/settings` 重定向至 `#/stores/brand-menu` |",
  "",
  "---",
  "",
  "## 2. 已迁出 catalog",
  "",
  "| seq | 设置项 | 新 SSOT | 说明 |",
  "|-----|--------|---------|------|",
];

for (const x of migratedOut) {
  lines.push(`| ${x.seq} | ${x.title} | \`${x.page}\` | ${x.note ?? "—"} |`);
}

lines.push(
  "",
  "---",
  "",
  "## 3. 落地步骤",
  "",
  "1. `SETTINGS_HUB_OVERRIDE_BY_SEQ`：531 → 门店管理",
  "2. `SETTINGS_CATALOG_PATH_BY_SEQ`：531 → `/stores/brand-menu`",
  "3. `node scripts/apply-store-settings-mapping.mjs`",
  "4. `cd admin-web && npm run build:settings-catalog`",
  "5. 移除 `navigation.ts` 中主页「设置」子项；验证 `#/dashboard/settings` 重定向",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (0 catalog items, ${migratedOut.length} migrated out)`);
