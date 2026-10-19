import type { ModuleSettingCatalogItem } from "./module-settings-catalog";

/** Presentation pages share the original catalog, permissions and draft bucket. */
export const STORE_INFORMATION_SETTINGS_PATH = "/stores/settings";
export const STORE_PROFILE_PATH = "/stores/profile";
export const STORE_HOURS_PATH = "/stores/hours";

export function isStoreInformationPage(path: string): boolean {
  const clean = path.split(/[?#]/)[0].replace(/\/$/, "");
  return [STORE_PROFILE_PATH, STORE_HOURS_PATH, STORE_INFORMATION_SETTINGS_PATH].some(
    (base) => clean === base || clean.startsWith(`${base}/`),
  );
}

export function storeInformationItemPath(item: Pick<ModuleSettingCatalogItem, "id">): string {
  if (/^s(417|433)-/.test(item.id)) return STORE_PROFILE_PATH;
  if (/^s(418|583)-/.test(item.id)) return STORE_HOURS_PATH;
  return STORE_INFORMATION_SETTINGS_PATH;
}

export function storeInformationItemsForPage(path: string, items: ModuleSettingCatalogItem[]): ModuleSettingCatalogItem[] {
  const clean = path.split(/[?#]/)[0].replace(/\/$/, "");
  return items.filter((item) => { const base=storeInformationItemPath(item); return clean===base || clean.startsWith(`${base}/`); });
}

export function storeInformationLegacyRedirect(path: string, hash: string): string | undefined {
  const anchor = hash.replace(/^#/, "").split("#")[1];
  const clean = path.split(/[?#]/)[0].replace(/\/$/, "");
  let target: string | undefined;
  if (clean === "/stores" || clean === "/store" || clean === "/store/basic" || clean === "/stores/settings/store-profile") target = STORE_PROFILE_PATH;
  if (clean === "/store/logo" || clean === "/stores/settings/brand-identity-assets") target = STORE_PROFILE_PATH;
  if (clean === "/store/business-hours" || clean === "/stores/settings/store-hours-operation") target = anchor?.startsWith("s582-") ? STORE_INFORMATION_SETTINGS_PATH : STORE_HOURS_PATH;
  // Old search links used the settings root plus a field anchor.
  if (clean === STORE_INFORMATION_SETTINGS_PATH && anchor && /^s(417|433|418|583)-/.test(anchor)) {
    target = storeInformationItemPath({ id: anchor });
  }
  if (!target) return undefined;
  const effectiveAnchor = anchor ?? (clean.includes("logo") || clean.includes("brand-identity") ? "s433-brand-identity-assets-餐厅LOGO" : undefined);
  return `${target}${effectiveAnchor ? `#${effectiveAnchor}` : ""}`;
}

/** New presentation entries retain the existing subscription/preset gate. */
export function storeInformationGateId(id: string): string {
  return id === "st-profile" || id === "st-hours" ? "st-settings" : id;
}
