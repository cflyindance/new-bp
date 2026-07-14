import assert from "node:assert/strict";

import { createRequire } from "node:module";

import { fileURLToPath } from "node:url";

import path from "node:path";



const require = createRequire(import.meta.url);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");



const personal = require(path.join(root, "dist/TipOut/personalSalesDeduct.js"));

globalThis.TipOutPersonalSalesDeduct = personal;

const TipAllocation = require(path.join(root, "dist/TipOut/tipAllocation.js"));



const {

  employeeMatchesScope,

  applyPersonalSalesDeductFromRule,

  calcPersonalSalesDeduct,

} = personal;



// scope match

assert.equal(

  employeeMatchesScope({ name: "A", role: "Server" }, { scopeType: "role", roles: ["Server"] }),

  true,

);

assert.equal(

  employeeMatchesScope({ name: "A", role: "Bartender" }, { scopeType: "role", roles: ["Server"] }),

  false,

);

assert.equal(

  employeeMatchesScope(

    { name: "Maria", role: "Server" },

    { scopeType: "employee", employee: ["Maria"] },

  ),

  true,

);



const rule = {

  deductConfig: {

    personalSalesPct: {

      rate: 0.03,

      scopeType: "role",

      roles: ["Server"],

      salesConditions: { revenueType: "Net Sales (税前营业额)" },

    },

  },

  receivers: [

    { roles: ["Busser"], pct: 100 },

  ],

  distribution: "average",

};



const employees = [

  { id: "A", name: "A", role: "Server", salesAmount: 1000, tipBefore: 100 },

  { id: "B", name: "B", role: "Server", salesAmount: 2000, tipBefore: 200 },

  { id: "C", name: "C", role: "Busser", salesAmount: 0, tipBefore: 0 },

];



const applied = applyPersonalSalesDeductFromRule(rule, employees);

assert.equal(applied.active, true);

assert.equal(applied.totalDue, 90);

assert.equal(applied.totalActual, 90);

assert.equal(applied.poolContribution, 90);

const rowA = applied.rows.find((r) => r.id === "A");

assert.equal(rowA.due, 30);

assert.equal(rowA.actual, 30);

assert.equal(rowA.matched, true);

const rowC = applied.rows.find((r) => r.id === "C");

assert.equal(rowC.matched, false);

assert.equal(rowC.actual, 0);



// 隔离性经引擎：只改 B 销售

const employees2 = [

  { id: "A", name: "A", role: "Server", salesAmount: 1000, tipBefore: 100 },

  { id: "B", name: "B", role: "Server", salesAmount: 9000, tipBefore: 200 },

  { id: "C", name: "C", role: "Busser", salesAmount: 0, tipBefore: 0 },

];

const pipe1 = TipAllocation.runLegacyDayPipeline(rule, employees);

const pipe2 = TipAllocation.runLegacyDayPipeline(rule, employees2);

assert.equal(pipe1.byName.A.deducted, 30);

assert.equal(pipe2.byName.A.deducted, 30);

assert.equal(pipe1.byName.A.after, 70); // 100 - 30 + 0 (Server not receiver)

assert.equal(pipe2.byName.B.due, 270);

assert.equal(pipe2.byName.B.deducted, 200); // min(270, 200)

assert.equal(pipe2.byName.B.shortfall, 70);

assert.equal(pipe2.byName.C.received, 230); // 30 + 200 pool to Busser

assert.equal(pipe2.byName.C.after, 230);



// 无 personalSalesPct：引擎不报错，扣 0

const emptyPipe = TipAllocation.runDeductPipeline({ deductConfig: {} }, employees);

assert.equal(emptyPipe.totalDeducted, 0);



// 与 tipIncome 并存：先个人再小费抽

const ruleBoth = {

  deductConfig: {

    personalSalesPct: {

      rate: 0.03,

      scopeType: "role",

      roles: ["Server"],

    },

    tipIncome: { scopeType: "role", roles: ["Server"] },

  },

  receivers: [{ roles: ["Busser"], pct: 100 }],

};

const both = TipAllocation.runDeductPipeline(ruleBoth, [

  { id: "A", name: "A", role: "Server", salesAmount: 1000, tipBefore: 100, tipRate: 0.1 },

]);

// personal 30, remaining 70; tipIncome due 10, actual 10

assert.equal(both.byKey.A.personalActual, 30);

assert.equal(both.byKey.A.tipIncomeActual, 10);

assert.equal(both.byKey.A.deducted, 40);



const unit = calcPersonalSalesDeduct({ salesAmount: 1000, rate: 0.03, tipBefore: 100 });

assert.equal(unit.tipAfter, 70);



console.log("verify-personal-sales-deduct-pipeline: OK");


