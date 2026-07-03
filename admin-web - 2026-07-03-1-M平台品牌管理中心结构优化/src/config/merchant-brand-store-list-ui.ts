/**
 * 商家后台 · 品牌多门店视角 · 门店列表（/brand-stores/*）
 * 展示 M 平台同步的当前品牌下全部门店（只读）。
 */
import {
  filterChainBrandSnapshotByEffectiveScope,
  isBrandDataPerspective,
  resolveEffectiveScope,
} from "../auth/effective-scope-api";
import { resolveDefaultAnchorBrandId } from "../auth/merchant-scope-context";
import {
  formatChainStoreStatusLabel,
  loadChainBrandOrgForContext,
  resolveChainBrandContext,
  syncChainBrandOrgForGroup,
  type ChainBrandView,
  type ChainStoreView,
} from "./merchant-chain-brand-sync";

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

function renderEmptyState(): string {
  return `
    <div class="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p class="text-sm font-medium text-card-foreground">暂无门店数据</p>
      <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
        请切换到<strong class="text-foreground">连锁版 · 品牌多门店</strong>视角，并确认 M 平台已同步当前品牌组织数据。
      </p>
    </div>`;
}

function resolveCurrentBrand(
  snapshot: ReturnType<typeof filterChainBrandSnapshotByEffectiveScope>,
): ChainBrandView | null {
  const brandId = resolveDefaultAnchorBrandId();
  if (brandId) {
    return snapshot.brands.find((b) => b.merchantId === brandId) ?? snapshot.brands[0] ?? null;
  }
  return snapshot.brands[0] ?? null;
}

function renderSyncBanner(
  brand: ChainBrandView,
  snapshot: NonNullable<ReturnType<typeof loadChainBrandOrgForContext>>,
  demoFlow?: boolean,
): string {
  const demoTag = demoFlow
    ? `<span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">连锁版 · M 平台数据流转演示</span>`
    : "";
  return `
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <span class="flex flex-wrap items-center gap-2">
        <span>
          数据来自 M 平台 · 品牌 <strong class="text-foreground">${escapeHtml(brand.name)}</strong>
          · 集团 <strong class="text-foreground">${escapeHtml(snapshot.groupName)}</strong>
          · <strong class="text-foreground">${brand.stores.length}</strong> 家门店
        </span>
        ${demoTag}
      </span>
      <span>最近同步 ${formatDate(snapshot.syncedAt)}</span>
    </div>`;
}

function renderStoreStats(brand: ChainBrandView): string {
  const openCount = brand.stores.filter((s) => s.status === "open").length;
  const kpi = (label: string, value: string | number) =>
    `<div class="rounded-xl border border-border bg-card p-4"><p class="text-xs text-muted-foreground">${escapeHtml(label)}</p><p class="mt-1 text-2xl font-semibold tabular-nums">${escapeHtml(String(value))}</p></div>`;
  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${kpi("品牌", brand.name)}
      ${kpi("品牌 BID", brand.bid ?? "—")}
      ${kpi("门店总数", brand.stores.length)}
      ${kpi("营业中", openCount)}
    </div>`;
}

function renderStoreCards(stores: ChainStoreView[]): string {
  if (!stores.length) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">该品牌下暂无门店</p>`;
  }
  return `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      ${stores
        .map((store) => {
          const hostNote = store.hostedUnderChainName
            ? `<p class="mt-1 text-xs text-muted-foreground">组织归属：${escapeHtml(store.hostedUnderChainName)}</p>`
            : "";
          return `
          <article class="rounded-xl border border-border bg-card p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-card-foreground">${escapeHtml(store.name)}</h3>
                <p class="mt-0.5 font-mono text-xs text-muted-foreground">${escapeHtml(store.storeId)} · ${escapeHtml(store.code)}</p>
              </div>
              <span class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">${escapeHtml(formatChainStoreStatusLabel(store.status))}</span>
            </div>
            ${hostNote}
            <dl class="mt-3 space-y-1 text-xs text-muted-foreground">
              <div><span class="text-foreground/80">区域</span> · ${escapeHtml(store.regionName ?? "—")}</div>
              <div class="truncate"><span class="text-foreground/80">地址</span> · ${escapeHtml(store.address ?? "—")}</div>
            </dl>
          </article>`;
        })
        .join("")}
    </div>`;
}

function renderStoreTable(stores: ChainStoreView[]): string {
  if (!stores.length) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">该品牌下暂无门店</p>`;
  }
  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[48rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2.5 font-medium">门店名称</th>
            <th class="px-3 py-2.5 font-medium">MID</th>
            <th class="px-3 py-2.5 font-medium">编码</th>
            <th class="px-3 py-2.5 font-medium">区域</th>
            <th class="px-3 py-2.5 font-medium">地址</th>
            <th class="px-3 py-2.5 font-medium">状态</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${stores
            .map((store) => {
              const hostNote = store.hostedUnderChainName
                ? `<span class="block text-xs text-muted-foreground">归属：${escapeHtml(store.hostedUnderChainName)}</span>`
                : "";
              return `<tr class="hover:bg-muted/30">
                <td class="px-3 py-2.5 font-medium">
                  ${escapeHtml(store.name)}
                  ${hostNote}
                </td>
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHtml(store.storeId)}</td>
                <td class="px-3 py-2.5 text-xs">${escapeHtml(store.code)}</td>
                <td class="px-3 py-2.5 text-xs">${escapeHtml(store.regionName ?? "—")}</td>
                <td class="px-3 py-2.5 text-xs text-muted-foreground max-w-[14rem] truncate" title="${escapeHtml(store.address ?? "")}">${escapeHtml(store.address ?? "—")}</td>
                <td class="px-3 py-2.5 text-xs">${escapeHtml(formatChainStoreStatusLabel(store.status))}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

export function isBrandStoreListPath(path: string): boolean {
  return path === "/brand-stores/list" || path === "/brand-stores/overview";
}

export function renderBrandStoreListPage(path: string): string {
  if (!isBrandDataPerspective()) {
    return `<div class="space-y-4" data-brand-store-list-page>${renderEmptyState()}</div>`;
  }

  const ctx = resolveChainBrandContext();
  const rawSnapshot = loadChainBrandOrgForContext();
  if (!ctx || !rawSnapshot) {
    return `<div class="space-y-4" data-brand-store-list-page>${renderEmptyState()}</div>`;
  }

  const scope = resolveEffectiveScope();
  const snapshot = filterChainBrandSnapshotByEffectiveScope(rawSnapshot, scope);
  const brand = resolveCurrentBrand(snapshot);
  if (!brand) {
    return `<div class="space-y-4" data-brand-store-list-page>${renderEmptyState()}</div>`;
  }

  const stores = [...brand.stores].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  const banner = renderSyncBanner(brand, snapshot, ctx.demoFlow);

  if (path === "/brand-stores/overview") {
    return `
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-brand-store-list-page="overview">
        ${banner}
        <p class="text-sm text-muted-foreground">品牌多门店视角：当前品牌下全部门店卡片概览（M 平台同步，只读）。</p>
        ${renderStoreStats(brand)}
        ${renderStoreCards(stores)}
      </div>`;
  }

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-brand-store-list-page="list">
      ${banner}
      <p class="text-sm text-muted-foreground">品牌多门店视角：当前品牌下全部门店明细（M 平台同步，只读）。</p>
      ${renderStoreStats(brand)}
      <div class="min-h-0 flex-1 overflow-y-auto">${renderStoreTable(stores)}</div>
    </div>`;
}

export function bindBrandStoreListControls(onMount?: () => void): void {
  if (!onMount || typeof window === "undefined") return;
  const win = window as Window & { __menusifuBrandStoreListBound?: boolean };
  if (win.__menusifuBrandStoreListBound) return;
  win.__menusifuBrandStoreListBound = true;

  const refresh = () => {
    const hash = location.hash.replace(/^#/, "") || "/";
    const path = hash.split("?")[0] ?? "/";
    if (isBrandStoreListPath(path)) onMount();
  };
  window.addEventListener("menusifu:scope-filter-change", refresh);
  window.addEventListener("menusifu:scope-perspective-change", refresh);
  window.addEventListener("menusifu:merchant-group-change", refresh);
  window.addEventListener("menusifu:chain-brand-synced", refresh);

  document.querySelector<HTMLButtonElement>("[data-brand-store-list-resync]")?.addEventListener("click", () => {
    const ctx = resolveChainBrandContext();
    if (!ctx) return;
    syncChainBrandOrgForGroup(ctx.groupId);
    window.dispatchEvent(new CustomEvent("menusifu:chain-brand-synced"));
    onMount?.();
  });
}
