import type {
  PayrollEmployee,
  PayrollResolvedSelection,
  PayrollScopeSnapshot,
  PayrollSnapshot,
} from "./payroll-types";

type PayrollScopeSelection = Pick<PayrollScopeSnapshot, "storeId" | "storeLabel" | "isAllStores">;

function cloneSnapshot(snapshot: PayrollSnapshot): PayrollSnapshot {
  return structuredClone(snapshot);
}

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function storeMatches(employee: PayrollEmployee, storeFilter: string): boolean {
  const employeeStore = normalize(employee.store);
  const filter = normalize(storeFilter);
  if (!filter) return true;
  if (!employeeStore) return false;
  return employeeStore === filter || employeeStore.includes(filter) || filter.includes(employeeStore);
}

function periodEmployees(snapshot: PayrollSnapshot, periodId: string | null): PayrollEmployee[] {
  if (!periodId) return [];
  const employees = snapshot.data.employees[periodId];
  return Array.isArray(employees) ? employees.filter((employee) => Boolean(employee?.id)) : [];
}

function resolvePeriodId(snapshot: PayrollSnapshot): string | null {
  const periods = Array.isArray(snapshot.data.periods) ? snapshot.data.periods : [];
  if (snapshot.periodId && periods.some((period) => period.id === snapshot.periodId)) {
    return snapshot.periodId;
  }

  const withEmployees = periods.filter((period) => periodEmployees(snapshot, period.id).length > 0);
  const pool = withEmployees.length > 0 ? withEmployees : periods;
  return pool.length > 0 ? pool[pool.length - 1].id : null;
}

function firstEmployeeBackedStore(employees: PayrollEmployee[]): string {
  return String(employees.find((employee) => String(employee.store ?? "").trim())?.store ?? "").trim();
}

export function resolvePayrollSelection(
  snapshot: PayrollSnapshot,
  scope: PayrollScopeSelection,
): PayrollResolvedSelection {
  const periodId = resolvePeriodId(snapshot);
  const employees = periodEmployees(snapshot, periodId);

  const requestedScopeStore = scope.isAllStores ? "" : String(scope.storeLabel || scope.storeId || "").trim();
  let storeFilter = requestedScopeStore || String(snapshot.employeeStoreFilter || "").trim();
  let scopedEmployees = employees.filter((employee) => storeMatches(employee, storeFilter));

  if (employees.length > 0 && scopedEmployees.length === 0) {
    storeFilter = firstEmployeeBackedStore(employees);
    scopedEmployees = employees.filter((employee) => storeMatches(employee, storeFilter));
    if (scopedEmployees.length === 0) scopedEmployees = employees;
  }

  if (!storeFilter && employees.length > 0) {
    storeFilter = firstEmployeeBackedStore(employees);
    scopedEmployees = employees.filter((employee) => storeMatches(employee, storeFilter));
    if (scopedEmployees.length === 0) scopedEmployees = employees;
  }

  const selectedEmployee = scopedEmployees.find((employee) => employee.id === snapshot.employeeId) ?? scopedEmployees[0];
  const employeeId = selectedEmployee?.id ?? null;
  const repaired =
    snapshot.view !== "workspace" ||
    snapshot.periodId !== periodId ||
    snapshot.employeeId !== employeeId ||
    String(snapshot.employeeStoreFilter || "").trim() !== storeFilter;

  return { periodId, employeeId, storeFilter, repaired };
}

export interface PayrollStateStore {
  getSnapshot(): PayrollSnapshot;
  replaceSnapshot(snapshot: PayrollSnapshot): void;
  subscribe(listener: (snapshot: PayrollSnapshot) => void): () => void;
  destroy(): void;
}

export function createPayrollState(initialSnapshot: PayrollSnapshot): PayrollStateStore {
  let snapshot = cloneSnapshot(initialSnapshot);
  let destroyed = false;
  const listeners = new Set<(snapshot: PayrollSnapshot) => void>();

  return {
    getSnapshot() {
      return cloneSnapshot(snapshot);
    },
    replaceSnapshot(nextSnapshot) {
      snapshot = cloneSnapshot(nextSnapshot);
      if (destroyed) return;
      const current = cloneSnapshot(snapshot);
      listeners.forEach((listener) => listener(current));
    },
    subscribe(listener) {
      if (destroyed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy() {
      destroyed = true;
      listeners.clear();
    },
  };
}
