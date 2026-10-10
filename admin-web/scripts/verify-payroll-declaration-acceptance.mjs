import assert from "node:assert/strict";
import fs from "node:fs";

const settings = fs.readFileSync("src/team/payroll/payroll-declaration-settings.ts", "utf8");
const template = fs.readFileSync("src/team/payroll/payroll-template.html", "utf8");
const css = fs.readFileSync("src/team/payroll/payroll-page.css", "utf8");
const detail = fs.readFileSync("src/team/payroll/legacy/payroll.js.txt", "utf8");
const batch = fs.readFileSync("src/team/payroll/payroll-batch-export-artifacts.ts", "utf8");
assert.match(settings, /aria-live="polite"/);
assert.match(settings, /returnFocus\?\.focus/);
assert.match(template, /detail-declaration-english/);
assert.match(css, /\[dir="rtl"\]/);
assert.match(detail, /declarationPresentation/);
assert.match(batch, /declarationBlockerMessage/);
// Batch export reuses the native detail HTML; bilingual rendering belongs there.
assert.match(batch, /bridge\.getDetailPrintHtml/);
assert.match(detail, /declarationPartHtml\(presentation\.english\)/);
console.log("Payroll declaration acceptance verification passed.");
