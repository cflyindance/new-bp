import type { MessageKey } from "../i18n";

export const EMENU_LOCAL_ROUTE_PREFIX = "/emenu-local";
export const EMENU_LOCAL_DEFAULT_PATH = "/emenu-local/seasoning-settings";

export type EmenuLocalNavItem = {
  id: string;
  path: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  icon: "seasoning" | "emenu" | "settings";
};

export const EMENU_LOCAL_NAV_ITEMS: readonly EmenuLocalNavItem[] = [
  {
    id: "seasoning-settings",
    path: "/emenu-local/seasoning-settings",
    titleKey: "shell.emenuLocalSeasoningSettings",
    descriptionKey: "shell.emenuLocalSeasoningSettingsDesc",
    icon: "seasoning",
  },
  {
    id: "emenu",
    path: "/emenu-local/emenu",
    titleKey: "shell.emenuLocalEmenu",
    descriptionKey: "shell.emenuLocalEmenuDesc",
    icon: "emenu",
  },
  {
    id: "emenu-settings",
    path: "/emenu-local/emenu-settings",
    titleKey: "shell.emenuLocalEmenuSettings",
    descriptionKey: "shell.emenuLocalEmenuSettingsDesc",
    icon: "settings",
  },
] as const;

export function isEmenuLocalContentPath(path: string): boolean {
  return path === EMENU_LOCAL_ROUTE_PREFIX || path.startsWith(`${EMENU_LOCAL_ROUTE_PREFIX}/`);
}

export function normalizeEmenuLocalPath(path: string): string {
  return EMENU_LOCAL_NAV_ITEMS.some((item) => item.path === path) ? path : EMENU_LOCAL_DEFAULT_PATH;
}

export function getActiveEmenuLocalNavItem(path: string): EmenuLocalNavItem {
  const normalized = normalizeEmenuLocalPath(path);
  return EMENU_LOCAL_NAV_ITEMS.find((item) => item.path === normalized) ?? EMENU_LOCAL_NAV_ITEMS[0];
}
