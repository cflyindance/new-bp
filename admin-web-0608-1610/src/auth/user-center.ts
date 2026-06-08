import { clearAuthenticated, getAuthenticatedEmail } from "./login";
import { t } from "../i18n";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const USER_CENTER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

export function renderHeaderUserCenter(): string {
  const email = getAuthenticatedEmail();
  const accountLabel = email ?? t("header.userCenterFallbackAccount");
  return `
    <div class="relative shrink-0" data-user-center-root>
      <button
        type="button"
        data-user-center-toggle
        class="inline-flex size-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:size-11"
        aria-label="${escapeHtml(t("header.userCenterOpen"))}"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="user-center-menu"
      >
        ${USER_CENTER_ICON}
      </button>
      <div
        id="user-center-menu"
        role="menu"
        data-user-center-menu
        class="absolute right-0 top-full z-50 mt-1.5 hidden w-64 origin-top-right rounded-lg border border-border bg-card py-2 shadow-lg animate-fade-in"
      >
        <div class="border-b border-border px-3 py-2.5">
          <p class="text-xs font-medium text-muted-foreground">${escapeHtml(t("header.userCenterAccountLabel"))}</p>
          <p class="mt-0.5 truncate text-sm font-medium text-card-foreground" title="${escapeHtml(accountLabel)}">${escapeHtml(accountLabel)}</p>
        </div>
        <div class="px-2 pt-1">
          <button
            type="button"
            role="menuitem"
            data-user-center-logout
            class="flex w-full min-h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ${escapeHtml(t("header.userCenterLogout"))}
          </button>
        </div>
      </div>
    </div>`;
}

function setUserCenterOpen(root: HTMLElement, open: boolean): void {
  const toggle = root.querySelector<HTMLButtonElement>("[data-user-center-toggle]");
  const menu = root.querySelector<HTMLElement>("[data-user-center-menu]");
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  menu.classList.toggle("hidden", !open);
}

export function bindHeaderUserCenter(onLogout: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-user-center-root]");
  if (!root || root.dataset.userCenterBound === "1") return;
  root.dataset.userCenterBound = "1";

  const toggle = root.querySelector<HTMLButtonElement>("[data-user-center-toggle]");
  const logoutBtn = root.querySelector<HTMLButtonElement>("[data-user-center-logout]");

  toggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setUserCenterOpen(root, open);
  });

  logoutBtn?.addEventListener("click", () => {
    setUserCenterOpen(root, false);
    clearAuthenticated();
    onLogout();
  });

  if (!document.documentElement.dataset.userCenterDismissBound) {
    document.documentElement.dataset.userCenterDismissBound = "1";
    document.addEventListener(
      "click",
      (e) => {
        document.querySelectorAll<HTMLElement>("[data-user-center-root]").forEach((r) => {
          if (r.contains(e.target as Node)) return;
          setUserCenterOpen(r, false);
        });
      },
      true,
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll<HTMLElement>("[data-user-center-root]").forEach((r) => setUserCenterOpen(r, false));
    });
  }
}
