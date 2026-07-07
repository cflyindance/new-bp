/** M 平台 · 企业级硬件资产（跨门店聚合视图） */

export type EnterpriseDeviceType =
  | "payment"
  | "fiscal"
  | "cash-drawer"
  | "caller-id"
  | "router"
  | "pos"
  | "pos-go"
  | "kds"
  | "queue-display"
  | "printer"
  | "scale"
  | "kiosk"
  | "cds"
  | "emenu";

export type EnterpriseDeviceStatus = "online" | "offline" | "unknown";

export type EnterpriseDeviceHealth = "ok" | "warn" | "critical";

export type EnterpriseStoreStatus = "open" | "preparing" | "closed";

export type EnterpriseAlertSeverity = "info" | "warn" | "critical";

export type EnterpriseAlertType = "offline" | "version" | "license" | "dependency";

export interface EnterpriseHardwareStore {
  storeId: string;
  storeName: string;
  brandId: string;
  brandName: string;
  regionId: string;
  regionName: string;
  storeStatus: EnterpriseStoreStatus;
}

export type EnterpriseMobileOs = "ios" | "android";

export interface EnterpriseDevice {
  uid: string;
  deviceType: EnterpriseDeviceType;
  name: string;
  sn: string;
  deviceId: string;
  brand?: string;
  model?: string;
  storeId: string;
  area?: string;
  status: EnterpriseDeviceStatus;
  health: EnterpriseDeviceHealth;
  critical: boolean;
  lastSeenAt: string;
  /** Kiosk / eMenu 等移动终端：iOS 或 Android */
  mobileOs?: EnterpriseMobileOs;
  appVersion?: string;
  shellVersion?: string;
  webviewVersion?: string;
  systemVersion?: string;
  /** Kiosk / eMenu 屏幕分辨率，如 1920 × 1080 */
  screenResolution?: string;
  /** Kiosk / eMenu 硬件时区 */
  timezone?: string;
  licenseType?: string;
  licenseExpiresAt?: string;
  merchantEditPath: string;
  source: "terminal-report" | "manual-config";
}

export interface EnterpriseHardwareAlert {
  id: string;
  storeId: string;
  deviceUid: string;
  type: EnterpriseAlertType;
  severity: EnterpriseAlertSeverity;
  title: string;
  detail: string;
  openedAt: string;
  resolved: boolean;
}

export interface EnterpriseHardwareOverviewStats {
  totalDevices: number;
  onlineCount: number;
  offlineCount: number;
  unknownCount: number;
  onlineRate: number;
  alertCount: number;
  criticalDeviceCount: number;
  byType: Record<EnterpriseDeviceType, number>;
  topRiskStores: { storeId: string; storeName: string; offlineCount: number; alertCount: number }[];
}

export interface EnterpriseDeviceFilter {
  merchantId?: string;
  brandId?: string;
  regionId?: string;
  storeId?: string;
  deviceType?: EnterpriseDeviceType | "";
  status?: EnterpriseDeviceStatus | "";
  query?: string;
}
