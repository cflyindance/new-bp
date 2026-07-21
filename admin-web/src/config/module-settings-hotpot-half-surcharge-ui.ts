/**
 * 前厅 · 食客端·下单与规则：seq 575 同一锅型，相同锅底超过一半默认加收
 * （主开关 + 规则列表；添加/编辑弹框内按产线选择锅底/商品，组/类/菜结构对齐展示菜详情 608）。
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_STRUCTURE_BY_LINE,
  BRAND_MENU_STRUCTURE_TREE,
  dishKey,
  emptyBrandMenuStructureByLine,
  formatBrandMenuStructureSummary,
  isBrandMenuLineId,
  normalizeBrandMenuStructureByLine,
  readBrandMenuStructureKeysFromPicker,
  renderBrandMenuStructurePickerHtml,
  type BrandMenuGroupNode,
  type BrandMenuLineId,
  type BrandMenuStructureByLine,
} from "./brand-menu-structure-picker-ui";
import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import { newRuleId } from "./module-settings-dish-rules-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const HOTPOT_HALF_SURCHARGE_SEQ = 575;

/** 供产线矩阵抽取；与火锅组一致：eMenu、SDI */
export const HOTPOT_HALF_SURCHARGE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type HotpotHalfSurchargeProductLineId =
  (typeof HOTPOT_HALF_SURCHARGE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: HotpotHalfSurchargeProductLineId[] =
  HOTPOT_HALF_SURCHARGE_PRODUCT_LINES.map((l) => l.id);

const RULES_STORAGE_ID = "575-hotpot-half-surcharge-rules";

const AMOUNT_MIN = 0;
const AMOUNT_MAX = 99999;
const AMOUNT_DEFAULT = 0;

const NUMBER_INPUT_CLASS =
  "w-24 h-8 rounded-md border border-input bg-background px-2 text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_PRIMARY_SM =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DIALOG_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

export type HotpotHalfSurchargeRule = {
  id: string;
  surchargeAmount: number;
  /** 按产线存储组/类/菜勾选 key（d:/c:/g:） */
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

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_HALF_SURCHARGE_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureHotpotHalfSurchargeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_HALF_SURCHARGE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(HOTPOT_HALF_SURCHARGE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeAmount(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return AMOUNT_DEFAULT;
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, Math.round(n * 100) / 100));
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

function structureTreeForLine(lineId: string): BrandMenuGroupNode[] {
  return isBrandMenuLineId(lineId)
    ? BRAND_MENU_STRUCTURE_BY_LINE[lineId as BrandMenuLineId]
    : BRAND_MENU_STRUCTURE_TREE;
}

function dishTagsToStructureKeys(
  tags: Array<{ id?: unknown }>,
  tree: BrandMenuGroupNode[],
): string[] {
  const dishIds = new Set(
    tags
      .map((t) => (typeof t?.id === "string" ? t.id : ""))
      .filter(Boolean),
  );
  if (dishIds.size === 0) return [];
  const keys: string[] = [];
  for (const group of tree) {
    for (const category of group.categories) {
      for (const dish of category.dishes) {
        if (dishIds.has(dish.id)) {
          keys.push(dishKey(group.id, category.id, dish.id));
        }
      }
    }
  }
  return keys;
}

function migrateLegacyBasesToByLine(bases: unknown): BrandMenuStructureByLine {
  const byLine = emptyBrandMenuStructureByLine();
  if (!Array.isArray(bases) || bases.length === 0) return byLine;
  const tags = bases.filter(
    (b): b is { id: string; name: string } =>
      Boolean(b && typeof b === "object" && typeof (b as { id?: unknown }).id === "string"),
  );
  for (const line of HOTPOT_HALF_SURCHARGE_PRODUCT_LINES) {
    byLine[line.id as BrandMenuLineId] = dishTagsToStructureKeys(
      tags,
      structureTreeForLine(line.id),
    );
  }
  return byLine;
}

function normalizeRules(raw: unknown): HotpotHalfSurchargeRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Partial<HotpotHalfSurchargeRule> & { bases?: unknown };
    const hasByLine =
      row.structureByLine &&
      typeof row.structureByLine === "object" &&
      Object.values(row.structureByLine as BrandMenuStructureByLine).some(
        (keys) => Array.isArray(keys) && keys.length > 0,
      );
    return {
      id: typeof row.id === "string" && row.id ? row.id : newRuleId(),
      surchargeAmount: normalizeAmount(row.surchargeAmount),
      structureByLine: hasByLine
        ? normalizeBrandMenuStructureByLine(row.structureByLine)
        : migrateLegacyBasesToByLine(row.bases),
    };
  });
}

export function readHotpotHalfSurchargeRules(): HotpotHalfSurchargeRule[] {
  const raw = readModuleSettingJson<unknown>(RULES_STORAGE_ID, []);
  return normalizeRules(raw);
}

export function writeHotpotHalfSurchargeRules(rules: HotpotHalfSurchargeRule[]): void {
  writeModuleSettingJson(
    RULES_STORAGE_ID,
    rules.map((r) => ({
      id: r.id,
      surchargeAmount: r.surchargeAmount,
      structureByLine: normalizeBrandMenuStructureByLine(r.structureByLine),
    })),
  );
}

export function isHotpotHalfSurchargeSeq(seq: number): boolean {
  return seq === HOTPOT_HALF_SURCHARGE_SEQ;
}

function scopedDishCount(byLine: BrandMenuStructureByLine): number {
  return ALL_LINE_IDS.reduce((sum, lineId) => {
    const keys = byLine[lineId as BrandMenuLineId] ?? [];
    return sum + keys.filter((k) => k.startsWith("d:")).length;
  }, 0);
}

function scopedSummary(byLine: BrandMenuStructureByLine): string {
  const parts = HOTPOT_HALF_SURCHARGE_PRODUCT_LINES.map((line) => {
    const keys = byLine[line.id as BrandMenuLineId] ?? [];
    if (keys.length === 0) return null;
    const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(line.id));
    if (summary === "—") return null;
    return `${line.label}：${summary}`;
  }).filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join("；") : "—";
}

function renderRuleRow(rule: HotpotHalfSurchargeRule): string {
  const dishCount = scopedDishCount(rule.structureByLine);
  const basesHint =
    dishCount === 0
      ? `<span class="text-muted-foreground">未选商品（规则暂不生效）</span>`
      : `<button
          type="button"
          class="${BTN_LINK} tabular-nums"
          data-hotpot-half-surcharge-bases-view
        >${dishCount} 道菜</button>`;
  return `
    <div
      class="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
      data-hotpot-half-surcharge-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0 space-y-1.5">
          <p class="m-0 text-sm font-medium text-foreground">额外加收 $${escapeHtml(formatAmount(rule.surchargeAmount))}</p>
          <p class="m-0 text-sm leading-relaxed">
            <span class="text-muted-foreground">适用锅底：</span>${basesHint}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-3">
          <button type="button" class="${BTN_LINK}" data-hotpot-half-surcharge-edit>编辑</button>
          <button type="button" class="text-sm text-muted-foreground hover:text-destructive" data-hotpot-half-surcharge-remove aria-label="删除本条">删除</button>
        </div>
      </div>
    </div>`;
}

function renderLineMenuSettingsCell(
  lineId: HotpotHalfSurchargeProductLineId,
  byLine: BrandMenuStructureByLine,
): string {
  const keys = byLine[lineId as BrandMenuLineId] ?? [];
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  return `
    <div class="min-w-[14rem] space-y-1.5" data-hotpot-half-surcharge-line-settings="${escapeHtml(lineId)}">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="${BTN_PRIMARY_SM}"
          data-hotpot-half-surcharge-pick-dishes
          data-line-id="${escapeHtml(lineId)}"
        >选择商品</button>
        <span class="text-xs text-muted-foreground" data-hotpot-half-surcharge-pick-count="${escapeHtml(lineId)}">${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground" data-hotpot-half-surcharge-pick-summary="${escapeHtml(lineId)}">${escapeHtml(summary)}</p>
    </div>`;
}

function renderDialogLineTable(byLine: BrandMenuStructureByLine): string {
  const rows = HOTPOT_HALF_SURCHARGE_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">${renderLineMenuSettingsCell(line.id, byLine)}</td>
    </tr>`,
  ).join("");

  return `
    <div class="overflow-x-auto rounded-md border border-border" data-hotpot-half-surcharge-line-table>
      <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">菜单设置</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderSettingsDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-hotpot-half-surcharge-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotpot-half-surcharge-dialog-title"
      data-editing-id=""
      data-draft-by-line=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-hotpot-half-surcharge-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="hotpot-half-surcharge-dialog-title" class="text-base font-semibold text-card-foreground">加收规则设置</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-hotpot-half-surcharge-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-hotpot-half-surcharge-dialog-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-hotpot-half-surcharge-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-hotpot-half-surcharge-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderDishPickDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[120] hidden items-center justify-center p-4"
      data-hotpot-half-surcharge-dish-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotpot-half-surcharge-dish-dialog-title"
      data-line-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-hotpot-half-surcharge-dish-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="hotpot-half-surcharge-dish-dialog-title" class="text-base font-semibold text-card-foreground">选择商品</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-hotpot-half-surcharge-dish-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-hotpot-half-surcharge-dish-dialog-body>
          <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐展示菜详情）</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-hotpot-half-surcharge-dish-dialog-cancel>取消</button>
          <button type="button" class="${BTN_DIALOG_PRIMARY}" data-hotpot-half-surcharge-dish-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderBasesViewDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-hotpot-half-surcharge-bases-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotpot-half-surcharge-bases-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-hotpot-half-surcharge-bases-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="hotpot-half-surcharge-bases-dialog-title" class="text-base font-semibold text-card-foreground">适用锅底</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-hotpot-half-surcharge-bases-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-hotpot-half-surcharge-bases-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_PRIMARY}" data-hotpot-half-surcharge-bases-close>关闭</button>
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirmDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[120] hidden items-center justify-center p-4"
      data-hotpot-half-surcharge-delete-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotpot-half-surcharge-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-hotpot-half-surcharge-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="hotpot-half-surcharge-delete-dialog-title" class="text-base font-semibold text-card-foreground">确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-hotpot-half-surcharge-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-hotpot-half-surcharge-delete-message>确定删除该加收规则？删除后无法恢复。</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-hotpot-half-surcharge-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-hotpot-half-surcharge-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function renderDialogBody(rule: HotpotHalfSurchargeRule | null): string {
  const amount = rule?.surchargeAmount ?? AMOUNT_DEFAULT;
  const byLine = rule?.structureByLine ?? emptyBrandMenuStructureByLine();
  return `
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-foreground" for="hotpot-half-surcharge-dialog-amount">额外加收金额</label>
      <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span class="text-muted-foreground">$</span>
        <input
          id="hotpot-half-surcharge-dialog-amount"
          type="number"
          inputmode="decimal"
          min="${AMOUNT_MIN}"
          max="${AMOUNT_MAX}"
          step="0.01"
          class="${NUMBER_INPUT_CLASS}"
          value="${amount}"
          data-hotpot-half-surcharge-dialog-amount
          aria-label="额外加收金额"
        />
      </div>
    </div>
    <div class="space-y-2">
      <p class="text-sm font-medium text-foreground">适用锅底</p>
      <p class="text-xs text-muted-foreground">按产线选择商品（组 / 类 / 菜，结构对齐展示菜详情）；未选商品时该条规则暂不生效</p>
      ${renderDialogLineTable(byLine)}
    </div>`;
}

function emptyStateHtml(): string {
  return `<p class="m-0 rounded-md border border-dashed border-border/70 bg-muted/10 px-3 py-6 text-center text-sm text-muted-foreground">暂无加收规则，请点击「添加加收规则」配置</p>`;
}

export function renderHotpotHalfSurchargeEditorHtml(): string {
  const rules = readHotpotHalfSurchargeRules();
  const rows =
    rules.length > 0 ? rules.map((rule) => renderRuleRow(rule)).join("") : emptyStateHtml();
  return `
    <div
      class="space-y-3"
      data-hotpot-half-surcharge-editor
      data-storage-id="${escapeHtml(RULES_STORAGE_ID)}"
    >
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="${BTN_PRIMARY}" data-hotpot-half-surcharge-add>添加加收规则</button>
      </div>
      <div class="space-y-3" data-hotpot-half-surcharge-rule-list>${rows}</div>
      ${renderSettingsDialog()}
      ${renderDishPickDialog()}
      ${renderBasesViewDialog()}
      ${renderDeleteConfirmDialog()}
    </div>`;
}

export function renderHotpotHalfSurchargePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-hotpot-half-surcharge-panel="${HOTPOT_HALF_SURCHARGE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderHotpotHalfSurchargeEditorHtml()}
    </div>`;
}

export function setHotpotHalfSurchargePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-hotpot-half-surcharge-panel="${HOTPOT_HALF_SURCHARGE_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button").forEach((el) => {
        el.disabled = !visible;
      });
      if (!visible) {
        closeSettingsDialog(panel);
        closeDishPickDialog(panel);
        closeBasesViewDialog(panel);
        closeDeleteConfirmDialog(panel);
      }
    });
}

function showDialog(dialog: HTMLElement): void {
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideDialog(dialog: HTMLElement): void {
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-editing-id", "");
  dialog.setAttribute("data-draft-by-line", "");
}

function rerenderRuleList(editor: HTMLElement): void {
  const list = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-rule-list]");
  if (!list) return;
  const rules = readHotpotHalfSurchargeRules();
  list.innerHTML =
    rules.length > 0 ? rules.map((rule) => renderRuleRow(rule)).join("") : emptyStateHtml();
}

function readDraftByLine(dialog: HTMLElement): BrandMenuStructureByLine {
  const raw = dialog.getAttribute("data-draft-by-line") || "";
  if (!raw) return emptyBrandMenuStructureByLine();
  try {
    return normalizeBrandMenuStructureByLine(JSON.parse(raw) as unknown);
  } catch {
    return emptyBrandMenuStructureByLine();
  }
}

function writeDraftByLine(dialog: HTMLElement, byLine: BrandMenuStructureByLine): void {
  dialog.setAttribute(
    "data-draft-by-line",
    JSON.stringify(normalizeBrandMenuStructureByLine(byLine)),
  );
}

function refreshLinePickSummary(
  dialog: HTMLElement,
  lineId: HotpotHalfSurchargeProductLineId,
  byLine: BrandMenuStructureByLine,
): void {
  const keys = byLine[lineId as BrandMenuLineId] ?? [];
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";
  dialog
    .querySelectorAll<HTMLElement>(`[data-hotpot-half-surcharge-pick-summary="${lineId}"]`)
    .forEach((el) => {
      el.textContent = summary;
    });
  dialog
    .querySelectorAll<HTMLElement>(`[data-hotpot-half-surcharge-pick-count="${lineId}"]`)
    .forEach((el) => {
      el.textContent = countLabel;
    });
}

function openSettingsDialog(editor: HTMLElement, editingId: string | null): void {
  const dialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dialog-body]");
  if (!dialog || !body) return;

  const rules = readHotpotHalfSurchargeRules();
  const editing = editingId ? rules.find((r) => r.id === editingId) ?? null : null;
  dialog.setAttribute("data-editing-id", editing?.id ?? "");
  writeDraftByLine(dialog, editing?.structureByLine ?? emptyBrandMenuStructureByLine());
  body.innerHTML = renderDialogBody(editing);
  showDialog(dialog);
  body.querySelector<HTMLInputElement>("[data-hotpot-half-surcharge-dialog-amount]")?.focus();
}

function closeSettingsDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dialog]");
  if (dialog) hideDialog(dialog);
  closeDishPickDialog(host);
}

function openDishPickDialog(editor: HTMLElement, lineId: HotpotHalfSurchargeProductLineId): void {
  const settingsDialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dialog]");
  const dialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dish-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dish-dialog-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#hotpot-half-surcharge-dish-dialog-title");
  if (!settingsDialog || !dialog || !body) return;

  const byLine = readDraftByLine(settingsDialog);
  const keys = byLine[lineId as BrandMenuLineId] ?? [];
  const lineLabel =
    HOTPOT_HALF_SURCHARGE_PRODUCT_LINES.find((l) => l.id === lineId)?.label ?? lineId;
  dialog.setAttribute("data-line-id", lineId);
  if (titleEl) titleEl.textContent = `选择商品 · ${lineLabel}`;

  const treeLineId = isBrandMenuLineId(lineId) ? (lineId as BrandMenuLineId) : undefined;
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐展示菜详情）</p>
    ${renderBrandMenuStructurePickerHtml(keys, undefined, undefined, { treeLineId })}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDialog(dialog);
}

function closeDishPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dish-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dish-dialog-body]");
  if (body) {
    body.innerHTML =
      `<p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐展示菜详情）</p>`;
  }
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
    dialog.setAttribute("data-line-id", "");
  }
}

function saveDishPickDialog(editor: HTMLElement): void {
  const settingsDialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dialog]");
  const dialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dish-dialog]");
  const picker = dialog?.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  const lineId = dialog?.getAttribute("data-line-id") as HotpotHalfSurchargeProductLineId | null;
  if (!settingsDialog || !dialog || !picker || !lineId || !ALL_LINE_IDS.includes(lineId)) return;

  const keys = readBrandMenuStructureKeysFromPicker(picker);
  const byLine = readDraftByLine(settingsDialog);
  byLine[lineId as BrandMenuLineId] = keys;
  writeDraftByLine(settingsDialog, byLine);
  refreshLinePickSummary(settingsDialog, lineId, byLine);
  closeDishPickDialog(editor);
}

function openBasesViewDialog(editor: HTMLElement, ruleId: string): void {
  const rule = readHotpotHalfSurchargeRules().find((r) => r.id === ruleId);
  if (!rule) return;
  const dialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-bases-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-hotpot-half-surcharge-bases-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#hotpot-half-surcharge-bases-dialog-title");
  if (!dialog || !body) return;
  if (titleEl) {
    titleEl.textContent = `适用锅底 · 额外加收 $${formatAmount(rule.surchargeAmount)}`;
  }
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">查看本条规则已选商品（只读，按产线 · 组 / 类 / 菜）</p>
    <p class="m-0 text-sm text-foreground">${escapeHtml(scopedSummary(rule.structureByLine))}</p>
    ${renderDialogLineTable(rule.structureByLine)}`;
  body
    .querySelectorAll<HTMLButtonElement>("[data-hotpot-half-surcharge-pick-dishes]")
    .forEach((btn) => {
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    });
  showDialog(dialog);
}

function closeBasesViewDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-hotpot-half-surcharge-bases-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-hotpot-half-surcharge-bases-body]");
  if (body) body.innerHTML = "";
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
  }
}

function saveSettingsDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-dialog]");
  if (!dialog) return;
  const amountInput = dialog.querySelector<HTMLInputElement>(
    "[data-hotpot-half-surcharge-dialog-amount]",
  );
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const nextRule: HotpotHalfSurchargeRule = {
    id: editingId || newRuleId(),
    surchargeAmount: normalizeAmount(amountInput?.value),
    structureByLine: readDraftByLine(dialog),
  };
  const rules = readHotpotHalfSurchargeRules();
  const idx = editingId ? rules.findIndex((r) => r.id === editingId) : -1;
  if (idx >= 0) rules[idx] = nextRule;
  else rules.push(nextRule);
  writeHotpotHalfSurchargeRules(rules);
  hideDialog(dialog);
  closeDishPickDialog(editor);
  rerenderRuleList(editor);
}

function removeRule(editor: HTMLElement, ruleId: string): void {
  writeHotpotHalfSurchargeRules(readHotpotHalfSurchargeRules().filter((r) => r.id !== ruleId));
  rerenderRuleList(editor);
}

function openDeleteConfirmDialog(editor: HTMLElement, ruleId: string): void {
  const rule = readHotpotHalfSurchargeRules().find((r) => r.id === ruleId);
  const dialog = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-delete-dialog]");
  const idInput = editor.querySelector<HTMLInputElement>(
    "[data-hotpot-half-surcharge-delete-target-id]",
  );
  const messageEl = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-delete-message]");
  if (!dialog || !idInput || !messageEl) return;
  idInput.value = ruleId;
  const amount = rule ? formatAmount(rule.surchargeAmount) : formatAmount(AMOUNT_DEFAULT);
  messageEl.textContent = `确定删除「额外加收 $${amount}」这条规则？删除后无法恢复。`;
  showDialog(dialog);
}

function closeDeleteConfirmDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-hotpot-half-surcharge-delete-dialog]");
  const idInput = host.querySelector<HTMLInputElement>(
    "[data-hotpot-half-surcharge-delete-target-id]",
  );
  if (idInput) idInput.value = "";
  if (dialog) {
    dialog.classList.add("hidden");
    dialog.classList.remove("flex");
  }
}

function confirmDeleteRule(editor: HTMLElement): void {
  const ruleId = editor
    .querySelector<HTMLInputElement>("[data-hotpot-half-surcharge-delete-target-id]")
    ?.value.trim();
  if (!ruleId) return;
  removeRule(editor, ruleId);
  closeDeleteConfirmDialog(editor);
}

function bindHotpotHalfSurchargeEditor(editor: HTMLElement): void {
  if (editor.dataset.hotpotHalfSurchargeEditorBound === "1") return;
  editor.dataset.hotpotHalfSurchargeEditorBound = "1";

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-hotpot-half-surcharge-dialog-close]") ||
      target.closest("[data-hotpot-half-surcharge-dialog-cancel]") ||
      target.closest("[data-hotpot-half-surcharge-dialog-backdrop]")
    ) {
      closeSettingsDialog(editor);
      return;
    }
    if (
      target.closest("[data-hotpot-half-surcharge-dish-dialog-close]") ||
      target.closest("[data-hotpot-half-surcharge-dish-dialog-cancel]") ||
      target.closest("[data-hotpot-half-surcharge-dish-dialog-backdrop]")
    ) {
      closeDishPickDialog(editor);
      return;
    }
    if (target.closest("[data-hotpot-half-surcharge-dish-dialog-save]")) {
      saveDishPickDialog(editor);
      return;
    }
    if (
      target.closest("[data-hotpot-half-surcharge-bases-close]") ||
      target.closest("[data-hotpot-half-surcharge-bases-backdrop]")
    ) {
      closeBasesViewDialog(editor);
      return;
    }
    if (
      target.closest("[data-hotpot-half-surcharge-delete-cancel]") ||
      target.closest("[data-hotpot-half-surcharge-delete-backdrop]")
    ) {
      closeDeleteConfirmDialog(editor);
      return;
    }
    if (target.closest("[data-hotpot-half-surcharge-delete-confirm]")) {
      confirmDeleteRule(editor);
      return;
    }
    if (target.closest("[data-hotpot-half-surcharge-dialog-save]")) {
      saveSettingsDialog(editor);
      return;
    }
    if (target.closest("[data-hotpot-half-surcharge-add]")) {
      openSettingsDialog(editor, null);
      return;
    }
    const pickBtn = target.closest<HTMLButtonElement>("[data-hotpot-half-surcharge-pick-dishes]");
    if (pickBtn && !pickBtn.disabled) {
      const lineId = pickBtn.getAttribute(
        "data-line-id",
      ) as HotpotHalfSurchargeProductLineId | null;
      if (lineId && ALL_LINE_IDS.includes(lineId)) openDishPickDialog(editor, lineId);
      return;
    }
    const basesView = target.closest("[data-hotpot-half-surcharge-bases-view]");
    if (basesView) {
      const row = basesView.closest("[data-hotpot-half-surcharge-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openBasesViewDialog(editor, ruleId);
      return;
    }
    const editBtn = target.closest("[data-hotpot-half-surcharge-edit]");
    if (editBtn) {
      const row = editBtn.closest("[data-hotpot-half-surcharge-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openSettingsDialog(editor, ruleId);
      return;
    }
    const removeBtn = target.closest("[data-hotpot-half-surcharge-remove]");
    if (removeBtn) {
      const row = removeBtn.closest("[data-hotpot-half-surcharge-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) openDeleteConfirmDialog(editor, ruleId);
    }
  });
}

export function bindHotpotHalfSurchargeUi(root: ParentNode = document): void {
  ensureHotpotHalfSurchargeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-hotpot-half-surcharge-editor]").forEach((editor) => {
    bindHotpotHalfSurchargeEditor(editor);
  });
}
