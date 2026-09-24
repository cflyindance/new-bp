export type MoneyMinor = number;
export type LocalBusinessDate = `${number}-${number}-${number}`;

export function isMoneyMinor(value: unknown): value is MoneyMinor {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export interface DemoScenarioMetadata {
  scenarioId: string;
  scenarioVersion: number;
  anchorDate: LocalBusinessDate;
  generatedAt: string;
}

export interface DemoScenarioScope {
  groupId?: string;
  brandIds: string[];
  storeIds: string[];
  fromDate?: LocalBusinessDate;
  toDate?: LocalBusinessDate;
}

export interface DemoBrandTemplate {
  brandId: string;
  groupId: string;
  name: string;
  productIds: string[];
  campaignIds: string[];
  basePrices: Record<string, MoneyMinor>;
}

export interface DemoStoreProductOverride {
  priceMinor?: MoneyMinor;
  enabled?: boolean;
  inventory?: number | null;
}

export interface DemoStoreProfile {
  storeId: string;
  brandId: string;
  groupId: string;
  name: string;
  timezone: string;
  volumeFactor: number;
  averageTicketFactor: number;
  productOverrides: Record<string, DemoStoreProductOverride>;
}

export interface DemoEmployee {
  employeeId: string;
  storeId: string;
  brandId: string;
  groupId: string;
  name: string;
  jobCode: string;
  wageMinorPerHour: MoneyMinor;
  authorizedStoreIds: string[];
}

export interface DemoProduct {
  productId: string;
  brandId: string;
  name: string;
  categoryId: string;
  taxRateBasisPoints: number;
}

export interface DemoStoreProduct {
  storeProductId: string;
  storeId: string;
  productId: string;
  priceMinor: MoneyMinor;
  enabled: boolean;
  inventory: number | null;
}

export interface DemoCampaign {
  campaignId: string;
  brandId: string;
  storeIds: string[];
  name: string;
  startsOn: LocalBusinessDate;
  endsOn: LocalBusinessDate;
  discountBasisPoints: number;
}

export interface DemoOrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMinor: MoneyMinor;
  lineTotalMinor: MoneyMinor;
}

export interface DemoOrder {
  orderId: string;
  businessDate: LocalBusinessDate;
  placedAt: string;
  groupId: string;
  brandId: string;
  storeId: string;
  employeeId: string;
  campaignId?: string;
  items: DemoOrderItem[];
  subtotalMinor: MoneyMinor;
  discountMinor: MoneyMinor;
  taxMinor: MoneyMinor;
  tipMinor: MoneyMinor;
  refundMinor: MoneyMinor;
  payableMinor: MoneyMinor;
}

export interface DemoPayment {
  paymentId: string;
  orderId: string;
  storeId: string;
  businessDate: LocalBusinessDate;
  method: "cash" | "card" | "gift-card";
  amountMinor: MoneyMinor;
  status: "captured" | "refunded";
}

export interface DemoRefund {
  refundId: string;
  orderId: string;
  paymentId: string;
  storeId: string;
  businessDate: LocalBusinessDate;
  amountMinor: MoneyMinor;
}

export interface DemoShift {
  shiftId: string;
  employeeId: string;
  storeId: string;
  businessDate: LocalBusinessDate;
  startsAt: string;
  endsAt: string;
}

export interface DemoAttendance {
  attendanceId: string;
  shiftId: string;
  employeeId: string;
  storeId: string;
  businessDate: LocalBusinessDate;
  clockInAt: string;
  clockOutAt: string;
  regularMinutes: number;
  overtimeMinutes: number;
}

export interface DemoPayrollEntry {
  payrollEntryId: string;
  employeeId: string;
  storeId: string;
  businessDate: LocalBusinessDate;
  regularPayMinor: MoneyMinor;
  overtimePayMinor: MoneyMinor;
  tipsMinor: MoneyMinor;
  grossPayMinor: MoneyMinor;
}

export interface DemoFinanceEntry {
  financeEntryId: string;
  storeId: string;
  brandId: string;
  businessDate: LocalBusinessDate;
  kind: "sale" | "discount" | "tax" | "tip" | "refund" | "payroll" | "settlement";
  sourceId: string;
  amountMinor: MoneyMinor;
}

export interface DemoScenario {
  metadata: DemoScenarioMetadata;
  scopeIndex: { groupIds: string[]; brandIds: string[]; storeIds: string[] };
  brandTemplates: Record<string, DemoBrandTemplate>;
  storeProfiles: Record<string, DemoStoreProfile>;
  employees: Record<string, DemoEmployee>;
  products: Record<string, DemoProduct>;
  storeProducts: Record<string, DemoStoreProduct>;
  campaigns: Record<string, DemoCampaign>;
  orders: Record<string, DemoOrder>;
  payments: Record<string, DemoPayment>;
  refunds: Record<string, DemoRefund>;
  shifts: Record<string, DemoShift>;
  attendance: Record<string, DemoAttendance>;
  payrollEntries: Record<string, DemoPayrollEntry>;
  financeEntries: Record<string, DemoFinanceEntry>;
}
