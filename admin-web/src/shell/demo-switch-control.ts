/**
 * Demo 切换悬浮球：右侧垂直居中可拖动，点击后左侧展开视角/版本面板
 */
import { t } from "../i18n";
import { bindPeripheralProductsControl, renderPeripheralProductsControl } from "./peripheral-products-control";
import { renderViewSwitchControl } from "./view-switch-control";
import { renderVersionSwitchControl } from "./version-switch-control";

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

function setDemoSwitchOpen(root: HTMLElement, open: boolean): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-demo-switch-toggle]");
  const panel = root.querySelector<HTMLElement>("[data-demo-switch-panel]");
  if (!toggle || !panel) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  panel.setAttribute("aria-hidden", open ? "false" : "true");
  panel.classList.toggle("max-w-0", !open);
  panel.classList.toggle("opacity-0", !open);
  panel.classList.toggle("pointer-events-none", !open);
  panel.classList.toggle("overflow-hidden", !open);
  panel.classList.toggle("overflow-visible", open);
  panel.classList.toggle("max-w-[min(90vw,22rem)]", open);
  panel.classList.toggle("opacity-100", open);
  root.dataset.demoSwitchOpen = open ? "1" : "0";
  setBackdropVisible(open);

  if (!open) {
    root.querySelectorAll<HTMLElement>("[data-view-switch-root], [data-version-switch-root], [data-peripheral-products-root]").forEach((ctrl) => {
      const menuToggle = ctrl.querySelector<HTMLButtonElement>(
        "[data-view-switch-toggle], [data-version-switch-toggle], [data-peripheral-products-toggle]",
      );
      const menu = ctrl.querySelector<HTMLElement>(
        "[data-view-switch-menu], [data-version-switch-menu], [data-peripheral-products-menu]",
      );
      menuToggle?.setAttribute("aria-expanded", "false");
      menu?.classList.add("hidden");
    });
  }
}

function closeAllDemoSwitchPanels(): void {
  document.querySelectorAll<HTMLElement>("[data-demo-switch-root]").forEach((root) => setDemoSwitchOpen(root, false));
}

function renderDemoSwitchFabHtml(options: DemoSwitchControlOptions): string {
  const showVersionSwitch = options.showVersionSwitch !== false;
  const hintKey = showVersionSwitch ? "shell.demoSwitchHint" : "shell.demoSwitchHintViewOnly";
  const panelInner = `
    <div class="flex min-w-0 flex-col items-stretch gap-1.5 overflow-visible rounded-xl border border-border bg-card p-2 shadow-lg">
      ${renderViewSwitchControl()}
      ${showVersionSwitch ? renderVersionSwitchControl() : ""}
      ${renderPeripheralProductsControl()}
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
          class="absolute right-full top-1/2 z-[81] mr-2 max-w-0 -translate-y-1/2 overflow-hidden opacity-0 pointer-events-none transition-[max-width,opacity] duration-200 ease-out"
          aria-hidden="true"
        >
          <div class="w-max max-w-[min(90vw,22rem)] overflow-visible">
            ${panelInner}
          </div>
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

  // 点击由 pointerup 处理，避免 preventDefault(pointerdown) 吞掉 click
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      if (!root || !sessionFabPos) return;
      applyFabPosition(root);
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
  document.body.insertAdjacentHTML("beforeend", renderDemoSwitchFabHtml(options));
  const root = document.getElementById(FAB_ROOT_ID);
  if (!root) return;
  applyFabPosition(root);
  bindFabDragAndToggle(root);
  bindBackdropDismiss();
  bindPeripheralProductsControl();
  ensureDemoSwitchDismissBound();
}

export function unmountDemoSwitchFab(): void {
  removeDemoSwitchDom();
}

/** @deprecated 改用 mountDemoSwitchFab；保留空实现以免旧调用报错 */
export function bindDemoSwitchControl(): void {
  ensureDemoSwitchDismissBound();
}
