import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/team/payroll/payroll-declaration-settings.ts", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../src/team/payroll-page.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/team/payroll/payroll-page.css", import.meta.url), "utf8");

assert.match(source, /createPayrollDeclarationSettingsController/);
assert.match(source, /dataset\.payrollDeclarationSettings/);
assert.match(source, /open-declaration-settings/);
assert.match(source, /新增语言模板/);
assert.match(source, /创建新版本/);
assert.match(source, /审核并发布/);
assert.match(page, /declarationSettings\?\.destroy/);
assert.match(css, /payroll-declaration-settings-screen\{position:fixed;inset:0/);
assert.match(source, /showModal\(/);

console.log("Payroll declaration settings UI verification passed.");
