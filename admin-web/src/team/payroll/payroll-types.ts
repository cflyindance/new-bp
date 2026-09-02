export type PayrollView = "workspace" | "periods" | "employees";

export interface PayrollPeriod {
  id: string;
  year?: string | number;
  periodNumber?: string | number;
  startDate?: string;
  endDate?: string;
  paycheckDate?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PayrollSegment {
  date?: string;
  in?: string;
  out?: string;
  slots?: Array<{ in?: string; out?: string }>;
  regular?: number;
  reg?: number;
  ot?: number;
  ot2?: number;
  [key: string]: unknown;
}

export interface PayrollAdjustments {
  incentive?: number | string;
  breakfast?: number | string;
  lunch?: number | string;
  dinner?: number | string;
  sickHours?: number | string;
  svcw?: number | string;
  tips?: number | string;
  childSup?: number | string;
  medDed?: number | string;
  eee40?: number | string;
  eer60?: number | string;
  exempt?: number | string;
  [key: string]: unknown;
}

export interface PayrollEmployee {
  id: string;
  name: string;
  store?: string;
  role?: string;
  adpFile?: string;
  ssn?: string;
  hireDate?: string;
  hourlyRate?: number;
  rate?: number;
  otRate?: number;
  ot2Rate?: number;
  segments: PayrollSegment[];
  adjustments: PayrollAdjustments;
  [key: string]: unknown;
}

export interface PayrollAuditEntry {
  id?: string;
  action?: string;
  time?: string;
  [key: string]: unknown;
}

export interface PayrollData {
  periods: PayrollPeriod[];
  employees: Record<string, PayrollEmployee[]>;
  auditLog: PayrollAuditEntry[];
  coCode?: string;
  [key: string]: unknown;
}

export interface PayrollSnapshot {
  data: PayrollData;
  view: PayrollView;
  periodId: string | null;
  employeeId: string | null;
  employeeStoreFilter: string;
  periodYearFilter?: string;
  workspacePeriodYearFilter?: string;
  periodNumberFilter?: string;
  periodStatusFilter?: string;
  activeTab?: string;
  [key: string]: unknown;
}

export interface PayrollScopeSnapshot {
  brandId: string;
  regionId: string;
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  usesInPageStorePicker: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export interface PayrollResolvedSelection {
  periodId: string | null;
  employeeId: string | null;
  storeFilter: string;
  repaired: boolean;
}
