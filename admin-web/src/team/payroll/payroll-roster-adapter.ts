import { TEAM_EMPLOYEE_ROSTER_STORAGE_KEY } from "../../config/team-employee-roster-scope";

export interface PayrollRosterEmployee {
  id?: string;
  name?: string;
  store?: string;
  role?: string;
  adpFile?: string;
  ssn?: string;
  hireDate?: string;
  [key: string]: unknown;
}

export function readPayrollRoster(storage: Storage = localStorage): PayrollRosterEmployee[] {
  try {
    const raw = storage.getItem(TEAM_EMPLOYEE_ROSTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PayrollRosterEmployee[]) : [];
  } catch {
    return [];
  }
}

export function subscribePayrollRoster(
  listener: () => void,
  events: Pick<EventTarget, "addEventListener" | "removeEventListener"> = window,
): () => void {
  const rosterUpdated = () => listener();
  const storageUpdated = (event: Event) => {
    if (!(event instanceof StorageEvent) || event.key === TEAM_EMPLOYEE_ROSTER_STORAGE_KEY) listener();
  };
  events.addEventListener("tipout-roster-updated", rosterUpdated);
  events.addEventListener("storage", storageUpdated);
  return () => {
    events.removeEventListener("tipout-roster-updated", rosterUpdated);
    events.removeEventListener("storage", storageUpdated);
  };
}

