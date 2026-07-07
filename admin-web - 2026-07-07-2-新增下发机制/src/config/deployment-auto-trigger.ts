/**
 * 配置保存后自动触发模拟下发（静默，无确认/进度弹窗）
 */
import { resolveDomainsForPath, resolveOriginNavFromPath } from "./deployment-config-domains";
import { resolveDeploymentScopeOptions } from "./deployment-mock-devices";
import { createDeploymentFromPath } from "./deployment-store";
import { readAppHashPath } from "./app-routes";

const DEBOUNCE_MS = 800;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPath: string | null = null;
let bound = false;

function scheduleIdleTask(task: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 2000 });
    return;
  }
  setTimeout(task, 0);
}

export function shouldAutoDeployForPath(path: string): boolean {
  if (path.startsWith("/settings/deployment-log")) return false;
  if (path.includes("distribution-log")) return false;
  const domains = resolveDomainsForPath(path);
  if (domains.length > 0) return true;
  if (/\/settings(\/|$)/.test(path) && !path.startsWith("/settings/")) return true;
  return false;
}

function runAutoDeployment(path: string): void {
  if (!shouldAutoDeployForPath(path)) return;
  const scope = resolveDeploymentScopeOptions()[0];
  if (!scope) return;
  const originNav = resolveOriginNavFromPath(path);
  createDeploymentFromPath(
    path,
    scope.storeIds,
    scope.scopeLevel,
    scope.brandId,
    scope.brandName,
    originNav,
    "auto",
  );
}

/** 配置已保存，调度自动下发（可指定页面路径，默认当前 hash 路径） */
export function notifyConfigSaved(path?: string): void {
  const p = path ?? readAppHashPath();
  pendingPath = p;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const target = pendingPath;
    pendingPath = null;
    if (target) scheduleIdleTask(() => runAutoDeployment(target));
  }, DEBOUNCE_MS);
}

export function bindDeploymentAutoTrigger(): void {
  if (bound) return;
  bound = true;

  window.addEventListener("menusifu:module-setting-changed", () => {
    notifyConfigSaved();
  });
}
