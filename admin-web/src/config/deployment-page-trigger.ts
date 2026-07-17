/**
 * 页面级保存并下发
 */
import { resolveOriginNavFromPath } from "./deployment-config-domains";
import { createDeploymentFromPath } from "./deployment-store";
import { openPageSaveConfirmDialog } from "./page-save-confirm-dialog";
import { runPageSavePreCommit } from "./page-save-registry";
import { showPageSaveSuccessToast } from "./page-save-toast";
import {
  commitPageDraft,
  resolvePageSaveKey,
} from "./page-settings-draft";
import { getPageChangeCount } from "./deployment-change-buffer";
import type { DeploymentBatch } from "./deployment-types";

export async function confirmAndTriggerPageSaveAndDeploy(
  pageKey: string,
): Promise<DeploymentBatch | null> {
  const key = resolvePageSaveKey(pageKey);

  if (!runPageSavePreCommit(key)) return null;

  const changeCount = getPageChangeCount(key);
  if (changeCount === 0) return null;

  const scope = await openPageSaveConfirmDialog(key);
  if (!scope) return null;

  const changes = commitPageDraft(key);
  if (changes.length === 0) return null;

  const path = changes[0]?.settingsPath ?? key;
  const originNav = resolveOriginNavFromPath(path);

  const batch = createDeploymentFromPath(
    path,
    scope.storeIds,
    scope.scopeLevel,
    scope.brandId,
    scope.brandName,
    originNav,
    "manual",
    changes,
  );

  showPageSaveSuccessToast(batch.id, changes.length);

  window.dispatchEvent(
    new CustomEvent("menusifu:page-settings-saved", {
      detail: { pageKey: key, batchId: batch.id },
    }),
  );

  return batch;
}

/** @deprecated 使用 confirmAndTriggerPageSaveAndDeploy */
export function triggerPageSaveAndDeploy(pageKey: string): DeploymentBatch | null {
  void confirmAndTriggerPageSaveAndDeploy(pageKey);
  return null;
}
