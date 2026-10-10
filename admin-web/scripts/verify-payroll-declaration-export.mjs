import assert from "node:assert/strict";
import fs from "node:fs";

const legacy = fs.readFileSync(new URL("../src/team/payroll/legacy/payroll.js.txt", import.meta.url), "utf8");
const exports = fs.readFileSync(new URL("../src/team/payroll/legacy/payroll-detail-export.js.txt", import.meta.url), "utf8");
const template = fs.readFileSync(new URL("../src/team/payroll/payroll-template.html", import.meta.url), "utf8");

assert.match(legacy, /declarationPresentation: emp\.declarationPresentation \? cloneData/);
assert.match(legacy, /detail-declaration-english-body/);
assert.match(template, /payroll-declaration-english/);
assert.match(exports, /declarationPresentation\.status === "blocked"/);
assert.match(exports, /csvCell\(data\.declarationText\)/);
assert.doesNotMatch(exports, /Declaration Locale|Declaration Version|English Declaration/);
assert.match(exports, /至少 7pt/);

console.log("Payroll declaration export verification passed.");
