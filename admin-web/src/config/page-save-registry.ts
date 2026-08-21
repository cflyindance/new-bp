/**
 * 页面保存 · 预提交与脏状态探测注册表
 */
import { getPageChangeCount, isPageDirty } from "./deployment-change-buffer";
import { resolvePageSaveKey } from "./page-settings-draft";

type PageSaveHandler = () => boolean | Promise<boolean>;
type PageDirtyProbe = () => boolean;

const preCommitHandlers = new Map<string, PageSaveHandler>();
const dirtyProbes = new Map<string, PageDirtyProbe>();

export function registerPageSavePreCommit(pageKey: string, handler: PageSaveHandler): void {
  preCommitHandlers.set(resolvePageSaveKey(pageKey), handler);
}

export function registerPageSaveDirtyProbe(pageKey: string, probe: PageDirtyProbe): void {
  dirtyProbes.set(resolvePageSaveKey(pageKey), probe);
}

export async function runPageSavePreCommit(pageKey: string): Promise<boolean> {
  const key = resolvePageSaveKey(pageKey);
  const handler = preCommitHandlers.get(key);
  if (!handler) return true;
  return (await handler()) !== false;
}

export function isPageSavePending(pageKey: string): boolean {
  const key = resolvePageSaveKey(pageKey);
  if (isPageDirty(key)) return true;
  const probe = dirtyProbes.get(key);
  return probe?.() === true;
}

export function getPageSavePendingCount(pageKey: string): number {
  const key = resolvePageSaveKey(pageKey);
  const bucketCount = getPageChangeCount(key);
  if (bucketCount > 0) return bucketCount;
  return isPageSavePending(key) ? 1 : 0;
}
