/**
 * 前厅 · 开单流程：seq 625 儿童将不参与下单限制规则的人数计算（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ = 625;

const LINES_STORAGE_ID = "625-child-excluded-from-order-limit-lines";

export const CHILD_EXCLUDED_FROM_ORDER_LIMIT_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type ChildExcludedFromOrderLimitProductLineId =
  (typeof CHILD_EXCLUDED_FROM_ORDER_LIMIT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ChildExcludedFromOrderLimitProductLineId[] =
  CHILD_EXCLUDED_FROM_ORDER_LIMIT_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureChildExcludedFromOrderLimitToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (
      localStorage.getItem(moduleSettingToggleStorageKey(CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ)) !==
      null
    ) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ)) {
    try {
      localStorage.setItem(
        moduleSettingToggleStorageKey(CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ),
        "1",
      );
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): ChildExcludedFromOrderLimitProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is ChildExcludedFromOrderLimitProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readChildExcludedFromOrderLimitLines(): ChildExcludedFromOrderLimitProductLineId[] {
  ensureChildExcludedFromOrderLimitToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeChildExcludedFromOrderLimitLines(all);
    return all;
  }
  return [];
}

export function writeChildExcludedFromOrderLimitLines(
  lines: ChildExcludedFromOrderLimitProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isChildExcludedFromOrderLimitSeq(seq: number): boolean {
  return seq === CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readChildExcludedFromOrderLimitLines());
  const cells = CHILD_EXCLUDED_FROM_ORDER_LIMIT_PRODUCT_LINES.map((line, index) => {
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
          data-child-excluded-from-order-limit-line="${escapeHtml(line.id)}"
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
      data-child-excluded-from-order-limit-lines="${CHILD_EXCLUDED_FROM_ORDER_LIMIT_SEQ}"
      role="group"
      aria-label="儿童不计入下单限制规则人数适用产线"
    >
      ${cells}
    </div>`;
}

export function renderChildExcludedFromOrderLimitPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-child-excluded-from-order-limit-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setChildExcludedFromOrderLimitPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-child-excluded-from-order-limit-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-child-excluded-from-order-limit-line]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        });
    });
}

function collectLinesFromGroup(group: HTMLElement): ChildExcludedFromOrderLimitProductLineId[] {
  const lines: ChildExcludedFromOrderLimitProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-child-excluded-from-order-limit-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-child-excluded-from-order-limit-line");
      if (id && ALL_LINE_IDS.includes(id as ChildExcludedFromOrderLimitProductLineId)) {
        lines.push(id as ChildExcludedFromOrderLimitProductLineId);
      }
    });
  writeChildExcludedFromOrderLimitLines(lines);
  return lines;
}

export function bindChildExcludedFromOrderLimitUi(root: ParentNode = document): void {
  ensureChildExcludedFromOrderLimitToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-child-excluded-from-order-limit-lines]").forEach((group) => {
    if (group.dataset.childExcludedFromOrderLimitBound === "1") return;
    group.dataset.childExcludedFromOrderLimitBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-child-excluded-from-order-limit-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
