import type { PayrollEmployee, PayrollScopeSnapshot, PayrollSnapshot } from "./payroll-types";

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();
type Store = PayrollScopeSnapshot["stores"][number];

function storeAliases(store: Store): string[] {
  const aliases = [store.id, store.labelZh, store.labelEn];
  if (store.id.startsWith("roster-store:")) {
    try { aliases.push(decodeURIComponent(store.id.slice("roster-store:".length))); } catch { /* Invalid aliases never broaden scope. */ }
  }
  return aliases.map(normalize).filter(Boolean);
}

export function getBatchStoreId(snapshot: PayrollSnapshot, scope: PayrollScopeSnapshot): string {
  const current = scope.stores.find(store => storeAliases(store).includes(normalize(snapshot.employeeStoreFilter)));
  if (current) return current.id;
  return scope.stores.some(store => store.id === scope.storeId) ? scope.storeId : "";
}

export function scopeBatchSnapshot(snapshot: PayrollSnapshot, scope: PayrollScopeSnapshot, storeId: string): PayrollSnapshot {
  const store = scope.stores.find(item => item.id === storeId);
  if (!store) throw new Error("所选门店不可用或没有访问权限，请重新选择");
  const aliases = storeAliases(store);
  const period = snapshot.data.periods.find(item => item.id === snapshot.periodId);
  if (!period) throw new Error("当前薪资周期不可用，请重新选择");
  const periodMatches = !period.storeId || aliases.includes(normalize(period.storeId));
  const employees = periodMatches ? (snapshot.data.employees[period.id] ?? []).filter(employee => {
    const employeeStoreId = normalize(employee.storeId);
    return employeeStoreId ? aliases.includes(employeeStoreId) : aliases.includes(normalize(employee.store));
  }) : [];
  return {
    ...snapshot,
    // Store matching was already performed using authorized aliases, not substring matching.
    employeeStoreFilter: "",
    data: { ...snapshot.data, employees: { ...snapshot.data.employees, [period.id]: employees } },
  };
}

export function filterBatchEmployees(employees: PayrollEmployee[], role: string, search: string): PayrollEmployee[] {
  const needle = normalize(search);
  return employees.filter(employee =>
    (!role || String(employee.role ?? "").trim() === role) &&
    (!needle || [employee.name, employee.id, employee.adpFile].some(value => normalize(value).includes(needle))),
  );
}
