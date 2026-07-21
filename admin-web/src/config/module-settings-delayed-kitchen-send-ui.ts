/**
 * 前厅 · 送厨流程：seq 125 延迟送厨时间。
 * 列表展示规则摘要；【添加送厨时间】/【编辑】打开「送厨设置」弹框，
 * 适用商品按产线 + 组 / 类 / 菜选择（对齐新增品牌菜单结构）。
 * 点击适用商品数量打开只读菜单结构查看弹框。
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

export const DELAYED_KITCHEN_SEND_SEQ = 125;

const RULES_STORAGE_ID = "125-delayed-kitchen-send-rules";

const DELAY_MIN = 0;
const DELAY_MAX = 1440;
const DELAY_DEFAULT = 5;

const NUMBER_INPUT_CLASS =
  "w-20 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

export type DelayedKitchenSendRule = {
  id: string;
  delayMinutes: number;
  /** 按产线（Kiosk / eMenu / SDI）的组/类/菜选中节点 key */
  structureByLine: BrandMenuStructureByLine;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeDelayMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DELAY_DEFAULT;
  return Math.min(DELAY_MAX, Math.max(DELAY_MIN, Math.round(n)));
}

function normalizeRules(raw: unknown): DelayedKitchenSendRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Partial<DelayedKitchenSendRule> & {
      structureKeys?: unknown;
      dishes?: unknown;
    };
    return {
      id: typeof row.id === "string" && row.id ? row.id : newRuleId(),
      delayMinutes: normalizeDelayMinutes(row.delayMinutes),
      structureByLine: coerceBrandMenuStructureByLine(row.structureByLine, row.structureKeys),
    };
  });
}

export function readDelayedKitchenSendRules(): DelayedKitchenSendRule[] {
  const raw = readModuleSettingJson<unknown>(RULES_STORAGE_ID, []);
  return normalizeRules(raw);
}

export function writeDelayedKitchenSendRules(rules: DelayedKitchenSendRule[]): void {
  writeModuleSettingJson(RULES_STORAGE_ID, rules);
}

export function isDelayedKitchenSendSeq(seq: number): boolean {
  return seq === DELAYED_KITCHEN_SEND_SEQ;
}

function renderRuleRow(rule: DelayedKitchenSendRule, canRemove: boolean): string {
  const selectedCount = countBrandMenuStructureDishesByLine(rule.structureByLine);
  const productHint =
    selectedCount === 0
      ? `<span class="text-muted-foreground">未选商品（规则暂不生效）</span>`
      : `<button
          type="button"
          class="${BTN_LINK} tabular-nums"
          data-delayed-kitchen-send-products-view
        >${selectedCount} 个</button>`;
  const removeBtn = canRemove
    ? `<button type="button" class="text-sm text-muted-foreground hover:text-destructive" data-delayed-kitchen-send-remove aria-label="删除本条">删除</button>`
    : "";
  return `
    <div
      class="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
      data-delayed-kitchen-send-rule-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0 space-y-1.5">
          <p class="m-0 text-sm font-medium text-foreground">下单后 ${rule.delayMinutes} 分钟自动送厨</p>
          <p class="m-0 text-sm leading-relaxed">
            <span class="text-muted-foreground">适用商品：</span>${productHint}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-3">
          <button type="button" class="${BTN_LINK}" data-delayed-kitchen-send-edit>编辑</button>
          ${removeBtn}
        </div>
      </div>
    </div>`;
}

function renderSettingsDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-delayed-kitchen-send-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="delayed-kitchen-send-dialog-title"
      data-editing-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-delayed-kitchen-send-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="delayed-kitchen-send-dialog-title" class="text-base font-semibold text-card-foreground">送厨设置</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-delayed-kitchen-send-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-delayed-kitchen-send-dialog-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-delayed-kitchen-send-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-delayed-kitchen-send-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderProductsViewDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-delayed-kitchen-send-products-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="delayed-kitchen-send-products-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-delayed-kitchen-send-products-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="delayed-kitchen-send-products-dialog-title" class="text-base font-semibold text-card-foreground">适用商品</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-delayed-kitchen-send-products-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-delayed-kitchen-send-products-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_PRIMARY}" data-delayed-kitchen-send-products-close>关闭</button>
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirmDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[120] hidden items-center justify-center p-4"
      data-delayed-kitchen-send-delete-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="delayed-kitchen-send-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-delayed-kitchen-send-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="delayed-kitchen-send-delete-dialog-title" class="text-base font-semibold text-card-foreground">确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-delayed-kitchen-send-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-delayed-kitchen-send-delete-message>确定删除该延迟送厨规则？删除后无法恢复。</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-delayed-kitchen-send-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-delayed-kitchen-send-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function renderDialogBody(rule: DelayedKitchenSendRule | null): string {
  const delayMinutes = rule?.delayMinutes ?? DELAY_DEFAULT;
  const byLine = rule?.structureByLine ?? emptyBrandMenuStructureByLine();
  return `
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-foreground" for="delayed-kitchen-send-dialog-minutes">延迟送厨时间</label>
      <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span>下单后</span>
        <input
          id="delayed-kitchen-send-dialog-minutes"
          type="number"
          inputmode="numeric"
          min="${DELAY_MIN}"
          max="${DELAY_MAX}"
          step="1"
          class="${NUMBER_INPUT_CLASS}"
          value="${delayMinutes}"
          data-delayed-kitchen-send-dialog-minutes
          aria-label="延迟送厨分钟数"
        />
        <span>分钟自动送厨</span>
      </div>
    </div>
    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">适用商品</p>
      <p class="text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜；未选商品时该条规则暂不生效</p>
      ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
        enableLines: true,
        selectionByLine: byLine,
      })}
    </div>`;
}

export function renderDelayedKitchenSendEditorHtml(_parentSeq: number): string {
  const rules = readDelayedKitchenSendRules();
  const rows =
    rules.length > 0
      ? rules.map((rule) => renderRuleRow(rule, true)).join("")
      : `<p class="m-0 rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-6 text-center text-sm text-muted-foreground">暂无延迟送厨规则，请点击「添加送厨时间」配置</p>`;
  return `
    <div
      class="space-y-3"
      data-delayed-kitchen-send-editor
      data-storage-id="${escapeHtml(RULES_STORAGE_ID)}"
    >
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="${BTN_PRIMARY}" data-delayed-kitchen-send-add>添加送厨时间</button>
      </div>
      <div class="space-y-3" data-delayed-kitchen-send-rule-list>${rows}</div>
      ${renderSettingsDialog()}
      ${renderProductsViewDialog()}
      ${renderDeleteConfirmDialog()}
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
  const list = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-rule-list]");
  if (!list) return;
  const rules = readDelayedKitchenSendRules();
  list.innerHTML =
    rules.length > 0
      ? rules.map((rule) => renderRuleRow(rule, true)).join("")
      : `<p class="m-0 rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-6 text-center text-sm text-muted-foreground">暂无延迟送厨规则，请点击「添加送厨时间」配置</p>`;
}

function openSettingsDialog(editor: HTMLElement, editingId: string | null): void {
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-delayed-kitchen-send-dialog-body]");
  if (!dialog || !body) return;

  const rules = readDelayedKitchenSendRules();
  const editing = editingId ? rules.find((r) => r.id === editingId) ?? null : null;
  dialog.setAttribute("data-editing-id", editing?.id ?? "");
  body.innerHTML = renderDialogBody(editing);
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDialog(dialog);
  body.querySelector<HTMLInputElement>("[data-delayed-kitchen-send-dialog-minutes]")?.focus();
}

function closeSettingsDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-dialog]");
  if (dialog) hideDialog(dialog);
}

function openProductsViewDialog(editor: HTMLElement, ruleId: string): void {
  const rule = readDelayedKitchenSendRules().find((r) => r.id === ruleId);
  if (!rule) return;
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-products-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-delayed-kitchen-send-products-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#delayed-kitchen-send-products-dialog-title");
  if (!dialog || !body) return;
  if (titleEl) titleEl.textContent = `适用商品 · 下单后 ${rule.delayMinutes} 分钟`;
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
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-products-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-delayed-kitchen-send-products-body]");
  if (body) body.innerHTML = "";
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
  }
}

function saveSettingsDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-dialog]");
  if (!dialog) return;
  const minutesInput = dialog.querySelector<HTMLInputElement>(
    "[data-delayed-kitchen-send-dialog-minutes]",
  );
  const picker = dialog.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const nextRule: DelayedKitchenSendRule = {
    id: editingId || newRuleId(),
    delayMinutes: normalizeDelayMinutes(minutesInput?.value),
    structureByLine: picker
      ? readBrandMenuStructureByLineFromPicker(picker)
      : emptyBrandMenuStructureByLine(),
  };
  const rules = readDelayedKitchenSendRules();
  const idx = editingId ? rules.findIndex((r) => r.id === editingId) : -1;
  if (idx >= 0) rules[idx] = nextRule;
  else rules.push(nextRule);
  writeDelayedKitchenSendRules(rules);
  hideDialog(dialog);
  rerenderRuleList(editor);
}

function removeRule(editor: HTMLElement, ruleId: string): void {
  writeDelayedKitchenSendRules(readDelayedKitchenSendRules().filter((r) => r.id !== ruleId));
  rerenderRuleList(editor);
}

function openDeleteConfirmDialog(editor: HTMLElement, ruleId: string): void {
  const rule = readDelayedKitchenSendRules().find((r) => r.id === ruleId);
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-delete-dialog]");
  const idInput = editor.querySelector<HTMLInputElement>(
    "[data-delayed-kitchen-send-delete-target-id]",
  );
  const messageEl = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-delete-message]");
  if (!dialog || !idInput || !messageEl) return;
  idInput.value = ruleId;
  const minutes = rule?.delayMinutes ?? DELAY_DEFAULT;
  messageEl.textContent = `确定删除「下单后 ${minutes} 分钟自动送厨」这条规则？删除后无法恢复。`;
  showDialog(dialog);
}

function closeDeleteConfirmDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-delayed-kitchen-send-delete-dialog]");
  const idInput = editor.querySelector<HTMLInputElement>(
    "[data-delayed-kitchen-send-delete-target-id]",
  );
  if (idInput) idInput.value = "";
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
  }
}

function confirmDeleteRule(editor: HTMLElement): void {
  const ruleId = editor
    .querySelector<HTMLInputElement>("[data-delayed-kitchen-send-delete-target-id]")
    ?.value.trim();
  if (!ruleId) return;
  removeRule(editor, ruleId);
  closeDeleteConfirmDialog(editor);
}

function bindDelayedKitchenSendEditor(editor: HTMLElement): void {
  if (editor.dataset.delayedKitchenSendBound === "1") return;
  editor.dataset.delayedKitchenSendBound = "1";

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-delayed-kitchen-send-dialog-close]") ||
      target.closest("[data-delayed-kitchen-send-dialog-cancel]") ||
      target.closest("[data-delayed-kitchen-send-dialog-backdrop]")
    ) {
      closeSettingsDialog(editor);
      return;
    }
    if (
      target.closest("[data-delayed-kitchen-send-products-close]") ||
      target.closest("[data-delayed-kitchen-send-products-backdrop]")
    ) {
      closeProductsViewDialog(editor);
      return;
    }
    if (
      target.closest("[data-delayed-kitchen-send-delete-cancel]") ||
      target.closest("[data-delayed-kitchen-send-delete-backdrop]")
    ) {
      closeDeleteConfirmDialog(editor);
      return;
    }
    if (target.closest("[data-delayed-kitchen-send-delete-confirm]")) {
      confirmDeleteRule(editor);
      return;
    }
    if (target.closest("[data-delayed-kitchen-send-dialog-save]")) {
      saveSettingsDialog(editor);
      return;
    }
    if (target.closest("[data-delayed-kitchen-send-add]")) {
      openSettingsDialog(editor, null);
      return;
    }
    const productsView = target.closest("[data-delayed-kitchen-send-products-view]");
    if (productsView) {
      const row = productsView.closest("[data-delayed-kitchen-send-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openProductsViewDialog(editor, ruleId);
      return;
    }
    const editBtn = target.closest("[data-delayed-kitchen-send-edit]");
    if (editBtn) {
      const row = editBtn.closest("[data-delayed-kitchen-send-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openSettingsDialog(editor, ruleId);
      return;
    }
    const removeBtn = target.closest("[data-delayed-kitchen-send-remove]");
    if (removeBtn) {
      const row = removeBtn.closest("[data-delayed-kitchen-send-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openDeleteConfirmDialog(editor, ruleId);
    }
  });
}

export function bindDelayedKitchenSendUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-delayed-kitchen-send-editor]").forEach((editor) => {
    bindDelayedKitchenSendEditor(editor);
  });
}
