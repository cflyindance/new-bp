/**
 * RBAC 员工授权 · 授权链审计与元数据
 */
import type { ChainDataPerspective } from "../auth/merchant-scope-context";
import type { PermissionChangeLogEntry, RbacRole, StaffAssignment } from "./rbac-types";
import {
  formatStaffStoreAccessLabel,
  isStaffStoreAccessEqual,
  maxChainDataPerspectiveForAccess,
  type StaffStoreAccess,
} from "./store-access";

export interface StaffGrantAuditContext {
  grantorEmployeeId?: string;
  grantorName?: string;
  actorName?: string;
  perspective?: ChainDataPerspective;
  grantorAccess?: StaffStoreAccess;
}

function formatRoleNames(roleIds: string[], roles: RbacRole[]): string {
  if (roleIds.length === 0) return "无";
  return roleIds.map((id) => roles.find((r) => r.id === id)?.name ?? id).join("、");
}

function staffAssignmentChanged(prev: StaffAssignment, next: StaffAssignment): boolean {
  const prevRoles = [...prev.roleIds].sort().join(",");
  const nextRoles = [...next.roleIds].sort().join(",");
  if (prevRoles !== nextRoles) return true;
  return !isStaffStoreAccessEqual(prev.storeAccess, next.storeAccess);
}

function buildStaffGrantDetailText(
  prev: StaffAssignment,
  next: StaffAssignment,
  roles: RbacRole[],
): string {
  const parts: string[] = [`更新员工「${next.employeeName}」（${next.employeeId}）`];
  const prevRoles = formatRoleNames(prev.roleIds, roles);
  const nextRoles = formatRoleNames(next.roleIds, roles);
  if (prevRoles !== nextRoles) {
    parts.push(`角色：${prevRoles} → ${nextRoles}`);
  }
  const prevScope = formatStaffStoreAccessLabel(prev.storeAccess);
  const nextScope = formatStaffStoreAccessLabel(next.storeAccess);
  if (prevScope !== nextScope) {
    parts.push(`数据范围：${prevScope} → ${nextScope}`);
  }
  return parts.join("；");
}

export function applyStaffGrantMetadata(
  prev: StaffAssignment | undefined,
  next: StaffAssignment,
  ctx: StaffGrantAuditContext,
): StaffAssignment {
  if (!prev || !ctx.grantorEmployeeId || !ctx.grantorAccess) {
    return {
      ...next,
      maxPerspective: next.maxPerspective ?? maxChainDataPerspectiveForAccess(next.storeAccess),
    };
  }
  if (!staffAssignmentChanged(prev, next)) {
    return {
      ...next,
      grantedBy: prev.grantedBy,
      scopeCeiling: prev.scopeCeiling,
      maxPerspective: prev.maxPerspective ?? maxChainDataPerspectiveForAccess(next.storeAccess),
      grantedAt: prev.grantedAt,
    };
  }
  return {
    ...next,
    grantedBy: ctx.grantorEmployeeId,
    scopeCeiling: ctx.grantorAccess,
    maxPerspective: maxChainDataPerspectiveForAccess(next.storeAccess),
    grantedAt: new Date().toISOString(),
  };
}

export function buildStaffGrantAuditEntries(
  prevStaff: StaffAssignment[],
  nextStaff: StaffAssignment[],
  roles: RbacRole[],
  ctx: StaffGrantAuditContext,
): PermissionChangeLogEntry[] {
  const entries: PermissionChangeLogEntry[] = [];
  const baseTime = Date.now();

  for (const next of nextStaff) {
    const prev = prevStaff.find((p) => p.employeeId === next.employeeId);
    if (!prev || !staffAssignmentChanged(prev, next)) continue;

    entries.push({
      id: `log-${baseTime}-${next.employeeId}`,
      at: new Date().toISOString(),
      actor: ctx.actorName ?? ctx.grantorName ?? ctx.grantorEmployeeId ?? "当前用户",
      action: "员工授权",
      detail: buildStaffGrantDetailText(prev, next, roles),
      grantChain: {
        grantorEmployeeId: ctx.grantorEmployeeId ?? "",
        grantorName: ctx.grantorName,
        granteeEmployeeId: next.employeeId,
        granteeName: next.employeeName,
        perspective: ctx.perspective,
        roleIdsBefore: [...prev.roleIds],
        roleIdsAfter: [...next.roleIds],
        storeAccessBefore: { ...prev.storeAccess, ids: [...prev.storeAccess.ids] },
        storeAccessAfter: { ...next.storeAccess, ids: [...next.storeAccess.ids] },
        scopeCeiling: ctx.grantorAccess ? { ...ctx.grantorAccess, ids: [...ctx.grantorAccess.ids] } : undefined,
      },
    });
  }

  return entries;
}

export function formatGrantChainSummary(entry: PermissionChangeLogEntry): string {
  const chain = entry.grantChain;
  if (!chain) return entry.detail;

  const parts: string[] = [];
  if (chain.grantorEmployeeId) {
    parts.push(`授权人 ${chain.grantorName ?? chain.grantorEmployeeId}`);
  }
  if (chain.granteeEmployeeId) {
    parts.push(`被授权 ${chain.granteeName ?? chain.granteeEmployeeId}`);
  }
  if (chain.perspective) {
    const labels: Record<ChainDataPerspective, string> = {
      "group-hq": "集团总部视角",
      brand: "品牌视角",
      store: "门店视角",
    };
    parts.push(labels[chain.perspective] ?? chain.perspective);
  }
  if (chain.scopeCeiling) {
    parts.push(`天花板 ${formatStaffStoreAccessLabel(chain.scopeCeiling)}`);
  }
  return parts.length ? `${entry.detail}（${parts.join(" · ")}）` : entry.detail;
}
