import type { PayrollAuditEntry, PayrollSnapshot } from "./payroll-types";

const API_BASE = "/api/v1/payroll";
const STORAGE_KEY = "tipout-payroll-state-v4";

export class PayrollStorageUnavailableError extends Error {
  constructor() {
    super("Payroll API and browser storage are unavailable");
    this.name = "PayrollStorageUnavailableError";
  }
}

export class PayrollRevisionConflictError extends Error {
  constructor() { super('薪资数据已被其他页面更新，请重新加载后再保存'); this.name = 'PayrollRevisionConflictError'; }
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
  let revision = 0;
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
          if (parsed && typeof parsed === "object") { revision = Number(parsed.revision || 0); return { source: "api", snapshot: parsed }; }
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
      try {
        const response = await deps.fetch(`${API_BASE}/state`, {
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json", "If-Match": String(revision) },
          body: JSON.stringify(snapshot),
        });
        if (response.status === 409 || response.status === 428) throw new PayrollRevisionConflictError();
        if (response.ok) {
          const result = await readJson(response) as {revision?:number} | null;
          revision = Number(result?.revision ?? revision + 1);
          try { writeLocal({...snapshot, revision}); } catch { /* Remote save remains successful. */ }
          return "api";
        }
      } catch (error) {
        if (error instanceof PayrollRevisionConflictError) throw error;
      }
      try { writeLocal(snapshot); return "local"; } catch { /* Neither destination is available. */ }
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
