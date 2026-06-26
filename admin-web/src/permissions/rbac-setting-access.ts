/**
 * RBAC · 设置页 L4：勾选=展示，可编辑=可改值，否则只读
 */
import { buildPermissionResourceIndex } from "../config/permission-registry";
import { getAuthenticatedEmail } from "../auth/login";
import { getStaffLoginAccountByEmail } from "./staff-account-store";
import {
  getRbacSnapshot,
  resolveRoleL4SettingAccess,
  type ResolvedL4SettingAccess,
} from "./rbac-store";

const resourceIndex = buildPermissionResourceIndex();
const settingKeyByPathSeq = new Map<string, string>();

for (const r of resourceIndex.byKey.values()) {
  if (r.level === 4 && r.seq != null && r.path) {
    settingKeyByPathSeq.set(`${r.path}#${r.seq}`, r.key);
  }
}

export function permissionKeyForSetting(settingsPath: string, seq: number): string | undefined {
  return settingKeyByPathSeq.get(`${settingsPath}#${seq}`);
}

function mergeStaffL4SettingAccess(roleIds: string[], permissionKey: string): ResolvedL4SettingAccess {
  const { roles } = getRbacSnapshot();
  let hasDisplayOnly = false;
  for (const roleId of roleIds) {
    const role = roles.find((r) => r.id === roleId);
    if (!role) continue;
    const access = resolveRoleL4SettingAccess(role, permissionKey);
    if (access === "editable") return "editable";
    if (access === "display-only") hasDisplayOnly = true;
  }
  return hasDisplayOnly ? "display-only" : "denied";
}

export function resolveCurrentUserL4SettingAccess(permissionKey: string): ResolvedL4SettingAccess {
  const email = getAuthenticatedEmail();
  if (!email) return "editable";

  const account = getStaffLoginAccountByEmail(email);
  if (!account) return "editable";

  const { staff } = getRbacSnapshot();
  const assignment = staff.find((s) => s.employeeId === account.employeeId);
  if (!assignment?.roleIds.length) return "editable";

  return mergeStaffL4SettingAccess(assignment.roleIds, permissionKey);
}

function setSettingRowReadOnly(row: Element): void {
  row.querySelectorAll<HTMLElement>(
    "button[data-module-setting-toggle], input, select, textarea, [contenteditable='true']",
  ).forEach((el) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.disabled = true;
      el.readOnly = true;
    } else if (el instanceof HTMLSelectElement) {
      el.disabled = true;
    } else if (el instanceof HTMLButtonElement) {
      el.disabled = true;
      el.classList.add("opacity-50", "pointer-events-none", "cursor-not-allowed");
    } else {
      el.classList.add("pointer-events-none", "opacity-60");
    }
  });
}

function hideSettingRow(row: Element): void {
  (row as HTMLElement).classList.add("hidden");
  (row as HTMLElement).setAttribute("aria-hidden", "true");
}

function findSettingRowForSeq(root: ParentNode, seq: number): Element | null {
  const byRowAttr = root.querySelector(`[data-module-setting-row-seq="${seq}"]`);
  if (byRowAttr) return byRowAttr;

  const toggle = root.querySelector(`[data-module-setting-toggle="${seq}"]`);
  if (toggle) return toggle.closest("li") ?? toggle.closest("[data-module-setting-row-seq]");

  return null;
}

/** 按当前用户 RBAC 限制设置页 L4 行的开关与表单控件 */
export function applyModuleSettingsRbacAccess(settingsPath: string, root: ParentNode = document): void {
  const catalogSeqs = new Set<number>();
  root.querySelectorAll<HTMLElement>("[data-module-setting-toggle]").forEach((el) => {
    const seq = Number(el.getAttribute("data-module-setting-toggle"));
    if (Number.isFinite(seq)) catalogSeqs.add(seq);
  });
  root.querySelectorAll<HTMLElement>("[data-module-setting-row-seq]").forEach((el) => {
    const seq = Number(el.getAttribute("data-module-setting-row-seq"));
    if (Number.isFinite(seq)) catalogSeqs.add(seq);
  });

  for (const seq of catalogSeqs) {
    const permissionKey = permissionKeyForSetting(settingsPath, seq);
    if (!permissionKey) continue;

    const access = resolveCurrentUserL4SettingAccess(permissionKey);
    const row = findSettingRowForSeq(root, seq);
    if (!row) continue;

    row.removeAttribute("data-rbac-l4-access");
    row.classList.remove("hidden");
    row.removeAttribute("aria-hidden");

    if (access === "denied") {
      row.setAttribute("data-rbac-l4-access", "denied");
      hideSettingRow(row);
      continue;
    }

    row.setAttribute("data-rbac-l4-access", access);
    if (access === "display-only") {
      setSettingRowReadOnly(row);
    }
  }
}
