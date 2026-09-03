import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/TipOut/payroll-period-calendar.js", "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const api = context.window.PayrollPeriodCalendar;
const plain = (value) => JSON.parse(JSON.stringify(value));

const period = (list, id) => list.find((item) => item.id === id);
const periods2027 = api.buildSupportedPeriods(new Date(2026, 8, 3), {});
assert.equal(period(periods2027, "p2026-01").rangeLabel, "12/21/2025 (Sun) – 01/03/2026 (Sat)");
assert.equal(period(periods2027, "p2026-02").rangeLabel, "01/04/2026 (Sun) – 01/17/2026 (Sat)");
assert.equal(periods2027.some((item) => item.year === 2027), true);
assert.equal(periods2027.filter((item) => item.year === 2027).length, 26);

const periods2028 = api.buildSupportedPeriods(new Date(2027, 0, 1), {});
assert.equal(periods2028.filter((item) => item.year === 2028).length, 27);
assert.equal(period(periods2028, "p2028-01").rangeLabel, "12/19/2027 (Sun) – 01/01/2028 (Sat)");
assert.equal(period(periods2028, "p2028-27").rangeLabel, "12/17/2028 (Sun) – 12/30/2028 (Sat)");

const oldPeriods = [
  { id: "p2025-26", year: 2025, periodNumber: 26, rangeLabel: "12/21/2025 (Sun) – 01/03/2026 (Sat)", status: "confirmed" },
  { id: "p2026-01", year: 2026, periodNumber: 1, rangeLabel: "01/04/2026 (Sun) – 01/17/2026 (Sat)", status: "partial" },
  { id: "p2026-26", year: 2026, periodNumber: 26, rangeLabel: "12/20/2026 (Sun) – 01/02/2027 (Sat)", status: "draft" },
];
const legacySnapshot = {
  coCode: "X0L",
  extensionField: { keep: true },
  periods: oldPeriods,
  employees: {
    "p2025-26": [{ id: "cross-year" }],
    "p2026-01": [{ id: "employee-a" }, { id: "employee-a" }],
    "p2026-26": [{ id: "next-year" }],
  },
  auditLog: [{ periodId: "p2026-01", action: "save" }, { periodId: "missing", action: "legacy" }],
};
const selection = {
  periodId: "p2026-01",
  employeeId: "employee-a",
  periodYearFilter: "2026",
  workspacePeriodYearFilter: "2026",
  periodNumberFilter: "1",
};
const migrated = api.migrateSnapshot(legacySnapshot, selection, new Date(2026, 8, 3), {});
assert.deepEqual(plain(migrated.snapshot.employees["p2026-01"]), legacySnapshot.employees["p2025-26"]);
assert.deepEqual(plain(migrated.snapshot.employees["p2026-02"]), legacySnapshot.employees["p2026-01"]);
assert.deepEqual(plain(migrated.snapshot.employees["p2027-01"]), legacySnapshot.employees["p2026-26"]);
assert.equal(migrated.selection.periodId, "p2026-02");
assert.equal(migrated.selection.periodNumberFilter, "2");
assert.equal(migrated.snapshot.auditLog[0].periodId, "p2026-02");
assert.equal(migrated.snapshot.auditLog[1].legacyPeriodReference, true);
assert.equal(migrated.snapshot.coCode, "X0L");
assert.deepEqual(plain(migrated.snapshot.extensionField), { keep: true });

const migratedAgain = api.migrateSnapshot(migrated.snapshot, migrated.selection, new Date(2026, 8, 3), {});
assert.deepEqual(plain(migratedAgain.snapshot), plain(migrated.snapshot));
assert.deepEqual(plain(migratedAgain.selection), plain(migrated.selection));

console.log("Payroll period calendar verification passed.");
