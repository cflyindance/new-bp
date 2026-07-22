/**
 * 订单中心设置 · 场景分组键（与 scripts/lib/order-settings-groups.mjs 对齐）
 * catalog 映射表未重建时，按 seq 将 groupKey 归一化为方案 A 六组。
 */
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import { MODULE_SETTINGS_BY_PATH } from "./module-settings-catalog";

export const ORDER_SETTINGS_PATH = "/orders/settings";

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const ORDER_SETTINGS_LEGACY_GROUP_REDIRECT: Record<string, string> = {
  "order-init-scenario": "order-basics",
  "order-numbering": "order-basics",
  "split-merge-edit": "order-edit-split-merge",
  "order-surcharge": "order-surcharge-fees",
  "order-settlement": "order-settlement-rounding",
  "order-void": "order-void-refund",
};

export const ORDER_SETTINGS_GROUP_TITLES: Record<string, string> = {
  "order-basics": "订单基础",
  "order-edit-split-merge": "改单与分合单",
  "order-void-refund": "删单与退款",
  "order-discount": "折扣",
  "order-surcharge-fees": "附加费与服务费",
  "order-settlement-rounding": "结算取整",
};

/** 各组内 seq（与 scripts/lib/settings-intra-group-sort.mjs 同步） */
const ORDER_SETTINGS_INTRA_GROUP_SEQ: Record<string, readonly number[]> = {
  "order-basics": [126, 127, 128, 129, 130, 131],
  "order-edit-split-merge": [117, 116, 115, 124, 119, 140],
  "order-void-refund": [158, 159, 157, 156],
  "order-discount": [446, 162, 163],
  "order-surcharge-fees": [447, 149, 161],
  "order-settlement-rounding": [147],
};

const orderGroupKeyBySeq = (() => {
  const map = new Map<number, string>();
  for (const [groupKey, seqs] of Object.entries(ORDER_SETTINGS_INTRA_GROUP_SEQ)) {
    for (const seq of seqs) map.set(seq, groupKey);
  }
  return map;
})();

let orderCatalogGroupKeyBySeq: Map<number, string> | null = null;

function getOrderCatalogGroupKeyBySeq(seq: number): string | undefined {
  if (!orderCatalogGroupKeyBySeq) {
    orderCatalogGroupKeyBySeq = new Map();
    const items = MODULE_SETTINGS_BY_PATH[ORDER_SETTINGS_PATH]?.items ?? [];
    for (const item of items) {
      orderCatalogGroupKeyBySeq.set(item.seq, item.groupKey);
    }
  }
  return orderCatalogGroupKeyBySeq.get(seq);
}

/** 同一订单场景组在 catalog / 预设树中可能出现的全部 groupKey 别名 */
const legacyKeysByCanonical = (() => {
  const map = new Map<string, Set<string>>();
  const add = (canonical: string, alias: string) => {
    if (!map.has(canonical)) map.set(canonical, new Set());
    map.get(canonical)!.add(alias);
  };
  for (const [legacy, canonical] of Object.entries(ORDER_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    add(canonical, legacy);
    add(canonical, canonical);
  }
  for (const groupKey of Object.keys(ORDER_SETTINGS_GROUP_TITLES)) {
    add(groupKey, groupKey);
  }
  return map;
})();

export function isOrderSettingsPath(settingsPath: string): boolean {
  return settingsPath === ORDER_SETTINGS_PATH || settingsPath.startsWith(`${ORDER_SETTINGS_PATH}/`);
}

export function normalizeOrderCatalogGroupKey(groupKey: string): string {
  return ORDER_SETTINGS_LEGACY_GROUP_REDIRECT[groupKey] ?? groupKey;
}

export function resolveOrderCatalogGroupKeyForSeq(seq: number, fallbackGroupKey: string): string {
  return orderGroupKeyBySeq.get(seq) ?? normalizeOrderCatalogGroupKey(fallbackGroupKey);
}

export function normalizeOrderCatalogItemsForGrouping(
  items: ModuleSettingCatalogItem[],
): ModuleSettingCatalogItem[] {
  return items.map((item) => {
    const catalogKey = getOrderCatalogGroupKeyBySeq(item.seq) ?? item.groupKey;
    const groupKey = resolveOrderCatalogGroupKeyForSeq(item.seq, catalogKey);
    if (groupKey === item.groupKey && ORDER_SETTINGS_GROUP_TITLES[groupKey] === item.groupTitle) {
      return item;
    }
    return {
      ...item,
      groupKey,
      groupTitle: ORDER_SETTINGS_GROUP_TITLES[groupKey] ?? item.groupTitle,
    };
  });
}

/** 平台预设 L3/L4 查找：兼容 catalog 原文键、场景键与旧键别名 */
export function orderPresetGroupKeyCandidates(
  item: Pick<ModuleSettingCatalogItem, "seq" | "groupKey">,
): string[] {
  const catalogKey = getOrderCatalogGroupKeyBySeq(item.seq);
  const canonical = resolveOrderCatalogGroupKeyForSeq(item.seq, catalogKey ?? item.groupKey);
  const keys = new Set<string>([item.groupKey, canonical]);
  if (catalogKey) keys.add(catalogKey);
  for (const alias of legacyKeysByCanonical.get(canonical) ?? []) {
    keys.add(alias);
  }
  for (const [legacy, target] of Object.entries(ORDER_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    if (target === canonical) keys.add(legacy);
  }
  return [...keys];
}

export function orderPresetGroupKeyCandidatesForGroup(
  groupKey: string,
  items: readonly ModuleSettingCatalogItem[],
): string[] {
  const keys = new Set<string>([groupKey, normalizeOrderCatalogGroupKey(groupKey)]);
  for (const item of items) {
    for (const k of orderPresetGroupKeyCandidates(item)) keys.add(k);
  }
  return [...keys];
}
