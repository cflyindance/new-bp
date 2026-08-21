/**
 * 按时计价规则库（按门店 localStorage 隔离）
 * 支持按时长单价与连续区间固定价；保留旧时钟时段结构兼容读取。
 * P0 配置桥接：eMenu 同源预览从 `menusifu-scope-filter-meta` 解析当前门店，
 * 读取本文件规则键及 `bplant-floor-plan:v1` 桌位绑定；P1 替换为正式配置 API。
 */
import { readScopeFilters } from "../auth/session-scope";

export const DURATION_BILLING_RULES_STORAGE_KEY_PREFIX = "bplant-duration-billing-rules:v1";

/** 餐位平面图存储前缀（countTableBindings 扫描绑定桌位） */
const FLOOR_PLAN_STORAGE_KEY_PREFIX = "bplant-floor-plan:v1";

export const DEFAULT_DURATION_BILLING_STORE_BUCKET = "__default__";

export const DURATION_BILLING_SCENES = ["ktv", "vip-room"] as const;
export type DurationBillingScene = (typeof DURATION_BILLING_SCENES)[number];

export const DURATION_BILLING_LINES = ["emenu"] as const;
export type DurationBillingLine = (typeof DURATION_BILLING_LINES)[number];

export type DurationBillingUnitPricing = {
  type: "unit";
  amount: number;
  unitMinutes: number;
  roundUp: boolean;
};

export type DurationBillingTier = {
  start: string;
  end: string;
  amount: number;
  unitMinutes: number;
  roundUp?: boolean;
};

export type DurationBillingTieredPricing = {
  type: "tiered";
  tiers: DurationBillingTier[];
};

export type DurationBillingInterval = {
  /** null 仅允许用于最后一档，表示该起点分钟及以上。 */
  endMinutes: number | null;
  amount: number;
};

export type DurationBillingIntervalPricing = {
  type: "interval";
  intervals: DurationBillingInterval[];
};

export type DurationBillingPricingMode =
  | DurationBillingUnitPricing
  | DurationBillingIntervalPricing
  | DurationBillingTieredPricing;

export type DurationBillingRule = {
  id: string;
  name: string;
  scenes: DurationBillingScene[];
  enabled: boolean;
  remark?: string;
  pricing: DurationBillingPricingMode;
  storeIds: string[];
  lines: DurationBillingLine[];
  createdAt: string;
  updatedAt: string;
};

export type DurationBillingRuleInput = {
  id?: string;
  name: string;
  /** 兼容旧版 KTV / VIP 包间规则；新规则无需指定场景。 */
  scenes?: DurationBillingScene[];
  enabled: boolean;
  remark?: string;
  pricing: DurationBillingPricingMode;
  storeIds?: string[];
  lines?: DurationBillingLine[];
};

export type DurationBillingValidationResult =
  | { ok: true; value: DurationBillingRuleInput }
  | { ok: false; message: string };

const MIN_UNIT_MINUTES = 1;
const MAX_UNIT_MINUTES = 1440;
const MAX_NAME_LENGTH = 32;

type RulesFilePayload = {
  rules: DurationBillingRule[];
};

function newRuleId(): string {
  return `dbr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isDurationBillingScene(value: unknown): value is DurationBillingScene {
  return value === "ktv" || value === "vip-room";
}

function isDurationBillingLine(value: unknown): value is DurationBillingLine {
  return value === "emenu";
}

/** 当前页内/顶栏所选门店；无选择时落入默认桶 */
export function resolveDurationBillingStoreId(): string {
  const storeId = readScopeFilters().store?.trim() || "";
  return storeId || DEFAULT_DURATION_BILLING_STORE_BUCKET;
}

export function storageKeyForStore(storeId: string): string {
  return `${DURATION_BILLING_RULES_STORAGE_KEY_PREFIX}:store:${encodeURIComponent(storeId)}`;
}

function floorPlanStorageKeyForStore(storeId: string): string {
  return `${FLOOR_PLAN_STORAGE_KEY_PREFIX}:store:${encodeURIComponent(storeId)}`;
}

function readRulesPayload(storeId: string): RulesFilePayload {
  if (typeof window === "undefined") return { rules: [] };
  try {
    const raw = localStorage.getItem(storageKeyForStore(storeId));
    if (!raw) return { rules: [] };
    const parsed = JSON.parse(raw) as RulesFilePayload;
    if (!Array.isArray(parsed?.rules)) return { rules: [] };
    return {
      rules: parsed.rules
        .map(normalizeStoredDurationBillingRule)
        .filter((rule): rule is DurationBillingRule => rule !== null),
    };
  } catch {
    return { rules: [] };
  }
}

function writeRulesPayload(storeId: string, payload: RulesFilePayload): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKeyForStore(storeId), JSON.stringify(payload));
}

function normalizeStoredDurationBillingRule(value: unknown): DurationBillingRule | null {
  if (!value || typeof value !== "object") return null;
  const r = value as DurationBillingRule & { scenes?: unknown };
  if (typeof r.id !== "string" || typeof r.name !== "string") return null;
  const scenes = normalizeScenes(r.scenes);
  if (scenes === null) return null;
  if (typeof r.enabled !== "boolean") return null;
  if (!r.pricing || typeof r.pricing !== "object") return null;
  if (r.pricing.type === "unit") {
    if (!(
      typeof r.pricing.amount === "number" &&
      typeof r.pricing.unitMinutes === "number" &&
      typeof r.pricing.roundUp === "boolean"
    )) return null;
    return { ...r, scenes };
  }
  if (r.pricing.type === "tiered") {
    return Array.isArray(r.pricing.tiers) ? { ...r, scenes } : null;
  }
  if (r.pricing.type === "interval") {
    const pricing = normalizeIntervalPricing(r.pricing);
    return pricing ? { ...r, scenes, pricing } : null;
  }
  return null;
}

function normalizeUnitMinutes(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < MIN_UNIT_MINUTES || n > MAX_UNIT_MINUTES) return null;
  return n;
}

function normalizeAmount(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (
    !Number.isFinite(n) ||
    n <= 0 ||
    Math.abs(n * 100 - Math.round(n * 100)) > Number.EPSILON * 100
  ) return null;
  return n;
}

function normalizeIntervalPricing(pricing: unknown): DurationBillingIntervalPricing | null {
  if (!pricing || typeof pricing !== "object") return null;
  const intervals = (pricing as { intervals?: unknown }).intervals;
  if (!Array.isArray(intervals) || intervals.length < 2) return null;

  const normalized: DurationBillingInterval[] = [];
  let previousEnd = 0;
  for (let index = 0; index < intervals.length; index += 1) {
    const raw = intervals[index];
    if (!raw || typeof raw !== "object") return null;
    const item = raw as { endMinutes?: unknown; amount?: unknown };
    const amount = normalizeAmount(item.amount);
    if (amount === null) return null;
    const isLast = index === intervals.length - 1;

    if (item.endMinutes === null) {
      if (!isLast) return null;
      normalized.push({ endMinutes: null, amount });
      continue;
    }

    const endMinutes = typeof item.endMinutes === "number"
      ? item.endMinutes
      : Number(item.endMinutes);
    if (
      !Number.isFinite(endMinutes) ||
      !Number.isInteger(endMinutes) ||
      endMinutes <= previousEnd ||
      isLast
    ) return null;
    normalized.push({ endMinutes, amount });
    previousEnd = endMinutes;
  }

  if (normalized.at(-1)?.endMinutes !== null) return null;
  return { type: "interval", intervals: normalized };
}

function normalizeName(value: unknown): string | null {
  const name = String(value ?? "").trim();
  if (!name || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

function normalizeScenes(scenes: unknown): DurationBillingScene[] | null {
  if (scenes === undefined) return [];
  if (!Array.isArray(scenes)) return null;
  const out: DurationBillingScene[] = [];
  for (const s of scenes) {
    if (!isDurationBillingScene(s)) return null;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

function normalizePricing(
  pricing: unknown,
  options: { allowTiered: boolean },
): DurationBillingPricingMode | null {
  if (!pricing || typeof pricing !== "object") return null;
  const p = pricing as DurationBillingPricingMode;
  if (p.type === "unit") {
    const amount = normalizeAmount(p.amount);
    const unitMinutes = normalizeUnitMinutes(p.unitMinutes);
    if (amount === null || unitMinutes === null) return null;
    return {
      type: "unit",
      amount,
      unitMinutes,
      roundUp: p.roundUp !== false,
    };
  }
  if (p.type === "interval") return normalizeIntervalPricing(p);
  if (p.type === "tiered") {
    if (!options.allowTiered) return null;
    if (!Array.isArray(p.tiers) || p.tiers.length === 0) return null;
    return p;
  }
  return null;
}

export function validateDurationBillingRule(
  draft: DurationBillingRuleInput,
  options: { allowTiered?: boolean } = {},
): DurationBillingValidationResult {
  const allowTiered = options.allowTiered === true;

  const name = normalizeName(draft.name);
  if (!name) {
    return { ok: false, message: "请填写规则名称（1–32 字）" };
  }

  const scenes = normalizeScenes(draft.scenes);
  if (scenes === null) return { ok: false, message: "计价规则场景数据无效" };

  const pricing = normalizePricing(draft.pricing, { allowTiered });
  if (!pricing) {
    if (draft.pricing?.type === "tiered" && !allowTiered) {
      return { ok: false, message: "当前版本仅支持按时长单价模式" };
    }
    if (draft.pricing?.type === "interval") {
      const intervals = draft.pricing.intervals;
      if (!Array.isArray(intervals) || intervals.length < 2) {
        return { ok: false, message: "请至少设置一个时间区间和一个以上区间" };
      }
      const invalidAmount = intervals.some((item) => normalizeAmount(item?.amount) === null);
      if (invalidAmount) {
        return { ok: false, message: "请填写大于 0 且最多两位小数的区间价格" };
      }
      return { ok: false, message: "区间结束时间必须按分钟递增" };
    }
    return { ok: false, message: "请填写有效的计价配置（金额与单位时长）" };
  }

  const storeIds =
    Array.isArray(draft.storeIds) && draft.storeIds.length > 0
      ? draft.storeIds.map((s) => String(s).trim()).filter(Boolean)
      : [];

  const lines =
    Array.isArray(draft.lines) && draft.lines.length > 0
      ? draft.lines.filter(isDurationBillingLine)
      : (["emenu"] as DurationBillingLine[]);

  if (lines.length === 0) {
    return { ok: false, message: "请至少选择一个适用产线" };
  }

  return {
    ok: true,
    value: {
      ...draft,
      name,
      scenes,
      enabled: draft.enabled !== false,
      remark: draft.remark?.trim() || undefined,
      pricing,
      storeIds,
      lines,
    },
  };
}

export function formatRulePricingSummary(rule: DurationBillingRule): string {
  const { pricing } = rule;
  if (pricing.type === "unit") {
    return `¥${pricing.amount}/${pricing.unitMinutes}min`;
  }
  if (pricing.type === "tiered" && pricing.tiers.length > 0) {
    return pricing.tiers
      .slice(0, 2)
      .map((t) => `${t.start}–${t.end} ¥${t.amount}/${t.unitMinutes}min`)
      .join(" · ");
  }
  if (pricing.type === "interval") {
    let startMinutes = 1;
    const labels = pricing.intervals.map((interval) => {
      const range = interval.endMinutes === null
        ? `${startMinutes}min以上`
        : `${startMinutes}–${interval.endMinutes}min`;
      if (interval.endMinutes !== null) startMinutes = interval.endMinutes + 1;
      return `${range} ¥${interval.amount}`;
    });
    const visible = labels.slice(0, 3).join(" · ");
    return labels.length > 3 ? `${visible} · 共 ${labels.length} 档` : visible;
  }
  return "—";
}

export function resolveDurationBillingIntervalAmount(
  pricing: DurationBillingIntervalPricing,
  durationMinutes: number,
): number | null {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  const minutes = Math.ceil(durationMinutes);
  for (const interval of pricing.intervals) {
    if (interval.endMinutes === null || minutes <= interval.endMinutes) {
      return interval.amount;
    }
  }
  return null;
}

export function formatDurationBillingSceneLabels(scenes: DurationBillingScene[]): string {
  const map: Record<DurationBillingScene, string> = {
    ktv: "KTV",
    "vip-room": "VIP包间",
  };
  return scenes.map((s) => map[s]).join("、");
}

export function listDurationBillingRules(storeId?: string): DurationBillingRule[] {
  const id = storeId ?? resolveDurationBillingStoreId();
  return readRulesPayload(id).rules;
}

export function getDurationBillingRule(
  storeId: string,
  ruleId: string,
): DurationBillingRule | null {
  return readRulesPayload(storeId).rules.find((r) => r.id === ruleId) ?? null;
}

export function listEnabledDurationBillingRules(storeId?: string): DurationBillingRule[] {
  return listDurationBillingRules(storeId).filter((r) => r.enabled);
}

export function upsertDurationBillingRule(
  storeId: string,
  draft: DurationBillingRuleInput,
): { ok: true; rule: DurationBillingRule } | { ok: false; message: string } {
  const validated = validateDurationBillingRule(draft);
  if (!validated.ok) return validated;

  const payload = readRulesPayload(storeId);
  const now = new Date().toISOString();
  const normalized = validated.value;
  const existingIndex = normalized.id
    ? payload.rules.findIndex((r) => r.id === normalized.id)
    : -1;

  const storeIds =
    normalized.storeIds && normalized.storeIds.length > 0
      ? normalized.storeIds
      : [storeId];
  const lines =
    normalized.lines && normalized.lines.length > 0
      ? normalized.lines
      : (["emenu"] as DurationBillingLine[]);

  if (existingIndex >= 0) {
    const prev = payload.rules[existingIndex];
    const updated: DurationBillingRule = {
      ...prev,
      name: normalized.name,
      scenes: normalized.scenes ?? [],
      enabled: normalized.enabled,
      remark: normalized.remark,
      pricing: normalized.pricing,
      storeIds,
      lines,
      updatedAt: now,
    };
    payload.rules[existingIndex] = updated;
    writeRulesPayload(storeId, payload);
    return { ok: true, rule: updated };
  }

  const created: DurationBillingRule = {
    id: normalized.id ?? newRuleId(),
    name: normalized.name,
    scenes: normalized.scenes ?? [],
    enabled: normalized.enabled,
    remark: normalized.remark,
    pricing: normalized.pricing,
    storeIds,
    lines,
    createdAt: now,
    updatedAt: now,
  };
  payload.rules.push(created);
  writeRulesPayload(storeId, payload);
  return { ok: true, rule: created };
}

export function deleteDurationBillingRule(
  storeId: string,
  ruleId: string,
): { ok: true } | { ok: false; message: string } {
  const payload = readRulesPayload(storeId);
  const index = payload.rules.findIndex((r) => r.id === ruleId);
  if (index < 0) {
    return { ok: false, message: "规则不存在或已删除" };
  }
  payload.rules.splice(index, 1);
  writeRulesPayload(storeId, payload);
  return { ok: true };
}

export function setDurationBillingRuleEnabled(
  storeId: string,
  ruleId: string,
  enabled: boolean,
): { ok: true; rule: DurationBillingRule } | { ok: false; message: string } {
  const payload = readRulesPayload(storeId);
  const rule = payload.rules.find((r) => r.id === ruleId);
  if (!rule) {
    return { ok: false, message: "规则不存在或已删除" };
  }
  rule.enabled = enabled;
  rule.updatedAt = new Date().toISOString();
  writeRulesPayload(storeId, payload);
  return { ok: true, rule };
}

/** 扫描餐位平面图中绑定该规则的桌位数量（Task 4 写入 durationBillingRuleId 后生效） */
export function countTableBindings(storeId: string, ruleId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(floorPlanStorageKeyForStore(storeId));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { areas?: Array<{ tables?: Array<{ durationBillingRuleId?: string | null }> }> };
    if (!Array.isArray(parsed?.areas)) return 0;
    let count = 0;
    for (const area of parsed.areas) {
      if (!Array.isArray(area.tables)) continue;
      for (const table of area.tables) {
        if (table.durationBillingRuleId === ruleId) count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/** 创建规则快照（开单计时写入订单/session） */
export function cloneDurationBillingRuleSnapshot(
  rule: DurationBillingRule,
): DurationBillingRule {
  return JSON.parse(JSON.stringify(rule)) as DurationBillingRule;
}
