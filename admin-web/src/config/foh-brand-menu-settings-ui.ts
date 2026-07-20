/**
 * 前厅管理中心 · 店中店管理
 * Tab：品牌与菜单 | 设置
 */

import { FOH_BRAND_MENU_PATH } from "./foh-store-scope";

export { FOH_BRAND_MENU_PATH };

export type FohBrandMenuTab = "brands" | "settings";

let brandMenuTab: FohBrandMenuTab = "brands";

export function isFohBrandMenuPath(path: string): boolean {
  return path === FOH_BRAND_MENU_PATH || path.startsWith(`${FOH_BRAND_MENU_PATH}/`);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTabBar(): string {
  const tabs: { key: FohBrandMenuTab; label: string }[] = [
    { key: "brands", label: "品牌与菜单" },
    { key: "settings", label: "设置" },
  ];
  return `
    <div class="flex shrink-0 gap-1 border-b border-border" role="tablist" aria-label="店中店管理">
      ${tabs
        .map((tab) => {
          const selected = brandMenuTab === tab.key;
          return `
        <button type="button" role="tab"
          data-foh-brand-menu-tab="${tab.key}"
          class="min-h-10 border-b-2 px-4 text-sm font-medium transition-colors ${
            selected
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }"
          ${selected ? 'aria-selected="true"' : 'aria-selected="false"'}
        >${escapeHtml(tab.label)}</button>`;
        })
        .join("")}
    </div>`;
}

export type FohBrandMenuPageOpts = {
  brandsPanelHtml: string;
  settingsPanelHtml: string;
};

export function renderFohBrandMenuPage(opts: FohBrandMenuPageOpts): string {
  const panel =
    brandMenuTab === "brands"
      ? `<div class="min-h-0 flex-1 overflow-auto" data-foh-brand-menu-brands role="tabpanel">${opts.brandsPanelHtml}</div>`
      : `<div class="min-h-0 flex-1 overflow-auto" data-foh-brand-menu-settings role="tabpanel">${opts.settingsPanelHtml}</div>`;

  return `
    <div class="foh-brand-menu-page flex min-h-0 flex-1 flex-col gap-4" data-foh-brand-menu-page>
      ${renderTabBar()}
      ${panel}
    </div>`;
}

export function bindFohBrandMenuUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-foh-brand-menu-page]");
  if (!root || root.dataset.fohBrandMenuBound === "1") return;
  root.dataset.fohBrandMenuBound = "1";

  root.querySelectorAll("[data-foh-brand-menu-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-foh-brand-menu-tab") as FohBrandMenuTab | null;
      if (!tab || tab === brandMenuTab) return;
      brandMenuTab = tab;
      remount();
    });
  });
}
