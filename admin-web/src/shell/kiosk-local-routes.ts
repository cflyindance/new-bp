import type { MessageKey } from "../i18n";

export const KIOSK_LOCAL_ROUTE_PREFIX = "/kiosk-local";
export const KIOSK_LOCAL_DEFAULT_PATH = "/kiosk-local/kiosk";

export type KioskLocalIcon = "kiosk" | "settings";

export type KioskLocalNavItem = {
  id: string;
  path: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  icon: KioskLocalIcon;
};

export const KIOSK_LOCAL_NAV_ITEMS: readonly KioskLocalNavItem[] = [
  { id: "kiosk", path: "/kiosk-local/kiosk", titleKey: "shell.kioskLocalKiosk", descriptionKey: "shell.kioskLocalKioskDesc", icon: "kiosk" },
  { id: "kiosk-settings", path: "/kiosk-local/kiosk-settings", titleKey: "shell.kioskLocalKioskSettings", descriptionKey: "shell.kioskLocalKioskSettingsDesc", icon: "settings" },
] as const;

export function isKioskLocalContentPath(path: string): boolean {
  return path === KIOSK_LOCAL_ROUTE_PREFIX || path.startsWith(`${KIOSK_LOCAL_ROUTE_PREFIX}/`);
}

export function normalizeKioskLocalPath(path: string): string {
  return KIOSK_LOCAL_NAV_ITEMS.some((item) => item.path === path) ? path : KIOSK_LOCAL_DEFAULT_PATH;
}

export function getActiveKioskLocalNavItem(path: string): KioskLocalNavItem {
  const normalized = normalizeKioskLocalPath(path);
  return KIOSK_LOCAL_NAV_ITEMS.find((item) => item.path === normalized) ?? KIOSK_LOCAL_NAV_ITEMS[0];
}
