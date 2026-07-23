/**
 * 前厅 · 食客下单限流：seq 590 菜品下单时间间隔。
 * 列表展示规则摘要；【新增规则】/【编辑】打开设置弹框（结构对齐延迟送厨），
 * 适用商品按产线 + 组 / 类 / 菜选择。
 */

import {
  bindBrandMenuStructurePicker,
  coerceBrandMenuStructureByLine,
  countBrandMenuStructureDishesByLine,
  emptyBrandMenuStructureByLine,
  readBrandMenuStructureByLineFromPicker,
  renderBrandMenuStructurePickerHtml,
  type BrandMenuStructureByLine,
} from "./brand-menu-structure-picker-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { newRuleId } from "./module-settings-dish-rules-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_ORDER_INTERVAL_SEQ = 590;

const RULES_STORAGE_ID = "590-menu-order-interval-rules";

const INTERVAL_MIN = 1;
const INTERVAL_MAX = 999;
const INTERVAL_DEFAULT = 5;

const NUMBER_INPUT_CLASS =
  "w-20 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

export type MenuOrderIntervalRule = {
  id: string;
  intervalMinutes: number;
  /** 按产线的组/类/菜选中节点 key */
  structureByLine: BrandMenuStructureByLine;
};

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return INTERVAL_DEFAULT;
  return Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, Math.round(n)));
}

function normalizeRules(raw: unknown): MenuOrderIntervalRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Partial<MenuOrderIntervalRule> & {
      structureKeys?: unknown;
      targets?: unknown;
      targetType?: unknown;
    };
    return {
      id: typeof row.id === "string" && row.id ? row.id : newRuleId(),
      intervalMinutes: normalizeMinutes(row.intervalMinutes),
      structureByLine: coerceBrandMenuStructureByLine(row.structureByLine, row.structureKeys),
    };
  });
}

export function readGuestMenuOrderIntervalRules(): MenuOrderIntervalRule[] {
  const raw = readModuleSettingJson<unknown>(RULES_STORAGE_ID, []);
  const normalized = normalizeRules(raw);
  /** 旧版强制写入的空占位规则：无 structureByLine 且未选商品 → 视为无数据 */
  if (
    normalized.length === 1 &&
    countBrandMenuStructureDishesByLine(normalized[0].structureByLine) === 0 &&
    Array.isArray(raw) &&
    raw[0] &&
    typeof raw[0] === "object" &&
    !("structureByLine" in (raw[0] as object))
  ) {
    writeGuestMenuOrderIntervalRules([]);
    return [];
  }
  return normalized;
}

export function writeGuestMenuOrderIntervalRules(rules: MenuOrderIntervalRule[]): void {
  writeModuleSettingJson(RULES_STORAGE_ID, rules);
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_ORDER_INTERVAL_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuOrderIntervalToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_ORDER_INTERVAL_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_MENU_ORDER_INTERVAL_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

export function isGuestMenuOrderIntervalSeq(seq: number): boolean {
  return seq === GUEST_MENU_ORDER_INTERVAL_SEQ;
}

function renderRuleRow(rule: MenuOrderIntervalRule): string {
  const selectedCount = countBrandMenuStructureDishesByLine(rule.structureByLine);
  const productHint =
    selectedCount === 0
      ? `<span class="text-muted-foreground">未选商品（规则暂不生效）</span>`
      : `<button
          type="button"
          class="${BTN_LINK} tabular-nums"
          data-menu-order-interval-products-view
        >${selectedCount} 个</button>`;
  return `
    <div
      class="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
      data-menu-order-interval-rule-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0 space-y-1.5">
          <p class="m-0 text-sm font-medium text-foreground">指定商品下单间隔 ${rule.intervalMinutes} 分钟</p>
          <p class="m-0 text-sm leading-relaxed">
            <span class="text-muted-foreground">适用商品：</span>${productHint}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-3">
          <button type="button" class="${BTN_LINK}" data-menu-order-interval-edit>编辑</button>
          <button type="button" class="text-sm text-muted-foreground hover:text-destructive" data-menu-order-interval-remove aria-label="删除本条">删除</button>
        </div>
      </div>
    </div>`;
}

function renderEmptyHint(): string {
  return `<p class="m-0 rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-6 text-center text-sm text-muted-foreground">暂无菜品下单时间间隔规则，请点击「新增规则」配置</p>`;
}

function renderSettingsDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-menu-order-interval-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-order-interval-dialog-title"
      data-editing-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-menu-order-interval-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="menu-order-interval-dialog-title" class="text-base font-semibold text-card-foreground">间隔设置</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-menu-order-interval-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-menu-order-interval-dialog-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-menu-order-interval-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-menu-order-interval-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderProductsViewDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-menu-order-interval-products-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-order-interval-products-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-menu-order-interval-products-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="menu-order-interval-products-dialog-title" class="text-base font-semibold text-card-foreground">适用商品</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-menu-order-interval-products-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-menu-order-interval-products-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_PRIMARY}" data-menu-order-interval-products-close>关闭</button>
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirmDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[120] hidden items-center justify-center p-4"
      data-menu-order-interval-delete-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-order-interval-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-menu-order-interval-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="menu-order-interval-delete-dialog-title" class="text-base font-semibold text-card-foreground">确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-menu-order-interval-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-menu-order-interval-delete-message>确定删除该菜品下单时间间隔规则？删除后无法恢复。</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-menu-order-interval-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-menu-order-interval-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function renderDialogBody(rule: MenuOrderIntervalRule | null): string {
  const intervalMinutes = rule?.intervalMinutes ?? INTERVAL_DEFAULT;
  const byLine = rule?.structureByLine ?? emptyBrandMenuStructureByLine();
  return `
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-foreground" for="menu-order-interval-dialog-minutes">下单时间间隔</label>
      <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span>指定商品下单间隔</span>
        <input
          id="menu-order-interval-dialog-minutes"
          type="number"
          inputmode="numeric"
          min="${INTERVAL_MIN}"
          max="${INTERVAL_MAX}"
          step="1"
          class="${NUMBER_INPUT_CLASS}"
          value="${intervalMinutes}"
          data-menu-order-interval-dialog-minutes
          aria-label="下单时间间隔分钟数"
        />
        <span>分钟</span>
      </div>
      <p class="m-0 text-xs text-muted-foreground">小于间隔再次下单时需服务员授权（${INTERVAL_MIN}–${INTERVAL_MAX}）</p>
    </div>
    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">适用商品</p>
      ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
        enableLines: true,
        selectionByLine: byLine,
      })}
    </div>`;
}

function renderRulesEditorHtml(): string {
  const rules = readGuestMenuOrderIntervalRules();
  const rows =
    rules.length > 0 ? rules.map((rule) => renderRuleRow(rule)).join("") : renderEmptyHint();
  return `
    <div
      class="space-y-3"
      data-menu-order-interval-editor
      data-storage-id="${escapeHtml(RULES_STORAGE_ID)}"
    >
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="${BTN_PRIMARY}" data-menu-order-interval-add>新增规则</button>
      </div>
      <div class="space-y-3" data-menu-order-interval-rule-list>${rows}</div>
      ${renderSettingsDialog()}
      ${renderProductsViewDialog()}
      ${renderDeleteConfirmDialog()}
    </div>`;
}

export function renderGuestMenuOrderIntervalPanelHtml(on: boolean): string {
  ensureGuestMenuOrderIntervalToggleMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 space-y-4 ${hidden}"
      data-menu-order-interval-panel="${GUEST_MENU_ORDER_INTERVAL_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderRulesEditorHtml()}
    </div>`;
}

function showDialog(dialog: HTMLElement): void {
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideDialog(dialog: HTMLElement): void {
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-editing-id", "");
}

function rerenderRuleList(editor: HTMLElement): void {
  const list = editor.querySelector<HTMLElement>("[data-menu-order-interval-rule-list]");
  if (!list) return;
  const rules = readGuestMenuOrderIntervalRules();
  list.innerHTML =
    rules.length > 0 ? rules.map((rule) => renderRuleRow(rule)).join("") : renderEmptyHint();
}

function openSettingsDialog(editor: HTMLElement, editingId: string | null): void {
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-menu-order-interval-dialog-body]");
  if (!dialog || !body) return;

  const rules = readGuestMenuOrderIntervalRules();
  const editing = editingId ? (rules.find((r) => r.id === editingId) ?? null) : null;
  dialog.setAttribute("data-editing-id", editing?.id ?? "");
  body.innerHTML = renderDialogBody(editing);
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDialog(dialog);
  body.querySelector<HTMLInputElement>("[data-menu-order-interval-dialog-minutes]")?.focus();
}

function closeSettingsDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-dialog]");
  if (dialog) hideDialog(dialog);
}

function openProductsViewDialog(editor: HTMLElement, ruleId: string): void {
  const rule = readGuestMenuOrderIntervalRules().find((r) => r.id === ruleId);
  if (!rule) return;
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-products-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-menu-order-interval-products-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#menu-order-interval-products-dialog-title");
  if (!dialog || !body) return;
  if (titleEl) titleEl.textContent = `适用商品 · 间隔 ${rule.intervalMinutes} 分钟`;
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">按产线查看已配置的组 / 类 / 菜（只读）</p>
    ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
      enableLines: true,
      selectionByLine: rule.structureByLine,
      readOnly: true,
    })}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDialog(dialog);
}

function closeProductsViewDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-products-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-menu-order-interval-products-body]");
  if (body) body.innerHTML = "";
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
  }
}

function saveSettingsDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-dialog]");
  if (!dialog) return;
  const minutesInput = dialog.querySelector<HTMLInputElement>(
    "[data-menu-order-interval-dialog-minutes]",
  );
  const picker = dialog.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const nextRule: MenuOrderIntervalRule = {
    id: editingId || newRuleId(),
    intervalMinutes: normalizeMinutes(minutesInput?.value),
    structureByLine: picker
      ? readBrandMenuStructureByLineFromPicker(picker)
      : emptyBrandMenuStructureByLine(),
  };
  const rules = readGuestMenuOrderIntervalRules();
  const idx = editingId ? rules.findIndex((r) => r.id === editingId) : -1;
  if (idx >= 0) rules[idx] = nextRule;
  else rules.push(nextRule);
  writeGuestMenuOrderIntervalRules(rules);
  hideDialog(dialog);
  rerenderRuleList(editor);
}

function removeRule(editor: HTMLElement, ruleId: string): void {
  writeGuestMenuOrderIntervalRules(readGuestMenuOrderIntervalRules().filter((r) => r.id !== ruleId));
  rerenderRuleList(editor);
}

function openDeleteConfirmDialog(editor: HTMLElement, ruleId: string): void {
  const rule = readGuestMenuOrderIntervalRules().find((r) => r.id === ruleId);
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-delete-dialog]");
  const idInput = editor.querySelector<HTMLInputElement>(
    "[data-menu-order-interval-delete-target-id]",
  );
  const messageEl = editor.querySelector<HTMLElement>("[data-menu-order-interval-delete-message]");
  if (!dialog || !idInput || !messageEl) return;
  idInput.value = ruleId;
  const minutes = rule?.intervalMinutes ?? INTERVAL_DEFAULT;
  messageEl.textContent = `确定删除「指定商品下单间隔 ${minutes} 分钟」这条规则？删除后无法恢复。`;
  showDialog(dialog);
}

function closeDeleteConfirmDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-menu-order-interval-delete-dialog]");
  const idInput = editor.querySelector<HTMLInputElement>(
    "[data-menu-order-interval-delete-target-id]",
  );
  if (idInput) idInput.value = "";
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
  }
}

function confirmDeleteRule(editor: HTMLElement): void {
  const ruleId = editor
    .querySelector<HTMLInputElement>("[data-menu-order-interval-delete-target-id]")
    ?.value.trim();
  if (!ruleId) return;
  removeRule(editor, ruleId);
  closeDeleteConfirmDialog(editor);
}

function bindMenuOrderIntervalEditor(editor: HTMLElement): void {
  if (editor.dataset.menuOrderIntervalBound === "1") return;
  editor.dataset.menuOrderIntervalBound = "1";

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-menu-order-interval-dialog-close]") ||
      target.closest("[data-menu-order-interval-dialog-cancel]") ||
      target.closest("[data-menu-order-interval-dialog-backdrop]")
    ) {
      closeSettingsDialog(editor);
      return;
    }
    if (
      target.closest("[data-menu-order-interval-products-close]") ||
      target.closest("[data-menu-order-interval-products-backdrop]")
    ) {
      closeProductsViewDialog(editor);
      return;
    }
    if (
      target.closest("[data-menu-order-interval-delete-cancel]") ||
      target.closest("[data-menu-order-interval-delete-backdrop]")
    ) {
      closeDeleteConfirmDialog(editor);
      return;
    }
    if (target.closest("[data-menu-order-interval-delete-confirm]")) {
      confirmDeleteRule(editor);
      return;
    }
    if (target.closest("[data-menu-order-interval-dialog-save]")) {
      saveSettingsDialog(editor);
      return;
    }
    if (target.closest("[data-menu-order-interval-add]")) {
      openSettingsDialog(editor, null);
      return;
    }
    const productsView = target.closest("[data-menu-order-interval-products-view]");
    if (productsView) {
      const row = productsView.closest("[data-menu-order-interval-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openProductsViewDialog(editor, ruleId);
      return;
    }
    const editBtn = target.closest("[data-menu-order-interval-edit]");
    if (editBtn) {
      const row = editBtn.closest("[data-menu-order-interval-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openSettingsDialog(editor, ruleId);
      return;
    }
    const removeBtn = target.closest("[data-menu-order-interval-remove]");
    if (removeBtn) {
      const row = removeBtn.closest("[data-menu-order-interval-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openDeleteConfirmDialog(editor, ruleId);
    }
  });
}

export function setGuestMenuOrderIntervalPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-menu-order-interval-panel="${GUEST_MENU_ORDER_INTERVAL_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      const addBtn = panel.querySelector<HTMLButtonElement>("[data-menu-order-interval-add]");
      if (addBtn) addBtn.disabled = !visible;
    });
}

export function bindGuestMenuOrderIntervalUi(root: ParentNode = document): void {
  ensureGuestMenuOrderIntervalToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-menu-order-interval-editor]").forEach((editor) => {
    bindMenuOrderIntervalEditor(editor);
  });
}
