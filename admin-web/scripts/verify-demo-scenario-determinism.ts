import { buildBusinessDateWindow } from "../src/demo-scenario/demo-scenario-date";
import { createSeededRandom, seedFromParts, stableDemoId } from "../src/demo-scenario/demo-scenario-random";

function assertWindow(anchor: `${number}-${number}-${number}`, first: string): void {
  const dates = buildBusinessDateWindow(anchor, 30);
  if (dates.length !== 30 || dates[0] !== first || dates.at(-1) !== anchor) {
    throw new Error(`unexpected date window for ${anchor}: ${JSON.stringify(dates)}`);
  }
  if (new Set(dates).size !== 30) throw new Error(`duplicate dates for ${anchor}`);
}

assertWindow("2026-03-01", "2026-01-31");
assertWindow("2024-03-01", "2024-02-01");
assertWindow("2026-01-01", "2025-12-03");

const seed = seedFromParts("v1", "2026-03-01", "M00000001", "orders");
const a = createSeededRandom(seed);
const b = createSeededRandom(seed);
if ([a(), a(), a()].join() !== [b(), b(), b()].join()) throw new Error("PRNG is not stable");

const id = stableDemoId("order", "M00000001", "2026-03-01", 1);
if (id !== "demo-order-M00000001-20260301-0001") throw new Error(`unexpected stable ID: ${id}`);

console.log(`demo scenario determinism: ok (${seed})`);
