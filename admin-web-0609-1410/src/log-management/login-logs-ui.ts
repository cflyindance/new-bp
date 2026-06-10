import { getAuthenticatedEmail } from "../auth/login";
import {
  formatLoginLogTime,
  isLogAdminViewer,
  listSystemLoginLogs,
  type SystemLoginLogEntry,
} from "../auth/login-log-store";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const LOGIN_LOGS_PATH = "/log-management/login-logs";

export function isLoginLogsPath(path: string): boolean {
  return path === LOGIN_LOGS_PATH || path.startsWith(`${LOGIN_LOGS_PATH}/`);
}

function renderLogRow(entry: SystemLoginLogEntry): string {
  return `
    <tr class="border-b border-border last:border-0 hover:bg-muted/30">
      <td class="whitespace-nowrap px-4 py-3 text-sm text-card-foreground">${escapeHtml(formatLoginLogTime(entry.loginAt))}</td>
      <td class="max-w-[14rem] truncate px-4 py-3 text-sm font-medium text-card-foreground" title="${escapeHtml(entry.account)}">${escapeHtml(entry.account)}</td>
      <td class="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">${escapeHtml(entry.roleName)}</td>
      <td class="whitespace-nowrap px-4 py-3 font-mono text-sm text-card-foreground">${escapeHtml(entry.ipAddress)}</td>
    </tr>`;
}

export function renderLoginLogsPage(): string {
  const viewerEmail = getAuthenticatedEmail();
  const isAdmin = isLogAdminViewer(viewerEmail);
  const logs = listSystemLoginLogs(viewerEmail);

  const scopeHint = isAdmin
    ? "系统管理员可查看全部角色的登录记录（账号、时间、IP 等）。"
    : "当前仅展示您本人账号的登录记录；如需查看全店日志请联系系统管理员。";

  const emptyRow = `
    <tr>
      <td colspan="4" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无登录日志，成功登录后将自动记录。</td>
    </tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4">
      <div class="shrink-0 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 class="text-base font-semibold text-card-foreground">系统登录日志</h2>
        <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">${escapeHtml(scopeHint)}</p>
        ${isAdmin ? `<p class="mt-2 text-xs text-muted-foreground">共 ${logs.length} 条记录（最多保留 500 条）</p>` : ""}
      </div>
      <div class="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div class="module-settings-scroll-host max-h-full overflow-auto">
          <table class="w-full min-w-[40rem] border-collapse text-left">
            <thead class="sticky top-0 z-[1] border-b border-border bg-muted/80 backdrop-blur">
              <tr>
                <th scope="col" class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">登录时间</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">登录账号</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">角色</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">IP 地址</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length > 0 ? logs.map(renderLogRow).join("") : emptyRow}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

export function bindLoginLogsPage(onRefresh: () => void): void {
  const handler = (): void => onRefresh();
  window.removeEventListener("menusifu:login-logs-updated", handler);
  window.addEventListener("menusifu:login-logs-updated", handler);
}
