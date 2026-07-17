/**
 * 模拟下发 · 列表页与详情页
 */
import {
  ensureInPageDefaultStoreSelected,
  getScopedFilterOptions,
  readScopeFilters,
  resolveDefaultScopedStoreId,
  usesInPageStorePicker,
  writeScopeFilters,
} from "../auth/session-scope";
import { getUiLocale, t } from "../i18n";
import { readAppHashPath } from "./app-routes";
import {
  normalizeChangeForDisplay,
  renderChangePreviewDialog,
} from "./deployment-change-preview";
import { resolveDomainsForPath } from "./deployment-config-domains";
import { listMockStoresByIds } from "./deployment-mock-devices";
import {
  getDeploymentBatch,
  listDeploymentBatches,
  retryDeploymentFailedItems,
  seedDeploymentDemoData,
} from "./deployment-store";
import type {
  DeploymentBatch,
  DeploymentBatchStatus,
  DeploymentConfigChange,
} from "./deployment-types";

let listFilterStatus: DeploymentBatchStatus | "" = "";

export const DEPLOYMENT_LOG_PATH = "/settings/deployment-log";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveDeploymentViewStoreId(): string {
  if (usesInPageStorePicker()) {
    ensureInPageDefaultStoreSelected();
  }
  return readScopeFilters().store?.trim() || resolveDefaultScopedStoreId() || "";
}

function listBatchesForCurrentStore(): DeploymentBatch[] {
  const storeId = resolveDeploymentViewStoreId();
  return listDeploymentBatches({
    status: listFilterStatus || undefined,
    storeId: storeId || undefined,
  });
}

function renderCompactStoreFilter(): string {
  if (!usesInPageStorePicker()) return "";
  const locale = getUiLocale();
  const stores = getScopedFilterOptions().stores.filter((o) => !!o.value);
  const selected = resolveDeploymentViewStoreId();
  const options = stores
    .map((o) => {
      const label = escapeHtml(locale === "en" ? o.labelEn : o.labelZh);
      const selectedAttr = o.value === selected ? " selected" : "";
      return `<option value="${escapeHtml(o.value)}"${selectedAttr}>${label}</option>`;
    })
    .join("");

  return `
    <div class="flex shrink-0 items-center gap-2" data-deployment-store-filter-wrap>
      <label for="deployment-store-filter" class="shrink-0 text-sm text-muted-foreground">${escapeHtml(t("header.scopeStore"))}</label>
      <select
        id="deployment-store-filter"
        data-deployment-filter-store
        class="h-9 w-auto min-w-[10rem] max-w-[16rem] shrink-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="${escapeHtml(t("header.scopeStoreAria"))}"
      >
        ${
          stores.length
            ? options
            : `<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`
        }
      </select>
    </div>`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

type DisplayBatchStatus = "success" | "failed" | "in_progress";

function normalizeBatchStatus(status: DeploymentBatchStatus): DisplayBatchStatus {
  if (status === "success") return "success";
  if (status === "in_progress" || status === "pending") return "in_progress";
  return "failed";
}

function statusLabel(status: DeploymentBatchStatus): string {
  const normalized = normalizeBatchStatus(status);
  if (normalized === "success") return "成功";
  if (normalized === "in_progress") return "执行中";
  return "失败";
}

function statusBadgeClass(status: DeploymentBatchStatus): string {
  const normalized = normalizeBatchStatus(status);
  if (normalized === "success") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  }
  if (normalized === "in_progress") {
    return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  }
  return "bg-red-500/15 text-red-700 dark:text-red-400";
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

function originMenuLabel(batch: DeploymentBatch): string {
  const { l1Title, l2Title } = batch.originNav;
  if (l1Title && l2Title && l1Title !== l2Title) {
    return `${l1Title} / ${l2Title}`;
  }
  return l2Title || l1Title || "—";
}

function targetStoreLabel(
  batch: DeploymentBatch,
  preferredStoreId = resolveDeploymentViewStoreId(),
): string {
  const preferred = preferredStoreId.trim();
  if (preferred) {
    const item = batch.items.find((i) => i.storeId === preferred);
    if (item?.storeName) return item.storeName;
    const index = batch.storeIds.indexOf(preferred);
    if (index >= 0) {
      const snapshotName = batch.targetStoreNames?.[index];
      if (snapshotName) return snapshotName;
      const mock = listMockStoresByIds([preferred])[0];
      if (mock) return mock.storeName;
    }
  }
  if (batch.targetStoreNames?.[0]) return batch.targetStoreNames[0];
  if (batch.items[0]?.storeName) return batch.items[0].storeName;
  return listMockStoresByIds(batch.storeIds.slice(0, 1))[0]?.storeName || "—";
}

function itemsForViewStore(batch: DeploymentBatch): DeploymentBatch["items"] {
  const preferred = resolveDeploymentViewStoreId();
  if (!preferred) return batch.items;
  const filtered = batch.items.filter((i) => i.storeId === preferred);
  return filtered.length > 0 ? filtered : batch.items;
}

function configModuleLabel(batch: DeploymentBatch): string {
  const menuPath = originMenuLabel(batch);
  const moduleNames = [
    ...new Set(
      itemsForViewStore(batch)
        .map((item) => item.domainDisplayName?.trim())
        .filter((name): name is string => !!name),
    ),
  ];
  const modulePart =
    moduleNames.length > 0
      ? moduleNames.join("、")
      : Object.keys(batch.configVersions ?? {}).join("、");

  if (menuPath === "—" && !modulePart) return "—";
  if (!modulePart) return menuPath;
  if (menuPath === "—") return modulePart;

  const menuLeaf = batch.originNav.l2Title || batch.originNav.l1Title || "";
  if (moduleNames.length === 1 && moduleNames[0] === menuLeaf) return menuPath;
  if (modulePart === menuLeaf) return menuPath;
  return `${menuPath} / ${modulePart}`;
}

function renderOperatorCell(batch: DeploymentBatch): string {
  const email = batch.triggeredBy || "—";
  const name = batch.triggeredByName?.trim();
  if (name && name !== email) {
    return `
      <div class="leading-snug">
        <div class="text-card-foreground">${escapeHtml(name)}</div>
        <div class="text-xs text-muted-foreground">${escapeHtml(email)}</div>
      </div>`;
  }
  return `<span class="text-card-foreground">${escapeHtml(email)}</span>`;
}

function renderMultilineValue(value: string): string {
  return escapeHtml(value || "—").replace(/\n/g, "<br />");
}

function renderDeploymentChangeDialog(batch: DeploymentBatch): string {
  return renderChangePreviewDialog({
    mode: "view",
    changes: batch.configChanges ?? [],
    dialogId: "deployment-change-dialog",
    closeAttr: "data-deployment-change-close",
    backdropAttr: "data-deployment-change-backdrop",
  });
}

function closeDeploymentChangeDialog(): void {
  document.getElementById("deployment-change-dialog")?.remove();
}

function openDeploymentChangeDialog(batchId: string): void {
  const batch = getDeploymentBatch(batchId);
  if (!batch) return;
  closeDeploymentChangeDialog();
  const host = document.createElement("div");
  host.innerHTML = renderDeploymentChangeDialog(batch);
  const dialog = host.firstElementChild;
  if (!dialog) return;
  document.body.appendChild(dialog);
  (dialog as HTMLElement).focus({ preventScroll: true });
}

function renderConfigChangesTable(changes: DeploymentConfigChange[]): string {
  if (changes.length === 0) {
    return `<p class="m-0 text-sm text-muted-foreground">（无变更明细）</p>`;
  }
  const rows = changes
    .map((raw) => {
      const change = normalizeChangeForDisplay(raw);
      return `
        <tr class="border-b border-border last:border-0 align-top">
          <td class="px-4 py-2.5 font-medium text-card-foreground">${escapeHtml(change.label)}</td>
          <td class="px-4 py-2.5 text-muted-foreground">${escapeHtml(change.operation ?? "—")}</td>
          <td class="px-4 py-2.5 text-muted-foreground">${renderMultilineValue(change.before)}</td>
          <td class="px-4 py-2.5 text-card-foreground">${renderMultilineValue(change.after)}</td>
        </tr>`;
    })
    .join("");
  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead class="border-b border-border bg-muted/50">
          <tr>
            <th class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">功能</th>
            <th class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">操作</th>
            <th class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">修改前</th>
            <th class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">修改后</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderListRow(batch: DeploymentBatch): string {
  const canRetry = normalizeBatchStatus(batch.status) === "failed";
  return `
    <tr class="border-b border-border last:border-0 hover:bg-muted/30" data-deployment-row="${escapeHtml(batch.id)}">
      <td class="whitespace-nowrap px-4 py-3 text-sm text-card-foreground">${escapeHtml(formatDateTime(batch.triggeredAt))}</td>
      <td class="max-w-[20rem] px-4 py-3 text-sm text-card-foreground">${escapeHtml(configModuleLabel(batch))}</td>
      <td class="px-4 py-3 text-sm text-card-foreground">${escapeHtml(targetStoreLabel(batch))}</td>
      <td class="px-4 py-3 text-sm">${renderOperatorCell(batch)}</td>
      <td class="whitespace-nowrap px-4 py-3">
        <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(batch.status)}">${escapeHtml(statusLabel(batch.status))}</span>
      </td>
      <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
        <button type="button" data-deployment-changelog="${escapeHtml(batch.id)}" class="font-medium text-primary hover:underline">变更记录</button>
        <a href="#${escapeHtml(batch.originNav.pagePath)}" class="ml-3 font-medium text-primary hover:underline">源配置</a>
        ${canRetry ? `<button type="button" data-deployment-retry="${escapeHtml(batch.id)}" class="ml-3 font-medium text-primary hover:underline">重试</button>` : ""}
      </td>
    </tr>`;
}

function renderDetailTarget(target: {
  productLine: string;
  deviceName: string;
  status: string;
  errorDetail?: string;
}): string {
  const error = target.errorDetail
    ? `<span class="ml-2 text-xs text-red-600 dark:text-red-400">${escapeHtml(target.errorDetail)}</span>`
    : "";
  return `
    <li class="flex flex-wrap items-center gap-2 py-1 text-sm text-muted-foreground">
      <span class="font-mono text-xs">${targetStatusIcon(target.status)}</span>
      <span class="text-card-foreground">${escapeHtml(target.productLine)}</span>
      <span>·</span>
      <span>${escapeHtml(target.deviceName)}</span>
      ${error}
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
  const canRetry = normalizeBatchStatus(batch.status) === "failed";
  const progress = batch.simulatorMeta?.progressPercent ?? 0;
  const progressBar =
    normalizeBatchStatus(batch.status) === "in_progress"
      ? `<div class="mt-4">
          <div class="mb-1 flex justify-between text-xs text-muted-foreground"><span>下发进度</span><span>${progress}%</span></div>
          <div class="h-2 overflow-hidden rounded-full bg-muted"><div class="h-full rounded-full bg-primary transition-all" style="width:${progress}%"></div></div>
        </div>`
      : "";

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-deployment-detail-root data-deployment-batch-id="${escapeHtml(batch.id)}">
      <div class="shrink-0 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <a href="#${DEPLOYMENT_LOG_PATH}" class="text-sm text-primary hover:underline">← 返回列表</a>
          <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(batch.status)}">${escapeHtml(statusLabel(batch.status))}</span>
        </div>
        <dl class="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">下发时间</dt>
            <dd class="mt-1 text-card-foreground">${escapeHtml(formatDateTime(batch.triggeredAt))}</dd>
          </div>
          <div>
            <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">状态</dt>
            <dd class="mt-1 text-card-foreground">${escapeHtml(statusLabel(batch.status))}</dd>
          </div>
          <div>
            <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">操作账号</dt>
            <dd class="mt-1">${renderOperatorCell(batch)}</dd>
          </div>
          <div>
            <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">发起菜单</dt>
            <dd class="mt-1 text-card-foreground">${escapeHtml(originMenuLabel(batch))}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">目标门店</dt>
            <dd class="mt-1 text-card-foreground">${escapeHtml(targetStoreLabel(batch))}</dd>
          </div>
        </dl>
        ${progressBar}
        ${
          canRetry
            ? `<div class="mt-4 flex flex-wrap gap-2">
          <button type="button" data-deployment-retry="${escapeHtml(batch.id)}" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">重试失败项</button>
        </div>`
            : ""
        }
      </div>
      <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 class="mb-3 text-sm font-semibold text-card-foreground">配置变更</h2>
        ${renderConfigChangesTable(batch.configChanges ?? [])}
      </section>
      <div class="flex flex-col gap-3">${itemsForViewStore(batch).map(renderDetailItem).join("")}</div>
    </div>`;
}

function renderEmptyRow(): string {
  return `
    <tr>
      <td colspan="6" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无下发记录。修改配置并保存后，系统将自动触发下发并在此展示。</td>
    </tr>`;
}

function renderListPage(): string {
  const batches = listBatchesForCurrentStore();
  const title = "下发记录";
  const subtitle = "按当前配置门店展示下发至该店终端的操作及同步状态（演示环境模拟）。";
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-deployment-log-root>
      <div class="shrink-0 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
            <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">${escapeHtml(subtitle)}</p>
          </div>
          <button type="button" data-deployment-seed-reset class="rounded-lg border border-border px-3 py-2 text-sm text-card-foreground hover:bg-muted/50">重置演示数据</button>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          ${renderCompactStoreFilter()}
          <select data-deployment-filter-status class="h-9 rounded-md border border-input bg-background px-3 text-sm text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="" ${listFilterStatus === "" ? "selected" : ""}>全部状态</option>
            <option value="success" ${listFilterStatus === "success" ? "selected" : ""}>成功</option>
            <option value="failed" ${listFilterStatus === "failed" ? "selected" : ""}>失败</option>
            <option value="in_progress" ${listFilterStatus === "in_progress" ? "selected" : ""}>执行中</option>
          </select>
        </div>
      </div>
      <div class="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div class="module-settings-scroll-host max-h-full overflow-auto">
          <table class="w-full min-w-[56rem] border-collapse text-left" data-deployment-table>
            <thead class="sticky top-0 z-[1] border-b border-border bg-muted/80 backdrop-blur">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">下发时间</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">配置模块</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">目标门店</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">操作账号</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">状态</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody data-deployment-tbody>
              ${batches.length > 0 ? batches.map(renderListRow).join("") : renderEmptyRow()}
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
  const batches = listBatchesForCurrentStore();
  return batches.length > 0 ? batches.map(renderListRow).join("") : renderEmptyRow();
}

let deploymentLogRefreshRaf: number | null = null;

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
    if (target.closest("[data-deployment-change-close]") || target.closest("[data-deployment-change-backdrop]")) {
      closeDeploymentChangeDialog();
      return;
    }
    const changelogButton = target.closest<HTMLElement>("[data-deployment-changelog]");
    if (changelogButton?.dataset.deploymentChangelog) {
      openDeploymentChangeDialog(changelogButton.dataset.deploymentChangelog);
      return;
    }
    const retryButton = target.closest<HTMLElement>("[data-deployment-retry]");
    if (retryButton?.dataset.deploymentRetry) {
      retryDeploymentFailedItems(retryButton.dataset.deploymentRetry);
      refreshDeploymentUi(onRefresh);
      return;
    }
    const seedButton = target.closest<HTMLElement>("[data-deployment-seed-reset]");
    if (
      seedButton &&
      window.confirm("将清空当前记录并恢复演示种子数据，确定继续？")
    ) {
      seedDeploymentDemoData();
      refreshDeploymentUi(onRefresh);
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (!document.getElementById("deployment-change-dialog")) return;
    closeDeploymentChangeDialog();
  });

  document.body.addEventListener("change", (ev) => {
    const target = ev.target as HTMLElement;
    if (target.matches("[data-deployment-filter-store]")) {
      const storeId = (target as HTMLSelectElement).value;
      if (!storeId) return;
      writeScopeFilters({ ...readScopeFilters(), store: storeId });
      refreshDeploymentUi(onRefresh);
      return;
    }
    if (target.matches("[data-deployment-filter-status]")) {
      listFilterStatus = (target as HTMLSelectElement).value as
        | DeploymentBatchStatus
        | "";
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
