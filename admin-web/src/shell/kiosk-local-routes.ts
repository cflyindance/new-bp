import type { MessageKey } from "../i18n";

export const KIOSK_LOCAL_ROUTE_PREFIX = "/kiosk-local";
export const KIOSK_LOCAL_DEFAULT_PATH = "/kiosk-local/service-settings";

export type KioskLocalIcon = "service" | "fee" | "brand" | "promotion" | "device" | "screen" | "tag" | "poster" | "image" | "logo";

export type KioskLocalNavItem = {
  id: string;
  path: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  icon: KioskLocalIcon;
};

export const KIOSK_LOCAL_NAV_ITEMS: readonly KioskLocalNavItem[] = [
  { id: "service-settings", path: "/kiosk-local/service-settings", titleKey: "shell.kioskLocalServiceSettings", descriptionKey: "shell.kioskLocalServiceSettingsDesc", icon: "service" },
  { id: "surcharge-settings", path: "/kiosk-local/surcharge-settings", titleKey: "shell.kioskLocalSurchargeSettings", descriptionKey: "shell.kioskLocalSurchargeSettingsDesc", icon: "fee" },
  { id: "brand-settings", path: "/kiosk-local/brand-settings", titleKey: "shell.kioskLocalBrandSettings", descriptionKey: "shell.kioskLocalBrandSettingsDesc", icon: "brand" },
  { id: "promotions", path: "/kiosk-local/promotions", titleKey: "shell.kioskLocalPromotions", descriptionKey: "shell.kioskLocalPromotionsDesc", icon: "promotion" },
  { id: "device-management", path: "/kiosk-local/device-management", titleKey: "shell.kioskLocalDeviceManagement", descriptionKey: "shell.kioskLocalDeviceManagementDesc", icon: "device" },
  { id: "screensaver", path: "/kiosk-local/screensaver", titleKey: "shell.kioskLocalScreensaver", descriptionKey: "shell.kioskLocalScreensaverDesc", icon: "screen" },
  { id: "menu-tags", path: "/kiosk-local/menu-tags", titleKey: "shell.kioskLocalMenuTags", descriptionKey: "shell.kioskLocalMenuTagsDesc", icon: "tag" },
  { id: "poster-pro", path: "/kiosk-local/poster-pro", titleKey: "shell.kioskLocalPosterPro", descriptionKey: "shell.kioskLocalPosterProDesc", icon: "poster" },
  { id: "login-guide-image", path: "/kiosk-local/login-guide-image", titleKey: "shell.kioskLocalLoginGuideImage", descriptionKey: "shell.kioskLocalLoginGuideImageDesc", icon: "image" },
  { id: "cover-image", path: "/kiosk-local/cover-image", titleKey: "shell.kioskLocalCoverImage", descriptionKey: "shell.kioskLocalCoverImageDesc", icon: "image" },
  { id: "logo", path: "/kiosk-local/logo", titleKey: "shell.kioskLocalLogo", descriptionKey: "shell.kioskLocalLogoDesc", icon: "logo" },
  { id: "posters", path: "/kiosk-local/posters", titleKey: "shell.kioskLocalPosters", descriptionKey: "shell.kioskLocalPostersDesc", icon: "poster" },
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
