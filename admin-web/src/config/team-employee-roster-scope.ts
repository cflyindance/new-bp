/**
 * 员工花名册门店 → 顶栏全局门店筛选选项（团队管理 / TipOut 员工列表）
 * 并为每个门店确保默认预设员工数量。
 */
import type { ScopeOption } from "../auth/session-scope";

export const TEAM_EMPLOYEE_ROSTER_STORAGE_KEY = "tipout-employees-roster-v1";
export const ROSTER_STORE_SCOPE_PREFIX = "roster-store:";
/** 每个门店默认预设员工数 */
export const PRESET_EMPLOYEES_PER_STORE = 5;

/** 与 TipOut employees.js 默认花名册门店对齐（localStorage 为空时仍可供顶栏筛选） */
const DEMO_ROSTER_STORE_NAMES = [
  "上海陆家嘴店",
  "广州天河店",
  "Lone Star BBQ House - Austin, TX 78701",
  "Pacific Bowl & Grill - San Diego, CA 92101",
  "Nai Cha",
  "Downtown Branch",
  "Airport Kiosk",
] as const;

/**
 * 英文 / 旧演示门店名 → 中文展示名。
 * 上海陆家嘴店、广州天河店只展示中文，不与英文别名并存于筛选项 / 列表。
 */
const ROSTER_STORE_DISPLAY_CANONICAL: Record<string, string> = {
  "golden dragon chinese kitchen - dallas, tx 75231": "上海陆家嘴店",
  "sakura sushi & ramen house - dallas, tx 75247": "广州天河店",
  张记火锅: "上海陆家嘴店",
};

function normalizeRosterStoreLabel(value: string): string {
  return value.trim().toLowerCase();
}

/** 统一门店展示名（英文别名归并为中文店名） */
export function canonicalRosterStoreDisplayName(storeName: string): string {
  const trimmed = String(storeName || "").trim();
  if (!trimmed) return "";
  return ROSTER_STORE_DISPLAY_CANONICAL[normalizeRosterStoreLabel(trimmed)] || trimmed;
}

/** 是否为已被中文店名替代、不应再单独出现的英文/旧别名 */
export function isSuppressedRosterStoreAlias(storeName: string): boolean {
  const trimmed = String(storeName || "").trim();
  if (!trimmed) return false;
  const canonical = canonicalRosterStoreDisplayName(trimmed);
  return canonical !== trimmed;
}

type PresetEmployeeTemplate = {
  name: string;
  role: string;
  tipType: "deduct" | "receive";
  baseTip: number;
  tipRate: number;
  department: string;
  rate: number;
  otRate: number;
  ot2Rate: number;
};

/** 每店追加的 5 名预设岗位模板（稳定 id，可重复执行） */
const PRESET_EMPLOYEE_TEMPLATES: readonly PresetEmployeeTemplate[] = [
  {
    name: "王店长",
    role: "Manager",
    tipType: "deduct",
    baseTip: 0,
    tipRate: 0.15,
    department: "Management",
    rate: 22,
    otRate: 33,
    ot2Rate: 44,
  },
  {
    name: "李服务员",
    role: "Server",
    tipType: "deduct",
    baseTip: 0,
    tipRate: 0.15,
    department: "Floor",
    rate: 15,
    otRate: 22.5,
    ot2Rate: 30,
  },
  {
    name: "张收银",
    role: "Cashier",
    tipType: "deduct",
    baseTip: 0,
    tipRate: 0.15,
    department: "Front",
    rate: 15,
    otRate: 22.5,
    ot2Rate: 30,
  },
  {
    name: "刘厨师",
    role: "Kitchen",
    tipType: "receive",
    baseTip: 0,
    tipRate: 0,
    department: "Kitchen",
    rate: 18,
    otRate: 27,
    ot2Rate: 36,
  },
  {
    name: "陈调酒",
    role: "Bartender",
    tipType: "deduct",
    baseTip: 0,
    tipRate: 0.15,
    department: "Bar",
    rate: 18.5,
    otRate: 27.75,
    ot2Rate: 37,
  },
];

interface RosterEmployeeRow {
  id?: string;
  name?: string;
  store?: string;
  role?: string;
  tipType?: string;
  baseTip?: number;
  tipRate?: number;
  department?: string;
  adpFile?: string;
  rate?: number;
  otRate?: number;
  ot2Rate?: number;
  [key: string]: unknown;
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

function storeSlugForPresetId(storeName: string): string {
  const raw = storeName.trim();
  try {
    return btoa(unescape(encodeURIComponent(raw)))
      .replace(/[+/=]/g, "")
      .slice(0, 24);
  } catch {
    return encodeURIComponent(raw).replace(/%/g, "").slice(0, 40);
  }
}

function presetEmployeeId(storeName: string, index: number): string {
  return `roster-preset-${storeSlugForPresetId(storeName)}-${index}`;
}

function readRosterRows(): RosterEmployeeRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEAM_EMPLOYEE_ROSTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as RosterEmployeeRow[]) : [];
  } catch {
    return [];
  }
}

function writeRosterRows(rows: RosterEmployeeRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEAM_EMPLOYEE_ROSTER_STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("tipout-roster-updated"));
  } catch {
    /* ignore */
  }
}

function employeeMatchesStore(emp: RosterEmployeeRow, storeName: string): boolean {
  const empStore = normalizeRosterStoreLabel(canonicalRosterStoreDisplayName(String(emp.store || "")));
  const target = normalizeRosterStoreLabel(canonicalRosterStoreDisplayName(storeName));
  if (!empStore || !target) return false;
  return empStore === target || empStore.includes(target) || target.includes(empStore);
}

function uniqueStoreNames(names: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const canonical = canonicalRosterStoreDisplayName(String(name || ""));
    if (!canonical) continue;
    const key = normalizeRosterStoreLabel(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canonical);
  }
  return out;
}

/**
 * 解析门店展示名：优先 labelZh；roster-store: 前缀则解码。
 */
export function resolveStoreDisplayName(opt: ScopeOption): string {
  const fromRoster = parseRosterStoreScopeId(opt.value);
  if (fromRoster) return canonicalRosterStoreDisplayName(fromRoster);
  return canonicalRosterStoreDisplayName(opt.labelZh || opt.labelEn || opt.value || "");
}

/**
 * 为每个门店确保至少 {@link PRESET_EMPLOYEES_PER_STORE} 名员工；不足则追加稳定 id 的预设员工。
 * @returns 本次新追加的员工数量
 */
export function ensurePresetEmployeesPerStore(storeNames: string[]): number {
  if (typeof window === "undefined") return 0;
  const stores = uniqueStoreNames(storeNames);
  if (!stores.length) return 0;

  const list = readRosterRows();
  const idSet = new Set(list.map((e) => String(e.id || "")));
  let added = 0;

  for (const store of stores) {
    const countForStore = (): number => list.filter((e) => employeeMatchesStore(e, store)).length;
    if (countForStore() >= PRESET_EMPLOYEES_PER_STORE) continue;

    for (let i = 1; i <= PRESET_EMPLOYEES_PER_STORE; i++) {
      if (countForStore() >= PRESET_EMPLOYEES_PER_STORE) break;
      const id = presetEmployeeId(store, i);
      if (idSet.has(id)) continue;
      const tpl = PRESET_EMPLOYEE_TEMPLATES[i - 1]!;
      list.push({
        id,
        name: tpl.name,
        store,
        role: tpl.role,
        tipType: tpl.tipType,
        baseTip: tpl.baseTip,
        tipRate: tpl.tipRate,
        department: tpl.department,
        adpFile: String(800 + i),
        rate: tpl.rate,
        otRate: tpl.otRate,
        ot2Rate: tpl.ot2Rate,
        requireClockIn: true,
        requireBatchClose: false,
        requireCashTipReport: false,
      });
      idSet.add(id);
      added += 1;
    }
  }

  if (added > 0) writeRosterRows(list);
  return added;
}

/**
 * 基于当前 scope 门店选项 + 花名册已有门店 + 演示门店，补齐每店 5 名预设员工。
 */
export function ensurePresetEmployeesForScopeStores(scopeStores: ScopeOption[]): number {
  const names = uniqueStoreNames([
    ...scopeStores.map(resolveStoreDisplayName),
    ...readEmployeeRosterStoreNames(),
    ...DEMO_ROSTER_STORE_NAMES,
  ]);
  return ensurePresetEmployeesPerStore(names);
}

export function readEmployeeRosterStoreNames(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (name: string): void => {
    const canonical = canonicalRosterStoreDisplayName(name);
    if (!canonical) return;
    const key = normalizeRosterStoreLabel(canonical);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(canonical);
  };

  for (const row of readRosterRows()) {
    push(String(row.store ?? ""));
  }

  if (!out.length) {
    for (const name of DEMO_ROSTER_STORE_NAMES) push(name);
  }

  return out.sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function scopeOptionLabelsNormalized(opt: ScopeOption): string[] {
  const labels = [opt.labelZh, opt.labelEn, canonicalRosterStoreDisplayName(opt.labelZh || "")];
  return labels.map(normalizeRosterStoreLabel).filter(Boolean);
}

/** 将员工列表中的门店名追加到顶栏门店下拉（不与已有 M 平台门店重复；抑制中英文别名并存） */
export function mergeEmployeeRosterStoresIntoScopeOptions(stores: ScopeOption[]): ScopeOption[] {
  const rosterStores = readEmployeeRosterStoreNames();
  if (!rosterStores.length) return stores;

  const existingLabels = new Set<string>();
  for (const opt of stores) {
    if (!opt.value) continue;
    for (const lab of scopeOptionLabelsNormalized(opt)) {
      existingLabels.add(lab);
    }
    // 已有中文店时，将其英文别名也视为已覆盖
    const canonical = canonicalRosterStoreDisplayName(opt.labelZh || opt.labelEn || "");
    if (canonical) existingLabels.add(normalizeRosterStoreLabel(canonical));
  }

  const extra: ScopeOption[] = [];
  for (const storeName of rosterStores) {
    const canonical = canonicalRosterStoreDisplayName(storeName);
    if (!canonical) continue;
    // 英文别名本身不进筛选项
    if (isSuppressedRosterStoreAlias(storeName)) continue;
    const key = normalizeRosterStoreLabel(canonical);
    if (existingLabels.has(key)) continue;
    existingLabels.add(key);
    extra.push({
      value: rosterStoreScopeId(canonical),
      labelZh: canonical,
      labelEn: canonical,
    });
  }

  if (!extra.length) return stores.filter((o) => !!o.value);

  return [...stores.filter((o) => !!o.value), ...extra];
}
