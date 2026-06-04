/**
 * 将前厅管理中心 19 组分类写入 docs/项目文档/配置归类-分组映射.csv（含 guest-order-throttle）
 * 运行：node scripts/apply-foh-settings-mapping.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const repoDocs = path.join(root, "docs");
const projectDocs = path.join(repoDocs, "项目文档");
const mappingPath = [projectDocs, repoDocs]
  .map((d) => path.join(d, "配置归类-分组映射.csv"))
  .find((p) => fs.existsSync(p));

const titles = {
  "tables-floor": "桌台与餐位",
  "pos-shell-landing": "主界面与导航",
  "pos-order-init": "开单流程",
  "pos-kitchen-send": "送厨流程",
  "pos-button-visibility": "操作按钮显隐",
  "pos-order-toolbar": "点单页工具栏",
  "pos-order-cart": "点单页展示",
  "pos-combo-ordering": "套餐点单与展示",
  "pos-find-order-list": "找单列表",
  "pos-checkout-entry": "结账入口",
  "pos-menu-ui": "菜单与布局",
  "guest-menu-structure": "菜单结构",
  "guest-menu-scenarios": "品类与场景菜单",
  "guest-menu-global": "首页与版式",
  "guest-menu-cart": "购物车展示",
  "guest-facing-locale": "界面语言",
  "guest-order-rules": "下单与规则",
  "guest-order-throttle": "食客下单限流",
  "tableside-service-call": "桌边·呼叫服务员",
  "guest-notes-fees": "备注与附加服务",
  "wait-time": "等待时长提示",
};

function range(a, b) {
  const out = [];
  for (let i = a; i < b; i++) out.push(i);
  return out;
}

const assignMap = {
  "tables-floor": [107, 619, 643, 644, 592, 169, 534, 642, 351, 347],
  "pos-shell-landing": [165, 346],
  "pos-order-init": [111, 625, 621],
  "pos-kitchen-send": [113, 114, 120, 123, 125, 345],
  "pos-button-visibility": [...range(193, 196), ...range(197, 216)],
  "pos-order-toolbar": [196, 110, 483, 484, 485, 486],
  "pos-order-cart": [132, 133, 135, 137, 121, 122, 178, 222, 223, 138],
  "pos-combo-ordering": [139, 145],
  "pos-find-order-list": [151, 152, 153, 251],
  "pos-checkout-entry": [248, 221],
  "pos-menu-ui": [118, 148, 176, 177, 348, 350, ...range(216, 221)],
  "guest-menu-structure": [515, 516, 517, 518, 519, 520, 524, 525, 526, 528],
  "guest-menu-scenarios": [655, 656, 657, 658, 659, 660, 661],
  "guest-menu-global": [532, 599, 601, 602, 604, 606, 607, 608, 611, 509, 600, 645],
  "guest-menu-cart": [616, 617, 618],
  "guest-facing-locale": [652, 653],
  "guest-order-rules": [
    94,
    443,
    502,
    487,
    571,
    572,
    574,
    575,
    569,
    570,
    573,
    577,
    578,
    579,
    580,
    581,
    597,
    598,
    488,
    489,
    490,
    491,
    623,
    622,
    503,
    504,
    505,
    506,
    507,
    510,
    527,
    595,
    596,
    620,
    626,
    627,
    594,
    349,
    646,
  ],
  "guest-order-throttle": [588, 589, 590, 591],
  "tableside-service-call": [629, 641, 640, 333],
  "guest-notes-fees": [521, 522, 523],
  "wait-time": [535, 536, 537, 538, 539, 540],
};

const fohAssign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) {
    fohAssign.set(seq, { groupTitle: titles[key], groupKey: key });
  }
}

function parseCsvLine(line) {
  const parts = [];
  let cur = "";
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inQ) {
      if (ch === '"' && line[j + 1] === '"') {
        cur += '"';
        j++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  return parts;
}

function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

if (!mappingPath) {
  throw new Error("未找到 配置归类-分组映射.csv");
}

const text = fs.readFileSync(mappingPath, "utf8");
const lines = text.split(/\r?\n/);
const out = [];
let updated = 0;

for (const line of lines) {
  if (!line.trim()) {
    out.push(line);
    continue;
  }
  if (line.startsWith("#") || line.startsWith("seq,")) {
    out.push(line);
    continue;
  }
  const parts = parseCsvLine(line);
  const seq = Number(parts[0]);
  if (!seq) {
    out.push(line);
    continue;
  }
  const next = fohAssign.get(seq);
  if (next) {
    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
    updated++;
  } else {
    out.push(line);
  }
}

if (updated !== fohAssign.size) {
  throw new Error(`预期更新 ${fohAssign.size} 条前厅映射，实际更新 ${updated} 条`);
}

fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");
console.log(`Updated ${updated} rows in ${mappingPath}`);
