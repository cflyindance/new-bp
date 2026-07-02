/**
 * 前厅 · 食客下单限流：seq 590 菜单下单时间间隔
 * （主开关 + eMenu/SDI 产线 + 多条规则：指定菜品/菜品集 + 间隔分钟）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";
import type { DishTag } from "./module-settings-dish-rules-ui";
import { MODULE_SETTING_MOCK_DISHES, newRuleId } from "./module-settings-dish-rules-ui";

export const GUEST_MENU_ORDER_INTERVAL_SEQ = 590;

const RULES_STORAGE_ID = "590-menu-order-interval-rules";
const LINES_STORAGE_ID = "590-menu-order-interval-lines";

export const GUEST_MENU_ORDER_INTERVAL_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestMenuOrderIntervalProductLineId =
  (typeof GUEST_MENU_ORDER_INTERVAL_PRODUCT_LINES)[number]["id"];

export type MenuOrderIntervalTargetType = "dish" | "dish-set";

export type MenuOrderIntervalRule = {
  id: string;
  targetType: MenuOrderIntervalTargetType;
  intervalMinutes: number;
  targets: DishTag[];
};

const ALL_LINE_IDS: GuestMenuOrderIntervalProductLineId[] =
  GUEST_MENU_ORDER_INTERVAL_PRODUCT_LINES.map((l) => l.id);

/** 原型菜品集（后续对接商品 API） */
const MOCK_DISH_SETS: DishTag[] = [
  { id: "set-hotpot-combo", name: "火锅套餐组合" },
  { id: "set-lunch-special", name: "午市特惠集" },
  { id: "set-drink-bundle", name: "饮品加购集" },
];

const INTERVAL_MIN = 1;
const INTERVAL_MAX = 999;
const INTERVAL_DEFAULT = 5;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SELECT_CLASS =
  "h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function catalogForTargetType(targetType: MenuOrderIntervalTargetType): DishTag[] {
  return targetType === "dish-set" ? MOCK_DISH_SETS : MODULE_SETTING_MOCK_DISHES;
}

function normalizeTargetType(raw: unknown): MenuOrderIntervalTargetType {
  return raw === "dish-set" ? "dish-set" : "dish";
}

function normalizeMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return INTERVAL_DEFAULT;
  return Math.min(INTERVAL_MAX, Math.max(INTERVAL_MIN, Math.round(n)));
}

function normalizeRules(raw: unknown): MenuOrderIntervalRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Partial<MenuOrderIntervalRule>;
    return {
      id: typeof row.id === "string" && row.id ? row.id : newRuleId(),
      targetType: normalizeTargetType(row.targetType),
      intervalMinutes: normalizeMinutes(row.intervalMinutes),
      targets: Array.isArray(row.targets)
        ? row.targets.filter((t): t is DishTag => Boolean(t?.id && t?.name))
        : [],
    };
  });
}

function defaultRules(): MenuOrderIntervalRule[] {
  return [{ id: newRuleId(), targetType: "dish", intervalMinutes: INTERVAL_DEFAULT, targets: [] }];
}

export function readGuestMenuOrderIntervalRules(): MenuOrderIntervalRule[] {
  const raw = readModuleSettingJson<unknown>(RULES_STORAGE_ID, []);
  const normalized = normalizeRules(raw);
  return normalized.length > 0 ? normalized : defaultRules();
}

export function writeGuestMenuOrderIntervalRules(rules: MenuOrderIntervalRule[]): void {
  writeModuleSettingJson(RULES_STORAGE_ID, rules.length > 0 ? rules : defaultRules());
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

function normalizeLineIds(raw: unknown): GuestMenuOrderIntervalProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuOrderIntervalProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readGuestMenuOrderIntervalLines(): GuestMenuOrderIntervalProductLineId[] {
  ensureGuestMenuOrderIntervalToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuOrderIntervalLines(all);
    return all;
  }
  return [];
}

export function writeGuestMenuOrderIntervalLines(lines: GuestMenuOrderIntervalProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isGuestMenuOrderIntervalSeq(seq: number): boolean {
  return seq === GUEST_MENU_ORDER_INTERVAL_SEQ;
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
        data-menu-order-interval-tag-remove
        aria-label="移除 ${escapeHtml(tag.name)}"
      >×</button>
    </span>`;
}

function collectTagsFromPicker(picker: HTMLElement): DishTag[] {
  const tags: DishTag[] = [];
  picker.querySelectorAll<HTMLElement>("[data-dish-tag]").forEach((tag) => {
    const id = tag.getAttribute("data-dish-id");
    const name = tag.getAttribute("data-dish-name");
    if (id && name) tags.push({ id, name });
  });
  return tags;
}

function renderTargetPicker(rule: MenuOrderIntervalRule, enabled: boolean): string {
  const catalog = catalogForTargetType(rule.targetType);
  const selectedIds = new Set(rule.targets.map((t) => t.id));
  const tags =
    rule.targets.length > 0
      ? `<div class="flex flex-wrap gap-1.5 pb-2" data-dish-tags>${rule.targets.map(renderDishTag).join("")}</div>`
      : "";
  const available = catalog.filter((d) => !selectedIds.has(d.id));
  const options = available
    .map(
      (d) =>
        `<option value="${escapeHtml(d.id)}" data-dish-name="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`,
    )
    .join("");
  const placeholder =
    rule.targetType === "dish-set"
      ? available.length === 0
        ? "已选全部可选菜品集"
        : "请选择菜品集"
      : available.length === 0
        ? "已选全部可选菜品"
        : "请选择菜品";

  return `
    <div
      class="w-full rounded-md border border-input bg-background px-2 py-2"
      data-menu-order-interval-target-picker
      data-rule-id="${escapeHtml(rule.id)}"
      data-target-type="${escapeHtml(rule.targetType)}"
    >
      ${tags}
      <select
        class="${SELECT_CLASS} w-full"
        data-menu-order-interval-target-select
        aria-label="${rule.targetType === "dish-set" ? "选择菜品集" : "选择菜品"}"
        ${!enabled || available.length === 0 ? "disabled" : ""}
      >
        <option value="">${escapeHtml(placeholder)}</option>
        ${options}
      </select>
    </div>`;
}

function renderRuleRow(rule: MenuOrderIntervalRule, enabled: boolean, showRemove: boolean): string {
  const removeBtn = showRemove
    ? `<button type="button" class="shrink-0 text-sm text-muted-foreground hover:text-destructive" data-menu-order-interval-remove aria-label="删除本条">删除</button>`
    : "";
  return `
    <div
      class="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
      data-menu-order-interval-rule-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span>指定</span>
          <select
            class="${SELECT_CLASS}"
            data-menu-order-interval-target-type
            ${enabled ? "" : "disabled"}
            aria-label="指定类型"
          >
            <option value="dish" ${rule.targetType === "dish" ? "selected" : ""}>菜品</option>
            <option value="dish-set" ${rule.targetType === "dish-set" ? "selected" : ""}>菜品集</option>
          </select>
          <span>下单时间间隔:</span>
          <input
            type="number"
            inputmode="numeric"
            min="${INTERVAL_MIN}"
            max="${INTERVAL_MAX}"
            step="1"
            class="${NUMBER_INPUT_CLASS}"
            value="${rule.intervalMinutes}"
            data-menu-order-interval-minutes
            ${enabled ? "" : "disabled"}
            aria-label="下单时间间隔分钟数"
          />
          <span>分钟</span>
        </div>
        ${removeBtn}
      </div>
      ${renderTargetPicker(rule, enabled)}
    </div>`;
}

function renderRulesEditorInner(enabled: boolean): string {
  const rules = readGuestMenuOrderIntervalRules();
  const showRemove = rules.length > 1;
  return rules.map((rule) => renderRuleRow(rule, enabled, showRemove)).join("");
}

function renderRulesEditorHtml(enabled: boolean): string {
  return `
    <div
      class="space-y-3"
      data-menu-order-interval-editor
      data-storage-id="${escapeHtml(RULES_STORAGE_ID)}"
    >
      <div class="flex items-center justify-end">
        <button
          type="button"
          class="text-sm font-medium text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          data-menu-order-interval-add
          ${enabled ? "" : "disabled"}
        >增加</button>
      </div>
      <div class="space-y-3" data-menu-order-interval-rows>${renderRulesEditorInner(enabled)}</div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        可配置多条规则：指定菜品或菜品集的最小下单间隔（分钟）；小于间隔时需服务员授权（原型 localStorage）。
      </p>
    </div>`;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestMenuOrderIntervalLines());
  const cells = GUEST_MENU_ORDER_INTERVAL_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-menu-order-interval-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-menu-order-interval-lines="${GUEST_MENU_ORDER_INTERVAL_SEQ}"
      role="group"
      aria-label="菜单下单时间间隔适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestMenuOrderIntervalPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 space-y-4 ${hidden}"
      data-menu-order-interval-panel="${GUEST_MENU_ORDER_INTERVAL_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
        ${renderLinesMultiselectHtml(on)}
      </div>
      ${renderRulesEditorHtml(on)}
    </div>`;
}

export function setGuestMenuOrderIntervalPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-menu-order-interval-panel="${GUEST_MENU_ORDER_INTERVAL_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("input, select, button").forEach((el) => {
        el.disabled = !visible;
      });
      panel.querySelectorAll("label").forEach((label) => {
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
      if (!visible) return;
      panel.querySelectorAll<HTMLElement>("[data-menu-order-interval-editor]").forEach((editor) => {
        rerenderMenuOrderIntervalEditor(editor, true);
      });
    });
}

function persistMenuOrderIntervalEditor(editor: HTMLElement): void {
  const rules: MenuOrderIntervalRule[] = [];
  editor.querySelectorAll<HTMLElement>("[data-menu-order-interval-rule-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const typeSelect = row.querySelector<HTMLSelectElement>("[data-menu-order-interval-target-type]");
    const minutesInput = row.querySelector<HTMLInputElement>("[data-menu-order-interval-minutes]");
    const picker = row.querySelector<HTMLElement>("[data-menu-order-interval-target-picker]");
    if (!picker) return;
    rules.push({
      id: ruleId,
      targetType: normalizeTargetType(typeSelect?.value),
      intervalMinutes: normalizeMinutes(minutesInput?.value),
      targets: collectTagsFromPicker(picker),
    });
  });
  writeGuestMenuOrderIntervalRules(rules);
}

function rerenderMenuOrderIntervalEditor(editor: HTMLElement, enabled: boolean): void {
  const rowsWrap = editor.querySelector<HTMLElement>("[data-menu-order-interval-rows]");
  if (!rowsWrap) return;
  // 仅从 storage 重绘；勿在重绘前 persist DOM，否则「增加/删除」刚写入的 rules 会被旧 DOM 覆盖。
  delete editor.dataset.menuOrderIntervalBound;
  rowsWrap.innerHTML = renderRulesEditorInner(enabled);
  bindMenuOrderIntervalEditor(editor);
}

function appendMenuOrderIntervalRule(editor: HTMLElement): void {
  const rules = readGuestMenuOrderIntervalRules();
  rules.push({
    id: newRuleId(),
    targetType: "dish",
    intervalMinutes: INTERVAL_DEFAULT,
    targets: [],
  });
  writeGuestMenuOrderIntervalRules(rules);
  rerenderMenuOrderIntervalEditor(editor, true);
}

function removeMenuOrderIntervalRule(editor: HTMLElement, ruleId: string): void {
  persistMenuOrderIntervalEditor(editor);
  let rules = readGuestMenuOrderIntervalRules().filter((r) => r.id !== ruleId);
  if (rules.length === 0) rules = defaultRules();
  writeGuestMenuOrderIntervalRules(rules);
  rerenderMenuOrderIntervalEditor(editor, true);
}

function onTargetTypeChange(row: HTMLElement, editor: HTMLElement): void {
  persistMenuOrderIntervalEditor(editor);
  const ruleId = row.getAttribute("data-rule-id");
  if (!ruleId) return;
  const typeSelect = row.querySelector<HTMLSelectElement>("[data-menu-order-interval-target-type]");
  const newType = normalizeTargetType(typeSelect?.value);
  const rules = readGuestMenuOrderIntervalRules().map((r) =>
    r.id === ruleId ? { ...r, targetType: newType, targets: [] } : r,
  );
  writeGuestMenuOrderIntervalRules(rules);
  rerenderMenuOrderIntervalEditor(editor, true);
}

function onTargetSelectChange(picker: HTMLElement, select: HTMLSelectElement, editor: HTMLElement): void {
  const targetType = normalizeTargetType(picker.getAttribute("data-target-type"));
  const dishId = select.value;
  if (!dishId) return;
  const dish = catalogForTargetType(targetType).find((d) => d.id === dishId);
  if (!dish) return;
  const existing = collectTagsFromPicker(picker);
  if (existing.some((t) => t.id === dishId)) {
    select.value = "";
    return;
  }
  let tagsWrap = picker.querySelector<HTMLElement>("[data-dish-tags]");
  if (!tagsWrap) {
    picker.insertAdjacentHTML("afterbegin", `<div class="flex flex-wrap gap-1.5 pb-2" data-dish-tags></div>`);
    tagsWrap = picker.querySelector<HTMLElement>("[data-dish-tags]");
  }
  tagsWrap?.insertAdjacentHTML("beforeend", renderDishTag(dish));
  select.value = "";
  persistMenuOrderIntervalEditor(editor);
  rerenderMenuOrderIntervalEditor(editor, true);
}

function onTargetTagRemove(picker: HTMLElement, dishId: string, editor: HTMLElement): void {
  picker.querySelectorAll<HTMLElement>("[data-dish-tag]").forEach((tag) => {
    if (tag.getAttribute("data-dish-id") === dishId) tag.remove();
  });
  if (!picker.querySelector("[data-dish-tag]")) {
    picker.querySelector("[data-dish-tags]")?.remove();
  }
  persistMenuOrderIntervalEditor(editor);
  rerenderMenuOrderIntervalEditor(editor, true);
}

function bindMenuOrderIntervalEditor(editor: HTMLElement): void {
  if (editor.dataset.menuOrderIntervalBound === "1") return;
  editor.dataset.menuOrderIntervalBound = "1";

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const addBtn = target.closest<HTMLButtonElement>("[data-menu-order-interval-add]");
    if (addBtn) {
      if (addBtn.disabled) return;
      e.preventDefault();
      persistMenuOrderIntervalEditor(editor);
      appendMenuOrderIntervalRule(editor);
      return;
    }
    const removeBtn = target.closest("[data-menu-order-interval-remove]");
    if (removeBtn) {
      const row = removeBtn.closest<HTMLElement>("[data-menu-order-interval-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) removeMenuOrderIntervalRule(editor, ruleId);
      return;
    }
    const tagRemove = target.closest("[data-menu-order-interval-tag-remove]");
    if (tagRemove) {
      const tag = tagRemove.closest<HTMLElement>("[data-dish-tag]");
      const picker = tag?.closest<HTMLElement>("[data-menu-order-interval-target-picker]");
      const dishId = tag?.getAttribute("data-dish-id");
      if (picker && dishId) onTargetTagRemove(picker, dishId, editor);
    }
  });

  editor.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    const typeSelect = target.closest<HTMLSelectElement>("[data-menu-order-interval-target-type]");
    if (typeSelect) {
      const row = typeSelect.closest<HTMLElement>("[data-menu-order-interval-rule-row]");
      if (row) onTargetTypeChange(row, editor);
      return;
    }
    const targetSelect = target.closest<HTMLSelectElement>("[data-menu-order-interval-target-select]");
    if (targetSelect) {
      const picker = targetSelect.closest<HTMLElement>("[data-menu-order-interval-target-picker]");
      if (picker) onTargetSelectChange(picker, targetSelect, editor);
      return;
    }
    if (target.matches("[data-menu-order-interval-minutes]")) {
      persistMenuOrderIntervalEditor(editor);
    }
  });

  editor.addEventListener("blur", (e) => {
    if ((e.target as HTMLElement).matches("[data-menu-order-interval-minutes]")) {
      persistMenuOrderIntervalEditor(editor);
    }
  }, true);
}

export function bindGuestMenuOrderIntervalUi(root: ParentNode = document): void {
  ensureGuestMenuOrderIntervalToggleMigrated();

  root.querySelectorAll<HTMLElement>("[data-menu-order-interval-lines]").forEach((group) => {
    if (group.dataset.menuOrderIntervalLinesBound === "1") return;
    group.dataset.menuOrderIntervalLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-menu-order-interval-line]")) return;
      const lines: GuestMenuOrderIntervalProductLineId[] = [];
      group.querySelectorAll<HTMLInputElement>("[data-menu-order-interval-line]:checked").forEach((input) => {
        const id = input.getAttribute("data-menu-order-interval-line");
        if (id && ALL_LINE_IDS.includes(id as GuestMenuOrderIntervalProductLineId)) {
          lines.push(id as GuestMenuOrderIntervalProductLineId);
        }
      });
      writeGuestMenuOrderIntervalLines(lines);
    });
  });

  root.querySelectorAll<HTMLElement>("[data-menu-order-interval-editor]").forEach((editor) => {
    bindMenuOrderIntervalEditor(editor);
  });
}
