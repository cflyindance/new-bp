/**
 * 商家后台 · 集团总部视角 · 门店列表（/group-stores/*）
 * 展示 M 平台同步的集团下全部品牌、全部门店（只读）。
 */
import {
  filterChainBrandSnapshotByEffectiveScope,
  isGroupHqDataPerspective,
  resolveEffectiveScope,
} from "../auth/effective-scope-api";
import {
  formatChainStoreStatusLabel,
  loadChainBrandOrgForContext,
  resolveChainBrandContext,
  syncChainBrandOrgForGroup,
  type ChainBrandOrgSnapshot,
  type ChainStoreView,
} from "./merchant-chain-brand-sync";

interface GroupStoreRow extends ChainStoreView {
  brandId: string;
  brandName: string;
  brandBid?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function storeStatusBadgeClass(status: ChainStoreView["status"]): string {
  if (status === "open") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
  if (status === "preparing") return "bg-amber-500/15 text-amber-900 dark:text-amber-100";
  if (status === "closed") return "bg-muted text-muted-foreground";
  return "bg-muted/80 text-muted-foreground";
}

function renderStoreStatusBadge(status: ChainStoreView["status"]): string {
  const label = formatChainStoreStatusLabel(status);
  return `<span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${storeStatusBadgeClass(status)}">${escapeHtml(label)}</span>`;
}

function renderEmptyState(): string {
  return `
    <div class="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p class="text-sm font-medium text-card-foreground">暂无门店数据</p>
      <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
        请切换到<strong class="text-foreground">连锁版 · 集团总部</strong>视角，并确认 M 平台已同步当前集团组织数据。
      </p>
    </div>`;
}

function flattenGroupStores(snapshot: ChainBrandOrgSnapshot): GroupStoreRow[] {
  const rows: GroupStoreRow[] = [];
  for (const brand of snapshot.brands) {
    for (const store of brand.stores) {
      rows.push({
        ...store,
        brandId: brand.merchantId,
        brandName: brand.name,
        brandBid: brand.bid,
      });
    }
  }
  return rows.sort(
    (a, b) =>
      a.brandName.localeCompare(b.brandName, "zh-CN") || a.name.localeCompare(b.name, "zh-CN"),
  );
}

function renderSyncBanner(snapshot: ChainBrandOrgSnapshot, storeCount: number, demoFlow?: boolean): string {
  const demoTag = demoFlow
    ? `<span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">连锁版 · M 平台数据流转演示</span>`
    : "";
  return `
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <span class="flex flex-wrap items-center gap-2">
        <span>
          数据来自 M 平台 · 集团 <strong class="text-foreground">${escapeHtml(snapshot.groupName)}</strong>
          · <strong class="text-foreground">${snapshot.brands.length}</strong> 个品牌
          · <strong class="text-foreground">${storeCount}</strong> 家门店
        </span>
        ${demoTag}
      </span>
      <span>最近同步 ${formatDate(snapshot.syncedAt)}</span>
    </div>`;
}

function renderGroupStoreStats(snapshot: ChainBrandOrgSnapshot, rows: GroupStoreRow[]): string {
  const openCount = rows.filter((s) => s.status === "open").length;
  const kpi = (label: string, value: string | number) =>
    `<div class="rounded-xl border border-border bg-card p-4"><p class="text-xs text-muted-foreground">${escapeHtml(label)}</p><p class="mt-1 text-2xl font-semibold tabular-nums">${escapeHtml(String(value))}</p></div>`;
  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${kpi("集团", snapshot.groupName)}
      ${kpi("品牌数", snapshot.brands.length)}
      ${kpi("门店总数", rows.length)}
      ${kpi("营业中", openCount)}
    </div>`;
}

function renderGroupStoreTable(rows: GroupStoreRow[]): string {
  if (!rows.length) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">当前集团下暂无门店</p>`;
  }
  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[56rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2.5 font-medium">所属品牌</th>
            <th class="px-3 py-2.5 font-medium">品牌 BID</th>
            <th class="px-3 py-2.5 font-medium">门店名称</th>
            <th class="px-3 py-2.5 font-medium">门店 MID</th>
            <th class="px-3 py-2.5 font-medium">编码</th>
            <th class="px-3 py-2.5 font-medium">区域</th>
            <th class="px-3 py-2.5 font-medium">地址</th>
            <th class="px-3 py-2.5 font-medium">门店状态</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${rows
            .map((row) => {
              const hostNote = row.hostedUnderChainName
                ? `<span class="block text-xs text-muted-foreground">组织归属：${escapeHtml(row.hostedUnderChainName)}</span>`
                : "";
              return `<tr class="hover:bg-muted/30">
                <td class="px-3 py-2.5 font-medium">${escapeHtml(row.brandName)}</td>
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHtml(row.brandBid ?? "—")}</td>
                <td class="px-3 py-2.5 font-medium">
                  ${escapeHtml(row.name)}
                  ${hostNote}
                </td>
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHtml(row.storeId)}</td>
                <td class="px-3 py-2.5 text-xs">${escapeHtml(row.code)}</td>
                <td class="px-3 py-2.5 text-xs">${escapeHtml(row.regionName ?? "—")}</td>
                <td class="px-3 py-2.5 max-w-[12rem] truncate text-xs text-muted-foreground" title="${escapeHtml(row.address ?? "")}">${escapeHtml(row.address ?? "—")}</td>
                <td class="px-3 py-2.5">${renderStoreStatusBadge(row.status)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderGroupStoreByBrand(snapshot: ChainBrandOrgSnapshot): string {
  if (!snapshot.brands.length) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">当前集团下暂无品牌</p>`;
  }
  return `
    <div class="space-y-3">
      ${snapshot.brands
        .map((brand) => {
          const stores = [...brand.stores].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
          return `
          <details class="rounded-xl border border-border bg-card" ${stores.length ? "open" : ""}>
            <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
              <span class="text-sm font-semibold">${escapeHtml(brand.name)} <span class="font-mono text-xs font-normal text-muted-foreground">${escapeHtml(brand.bid ?? "")}</span></span>
              <span class="text-xs text-muted-foreground">${stores.length} 家门店</span>
            </summary>
            ${
              stores.length
                ? `<ul class="divide-y divide-border border-t border-border px-4 py-1">
                    ${stores
                      .map(
                        (s) =>
                          `<li class="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                            <span class="min-w-0 truncate">${escapeHtml(s.name)} <span class="font-mono text-xs text-muted-foreground">${escapeHtml(s.storeId)}</span></span>
                            ${renderStoreStatusBadge(s.status)}
                          </li>`,
                      )
                      .join("")}
                  </ul>`
                : `<p class="border-t border-border px-4 py-4 text-sm text-muted-foreground">暂无门店</p>`
            }
          </details>`;
        })
        .join("")}
    </div>`;
}

export function isGroupStoreListPath(path: string): boolean {
  return path === "/group-stores/list" || path === "/group-stores/overview";
}

export function renderGroupStoreListPage(path: string): string {
  if (!isGroupHqDataPerspective()) {
    return `<div class="space-y-4" data-group-store-list-page>${renderEmptyState()}</div>`;
  }

  const ctx = resolveChainBrandContext();
  const rawSnapshot = loadChainBrandOrgForContext();
  if (!ctx || !rawSnapshot) {
    return `<div class="space-y-4" data-group-store-list-page>${renderEmptyState()}</div>`;
  }

  const scope = resolveEffectiveScope();
  const snapshot = filterChainBrandSnapshotByEffectiveScope(rawSnapshot, scope);
  const rows = flattenGroupStores(snapshot);
  const banner = renderSyncBanner(snapshot, rows.length, ctx.demoFlow);

  if (path === "/group-stores/overview") {
    return `
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-group-store-list-page="overview">
        ${banner}
        <p class="text-sm text-muted-foreground">集团总部视角：按品牌分组查看集团下全部门店及状态（M 平台同步，只读）。</p>
        ${renderGroupStoreStats(snapshot, rows)}
        ${renderGroupStoreByBrand(snapshot)}
      </div>`;
  }

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-group-store-list-page="list">
      ${banner}
      <p class="text-sm text-muted-foreground">集团总部视角：汇总展示集团下所有品牌的全部门店（M 平台同步，只读）。</p>
      ${renderGroupStoreStats(snapshot, rows)}
      <div class="min-h-0 flex-1 overflow-y-auto">${renderGroupStoreTable(rows)}</div>
    </div>`;
}

export function bindGroupStoreListControls(onMount?: () => void): void {
  if (!onMount || typeof window === "undefined") return;
  const win = window as Window & { __menusifuGroupStoreListBound?: boolean };
  if (win.__menusifuGroupStoreListBound) return;
  win.__menusifuGroupStoreListBound = true;

  const refresh = () => {
    const hash = location.hash.replace(/^#/, "") || "/";
    const path = hash.split("?")[0] ?? "/";
    if (isGroupStoreListPath(path)) onMount();
  };
  window.addEventListener("menusifu:scope-filter-change", refresh);
  window.addEventListener("menusifu:scope-perspective-change", refresh);
  window.addEventListener("menusifu:merchant-group-change", refresh);
  window.addEventListener("menusifu:chain-brand-synced", refresh);
}
