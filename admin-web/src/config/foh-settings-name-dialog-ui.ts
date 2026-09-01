/**
 * 前厅 · 品类/分类管理 — 名称输入模态框（替代原生单行输入提示）
 * 可选展示渠道多选（Kiosk / eMenu / SDI）。
 */

import {
  BRAND_MENU_LINE_OPTIONS,
  isBrandMenuLineId,
  type BrandMenuLineId,
} from "./brand-menu-structure-picker-ui";

const INPUT_CLASS =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const ALL_DISPLAY_CHANNELS: BrandMenuLineId[] = BRAND_MENU_LINE_OPTIONS.map((l) => l.id);

export type FohSettingsNameDialogExtras = {
  displayChannels?: BrandMenuLineId[];
};

export type FohSettingsNameDialogOptions = {
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  /** 启用展示渠道多选 */
  enableDisplayChannels?: boolean;
  initialDisplayChannels?: BrandMenuLineId[];
  onConfirm: (name: string, extras?: FohSettingsNameDialogExtras) => void;
};

let pendingConfirm: ((name: string, extras?: FohSettingsNameDialogExtras) => void) | null = null;
let pendingEnableChannels = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDisplayChannelPicker(selectedChannels: BrandMenuLineId[]): string {
  const options = BRAND_MENU_LINE_OPTIONS.map((line) => {
    const checked = selectedChannels.includes(line.id);
    return `
    <label
      class="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
    >
      <input
        type="checkbox"
        class="size-4 shrink-0 accent-primary"
        data-foh-settings-name-display-channel
        value="${escapeHtml(line.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="text-sm font-medium text-foreground">${escapeHtml(line.label)}</span>
    </label>`;
  }).join("");
  return `
    <div class="mt-4 space-y-2" data-foh-settings-name-channels>
      <p class="text-sm font-medium text-foreground">展示渠道</p>
      <p class="text-xs text-muted-foreground">勾选后，该项仅在对应渠道展示</p>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">${options}</div>
    </div>`;
}

export function renderFohSettingsNameDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-settings-name-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-settings-name-dialog-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        data-foh-settings-name-dialog-backdrop
        aria-label="关闭"
      ></button>
      <form
        class="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        data-foh-settings-name-dialog-form
      >
        <div class="border-b border-border px-6 py-4">
          <h3 id="foh-settings-name-dialog-title" class="text-lg font-semibold text-card-foreground" data-foh-settings-name-dialog-title></h3>
        </div>
        <div class="px-6 py-4">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-foreground" data-foh-settings-name-dialog-label></span>
            <input
              type="text"
              class="${INPUT_CLASS}"
              data-foh-settings-name-dialog-input
              autocomplete="off"
            />
          </label>
          <p class="mt-2 hidden text-xs text-destructive" data-foh-settings-name-dialog-error>请输入名称</p>
          <div data-foh-settings-name-dialog-extra></div>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted"
            data-foh-settings-name-dialog-cancel
          >取消</button>
          <button
            type="submit"
            class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            data-foh-settings-name-dialog-confirm
          >确定</button>
        </div>
      </form>
    </div>`;
}

function findNameDialog(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-foh-settings-name-dialog]");
}

function setNameDialogError(dialog: HTMLElement, message: string | null): void {
  const err = dialog.querySelector<HTMLElement>("[data-foh-settings-name-dialog-error]");
  if (!err) return;
  if (message) {
    err.textContent = message;
    err.classList.remove("hidden");
  } else {
    err.classList.add("hidden");
  }
}

function closeFohSettingsNameDialog(root: HTMLElement): void {
  const dialog = findNameDialog(root);
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  pendingConfirm = null;
  pendingEnableChannels = false;
  const extra = dialog.querySelector<HTMLElement>("[data-foh-settings-name-dialog-extra]");
  if (extra) extra.innerHTML = "";
  setNameDialogError(dialog, null);
}

function collectDisplayChannels(dialog: HTMLElement): BrandMenuLineId[] {
  const checked = [
    ...dialog.querySelectorAll<HTMLInputElement>("[data-foh-settings-name-display-channel]:checked"),
  ]
    .map((input) => input.value)
    .filter(isBrandMenuLineId);
  return ALL_DISPLAY_CHANNELS.filter((id) => checked.includes(id));
}

function submitFohSettingsNameDialog(root: HTMLElement): void {
  const dialog = findNameDialog(root);
  if (!dialog || !pendingConfirm) return;
  const input = dialog.querySelector<HTMLInputElement>("[data-foh-settings-name-dialog-input]");
  const trimmed = input?.value.trim() ?? "";
  if (!trimmed) {
    setNameDialogError(dialog, "请输入名称");
    input?.focus();
    return;
  }
  const confirm = pendingConfirm;
  const extras: FohSettingsNameDialogExtras | undefined = pendingEnableChannels
    ? { displayChannels: collectDisplayChannels(dialog) }
    : undefined;
  closeFohSettingsNameDialog(root);
  confirm(trimmed, extras);
}

export function openFohSettingsNameDialog(
  root: HTMLElement,
  options: FohSettingsNameDialogOptions,
): void {
  bindFohSettingsNameDialog(root);
  const dialog = findNameDialog(root);
  if (!dialog) return;

  const titleEl = dialog.querySelector<HTMLElement>("[data-foh-settings-name-dialog-title]");
  const labelEl = dialog.querySelector<HTMLElement>("[data-foh-settings-name-dialog-label]");
  const input = dialog.querySelector<HTMLInputElement>("[data-foh-settings-name-dialog-input]");
  const confirmBtn = dialog.querySelector<HTMLButtonElement>("[data-foh-settings-name-dialog-confirm]");
  const extra = dialog.querySelector<HTMLElement>("[data-foh-settings-name-dialog-extra]");
  if (!titleEl || !labelEl || !input) return;

  titleEl.textContent = options.title;
  labelEl.textContent = options.label;
  input.value = options.initialValue ?? "";
  input.placeholder = options.placeholder ?? "";
  if (confirmBtn) {
    confirmBtn.textContent = options.confirmLabel ?? "确定";
  }
  pendingEnableChannels = !!options.enableDisplayChannels;
  if (extra) {
    extra.innerHTML = pendingEnableChannels
      ? renderDisplayChannelPicker(options.initialDisplayChannels ?? [...ALL_DISPLAY_CHANNELS])
      : "";
  }
  setNameDialogError(dialog, null);
  pendingConfirm = options.onConfirm;

  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  window.requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

export function bindFohSettingsNameDialog(root: HTMLElement): void {
  if (root.getAttribute("data-foh-name-dialog-bound") === "1") return;
  root.setAttribute("data-foh-name-dialog-bound", "1");

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-foh-settings-name-dialog-cancel]") ||
      target.closest("[data-foh-settings-name-dialog-backdrop]")
    ) {
      closeFohSettingsNameDialog(root);
    }
  });

  const form = root.querySelector<HTMLFormElement>("[data-foh-settings-name-dialog-form]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitFohSettingsNameDialog(root);
  });

  const input = root.querySelector<HTMLInputElement>("[data-foh-settings-name-dialog-input]");
  input?.addEventListener("input", () => {
    const dialog = findNameDialog(root);
    if (dialog) setNameDialogError(dialog, null);
  });
}
