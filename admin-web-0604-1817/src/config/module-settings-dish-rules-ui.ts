/**
 * 设置滑层：每轮菜品互斥 / 组合规则（原型，localStorage JSON）。
 */

import { renderModuleSettingCheckboxChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export type DishTag = { id: string; name: string };

export type DishMutexRule = {
  id: string;
  trigger: DishTag[];
  excluded: DishTag[];
};

export type DishComboRule = {
  id: string;
  trigger: DishTag[];
  requiredQty: number;
  required: DishTag[];
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

function defaultMutexRules(): DishMutexRule[] {
  return [
    {
      id: newRuleId(),
      trigger: [{ id: "d-beef-premium", name: "极品肥牛133333" }],
      excluded: [
        { id: "d-pork-belly", name: "五花肉" },
        { id: "d-combo-1", name: "牛羊组合" },
        { id: "d-combo-2", name: "牛羊组合-1" },
      ],
    },
  ];
}

function defaultComboRules(): DishComboRule[] {
  return [
    {
      id: newRuleId(),
      trigger: [{ id: "d-pork-belly", name: "五花肉" }],
      requiredQty: 1,
      required: [{ id: "d-combo-1", name: "牛羊组合" }],
    },
  ];
}

export function readDishMutexRules(storageFieldId = MUTEX_STORAGE_597): DishMutexRule[] {
  const raw = readModuleSettingJson<DishMutexRule[]>(storageFieldId, []);
  if (!Array.isArray(raw) || raw.length === 0) return defaultMutexRules();
  return raw.map((r) => ({
    id: r.id || newRuleId(),
    trigger: Array.isArray(r.trigger) ? r.trigger : [],
    excluded: Array.isArray(r.excluded) ? r.excluded : [],
  }));
}

export function writeDishMutexRules(rules: DishMutexRule[], storageFieldId = MUTEX_STORAGE_597): void {
  writeModuleSettingJson(storageFieldId, rules);
}

export function readDishComboRules(storageFieldId = COMBO_STORAGE_598): DishComboRule[] {
  const raw = readModuleSettingJson<DishComboRule[]>(storageFieldId, []);
  if (!Array.isArray(raw) || raw.length === 0) return defaultComboRules();
  return raw.map((r) => ({
    id: r.id || newRuleId(),
    trigger: Array.isArray(r.trigger) ? r.trigger : [],
    requiredQty: Number.isFinite(Number(r.requiredQty)) ? Math.max(1, Number(r.requiredQty)) : 1,
    required: Array.isArray(r.required) ? r.required : [],
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
    layout: "wrap",
  });
  return `
    <div
      class="module-setting-dish-picker min-w-0 flex-1 space-y-2 rounded-md border border-input bg-background px-2 py-2"
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

function renderMutexRuleRow(rule: DishMutexRule, parentSeq: number, isLast: boolean): string {
  return `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3" data-mutex-rule-row data-rule-id="${escapeHtml(rule.id)}">
      <div class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        ${renderDishPicker(parentSeq, rule.id, "trigger", rule.trigger)}
        <span class="shrink-0 text-center text-sm text-muted-foreground sm:px-1">互斥</span>
        ${renderDishPicker(parentSeq, rule.id, "excluded", rule.excluded)}
      </div>
      ${
        isLast
          ? `<button type="button" class="shrink-0 self-end text-sm font-medium text-primary hover:underline sm:self-center" data-mutex-add-rule>增加</button>`
          : ""
      }
    </div>`;
}

function renderComboRuleRow(rule: DishComboRule, parentSeq: number, isLast: boolean): string {
  const qty = rule.requiredQty;
  return `
    <div class="space-y-3 rounded-md border border-border/60 bg-background/60 p-3" data-combo-rule-row data-rule-id="${escapeHtml(rule.id)}">
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">下单菜品</span>
        ${renderDishPicker(parentSeq, rule.id, "trigger", rule.trigger)}
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
      <div class="min-w-0">
        ${renderDishPicker(parentSeq, rule.id, "required", rule.required)}
      </div>
      ${
        isLast
          ? `<div class="flex justify-end"><button type="button" class="text-sm font-medium text-primary hover:underline" data-combo-add-rule>增加</button></div>`
          : ""
      }
    </div>`;
}

export function renderDishMutexRulesHtml(parentSeq: number, storageFieldId: string): string {
  const rules = readDishMutexRules(storageFieldId);
  const rows = rules
    .map((rule, i) => renderMutexRuleRow(rule, parentSeq, i === rules.length - 1))
    .join("");
  return `
    <div class="space-y-3" data-mutex-rules-editor data-storage-id="${escapeHtml(storageFieldId)}" data-parent-seq="${parentSeq}">
      ${rows}
    </div>`;
}

export function renderDishComboRulesHtml(parentSeq: number, storageFieldId: string): string {
  const rules = readDishComboRules(storageFieldId);
  const rows = rules
    .map((rule, i) => renderComboRuleRow(rule, parentSeq, i === rules.length - 1))
    .join("");
  return `
    <div class="space-y-3" data-combo-rules-editor data-storage-id="${escapeHtml(storageFieldId)}" data-parent-seq="${parentSeq}">
      ${rows}
    </div>`;
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
  const rules: DishMutexRule[] = [];
  editor.querySelectorAll("[data-mutex-rule-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const triggerPicker = row.querySelector<HTMLElement>('[data-dish-picker][data-picker-role="trigger"]');
    const excludedPicker = row.querySelector<HTMLElement>('[data-dish-picker][data-picker-role="excluded"]');
    if (!triggerPicker || !excludedPicker) return;
    rules.push({
      id: ruleId,
      trigger: collectTagsFromPicker(triggerPicker),
      excluded: collectTagsFromPicker(excludedPicker),
    });
  });
  writeDishMutexRules(rules, storageId);
}

function persistComboEditor(editor: HTMLElement): void {
  const storageId = editor.getAttribute("data-storage-id");
  if (!storageId) return;
  const rules: DishComboRule[] = [];
  editor.querySelectorAll("[data-combo-rule-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const triggerPicker = row.querySelector<HTMLElement>('[data-dish-picker][data-picker-role="trigger"]');
    const requiredPicker = row.querySelector<HTMLElement>('[data-dish-picker][data-picker-role="required"]');
    const qtyInput = row.querySelector<HTMLInputElement>("[data-combo-qty]");
    if (!triggerPicker || !requiredPicker) return;
    const qty = Number(qtyInput?.value ?? 1);
    rules.push({
      id: ruleId,
      trigger: collectTagsFromPicker(triggerPicker),
      requiredQty: Number.isFinite(qty) && qty >= 1 ? qty : 1,
      required: collectTagsFromPicker(requiredPicker),
    });
  });
  writeDishComboRules(rules, storageId);
}

function appendMutexRule(editor: HTMLElement): void {
  const parentSeq = Number(editor.getAttribute("data-parent-seq") ?? 0);
  const storageId = editor.getAttribute("data-storage-id") ?? MUTEX_STORAGE_597;
  const rules = readDishMutexRules(storageId);
  rules.push({ id: newRuleId(), trigger: [], excluded: [] });
  writeDishMutexRules(rules, storageId);
  editor.innerHTML = rules
    .map((rule, i) => renderMutexRuleRow(rule, parentSeq, i === rules.length - 1))
    .join("");
}

function appendComboRule(editor: HTMLElement): void {
  const parentSeq = Number(editor.getAttribute("data-parent-seq") ?? 0);
  const storageId = editor.getAttribute("data-storage-id") ?? COMBO_STORAGE_598;
  const rules = readDishComboRules(storageId);
  rules.push({ id: newRuleId(), trigger: [], requiredQty: 1, required: [] });
  writeDishComboRules(rules, storageId);
  editor.innerHTML = rules
    .map((rule, i) => renderComboRuleRow(rule, parentSeq, i === rules.length - 1))
    .join("");
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
  document.querySelectorAll<HTMLElement>("[data-mutex-rules-editor]").forEach((editor) => {
    if (editor.dataset.dishRulesBound === "1") return;
    editor.dataset.dishRulesBound = "1";
    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-mutex-add-rule]")) {
        appendMutexRule(editor);
        return;
      }
      const removeBtn = target.closest("[data-dish-tag-remove]");
      if (removeBtn) {
        const tag = removeBtn.closest("[data-dish-tag]");
        const picker = tag?.closest<HTMLElement>("[data-dish-picker]");
        const dishId = tag?.getAttribute("data-dish-id");
        if (picker && dishId) onDishTagRemove(picker, dishId);
      }
    });
    editor.addEventListener("change", (e) => {
      const cb = (e.target as HTMLElement).closest<HTMLInputElement>("[data-dish-choice]");
      if (!cb) return;
      const picker = cb.closest<HTMLElement>("[data-dish-picker]");
      if (picker) onDishPickerCheckboxChange(picker);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-combo-rules-editor]").forEach((editor) => {
    if (editor.dataset.dishRulesBound === "1") return;
    editor.dataset.dishRulesBound = "1";
    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-combo-add-rule]")) {
        appendComboRule(editor);
        return;
      }
      const removeBtn = target.closest("[data-dish-tag-remove]");
      if (removeBtn) {
        const tag = removeBtn.closest("[data-dish-tag]");
        const picker = tag?.closest<HTMLElement>("[data-dish-picker]");
        const dishId = tag?.getAttribute("data-dish-id");
        if (picker && dishId) onDishTagRemove(picker, dishId);
      }
    });
    editor.addEventListener("change", (e) => {
      const cb = (e.target as HTMLElement).closest<HTMLInputElement>("[data-dish-choice]");
      if (cb) {
        const picker = cb.closest<HTMLElement>("[data-dish-picker]");
        if (picker) onDishPickerCheckboxChange(picker);
        return;
      }
      const qty = (e.target as HTMLElement).closest<HTMLInputElement>("[data-combo-qty]");
      if (qty) persistComboEditor(editor);
    });
    editor.addEventListener("input", (e) => {
      const qty = (e.target as HTMLElement).closest<HTMLInputElement>("[data-combo-qty]");
      if (qty) persistComboEditor(editor);
    });
  });
}
