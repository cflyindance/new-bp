import type { PayrollAuditEntry, PayrollSnapshot } from "./payroll-types";

const API_BASE = "/api/v1/payroll";
const STORAGE_KEY = "tipout-payroll-state-v4";

export class PayrollStorageUnavailableError extends Error {
  constructor() {
    super("Payroll API and browser storage are unavailable");
    this.name = "PayrollStorageUnavailableError";
  }
}

export interface PayrollRepository {
  load(): Promise<{ source: "api" | "local" | "default"; snapshot: PayrollSnapshot }>;
  save(snapshot: PayrollSnapshot): Promise<"api" | "local">;
  fetchAuditLog(limit: number): Promise<PayrollAuditEntry[]>;
}

function cloneSnapshot(snapshot: PayrollSnapshot): PayrollSnapshot {
  return structuredClone(snapshot);
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return response.json();
}

export function createPayrollRepository(deps: {
  fetch: typeof fetch;
  storage: Storage;
  defaultSnapshot: PayrollSnapshot;
}): PayrollRepository {
  const readLocal = (): PayrollSnapshot | null => {
    const raw = deps.storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PayrollSnapshot;
    return parsed && typeof parsed === "object" ? parsed : null;
  };

  const writeLocal = (snapshot: PayrollSnapshot): void => {
    deps.storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  };

  return {
    async load() {
      try {
        const response = await deps.fetch(`${API_BASE}/state`, { headers: { Accept: "application/json" } });
        if (response.ok) {
          const parsed = (await readJson(response)) as PayrollSnapshot;
          if (parsed && typeof parsed === "object") return { source: "api", snapshot: parsed };
        }
      } catch {
        // Continue to the browser-storage fallback.
      }

      try {
        const local = readLocal();
        if (local) return { source: "local", snapshot: local };
        return { source: "default", snapshot: cloneSnapshot(deps.defaultSnapshot) };
      } catch {
        throw new PayrollStorageUnavailableError();
      }
    },

    async save(snapshot) {
      let localSaved = false;
      try {
        writeLocal(snapshot);
        localSaved = true;
      } catch {
        // The API may still be available.
      }

      try {
        const response = await deps.fetch(`${API_BASE}/state`, {
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (response.ok) return "api";
      } catch {
        // Return the successful local fallback below.
      }

      if (localSaved) return "local";
      throw new PayrollStorageUnavailableError();
    },

    async fetchAuditLog(limit) {
      try {
        const response = await deps.fetch(`${API_BASE}/audit-log?limit=${Math.max(1, Math.min(100, limit))}`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return [];
        const parsed = (await readJson(response)) as { items?: PayrollAuditEntry[] };
        return Array.isArray(parsed?.items) ? parsed.items : [];
      } catch {
        return [];
      }
    },
  };
}

