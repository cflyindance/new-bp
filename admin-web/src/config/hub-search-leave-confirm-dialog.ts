export type HubSearchLeaveChoice = "save" | "discard" | "cancel";

const DIALOG_ID = "hub-search-leave-confirm-dialog";

/** 搜索会话存在未保存设置时的三选项离开确认。 */
export function openHubSearchLeaveConfirmDialog(changeCount: number): Promise<HubSearchLeaveChoice> {
  return new Promise((resolve) => {
    document.getElementById(DIALOG_ID)?.remove();
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className = "fixed inset-0 z-[10050] flex items-center justify-center bg-black/45 p-4";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div
        class="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-search-leave-title"
        aria-describedby="hub-search-leave-desc"
        tabindex="-1"
        data-hub-search-leave-panel
      >
        <h2 id="hub-search-leave-title" class="text-lg font-semibold tracking-tight text-card-foreground">保存搜索结果中的修改？</h2>
        <p id="hub-search-leave-desc" class="mt-2 text-sm leading-relaxed text-muted-foreground">当前搜索会话有 ${changeCount} 项未保存修改。继续操作前，请选择如何处理。</p>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" data-hub-search-leave="cancel" class="rounded-lg border border-border px-3 py-2 text-sm text-card-foreground hover:bg-muted/50">取消</button>
          <button type="button" data-hub-search-leave="discard" class="rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">放弃修改</button>
          <button type="button" data-hub-search-leave="save" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存并继续</button>
        </div>
      </div>`;

    const panel = overlay.querySelector<HTMLElement>("[data-hub-search-leave-panel]");
    const close = (choice: HubSearchLeaveChoice) => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
      resolve(choice);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close("cancel");
    };

    overlay.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest<HTMLElement>("[data-hub-search-leave]");
      if (button) {
        const choice = button.dataset.hubSearchLeave as HubSearchLeaveChoice | undefined;
        if (choice) close(choice);
        return;
      }
      if (target === overlay) close("cancel");
    });

    document.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    panel?.focus({ preventScroll: true });
  });
}
