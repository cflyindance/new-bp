/**
 * 模拟下发 · 列表页与详情页
 */
import { formatDeploymentDomainLabel, resolveDomainsForPath } from "./deployment-config-domains";
import {
  getDeploymentBatch,
  listDeploymentBatches,
  retryDeploymentFailedItems,
  seedDeploymentDemoData,
} from "./deployment-store";
import { readAppHashPath } from "./app-routes";
import type { DeploymentBatch, DeploymentBatchStatus } from "./deployment-types";

let listFilterStatus: DeploymentBatchStatus | "" = "";
let listFilterKeyword = "";

export const DEPLOYMENT_LOG_PATH = "/settings/deployment-log";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function statusLabel(status: DeploymentBatchStatus): string {
  const map: Record<DeploymentBatchStatus, string> = {
    pending: "等待中",
    in_progress: "进行中",
    partial_success: "部分成功",
    success: "成功",
    failed: "失败",
    cancelled: "已取消",
  };
  return map[status] ?? status;
}

function statusBadgeClass(status: DeploymentBatchStatus): string {
  switch (status) {
    case "success":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "partial_success":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "failed":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "in_progress":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function targetStatusIcon(status: string): string {
  if (status === "success") return "✓";
  if (status === "offline") return "⚠";
  if (status === "syncing" || status === "pushing") return "⟳";
  if (status === "failed") return "✗";
  return "○";
}

export function isDeploymentLogPath(path: string): boolean {
  return path === DEPLOYMENT_LOG_PATH || path.startsWith(`${DEPLOYMENT_LOG_PATH}/`);
}

/** 旧模块内「下发记录」路由统一重定向到系统设置 */
export function resolveLegacyDistributionLogRedirect(path: string): string | null {
  if (
    path.endsWith("/distribution-log") &&
    path !== DEPLOYMENT_LOG_PATH &&
    !path.startsWith(`${DEPLOYMENT_LOG_PATH}/`)
  ) {
    return DEPLOYMENT_LOG_PATH;
  }
  return null;
}

export function parseDeploymentDetailBatchId(path: string): string | null {
  if (!path.startsWith(`${DEPLOYMENT_LOG_PATH}/`)) return null;
  const id = path.slice(DEPLOYMENT_LOG_PATH.length + 1).split("/")[0];
  return id || null;
}

function successRate(batch: DeploymentBatch): string {
  if (batch.totalItems === 0) return "—";
  const rate = Math.round((batch.successCount / batch.totalItems) * 100);
  return `${rate}%`;
}

function domainSummary(batch: DeploymentBatch): string {
  const keys = Object.keys(batch.configVersions);
  if (keys.length === 0) return "—";
  return keys.map((k) => formatDeploymentDomainLabel(k)).join("、");
}

function renderListRow(batch: DeploymentBatch): string {
  const canRetry = batch.status === "failed" || batch.status === "partial_success";
  return `
    <tr class="border-b border-border last:border-0 hover:bg-muted/30" data-deployment-row="${escapeHtml(batch.id)}">
      <td class="whitespace-nowrap px-4 py-3 text-sm text-card-foreground">${escapeHtml(formatDateTime(batch.triggeredAt))}</td>
      <td class="px-4 py-3 text-sm text-card-foreground">${escapeHtml(batch.originNav.l2Title)}</td>
      <td class="px-4 py-3 text-sm text-muted-foreground">${escapeHtml(domainSummary(batch))}</td>
      <td class="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-muted-foreground">${batch.storeIds.length}</td>
      <td class="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-muted-foreground">${successRate(batch)}</td>
      <td class="whitespace-nowrap px-4 py-3">
        <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(batch.status)}">${escapeHtml(statusLabel(batch.status))}</span>
      </td>
      <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
        <a href="#${DEPLOYMENT_LOG_PATH}/${escapeHtml(batch.id)}" class="font-medium text-primary hover:underline">详情</a>
        ${canRetry ? `<button type="button" data-deployment-retry="${escapeHtml(batch.id)}" class="ml-3 font-medium text-primary hover:underline">重试</button>` : ""}
      </td>
    </tr>`;
}

function renderDetailTarget(target: { productLine: string; deviceName: string; status: string; errorDetail?: string }): string {
  const err = target.errorDetail
    ? `<span class="ml-2 text-xs text-red-600 dark:text-red-400">${escapeHtml(target.errorDetail)}</span>`
    : "";
  return `
    <li class="flex flex-wrap items-center gap-2 py-1 text-sm text-muted-foreground">
      <span class="font-mono text-xs">${targetStatusIcon(target.status)}</span>
      <span class="text-card-foreground">${escapeHtml(target.productLine)}</span>
      <span>·</span>
      <span>${escapeHtml(target.deviceName)}</span>
      ${err}
    </li>`;
}

function renderDetailItem(item: DeploymentBatch["items"][number]): string {
  const itemStatus =
    item.status === "success"
      ? "✓ 成功"
      : item.status === "failed" || item.status === "timeout"
        ? "✗ 失败"
        : item.status === "pushing"
          ? "⟳ 推送中"
          : "○ 等待";
  const targets = item.targets.map(renderDetailTarget).join("");
  return `
    <details class="rounded-lg border border-border bg-card" open>
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div>
          <span class="text-sm font-medium text-card-foreground">${escapeHtml(item.storeName)}</span>
          <span class="ml-2 text-xs text-muted-foreground">${escapeHtml(item.domainDisplayName)} v${item.configVersion}</span>
        </div>
        <span class="text-xs font-medium text-muted-foreground">${itemStatus}</span>
      </summary>
      <ul class="list-none border-t border-border px-4 py-2">${targets || `<li class="py-1 text-sm text-muted-foreground">无终端设备</li>`}</ul>
    </details>`;
}

function renderDetailPage(batch: DeploymentBatch): string {
  const canRetry = batch.status === "failed" || batch.status === "partial_success";
  const progress = batch.simulatorMeta?.progressPercent ?? 0;
  const progressBar =
    batch.status === "in_progress"
      ? `<div class="mt-4">
          <div class="mb-1 flex justify-between text-xs text-muted-foreground"><span>下发进度</span><span>${progress}%</span></div>
          <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary transition-all" style="width:${progress}%"></div></div>
        </div>`
      : "";

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-deployment-detail-root data-deployment-batch-id="${escapeHtml(batch.id)}">
      <div class="shrink-0 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <a href="#${DEPLOYMENT_LOG_PATH}" class="text-sm text-primary hover:underline">← 返回列表</a>
            <h2 class="mt-2 text-base font-semibold text-card-foreground">下发批次 ${escapeHtml(batch.id)}</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              ${escapeHtml(batch.originNav.l2Title)} · ${escapeHtml(batch.triggeredBy)} · ${escapeHtml(formatDateTime(batch.triggeredAt))}
            </p>
          </div>
          <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(batch.status)}">${escapeHtml(statusLabel(batch.status))}</span>
        </div>
        <p class="mt-3 text-sm text-muted-foreground">
          ${batch.storeIds.length} 家门店 · 成功 ${batch.successCount} · 失败 ${batch.failedCount} · 配置域：${escapeHtml(domainSummary(batch))}
        </p>
        ${progressBar}
        <div class="mt-4 flex flex-wrap gap-2">
          ${canRetry ? `<button type="button" data-deployment-retry="${escapeHtml(batch.id)}" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">重试失败项</button>` : ""}
          <a href="#${escapeHtml(batch.originNav.pagePath)}" class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted/50">查看源配置页</a>
        </div>
      </div>
      <div class="flex flex-col gap-3">${batch.items.map(renderDetailItem).join("")}</div>
    </div>`;
}

function renderListPage(): string {
  const batches = listDeploymentBatches({
    status: listFilterStatus || undefined,
    keyword: listFilterKeyword || undefined,
  });
  const title = "下发记录";
  const subtitle = "记录配置保存后系统自动下发至终端的操作及同步状态（演示环境模拟）。";

  const emptyRow = `
    <tr>
      <td colspan="7" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无下发记录。修改配置并保存后，系统将自动触发下发并在此展示。</td>
    </tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-deployment-log-root>
      <div class="shrink-0 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
            <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">${escapeHtml(subtitle)}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" data-deployment-seed-reset class="rounded-lg border border-border px-3 py-2 text-sm text-card-foreground hover:bg-muted/50">重置演示数据</button>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <select data-deployment-filter-status class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground">
            <option value="" ${listFilterStatus === "" ? "selected" : ""}>全部状态</option>
            <option value="success" ${listFilterStatus === "success" ? "selected" : ""}>成功</option>
            <option value="partial_success" ${listFilterStatus === "partial_success" ? "selected" : ""}>部分成功</option>
            <option value="failed" ${listFilterStatus === "failed" ? "selected" : ""}>失败</option>
            <option value="in_progress" ${listFilterStatus === "in_progress" ? "selected" : ""}>进行中</option>
          </select>
          <input type="search" data-deployment-filter-keyword placeholder="搜索批次 / 菜单 / 操作人" value="${escapeHtml(listFilterKeyword)}" class="min-w-[12rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground" />
        </div>
      </div>
      <div class="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div class="module-settings-scroll-host max-h-full overflow-auto">
          <table class="w-full min-w-[52rem] border-collapse text-left" data-deployment-table>
            <thead class="sticky top-0 z-[1] border-b border-border bg-muted/80 backdrop-blur">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">时间</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">发起菜单</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">配置域</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">门店数</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">成功率</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">状态</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody data-deployment-tbody>
              ${batches.length > 0 ? batches.map(renderListRow).join("") : emptyRow}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

export function renderDeploymentLogPage(path: string): string {
  const batchId = parseDeploymentDetailBatchId(path);
  if (batchId) {
    const batch = getDeploymentBatch(batchId);
    if (!batch) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p class="text-sm text-muted-foreground">未找到下发批次 <code class="font-mono text-xs">${escapeHtml(batchId)}</code></p>
          <a href="#${DEPLOYMENT_LOG_PATH}" class="mt-3 inline-block text-sm text-primary hover:underline">返回列表</a>
        </div>`;
    }
    return renderDetailPage(batch);
  }

  return renderListPage();
}

function renderListTableBody(): string {
  const batches = listDeploymentBatches({
    status: listFilterStatus || undefined,
    keyword: listFilterKeyword || undefined,
  });
  const emptyRow = `
    <tr>
      <td colspan="7" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无下发记录。修改配置并保存后，系统将自动触发下发并在此展示。</td>
    </tr>`;
  return batches.length > 0 ? batches.map(renderListRow).join("") : emptyRow;
}

let deploymentLogRefreshRaf: number | null = null;

/** 仅在下发记录页就地刷新 DOM，避免全站 mount 导致闪烁 */
export function refreshDeploymentLogView(): boolean {
  const path = readAppHashPath();
  if (!isDeploymentLogPath(path)) return false;

  if (deploymentLogRefreshRaf != null) {
    cancelAnimationFrame(deploymentLogRefreshRaf);
  }

  deploymentLogRefreshRaf = requestAnimationFrame(() => {
    deploymentLogRefreshRaf = null;
    const currentPath = readAppHashPath();
    if (!isDeploymentLogPath(currentPath)) return;

    const batchId = parseDeploymentDetailBatchId(currentPath);
    if (batchId) {
      const root = document.querySelector("[data-deployment-detail-root]");
      const batch = getDeploymentBatch(batchId);
      if (root && batch) {
        root.outerHTML = renderDetailPage(batch);
      }
      return;
    }

    const tbody = document.querySelector("[data-deployment-tbody]");
    if (!tbody) return;
    const scrollHost = tbody.closest<HTMLElement>(".module-settings-scroll-host");
    const scrollTop = scrollHost?.scrollTop ?? 0;
    tbody.innerHTML = renderListTableBody();
    if (scrollHost) scrollHost.scrollTop = scrollTop;
  });

  return true;
}

export function shouldShowDeploymentTrigger(path: string): boolean {
  if (isDeploymentLogPath(path)) return false;
  if (path.includes("distribution-log")) return false;
  const domains = resolveDomainsForPath(path);
  if (domains.length > 0) return true;
  if (/\/settings(\/|$)/.test(path) && !path.startsWith("/settings/")) return true;
  return false;
}

let deploymentUiBound = false;

function refreshDeploymentUi(onRefresh: () => void): void {
  if (refreshDeploymentLogView()) return;
  onRefresh();
}

export function bindDeploymentUi(onRefresh: () => void): void {
  if (deploymentUiBound) return;
  deploymentUiBound = true;

  document.body.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    const retryBtn = target.closest<HTMLElement>("[data-deployment-retry]");
    if (retryBtn?.dataset.deploymentRetry) {
      retryDeploymentFailedItems(retryBtn.dataset.deploymentRetry);
      refreshDeploymentUi(onRefresh);
      return;
    }
    const seedBtn = target.closest<HTMLElement>("[data-deployment-seed-reset]");
    if (seedBtn) {
      if (window.confirm("将清空当前记录并恢复演示种子数据，确定继续？")) {
        seedDeploymentDemoData();
        refreshDeploymentUi(onRefresh);
      }
    }
  });

  document.body.addEventListener("change", (ev) => {
    const target = ev.target as HTMLElement;
    if (target.matches("[data-deployment-filter-status]")) {
      listFilterStatus = (target as HTMLSelectElement).value as DeploymentBatchStatus | "";
      refreshDeploymentUi(onRefresh);
    }
  });

  document.body.addEventListener("input", (ev) => {
    const target = ev.target as HTMLElement;
    if (target.matches("[data-deployment-filter-keyword]")) {
      listFilterKeyword = (target as HTMLInputElement).value;
      refreshDeploymentUi(onRefresh);
    }
  });

  const onDeploymentEvent = (): void => {
    refreshDeploymentLogView();
  };
  window.removeEventListener("menusifu:deployment-updated", onDeploymentEvent);
  window.addEventListener("menusifu:deployment-updated", onDeploymentEvent);
  window.removeEventListener("menusifu:deployment-completed", onDeploymentEvent);
  window.addEventListener("menusifu:deployment-completed", onDeploymentEvent);
  window.removeEventListener("menusifu:deployment-created", onDeploymentEvent);
  window.addEventListener("menusifu:deployment-created", onDeploymentEvent);
}
