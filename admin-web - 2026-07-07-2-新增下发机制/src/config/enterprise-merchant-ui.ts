/**
 * M 平台 · 入驻品牌管理中心 · 页面 UI
 */
import {
  ENTERPRISE_MERCHANT_ROUTE_PREFIX,
  isMerchantListPath,
  isStoreListPath,
  isGroupMgmtPath,
  merchantDetailHref,
  merchantGroupEditHref,
  merchantHref,
  parseGroupFormPath,
  parseMerchantDetailPath,
  type MerchantDetailTab,
} from "./enterprise-merchant-scope";
import { DEFAULT_ENTERPRISE_ID, getActiveEnterprise, listEnterprises, readActiveEnterpriseId, writeActiveEnterpriseId } from "./enterprise-merchant-enterprise-context";
import {
  apiGetMerchantReports,
  apiListMerchants,
  apiPostCrmSync,
  getMerchantApiCallLog,
  merchantApiPath,
} from "./enterprise-merchant-api";
import {
  businessTypeLabel,
  approvePosStoreRequest,
  approveProvisioningRequest,
  cancelMerchantClosing,
  completeMerchantOnboarding,
  countStoresForMerchant,
  createGroup,
  createMerchant,
  countMerchantsForGroup,
  deleteGroup,
  finalizeMerchantClosing,
  getBusinessTypeOptions,
  getClosingDaysRemaining,
  getMerchantBrands,
  getMerchantById,
  getMerchantCapability,
  getMerchantChangelog,
  getMerchantOrgTypeLabel,
  getMerchantOverviewStats,
  getMerchantRegions,
  getMerchantStatusLabel,
  getMerchantStores,
  getMerchantSlaMetrics,
  getMerchantReportSummary,
  getMerchantTodos,
  getMerchants,
  getGroups,
  getGroupById,
  getGroupName,
  getEnterpriseStoreList,
  getGroupsForSelect,
  getPosStoreRequests,
  getProductLineOptions,
  getProvisioningRequests,
  getContractStatusLabel,
  getLicenseStatusLabel,
  getStoreStatusLabel,
  initiateMerchantClosing,
  licenseStatusBadgeClass,
  listMountableMerchantsForOrg,
  mountMerchantToOrg,
  productLineLabel,
  recordMerchantPresetSyncOnly,
  rejectPosStoreRequest,
  rejectProvisioningRequest,
  renewMerchantContract,
  saveMerchantCapability,
  sendOnboardingInvite,
  statusBadgeClass,
  submitPosStoreRequest,
  submitProvisioningRequest,
  syncMerchantFromCrm,
  syncMerchantCapabilityPresets,
  updateMerchantStatus,
  updateMerchantStoreStatus,
  updateGroup,
} from "./enterprise-merchant-store";
import { canImpersonateMerchant, enterMerchantBackendAsImpersonator } from "./enterprise-merchant-impersonate";
import {
  buildIncludedServiceTreeIndex,
  buildPaidServiceTreeIndex,
  capabilityToServiceSelections,
  cascadeMerchantServiceSelection,
  countEnabledL1,
  resolveMerchantServiceProductLine,
} from "./enterprise-merchant-services";
import type { ProductLineId } from "./platform-preset-catalog";
import { getEffectivePresetModuleTier } from "./platform-preset-recommendations";
import type { PlatformPresetNodeSelection } from "./platform-preset-node-selection";
import { findL2Node } from "./permission-four-column-nav";
import {
  bindFourColumnMatrix,
  FOUR_COLUMN_HEADERS,
  readFourColumnSelection,
  renderFourColumnMatrix,
  renderFourColumnMatrixShell,
} from "./permission-four-column-ui";
import type {
  CreateGroupInput,
  CreateMerchantInput,
  EnterpriseGroup,
  EnterpriseMerchant,
  EnterpriseStoreListRow,
  GroupFilter,
  MerchantFilter,
  MerchantOrgStoreStatus,
  MerchantStatus,
  SubmitProvisioningRequestInput,
  UpdateGroupInput,
} from "./enterprise-merchant-types";
import { hardwareHref } from "./enterprise-hardware-scope";

/** 集团管理页固定展示米聚企业（该页无 Enterprise 切换器） */
function groupMgmtFilter(extra: GroupFilter = {}): GroupFilter {
  return { ...extra, enterpriseId: DEFAULT_ENTERPRISE_ID };
}

/** 品牌列表展示全部 Enterprise 下的品牌（不含连锁挂载的门店租户） */
function listMerchantsFilter(extra: MerchantFilter = {}): MerchantFilter {
  return { ...extra, allEnterprises: true, excludeLinkedStoreTenants: true };
}

/** 门店列表展示全部 Enterprise 下、全部集团、全部品牌的门店 */
function listEnterpriseStoresFilter(
  extra: Parameters<typeof getEnterpriseStoreList>[0] = {},
): Parameters<typeof getEnterpriseStoreList>[0] {
  return { ...extra, allEnterprises: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function card(content: string): string {
  return `<div class="rounded-xl border border-border bg-card p-4 shadow-sm">${content}</div>`;
}

function renderEnterpriseContextBar(): string {
  const active = getActiveEnterprise();
  const options = listEnterprises()
    .map(
      (e) =>
        `<option value="${escapeHtml(e.enterpriseId)}"${e.enterpriseId === active.enterpriseId ? " selected" : ""}>${escapeHtml(e.name)} (${escapeHtml(e.region)})</option>`,
    )
    .join("");
  return `
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3" data-enterprise-merchant-context-bar>
      <div>
        <p class="text-xs text-muted-foreground">当前 Enterprise（多租户隔离 · P3）</p>
        <p class="text-sm font-medium">${escapeHtml(active.name)} <span class="font-mono text-xs text-muted-foreground">${escapeHtml(active.enterpriseId)}</span></p>
      </div>
      <label class="flex min-w-[14rem] flex-col gap-1">
        <span class="text-xs text-muted-foreground">切换 Enterprise</span>
        <select data-enterprise-merchant-context-select class="h-9 rounded-md border border-input bg-background px-2 text-sm">${options}</select>
      </label>
    </div>`;
}

function wrapMerchantPage(content: string, opts?: { hideEnterpriseBar?: boolean }): string {
  const bar = opts?.hideEnterpriseBar ? "" : renderEnterpriseContextBar();
  return `<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">${bar}<div class="flex min-h-0 flex-1 flex-col overflow-hidden">${content}</div></div>`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso;
  }
}

function renderOverviewPage(): string {
  const stats = getMerchantOverviewStats();
  const recent = getMerchants().slice(0, 5);
  const todos = getMerchantTodos().slice(0, 8);
  const kpi = (label: string, value: number | string, sub?: string) => `
    <div class="rounded-xl border border-border bg-card p-4">
      <p class="text-xs text-muted-foreground">${escapeHtml(label)}</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums">${escapeHtml(String(value))}</p>
      ${sub ? `<p class="mt-1 text-xs text-muted-foreground">${escapeHtml(sub)}</p>` : ""}
    </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        企业名下入驻品牌全生命周期治理 · 多 Enterprise 隔离、License 自动暂停、CRM 合同与 SLA 报表（P3 演示）。
      </p>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi("入驻品牌", stats.total, `在营 ${stats.active} · 待引导 ${stats.onboarding}`)}
        ${kpi("门店总数", stats.storeCount)}
        ${kpi("已暂停", stats.suspended)}
        ${kpi("合同即将到期", stats.expiringSoon, "30 天内")}
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="${merchantHref("/new")}" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">新建品牌</a>
        <a href="${merchantHref("/requests")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">开通申请 / 待办</a>
        <a href="${merchantHref("/reports")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">报表 / SLA</a>
        <a href="${merchantHref("")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">品牌列表</a>
        <a href="${merchantHref("/stores")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">门店列表</a>
      </div>
      ${
        todos.length
          ? card(`
        <h2 class="text-sm font-semibold text-card-foreground">待办队列</h2>
        <ul class="mt-3 space-y-2">
          ${todos
            .map(
              (todo) =>
                `<li class="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div class="min-w-0">
                <a href="${merchantHref(todo.href.startsWith(ENTERPRISE_MERCHANT_ROUTE_PREFIX) ? todo.href.slice(ENTERPRISE_MERCHANT_ROUTE_PREFIX.length) : todo.href)}" class="text-sm font-medium text-primary hover:underline">${escapeHtml(todo.title)}</a>
                <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(todo.detail)}</p>
              </div>
              <span class="shrink-0 text-[10px] uppercase tracking-wide ${todo.priority === "high" ? "text-destructive" : "text-muted-foreground"}">${todo.priority === "high" ? "紧急" : "普通"}</span>
            </li>`,
            )
            .join("")}
        </ul>
        <a href="${merchantHref("/requests")}" class="mt-3 inline-block text-xs text-primary hover:underline">查看全部待办 →</a>
      `)
          : ""
      }
      ${card(`
        <h2 class="text-sm font-semibold text-card-foreground">最近品牌</h2>
        <ul class="mt-3 space-y-2">
          ${recent
            .map(
              (m) =>
                `<li class="flex items-center justify-between gap-2 text-sm">
              <a href="${merchantDetailHref(m.merchantId)}" class="text-primary hover:underline truncate">${escapeHtml(m.name)}</a>
              <span class="shrink-0 text-xs text-muted-foreground">${escapeHtml(getMerchantStatusLabel(m.status))} · ${countStoresForMerchant(m.merchantId)} 店</span>
            </li>`,
            )
            .join("")}
        </ul>
      `)}
    </div>`;
}

function renderGroupsTable(groups: ReturnType<typeof getGroups>): string {
  if (groups.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">暂无集团，请先新建集团后再创建品牌。</p>`;
  }
  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[40rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2.5 font-medium">集团名称</th>
            <th class="px-3 py-2.5 font-medium">编码</th>
            <th class="px-3 py-2.5 font-medium">品牌数</th>
            <th class="px-3 py-2.5 font-medium">状态</th>
            <th class="px-3 py-2.5 font-medium">说明</th>
            <th class="px-3 py-2.5 font-medium">创建时间</th>
            <th class="px-3 py-2.5 font-medium w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${groups
            .map(
              (g) => `
            <tr class="hover:bg-muted/30">
              <td class="px-3 py-2.5 font-medium">${escapeHtml(g.name)}</td>
              <td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">${escapeHtml(g.code)}</td>
              <td class="px-3 py-2.5 tabular-nums">${countMerchantsForGroup(g.groupId)}</td>
              <td class="px-3 py-2.5">${g.status === "active" ? '<span class="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">在营</span>' : '<span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">停用</span>'}</td>
              <td class="px-3 py-2.5 text-xs text-muted-foreground">${escapeHtml(g.description ?? "—")}</td>
              <td class="px-3 py-2.5 text-xs text-muted-foreground">${formatDate(g.createdAt)}</td>
              <td class="px-3 py-2.5">
                <div class="flex flex-wrap gap-2">
                  <a href="${merchantGroupEditHref(g.groupId)}" class="text-xs text-primary hover:underline">编辑</a>
                  <button type="button" data-group-delete="${escapeHtml(g.groupId)}" data-group-name="${escapeHtml(g.name)}" class="text-xs text-destructive hover:underline">删除</button>
                </div>
              </td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderGroupsListPage(): string {
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-enterprise-merchant-page="groups">
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-3">
        <a href="${merchantHref("/groups/new")}" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">新建集团</a>
      </div>
      <form class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4" data-enterprise-group-filter-form>
        <label class="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span class="text-xs text-muted-foreground">搜索</span>
          <input type="search" name="query" data-group-filter="query" placeholder="名称 / 编码" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
      </form>
      <div class="min-h-0 flex-1 overflow-y-auto" data-enterprise-group-table>
        ${renderGroupsTable(getGroups(groupMgmtFilter()))}
      </div>
    </div>`;
}

function renderGroupFormPage(group?: EnterpriseGroup): string {
  const isEdit = !!group;
  const title = isEdit ? "编辑集团" : "新建集团";
  const subtitle = isEdit
    ? "修改集团名称与说明；集团编码创建后不可变更。"
    : "创建集团后，可在「新建品牌」时选择所属集团。";
  const submitLabel = isEdit ? "保存" : "创建集团";
  const codeField = isEdit
    ? `<label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">集团编码</span>
              <input name="code" value="${escapeHtml(group.code)}" readonly class="h-9 cursor-not-allowed rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground" />
            </label>`
    : `<label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">集团编码</span>
              <input name="code" class="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="留空自动生成" />
            </label>`;
  const statusField = isEdit
    ? `<label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">状态</span>
              <select name="status" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="active"${group.status === "active" ? " selected" : ""}>在营</option>
                <option value="inactive"${group.status === "inactive" ? " selected" : ""}>停用</option>
              </select>
            </label>`
    : "";

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-enterprise-merchant-page="groups-form">
      <a href="${merchantHref("/groups")}" class="text-sm text-primary hover:underline">← 返回集团管理</a>
      ${card(`
        <h2 class="text-sm font-semibold text-card-foreground">${title}</h2>
        <p class="mt-1 text-sm text-muted-foreground">${subtitle}</p>
        <form class="mt-4 space-y-4" data-enterprise-group-form${group ? ` data-group-id="${escapeHtml(group.groupId)}"` : ""}>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-xs text-muted-foreground">集团名称 *</span>
              <input name="name" required value="${group ? escapeHtml(group.name) : ""}" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            ${codeField}
            ${statusField}
            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-xs text-muted-foreground">说明</span>
              <textarea name="description" rows="2" class="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="可选">${group?.description ? escapeHtml(group.description) : ""}</textarea>
            </label>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button type="submit" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">${submitLabel}</button>
            <a href="${merchantHref("/groups")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">取消</a>
            ${
              isEdit
                ? `<button type="button" data-group-delete="${escapeHtml(group.groupId)}" data-group-name="${escapeHtml(group.name)}" class="ml-auto inline-flex h-9 items-center rounded-md border border-destructive/40 px-4 text-sm text-destructive hover:bg-destructive/10">删除集团</button>`
                : ""
            }
          </div>
        </form>
      `)}
    </div>`;
}

function renderNewGroupPage(): string {
  return renderGroupFormPage();
}

function renderEditGroupPage(groupId: string): string {
  const group = getGroupById(groupId, DEFAULT_ENTERPRISE_ID);
  if (!group) {
    return `
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <a href="${merchantHref("/groups")}" class="text-sm text-primary hover:underline">← 返回集团管理</a>
        <p class="text-sm text-muted-foreground">集团不存在或无权访问。</p>
      </div>`;
  }
  return renderGroupFormPage(group);
}

/** M 平台品牌列表统一按连锁品牌展示（单店亦视为 1 店连锁） */
const MERCHANT_LIST_CHAIN_ORG_LABEL = "连锁";

function renderMerchantBrandStoreTable(
  merchantId: string,
  stores: ReturnType<typeof getMerchantStores>,
): string {
  if (!stores.length) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">该品牌下暂无门店</p>`;
  }
  const regions = getMerchantRegions(merchantId);
  const regionNameById = new Map(regions.map((r) => [r.regionId, r.name]));
  const sorted = [...stores].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return `
    <div class="overflow-x-auto">
      <table class="w-full min-w-[40rem] text-sm">
        <thead class="bg-muted/30 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-4 py-2 font-medium">门店名称</th>
            <th class="px-4 py-2 font-medium">门店 MID</th>
            <th class="px-4 py-2 font-medium">编码</th>
            <th class="px-4 py-2 font-medium">区域</th>
            <th class="px-4 py-2 font-medium">地址</th>
            <th class="px-4 py-2 font-medium">门店状态</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${sorted
            .map((store) => {
              const regionName = regionNameById.get(store.regionId) ?? "—";
              return `<tr class="hover:bg-muted/20">
                <td class="px-4 py-2.5 font-medium">${escapeHtml(store.name)}</td>
                <td class="px-4 py-2.5 font-mono text-xs">${escapeHtml(store.storeId)}</td>
                <td class="px-4 py-2.5 text-xs">${escapeHtml(store.code)}</td>
                <td class="px-4 py-2.5 text-xs">${escapeHtml(regionName)}</td>
                <td class="px-4 py-2.5 max-w-[14rem] truncate text-xs text-muted-foreground" title="${escapeHtml(store.address ?? "")}">${escapeHtml(store.address ?? "—")}</td>
                <td class="px-4 py-2.5">${renderStoreStatusBadge(store.status)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderMerchantBrandStoresDialog(merchant: NonNullable<ReturnType<typeof getMerchantById>>): string {
  const stores = getMerchantStores(merchant.merchantId);
  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  const subtitle = [
    getGroupName(merchant.groupId),
    merchant.bid ? `BID ${merchant.bid}` : "",
    `${stores.length} 家门店`,
  ]
    .filter(Boolean)
    .join(" · ");

  return `
    <div
      id="enterprise-merchant-stores-dialog"
      class="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enterprise-merchant-stores-dialog-title"
      tabindex="-1"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        data-merchant-stores-dialog-backdrop
        aria-label="关闭"
      ></button>
      <div class="relative z-[1] flex max-h-[min(92dvh,40rem)] w-full max-w-4xl min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="min-w-0">
            <h2 id="enterprise-merchant-stores-dialog-title" class="truncate text-base font-semibold text-card-foreground">${escapeHtml(merchant.name)} · 门店列表</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(subtitle)}</p>
          </div>
          <button
            type="button"
            data-merchant-stores-dialog-close
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="关闭"
          >
            ${closeIcon}
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-auto px-1 py-1">
          ${renderMerchantBrandStoreTable(merchant.merchantId, stores)}
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-3">
          <a href="${merchantDetailHref(merchant.merchantId)}" class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">品牌详情</a>
          <button type="button" data-merchant-stores-dialog-close class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">关闭</button>
        </div>
      </div>
    </div>`;
}

function closeMerchantBrandStoresDialog(): void {
  document.getElementById("enterprise-merchant-stores-dialog")?.remove();
}

function openMerchantBrandStoresDialog(merchantId: string): void {
  const merchant = getMerchantById(merchantId);
  if (!merchant) return;
  closeMerchantBrandStoresDialog();
  const host = document.createElement("div");
  host.innerHTML = renderMerchantBrandStoresDialog(merchant);
  const dialog = host.firstElementChild;
  if (!dialog) return;
  document.body.appendChild(dialog);
  (dialog as HTMLElement).focus({ preventScroll: true });
}

let merchantBrandStoresDialogBound = false;

function bindMerchantBrandStoresDialog(): void {
  if (merchantBrandStoresDialogBound) return;
  merchantBrandStoresDialogBound = true;

  document.body.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    if (
      target.closest("[data-merchant-stores-dialog-close]") ||
      target.closest("[data-merchant-stores-dialog-backdrop]")
    ) {
      closeMerchantBrandStoresDialog();
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (document.getElementById("enterprise-merchant-stores-dialog")) {
      closeMerchantBrandStoresDialog();
    }
  });
}

function renderMerchantTable(merchants: ReturnType<typeof getMerchants>): string {
  if (merchants.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">暂无匹配品牌</p>`;
  }
  return `
    <div class="overflow-x-auto rounded-xl border border-border" data-enterprise-merchant-chain-list>
      <table class="w-full min-w-[56rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2.5 font-medium">品牌名称</th>
            <th class="px-3 py-2.5 font-medium">品牌 BID</th>
            <th class="px-3 py-2.5 font-medium">状态</th>
            <th class="px-3 py-2.5 font-medium">门店</th>
            <th class="px-3 py-2.5 border-l border-border/60 font-medium">所属集团</th>
            <th class="px-3 py-2.5 border-l border-border/60 font-medium">类型</th>
            <th class="px-3 py-2.5 font-medium">编码</th>
            <th class="px-3 py-2.5 border-l border-border/60 font-medium">主管理员</th>
            <th class="px-3 py-2.5 font-medium">开通时间</th>
            <th class="px-3 py-2.5 font-medium w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${merchants
            .map((m) => {
              const storeCount = countStoresForMerchant(m.merchantId);
              return `<tr class="hover:bg-muted/30" data-enterprise-merchant-row="${escapeHtml(m.merchantId)}">
              <td class="px-3 py-2.5 font-medium">${escapeHtml(m.name)}</td>
              <td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">${escapeHtml(m.bid ?? "—")}</td>
              <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(m.status)}">${escapeHtml(getMerchantStatusLabel(m.status))}</span></td>
              <td class="px-3 py-2.5">
                <button
                  type="button"
                  data-merchant-view-stores="${escapeHtml(m.merchantId)}"
                  class="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  查看门店
                  <span class="tabular-nums text-muted-foreground">(${storeCount})</span>
                </button>
              </td>
              <td class="px-3 py-2.5 border-l border-border/40 text-xs">${escapeHtml(getGroupName(m.groupId))}</td>
              <td class="px-3 py-2.5 border-l border-border/40">${MERCHANT_LIST_CHAIN_ORG_LABEL}</td>
              <td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">${escapeHtml(m.code)}</td>
              <td class="px-3 py-2.5 border-l border-border/40 text-xs">${escapeHtml(m.primaryAdminEmail ?? "—")}</td>
              <td class="px-3 py-2.5 text-xs text-muted-foreground">${formatDate(m.activatedAt ?? m.createdAt)}</td>
              <td class="px-3 py-2.5">
                <div class="flex flex-wrap gap-2">
                  <a href="${merchantDetailHref(m.merchantId)}" class="text-primary text-xs hover:underline">详情</a>
                  ${
                    canImpersonateMerchant(m)
                      ? `<button type="button" data-merchant-impersonate="${escapeHtml(m.merchantId)}" class="text-xs text-muted-foreground hover:text-foreground">代登录</button>`
                      : ""
                  }
                </div>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function storeStatusBadgeClass(status: MerchantOrgStoreStatus): string {
  if (status === "open") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "preparing") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (status === "closed") return "bg-muted text-muted-foreground";
  return "bg-muted/80 text-muted-foreground";
}

function renderStoreStatusBadge(status: MerchantOrgStoreStatus): string {
  return `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${storeStatusBadgeClass(status)}">${escapeHtml(getStoreStatusLabel(status))}</span>`;
}

function renderEnterpriseStoreTable(rows: EnterpriseStoreListRow[]): string {
  if (rows.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">暂无匹配门店</p>`;
  }
  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[64rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2.5 font-medium">门店名称</th>
            <th class="px-3 py-2.5 font-medium">门店 MID</th>
            <th class="px-3 py-2.5 font-medium">门店状态</th>
            <th class="px-3 py-2.5 border-l border-border/60 font-medium">所属品牌</th>
            <th class="px-3 py-2.5 font-medium">品牌 BID</th>
            <th class="px-3 py-2.5 border-l border-border/60 font-medium">所属集团</th>
            <th class="px-3 py-2.5 border-l border-border/60 font-medium">区域</th>
            <th class="px-3 py-2.5 font-medium">地址</th>
            <th class="px-3 py-2.5 font-medium">编码</th>
            <th class="px-3 py-2.5 font-medium w-16"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${rows
            .map((row) => {
              const mountNote = row.linkedMerchantName
                ? `<span class="block text-xs text-muted-foreground">挂载品牌：${escapeHtml(row.linkedMerchantName)}</span>`
                : "";
              return `
            <tr class="hover:bg-muted/30">
              <td class="px-3 py-2.5 font-medium">
                ${escapeHtml(row.store.name)}
                ${mountNote}
              </td>
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHtml(row.store.storeId)}</td>
              <td class="px-3 py-2.5">${renderStoreStatusBadge(row.store.status)}</td>
              <td class="px-3 py-2.5 border-l border-border/40 font-medium">
                <a href="${merchantDetailHref(row.merchantId)}" class="text-primary hover:underline">${escapeHtml(row.merchantName)}</a>
              </td>
              <td class="px-3 py-2.5 font-mono text-xs text-muted-foreground">${escapeHtml(row.merchantBid ?? "—")}</td>
              <td class="px-3 py-2.5 border-l border-border/40 text-xs">${escapeHtml(row.groupName)}</td>
              <td class="px-3 py-2.5 border-l border-border/40 text-xs">${escapeHtml(row.regionName ?? "—")}</td>
              <td class="px-3 py-2.5 max-w-[12rem] truncate text-xs text-muted-foreground" title="${escapeHtml(row.store.address ?? "")}">${escapeHtml(row.store.address ?? "—")}</td>
              <td class="px-3 py-2.5 text-xs">${escapeHtml(row.store.code)}</td>
              <td class="px-3 py-2.5">
                <a href="${merchantDetailHref(row.merchantId, "org")}" class="text-primary text-xs hover:underline">组织</a>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderStoreListPage(): string {
  const rows = getEnterpriseStoreList(listEnterpriseStoresFilter());
  const openCount = rows.filter((r) => r.store.status === "open").length;
  const groupCount = new Set(rows.map((r) => r.groupId)).size;
  const merchantCount = new Set(rows.map((r) => r.merchantId)).size;
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-enterprise-merchant-page="stores">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">
          汇总全部 Enterprise、全部集团、全部品牌下的门店（共 <strong class="text-foreground">${rows.length}</strong> 家 · ${groupCount} 个集团 · ${merchantCount} 个品牌 · 营业中 ${openCount}）。
        </p>
        <a href="${merchantHref("/org-tree")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">组织树视图</a>
      </div>
      <form class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4" data-enterprise-store-filter-form>
        <label class="flex min-w-[10rem] flex-col gap-1">
          <span class="text-xs text-muted-foreground">所属集团</span>
          <select name="groupId" data-store-filter="groupId" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">全部集团</option>
            ${getGroupsForSelect({ allEnterprises: true })
              .map((g) => `<option value="${escapeHtml(g.groupId)}">${escapeHtml(g.name)}</option>`)
              .join("")}
          </select>
        </label>
        <label class="flex min-w-[10rem] flex-col gap-1">
          <span class="text-xs text-muted-foreground">所属品牌</span>
          <select name="merchantId" data-store-filter="merchantId" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">全部品牌</option>
            ${getMerchants(listMerchantsFilter())
              .map((m) => `<option value="${escapeHtml(m.merchantId)}">${escapeHtml(m.name)}</option>`)
              .join("")}
          </select>
        </label>
        <label class="flex min-w-[8rem] flex-col gap-1">
          <span class="text-xs text-muted-foreground">门店状态</span>
          <select name="status" data-store-filter="status" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">全部</option>
            <option value="open">营业中</option>
            <option value="preparing">筹备中</option>
            <option value="closed">停业</option>
            <option value="archived">已归档</option>
          </select>
        </label>
        <label class="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span class="text-xs text-muted-foreground">搜索</span>
          <input type="search" name="query" data-store-filter="query" placeholder="门店 / 品牌 / 集团 / BID / MID / 地址" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
      </form>
      <div class="min-h-0 flex-1 overflow-y-auto" data-enterprise-store-table>
        ${renderEnterpriseStoreTable(rows)}
      </div>
    </div>`;
}

function renderListPage(): string {
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-enterprise-merchant-page="list">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">检索与管理企业名下所有入驻品牌；列表统一按<strong class="text-foreground">连锁品牌</strong>展示，点击「查看门店」在弹框中浏览下属门店。</p>
        <a href="${merchantHref("/new")}" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">新建品牌</a>
      </div>
      <form class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4" data-enterprise-merchant-filter-form>
        <label class="flex min-w-[8rem] flex-col gap-1">
          <span class="text-xs text-muted-foreground">状态</span>
          <select name="status" data-merchant-filter="status" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">全部</option>
            <option value="active">在营</option>
            <option value="onboarding">待引导</option>
            <option value="draft">草稿</option>
            <option value="suspended">已暂停</option>
            <option value="closing">关闭中</option>
            <option value="closed">已关闭</option>
          </select>
        </label>
        <label class="flex min-w-[10rem] flex-col gap-1">
          <span class="text-xs text-muted-foreground">所属集团</span>
          <select name="groupId" data-merchant-filter="groupId" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">全部集团</option>
            ${getGroupsForSelect({ allEnterprises: true })
              .map((g) => `<option value="${escapeHtml(g.groupId)}">${escapeHtml(g.name)}</option>`)
              .join("")}
          </select>
        </label>
        <label class="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span class="text-xs text-muted-foreground">搜索</span>
          <input type="search" name="query" data-merchant-filter="query" placeholder="品牌名称 / BID / 编码 / 邮箱" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
      </form>
      <div class="min-h-0 flex-1 overflow-y-auto" data-enterprise-merchant-table>
        ${renderMerchantTable(getMerchants(listMerchantsFilter()))}
      </div>
    </div>`;
}

function renderNewMerchantPage(): string {
  const bizOptions = getBusinessTypeOptions();
  const plOptions = getProductLineOptions();
  const groupOptions = getGroupsForSelect();
  const groupField =
    groupOptions.length > 0
      ? `<label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-xs text-muted-foreground">所属集团 *</span>
              <select name="groupId" required class="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="">请选择集团</option>
                ${groupOptions.map((g) => `<option value="${escapeHtml(g.groupId)}">${escapeHtml(g.name)}</option>`).join("")}
              </select>
            </label>`
      : `<div class="sm:col-span-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            当前企业下尚无集团，请先 <a href="${merchantHref("/groups/new")}" class="font-medium text-primary hover:underline">新建集团</a> 后再创建品牌。
          </div>`;
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-enterprise-merchant-page="new">
      <a href="${merchantHref("")}" class="text-sm text-primary hover:underline">← 返回品牌列表</a>
      ${card(`
        <h2 class="text-sm font-semibold text-card-foreground">M 平台代开通品牌</h2>
        <p class="mt-1 text-sm text-muted-foreground">填写基本信息、能力与首店信息；保存后写入本地演示数据。</p>
        <form class="mt-4 space-y-4" data-enterprise-merchant-create-form>
          <div class="grid gap-4 sm:grid-cols-2">
            ${groupField}
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">品牌名称 *</span>
              <input name="name" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">品牌编码</span>
              <input name="code" class="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="留空自动生成" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">组织类型 *</span>
              <select name="orgType" required class="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="chain">连锁</option>
                <option value="single-store">单店（特殊场景）</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">时区 *</span>
              <select name="timezone" required class="h-9 rounded-md border border-input bg-background px-2 text-sm">
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">联系人 *</span>
              <input name="contactName" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">联系电话</span>
              <input name="contactPhone" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-xs text-muted-foreground">初始管理员邮箱 *</span>
              <input name="primaryAdminEmail" type="email" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="name@menusifu.cn" />
            </label>
          </div>
          <fieldset>
            <legend class="text-xs font-medium text-muted-foreground">经营业态 *</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              ${bizOptions
                .slice(0, 8)
                .map(
                  (b) =>
                    `<label class="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"><input type="checkbox" name="businessTypeIds" value="${escapeHtml(b.id)}" class="accent-primary" />${escapeHtml(b.label)}</label>`,
                )
                .join("")}
            </div>
          </fieldset>
          <fieldset>
            <legend class="text-xs font-medium text-muted-foreground">产线 *</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              ${plOptions
                .map(
                  (p) =>
                    `<label class="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"><input type="checkbox" name="productLineIds" value="${escapeHtml(p.id)}" class="accent-primary" ${p.id === "pos" ? "checked" : ""} />${escapeHtml(p.label)}</label>`,
                )
                .join("")}
            </div>
          </fieldset>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">首店名称</span>
              <input name="firstStoreName" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-xs text-muted-foreground">首店地址</span>
              <input name="firstStoreAddress" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </label>
          </div>
          <label class="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="activateImmediately" class="accent-primary" />
            立即激活（跳过 onboarding，状态设为在营）
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="sendInviteEmail" class="accent-primary" checked />
            创建后发送 onboarding 邀请邮件（演示）
          </label>
          <div class="flex gap-2 pt-2">
            <button type="submit" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" ${groupOptions.length === 0 ? "disabled" : ""}>创建品牌</button>
            <a href="${merchantHref("")}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">取消</a>
          </div>
        </form>
      `)}
    </div>`;
}

function renderOrgTreeStoreItem(store: ReturnType<typeof getMerchantStores>[number]): string {
  const addressPart = store.address
    ? `<span class="text-xs text-muted-foreground"> · ${escapeHtml(store.address)}</span>`
    : "";
  return `<li class="text-sm leading-relaxed">
    <span class="text-card-foreground">${escapeHtml(store.name)}</span>
    <span class="font-mono text-xs text-muted-foreground"> · ${escapeHtml(store.storeId)}</span>${addressPart}
    <span class="text-xs text-muted-foreground"> (${escapeHtml(getStoreStatusLabel(store.status))})</span>
  </li>`;
}

function buildMerchantOrgTreeHtml(merchantId: string): { treeHtml: string; storeCount: number } {
  const brands = getMerchantBrands(merchantId);
  const regions = getMerchantRegions(merchantId);
  const stores = getMerchantStores(merchantId);
  const shownStoreIds = new Set<string>();
  const shownLinkedMerchantIds = new Set<string>();

  const markShown = (store: (typeof stores)[number]) => {
    shownStoreIds.add(store.storeId);
    if (store.linkedMerchantId) shownLinkedMerchantIds.add(store.linkedMerchantId);
    return store;
  };

  const tree = brands
    .map((brand) => {
      const brandRegions = regions.filter((r) => r.brandId === brand.brandId);
      const regionBlocks = brandRegions
        .map((region) => {
          const regionStores = stores
            .filter((s) => s.brandId === brand.brandId && s.regionId === region.regionId)
            .filter((s) => !s.linkedMerchantId || !shownLinkedMerchantIds.has(s.linkedMerchantId))
            .map(markShown);
          if (regionStores.length === 0) return "";
          return `
              <li class="ml-4 mt-1">
                <span class="text-sm text-muted-foreground">${escapeHtml(region.name)}</span>
                <ul class="ml-4 mt-0.5 space-y-0.5">
                  ${regionStores.map(renderOrgTreeStoreItem).join("")}
                </ul>
              </li>`;
        })
        .filter(Boolean)
        .join("");

      if (!regionBlocks) {
        return `
          <li class="ml-2 mt-2">
            <span class="text-sm font-medium">${escapeHtml(brand.name)}</span>
            <p class="ml-4 mt-1 text-xs text-muted-foreground">暂无区域 / 门店</p>
          </li>`;
      }

      return `
          <li class="ml-2 mt-2">
            <span class="text-sm font-medium">${escapeHtml(brand.name)}</span>
            <ul>${regionBlocks}</ul>
          </li>`;
    })
    .join("");

  const orphanStores = stores
    .filter((s) => !shownStoreIds.has(s.storeId))
    .filter((s) => !s.linkedMerchantId || !shownLinkedMerchantIds.has(s.linkedMerchantId));
  const orphanBlock =
    orphanStores.length === 0
      ? ""
      : `
        <li class="ml-2 mt-3">
          <span class="text-sm font-medium text-amber-700 dark:text-amber-400">未归属区域</span>
          <ul class="ml-4 mt-0.5 space-y-0.5">
            ${orphanStores.map(renderOrgTreeStoreItem).join("")}
          </ul>
        </li>`;

  const treeHtml =
    tree || orphanBlock
      ? `${tree}${orphanBlock}`
      : `<li class="text-sm text-muted-foreground">暂无组织节点</li>`;

  return { treeHtml, storeCount: stores.length };
}

function renderOrgTreePage(): string {
  const merchants = getMerchants();
  const blocks = merchants
    .map((m) => {
      const { treeHtml, storeCount } = buildMerchantOrgTreeHtml(m.merchantId);
      return card(`
        <div class="flex items-start justify-between gap-2">
          <div>
            <a href="${merchantDetailHref(m.merchantId)}" class="text-sm font-semibold text-primary hover:underline">${escapeHtml(m.name)}</a>
            <p class="text-xs text-muted-foreground">${MERCHANT_LIST_CHAIN_ORG_LABEL} · ${storeCount} 门店</p>
          </div>
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(m.status)}">${escapeHtml(getMerchantStatusLabel(m.status))}</span>
        </div>
        <ul class="mt-3" role="tree">${treeHtml}</ul>
      `);
    })
    .join("");

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">跨品牌查看品牌 → 区域 → 门店组织树（只读；同一挂载品牌 / 同名同址门店已自动去重）。</p>
      <div class="grid gap-4 lg:grid-cols-2">${blocks}</div>
    </div>`;
}

function renderRequestsPage(): string {
  const pending = getProvisioningRequests("pending");
  const resolved = getProvisioningRequests().filter((r) => r.status !== "pending").slice(0, 10);
  const posPending = getPosStoreRequests("pending");
  const posResolved = getPosStoreRequests().filter((r) => r.status !== "pending").slice(0, 8);
  const todos = getMerchantTodos();

  const posRequestRow = (r: (typeof posPending)[number], showActions: boolean) => `
    <div class="rounded-xl border border-border bg-card p-4" data-pos-store-request-id="${escapeHtml(r.requestId)}">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold">${escapeHtml(r.storeName)}</h3>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(r.posDeviceId ?? "本地 POS")} · ${escapeHtml(r.contactName ?? "—")} · ${escapeHtml(r.address ?? "—")}</p>
        </div>
        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "pending" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : r.status === "approved" ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}">${r.status === "pending" ? "待审核" : r.status === "approved" ? "已通过" : "已驳回"}</span>
      </div>
      <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(r.applicantNote ?? r.posLocation ?? "—")}</p>
      <p class="mt-2 text-xs text-muted-foreground">${formatDate(r.createdAt)}${r.createdBid ? ` · BID ${escapeHtml(r.createdBid)}` : ""}</p>
      ${
        showActions
          ? `<div class="mt-3 flex flex-wrap gap-2">
          <button type="button" data-pos-store-request-approve="${escapeHtml(r.requestId)}" class="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">通过并分配 BID</button>
          <button type="button" data-pos-store-request-reject="${escapeHtml(r.requestId)}" class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted">驳回</button>
        </div>`
          : r.createdMerchantId
            ? `<a href="${merchantDetailHref(r.createdMerchantId)}" class="mt-3 inline-block text-xs text-primary hover:underline">查看入驻品牌 →</a>`
            : r.rejectReason
              ? `<p class="mt-2 text-xs text-destructive">驳回原因：${escapeHtml(r.rejectReason)}</p>`
              : ""
      }
    </div>`;

  const requestRow = (r: (typeof pending)[number], showActions: boolean) => `
    <div class="rounded-xl border border-border bg-card p-4" data-merchant-request-id="${escapeHtml(r.requestId)}">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold">${escapeHtml(r.merchantName)}</h3>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(getMerchantOrgTypeLabel(r.orgType))} · ${escapeHtml(r.contactName)} · ${escapeHtml(r.primaryAdminEmail)}</p>
        </div>
        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "pending" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : r.status === "approved" ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"}">${r.status === "pending" ? "待审核" : r.status === "approved" ? "已通过" : "已驳回"}</span>
      </div>
      <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(r.notes ?? "—")}</p>
      <p class="mt-2 text-xs text-muted-foreground">申请人 ${escapeHtml(r.applicantOrg ?? r.applicantEmail)} · ${formatDate(r.createdAt)}</p>
      ${
        showActions
          ? `<div class="mt-3 flex flex-wrap gap-2">
          <button type="button" data-merchant-request-approve="${escapeHtml(r.requestId)}" class="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">通过并开通</button>
          <button type="button" data-merchant-request-reject="${escapeHtml(r.requestId)}" class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted">驳回</button>
        </div>`
          : r.createdMerchantId
            ? `<a href="${merchantDetailHref(r.createdMerchantId)}" class="mt-3 inline-block text-xs text-primary hover:underline">查看已创建品牌 →</a>`
            : r.rejectReason
              ? `<p class="mt-2 text-xs text-destructive">驳回原因：${escapeHtml(r.rejectReason)}</p>`
              : ""
      }
    </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-enterprise-merchant-page="requests">
      <p class="text-sm text-muted-foreground">审核渠道开通申请，并汇总 onboarding、合同到期、关闭冷静期等待办。</p>
      <div class="grid gap-4 xl:grid-cols-2">
        ${card(`
          <h2 class="text-sm font-semibold">模拟本地 POS 门店申请</h2>
          <form class="mt-3 space-y-3" data-pos-store-request-form>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="flex flex-col gap-1 sm:col-span-2">
                <span class="text-xs text-muted-foreground">门店名称 *</span>
                <input name="storeName" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              </label>
              <label class="flex flex-col gap-1 sm:col-span-2">
                <span class="text-xs text-muted-foreground">地址</span>
                <input name="address" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">POS 设备 ID</span>
                <input name="posDeviceId" class="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="POS-001" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">联系人</span>
                <input name="contactName" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              </label>
            </div>
            <button type="submit" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">提交 POS 申请</button>
          </form>
        `)}
        ${card(`
          <h2 class="text-sm font-semibold">提交开通申请（演示）</h2>
          <form class="mt-3 space-y-3" data-merchant-request-form>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="flex flex-col gap-1 sm:col-span-2">
                <span class="text-xs text-muted-foreground">品牌名称 *</span>
                <input name="merchantName" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">组织类型</span>
                <select name="orgType" class="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="chain">连锁</option>
                  <option value="single-store">单店（特殊场景）</option>
                </select>
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">联系人 *</span>
                <input name="contactName" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">初始管理员邮箱 *</span>
                <input name="primaryAdminEmail" type="email" required class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">申请人邮箱</span>
                <input name="applicantEmail" type="email" class="h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="channel@partner.cn" />
              </label>
              <label class="flex flex-col gap-1 sm:col-span-2">
                <span class="text-xs text-muted-foreground">备注</span>
                <textarea name="notes" rows="2" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"></textarea>
              </label>
            </div>
            <button type="submit" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">提交申请</button>
          </form>
        `)}
        ${card(`
          <h2 class="text-sm font-semibold">综合待办 (${todos.length})</h2>
          <ul class="mt-3 space-y-2">
            ${
              todos.length
                ? todos
                    .slice(0, 6)
                    .map(
                      (todo) =>
                        `<li class="text-sm"><a href="${merchantHref(todo.href.startsWith(ENTERPRISE_MERCHANT_ROUTE_PREFIX) ? todo.href.slice(ENTERPRISE_MERCHANT_ROUTE_PREFIX.length) : todo.href)}" class="text-primary hover:underline">${escapeHtml(todo.title)}</a><span class="text-xs text-muted-foreground"> — ${escapeHtml(todo.detail)}</span></li>`,
                    )
                    .join("")
                : '<li class="text-sm text-muted-foreground">暂无待办</li>'
            }
          </ul>
        `)}
      </div>
      <section class="space-y-3">
        <h2 class="text-sm font-semibold">待审核 POS 门店申请 (${posPending.length})</h2>
        ${posPending.length ? posPending.map((r) => posRequestRow(r, true)).join("") : card('<p class="text-sm text-muted-foreground">暂无待审核 POS 门店申请</p>')}
      </section>
      <section class="space-y-3">
        <h2 class="text-sm font-semibold">待审核品牌开通 (${pending.length})</h2>
        ${pending.length ? pending.map((r) => requestRow(r, true)).join("") : card('<p class="text-sm text-muted-foreground">暂无待审核申请</p>')}
      </section>
      ${
        posResolved.length
          ? `<section class="space-y-3">
        <h2 class="text-sm font-semibold">最近 POS 门店处理记录</h2>
        ${posResolved.map((r) => posRequestRow(r, false)).join("")}
      </section>`
          : ""
      }
      ${
        resolved.length
          ? `<section class="space-y-3">
        <h2 class="text-sm font-semibold">最近品牌开通处理记录</h2>
        ${resolved.map((r) => requestRow(r, false)).join("")}
      </section>`
          : ""
      }
    </div>`;
}

function renderReportsPage(): string {
  const summary = getMerchantReportSummary();
  const sla = getMerchantSlaMetrics();
  const merchants = getMerchants();
  const eid = readActiveEnterpriseId();
  const apiLog = getMerchantApiCallLog().slice(0, 12);
  const kpi = (label: string, value: string | number, sub?: string) => `
    <div class="rounded-xl border border-border bg-card p-4">
      <p class="text-xs text-muted-foreground">${escapeHtml(label)}</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums">${escapeHtml(String(value))}</p>
      ${sub ? `<p class="mt-1 text-xs text-muted-foreground">${escapeHtml(sub)}</p>` : ""}
    </div>`;

  const slaRows = sla
    .map((s) => {
      const merchant = merchants.find((m) => m.merchantId === s.merchantId);
      return `
      <tr class="hover:bg-muted/30">
        <td class="px-3 py-2.5 font-medium">${escapeHtml(merchant?.name ?? s.merchantId)}</td>
        <td class="px-3 py-2.5 tabular-nums">${s.uptimePct.toFixed(2)}%</td>
        <td class="px-3 py-2.5 tabular-nums">${s.openTickets}</td>
        <td class="px-3 py-2.5 tabular-nums">${s.p1Tickets}</td>
        <td class="px-3 py-2.5 tabular-nums">${s.avgResponseMin} min</td>
        <td class="px-3 py-2.5 tabular-nums">${s.monthOrders.toLocaleString("zh-CN")}</td>
        <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${licenseStatusBadgeClass(merchant?.licenseStatus)}">${escapeHtml(getLicenseStatusLabel(merchant?.licenseStatus))}</span></td>
      </tr>`;
    })
    .join("");

  const apiRows =
    apiLog.length === 0
      ? `<tr><td colspan="5" class="px-3 py-6 text-center text-sm text-muted-foreground">暂无 API 调用记录，点击下方按钮试调 REST 演示接口</td></tr>`
      : apiLog
          .map(
            (log) => `
        <tr class="hover:bg-muted/30 font-mono text-xs">
          <td class="px-3 py-2">${escapeHtml(log.method)}</td>
          <td class="px-3 py-2">${escapeHtml(log.path)}</td>
          <td class="px-3 py-2 tabular-nums">${log.status}</td>
          <td class="px-3 py-2 tabular-nums">${log.durationMs} ms</td>
          <td class="px-3 py-2 text-muted-foreground">${escapeHtml(log.detail ?? "—")}</td>
        </tr>`,
          )
          .join("");

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-enterprise-merchant-page="reports">
      <p class="text-sm text-muted-foreground">品牌级 SLA 看板 · REST API 演示（路径前缀 <code class="text-xs">${escapeHtml(merchantApiPath(eid))}</code>）</p>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${kpi("在营品牌", summary.activeCount, `共 ${summary.merchantCount} 家`)}
        ${kpi("平均可用性", `${summary.avgUptimePct.toFixed(2)}%`)}
        ${kpi("未结工单", summary.openTickets, `P1 ${summary.p1Tickets}`)}
        ${kpi("License 告警", summary.licenseExpiredCount + summary.licenseExpiringCount, `到期 ${summary.licenseExpiredCount} · 即将 ${summary.licenseExpiringCount}`)}
      </div>
      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full min-w-[48rem] text-sm">
          <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5">品牌</th>
              <th class="px-3 py-2.5">可用性</th>
              <th class="px-3 py-2.5">工单</th>
              <th class="px-3 py-2.5">P1</th>
              <th class="px-3 py-2.5">响应</th>
              <th class="px-3 py-2.5">月订单</th>
              <th class="px-3 py-2.5">License</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">${slaRows || `<tr><td colspan="7" class="px-3 py-6 text-center text-muted-foreground">暂无数据</td></tr>`}</tbody>
        </table>
      </div>
      ${card(`
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-semibold">REST API 演示</h2>
          <div class="flex flex-wrap gap-2">
            <button type="button" data-merchant-api-demo="list" class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted">GET 品牌列表</button>
            <button type="button" data-merchant-api-demo="reports" class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted">GET 报表摘要</button>
          </div>
        </div>
        <div class="mt-3 overflow-x-auto rounded-lg border border-border" data-merchant-api-log-table>
          <table class="w-full min-w-[40rem] text-left">
            <thead class="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr><th class="px-3 py-2">Method</th><th class="px-3 py-2">Path</th><th class="px-3 py-2">Status</th><th class="px-3 py-2">耗时</th><th class="px-3 py-2">说明</th></tr>
            </thead>
            <tbody class="divide-y divide-border">${apiRows}</tbody>
          </table>
        </div>
      `)}
    </div>`;
}

function renderChangeLogPage(): string {
  const logs = getMerchantChangelog();
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">企业级品牌变更审计（演示数据）。</p>
      <div class="space-y-2">
        ${logs
          .map((l) => {
            const merchant = getMerchantById(l.merchantId);
            return `
          <div class="rounded-xl border border-border bg-card p-4">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span class="font-medium">${escapeHtml(merchant?.name ?? l.merchantId)}</span>
              <span class="text-xs text-muted-foreground">${escapeHtml(l.action)}</span>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(l.detail)}</p>
            <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(l.operatorEmail)} · ${formatDate(l.at)}</p>
          </div>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderDetailTabs(merchantId: string, active: MerchantDetailTab): string {
  const tabClass = (tab: MerchantDetailTab) =>
    tab === active
      ? "inline-flex h-9 items-center border-b-2 border-primary px-3 text-sm font-medium text-primary"
      : "inline-flex h-9 items-center border-b-2 border-transparent px-3 text-sm text-muted-foreground hover:text-foreground";

  return `
    <nav class="flex shrink-0 gap-1 border-b border-border" aria-label="品牌详情">
      <a href="${merchantDetailHref(merchantId, "overview")}" class="${tabClass("overview")}">概览</a>
      <a href="${merchantDetailHref(merchantId, "org")}" class="${tabClass("org")}">组织</a>
      <a href="${merchantDetailHref(merchantId, "capabilities")}" class="${tabClass("capabilities")}">能力与服务</a>
      <a href="${merchantDetailHref(merchantId, "changelog")}" class="${tabClass("changelog")}">变更记录</a>
    </nav>`;
}

function renderLifecycleActions(merchant: EnterpriseMerchant): string {
  const id = merchant.merchantId;
  const btn = (label: string, action: string, variant: "primary" | "outline" | "destructive" = "outline") => {
    const cls =
      variant === "primary"
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : variant === "destructive"
          ? "border-destructive/50 text-destructive hover:bg-destructive/10"
          : "border-border hover:bg-muted";
    return `<button type="button" data-merchant-lifecycle="${action}" data-merchant-id="${escapeHtml(id)}" class="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium ${cls}">${escapeHtml(label)}</button>`;
  };
  const parts: string[] = [];
  if (canImpersonateMerchant(merchant)) {
    parts.push(btn("进入商家后台", "impersonate", "primary"));
  }
  if (merchant.status === "draft" || merchant.status === "onboarding") {
    parts.push(btn("发送邀请邮件", "send-invite"));
    if (merchant.status === "onboarding") {
      parts.push(btn("代完成 onboarding", "complete-onboarding"));
    }
  }
  if (merchant.status === "active" || merchant.status === "suspended") {
    if (merchant.status === "suspended") parts.push(btn("恢复在营", "restore-active", "primary"));
    else parts.push(btn("暂停", "suspend", "destructive"));
    parts.push(btn("发起关闭", "initiate-closing", "destructive"));
  }
  if (merchant.status === "closing") {
    const days = getClosingDaysRemaining(merchant);
    if (days !== null) parts.push(`<span class="inline-flex h-8 items-center px-1 text-xs text-muted-foreground">冷静期剩余约 ${days} 天</span>`);
    parts.push(btn("取消关闭", "cancel-closing"));
    parts.push(btn("立即归档（演示）", "finalize-closing", "destructive"));
  }
  if (merchant.status === "suspended") {
    parts.push(btn("强制关闭", "force-close", "destructive"));
  }
  return `<div class="flex flex-wrap items-center gap-2">${parts.join("")}</div>`;
}

function renderMerchantDetailOverview(merchant: NonNullable<ReturnType<typeof getMerchantById>>): string {
  const cap = getMerchantCapability(merchant.merchantId);
  const storeCount = countStoresForMerchant(merchant.merchantId);
  const row = (label: string, value: string) =>
    `<div class="grid gap-1 sm:grid-cols-[7rem_1fr] py-2 border-b border-border last:border-0"><dt class="text-xs text-muted-foreground">${escapeHtml(label)}</dt><dd class="text-sm">${value}</dd></div>`;

  return `
    <div class="grid gap-4 lg:grid-cols-2">
      ${card(`
        <h2 class="text-sm font-semibold">基本信息</h2>
        <dl class="mt-2">
          ${row("品牌 ID", `<span class="font-mono text-xs">${escapeHtml(merchant.merchantId)}</span>`)}
          ${row("BID", `<span class="font-mono text-xs">${escapeHtml(merchant.bid ?? "—")}</span>`)}
          ${row("所属集团", escapeHtml(getGroupName(merchant.groupId)))}
          ${row("编码", escapeHtml(merchant.code))}
          ${row("组织类型", escapeHtml(getMerchantOrgTypeLabel(merchant.orgType)))}
          ${row("状态", `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(merchant.status)}">${escapeHtml(getMerchantStatusLabel(merchant.status))}</span>`)}
          ${row("联系人", escapeHtml(merchant.contactName ?? "—"))}
          ${row("电话", escapeHtml(merchant.contactPhone ?? "—"))}
          ${row("主管理员", escapeHtml(merchant.primaryAdminEmail ?? "—"))}
          ${row("合同到期", formatDate(merchant.contractExpiresAt))}
          ${row("License", `<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${licenseStatusBadgeClass(merchant.licenseStatus)}">${escapeHtml(getLicenseStatusLabel(merchant.licenseStatus))}</span>`)}
          ${merchant.suspendedReason ? row("暂停原因", escapeHtml(merchant.suspendedReason)) : ""}
          ${row("邀请邮件", formatDate(merchant.onboardingInviteSentAt))}
          ${row("onboarding 完成", formatDate(merchant.onboardingCompletedAt))}
          ${
            merchant.status === "closing"
              ? row("冷静期至", formatDate(merchant.closingEndsAt))
              : merchant.closedAt
                ? row("关闭时间", formatDate(merchant.closedAt))
                : ""
          }
          ${row("时区", escapeHtml(merchant.timezone))}
        </dl>
      `)}
      ${card(`
        <h2 class="text-sm font-semibold">经营摘要</h2>
        <dl class="mt-2">
          ${row("门店数", String(storeCount))}
          ${row("业态", cap?.businessTypeIds.map(businessTypeLabel).join("、") || "—")}
          ${row("产线", cap?.productLineIds.map(productLineLabel).join("、") || "—")}
          ${row("开通时间", formatDate(merchant.activatedAt ?? merchant.createdAt))}
          ${row("预设同步", formatDate(cap?.syncedPresetAt))}
        </dl>
        <div class="mt-4 flex flex-wrap gap-2">
          <a
            href="${hardwareHref("/devices")}"
            data-enterprise-hw-link-merchant="${escapeHtml(merchant.merchantId)}"
            class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted"
          >查看硬件资产</a>
        </div>
        <div class="mt-4">${renderLifecycleActions(merchant)}</div>
      `)}
      ${card(`
        <h2 class="text-sm font-semibold">CRM / 合同（Salesforce 演示）</h2>
        <dl class="mt-2">
          ${row("CRM 合同 ID", escapeHtml(merchant.crmContractId ?? "—"))}
          ${row("CRM 账户 ID", escapeHtml(merchant.crmAccountId ?? "—"))}
          ${row("合同状态", escapeHtml(getContractStatusLabel(merchant.contractStatus)))}
          ${row("上次同步", formatDate(merchant.crmLastSyncedAt))}
          ${row("到期自动暂停", merchant.licenseAutoSuspend === false ? "否" : "是")}
        </dl>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" data-merchant-crm-sync="${escapeHtml(merchant.merchantId)}" class="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-muted">从 CRM 同步</button>
        </div>
        <form class="mt-4 flex flex-wrap items-end gap-2" data-merchant-contract-renew-form data-merchant-id="${escapeHtml(merchant.merchantId)}">
          <label class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">续期至</span>
            <input name="contractExpiresAt" type="date" required class="h-8 rounded-md border border-input bg-background px-2 text-xs" />
          </label>
          <button type="submit" class="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">合同续期</button>
        </form>
      `)}
    </div>`;
}

function renderMerchantDetailOrg(merchantId: string): string {
  const merchant = getMerchantById(merchantId);
  const brands = getMerchantBrands(merchantId);
  const regions = getMerchantRegions(merchantId);
  const stores = getMerchantStores(merchantId);
  const mountable = listMountableMerchantsForOrg(merchantId);
  const brandOptions = brands.map((b) => `<option value="${escapeHtml(b.brandId)}">${escapeHtml(b.name)}</option>`).join("");
  const regionOptions = regions.map((r) => `<option value="${escapeHtml(r.regionId)}" data-brand="${escapeHtml(r.brandId)}">${escapeHtml(r.name)}</option>`).join("");
  const merchantOptions =
    mountable.length === 0
      ? `<option value="">暂无可挂载的入驻品牌</option>`
      : mountable
          .map(
            (m) =>
              `<option value="${escapeHtml(m.merchantId)}">${escapeHtml(m.name)} · ${escapeHtml(m.bid ?? "—")}${m.address ? ` · ${escapeHtml(m.address)}` : ""}</option>`,
          )
          .join("");

  const storeRows =
    stores.length === 0
      ? `<tr><td colspan="6" class="px-3 py-6 text-center text-sm text-muted-foreground">暂无门店</td></tr>`
      : stores
          .map((s) => {
            const brand = brands.find((b) => b.brandId === s.brandId);
            const region = regions.find((r) => r.regionId === s.regionId);
            const isSelf = s.linkedMerchantId === merchantId;
            return `
            <tr>
              <td class="px-3 py-2.5 font-medium">
                <a href="${merchantDetailHref(s.linkedMerchantId)}" class="text-primary hover:underline">${escapeHtml(s.name)}</a>
                ${isSelf ? `<span class="ml-1 text-xs text-muted-foreground">（本品牌）</span>` : ""}
              </td>
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHtml(s.storeId)}</td>
              <td class="px-3 py-2.5">${escapeHtml(brand?.name ?? "—")}</td>
              <td class="px-3 py-2.5">${escapeHtml(region?.name ?? "—")}</td>
              <td class="px-3 py-2.5">
                <select data-merchant-store-status="${escapeHtml(s.storeId)}" class="h-8 rounded-md border border-input bg-background px-2 text-xs">
                  ${(["preparing", "open", "closed", "archived"] as MerchantOrgStoreStatus[])
                    .map(
                      (st) =>
                        `<option value="${st}"${s.status === st ? " selected" : ""}>${escapeHtml(getStoreStatusLabel(st))}</option>`,
                    )
                    .join("")}
                </select>
              </td>
              <td class="px-3 py-2.5 text-xs text-muted-foreground">${escapeHtml(s.address ?? "—")}</td>
            </tr>`;
          })
          .join("");

  return `
    <div class="space-y-4">
      ${card(`
        <h2 class="text-sm font-semibold">挂载门店到组织</h2>
        <p class="mt-1 text-xs text-muted-foreground">门店由本地 POS 申请通过后分配品牌 BID 与门店 MID；从企业下已入驻品牌中选择并挂载到本组织。</p>
        <form class="mt-3 flex flex-wrap items-end gap-3" data-merchant-mount-store-form data-merchant-id="${escapeHtml(merchantId)}">
          <label class="flex min-w-[16rem] flex-1 flex-col gap-1">
            <span class="text-xs text-muted-foreground">入驻品牌 *</span>
            <select name="linkedMerchantId" required class="h-9 rounded-md border border-input bg-background px-2 text-sm" ${mountable.length === 0 ? "disabled" : ""}>
              <option value="">请选择品牌（名称 · BID）</option>
              ${merchantOptions}
            </select>
          </label>
          ${
            merchant?.orgType === "chain"
              ? `
          <label class="flex min-w-[8rem] flex-col gap-1">
            <span class="text-xs text-muted-foreground">品牌</span>
            <select name="brandId" class="h-9 rounded-md border border-input bg-background px-2 text-sm">${brandOptions}</select>
          </label>
          <label class="flex min-w-[8rem] flex-col gap-1">
            <span class="text-xs text-muted-foreground">区域</span>
            <select name="regionId" class="h-9 rounded-md border border-input bg-background px-2 text-sm">${regionOptions}</select>
          </label>`
              : ""
          }
          <button type="submit" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" ${mountable.length === 0 ? "disabled" : ""}>挂载</button>
        </form>
      `)}
      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full text-sm">
          <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5">门店 / 入驻品牌</th>
              <th class="px-3 py-2.5">MID</th>
              <th class="px-3 py-2.5">品牌</th>
              <th class="px-3 py-2.5">区域</th>
              <th class="px-3 py-2.5">状态</th>
              <th class="px-3 py-2.5">地址</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">${storeRows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderMerchantServiceMatrixBlock(
  kind: "included" | "paid",
  productLineId: ProductLineId,
  selection: Record<string, PlatformPresetNodeSelection>,
  businessTypeId: string,
): string {
  const index = kind === "included" ? buildIncludedServiceTreeIndex(productLineId) : buildPaidServiceTreeIndex(productLineId);
  const activeL1 = index.groups[0]?.moduleKey ?? "";
  const l1Node = index.groups.find((g) => g.moduleKey === activeL1)?.tree;
  const activeL2 = l1Node?.children[0]?.resource.key ?? "";
  const l2Node = findL2Node(index.groups, activeL2);
  const activeL3 = l2Node?.children[0]?.resource.key ?? "";
  const tierFor = (moduleId: string) => getEffectivePresetModuleTier(moduleId, businessTypeId, productLineId);
  const { col1, col2, col3, col4 } = renderFourColumnMatrix(
    selection,
    index,
    activeL1,
    activeL2,
    activeL3,
    "",
    tierFor,
    "platform-preset",
  );
  const enabledL1 = countEnabledL1(selection, index);
  const title = kind === "included" ? "基础服务（不收费）" : "增值服务（收费）";
  const subtitle =
    kind === "included"
      ? "来源于菜单路由配置，不含收费增值一级模块；勾选即向品牌开放对应导航与功能。"
      : "高级报表、会员 Plus、外卖聚合、硬件监控、Open API 等收费模块；勾选即订阅。";

  return `
    <div
      class="flex h-[min(32rem,52vh)] min-h-[18rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      data-merchant-service-matrix="${kind}"
      data-pp-editor
      data-pp-pl="${escapeHtml(productLineId)}"
      data-active-l1="${escapeHtml(activeL1)}"
      data-active-l2="${escapeHtml(activeL2)}"
      data-active-l3="${escapeHtml(activeL3)}"
    >
      <input type="hidden" data-pp-selection-json value="${escapeHtml(JSON.stringify(selection))}" />
      <div class="shrink-0 border-b border-border px-4 py-3">
        <h3 class="text-sm font-semibold text-card-foreground">${escapeHtml(title)}</h3>
        <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(subtitle)}</p>
        <p class="mt-1 text-xs text-muted-foreground">已启用 ${enabledL1} 个一级导航</p>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto lg:flex lg:flex-col lg:overflow-hidden">
        ${renderFourColumnMatrixShell(col1, col2, col3, col4, FOUR_COLUMN_HEADERS)}
      </div>
    </div>`;
}

function renderMerchantDetailCapabilities(merchantId: string): string {
  const cap = getMerchantCapability(merchantId);
  if (!cap) {
    return card('<p class="text-sm text-muted-foreground">暂无能力配置</p>');
  }
  const bizOptions = getBusinessTypeOptions();
  const plOptions = getProductLineOptions();
  const syncLabel = cap.syncedPresetAt ? `上次同步：${formatDate(cap.syncedPresetAt)}` : "尚未同步到商家后台";
  const productLineId = resolveMerchantServiceProductLine(cap.productLineIds);
  const businessTypeId = cap.businessTypeIds[0] ?? "full-service";
  const { included, paid } = capabilityToServiceSelections(cap, productLineId);
  const plLabel = productLineLabel(productLineId);

  return `
    <form class="space-y-4" data-merchant-capability-form data-merchant-id="${escapeHtml(merchantId)}">
      ${card(`
        <h2 class="text-sm font-semibold">业态 × 产线</h2>
        <fieldset class="mt-3">
          <legend class="text-xs text-muted-foreground">经营业态</legend>
          <div class="mt-2 flex flex-wrap gap-2">
            ${bizOptions
              .map(
                (b) =>
                  `<label class="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"><input type="checkbox" name="businessTypeIds" value="${escapeHtml(b.id)}" class="accent-primary"${cap.businessTypeIds.includes(b.id) ? " checked" : ""} />${escapeHtml(b.label)}</label>`,
              )
              .join("")}
          </div>
        </fieldset>
        <fieldset class="mt-4">
          <legend class="text-xs text-muted-foreground">产线</legend>
          <div class="mt-2 flex flex-wrap gap-2">
            ${plOptions
              .map(
                (p) =>
                  `<label class="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"><input type="checkbox" name="productLineIds" value="${escapeHtml(p.id)}" class="accent-primary"${cap.productLineIds.includes(p.id) ? " checked" : ""} />${escapeHtml(p.label)}</label>`,
              )
              .join("")}
          </div>
        </fieldset>
      `)}
      <p class="text-xs text-muted-foreground">服务按配置预设四级结构展示（与菜单路由一致），当前树基于产线「${escapeHtml(plLabel)}」。变更产线后请保存并刷新页面以更新树形。</p>
      ${renderMerchantServiceMatrixBlock("included", productLineId, included, businessTypeId)}
      ${renderMerchantServiceMatrixBlock("paid", productLineId, paid, businessTypeId)}
      <p class="text-xs text-muted-foreground">${escapeHtml(syncLabel)} · 保存后将裁剪企业平台预设并同步到当前演示商家后台。</p>
      <div class="flex flex-wrap gap-2">
        <button type="submit" class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存并同步</button>
        <button type="button" data-merchant-capability-sync data-merchant-id="${escapeHtml(merchantId)}" class="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-muted">仅重新同步</button>
      </div>
    </form>`;
}

function renderMerchantDetailChangelog(merchantId: string): string {
  const logs = getMerchantChangelog(merchantId);
  if (logs.length === 0) {
    return card('<p class="text-sm text-muted-foreground">暂无变更记录</p>');
  }
  return `
    <div class="space-y-2">
      ${logs
        .map(
          (l) => `
        <div class="rounded-xl border border-border bg-card p-4">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="font-medium">${escapeHtml(l.action)}</span>
            <span class="text-xs text-muted-foreground">${formatDate(l.at)}</span>
          </div>
          <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(l.detail)}</p>
          <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(l.operatorEmail)}</p>
        </div>`,
        )
        .join("")}
    </div>`;
}

function renderMerchantDetailPage(merchantId: string, tab: MerchantDetailTab): string {
  const merchant = getMerchantById(merchantId);
  if (!merchant) {
    return card(`<p class="text-sm text-muted-foreground">未找到品牌 <code>${escapeHtml(merchantId)}</code></p>`);
  }
  let body = "";
  if (tab === "org") body = renderMerchantDetailOrg(merchantId);
  else if (tab === "capabilities") body = renderMerchantDetailCapabilities(merchantId);
  else if (tab === "changelog") body = renderMerchantDetailChangelog(merchantId);
  else body = renderMerchantDetailOverview(merchant);

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-enterprise-merchant-page="detail">
      <a href="${merchantHref("")}" class="shrink-0 text-sm text-primary hover:underline">← 返回品牌列表</a>
      <div class="shrink-0">
        <h2 class="text-lg font-semibold text-card-foreground">${escapeHtml(merchant.name)}</h2>
        <p class="text-xs text-muted-foreground">${escapeHtml(merchant.code)}${merchant.bid ? ` · ${escapeHtml(merchant.bid)}` : ""} · ${escapeHtml(getMerchantOrgTypeLabel(merchant.orgType))}</p>
      </div>
      ${renderDetailTabs(merchantId, tab)}
      <div class="min-h-0 flex-1 overflow-y-auto pt-2">${body}</div>
    </div>`;
}

export function renderEnterpriseMerchantPage(path: string): string {
  let body: string;
  if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/overview`) body = renderOverviewPage();
  else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups`) body = renderGroupsListPage();
  else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/groups/new`) body = renderNewGroupPage();
  else {
    const groupForm = parseGroupFormPath(path);
    if (groupForm?.mode === "edit") body = renderEditGroupPage(groupForm.groupId);
    else if (isMerchantListPath(path)) body = renderListPage();
    else if (isStoreListPath(path)) body = renderStoreListPage();
    else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/new`) body = renderNewMerchantPage();
    else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/org-tree`) body = renderOrgTreePage();
    else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/requests`) body = renderRequestsPage();
    else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/reports`) body = renderReportsPage();
    else if (path === `${ENTERPRISE_MERCHANT_ROUTE_PREFIX}/change-log`) body = renderChangeLogPage();
    else {
      const detail = parseMerchantDetailPath(path);
      body = detail ? renderMerchantDetailPage(detail.merchantId, detail.tab) : renderOverviewPage();
    }
  }
  const hideEnterpriseBar = isGroupMgmtPath(path) || isMerchantListPath(path) || isStoreListPath(path);
  return wrapMerchantPage(body, { hideEnterpriseBar });
}

function readMerchantFilter(form: HTMLFormElement): MerchantFilter {
  const get = (name: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-merchant-filter="${name}"]`)?.value ?? "";
  return {
    status: (get("status") || undefined) as MerchantFilter["status"],
    orgType: (get("orgType") || undefined) as MerchantFilter["orgType"],
    groupId: get("groupId") || undefined,
    query: get("query") || undefined,
  };
}

function readGroupFilter(form: HTMLFormElement): GroupFilter {
  const get = (name: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-group-filter="${name}"]`)?.value ?? "";
  return {
    query: get("query") || undefined,
  };
}

function readStoreFilter(form: HTMLFormElement): Parameters<typeof getEnterpriseStoreList>[0] {
  const get = (name: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-store-filter="${name}"]`)?.value ?? "";
  return {
    groupId: get("groupId") || undefined,
    merchantId: get("merchantId") || undefined,
    status: (get("status") || undefined) as MerchantOrgStoreStatus | undefined,
    query: get("query") || undefined,
  };
}

export function bindEnterpriseMerchant(onMount: () => void): void {
  bindMerchantBrandStoresDialog();

  document.querySelector<HTMLSelectElement>("[data-enterprise-merchant-context-select]")?.addEventListener("change", (e) => {
    const enterpriseId = (e.currentTarget as HTMLSelectElement).value;
    writeActiveEnterpriseId(enterpriseId);
    onMount();
  });

  const filterForm = document.querySelector<HTMLFormElement>("[data-enterprise-merchant-filter-form]");
  const tableHost = document.querySelector<HTMLElement>("[data-enterprise-merchant-table]");
  if (tableHost && !tableHost.dataset.merchantImpersonateBound) {
    tableHost.dataset.merchantImpersonateBound = "1";
    tableHost.addEventListener("click", (e) => {
      const storeBtn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-merchant-view-stores]");
      if (storeBtn) {
        const merchantId = storeBtn.dataset.merchantViewStores;
        if (merchantId) openMerchantBrandStoresDialog(merchantId);
        return;
      }
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-merchant-impersonate]");
      if (!btn) return;
      const merchantId = btn.dataset.merchantImpersonate;
      if (!merchantId) return;
      if (!enterMerchantBackendAsImpersonator(merchantId, merchantHref(""))) {
        window.alert("当前品牌状态不支持代登录。");
      }
    });
  }
  const applyFilter = () => {
    if (!filterForm || !tableHost) return;
    tableHost.innerHTML = renderMerchantTable(getMerchants(listMerchantsFilter(readMerchantFilter(filterForm))));
  };
  filterForm?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-merchant-filter]").forEach((el) => {
    el.addEventListener("change", applyFilter);
    if (el instanceof HTMLInputElement && el.type === "search") el.addEventListener("input", applyFilter);
  });

  const storeFilterForm = document.querySelector<HTMLFormElement>("[data-enterprise-store-filter-form]");
  const storeTableHost = document.querySelector<HTMLElement>("[data-enterprise-store-table]");
  const applyStoreFilter = () => {
    if (!storeFilterForm || !storeTableHost) return;
    storeTableHost.innerHTML = renderEnterpriseStoreTable(
      getEnterpriseStoreList(listEnterpriseStoresFilter(readStoreFilter(storeFilterForm))),
    );
  };
  storeFilterForm?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-store-filter]").forEach((el) => {
    el.addEventListener("change", applyStoreFilter);
    if (el instanceof HTMLInputElement && el.type === "search") el.addEventListener("input", applyStoreFilter);
  });

  const groupFilterForm = document.querySelector<HTMLFormElement>("[data-enterprise-group-filter-form]");
  const groupTableHost = document.querySelector<HTMLElement>("[data-enterprise-group-table]");
  const applyGroupFilter = () => {
    if (!groupTableHost) return;
    const filter = groupFilterForm ? readGroupFilter(groupFilterForm) : {};
    groupTableHost.innerHTML = renderGroupsTable(getGroups(groupMgmtFilter(filter)));
  };
  groupFilterForm?.querySelectorAll<HTMLInputElement>("[data-group-filter]").forEach((el) => {
    el.addEventListener("change", applyGroupFilter);
    if (el.type === "search") el.addEventListener("input", applyGroupFilter);
  });

  groupTableHost?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-group-delete]");
    if (!btn) return;
    const groupId = btn.dataset.groupDelete;
    const groupName = btn.dataset.groupName ?? groupId;
    if (!groupId) return;
    if (!window.confirm(`确认删除集团「${groupName}」？此操作不可恢复。`)) return;
    const result = deleteGroup(groupId, undefined, DEFAULT_ENTERPRISE_ID);
    if (!result.ok) {
      window.alert(result.reason);
      return;
    }
    applyGroupFilter();
    onMount();
  });

  document.querySelector<HTMLFormElement>("[data-enterprise-group-form]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) {
      window.alert("请填写集团名称");
      return;
    }
    const groupId = form.dataset.groupId;
    if (groupId) {
      const input: UpdateGroupInput = {
        name,
        description: String(fd.get("description") ?? "") || undefined,
        status: (String(fd.get("status") ?? "active") as UpdateGroupInput["status"]) || "active",
      };
      const updated = updateGroup(groupId, input, undefined, DEFAULT_ENTERPRISE_ID);
      if (!updated) {
        window.alert("保存失败：集团不存在或无权访问。");
        return;
      }
    } else {
      const input: CreateGroupInput = {
        name,
        code: String(fd.get("code") ?? "") || undefined,
        description: String(fd.get("description") ?? "") || undefined,
      };
      createGroup(input, undefined, DEFAULT_ENTERPRISE_ID);
    }
    location.hash = merchantHref("/groups");
    onMount();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-group-delete]").forEach((btn) => {
    if (btn.closest("[data-enterprise-group-table]")) return;
    btn.addEventListener("click", () => {
      const groupId = btn.dataset.groupDelete;
      const groupName = btn.dataset.groupName ?? groupId;
      if (!groupId) return;
      if (!window.confirm(`确认删除集团「${groupName}」？此操作不可恢复。`)) return;
      const result = deleteGroup(groupId, undefined, DEFAULT_ENTERPRISE_ID);
      if (!result.ok) {
        window.alert(result.reason);
        return;
      }
      location.hash = merchantHref("/groups");
      onMount();
    });
  });

  document.querySelector<HTMLFormElement>("[data-enterprise-merchant-create-form]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const businessTypeIds = fd.getAll("businessTypeIds").map(String);
    const productLineIds = fd.getAll("productLineIds").map(String);
    if (businessTypeIds.length === 0 || productLineIds.length === 0) {
      window.alert("请至少选择一个业态和一个产线");
      return;
    }
    const groupId = String(fd.get("groupId") ?? "");
    if (!groupId) {
      window.alert("请选择所属集团");
      return;
    }
    const input: CreateMerchantInput = {
      name: String(fd.get("name") ?? ""),
      code: String(fd.get("code") ?? ""),
      groupId,
      orgType: String(fd.get("orgType") ?? "chain") as CreateMerchantInput["orgType"],
      timezone: String(fd.get("timezone") ?? "Asia/Shanghai"),
      contactName: String(fd.get("contactName") ?? ""),
      contactPhone: String(fd.get("contactPhone") ?? "") || undefined,
      primaryAdminEmail: String(fd.get("primaryAdminEmail") ?? ""),
      businessTypeIds,
      productLineIds,
      firstStoreName: String(fd.get("firstStoreName") ?? "") || undefined,
      firstStoreAddress: String(fd.get("firstStoreAddress") ?? "") || undefined,
      activateImmediately: fd.get("activateImmediately") === "on",
      sendInviteEmail: fd.get("sendInviteEmail") === "on",
    };
    const merchant = createMerchant(input);
    location.hash = merchantDetailHref(merchant.merchantId);
    onMount();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const merchantId = btn.dataset.merchantId;
      const status = btn.dataset.merchantStatus as MerchantStatus | undefined;
      if (!merchantId || !status) return;
      updateMerchantStatus(merchantId, status);
      onMount();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-lifecycle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const merchantId = btn.dataset.merchantId;
      const action = btn.dataset.merchantLifecycle;
      if (!merchantId || !action) return;
      if (action === "impersonate") {
        if (!enterMerchantBackendAsImpersonator(merchantId, merchantDetailHref(merchantId))) {
          window.alert("当前品牌状态不支持代登录。");
        }
        return;
      }
      if (action === "send-invite") {
        const preview = sendOnboardingInvite(merchantId);
        if (preview) window.alert(`邀请邮件已发送（演示预览）：\n\n${preview}`);
        else window.alert("无法发送邀请：品牌状态不符或不存在。");
        onMount();
        return;
      }
      if (action === "complete-onboarding") {
        completeMerchantOnboarding(merchantId);
        onMount();
        return;
      }
      if (action === "restore-active" || action === "suspend") {
        updateMerchantStatus(merchantId, action === "restore-active" ? "active" : "suspended");
        onMount();
        return;
      }
      if (action === "initiate-closing") {
        if (!window.confirm("确认发起关闭流程？将进入 30 天冷静期（只读）。")) return;
        initiateMerchantClosing(merchantId);
        onMount();
        return;
      }
      if (action === "cancel-closing") {
        cancelMerchantClosing(merchantId);
        onMount();
        return;
      }
      if (action === "finalize-closing" || action === "force-close") {
        if (!window.confirm("确认立即关闭并归档该品牌？")) return;
        finalizeMerchantClosing(merchantId);
        onMount();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-impersonate]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const merchantId = btn.dataset.merchantImpersonate;
      if (!merchantId) return;
      if (!enterMerchantBackendAsImpersonator(merchantId, merchantHref(""))) {
        window.alert("当前品牌状态不支持代登录。");
      }
    });
  });

  document.querySelector<HTMLFormElement>("[data-merchant-request-form]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const input: SubmitProvisioningRequestInput = {
      merchantName: String(fd.get("merchantName") ?? ""),
      orgType: String(fd.get("orgType") ?? "chain") as SubmitProvisioningRequestInput["orgType"],
      contactName: String(fd.get("contactName") ?? ""),
      primaryAdminEmail: String(fd.get("primaryAdminEmail") ?? ""),
      applicantEmail: String(fd.get("applicantEmail") ?? "") || "channel@partner.cn",
      notes: String(fd.get("notes") ?? "") || undefined,
    };
    submitProvisioningRequest(input);
    onMount();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-request-approve]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const requestId = btn.dataset.merchantRequestApprove;
      if (!requestId) return;
      const merchant = approveProvisioningRequest(requestId);
      if (merchant) {
        window.alert(`已通过申请并创建品牌「${merchant.name}」，onboarding 邀请已发送。`);
        onMount();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-crm-sync]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const merchantId = btn.dataset.merchantCrmSync;
      if (!merchantId) return;
      await apiPostCrmSync(merchantId);
      window.alert("CRM 合同已同步。");
      onMount();
    });
  });

  document.querySelectorAll<HTMLFormElement>("[data-merchant-contract-renew-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const merchantId = form.dataset.merchantId;
      if (!merchantId) return;
      const expiresAt = String(new FormData(form).get("contractExpiresAt") ?? "");
      if (!expiresAt) return;
      renewMerchantContract(merchantId, { contractExpiresAt: expiresAt, restoreActive: true });
      onMount();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-api-demo]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const demo = btn.dataset.merchantApiDemo;
      try {
        if (demo === "list") await apiListMerchants();
        else if (demo === "reports") await apiGetMerchantReports();
      } catch {
        window.alert("API 调用失败");
      }
      onMount();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-request-reject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const requestId = btn.dataset.merchantRequestReject;
      if (!requestId) return;
      const reason = window.prompt("请输入驳回原因：");
      if (reason === null) return;
      rejectProvisioningRequest(requestId, reason);
      onMount();
    });
  });

  document.querySelectorAll<HTMLAnchorElement>("[data-enterprise-hw-link-merchant]").forEach((link) => {
    link.addEventListener("click", () => {
      const merchantId = link.dataset.enterpriseHwLinkMerchant;
      if (merchantId) {
        try {
          sessionStorage.setItem("menusifu:enterprise-hardware-merchant-filter", merchantId);
        } catch {
          /* ignore */
        }
      }
    });
  });

  document.querySelectorAll<HTMLFormElement>("[data-merchant-mount-store-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const orgMerchantId = form.dataset.merchantId;
      if (!orgMerchantId) return;
      const fd = new FormData(form);
      const linkedMerchantId = String(fd.get("linkedMerchantId") ?? "");
      if (!linkedMerchantId) {
        window.alert("请选择要挂载的入驻品牌");
        return;
      }
      const result = mountMerchantToOrg({
        orgMerchantId,
        linkedMerchantId,
        brandId: String(fd.get("brandId") ?? "") || undefined,
        regionId: String(fd.get("regionId") ?? "") || undefined,
      });
      if (!result) {
        window.alert("挂载失败：该品牌可能已挂载到其他组织，或不可选");
        return;
      }
      onMount();
    });
  });

  document.querySelectorAll<HTMLFormElement>("[data-pos-store-request-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      submitPosStoreRequest({
        storeName: String(fd.get("storeName") ?? ""),
        address: String(fd.get("address") ?? "") || undefined,
        contactName: String(fd.get("contactName") ?? "") || undefined,
        posDeviceId: String(fd.get("posDeviceId") ?? "") || undefined,
      });
      form.reset();
      onMount();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-pos-store-request-approve]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const requestId = btn.dataset.posStoreRequestApprove;
      if (!requestId) return;
      const merchant = approvePosStoreRequest(requestId);
      if (!merchant) return;
      window.alert(`已通过，分配 BID ${merchant.bid ?? "—"}，可在组织页挂载到连锁品牌。`);
      onMount();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-pos-store-request-reject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const requestId = btn.dataset.posStoreRequestReject;
      if (!requestId) return;
      const reason = window.prompt("请输入驳回原因：");
      if (reason === null) return;
      rejectPosStoreRequest(requestId, reason);
      onMount();
    });
  });

  document.querySelectorAll<HTMLSelectElement>("[data-merchant-store-status]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const storeId = sel.dataset.merchantStoreStatus;
      if (!storeId) return;
      updateMerchantStoreStatus(storeId, sel.value as MerchantOrgStoreStatus);
      onMount();
    });
  });

  document.querySelectorAll<HTMLFormElement>("[data-merchant-capability-form]").forEach((form) => {
    const productLineId = resolveMerchantServiceProductLine(
      [...form.querySelectorAll<HTMLInputElement>('input[name="productLineIds"]:checked')].map((el) => el.value),
    );
    const readBusinessTypeId = (): string => {
      const checked = form.querySelector<HTMLInputElement>('input[name="businessTypeIds"]:checked');
      return checked?.value ?? "full-service";
    };

    const includedRoot = form.querySelector<HTMLElement>('[data-merchant-service-matrix="included"]');
    const paidRoot = form.querySelector<HTMLElement>('[data-merchant-service-matrix="paid"]');

    if (includedRoot) {
      bindFourColumnMatrix(includedRoot, {
        getIndex: () => buildIncludedServiceTreeIndex(productLineId),
        onEnableToggle: (sel, key, enabled) =>
          cascadeMerchantServiceSelection(sel, key, enabled, buildIncludedServiceTreeIndex(productLineId)),
        tierForModule: (moduleId) => getEffectivePresetModuleTier(moduleId, readBusinessTypeId(), productLineId),
      });
    }
    if (paidRoot) {
      bindFourColumnMatrix(paidRoot, {
        getIndex: () => buildPaidServiceTreeIndex(productLineId),
        onEnableToggle: (sel, key, enabled) =>
          cascadeMerchantServiceSelection(sel, key, enabled, buildPaidServiceTreeIndex(productLineId)),
        tierForModule: (moduleId) => getEffectivePresetModuleTier(moduleId, readBusinessTypeId(), productLineId),
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const merchantId = form.dataset.merchantId;
      if (!merchantId) return;
      const fd = new FormData(form);
      const businessTypeIds = fd.getAll("businessTypeIds").map(String);
      const productLineIds = fd.getAll("productLineIds").map(String);
      if (businessTypeIds.length === 0 || productLineIds.length === 0) {
        window.alert("请至少选择一个业态和一个产线");
        return;
      }
      const includedSelection = includedRoot ? readFourColumnSelection(includedRoot) : {};
      const paidSelection = paidRoot ? readFourColumnSelection(paidRoot) : {};
      const result = saveMerchantCapability(merchantId, {
        businessTypeIds,
        productLineIds,
        includedSelection,
        paidSelection,
        syncToMerchant: true,
        forceSync: false,
      });
      window.alert(`已保存。平台预设同步：更新 ${result.syncResult?.updated ?? 0} 项，跳过 ${result.syncResult?.skipped ?? 0} 项。`);
      onMount();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-merchant-capability-sync]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const merchantId = btn.dataset.merchantId;
      if (!merchantId) return;
      const result = syncMerchantCapabilityPresets(merchantId, true);
      recordMerchantPresetSyncOnly(merchantId, result);
      window.alert(`重新同步完成：更新 ${result.updated} 项，跳过 ${result.skipped} 项。`);
      onMount();
    });
  });
}
