/**
 * 设置页 · 未保存离开拦截
 */
import {
  discardPageDraft,
  isPageBatchSavePath,
  isPageSaveDirty,
  resolvePageSaveKey,
} from "./page-settings-draft";
import { openConfirmDialog } from "../ui/app-confirm-dialog";

let bound = false;
let lastPath = "";
let leaveConfirmOpen = false;
let leaveConfirmPrevPath = "";

function readHashPath(): string {
  return (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "") || "/";
}

export function bindPageSaveGuard(): void {
  if (typeof window === "undefined" || bound) return;
  bound = true;
  lastPath = readHashPath();

  window.addEventListener("hashchange", () => {
    void (async () => {
      const prevPath = lastPath;
      const nextPath = readHashPath();

      // Concurrent navigation while leave-confirm is open: keep previous path.
      if (leaveConfirmOpen) {
        lastPath = leaveConfirmPrevPath;
        if (readHashPath() !== leaveConfirmPrevPath) {
          window.location.hash = `#${leaveConfirmPrevPath}`;
        }
        return;
      }

      lastPath = nextPath;

      const prevKey = resolvePageSaveKey(prevPath);
      if (!isPageBatchSavePath(prevKey) || !isPageSaveDirty(prevKey)) return;
      if (resolvePageSaveKey(nextPath) === prevKey) return;

      leaveConfirmOpen = true;
      leaveConfirmPrevPath = prevPath;
      const ok = await openConfirmDialog({
        title: "离开未保存页面",
        message: "当前页有未保存的设置，离开将丢失修改。确定离开吗？",
        confirmLabel: "确认离开",
        danger: true,
      });
      leaveConfirmOpen = false;
      leaveConfirmPrevPath = "";

      if (!ok) {
        lastPath = prevPath;
        window.location.hash = `#${prevPath}`;
        return;
      }
      discardPageDraft(prevKey);
    })();
  });
}

export function syncPageSaveGuardPath(path: string): void {
  lastPath = path;
}
