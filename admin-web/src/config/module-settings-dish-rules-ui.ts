/**
 * 设置滑层：每轮菜品互斥 / 组合规则（原型，localStorage JSON）。
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_LINE_OPTIONS,
  BRAND_MENU_STRUCTURE_BY_LINE,
  countBrandMenuStructureDishesByLine,
  dishKey,
  emptyBrandMenuStructureByLine,
  formatBrandMenuStructureByLineSummary,
  normalizeBrandMenuStructureByLine,
  readBrandMenuStructureByLineFromPicker,
  renderBrandMenuStructurePickerHtml,
  type BrandMenuStructureByLine,
} from "./brand-menu-structure-picker-ui";
import { renderModuleSettingCheckboxChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { writeModuleSettingToggleOn } from "./module-settings-toggle-ui";
import { openConfirmDialog } from "../ui/app-confirm-dialog";

export type DishTag = { id: string; name: string };

export type DishRuleStatus = "active" | "disabled";

export type DishMutexRule = {
  id: string;
  name: string;
  status: DishRuleStatus;
  trigger: BrandMenuStructureByLine;
  excluded: BrandMenuStructureByLine;
};

export type DishComboRule = {
  id: string;
  name: string;
  status: DishRuleStatus;
  trigger: BrandMenuStructureByLine;
  requiredQty: number;
  required: BrandMenuStructureByLine;
};

/** 原型菜品库（后续对接商品 API） */
export const MODULE_SETTING_MOCK_DISHES: DishTag[] = [
  { id: "d-beef-premium", name: "极品肥牛133333" },
  { id: "d-pork-belly", name: "五花肉" },
  { id: "d-combo-1", name: "牛羊组合" },
  { id: "d-combo-2", name: "牛羊组合-1" },
  { id: "d-pot-single", name: "单锅" },
  { id: "d-pot-yinyang", name: "鸳鸯锅" },
  { id: "d-pot-run", name: "奔跑锅" },
  { id: "d-pot-any", name: "任意锅" },
];

const MUTEX_STORAGE_597 = "597-mutex-rules";
const COMBO_STORAGE_598 = "598-combo-rules";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function newRuleId(): string {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 旧版扁平 DishTag[] → 产线 + 组类菜 keys（命中各产线树中同 id 菜品） */
function dishTagsToStructureByLine(tags: DishTag[]): BrandMenuStructureByLine {
  const byLine = emptyBrandMenuStructureByLine();
  if (!Array.isArray(tags) || tags.length === 0) return byLine;
  for (const line of BRAND_MENU_LINE_OPTIONS) {
    const keys: string[] = [];
    const tree = BRAND_MENU_STRUCTURE_BY_LINE[line.id];
    for (const tag of tags) {
      if (!tag?.id) continue;
      for (const group of tree) {
        for (const cat of group.categories) {
          for (const dish of cat.dishes) {
            if (dish.id === tag.id || dish.id === tag.id.replace(/133333$/, "")) {
              keys.push(dishKey(group.id, cat.id, dish.id));
            }
          }
        }
      }
    }
    byLine[line.id] = [...new Set(keys)];
  }
  return byLine;
}

function normalizeRuleStructureField(raw: unknown): BrandMenuStructureByLine {
  if (Array.isArray(raw)) {
    if (raw.length === 0) return emptyBrandMenuStructureByLine();
    if (typeof raw[0] === "object" && raw[0] != null && "id" in (raw[0] as object)) {
      return dishTagsToStructureByLine(raw as DishTag[]);
    }
  }
  return normalizeBrandMenuStructureByLine(raw);
}

function normalizeRuleName(raw: unknown, fallback = ""): string {
  if (typeof raw !== "string") return fallback;
  return raw.trim();
}

function normalizeRuleStatus(raw: unknown): DishRuleStatus {
  return raw === "disabled" ? "disabled" : "active";
}

const RULE_NAME_INPUT_CLASS =
  "h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function renderRuleNameField(name: string, placeholder: string): string {
  return `
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-foreground" for="dish-round-rule-name">规则名称</label>
      <input
        id="dish-round-rule-name"
        type="text"
        class="${RULE_NAME_INPUT_CLASS}"
        data-dish-round-rule-name
        value="${escapeHtml(name)}"
        placeholder="${escapeHtml(placeholder)}"
        maxlength="64"
        autocomplete="off"
      />
    </div>`;
}

function readDraftRuleName(draft: HTMLElement): string {
  const input = draft.querySelector<HTMLInputElement>("[data-dish-round-rule-name]");
  return (input?.value ?? "").trim();
}

export function readDishMutexRules(storageFieldId = MUTEX_STORAGE_597): DishMutexRule[] {
  const raw = readModuleSettingJson<DishMutexRule[] | null>(storageFieldId, null);
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({
    id: r.id || newRuleId(),
    name: normalizeRuleName((r as { name?: unknown }).name),
    status: normalizeRuleStatus((r as { status?: unknown }).status),
    trigger: normalizeRuleStructureField(r.trigger),
    excluded: normalizeRuleStructureField(r.excluded),
  }));
}

export function writeDishMutexRules(rules: DishMutexRule[], storageFieldId = MUTEX_STORAGE_597): void {
  writeModuleSettingJson(storageFieldId, rules);
}

export function readDishComboRules(storageFieldId = COMBO_STORAGE_598): DishComboRule[] {
  const raw = readModuleSettingJson<DishComboRule[] | null>(storageFieldId, null);
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({
    id: r.id || newRuleId(),
    name: normalizeRuleName((r as { name?: unknown }).name),
    status: normalizeRuleStatus((r as { status?: unknown }).status),
    trigger: normalizeRuleStructureField(r.trigger),
    requiredQty: Number.isFinite(Number(r.requiredQty)) ? Math.max(1, Number(r.requiredQty)) : 1,
    required: normalizeRuleStructureField(r.required),
  }));
}

export function writeDishComboRules(rules: DishComboRule[], storageFieldId = COMBO_STORAGE_598): void {
  writeModuleSettingJson(storageFieldId, rules);
}

function renderDishTag(tag: DishTag): string {
  return `
    <span
      data-dish-tag
      data-dish-id="${escapeHtml(tag.id)}"
      data-dish-name="${escapeHtml(tag.name)}"
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/80 px-2 py-0.5 text-xs text-foreground"
    >
      <span class="truncate">${escapeHtml(tag.name)}</span>
      <button
        type="button"
        class="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
        data-dish-tag-remove
        aria-label="移除 ${escapeHtml(tag.name)}"
      >×</button>
    </span>`;
}

export function readDishTags(storageFieldId: string): DishTag[] {
  const raw = readModuleSettingJson<DishTag[]>(storageFieldId, []);
  return Array.isArray(raw) ? raw.filter((t) => t?.id && t?.name) : [];
}

export function writeDishTags(storageFieldId: string, tags: DishTag[]): void {
  writeModuleSettingJson(storageFieldId, tags);
}

export function renderDishPicker(
  parentSeq: number,
  ruleId: string,
  role: string,
  dishes: DishTag[],
  pickerUi: "checkbox" | "select" = "checkbox",
  choiceLayout: "wrap" | "grid" = "wrap",
): string {
  if (pickerUi === "select") {
    return renderDishSelectPicker(parentSeq, ruleId, role, dishes);
  }
  const selectedIds = new Set(dishes.map((d) => d.id));
  const tags =
    dishes.length > 0
      ? `<div class="flex flex-wrap gap-1.5" data-dish-tags>${dishes.map(renderDishTag).join("")}</div>`
      : "";
  const choices = renderModuleSettingCheckboxChoiceHtml({
    options: MODULE_SETTING_MOCK_DISHES.map((d) => ({ value: d.id, label: d.name })),
    selectedValues: selectedIds,
    checkboxDataAttr: "data-dish-choice",
    getItemAttrs: (value, label) => ({
      "data-dish-id": value,
      "data-dish-name": label,
    }),
    layout: choiceLayout,
  });
  return `
    <div
      class="module-setting-dish-picker min-w-0 w-full space-y-2 rounded-md border border-input bg-background px-3 py-2.5"
      data-dish-picker
      data-picker-role="${escapeHtml(role)}"
      data-parent-seq="${parentSeq}"
      data-rule-id="${escapeHtml(ruleId)}"
    >
      ${tags}
      ${choices}
    </div>`;
}

function renderDishSelectPicker(
  parentSeq: number,
  ruleId: string,
  role: string,
  dishes: DishTag[],
): string {
  const selectedIds = new Set(dishes.map((d) => d.id));
  const tags =
    dishes.length > 0
      ? `<div class="flex flex-wrap gap-1.5" data-dish-tags>${dishes.map(renderDishTag).join("")}</div>`
      : "";
  const available = MODULE_SETTING_MOCK_DISHES.filter((d) => !selectedIds.has(d.id));
  const options = available
    .map(
      (d) =>
        `<option value="${escapeHtml(d.id)}" data-dish-name="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`,
    )
    .join("");
  return `
    <div
      class="module-setting-dish-picker min-w-0 flex-1 space-y-2 rounded-md border border-input bg-background px-2 py-2"
      data-dish-picker
      data-picker-ui="select"
      data-picker-role="${escapeHtml(role)}"
      data-parent-seq="${parentSeq}"
      data-rule-id="${escapeHtml(ruleId)}"
    >
      ${tags}
      <div class="flex min-w-0 items-center gap-2">
        <select
          class="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          data-dish-select
          aria-label="选择商品"
          ${available.length === 0 ? "disabled" : ""}
        >
          <option value="">${available.length === 0 ? "已选全部可选商品" : "请选择商品"}</option>
          ${options}
        </select>
      </div>
    </div>`;
}

function refreshDishSelectOptions(picker: HTMLElement): void {
  const select = picker.querySelector<HTMLSelectElement>("[data-dish-select]");
  if (!select) return;
  const selectedIds = new Set(collectTagsFromPicker(picker).map((t) => t.id));
  const available = MODULE_SETTING_MOCK_DISHES.filter((d) => !selectedIds.has(d.id));
  select.innerHTML =
    `<option value="">${available.length === 0 ? "已选全部可选商品" : "请选择商品"}</option>` +
    available
      .map(
        (d) =>
          `<option value="${escapeHtml(d.id)}" data-dish-name="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`,
      )
      .join("");
  select.disabled = available.length === 0;
  select.value = "";
}

export function onDishSelectChange(picker: HTMLElement, select: HTMLSelectElement): void {
  const dishId = select.value;
  if (!dishId) return;
  const dish = MODULE_SETTING_MOCK_DISHES.find((d) => d.id === dishId);
  if (!dish) return;
  const existing = collectTagsFromPicker(picker);
  if (existing.some((t) => t.id === dishId)) {
    select.value = "";
    return;
  }
  let tagsWrap = picker.querySelector<HTMLElement>("[data-dish-tags]");
  if (!tagsWrap) {
    picker.insertAdjacentHTML(
      "afterbegin",
      `<div class="flex flex-wrap gap-1.5" data-dish-tags></div>`,
    );
    tagsWrap = picker.querySelector<HTMLElement>("[data-dish-tags]");
  }
  tagsWrap?.insertAdjacentHTML("beforeend", renderDishTag(dish));
  refreshDishSelectOptions(picker);
  const standalone = picker.closest<HTMLElement>("[data-standalone-dish-picker]");
  if (standalone) {
    persistStandaloneDishPicker(picker);
    return;
  }
  const mutex = picker.closest<HTMLElement>("[data-mutex-rules-editor]");
  if (mutex) {
    persistMutexEditor(mutex);
    return;
  }
  const combo = picker.closest<HTMLElement>("[data-combo-rules-editor]");
  if (combo) persistComboEditor(combo);
  const delayed = picker.closest<HTMLElement>("[data-delayed-kitchen-send-editor]");
  if (delayed) {
    delayed.dispatchEvent(new CustomEvent("delayed-kitchen-send-update", { bubbles: false }));
  }
}

function ruleStructureCountLabel(byLine: BrandMenuStructureByLine): string {
  const dishCount = countBrandMenuStructureDishesByLine(byLine);
  return dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";
}

function readRuleStructureFromField(field: HTMLElement): BrandMenuStructureByLine {
  try {
    const raw = field.getAttribute("data-selection-json");
    return normalizeBrandMenuStructureByLine(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyBrandMenuStructureByLine();
  }
}

function writeRuleStructureToField(field: HTMLElement, byLine: BrandMenuStructureByLine): void {
  field.setAttribute("data-selection-json", JSON.stringify(byLine));
  const summaryEl = field.querySelector<HTMLElement>("[data-menu-structure-pick-summary]");
  const countEl = field.querySelector<HTMLElement>("[data-menu-structure-pick-count]");
  if (summaryEl) summaryEl.textContent = formatBrandMenuStructureByLineSummary(byLine);
  if (countEl) countEl.textContent = ruleStructureCountLabel(byLine);
}

/** 规则内「产线 + 组/类/菜」选品（弹窗） */
function renderRuleMenuStructureField(
  role: string,
  byLine: BrandMenuStructureByLine,
  dialogTitle: string,
): string {
  const summary = formatBrandMenuStructureByLineSummary(byLine);
  const countLabel = ruleStructureCountLabel(byLine);
  return `
    <div
      class="space-y-1.5"
      data-rule-menu-structure-field
      data-picker-role="${escapeHtml(role)}"
      data-selection-json="${escapeHtml(JSON.stringify(byLine))}"
    >
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="${BTN_MENU_STRUCTURE_ADD}" data-menu-structure-pick-open>选择商品</button>
        <span class="text-xs text-muted-foreground" data-menu-structure-pick-count>${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground" data-menu-structure-pick-summary>${escapeHtml(summary)}</p>
      ${renderMenuStructurePickDialog(dialogTitle)}
    </div>`;
}

function openRuleMenuStructurePickDialog(field: HTMLElement): void {
  const dialog = field.querySelector<HTMLElement>("[data-menu-structure-pick-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-menu-structure-pick-body]");
  if (!dialog || !body) return;
  const byLine = readRuleStructureFromField(field);
  body.innerHTML = renderBrandMenuStructurePickerHtml([], undefined, undefined, {
    enableLines: true,
    selectionByLine: byLine,
  });
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showMenuStructurePickDialog(dialog);
}

function saveRuleMenuStructurePickDialog(field: HTMLElement): void {
  const dialog = field.querySelector<HTMLElement>("[data-menu-structure-pick-dialog]");
  if (!dialog) return;
  const picker = dialog.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  const byLine = picker
    ? readBrandMenuStructureByLineFromPicker(picker)
    : emptyBrandMenuStructureByLine();
  writeRuleStructureToField(field, byLine);
  hideMenuStructurePickDialog(dialog);

  const mutex = field.closest<HTMLElement>("[data-mutex-rules-editor]");
  if (mutex) {
    persistMutexEditor(mutex);
    return;
  }
  const combo = field.closest<HTMLElement>("[data-combo-rules-editor]");
  if (combo) persistComboEditor(combo);
}

function handleRuleMenuStructureFieldClick(target: HTMLElement): boolean {
  const field = target.closest<HTMLElement>("[data-rule-menu-structure-field]");
  if (!field) return false;
  if (target.closest("[data-menu-structure-pick-open]")) {
    openRuleMenuStructurePickDialog(field);
    return true;
  }
  if (
    target.closest("[data-menu-structure-pick-close]") ||
    target.closest("[data-menu-structure-pick-cancel]") ||
    target.closest("[data-menu-structure-pick-backdrop]")
  ) {
    const dialog = field.querySelector<HTMLElement>("[data-menu-structure-pick-dialog]");
    if (dialog) hideMenuStructurePickDialog(dialog);
    return true;
  }
  if (target.closest("[data-menu-structure-pick-save]")) {
    saveRuleMenuStructurePickDialog(field);
    return true;
  }
  return false;
}

function renderMutexRuleRow(rule: DishMutexRule, _parentSeq: number): string {
  const title = rule.name.trim() || "互斥规则";
  return `
    <div
      class="space-y-3 rounded-md border border-border/60 bg-background/60 p-3"
      data-mutex-rule-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex items-start justify-between gap-2">
        <span class="text-sm font-medium text-foreground">${escapeHtml(title)}</span>
        <button type="button" class="text-xs text-muted-foreground hover:text-destructive" data-mutex-remove-rule>删除</button>
      </div>
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">下单菜品</span>
        ${renderRuleMenuStructureField("trigger", rule.trigger, "选择下单菜品")}
      </div>
      <div class="flex items-center gap-2 text-sm text-muted-foreground" aria-hidden="true">
        <span class="h-px min-w-3 flex-1 bg-border"></span>
        <span class="shrink-0 font-medium text-foreground">互斥</span>
        <span class="h-px min-w-3 flex-1 bg-border"></span>
      </div>
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">不可再下单菜品</span>
        ${renderRuleMenuStructureField("excluded", rule.excluded, "选择不可再下单菜品")}
      </div>
    </div>`;
}

function renderComboRuleRow(rule: DishComboRule, _parentSeq: number): string {
  const qty = rule.requiredQty;
  const title = rule.name.trim() || "组合规则";
  return `
    <div class="space-y-3 rounded-md border border-border/60 bg-background/60 p-3" data-combo-rule-row data-rule-id="${escapeHtml(rule.id)}">
      <div class="flex items-start justify-between gap-2">
        <span class="text-sm font-medium text-foreground">${escapeHtml(title)}</span>
        <button type="button" class="text-xs text-muted-foreground hover:text-destructive" data-combo-remove-rule>删除</button>
      </div>
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">下单菜品</span>
        ${renderRuleMenuStructureField("trigger", rule.trigger, "选择下单菜品")}
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span>订单中必须再包含任意菜品</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          class="w-14 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${qty}"
          data-combo-qty
          aria-label="份数"
        />
        <span>份</span>
      </div>
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">必选菜品</span>
        ${renderRuleMenuStructureField("required", rule.required, "选择必选菜品")}
      </div>
    </div>`;
}

function renderAddRuleButton(attr: string, label: string): string {
  return `
    <div class="flex justify-end">
      <button type="button" class="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted" ${attr}>${escapeHtml(label)}</button>
    </div>`;
}

export function renderDishMutexRulesHtml(parentSeq: number, storageFieldId: string): string {
  const rules = readDishMutexRules(storageFieldId);
  const rows = rules.map((rule) => renderMutexRuleRow(rule, parentSeq)).join("");
  return `
    <div
      class="space-y-4"
      data-mutex-rules-editor
      data-storage-id="${escapeHtml(storageFieldId)}"
      data-parent-seq="${parentSeq}"
    >
      ${rows || `<p class="m-0 text-sm text-muted-foreground">暂无互斥规则，请点击下方「新增规则」添加。</p>`}
      ${renderAddRuleButton("data-mutex-add-rule", "新增规则")}
    </div>`;
}

export function renderDishComboRulesHtml(parentSeq: number, storageFieldId: string): string {
  const rules = readDishComboRules(storageFieldId);
  const rows = rules.map((rule) => renderComboRuleRow(rule, parentSeq)).join("");
  return `
    <div class="space-y-3" data-combo-rules-editor data-storage-id="${escapeHtml(storageFieldId)}" data-parent-seq="${parentSeq}">
      ${rows || `<p class="m-0 text-sm text-muted-foreground">暂无组合规则，请点击下方「新增规则」添加。</p>`}
      ${renderAddRuleButton("data-combo-add-rule", "新增规则")}
    </div>`;
}

/* ─── 每轮菜品互斥/组合：统一列表 + 两步新增引导 ─── */

export type DishRoundRuleKind = "mutex" | "combo";

type DishRoundListItem =
  | { kind: "mutex"; rule: DishMutexRule }
  | { kind: "combo"; rule: DishComboRule };

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50";
const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";
const BTN_TABLE_OP =
  "inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted";
const BTN_TABLE_OP_DANGER =
  "inline-flex h-8 items-center justify-center rounded-md border border-destructive/30 bg-background px-2.5 text-xs font-medium text-destructive shadow-sm hover:bg-destructive/10";

function readDishRoundListItems(
  mutexStorageId: string,
  comboStorageId: string,
): DishRoundListItem[] {
  return [
    ...readDishMutexRules(mutexStorageId).map((rule) => ({ kind: "mutex" as const, rule })),
    ...readDishComboRules(comboStorageId).map((rule) => ({ kind: "combo" as const, rule })),
  ];
}

function renderDishRoundStatusBadge(status: DishRuleStatus): string {
  return status === "active"
    ? `<span class="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">启用</span>`
    : `<span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">禁用</span>`;
}

function renderDishRoundListTable(items: DishRoundListItem[]): string {
  const countBadge = `<span class="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary" data-dish-round-rule-count>共 ${items.length} 条</span>`;
  if (items.length === 0) {
    return `
      <div class="overflow-hidden rounded-xl border border-border bg-card">
        <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="flex items-center gap-2">
            <h3 class="m-0 text-sm font-semibold text-card-foreground">现有规则</h3>
            ${countBadge}
          </div>
        </div>
        <div class="px-4 py-10 text-center text-sm text-muted-foreground">暂无规则</div>
      </div>`;
  }

  const rows = items
    .map((item) => {
      const kindLabel = item.kind === "mutex" ? "商品互斥下单" : "商品组合下单";
      const title = item.rule.name.trim() || kindLabel;
      const triggerSummary = formatBrandMenuStructureByLineSummary(item.rule.trigger);
      const relatedSummary =
        item.kind === "mutex"
          ? `互斥：${formatBrandMenuStructureByLineSummary(item.rule.excluded)}`
          : `必选 ${item.rule.requiredQty} 份：${formatBrandMenuStructureByLineSummary(item.rule.required)}`;
      const toggleLabel = item.rule.status === "active" ? "禁用" : "启用";
      return `
        <tr
          class="border-t border-border"
          data-dish-round-list-item
          data-rule-kind="${item.kind}"
          data-rule-id="${escapeHtml(item.rule.id)}"
        >
          <td class="px-4 py-3 align-top">
            <div class="text-sm font-semibold text-foreground">${escapeHtml(title)}</div>
          </td>
          <td class="px-4 py-3 align-top text-sm text-muted-foreground">${escapeHtml(kindLabel)}</td>
          <td class="max-w-[14rem] px-4 py-3 align-top text-xs leading-relaxed text-muted-foreground">${escapeHtml(triggerSummary)}</td>
          <td class="max-w-[16rem] px-4 py-3 align-top text-xs leading-relaxed text-muted-foreground">${escapeHtml(relatedSummary)}</td>
          <td class="px-4 py-3 align-top">${renderDishRoundStatusBadge(item.rule.status)}</td>
          <td class="px-4 py-3 align-top">
            <div class="flex flex-wrap gap-1.5">
              <button type="button" class="${BTN_TABLE_OP}" data-rule-action="edit">编辑</button>
              <button type="button" class="${BTN_TABLE_OP}" data-rule-action="copy">复制</button>
              <button type="button" class="${BTN_TABLE_OP}" data-rule-action="toggle">${toggleLabel}</button>
              <button type="button" class="${BTN_TABLE_OP_DANGER}" data-rule-action="delete">删除</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <div class="overflow-hidden rounded-xl border border-border bg-card">
      <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div class="flex items-center gap-2">
          <h3 class="m-0 text-sm font-semibold text-card-foreground">现有规则</h3>
          ${countBadge}
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[52rem] border-collapse text-left">
          <thead class="bg-muted/40">
            <tr>
              <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground">规则名称</th>
              <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground">类型</th>
              <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground">下单菜品</th>
              <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground">关联限制</th>
              <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground">状态</th>
              <th class="px-4 py-2.5 text-xs font-semibold text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderDishRoundWizardStepIndicator(step: 1 | 2): string {
  const step1Class = step === 1 ? "text-primary" : "text-muted-foreground";
  const step2Class = step === 2 ? "text-primary" : "text-muted-foreground";
  return `
    <div class="flex items-center gap-2 text-xs font-medium" data-dish-round-wizard-steps aria-hidden="true">
      <span class="${step1Class}" data-dish-round-wizard-step-label="1">1. 选择规则类型</span>
      <span class="text-muted-foreground">/</span>
      <span class="${step2Class}" data-dish-round-wizard-step-label="2">2. 配置规则</span>
    </div>`;
}

function renderDishRoundWizardStep1(selectedKind: DishRoundRuleKind | ""): string {
  const mutexSelected = selectedKind === "mutex";
  const comboSelected = selectedKind === "combo";
  const cardBase =
    "flex w-full cursor-pointer flex-col gap-1 rounded-lg border p-4 text-left transition-colors";
  const cardOn = "border-primary bg-primary/5 ring-1 ring-primary/30";
  const cardOff = "border-border bg-background hover:border-primary/40 hover:bg-muted/40";
  return `
    <div class="space-y-3" data-dish-round-wizard-step="1">
      <p class="m-0 text-sm text-muted-foreground">请选择要新增的规则类型：</p>
      <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="规则类型">
        <button
          type="button"
          role="radio"
          aria-checked="${mutexSelected ? "true" : "false"}"
          class="${cardBase} ${mutexSelected ? cardOn : cardOff}"
          data-dish-round-kind-option="mutex"
        >
          <span class="text-sm font-semibold text-foreground">商品互斥下单规则</span>
          <span class="text-xs leading-relaxed text-muted-foreground">同一轮下单中：已点「下单菜品」后，不可再点「不可再下单菜品」。</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked="${comboSelected ? "true" : "false"}"
          class="${cardBase} ${comboSelected ? cardOn : cardOff}"
          data-dish-round-kind-option="combo"
        >
          <span class="text-sm font-semibold text-foreground">商品组合下单规则</span>
          <span class="text-xs leading-relaxed text-muted-foreground">同一轮下单中：点了「下单菜品」后，订单须再包含指定数量的必选菜品。</span>
        </button>
      </div>
    </div>`;
}

function renderDishRoundWizardStep2Body(kind: DishRoundRuleKind, draftHtml: string): string {
  const title =
    kind === "mutex" ? "" : `<p class="m-0 text-sm font-medium text-foreground">配置商品组合下单规则</p>`;
  return `
    <div class="space-y-3" data-dish-round-wizard-step="2">
      ${title}
      <div class="space-y-3 rounded-lg border border-border bg-muted/20 p-3" data-dish-round-wizard-config>
        ${draftHtml}
      </div>
    </div>`;
}

/** 规则配置步骤内联「产线 + 组/类/菜」选品（无需再点「选择商品」弹窗） */
function renderInlineRuleMenuStructureField(
  role: string,
  byLine: BrandMenuStructureByLine,
  fieldTitle: string,
): string {
  const count = countBrandMenuStructureDishesByLine(byLine);
  const countLabel = count > 0 ? `已选 ${count} 道菜` : "未选择商品";
  return `
    <div
      class="space-y-2"
      data-rule-menu-structure-field
      data-rule-menu-structure-inline="1"
      data-picker-role="${escapeHtml(role)}"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <span class="text-sm font-medium text-foreground">
          ${escapeHtml(fieldTitle)}
          <span class="text-destructive" aria-hidden="true">*</span>
        </span>
        <span class="text-xs text-muted-foreground" data-menu-structure-pick-count>${escapeHtml(countLabel)}</span>
      </div>
      <div data-rule-menu-structure-picker-wrap class="rounded-md">
        ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
          enableLines: true,
          selectionByLine: byLine,
        })}
      </div>
      <p class="m-0 hidden text-xs text-destructive" data-rule-menu-structure-error>请至少选择一道商品</p>
    </div>`;
}

function clearDishFieldValidation(field: HTMLElement): void {
  field.removeAttribute("aria-invalid");
  const wrap = field.querySelector<HTMLElement>("[data-rule-menu-structure-picker-wrap]");
  wrap?.classList.remove("ring-2", "ring-destructive/40");
  const err = field.querySelector<HTMLElement>("[data-rule-menu-structure-error]");
  if (err) err.classList.add("hidden");
}

function markDishFieldInvalid(field: HTMLElement): void {
  field.setAttribute("aria-invalid", "true");
  const wrap = field.querySelector<HTMLElement>("[data-rule-menu-structure-picker-wrap]");
  wrap?.classList.add("ring-2", "ring-destructive/40");
  const err = field.querySelector<HTMLElement>("[data-rule-menu-structure-error]");
  if (err) err.classList.remove("hidden");
  field.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function requireDishFieldSelection(field: HTMLElement): BrandMenuStructureByLine | null {
  const byLine = readInlineOrDialogRuleStructure(field);
  if (countBrandMenuStructureDishesByLine(byLine) <= 0) {
    markDishFieldInvalid(field);
    return null;
  }
  clearDishFieldValidation(field);
  return byLine;
}

function bindInlineRuleMenuStructureFields(host: ParentNode): void {
  host
    .querySelectorAll<HTMLElement>("[data-rule-menu-structure-inline] [data-brand-menu-structure-picker]")
    .forEach((picker) => {
      bindBrandMenuStructurePicker(picker);
    });

  host.querySelectorAll<HTMLElement>("[data-dish-round-draft]").forEach((draft) => {
    if (draft.dataset.inlineCountDelegate === "1") return;
    draft.dataset.inlineCountDelegate = "1";
    draft.addEventListener("change", (e) => {
      const input = e.target as HTMLElement;
      if (!input.matches?.("[data-brand-menu-enable]")) return;
      const field = input.closest<HTMLElement>("[data-rule-menu-structure-field]");
      if (!field || field.getAttribute("data-rule-menu-structure-inline") !== "1") return;
      const picker = field.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
      const countEl = field.querySelector<HTMLElement>("[data-menu-structure-pick-count]");
      if (!picker || !countEl) return;
      const byLine = readBrandMenuStructureByLineFromPicker(picker);
      const count = countBrandMenuStructureDishesByLine(byLine);
      countEl.textContent = count > 0 ? `已选 ${count} 道菜` : "未选择商品";
      if (count > 0) clearDishFieldValidation(field);
    });
  });
}

function readInlineOrDialogRuleStructure(field: HTMLElement): BrandMenuStructureByLine {
  if (field.getAttribute("data-rule-menu-structure-inline") === "1") {
    const picker = field.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
    return picker
      ? readBrandMenuStructureByLineFromPicker(picker)
      : emptyBrandMenuStructureByLine();
  }
  return readRuleStructureFromField(field);
}

function renderMutexDraftForm(rule: DishMutexRule): string {
  return `
    <div class="space-y-4" data-dish-round-draft="mutex" data-rule-id="${escapeHtml(rule.id)}">
      ${renderRuleNameField(rule.name, "请输入互斥规则名称")}
      ${renderInlineRuleMenuStructureField("trigger", rule.trigger, "选择下单菜品")}
      <div class="flex items-center gap-2 text-sm text-muted-foreground" aria-hidden="true">
        <span class="h-px min-w-3 flex-1 bg-border"></span>
        <span class="shrink-0 font-medium text-foreground">互斥</span>
        <span class="h-px min-w-3 flex-1 bg-border"></span>
      </div>
      ${renderInlineRuleMenuStructureField("excluded", rule.excluded, "选择不可再下单菜品")}
    </div>`;
}

function renderComboDraftForm(rule: DishComboRule): string {
  return `
    <div class="space-y-4" data-dish-round-draft="combo" data-rule-id="${escapeHtml(rule.id)}">
      ${renderRuleNameField(rule.name, "请输入组合规则名称")}
      ${renderInlineRuleMenuStructureField("trigger", rule.trigger, "选择下单菜品")}
      <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span>订单中必须再包含任意菜品</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          class="w-14 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${rule.requiredQty}"
          data-combo-qty
          aria-label="份数"
        />
        <span>份</span>
      </div>
      ${renderInlineRuleMenuStructureField("required", rule.required, "选择必选菜品")}
    </div>`;
}

function renderDishRoundWizardDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-dish-round-wizard
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-round-wizard-title"
      data-wizard-mode="create"
      data-wizard-step="1"
      data-wizard-kind=""
      data-edit-rule-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-dish-round-wizard-backdrop aria-label="关闭"></button>
      <div class="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 flex-col gap-2 border-b border-border px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <h3 id="dish-round-wizard-title" class="text-base font-semibold text-card-foreground" data-dish-round-wizard-title>新增规则</h3>
            <button type="button" class="text-muted-foreground hover:text-foreground" data-dish-round-wizard-close aria-label="关闭">×</button>
          </div>
          ${renderDishRoundWizardStepIndicator(1)}
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4" data-dish-round-wizard-body>
          ${renderDishRoundWizardStep1("")}
        </div>
        <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST} hidden" data-dish-round-wizard-back hidden aria-hidden="true">上一步</button>
          <div class="ml-auto flex flex-wrap gap-2">
            <button type="button" class="${BTN_GHOST}" data-dish-round-wizard-cancel>取消</button>
            <button type="button" class="${BTN_PRIMARY}" data-dish-round-wizard-next disabled>下一步</button>
            <button type="button" class="${BTN_PRIMARY} hidden" data-dish-round-wizard-save hidden aria-hidden="true">保存</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function renderDishRoundUnifiedWorkspaceHtml(options: {
  mutexSeq: number;
  comboSeq: number;
  mutexStorageId: string;
  comboStorageId: string;
}): string {
  const items = readDishRoundListItems(options.mutexStorageId, options.comboStorageId);
  return `
    <div
      class="flex min-h-0 flex-1 flex-col"
      data-dish-round-workspace
      data-mutex-seq="${options.mutexSeq}"
      data-combo-seq="${options.comboSeq}"
      data-mutex-storage="${escapeHtml(options.mutexStorageId)}"
      data-combo-storage="${escapeHtml(options.comboStorageId)}"
    >
      <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-card-foreground">每轮菜品互斥/组合</h2>
          <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">配置同一轮下单中的菜品互斥与必选组合规则。</p>
        </div>
        <button type="button" class="${BTN_PRIMARY}" data-dish-round-add-rule>+ 新建规则</button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4" data-dish-round-list>
        ${renderDishRoundListTable(items)}
      </div>
      ${renderDishRoundWizardDialog()}
    </div>`;
}

function refreshDishRoundList(workspace: HTMLElement): void {
  const mutexStorage = workspace.getAttribute("data-mutex-storage") ?? MUTEX_STORAGE_597;
  const comboStorage = workspace.getAttribute("data-combo-storage") ?? COMBO_STORAGE_598;
  const listHost = workspace.querySelector<HTMLElement>("[data-dish-round-list]");
  if (!listHost) return;
  listHost.innerHTML = renderDishRoundListTable(readDishRoundListItems(mutexStorage, comboStorage));
}

function showDishRoundWizard(wizard: HTMLElement): void {
  wizard.classList.remove("hidden");
  wizard.classList.add("flex");
}

function hideDishRoundWizard(wizard: HTMLElement): void {
  wizard.classList.add("hidden");
  wizard.classList.remove("flex");
  wizard.setAttribute("data-wizard-mode", "create");
  wizard.setAttribute("data-wizard-step", "1");
  wizard.setAttribute("data-wizard-kind", "");
  wizard.setAttribute("data-edit-rule-id", "");
}

function updateDishRoundWizardChrome(wizard: HTMLElement): void {
  const step = (wizard.getAttribute("data-wizard-step") === "2" ? 2 : 1) as 1 | 2;
  const mode = wizard.getAttribute("data-wizard-mode") === "edit" ? "edit" : "create";
  const kind = wizard.getAttribute("data-wizard-kind") as DishRoundRuleKind | "";
  const titleEl = wizard.querySelector<HTMLElement>("[data-dish-round-wizard-title]");
  const backBtn = wizard.querySelector<HTMLElement>("[data-dish-round-wizard-back]");
  const nextBtn = wizard.querySelector<HTMLButtonElement>("[data-dish-round-wizard-next]");
  const saveBtn = wizard.querySelector<HTMLElement>("[data-dish-round-wizard-save]");
  const step1Label = wizard.querySelector<HTMLElement>('[data-dish-round-wizard-step-label="1"]');
  const step2Label = wizard.querySelector<HTMLElement>('[data-dish-round-wizard-step-label="2"]');

  if (titleEl) {
    titleEl.textContent =
      mode === "edit"
        ? kind === "combo"
          ? "编辑商品组合下单规则"
          : "编辑商品互斥下单规则"
        : "新增规则";
  }
  step1Label?.classList.toggle("text-primary", step === 1);
  step1Label?.classList.toggle("text-muted-foreground", step !== 1);
  step2Label?.classList.toggle("text-primary", step === 2);
  step2Label?.classList.toggle("text-muted-foreground", step !== 2);

  const setBtnVisible = (btn: HTMLElement | null, visible: boolean): void => {
    if (!btn) return;
    btn.classList.toggle("hidden", !visible);
    btn.toggleAttribute("hidden", !visible);
    btn.setAttribute("aria-hidden", visible ? "false" : "true");
    if (btn instanceof HTMLButtonElement) btn.disabled = !visible;
  };

  // 步骤1：仅「取消 + 下一步」；步骤2：仅「上一步（新建时）+ 取消 + 保存」
  if (step === 1) {
    setBtnVisible(backBtn, false);
    setBtnVisible(nextBtn, true);
    setBtnVisible(saveBtn, false);
    if (nextBtn) nextBtn.disabled = kind !== "mutex" && kind !== "combo";
  } else {
    setBtnVisible(backBtn, mode !== "edit");
    setBtnVisible(nextBtn, false);
    setBtnVisible(saveBtn, true);
  }
}

function openDishRoundWizardCreate(workspace: HTMLElement): void {
  const wizard = workspace.querySelector<HTMLElement>("[data-dish-round-wizard]");
  const body = wizard?.querySelector<HTMLElement>("[data-dish-round-wizard-body]");
  if (!wizard || !body) return;
  wizard.setAttribute("data-wizard-mode", "create");
  wizard.setAttribute("data-wizard-step", "1");
  wizard.setAttribute("data-wizard-kind", "");
  wizard.setAttribute("data-edit-rule-id", "");
  body.innerHTML = renderDishRoundWizardStep1("");
  updateDishRoundWizardChrome(wizard);
  showDishRoundWizard(wizard);
}

function openDishRoundWizardEdit(
  workspace: HTMLElement,
  kind: DishRoundRuleKind,
  ruleId: string,
): void {
  const wizard = workspace.querySelector<HTMLElement>("[data-dish-round-wizard]");
  const body = wizard?.querySelector<HTMLElement>("[data-dish-round-wizard-body]");
  const mutexStorage = workspace.getAttribute("data-mutex-storage") ?? MUTEX_STORAGE_597;
  const comboStorage = workspace.getAttribute("data-combo-storage") ?? COMBO_STORAGE_598;
  if (!wizard || !body) return;

  let draftHtml = "";
  if (kind === "mutex") {
    const rule = readDishMutexRules(mutexStorage).find((r) => r.id === ruleId);
    if (!rule) return;
    draftHtml = renderMutexDraftForm(rule);
  } else {
    const rule = readDishComboRules(comboStorage).find((r) => r.id === ruleId);
    if (!rule) return;
    draftHtml = renderComboDraftForm(rule);
  }

  wizard.setAttribute("data-wizard-mode", "edit");
  wizard.setAttribute("data-wizard-step", "2");
  wizard.setAttribute("data-wizard-kind", kind);
  wizard.setAttribute("data-edit-rule-id", ruleId);
  body.innerHTML = renderDishRoundWizardStep2Body(kind, draftHtml);
  updateDishRoundWizardChrome(wizard);
  bindInlineRuleMenuStructureFields(body);
  showDishRoundWizard(wizard);
  body.querySelector<HTMLInputElement>("[data-dish-round-rule-name]")?.focus();
}

function goDishRoundWizardStep2(wizard: HTMLElement): void {
  const kind = wizard.getAttribute("data-wizard-kind") as DishRoundRuleKind | "";
  const body = wizard.querySelector<HTMLElement>("[data-dish-round-wizard-body]");
  if (!body || (kind !== "mutex" && kind !== "combo")) return;

  const draftHtml =
    kind === "mutex"
      ? renderMutexDraftForm({
          id: newRuleId(),
          name: "",
          status: "active",
          trigger: emptyBrandMenuStructureByLine(),
          excluded: emptyBrandMenuStructureByLine(),
        })
      : renderComboDraftForm({
          id: newRuleId(),
          name: "",
          status: "active",
          trigger: emptyBrandMenuStructureByLine(),
          requiredQty: 1,
          required: emptyBrandMenuStructureByLine(),
        });

  wizard.setAttribute("data-wizard-step", "2");
  body.innerHTML = renderDishRoundWizardStep2Body(kind, draftHtml);
  updateDishRoundWizardChrome(wizard);
  bindInlineRuleMenuStructureFields(body);
  body.querySelector<HTMLInputElement>("[data-dish-round-rule-name]")?.focus();
}

function goDishRoundWizardStep1(wizard: HTMLElement): void {
  const kind = (wizard.getAttribute("data-wizard-kind") as DishRoundRuleKind | "") || "";
  const body = wizard.querySelector<HTMLElement>("[data-dish-round-wizard-body]");
  if (!body) return;
  wizard.setAttribute("data-wizard-step", "1");
  body.innerHTML = renderDishRoundWizardStep1(kind);
  updateDishRoundWizardChrome(wizard);
}

function collectDraftMutexRule(draft: HTMLElement, status: DishRuleStatus = "active"): DishMutexRule | null {
  const ruleId = draft.getAttribute("data-rule-id") || newRuleId();
  const name = readDraftRuleName(draft);
  const nameInput = draft.querySelector<HTMLInputElement>("[data-dish-round-rule-name]");
  if (!name) {
    nameInput?.focus();
    nameInput?.setAttribute("aria-invalid", "true");
    nameInput?.classList.add("border-destructive");
    return null;
  }
  nameInput?.removeAttribute("aria-invalid");
  nameInput?.classList.remove("border-destructive");
  const triggerField = draft.querySelector<HTMLElement>(
    '[data-rule-menu-structure-field][data-picker-role="trigger"]',
  );
  const excludedField = draft.querySelector<HTMLElement>(
    '[data-rule-menu-structure-field][data-picker-role="excluded"]',
  );
  if (!triggerField || !excludedField) return null;

  const trigger = requireDishFieldSelection(triggerField);
  const excluded = requireDishFieldSelection(excludedField);
  if (!trigger || !excluded) {
    if (!trigger) triggerField.scrollIntoView({ block: "nearest", behavior: "smooth" });
    else excludedField.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return null;
  }

  return {
    id: ruleId,
    name,
    status,
    trigger,
    excluded,
  };
}

function collectDraftComboRule(draft: HTMLElement, status: DishRuleStatus = "active"): DishComboRule | null {
  const ruleId = draft.getAttribute("data-rule-id") || newRuleId();
  const name = readDraftRuleName(draft);
  const nameInput = draft.querySelector<HTMLInputElement>("[data-dish-round-rule-name]");
  if (!name) {
    nameInput?.focus();
    nameInput?.setAttribute("aria-invalid", "true");
    nameInput?.classList.add("border-destructive");
    return null;
  }
  nameInput?.removeAttribute("aria-invalid");
  nameInput?.classList.remove("border-destructive");
  const triggerField = draft.querySelector<HTMLElement>(
    '[data-rule-menu-structure-field][data-picker-role="trigger"]',
  );
  const requiredField = draft.querySelector<HTMLElement>(
    '[data-rule-menu-structure-field][data-picker-role="required"]',
  );
  const qtyInput = draft.querySelector<HTMLInputElement>("[data-combo-qty]");
  if (!triggerField || !requiredField) return null;

  const trigger = requireDishFieldSelection(triggerField);
  const required = requireDishFieldSelection(requiredField);
  if (!trigger || !required) {
    if (!trigger) triggerField.scrollIntoView({ block: "nearest", behavior: "smooth" });
    else requiredField.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return null;
  }

  const qty = Number(qtyInput?.value ?? 1);
  return {
    id: ruleId,
    name,
    status,
    trigger,
    requiredQty: Number.isFinite(qty) && qty >= 1 ? qty : 1,
    required,
  };
}

function saveDishRoundWizard(workspace: HTMLElement): void {
  const wizard = workspace.querySelector<HTMLElement>("[data-dish-round-wizard]");
  if (!wizard) return;
  const kind = wizard.getAttribute("data-wizard-kind") as DishRoundRuleKind | "";
  const mode = wizard.getAttribute("data-wizard-mode") === "edit" ? "edit" : "create";
  const editId = wizard.getAttribute("data-edit-rule-id") || "";
  const mutexStorage = workspace.getAttribute("data-mutex-storage") ?? MUTEX_STORAGE_597;
  const comboStorage = workspace.getAttribute("data-combo-storage") ?? COMBO_STORAGE_598;
  const mutexSeq = Number(workspace.getAttribute("data-mutex-seq") ?? 597);
  const comboSeq = Number(workspace.getAttribute("data-combo-seq") ?? 598);

  if (kind === "mutex") {
    const draft = wizard.querySelector<HTMLElement>('[data-dish-round-draft="mutex"]');
    if (!draft) return;
    const existing = mode === "edit" && editId
      ? readDishMutexRules(mutexStorage).find((r) => r.id === editId)
      : undefined;
    const rule = collectDraftMutexRule(draft, existing?.status ?? "active");
    if (!rule) return;
    if (mode === "edit" && editId) rule.id = editId;
    const rules = readDishMutexRules(mutexStorage);
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) rules[idx] = rule;
    else rules.push(rule);
    writeDishMutexRules(rules, mutexStorage);
    writeModuleSettingToggleOn(mutexSeq, true);
  } else if (kind === "combo") {
    const draft = wizard.querySelector<HTMLElement>('[data-dish-round-draft="combo"]');
    if (!draft) return;
    const existing = mode === "edit" && editId
      ? readDishComboRules(comboStorage).find((r) => r.id === editId)
      : undefined;
    const rule = collectDraftComboRule(draft, existing?.status ?? "active");
    if (!rule) return;
    if (mode === "edit" && editId) rule.id = editId;
    const rules = readDishComboRules(comboStorage);
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) rules[idx] = rule;
    else rules.push(rule);
    writeDishComboRules(rules, comboStorage);
    writeModuleSettingToggleOn(comboSeq, true);
  } else {
    return;
  }

  hideDishRoundWizard(wizard);
  refreshDishRoundList(workspace);
}

function removeDishRoundListItem(
  workspace: HTMLElement,
  kind: DishRoundRuleKind,
  ruleId: string,
): void {
  const mutexStorage = workspace.getAttribute("data-mutex-storage") ?? MUTEX_STORAGE_597;
  const comboStorage = workspace.getAttribute("data-combo-storage") ?? COMBO_STORAGE_598;
  const mutexSeq = Number(workspace.getAttribute("data-mutex-seq") ?? 597);
  const comboSeq = Number(workspace.getAttribute("data-combo-seq") ?? 598);
  if (kind === "mutex") {
    const rules = readDishMutexRules(mutexStorage).filter((r) => r.id !== ruleId);
    writeDishMutexRules(rules, mutexStorage);
    if (rules.length === 0) writeModuleSettingToggleOn(mutexSeq, false);
  } else {
    const rules = readDishComboRules(comboStorage).filter((r) => r.id !== ruleId);
    writeDishComboRules(rules, comboStorage);
    if (rules.length === 0) writeModuleSettingToggleOn(comboSeq, false);
  }
  refreshDishRoundList(workspace);
}

function copyDishRoundListItem(
  workspace: HTMLElement,
  kind: DishRoundRuleKind,
  ruleId: string,
): void {
  const mutexStorage = workspace.getAttribute("data-mutex-storage") ?? MUTEX_STORAGE_597;
  const comboStorage = workspace.getAttribute("data-combo-storage") ?? COMBO_STORAGE_598;
  if (kind === "mutex") {
    const rules = readDishMutexRules(mutexStorage);
    const source = rules.find((r) => r.id === ruleId);
    if (!source) return;
    rules.push({
      ...source,
      id: newRuleId(),
      name: `${source.name || "互斥规则"}（副本）`,
      status: "active",
    });
    writeDishMutexRules(rules, mutexStorage);
  } else {
    const rules = readDishComboRules(comboStorage);
    const source = rules.find((r) => r.id === ruleId);
    if (!source) return;
    rules.push({
      ...source,
      id: newRuleId(),
      name: `${source.name || "组合规则"}（副本）`,
      status: "active",
    });
    writeDishComboRules(rules, comboStorage);
  }
  refreshDishRoundList(workspace);
}

function toggleDishRoundListItem(
  workspace: HTMLElement,
  kind: DishRoundRuleKind,
  ruleId: string,
): void {
  const mutexStorage = workspace.getAttribute("data-mutex-storage") ?? MUTEX_STORAGE_597;
  const comboStorage = workspace.getAttribute("data-combo-storage") ?? COMBO_STORAGE_598;
  if (kind === "mutex") {
    const rules = readDishMutexRules(mutexStorage).map((r) =>
      r.id === ruleId ? { ...r, status: (r.status === "active" ? "disabled" : "active") as DishRuleStatus } : r,
    );
    writeDishMutexRules(rules, mutexStorage);
  } else {
    const rules = readDishComboRules(comboStorage).map((r) =>
      r.id === ruleId ? { ...r, status: (r.status === "active" ? "disabled" : "active") as DishRuleStatus } : r,
    );
    writeDishComboRules(rules, comboStorage);
  }
  refreshDishRoundList(workspace);
}

export function bindDishRoundUnifiedWorkspace(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-dish-round-workspace]").forEach((workspace) => {
    if (workspace.dataset.dishRoundBound === "1") return;
    workspace.dataset.dishRoundBound = "1";

    workspace.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (handleRuleMenuStructureFieldClick(target)) return;

      if (target.closest("[data-dish-round-add-rule]")) {
        openDishRoundWizardCreate(workspace);
        return;
      }

      const actionBtn = target.closest<HTMLElement>("[data-rule-action]");
      if (actionBtn) {
        const item = actionBtn.closest<HTMLElement>("[data-dish-round-list-item]");
        const kind = item?.getAttribute("data-rule-kind") as DishRoundRuleKind | null;
        const ruleId = item?.getAttribute("data-rule-id");
        const action = actionBtn.getAttribute("data-rule-action");
        if (kind && ruleId && action) {
          if (action === "edit") openDishRoundWizardEdit(workspace, kind, ruleId);
          else if (action === "copy") copyDishRoundListItem(workspace, kind, ruleId);
          else if (action === "toggle") toggleDishRoundListItem(workspace, kind, ruleId);
          else if (action === "delete") {
            void (async () => {
              const ok = await openConfirmDialog({
                title: "删除规则",
                message: "确定删除该规则？",
                confirmLabel: "确认删除",
                danger: true,
              });
              if (ok) removeDishRoundListItem(workspace, kind, ruleId);
            })();
          }
        }
        return;
      }

      const wizard = workspace.querySelector<HTMLElement>("[data-dish-round-wizard]");
      if (!wizard || wizard.classList.contains("hidden")) return;

      if (
        target.closest("[data-dish-round-wizard-close]") ||
        target.closest("[data-dish-round-wizard-cancel]") ||
        target.closest("[data-dish-round-wizard-backdrop]")
      ) {
        hideDishRoundWizard(wizard);
        return;
      }

      const kindOption = target.closest<HTMLElement>("[data-dish-round-kind-option]");
      if (kindOption) {
        const kind = kindOption.getAttribute("data-dish-round-kind-option") as DishRoundRuleKind;
        wizard.setAttribute("data-wizard-kind", kind);
        const body = wizard.querySelector<HTMLElement>("[data-dish-round-wizard-body]");
        if (body) body.innerHTML = renderDishRoundWizardStep1(kind);
        updateDishRoundWizardChrome(wizard);
        return;
      }

      if (target.closest("[data-dish-round-wizard-next]")) {
        goDishRoundWizardStep2(wizard);
        return;
      }
      if (target.closest("[data-dish-round-wizard-back]")) {
        goDishRoundWizardStep1(wizard);
        return;
      }
      if (target.closest("[data-dish-round-wizard-save]")) {
        saveDishRoundWizard(workspace);
      }
    });
  });
}


function collectTagsFromCheckboxes(picker: HTMLElement): DishTag[] {
  return [...picker.querySelectorAll<HTMLInputElement>("[data-dish-choice]:checked")].map(
    (input) => ({
      id: input.getAttribute("data-dish-id") ?? input.value,
      name: input.getAttribute("data-dish-name") ?? "",
    }),
  );
}

function syncDishTagsFromCheckboxes(picker: HTMLElement): void {
  const tags = collectTagsFromCheckboxes(picker);
  let tagsWrap = picker.querySelector<HTMLElement>("[data-dish-tags]");
  if (tags.length === 0) {
    tagsWrap?.remove();
    return;
  }
  if (!tagsWrap) {
    picker.insertAdjacentHTML(
      "afterbegin",
      `<div class="flex flex-wrap gap-1.5" data-dish-tags></div>`,
    );
    tagsWrap = picker.querySelector<HTMLElement>("[data-dish-tags]");
  }
  if (tagsWrap) tagsWrap.innerHTML = tags.map(renderDishTag).join("");
}

export function collectTagsFromPicker(picker: Element): DishTag[] {
  const el = picker as HTMLElement;
  if (el.querySelector("[data-dish-choice]")) return collectTagsFromCheckboxes(el);
  return [...picker.querySelectorAll("[data-dish-tag]")].map((tag) => ({
    id: tag.getAttribute("data-dish-id") ?? "",
    name: tag.getAttribute("data-dish-name") ?? "",
  }));
}

export function onDishPickerCheckboxChange(picker: HTMLElement): void {
  syncDishTagsFromCheckboxes(picker);
  const standalone = picker.closest<HTMLElement>("[data-standalone-dish-picker]");
  if (standalone) {
    persistStandaloneDishPicker(picker);
    return;
  }
  const mutex = picker.closest<HTMLElement>("[data-mutex-rules-editor]");
  if (mutex) {
    persistMutexEditor(mutex);
    return;
  }
  const combo = picker.closest<HTMLElement>("[data-combo-rules-editor]");
  if (combo) persistComboEditor(combo);
  const delayed = picker.closest<HTMLElement>("[data-delayed-kitchen-send-editor]");
  if (delayed) {
    delayed.dispatchEvent(new CustomEvent("delayed-kitchen-send-update", { bubbles: false }));
  }
}

export function onDishTagRemove(picker: HTMLElement, dishId: string): void {
  const cb = picker.querySelector<HTMLInputElement>(`[data-dish-choice][data-dish-id="${dishId}"]`);
  if (cb) cb.checked = false;
  picker.querySelector(`[data-dish-tag][data-dish-id="${dishId}"]`)?.remove();
  const tagsWrap = picker.querySelector("[data-dish-tags]");
  if (tagsWrap && !tagsWrap.querySelector("[data-dish-tag]")) tagsWrap.remove();
  if (picker.getAttribute("data-picker-ui") === "select") {
    refreshDishSelectOptions(picker);
    const standalone = picker.closest<HTMLElement>("[data-standalone-dish-picker]");
    if (standalone) {
      persistStandaloneDishPicker(picker);
      return;
    }
    const mutex = picker.closest<HTMLElement>("[data-mutex-rules-editor]");
    if (mutex) {
      persistMutexEditor(mutex);
      return;
    }
    const combo = picker.closest<HTMLElement>("[data-combo-rules-editor]");
    if (combo) persistComboEditor(combo);
    const delayed = picker.closest<HTMLElement>("[data-delayed-kitchen-send-editor]");
    if (delayed) {
      delayed.dispatchEvent(new CustomEvent("delayed-kitchen-send-update", { bubbles: false }));
      return;
    }
    return;
  }
  onDishPickerCheckboxChange(picker);
}

function persistMutexEditor(editor: HTMLElement): void {
  const storageId = editor.getAttribute("data-storage-id");
  if (!storageId) return;
  const existingById = new Map(readDishMutexRules(storageId).map((r) => [r.id, r]));
  const rules: DishMutexRule[] = [];
  editor.querySelectorAll("[data-mutex-rule-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const triggerField = row.querySelector<HTMLElement>(
      '[data-rule-menu-structure-field][data-picker-role="trigger"]',
    );
    const excludedField = row.querySelector<HTMLElement>(
      '[data-rule-menu-structure-field][data-picker-role="excluded"]',
    );
    if (!triggerField || !excludedField) return;
    rules.push({
      id: ruleId,
      name: existingById.get(ruleId)?.name ?? "",
      status: existingById.get(ruleId)?.status ?? "active",
      trigger: readRuleStructureFromField(triggerField),
      excluded: readRuleStructureFromField(excludedField),
    });
  });
  writeDishMutexRules(rules, storageId);
}

function persistComboEditor(editor: HTMLElement): void {
  const storageId = editor.getAttribute("data-storage-id");
  if (!storageId) return;
  const existingById = new Map(readDishComboRules(storageId).map((r) => [r.id, r]));
  const rules: DishComboRule[] = [];
  editor.querySelectorAll("[data-combo-rule-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const triggerField = row.querySelector<HTMLElement>(
      '[data-rule-menu-structure-field][data-picker-role="trigger"]',
    );
    const requiredField = row.querySelector<HTMLElement>(
      '[data-rule-menu-structure-field][data-picker-role="required"]',
    );
    const qtyInput = row.querySelector<HTMLInputElement>("[data-combo-qty]");
    if (!triggerField || !requiredField) return;
    const qty = Number(qtyInput?.value ?? 1);
    rules.push({
      id: ruleId,
      name: existingById.get(ruleId)?.name ?? "",
      status: existingById.get(ruleId)?.status ?? "active",
      trigger: readRuleStructureFromField(triggerField),
      requiredQty: Number.isFinite(qty) && qty >= 1 ? qty : 1,
      required: readRuleStructureFromField(requiredField),
    });
  });
  writeDishComboRules(rules, storageId);
}

function refreshMutexEditor(editor: HTMLElement): void {
  const parentSeq = Number(editor.getAttribute("data-parent-seq") ?? 0);
  const storageId = editor.getAttribute("data-storage-id") ?? MUTEX_STORAGE_597;
  const rules = readDishMutexRules(storageId);
  const rows = rules.map((rule) => renderMutexRuleRow(rule, parentSeq)).join("");
  editor.innerHTML = `
    ${rows || `<p class="m-0 text-sm text-muted-foreground">暂无互斥规则，请点击下方「新增规则」添加。</p>`}
    ${renderAddRuleButton("data-mutex-add-rule", "新增规则")}`;
}

function refreshComboEditor(editor: HTMLElement): void {
  const parentSeq = Number(editor.getAttribute("data-parent-seq") ?? 0);
  const storageId = editor.getAttribute("data-storage-id") ?? COMBO_STORAGE_598;
  const rules = readDishComboRules(storageId);
  const rows = rules.map((rule) => renderComboRuleRow(rule, parentSeq)).join("");
  editor.innerHTML = `
    ${rows || `<p class="m-0 text-sm text-muted-foreground">暂无组合规则，请点击下方「新增规则」添加。</p>`}
    ${renderAddRuleButton("data-combo-add-rule", "新增规则")}`;
}

function appendMutexRule(editor: HTMLElement): void {
  const storageId = editor.getAttribute("data-storage-id") ?? MUTEX_STORAGE_597;
  const rules = readDishMutexRules(storageId);
  rules.push({
    id: newRuleId(),
    name: "",
    status: "active",
    trigger: emptyBrandMenuStructureByLine(),
    excluded: emptyBrandMenuStructureByLine(),
  });
  writeDishMutexRules(rules, storageId);
  refreshMutexEditor(editor);
}

function removeMutexRule(editor: HTMLElement, ruleId: string): void {
  const storageId = editor.getAttribute("data-storage-id") ?? MUTEX_STORAGE_597;
  const rules = readDishMutexRules(storageId).filter((r) => r.id !== ruleId);
  writeDishMutexRules(rules, storageId);
  refreshMutexEditor(editor);
}

function appendComboRule(editor: HTMLElement): void {
  const storageId = editor.getAttribute("data-storage-id") ?? COMBO_STORAGE_598;
  const rules = readDishComboRules(storageId);
  rules.push({
    id: newRuleId(),
    name: "",
    status: "active",
    trigger: emptyBrandMenuStructureByLine(),
    requiredQty: 1,
    required: emptyBrandMenuStructureByLine(),
  });
  writeDishComboRules(rules, storageId);
  refreshComboEditor(editor);
}

function removeComboRule(editor: HTMLElement, ruleId: string): void {
  const storageId = editor.getAttribute("data-storage-id") ?? COMBO_STORAGE_598;
  const rules = readDishComboRules(storageId).filter((r) => r.id !== ruleId);
  writeDishComboRules(rules, storageId);
  refreshComboEditor(editor);
}

export function renderStandaloneDishPickerHtml(
  parentSeq: number,
  fieldKey: string,
  storageFieldId: string,
  pickerUi: "checkbox" | "select" = "checkbox",
): string {
  const dishes = readDishTags(storageFieldId);
  return `
    <div data-standalone-dish-picker data-storage-id="${escapeHtml(storageFieldId)}" data-field-key="${escapeHtml(fieldKey)}" data-picker-ui="${pickerUi}">
      ${renderDishPicker(parentSeq, fieldKey, "tags", dishes, pickerUi)}
    </div>`;
}

/** 独立「产线 + 组/类/菜」选品（对齐店中店品牌菜单，如抽奖排除/奖池） */
const BTN_MENU_STRUCTURE_ADD =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";
const BTN_MENU_STRUCTURE_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";
const BTN_MENU_STRUCTURE_SAVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

function readStandaloneMenuStructureByLine(storageFieldId: string): BrandMenuStructureByLine {
  return normalizeBrandMenuStructureByLine(
    readModuleSettingJson(storageFieldId, emptyBrandMenuStructureByLine()),
  );
}

function menuStructureCountLabel(byLine: BrandMenuStructureByLine): string {
  const dishCount = countBrandMenuStructureDishesByLine(byLine);
  return dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";
}

function renderMenuStructurePickDialog(dialogTitle: string): string {
  return `
    <div
      class="fixed inset-0 z-[130] hidden items-center justify-center p-4"
      data-menu-structure-pick-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-structure-pick-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-menu-structure-pick-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="menu-structure-pick-dialog-title" class="text-base font-semibold text-card-foreground" data-menu-structure-pick-title>${escapeHtml(dialogTitle)}</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-menu-structure-pick-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-menu-structure-pick-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_MENU_STRUCTURE_GHOST}" data-menu-structure-pick-cancel>取消</button>
          <button type="button" class="${BTN_MENU_STRUCTURE_SAVE}" data-menu-structure-pick-save>确定</button>
        </div>
      </div>
    </div>`;
}

export function renderStandaloneMenuStructureByLinePickerHtml(
  storageFieldId: string,
  options?: { dialogTitle?: string },
): string {
  const byLine = readStandaloneMenuStructureByLine(storageFieldId);
  const summary = formatBrandMenuStructureByLineSummary(byLine);
  const countLabel = menuStructureCountLabel(byLine);
  const dialogTitle = options?.dialogTitle ?? "添加商品";
  return `
    <div data-standalone-menu-structure-picker data-storage-id="${escapeHtml(storageFieldId)}">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="${BTN_MENU_STRUCTURE_ADD}" data-menu-structure-pick-open>添加商品</button>
        <span class="text-xs text-muted-foreground" data-menu-structure-pick-count>${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 mt-1.5 text-xs leading-relaxed text-muted-foreground" data-menu-structure-pick-summary>${escapeHtml(summary)}</p>
      ${renderMenuStructurePickDialog(dialogTitle)}
    </div>`;
}

function showMenuStructurePickDialog(dialog: HTMLElement): void {
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideMenuStructurePickDialog(dialog: HTMLElement): void {
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  const body = dialog.querySelector<HTMLElement>("[data-menu-structure-pick-body]");
  if (body) body.innerHTML = "";
}

function refreshStandaloneMenuStructureSummary(wrap: HTMLElement): void {
  const storageId = wrap.getAttribute("data-storage-id");
  if (!storageId) return;
  const byLine = readStandaloneMenuStructureByLine(storageId);
  const summaryEl = wrap.querySelector<HTMLElement>("[data-menu-structure-pick-summary]");
  const countEl = wrap.querySelector<HTMLElement>("[data-menu-structure-pick-count]");
  if (summaryEl) summaryEl.textContent = formatBrandMenuStructureByLineSummary(byLine);
  if (countEl) countEl.textContent = menuStructureCountLabel(byLine);
}

function openStandaloneMenuStructurePickDialog(wrap: HTMLElement): void {
  const storageId = wrap.getAttribute("data-storage-id");
  const dialog = wrap.querySelector<HTMLElement>("[data-menu-structure-pick-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-menu-structure-pick-body]");
  if (!storageId || !dialog || !body) return;

  const byLine = readStandaloneMenuStructureByLine(storageId);
  body.innerHTML = renderBrandMenuStructurePickerHtml([], undefined, undefined, {
    enableLines: true,
    selectionByLine: byLine,
  });
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showMenuStructurePickDialog(dialog);
}

function saveStandaloneMenuStructurePickDialog(wrap: HTMLElement): void {
  const storageId = wrap.getAttribute("data-storage-id");
  const dialog = wrap.querySelector<HTMLElement>("[data-menu-structure-pick-dialog]");
  if (!storageId || !dialog) return;
  const picker = dialog.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  writeModuleSettingJson(
    storageId,
    picker ? readBrandMenuStructureByLineFromPicker(picker) : emptyBrandMenuStructureByLine(),
  );
  refreshStandaloneMenuStructureSummary(wrap);
  hideMenuStructurePickDialog(dialog);
}

function bindStandaloneMenuStructureByLinePickers(): void {
  document.querySelectorAll<HTMLElement>("[data-standalone-menu-structure-picker]").forEach((wrap) => {
    if (wrap.dataset.menuStructurePickerBound === "1") return;
    wrap.dataset.menuStructurePickerBound = "1";
    wrap.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-menu-structure-pick-open]")) {
        openStandaloneMenuStructurePickDialog(wrap);
        return;
      }
      if (
        target.closest("[data-menu-structure-pick-close]") ||
        target.closest("[data-menu-structure-pick-cancel]") ||
        target.closest("[data-menu-structure-pick-backdrop]")
      ) {
        const dialog = wrap.querySelector<HTMLElement>("[data-menu-structure-pick-dialog]");
        if (dialog) hideMenuStructurePickDialog(dialog);
        return;
      }
      if (target.closest("[data-menu-structure-pick-save]")) {
        saveStandaloneMenuStructurePickDialog(wrap);
      }
    });
  });
}

function persistStandaloneDishPicker(picker: HTMLElement): void {
  const wrap = picker.closest<HTMLElement>("[data-standalone-dish-picker]");
  const storageId = wrap?.getAttribute("data-storage-id");
  if (!storageId) return;
  writeDishTags(storageId, collectTagsFromPicker(picker));
}

function bindStandaloneDishPickers(): void {
  document.querySelectorAll<HTMLElement>("[data-standalone-dish-picker]").forEach((wrap) => {
    if (wrap.dataset.standaloneDishPickerBound === "1") return;
    wrap.dataset.standaloneDishPickerBound = "1";
    wrap.addEventListener("click", (e) => {
      const removeBtn = (e.target as HTMLElement).closest("[data-dish-tag-remove]");
      if (!removeBtn) return;
      const tag = removeBtn.closest("[data-dish-tag]");
      const picker = tag?.closest<HTMLElement>("[data-dish-picker]");
      const dishId = tag?.getAttribute("data-dish-id");
      if (picker && dishId) onDishTagRemove(picker, dishId);
    });
    wrap.addEventListener("change", (e) => {
      const select = (e.target as HTMLElement).closest<HTMLSelectElement>("[data-dish-select]");
      if (select) {
        const picker = select.closest<HTMLElement>("[data-dish-picker]");
        if (picker) onDishSelectChange(picker, select);
        return;
      }
      const cb = (e.target as HTMLElement).closest<HTMLInputElement>("[data-dish-choice]");
      if (!cb) return;
      const picker = cb.closest<HTMLElement>("[data-dish-picker]");
      if (picker) onDishPickerCheckboxChange(picker);
    });
  });
}

export function bindModuleSettingsDishRules(): void {
  bindStandaloneDishPickers();
  bindStandaloneMenuStructureByLinePickers();
  bindDishRoundUnifiedWorkspace();
  document.querySelectorAll<HTMLElement>("[data-mutex-rules-editor]").forEach((editor) => {
    if (editor.dataset.dishRulesBound === "1") return;
    editor.dataset.dishRulesBound = "1";
    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (handleRuleMenuStructureFieldClick(target)) return;
      if (target.closest("[data-mutex-add-rule]")) {
        appendMutexRule(editor);
        return;
      }
      const removeBtn = target.closest("[data-mutex-remove-rule]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-mutex-rule-row]");
        const ruleId = row?.getAttribute("data-rule-id");
        if (ruleId) removeMutexRule(editor, ruleId);
      }
    });
  });

  document.querySelectorAll<HTMLElement>("[data-combo-rules-editor]").forEach((editor) => {
    if (editor.dataset.dishRulesBound === "1") return;
    editor.dataset.dishRulesBound = "1";
    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (handleRuleMenuStructureFieldClick(target)) return;
      if (target.closest("[data-combo-add-rule]")) {
        appendComboRule(editor);
        return;
      }
      const removeBtn = target.closest("[data-combo-remove-rule]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-combo-rule-row]");
        const ruleId = row?.getAttribute("data-rule-id");
        if (ruleId) removeComboRule(editor, ruleId);
      }
    });
    editor.addEventListener("change", (e) => {
      const qty = (e.target as HTMLElement).closest<HTMLInputElement>("[data-combo-qty]");
      if (qty) persistComboEditor(editor);
    });
    editor.addEventListener("input", (e) => {
      const qty = (e.target as HTMLElement).closest<HTMLInputElement>("[data-combo-qty]");
      if (qty) persistComboEditor(editor);
    });
  });
}
