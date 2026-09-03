import fs from "node:fs";
import path from "node:path";

const sourceDir = path.resolve("dist/TipOut");
const targetDir = path.resolve("src/team/payroll/legacy");
const sources = [
  "common.js",
  "ruleData.js",
  "payroll-adp-mapping.js",
  "payroll-i18n.js",
  "payroll-detail-export.js",
  "payroll-api-client.js",
  "payroll-period-calendar.js",
  "payroll.js",
];

fs.mkdirSync(targetDir, { recursive: true });
for (const name of sources) {
  fs.copyFileSync(path.join(sourceDir, name), path.join(targetDir, `${name}.txt`));
}

console.log(`Copied ${sources.length} Payroll runtime assets into the native module.`);
