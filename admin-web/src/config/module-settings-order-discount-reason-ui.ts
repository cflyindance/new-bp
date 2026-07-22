/**
 * 订单 · 折扣：seq 162 折扣原因展示策略（单选）；seq 163 自定义折扣原因（列表 + 勾选启用）。
 */

import {
  MODULE_SETTING_CHOICE_CONTROL_CLASS,
  renderModuleSettingSingleChoiceHtml,
} from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingRadio,
  readModuleSettingText,
  writeModuleSettingJson,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";
import { readModuleSettingToggleOn } from "./module-settings-toggle-ui";

export const ORDER_DISCOUNT_REASON_REQUIRE_SEQ = 162;
export const ORDER_DISCOUNT_REASON_REQUIRE_FIELD_ID = "162-discount-reason-require-mode";
const REQUIRE_GROUP_NAME = "module-setting-radio-162-discount-reason-require";

export const ORDER_DISCOUNT_REASON_REQUIRE_OPTIONS = [
  { value: "required", label: "必填" },
  { value: "optional", label: "非必填" },
  { value: "hidden", label: "不展示折扣原因" },
] as const;

export type OrderDiscountReasonRequireMode =
  (typeof ORDER_DISCOUNT_REASON_REQUIRE_OPTIONS)[number]["value"];

export const ORDER_DISCOUNT_REASON_SEQ = 163;

/** @deprecated 旧版单条默认原因文本；仅用于迁移到列表 */
export const ORDER_DISCOUNT_REASON_TEXT_FIELD_ID = "163-discount-reason-default";

export const ORDER_DISCOUNT_REASONS_FIELD_ID = "163-discount-reasons";

export type DiscountReasonItem = {
  id: string;
  text: string;
  enabled: boolean;
};

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidRequireMode(value: string): value is OrderDiscountReasonRequireMode {
  return ORDER_DISCOUNT_REASON_REQUIRE_OPTIONS.some((opt) => opt.value === value);
}

/** 兼容旧开关：开→必填，关→非必填 */
function migrateRequireModeFromToggle(): OrderDiscountReasonRequireMode {
  return readModuleSettingToggleOn(ORDER_DISCOUNT_REASON_REQUIRE_SEQ) ? "required" : "optional";
}

export function readOrderDiscountReasonRequireMode(): OrderDiscountReasonRequireMode {
  const stored = readModuleSettingRadio(ORDER_DISCOUNT_REASON_REQUIRE_FIELD_ID, "");
  if (isValidRequireMode(stored)) return stored;
  // 未写入新字段时，按旧开关映射展示（用户改选后由 radio 持久化）
  return migrateRequireModeFromToggle();
}

export function writeOrderDiscountReasonRequireMode(mode: OrderDiscountReasonRequireMode): void {
  writeModuleSettingRadio(ORDER_DISCOUNT_REASON_REQUIRE_FIELD_ID, mode);
}

export function isOrderDiscountReasonRequireSeq(seq: number): boolean {
  return seq === ORDER_DISCOUNT_REASON_REQUIRE_SEQ;
}

export function renderOrderDiscountReasonRequireSelectHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: ORDER_DISCOUNT_REASON_REQUIRE_OPTIONS,
    fieldId: ORDER_DISCOUNT_REASON_REQUIRE_FIELD_ID,
    groupName: REQUIRE_GROUP_NAME,
    currentValue: readOrderDiscountReasonRequireMode(),
    layout: "vertical",
    ariaLabel: "折扣原因必填",
  });
}

function newReasonId(): string {
  return `reason-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeReason(raw: Partial<DiscountReasonItem>): DiscountReasonItem {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newReasonId(),
    text: typeof raw.text === "string" ? raw.text.trim() : "",
    enabled: raw.enabled === true,
  };
}

function migrateLegacyDefaultReason(): DiscountReasonItem[] {
  const legacy = readModuleSettingText(ORDER_DISCOUNT_REASON_TEXT_FIELD_ID, "").trim();
  if (!legacy) return [];
  return [{ id: newReasonId(), text: legacy, enabled: true }];
}

export function readDiscountReasons(): DiscountReasonItem[] {
  const raw = readModuleSettingJson<Partial<DiscountReasonItem>[]>(ORDER_DISCOUNT_REASONS_FIELD_ID, []);
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item) => normalizeReason(item)).filter((item) => item.text.length > 0);
  }
  // 兼容：若新列表为空且旧默认文本存在，迁移为一条已启用原因
  const migrated = migrateLegacyDefaultReason();
  if (migrated.length > 0) {
    writeDiscountReasons(migrated);
    return migrated;
  }
  return [];
}

export function writeDiscountReasons(items: DiscountReasonItem[]): void {
  writeModuleSettingJson(
    ORDER_DISCOUNT_REASONS_FIELD_ID,
    items.map((item) => normalizeReason(item)).filter((item) => item.text.length > 0),
  );
}

export function isOrderDiscountReasonSeq(seq: number): boolean {
  return seq === ORDER_DISCOUNT_REASON_SEQ;
}

function renderReasonRow(item: DiscountReasonItem): string {
  return `
    <tr class="border-t border-border" data-discount-reason-row data-reason-id="${escapeHtml(item.id)}">
      <td class="px-3 py-2.5 w-[5.5rem]">
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            data-discount-reason-enabled
            ${item.enabled ? "checked" : ""}
            aria-label="启用该自定义折扣原因"
          />
          <span class="text-xs text-muted-foreground">${item.enabled ? "已启用" : "未启用"}</span>
        </label>
      </td>
      <td class="px-3 py-2.5">
        <span class="text-sm text-foreground">${escapeHtml(item.text)}</span>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap w-[4.5rem]">
        <button
          type="button"
          class="text-xs font-medium text-destructive hover:underline"
          data-discount-reason-remove
        >删除</button>
      </td>
    </tr>`;
}

function renderReasonTableInner(items: DiscountReasonItem[]): string {
  if (items.length === 0) return "";
  const rows = items.map((item) => renderReasonRow(item)).join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[22rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[5.5rem]">启用</th>
            <th class="px-3 py-2 font-medium">自定义折扣原因</th>
            <th class="px-3 py-2 text-right font-medium w-[4.5rem]">操作</th>
          </tr>
        </thead>
        <tbody data-discount-reason-list>${rows}</tbody>
      </table>
    </div>`;
}

function renderReasonCreateDialog(): string {
  return `
    <div class="fixed inset-0 z-[10040] hidden items-start justify-center overflow-y-auto p-4 sm:items-center" data-discount-reason-dialog aria-hidden="true">
      <button type="button" class="absolute inset-0 bg-black/45" data-discount-reason-dialog-close aria-label="关闭"></button>
      <div class="relative z-10 my-6 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="discount-reason-dialog-title">
        <div class="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 id="discount-reason-dialog-title" class="text-base font-semibold text-foreground">新增自定义折扣原因</h3>
          <button type="button" class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-discount-reason-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="px-5 py-4">
          <label class="block space-y-1.5">
            <span class="text-sm text-foreground">自定义折扣原因</span>
            <input
              class="${INPUT_CLASS}"
              type="text"
              maxlength="100"
              placeholder="不能为空"
              data-discount-reason-dialog-text
            />
          </label>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" data-discount-reason-dialog-cancel>取消</button>
          <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" data-discount-reason-dialog-save>保存</button>
        </div>
      </div>
    </div>`;
}

export function renderOrderDiscountReasonEditorHtml(titleBlockHtml: string): string {
  const items = readDiscountReasons();
  const table = items.length > 0 ? renderReasonTableInner(items) : "";
  return `
    <li class="list-none" data-discount-reason-editor data-module-setting-row-seq="${ORDER_DISCOUNT_REASON_SEQ}">
      <div class="border-b border-border px-4 py-3 space-y-3">
        <div class="min-w-0">${titleBlockHtml}</div>
        <div data-discount-reason-table-wrap class="${items.length === 0 ? "hidden" : ""}" ${items.length === 0 ? 'aria-hidden="true"' : ""}>
          ${table}
        </div>
        ${
          items.length === 0
            ? `<p class="m-0 text-xs text-muted-foreground" data-discount-reason-empty>暂无自定义折扣原因，点击下方新增</p>`
            : ""
        }
        <div class="flex justify-start">
          <button
            type="button"
            class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
            data-discount-reason-add
          >新增</button>
        </div>
        ${renderReasonCreateDialog()}
      </div>
    </li>`;
}

/** @deprecated 总开关已移除 */
export function renderOrderDiscountReasonValuePanel(_seq: number, _on: boolean): string {
  return "";
}

/** @deprecated 总开关已移除 */
export function setOrderDiscountReasonPanelVisible(_seq: number, _visible: boolean): void {
  /* no-op */
}

function rerenderReasonTable(editor: HTMLElement): void {
  const items = readDiscountReasons();
  const wrap = editor.querySelector<HTMLElement>("[data-discount-reason-table-wrap]");
  const empty = editor.querySelector<HTMLElement>("[data-discount-reason-empty]");
  if (!wrap) return;

  if (items.length === 0) {
    wrap.innerHTML = "";
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    if (!empty) {
      wrap.insertAdjacentHTML(
        "afterend",
        `<p class="m-0 text-xs text-muted-foreground" data-discount-reason-empty>暂无自定义折扣原因，点击下方新增</p>`,
      );
    }
    return;
  }

  wrap.innerHTML = renderReasonTableInner(items);
  wrap.classList.remove("hidden");
  wrap.removeAttribute("aria-hidden");
  empty?.remove();
}

function openReasonDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-discount-reason-dialog]");
  if (!dialog) return;
  const input = dialog.querySelector<HTMLInputElement>("[data-discount-reason-dialog-text]");
  if (input) input.value = "";
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  dialog.setAttribute("aria-hidden", "false");
  input?.focus();
}

function closeReasonDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-discount-reason-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("aria-hidden", "true");
}

function saveReasonFromDialog(editor: HTMLElement): void {
  const input = editor.querySelector<HTMLInputElement>("[data-discount-reason-dialog-text]");
  const text = input?.value.trim() ?? "";
  if (!text) {
    alert("请输入自定义折扣原因");
    input?.focus();
    return;
  }
  const items = readDiscountReasons();
  if (items.some((item) => item.text === text)) {
    alert("该自定义折扣原因已存在");
    input?.select();
    return;
  }
  items.push({ id: newReasonId(), text, enabled: true });
  writeDiscountReasons(items);
  rerenderReasonTable(editor);
  closeReasonDialog(editor);
}

function toggleReasonEnabled(editor: HTMLElement, reasonId: string, enabled: boolean): void {
  const items = readDiscountReasons().map((item) =>
    item.id === reasonId ? { ...item, enabled } : item,
  );
  writeDiscountReasons(items);
  editor.querySelectorAll<HTMLElement>("[data-discount-reason-row]").forEach((row) => {
    if (row.getAttribute("data-reason-id") !== reasonId) return;
    const label = row.querySelector("label span");
    if (label) label.textContent = enabled ? "已启用" : "未启用";
  });
}

function removeReason(editor: HTMLElement, reasonId: string): void {
  writeDiscountReasons(readDiscountReasons().filter((item) => item.id !== reasonId));
  rerenderReasonTable(editor);
}

export function bindOrderDiscountReasonEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-discount-reason-editor]").forEach((editor) => {
    if (editor.dataset.discountReasonEditorBound === "1") return;
    editor.dataset.discountReasonEditorBound = "1";

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-discount-reason-add]")) {
        openReasonDialog(editor);
        return;
      }
      if (
        target.closest("[data-discount-reason-dialog-cancel]") ||
        target.closest("[data-discount-reason-dialog-close]")
      ) {
        closeReasonDialog(editor);
        return;
      }
      if (target.closest("[data-discount-reason-dialog-save]")) {
        saveReasonFromDialog(editor);
        return;
      }
      const removeBtn = target.closest("[data-discount-reason-remove]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-discount-reason-row]");
        const id = row?.getAttribute("data-reason-id");
        if (id) removeReason(editor, id);
      }
    });

    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-discount-reason-enabled]")) return;
      const row = el.closest<HTMLElement>("[data-discount-reason-row]");
      const id = row?.getAttribute("data-reason-id");
      const checked = (el as HTMLInputElement).checked;
      if (id) toggleReasonEnabled(editor, id, checked);
    });

    editor.addEventListener("keydown", (e) => {
      const dialog = editor.querySelector<HTMLElement>("[data-discount-reason-dialog]");
      if (!dialog || dialog.classList.contains("hidden")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeReasonDialog(editor);
        return;
      }
      if (e.key === "Enter" && (e.target as HTMLElement).matches("[data-discount-reason-dialog-text]")) {
        e.preventDefault();
        saveReasonFromDialog(editor);
      }
    });
  });
}
