/**
 * 通用单行输入对话框（替代 window.prompt）
 */

export type PromptDialogOptions = {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 默认 true：空串不可提交 */
  required?: boolean;
};

const DIALOG_ID = "app-prompt-dialog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openPromptDialog(opts: PromptDialogOptions): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    document.getElementById(DIALOG_ID)?.remove();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const required = opts.required !== false;
    const cancelLabel = opts.cancelLabel ?? "取消";
    const confirmLabel = opts.confirmLabel ?? "确认";

    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className =
      "fixed inset-0 z-[10050] flex items-center justify-center bg-black/45 p-6";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <form
        class="w-full max-w-[500px] rounded-2xl border border-border bg-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-prompt-title"
        data-app-prompt-panel
      >
        <h2 id="app-prompt-title" class="text-lg font-semibold tracking-tight text-card-foreground">${escapeHtml(opts.title)}</h2>
        <label class="mt-2.5 block space-y-1.5">
          <span class="text-sm font-medium text-foreground">${escapeHtml(opts.label)}</span>
          <input
            type="text"
            class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-app-prompt-input
            autocomplete="off"
            placeholder="${escapeHtml(opts.placeholder ?? "")}"
            value="${escapeHtml(opts.initialValue ?? "")}"
          />
        </label>
        <p class="mt-2 hidden text-xs text-destructive" data-app-prompt-error>请填写内容后再确认。</p>
        <div class="mt-[22px] flex flex-wrap justify-end gap-2.5">
          <button type="button" data-app-prompt="cancel" class="rounded-xl border border-border px-5 py-2.5 text-sm text-card-foreground hover:bg-muted/50">${escapeHtml(cancelLabel)}</button>
          <button type="submit" data-app-prompt="ok" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>`;

    const form = overlay.querySelector<HTMLFormElement>("[data-app-prompt-panel]");
    const input = overlay.querySelector<HTMLInputElement>("[data-app-prompt-input]");
    const errorEl = overlay.querySelector<HTMLElement>("[data-app-prompt-error]");

    const close = (value: string | null) => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
      resolve(value);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(null);
      }
    };

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = (input?.value ?? "").trim();
      if (required && !value) {
        errorEl?.classList.remove("hidden");
        input?.focus();
        return;
      }
      close(value);
    });

    overlay.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-app-prompt="cancel"]') || target === overlay) {
        close(null);
      }
    });

    document.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    input?.focus({ preventScroll: true });
    input?.select();
  });
}
