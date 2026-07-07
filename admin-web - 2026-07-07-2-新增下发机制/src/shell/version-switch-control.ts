/**
 * 顶栏版本切换：MVP 版本 / 未来版本（商家后台）
 */
import { readProductVersion, writeProductVersion, type ProductVersion } from "../config/product-version";
import { t } from "../i18n";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CHEVRON_ICON = `<svg class="size-3.5 shrink-0 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

const CHECK_ICON = `<svg class="size-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

function labelForVersion(version: ProductVersion): string {
  return version === "future" ? t("shell.productVersionFuture") : t("shell.productVersionMvp");
}

function hintForVersion(version: ProductVersion): string {
  return version === "future" ? t("shell.productVersionFutureHint") : t("shell.productVersionMvpHint");
}

function renderVersionMenuItem(version: ProductVersion, current: ProductVersion): string {
  const active = current === version;
  return `
    <button
      type="button"
      role="menuitem"
      data-version-switch-option="${version}"
      class="flex w-full min-h-9 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-accent/60 font-medium text-accent-foreground" : "text-foreground"}"
      title="${escapeHtml(hintForVersion(version))}"
      aria-current="${active ? "true" : "false"}"
    >
      <span class="flex size-4 shrink-0 items-center justify-center">${active ? CHECK_ICON : ""}</span>
      <span class="min-w-0 flex-1 truncate">${escapeHtml(labelForVersion(version))}</span>
    </button>`;
}

export function renderVersionSwitchControl(): string {
  const current = readProductVersion();
  const currentLabel = escapeHtml(labelForVersion(current));
  const currentHint = escapeHtml(hintForVersion(current));
  const toggleBtn =
    "inline-flex h-8 sm:h-9 items-center gap-1 rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";
  const currentBadge =
    "inline-flex h-8 sm:h-9 items-center rounded px-2 sm:px-2.5 text-xs sm:text-sm font-medium bg-primary text-primary-foreground shadow-sm";

  return `
    <div class="relative shrink-0" data-version-switch-root>
      <div
        class="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5"
        role="group"
        aria-label="${escapeHtml(t("shell.versionSwitchAria"))}"
      >
        <button
          type="button"
          data-version-switch-toggle
          class="${toggleBtn}"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="version-switch-menu"
          title="${escapeHtml(t("shell.versionSwitchHint"))}"
        >
          <span>${escapeHtml(t("shell.versionSwitch"))}</span>
          ${CHEVRON_ICON}
        </button>
        <span class="${currentBadge}" title="${currentHint}" data-version-switch-current>${currentLabel}</span>
      </div>
      <div
        id="version-switch-menu"
        role="menu"
        data-version-switch-menu
        class="absolute right-0 top-full z-50 mt-1.5 hidden w-44 origin-top-right rounded-lg border border-border bg-card py-1.5 shadow-lg animate-fade-in"
        aria-label="${escapeHtml(t("shell.versionSwitchMenuAria"))}"
      >
        <div class="px-1.5">
          ${renderVersionMenuItem("mvp", current)}
          ${renderVersionMenuItem("future", current)}
        </div>
      </div>
    </div>`;
}

function setVersionSwitchOpen(root: HTMLElement, open: boolean): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-version-switch-toggle]");
  const menu = root.querySelector<HTMLElement>("[data-version-switch-menu]");
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  menu.classList.toggle("hidden", !open);
}

function closeAllVersionSwitchMenus(): void {
  document.querySelectorAll<HTMLElement>("[data-version-switch-root]").forEach((root) => setVersionSwitchOpen(root, false));
}

function closeViewSwitchMenus(): void {
  document.querySelectorAll<HTMLElement>("[data-view-switch-root]").forEach((root) => {
    const toggle = root.querySelector<HTMLButtonElement>("[data-view-switch-toggle]");
    const menu = root.querySelector<HTMLElement>("[data-view-switch-menu]");
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.add("hidden");
  });
}

function applyProductVersion(version: ProductVersion, onMount: () => void): void {
  if (readProductVersion() === version) return;
  writeProductVersion(version);
  onMount();
}

export function bindVersionSwitchControl(onMount: () => void): void {
  document.querySelectorAll<HTMLElement>("[data-version-switch-root]").forEach((root) => {
    if (root.dataset.versionSwitchBound === "1") return;
    root.dataset.versionSwitchBound = "1";

    const toggle = root.querySelector<HTMLButtonElement>("[data-version-switch-toggle]");
    toggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = toggle.getAttribute("aria-expanded") !== "true";
      closeViewSwitchMenus();
      setVersionSwitchOpen(root, open);
    });

    root.querySelectorAll<HTMLButtonElement>("[data-version-switch-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const raw = btn.getAttribute("data-version-switch-option");
        if (raw !== "mvp" && raw !== "future") return;
        setVersionSwitchOpen(root, false);
        applyProductVersion(raw, onMount);
      });
    });
  });

  if (!document.documentElement.dataset.versionSwitchDismissBound) {
    document.documentElement.dataset.versionSwitchDismissBound = "1";
    document.addEventListener(
      "click",
      (e) => {
        document.querySelectorAll<HTMLElement>("[data-version-switch-root]").forEach((root) => {
          if (root.contains(e.target as Node)) return;
          setVersionSwitchOpen(root, false);
        });
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeAllVersionSwitchMenus();
    });
  }
}
