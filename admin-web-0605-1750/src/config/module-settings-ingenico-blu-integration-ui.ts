/**
 * 系统设置 · 集成与 API · Ingenico-Blu（seq 459）。
 * WDL 账号管理：账号列表、启用、使用中、解绑。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const INGENICO_BLU_INTEGRATION_SEQ = 459;

export const INGENICO_BLU_WDL_ACCOUNTS_FIELD_ID = "459-wdl-accounts";

export type WdlAccountRecord = {
  id: string;
  account: string;
  password: string;
  enabled: boolean;
  inUse: boolean;
};

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15 px-3 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/25";

const BTN_LINK =
  "text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50";

const CHECKBOX_CLASS = "size-4 shrink-0 accent-primary";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newAccountId(): string {
  return `wdl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function maskPassword(password: string): string {
  if (!password) return "—";
  return "•".repeat(Math.min(password.length, 8));
}

function normalizeAccount(raw: Partial<WdlAccountRecord>): WdlAccountRecord {
  return {
    id: raw.id ?? newAccountId(),
    account: raw.account ?? "",
    password: raw.password ?? "",
    enabled: raw.enabled ?? true,
    inUse: raw.inUse ?? false,
  };
}

function normalizeInUseState(accounts: WdlAccountRecord[]): WdlAccountRecord[] {
  const enabled = accounts.filter((a) => a.enabled);
  if (enabled.length === 0) {
    return accounts.map((a) => ({ ...a, inUse: false }));
  }
  const inUseAccounts = enabled.filter((a) => a.inUse);
  if (inUseAccounts.length === 1) return accounts;
  if (inUseAccounts.length === 0) {
    const firstEnabledId = enabled[0]?.id;
    return accounts.map((a) => ({ ...a, inUse: a.id === firstEnabledId }));
  }
  const keepId = inUseAccounts[0]?.id;
  return accounts.map((a) => ({ ...a, inUse: a.id === keepId }));
}

export function readWdlAccounts(): WdlAccountRecord[] {
  const raw = readModuleSettingJson<Partial<WdlAccountRecord>[]>(INGENICO_BLU_WDL_ACCOUNTS_FIELD_ID, []);
  if (!Array.isArray(raw)) return [];
  return normalizeInUseState(raw.map((item) => normalizeAccount(item)));
}

export function writeWdlAccounts(accounts: WdlAccountRecord[]): void {
  writeModuleSettingJson(INGENICO_BLU_WDL_ACCOUNTS_FIELD_ID, normalizeInUseState(accounts));
}

export function isIngenicoBluIntegrationSeq(seq: number): boolean {
  return seq === INGENICO_BLU_INTEGRATION_SEQ;
}

function renderAccountTableBody(accounts: WdlAccountRecord[]): string {
  if (accounts.length === 0) {
    return `
      <tr>
        <td colspan="5" class="px-3 py-10 text-center text-sm text-muted-foreground">No data</td>
      </tr>`;
  }

  return accounts
    .map((record) => {
      const inUseLabel = record.inUse
        ? `<span class="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">使用中</span>`
        : `<button
            type="button"
            class="${BTN_LINK}"
            data-wdl-set-in-use
            data-wdl-id="${escapeHtml(record.id)}"
            ${record.enabled ? "" : "disabled"}
          >设为使用</button>`;
      return `
      <tr class="border-t border-border" data-wdl-row data-wdl-id="${escapeHtml(record.id)}">
        <td class="px-3 py-3 text-sm text-foreground">${escapeHtml(record.account || "—")}</td>
        <td class="px-3 py-3 font-mono text-sm text-muted-foreground">${escapeHtml(maskPassword(record.password))}</td>
        <td class="px-3 py-3 text-sm">${inUseLabel}</td>
        <td class="px-3 py-3">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              class="${CHECKBOX_CLASS}"
              data-wdl-enabled
              data-wdl-id="${escapeHtml(record.id)}"
              ${record.enabled ? "checked" : ""}
              aria-label="启用 ${escapeHtml(record.account)}"
            />
            <span class="text-sm text-foreground">${record.enabled ? "启用" : "停用"}</span>
          </label>
        </td>
        <td class="px-3 py-3">
          <button
            type="button"
            class="text-sm font-medium text-destructive hover:underline"
            data-wdl-unbind
            data-wdl-id="${escapeHtml(record.id)}"
          >解绑</button>
        </td>
      </tr>`;
    })
    .join("");
}

function renderAddDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-wdl-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="wdl-dialog-title"
    >
      <div class="absolute inset-0 bg-black/40" data-wdl-dialog-backdrop aria-hidden="true"></div>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <div class="mb-4 flex items-start justify-between gap-3">
          <h3 id="wdl-dialog-title" class="text-base font-semibold text-card-foreground">新增 WDL 账号</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-wdl-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="wdl-account-input">账号</label>
            <input
              id="wdl-account-input"
              type="text"
              class="${INPUT_CLASS}"
              data-wdl-account-input
              placeholder="账号"
              autocomplete="off"
            />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="wdl-password-input">密码</label>
            <input
              id="wdl-password-input"
              type="password"
              class="${INPUT_CLASS}"
              data-wdl-password-input
              placeholder="密码"
              autocomplete="new-password"
            />
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted" data-wdl-dialog-cancel>取消</button>
          <button type="button" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" data-wdl-dialog-save>保存</button>
        </div>
      </div>
    </div>`;
}

function renderWdlAccountManagementInner(accounts: WdlAccountRecord[]): string {
  return `
    <div class="overflow-hidden rounded-lg border border-border">
      <div class="flex items-center justify-between gap-3 bg-primary px-4 py-2.5">
        <h4 class="text-sm font-semibold text-primary-foreground">WDL 账号管理</h4>
        <button type="button" class="${BTN_PRIMARY}" data-wdl-create>+新增</button>
      </div>
      <div class="overflow-x-auto bg-card">
        <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium">账号</th>
              <th class="px-3 py-2 font-medium">密码</th>
              <th class="px-3 py-2 font-medium">使用中</th>
              <th class="px-3 py-2 font-medium">启用</th>
              <th class="px-3 py-2 font-medium">解绑</th>
            </tr>
          </thead>
          <tbody data-wdl-table-body>
            ${renderAccountTableBody(accounts)}
          </tbody>
        </table>
      </div>
    </div>
    ${renderAddDialog()}`;
}

export function renderIngenicoBluIntegrationHtml(): string {
  return `
    <div class="mt-1 max-w-4xl" data-ingenico-blu-wdl-management>
      ${renderWdlAccountManagementInner(readWdlAccounts())}
    </div>`;
}

function refreshWdlPanel(panel: HTMLElement): void {
  const accounts = readWdlAccounts();
  const tableBody = panel.querySelector("[data-wdl-table-body]");
  if (tableBody) {
    tableBody.innerHTML = renderAccountTableBody(accounts);
  }
}

function showWdlDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-wdl-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  const accountInput = dialog.querySelector<HTMLInputElement>("[data-wdl-account-input]");
  const passwordInput = dialog.querySelector<HTMLInputElement>("[data-wdl-password-input]");
  if (accountInput) accountInput.value = "";
  if (passwordInput) passwordInput.value = "";
  accountInput?.focus();
}

function hideWdlDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-wdl-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
}

function saveWdlAccountFromDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-wdl-dialog]");
  if (!dialog) return;
  const account = dialog.querySelector<HTMLInputElement>("[data-wdl-account-input]")?.value.trim() ?? "";
  const password = dialog.querySelector<HTMLInputElement>("[data-wdl-password-input]")?.value ?? "";
  if (!account) {
    dialog.querySelector<HTMLInputElement>("[data-wdl-account-input]")?.focus();
    return;
  }
  const accounts = readWdlAccounts();
  const isFirst = accounts.length === 0;
  accounts.push(
    normalizeAccount({
      id: newAccountId(),
      account,
      password,
      enabled: true,
      inUse: isFirst,
    }),
  );
  writeWdlAccounts(accounts);
  hideWdlDialog(panel);
  refreshWdlPanel(panel);
}

function setWdlAccountEnabled(panel: HTMLElement, accountId: string, enabled: boolean): void {
  const accounts = readWdlAccounts().map((item) =>
    item.id === accountId ? { ...item, enabled } : item,
  );
  writeWdlAccounts(accounts);
  refreshWdlPanel(panel);
}

function setWdlAccountInUse(panel: HTMLElement, accountId: string): void {
  const accounts = readWdlAccounts().map((item) => ({
    ...item,
    inUse: item.id === accountId && item.enabled,
  }));
  writeWdlAccounts(accounts);
  refreshWdlPanel(panel);
}

function unbindWdlAccount(panel: HTMLElement, accountId: string): void {
  writeWdlAccounts(readWdlAccounts().filter((item) => item.id !== accountId));
  refreshWdlPanel(panel);
}

export function bindIngenicoBluIntegrationUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-ingenico-blu-wdl-management]").forEach((panel) => {
    if (panel.dataset.ingenicoBluWdlBound === "1") return;
    panel.dataset.ingenicoBluWdlBound = "1";

    panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-wdl-create]")) {
        showWdlDialog(panel);
        return;
      }
      if (
        target.closest("[data-wdl-dialog-cancel]") ||
        target.closest("[data-wdl-dialog-close]") ||
        target.closest("[data-wdl-dialog-backdrop]")
      ) {
        hideWdlDialog(panel);
        return;
      }
      if (target.closest("[data-wdl-dialog-save]")) {
        saveWdlAccountFromDialog(panel);
        return;
      }
      const setInUseBtn = target.closest<HTMLElement>("[data-wdl-set-in-use]");
      if (setInUseBtn) {
        const id = setInUseBtn.getAttribute("data-wdl-id");
        if (id) setWdlAccountInUse(panel, id);
        return;
      }
      const unbindBtn = target.closest<HTMLElement>("[data-wdl-unbind]");
      if (unbindBtn) {
        const id = unbindBtn.getAttribute("data-wdl-id");
        if (id) unbindWdlAccount(panel, id);
      }
    });

    panel.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      const enabledInput = target.closest<HTMLInputElement>("[data-wdl-enabled]");
      if (!enabledInput) return;
      const id = enabledInput.getAttribute("data-wdl-id");
      if (!id) return;
      setWdlAccountEnabled(panel, id, enabledInput.checked);
    });
  });
}
