/**
 * 页面级 / 即时下发 · 配置变更记录统一入口
 */
import { recordDeploymentConfigChange } from "./deployment-change-buffer";
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
