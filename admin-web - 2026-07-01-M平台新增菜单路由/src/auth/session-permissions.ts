/**
 * 登录会话功能权限快照：登录 / 角色变更时固定，切门店不重算。
 */
import { getAuthenticatedEmail } from "./login";
import type { AccountOrgTier } from "./session-scope";
import type { PlatformPresetNodeSelection } from "../config/platform-preset-store";
import {
  getRbacSnapshot,
  mergeRoleSelections,
  normalizeStaffAssignment,
  type StaffStoreAccess,
} from "../permissions/rbac-store";
import { inferDefaultStaffStoreAccess } from "../permissions/store-access";
import { getStaffLoginAccountByEmail } from "../permissions/staff-account-store";

const SESSION_CTX_KEY = "menusifu:session-context:v1";

export interface UserSessionContext {
  employeeId: string;
  employeeName: string;
  email: string;
  orgTier: AccountOrgTier;
  roleIds: string[];
  storeAccess: StaffStoreAccess;
  /** 登录时固定的功能权限并集快照 */
  permissionSnapshot: Record<string, PlatformPresetNodeSelection>;
  builtAt: string;
}

function resolveOrgTierForEmployee(employeeId: string): AccountOrgTier {
  const account = getStaffLoginAccountByEmail(getAuthenticatedEmail() ?? "");
  if (account?.orgTier === "chain" || account?.orgTier === "store") {
    return account.orgTier;
  }
  const { staff } = getRbacSnapshot();
  const assignment = staff.find((s) => s.employeeId === employeeId);
  if (assignment?.roleIds.includes("hq-admin")) return "chain";
  return "store";
}

export function buildUserSessionContext(email: string): UserSessionContext | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const account = getStaffLoginAccountByEmail(normalized);
  const { staff } = getRbacSnapshot();

  let employeeId = account?.employeeId;
  let employeeName = account?.employeeName ?? "";

  if (!employeeId) {
    return null;
  }

  const assignment = normalizeStaffAssignment(
    staff.find((s) => s.employeeId === employeeId) ?? {
      employeeId,
      employeeName: employeeName || employeeId,
      roleIds: [],
      storeAccess: inferDefaultStaffStoreAccess(employeeId),
    },
  );

  employeeName = assignment.employeeName;

  return {
    employeeId: assignment.employeeId,
    employeeName,
    email: normalized,
    orgTier: resolveOrgTierForEmployee(assignment.employeeId),
    roleIds: [...assignment.roleIds],
    storeAccess: assignment.storeAccess,
    permissionSnapshot: mergeRoleSelections(assignment.roleIds),
    builtAt: new Date().toISOString(),
  };
}

export function getUserSessionContext(): UserSessionContext | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CTX_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSessionContext;
  } catch {
    return null;
  }
}

function writeUserSessionContext(ctx: UserSessionContext): void {
  try {
    sessionStorage.setItem(SESSION_CTX_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}

/** 登录或 RBAC 变更后刷新会话权限快照 */
export function refreshUserSessionContext(): UserSessionContext | null {
  const email = getAuthenticatedEmail();
  if (!email) {
    clearUserSessionContext();
    return null;
  }
  const ctx = buildUserSessionContext(email);
  if (ctx) writeUserSessionContext(ctx);
  return ctx;
}

export function clearUserSessionContext(): void {
  try {
    sessionStorage.removeItem(SESSION_CTX_KEY);
  } catch {
    /* ignore */
  }
}

/** 员工授权保存后，若命中当前登录用户则刷新快照 */
export function refreshSessionIfCurrentEmployee(employeeId: string): void {
  const ctx = getUserSessionContext();
  if (ctx?.employeeId === employeeId) {
    refreshUserSessionContext();
  }
}
