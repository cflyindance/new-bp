import assert from "node:assert/strict";
import {
  createPayrollState,
  resolvePayrollSelection,
} from "../src/team/payroll/payroll-state";
import type { PayrollSnapshot } from "../src/team/payroll/payroll-types";

const employee = {
  id: "e1",
  name: "Bowen one",
  store: "Golden Dragon",
  segments: [],
  adjustments: {},
};

const staleSnapshot: PayrollSnapshot = {
  view: "periods",
  periodId: null,
  employeeId: null,
  employeeStoreFilter: "Missing Store",
  data: {
    periods: [
      {
        id: "p1",
        year: 2026,
        periodNumber: 1,
        startDate: "01/01/2026",
        endDate: "01/14/2026",
      },
    ],
    employees: { p1: [employee] },
    auditLog: [],
  },
};

const allStoresScope = {
  storeId: "",
  storeLabel: "",
  isAllStores: true,
};

const repaired = resolvePayrollSelection(staleSnapshot, allStoresScope);
assert.equal(repaired.periodId, "p1");
assert.equal(repaired.employeeId, "e1");
assert.equal(repaired.storeFilter, "Golden Dragon");
assert.equal(repaired.repaired, true);

const validSnapshot: PayrollSnapshot = {
  ...staleSnapshot,
  view: "workspace",
  periodId: "p1",
  employeeId: "e1",
  employeeStoreFilter: "Golden Dragon",
};
assert.equal(resolvePayrollSelection(validSnapshot, allStoresScope).repaired, false);

const emptySnapshot: PayrollSnapshot = {
  ...staleSnapshot,
  data: { ...staleSnapshot.data, employees: { p1: [] } },
};
assert.equal(resolvePayrollSelection(emptySnapshot, allStoresScope).employeeId, null);

const state = createPayrollState(staleSnapshot);
let notifications = 0;
const unsubscribe = state.subscribe(() => {
  notifications += 1;
});
state.replaceSnapshot(validSnapshot);
assert.equal(notifications, 1);
unsubscribe();
state.replaceSnapshot(staleSnapshot);
assert.equal(notifications, 1);
state.destroy();
state.replaceSnapshot(validSnapshot);
assert.equal(notifications, 1);

console.log("Team Payroll state verification passed.");
