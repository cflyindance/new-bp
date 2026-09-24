import type { DemoScenario, LocalBusinessDate } from "./demo-scenario-types";

export const DEMO_SCENARIO_STORAGE_KEY = "menusifu:demo-scenario:v1";
export const DEMO_SCENARIO_OVERRIDES_KEY = "menusifu:demo-scenario-overrides:v1";
export const LEGACY_BUSINESS_DEMO_STORAGE_KEYS = ["tipout-payroll-state-v4", "menusifu:enterprise-hardware-demo-v3"] as const;

// A full/blocked browser store must not prevent the application from starting.
// Keep only failed demo writes in this session; never evict unrelated user data.
const sessionFallback = new WeakMap<Storage, Map<string, string>>();
function readDemoValue(storage: Storage, key: string): string | null {
  return sessionFallback.get(storage)?.get(key) ?? storage.getItem(key);
}
function writeDemoValue(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
    sessionFallback.get(storage)?.delete(key);
  } catch {
    let values = sessionFallback.get(storage);
    if (!values) { values = new Map(); sessionFallback.set(storage, values); }
    values.set(key, value);
    console.warn('Demo data is stored in memory for this session because browser storage is unavailable.');
  }
}

export interface DemoRuntimeOverride {
  overrideId: string;
  kind: string;
  entityId: string;
  businessDate?: LocalBusinessDate;
  patch: Record<string, unknown>;
}

export function readStoredScenario(storage: Storage): DemoScenario | null {
  try { const raw = readDemoValue(storage, DEMO_SCENARIO_STORAGE_KEY); return raw ? JSON.parse(raw) as DemoScenario : null; } catch { return null; }
}

export function writeStoredScenario(storage: Storage, scenario: DemoScenario): void {
  writeDemoValue(storage, DEMO_SCENARIO_STORAGE_KEY, JSON.stringify(scenario));
}

export function readRuntimeOverrides(storage: Storage): DemoRuntimeOverride[] {
  try { const raw = readDemoValue(storage, DEMO_SCENARIO_OVERRIDES_KEY); return raw ? JSON.parse(raw) as DemoRuntimeOverride[] : []; } catch { return []; }
}

export function writeRuntimeOverrides(storage: Storage, overrides: DemoRuntimeOverride[]): void {
  writeDemoValue(storage, DEMO_SCENARIO_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function clearRegisteredBusinessDemoData(storage: Storage): void {
  sessionFallback.delete(storage);
  for (const key of LEGACY_BUSINESS_DEMO_STORAGE_KEYS) storage.removeItem(key);
  storage.removeItem(DEMO_SCENARIO_STORAGE_KEY);
  storage.removeItem(DEMO_SCENARIO_OVERRIDES_KEY);
}
