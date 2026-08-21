/**
 * 页面级保存并下发
 */
import { resolveOriginNavFromPath } from "./deployment-config-domains";
import { createDeploymentFromPath } from "./deployment-store";
import {
  openPageSaveChangePreviewDialog,
  openPageSaveConfirmDialog,
} from "./page-save-confirm-dialog";
import { runPageSavePreCommit } from "./page-save-registry";
import { showPageSaveSuccessToast } from "./page-save-toast";
import {
  commitPageDraft,
  resolvePageSaveKey,
} from "./page-settings-draft";
import { getPageChangeCount } from "./deployment-change-buffer";
import type { DeploymentBatch } from "./deployment-types";

/** 保存并下发：先弹出「确认变更」，确认后再下发 */
export async function confirmAndTriggerPageSaveAndDeploy(
  pageKey: string,
): Promise<DeploymentBatch | null> {
  const key = resolvePageSaveKey(pageKey);

  if (!(await runPageSavePreCommit(key))) return null;
  if (getPageChangeCount(key) === 0) return null;

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

/** 仅预览待保存变更（「N 项待保存」入口） */
export async function previewPageSaveChanges(pageKey: string): Promise<void> {
  const key = resolvePageSaveKey(pageKey);
  if (!(await runPageSavePreCommit(key))) return;
  if (getPageChangeCount(key) === 0) return;
  await openPageSaveChangePreviewDialog(key);
}

/** @deprecated 使用 confirmAndTriggerPageSaveAndDeploy */
export function triggerPageSaveAndDeploy(pageKey: string): DeploymentBatch | null {
  void confirmAndTriggerPageSaveAndDeploy(pageKey);
  return null;
}

/** @deprecated 使用 confirmAndTriggerPageSaveAndDeploy */
export async function triggerPageSaveAndDeployDirect(
  pageKey: string,
): Promise<DeploymentBatch | null> {
  return confirmAndTriggerPageSaveAndDeploy(pageKey);
}
