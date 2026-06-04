/**
 * 将硬件管理中心 6 组分类写入 docs/项目文档/配置归类-分组映射.csv
 * 运行：node scripts/apply-hardware-settings-mapping.mjs
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
  "device-integration-basics": "设备接入与基础外设",
  "printer-output-devices": "打印机与输出设备",
  "cash-payment-terminals": "钱箱与支付终端",
  "client-device-binding": "终端设备绑定与区域",
  "fiscal-bluetooth": "税控与蓝牙外设",
  "emenu-device-display": "eMenu设备与展示模式",
};

const assignMap = {
  "device-integration-basics": [1, 11, 15, 184, 185, 228, 379, 380, 381, 382, 383],
  "printer-output-devices": [
    352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 372, 373, 374, 375, 376, 385, 386, 387, 388, 389,
    391, 393, 394, 395, 498, 499,
  ],
  "cash-payment-terminals": [
    254, 255, 364, 365, 366, 367, 368, 377, 390, 392, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 668,
  ],
  "client-device-binding": [370, 371, 378, 384, 550],
  "fiscal-bluetooth": [406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416],
  "emenu-device-display": [559, 560, 561, 562],
};

const hwAssign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) {
    hwAssign.set(seq, { groupTitle: titles[key], groupKey: key });
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
  const next = hwAssign.get(seq);
  if (next) {
    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);
    updated++;
  } else {
    out.push(line);
  }
}

if (updated !== hwAssign.size) {
  throw new Error(`预期更新 ${hwAssign.size} 条，实际 ${updated} 条`);
}

fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");
console.log(`Updated ${updated} rows in ${mappingPath}`);
