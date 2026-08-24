import { classifyChange, type StrikethroughPriceChange } from "./strikethrough-price-domain";

const STORAGE_KEY = "menusifu:emenu-local:strikethrough-prices:v2";

type PriceRow = { cents: number | null; version: number };
type PersistedState = {
  version: number;
  prices: Record<string, PriceRow>;
  auditLog: Array<{ batchId: string; createdAt: string; changes: StrikethroughPriceChange[]; deploymentStatus: "synced" }>;
};

const initialPrices: Record<string, PriceRow> = {};

function load(): PersistedState {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) return JSON.parse(value) as PersistedState;
  } catch {
    // Invalid demo persistence falls back to a clean state.
  }
  return { version: 1, prices: structuredClone(initialPrices), auditLog: [] };
}

function persist(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export class StrikethroughPriceStore {
  private state = load();

  hydrate(productId: string, sourceCents: number | null): void {
    if (this.state.prices[productId]) return;
    this.state.prices[productId] = { cents: sourceCents, version: 1 };
    persist(this.state);
  }

  get(productId: string): PriceRow {
    return this.state.prices[productId] ?? { cents: null, version: 1 };
  }

  configuredEntries(): Array<{ productId: string; cents: number; version: number }> {
    return Object.entries(this.state.prices)
      .filter((entry): entry is [string, { cents: number; version: number }] => entry[1].cents !== null)
      .map(([productId, row]) => ({ productId, cents: row.cents, version: row.version }));
  }

  preview(targets: Array<{ productId: string; expectedVersion: number; targetPriceCents: number | null }>): StrikethroughPriceChange[] {
    return targets.map((target) => {
      const current = this.get(target.productId);
      if (current.version !== target.expectedVersion) throw new Error(`商品 ${target.productId} 已被其他操作修改，请刷新后重试`);
      return classifyChange(target.productId, target.expectedVersion, current.cents, target.targetPriceCents);
    }).filter((item): item is StrikethroughPriceChange => Boolean(item));
  }

  commit(changes: StrikethroughPriceChange[]): { batchId: string; deploymentStatus: "synced" } {
    const latest = load();
    for (const change of changes) {
      const current = latest.prices[change.productId] ?? { cents: null, version: 1 };
      if (current.version !== change.expectedVersion || current.cents !== change.originalPriceCents) {
        throw new Error(`商品 ${change.productId} 已被其他操作修改，请刷新后重试`);
      }
    }
    const batchId = globalThis.crypto?.randomUUID?.() ?? `strike-${Date.now()}`;
    for (const change of changes) {
      latest.prices[change.productId] = { cents: change.targetPriceCents, version: change.expectedVersion + 1 };
    }
    latest.version += 1;
    latest.auditLog.unshift({ batchId, createdAt: new Date().toISOString(), changes, deploymentStatus: "synced" });
    persist(latest);
    this.state = latest;
    return { batchId, deploymentStatus: "synced" };
  }
}
