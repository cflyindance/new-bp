/**
 * 商家后台 · 员工登录账号
 */
import { createStaffAccountStore, type StaffLoginAccount } from "./staff-account-store-factory";

export type { StaffLoginAccount };

const merchantStaffAccounts = createStaffAccountStore({
  storageKey: "menusifu:staff-login-accounts:v1",
  seedAccounts: () => {
    const now = new Date().toISOString();
    return [
      {
        id: "acct-e001",
        employeeId: "e001",
        employeeName: "王小明",
        loginEmail: "xiaoming.wang@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "store",
        updatedAt: now,
      },
      {
        id: "acct-e002",
        employeeId: "e002",
        employeeName: "李收银",
        loginEmail: "cashier.li@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "store",
        updatedAt: now,
      },
      {
        id: "acct-e003",
        employeeId: "e003",
        employeeName: "张楼面",
        loginEmail: "floor.zhang@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "store",
        updatedAt: now,
      },
      {
        id: "acct-hq001",
        employeeId: "hq001",
        employeeName: "陈总部",
        loginEmail: "hq.admin@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "chain",
        updatedAt: now,
      },
    ];
  },
});

export const listStaffLoginAccounts = merchantStaffAccounts.listStaffLoginAccounts;
export const getStaffLoginAccountById = merchantStaffAccounts.getStaffLoginAccountById;
export const getStaffLoginAccountByEmail = merchantStaffAccounts.getStaffLoginAccountByEmail;
export const validateStaffAccountInput = merchantStaffAccounts.validateStaffAccountInput;
export const upsertStaffLoginAccount = merchantStaffAccounts.upsertStaffLoginAccount;
export const createStaffLoginAccount = merchantStaffAccounts.createStaffLoginAccount;
export const updateStaffLoginAccount = merchantStaffAccounts.updateStaffLoginAccount;
export const deleteStaffLoginAccount = merchantStaffAccounts.deleteStaffLoginAccount;
