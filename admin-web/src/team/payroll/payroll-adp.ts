import { calculatePayrollTotals } from "./payroll-calculations";
import type { PayrollEmployee, PayrollPeriod } from "./payroll-types";

export interface PayrollAdpMapping {
  version: string;
  coCode: string;
  csvColumns: string[];
}

export const DEFAULT_PAYROLL_ADP_MAPPING: PayrollAdpMapping = {
  version: "koi-default-v1",
  coCode: "X0L",
  csvColumns: [
    "CO CODE",
    "BATCH ID",
    "FILE #",
    "Employee Name",
    "Role",
    "Rate",
    "Reg Hours",
    "Hours 3 code",
    "Hours 3 amount",
    "Earnings 3 Code",
    "Earnings 3 Amount",
    "Earnings 3 Code",
    "Earnings 3 Amount",
  ],
};

export function buildAdpRows(
  period: PayrollPeriod,
  employee: PayrollEmployee,
  mapping: PayrollAdpMapping,
): string[][] {
  const totals = calculatePayrollTotals(employee);
  return [[
    mapping.coCode,
    String(period.paycheckDate ?? ""),
    String(employee.adpFile ?? ""),
    employee.name,
    String(employee.role ?? ""),
    String(employee.rate ?? employee.hourlyRate ?? 0),
    String(totals.regularHours),
    "OHR",
    String(totals.overtimeHours),
    "CCT",
    String(employee.adjustments.tips ?? 0),
    "SVC",
    String(employee.adjustments.svcw ?? 0),
  ]];
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildAdpCsv(rows: string[][], headers: string[]): string {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

