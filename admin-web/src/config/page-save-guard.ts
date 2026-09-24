/**
 * 设置页 · 未保存离开拦截
 */
import {
  discardPageDraft,
  isPageBatchSavePath,
  resolvePageSaveKey,
} from "./page-settings-draft";
import { isPageSavePending } from "./page-save-registry";
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

      if (leaveConfirmOpen) {
        lastPath = leaveConfirmPrevPath;
        if (readHashPath() !== leaveConfirmPrevPath) {
          window.location.hash = `#${leaveConfirmPrevPath}`;
        }
        return;
      }

      const prevKey = resolvePageSaveKey(prevPath);
      if (
        !isPageBatchSavePath(prevKey) ||
        !isPageSavePending(prevKey) ||
        resolvePageSaveKey(nextPath) === prevKey
      ) {
        lastPath = nextPath;
        return;
      }

      leaveConfirmOpen = true;
      leaveConfirmPrevPath = prevPath;
      lastPath = prevPath;
      window.location.hash = `#${prevPath}`;
      const ok = await openConfirmDialog({
        title: "离开未保存页面",
        message: "当前页有未保存的设置，离开将丢失修改。确定离开吗？",
        confirmLabel: "确认离开",
        danger: true,
      });
      leaveConfirmOpen = false;
      leaveConfirmPrevPath = "";

      if (!ok) {
        return;
      }
      discardPageDraft(prevKey);
      window.dispatchEvent(
        new CustomEvent("menusifu:page-settings-discard", { detail: { pageKey: prevKey } }),
      );
      lastPath = nextPath;
      window.location.hash = `#${nextPath}`;
    })();
  });
}

export function syncPageSaveGuardPath(path: string): void {
  if (leaveConfirmOpen) return;
  lastPath = path;
}
