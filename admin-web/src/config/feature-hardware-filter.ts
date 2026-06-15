/**
 * 硬件设备入口按产线过滤（P2）
 */
import type { ProductLineTag } from "./feature-registry";
import { isProfileFilteringActive } from "./feature-visibility";
import { loadTenantProfile } from "./tenant-profile-storage";

/** device subnav id → 所需产线（any） */
const DEVICE_LINE_REQUIREMENTS: Record<string, ProductLineTag[]> = {
  "dmh-kiosk": ["kiosk"],
  "dmh-emenu": ["emenu"],
  "dmh-kds": ["kds"],
  "dmh-pos": ["pos"],
  "dmh-pos-go": ["pos-go"],
  "dmh-cash-drawer": ["pos"],
  "dmh-queue-display": ["cds"],
};

export function isHardwareDeviceLinkVisible(deviceId: string): boolean {
  const profile = loadTenantProfile();
  if (!profile || !isProfileFilteringActive(profile)) return true;

  const required = DEVICE_LINE_REQUIREMENTS[deviceId];
  if (!required || required.length === 0) return true;

  const selected = new Set(profile.productLines);
  return required.some((line) => selected.has(line));
}
