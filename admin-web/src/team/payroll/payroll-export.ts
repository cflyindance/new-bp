import type { PayrollTotals, PayrollWeek } from "./payroll-calculations";
import type { PayrollEmployee, PayrollPeriod } from "./payroll-types";

export interface PayrollDetailExportInput {
  period: PayrollPeriod;
  employee: PayrollEmployee;
  totals: PayrollTotals;
  weeks: PayrollWeek[];
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPayrollDetailHtml(input: PayrollDetailExportInput): string {
  const range = `${input.period.startDate ?? ""} - ${input.period.endDate ?? ""}`;
  const weekRows = input.weeks
    .flatMap((week) => week.segments.map((segment) => `<tr><td>${escapeHtml(segment.date)}</td><td>${escapeHtml(segment.reg ?? segment.regular ?? 0)}</td><td>${escapeHtml(segment.ot ?? 0)}</td><td>${escapeHtml(segment.ot2 ?? 0)}</td></tr>`))
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Payroll Detail</title></head><body>
    <h1>${escapeHtml(input.employee.name)}</h1>
    <p>${escapeHtml(range)}</p>
    <p>Total Hours: ${input.totals.totalHours.toFixed(2)}</p>
    <p>Total Salary: $${input.totals.totalSalary.toFixed(2)}</p>
    <table><thead><tr><th>Date</th><th>Regular</th><th>OT</th><th>OT2</th></tr></thead><tbody>${weekRows}</tbody></table>
  </body></html>`;
}

