import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  calcPersonalSalesDeduct,
  calcPersonalSalesDeductForEmployees,
} = require(path.join(root, "dist/TipOut/personalSalesDeduct.js"));

const a = calcPersonalSalesDeduct({ salesAmount: 1000, rate: 0.03, tipBefore: 100 });
assert.equal(a.due, 30);
assert.equal(a.actual, 30);
assert.equal(a.tipAfter, 70);
assert.equal(a.shortfall, 0);

const b = calcPersonalSalesDeduct({ salesAmount: 2000, rate: 0.03, tipBefore: 200 });
assert.equal(b.due, 60);
assert.equal(b.actual, 60);
assert.equal(b.tipAfter, 140);

// 隔离性：只改 B 不影响 A
const rows1 = calcPersonalSalesDeductForEmployees(
  [
    { id: "A", salesAmount: 1000, tipBefore: 100 },
    { id: "B", salesAmount: 2000, tipBefore: 200 },
  ],
  0.03,
);
const rows2 = calcPersonalSalesDeductForEmployees(
  [
    { id: "A", salesAmount: 1000, tipBefore: 100 },
    { id: "B", salesAmount: 9000, tipBefore: 200 },
  ],
  0.03,
);
assert.equal(rows1.find((r) => r.id === "A").due, 30);
assert.equal(rows2.find((r) => r.id === "A").due, 30);
assert.equal(rows2.find((r) => r.id === "B").due, 270);

// 小费不足
const short = calcPersonalSalesDeduct({ salesAmount: 1000, rate: 0.03, tipBefore: 20 });
assert.equal(short.due, 30);
assert.equal(short.actual, 20);
assert.equal(short.tipAfter, 0);
assert.equal(short.shortfall, 10);

// S=0
const zero = calcPersonalSalesDeduct({ salesAmount: 0, rate: 0.03, tipBefore: 100 });
assert.equal(zero.due, 0);
assert.equal(zero.tipAfter, 100);

console.log("verify-personal-sales-deduct: OK");
