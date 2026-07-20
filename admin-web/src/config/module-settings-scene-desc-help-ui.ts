/**
 * 功能设置标题旁「？」说明：点击后弹框展示描述。
 */

import { t, tf } from "../i18n";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HELP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`;

const HELP_CLOSE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

const HELP_DIALOG_ID = "module-setting-help-dialog";

let helpDialogKeydownHandler: ((event: KeyboardEvent) => void) | null = null;

export type SettingTitleWithHelpOptions = {
  /** 用于 aria / DOM id，需在页面内唯一 */
  id: string | number;
  title: string;
  sceneDesc: string;
  /** 标题元素标签，默认 span */
  titleTag?: "span" | "p" | "h2" | "h3";
  titleClass?: string;
};

export function renderSettingTitleWithHelpHtml(opts: SettingTitleWithHelpOptions): string {
  const id = String(opts.id);
  const titleTag = opts.titleTag ?? "span";
  const titleClass =
    opts.titleClass ?? "text-sm font-medium text-card-foreground";
  const sceneLine = opts.sceneDesc.trim();
  const label = tf("moduleSettings.helpAria", { name: opts.title });

  const helpHtml = sceneLine
    ? `
    <button
      type="button"
      class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-module-setting-help="${escapeHtml(id)}"
      data-module-setting-help-title="${escapeHtml(opts.title)}"
      data-module-setting-help-desc="${escapeHtml(sceneLine)}"
      aria-haspopup="dialog"
      aria-label="${escapeHtml(label)}"
      title="${escapeHtml(label)}"
    >${HELP_ICON_SVG}</button>`
    : "";

  return `
    <div class="min-w-0 flex flex-col gap-1" data-module-setting-title-block="${escapeHtml(id)}">
      <div class="flex min-w-0 items-center gap-1.5">
        <${titleTag} class="${titleClass}">${escapeHtml(opts.title)}</${titleTag}>
        ${helpHtml}
      </div>
    </div>`;
}

function closeModuleSettingHelpDialog(): void {
  if (helpDialogKeydownHandler) {
    document.removeEventListener("keydown", helpDialogKeydownHandler);
    helpDialogKeydownHandler = null;
  }
  const dialog = document.getElementById(HELP_DIALOG_ID);
  if (!dialog) return;
  const openerId = dialog.getAttribute("data-help-opener-id");
  dialog.remove();
  if (openerId) {
    const opener = document.querySelector<HTMLButtonElement>(
      `[data-module-setting-help="${CSS.escape(openerId)}"]`,
    );
    opener?.focus();
  }
}

function openModuleSettingHelpDialog(
  title: string,
  sceneDesc: string,
  openerId: string,
): void {
  closeModuleSettingHelpDialog();

  const closeLabel = t("moduleSettings.helpClose");
  const gotItLabel = t("moduleSettings.helpGotIt");
  const dialogTitleId = `${HELP_DIALOG_ID}-title`;

  const dialog = document.createElement("div");
  dialog.id = HELP_DIALOG_ID;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", dialogTitleId);
  dialog.setAttribute("data-help-opener-id", openerId);
  dialog.tabIndex = -1;
  dialog.className =
    "fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-4";
  dialog.innerHTML = `
    <button
      type="button"
      class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      data-module-setting-help-close
      aria-label="${escapeHtml(closeLabel)}"
    ></button>
    <div class="relative z-[1] flex w-full max-w-md min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
      <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id="${dialogTitleId}" class="min-w-0 text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
        <button
          type="button"
          class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-module-setting-help-close
          aria-label="${escapeHtml(closeLabel)}"
        >${HELP_CLOSE_ICON_SVG}</button>
      </div>
      <div class="min-h-0 flex-1 overflow-auto px-4 py-4">
        <p class="m-0 text-sm leading-relaxed text-muted-foreground">${escapeHtml(sceneDesc)}</p>
      </div>
      <div class="flex shrink-0 justify-end border-t border-border px-4 py-3">
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-module-setting-help-close
          data-module-setting-help-confirm
        >${escapeHtml(gotItLabel)}</button>
      </div>
    </div>`;

  helpDialogKeydownHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModuleSettingHelpDialog();
    }
  };

  dialog.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-module-setting-help-close]")) {
      event.preventDefault();
      closeModuleSettingHelpDialog();
    }
  });

  document.addEventListener("keydown", helpDialogKeydownHandler);
  document.body.appendChild(dialog);
  dialog.querySelector<HTMLButtonElement>("[data-module-setting-help-confirm]")?.focus();
}

export function bindModuleSettingSceneDescHelp(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>("[data-module-setting-help]").forEach((btn) => {
    if (btn.dataset.moduleSettingHelpBound === "1") return;
    btn.dataset.moduleSettingHelpBound = "1";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const id = btn.getAttribute("data-module-setting-help");
      const title = btn.getAttribute("data-module-setting-help-title") ?? "";
      const desc = btn.getAttribute("data-module-setting-help-desc") ?? "";
      if (!id || !desc.trim()) return;
      openModuleSettingHelpDialog(title, desc, id);
    });
  });
}
