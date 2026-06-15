/**
 * 一级导航排序 — 模式切换与拖动绑定
 */
import { t } from "../i18n";
import {
  loadNavOrderPreferences,
  saveCustomNavOrderFromDom,
  setNavOrderMode,
  type NavOrderMode,
} from "./nav-order-preferences";
import type { NavModule } from "./navigation";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DRAG_HANDLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`;

export function renderNavOrderToolbar(mode: NavOrderMode): string {
  const systemActive = mode === "system";
  const customActive = mode === "custom";
  const btnBase =
    "min-h-7 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar";
  const activeCls = "bg-sidebar-active text-sidebar-active-fg shadow-sm";
  const idleCls = "text-sidebar-muted hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground";

  return `
    <div class="flex shrink-0 flex-col gap-1.5 border-b border-sidebar-foreground/10 px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[10px] font-medium uppercase tracking-wide text-sidebar-muted">${escapeHtml(t("shell.navOrderLabel"))}</span>
        ${customActive ? `<span class="text-[10px] text-sidebar-muted/90">${escapeHtml(t("shell.navOrderCustomHint"))}</span>` : ""}
      </div>
      <div class="flex rounded-lg border border-sidebar-foreground/15 p-0.5" role="group" aria-label="${escapeHtml(t("shell.navOrderMode"))}">
        <button type="button" data-nav-order-mode="system" class="${btnBase} flex-1 ${systemActive ? activeCls : idleCls}" aria-pressed="${systemActive}">
          ${escapeHtml(t("shell.navOrderSystem"))}
        </button>
        <button type="button" data-nav-order-mode="custom" class="${btnBase} flex-1 ${customActive ? activeCls : idleCls}" aria-pressed="${customActive}">
          ${escapeHtml(t("shell.navOrderCustom"))}
        </button>
      </div>
    </div>`;
}

export function wrapNavModuleForCustomDrag(moduleHtml: string, moduleId: string): string {
  const handleLabel = escapeHtml(t("shell.navDragHandle"));
  return `
    <div class="nav-drag-row group/drag mb-1 flex items-stretch gap-0.5" data-nav-drag-row="${escapeHtml(moduleId)}" draggable="true">
      <span
        class="nav-drag-handle flex w-6 shrink-0 cursor-grab select-none touch-none items-center justify-center rounded-md text-sidebar-muted/70 transition-colors hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground active:cursor-grabbing"
        data-nav-drag-handle
        role="img"
        aria-label="${handleLabel}"
        title="${handleLabel}"
      >${DRAG_HANDLE_SVG}</span>
      <div class="min-w-0 flex-1 [&>[data-nav-module]]:mb-0">${moduleHtml}</div>
    </div>`;
}

function reorderNavDragRow(list: HTMLElement, dragId: string, targetRow: HTMLElement, clientY: number): void {
  if (dragId === targetRow.getAttribute("data-nav-drag-row")) return;
  const dragEl = list.querySelector<HTMLElement>(`[data-nav-drag-row="${CSS.escape(dragId)}"]`);
  if (!dragEl) return;
  const rect = targetRow.getBoundingClientRect();
  const after = clientY > rect.top + rect.height / 2;
  if (after) targetRow.after(dragEl);
  else targetRow.before(dragEl);
}

export function bindNavOrderControls(
  visibleModules: NavModule[],
  onRemount: () => void,
): void {
  document.querySelectorAll<HTMLButtonElement>("[data-nav-order-mode]").forEach((btn) => {
    if (btn.dataset.navOrderBound === "1") return;
    btn.dataset.navOrderBound = "1";
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-nav-order-mode");
      if (mode !== "system" && mode !== "custom") return;
      if (loadNavOrderPreferences().mode === mode) return;
      setNavOrderMode(mode, visibleModules);
      onRemount();
    });
  });
}

export function bindNavDragReorder(): void {
  const navTree = document.getElementById("nav-tree");
  if (!navTree || navTree.dataset.navDragBound === "1") return;
  if (loadNavOrderPreferences().mode !== "custom") return;

  navTree.dataset.navDragBound = "1";
  let dragId = "";
  /** dragstart 的 target 是 draggable 行本身，需用 mousedown 记录是否从手柄发起 */
  let dragFromHandle = false;

  navTree.addEventListener(
    "mousedown",
    (e) => {
      dragFromHandle = Boolean((e.target as HTMLElement).closest("[data-nav-drag-handle]"));
    },
    true,
  );

  navTree.addEventListener(
    "mouseup",
    () => {
      window.setTimeout(() => {
        dragFromHandle = false;
      }, 0);
    },
    true,
  );

  navTree.addEventListener("dragstart", (e) => {
    if (!dragFromHandle) {
      e.preventDefault();
      return;
    }
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-drag-row]");
    if (!row) {
      e.preventDefault();
      return;
    }
    dragId = row.getAttribute("data-nav-drag-row") ?? "";
    e.dataTransfer?.setData("text/plain", dragId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    row.classList.add("opacity-60");
  });

  navTree.addEventListener("dragend", (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-drag-row]");
    row?.classList.remove("opacity-60");
    dragId = "";
    dragFromHandle = false;
    saveCustomNavOrderFromDom(navTree);
  });

  navTree.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    const id = dragId || e.dataTransfer?.getData("text/plain") || "";
    if (!id) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-drag-row]");
    if (!row) return;
    reorderNavDragRow(navTree, id, row, e.clientY);
  });

  navTree.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = dragId || e.dataTransfer?.getData("text/plain") || "";
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-drag-row]");
    if (id && row) reorderNavDragRow(navTree, id, row, e.clientY);
    saveCustomNavOrderFromDom(navTree);
    dragId = "";
    dragFromHandle = false;
  });
}
