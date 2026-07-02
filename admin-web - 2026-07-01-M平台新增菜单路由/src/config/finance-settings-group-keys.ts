/**
 * 财务中心设置 · 场景分组键（与 scripts/lib/finance-settings-groups.mjs 对齐）
 * catalog 映射表未重建时，按 seq 将 groupKey 归一化为日常班结 + 核算口径三组。
 */
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import { MODULE_SETTINGS_BY_PATH } from "./module-settings-catalog";

export const FINANCE_SETTINGS_PATH = "/finance/settings";

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const FINANCE_SETTINGS_LEGACY_GROUP_REDIRECT: Record<string, string> = {
  "daily-close-settlement": "daily-cash-close",
  "cash-drawer-reconciliation": "drawer-float-reconcile",
  "fees-tips-expense": "processor-cost-basis",
};

export const FINANCE_SETTINGS_GROUP_TITLES: Record<string, string> = {
  "daily-cash-close": "现金日结与班结",
  "drawer-float-reconcile": "钱箱备款与平账",
  "processor-cost-basis": "收单成本与报表口径",
};

/** 各组内 seq（与 scripts/lib/finance-settings-groups.mjs 同步） */
const FINANCE_SETTINGS_INTRA_GROUP_SEQ: Record<string, readonly number[]> = {
  "daily-cash-close": [171, 65, 330],
  "drawer-float-reconcile": [63, 76, 181],
  "processor-cost-basis": [307],
};

const financeGroupKeyBySeq = (() => {
  const map = new Map<number, string>();
  for (const [groupKey, seqs] of Object.entries(FINANCE_SETTINGS_INTRA_GROUP_SEQ)) {
    for (const seq of seqs) map.set(seq, groupKey);
  }
  return map;
})();

let financeCatalogGroupKeyBySeq: Map<number, string> | null = null;

function getFinanceCatalogGroupKeyBySeq(seq: number): string | undefined {
  if (!financeCatalogGroupKeyBySeq) {
    financeCatalogGroupKeyBySeq = new Map();
    const items = MODULE_SETTINGS_BY_PATH[FINANCE_SETTINGS_PATH]?.items ?? [];
    for (const item of items) {
      financeCatalogGroupKeyBySeq.set(item.seq, item.groupKey);
    }
  }
  return financeCatalogGroupKeyBySeq.get(seq);
}

/** 同一财务场景组在 catalog / 预设树中可能出现的全部 groupKey 别名 */
const legacyKeysByCanonical = (() => {
  const map = new Map<string, Set<string>>();
  const add = (canonical: string, alias: string) => {
    if (!map.has(canonical)) map.set(canonical, new Set());
    map.get(canonical)!.add(alias);
  };
  for (const [legacy, canonical] of Object.entries(FINANCE_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    add(canonical, legacy);
    add(canonical, canonical);
  }
  for (const groupKey of Object.keys(FINANCE_SETTINGS_GROUP_TITLES)) {
    add(groupKey, groupKey);
  }
  return map;
})();

export function isFinanceSettingsPath(settingsPath: string): boolean {
  return settingsPath === FINANCE_SETTINGS_PATH || settingsPath.startsWith(`${FINANCE_SETTINGS_PATH}/`);
}

export function normalizeFinanceCatalogGroupKey(groupKey: string): string {
  return FINANCE_SETTINGS_LEGACY_GROUP_REDIRECT[groupKey] ?? groupKey;
}

export function resolveFinanceCatalogGroupKeyForSeq(seq: number, fallbackGroupKey: string): string {
  return financeGroupKeyBySeq.get(seq) ?? normalizeFinanceCatalogGroupKey(fallbackGroupKey);
}

export function normalizeFinanceCatalogItemsForGrouping(
  items: ModuleSettingCatalogItem[],
): ModuleSettingCatalogItem[] {
  return items.map((item) => {
    const catalogKey = getFinanceCatalogGroupKeyBySeq(item.seq) ?? item.groupKey;
    const groupKey = resolveFinanceCatalogGroupKeyForSeq(item.seq, catalogKey);
    if (groupKey === item.groupKey && FINANCE_SETTINGS_GROUP_TITLES[groupKey] === item.groupTitle) {
      return item;
    }
    return {
      ...item,
      groupKey,
      groupTitle: FINANCE_SETTINGS_GROUP_TITLES[groupKey] ?? item.groupTitle,
    };
  });
}

/** 平台预设 L3/L4 查找：兼容 catalog 原文键、场景键与旧键别名 */
export function financePresetGroupKeyCandidates(
  item: Pick<ModuleSettingCatalogItem, "seq" | "groupKey">,
): string[] {
  const catalogKey = getFinanceCatalogGroupKeyBySeq(item.seq);
  const canonical = resolveFinanceCatalogGroupKeyForSeq(item.seq, catalogKey ?? item.groupKey);
  const keys = new Set<string>([item.groupKey, canonical]);
  if (catalogKey) keys.add(catalogKey);
  for (const alias of legacyKeysByCanonical.get(canonical) ?? []) {
    keys.add(alias);
  }
  for (const [legacy, target] of Object.entries(FINANCE_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    if (target === canonical) keys.add(legacy);
  }
  return [...keys];
}

export function financePresetGroupKeyCandidatesForGroup(
  groupKey: string,
  items: readonly ModuleSettingCatalogItem[],
): string[] {
  const keys = new Set<string>([groupKey, normalizeFinanceCatalogGroupKey(groupKey)]);
  for (const item of items) {
    for (const k of financePresetGroupKeyCandidates(item)) keys.add(k);
  }
  return [...keys];
}
