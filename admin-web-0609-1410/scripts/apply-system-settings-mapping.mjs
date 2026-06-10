/**

 * 系统设置 v2.0 方案 A：四 Tab 分类写入 docs/项目文档/配置归类-分组映射.csv

 * 运行：node scripts/apply-system-settings-mapping.mjs

 */

import fs from "node:fs";

import path from "node:path";

import { fileURLToPath } from "node:url";

import {

  DELIVERY_MAP_ADDRESS_MIGRATION,

  FOH_MENU_MODE_MIGRATION,

  SYSTEM_SETTINGS_ASSIGN_MAP,

  SYSTEM_SETTINGS_GROUP_TITLES,

} from "./lib/system-settings-groups.mjs";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, "..", "..");

const repoDocs = path.join(root, "docs");

const projectDocs = path.join(repoDocs, "项目文档");

const mappingPath = [projectDocs, repoDocs]

  .map((d) => path.join(d, "配置归类-分组映射.csv"))

  .find((p) => fs.existsSync(p));



const sysAssign = new Map();



for (const [key, seqs] of Object.entries(SYSTEM_SETTINGS_ASSIGN_MAP)) {

  for (const seq of seqs) {

    sysAssign.set(seq, { groupTitle: SYSTEM_SETTINGS_GROUP_TITLES[key], groupKey: key });

  }

}



sysAssign.set(FOH_MENU_MODE_MIGRATION.seq, {

  groupTitle: FOH_MENU_MODE_MIGRATION.groupTitle,

  groupKey: FOH_MENU_MODE_MIGRATION.groupKey,

});



for (const seq of DELIVERY_MAP_ADDRESS_MIGRATION.seqs) {

  sysAssign.set(seq, {

    groupTitle: DELIVERY_MAP_ADDRESS_MIGRATION.groupTitle,

    groupKey: DELIVERY_MAP_ADDRESS_MIGRATION.groupKey,

  });

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

  const next = sysAssign.get(seq);

  if (next) {

    out.push(`${seq},${escapeCsvCell(next.groupTitle)},${escapeCsvCell(next.groupKey)}`);

    updated++;

  } else {

    out.push(line);

  }

}



if (updated !== sysAssign.size) {

  throw new Error(`预期更新 ${sysAssign.size} 条，实际 ${updated} 条`);

}



fs.writeFileSync(mappingPath, `${out.join("\n")}\n`, "utf8");

console.log(`Updated ${updated} rows in ${mappingPath}`);


