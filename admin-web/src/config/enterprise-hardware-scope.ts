/**
 * M 平台 · 企业级硬件资产中心 · 路由作用域
 */
import { ENTERPRISE_DEVICE_TYPES, getDefaultEnterpriseDeviceType, getDeviceTypeNavTitle } from "./enterprise-hardware-store";
import type { EnterpriseDeviceType } from "./enterprise-hardware-types";

export const ENTERPRISE_HARDWARE_ROUTE_PREFIX = "/m-platform/hardware";
export const ENTERPRISE_HARDWARE_DEVICES_PATH = `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/devices`;
export const ENTERPRISE_HARDWARE_DEVICES_BY_TYPE_PREFIX = `${ENTERPRISE_HARDWARE_DEVICES_PATH}/by-type`;

export const ENTERPRISE_HARDWARE_MODULE_LABEL = "硬件资产中心";

export function isMPlatformHardwarePath(path: string): boolean {
  return path === ENTERPRISE_HARDWARE_ROUTE_PREFIX || path.startsWith(`${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/`);
}

export function hardwareHref(subpath: string): string {
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `#${ENTERPRISE_HARDWARE_ROUTE_PREFIX}${normalized}`;
}

export function hardwareDevicesByTypeHref(deviceType: EnterpriseDeviceType): string {
  return hardwareHref(`/devices/by-type/${encodeURIComponent(deviceType)}`);
}

export function isEnterpriseDevicesByTypePath(path: string): boolean {
  return path === ENTERPRISE_HARDWARE_DEVICES_BY_TYPE_PREFIX || path.startsWith(`${ENTERPRISE_HARDWARE_DEVICES_BY_TYPE_PREFIX}/`);
}

export function isEnterpriseDeviceDetailPath(path: string): boolean {
  if (!path.startsWith(`${ENTERPRISE_HARDWARE_DEVICES_PATH}/`)) return false;
  if (path === ENTERPRISE_HARDWARE_DEVICES_PATH) return false;
  if (isEnterpriseDevicesByTypePath(path)) return false;
  return true;
}

export function getActiveEnterpriseDeviceType(path: string): EnterpriseDeviceType | null {
  if (!isEnterpriseDevicesByTypePath(path)) return null;
  if (path === ENTERPRISE_HARDWARE_DEVICES_BY_TYPE_PREFIX) return getDefaultEnterpriseDeviceType();
  const raw = decodeURIComponent(path.slice(`${ENTERPRISE_HARDWARE_DEVICES_BY_TYPE_PREFIX}/`.length));
  if (ENTERPRISE_DEVICE_TYPES.has(raw as EnterpriseDeviceType)) return raw as EnterpriseDeviceType;
  return getDefaultEnterpriseDeviceType();
}

export function findHardwarePageTitle(path: string): { title: string; module: string } | null {
  if (!isMPlatformHardwarePath(path)) return null;
  if (path === `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/overview` || path === ENTERPRISE_HARDWARE_ROUTE_PREFIX) {
    return { title: "硬件总览", module: ENTERPRISE_HARDWARE_MODULE_LABEL };
  }
  if (path === ENTERPRISE_HARDWARE_DEVICES_PATH) {
    return { title: "全量设备", module: ENTERPRISE_HARDWARE_MODULE_LABEL };
  }
  if (isEnterpriseDevicesByTypePath(path)) {
    const deviceType = getActiveEnterpriseDeviceType(path);
    return {
      title: deviceType ? getDeviceTypeNavTitle(deviceType) : "设备类型",
      module: `${ENTERPRISE_HARDWARE_MODULE_LABEL} · 全量设备`,
    };
  }
  if (path === `${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/alerts`) {
    return { title: "告警", module: ENTERPRISE_HARDWARE_MODULE_LABEL };
  }
  if (isEnterpriseDeviceDetailPath(path)) {
    const uid = decodeURIComponent(path.replace(`${ENTERPRISE_HARDWARE_DEVICES_PATH}/`, ""));
    return { title: uid ? `设备 · ${uid}` : "设备详情", module: ENTERPRISE_HARDWARE_MODULE_LABEL };
  }
  if (path.startsWith(`${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/stores/`)) {
    const storeId = decodeURIComponent(path.replace(`${ENTERPRISE_HARDWARE_ROUTE_PREFIX}/stores/`, ""));
    return { title: storeId ? `门店 · ${storeId}` : "门店设备", module: ENTERPRISE_HARDWARE_MODULE_LABEL };
  }
  return { title: "硬件资产", module: ENTERPRISE_HARDWARE_MODULE_LABEL };
}
