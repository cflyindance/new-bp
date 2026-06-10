/** 系统登录日志（演示：localStorage；对接后端后可替换为 API） */

const STORAGE_KEY = "menusifu-system-login-logs:v1";
const MAX_ENTRIES = 500;

export type SystemLoginLogEntry = {
  id: string;
  account: string;
  roleName: string;
  loginAt: string;
  ipAddress: string;
  userAgent: string;
};

function readAll(): SystemLoginLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is SystemLoginLogEntry =>
        row != null &&
        typeof row === "object" &&
        typeof (row as SystemLoginLogEntry).id === "string" &&
        typeof (row as SystemLoginLogEntry).account === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(entries: SystemLoginLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* ignore */
  }
}

export function inferRoleNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local === "admin" || local.startsWith("admin.")) return "系统管理员";
  if (local.includes("manager") || local.includes("店长")) return "店长";
  if (local.includes("cashier") || local.includes("pos")) return "收银员";
  if (local.includes("kitchen") || local.includes("厨")) return "后厨";
  return "门店员工";
}

/** 具备查看全量登录日志权限（演示：admin 前缀企业邮箱） */
export function isLogAdminViewer(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return local === "admin" || local.startsWith("admin.");
}

async function resolveClientIpAddress(): Promise<string> {
  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("https://api.ipify.org?format=json", { signal: ctrl.signal });
    window.clearTimeout(timer);
    if (!res.ok) return "—";
    const data = (await res.json()) as { ip?: string };
    return typeof data.ip === "string" && data.ip.trim() ? data.ip.trim() : "—";
  } catch {
    return "—";
  }
}

export function recordSystemLoginLog(account: string): void {
  const normalizedAccount = account.trim().toLowerCase();
  if (!normalizedAccount) return;

  const id = `login-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: SystemLoginLogEntry = {
    id,
    account: normalizedAccount,
    roleName: inferRoleNameFromEmail(normalizedAccount),
    loginAt: new Date().toISOString(),
    ipAddress: "获取中…",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  const entries = [entry, ...readAll()];
  writeAll(entries);

  void resolveClientIpAddress().then((ip) => {
    const all = readAll();
    const idx = all.findIndex((e) => e.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], ipAddress: ip };
    writeAll(all);
    window.dispatchEvent(new CustomEvent("menusifu:login-logs-updated"));
  });
}

export function listSystemLoginLogs(viewerEmail: string | null): SystemLoginLogEntry[] {
  const all = readAll().sort((a, b) => b.loginAt.localeCompare(a.loginAt));
  if (isLogAdminViewer(viewerEmail)) return all;
  const viewer = viewerEmail?.trim().toLowerCase();
  if (!viewer) return [];
  return all.filter((e) => e.account === viewer);
}

export function formatLoginLogTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
