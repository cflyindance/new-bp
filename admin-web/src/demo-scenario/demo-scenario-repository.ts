import { getEnterpriseMerchantSnapshot } from "../config/enterprise-merchant-store";
import { buildBusinessDateWindow, toLocalBusinessDate } from "./demo-scenario-date";
import { generateDemoScenario } from "./demo-scenario-generator";
import { clearRegisteredBusinessDemoData, readRuntimeOverrides, readStoredScenario, writeRuntimeOverrides, writeStoredScenario, type DemoRuntimeOverride } from "./demo-scenario-storage";
import type { EnterpriseMerchantSnapshot } from "../config/enterprise-merchant-types";
import type { DemoScenario, LocalBusinessDate } from "./demo-scenario-types";
import { validateDemoScenario } from "./demo-scenario-validation";

export interface DemoScenarioRepositoryDeps {
  storage: Storage;
  getSnapshot(): EnterpriseMerchantSnapshot;
  now(): Date;
  scenarioId: string;
  scenarioVersion: number;
}

export function createDemoScenarioRepository(deps: DemoScenarioRepositoryDeps) {
  let rebuiltAfterFailure = false;
  const anchorDate = (): LocalBusinessDate => toLocalBusinessDate(deps.now());
  const rebuild = (preserveOverrides: boolean): DemoScenario => {
    const existingOverrides = preserveOverrides ? readRuntimeOverrides(deps.storage) : [];
    const scenario = generateDemoScenario({ snapshot: deps.getSnapshot(), scenarioId: deps.scenarioId, scenarioVersion: deps.scenarioVersion, anchorDate: anchorDate() });
    const window = new Set(buildBusinessDateWindow(scenario.metadata.anchorDate, 30));
    writeStoredScenario(deps.storage, scenario);
    writeRuntimeOverrides(deps.storage, existingOverrides.filter((item) => !item.businessDate || window.has(item.businessDate)));
    return scenario;
  };
  return {
    ensureDemoScenario(): DemoScenario {
      const stored = readStoredScenario(deps.storage);
      if (!stored || stored.metadata.scenarioVersion !== deps.scenarioVersion || stored.metadata.scenarioId !== deps.scenarioId) {
        clearRegisteredBusinessDemoData(deps.storage);
        return rebuild(false);
      }
      if (stored.metadata.anchorDate !== anchorDate()) return rebuild(true);
      const issues = validateDemoScenario(stored);
      if (!issues.length) return stored;
      if (rebuiltAfterFailure) throw new Error(`Demo scenario rebuild failed: ${issues[0].code}`);
      rebuiltAfterFailure = true;
      clearRegisteredBusinessDemoData(deps.storage);
      return rebuild(false);
    },
    readDemoScenario(): DemoScenario | null { return readStoredScenario(deps.storage); },
    resetDemoScenario(): DemoScenario { clearRegisteredBusinessDemoData(deps.storage); return rebuild(false); },
    applyRuntimeOverride(override: DemoRuntimeOverride): void {
      const next = readRuntimeOverrides(deps.storage).filter((item) => item.overrideId !== override.overrideId);
      next.push(override);
      writeRuntimeOverrides(deps.storage, next);
    },
    readRuntimeOverrides(): DemoRuntimeOverride[] { return readRuntimeOverrides(deps.storage); },
  };
}

let browserRepository: ReturnType<typeof createDemoScenarioRepository> | null = null;

function getBrowserRepository() {
  if (!browserRepository) browserRepository = createDemoScenarioRepository({ storage: localStorage, getSnapshot: getEnterpriseMerchantSnapshot, now: () => new Date(), scenarioId: "restaurant-chain", scenarioVersion: 1 });
  return browserRepository;
}

export function ensureDemoScenario(): DemoScenario { return getBrowserRepository().ensureDemoScenario(); }
export function readDemoScenario(): DemoScenario | null { return getBrowserRepository().readDemoScenario(); }
export function resetDemoScenario(): DemoScenario { return getBrowserRepository().resetDemoScenario(); }
export function applyRuntimeOverride(override: DemoRuntimeOverride): void {
  getBrowserRepository().applyRuntimeOverride(override);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("menusifu:demo-scenario-change"));
}
