/**
 * 功能注册表 · 标准 / 定制化功能标记
 */
export type FeatureScope = "standard" | "custom";

export type FeatureProductLine = "pos" | "kiosk" | "emenu";

export interface FeatureRegistryEntry {
  /** 全局唯一，如 tipout.personal_sales_pool */
  featureKey: string;
  scope: FeatureScope;
  displayName: string;
  description?: string;
  /** 关联导航节点：L1 moduleId、L2 moduleId:featureId、L3/L4 预设键、或 seq:9001 */
  navNodeKeys: string[];
  minPosPatchVersion?: string;
  productLines: FeatureProductLine[];
  configDomain?: string;
  customerLabel?: string;
  registeredAt: string;
}

/** 演示期定制化功能注册（P0） */
const CUSTOM_FEATURE_REGISTRY: FeatureRegistryEntry[] = [
  {
    featureKey: "tipout.personal_sales_pool",
    scope: "custom",
    displayName: "小费池 · 按个人销售额贡献",
    description: "不同角色按本人销售额 × 占比贡献小费池（TipOut 定制补丁）",
    navNodeKeys: ["team:team-tips"],
    minPosPatchVersion: "tipout-personal-sales-v2.1",
    productLines: ["pos"],
    configDomain: "team.tipout",
    customerLabel: "TipOut 定制",
    registeredAt: "2026-07-16T00:00:00.000Z",
  },
  {
    featureKey: "tipout.personal_sales_pct_deduction",
    scope: "custom",
    displayName: "小费扣除 · 按个人销售额占比",
    description: "按员工个人销售额占比从小费中扣除（TipOut 定制补丁）",
    navNodeKeys: ["team:team-tax-payroll"],
    minPosPatchVersion: "tipout-personal-sales-v2.1",
    productLines: ["pos"],
    configDomain: "team.tipout",
    customerLabel: "TipOut 定制",
    registeredAt: "2026-07-16T00:00:00.000Z",
  },
];

const registryByKey = new Map(CUSTOM_FEATURE_REGISTRY.map((e) => [e.featureKey, e]));

export function listFeatureRegistryEntries(): FeatureRegistryEntry[] {
  return [...CUSTOM_FEATURE_REGISTRY];
}

export function listCustomFeatureRegistryEntries(): FeatureRegistryEntry[] {
  return CUSTOM_FEATURE_REGISTRY.filter((e) => e.scope === "custom");
}

export function getFeatureRegistryEntry(featureKey: string): FeatureRegistryEntry | undefined {
  return registryByKey.get(featureKey);
}

export function isCustomScopedFeature(featureKey: string): boolean {
  return getFeatureRegistryEntry(featureKey)?.scope === "custom";
}

export function findCustomFeaturesByNavNodeKey(navNodeKey: string): FeatureRegistryEntry[] {
  return CUSTOM_FEATURE_REGISTRY.filter((e) => e.navNodeKeys.includes(navNodeKey));
}

export function buildNavNodeKey(parts: {
  moduleId?: string;
  featureId?: string;
  groupKey?: string;
  seq?: number;
}): string {
  const { moduleId, featureId, groupKey, seq } = parts;
  if (moduleId && featureId && groupKey && seq != null) {
    return `${moduleId}:${featureId}:${groupKey}:s${seq}`;
  }
  if (moduleId && featureId && groupKey) return `${moduleId}:${featureId}:${groupKey}`;
  if (moduleId && featureId) return `${moduleId}:${featureId}`;
  if (seq != null) return `seq:${seq}`;
  return moduleId ?? "";
}

export function resolveNavNodeKeysForContext(parts: {
  moduleId: string;
  featureId?: string;
  groupKey?: string;
  seq?: number;
}): string[] {
  const keys = new Set<string>();
  const { moduleId, featureId, groupKey, seq } = parts;
  keys.add(moduleId);
  if (featureId) keys.add(`${moduleId}:${featureId}`);
  if (featureId && groupKey) keys.add(`${moduleId}:${featureId}:${groupKey}`);
  if (featureId && groupKey && seq != null) keys.add(`${moduleId}:${featureId}:${groupKey}:s${seq}`);
  if (seq != null) {
    keys.add(`seq:${seq}`);
    keys.add(`s${seq}`);
  }
  return [...keys];
}

export function findCustomFeaturesForNavContext(parts: {
  moduleId: string;
  featureId?: string;
  groupKey?: string;
  seq?: number;
}): FeatureRegistryEntry[] {
  const keys = resolveNavNodeKeysForContext(parts);
  const matched = new Set<FeatureRegistryEntry>();
  for (const key of keys) {
    for (const entry of findCustomFeaturesByNavNodeKey(key)) {
      matched.add(entry);
    }
  }
  return [...matched];
}
