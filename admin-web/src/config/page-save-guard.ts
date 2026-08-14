/**
 * 设置页 · 未保存离开拦截
 */
import {
  discardPageDraft,
  isPageBatchSavePath,
  isPageSaveDirty,
  resolvePageSaveKey,
} from "./page-settings-draft";
import { getActiveSettingEditScopeKey } from "./module-setting-edit-context";

let bound = false;
let lastPath = "";

function readHashPath(): string {
  return (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "") || "/";
}

export function bindPageSaveGuard(): void {
  if (typeof window === "undefined" || bound) return;
  bound = true;
  lastPath = readHashPath();

  window.addEventListener("hashchange", () => {
    const prevPath = lastPath;
    const nextPath = readHashPath();
    lastPath = nextPath;

    const prevKey = resolvePageSaveKey(prevPath);
    if (!isPageBatchSavePath(prevKey) || !isPageSaveDirty(prevKey)) return;
    if (resolvePageSaveKey(nextPath) === prevKey) return;

    const stay = window.confirm("当前页有未保存的设置，离开将丢失修改。确定离开吗？");
    if (!stay) {
      lastPath = prevPath;
      window.location.hash = `#${prevPath}`;
      return;
    }
    discardPageDraft(prevKey);
  });

  window.addEventListener("beforeunload", (event) => {
    const activeScopeKey = getActiveSettingEditScopeKey();
    const currentPageKey = resolvePageSaveKey(readHashPath());
    const hasUnsavedDraft =
      Boolean(activeScopeKey && isPageSaveDirty(activeScopeKey)) ||
      (isPageBatchSavePath(currentPageKey) && isPageSaveDirty(currentPageKey));
    if (!hasUnsavedDraft) return;

    event.preventDefault();
    event.returnValue = "";
  });
}

export function syncPageSaveGuardPath(path: string): void {
  lastPath = path;
}
