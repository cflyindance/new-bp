/**
 * 员工 B 端登录账号（演示：localStorage；生产应对接后端并仅存密码哈希）
 */
import { isMenusifuEmail } from "../auth/email-utils";

export interface StaffLoginAccount {
  id: string;
  employeeId: string;
  employeeName: string;
  /** 登录邮箱，须 *@menusifu.cn / *@menusifu.com */
  loginEmail: string;
  /** 演示环境明文；生产须改为哈希校验 */
  password: string;
  enabled: boolean;
  isSystem?: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "menusifu:staff-login-accounts:v1";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function seedAccounts(): StaffLoginAccount[] {
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
      updatedAt: now,
    },
  ];
}

let accounts: StaffLoginAccount[] = [];

function saveAccounts(next: StaffLoginAccount[]): void {
  accounts = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    /* ignore */
  }
}

function loadAccounts(): StaffLoginAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StaffLoginAccount[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded = seedAccounts();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

accounts = loadAccounts();

export function listStaffLoginAccounts(): StaffLoginAccount[] {
  return accounts.slice().sort((a, b) => a.employeeName.localeCompare(b.employeeName, "zh-CN"));
}

export function getStaffLoginAccountById(id: string): StaffLoginAccount | undefined {
  return accounts.find((a) => a.id === id);
}

export function getStaffLoginAccountByEmail(email: string): StaffLoginAccount | undefined {
  const normalized = normalizeEmail(email);
  return accounts.find((a) => normalizeEmail(a.loginEmail) === normalized);
}

export function validateStaffAccountInput(input: {
  employeeId: string;
  employeeName: string;
  loginEmail: string;
  password: string;
  confirmPassword?: string;
  requirePassword: boolean;
  excludeId?: string;
}): string | null {
  const employeeId = input.employeeId.trim();
  const employeeName = input.employeeName.trim();
  const loginEmail = input.loginEmail.trim();

  if (!employeeId) return "请填写员工工号";
  if (!employeeName) return "请填写员工姓名";
  if (!loginEmail) return "请填写登录邮箱";
  if (!isMenusifuEmail(loginEmail)) return "登录邮箱须为 *@menusifu.cn 或 *@menusifu.com";

  const dupEmail = accounts.find(
    (a) => normalizeEmail(a.loginEmail) === normalizeEmail(loginEmail) && a.id !== input.excludeId,
  );
  if (dupEmail) return "该登录邮箱已被使用";

  const dupEmployee = accounts.find(
    (a) => a.employeeId === employeeId && a.id !== input.excludeId,
  );
  if (dupEmployee) return "该员工工号已绑定登录账号";

  if (input.requirePassword) {
    if (!input.password) return "请填写密码";
    if (input.password.length < 6) return "密码至少 6 位";
    if (input.confirmPassword !== undefined && input.password !== input.confirmPassword) {
      return "两次输入的密码不一致";
    }
  }

  return null;
}

export function upsertStaffLoginAccount(
  account: Omit<StaffLoginAccount, "updatedAt"> & { updatedAt?: string },
): StaffLoginAccount {
  const idx = accounts.findIndex((a) => a.id === account.id);
  const row: StaffLoginAccount = {
    ...account,
    loginEmail: normalizeEmail(account.loginEmail),
    updatedAt: account.updatedAt ?? new Date().toISOString(),
  };
  const next = [...accounts];
  if (idx >= 0) next[idx] = row;
  else next.push(row);
  saveAccounts(next);
  return row;
}

export function createStaffLoginAccount(input: {
  employeeId: string;
  employeeName: string;
  loginEmail: string;
  password: string;
  enabled: boolean;
}): StaffLoginAccount {
  const err = validateStaffAccountInput({ ...input, requirePassword: true });
  if (err) throw new Error(err);

  const id = `acct-${input.employeeId}-${Date.now()}`;
  return upsertStaffLoginAccount({
    id,
    employeeId: input.employeeId.trim(),
    employeeName: input.employeeName.trim(),
    loginEmail: input.loginEmail,
    password: input.password,
    enabled: input.enabled,
    isSystem: false,
  });
}

export function updateStaffLoginAccount(
  id: string,
  patch: Partial<Pick<StaffLoginAccount, "employeeName" | "loginEmail" | "password" | "enabled">>,
): StaffLoginAccount | null {
  const existing = getStaffLoginAccountById(id);
  if (!existing) return null;

  const merged = {
    employeeId: existing.employeeId,
    employeeName: patch.employeeName ?? existing.employeeName,
    loginEmail: patch.loginEmail ?? existing.loginEmail,
    password: patch.password ?? existing.password,
    enabled: patch.enabled ?? existing.enabled,
  };

  const err = validateStaffAccountInput({
    ...merged,
    requirePassword: false,
    excludeId: id,
  });
  if (err) throw new Error(err);

  return upsertStaffLoginAccount({ ...existing, ...merged });
}

export function deleteStaffLoginAccount(id: string): boolean {
  const row = getStaffLoginAccountById(id);
  if (!row || row.isSystem) return false;
  saveAccounts(accounts.filter((a) => a.id !== id));
  return true;
}
