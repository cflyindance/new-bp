/**
 * 前厅设置 · 场景分组键（与 scripts/lib/foh-settings-groups.mjs 对齐）
 * catalog 映射表未重建时，按 seq 产线 scope 将 groupKey 归一化为方案 E 的 foh-* 键。
 */
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import { MODULE_SETTINGS_BY_PATH } from "./module-settings-catalog";
import { FOH_LINE_SCOPE_BY_SEQ } from "./foh-settings-line-scope";

const FOH_SETTINGS_CATALOG_PATH = "/operations/queue-call/settings";

let fohCatalogGroupKeyBySeq: Map<number, string> | null = null;

/** 预设树 L3/L4 键仍使用 catalog 原文 groupKey，与场景分组 foh-* 键分离 */
function getFohCatalogGroupKeyBySeq(seq: number): string | undefined {
  if (!fohCatalogGroupKeyBySeq) {
    fohCatalogGroupKeyBySeq = new Map();
    const items = MODULE_SETTINGS_BY_PATH[FOH_SETTINGS_CATALOG_PATH]?.items ?? [];
    for (const item of items) {
      fohCatalogGroupKeyBySeq.set(item.seq, item.groupKey);
    }
  }
  return fohCatalogGroupKeyBySeq.get(seq);
}

/** 旧 groupKey → 新 groupKey（设置滑层书签重定向） */
export const FOH_SETTINGS_LEGACY_GROUP_REDIRECT: Record<string, string> = {
  "foh-tables-start": "foh-table-start-flow",
  "tables-floor": "foh-table-start-flow",
  "pos-shell-landing": "foh-pos-shell",
  "pos-order-init": "foh-table-start-flow",
  "table-clear-ops": "foh-table-clear-ops",
  "pos-kitchen-send": "foh-kitchen-send-timing",
  "pos-button-visibility": "foh-pos-buttons",
  "pos-order-toolbar": "foh-pos-order-toolbar",
  "foh-order-cart-combo": "foh-pos-order-cart",
  "pos-order-cart": "foh-pos-order-cart",
  "pos-combo-ordering": "foh-pos-combo-ordering",
  "combo-ordering": "foh-pos-combo-ordering",
  "foh-find-order-checkout": "foh-pos-find-order-list",
  "pos-find-order-list": "foh-pos-find-order-list",
  "foh-pos-checkout-entry": "foh-pos-find-order-list",
  "pos-checkout-entry": "foh-pos-find-order-list",
  "foh-pos-menu-layout": "foh-pos-menu-scope",
  "pos-menu-ui": "foh-pos-menu-scope",
  "foh-pos-menu-ui-layout": "foh-pos-menu-scope",
  "pos-menu-ui-layout": "foh-pos-menu-scope",
  "guest-menu-structure": "foh-guest-menu-body",
  "guest-menu-cart": "foh-guest-menu-body",
  "guest-menu-global": "foh-guest-menu-home",
  "guest-facing-locale": "foh-guest-facing-locale",
  "foh-guest-menu-shell": "foh-guest-menu-home",
  "foh-guest-order-entry": "foh-guest-order-type",
  "guest-order-type": "foh-guest-order-type",
  "guest-pre-order-flow": "foh-guest-pre-order",
  "guest-registration": "foh-guest-registration",
  "guest-order-auth": "foh-guest-menu-body",
  "guest-order-throttle": "foh-guest-menu-body",
  "foh-guest-kitchen-send": "foh-guest-order-type",
  "foh-guest-scenario-dining": "foh-guest-order-type",
  "guest-channel-kitchen-send": "foh-guest-order-type",
  "guest-scenario-dining": "foh-guest-order-type",
  "guest-hotpot": "foh-guest-hotpot",
  "guest-duration-scenarios": "foh-guest-duration-scenarios",
  "tableside-service-call": "foh-tableside-service",
  "service-call-alerts": "foh-tableside-service",
  "guest-notes-fees": "foh-guest-order-notes",
  "wait-time": "foh-wait-time-display",
  "guest-menu-scenarios": "foh-guest-menu-body",
  "foh-tables": "foh-table-start-flow",
  "foh-cashier-start": "foh-pos-shell",
  "foh-order-buttons-core": "foh-pos-buttons",
  "foh-pos-order-extras": "foh-pos-order-toolbar",
  "foh-order-toolbar-extra": "foh-pos-order-toolbar",
  "foh-menu-find-pay": "foh-pos-menu-scope",
  "foh-guest-kitchen-dining": "foh-guest-order-type",
  "foh-tableside-experience": "foh-tableside-service",
  "foh-pos-notification-control": "foh-pos-order-alerts",
  "notification-basics": "foh-pos-order-alerts",
  "staff-order-alerts": "foh-pos-order-alerts",
  "order-pickup-messages": "foh-pos-order-alerts",
  "account-security-auth": "foh-pos-shell",
  "order-init-scenario": "foh-table-start-flow",
  "ui-operation-preferences": "foh-pos-shell",
  "role-employee-permissions": "foh-pos-shell",
  "split-merge-edit": "foh-pos-order-cart",
};

export const FOH_SETTINGS_GROUP_TITLES: Record<string, string> = {
  "foh-table-start-flow": "选桌与开台流程",
  "foh-table-clear-ops": "清桌与换服务员（企台）",
  "foh-pos-shell": "登录与终端主界面",
  "foh-pos-menu-scope": "POS 菜单与界面",
  "foh-pos-order-cart": "点单内容与客户信息",
  "foh-pos-combo-ordering": "套餐与自定义点单",
  "foh-pos-buttons": "点单页按钮显隐",
  "foh-pos-order-toolbar": "点单页工具栏",
  "foh-kitchen-send-timing": "送厨规则与权限",
  "foh-pos-find-order-list": "找单与结账入口",
  "foh-pos-order-alerts": "消息类型提醒",
  "foh-guest-order-type": "订单类型、取餐与送厨",
  "foh-guest-registration": "食客登记与会员",
  "foh-guest-pre-order": "点单前限制与授权",
  "foh-guest-menu-home": "点餐首页与入口",
  "foh-guest-menu-body": "菜单与购物车展示",
  "foh-guest-facing-locale": "食客端语言",
  "foh-guest-hotpot": "火锅点餐",
  "foh-guest-duration-scenarios": "计时与自助餐规则",
  "foh-tableside-service": "桌边呼叫",
  "foh-guest-order-notes": "点单备注",
  "foh-wait-time-display": "等待时长计算与展示",
};

/** 同一 foh 场景组在 catalog / 预设树中可能出现的全部 groupKey 别名 */
const legacyKeysByCanonical = (() => {
  const map = new Map<string, Set<string>>();
  const add = (canonical: string, alias: string) => {
    if (!map.has(canonical)) map.set(canonical, new Set());
    map.get(canonical)!.add(alias);
  };
  for (const [legacy, canonical] of Object.entries(FOH_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    add(canonical, legacy);
    add(canonical, canonical);
  }
  for (const entry of Object.values(FOH_LINE_SCOPE_BY_SEQ)) {
    add(entry.groupKey, entry.groupKey);
  }
  return map;
})();

export function normalizeFohCatalogGroupKey(groupKey: string): string {
  return FOH_SETTINGS_LEGACY_GROUP_REDIRECT[groupKey] ?? groupKey;
}

/** 将所有旧前厅分组书签归一化到当前存活分组。 */
export function normalizeLegacyFohSettingsPath(path: string): string {
  const [pathname, query = ""] = path.split("?", 2);
  const categoryPrefix = `${FOH_SETTINGS_CATALOG_PATH}/`;
  if (pathname.startsWith(categoryPrefix)) {
    const groupKey = pathname.slice(categoryPrefix.length).split("/", 1)[0];
    const normalized = normalizeFohCatalogGroupKey(groupKey);
    if (normalized !== groupKey) return `${categoryPrefix}${normalized}`;
  }
  if (pathname !== FOH_SETTINGS_CATALOG_PATH || !query) return path;

  const params = new URLSearchParams(query);
  const groupKey = params.get("group");
  if (!groupKey) return path;
  const normalized = normalizeFohCatalogGroupKey(groupKey);
  return normalized === groupKey ? path : `${categoryPrefix}${normalized}`;
}

export function resolveFohCatalogGroupKeyForSeq(seq: number, fallbackGroupKey: string): string {
  return FOH_LINE_SCOPE_BY_SEQ[seq]?.groupKey ?? normalizeFohCatalogGroupKey(fallbackGroupKey);
}

export function normalizeFohCatalogItemsForGrouping(
  items: ModuleSettingCatalogItem[],
): ModuleSettingCatalogItem[] {
  return items.map((item) => {
    const catalogKey = getFohCatalogGroupKeyBySeq(item.seq) ?? item.groupKey;
    const groupKey = resolveFohCatalogGroupKeyForSeq(item.seq, catalogKey);
    if (groupKey === item.groupKey && FOH_SETTINGS_GROUP_TITLES[groupKey] === item.groupTitle) {
      return item;
    }
    return {
      ...item,
      groupKey,
      groupTitle: FOH_SETTINGS_GROUP_TITLES[groupKey] ?? item.groupTitle,
    };
  });
}

/** 平台预设 L3/L4 查找：兼容 catalog 原文键、foh-* 场景键与旧键别名 */
export function fohPresetGroupKeyCandidates(
  item: Pick<ModuleSettingCatalogItem, "seq" | "groupKey">,
): string[] {
  const catalogKey = getFohCatalogGroupKeyBySeq(item.seq);
  const canonical = resolveFohCatalogGroupKeyForSeq(
    item.seq,
    catalogKey ?? item.groupKey,
  );
  const keys = new Set<string>([item.groupKey, canonical]);
  if (catalogKey) keys.add(catalogKey);
  for (const alias of legacyKeysByCanonical.get(canonical) ?? []) {
    keys.add(alias);
  }
  for (const [legacy, target] of Object.entries(FOH_SETTINGS_LEGACY_GROUP_REDIRECT)) {
    if (target === canonical) keys.add(legacy);
  }
  return [...keys];
}

export function fohPresetGroupKeyCandidatesForGroup(
  groupKey: string,
  items: readonly ModuleSettingCatalogItem[],
): string[] {
  const canonical = normalizeFohCatalogGroupKey(groupKey);
  const keys = new Set<string>([groupKey, canonical]);
  for (const alias of legacyKeysByCanonical.get(canonical) ?? []) {
    keys.add(alias);
  }
  for (const item of items) {
    if (resolveFohCatalogGroupKeyForSeq(item.seq, item.groupKey) !== canonical) continue;
    for (const k of fohPresetGroupKeyCandidates(item)) keys.add(k);
  }
  return [...keys];
}

/** L3 节点索引：某规范 groupKey 的全部别名（不含跨组 catalog 项） */
export function fohPresetAliasKeysForGroupKey(groupKey: string): string[] {
  const canonical = normalizeFohCatalogGroupKey(groupKey);
  const keys = new Set<string>([groupKey, canonical]);
  for (const alias of legacyKeysByCanonical.get(canonical) ?? []) {
    keys.add(alias);
  }
  return [...keys];
}
