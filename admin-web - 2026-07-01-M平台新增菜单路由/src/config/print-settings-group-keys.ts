/**
 * 打印中心设置 · 场景分组键（与 scripts/lib/print-settings-groups.mjs 对齐）
 * catalog 映射表未重建时，按 seq 将 groupKey 归一化为票种方案五组。
 */
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import { MODULE_SETTINGS_BY_PATH } from "./module-settings-catalog";

export const PRINT_SETTINGS_PATH = "/print-templates/settings";

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const PRINT_SETTINGS_LEGACY_GROUP_REDIRECT: Record<string, string> = {
  "print-foundation-devices": "print-engine-device",
  "order-receipt-trigger": "order-receipt",
  "receipt-print-execution": "order-receipt",
  "receipt-line-content": "order-receipt",
  "receipt-layout-format": "order-receipt",
  "payment-receipt-flow": "payment-signature-slip",
  "packing-slip-print": "packing-slip",
  "ticket-number-slip": "pickup-number-slip",
};

export const PRINT_SETTINGS_GROUP_TITLES: Record<string, string> = {
  "print-engine-device": "出纸与设备",
  "order-receipt": "订单收据",
  "payment-signature-slip": "支付签购单",
  "packing-slip": "打包单",
  "pickup-number-slip": "取餐号小票",
};

/** 各组内 seq（与 scripts/lib/print-settings-groups.mjs 同步） */
const PRINT_SETTINGS_INTRA_GROUP_SEQ: Record<string, readonly number[]> = {
  "print-engine-device": [167, 256, 259, 265, 269],
  "order-receipt": [
    654, 500, 262, 273, 283, 289, 286, 282, 275, 274, 278, 276, 285, 284, 277, 264, 279, 280,
    290, 281,
  ],
  "payment-signature-slip": [246, 261, 250, 247, 272, 94],
  "packing-slip": [34, 297, 303],
  "pickup-number-slip": [291, 292],
};

const printGroupKeyBySeq = (() => {
  const map = new Map<number, string>();
  for (const [groupKey, seqs] of Object.entries(PRINT_SETTINGS_INTRA_GROUP_SEQ)) {
    for (const seq of seqs) map.set(seq, groupKey);
  }
  return map;
})();

let printCatalogGroupKeyBySeq: Map<number, string> | null = null;

function getPrintCatalogGroupKeyBySeq(seq: number): string | undefined {
  if (!printCatalogGroupKeyBySeq) {
    printCatalogGroupKeyBySeq = new Map();
    const items = MODULE_SETTINGS_BY_PATH[PRINT_SETTINGS_PATH]?.items ?? [];
    for (const item of items) {
      printCatalogGroupKeyBySeq.set(item.seq, item.groupKey);
    }
  }
  return printCatalogGroupKeyBySeq.get(seq);
}

/** 同一打印场景组在 catalog / 预设树中可能出现的全部 groupKey 别名 */
const legacyKeysByCanonical = (() => {
  const map = new Map<string, Set<string>>();
  const add = (canonical: string, alias: string) => {
    if (!map.has(canonical)) map.set(canonical, new Set());
    map.get(canonical)!.add(alias);
  };
  for (const [legacy, canonical] of Object.entries(PRINT_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    add(canonical, legacy);
    add(canonical, canonical);
  }
  for (const groupKey of Object.keys(PRINT_SETTINGS_GROUP_TITLES)) {
    add(groupKey, groupKey);
  }
  return map;
})();

export function isPrintSettingsPath(settingsPath: string): boolean {
  return settingsPath === PRINT_SETTINGS_PATH || settingsPath.startsWith(`${PRINT_SETTINGS_PATH}/`);
}

export function normalizePrintCatalogGroupKey(groupKey: string): string {
  return PRINT_SETTINGS_LEGACY_GROUP_REDIRECT[groupKey] ?? groupKey;
}

export function resolvePrintCatalogGroupKeyForSeq(seq: number, fallbackGroupKey: string): string {
  return printGroupKeyBySeq.get(seq) ?? normalizePrintCatalogGroupKey(fallbackGroupKey);
}

export function normalizePrintCatalogItemsForGrouping(
  items: ModuleSettingCatalogItem[],
): ModuleSettingCatalogItem[] {
  return items.map((item) => {
    const catalogKey = getPrintCatalogGroupKeyBySeq(item.seq) ?? item.groupKey;
    const groupKey = resolvePrintCatalogGroupKeyForSeq(item.seq, catalogKey);
    if (groupKey === item.groupKey && PRINT_SETTINGS_GROUP_TITLES[groupKey] === item.groupTitle) {
      return item;
    }
    return {
      ...item,
      groupKey,
      groupTitle: PRINT_SETTINGS_GROUP_TITLES[groupKey] ?? item.groupTitle,
    };
  });
}

/** 平台预设 L3/L4 查找：兼容 catalog 原文键、票种场景键与旧键别名 */
export function printPresetGroupKeyCandidates(
  item: Pick<ModuleSettingCatalogItem, "seq" | "groupKey">,
): string[] {
  const catalogKey = getPrintCatalogGroupKeyBySeq(item.seq);
  const canonical = resolvePrintCatalogGroupKeyForSeq(item.seq, catalogKey ?? item.groupKey);
  const keys = new Set<string>([item.groupKey, canonical]);
  if (catalogKey) keys.add(catalogKey);
  for (const alias of legacyKeysByCanonical.get(canonical) ?? []) {
    keys.add(alias);
  }
  for (const [legacy, target] of Object.entries(PRINT_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    if (target === canonical) keys.add(legacy);
  }
  return [...keys];
}

export function printPresetGroupKeyCandidatesForGroup(
  groupKey: string,
  items: readonly ModuleSettingCatalogItem[],
): string[] {
  const keys = new Set<string>([groupKey, normalizePrintCatalogGroupKey(groupKey)]);
  for (const item of items) {
    for (const k of printPresetGroupKeyCandidates(item)) keys.add(k);
  }
  return [...keys];
}
