import type { BatchArtifactResult, BatchExportInput, BatchExportOptions, BatchTaskStatus, PayrollBatchBridge } from "./payroll-batch-export-types";
import { DEFAULT_BATCH_EXPORT_OPTIONS } from "./payroll-batch-export-data";

const PREFERENCE_KEY = "menusifu-payroll-batch-export-preferences-v1";

export interface BatchTaskSnapshot {
  status: BatchTaskStatus;
  completed: number;
  total: number;
  errorMessage: string;
  result: BatchArtifactResult | null;
  retryNumber: number;
}

export function loadBatchExportPreferences(storage: Storage): BatchExportOptions {
  try {
    const raw = JSON.parse(storage.getItem(PREFERENCE_KEY) || "null") as Partial<BatchExportOptions> | null;
    return { ...DEFAULT_BATCH_EXPORT_OPTIONS, ...(raw ?? {}), scope: "all" };
  } catch { return { ...DEFAULT_BATCH_EXPORT_OPTIONS }; }
}

export function saveBatchExportPreferences(storage: Storage, options: BatchExportOptions): void {
  storage.setItem(PREFERENCE_KEY, JSON.stringify({
    detailType: options.detailType,
    format: options.format,
    organization: options.organization,
    summaryPagination: options.summaryPagination,
  }));
}

export function createPayrollBatchExportTask(dependencies: {
  bridge: PayrollBatchBridge;
  createArtifact: typeof import("./payroll-batch-export-artifacts").createBatchArtifact;
}) {
  let snapshot: BatchTaskSnapshot = { status: "idle", completed: 0, total: 0, errorMessage: "", result: null, retryNumber: 0 };
  let controller: AbortController | null = null;
  const listeners = new Set<(value: BatchTaskSnapshot) => void>();
  const publish = (patch: Partial<BatchTaskSnapshot>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener({ ...snapshot }));
  };
  const isRunning = () => ["preparing", "generating", "packaging", "cancelling"].includes(snapshot.status);
  const run = async (input: BatchExportInput, retryNumber = 0): Promise<void> => {
    if (isRunning()) throw new Error("A payroll export is already running");
    controller = new AbortController();
    publish({ status: "preparing", completed: 0, total: input.records.filter((record) => record.status !== "no_data").length, errorMessage: "", result: null, retryNumber });
    try {
      publish({ status: "generating" });
      const result = await dependencies.createArtifact(
        input,
        dependencies.bridge,
        controller.signal,
        (completed, total) => publish({ completed, total }),
        retryNumber,
        (phase) => publish({ status: phase }),
      );
      const status = result.failures.length ? "partial" : "completed";
      publish({ status, result });
      dependencies.bridge.appendExportAudit(input.options.format, result.succeededIds, status);
    } catch (error) {
      if (controller.signal.aborted) publish({ status: "cancelled", result: null });
      else {
        const message = error instanceof Error ? error.message : String(error);
        publish({ status: "failed", errorMessage: message, result: null });
        dependencies.bridge.appendExportAudit(input.options.format, [], "failed");
      }
    } finally { controller = null; }
  };
  return {
    getSnapshot: () => ({ ...snapshot }),
    subscribe(listener: (value: BatchTaskSnapshot) => void) { listeners.add(listener); return () => listeners.delete(listener); },
    canCancel: () => snapshot.status === "preparing" || snapshot.status === "generating",
    run,
    retry(input: BatchExportInput) { return run(input, snapshot.retryNumber + 1); },
    cancel() {
      if (!controller || !(snapshot.status === "preparing" || snapshot.status === "generating")) return false;
      publish({ status: "cancelling" }); controller.abort(); return true;
    },
    destroy() { controller?.abort(); listeners.clear(); },
  };
}
