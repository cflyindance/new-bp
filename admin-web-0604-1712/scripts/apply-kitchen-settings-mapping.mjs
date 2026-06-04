/**
 * 将后厨管理中心 5 组分类写入 docs/项目文档/配置归类-分组映射.csv
 * 运行：node scripts/apply-kitchen-settings-mapping.mjs
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
  "send-routing": "送厨触发与路由",
  "ticket-grouping": "厨房单·分组与拆单",
  "line-merge-rules": "行级合并规则",
  "ticket-fields": "厨房单·票面信息",
  "ticket-format": "厨房单·版式格式",
  "packing-slip": "打包单",
};

const assignMap = {
  "send-routing": [36, 37, 62, 32, 304],
  "ticket-grouping": [40, 47, 54, 51, 61],
  "line-merge-rules": [52, 53, 287, 288, 301, 302],
  "ticket-fields": [35, 42, 45, 46, 48, 49, 50, 55, 56, 57, 58, 271],
  "ticket-format": [43, 44, 38, 41, 33, 59, 60, 258],
  "packing-slip": [39, 298, 299, 300],
};

const kitchenAssign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) {
    kitchenAssign.set(seq, { groupTitle: titles[key], groupKey: key });
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
  const next = kitchenAssign.get(seq);
  if (next) {
    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
    updated++;
  } else {
    out.push(line);
  }
}

if (updated !== kitchenAssign.size) {
  throw new Error(`预期更新 ${kitchenAssign.size} 条后厨映射，实际更新 ${updated} 条`);
}

fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");
console.log(`Updated ${updated} rows in ${mappingPath}`);
