import { getEnterpriseMerchantSnapshot } from "../config/enterprise-merchant-store";
import { createDemoScenarioRepository } from "./demo-scenario-repository";
import type { DemoRuntimeOverride } from "./demo-scenario-storage";
import type { DemoScenario } from "./demo-scenario-types";

let repository: ReturnType<typeof createDemoScenarioRepository> | null = null;

function getRepository() {
  if (!repository) repository = createDemoScenarioRepository({ storage: localStorage, getSnapshot: getEnterpriseMerchantSnapshot, now: () => new Date(), scenarioId: "restaurant-chain", scenarioVersion: 1 });
  return repository;
}

export function ensureDemoScenario(): DemoScenario { return getRepository().ensureDemoScenario(); }
export function readDemoScenario(): DemoScenario | null { return getRepository().readDemoScenario(); }
export function resetDemoScenario(): DemoScenario { return getRepository().resetDemoScenario(); }
export function applyRuntimeOverride(override: DemoRuntimeOverride): void {
  getRepository().applyRuntimeOverride(override);
  window.dispatchEvent(new CustomEvent("menusifu:demo-scenario-change"));
}
