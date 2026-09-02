import assert from "node:assert/strict";
import { calculatePayrollTotals, groupAttendanceByWeek } from "../src/team/payroll/payroll-calculations";
import { buildAdpCsv, buildAdpRows, DEFAULT_PAYROLL_ADP_MAPPING } from "../src/team/payroll/payroll-adp";
import { buildPayrollDetailHtml } from "../src/team/payroll/payroll-export";
import type { PayrollEmployee, PayrollPeriod } from "../src/team/payroll/payroll-types";

const period: PayrollPeriod = {
  id: "p2026-01",
  periodNumber: 1,
  startDate: "01/04/2026",
  endDate: "01/17/2026",
  paycheckDate: "01.23.26",
};

const employee: PayrollEmployee = {
  id: "emp-106",
  name: "Bowen one",
  store: "Golden Dragon Chinese Kitchen - Dallas, TX 75231",
  role: "Busser",
  adpFile: "106",
  rate: 14.2,
  otRate: 21.3,
  ot2Rate: 21.3,
  adjustments: { tips: 0, svcw: 0 },
  segments: [
    { date: "01/05/2026", reg: 7.5, ot: 0, ot2: 0 },
    { date: "01/07/2026", reg: 8, ot: 0.5, ot2: 0 },
    { date: "01/09/2026", reg: 8.25, ot: 1, ot2: 0 },
    { date: "01/12/2026", reg: 7.5, ot: 0, ot2: 0 },
    { date: "01/14/2026", reg: 8, ot: 0.5, ot2: 0 },
    { date: "01/16/2026", reg: 8.25, ot: 1, ot2: 0 },
  ],
};

assert.deepEqual(calculatePayrollTotals(employee), {
  regularHours: 47.5,
  paidBreakHours: 0,
  overtimeHours: 3,
  overtime2Hours: 0,
  totalHours: 50.5,
  regularSalary: 674.5,
  paidBreakSalary: 0,
  overtimeSalary: 63.9,
  overtime2Salary: 0,
  totalSalary: 738.4,
});

const weeks = groupAttendanceByWeek(period, employee);
assert.equal(weeks.length, 2);
assert.equal(weeks[0].segments.length, 3);
assert.equal(weeks[1].segments.length, 3);

const adpRows = buildAdpRows(period, employee, DEFAULT_PAYROLL_ADP_MAPPING);
const csv = buildAdpCsv(adpRows, DEFAULT_PAYROLL_ADP_MAPPING.csvColumns);
assert.match(csv, /Employee Name/);
assert.match(csv, /Bowen one/);
assert.match(csv, /50\.5|47\.5/);

const detailHtml = buildPayrollDetailHtml({ period, employee, totals: calculatePayrollTotals(employee), weeks });
assert.match(detailHtml, /Bowen one/);
assert.match(detailHtml, /01\/04\/2026/);
assert.match(detailHtml, /738\.40/);
assert.match(detailHtml, /01\/16\/2026/);

console.log("Team Payroll domain verification passed.");
