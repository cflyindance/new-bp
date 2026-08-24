/**
 * P0 同源配置桥接：从 admin-web localStorage 读取当前门店的餐位绑定与计价规则。
 * P1 接入正式配置 API 后，可在此处替换数据来源并保留 enrich* 调用契约。
 */

export const DURATION_BILLING_RULES_STORAGE_KEY_PREFIX =
  'bplant-duration-billing-rules:v1'
export const FLOOR_PLAN_STORAGE_KEY_PREFIX = 'bplant-floor-plan:v1'
export const SCOPE_FILTER_META_STORAGE_KEY = 'menusifu-scope-filter-meta'
export const DEFAULT_DURATION_BILLING_STORE_BUCKET = '__default__'

function readJson(storage, key) {
  try {
    const raw = storage?.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function resolveDurationBillingBridgeStoreId(storage = localStorage) {
  const meta = readJson(storage, SCOPE_FILTER_META_STORAGE_KEY)
  const storeId = typeof meta?.storeId === 'string' ? meta.storeId.trim() : ''
  return storeId || DEFAULT_DURATION_BILLING_STORE_BUCKET
}

export function durationBillingRulesStorageKey(storeId) {
  return `${DURATION_BILLING_RULES_STORAGE_KEY_PREFIX}:store:${encodeURIComponent(storeId)}`
}

export function floorPlanStorageKey(storeId) {
  return `${FLOOR_PLAN_STORAGE_KEY_PREFIX}:store:${encodeURIComponent(storeId)}`
}

export function readDurationBillingBridgeSnapshot(storage = localStorage) {
  const storeId = resolveDurationBillingBridgeStoreId(storage)
  const rulesPayload = readJson(storage, durationBillingRulesStorageKey(storeId))
  const floorPlan = readJson(storage, floorPlanStorageKey(storeId))
  const rules = Array.isArray(rulesPayload?.rules) ? rulesPayload.rules : []
  const areas = Array.isArray(floorPlan?.areas) ? floorPlan.areas : []
  return { storeId, rules, areas }
}

function findFloorPlanTable(snapshot, areaId, tableId) {
  const targetAreaId = areaId == null ? null : String(areaId)
  const targetTableId = String(tableId)
  const areas = targetAreaId == null
    ? snapshot.areas
    : snapshot.areas.filter((area) => String(area?.id) === targetAreaId)
  for (const area of areas) {
    const table = area?.tables?.find((item) => String(item?.id) === targetTableId)
    if (table) return table
  }
  return null
}

function findEnabledRule(snapshot, ruleId) {
  if (!ruleId) return null
  return (
    snapshot.rules.find(
      (rule) =>
        String(rule?.id) === String(ruleId) &&
        rule?.enabled !== false &&
        rule?.productBinding?.productId &&
        rule?.productBinding?.requiredTag === 'KTV'
    ) || null
  )
}

function findUniqueEnabledRuleByProduct(snapshot, productId) {
  if (!productId) return null
  const matches = snapshot.rules.filter(
    (rule) =>
      rule?.enabled !== false &&
      String(rule?.productBinding?.productId) === String(productId) &&
      rule?.productBinding?.requiredTag === 'KTV'
  )
  return matches.length === 1 ? matches[0] : null
}

export function enrichTableWithDurationBilling(
  table,
  { areaId = null, snapshot = readDurationBillingBridgeSnapshot() } = {}
) {
  if (!table || table.id == null) return table
  const binding = findFloorPlanTable(snapshot, areaId, table.id)
  const defaultSaleItemId = binding?.defaultSaleItemId ?? table.defaultSaleItemId
  const explicitRuleId = binding?.durationBillingRuleId
  const durationBillingRule = explicitRuleId
    ? findEnabledRule(snapshot, explicitRuleId)
    : findUniqueEnabledRuleByProduct(snapshot, defaultSaleItemId)
  const durationBillingRuleId = explicitRuleId
    ? String(explicitRuleId)
    : durationBillingRule?.id == null
      ? null
      : String(durationBillingRule.id)
  return {
    ...table,
    category: binding?.category ?? table.category,
    defaultSaleItemId,
    ...(durationBillingRuleId ? { durationBillingRuleId } : {}),
    ...(explicitRuleId || durationBillingRule
      ? {
          durationBillingRule: durationBillingRule
            ? JSON.parse(JSON.stringify(durationBillingRule))
            : null,
        }
      : {}),
  }
}

export function enrichAreasWithDurationBilling(
  areas,
  storage = localStorage
) {
  if (!Array.isArray(areas)) return areas
  const snapshot = readDurationBillingBridgeSnapshot(storage)
  return areas.map((area) => ({
    ...area,
    tables: Array.isArray(area?.tables)
      ? area.tables.map((table) =>
          enrichTableWithDurationBilling(table, { areaId: area.id, snapshot })
        )
      : area?.tables,
  }))
}

export function enrichTableResponseWithDurationBilling(
  response,
  storage = localStorage,
  areaId = null
) {
  if (!response?.table) return response
  const snapshot = readDurationBillingBridgeSnapshot(storage)
  return {
    ...response,
    table: enrichTableWithDurationBilling(response.table, { areaId, snapshot }),
  }
}
