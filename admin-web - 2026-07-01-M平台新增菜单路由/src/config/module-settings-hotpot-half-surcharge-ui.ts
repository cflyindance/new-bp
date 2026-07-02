/**
 * 前厅 · 食客端·下单与规则：seq 575 同一锅型，相同锅底超过一半默认加收
 * （主开关 + 可新增规则：额外加收金额 + 火锅锅底树形多选）。
 */

import type { DishTag } from "./module-settings-dish-rules-ui";
import { newRuleId } from "./module-settings-dish-rules-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const HOTPOT_HALF_SURCHARGE_SEQ = 575;

const RULES_STORAGE_ID = "575-hotpot-half-surcharge-rules";

const AMOUNT_MIN = 0;
const AMOUNT_MAX = 99999;
const AMOUNT_DEFAULT = 0;

const NUMBER_INPUT_CLASS =
  "w-24 h-8 rounded-md border border-input bg-background px-2 text-sm tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type HotpotTreeNode = {
  id: string;
  name: string;
  children?: HotpotTreeNode[];
};

/** 原型火锅底树（后续对接菜单 API） */
export const HOTPOT_BASE_TREE: HotpotTreeNode[] = [
  {
    id: "mg-hotpot-base",
    name: "火锅底",
    children: [
      {
        id: "mg-specialty-base",
        name: "特色锅底",
        children: [
          { id: "hb-secret-original", name: "秘制原味锅" },
          { id: "hb-secret-spicy", name: "秘制香辣锅" },
          { id: "hb-secret-yuanyang", name: "秘制鸳鸯锅" },
          { id: "hb-mushroom", name: "上素香菇锅" },
        ],
      },
    ],
  },
];

export type HotpotHalfSurchargeRule = {
  id: string;
  surchargeAmount: number;
  bases: DishTag[];
};

let toggleMigrated = false;
let treeDropdownDocumentCloseBound = false;

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

function normalizeRules(raw: unknown): HotpotHalfSurchargeRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row = item as Partial<HotpotHalfSurchargeRule>;
    return {
      id: typeof row.id === "string" && row.id ? row.id : newRuleId(),
      surchargeAmount: normalizeAmount(row.surchargeAmount),
      bases: Array.isArray(row.bases)
        ? row.bases.filter((b): b is DishTag => Boolean(b?.id && b?.name))
        : [],
    };
  });
}

function defaultRules(): HotpotHalfSurchargeRule[] {
  return [{ id: newRuleId(), surchargeAmount: AMOUNT_DEFAULT, bases: [] }];
}

export function readHotpotHalfSurchargeRules(): HotpotHalfSurchargeRule[] {
  const raw = readModuleSettingJson<unknown>(RULES_STORAGE_ID, []);
  const normalized = normalizeRules(raw);
  return normalized.length > 0 ? normalized : defaultRules();
}

export function writeHotpotHalfSurchargeRules(rules: HotpotHalfSurchargeRule[]): void {
  writeModuleSettingJson(RULES_STORAGE_ID, rules.length > 0 ? rules : defaultRules());
}

export function isHotpotHalfSurchargeSeq(seq: number): boolean {
  return seq === HOTPOT_HALF_SURCHARGE_SEQ;
}

function collectLeafNodes(nodes: HotpotTreeNode[]): DishTag[] {
  const leaves: DishTag[] = [];
  const walk = (list: HotpotTreeNode[]) => {
    for (const node of list) {
      if (node.children?.length) walk(node.children);
      else leaves.push({ id: node.id, name: node.name });
    }
  };
  walk(nodes);
  return leaves;
}

const ALL_LEAF_BASES = collectLeafNodes(HOTPOT_BASE_TREE);

function renderTreeBranch(nodes: HotpotTreeNode[], selectedIds: Set<string>, depth: number): string {
  return nodes
    .map((node) => {
      const hasChildren = Boolean(node.children?.length);
      const pad = depth * 12;
      if (hasChildren) {
        const childrenHtml = renderTreeBranch(node.children!, selectedIds, depth + 1);
        return `
          <li class="list-none" data-hotpot-tree-branch>
            <div class="flex items-center gap-1 py-1.5 pr-2 text-sm text-foreground" style="padding-left:${pad}px">
              <button
                type="button"
                class="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                data-hotpot-tree-expand
                aria-expanded="true"
                aria-label="展开 ${escapeHtml(node.name)}"
              >
                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <span class="font-medium">${escapeHtml(node.name)}</span>
            </div>
            <ul class="list-none p-0" data-hotpot-tree-children>${childrenHtml}</ul>
          </li>`;
      }
      const checked = selectedIds.has(node.id);
      return `
          <li class="list-none">
            <label
              class="flex cursor-pointer items-center gap-2 py-1.5 pr-3 text-sm text-foreground hover:bg-muted"
              style="padding-left:${pad + 28}px"
            >
              <input
                type="checkbox"
                class="size-4 shrink-0 accent-primary"
                data-hotpot-base-choice
                data-base-id="${escapeHtml(node.id)}"
                data-base-name="${escapeHtml(node.name)}"
                value="${escapeHtml(node.id)}"
                ${checked ? "checked" : ""}
              />
              <span class="min-w-0 truncate">${escapeHtml(node.name)}</span>
            </label>
          </li>`;
    })
    .join("");
}

function renderTreeTriggerLabel(bases: DishTag[]): string {
  if (bases.length === 0) {
    return `<span class="text-sm text-muted-foreground" data-hotpot-tree-placeholder>请选择锅底</span>`;
  }
  const text = bases.map((b) => b.name).join("、");
  return `<span class="block min-w-0 truncate text-sm text-foreground" title="${escapeHtml(text)}">${escapeHtml(text)}</span>`;
}

function renderHotpotBaseTreeDropdown(ruleId: string, bases: DishTag[]): string {
  const selectedIds = new Set(bases.map((b) => b.id));
  return `
    <div
      class="relative w-full min-w-0"
      data-hotpot-tree-dropdown
      data-rule-id="${escapeHtml(ruleId)}"
    >
      <button
        type="button"
        class="flex min-h-9 w-full items-stretch overflow-hidden rounded-md border border-input bg-card p-0 text-left text-sm shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-hotpot-tree-trigger
        aria-haspopup="tree"
        aria-expanded="false"
      >
        <span class="flex min-w-0 flex-1 items-center px-3 py-1.5" data-hotpot-tree-trigger-label>
          ${renderTreeTriggerLabel(bases)}
        </span>
        <span class="flex w-9 shrink-0 items-center justify-center border-l border-border bg-card" aria-hidden="true">
          <svg class="size-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </button>
      <div
        class="hotpot-tree-menu fixed z-[200] hidden max-h-60 min-w-[16rem] overflow-y-auto overscroll-y-contain rounded-md border border-border bg-card py-1 text-card-foreground shadow-lg"
        data-hotpot-tree-menu
        role="tree"
        aria-multiselectable="true"
      >
        <ul class="list-none p-0">${renderTreeBranch(HOTPOT_BASE_TREE, selectedIds, 0)}</ul>
      </div>
    </div>`;
}

function renderRuleRow(rule: HotpotHalfSurchargeRule, showRemove: boolean): string {
  const removeBtn = showRemove
    ? `<button type="button" class="shrink-0 text-sm font-medium text-destructive hover:underline" data-hotpot-half-surcharge-remove aria-label="删除本条">删除</button>`
    : "";
  return `
    <div
      class="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
      data-hotpot-half-surcharge-row
      data-rule-id="${escapeHtml(rule.id)}"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span>额外加收:</span>
          <span class="text-muted-foreground">$</span>
          <input
            type="number"
            inputmode="decimal"
            min="${AMOUNT_MIN}"
            max="${AMOUNT_MAX}"
            step="0.01"
            class="${NUMBER_INPUT_CLASS}"
            value="${rule.surchargeAmount}"
            data-hotpot-half-surcharge-amount
            aria-label="额外加收金额"
          />
        </div>
        ${removeBtn}
      </div>
      ${renderHotpotBaseTreeDropdown(rule.id, rule.bases)}
    </div>`;
}

function renderEditorInner(): string {
  const rules = readHotpotHalfSurchargeRules();
  const showRemove = rules.length > 1;
  return rules.map((rule) => renderRuleRow(rule, showRemove)).join("");
}

export function renderHotpotHalfSurchargeEditorHtml(): string {
  return `
    <div
      class="space-y-3"
      data-hotpot-half-surcharge-editor
      data-storage-id="${escapeHtml(RULES_STORAGE_ID)}"
    >
      <div class="flex items-center justify-end">
        <button
          type="button"
          class="text-sm font-medium text-primary hover:underline"
          data-hotpot-half-surcharge-add
        >增加</button>
      </div>
      <div class="space-y-3" data-hotpot-half-surcharge-rows>${renderEditorInner()}</div>
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
      panel.querySelectorAll<HTMLInputElement>("input, button").forEach((el) => {
        if (el.matches("[data-hotpot-tree-expand]")) return;
        el.disabled = !visible;
      });
      if (!visible) {
        panel.querySelectorAll<HTMLElement>("[data-hotpot-tree-dropdown]").forEach((d) => {
          setHotpotTreeDropdownOpen(d, false);
        });
      }
    });
}

function collectBasesFromDropdown(dropdown: HTMLElement): DishTag[] {
  const bases: DishTag[] = [];
  dropdown.querySelectorAll<HTMLInputElement>("[data-hotpot-base-choice]:checked").forEach((input) => {
    const id = input.getAttribute("data-base-id") ?? input.value;
    const name = input.getAttribute("data-base-name") ?? "";
    if (id && ALL_LEAF_BASES.some((b) => b.id === id)) {
      bases.push({ id, name: name || ALL_LEAF_BASES.find((b) => b.id === id)?.name || id });
    }
  });
  return bases;
}

function syncHotpotTreeTriggerLabel(dropdown: HTMLElement): void {
  const labelWrap = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-trigger-label]");
  if (!labelWrap) return;
  labelWrap.innerHTML = renderTreeTriggerLabel(collectBasesFromDropdown(dropdown));
}

function clearHotpotTreeMenuPosition(menu: HTMLElement): void {
  menu.style.left = "";
  menu.style.top = "";
  menu.style.width = "";
  menu.style.maxHeight = "";
}

function positionHotpotTreeMenu(dropdown: HTMLElement): void {
  const menu = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-menu]");
  const trigger = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-trigger]");
  if (!menu || !trigger) return;
  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const maxMenuHeight = 280;
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
  const available = openUp ? spaceAbove : spaceBelow;
  const height = Math.min(maxMenuHeight, Math.max(140, available - 8));
  menu.style.width = `${Math.max(rect.width, 256)}px`;
  menu.style.left = `${rect.left}px`;
  menu.style.maxHeight = `${height}px`;
  if (openUp) {
    menu.style.top = `${Math.max(8, rect.top - gap - height)}px`;
  } else {
    menu.style.top = `${rect.bottom + gap}px`;
  }
}

function setHotpotTreeDropdownOpen(dropdown: HTMLElement, open: boolean): void {
  const menu = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-menu]");
  const trigger = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-trigger]");
  if (!menu || !trigger) return;
  if (open) {
    menu.classList.remove("hidden");
    positionHotpotTreeMenu(dropdown);
    trigger.setAttribute("aria-expanded", "true");
  } else {
    menu.classList.add("hidden");
    clearHotpotTreeMenuPosition(menu);
    trigger.setAttribute("aria-expanded", "false");
  }
}

function ensureHotpotTreeDocumentCloseListener(): void {
  if (treeDropdownDocumentCloseBound) return;
  treeDropdownDocumentCloseBound = true;
  document.addEventListener("mousedown", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-hotpot-tree-dropdown]")) return;
    document.querySelectorAll<HTMLElement>("[data-hotpot-tree-dropdown]").forEach((d) => {
      setHotpotTreeDropdownOpen(d, false);
    });
  });
}

function bindHotpotTreeDropdown(dropdown: HTMLElement): void {
  if (dropdown.dataset.hotpotTreeDropdownBound === "1") return;
  dropdown.dataset.hotpotTreeDropdownBound = "1";
  ensureHotpotTreeDocumentCloseListener();

  const trigger = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-trigger]");
  trigger?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const menu = dropdown.querySelector("[data-hotpot-tree-menu]");
    const willOpen = menu?.classList.contains("hidden") ?? true;
    document.querySelectorAll<HTMLElement>("[data-hotpot-tree-dropdown]").forEach((other) => {
      if (other !== dropdown) setHotpotTreeDropdownOpen(other, false);
    });
    setHotpotTreeDropdownOpen(dropdown, willOpen);
  });

  const menu = dropdown.querySelector<HTMLElement>("[data-hotpot-tree-menu]");
  menu?.addEventListener("mousedown", (e) => e.stopPropagation());
  menu?.addEventListener("change", (e) => {
    const cb = (e.target as HTMLElement).closest<HTMLInputElement>("[data-hotpot-base-choice]");
    if (!cb) return;
    syncHotpotTreeTriggerLabel(dropdown);
    const editor = dropdown.closest<HTMLElement>("[data-hotpot-half-surcharge-editor]");
    if (editor) persistHotpotHalfSurchargeEditor(editor);
  });

  dropdown.querySelectorAll<HTMLElement>("[data-hotpot-tree-expand]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const branch = btn.closest<HTMLElement>("[data-hotpot-tree-branch]");
      const children = branch?.querySelector<HTMLElement>("[data-hotpot-tree-children]");
      if (!children) return;
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const next = !expanded;
      btn.setAttribute("aria-expanded", next ? "true" : "false");
      children.classList.toggle("hidden", !next);
      btn.querySelector("svg")?.classList.toggle("-rotate-90", !next);
    });
  });
}

function persistHotpotHalfSurchargeEditor(editor: HTMLElement): void {
  const rules: HotpotHalfSurchargeRule[] = [];
  editor.querySelectorAll<HTMLElement>("[data-hotpot-half-surcharge-row]").forEach((row) => {
    const ruleId = row.getAttribute("data-rule-id") ?? newRuleId();
    const amountInput = row.querySelector<HTMLInputElement>("[data-hotpot-half-surcharge-amount]");
    const dropdown = row.querySelector<HTMLElement>("[data-hotpot-tree-dropdown]");
    rules.push({
      id: ruleId,
      surchargeAmount: normalizeAmount(amountInput?.value),
      bases: dropdown ? collectBasesFromDropdown(dropdown) : [],
    });
  });
  writeHotpotHalfSurchargeRules(rules);
}

function rerenderHotpotHalfSurchargeEditor(editor: HTMLElement): void {
  delete editor.dataset.hotpotHalfSurchargeEditorBound;
  const rowsWrap = editor.querySelector<HTMLElement>("[data-hotpot-half-surcharge-rows]");
  if (rowsWrap) {
    rowsWrap.innerHTML = renderEditorInner();
    bindHotpotHalfSurchargeEditor(editor);
  }
}

function appendHotpotHalfSurchargeRule(editor: HTMLElement): void {
  const rules = readHotpotHalfSurchargeRules();
  rules.push({ id: newRuleId(), surchargeAmount: AMOUNT_DEFAULT, bases: [] });
  writeHotpotHalfSurchargeRules(rules);
  rerenderHotpotHalfSurchargeEditor(editor);
}

function removeHotpotHalfSurchargeRule(editor: HTMLElement, ruleId: string): void {
  let rules = readHotpotHalfSurchargeRules().filter((r) => r.id !== ruleId);
  if (rules.length === 0) rules = defaultRules();
  writeHotpotHalfSurchargeRules(rules);
  rerenderHotpotHalfSurchargeEditor(editor);
}

function bindHotpotHalfSurchargeEditor(editor: HTMLElement): void {
  if (editor.dataset.hotpotHalfSurchargeEditorBound === "1") return;
  editor.dataset.hotpotHalfSurchargeEditorBound = "1";

  editor.querySelectorAll<HTMLElement>("[data-hotpot-tree-dropdown]").forEach(bindHotpotTreeDropdown);

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-hotpot-half-surcharge-add]")) {
      persistHotpotHalfSurchargeEditor(editor);
      appendHotpotHalfSurchargeRule(editor);
      return;
    }
    const removeBtn = target.closest("[data-hotpot-half-surcharge-remove]");
    if (removeBtn) {
      const row = removeBtn.closest<HTMLElement>("[data-hotpot-half-surcharge-row]");
      const ruleId = row?.getAttribute("data-rule-id");
      if (ruleId) removeHotpotHalfSurchargeRule(editor, ruleId);
    }
  });

  const persistAmount = () => persistHotpotHalfSurchargeEditor(editor);
  editor.addEventListener("change", (e) => {
    if ((e.target as HTMLElement).closest("[data-hotpot-half-surcharge-amount]")) persistAmount();
  });
  editor.addEventListener("input", (e) => {
    if ((e.target as HTMLElement).closest("[data-hotpot-half-surcharge-amount]")) persistAmount();
  });
}

export function bindHotpotHalfSurchargeUi(root: ParentNode = document): void {
  ensureHotpotHalfSurchargeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-hotpot-half-surcharge-editor]").forEach((editor) => {
    bindHotpotHalfSurchargeEditor(editor);
  });
}
