/**
 * 配置保存后触发下发：批量保存页仅标记脏状态，其他页保持即时下发。
 */
import { resolveDomainsForPath, resolveOriginNavFromPath } from "./deployment-config-domains";
import { consumeNextConfigChange } from "./deployment-change-buffer";
import { resolveAutoDeploymentScope } from "./deployment-mock-devices";
import { createDeploymentFromPath } from "./deployment-store";
import { readAppHashPath } from "./app-routes";
import {
  isPageBatchSavePath,
  resolvePageSaveKey,
} from "./page-settings-draft";
import type { DeploymentConfigChange, DeploymentScopeOption } from "./deployment-types";

let bound = false;

function scheduleIdleTask(task: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 2000 });
    return;
  }
  setTimeout(task, 0);
}

export function shouldAutoDeployForPath(path: string): boolean {
  if (isPageBatchSavePath(path)) return false;
  if (path.startsWith("/settings/deployment-log")) return false;
  if (path.includes("distribution-log")) return false;
  const domains = resolveDomainsForPath(path);
  if (domains.length > 0) return true;
  if (/\/settings(\/|$)/.test(path) && !path.startsWith("/settings/")) return true;
  return false;
}

function runAutoDeployment(
  path: string,
  scope: DeploymentScopeOption,
  change: DeploymentConfigChange,
): void {
  if (!shouldAutoDeployForPath(path)) return;
  const originNav = resolveOriginNavFromPath(path);
  createDeploymentFromPath(
    path,
    scope.storeIds,
    scope.scopeLevel,
    scope.brandId,
    scope.brandName,
    originNav,
    "auto",
    [change],
  );
}

function resolveDeploymentPath(change: DeploymentConfigChange, explicitPath?: string): string {
  const current = readAppHashPath();
  const base = change.settingsPath ?? explicitPath;
  if (base && (current === base || current.startsWith(`${base}/`))) {
    return current;
  }
  return base ?? current;
}

/** 配置已保存：批量保存页仅刷新保存栏，其他页立即调度下发 */
export function notifyConfigSaved(path?: string): void {
  const current = path ?? readAppHashPath();
  const pageKey = resolvePageSaveKey(current);
  if (isPageBatchSavePath(pageKey)) {
    window.dispatchEvent(
      new CustomEvent("menusifu:page-settings-dirty", { detail: { pageKey } }),
    );
    return;
  }

  const change = consumeNextConfigChange();
  if (!change) return;

  const p = resolveDeploymentPath(change, path);
  const scope = resolveAutoDeploymentScope();
  if (!scope) return;

  scheduleIdleTask(() => runAutoDeployment(p, scope, change));
}

export function bindDeploymentAutoTrigger(): void {
  if (bound) return;
  bound = true;

  window.addEventListener("menusifu:module-setting-changed", (e) => {
    const detail = (e as CustomEvent<{ settingsPath?: string }>).detail;
    notifyConfigSaved(detail?.settingsPath);
  });
}
