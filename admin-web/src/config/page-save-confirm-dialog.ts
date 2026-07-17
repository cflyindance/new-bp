/**
 * 页面保存并下发 · 变更前后对比确认弹窗
 */
import { peekPageConfigChanges } from "./deployment-change-buffer";
import { renderChangePreviewDialog } from "./deployment-change-preview";
import { resolveAutoDeploymentScope } from "./deployment-mock-devices";
import { resolvePageSaveKey } from "./page-settings-draft";
import type { DeploymentScopeOption } from "./deployment-types";

const DIALOG_ID = "page-save-change-confirm-dialog";

/** @deprecated 始终展示变更对比确认，不再按范围选项数量决定 */
export function shouldShowPageSaveConfirmDialog(): boolean {
  return true;
}

export function openPageSaveConfirmDialog(
  pageKey: string,
  _changeCount?: number,
): Promise<DeploymentScopeOption | null> {
  const key = resolvePageSaveKey(pageKey);
  const changes = peekPageConfigChanges(key);

  return new Promise((resolve) => {
    document.getElementById(DIALOG_ID)?.remove();

    const host = document.createElement("div");
    host.innerHTML = renderChangePreviewDialog({
      mode: "confirm",
      changes,
      dialogId: DIALOG_ID,
      title: "确认变更",
      subtitle: "请确认以下配置变更后再保存并下发。",
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

    const close = (result: DeploymentScopeOption | null) => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      resolve(result);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") close(null);
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

    document.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
    overlay.focus({ preventScroll: true });
  });
}
