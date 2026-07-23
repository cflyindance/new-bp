/**
 * 页面级 / 即时下发 · 配置变更记录统一入口
 */
import {
  recordDeploymentConfigChange,
  replacePageConfigChange,
} from "./deployment-change-buffer";
import { notifyConfigSaved } from "./deployment-auto-trigger";
import type { DeploymentConfigChange } from "./deployment-types";
import {
  isPageBatchSavePath,
  resolvePageSaveKey,
  trackPageConfigChange,
} from "./page-settings-draft";

export function recordPageOrImmediateConfigChange(
  pagePath: string,
  change: DeploymentConfigChange,
): void {
  const pageKey = resolvePageSaveKey(pagePath);
  if (isPageBatchSavePath(pageKey)) {
    trackPageConfigChange(pageKey, pageKey, { ...change, settingsPath: pageKey });
    notifyConfigSaved(pageKey);
    return;
  }
  recordDeploymentConfigChange({ ...change, settingsPath: change.settingsPath ?? pageKey });
  notifyConfigSaved(change.settingsPath ?? pageKey);
}

/** 相对 baseline 全量重算时覆盖同 fieldKey（避免增量 merge 失真） */
export function replacePageOrImmediateConfigChange(
  pagePath: string,
  change: DeploymentConfigChange,
): void {
  const pageKey = resolvePageSaveKey(pagePath);
  if (isPageBatchSavePath(pageKey)) {
    replacePageConfigChange(pageKey, { ...change, settingsPath: change.settingsPath ?? pageKey });
    notifyConfigSaved(pageKey);
    return;
  }
  recordDeploymentConfigChange({ ...change, settingsPath: change.settingsPath ?? pageKey });
  notifyConfigSaved(change.settingsPath ?? pageKey);
}
