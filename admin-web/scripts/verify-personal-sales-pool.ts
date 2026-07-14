import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  employeeMatchesSalesPoolConditions,
  calcPersonalSalesPoolCard,
  calcPersonalSalesPoolFromRules,
} = require(path.join(root, "dist/TipOut/personalSalesDeduct.js"));

const employees = [
  { id: "A", name: "A", role: "Server", salesAmount: 1000 },
  { id: "B", name: "B", role: "Bartender", salesAmount: 200 },
];

assert.equal(
  employeeMatchesSalesPoolConditions({ name: "A", role: "Server" }, { role: ["Server"] }),
  true,
);
assert.equal(
  employeeMatchesSalesPoolConditions({ name: "B", role: "Bartender" }, { role: ["Server"] }),
  false,
);

const cardServer = calcPersonalSalesPoolCard(
  { type: "personal_sales", pct: 3, conditions: { role: ["Server"] } },
  employees,
);
assert.equal(cardServer.matchedSales, 1000);
assert.equal(cardServer.contribution, 30);

const cardBar = calcPersonalSalesPoolCard(
  { type: "personal_sales", pct: 2, conditions: { role: ["Bartender"] } },
  employees,
);
assert.equal(cardBar.matchedSales, 200);
assert.equal(cardBar.contribution, 4);

const poolRules = [
  {
    type: "personal_sales",
    id: "personal_sales_1",
    pct: 3,
    conditions: { role: ["Server"] },
  },
  {
    type: "personal_sales",
    id: "personal_sales_2",
    pct: 2,
    conditions: { role: ["Bartender"] },
  },
];
const agg = calcPersonalSalesPoolFromRules(poolRules, employees);
assert.equal(agg.total, 34);
assert.equal(agg.byEmployee.A.contribution, 30);
assert.equal(agg.byEmployee.B.contribution, 4);

// 隔离：只改 B 销售不影响 A
const employees2 = [
  { id: "A", name: "A", role: "Server", salesAmount: 1000 },
  { id: "B", name: "B", role: "Bartender", salesAmount: 900 },
];
const agg2 = calcPersonalSalesPoolFromRules(poolRules, employees2);
assert.equal(agg2.byEmployee.A.contribution, 30);
assert.equal(agg2.byEmployee.B.contribution, 18);

console.log("verify-personal-sales-pool: OK");
