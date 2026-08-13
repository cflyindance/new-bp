/**
 * Demo 周边产品入口：用于打开独立于商家后台视角的产品后台。
 */
import { isViewSwitchRestricted } from "../auth/session-scope";
import { t } from "../i18n";
import {
  enterEmenuLocalShell,
  enterKioskLocalShell,
  isEmenuLocalShellMode,
  isKioskLocalShellMode,
} from "./app-shell-mode";
import { EMENU_LOCAL_DEFAULT_PATH } from "./emenu-local-routes";
import { KIOSK_LOCAL_DEFAULT_PATH } from "./kiosk-local-routes";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CHEVRON_ICON = `<svg class="size-3.5 shrink-0 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
const CHECK_ICON = `<svg class="size-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

function renderFlatProductCard(
  product: "emenu-local" | "kiosk-local",
  active: boolean,
  restricted: boolean,
  reasonId: string,
): string {
  const label = product === "emenu-local" ? t("shell.emenuLocal") : t("shell.kioskLocal");
  const hint = product === "emenu-local" ? t("shell.emenuLocalHint") : t("shell.kioskLocalHint");
  return `
    <button
      type="button"
      data-peripheral-product-option="${product}"
      class="flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary/25 bg-primary/10 font-semibold text-primary" : "border-transparent bg-muted/60 text-foreground hover:border-border hover:bg-muted"} ${restricted ? "cursor-not-allowed opacity-50" : ""}"
      title="${escapeHtml(restricted ? t("shell.impersonationViewLocked") : hint)}"
      aria-current="${active ? "true" : "false"}"
      ${restricted ? `disabled aria-disabled="true" aria-describedby="${reasonId}"` : ""}
    >
      <span class="flex size-4 shrink-0 items-center justify-center">${active ? CHECK_ICON : ""}</span>
      <span class="min-w-0 flex-1 leading-5">${escapeHtml(label)}</span>
    </button>`;
}

export function renderFlatPeripheralProductsGroup(): string {
  const restricted = isViewSwitchRestricted();
  const reasonId = "demo-switch-products-locked-reason";
  const labelId = "demo-switch-products-group-title";
  return `
    <div data-peripheral-products-root role="group" aria-labelledby="${labelId}" ${restricted ? `aria-describedby="${reasonId}"` : ""}>
      <h2 id="${labelId}" class="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">${escapeHtml(t("shell.peripheralProducts"))}</h2>
      ${restricted ? `<p id="${reasonId}" class="mt-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-950 dark:text-amber-100">${escapeHtml(t("shell.impersonationViewLocked"))}</p>` : ""}
      <div class="mt-2 grid grid-cols-2 gap-2">
        ${renderFlatProductCard("emenu-local", isEmenuLocalShellMode(), restricted, reasonId)}
        ${renderFlatProductCard("kiosk-local", isKioskLocalShellMode(), restricted, reasonId)}
      </div>
    </div>`;
}

export function renderPeripheralProductsControl(): string {
  const restricted = isViewSwitchRestricted();
  const emenuActive = isEmenuLocalShellMode();
  const kioskActive = isKioskLocalShellMode();
  const currentLabel = emenuActive
    ? t("shell.emenuLocal")
    : kioskActive
      ? t("shell.kioskLocal")
      : t("shell.peripheralProductsCount");
  const currentBadge = emenuActive || kioskActive
    ? "bg-primary text-primary-foreground shadow-sm"
    : "bg-muted text-muted-foreground";

  return `
    <div class="relative shrink-0" data-peripheral-products-root>
      <div
        class="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5"
        role="group"
        aria-label="${escapeHtml(t("shell.peripheralProductsAria"))}"
      >
        <button
          type="button"
          data-peripheral-products-toggle
          class="inline-flex h-8 sm:h-9 items-center gap-1 rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="peripheral-products-menu"
          title="${escapeHtml(restricted ? t("shell.impersonationViewLocked") : t("shell.peripheralProductsHint"))}"
          ${restricted ? "disabled aria-disabled=\"true\"" : ""}
        >
          <span>${escapeHtml(t("shell.peripheralProducts"))}</span>
          ${CHEVRON_ICON}
        </button>
        <span
          class="inline-flex h-8 sm:h-9 max-w-44 items-center truncate rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium ${currentBadge}"
          title="${escapeHtml(currentLabel)}"
          data-peripheral-products-current
        >${escapeHtml(currentLabel)}</span>
      </div>
      <div
        id="peripheral-products-menu"
        role="menu"
        data-peripheral-products-menu
        class="absolute right-full top-0 z-[100] mr-1.5 hidden w-56 origin-top-right rounded-lg border border-border bg-card py-1.5 shadow-lg animate-fade-in"
        aria-label="${escapeHtml(t("shell.peripheralProductsMenuAria"))}"
      >
        <div class="px-1.5">
          <button
            type="button"
            role="menuitem"
            data-peripheral-product-option="emenu-local"
            class="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${emenuActive ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}"
            title="${escapeHtml(t("shell.emenuLocalHint"))}"
            aria-current="${emenuActive ? "true" : "false"}"
          >
            <span class="flex size-4 shrink-0 items-center justify-center">${emenuActive ? CHECK_ICON : ""}</span>
            <span class="min-w-0 flex-1 truncate">${escapeHtml(t("shell.emenuLocal"))}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            data-peripheral-product-option="kiosk-local"
            class="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${kioskActive ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}"
            title="${escapeHtml(t("shell.kioskLocalHint"))}"
            aria-current="${kioskActive ? "true" : "false"}"
          >
            <span class="flex size-4 shrink-0 items-center justify-center">${kioskActive ? CHECK_ICON : ""}</span>
            <span class="min-w-0 flex-1 truncate">${escapeHtml(t("shell.kioskLocal"))}</span>
          </button>
        </div>
      </div>
    </div>`;
}

function setPeripheralProductsOpen(root: HTMLElement, open: boolean): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-peripheral-products-toggle]");
  const menu = root.querySelector<HTMLElement>("[data-peripheral-products-menu]");
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  menu.classList.toggle("hidden", !open);
}

function closeViewAndVersionMenus(): void {
  document.querySelectorAll<HTMLElement>("[data-view-switch-root], [data-version-switch-root]").forEach((root) => {
    root
      .querySelector<HTMLButtonElement>("[data-view-switch-toggle], [data-version-switch-toggle]")
      ?.setAttribute("aria-expanded", "false");
    root
      .querySelector<HTMLElement>("[data-view-switch-menu], [data-version-switch-menu]")
      ?.classList.add("hidden");
  });
}

export function bindPeripheralProductsControl(): void {
  document.querySelectorAll<HTMLElement>("[data-peripheral-products-root]").forEach((root) => {
    if (root.dataset.peripheralProductsBound === "1") return;
    root.dataset.peripheralProductsBound = "1";

    const toggle = root.querySelector<HTMLButtonElement>("[data-peripheral-products-toggle]");
    toggle?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (toggle.disabled) return;
      const open = toggle.getAttribute("aria-expanded") !== "true";
      closeViewAndVersionMenus();
      setPeripheralProductsOpen(root, open);
    });

    root.querySelector<HTMLButtonElement>('[data-peripheral-product-option="emenu-local"]')?.addEventListener("click", () => {
      if (isViewSwitchRestricted()) return;
      setPeripheralProductsOpen(root, false);
      if (isEmenuLocalShellMode()) return;
      enterEmenuLocalShell();
      location.hash = `#${EMENU_LOCAL_DEFAULT_PATH}`;
    });

    root.querySelector<HTMLButtonElement>('[data-peripheral-product-option="kiosk-local"]')?.addEventListener("click", () => {
      if (isViewSwitchRestricted()) return;
      setPeripheralProductsOpen(root, false);
      if (isKioskLocalShellMode()) return;
      enterKioskLocalShell();
      location.hash = `#${KIOSK_LOCAL_DEFAULT_PATH}`;
    });
  });

  if (document.documentElement.dataset.peripheralProductsDismissBound) return;
  document.documentElement.dataset.peripheralProductsDismissBound = "1";
  document.addEventListener(
    "click",
    (event) => {
      document.querySelectorAll<HTMLElement>("[data-peripheral-products-root]").forEach((root) => {
        if (root.contains(event.target as Node)) return;
        setPeripheralProductsOpen(root, false);
      });
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll<HTMLElement>("[data-peripheral-products-root]").forEach((root) =>
      setPeripheralProductsOpen(root, false),
    );
  });
}
