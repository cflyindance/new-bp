/**
 * iframe 内嵌页 → 父页「保存并下发」桥接
 * 消息：menusifu:iframe-save-deploy
 */
import { clearPageConfigChanges, replacePageConfigChange } from "./deployment-change-buffer";
import { resolveOriginNavFromPath } from "./deployment-config-domains";
import { createDeploymentFromPath } from "./deployment-store";
import { resolveAutoDeploymentScope } from "./deployment-mock-devices";
import { openPageSaveConfirmDialog } from "./page-save-confirm-dialog";
import { showPageSaveSuccessToast } from "./page-save-toast";
import { resolvePageSaveKey } from "./page-settings-draft";
import type { DeploymentConfigChange } from "./deployment-types";

const MSG_TYPE = "menusifu:iframe-save-deploy";
const MSG_RESULT = "menusifu:iframe-save-deploy-result";

export interface IframeSaveDeployRequest {
  type: typeof MSG_TYPE;
  pageKey: string;
  changes: DeploymentConfigChange[];
  requestId?: string;
}

let bridgeBound = false;

function isSaveDeployRequest(data: unknown): data is IframeSaveDeployRequest {
  if (!data || typeof data !== "object") return false;
  const msg = data as IframeSaveDeployRequest;
  return msg.type === MSG_TYPE && typeof msg.pageKey === "string" && Array.isArray(msg.changes);
}

function replyToSource(
  source: MessageEventSource | null,
  payload: { type: string; requestId?: string; ok: boolean; batchId?: string; reason?: string },
): void {
  if (!source || !("postMessage" in source)) return;
  try {
    (source as Window).postMessage(payload, "*");
  } catch {
    /* ignore */
  }
}

async function handleSaveDeploy(event: MessageEvent): Promise<void> {
  const data = event.data;
  if (!isSaveDeployRequest(data)) return;

  const pageKey = resolvePageSaveKey(data.pageKey);
  const requestId = data.requestId;
  const changes = data.changes.filter(Boolean);

  if (changes.length === 0) {
    replyToSource(event.source, {
      type: MSG_RESULT,
      requestId,
      ok: false,
      reason: "no-changes",
    });
    return;
  }

  clearPageConfigChanges(pageKey);
  for (const change of changes) {
    replacePageConfigChange(pageKey, {
      ...change,
      settingsPath: change.settingsPath ?? pageKey,
    });
  }

  const scope = await openPageSaveConfirmDialog(pageKey);
  if (!scope) {
    clearPageConfigChanges(pageKey);
    replyToSource(event.source, {
      type: MSG_RESULT,
      requestId,
      ok: false,
      reason: "cancelled",
    });
    return;
  }

  const resolvedScope = scope ?? resolveAutoDeploymentScope();
  if (!resolvedScope) {
    clearPageConfigChanges(pageKey);
    replyToSource(event.source, {
      type: MSG_RESULT,
      requestId,
      ok: false,
      reason: "no-scope",
    });
    return;
  }

  const originNav = resolveOriginNavFromPath(pageKey);
  const batch = createDeploymentFromPath(
    pageKey,
    resolvedScope.storeIds,
    resolvedScope.scopeLevel,
    resolvedScope.brandId,
    resolvedScope.brandName,
    originNav,
    "manual",
    changes,
  );
  clearPageConfigChanges(pageKey);
  showPageSaveSuccessToast(batch.id, changes.length);

  replyToSource(event.source, {
    type: MSG_RESULT,
    requestId,
    ok: true,
    batchId: batch.id,
  });
}

export function bindIframeSaveDeployBridge(): void {
  if (bridgeBound) return;
  bridgeBound = true;
  window.addEventListener("message", (event) => {
    void handleSaveDeploy(event);
  });
}
