import fs from "node:fs";
import path from "node:path";

const names = ["common.js", "global-scope-filter.js", "ruleData.js", "personalSalesDeduct.js", "tipAllocation.js", "attendanceMock.js", "tipout-summary-ui.js", "tipout-payroll-bridge.js", "orderTipStatus.js", "paymentMethodApportion.js", "export.js"];
const target = path.resolve("src/team/tips/legacy");
fs.mkdirSync(target, { recursive: true });
for (const name of names) fs.copyFileSync(path.resolve("dist/TipOut", name), path.resolve(target, `${name}.txt`));
console.log(`Copied ${names.length} shared Team Tips runtime assets.`);
