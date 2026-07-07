/**
 * M 平台 · 企业级硬件资产 · 演示数据与查询
 */
import { getEnterpriseMerchantSnapshot, getMerchantStoreIdSet } from "./enterprise-merchant-store";
import {
  getMPlatformStoreScopeMeta,
  migrateLegacyStoreId,
} from "../permissions/m-platform-store-scope";
import { DEVICE_MANAGEMENT_HARDWARE_SUBNAV } from "./navigation";
import type {
  EnterpriseDevice,
  EnterpriseDeviceFilter,
  EnterpriseDeviceType,
  EnterpriseHardwareAlert,
  EnterpriseHardwareOverviewStats,
  EnterpriseHardwareStore,
} from "./enterprise-hardware-types";

const STORAGE_KEY = "menusifu:enterprise-hardware-demo-v3";

interface EnterpriseHardwareSnapshot {
  stores: EnterpriseHardwareStore[];
  devices: EnterpriseDevice[];
  alerts: EnterpriseHardwareAlert[];
}

function nowIso(offsetMinutes: number): string {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString();
}

function storeMeta(
  storeId: string,
  storeStatus: EnterpriseHardwareStore["storeStatus"] = "open",
): Omit<EnterpriseHardwareStore, "storeId" | "storeName"> & { storeName: string } {
  const normalized = migrateLegacyStoreId(storeId);
  const mMeta = getMPlatformStoreScopeMeta(normalized);
  if (mMeta) {
    const snap = getEnterpriseMerchantSnapshot();
    const merchant = snap.merchants.find((m) => m.merchantId === mMeta.brand);
    return {
      storeName: mMeta.name,
      brandId: mMeta.brand,
      brandName: merchant?.name ?? mMeta.brand,
      regionId: mMeta.region,
      regionName: mMeta.region,
      storeStatus,
    };
  }
  return {
    storeName: normalized,
    brandId: "",
    brandName: normalized,
    regionId: "",
    regionName: "",
    storeStatus,
  };
}

function buildSeedSnapshot(): EnterpriseHardwareSnapshot {
  const stores: EnterpriseHardwareStore[] = [
    "M00000001",
    "M00000002",
    "M00000004",
  ].map((storeId) => ({
    storeId,
    ...storeMeta(storeId),
  }));

  const devices: EnterpriseDevice[] = [
    {
      uid: "pay-sh-ljz-01",
      deviceType: "payment",
      name: "主收银 · PAX A920",
      sn: "PAX88291001",
      deviceId: "TRIPOS-88291001",
      brand: "PAX",
      model: "A920",
      storeId: "M00000001",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(1),
      appVersion: "3.12.4",
      shellVersion: "2.1.0",
      licenseType: "Enterprise",
      licenseExpiresAt: "2027-06-01",
      merchantEditPath: "#/device-management/hardware/payments",
      source: "terminal-report",
    },
    {
      uid: "pay-sh-ljz-02",
      deviceType: "payment",
      name: "副收银 · PAX A80",
      sn: "PAX88291002",
      deviceId: "TRIPOS-88291002",
      brand: "PAX",
      model: "A80",
      storeId: "M00000001",
      status: "offline",
      health: "critical",
      critical: true,
      lastSeenAt: nowIso(95),
      appVersion: "3.10.1",
      licenseType: "Standard",
      licenseExpiresAt: "2026-03-15",
      merchantEditPath: "#/device-management/hardware/payments",
      source: "terminal-report",
    },
    {
      uid: "prt-sh-ljz-kitchen",
      deviceType: "printer",
      name: "后厨热敏 · Epson TM-T88",
      sn: "EPSON-KT-001",
      deviceId: "PRN-KT-001",
      brand: "Epson",
      model: "TM-T88VI",
      storeId: "M00000001",
      area: "后厨",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(2),
      merchantEditPath: "#/device-management/hardware/printers",
      source: "manual-config",
    },
    {
      uid: "cds-sh-ljz-01",
      deviceType: "cds",
      name: "前厅客显 · CDS-7",
      sn: "CDS700012",
      deviceId: "CDS-700012",
      brand: "MenuSifu",
      model: "CDS-7",
      storeId: "M00000001",
      area: "前厅",
      status: "online",
      health: "ok",
      critical: false,
      lastSeenAt: nowIso(3),
      appVersion: "1.8.2",
      merchantEditPath: "#/device-management/hardware/cds",
      source: "terminal-report",
    },
    {
      uid: "kiosk-sh-ljz-01",
      deviceType: "kiosk",
      name: "自助点餐 · Kiosk Pro",
      sn: "KSK-77821",
      deviceId: "KSK-77821",
      brand: "MenuSifu",
      model: "Kiosk Pro",
      storeId: "M00000001",
      area: "入口",
      status: "offline",
      health: "warn",
      critical: false,
      lastSeenAt: nowIso(45),
      mobileOs: "android",
      appVersion: "4.2.0",
      shellVersion: "2.4.15 - 26051401",
      webviewVersion: "148.0.7778.120",
      systemVersion: "Android 11 (API 30)",
      screenResolution: "1920 × 1080",
      timezone: "Asia/Shanghai (UTC+8)",
      merchantEditPath: "#/device-management/hardware/kiosk",
      source: "terminal-report",
    },
    {
      uid: "router-sh-ljz-01",
      deviceType: "router",
      name: "门店主路由 · TP-Link",
      sn: "RTR-SH-01",
      deviceId: "RTR-SH-01",
      brand: "TP-Link",
      model: "ER605",
      storeId: "M00000001",
      area: "机房",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(1),
      merchantEditPath: "#/device-management/hardware/router",
      source: "manual-config",
    },
    {
      uid: "pos-sh-ljz-01",
      deviceType: "pos",
      name: "主收银 POS",
      sn: "POS-SH-01",
      deviceId: "POS-SH-01",
      brand: "MenuSifu",
      model: "POS Terminal",
      storeId: "M00000001",
      area: "前厅",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(1),
      appVersion: "5.6.2",
      systemVersion: "Windows 10 IoT",
      merchantEditPath: "#/device-management/hardware/pos",
      source: "terminal-report",
    },
    {
      uid: "kds-sh-ljz-01",
      deviceType: "kds",
      name: "后厨 KDS · 热菜",
      sn: "KDS-SH-01",
      deviceId: "KDS-SH-01",
      brand: "MenuSifu",
      model: "KDS-15",
      storeId: "M00000001",
      area: "后厨",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(2),
      appVersion: "2.3.0",
      merchantEditPath: "#/device-management/hardware/kds",
      source: "terminal-report",
    },
    {
      uid: "pay-gz-tzh-01",
      deviceType: "payment",
      name: "主收银 · Ingenico DX8000",
      sn: "ING-DX-9001",
      deviceId: "TRIPOS-9001",
      brand: "Ingenico",
      model: "DX8000",
      storeId: "M00000002",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(1),
      appVersion: "3.12.4",
      merchantEditPath: "#/device-management/hardware/payments",
      source: "terminal-report",
    },
    {
      uid: "prt-gz-tzh-bar",
      deviceType: "printer",
      name: "吧台标签 · Zebra ZD420",
      sn: "ZBR-420-88",
      deviceId: "PRN-BAR-88",
      brand: "Zebra",
      model: "ZD420",
      storeId: "M00000002",
      area: "吧台",
      status: "offline",
      health: "critical",
      critical: false,
      lastSeenAt: nowIso(180),
      merchantEditPath: "#/device-management/hardware/printers",
      source: "manual-config",
    },
    {
      uid: "emenu-gz-tzh-12",
      deviceType: "emenu",
      name: "12号桌 · eMenu Pad",
      sn: "EMNU-12",
      deviceId: "EMNU-12",
      brand: "MenuSifu",
      model: "eMenu Pad",
      storeId: "M00000002",
      area: "12号桌",
      status: "online",
      health: "ok",
      critical: false,
      lastSeenAt: nowIso(5),
      mobileOs: "android",
      appVersion: "2.0.1",
      shellVersion: "2.14.6",
      webviewVersion: "2.14.6",
      systemVersion: "Android 11 (API 30)",
      screenResolution: "1920 × 1080",
      timezone: "Asia/Shanghai (UTC+8)",
      merchantEditPath: "#/device-management/hardware/emenu",
      source: "terminal-report",
    },
    {
      uid: "pos-go-gz-tzh-01",
      deviceType: "pos-go",
      name: "跑堂 POS GO",
      sn: "PGO-GZ-01",
      deviceId: "PGO-GZ-01",
      brand: "MenuSifu",
      model: "POS Go",
      storeId: "M00000002",
      area: "前厅",
      status: "online",
      health: "ok",
      critical: false,
      lastSeenAt: nowIso(3),
      mobileOs: "android",
      appVersion: "4.1.0",
      systemVersion: "Android 12",
      merchantEditPath: "#/device-management/hardware/pos-go",
      source: "terminal-report",
    },
    {
      uid: "queue-gz-tzh-01",
      deviceType: "queue-display",
      name: "取餐叫号屏",
      sn: "QDSP-GZ-01",
      deviceId: "QDSP-GZ-01",
      brand: "MenuSifu",
      model: "Queue Display 32",
      storeId: "M00000002",
      area: "取餐口",
      status: "offline",
      health: "warn",
      critical: false,
      lastSeenAt: nowIso(60),
      appVersion: "1.5.0",
      merchantEditPath: "#/device-management/hardware/queue-display",
      source: "terminal-report",
    },
    {
      uid: "pay-nyc-flag-01",
      deviceType: "payment",
      name: "Main POS · PAX A920",
      sn: "PAX-US-001",
      deviceId: "TRIPOS-US-001",
      brand: "PAX",
      model: "A920",
      storeId: "M00000004",
      status: "online",
      health: "ok",
      critical: true,
      lastSeenAt: nowIso(1),
      appVersion: "3.12.4",
      licenseType: "Enterprise",
      licenseExpiresAt: "2027-12-01",
      merchantEditPath: "#/device-management/hardware/payments",
      source: "terminal-report",
    },
    {
      uid: "fiscal-nyc-01",
      deviceType: "fiscal",
      name: "Tax Register · FiscalBox",
      sn: "FIS-NYC-01",
      deviceId: "FIS-NYC-01",
      brand: "FiscalBox",
      model: "FB-200",
      storeId: "M00000004",
      status: "online",
      health: "warn",
      critical: true,
      lastSeenAt: nowIso(20),
      appVersion: "1.1.0",
      licenseExpiresAt: "2026-01-10",
      merchantEditPath: "#/device-management/hardware/fiscal",
      source: "manual-config",
    },
    {
      uid: "caller-nyc-01",
      deviceType: "caller-id",
      name: "Caller ID · Line 1",
      sn: "CID-NYC-1",
      deviceId: "CID-NYC-1",
      storeId: "M00000004",
      status: "unknown",
      health: "warn",
      critical: false,
      lastSeenAt: nowIso(720),
      merchantEditPath: "#/device-management/hardware/caller-id",
      source: "manual-config",
    },
    {
      uid: "scale-nyc-01",
      deviceType: "scale",
      name: "Electronic Scale · Deli",
      sn: "SCL-NYC-01",
      deviceId: "SCL-NYC-01",
      brand: "CAS",
      model: "CL5000",
      storeId: "M00000004",
      area: "Deli Counter",
      status: "online",
      health: "ok",
      critical: false,
      lastSeenAt: nowIso(10),
      merchantEditPath: "#/device-management/hardware/scale",
      source: "manual-config",
    },
    {
      uid: "drawer-la-01",
      deviceType: "cash-drawer",
      name: "Cash Drawer · Register 1",
      sn: "DRW-LA-01",
      deviceId: "DRW-LA-01",
      storeId: "branch-la",
      status: "offline",
      health: "warn",
      critical: false,
      lastSeenAt: nowIso(300),
      merchantEditPath: "#/device-management/hardware/cash-drawer",
      source: "manual-config",
    },
    {
      uid: "kiosk-la-01",
      deviceType: "kiosk",
      name: "Kiosk · Lobby",
      sn: "KSK-LA-01",
      deviceId: "KSK-LA-01",
      brand: "MenuSifu",
      model: "Kiosk Lite",
      storeId: "branch-la",
      area: "Lobby",
      status: "offline",
      health: "critical",
      critical: false,
      lastSeenAt: nowIso(1440),
      mobileOs: "ios",
      appVersion: "3.8.0",
      shellVersion: "2.4.14 - 26040102",
      webviewVersion: "605.1.15",
      systemVersion: "iOS 16.7",
      screenResolution: "2048 × 1536",
      timezone: "America/Los_Angeles (UTC-8)",
      merchantEditPath: "#/device-management/hardware/kiosk",
      source: "terminal-report",
    },
  ];

  const alerts: EnterpriseHardwareAlert[] = [
    {
      id: "alert-001",
      storeId: "M00000001",
      deviceUid: "pay-sh-ljz-02",
      type: "offline",
      severity: "critical",
      title: "主路径支付终端离线",
      detail: "副收银 PAX A80 已离线超过 90 分钟，门店营业中。",
      openedAt: nowIso(90),
      resolved: false,
    },
    {
      id: "alert-002",
      storeId: "M00000001",
      deviceUid: "kiosk-sh-ljz-01",
      type: "offline",
      severity: "warn",
      title: "自助点餐机心跳延迟",
      detail: "Kiosk Pro 最后心跳 45 分钟前。",
      openedAt: nowIso(45),
      resolved: false,
    },
    {
      id: "alert-003",
      storeId: "M00000002",
      deviceUid: "prt-gz-tzh-bar",
      type: "offline",
      severity: "critical",
      title: "吧台打印机长时间离线",
      detail: "Zebra ZD420 已离线 3 小时。",
      openedAt: nowIso(180),
      resolved: false,
    },
    {
      id: "alert-004",
      storeId: "M00000004",
      deviceUid: "fiscal-nyc-01",
      type: "license",
      severity: "warn",
      title: "税控设备许可证即将到期",
      detail: "FiscalBox 许可证将于 2026-01-10 到期。",
      openedAt: nowIso(60 * 24),
      resolved: false,
    },
    {
      id: "alert-005",
      storeId: "branch-la",
      deviceUid: "kiosk-la-01",
      type: "version",
      severity: "info",
      title: "Kiosk 版本低于企业推荐",
      detail: "当前 3.8.0，企业最低推荐 4.0.0。",
      openedAt: nowIso(60 * 48),
      resolved: false,
    },
  ];

  return { stores, devices, alerts };
}

function readSnapshot(): EnterpriseHardwareSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EnterpriseHardwareSnapshot;
      if (parsed?.devices?.length && parsed?.stores?.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seed = buildSeedSnapshot();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* ignore */
  }
  return seed;
}

export function getEnterpriseHardwareSnapshot(): EnterpriseHardwareSnapshot {
  return readSnapshot();
}

export function getEnterpriseStores(): EnterpriseHardwareStore[] {
  return readSnapshot().stores;
}

export function getEnterpriseStoreById(storeId: string): EnterpriseHardwareStore | undefined {
  return readSnapshot().stores.find((s) => s.storeId === storeId);
}

export function getEnterpriseDevices(): EnterpriseDevice[] {
  return readSnapshot().devices;
}

export function getEnterpriseDeviceByUid(uid: string): EnterpriseDevice | undefined {
  return readSnapshot().devices.find((d) => d.uid === uid);
}

export function getEnterpriseAlerts(): EnterpriseHardwareAlert[] {
  return readSnapshot().alerts;
}

/** 与商家后台 DEVICE_MANAGEMENT_HARDWARE_SUBNAV 顺序、命名、路由一一对应 */
const MERCHANT_HARDWARE_SLUG_TO_DEVICE_TYPE: Record<string, EnterpriseDeviceType> = {
  payments: "payment",
  fiscal: "fiscal",
  "cash-drawer": "cash-drawer",
  "caller-id": "caller-id",
  router: "router",
  pos: "pos",
  "pos-go": "pos-go",
  kds: "kds",
  "queue-display": "queue-display",
  printers: "printer",
  scale: "scale",
  kiosk: "kiosk",
  cds: "cds",
  emenu: "emenu",
};

export function merchantHardwarePathToDeviceType(path: string): EnterpriseDeviceType {
  const slug = path.replace("/device-management/hardware/", "");
  return MERCHANT_HARDWARE_SLUG_TO_DEVICE_TYPE[slug] ?? (slug as EnterpriseDeviceType);
}

export const ENTERPRISE_HARDWARE_TYPE_NAV: {
  deviceType: EnterpriseDeviceType;
  title: string;
  titleEn: string;
  merchantPath: string;
}[] = DEVICE_MANAGEMENT_HARDWARE_SUBNAV.map((item) => ({
  deviceType: merchantHardwarePathToDeviceType(item.path),
  title: item.title,
  titleEn: item.titleEn,
  merchantPath: item.path,
}));

export const ENTERPRISE_DEVICE_TYPES = new Set<EnterpriseDeviceType>(
  ENTERPRISE_HARDWARE_TYPE_NAV.map((item) => item.deviceType),
);

export function getMerchantEditPathForDeviceType(type: EnterpriseDeviceType): string {
  const item = ENTERPRISE_HARDWARE_TYPE_NAV.find((entry) => entry.deviceType === type);
  return item ? `#${item.merchantPath}` : "#/device-management/hardware/payments";
}

export function getDeviceTypeNavTitle(type: EnterpriseDeviceType): string {
  return ENTERPRISE_HARDWARE_TYPE_NAV.find((item) => item.deviceType === type)?.title ?? type;
}

export function getDeviceTypeLabel(type: EnterpriseDeviceType): string {
  return getDeviceTypeNavTitle(type);
}

export function countEnterpriseDevicesByType(): Record<EnterpriseDeviceType, number> {
  const counts = {} as Record<EnterpriseDeviceType, number>;
  for (const item of ENTERPRISE_HARDWARE_TYPE_NAV) {
    counts[item.deviceType] = 0;
  }
  for (const device of readSnapshot().devices) {
    counts[device.deviceType] = (counts[device.deviceType] ?? 0) + 1;
  }
  return counts;
}

export function getDefaultEnterpriseDeviceType(): EnterpriseDeviceType {
  const counts = countEnterpriseDevicesByType();
  const firstWithDevices = ENTERPRISE_HARDWARE_TYPE_NAV.find((item) => (counts[item.deviceType] ?? 0) > 0);
  return firstWithDevices?.deviceType ?? ENTERPRISE_HARDWARE_TYPE_NAV[0]!.deviceType;
}

export function isMobileTerminalDevice(device: Pick<EnterpriseDevice, "deviceType">): boolean {
  return device.deviceType === "kiosk" || device.deviceType === "emenu";
}

export function getMobileOsLabel(os: EnterpriseDevice["mobileOs"]): string {
  if (os === "ios") return "iOS";
  if (os === "android") return "Android";
  return "—";
}

export function inferMobileOsFromSystemVersion(systemVersion?: string): EnterpriseDevice["mobileOs"] | undefined {
  if (!systemVersion) return undefined;
  const lower = systemVersion.toLowerCase();
  if (lower.includes("ios") || lower.includes("ipad")) return "ios";
  if (lower.includes("android")) return "android";
  return undefined;
}

export function getStatusLabel(status: EnterpriseDevice["status"]): string {
  if (status === "online") return "在线";
  if (status === "offline") return "离线";
  return "未知";
}

export function getHealthLabel(health: EnterpriseDevice["health"]): string {
  if (health === "ok") return "正常";
  if (health === "warn") return "告警";
  return "故障";
}

export function getStoreStatusLabel(status: EnterpriseHardwareStore["storeStatus"]): string {
  if (status === "open") return "营业中";
  if (status === "preparing") return "筹备中";
  return "停业";
}

function matchesFilter(device: EnterpriseDevice, filter: EnterpriseDeviceFilter, stores: EnterpriseHardwareStore[]): boolean {
  const store = stores.find((s) => s.storeId === device.storeId);
  if (filter.merchantId) {
    const merchantStores = getMerchantStoreIdSet(filter.merchantId);
    if (!merchantStores.has(device.storeId)) return false;
  }
  if (filter.brandId && store?.brandId !== filter.brandId) return false;
  if (filter.regionId && store?.regionId !== filter.regionId) return false;
  if (filter.storeId && device.storeId !== filter.storeId) return false;
  if (filter.deviceType && device.deviceType !== filter.deviceType) return false;
  if (filter.status && device.status !== filter.status) return false;
  if (filter.query) {
    const q = filter.query.trim().toLowerCase();
    if (!q) return true;
    const hay = [device.name, device.sn, device.deviceId, device.uid, device.brand, device.model]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function filterEnterpriseDevices(filter: EnterpriseDeviceFilter = {}): EnterpriseDevice[] {
  const snap = readSnapshot();
  return snap.devices.filter((d) => matchesFilter(d, filter, snap.stores));
}

export function getEnterpriseOverviewStats(): EnterpriseHardwareOverviewStats {
  const snap = readSnapshot();
  const devices = snap.devices;
  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;
  const unknownCount = devices.filter((d) => d.status === "unknown").length;
  const total = devices.length;
  const byType = {} as Record<EnterpriseDeviceType, number>;
  for (const d of devices) {
    byType[d.deviceType] = (byType[d.deviceType] ?? 0) + 1;
  }
  const openAlerts = snap.alerts.filter((a) => !a.resolved);
  const storeRisk = new Map<string, { offlineCount: number; alertCount: number }>();
  for (const d of devices) {
    if (d.status !== "online") {
      const cur = storeRisk.get(d.storeId) ?? { offlineCount: 0, alertCount: 0 };
      cur.offlineCount += 1;
      storeRisk.set(d.storeId, cur);
    }
  }
  for (const a of openAlerts) {
    const cur = storeRisk.get(a.storeId) ?? { offlineCount: 0, alertCount: 0 };
    cur.alertCount += 1;
    storeRisk.set(a.storeId, cur);
  }
  const topRiskStores = [...storeRisk.entries()]
    .map(([storeId, risk]) => ({
      storeId,
      storeName: snap.stores.find((s) => s.storeId === storeId)?.storeName ?? storeId,
      ...risk,
    }))
    .sort((a, b) => b.offlineCount + b.alertCount * 2 - (a.offlineCount + a.alertCount * 2))
    .slice(0, 5);

  return {
    totalDevices: total,
    onlineCount,
    offlineCount,
    unknownCount,
    onlineRate: total ? Math.round((onlineCount / total) * 100) : 0,
    alertCount: openAlerts.length,
    criticalDeviceCount: devices.filter((d) => d.health === "critical").length,
    byType,
    topRiskStores,
  };
}

export function formatRelativeLastSeen(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60_000));
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export function exportDevicesCsv(devices: EnterpriseDevice[]): string {
  const stores = readSnapshot().stores;
  const hasMobileTerminal = devices.some(isMobileTerminalDevice);
  const header = [
    "设备UID",
    "名称",
    "类型",
    "SN",
    "设备ID",
    "品牌",
    "型号",
    "门店",
    "区域",
    "状态",
    "健康度",
    "关键设备",
    "最后活跃",
    ...(hasMobileTerminal
      ? ["系统平台", "Webview版本", "APP版本", "系统版本", "屏幕分辨率", "硬件时区"]
      : ["APP版本"]),
  ];
  const rows = devices.map((d) => {
    const store = stores.find((s) => s.storeId === d.storeId);
    const mobileOs = d.mobileOs ?? inferMobileOsFromSystemVersion(d.systemVersion);
    const base = [
      d.uid,
      d.name,
      getDeviceTypeLabel(d.deviceType),
      d.sn,
      d.deviceId,
      d.brand ?? "",
      d.model ?? "",
      store?.storeName ?? d.storeId,
      store?.regionName ?? "",
      getStatusLabel(d.status),
      getHealthLabel(d.health),
      d.critical ? "是" : "否",
      d.lastSeenAt,
    ];
    if (hasMobileTerminal) {
      return isMobileTerminalDevice(d)
        ? [
            ...base,
            getMobileOsLabel(mobileOs),
            d.webviewVersion ?? "",
            d.appVersion ?? "",
            d.systemVersion ?? "",
            d.screenResolution ?? "",
            d.timezone ?? "",
          ]
        : [...base, "", "", d.appVersion ?? "", "", "", ""];
    }
    return [...base, d.appVersion ?? ""];
  });
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map((c) => escape(String(c))).join(",")).join("\n");
}

export function resetEnterpriseHardwareDemo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
