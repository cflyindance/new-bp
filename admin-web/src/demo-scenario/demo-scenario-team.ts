import { createSeededRandom, seedFromParts, stableDemoId } from "./demo-scenario-random";
import type { DemoAttendance, DemoEmployee, DemoOrder, DemoPayrollEntry, DemoShift, DemoStoreProfile, LocalBusinessDate } from "./demo-scenario-types";

const EMPLOYEE_NAMES = ["陈晨", "李敏", "王涛", "赵琳", "Alex Chen", "Jamie Lee"];
const JOBS = ["manager", "server", "cashier", "kitchen"];

export function generateTeamBase(stores: DemoStoreProfile[], dates: LocalBusinessDate[], scenarioVersion: number) {
  const employees: Record<string, DemoEmployee> = {};
  const shifts: Record<string, DemoShift> = {};
  const attendance: Record<string, DemoAttendance> = {};
  for (const store of stores) {
    const storeEmployees = Array.from({ length: 4 }, (_, index) => {
      const employeeId = stableDemoId("employee", store.storeId, index + 1);
      const employee: DemoEmployee = {
        employeeId,
        storeId: store.storeId,
        brandId: store.brandId,
        groupId: store.groupId,
        name: EMPLOYEE_NAMES[(index + seedFromParts(store.storeId)) % EMPLOYEE_NAMES.length],
        jobCode: JOBS[index],
        wageMinorPerHour: 1800 + index * 250,
        authorizedStoreIds: [store.storeId],
      };
      employees[employeeId] = employee;
      return employee;
    });
    for (const date of dates) {
      for (let index = 0; index < 2; index += 1) {
        const employee = storeEmployees[(dates.indexOf(date) + index) % storeEmployees.length];
        const shiftId = stableDemoId("shift", store.storeId, date, index + 1);
        const random = createSeededRandom(seedFromParts(scenarioVersion, date, employee.employeeId, "attendance"));
        const minutes = 450 + Math.floor(random() * 75);
        shifts[shiftId] = { shiftId, employeeId: employee.employeeId, storeId: store.storeId, businessDate: date, startsAt: `${date}T09:00:00`, endsAt: `${date}T18:00:00` };
        const regularMinutes = Math.min(480, minutes);
        attendance[stableDemoId("attendance", store.storeId, date, index + 1)] = {
          attendanceId: stableDemoId("attendance", store.storeId, date, index + 1), shiftId, employeeId: employee.employeeId, storeId: store.storeId, businessDate: date,
          clockInAt: `${date}T09:00:00`, clockOutAt: `${date}T${String(16 + Math.floor(minutes / 60) - 7).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`,
          regularMinutes, overtimeMinutes: Math.max(0, minutes - 480),
        };
      }
    }
  }
  return { employees, shifts, attendance };
}

export function generatePayrollEntries(
  employees: Record<string, DemoEmployee>,
  attendance: Record<string, DemoAttendance>,
  orders: Record<string, DemoOrder>,
): Record<string, DemoPayrollEntry> {
  const result: Record<string, DemoPayrollEntry> = {};
  for (const row of Object.values(attendance)) {
    const employee = employees[row.employeeId];
    const tipsMinor = Object.values(orders).filter((order) => order.employeeId === row.employeeId && order.businessDate === row.businessDate).reduce((sum, order) => sum + order.tipMinor, 0);
    const regularPayMinor = Math.round(employee.wageMinorPerHour * row.regularMinutes / 60);
    const overtimePayMinor = Math.round(employee.wageMinorPerHour * 1.5 * row.overtimeMinutes / 60);
    const payrollEntryId = stableDemoId("payroll", row.employeeId, row.businessDate);
    result[payrollEntryId] = { payrollEntryId, employeeId: row.employeeId, storeId: row.storeId, businessDate: row.businessDate, regularPayMinor, overtimePayMinor, tipsMinor, grossPayMinor: regularPayMinor + overtimePayMinor + tipsMinor };
  }
  return result;
}
