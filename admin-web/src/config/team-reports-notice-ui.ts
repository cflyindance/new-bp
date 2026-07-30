/** 团队管理 ·「员工报表」：与云报表重复，点击入口时提示数据来源 */
const TEAM_REPORTS_NOTICE_STORAGE_KEY = "team-reports-cloud-notice";

let noticeDialogOpen = false;

/** 路由跳转前调用：本次进入「员工报表」需弹出说明 */
export function requestTeamReportsCloudNotice(): void {
  try {
    sessionStorage.setItem(TEAM_REPORTS_NOTICE_STORAGE_KEY, "1");
  } catch {
    noticeDialogOpen = true;
  }
}

function consumeNoticeRequestFromStorage(): void {
  try {
    if (sessionStorage.getItem(TEAM_REPORTS_NOTICE_STORAGE_KEY) === "1") {
      noticeDialogOpen = true;
      sessionStorage.removeItem(TEAM_REPORTS_NOTICE_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function renderTeamReportsCloudNoticeDialog(): string {
  consumeNoticeRequestFromStorage();
  if (!noticeDialogOpen) return "";
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-team-reports-notice-dialog role="dialog" aria-modal="true" aria-labelledby="team-reports-notice-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-team-reports-notice-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 id="team-reports-notice-title" class="text-base font-semibold">员工报表</h2>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">同云报表-员工概览中数据结构嵌入</p>
        <div class="mt-5 flex justify-end">
          <button type="button" data-team-reports-notice-close class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">知道了</button>
        </div>
      </div>
    </div>`;
}

export function bindTeamReportsCloudNoticeUi(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-team-reports-notice-dialog]");
  if (!dialog || dialog.dataset.teamReportsNoticeBound === "1") return;
  dialog.dataset.teamReportsNoticeBound = "1";

  const close = () => {
    noticeDialogOpen = false;
    remount();
  };
  dialog.querySelector("[data-team-reports-notice-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-team-reports-notice-close]")?.addEventListener("click", close);
}
