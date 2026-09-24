import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";
import { listDemoAttendance, listDemoEmployees, listDemoPayroll, toPayrollRoster } from "../src/demo-scenario/adapters/team-demo-adapter";

const snapshot = { merchants: [{ merchantId: "b", groupId: "g", name: "品牌", timezone: "Asia/Shanghai" }], stores: [{ storeId: "s", merchantId: "b", name: "门店", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const scenario = generateDemoScenario({ snapshot, scenarioId: "team", scenarioVersion: 1, anchorDate: "2026-09-24" });
const scope = { groupId: "g", brandIds: ["b"], storeIds: ["s"] };
const employees = listDemoEmployees(scenario, scope);
const attendance = listDemoAttendance(scenario, scope);
const payroll = listDemoPayroll(scenario, scope);
if (!employees.length || !attendance.length || !payroll.length || toPayrollRoster(scenario, scope).length !== employees.length) throw new Error("team projection is empty");
for (const pay of payroll) {
  const employee = scenario.employees[pay.employeeId];
  const row = attendance.find((item) => item.employeeId === pay.employeeId && item.businessDate === pay.businessDate);
  if (!employee || !row) throw new Error(`broken payroll link ${pay.payrollEntryId}`);
  const expected = Math.round(employee.wageMinorPerHour * row.regularMinutes / 60) + Math.round(employee.wageMinorPerHour * 1.5 * row.overtimeMinutes / 60) + pay.tipsMinor;
  if (expected !== pay.grossPayMinor) throw new Error(`payroll mismatch ${pay.payrollEntryId}`);
}
console.log("demo team adapter: ok");
