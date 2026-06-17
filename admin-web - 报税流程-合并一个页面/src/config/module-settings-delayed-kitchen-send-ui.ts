/**
 * 前厅 · 送厨流程：seq 125 延迟送厨时间（多条规则：延迟分钟 + 适用商品）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  collectTagsFromPicker,
  newRuleId,
  onDishSelectChange,
  onDishTagRemove,
  renderDishPicker,
  type DishTag,
} from "./module-settings-dish-rules-ui";

export const DELAYED_KITCHEN_SEND_SEQ = 125;

const RULES_STORAGE_ID = "125-delayed-kitchen-send-rules";

const DELAY_MIN = 0;
const DELAY_MAX = 1440;
const DELAY_DEFAULT = 5;

const NUMBER_INPUT_CLASS =
  "w-20 h-8 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type DelayedKitchenSendRule = {
  id: string;
  delayMinutes: number;
  dishes: DishTag[];
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
    const row = item as Partial<DelayedKitchenSendRule>;
    return {
      id: typeof row.id === "string" && row.id ? row.id : newRuleId(),
      delayMinutes: normalizeDelayMinutes(row.delayMinutes),
      dishes: Array.isArray(row.dishes)
        ? row.dishes.filter((d): d is DishTag => Boolean(d?.id && d?.name))
        : [],
    };
  });
}

function defaultRules(): DelayedKitchenSendRule[] {
  return [{ id: newRuleId(), delayMinutes: DELAY_DEFAULT, dishes: [] }];
}

export function readDelayedKitchenSendRules(): DelayedKitchenSendRule[] {
  const raw = readModuleSettingJson<unknown>(RULES_STORAGE_ID, []);
  const normalized = normalizeRules(raw);
  return normalized.length > 0 ? normalized : defaultRules();
}

export function writeDelayedKitchenSendRules(rules: DelayedKitchenSendRule[]): void {
  writeModuleSettingJson(RULES_STORAGE_ID, rules);
}

export function isDelayedKitchenSendSeq(seq: number): boolean {
  return seq === DELAYED_KITCHEN_SEND_SEQ;
}

function renderRuleRow(rule: DelayedKitchenSendRule, parentSeq: number, isLast: boolean): string {
  const removeBtn =
    !isLast || readDelayedKitchenSendRules().length > 1
      ? `<button type="button" class="shrink-0 text-sm text-muted-foreground hover:text-destructive" data-delayed-kitchen-send-remove aria-label="删除本条">删除</button>`
      : "";
  return `
    <div
      class="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3"
      data-delayed-kitchen-send-rule-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span>下单后</span>
          <input
            type="number"
            inputmode="numeric"
            min="${DELAY_MIN}"
            max="${DELAY_MAX}"
            step="1"
            class="${NUMBER_INPUT_CLASS}"
            value="${rule.delayMinutes}"
            data-delayed-kitchen-send-minutes
            aria-label="延迟送厨分钟数"
          />
          <span>分钟自动送厨</span>
        </div>
        ${removeBtn}
      </div>
      <div class="space-y-1.5">
        <span class="text-sm font-medium text-foreground">适用商品</span>
        ${renderDishPicker(parentSeq, rule.id, "dishes", rule.dishes, "select")}
      </div>
      ${
        isLast
          ? `<div class="flex justify-end pt-1"><button type="button" class="text-sm font-medium text-primary hover:underline" data-delayed-kitchen-send-add>添加送厨时间</button></div>`
          : ""
      }
    </div>`;
}

export function renderDelayedKitchenSendEditorHtml(parentSeq: number): string {
  const rules = readDelayedKitchenSendRules();
  const rows = rules
    .map((rule, i) => renderRuleRow(rule, parentSeq, i === rules.length - 1))
    .join("");
  return `
    <div
      class="space-y-3"
      data-delayed-kitchen-send-editor
      data-storage-id="${escapeHtml(RULES_STORAGE_ID)}"
      data-parent-seq="${parentSeq}"
    >
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">可配置多条延迟送厨时间；每条规则指定延迟分钟数及适用的商品（未选商品时表示该条规则暂不生效，原型演示）。</p>
      ${rows}
    </div>`;
}

function persistDelayedKitchenSendEditor(editor: HTMLElement): void {
  const rules: DelayedKitchenSendRule[] = [];
  editor.querySelectorAll("[data-delayed-kitchen-send-rule-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const minutesInput = row.querySelector<HTMLInputElement>("[data-delayed-kitchen-send-minutes]");
    const dishPicker = row.querySelector<HTMLElement>('[data-dish-picker][data-picker-role="dishes"]');
    if (!dishPicker) return;
    rules.push({
      id: ruleId,
      delayMinutes: normalizeDelayMinutes(minutesInput?.value),
      dishes: collectTagsFromPicker(dishPicker),
    });
  });
  writeDelayedKitchenSendRules(rules.length > 0 ? rules : defaultRules());
}

function rerenderDelayedKitchenSendEditor(editor: HTMLElement): void {
  const parentSeq = Number(editor.getAttribute("data-parent-seq") ?? DELAYED_KITCHEN_SEND_SEQ);
  const rules = readDelayedKitchenSendRules();
  delete editor.dataset.delayedKitchenSendBound;
  editor.innerHTML = `
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">可配置多条延迟送厨时间；每条规则指定延迟分钟数及适用的商品（未选商品时表示该条规则暂不生效，原型演示）。</p>
      ${rules.map((rule, i) => renderRuleRow(rule, parentSeq, i === rules.length - 1)).join("")}`;
  bindDelayedKitchenSendEditor(editor);
}

function appendDelayedKitchenSendRule(editor: HTMLElement): void {
  const rules = readDelayedKitchenSendRules();
  rules.push({ id: newRuleId(), delayMinutes: DELAY_DEFAULT, dishes: [] });
  writeDelayedKitchenSendRules(rules);
  rerenderDelayedKitchenSendEditor(editor);
}

function removeDelayedKitchenSendRule(editor: HTMLElement, ruleId: string): void {
  let rules = readDelayedKitchenSendRules().filter((r) => r.id !== ruleId);
  if (rules.length === 0) rules = defaultRules();
  writeDelayedKitchenSendRules(rules);
  rerenderDelayedKitchenSendEditor(editor);
}

function bindDelayedKitchenSendEditor(editor: HTMLElement): void {
  if (editor.dataset.delayedKitchenSendBound === "1") return;
  editor.dataset.delayedKitchenSendBound = "1";

  editor.addEventListener("delayed-kitchen-send-update", () => {
    persistDelayedKitchenSendEditor(editor);
  });

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-delayed-kitchen-send-add]")) {
      persistDelayedKitchenSendEditor(editor);
      appendDelayedKitchenSendRule(editor);
      return;
    }
    const removeBtn = target.closest("[data-delayed-kitchen-send-remove]");
    if (removeBtn) {
      const row = removeBtn.closest("[data-delayed-kitchen-send-rule-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) removeDelayedKitchenSendRule(editor, ruleId);
      return;
    }
    const dishRemove = target.closest("[data-dish-tag-remove]");
    if (dishRemove) {
      const tag = dishRemove.closest("[data-dish-tag]");
      const picker = tag?.closest<HTMLElement>("[data-dish-picker]");
      const dishId = tag?.getAttribute("data-dish-id");
      if (picker && dishId) onDishTagRemove(picker, dishId);
    }
  });

  editor.addEventListener("change", (e) => {
    const select = (e.target as HTMLElement).closest<HTMLSelectElement>("[data-dish-select]");
    if (select) {
      const picker = select.closest<HTMLElement>("[data-dish-picker]");
      if (picker) onDishSelectChange(picker, select);
      return;
    }
    const minutes = (e.target as HTMLElement).closest<HTMLInputElement>(
      "[data-delayed-kitchen-send-minutes]",
    );
    if (minutes) persistDelayedKitchenSendEditor(editor);
  });

  editor.addEventListener("input", (e) => {
    const minutes = (e.target as HTMLElement).closest<HTMLInputElement>(
      "[data-delayed-kitchen-send-minutes]",
    );
    if (minutes) persistDelayedKitchenSendEditor(editor);
  });
}

export function bindDelayedKitchenSendUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-delayed-kitchen-send-editor]").forEach((editor) => {
    bindDelayedKitchenSendEditor(editor);
  });
}
