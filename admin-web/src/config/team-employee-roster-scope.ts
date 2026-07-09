/**
 * 员工花名册门店 → 顶栏全局门店筛选选项（团队管理 / TipOut 员工列表）
 */
import type { ScopeOption } from "../auth/session-scope";

export const TEAM_EMPLOYEE_ROSTER_STORAGE_KEY = "tipout-employees-roster-v1";
export const ROSTER_STORE_SCOPE_PREFIX = "roster-store:";

/** 与 TipOut employees.js 默认花名册门店对齐（localStorage 为空时仍可供顶栏筛选） */
const DEMO_ROSTER_STORE_NAMES = [
  "Golden Dragon Chinese Kitchen - Dallas, TX 75231",
  "Sakura Sushi & Ramen House - Dallas, TX 75247",
  "Lone Star BBQ House - Austin, TX 78701",
  "Pacific Bowl & Grill - San Diego, CA 92101",
  "Nai Cha",
  "Downtown Branch",
  "Airport Kiosk",
] as const;

function normalizeRosterStoreLabel(value: string): string {
  return value.trim().toLowerCase();
}

export function rosterStoreScopeId(storeName: string): string {
  return `${ROSTER_STORE_SCOPE_PREFIX}${encodeURIComponent(storeName.trim())}`;
}

export function parseRosterStoreScopeId(storeId: string): string | null {
  if (!storeId.startsWith(ROSTER_STORE_SCOPE_PREFIX)) return null;
  try {
    return decodeURIComponent(storeId.slice(ROSTER_STORE_SCOPE_PREFIX.length));
  } catch {
    return null;
  }
}

export function isRosterStoreScopeId(storeId: string): boolean {
  return storeId.startsWith(ROSTER_STORE_SCOPE_PREFIX);
}

interface RosterEmployeeRow {
  store?: string;
}

export function readEmployeeRosterStoreNames(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (name: string): void => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = normalizeRosterStoreLabel(trimmed);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(trimmed);
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(TEAM_EMPLOYEE_ROSTER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          for (const row of parsed) {
            push(String((row as RosterEmployeeRow)?.store ?? ""));
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!out.length) {
    for (const name of DEMO_ROSTER_STORE_NAMES) push(name);
  }

  return out.sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function scopeOptionLabelsNormalized(opt: ScopeOption): string[] {
  return [opt.labelZh, opt.labelEn].map(normalizeRosterStoreLabel).filter(Boolean);
}

/** 将员工列表中的门店名追加到顶栏门店下拉（不与已有 M 平台门店重复） */
export function mergeEmployeeRosterStoresIntoScopeOptions(stores: ScopeOption[]): ScopeOption[] {
  const rosterStores = readEmployeeRosterStoreNames();
  if (!rosterStores.length) return stores;

  const existingLabels = new Set<string>();
  for (const opt of stores) {
    if (!opt.value) continue;
    for (const lab of scopeOptionLabelsNormalized(opt)) {
      existingLabels.add(lab);
    }
  }

  const extra: ScopeOption[] = [];
  for (const storeName of rosterStores) {
    const key = normalizeRosterStoreLabel(storeName);
    if (existingLabels.has(key)) continue;
    existingLabels.add(key);
    extra.push({
      value: rosterStoreScopeId(storeName),
      labelZh: storeName,
      labelEn: storeName,
    });
  }

  if (!extra.length) return stores.filter((o) => !!o.value);

  return [...stores.filter((o) => !!o.value), ...extra];
}
