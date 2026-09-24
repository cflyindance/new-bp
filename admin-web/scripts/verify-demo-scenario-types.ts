import type { DemoScenario, DemoScenarioScope, MoneyMinor } from "../src/demo-scenario/demo-scenario-types";
import { isMoneyMinor } from "../src/demo-scenario/demo-scenario-types";

const cents: MoneyMinor = 1299;
const scope: DemoScenarioScope = { groupId: "g", brandIds: ["b"], storeIds: ["s"] };
const sample: Pick<DemoScenario, "metadata" | "scopeIndex"> = {
  metadata: {
    scenarioId: "restaurant-chain",
    scenarioVersion: 1,
    anchorDate: "2026-09-24",
    generatedAt: "2026-09-24T00:00:00.000Z",
  },
  scopeIndex: { groupIds: ["g"], brandIds: ["b"], storeIds: ["s"] },
};

if (!isMoneyMinor(cents) || isMoneyMinor(12.5) || scope.storeIds[0] !== sample.scopeIndex.storeIds[0]) {
  throw new Error("type contract mismatch");
}

console.log("demo scenario type contract: ok");
