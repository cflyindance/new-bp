import assert from "node:assert/strict";
import fs from "node:fs";

const runtime = fs.readFileSync(new URL("../src/team/payroll/payroll-legacy-runtime.ts", import.meta.url), "utf8");
const legacy = fs.readFileSync(new URL("../src/team/payroll/legacy/payroll.js.txt", import.meta.url), "utf8");
const template = fs.readFileSync(new URL("../src/team/payroll/payroll-template.html", import.meta.url), "utf8");

assert.match(runtime, /PayrollDeclarationBridge/);
assert.match(runtime, /resolveEmployeeDeclarationPresentation/);
assert.match(legacy, /refreshDeclarationPresentation/);
assert.match(legacy, /declarationPresentation\.primary/);
assert.match(legacy, /setAttribute\("dir"/);
assert.match(legacy, /PayrollDeclarationBridge\.confirm/);
assert.match(legacy, /saveEmployeePreference/);
assert.match(template, /detail-declaration-meta/);

console.log("Payroll declaration detail verification passed.");
