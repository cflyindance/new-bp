import { t, tf } from "../../i18n";
import { openSyncTargetDialog } from "./local-image-folder-sync-target-dialog";
import {
  TARGET_ROOT_PATH_HINT,
  detectFolderSyncCapability,
  ensureTargetDirectoryHandle,
  getSyncTarget,
  pickSourceDirectoryHandle,
  readActiveSyncTargetId,
  syncImageFolderToTarget,
  writeActiveSyncTargetId,
  type SyncSummary,
  type SyncTargetId,
} from "./local-image-folder-sync";

let activeCleanup: (() => void) | null = null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
const secondaryBtn =
  "inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export function renderLocalImageFolderSyncPanel(): string {
  return `
    <section
      data-emenu-local-image-sync
      class="shrink-0 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5"
      aria-labelledby="emenu-local-image-sync-title"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <h2 id="emenu-local-image-sync-title" class="text-base font-semibold tracking-tight text-foreground">
            ${escapeHtml(t("emenuLocalImageSync.title"))}
          </h2>
          <p class="mt-1 text-sm leading-6 text-muted-foreground">
            ${escapeHtml(t("emenuLocalImageSync.hint"))}
          </p>
          <p class="mt-2 break-all font-mono text-xs text-muted-foreground">${escapeHtml(TARGET_ROOT_PATH_HINT)}\\{emenu|kiosk}</p>
          <p data-emenu-local-image-sync-active class="mt-2 text-xs font-medium text-muted-foreground"></p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <button type="button" data-emenu-local-image-sync-run class="${primaryBtn}">
            ${escapeHtml(t("emenuLocalImageSync.syncButton"))}
          </button>
          <button type="button" data-emenu-local-image-sync-reauth class="${secondaryBtn}">
            ${escapeHtml(t("emenuLocalImageSync.reauth"))}
          </button>
        </div>
      </div>
      <div data-emenu-local-image-sync-status class="mt-3 hidden text-sm text-muted-foreground"></div>
      <div data-emenu-local-image-sync-toast class="pointer-events-none fixed bottom-5 right-5 z-[120] hidden max-w-sm rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-xl"></div>
    </section>`;
}

function showToast(root: HTMLElement, message: string): void {
  const toast = root.querySelector<HTMLElement>("[data-emenu-local-image-sync-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 3500);
}

function setBusy(root: HTMLElement, busy: boolean): void {
  root
    .querySelectorAll<HTMLButtonElement>(
      "button[data-emenu-local-image-sync-run], button[data-emenu-local-image-sync-reauth]",
    )
    .forEach((btn) => {
      btn.disabled = busy;
    });
}

function renderActiveTarget(root: HTMLElement): void {
  const line = root.querySelector<HTMLElement>("[data-emenu-local-image-sync-active]");
  if (!line) return;
  const active = readActiveSyncTargetId();
  if (!active) {
    line.textContent = t("emenuLocalImageSync.activeNone");
    return;
  }
  line.textContent = tf("emenuLocalImageSync.activeTarget", {
    target: t(`emenuLocalImageSync.target.${active}` as const),
    path: getSyncTarget(active).path,
  });
}

function renderResult(root: HTMLElement, summary: SyncSummary): void {
  const status = root.querySelector<HTMLElement>("[data-emenu-local-image-sync-status]");
  if (!status) return;
  status.classList.remove("hidden");
  const failedLines =
    summary.failed.length > 0
      ? `<ul class="mt-2 list-disc space-y-1 pl-5 text-destructive">${summary.failed
          .map((f) => `<li>${escapeHtml(f.name)}: ${escapeHtml(f.message)}</li>`)
          .join("")}</ul>`
      : "";
  status.innerHTML = `${escapeHtml(
    tf("emenuLocalImageSync.result", {
      added: String(summary.added),
      skipped: String(summary.skipped),
      ignored: String(summary.ignoredNonImages),
      failed: String(summary.failed.length),
    }),
  )}${failedLines}`;
}

function checkCapability(root: HTMLElement): boolean {
  const capability = detectFolderSyncCapability();
  if (capability === "insecure_context") {
    showToast(root, t("emenuLocalImageSync.insecure"));
    return false;
  }
  if (capability === "unsupported") {
    showToast(root, t("emenuLocalImageSync.unsupported"));
    return false;
  }
  return true;
}

/** 取得目标目录：已授权 images 根时不会再弹系统目录框。 */
async function acquireTargetHandle(
  root: HTMLElement,
  target: SyncTargetId,
  opts: { forcePick?: boolean } = {},
): Promise<FileSystemDirectoryHandle | null> {
  const result = await ensureTargetDirectoryHandle(target, opts);
  if (result.mismatched) {
    showToast(
      root,
      tf("emenuLocalImageSync.targetMismatch", { path: getSyncTarget(target).path }),
    );
    return null;
  }
  if (result.cancelled || !result.handle) return null;

  writeActiveSyncTargetId(target);
  renderActiveTarget(root);
  return result.handle;
}

/** 重新授权 images 根目录，供目录迁移或权限失效时使用。 */
async function onReauth(root: HTMLElement): Promise<void> {
  if (!checkCapability(root)) return;
  setBusy(root, true);
  try {
    const target = readActiveSyncTargetId() ?? "emenu";
    const handle = await acquireTargetHandle(root, target, { forcePick: true });
    if (!handle) return;
    showToast(
      root,
      tf("emenuLocalImageSync.reauthDone", {
        target: t(`emenuLocalImageSync.target.${target}` as const),
      }),
    );
  } catch (e) {
    showToast(root, e instanceof Error ? e.message : t("emenuLocalImageSync.reauthNeeded"));
  } finally {
    setBusy(root, false);
  }
}

async function onSync(root: HTMLElement): Promise<void> {
  if (!checkCapability(root)) return;

  const target = await openSyncTargetDialog(readActiveSyncTargetId() ?? "emenu");
  if (!target) return;

  setBusy(root, true);
  try {
    const targetHandle = await acquireTargetHandle(root, target);
    if (!targetHandle) return;

    const source = await pickSourceDirectoryHandle();
    if (source.cancelled || !source.handle) return;

    const summary = await syncImageFolderToTarget({
      sourceHandle: source.handle,
      targetHandle,
    });

    if (summary.blockedReason === "has_subdir") {
      showToast(root, t("emenuLocalImageSync.needFlat"));
      return;
    }
    if (summary.blockedReason === "no_images") {
      showToast(root, t("emenuLocalImageSync.noImages"));
      return;
    }
    if (summary.blockedReason === "case_conflict") {
      showToast(root, t("emenuLocalImageSync.caseConflict"));
      return;
    }

    renderResult(root, summary);
    showToast(root, t("emenuLocalImageSync.syncDone"));
  } catch (e) {
    showToast(root, e instanceof Error ? e.message : t("emenuLocalImageSync.reauthNeeded"));
  } finally {
    setBusy(root, false);
  }
}

export function bindLocalImageFolderSyncPanel(): void {
  activeCleanup?.();
  activeCleanup = null;
  const root = document.querySelector<HTMLElement>("[data-emenu-local-image-sync]");
  if (!root) return;

  renderActiveTarget(root);

  const onClick = (event: Event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute("data-emenu-local-image-sync-run")) {
      void onSync(root);
      return;
    }
    if (button.hasAttribute("data-emenu-local-image-sync-reauth")) {
      void onReauth(root);
    }
  };

  root.addEventListener("click", onClick);
  activeCleanup = () => root.removeEventListener("click", onClick);
}
