/**
 * 将支付中心 8 组分类写入 docs/项目文档/配置归类-分组映射.csv
 * 运行：node scripts/apply-payment-settings-mapping.mjs
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
  "payment-gateway": "支付网关与受理",
  "payment-methods": "支付方式",
  "tax-rules": "税务规则",
  "tip-policy": "小费政策与计算",
  "batch-settlement": "BATCH与日结",
  "card-fees": "卡支付规则与合规",
  "checkout-tip-card-order": "小费与刷卡顺序",
  "cds-checkout-ux": "结账与交互",
};

const assignMap = {
  "payment-gateway": [229],
  "payment-methods": [234],
  "tax-rules": [445, 144, 143, 142, 160, 290],
  /** v1.7：266 自打印中心迁入（收据建议小费行）；252 已排除出 catalog */
  "tip-policy": [231, 293, 294, 253, 237, 493, 295, 296, 266, 244, 232],
  "batch-settlement": [238, 230, 236, 239, 240, 235],
  /** v1.7：172 收据未付价格显示（卡/现金价呈现） */
  "card-fees": [82, 242, 243, 180, 454, 172],
  "checkout-tip-card-order": [9],
  "cds-checkout-ux": [463, 464, 465, 669],
};

const paymentAssign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) {
    paymentAssign.set(seq, { groupTitle: titles[key], groupKey: key });
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
  const next = paymentAssign.get(seq);
  if (next) {
    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
    updated++;
  } else {
    out.push(line);
  }
}

if (updated !== paymentAssign.size) {
  throw new Error(`预期更新 ${paymentAssign.size} 条，实际 ${updated} 条`);
}

fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");
console.log(`Updated ${updated} rows in ${mappingPath}`);
