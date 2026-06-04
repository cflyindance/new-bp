/**
 * 将打印中心 5 组分类写入 docs/项目文档/配置归类-分组映射.csv
 * 运行：node scripts/apply-print-settings-mapping.mjs
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
  "print-foundation-devices": "打印基础",
  "order-receipt-trigger": "订单收据触发",
  "payment-receipt-flow": "支付收据流程",
  "receipt-print-execution": "收据打印执行",
  "receipt-line-content": "收据明细与价格",
  "receipt-layout-format": "收据版式与辅助",
  "packing-slip-print": "打包单打印",
  "ticket-number-slip": "单号小票",
};

const assignMap = {
  /** v1.9：265 快速打印迁入；269 选机；270 合并入 269 */
  "print-foundation-devices": [167, 256, 259, 265, 269],
  "order-receipt-trigger": [654, 500],
  "payment-receipt-flow": [246, 247, 250, 261, 272],
  /** v1.9：首打份数 + 重打仅新菜（265 已迁打印基础） */
  "receipt-print-execution": [262, 273],
  /** v1.10：原「收据版式与明细」拆为明细/价格 + 版式/辅助 */
  "receipt-line-content": [275, 274, 278, 276, 285, 289, 283, 284],
  "receipt-layout-format": [282, 286, 277, 279, 280, 264],
  /** v1.7：281 堂食信息（收据+打包单）并入打包组 */
  "packing-slip-print": [34, 281, 297, 303],
  "ticket-number-slip": [291, 292],
};

const printAssign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) {
    printAssign.set(seq, { groupTitle: titles[key], groupKey: key });
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

if (!mappingPath) throw new Error("未找到 配置归类-分组映射.csv");

function assignMapTotal() {
  let n = 0;
  for (const seqs of Object.values(assignMap)) n += seqs.length;
  return n;
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
  const next = printAssign.get(seq);
  if (next) {
    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
    updated++;
    printAssign.delete(seq);
  } else {
    out.push(line);
  }
}

for (const [seq, next] of printAssign) {
  out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
  updated++;
}

if (updated !== assignMapTotal()) {
  throw new Error(`预期更新 ${assignMapTotal()} 条，实际 ${updated} 条`);
}

fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");
console.log(`Updated ${updated} rows in ${mappingPath}`);
