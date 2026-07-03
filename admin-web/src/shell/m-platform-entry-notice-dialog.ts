/**
 * 进入 M 平台时的 MVP 说明弹框
 */
import { t } from "../i18n";

const DIALOG_ID = "m-platform-entry-notice-dialog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDialog(): string {
  return `
    <div
      id="${DIALOG_ID}"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${DIALOG_ID}-title"
      tabindex="-1"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true"></div>
      <div class="relative z-[1] w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
        <div class="border-b border-border px-6 py-4">
          <h2 id="${DIALOG_ID}-title" class="text-lg font-semibold text-card-foreground">${escapeHtml(t("shell.mPlatformEntryNoticeTitle"))}</h2>
        </div>
        <div class="px-6 py-4">
          <p class="text-sm leading-relaxed text-muted-foreground">${escapeHtml(t("shell.mPlatformEntryNoticeMessage"))}</p>
        </div>
        <div class="flex justify-end border-t border-border px-6 py-4">
          <button
            type="button"
            data-m-platform-entry-notice-confirm
            class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >${escapeHtml(t("shell.mPlatformEntryNoticeConfirm"))}</button>
        </div>
      </div>
    </div>`;
}

function closeDialog(): void {
  document.getElementById(DIALOG_ID)?.remove();
}

let dialogBound = false;

function bindDialog(): void {
  if (dialogBound) return;
  dialogBound = true;

  document.body.addEventListener("click", (ev) => {
    if ((ev.target as HTMLElement).closest("[data-m-platform-entry-notice-confirm]")) {
      closeDialog();
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && document.getElementById(DIALOG_ID)) {
      closeDialog();
    }
  });
}

export function showMPlatformEntryNoticeDialog(): void {
  bindDialog();
  closeDialog();
  const host = document.createElement("div");
  host.innerHTML = renderDialog();
  const dialog = host.firstElementChild;
  if (!dialog) return;
  document.body.appendChild(dialog);
  const confirmBtn = dialog.querySelector<HTMLButtonElement>("[data-m-platform-entry-notice-confirm]");
  confirmBtn?.focus({ preventScroll: true });
}
