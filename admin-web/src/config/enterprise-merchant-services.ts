/**
 * M 平台 · 品牌能力与服务 · 源自菜单路由（permission-registry）四级树
 */
import type { ProductLineId } from "./platform-preset-catalog";
import { getEffectivePresetModuleTier } from "./platform-preset-recommendations";
import {
  buildPlatformPresetIndex,
  resolvePlatformPresetTreeOptions,
} from "./platform-preset-tree";
import type { PlatformPresetNodeSelection } from "./platform-preset-node-selection";
import { syncNodeDisplayWithEnabled } from "./platform-preset-node-selection";
import type { FourColumnTreeIndex } from "./permission-four-column-ui";
import type { MerchantCapabilitySnapshot, MerchantServiceBillingType, MerchantServiceSubscription } from "./enterprise-merchant-types";

/** 收费增值服务 · 对应一级导航 moduleId（菜单路由配置） */
export const MERCHANT_PAID_SERVICE_MODULES: {
  serviceId: string;
  moduleId: string;
  name: string;
  description: string;
}[] = [
  {
    serviceId: "svc-advanced-report",
    moduleId: "reports-finance",
    name: "高级报表",
    description: "多店对比、自定义报表与财务分析",
  },
  {
    serviceId: "svc-member-plus",
    moduleId: "members",
    name: "会员 Plus",
    description: "等级、储值、营销自动化",
  },
  {
    serviceId: "svc-delivery-hub",
    moduleId: "waitlist",
    name: "外卖聚合",
    description: "外卖 / 来取与多平台订单接入",
  },
  {
    serviceId: "svc-hardware-monitor",
    moduleId: "device-management",
    name: "硬件监控",
    description: "企业级硬件资产中心与设备监控",
  },
  {
    serviceId: "svc-api-open",
    moduleId: "system-settings",
    name: "Open API",
    description: "第三方对接与 Open API 配额",
  },
];

const PAID_MODULE_IDS = new Set(MERCHANT_PAID_SERVICE_MODULES.map((m) => m.moduleId));
const LEGACY_TO_MODULE = new Map(MERCHANT_PAID_SERVICE_MODULES.map((m) => [m.serviceId, m.moduleId]));

export function isPaidServiceModuleId(moduleId: string): boolean {
  return PAID_MODULE_IDS.has(moduleId);
}

export function resolveMerchantServiceProductLine(productLineIds: string[]): ProductLineId {
  const first = productLineIds[0];
  if (first === "pos" || first === "kiosk" || first === "emenu" || first === "sdi") return first;
  return "pos";
}

export function buildMerchantServiceTreeIndex(productLineId: ProductLineId): FourColumnTreeIndex {
  const treeOptions = resolvePlatformPresetTreeOptions("enterprise", { blueprintVersion: undefined });
  const full = buildPlatformPresetIndex(productLineId, treeOptions);
  return { groups: full.groups, getDescendantKeys: full.getDescendantKeys.bind(full) };
}

function filterIndexByModules(
  productLineId: ProductLineId,
  modulePredicate: (moduleId: string) => boolean,
): FourColumnTreeIndex {
  const treeOptions = resolvePlatformPresetTreeOptions("enterprise", { blueprintVersion: undefined });
  const full = buildPlatformPresetIndex(productLineId, treeOptions);
  const groups = full.groups.filter((g) => modulePredicate(g.moduleId));
  const allowed = new Set<string>();
  for (const g of groups) {
    allowed.add(g.moduleKey);
    for (const dk of full.getDescendantKeys(g.moduleKey)) allowed.add(dk);
  }
  return {
    groups,
    getDescendantKeys: (key: string) => full.getDescendantKeys(key).filter((k) => allowed.has(k)),
  };
}

export function buildIncludedServiceTreeIndex(productLineId: ProductLineId): FourColumnTreeIndex {
  return filterIndexByModules(productLineId, (id) => !PAID_MODULE_IDS.has(id));
}

export function buildPaidServiceTreeIndex(productLineId: ProductLineId): FourColumnTreeIndex {
  return filterIndexByModules(productLineId, (id) => PAID_MODULE_IDS.has(id));
}

export function migrateLegacyMerchantServices(services: MerchantServiceSubscription[]): MerchantServiceSubscription[] {
  return services.map((s) => {
    const legacyModule = LEGACY_TO_MODULE.get(s.serviceId);
    if (!legacyModule) return s;
    return {
      ...s,
      serviceId: legacyModule,
      nodeKey: legacyModule,
      billingType: "paid" as const,
      enabled: s.enabled,
    };
  });
}

function emptySelectionForIndex(index: FourColumnTreeIndex): Record<string, PlatformPresetNodeSelection> {
  const sel: Record<string, PlatformPresetNodeSelection> = {};
  for (const g of index.groups) {
    sel[g.moduleKey] = { enabled: false, display: false };
    for (const key of index.getDescendantKeys(g.moduleKey)) {
      sel[key] = { enabled: false, display: false };
    }
  }
  return sel;
}

function applyEnabledFromServices(
  selection: Record<string, PlatformPresetNodeSelection>,
  services: MerchantServiceSubscription[],
  billingType: MerchantServiceBillingType,
  index: FourColumnTreeIndex,
): void {
  for (const svc of services) {
    if (!svc.enabled) continue;
    const bt = svc.billingType ?? (isPaidServiceModuleId(svc.serviceId) ? "paid" : "included");
    if (bt !== billingType) continue;
    const key = svc.nodeKey ?? svc.serviceId;
    if (selection[key] !== undefined) {
      selection[key] = syncNodeDisplayWithEnabled(selection[key], true);
      continue;
    }
    const root = key.split(":")[0] ?? key;
    if (selection[root] !== undefined) {
      selection[root] = syncNodeDisplayWithEnabled(selection[root], true);
    }
  }
  void index;
}

export function buildDefaultIncludedSelection(
  businessTypeIds: string[],
  productLineId: ProductLineId,
  index: FourColumnTreeIndex,
): Record<string, PlatformPresetNodeSelection> {
  const sel = emptySelectionForIndex(index);
  const bt = businessTypeIds[0] ?? "full-service";
  for (const g of index.groups) {
    const tier = getEffectivePresetModuleTier(g.moduleId, bt, productLineId);
    if (tier === "excluded") continue;
    sel[g.moduleKey] = syncNodeDisplayWithEnabled(sel[g.moduleKey], true);
  }
  return sel;
}

export function capabilityToServiceSelections(
  cap: MerchantCapabilitySnapshot,
  productLineId: ProductLineId,
): {
  included: Record<string, PlatformPresetNodeSelection>;
  paid: Record<string, PlatformPresetNodeSelection>;
} {
  const includedIndex = buildIncludedServiceTreeIndex(productLineId);
  const paidIndex = buildPaidServiceTreeIndex(productLineId);
  const services = migrateLegacyMerchantServices(cap.services);

  const included = emptySelectionForIndex(includedIndex);
  const paid = emptySelectionForIndex(paidIndex);

  applyEnabledFromServices(included, services, "included", includedIndex);
  applyEnabledFromServices(paid, services, "paid", paidIndex);

  const hasIncluded = services.some((s) => s.enabled && (s.billingType ?? "included") === "included");
  if (!hasIncluded && cap.businessTypeIds.length > 0) {
    const defaults = buildDefaultIncludedSelection(cap.businessTypeIds, productLineId, includedIndex);
    for (const [key, node] of Object.entries(defaults)) {
      if (node.enabled) included[key] = node;
    }
  }

  return { included, paid };
}

export function serviceSelectionsToSubscriptions(
  included: Record<string, PlatformPresetNodeSelection>,
  paid: Record<string, PlatformPresetNodeSelection>,
): MerchantServiceSubscription[] {
  const out: MerchantServiceSubscription[] = [];
  for (const [key, node] of Object.entries(included)) {
    if (!node.enabled) continue;
    out.push({
      serviceId: key,
      nodeKey: key,
      enabled: true,
      billingType: "included",
      storeScope: "all",
    });
  }
  for (const [key, node] of Object.entries(paid)) {
    if (!node.enabled) continue;
    out.push({
      serviceId: key,
      nodeKey: key,
      enabled: true,
      billingType: "paid",
      storeScope: "all",
    });
  }
  return out;
}

export function cascadeMerchantServiceSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
  index: FourColumnTreeIndex,
): Record<string, PlatformPresetNodeSelection> {
  const next = { ...selection };
  next[key] = syncNodeDisplayWithEnabled(next[key], enabled);
  for (const dk of index.getDescendantKeys(key)) {
    next[dk] = syncNodeDisplayWithEnabled(next[dk], enabled);
  }
  return next;
}

export function countEnabledL1(selection: Record<string, PlatformPresetNodeSelection>, index: FourColumnTreeIndex): number {
  return index.groups.filter((g) => selection[g.moduleKey]?.enabled).length;
}

/** 从 selection 提取已启用的节点键 */
export function enabledKeysFromSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
): string[] {
  return Object.entries(selection)
    .filter(([, node]) => node.enabled)
    .map(([key]) => key);
}

/** 品牌显式已开通的键（不含自动展开的子孙） */
export function brandCapabilityCeilingKeys(
  cap: MerchantCapabilitySnapshot,
  productLineId: ProductLineId,
): Set<string> {
  const { included, paid } = capabilityToServiceSelections(cap, productLineId);
  return new Set([...enabledKeysFromSelection(included), ...enabledKeysFromSelection(paid)]);
}

/**
 * 门店可选上限：品牌已开通键 + 其全部子孙节点。
 * 品牌若只开通一级，门店仍可在该一级下对二/三/四级逐项勾选。
 */
export function brandStoreSelectableCeiling(
  cap: MerchantCapabilitySnapshot,
  productLineId: ProductLineId,
): Set<string> {
  return expandCeilingWithDescendants(brandCapabilityCeilingKeys(cap, productLineId), productLineId);
}

/** 将已开通键扩展为包含全树子孙，供门店四级勾选 */
export function expandCeilingWithDescendants(
  baseCeiling: Set<string>,
  productLineId: ProductLineId,
): Set<string> {
  if (baseCeiling.size === 0) return new Set();
  const indexes = [buildIncludedServiceTreeIndex(productLineId), buildPaidServiceTreeIndex(productLineId)];
  const expanded = new Set(baseCeiling);
  for (const index of indexes) {
    for (const key of baseCeiling) {
      for (const dk of index.getDescendantKeys(key)) {
        expanded.add(dk);
      }
    }
  }
  return expanded;
}

/**
 * 仅保留品牌已开通范围内的一级模块；
 * getDescendantKeys 返回上限内的全部子孙，保证二～四级可勾选与级联。
 */
export function filterIndexByCeiling(
  index: FourColumnTreeIndex,
  ceiling: Set<string>,
): FourColumnTreeIndex {
  const groups = index.groups.filter(
    (g) => ceiling.has(g.moduleKey) || index.getDescendantKeys(g.moduleKey).some((k) => ceiling.has(k)),
  );
  return {
    groups,
    getDescendantKeys: (key: string) => index.getDescendantKeys(key).filter((k) => ceiling.has(k)),
  };
}

/** 门店开启键 → selection；仅 ceiling 内键可生效；默认全关 */
export function storeEnabledKeysToSelections(
  enabledKeys: string[],
  productLineId: ProductLineId,
  ceiling: Set<string>,
): {
  included: Record<string, PlatformPresetNodeSelection>;
  paid: Record<string, PlatformPresetNodeSelection>;
  includedIndex: FourColumnTreeIndex;
  paidIndex: FourColumnTreeIndex;
} {
  const includedIndex = filterIndexByCeiling(buildIncludedServiceTreeIndex(productLineId), ceiling);
  const paidIndex = filterIndexByCeiling(buildPaidServiceTreeIndex(productLineId), ceiling);
  const allowed = new Set(enabledKeys.filter((k) => ceiling.has(k)));

  const included = emptySelectionForIndex(includedIndex);
  const paid = emptySelectionForIndex(paidIndex);
  for (const key of allowed) {
    if (included[key] !== undefined) included[key] = syncNodeDisplayWithEnabled(included[key], true);
    if (paid[key] !== undefined) paid[key] = syncNodeDisplayWithEnabled(paid[key], true);
  }
  return { included, paid, includedIndex, paidIndex };
}

/** 门店勾选结果 ∩ 品牌上限 → enabledKeys */
export function storeSelectionsToEnabledKeys(
  included: Record<string, PlatformPresetNodeSelection>,
  paid: Record<string, PlatformPresetNodeSelection>,
  ceiling: Set<string>,
): string[] {
  const keys = [...enabledKeysFromSelection(included), ...enabledKeysFromSelection(paid)];
  return [...new Set(keys.filter((k) => ceiling.has(k)))].sort();
}

/**
 * 级联勾选：在品牌上限内对当前节点及子孙启停。
 * 允许对一～四级任意节点勾选（须落在 ceiling 内）。
 */
export function cascadeStoreServiceSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  key: string,
  enabled: boolean,
  index: FourColumnTreeIndex,
  ceiling: Set<string>,
): Record<string, PlatformPresetNodeSelection> {
  if (enabled && !ceiling.has(key)) return selection;
  const next = { ...selection };
  next[key] = syncNodeDisplayWithEnabled(next[key], enabled);
  for (const dk of index.getDescendantKeys(key)) {
    if (!ceiling.has(dk)) {
      if (enabled) next[dk] = syncNodeDisplayWithEnabled(next[dk], false);
      continue;
    }
    next[dk] = syncNodeDisplayWithEnabled(next[dk], enabled);
  }
  return next;
}
