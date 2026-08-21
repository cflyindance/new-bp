export type KposFloorPlanOperationStage = "pending" | "table-saved" | "layout-saved" | "reconciled" | "extension-pending";

export type KposFloorPlanOperation = {
  id: string;
  scope: string;
  areaId: string;
  stage: KposFloorPlanOperationStage;
  baselineFingerprint: string;
  targetFingerprint: string;
  temporaryIdMap: Record<string, string>;
  lastError?: string;
  updatedAt: number;
};

const DB_NAME = "kpos-floor-plan-operations";
const STORE_NAME = "operations";

function openLedger(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开 KPOS 操作账本"));
  });
}

export async function putKposFloorPlanOperation(operation: KposFloorPlanOperation): Promise<void> {
  const db = await openLedger();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...operation, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("写入 KPOS 操作账本失败"));
  });
  db.close();
}

export async function listPendingKposFloorPlanOperations(scope: string): Promise<KposFloorPlanOperation[]> {
  const db = await openLedger();
  const rows = await new Promise<KposFloorPlanOperation[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as KposFloorPlanOperation[]).filter((row) => row.scope === scope && row.stage !== "reconciled"));
    request.onerror = () => reject(request.error ?? new Error("读取 KPOS 操作账本失败"));
  });
  db.close();
  return rows;
}
