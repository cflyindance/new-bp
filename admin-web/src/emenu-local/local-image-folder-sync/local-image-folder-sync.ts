/** File System Access API：当前 TS lib.dom 未覆盖，按 Chromium 实现补齐所需部分。 */
type FsPermissionMode = "read" | "readwrite";
type FsPermissionDescriptor = { mode: FsPermissionMode };

type FsDirectoryHandleExt = FileSystemDirectoryHandle & {
  entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
  queryPermission?: (o: FsPermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (o: FsPermissionDescriptor) => Promise<PermissionState>;
};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: FsPermissionMode;
      startIn?: string | FileSystemHandle;
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

export const TARGET_ROOT_PATH_HINT = String.raw`C:\Wisdomount\Menusifu\data\static\images`;

export type SyncTargetId = "emenu" | "kiosk";

export type SyncTarget = {
  id: SyncTargetId;
  dirName: string;
  path: string;
};

export const SYNC_TARGETS: readonly SyncTarget[] = [
  {
    id: "emenu",
    dirName: "emenu",
    path: String.raw`C:\Wisdomount\Menusifu\data\static\images\emenu`,
  },
  {
    id: "kiosk",
    dirName: "kiosk",
    path: String.raw`C:\Wisdomount\Menusifu\data\static\images\kiosk`,
  },
] as const;

export const ACTIVE_TARGET_STORAGE_KEY = "menusifu:emenu-local:image-sync-target";

export function getSyncTarget(id: SyncTargetId): SyncTarget {
  return SYNC_TARGETS.find((item) => item.id === id) ?? SYNC_TARGETS[0];
}

export function readActiveSyncTargetId(): SyncTargetId | null {
  try {
    const stored = localStorage.getItem(ACTIVE_TARGET_STORAGE_KEY);
    return SYNC_TARGETS.some((item) => item.id === stored)
      ? (stored as SyncTargetId)
      : null;
  } catch {
    return null;
  }
}

export function writeActiveSyncTargetId(id: SyncTargetId): void {
  try {
    localStorage.setItem(ACTIVE_TARGET_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
]);

export const FAILURE_LIST_LIMIT = 10;
export const HANDLE_DB_NAME = "emenu-local-image-folder-sync";
export const HANDLE_STORE = "handles";
export const HANDLE_KEY = "targetStaticImages";
export const ROOT_HANDLE_KEY = "targetStaticImagesRoot";

export function handleKeyForTarget(target: SyncTargetId): string {
  return `${HANDLE_KEY}:${target}`;
}

/** images 根目录名，用于识别操作员是否直接选中了根目录。 */
export const TARGET_ROOT_DIR_NAME = "images";

export type FolderSyncCapability = "ok" | "insecure_context" | "unsupported";

export type SourceEntry = {
  name: string;
  kind: "file" | "directory";
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
};

export type SyncSummary = {
  added: number;
  skipped: number;
  ignoredNonImages: number;
  failed: Array<{ name: string; message: string }>;
  blockedReason?: "has_subdir" | "no_images" | "case_conflict";
  cancelled?: boolean;
};

export function normalizeNameKey(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase();
}

export function getExtension(name: string): string {
  const n = String(name || "");
  const i = n.lastIndexOf(".");
  if (i < 0) return "";
  return n.slice(i).toLowerCase();
}

export function isImageFileName(name: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(name));
}

export function classifySourceEntries(entries: SourceEntry[]): {
  ok: boolean;
  reason?: "has_subdir" | "no_images" | "case_conflict";
  images: Array<{ name: string }>;
  ignoredNonImages: number;
} {
  const list = Array.isArray(entries) ? entries : [];
  if (list.some((e) => e.kind === "directory")) {
    return { ok: false, reason: "has_subdir", images: [], ignoredNonImages: 0 };
  }

  const images: Array<{ name: string }> = [];
  let ignoredNonImages = 0;
  const seen = new Map<string, string>();

  for (const e of list) {
    if (e.kind !== "file") continue;
    if (!isImageFileName(e.name)) {
      ignoredNonImages += 1;
      continue;
    }
    const key = normalizeNameKey(e.name);
    if (seen.has(key) && seen.get(key) !== e.name) {
      return {
        ok: false,
        reason: "case_conflict",
        images: [],
        ignoredNonImages: 0,
      };
    }
    seen.set(key, e.name);
    images.push({ name: e.name });
  }

  if (images.length === 0) {
    return { ok: false, reason: "no_images", images: [], ignoredNonImages };
  }

  return { ok: true, images, ignoredNonImages };
}

export function planSyncActions(
  sourceImages: Array<{ name: string }>,
  targetNames: Iterable<string>,
): { toWrite: string[]; toSkip: string[] } {
  const existing = new Set([...targetNames].map((n) => normalizeNameKey(n)));
  const toWrite: string[] = [];
  const toSkip: string[] = [];
  for (const img of sourceImages || []) {
    const key = normalizeNameKey(img.name);
    if (existing.has(key)) toSkip.push(img.name);
    else toWrite.push(img.name);
  }
  return { toWrite, toSkip };
}

export function detectFolderSyncCapability(
  globalObj: {
    isSecureContext?: boolean;
    showDirectoryPicker?: unknown;
    location?: { href?: string };
  } = globalThis,
): FolderSyncCapability {
  const g = globalObj || {};
  let isSecure = false;
  if (typeof g.isSecureContext === "boolean") {
    isSecure = g.isSecureContext;
  } else if (g.location) {
    isSecure = /^(https:|http:\/\/(localhost|127\.0\.0\.1)(:|$))/i.test(
      String(g.location.href || ""),
    );
  }
  if (!isSecure) return "insecure_context";
  if (typeof g.showDirectoryPicker !== "function") return "unsupported";
  return "ok";
}

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTargetDirectoryHandle(
  target: SyncTargetId,
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openHandleDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    tx.objectStore(HANDLE_STORE).put(handle, handleKeyForTarget(target));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadTargetDirectoryHandle(
  target: SyncTargetId,
): Promise<FileSystemDirectoryHandle | null> {
  return loadHandleByKey(handleKeyForTarget(target));
}

export async function saveRootDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openHandleDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    tx.objectStore(HANDLE_STORE).put(handle, ROOT_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadRootDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return loadHandleByKey(ROOT_HANDLE_KEY);
}

async function loadHandleByKey(key: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openHandleDb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readonly");
    const req = tx.objectStore(HANDLE_STORE).get(key);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
}

async function verifyHandlePermission(
  handle: FileSystemDirectoryHandle,
  mode: FsPermissionMode = "readwrite",
): Promise<boolean> {
  const opts = { mode };
  const anyHandle = handle as FsDirectoryHandleExt;
  if (anyHandle.queryPermission) {
    if ((await anyHandle.queryPermission(opts)) === "granted") return true;
  }
  if (anyHandle.requestPermission) {
    if ((await anyHandle.requestPermission(opts)) === "granted") return true;
  }
  return false;
}

function requireDirectoryPicker(): NonNullable<Window["showDirectoryPicker"]> {
  const picker = window.showDirectoryPicker;
  if (!picker) throw new Error("showDirectoryPicker unavailable");
  return picker.bind(window);
}

/**
 * 从已授权的 images 根目录派生出 emenu / kiosk 子目录，目录不存在时创建。
 */
export async function resolveTargetFromRoot(
  root: FileSystemDirectoryHandle,
  target: SyncTargetId,
): Promise<FileSystemDirectoryHandle | null> {
  const { dirName } = getSyncTarget(target);
  if (normalizeNameKey(root.name) === dirName) return root;
  try {
    return await root.getDirectoryHandle(dirName, { create: true });
  } catch {
    return null;
  }
}

export type EnsureTargetResult = {
  handle: FileSystemDirectoryHandle | null;
  cancelled: boolean;
  mismatched?: boolean;
};

/** 已授权 images 根目录时静默派生目标目录；否则返回 null，由调用方发起一次授权。 */
async function deriveTargetFromStoredRoot(
  target: SyncTargetId,
): Promise<FileSystemDirectoryHandle | null> {
  const root = await loadRootDirectoryHandle().catch(() => null);
  if (!root) return null;
  if (!(await verifyHandlePermission(root, "readwrite"))) return null;
  const resolved = await resolveTargetFromRoot(root, target);
  if (!resolved) return null;
  await saveTargetDirectoryHandle(target, resolved);
  return resolved;
}

/**
 * 取得目标目录句柄。命中已授权缓存（目标本身或 images 根）时不弹系统目录框。
 */
export async function ensureTargetDirectoryHandle(
  target: SyncTargetId,
  opts: { forcePick?: boolean } = {},
): Promise<EnsureTargetResult> {
  const forcePick = Boolean(opts.forcePick);
  if (!forcePick) {
    const cached = await loadTargetDirectoryHandle(target).catch(() => null);
    if (cached && (await verifyHandlePermission(cached, "readwrite"))) {
      return { handle: cached, cancelled: false };
    }
    const derived = await deriveTargetFromStoredRoot(target);
    if (derived) {
      return { handle: derived, cancelled: false };
    }
  }

  try {
    const picked = await requireDirectoryPicker()({
      id: "emenu-static-images-root",
      mode: "readwrite",
    });
    if (!(await verifyHandlePermission(picked, "readwrite"))) {
      return { handle: null, cancelled: true };
    }

    const resolved = await resolveTargetFromRoot(picked, target);
    if (!resolved) return { handle: null, cancelled: false, mismatched: true };

    // 选中的是 images 根时保存根句柄，后续切换目标不再需要授权
    if (resolved !== picked) await saveRootDirectoryHandle(picked);
    await saveTargetDirectoryHandle(target, resolved);
    writeActiveSyncTargetId(target);
    return { handle: resolved, cancelled: false };
  } catch (e) {
    const err = e as DOMException;
    if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
      return { handle: null, cancelled: true };
    }
    throw e;
  }
}

export async function pickSourceDirectoryHandle(): Promise<{
  handle: FileSystemDirectoryHandle | null;
  cancelled: boolean;
}> {
  try {
    const handle = await requireDirectoryPicker()({
      id: "emenu-image-source",
      mode: "read",
    });
    return { handle, cancelled: false };
  } catch (e) {
    const err = e as DOMException;
    if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
      return { handle: null, cancelled: true };
    }
    throw e;
  }
}

export async function listDirectoryEntries(
  dirHandle: FileSystemDirectoryHandle,
): Promise<SourceEntry[]> {
  const entries: SourceEntry[] = [];
  for await (const [name, handle] of (dirHandle as FsDirectoryHandleExt).entries()) {
    entries.push({
      name,
      kind: handle.kind === "directory" ? "directory" : "file",
      handle: handle as FileSystemFileHandle | FileSystemDirectoryHandle,
    });
  }
  return entries;
}

export async function syncImageFolderToTarget(args: {
  sourceHandle: FileSystemDirectoryHandle;
  targetHandle: FileSystemDirectoryHandle;
}): Promise<SyncSummary> {
  const { sourceHandle, targetHandle } = args;
  const sourceEntries = await listDirectoryEntries(sourceHandle);
  const classified = classifySourceEntries(sourceEntries);
  if (!classified.ok) {
    return {
      added: 0,
      skipped: 0,
      ignoredNonImages: classified.ignoredNonImages || 0,
      failed: [],
      blockedReason: classified.reason,
    };
  }

  const targetEntries = await listDirectoryEntries(targetHandle);
  const targetNames = targetEntries.filter((e) => e.kind === "file").map((e) => e.name);
  const { toWrite, toSkip } = planSyncActions(classified.images, targetNames);

  const failed: Array<{ name: string; message: string }> = [];
  let added = 0;
  const sourceMap = new Map(sourceEntries.map((e) => [e.name, e]));

  for (const name of toWrite) {
    try {
      const src = sourceMap.get(name);
      const fileHandle = src?.handle as FileSystemFileHandle | undefined;
      if (!fileHandle || fileHandle.kind !== "file") {
        throw new Error("missing source handle");
      }
      const file = await fileHandle.getFile();
      const out = await targetHandle.getFileHandle(name, { create: true });
      const writable = await out.createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();
      added += 1;
    } catch (e) {
      failed.push({
        name,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    added,
    skipped: toSkip.length,
    ignoredNonImages: classified.ignoredNonImages,
    failed: failed.slice(0, FAILURE_LIST_LIMIT),
  };
}
