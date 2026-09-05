import type { PayrollEmployee, PayrollPeriod, PayrollSnapshot } from "./payroll-types";

export type BatchEmployeeStatus = "ready" | "incomplete" | "unconfirmed" | "no_data";
export type BatchDetailType = "detailed" | "summary";
export type BatchFormat = "pdf" | "csv";
export type BatchOrganization = "merged" | "zip";
export type SummaryPagination = "single-page" | "auto-pages";
export type BatchTaskStatus =
  | "idle"
  | "preparing"
  | "generating"
  | "packaging"
  | "completed"
  | "partial"
  | "failed"
  | "cancelling"
  | "cancelled";

export interface BatchExportOptions {
  scope: "all" | "selected";
  detailType: BatchDetailType;
  format: BatchFormat;
  organization: BatchOrganization;
  summaryPagination: SummaryPagination;
}

export type BatchMissingField =
  | "employee_id"
  | "employee_ssn"
  | "hire_date"
  | "role"
  | "pay_period"
  | "pay_date";

export interface BatchEmployeeRecord {
  employee: PayrollEmployee;
  period: PayrollPeriod;
  status: BatchEmployeeStatus;
  missingFields: BatchMissingField[];
}

export interface BatchExportCounts {
  ready: number;
  incomplete: number;
  unconfirmed: number;
  noData: number;
}

export interface BatchExportInput {
  options: BatchExportOptions;
  period: PayrollPeriod;
  records: BatchEmployeeRecord[];
  counts: BatchExportCounts;
  createdAt: number;
}

export interface PayrollBatchBridge {
  getSnapshot(): PayrollSnapshot;
  getDetailPayload(employeeId: string): Record<string, unknown> | null;
  getDetailPrintHtml(
    employeeId: string,
    detailType: BatchDetailType,
    pagination: SummaryPagination,
  ): string | null;
  appendExportAudit(
    format: BatchFormat,
    employeeIds: string[],
    result: "completed" | "partial" | "failed",
  ): void;
}

export interface BatchExportFailure {
  employeeId: string;
  employeeName: string;
  message: string;
}

export interface BatchArtifactResult {
  blob: Blob;
  filename: string;
  succeededIds: string[];
  failures: BatchExportFailure[];
  skippedIds: string[];
}

