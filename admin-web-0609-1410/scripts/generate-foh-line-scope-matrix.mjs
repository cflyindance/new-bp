/**
 * 从前厅设置 UI 模块 + foh-settings-groups 生成产线适用范围矩阵（Markdown）
 * 用法：node scripts/generate-foh-line-scope-matrix.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FOH_SETTINGS_ASSIGN_MAP, FOH_SETTINGS_GROUP_TITLES, FOH_SETTINGS_GROUP_ORDER } from "./lib/foh-settings-groups.mjs";
import { buildFohLineScopeSeed, extractUiLineScopeMap } from "./lib/foh-line-scope-extract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.resolve(__dirname, "../src/config");

const LINE_COLS = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online" },
  { id: "cds", label: "CDS" },
];

const STAFF_DEFAULT = ["pos", "pos-go", "paypad"];
const GUEST_DEFAULT = ["kiosk", "emenu", "sdi", "online-order"];
const STORE_WIDE = ["store-wide"];

const STAFF_GROUPS = new Set([
  "foh-pos-shell",
  "foh-table-start-flow",
  "foh-pos-menu-scope",
  "foh-pos-menu-ui-layout",
  "foh-pos-order-cart",
  "foh-pos-combo-ordering",
  "foh-pos-buttons",
  "foh-kitchen-send-timing",
  "foh-pos-find-order-list",
  "foh-pos-checkout-entry",
  "foh-table-clear-ops",
]);

/** @type {Map<number, { lines: string[], source: string, module?: string }>} */
const uiMap = new Map();

function parseProductLinesFromFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const moduleName = path.basename(filePath);

  // *_SEQ = N or export const FOO_SEQS = [1,2]
  const seqExports = [];
  for (const m of text.matchAll(/export const (\w+)_SEQ(?:S)?\s*=\s*(\[[\d,\s]+\]|\d+)/g)) {
    const name = m[1];
    const val = m[2];
    if (val.startsWith("[")) {
      const nums = JSON.parse(val.replace(/\s/g, "").replace(/,+\]/g, "]"));
      for (const n of nums) seqExports.push({ seq: n, constName: name });
    } else {
      seqExports.push({ seq: Number(val), constName: name });
    }
  }

  // PRODUCT_LINES array
  const plMatch = text.match(/export const (\w+PRODUCT_LINES)\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!plMatch) return;

  const plConst = plMatch[1];
  const lines = [];
  for (const m of plMatch[2].matchAll(/id:\s*"([^"]+)"/g)) {
    lines.push(m[1]);
  }
  if (!lines.length) return;

  // CONFIG_BY_SEQ style: [123]: { lines: [...] }
  const configBySeq = {};
  const configBlock = text.match(/const CONFIG_BY_SEQ[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (configBlock) {
    for (const m of configBlock[1].matchAll(/\[(\d+)\]:\s*\{[^}]*lines:\s*(\[[^\]]+\])/g)) {
      try {
        configBySeq[Number(m[1])] = JSON.parse(m[2].replace(/'/g, '"'));
      } catch {
        /* ignore */
      }
    }
  }

  // Map seq const to PRODUCT_LINES const (heuristic)
  for (const { seq, constName } of seqExports) {
    let mappedLines = configBySeq[seq];
    let source = "ui-module";
    if (!mappedLines) {
      // try PREFIX_PRODUCT_LINES where PREFIX matches const prefix
      const prefix = constName.replace(/_SEQ$/, "").replace(/_SEQS$/, "");
      const candidates = [
        `${prefix}_PRODUCT_LINES`,
        plConst,
        constName.replace(/_SEQ$/, "_PRODUCT_LINES"),
      ];
      for (const c of candidates) {
        const re = new RegExp(`export const ${c}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`);
        const cm = text.match(re);
        if (cm) {
          mappedLines = [];
          for (const lm of cm[1].matchAll(/id:\s*"([^"]+)"/g)) mappedLines.push(lm[1]);
          break;
        }
      }
      if (!mappedLines) mappedLines = lines;
    }
    if (mappedLines?.length) {
      uiMap.set(seq, { lines: [...mappedLines], source, module: moduleName });
    }
  }
}

// scan all module-settings*.ts
for (const f of fs.readdirSync(CONFIG_DIR)) {
  if (!f.startsWith("module-settings") || !f.endsWith(".ts")) continue;
  parseProductLinesFromFile(path.join(CONFIG_DIR, f));
}

// manual overrides (documented exceptions)
const MANUAL = {
  165: { lines: STAFF_DEFAULT, source: "ui-module", module: "module-settings-default-main-screen-ui.ts" },
  443: { lines: STORE_WIDE, source: "store-wide" },
  652: { lines: ["kiosk", "emenu", "sdi", "cds"], source: "manual" },
  653: { lines: ["kiosk", "emenu", "sdi", "cds"], source: "manual" },
  333: { lines: STORE_WIDE, source: "store-wide" },
  673: { lines: STORE_WIDE, source: "store-wide" },
  110: { lines: STAFF_DEFAULT, source: "group-default" },
  111: { lines: STAFF_DEFAULT, source: "group-default" },
  121: { lines: STAFF_DEFAULT, source: "group-default" },
  125: { lines: STAFF_DEFAULT, source: "group-default" },
  113: { lines: STAFF_DEFAULT, source: "group-default" },
  114: { lines: STAFF_DEFAULT, source: "group-default" },
  120: { lines: STAFF_DEFAULT, source: "group-default" },
  123: { lines: STAFF_DEFAULT, source: "group-default" },
  133: { lines: STAFF_DEFAULT, source: "group-default" },
  135: { lines: STAFF_DEFAULT, source: "group-default" },
  137: { lines: STAFF_DEFAULT, source: "group-default" },
  193: { lines: STAFF_DEFAULT, source: "group-default" },
  194: { lines: STAFF_DEFAULT, source: "group-default" },
  195: { lines: STAFF_DEFAULT, source: "group-default" },
  196: { lines: STAFF_DEFAULT, source: "group-default" },
  197: { lines: STAFF_DEFAULT, source: "group-default" },
  198: { lines: STAFF_DEFAULT, source: "group-default" },
  199: { lines: STAFF_DEFAULT, source: "group-default" },
  200: { lines: STAFF_DEFAULT, source: "group-default" },
  201: { lines: STAFF_DEFAULT, source: "group-default" },
  202: { lines: STAFF_DEFAULT, source: "group-default" },
  203: { lines: STAFF_DEFAULT, source: "group-default" },
  204: { lines: STAFF_DEFAULT, source: "group-default" },
  205: { lines: STAFF_DEFAULT, source: "group-default" },
  206: { lines: STAFF_DEFAULT, source: "group-default" },
  207: { lines: STAFF_DEFAULT, source: "group-default" },
  208: { lines: STAFF_DEFAULT, source: "group-default" },
  209: { lines: STAFF_DEFAULT, source: "group-default" },
  210: { lines: STAFF_DEFAULT, source: "group-default" },
  211: { lines: STAFF_DEFAULT, source: "group-default" },
  212: { lines: STAFF_DEFAULT, source: "group-default" },
  213: { lines: STAFF_DEFAULT, source: "group-default" },
  214: { lines: STAFF_DEFAULT, source: "group-default" },
  215: { lines: STAFF_DEFAULT, source: "group-default" },
  483: { lines: STAFF_DEFAULT, source: "group-default" },
  484: { lines: STAFF_DEFAULT, source: "group-default" },
  485: { lines: STAFF_DEFAULT, source: "group-default" },
  486: { lines: STAFF_DEFAULT, source: "group-default" },
  581: { lines: GUEST_DEFAULT, source: "group-default" },
  502: { lines: ["kiosk"], source: "manual" },
  592: { lines: GUEST_DEFAULT, source: "group-default" },
  620: { lines: GUEST_DEFAULT, source: "group-default" },
  626: { lines: GUEST_DEFAULT, source: "group-default" },
  629: { lines: GUEST_DEFAULT, source: "group-default" },
  640: { lines: GUEST_DEFAULT, source: "group-default" },
  641: { lines: GUEST_DEFAULT, source: "group-default" },
  522: { lines: GUEST_DEFAULT, source: "group-default" },
  523: { lines: GUEST_DEFAULT, source: "group-default" },
};

for (const [seq, v] of Object.entries(MANUAL)) {
  if (!uiMap.has(Number(seq))) uiMap.set(Number(seq), v);
}

function resolveLines(seq, groupKey) {
  if (uiMap.has(seq)) return uiMap.get(seq);
  if (STAFF_GROUPS.has(groupKey)) {
    // iPad-only hints in group
    if ([346, 345, 348, 350, 351, 347].includes(seq)) {
      return { lines: ["pos", "paypad"], source: "manual", note: "iPad/PayPad" };
    }
    if ([216, 217, 218, 219, 220].includes(seq)) {
      return { lines: ["pos"], source: "manual", note: "POS 菜单区" };
    }
    return { lines: STAFF_DEFAULT, source: "group-default" };
  }
  return { lines: GUEST_DEFAULT, source: "group-default" };
}

function cell(lines, lineId) {
  if (lines.includes("store-wide")) return "全店";
  return lines.includes(lineId) ? "✓" : "—";
}

function sourceLabel(s) {
  const map = {
    "ui-module": "UI",
    "group-default": "组默认",
    manual: "手工",
    "store-wide": "全店",
  };
  return map[s] ?? s;
}

// build seq list from assign map
const allSeqs = [];
const seqToGroup = new Map();
for (const gk of FOH_SETTINGS_GROUP_ORDER) {
  const seqs = FOH_SETTINGS_ASSIGN_MAP[gk] ?? [];
  for (const seq of seqs) {
    allSeqs.push(seq);
    seqToGroup.set(seq, gk);
  }
}

// counts per line
const lineCounts = Object.fromEntries(LINE_COLS.map((c) => [c.id, 0]));
let storeWideCount = 0;
for (const seq of allSeqs) {
  const gk = seqToGroup.get(seq);
  const { lines } = resolveLines(seq, gk);
  if (lines.includes("store-wide")) {
    storeWideCount++;
    continue;
  }
  for (const c of LINE_COLS) {
    if (lines.includes(c.id)) lineCounts[c.id]++;
  }
}

let md = "";
md += `## 8. 按场景 / 按产线双视图（v4.0 草案，已确认方向）\n\n`;
md += `### 8.1 交互概要\n\n`;
md += `| 维度 | 说明 |\n|------|------|\n`;
md += `| 顶栏切换 | Segmented：**按场景** \\| **按产线**；记忆 \`bplant-foh-settings-view-mode\` |\n`;
md += `| 按场景 | 现有 22 组侧栏 + 员工端/食客端分段（\`groupNavSections\`） |\n`;
md += `| 按产线 | 侧栏：POS / POS GO / PayPad / Kiosk / eMenu / SDI / Online Order / CDS / **全店通用** |\n`;
md += `| 产线视图列表 | 扁平列表 + 场景标签（方案 A）；**隐藏**「适用产线多选」；主开关语义 = **该产线是否启用** |\n`;
md += `| SSOT | \`admin-web/scripts/lib/foh-settings-line-scope.mjs\`（由 UI 模块抽取 + 手工补全，见 §8.3） |\n\n`;

md += `### 8.2 产线覆盖统计（${allSeqs.length} 条 catalog）\n\n`;
md += `| 产线 | 相关条数 | 说明 |\n|------|----------|------|\n`;
for (const c of LINE_COLS) {
  md += `| ${c.label} | ${lineCounts[c.id]} | 含主开关 + 产线多选项在该线的适用范围 |\n`;
}
md += `| 全店通用 | ${storeWideCount} | 不按产线拆分；仅在「全店通用」导航展示 |\n\n`;

md += `### 8.3 来源图例\n\n`;
md += `| 标记 | 含义 |\n|------|------|\n`;
md += `| **UI** | 已有 \`*-lines-ui.ts\` / 产线矩阵组件，运行时以 localStorage 产线勾选为准 |\n`;
md += `| **组默认** | 尚无独立产线 UI；按所属场景组推断（员工组 → POS/POS GO/PayPad；食客组 → Kiosk/eMenu/SDI/Online） |\n`;
md += `| **手工** | 设计文档或业务约定补全（如 502 仅 Kiosk、217/218 仅 POS） |\n`;
md += `| **全店** | 门店级配置，产线视图归入「全店通用」 |\n\n`;

md += `### 8.4 产线适用范围矩阵（按场景组）\n\n`;
md += `列：POS · POS GO · PayPad · Kiosk · eMenu · SDI · Online · CDS · 来源\n\n`;

for (const gk of FOH_SETTINGS_GROUP_ORDER) {
  const seqs = FOH_SETTINGS_ASSIGN_MAP[gk] ?? [];
  if (!seqs.length) continue;
  md += `#### ${FOH_SETTINGS_GROUP_TITLES[gk]}（\`${gk}\`，${seqs.length} 条）\n\n`;
  md += `| seq | POS | GO | Pad | Kiosk | eMenu | SDI | Online | CDS | 来源 |\n`;
  md += `|-----|:---:|:--:|:---:|:-----:|:-----:|:---:|:------:|:---:|:----:|\n`;
  for (const seq of seqs) {
    const r = resolveLines(seq, gk);
    const cols = LINE_COLS.map((c) => cell(r.lines, c.id));
    const src = sourceLabel(r.source);
    md += `| ${seq} | ${cols.join(" | ")} | ${src} |\n`;
  }
  md += `\n`;
}

// unresolved / needs confirmation
const needsReview = [];
for (const seq of allSeqs) {
  const r = resolveLines(seq, seqToGroup.get(seq));
  if (r.source === "group-default" && STAFF_GROUPS.has(seqToGroup.get(seq)) && [193, 194, 195].includes(seq)) {
    needsReview.push(seq);
  }
}
md += `### 8.5 待确认项（实现 P1 前）\n\n`;
md += `| 议题 | seq | 当前矩阵假设 | 备注 |\n|------|-----|--------------|------|\n`;
md += `| 点单页按钮 193–215 | 193–215 | 三线一致（POS/POS GO/PayPad） | 尚无 \`pos-button-visibility-lines-ui\`；若 PayPad 按钮集不同需单列 |\n`;
md += `| 菜单区 217/218 | 217、218 | 仅 POS | 与 216/219/220 不同；已实现按产线单选表 |\n`;
md += `| 526 积分菜位置 | 526 | UI 含 POS/PayPad | 员工端菜单页展示积分菜，非纯食客端 |\n`;
md += `| 91/567/174/141 | 91、567、174、141 | catalog 有、滑层待核对 | assign map 含但 §4 明细未列；矩阵按组默认或隐藏 |\n`;
md += `| CDS 组 | 461/462/466 | hub override 待挂载 | 当前 assign map 未含 cds 组 |\n\n`;

md += `### 8.6 落地步骤（产线视图）\n\n`;
md += `1. 将 §8.4 矩阵固化到 \`foh-settings-line-scope.mjs\`（导出 \`FOH_LINE_SCOPE_BY_SEQ\`、\`FOH_LINE_NAV_ORDER\`）\n`;
md += `2. \`main.ts\`：顶栏 Segmented、产线侧栏路由 \`…/settings/by-line/:lineId\`、列表过滤与场景标签\n`;
md += `3. 产线视图：隐藏 \`lines-ui\` 多选区；读写 \`{seq}-lines\` 存储时仅切换当前产线位\n`;
md += `4. \`generate-foh-line-scope-matrix.mjs\` 纳入 \`npm run build:settings-catalog\` 前置校验（UI 与矩阵漂移告警）\n\n`;

const outPath = path.resolve(__dirname, "../../docs/项目文档/前厅管理中心-设置二级导航重设计方案.md");
const doc = fs.readFileSync(outPath, "utf8");

// insert or replace section 8
const markerStart = "## 8. 按场景 / 按产线双视图";
const markerEnd = "## 7. 边界说明";
let newDoc;
if (doc.includes(markerStart)) {
  const before = doc.split(markerStart)[0];
  const afterPart = doc.split(markerStart)[1];
  const after = afterPart.includes("## 7.") ? "## 7." + afterPart.split("## 7.")[1] : afterPart;
  newDoc = before + md.trim() + "\n\n---\n\n" + after.trimStart();
} else {
  // insert before section 7
  const parts = doc.split("## 7. 边界说明");
  newDoc = parts[0].trimEnd() + "\n\n---\n\n" + md.trim() + "\n\n---\n\n## 7. 边界说明" + parts[1];
}

fs.writeFileSync(outPath, newDoc, "utf8");

// SSOT seed / scope.ts 与 verify-foh-line-scope 共用 extract 模块
const jsonOut = buildFohLineScopeSeed(extractUiLineScopeMap());
fs.writeFileSync(
  path.resolve(__dirname, "lib/foh-settings-line-scope.seed.json"),
  JSON.stringify(jsonOut, null, 2),
  "utf8"
);

const navOrderTs = `  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
  { id: "cds", label: "CDS" },
  { id: "store-wide", label: "全店通用" },`;

const tsPath = path.resolve(__dirname, "../src/config/foh-settings-line-scope.ts");
const tsContent = `/** AUTO-GENERATED by scripts/generate-foh-line-scope-matrix.mjs — do not edit */

export type FohLineScopeSource = "ui-module" | "group-default" | "manual" | "store-wide";

export interface FohLineScopeEntry {
  groupKey: string;
  lines: string[];
  source: FohLineScopeSource;
  module?: string;
}

export const FOH_LINE_NAV_ORDER = [
${navOrderTs}
] as const;

export type FohLineNavId = (typeof FOH_LINE_NAV_ORDER)[number]["id"];

export const FOH_LINE_SCOPE_BY_SEQ: Record<number, FohLineScopeEntry> = ${JSON.stringify(jsonOut, null, 2)};

export function fohSeqAppliesToLine(seq: number, lineId: string): boolean {
  const entry = FOH_LINE_SCOPE_BY_SEQ[seq];
  if (!entry) return false;
  if (entry.lines.includes("store-wide")) return lineId === "store-wide";
  return entry.lines.includes(lineId);
}

export function fohSeqsForLine(lineId: string): number[] {
  return Object.entries(FOH_LINE_SCOPE_BY_SEQ)
    .filter(([, v]) =>
      v.lines.includes("store-wide") ? lineId === "store-wide" : v.lines.includes(lineId),
    )
    .map(([seq]) => Number(seq))
    .sort((a, b) => a - b);
}

export function fohLineNavLabel(lineId: string): string {
  return FOH_LINE_NAV_ORDER.find((l) => l.id === lineId)?.label ?? lineId;
}
`;
fs.writeFileSync(tsPath, tsContent, "utf8");

console.log(`Matrix: ${allSeqs.length} seqs, UI mapped: ${uiMap.size}`);
console.log(`Wrote ${outPath}`);
console.log(`Wrote lib/foh-settings-line-scope.seed.json`);
console.log(`Wrote ${tsPath}`);
