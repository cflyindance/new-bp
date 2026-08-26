/**
 * 通用二次确认对话框（替代 window.confirm）
 * 视觉对齐「菜单下单限制」确认框规格。
 */

export type ConfirmDialogOptions = {
  title: string;
  message: string;
  /** 必须写清具体动作，禁止只写「确定」 */
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  requireText?: string;
};

const DIALOG_ID = "app-confirm-dialog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openConfirmDialog(opts: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }

    document.getElementById(DIALOG_ID)?.remove();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const cancelLabel = opts.cancelLabel ?? "取消";
    const confirmClass = opts.danger
      ? "rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/15"
      : "rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90";

    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className =
      "fixed inset-0 z-[10050] flex items-center justify-center bg-black/45 p-6";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div
        class="w-full max-w-[500px] rounded-2xl border border-border bg-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-confirm-title"
        aria-describedby="app-confirm-message"
        data-app-confirm-panel
      >
        <h2 id="app-confirm-title" class="text-lg font-semibold tracking-tight text-card-foreground">${escapeHtml(opts.title)}</h2>
        <p id="app-confirm-message" class="mt-2.5 text-sm leading-[22px] text-muted-foreground whitespace-pre-wrap">${escapeHtml(opts.message)}</p>
        ${opts.requireText ? `<input data-app-confirm-text class="mt-4 h-10 w-full rounded-xl border border-border px-3 text-sm outline-none" placeholder="${escapeHtml(opts.requireText)}" autocomplete="off">` : ""}
        <div class="mt-[22px] flex flex-wrap justify-end gap-2.5">
          <button type="button" data-app-confirm="cancel" class="rounded-xl border border-border px-5 py-2.5 text-sm text-card-foreground hover:bg-muted/50">${escapeHtml(cancelLabel)}</button>
          <button type="button" data-app-confirm="ok" class="${confirmClass}">${escapeHtml(opts.confirmLabel)}</button>
        </div>
      </div>`;

    const close = (ok: boolean) => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
      resolve(ok);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
      }
    };

    overlay.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const action = target.closest<HTMLElement>("[data-app-confirm]")?.dataset.appConfirm;
      if (action === "ok") {
        if (opts.requireText && overlay.querySelector<HTMLInputElement>("[data-app-confirm-text]")?.value !== opts.requireText) return;
        close(true);
        return;
      }
      if (action === "cancel" || target === overlay) close(false);
    });

    document.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-app-confirm="cancel"]')?.focus({ preventScroll: true });
  });
}
