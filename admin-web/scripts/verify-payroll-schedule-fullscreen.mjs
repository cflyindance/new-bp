import assert from 'node:assert/strict';
import fs from 'node:fs';
const controller=fs.readFileSync('src/team/payroll/payroll-schedule-controller.ts','utf8');
const css=fs.readFileSync('src/team/payroll/payroll-polish.css','utf8');
assert.ok(controller.includes("panel.className='payroll-schedule-dialog payroll-schedule-page'"));
assert.ok(controller.includes('data-close>返回薪资管理</button>'));
assert.match(css, /\.payroll-schedule-page\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100dvh;/);
console.log('Payroll schedule fullscreen contract passed');
