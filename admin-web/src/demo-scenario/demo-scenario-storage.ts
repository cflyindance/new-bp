import type { DemoScenario, LocalBusinessDate } from "./demo-scenario-types";

export const DEMO_SCENARIO_STORAGE_KEY = "menusifu:demo-scenario:v1";
export const DEMO_SCENARIO_OVERRIDES_KEY = "menusifu:demo-scenario-overrides:v1";
export const LEGACY_BUSINESS_DEMO_STORAGE_KEYS = ["tipout-payroll-state-v4", "menusifu:enterprise-hardware-demo-v3"] as const;

export interface DemoRuntimeOverride {
  overrideId: string;
  kind: string;
  entityId: string;
  businessDate?: LocalBusinessDate;
  patch: Record<string, unknown>;
}

export function readStoredScenario(storage: Storage): DemoScenario | null {
  try { const raw = storage.getItem(DEMO_SCENARIO_STORAGE_KEY); return raw ? JSON.parse(raw) as DemoScenario : null; } catch { return null; }
}

export function writeStoredScenario(storage: Storage, scenario: DemoScenario): void {
  storage.setItem(DEMO_SCENARIO_STORAGE_KEY, JSON.stringify(scenario));
}

export function readRuntimeOverrides(storage: Storage): DemoRuntimeOverride[] {
  try { const raw = storage.getItem(DEMO_SCENARIO_OVERRIDES_KEY); return raw ? JSON.parse(raw) as DemoRuntimeOverride[] : []; } catch { return []; }
}

export function writeRuntimeOverrides(storage: Storage, overrides: DemoRuntimeOverride[]): void {
  storage.setItem(DEMO_SCENARIO_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function clearRegisteredBusinessDemoData(storage: Storage): void {
  for (const key of LEGACY_BUSINESS_DEMO_STORAGE_KEYS) storage.removeItem(key);
  storage.removeItem(DEMO_SCENARIO_STORAGE_KEY);
  storage.removeItem(DEMO_SCENARIO_OVERRIDES_KEY);
}
