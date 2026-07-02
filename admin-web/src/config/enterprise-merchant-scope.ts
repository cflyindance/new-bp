/**
 * M 平台 · 品牌管理中心 · 路由
 */
import { getMerchantById, getGroupById, MERCHANT_RESERVED_PATH_SEGMENTS } from "./enterprise-merchant-store";

export const ENTERPRISE_MERCHANT_ROUTE_PREFIX = "/m-platform/merchants";
export const ENTERPRISE_MERCHANT_MODULE_LABEL = "品牌管理中心";

export type MerchantDetailTab = "overview" | "org" | "capabilities" | "changelog";

export function isMPlatformMerchantPath(path: string): boolean {
  return path === ENTERPRISE_MERCHANT_ROUTE_PREFIX || path.startsWith(`${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/`);
}

export function merchantHref(subpath: string): string {
  if (!subpath) return `#${ENTERPRISE_MERCHANT_ROUTE_PREFIX}`;
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `#${ENTERPRISE_MERCHANT_ROUTE_PREFIX}${normalized}`;
}

export function merchantDetailHref(merchantId: string, tab: MerchantDetailTab = "overview"): string {
  if (tab === "overview") return merchantHref(`/${encodeURIComponent(merchantId)}`);
  return merchantHref(`/${encodeURIComponent(merchantId)}/${tab}`);
}

export function merchantGroupEditHref(groupId: string): string {
  return merchantHref(`/groups/${encodeURIComponent(groupId)}/edit`);
}

export function parseGroupFormPath(path: string): { mode: "new" } | { mode: "edit"; groupId: string } | null {
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups/new`) return { mode: "new" };
  const prefix = `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups/`;
  if (!path.startsWith(prefix)) return null;
  const rest = path.slice(prefix.length);
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 2 && parts[1] === "edit") {
    return { mode: "edit", groupId: decodeURIComponent(parts[0]!) };
  }
  return null;
}

export function isGroupMgmtPath(path: string): boolean {
  return (
    path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups` ||
    path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups/new` ||
    parseGroupFormPath(path)?.mode === "edit"
  );
}

export function parseMerchantDetailPath(path: string): { merchantId: string; tab: MerchantDetailTab } | null {
  if (!path.startsWith(`${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/`)) return null;
  const rest = path.slice(`${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/`.length);
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const head = decodeURIComponent(parts[0]!);
  if (MERCHANT_RESERVED_PATH_SEGMENTS.has(head)) return null;
  const tab = (parts[1] as MerchantDetailTab | undefined) ?? "overview";
  if (tab !== "overview" && tab !== "org" && tab !== "capabilities" && tab !== "changelog") {
    return { merchantId: head, tab: "overview" };
  }
  return { merchantId: head, tab };
}

export function isMerchantListPath(path: string): boolean {
  return path === ENTERPRISE_MERCHANT_ROUTE_PREFIX;
}

export function findMerchantPageTitle(path: string): { title: string; module: string } | null {
  if (!isMPlatformMerchantPath(path)) return null;
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/overview`) {
    return { title: "品牌总览", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups`) {
    return { title: "集团管理", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups/new`) {
    return { title: "新建集团", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  const groupForm = parseGroupFormPath(path);
  if (groupForm?.mode === "edit") {
    const group = getGroupById(groupForm.groupId);
    return { title: group ? `编辑集团 · ${group.name}` : "编辑集团", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (isMerchantListPath(path)) {
    return { title: "品牌列表", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/new`) {
    return { title: "新建品牌", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/org-tree`) {
    return { title: "组织树", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/change-log`) {
    return { title: "变更记录", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/requests`) {
    return { title: "开通申请 / 待办", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/reports`) {
    return { title: "报表 / SLA", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  const detail = parseMerchantDetailPath(path);
  if (detail) {
    const merchant = getMerchantById(detail.merchantId);
    const name = merchant?.name ?? detail.merchantId;
    const tabTitle =
      detail.tab === "org"
        ? "组织"
        : detail.tab === "capabilities"
          ? "能力与服务"
          : detail.tab === "changelog"
            ? "变更记录"
            : "概览";
    return { title: `${name} · ${tabTitle}`, module: ENTERPRISE_MERCHANT_MODULE_LABEL };
  }
  return { title: "品牌管理", module: ENTERPRISE_MERCHANT_MODULE_LABEL };
}
