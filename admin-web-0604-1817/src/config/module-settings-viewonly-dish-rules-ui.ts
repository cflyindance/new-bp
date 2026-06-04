/**
 * 前厅 · 食客端·下单与规则：
 * seq 595 允许可看不可点的菜添加至购物车、
 * seq 596 可看不可点的菜弹出服务员授权（主开关 + eMenu / SDI 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const VIEWONLY_DISH_CART_SEQ = 595;
export const VIEWONLY_DISH_AUTH_SEQ = 596;

export const VIEWONLY_DISH_RULES_SEQS: readonly number[] = [
  VIEWONLY_DISH_CART_SEQ,
  VIEWONLY_DISH_AUTH_SEQ,
];

export const VIEWONLY_DISH_RULES_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type ViewonlyDishRulesProductLineId =
  (typeof VIEWONLY_DISH_RULES_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ViewonlyDishRulesProductLineId[] =
  VIEWONLY_DISH_RULES_PRODUCT_LINES.map((l) => l.id);

const LINES_ARIA_LABEL_BY_SEQ: Record<number, string> = {
  [VIEWONLY_DISH_CART_SEQ]: "允许可看不可点菜加购适用产线",
  [VIEWONLY_DISH_AUTH_SEQ]: "可看不可点菜服务员授权适用产线",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linesStorageId(seq: number): string {
  return `${seq}-viewonly-dish-rules-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureViewonlyDishRuleToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
  if (!isViewonlyDishRuleSeq(seq)) return;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

function ensureAllViewonlyDishRuleTogglesMigrated(): void {
  for (const seq of VIEWONLY_DISH_RULES_SEQS) {
    ensureViewonlyDishRuleToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): ViewonlyDishRulesProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is ViewonlyDishRulesProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readViewonlyDishRuleLines(seq: number): ViewonlyDishRulesProductLineId[] {
  if (!isViewonlyDishRuleSeq(seq)) return [];
  ensureViewonlyDishRuleToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writeViewonlyDishRuleLines(seq, all);
    return all;
  }
  return [];
}

export function writeViewonlyDishRuleLines(
  seq: number,
  lines: ViewonlyDishRulesProductLineId[],
): void {
  if (!isViewonlyDishRuleSeq(seq)) return;
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function isViewonlyDishRuleSeq(seq: number): boolean {
  return (VIEWONLY_DISH_RULES_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readViewonlyDishRuleLines(seq));
  const cells = VIEWONLY_DISH_RULES_PRODUCT_LINES.map((line, index) => {
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
          data-viewonly-dish-rule-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const ariaLabel = LINES_ARIA_LABEL_BY_SEQ[seq] ?? "适用产线";

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-viewonly-dish-rule-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderViewonlyDishRulePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-viewonly-dish-rule-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setViewonlyDishRulePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-viewonly-dish-rule-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-viewonly-dish-rule-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): ViewonlyDishRulesProductLineId[] {
  const seq = Number(group.getAttribute("data-viewonly-dish-rule-lines"));
  if (!seq || !isViewonlyDishRuleSeq(seq)) return [];

  const lines: ViewonlyDishRulesProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-viewonly-dish-rule-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-viewonly-dish-rule-line");
    if (id && ALL_LINE_IDS.includes(id as ViewonlyDishRulesProductLineId)) {
      lines.push(id as ViewonlyDishRulesProductLineId);
    }
  });
  writeViewonlyDishRuleLines(seq, lines);
  return lines;
}

export function bindViewonlyDishRulesUi(root: ParentNode = document): void {
  ensureAllViewonlyDishRuleTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-viewonly-dish-rule-lines]").forEach((group) => {
    if (group.dataset.viewonlyDishRuleBound === "1") return;
    group.dataset.viewonlyDishRuleBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-viewonly-dish-rule-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
