/**
 * 导出平台预设 · 配置预设四级导航树 → Markdown + Excel
 * 运行：npx tsx scripts/generate-platform-preset-tree-export.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildPermissionModuleGroups,
  type PermissionTreeNode,
} from "../src/config/permission-registry";
import {
  listAllModuleSettingCatalogEntries,
  type ModuleSettingCatalogItem,
} from "../src/config/module-settings-catalog";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "项目文档");
const MD_PATH = path.join(OUT_DIR, "平台预设-配置预设四级导航树.md");
const XLSX_PATH = path.join(OUT_DIR, "平台预设-配置预设四级导航树.xlsx");
const JSON_PATH = path.join(OUT_DIR, ".platform-preset-tree-export.json");

const LEVEL_LABELS: Record<number, string> = {
  1: "一级导航",
  2: "二级导航",
  3: "三级分组",
  4: "四级设置项",
};

interface FlatRow {
  level: number;
  levelLabel: string;
  key: string;
  parentKey: string;
  moduleId: string;
  moduleTitle: string;
  l1Title: string;
  l2Title: string;
  l3Title: string;
  l4Title: string;
  title: string;
  titleEn: string;
  path: string;
  groupKey: string;
  seq: string;
  featureId: string;
  /** L4：功能场景描述（catalog.sceneDesc） */
  sceneDesc: string;
  /** L4：功能 tooltip（catalog.feature） */
  feature: string;
  /** L4：功能模块（catalog.moduleName） */
  moduleName: string;
  treePath: string;
  indent: string;
}

function buildCatalogBySeq(): Map<number, ModuleSettingCatalogItem> {
  const map = new Map<number, ModuleSettingCatalogItem>();
  for (const { item } of listAllModuleSettingCatalogEntries()) {
    map.set(item.seq, item);
  }
  return map;
}

function cleanCatalogText(value: string | undefined): string {
  const s = (value ?? "").trim();
  if (!s || s === "（未填写）") return "";
  return s;
}

function walkTree(
  node: PermissionTreeNode,
  ancestors: { l1: string; l2: string; l3: string },
  depth: number,
  rows: FlatRow[],
  catalogBySeq: Map<number, ModuleSettingCatalogItem>,
): void {
  const r = node.resource;
  const level = r.level;
  const next = { ...ancestors };
  if (level === 1) next.l1 = r.title;
  if (level === 2) next.l2 = r.title;
  if (level === 3) next.l3 = r.title;

  const indent = "  ".repeat(depth - 1);
  const treePrefix = depth > 1 ? `${indent}└ ` : "";

  const catalogItem = r.seq != null ? catalogBySeq.get(r.seq) : undefined;

  rows.push({
    level,
    levelLabel: LEVEL_LABELS[level] ?? `L${level}`,
    key: r.key,
    parentKey: r.parentKey ?? "",
    moduleId: r.moduleId,
    moduleTitle: r.moduleTitle,
    l1Title: next.l1,
    l2Title: next.l2,
    l3Title: next.l3,
    l4Title: level === 4 ? r.title : "",
    title: r.title,
    titleEn: r.titleEn ?? "",
    path: r.path ?? "",
    groupKey: r.groupKey ?? "",
    seq: r.seq != null ? String(r.seq) : "",
    featureId: r.featureId ?? "",
    sceneDesc: catalogItem ? cleanCatalogText(catalogItem.sceneDesc) : "",
    feature: catalogItem ? cleanCatalogText(catalogItem.feature) : "",
    moduleName: catalogItem ? cleanCatalogText(catalogItem.moduleName) : "",
    treePath: `${treePrefix}${r.title}`,
    indent,
  });

  for (const child of node.children) {
    walkTree(child, next, depth + 1, rows, catalogBySeq);
  }
}

function renderMdTree(
  node: PermissionTreeNode,
  depth: number,
  lines: string[],
  catalogBySeq: Map<number, ModuleSettingCatalogItem>,
): void {
  const r = node.resource;
  const prefix = depth === 1 ? "###" : depth === 2 ? "-" : "  ".repeat(depth - 2) + "-";
  const meta: string[] = [];
  if (r.path) meta.push(`path: \`${r.path}\``);
  if (r.groupKey) meta.push(`groupKey: \`${r.groupKey}\``);
  if (r.seq != null) meta.push(`seq: ${r.seq}`);
  if (r.seq != null) {
    const catalog = catalogBySeq.get(r.seq);
    const sceneDesc = catalog ? cleanCatalogText(catalog.sceneDesc) : "";
    if (sceneDesc) meta.push(`功能表述: ${sceneDesc}`);
  }
  meta.push(`key: \`${r.key}\``);
  const suffix = meta.length ? ` · ${meta.join(" · ")}` : "";

  if (depth === 1) {
    lines.push(`### ${r.title} (\`${r.moduleId}\`)${suffix}`);
  } else {
    lines.push(`${prefix} ${r.title}${suffix}`);
  }

  for (const child of node.children) {
    renderMdTree(child, depth + 1, lines, catalogBySeq);
  }
}

function buildExport(): { rows: FlatRow[]; stats: Record<string, number> } {
  const catalogBySeq = buildCatalogBySeq();
  const groups = buildPermissionModuleGroups();
  const rows: FlatRow[] = [];
  for (const g of groups) {
    walkTree(g.tree, { l1: "", l2: "", l3: "" }, 1, rows, catalogBySeq);
  }
  const stats = {
    moduleCount: rows.filter((r) => r.level === 1).length,
    l2Count: rows.filter((r) => r.level === 2).length,
    l3Count: rows.filter((r) => r.level === 3).length,
    l4Count: rows.filter((r) => r.level === 4).length,
    totalNodes: rows.length,
  };
  return { rows, stats };
}

function writeMarkdown(
  groups: ReturnType<typeof buildPermissionModuleGroups>,
  stats: ReturnType<typeof buildExport>["stats"],
  catalogBySeq: Map<number, ModuleSettingCatalogItem>,
): void {
  const now = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    "# 平台预设 · 配置预设 · 四级导航树",
    "",
    `> 自动生成于 ${now} · 数据源：\`permission-registry\`（\`NAV_MODULES\` + \`module-settings-catalog\`）`,
    "> 对应系统设置 → 平台预设 → 配置预设编辑页四列结构。",
    "",
    "## 层级说明",
    "",
    "| 层级 | 说明 | 节点键格式（设计文档） |",
    "|------|------|------------------------|",
    "| L1 一级导航 | 侧栏主模块 | `nav:{moduleId}` |",
    "| L2 二级导航 | 滑层/折叠子入口 | `nav:{moduleId}:{childId}` |",
    "| L3 三级分组 | 设置页场景分组 | `settings:{settingsPath}:{groupKey}` |",
    "| L4 四级设置项 | 具体设置 seq | `setting:{seq}` |",
    "",
    "> 运行时权限树键采用 `moduleId:featureId:…` 格式，与上表设计键一一对应，详见各节点 `key` 列。",
    "",
    "## 统计",
    "",
    "| 指标 | 数量 |",
    "|------|------|",
    `| 一级导航（模块） | ${stats.moduleCount} |`,
    `| 二级导航 | ${stats.l2Count} |`,
    `| 三级分组 | ${stats.l3Count} |`,
    `| 四级设置项 | ${stats.l4Count} |`,
    `| 节点合计 | ${stats.totalNodes} |`,
    "",
    "## 树状结构",
    "",
  ];

  for (const g of groups) {
    renderMdTree(g.tree, 1, lines, catalogBySeq);
    lines.push("");
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MD_PATH, `${lines.join("\n").trimEnd()}\n`, "utf8");
}

function writeJsonAndXlsx(rows: FlatRow[], stats: ReturnType<typeof buildExport>["stats"]): void {
  fs.writeFileSync(JSON_PATH, JSON.stringify({ rows, stats }, null, 0), "utf8");

  const pyScript = path.join(__dirname, "lib", "platform-preset-tree-xlsx.py");
  const result = spawnSync("python", [pyScript, JSON_PATH, XLSX_PATH], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    throw new Error("Failed to generate xlsx via Python");
  }

  fs.unlinkSync(JSON_PATH);
}

function main(): void {
  const catalogBySeq = buildCatalogBySeq();
  const groups = buildPermissionModuleGroups();
  const { rows, stats } = buildExport();

  writeMarkdown(groups, stats, catalogBySeq);
  writeJsonAndXlsx(rows, stats);

  console.log("Platform preset tree export complete");
  console.log(`  MD:   ${MD_PATH}`);
  console.log(`  XLSX: ${XLSX_PATH}`);
  console.log(`  L1=${stats.moduleCount} L2=${stats.l2Count} L3=${stats.l3Count} L4=${stats.l4Count} total=${stats.totalNodes}`);
}

main();
