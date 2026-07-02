/**
 * 将商品中心设置分类写入 docs/项目文档/配置归类-分组映射.csv
 * v2.0：139/145 已迁前厅 pos-combo-ordering；商品中心无 settings catalog，本脚本为 no-op。
 * 运行：node scripts/apply-product-settings-mapping.mjs
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

/** 商品中心 settings catalog 已下线；无待写映射 */
const titles = {};
const assignMap = {};

const productAssign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) {
    productAssign.set(seq, { groupTitle: titles[key], groupKey: key });
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
  const next = productAssign.get(seq);
  if (next) {
    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
    updated++;
  } else {
    out.push(line);
  }
}

if (updated !== productAssign.size) {
  throw new Error(`预期更新 ${productAssign.size} 条，实际 ${updated} 条`);
}

if (productAssign.size > 0) {
  fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");
}
console.log(
  productAssign.size > 0
    ? `Updated ${updated} rows in ${mappingPath}`
    : `商品中心 settings 映射为空，跳过 CSV 写入`,
);
