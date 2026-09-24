import type { DemoScenario, DemoScenarioScope } from "../demo-scenario-types";

export function listDemoEmployees(scenario: DemoScenario, scope: DemoScenarioScope) {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.employees).filter((item) => stores.has(item.storeId));
}

export function listDemoAttendance(scenario: DemoScenario, scope: DemoScenarioScope) {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.attendance).filter((item) => stores.has(item.storeId) && (!scope.fromDate || item.businessDate >= scope.fromDate) && (!scope.toDate || item.businessDate <= scope.toDate));
}

export function listDemoPayroll(scenario: DemoScenario, scope: DemoScenarioScope) {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.payrollEntries).filter((item) => stores.has(item.storeId) && (!scope.fromDate || item.businessDate >= scope.fromDate) && (!scope.toDate || item.businessDate <= scope.toDate));
}

export function toPayrollRoster(scenario: DemoScenario, scope: DemoScenarioScope) {
  return listDemoEmployees(scenario, scope).map((employee) => ({ id: employee.employeeId, name: employee.name, store: scenario.storeProfiles[employee.storeId].name, role: employee.jobCode, rate: employee.wageMinorPerHour / 100, otRate: employee.wageMinorPerHour * 1.5 / 100 }));
}
