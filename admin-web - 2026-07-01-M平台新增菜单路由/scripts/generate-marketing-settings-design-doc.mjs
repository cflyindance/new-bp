/**
 * 生成 docs/项目文档/营销中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-marketing-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "营销中心-设置二级导航重设计方案.md");

const HUB = "营销中心";

/** 已迁至功能页、不再进入设置 catalog 的 seq */
const migratedToFeaturePages = [
  { seq: 553, page: "海报 Pro", path: "/marketing/poster-pro" },
  { seq: 557, page: "广告", path: "/marketing/ads" },
  { seq: 648, page: "广告（投放位与触发）", path: "/marketing/ads" },
  { seq: 649, page: "广告（展示海报按钮）", path: "/marketing/ads" },
  { seq: 651, page: "广告（首页视频 / 开启视频）", path: "/marketing/ads" },
];

const migratedSeqs = new Set(migratedToFeaturePages.map((m) => m.seq));

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => r.hub === HUB);
const unassigned = rows.filter((r) => !migratedSeqs.has(r.seq));
if (unassigned.length) {
  throw new Error(`未归类 seq: ${unassigned.map((r) => r.seq).join(", ")}`);
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 营销中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.2  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 营销中心** 共 **5** 条功能设置  ",
  "> **设置滑层已清空**：全部迁至 **广告**、**海报 Pro** 功能页；侧栏不再展示「设置」入口  ",
  "",
  "---",
  "",
  "## 1. 变更说明",
  "",
  "| 原设置项 | seq | 新归属 |",
  "|----------|-----|--------|",
  "| 海报 Pro | 553 | `/marketing/poster-pro` |",
  "| 广告设置 | 557 | `/marketing/ads` |",
  "| 开启海报 / 展示海报按钮 | 648 / 649 | `/marketing/ads` |",
  "| 开启视频（首页视频） | 651 | `/marketing/ads` |",
  "",
  "---",
  "",
  "## 2. 已迁至功能页（`settings-catalog-exclusions.mjs`）",
  "",
  "| seq | 功能页 | 路由 |",
  "|-----|--------|------|",
);
for (const m of migratedToFeaturePages) {
  push(`| ${m.seq} | ${m.page} | \`${m.path}\` |`);
}
push(
  "",
  "---",
  "",
  "## 3. 落地步骤",
  "",
  "1. `cd admin-web && npm run build:settings-catalog`",
  "2. 验证营销中心侧栏无「设置」；访问 `#/marketing/settings` 应重定向至 `#/marketing/ads`",
  "",
  "---",
  "",
  "## 4. 边界说明",
  "",
  "- 终版表 5 条语义保留；均通过 exclusions 排除出设置滑层。",
  "- 671「下单弹海报」在广告功能页维护（原型 seq，非终版独立行）。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (0 catalog items, ${migratedToFeaturePages.length} migrated)`);
