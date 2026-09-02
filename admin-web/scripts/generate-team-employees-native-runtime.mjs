import fs from "node:fs";
import path from "node:path";

const sourceDir = path.resolve("dist/TipOut");
const targetDir = path.resolve("src/team/employees/legacy");
const names = ["common.js", "global-scope-filter.js", "ruleData.js", "employees-field-help.js", "employees.js"];

fs.mkdirSync(targetDir, { recursive: true });
for (const name of names) {
  fs.copyFileSync(path.join(sourceDir, name), path.join(targetDir, `${name}.txt`));
}
console.log(`Copied ${names.length} employee runtime assets into the native module.`);
