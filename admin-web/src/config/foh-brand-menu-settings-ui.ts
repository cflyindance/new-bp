/** 店中店管理：通过公共子导航访问品牌管理、渠道展示设置。 */
import { FOH_BRAND_MENU_PATH } from "./foh-store-scope";
export { FOH_BRAND_MENU_PATH };
export const FOH_BRAND_MANAGEMENT_PATH = `${FOH_BRAND_MENU_PATH}/brands`;
export const FOH_BRAND_SETTINGS_PATH = `${FOH_BRAND_MENU_PATH}/settings`;
export function isFohBrandMenuPath(path: string): boolean {
  return path === FOH_BRAND_MENU_PATH || path.startsWith(`${FOH_BRAND_MENU_PATH}/`);
}
export function renderFohBrandMenuPage(opts: {
  path: string; brandsPanelHtml: string; settingsPanelHtml: string;
}): string {
  const path = opts.path.split("#")[0].split("?")[0];
  const settings = path === FOH_BRAND_SETTINGS_PATH || path.startsWith(`${FOH_BRAND_SETTINGS_PATH}/`);
  return `<div class="foh-brand-menu-page flex min-h-0 flex-1 flex-col gap-4" data-foh-brand-menu-page>
    <h2 class="shrink-0 text-lg font-semibold">${settings ? "店中店设置" : "品牌管理"}</h2>
    <div class="min-h-0 flex-1 overflow-auto" ${settings ? "data-foh-brand-menu-settings" : "data-foh-brand-menu-brands"}>
      ${settings ? opts.settingsPanelHtml : opts.brandsPanelHtml}
    </div>
  </div>`;
}
