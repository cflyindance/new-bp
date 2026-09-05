import { calculatePayrollTotals } from "./payroll-calculations";
import type { PayrollEmployee, PayrollPeriod, PayrollSnapshot } from "./payroll-types";
import type {
  BatchEmployeeRecord,
  BatchEmployeeStatus,
  BatchExportCounts,
  BatchExportInput,
  BatchExportOptions,
  BatchMissingField,
} from "./payroll-batch-export-types";

export const DEFAULT_BATCH_EXPORT_OPTIONS: BatchExportOptions = {
  scope: "all",
  detailType: "summary",
  format: "pdf",
  organization: "merged",
  summaryPagination: "single-page",
};

export class BatchExportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchExportValidationError";
  }
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function periodRange(period: PayrollPeriod): string {
  return text(period.rangeLabel) || [text(period.startDate), text(period.endDate)].filter(Boolean).join(" - ");
}

function employeeHasData(employee: PayrollEmployee): boolean {
  if ((employee.segments ?? []).length > 0) return true;
  const totals = calculatePayrollTotals(employee);
  if (totals.totalHours !== 0 || totals.totalSalary !== 0) return true;
  if (Object.values(employee.adjustments ?? {}).some((value) => Number(value) !== 0)) return true;
  return [employee.salary, employee.totalSalary, employee.grossPay].some((value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount !== 0;
  });
}

export function classifyBatchEmployee(employee: PayrollEmployee, period: PayrollPeriod): BatchEmployeeRecord {
  if (!employeeHasData(employee)) {
    return { employee, period, status: "no_data", missingFields: [] };
  }
  const missingFields: BatchMissingField[] = [];
  if (!text(employee.id)) missingFields.push("employee_id");
  if (!text(employee.ssn)) missingFields.push("employee_ssn");
  if (!text(employee.hireDate)) missingFields.push("hire_date");
  if (!text(employee.role)) missingFields.push("role");
  if (!periodRange(period)) missingFields.push("pay_period");
  if (!text(period.paycheckDate)) missingFields.push("pay_date");
  const status: BatchEmployeeStatus = missingFields.length
    ? "incomplete"
    : employee.confirmed
      ? "ready"
      : "unconfirmed";
  return { employee, period, status, missingFields };
}

function storeMatches(employee: PayrollEmployee, filter: string): boolean {
  if (!filter) return true;
  const store = text(employee.store).toLowerCase();
  const normalized = filter.toLowerCase();
  return store === normalized || store.includes(normalized) || normalized.includes(store);
}

function resolvePeriod(snapshot: PayrollSnapshot): PayrollPeriod | null {
  const periods = Array.isArray(snapshot.data?.periods) ? snapshot.data.periods : [];
  return periods.find((period) => period.id === snapshot.periodId) ?? null;
}

export function buildBatchExportInput(
  snapshot: PayrollSnapshot,
  options: BatchExportOptions,
  selectedIds: readonly string[],
): BatchExportInput {
  const period = resolvePeriod(snapshot);
  if (!period) throw new BatchExportValidationError("A payroll period is required");
  const source = Array.isArray(snapshot.data?.employees?.[period.id]) ? snapshot.data.employees[period.id] : [];
  const scoped = source.filter((employee) => storeMatches(employee, text(snapshot.employeeStoreFilter)));
  const selected = options.scope === "all"
    ? scoped
    : scoped.filter((employee) => selectedIds.includes(employee.id));
  if (selected.length === 0) throw new BatchExportValidationError("Select at least one employee");
  if (selected.length > 200) throw new BatchExportValidationError("A batch can contain at most 200 employees");
  const records = selected.map((employee) => classifyBatchEmployee(employee, period));
  const counts: BatchExportCounts = { ready: 0, incomplete: 0, unconfirmed: 0, noData: 0 };
  records.forEach((record) => {
    if (record.status === "no_data") counts.noData += 1;
    else counts[record.status] += 1;
  });
  return {
    options: structuredClone(options),
    period: structuredClone(period),
    records: structuredClone(records),
    counts,
    createdAt: Date.now(),
  };
}

export function sanitizePayrollFilePart(value: unknown): string {
  const safe = text(value)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 120);
  return safe || "employee";
}

export function draftLabel(record: BatchEmployeeRecord): string {
  return record.status === "incomplete" || record.status === "unconfirmed" ? "Draft" : "";
}
