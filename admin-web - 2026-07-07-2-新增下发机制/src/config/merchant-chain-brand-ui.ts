/**
 * 商家后台 · 连锁门店 · 品牌管理（/brand/*）
 * 展示 M 平台同步的集团 / 品牌 / 门店主数据（只读），按 resolveEffectiveScope 裁剪。
 */
import {
  filterChainBrandSnapshotByEffectiveScope,
  isBrandDataPerspective,
  isGroupHqDataPerspective,
  isStoreDataPerspective,
  resolveEffectiveScope,
  type EffectiveScope,
} from "../auth/effective-scope-api";
import { t } from "../i18n";
import {
  formatChainStoreStatusLabel,
  loadChainBrandOrgForContext,
  resolveChainBrandContext,
  syncChainBrandOrgForGroup,
  type ChainBrandOrgSnapshot,
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

function perspectiveLabel(scope: EffectiveScope): string {
  if (scope.perspective === "group-hq") return t("shell.perspectiveGroupHq");
  if (scope.perspective === "brand") return t("shell.perspectiveBrand");
  return t("shell.navLayoutStore");
}

function scopeSummaryLabel(scope: EffectiveScope, snapshot: ChainBrandOrgSnapshot): string {
  if (isStoreDataPerspective()) {
    const storeId = scope.storeIds[0];
    const hit = storeId ? findStoreInSnapshot(snapshot, storeId) : null;
    return hit ? hit.store.name : perspectiveLabel(scope);
  }
  if (isBrandDataPerspective()) {
    const brandId = scope.brandIds[0];
    const brand = brandId ? snapshot.brands.find((b) => b.merchantId === brandId) : snapshot.brands[0];
    return brand?.name ?? perspectiveLabel(scope);
  }
  if (scope.isAggregated) {
    return `${snapshot.groupName} · ${scope.brandIds.length || snapshot.brands.length} 品牌 · ${scope.storeIds.length} 门店`;
  }
  return snapshot.groupName;
}

function findStoreInSnapshot(
  snapshot: ChainBrandOrgSnapshot,
  storeId: string,
): { brand: ChainBrandView; store: ChainStoreView } | null {
  for (const brand of snapshot.brands) {
    const store = brand.stores.find((s) => s.storeId === storeId);
    if (store) return { brand, store };
  }
  return null;
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

function summarizeBrandStoreStatuses(brand: ChainBrandView): string {
  if (!brand.stores.length) return "暂无门店";
  const counts = new Map<string, number>();
  for (const store of brand.stores) {
    const label = formatChainStoreStatusLabel(store.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => `${label} ${count}`)
    .join(" · ");
}

function renderBrandStoreRows(stores: ChainStoreView[]): string {
  if (!stores.length) {
    return `<p class="px-4 py-6 text-center text-sm text-muted-foreground">该品牌下暂无门店</p>`;
  }
  const sorted = [...stores].sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return `
    <div class="overflow-x-auto border-t border-border">
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
              const hostNote = store.hostedUnderChainName
                ? `<span class="block text-xs text-muted-foreground">组织归属：${escapeHtml(store.hostedUnderChainName)}</span>`
                : "";
              return `<tr class="hover:bg-muted/20">
                <td class="px-4 py-2.5 font-medium">
                  ${escapeHtml(store.name)}
                  ${hostNote}
                </td>
                <td class="px-4 py-2.5 font-mono text-xs">${escapeHtml(store.storeId)}</td>
                <td class="px-4 py-2.5 text-xs">${escapeHtml(store.code)}</td>
                <td class="px-4 py-2.5 text-xs">${escapeHtml(store.regionName ?? "—")}</td>
                <td class="px-4 py-2.5 max-w-[14rem] truncate text-xs text-muted-foreground" title="${escapeHtml(store.address ?? "")}">${escapeHtml(store.address ?? "—")}</td>
                <td class="px-4 py-2.5">${renderStoreStatusBadge(store.status)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderEmptyState(): string {
  return `
    <div class="rounded-xl border border-dashed border-border bg-card p-8 text-center">
      <p class="text-sm font-medium text-card-foreground">暂无集团品牌数据</p>
      <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
        集团及品牌由 M 平台统一创建与维护。请使用<strong class="text-foreground">连锁集团账号</strong>登录（如 <code class="rounded bg-muted px-1 font-mono text-xs">zhangji.admin@menusifu.cn</code>），或通过 M 平台「代登录」进入商家后台后查看。
      </p>
    </div>`;
}

function renderSyncBanner(
  snapshot: ChainBrandOrgSnapshot,
  scope: EffectiveScope,
  demoFlow?: boolean,
): string {
  const demoTag = demoFlow
    ? `<span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">连锁版 · M 平台数据流转演示</span>`
    : "";
  const aggTag = scope.isAggregated
    ? `<span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">多店汇总</span>`
    : "";
  return `
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <span class="flex flex-wrap items-center gap-2">
        <span>
          数据来自 M 平台 · 集团 <strong class="text-foreground">${escapeHtml(snapshot.groupName)}</strong>
          · 数据视角 <strong class="text-foreground">${escapeHtml(perspectiveLabel(scope))}</strong>
          · 当前范围 <strong class="text-foreground">${escapeHtml(scopeSummaryLabel(scope, snapshot))}</strong>
        </span>
        ${demoTag}
        ${aggTag}
      </span>
      <span>最近同步 ${formatDate(snapshot.syncedAt)}</span>
    </div>`;
}

function renderOverviewStats(snapshot: ChainBrandOrgSnapshot, scope: EffectiveScope): string {
  const storeCount = snapshot.brands.reduce((sum, b) => sum + b.stores.length, 0);
  const activeBrands = snapshot.brands.filter((b) => b.status === "active").length;
  const kpi = (label: string, value: string | number) =>
    `<div class="rounded-xl border border-border bg-card p-4"><p class="text-xs text-muted-foreground">${escapeHtml(label)}</p><p class="mt-1 text-2xl font-semibold tabular-nums">${escapeHtml(String(value))}</p></div>`;

  if (isStoreDataPerspective()) {
    const storeId = scope.storeIds[0];
    const hit = storeId ? findStoreInSnapshot(snapshot, storeId) : null;
    if (hit) {
      return `
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          ${kpi("门店", hit.store.name)}
          ${kpi("门店 MID", hit.store.storeId)}
          ${kpi("所属品牌", hit.brand.name)}
          ${kpi("门店状态", formatChainStoreStatusLabel(hit.store.status))}
        </div>`;
    }
  }

  if (isBrandDataPerspective() && snapshot.brands.length === 1) {
    const brand = snapshot.brands[0]!;
    return `
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        ${kpi("品牌", brand.name)}
        ${kpi("品牌 BID", brand.bid ?? "—")}
        ${kpi("在营状态", brand.statusLabel)}
        ${kpi("门店数", brand.stores.length)}
      </div>`;
  }

  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${kpi("集团", snapshot.groupName)}
      ${kpi("品牌数", snapshot.brands.length)}
      ${kpi("在营品牌", activeBrands)}
      ${kpi("门店数", storeCount)}
    </div>`;
}

function renderBrandCards(snapshot: ChainBrandOrgSnapshot): string {
  if (snapshot.brands.length === 0) {
    return `<p class="text-sm text-muted-foreground">当前数据范围内尚无品牌。</p>`;
  }
  return `
    <div class="grid gap-4 lg:grid-cols-2">
      ${snapshot.brands
        .map((brand) => {
          const storePreview = brand.stores
            .slice(0, 5)
            .map(
              (s) =>
                `<li class="flex items-center justify-between gap-2 text-sm">
                  <span class="min-w-0 truncate">${escapeHtml(s.name)} <span class="font-mono text-xs text-muted-foreground">${escapeHtml(s.storeId)}</span></span>
                  ${renderStoreStatusBadge(s.status)}
                </li>`,
            )
            .join("");
          const more = brand.stores.length > 5 ? `<li class="text-muted-foreground text-xs">另有 ${brand.stores.length - 5} 家门店，请前往「品牌列表」查看</li>` : "";
          return `
          <article class="rounded-xl border border-border bg-card p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold text-card-foreground">${escapeHtml(brand.name)}</h3>
                <p class="mt-0.5 font-mono text-xs text-muted-foreground">${escapeHtml(brand.bid ?? "—")} · ${escapeHtml(brand.code)}</p>
              </div>
              <span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">${escapeHtml(brand.orgTypeLabel)}</span>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(brand.statusLabel)} · ${brand.stores.length} 家门店 · ${escapeHtml(summarizeBrandStoreStatuses(brand))}</p>
            ${
              brand.stores.length
                ? `<ul class="mt-3 space-y-1 text-sm text-foreground">${storePreview}${more}</ul>`
                : `<p class="mt-3 text-sm text-muted-foreground">暂无门店</p>`
            }
          </article>`;
        })
        .join("")}
    </div>`;
}

function renderStoreDetailCard(snapshot: ChainBrandOrgSnapshot, scope: EffectiveScope): string {
  const storeId = scope.storeIds[0];
  const hit = storeId ? findStoreInSnapshot(snapshot, storeId) : null;
  if (!hit) {
    return `<p class="text-sm text-muted-foreground">当前视角下未找到门店数据。</p>`;
  }
  const { brand, store } = hit;
  const hostNote = store.hostedUnderChainName
    ? `<p class="text-xs text-muted-foreground">组织归属：${escapeHtml(store.hostedUnderChainName)}</p>`
    : "";
  return `
    <article class="rounded-xl border border-border bg-card p-5">
      <p class="text-xs text-muted-foreground">所属品牌 · ${escapeHtml(brand.name)}</p>
      <h2 class="mt-1 text-lg font-semibold text-card-foreground">${escapeHtml(store.name)}</h2>
      <p class="mt-1 font-mono text-xs text-muted-foreground">${escapeHtml(store.storeId)} · ${escapeHtml(store.code)}</p>
      ${hostNote}
      <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt class="text-xs text-muted-foreground">区域</dt><dd class="font-medium">${escapeHtml(store.regionName ?? "—")}</dd></div>
        <div><dt class="text-xs text-muted-foreground">状态</dt><dd class="font-medium">${escapeHtml(formatChainStoreStatusLabel(store.status))}</dd></div>
        <div class="sm:col-span-2"><dt class="text-xs text-muted-foreground">地址</dt><dd class="font-medium">${escapeHtml(store.address ?? "—")}</dd></div>
      </dl>
    </article>`;
}

function renderBrandListTable(snapshot: ChainBrandOrgSnapshot): string {
  if (snapshot.brands.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">当前数据范围内尚无品牌或门店</p>`;
  }

  if (isGroupHqDataPerspective()) {
    return `
      <div class="space-y-3" data-brand-list-with-stores>
        ${snapshot.brands
          .map((brand) => {
            const open = brand.stores.length > 0;
            return `
          <details class="group rounded-xl border border-border bg-card" data-brand-list-brand="${escapeHtml(brand.merchantId)}" ${open ? "open" : ""}>
            <summary class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
                <span class="text-sm font-semibold text-card-foreground">${escapeHtml(brand.name)}</span>
                <span class="font-mono text-xs text-muted-foreground">BID ${escapeHtml(brand.bid ?? "—")}</span>
                <span class="text-xs text-muted-foreground">${escapeHtml(brand.orgTypeLabel)} · ${escapeHtml(brand.statusLabel)}</span>
              </div>
              <div class="flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span class="tabular-nums"><strong class="text-foreground">${brand.stores.length}</strong> 家门店</span>
                <span class="hidden sm:inline">· ${escapeHtml(summarizeBrandStoreStatuses(brand))}</span>
                <svg class="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </summary>
            ${renderBrandStoreRows(brand.stores)}
          </details>`;
          })
          .join("")}
      </div>`;
  }

  return `
    <div class="overflow-x-auto rounded-xl border border-border">
      <table class="w-full min-w-[56rem] text-sm">
        <thead class="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2.5 font-medium">品牌</th>
            <th class="px-3 py-2.5 font-medium">BID</th>
            <th class="px-3 py-2.5 font-medium">类型</th>
            <th class="px-3 py-2.5 font-medium">状态</th>
            <th class="px-3 py-2.5 font-medium">门店</th>
            <th class="px-3 py-2.5 font-medium">门店名称</th>
            <th class="px-3 py-2.5 font-medium">MID / 区域</th>
            <th class="px-3 py-2.5 font-medium">门店状态</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${snapshot.brands
            .flatMap((brand) => {
              if (brand.stores.length === 0) {
                return [
                  `<tr class="hover:bg-muted/30">
                    <td class="px-3 py-2.5 font-medium">${escapeHtml(brand.name)}</td>
                    <td class="px-3 py-2.5 font-mono text-xs">${escapeHtml(brand.bid ?? "—")}</td>
                    <td class="px-3 py-2.5">${escapeHtml(brand.orgTypeLabel)}</td>
                    <td class="px-3 py-2.5">${escapeHtml(brand.statusLabel)}</td>
                    <td class="px-3 py-2.5 tabular-nums">0</td>
                    <td class="px-3 py-2.5 text-muted-foreground" colspan="3">—</td>
                  </tr>`,
                ];
              }
              return brand.stores.map((store, idx) => {
                const brandCells =
                  idx === 0
                    ? `<td class="px-3 py-2.5 font-medium align-top" rowspan="${brand.stores.length}">${escapeHtml(brand.name)}</td>
                       <td class="px-3 py-2.5 font-mono text-xs align-top" rowspan="${brand.stores.length}">${escapeHtml(brand.bid ?? "—")}</td>
                       <td class="px-3 py-2.5 align-top" rowspan="${brand.stores.length}">${escapeHtml(brand.orgTypeLabel)}</td>
                       <td class="px-3 py-2.5 align-top" rowspan="${brand.stores.length}">${escapeHtml(brand.statusLabel)}</td>
                       <td class="px-3 py-2.5 tabular-nums align-top" rowspan="${brand.stores.length}">${brand.stores.length}</td>`
                    : "";
                const hostNote = store.hostedUnderChainName
                  ? `<span class="block text-xs text-muted-foreground">组织归属：${escapeHtml(store.hostedUnderChainName)}</span>`
                  : "";
                return `<tr class="hover:bg-muted/30">
                  ${brandCells}
                  <td class="px-3 py-2.5">
                    <span class="font-medium">${escapeHtml(store.name)}</span>
                    ${hostNote}
                  </td>
                  <td class="px-3 py-2.5 text-xs text-muted-foreground">
                    <span class="font-mono">${escapeHtml(store.storeId)}</span>
                    ${store.regionName ? `<span class="block">${escapeHtml(store.regionName)}</span>` : ""}
                  </td>
                  <td class="px-3 py-2.5 text-xs">${renderStoreStatusBadge(store.status)}</td>
                </tr>`;
              });
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function overviewIntro(scope: EffectiveScope): string {
  if (isStoreDataPerspective()) {
    return "门店视角：仅展示当前门店主数据（由 M 平台同步，商家后台只读）。";
  }
  if (isBrandDataPerspective()) {
    return "品牌多门店视角：展示当前品牌及其下属门店（由 M 平台同步，商家后台只读）。";
  }
  if (isGroupHqDataPerspective()) {
    return "集团总部视角：展示当前集团下全部品牌与门店（由 M 平台同步，商家后台只读）。";
  }
  return "集团品牌总览：一个集团包含多个品牌，每个品牌可拥有多家门店。";
}

function listIntro(scope: EffectiveScope): string {
  if (isStoreDataPerspective()) {
    return "门店视角：当前有效范围内的门店明细（只读）。";
  }
  if (isBrandDataPerspective()) {
    return "品牌多门店视角：当前品牌下的门店列表（只读）。";
  }
  if (isGroupHqDataPerspective()) {
    return "集团总部视角：按品牌展开查看下挂门店及营业状态（M 平台同步，只读）。点击品牌行可展开/收起门店明细。";
  }
  return "查看当前数据范围内各品牌及其门店（由 M 平台创建并同步，商家后台只读）。";
}

export function isChainBrandMgmtPath(path: string): boolean {
  if (path === "/brand/overview" || path === "/brand/list") return true;
  return false;
}

export function renderChainBrandMgmtPage(path: string): string {
  const ctx = resolveChainBrandContext();
  if (!ctx) {
    return `<div class="space-y-4" data-chain-brand-mgmt-page>${renderEmptyState()}</div>`;
  }

  const rawSnapshot = loadChainBrandOrgForContext();
  if (!rawSnapshot) {
    return `<div class="space-y-4" data-chain-brand-mgmt-page>${renderEmptyState()}</div>`;
  }

  const scope = resolveEffectiveScope();
  const snapshot = filterChainBrandSnapshotByEffectiveScope(rawSnapshot, scope);
  const banner = renderSyncBanner(snapshot, scope, ctx.demoFlow);

  if (path === "/brand/list") {
    return `
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-chain-brand-mgmt-page="list">
        ${banner}
        <p class="text-sm text-muted-foreground">${listIntro(scope)}</p>
        <div class="min-h-0 flex-1 overflow-y-auto">${renderBrandListTable(snapshot)}</div>
      </div>`;
  }

  const body = isStoreDataPerspective()
    ? renderStoreDetailCard(snapshot, scope)
    : `<div>
        <h2 class="mb-3 text-sm font-semibold text-card-foreground">${isBrandDataPerspective() ? "当前品牌" : "集团下品牌"}</h2>
        ${renderBrandCards(snapshot)}
      </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-chain-brand-mgmt-page="overview">
      ${banner}
      <p class="text-sm text-muted-foreground">${overviewIntro(scope)}</p>
      ${renderOverviewStats(snapshot, scope)}
      ${body}
    </div>`;
}

export function bindChainBrandMgmtControls(onMount?: () => void): void {
  document.querySelector<HTMLButtonElement>("[data-chain-brand-resync]")?.addEventListener("click", () => {
    const ctx = resolveChainBrandContext();
    if (!ctx) return;
    syncChainBrandOrgForGroup(ctx.groupId);
    window.dispatchEvent(new CustomEvent("menusifu:chain-brand-synced"));
    onMount?.();
  });

  if (!onMount || typeof window === "undefined") return;
  const win = window as Window & { __menusifuChainBrandScopeBound?: boolean };
  if (win.__menusifuChainBrandScopeBound) return;
  win.__menusifuChainBrandScopeBound = true;

  const refresh = () => {
    const hash = location.hash.replace(/^#/, "") || "/";
    const path = hash.split("?")[0] ?? "/";
    if (isChainBrandMgmtPath(path)) onMount();
  };
  window.addEventListener("menusifu:scope-filter-change", refresh);
  window.addEventListener("menusifu:scope-perspective-change", refresh);
  window.addEventListener("menusifu:merchant-group-change", refresh);
  window.addEventListener("menusifu:chain-brand-synced", refresh);
}
