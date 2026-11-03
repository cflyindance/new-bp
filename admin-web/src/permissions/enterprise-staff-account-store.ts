import {permissionDemoExtraAccounts} from './permission-demo-identities';
/**
 * M 平台 · 企业级员工登录账号
 */
import { createStaffAccountStore, type StaffLoginAccount } from "./staff-account-store-factory";

export type { StaffLoginAccount };

const enterpriseStaffAccounts = createStaffAccountStore({
  storageKey: "menusifu:enterprise-staff-login-accounts:v1",
  strictPersistence: true,
  refreshOnRead: true,
  seedAccounts: () => {
    const now = new Date().toISOString();
    let existing:{id?:string;employeeId?:string;loginEmail?:string}[]=[];
    try{const raw=JSON.parse(localStorage.getItem('menusifu:enterprise-staff-login-accounts:v1')??'[]');if(Array.isArray(raw))existing=raw;}catch{/* Preserve the existing account-store fallback behavior. */}
    return [
      {
        id: "acct-ent001",
        employeeId: "ent001",
        employeeName: "刘企业",
        loginEmail: "enterprise.liu@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "enterprise",
        updatedAt: now,
      },
      {
        id: "acct-ent002",
        employeeId: "ent002",
        employeeName: "周预设",
        loginEmail: "preset.zhou@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "enterprise",
        updatedAt: now,
      },
      {
        id: "acct-ent003",
        employeeId: "ent003",
        employeeName: "吴蓝图",
        loginEmail: "blueprint.wu@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "enterprise",
        updatedAt: now,
      },
      {
        id: "acct-ent004",
        employeeId: "ent004",
        employeeName: "郑审计",
        loginEmail: "audit.zheng@menusifu.cn",
        password: "Menusifu666",
        enabled: true,
        isSystem: true,
        orgTier: "enterprise",
        updatedAt: now,
      },
      ...permissionDemoExtraAccounts(existing).map(account=>({...account,id:'acct-'+account.employeeId,password:'Menusifu666',isSystem:true,orgTier:'enterprise' as const,updatedAt:now})),
    ];
  },
});

export const listStaffLoginAccounts = enterpriseStaffAccounts.listStaffLoginAccounts;
export const getStaffLoginAccountById = enterpriseStaffAccounts.getStaffLoginAccountById;
export const getStaffLoginAccountByEmail = enterpriseStaffAccounts.getStaffLoginAccountByEmail;
export const validateStaffAccountInput = enterpriseStaffAccounts.validateStaffAccountInput;
export const upsertStaffLoginAccount = enterpriseStaffAccounts.upsertStaffLoginAccount;
export const createStaffLoginAccount = enterpriseStaffAccounts.createStaffLoginAccount;
export const updateStaffLoginAccount = enterpriseStaffAccounts.updateStaffLoginAccount;
export const deleteStaffLoginAccount = enterpriseStaffAccounts.deleteStaffLoginAccount;
