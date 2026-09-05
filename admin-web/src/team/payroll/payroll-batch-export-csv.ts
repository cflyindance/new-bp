import { calculatePayrollTotals } from "./payroll-calculations";
import { draftLabel } from "./payroll-batch-export-data";
import type { BatchDetailType, BatchEmployeeRecord } from "./payroll-batch-export-types";

export const SUMMARY_CSV_COLUMNS = [
  "store_id", "store_name", "payroll_year", "period_number", "period_start", "period_end", "pay_date",
  "employee_id", "employee_name", "role", "hire_date", "regular_hours", "ot_hours", "ot2_hours", "total_hours",
  "regular_amount", "ot_amount", "ot2_amount", "tips", "gratuity", "gross_total", "status", "missing_fields",
] as const;

export const DETAILED_CSV_COLUMNS = [
  "row_type", "store_id", "store_name", "payroll_year", "period_number", "period_start", "period_end", "pay_date",
  "employee_id", "employee_name", "role", "hire_date", "status", "missing_fields",
  "summary_regular_hours", "summary_ot_hours", "summary_ot2_hours", "summary_total_hours",
  "summary_regular_amount", "summary_ot_amount", "summary_ot2_amount", "summary_tips", "summary_gratuity", "summary_gross_total",
  "work_date", "week_number", "clock_in", "clock_out", "meal_hours",
  "line_regular_hours", "line_regular_rate", "line_regular_amount", "line_ot_hours", "line_ot_rate", "line_ot_amount",
  "line_ot2_hours", "line_ot2_rate", "line_ot2_amount", "line_amount",
] as const;

type CsvValue = string | number | null | undefined;
type CsvRow = Record<string, CsvValue>;

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fixed(value: unknown): string {
  return numberValue(value).toFixed(2);
}

function isoDate(value: unknown): string {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}` : text;
}

function splitRange(record: BatchEmployeeRecord): [string, string] {
  const period = record.period;
  if (period.startDate || period.endDate) return [isoDate(period.startDate), isoDate(period.endDate)];
  const parts = String(period.rangeLabel ?? "").split(/\s+[–-]\s+/);
  return [isoDate(parts[0]), isoDate(parts[1])];
}

function employeeBase(record: BatchEmployeeRecord): CsvRow {
  const [start, end] = splitRange(record);
  const employee = record.employee;
  return {
    store_id: String(employee.storeId ?? employee.store ?? ""),
    store_name: employee.store ?? "",
    payroll_year: record.period.year ?? start.slice(0, 4),
    period_number: record.period.periodNumber ?? "",
    period_start: start,
    period_end: end,
    pay_date: isoDate(record.period.paycheckDate),
    employee_id: employee.id,
    employee_name: employee.name,
    role: employee.role ?? "",
    hire_date: isoDate(employee.hireDate),
    status: draftLabel(record) || "Ready",
    missing_fields: record.missingFields.join("|"),
  };
}

function amounts(record: BatchEmployeeRecord) {
  const totals = calculatePayrollTotals(record.employee);
  const tips = numberValue(record.employee.adjustments?.tips);
  const gratuity = numberValue(record.employee.adjustments?.svcw);
  return { totals, tips, gratuity, gross: totals.totalSalary + tips + gratuity };
}

function summaryRow(record: BatchEmployeeRecord): CsvRow {
  const { totals, tips, gratuity, gross } = amounts(record);
  return {
    ...employeeBase(record),
    regular_hours: fixed(totals.regularHours + totals.paidBreakHours),
    ot_hours: fixed(totals.overtimeHours),
    ot2_hours: fixed(totals.overtime2Hours),
    total_hours: fixed(totals.totalHours),
    regular_amount: fixed(totals.regularSalary + totals.paidBreakSalary),
    ot_amount: fixed(totals.overtimeSalary),
    ot2_amount: fixed(totals.overtime2Salary),
    tips: fixed(tips),
    gratuity: fixed(gratuity),
    gross_total: fixed(gross),
  };
}

function detailedRows(record: BatchEmployeeRecord): CsvRow[] {
  const { totals, tips, gratuity, gross } = amounts(record);
  const summary: CsvRow = {
    row_type: "employee_summary",
    ...employeeBase(record),
    summary_regular_hours: fixed(totals.regularHours + totals.paidBreakHours),
    summary_ot_hours: fixed(totals.overtimeHours),
    summary_ot2_hours: fixed(totals.overtime2Hours),
    summary_total_hours: fixed(totals.totalHours),
    summary_regular_amount: fixed(totals.regularSalary + totals.paidBreakSalary),
    summary_ot_amount: fixed(totals.overtimeSalary),
    summary_ot2_amount: fixed(totals.overtime2Salary),
    summary_tips: fixed(tips),
    summary_gratuity: fixed(gratuity),
    summary_gross_total: fixed(gross),
  };
  const start = new Date(`${splitRange(record)[0]}T00:00:00`);
  const shifts = (record.employee.segments ?? []).flatMap((segment, segmentIndex) => {
    const slots = Array.isArray(segment.slots) && segment.slots.length
      ? segment.slots
      : [{ in: segment.in, out: segment.out }];
    return slots.map((slot, slotIndex): CsvRow => {
      const rate = numberValue(segment.rate ?? record.employee.rate ?? record.employee.hourlyRate);
      const otRate = numberValue(segment.otRate ?? record.employee.otRate) || rate * 1.5;
      const ot2Rate = numberValue(segment.ot2Rate ?? record.employee.ot2Rate) || rate * 2;
      const regular = slotIndex === 0 ? numberValue(segment.reg ?? segment.regular) : 0;
      const ot = slotIndex === 0 ? numberValue(segment.ot) : 0;
      const ot2 = slotIndex === 0 ? numberValue(segment.ot2) : 0;
      const lineAmount = regular * rate + ot * otRate + ot2 * ot2Rate;
      const workDate = isoDate(segment.date);
      const date = new Date(`${workDate}T00:00:00`);
      const week = Number.isFinite(start.getTime()) && Number.isFinite(date.getTime())
        ? Math.max(1, Math.floor((date.getTime() - start.getTime()) / 604_800_000) + 1)
        : Math.floor(segmentIndex / 7) + 1;
      return {
        row_type: "shift",
        ...employeeBase(record),
        work_date: workDate,
        week_number: week,
        clock_in: slot.in ?? "",
        clock_out: slot.out ?? "",
        meal_hours: slotIndex === 0 ? String(segment.mealHours ?? segment.meal ?? segment.paidMealBreak ?? "") : "",
        line_regular_hours: fixed(regular),
        line_regular_rate: fixed(rate),
        line_regular_amount: fixed(regular * rate),
        line_ot_hours: fixed(ot),
        line_ot_rate: fixed(otRate),
        line_ot_amount: fixed(ot * otRate),
        line_ot2_hours: fixed(ot2),
        line_ot2_rate: fixed(ot2Rate),
        line_ot2_amount: fixed(ot2 * ot2Rate),
        line_amount: fixed(lineAmount),
      };
    });
  });
  return [summary, ...shifts];
}

export function csvCell(value: CsvValue): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function serializeCsv(columns: readonly string[], rows: CsvRow[]): string {
  return `\uFEFF${[columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))]
    .map((cells) => cells.map(csvCell).join(","))
    .join("\r\n")}`;
}

export function buildSummaryCsv(records: BatchEmployeeRecord[]): string {
  return serializeCsv(SUMMARY_CSV_COLUMNS, records.filter((record) => record.status !== "no_data").map(summaryRow));
}

export function buildDetailedCsv(records: BatchEmployeeRecord[]): string {
  return serializeCsv(DETAILED_CSV_COLUMNS, records.filter((record) => record.status !== "no_data").flatMap(detailedRows));
}

export function buildEmployeeCsv(record: BatchEmployeeRecord, detailType: BatchDetailType): string {
  return detailType === "summary" ? buildSummaryCsv([record]) : buildDetailedCsv([record]);
}
