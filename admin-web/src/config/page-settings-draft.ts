/**
 * 设置页 · 按页面批量保存：草稿层与白名单
 */
import {
  getModuleSettingsBasePath,
  MODULE_SETTINGS_BY_PATH,
} from "./module-settings-catalog";
import { moduleSettingStorageKey } from "./module-settings-form-ui";
import {
  moduleSettingToggleStorageKey,
  writeModuleSettingToggleOn,
} from "./module-settings-toggle-ui";
import {
  writeFohByLineToggleState,
} from "./foh-settings-by-line-toggle";
import type { FohLineNavId } from "./foh-settings-line-scope";
import type { DeploymentConfigChange } from "./deployment-types";
import {
  clearPageConfigChanges,
  consumePageConfigChanges,
  getPageChangeCount,
  isPageDirty,
  recordPageConfigChange,
} from "./deployment-change-buffer";

/** 不参与页面批量保存的 Hub（占位/空 catalog 等） */
export const PAGE_BATCH_SAVE_EXCLUDE_PATHS = new Set<string>([
  "/reviews/settings",
  "/brand/settings",
  "/dashboard/settings",
]);

/** 独立功能页（非 module-settings-catalog Hub） */
export const PAGE_BATCH_SAVE_FEATURE_PATHS = new Set<string>([
  "/team/clock-in",
  "/team/shift-scheduling",
  "/team/breaks-overtime",
  "/operations/queue-call/floor-plan",
]);

/** 全部模块设置 Hub 启用页面批量保存 */
export const PAGE_BATCH_SAVE_PATHS = new Set<string>([
  ...Object.keys(MODULE_SETTINGS_BY_PATH).filter(
    (path) => !PAGE_BATCH_SAVE_EXCLUDE_PATHS.has(path),
  ),
  ...PAGE_BATCH_SAVE_FEATURE_PATHS,
]);

export type PageDraftEntry =
  | { kind: "toggle"; seq: number; value: boolean }
  | { kind: "foh-toggle"; seq: number; lineId: string; value: boolean }
  | { kind: "field"; fieldId: string; value: string };

interface PageDraftBucket {
  pageKey: string;
  settingsPath: string;
  drafts: Map<string, PageDraftEntry>;
}

const buckets = new Map<string, PageDraftBucket>();

export function resolvePageSaveKey(path: string): string {
  const normalized = (path.split("?")[0] ?? path).replace(/\/$/, "") || "/";
  const catalogBase = getModuleSettingsBasePath(normalized);
  if (catalogBase) return catalogBase;
  for (const featurePath of PAGE_BATCH_SAVE_FEATURE_PATHS) {
    if (normalized === featurePath || normalized.startsWith(`${featurePath}/`)) {
      return featurePath;
    }
  }
  return normalized;
}

export function isPageBatchSavePath(pathOrKey: string): boolean {
  const key = pathOrKey.includes("/")
    ? resolvePageSaveKey(pathOrKey)
    : pathOrKey;
  return PAGE_BATCH_SAVE_PATHS.has(key);
}

function ensureBucket(pageKey: string, settingsPath?: string): PageDraftBucket {
  let bucket = buckets.get(pageKey);
  if (!bucket) {
    bucket = {
      pageKey,
      settingsPath: settingsPath ?? pageKey,
      drafts: new Map(),
    };
    buckets.set(pageKey, bucket);
  } else if (settingsPath && bucket.settingsPath !== settingsPath) {
    bucket.settingsPath = settingsPath;
  }
  return bucket;
}

export function initPageSaveSession(pageKey: string, settingsPath?: string): void {
  ensureBucket(pageKey, settingsPath ?? pageKey);
}

export function setPageDraftToggle(pageKey: string, seq: number, value: boolean): void {
  const bucket = ensureBucket(pageKey);
  bucket.drafts.set(`toggle:${seq}`, { kind: "toggle", seq, value });
}

export function setPageDraftFohToggle(
  pageKey: string,
  seq: number,
  lineId: string,
  value: boolean,
): void {
  const bucket = ensureBucket(pageKey);
  bucket.drafts.set(`foh-toggle:${seq}:${lineId}`, {
    kind: "foh-toggle",
    seq,
    lineId,
    value,
  });
}

export function setPageDraftField(pageKey: string, fieldId: string, value: string): void {
  const bucket = ensureBucket(pageKey);
  const key = `field:${fieldId}`;
  bucket.drafts.set(key, { kind: "field", fieldId, value });
}

export function readPageDraftToggle(pageKey: string, seq: number): boolean | undefined {
  const entry = buckets.get(pageKey)?.drafts.get(`toggle:${seq}`);
  if (entry?.kind === "toggle") return entry.value;
  return undefined;
}

export function readPageDraftFohToggle(
  pageKey: string,
  seq: number,
  lineId: string,
): boolean | undefined {
  const entry = buckets.get(pageKey)?.drafts.get(`foh-toggle:${seq}:${lineId}`);
  if (entry?.kind === "foh-toggle") return entry.value;
  return undefined;
}

export function readPageDraftField(pageKey: string, fieldId: string): string | undefined {
  const entry = buckets.get(pageKey)?.drafts.get(`field:${fieldId}`);
  if (entry?.kind === "field") return entry.value;
  return undefined;
}

export function readPageDraftFieldForCurrentPath(fieldId: string): string | undefined {
  const pageKey = resolvePageSaveKey(
    typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") || "/" : "/",
  );
  if (!isPageBatchSavePath(pageKey)) return undefined;
  return readPageDraftField(pageKey, fieldId);
}

export function readPageDraftToggleForCurrentPath(seq: number): boolean | undefined {
  const pageKey = resolvePageSaveKey(
    typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") || "/" : "/",
  );
  if (!isPageBatchSavePath(pageKey)) return undefined;
  return readPageDraftToggle(pageKey, seq);
}

export function readPageDraftFohToggleForCurrentPath(
  seq: number,
  lineId: string,
): boolean | undefined {
  const pageKey = resolvePageSaveKey(
    typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") || "/" : "/",
  );
  if (!isPageBatchSavePath(pageKey)) return undefined;
  return readPageDraftFohToggle(pageKey, seq, lineId);
}

export function trackPageConfigChange(
  pageKey: string,
  settingsPath: string,
  change: DeploymentConfigChange,
): void {
  ensureBucket(pageKey, settingsPath);
  recordPageConfigChange(pageKey, { ...change, settingsPath });
}

export function getPageDraftChangeCount(pageKey: string): number {
  return getPageChangeCount(pageKey);
}

export function isPageSaveDirty(pageKey: string): boolean {
  return isPageDirty(pageKey);
}

function persistDraftEntry(entry: PageDraftEntry): void {
  if (entry.kind === "toggle") {
    writeModuleSettingToggleOn(entry.seq, entry.value);
    return;
  }
  if (entry.kind === "foh-toggle") {
    writeFohByLineToggleState(entry.seq, entry.lineId as FohLineNavId, entry.value);
    return;
  }
  try {
    localStorage.setItem(moduleSettingStorageKey(entry.fieldId), entry.value);
  } catch {
    /* ignore */
  }
}

/** 将草稿写入持久层，返回待下发的变更列表 */
export function commitPageDraft(pageKey: string): DeploymentConfigChange[] {
  const bucket = buckets.get(pageKey);
  if (!bucket || bucket.drafts.size === 0) {
    return consumePageConfigChanges(pageKey);
  }

  for (const entry of bucket.drafts.values()) {
    persistDraftEntry(entry);
  }
  bucket.drafts.clear();

  return consumePageConfigChanges(pageKey);
}

export function discardPageDraft(pageKey: string): void {
  buckets.get(pageKey)?.drafts.clear();
  clearPageConfigChanges(pageKey);
}

export function listPageDraftToggles(pageKey: string): Array<{ seq: number; value: boolean }> {
  const bucket = buckets.get(pageKey);
  if (!bucket) return [];
  return [...bucket.drafts.values()]
    .filter((e): e is Extract<PageDraftEntry, { kind: "toggle" }> => e.kind === "toggle")
    .map((e) => ({ seq: e.seq, value: e.value }));
}

export function listPageDraftFohToggles(
  pageKey: string,
): Array<{ seq: number; lineId: string; value: boolean }> {
  const bucket = buckets.get(pageKey);
  if (!bucket) return [];
  return [...bucket.drafts.values()]
    .filter((e): e is Extract<PageDraftEntry, { kind: "foh-toggle" }> => e.kind === "foh-toggle")
    .map((e) => ({ seq: e.seq, lineId: e.lineId, value: e.value }));
}

export { moduleSettingToggleStorageKey };
