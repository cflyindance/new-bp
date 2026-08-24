/**
 * 授权目标目录前的路径选择对话框（eMenu / Kiosk）。
 */
import { t } from "../../i18n";
import { SYNC_TARGETS, getSyncTarget, type SyncTargetId } from "./local-image-folder-sync";

const DIALOG_ID = "emenu-local-image-sync-target-dialog";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDialog(selected: SyncTargetId): string {
  const options = SYNC_TARGETS.map(
    (target) =>
      `<option value="${target.id}" ${target.id === selected ? "selected" : ""}>${escapeHtml(
        t(`emenuLocalImageSync.target.${target.id}` as const),
      )}</option>`,
  ).join("");

  return `
    <div
      id="${DIALOG_ID}"
      class="fixed inset-0 z-[130] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${DIALOG_ID}-title"
      tabindex="-1"
    >
      <div class="absolute inset-0 bg-black/45" data-target-dialog-overlay aria-hidden="true"></div>
      <div class="relative z-[1] w-full max-w-[500px] overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-fade-in">
        <h2 id="${DIALOG_ID}-title" class="text-lg font-semibold text-card-foreground">
          ${escapeHtml(t("emenuLocalImageSync.targetDialogTitle"))}
        </h2>
        <p class="mt-2.5 text-sm leading-[22px] text-muted-foreground">
          ${escapeHtml(t("emenuLocalImageSync.targetDialogHint"))}
        </p>
        <label class="mt-4 block text-sm font-medium text-foreground" for="${DIALOG_ID}-select">
          ${escapeHtml(t("emenuLocalImageSync.targetDialogLabel"))}
        </label>
        <select
          id="${DIALOG_ID}-select"
          data-target-dialog-select
          class="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >${options}</select>
        <p data-target-dialog-path class="mt-2 break-all font-mono text-xs text-muted-foreground"></p>
        <div class="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            data-target-dialog-cancel
            class="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >${escapeHtml(t("emenuLocalImageSync.targetDialogCancel"))}</button>
          <button
            type="button"
            data-target-dialog-confirm
            class="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >${escapeHtml(t("emenuLocalImageSync.targetDialogConfirm"))}</button>
        </div>
      </div>
    </div>`;
}

/**
 * @returns 选中的目标；取消返回 null。
 */
export function openSyncTargetDialog(
  defaultTarget: SyncTargetId = "emenu",
): Promise<SyncTargetId | null> {
  document.getElementById(DIALOG_ID)?.remove();

  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.innerHTML = renderDialog(defaultTarget);
    const dialog = host.firstElementChild as HTMLElement | null;
    if (!dialog) {
      resolve(null);
      return;
    }

    const trigger = document.activeElement as HTMLElement | null;
    document.body.appendChild(dialog);

    const select = dialog.querySelector<HTMLSelectElement>("[data-target-dialog-select]");
    const pathText = dialog.querySelector<HTMLElement>("[data-target-dialog-path]");

    const syncPath = () => {
      const id = (select?.value as SyncTargetId) || defaultTarget;
      if (pathText) pathText.textContent = getSyncTarget(id).path;
    };
    syncPath();

    let settled = false;
    const close = (result: SyncTargetId | null) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKeydown, true);
      dialog.remove();
      trigger?.focus?.({ preventScroll: true });
      resolve(result);
    };

    function onKeydown(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        close(null);
      }
    }

    select?.addEventListener("change", syncPath);
    dialog.querySelector("[data-target-dialog-overlay]")?.addEventListener("click", () => close(null));
    dialog.querySelector("[data-target-dialog-cancel]")?.addEventListener("click", () => close(null));
    dialog.querySelector("[data-target-dialog-confirm]")?.addEventListener("click", () => {
      close((select?.value as SyncTargetId) || defaultTarget);
    });
    document.addEventListener("keydown", onKeydown, true);

    select?.focus({ preventScroll: true });
  });
}
