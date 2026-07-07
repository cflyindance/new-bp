/**
 * POS 点单页工具栏：四区按钮排序/显隐（483–486）+ 跨组移动（483/485/486）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export type PosToolbarButtonDef = { id: string; label: string };

export type PosToolbarButtonState = {
  id: string;
  label: string;
  enabled: boolean;
};

export type PosToolbarGroupConfig = {
  seq: number;
  storageFieldId: string;
  title: string;
  hint: string;
  buttons: PosToolbarButtonDef[];
  defaultEnabled: Record<string, boolean>;
};

const POS_TOOLBAR_GROUPS: PosToolbarGroupConfig[] = [
  {
    seq: 483,
    storageFieldId: "483-pos-toolbar",
    title: "整单操作",
    hint: "订单底部操作，最多展示6个",
    buttons: [
      { id: "split", label: "分单" },
      { id: "delete-order", label: "删单" },
      { id: "save", label: "保存" },
      { id: "exit", label: "退出" },
      { id: "pay", label: "付款" },
      { id: "send-kitchen", label: "送厨" },
      { id: "direct-send", label: "直送" },
      { id: "pay-only", label: "仅付款" },
    ],
    defaultEnabled: {
      split: true,
      "delete-order": true,
      save: true,
      exit: true,
      pay: true,
      "send-kitchen": true,
      "direct-send": false,
      "pay-only": false,
    },
  },
  {
    seq: 484,
    storageFieldId: "484-pos-toolbar",
    title: "菜品详情",
    hint: "选中任意菜品时展示",
    buttons: [
      { id: "divider", label: "分割线" },
      { id: "plus-one", label: "加1" },
      { id: "qty", label: "数量" },
      { id: "minus-one", label: "减1" },
      { id: "note", label: "备注" },
      { id: "tax", label: "税" },
      { id: "seasoning", label: "调味" },
      { id: "change-price", label: "改价" },
    ],
    defaultEnabled: {
      divider: true,
      "plus-one": false,
      qty: true,
      "minus-one": false,
      note: true,
      tax: true,
      seasoning: true,
      "change-price": true,
    },
  },
  {
    seq: 485,
    storageFieldId: "485-pos-toolbar",
    title: "订单信息",
    hint: "选中订单信息顶部时展示",
    buttons: [
      { id: "sort", label: "排序" },
      { id: "guest-info", label: "客人信息" },
      { id: "type", label: "类型" },
      { id: "change-table", label: "换桌" },
      { id: "server", label: "企台" },
      { id: "guest", label: "客人" },
      { id: "order-note", label: "整单备注" },
      { id: "member", label: "会员" },
      { id: "print", label: "打单" },
    ],
    defaultEnabled: {
      sort: true,
      "guest-info": true,
      type: true,
      "change-table": true,
      server: true,
      guest: true,
      "order-note": true,
      member: true,
      print: false,
    },
  },
  {
    seq: 486,
    storageFieldId: "486-pos-toolbar",
    title: "订单金额",
    hint: "选中订单金额区域时展示",
    buttons: [
      { id: "surcharge", label: "加收" },
      { id: "discount", label: "折扣" },
      { id: "tip", label: "小费" },
      { id: "order-tax", label: "整单税" },
    ],
    defaultEnabled: {
      surcharge: true,
      discount: true,
      tip: true,
      "order-tax": true,
    },
  },
];

const GROUP_BY_SEQ = new Map(POS_TOOLBAR_GROUPS.map((g) => [g.seq, g]));

const BUTTON_LABEL_BY_ID = new Map<string, string>();
for (const g of POS_TOOLBAR_GROUPS) {
  for (const b of g.buttons) BUTTON_LABEL_BY_ID.set(b.id, b.label);
}

/** 保存、退出、排序不可跨组移动 */
const POS_TOOLBAR_NON_MOVABLE_IDS = new Set(["save", "exit", "sort"]);

/** 支持跨组移动的三区 */
const POS_TOOLBAR_CROSS_MOVE_SEQS = new Set([483, 485, 486]);

/** 点击「移动」后可选的目标组（不含当前组） */
const POS_TOOLBAR_MOVE_TARGETS: Record<number, number[]> = {
  483: [485, 486],
  485: [486, 483],
  486: [485, 483],
};

export const POS_ORDER_TOOLBAR_GRID_HOST_SEQ = 483;
const POS_ORDER_TOOLBAR_SKIP_SEQS = new Set([484, 485, 486]);

let activeMoveMenu: HTMLElement | null = null;
let activeMoveTrigger: HTMLElement | null = null;

type ScrollDismissTarget = Window | HTMLElement;

let scrollDismissHandler: (() => void) | null = null;
const scrollDismissTargets: ScrollDismissTarget[] = [];

/** 高于设置页顶栏/侧栏 sheet，避免弹层被遮挡 */
const POS_TOOLBAR_MOVE_MENU_Z = 10050;

const SCROLL_DISMISS_OPTS: AddEventListenerOptions = { passive: true, capture: true };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function groupSupportsCrossMove(seq: number): boolean {
  return POS_TOOLBAR_CROSS_MOVE_SEQS.has(seq);
}

function buttonSupportsCrossMove(buttonId: string): boolean {
  return !POS_TOOLBAR_NON_MOVABLE_IDS.has(buttonId);
}

function defaultGroupState(config: PosToolbarGroupConfig): PosToolbarButtonState[] {
  return config.buttons.map((b) => ({
    id: b.id,
    label: b.label,
    enabled: config.defaultEnabled[b.id] ?? true,
  }));
}

function normalizeGroupState(
  config: PosToolbarGroupConfig,
  raw: PosToolbarButtonState[] | null | undefined,
): PosToolbarButtonState[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultGroupState(config);

  return raw
    .filter((item) => item?.id)
    .map((item) => ({
      id: item.id,
      label: BUTTON_LABEL_BY_ID.get(item.id) ?? item.label ?? item.id,
      enabled: Boolean(item.enabled),
    }));
}

export function readPosToolbarGroupState(storageFieldId: string, config: PosToolbarGroupConfig): PosToolbarButtonState[] {
  const raw = readModuleSettingJson<PosToolbarButtonState[]>(storageFieldId, []);
  return normalizeGroupState(config, raw);
}

export function writePosToolbarGroupState(storageFieldId: string, state: PosToolbarButtonState[]): void {
  writeModuleSettingJson(storageFieldId, state);
}

function renderMoveDotsIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>`;
}

function renderMoveMenuOptions(fromSeq: number): string {
  const targets = POS_TOOLBAR_MOVE_TARGETS[fromSeq] ?? [];
  return targets
    .map((targetSeq) => {
      const target = GROUP_BY_SEQ.get(targetSeq);
      if (!target) return "";
      return `
        <button
          type="button"
          class="w-full rounded-md border border-border bg-muted px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          data-pos-toolbar-move-confirm
          data-move-to-seq="${targetSeq}"
        >${escapeHtml(target.title)}</button>`;
    })
    .join("");
}

function renderToolbarButtonRow(button: PosToolbarButtonState, groupSeq: number): string {
  const canMove = groupSupportsCrossMove(groupSeq) && buttonSupportsCrossMove(button.id);
  const moveCell = canMove
    ? `
      <div class="relative shrink-0" data-pos-toolbar-move-anchor>
        <button
          type="button"
          class="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          data-pos-toolbar-move-trigger
          aria-label="移动 ${escapeHtml(button.label)}"
          aria-haspopup="true"
          aria-expanded="false"
        >${renderMoveDotsIcon()}</button>
      </div>`
    : `<span class="inline-block size-7 shrink-0" aria-hidden="true"></span>`;

  return `
    <li
      class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 border-b border-border/60 bg-background px-2 py-2 last:border-b-0"
      data-pos-toolbar-item
      data-button-id="${escapeHtml(button.id)}"
      draggable="true"
    >
      <button
        type="button"
        class="inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted active:cursor-grabbing"
        data-pos-toolbar-drag-handle
        aria-label="拖动排序"
        tabindex="-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </button>
      <span class="min-w-0 truncate text-sm text-foreground">${escapeHtml(button.label)}</span>
      <label class="inline-flex shrink-0 cursor-pointer items-center justify-center">
        <span class="sr-only">启用 ${escapeHtml(button.label)}</span>
        <input
          type="checkbox"
          class="size-4 shrink-0 rounded-full border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-pos-toolbar-enable
          ${button.enabled ? "checked" : ""}
        />
      </label>
      ${moveCell}
    </li>`;
}

function renderToolbarGroupColumn(config: PosToolbarGroupConfig): string {
  const state = readPosToolbarGroupState(config.storageFieldId, config);
  const rows = state.map((b) => renderToolbarButtonRow(b, config.seq)).join("");
  const withMove = groupSupportsCrossMove(config.seq);
  const headerCols = withMove
    ? `
      <div class="grid grid-cols-[1fr_auto_auto] items-center gap-x-2 border-b border-border/80 bg-muted/30 px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <span class="pl-9">功能</span>
        <span class="text-center">启用</span>
        <span class="w-7 text-center">移动</span>
      </div>`
    : `
      <div class="grid grid-cols-[1fr_auto] items-center gap-x-2 border-b border-border/80 bg-muted/30 px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <span class="pl-9">功能</span>
        <span class="pr-1">启用</span>
      </div>`;

  return `
    <div
      class="flex min-w-0 flex-col overflow-visible rounded-lg border border-border bg-card"
      data-pos-toolbar-group
      data-storage-id="${escapeHtml(config.storageFieldId)}"
      data-group-seq="${config.seq}"
    >
      <div class="border-b border-border px-3 py-2.5">
        <h4 class="m-0 text-sm font-semibold text-foreground">${escapeHtml(config.title)}</h4>
        <p class="m-0 mt-0.5 text-xs text-muted-foreground">${escapeHtml(config.hint)}</p>
      </div>
      ${headerCols}
      <ul class="m-0 list-none overflow-visible p-0" data-pos-toolbar-list role="list">${rows}</ul>
    </div>`;
}

function renderPosToolbarGridInnerHtml(): string {
  return POS_TOOLBAR_GROUPS.map(renderToolbarGroupColumn).join("");
}

export function renderPosOrderToolbarGroupsGridHtml(): string {
  return `
    <li class="list-none">
      <div class="border-b border-border px-4 py-3">
        <p class="m-0 text-sm font-medium text-foreground">点单页工具栏配置</p>
        <p class="m-0 mt-1 text-xs text-muted-foreground">拖动排序、勾选启用；整单操作/订单信息/订单金额支持通过「移动」调整按钮归属组</p>
        <div class="relative mt-4 overflow-visible" data-pos-toolbar-grid>
          <div class="grid grid-cols-1 gap-4 overflow-visible xl:grid-cols-2 2xl:grid-cols-4">${renderPosToolbarGridInnerHtml()}</div>
        </div>
      </div>
    </li>`;
}

export function isPosOrderToolbarGridHostSeq(seq: number): boolean {
  return seq === POS_ORDER_TOOLBAR_GRID_HOST_SEQ;
}

export function shouldSkipPosOrderToolbarCatalogRow(seq: number): boolean {
  return POS_ORDER_TOOLBAR_SKIP_SEQS.has(seq);
}

function collectGroupStateFromDom(group: HTMLElement): PosToolbarButtonState[] {
  return [...group.querySelectorAll<HTMLElement>("[data-pos-toolbar-item]")].map((row) => {
    const id = row.getAttribute("data-button-id") ?? "";
    const enabled = row.querySelector<HTMLInputElement>("[data-pos-toolbar-enable]")?.checked ?? false;
    return {
      id,
      label: BUTTON_LABEL_BY_ID.get(id) ?? id,
      enabled,
    };
  });
}

function persistToolbarGroup(group: HTMLElement): void {
  const storageId = group.getAttribute("data-storage-id");
  if (!storageId) return;
  writePosToolbarGroupState(storageId, collectGroupStateFromDom(group));
}

function reorderToolbarList(list: HTMLElement, dragId: string, targetRow: HTMLElement, clientY: number): void {
  if (dragId === targetRow.getAttribute("data-button-id")) return;
  const dragEl = [...list.querySelectorAll<HTMLElement>("[data-pos-toolbar-item]")].find(
    (el) => el.getAttribute("data-button-id") === dragId,
  );
  if (!dragEl) return;
  const rect = targetRow.getBoundingClientRect();
  const after = clientY > rect.top + rect.height / 2;
  if (after) targetRow.after(dragEl);
  else targetRow.before(dragEl);
}

function detachMoveMenuDismissListeners(): void {
  if (!scrollDismissHandler) return;
  for (const target of scrollDismissTargets) {
    if (target === window) {
      window.removeEventListener("scroll", scrollDismissHandler, SCROLL_DISMISS_OPTS);
      window.removeEventListener("wheel", scrollDismissHandler, SCROLL_DISMISS_OPTS);
    } else {
      target.removeEventListener("scroll", scrollDismissHandler, SCROLL_DISMISS_OPTS);
      target.removeEventListener("wheel", scrollDismissHandler, SCROLL_DISMISS_OPTS);
    }
  }
  scrollDismissTargets.length = 0;
  scrollDismissHandler = null;
}

function collectScrollDismissTargets(): ScrollDismissTarget[] {
  const targets: ScrollDismissTarget[] = [window, document.documentElement, document.body];
  document
    .querySelectorAll<HTMLElement>(
      ".module-settings-scroll-host, .tertiary-inline-subnav-scroll, main, [data-pos-toolbar-grid]",
    )
    .forEach((el) => {
      if (!targets.includes(el)) targets.push(el);
    });
  return targets;
}

function attachMoveMenuDismissListeners(): void {
  detachMoveMenuDismissListeners();
  if (!activeMoveMenu) return;

  scrollDismissHandler = () => closeActiveMoveMenu();
  for (const target of collectScrollDismissTargets()) {
    scrollDismissTargets.push(target);
    if (target === window) {
      window.addEventListener("scroll", scrollDismissHandler, SCROLL_DISMISS_OPTS);
      window.addEventListener("wheel", scrollDismissHandler, SCROLL_DISMISS_OPTS);
    } else {
      target.addEventListener("scroll", scrollDismissHandler, SCROLL_DISMISS_OPTS);
      target.addEventListener("wheel", scrollDismissHandler, SCROLL_DISMISS_OPTS);
    }
  }
}

function closeActiveMoveMenu(): void {
  detachMoveMenuDismissListeners();
  activeMoveTrigger?.setAttribute("aria-expanded", "false");
  activeMoveTrigger = null;
  activeMoveMenu?.remove();
  activeMoveMenu = null;
}

function isMoveMenuDismissTarget(target: HTMLElement): boolean {
  return Boolean(
    target.closest("[data-pos-toolbar-move-menu]") || target.closest("[data-pos-toolbar-move-trigger]"),
  );
}

function positionMoveMenuAtTrigger(menu: HTMLElement, trigger: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const menuW = menu.offsetWidth;
  const menuH = menu.offsetHeight;

  let left = rect.right - menuW;
  let top = rect.bottom + gap;

  const pad = 8;
  if (left < pad) left = pad;
  if (left + menuW > window.innerWidth - pad) left = window.innerWidth - menuW - pad;
  if (top + menuH > window.innerHeight - pad) {
    top = rect.top - menuH - gap;
  }
  if (top < pad) top = pad;

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function openMoveMenu(trigger: HTMLElement, fromSeq: number, buttonId: string): void {
  closeActiveMoveMenu();

  const menu = document.createElement("div");
  menu.className =
    "pos-toolbar-move-menu fixed min-w-[10.5rem] rounded-lg border border-border bg-card p-3 text-card-foreground shadow-md";
  menu.style.zIndex = String(POS_TOOLBAR_MOVE_MENU_Z);
  menu.style.opacity = "1";
  menu.style.backgroundColor = "var(--color-card)";
  menu.style.isolation = "isolate";
  menu.setAttribute("data-pos-toolbar-move-menu", "");
  menu.setAttribute("data-move-from-seq", String(fromSeq));
  menu.setAttribute("data-move-button-id", buttonId);
  menu.innerHTML = `
    <p class="m-0 mb-2 text-center text-xs text-muted-foreground">将此按钮移动到</p>
    <div class="flex flex-col gap-2">${renderMoveMenuOptions(fromSeq)}</div>`;

  menu.style.left = "-9999px";
  menu.style.top = "0";
  document.body.appendChild(menu);
  activeMoveMenu = menu;
  activeMoveTrigger = trigger;
  trigger.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    if (!activeMoveMenu || !activeMoveTrigger) return;
    positionMoveMenuAtTrigger(activeMoveMenu, activeMoveTrigger);
    attachMoveMenuDismissListeners();
  });
}

function refreshPosToolbarGrid(): void {
  const grid = document.querySelector<HTMLElement>("[data-pos-toolbar-grid] > div");
  if (!grid) return;
  closeActiveMoveMenu();
  grid.innerHTML = renderPosToolbarGridInnerHtml();
  document.querySelectorAll<HTMLElement>("[data-pos-toolbar-group]").forEach((el) => {
    delete el.dataset.posToolbarBound;
  });
  bindPosOrderToolbarGroups();
}

function moveToolbarButtonBetweenGroups(fromSeq: number, toSeq: number, buttonId: string): void {
  if (fromSeq === toSeq || !buttonSupportsCrossMove(buttonId)) return;
  const fromConfig = GROUP_BY_SEQ.get(fromSeq);
  const toConfig = GROUP_BY_SEQ.get(toSeq);
  if (!fromConfig || !toConfig) return;

  const fromState = readPosToolbarGroupState(fromConfig.storageFieldId, fromConfig);
  const idx = fromState.findIndex((b) => b.id === buttonId);
  if (idx < 0) return;

  const [item] = fromState.splice(idx, 1);
  const toState = readPosToolbarGroupState(toConfig.storageFieldId, toConfig);
  if (!toState.some((b) => b.id === buttonId)) {
    toState.push(item);
  }

  writePosToolbarGroupState(fromConfig.storageFieldId, fromState);
  writePosToolbarGroupState(toConfig.storageFieldId, toState);
  refreshPosToolbarGrid();
}

let posToolbarDelegatedBound = false;

export function bindPosOrderToolbarGroups(): void {
  if (!posToolbarDelegatedBound) {
    posToolbarDelegatedBound = true;

    document.addEventListener(
      "pointerdown",
      (e) => {
        if (!activeMoveMenu) return;
        const target = e.target as HTMLElement;
        if (isMoveMenuDismissTarget(target)) return;
        closeActiveMoveMenu();
      },
      true,
    );

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      const moveConfirm = target.closest<HTMLElement>("[data-pos-toolbar-move-confirm]");
      if (moveConfirm && activeMoveMenu) {
        e.preventDefault();
        e.stopPropagation();
        const fromSeq = Number(activeMoveMenu.getAttribute("data-move-from-seq"));
        const buttonId = activeMoveMenu.getAttribute("data-move-button-id") ?? "";
        const toSeq = Number(moveConfirm.getAttribute("data-move-to-seq"));
        closeActiveMoveMenu();
        moveToolbarButtonBetweenGroups(fromSeq, toSeq, buttonId);
        return;
      }

      const moveTrigger = target.closest<HTMLElement>("[data-pos-toolbar-move-trigger]");
      if (moveTrigger) {
        e.preventDefault();
        e.stopPropagation();
        if (activeMoveMenu && activeMoveTrigger === moveTrigger) {
          closeActiveMoveMenu();
          return;
        }
        const group = moveTrigger.closest<HTMLElement>("[data-pos-toolbar-group]");
        const row = moveTrigger.closest<HTMLElement>("[data-pos-toolbar-item]");
        const fromSeq = Number(group?.getAttribute("data-group-seq") ?? 0);
        const buttonId = row?.getAttribute("data-button-id") ?? "";
        if (groupSupportsCrossMove(fromSeq) && buttonSupportsCrossMove(buttonId)) {
          openMoveMenu(moveTrigger, fromSeq, buttonId);
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeActiveMoveMenu();
    });
  }

  document.querySelectorAll<HTMLElement>("[data-pos-toolbar-group]").forEach((group) => {
    if (group.dataset.posToolbarBound === "1") return;
    group.dataset.posToolbarBound = "1";

    const list = group.querySelector<HTMLElement>("[data-pos-toolbar-list]");
    if (!list) return;

    let dragId = "";

    group.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).closest("[data-pos-toolbar-enable]")) {
        persistToolbarGroup(group);
      }
    });

    list.addEventListener("dragstart", (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-pos-toolbar-item]");
      if (!row) return;
      dragId = row.getAttribute("data-button-id") ?? "";
      e.dataTransfer?.setData("text/plain", dragId);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      row.classList.add("opacity-50");
    });

    list.addEventListener("dragend", (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("[data-pos-toolbar-item]");
      row?.classList.remove("opacity-50");
      dragId = "";
    });

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });

    list.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetRow = (e.target as HTMLElement).closest<HTMLElement>("[data-pos-toolbar-item]");
      const id = dragId || e.dataTransfer?.getData("text/plain") || "";
      if (!id || !targetRow) return;
      reorderToolbarList(list, id, targetRow, e.clientY);
      persistToolbarGroup(group);
    });
  });
}
