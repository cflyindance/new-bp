import assert from "node:assert/strict";
import { buildBatchExportInput, classifyBatchEmployee, DEFAULT_BATCH_EXPORT_OPTIONS, sanitizePayrollFilePart } from "../src/team/payroll/payroll-batch-export-data";
import type { PayrollEmployee, PayrollPeriod, PayrollSnapshot } from "../src/team/payroll/payroll-types";
import { buildDetailedCsv, buildSummaryCsv, csvCell, DETAILED_CSV_COLUMNS, SUMMARY_CSV_COLUMNS } from "../src/team/payroll/payroll-batch-export-csv";
import { loadBatchExportPreferences, saveBatchExportPreferences } from "../src/team/payroll/payroll-batch-export-task";

const period: PayrollPeriod = { id: "p2026-02", periodNumber: 2, startDate: "01/04/2026", endDate: "01/17/2026", paycheckDate: "01/23/2026", rangeLabel: "01/04/2026 - 01/17/2026" };
const employee = (id: string, extra: Partial<PayrollEmployee> = {}): PayrollEmployee => ({
  id, name: id, store: "Dallas", role: "Server", ssn: "111-22-3333", hireDate: "01/01/2020",
  rate: 20, segments: [{ date: "01/05/2026", reg: 8 }], adjustments: {}, confirmed: true, ...extra,
});
const employees = [
  employee("ready"),
  employee("missing", { ssn: "" }),
  employee("draft", { confirmed: false }),
  employee("empty", { segments: [], adjustments: {}, rate: 0 }),
];
const snapshot: PayrollSnapshot = {
  data: { periods: [period], employees: { [period.id]: employees }, auditLog: [] },
  view: "workspace", periodId: period.id, employeeId: "ready", employeeStoreFilter: "Dallas",
};

assert.deepEqual(DEFAULT_BATCH_EXPORT_OPTIONS, { scope: "all", detailType: "summary", format: "pdf", organization: "merged", summaryPagination: "single-page" });
const input = buildBatchExportInput(snapshot, DEFAULT_BATCH_EXPORT_OPTIONS, []);
assert.deepEqual(input.counts, { ready: 1, incomplete: 1, unconfirmed: 1, noData: 1 });
assert.deepEqual(input.records.find((record) => record.employee.id === "missing")?.missingFields, ["employee_ssn"]);
assert.equal(classifyBatchEmployee(employees[3], period).status, "no_data");
assert.equal(sanitizePayrollFilePart(' A/B:* "C" '), "A_B_C");
assert.equal(buildBatchExportInput(snapshot, { ...DEFAULT_BATCH_EXPORT_OPTIONS, scope: "selected" }, ["draft"]).records.length, 1);
assert.throws(() => buildBatchExportInput(snapshot, { ...DEFAULT_BATCH_EXPORT_OPTIONS, scope: "selected" }, []), /Select at least one/);
const tooMany = Array.from({ length: 201 }, (_, index) => employee(`e${index}`));
assert.throws(() => buildBatchExportInput({ ...snapshot, data: { ...snapshot.data, employees: { [period.id]: tooMany } } }, DEFAULT_BATCH_EXPORT_OPTIONS, []), /200/);

assert.equal(SUMMARY_CSV_COLUMNS.length, 23);
assert.equal(DETAILED_CSV_COLUMNS.length, 39);
assert.equal(csvCell('A,"B"'), '"A,""B"""');
const summaryCsv = buildSummaryCsv(input.records);
assert.ok(summaryCsv.startsWith("\uFEFFstore_id,"));
assert.equal(summaryCsv.split("\r\n").length, 4);
assert.match(summaryCsv, /Draft/);
const detailedCsv = buildDetailedCsv(input.records);
assert.ok(detailedCsv.startsWith("\uFEFFrow_type,"));
assert.match(detailedCsv, /\r\nemployee_summary,/);
assert.match(detailedCsv, /\r\nshift,/);
const fixedSalary = classifyBatchEmployee(employee("salary", { segments: [], salary: 500 }), period);
const fixedCsv = buildDetailedCsv([fixedSalary]);
assert.equal(fixedCsv.split("\r\n").length, 2);
assert.match(fixedCsv, /\r\nemployee_summary,/);
assert.doesNotMatch(fixedCsv, /\r\nshift,/);
const memory = new Map<string, string>();
const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } } as Storage;
saveBatchExportPreferences(storage, { ...DEFAULT_BATCH_EXPORT_OPTIONS, scope: "selected", detailType: "detailed", format: "csv", organization: "zip", summaryPagination: "auto-pages" });
assert.deepEqual(loadBatchExportPreferences(storage), { scope: "all", detailType: "detailed", format: "csv", organization: "zip", summaryPagination: "auto-pages" });

console.log("Payroll batch export domain verification passed.");
