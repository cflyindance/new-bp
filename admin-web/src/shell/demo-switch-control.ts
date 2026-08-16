/**
 * Demo 切换悬浮球：右侧垂直居中可拖动，点击后左侧展开视角/版本面板
 */
import { t } from "../i18n";
import { bindPeripheralProductsControl, renderFlatPeripheralProductsGroup } from "./peripheral-products-control";
import { bindGlobalHostIpControl, renderFlatGlobalHostIpGroup } from "./emenu-local-host-control-ui";
import { renderFlatViewSwitchGroup } from "./view-switch-control";
import { renderFlatVersionSwitchGroup } from "./version-switch-control";

export type DemoSwitchControlOptions = {
  /** 商家后台为 true；M 平台为 false（无版本切换） */
  showVersionSwitch?: boolean;
};

const FAB_ROOT_ID = "demo-switch-fab-root";
const BACKDROP_ID = "demo-switch-backdrop";
const DRAG_THRESHOLD_PX = 5;
const VIEWPORT_MARGIN_PX = 12;
const DEFAULT_OFFSET_PX = 24;

/** 本次会话内记住的拖动位置（相对视口 left/top） */
let sessionFabPos: { left: number; top: number } | null = null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampFabPos(left: number, top: number, width: number, height: number): { left: number; top: number } {
  const maxLeft = Math.max(VIEWPORT_MARGIN_PX, window.innerWidth - width - VIEWPORT_MARGIN_PX);
  const maxTop = Math.max(VIEWPORT_MARGIN_PX, window.innerHeight - height - VIEWPORT_MARGIN_PX);
  return {
    left: Math.min(maxLeft, Math.max(VIEWPORT_MARGIN_PX, left)),
    top: Math.min(maxTop, Math.max(VIEWPORT_MARGIN_PX, top)),
  };
}

function applyFabPosition(root: HTMLElement): void {
  const width = root.offsetWidth || 56;
  const height = root.offsetHeight || 56;
  if (sessionFabPos) {
    const pos = clampFabPos(sessionFabPos.left, sessionFabPos.top, width, height);
    sessionFabPos = pos;
    root.style.left = `${pos.left}px`;
    root.style.top = `${pos.top}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
    root.style.transform = "none";
    return;
  }
  root.style.left = "auto";
  root.style.top = "50%";
  root.style.right = `${DEFAULT_OFFSET_PX}px`;
  root.style.bottom = "auto";
  root.style.transform = "translateY(-50%)";
}

function setBackdropVisible(visible: boolean): void {
  const backdrop = document.getElementById(BACKDROP_ID);
  if (!backdrop) return;
  backdrop.classList.toggle("hidden", !visible);
  backdrop.setAttribute("aria-hidden", visible ? "false" : "true");
}

function positionDemoSwitchPanel(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>("[data-demo-switch-panel]");
  if (!panel || root.dataset.demoSwitchOpen !== "1") return;
  const rootRect = root.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const gap = 8;
  const availableLeft = rootRect.left - VIEWPORT_MARGIN_PX;
  const availableRight = window.innerWidth - VIEWPORT_MARGIN_PX - rootRect.right;
  const openLeft = availableLeft >= panelRect.width + gap || availableLeft >= availableRight;
  const desiredLeft = openLeft ? rootRect.left - panelRect.width - gap : rootRect.right + gap;
  const maxLeft = Math.max(VIEWPORT_MARGIN_PX, window.innerWidth - VIEWPORT_MARGIN_PX - panelRect.width);
  const clampedLeft = Math.max(VIEWPORT_MARGIN_PX, Math.min(desiredLeft, maxLeft));

  panel.dataset.demoSwitchSide = openLeft ? "left" : "right";
  panel.style.left = `${clampedLeft - rootRect.left}px`;
  panel.style.right = "auto";
  panel.style.transform = "none";

  const desiredTop = rootRect.height / 2 - panelRect.height / 2;
  const minTop = VIEWPORT_MARGIN_PX - rootRect.top;
  const maxTop = window.innerHeight - VIEWPORT_MARGIN_PX - rootRect.top - panelRect.height;
  panel.style.top = `${Math.max(minTop, Math.min(desiredTop, maxTop))}px`;
}

function setDemoSwitchOpen(root: HTMLElement, open: boolean, focusFirst = false): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-demo-switch-toggle]");
  const panel = root.querySelector<HTMLElement>("[data-demo-switch-panel]");
  if (!toggle || !panel) return;
  const focusWasInside = panel.contains(document.activeElement);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  panel.classList.toggle("invisible", !open);
  panel.classList.toggle("opacity-0", !open);
  panel.classList.toggle("pointer-events-none", !open);
  panel.classList.toggle("opacity-100", open);
  root.dataset.demoSwitchOpen = open ? "1" : "0";
  setBackdropVisible(open);

  if (open) {
    requestAnimationFrame(() => {
      positionDemoSwitchPanel(root);
      if (!focusFirst) return;
      panel.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    });
  } else if (focusWasInside) {
    requestAnimationFrame(() => toggle.focus({ preventScroll: true }));
  }
}

function closeAllDemoSwitchPanels(): void {
  document.querySelectorAll<HTMLElement>("[data-demo-switch-root]").forEach((root) => setDemoSwitchOpen(root, false));
}

function renderDemoSwitchFabHtml(options: DemoSwitchControlOptions): string {
  const showVersionSwitch = options.showVersionSwitch !== false;
  const hintKey = showVersionSwitch ? "shell.demoSwitchHint" : "shell.demoSwitchHintViewOnly";
  const panelInner = `
    <div data-demo-switch-panel-scroll class="w-[min(22rem,calc(100vw-1.5rem))] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-xl">
      <section data-demo-switch-view-group>${renderFlatViewSwitchGroup()}</section>
      ${showVersionSwitch ? `<div class="my-3 h-px bg-border" aria-hidden="true"></div><section data-demo-switch-version-group>${renderFlatVersionSwitchGroup()}</section>` : ""}
      <div class="my-3 h-px bg-border" aria-hidden="true"></div>
      <section data-demo-switch-products-group>${renderFlatPeripheralProductsGroup()}</section>
      <div class="my-3 h-px bg-border" aria-hidden="true"></div>
      <section data-demo-switch-host-ip-group>${renderFlatGlobalHostIpGroup()}</section>
    </div>`;

  return `
    <div
      id="${BACKDROP_ID}"
      data-demo-switch-backdrop
      class="fixed inset-0 z-[79] hidden bg-transparent"
      aria-hidden="true"
    ></div>
    <div
      id="${FAB_ROOT_ID}"
      class="fixed z-[80] touch-none"
      data-demo-switch-root
      data-shell-perspective-controls
      data-demo-switch-open="0"
      style="right:${DEFAULT_OFFSET_PX}px;top:50%;transform:translateY(-50%)"
    >
      <div class="relative flex items-center justify-end overflow-visible">
        <div
          id="demo-switch-panel"
          data-demo-switch-panel
          class="invisible absolute right-[calc(100%+0.5rem)] top-1/2 z-[81] opacity-0 pointer-events-none transition-opacity duration-150 ease-out"
          aria-hidden="true"
        >
          ${panelInner}
        </div>
        <button
          type="button"
          data-demo-switch-toggle
          class="inline-flex min-h-14 min-w-14 max-w-[5.5rem] shrink-0 cursor-grab items-center justify-center rounded-full border border-amber-500/40 bg-amber-400 px-2 text-[11px] font-semibold leading-tight text-amber-950 shadow-lg transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing dark:border-amber-400/50 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
          aria-expanded="false"
          aria-controls="demo-switch-panel"
          title="${escapeHtml(t(hintKey))}"
          aria-label="${escapeHtml(t("shell.demoSwitchAria"))}"
        >
          <span class="px-1 text-center leading-tight">${escapeHtml(t("shell.demoSwitchFab"))}</span>
        </button>
      </div>
    </div>`;
}

function bindFabDragAndToggle(root: HTMLElement): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-demo-switch-toggle]");
  if (!toggle || toggle.dataset.demoSwitchDragBound === "1") return;
  toggle.dataset.demoSwitchDragBound = "1";

  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && dx * dx + dy * dy >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
      moved = true;
      setDemoSwitchOpen(root, false);
    }
    if (!moved) return;
    const next = clampFabPos(originLeft + dx, originTop + dy, root.offsetWidth, root.offsetHeight);
    root.style.left = `${next.left}px`;
    root.style.top = `${next.top}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    toggle.releasePointerCapture(e.pointerId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    if (moved) {
      const rect = root.getBoundingClientRect();
      sessionFabPos = clampFabPos(rect.left, rect.top, rect.width, rect.height);
      return;
    }
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setDemoSwitchOpen(root, open);
  };

  toggle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = root.getBoundingClientRect();
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    originLeft = rect.left;
    originTop = rect.top;
    // 进入拖动坐标系：立即切到 left/top，避免 right/bottom/transform 与拖动冲突
    root.style.left = `${originLeft}px`;
    root.style.top = `${originTop}px`;
    root.style.right = "auto";
    root.style.bottom = "auto";
    root.style.transform = "none";
    toggle.setPointerCapture(e.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  });

  toggle.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setDemoSwitchOpen(root, open, open);
  });

  // 点击由 pointerup 处理，避免 preventDefault(pointerdown) 吞掉 click
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail !== 0) return;
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setDemoSwitchOpen(root, open, open);
  });
}

function bindBackdropDismiss(): void {
  const backdrop = document.getElementById(BACKDROP_ID);
  if (!backdrop || backdrop.dataset.demoSwitchBackdropBound === "1") return;
  backdrop.dataset.demoSwitchBackdropBound = "1";
  backdrop.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllDemoSwitchPanels();
  });
  backdrop.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllDemoSwitchPanels();
  });
}

function ensureDemoSwitchDismissBound(): void {
  if (document.documentElement.dataset.demoSwitchDismissBound) return;
  document.documentElement.dataset.demoSwitchDismissBound = "1";
  // 兜底：点页面空白（非悬浮球）也收起
  document.addEventListener(
    "pointerdown",
    (e) => {
      const target = e.target as Node | null;
      if (!target) return;
      const backdrop = document.getElementById(BACKDROP_ID);
      if (backdrop?.contains(target)) return; // backdrop 自己处理
      document.querySelectorAll<HTMLElement>("[data-demo-switch-root]").forEach((root) => {
        if (root.dataset.demoSwitchOpen !== "1") return;
        if (root.contains(target)) return;
        setDemoSwitchOpen(root, false);
      });
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAllDemoSwitchPanels();
  });
  window.addEventListener(
    "resize",
    () => {
      const root = document.getElementById(FAB_ROOT_ID);
      if (!root) return;
      if (sessionFabPos) applyFabPosition(root);
      positionDemoSwitchPanel(root);
    },
    { passive: true },
  );
}

function removeDemoSwitchDom(): void {
  document.getElementById(BACKDROP_ID)?.remove();
  document.getElementById(FAB_ROOT_ID)?.remove();
}

/** 挂载/刷新悬浮球（挂在 body，避免 #app remount 丢失；位置在会话内保留） */
export function mountDemoSwitchFab(options: DemoSwitchControlOptions = {}): void {
  removeDemoSwitchDom();
  try {
    document.body.insertAdjacentHTML("beforeend", renderDemoSwitchFabHtml(options));
  } catch (err) {
    console.error("[demo-switch] failed to render fab", err);
    return;
  }
  const root = document.getElementById(FAB_ROOT_ID);
  if (!root) return;
  applyFabPosition(root);
  bindFabDragAndToggle(root);
  bindBackdropDismiss();
  bindPeripheralProductsControl();
  bindGlobalHostIpControl();
  ensureDemoSwitchDismissBound();
}

export function unmountDemoSwitchFab(): void {
  removeDemoSwitchDom();
}

/** @deprecated 改用 mountDemoSwitchFab；保留空实现以免旧调用报错 */
export function bindDemoSwitchControl(): void {
  ensureDemoSwitchDismissBound();
}
