/**
 * 页面保存并下发 · 变更前后对比弹窗
 */
import { peekPageConfigChanges } from "./deployment-change-buffer";
import { renderChangePreviewDialog } from "./deployment-change-preview";
import { resolveAutoDeploymentScope } from "./deployment-mock-devices";
import { resolvePageSaveKey } from "./page-settings-draft";
import type { DeploymentScopeOption } from "./deployment-types";

const DIALOG_ID = "page-save-change-confirm-dialog";
let dismissActiveDialog: (() => void) | null = null;

/** Keep keyboard and assistive navigation within the active confirmation. */
function activateDialog(overlay: HTMLElement): () => void {
  const previousFocus = document.activeElement as HTMLElement | null;
  const siblings = Array.from(document.body.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el !== overlay);
  const inertState = siblings.map(el => [el, el.inert] as const);
  siblings.forEach(el => { el.inert = true; });
  const focusable = () => Array.from(overlay.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')).filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
  const trapTab = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const controls = focusable(), first = controls[0], last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); overlay.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === overlay)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === overlay)) { event.preventDefault(); first.focus(); }
  };
  overlay.addEventListener("keydown", trapTab);
  (focusable()[0] ?? overlay).focus({ preventScroll: true });
  return () => {
    overlay.removeEventListener("keydown", trapTab);
    inertState.forEach(([el, inert]) => { el.inert = inert; });
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
}

/** @deprecated 始终展示变更对比确认，不再按范围选项数量决定 */
export function shouldShowPageSaveConfirmDialog(): boolean {
  return true;
}

/** 「N 项待保存」：只读预览变更，不触发下发 */
export function openPageSaveChangePreviewDialog(pageKey: string): Promise<void> {
  const key = resolvePageSaveKey(pageKey);
  const changes = peekPageConfigChanges(key);

  return new Promise((resolve) => {
    dismissActiveDialog?.();
    document.getElementById(DIALOG_ID)?.remove();

    const host = document.createElement("div");
    host.innerHTML = renderChangePreviewDialog({
      mode: "view",
      changes,
      dialogId: DIALOG_ID,
      title: "确认变更",
      subtitle: "以下为当前页待保存并下发的配置变更明细。",
      closeAttr: "data-page-save-confirm-close",
      backdropAttr: "data-page-save-confirm-backdrop",
      zClass: "z-[10040]",
    });

    const overlay = host.firstElementChild as HTMLElement | null;
    if (!overlay) {
      resolve();
      return;
    }

    let restoreDialog = () => {};
    const close = () => {
      dismissActiveDialog = null;
      overlay.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      restoreDialog();
      resolve();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); }
    };

    overlay.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement;
      if (
        target.closest("[data-page-save-confirm-close]") ||
        target.closest("[data-page-save-confirm-backdrop]")
      ) {
        close();
      }
    });

    overlay.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    restoreDialog = activateDialog(overlay);
    dismissActiveDialog = () => close();
  });
}

/** 带「确认下发」的对比弹窗（iframe 等需二次确认的场景仍可用） */
export function openPageSaveConfirmDialog(
  pageKey: string,
  _changeCount?: number,
): Promise<DeploymentScopeOption | null> {
  const key = resolvePageSaveKey(pageKey);
  const changes = peekPageConfigChanges(key);

  return new Promise((resolve) => {
    dismissActiveDialog?.();
    document.getElementById(DIALOG_ID)?.remove();

    const host = document.createElement("div");
    host.innerHTML = renderChangePreviewDialog({
      mode: "confirm",
      changes,
      dialogId: DIALOG_ID,
      title: "确认变更",
      subtitle: "确认后将保存并下发以下配置。",
      confirmLabel: "确认下发",
      closeAttr: "data-page-save-confirm-close",
      backdropAttr: "data-page-save-confirm-backdrop",
      confirmAttr: "data-page-save-confirm-ok",
      zClass: "z-[10040]",
    });

    const overlay = host.firstElementChild as HTMLElement | null;
    if (!overlay) {
      resolve(null);
      return;
    }

    let restoreDialog = () => {};
    const close = (result: DeploymentScopeOption | null) => {
      dismissActiveDialog = null;
      overlay.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      restoreDialog();
      resolve(result);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(null); }
    };

    overlay.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement;
      if (
        target.closest("[data-page-save-confirm-close]") ||
        target.closest("[data-page-save-confirm-backdrop]")
      ) {
        close(null);
        return;
      }
      if (target.closest("[data-page-save-confirm-ok]")) {
        close(resolveAutoDeploymentScope());
      }
    });

    overlay.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    restoreDialog = activateDialog(overlay);
    dismissActiveDialog = () => close(null);
  });
}
