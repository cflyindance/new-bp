/**
 * 商家后台 · 连锁门店 · 品牌管理（/brand/*）
 * 展示 M 平台同步的集团 / 品牌 / 门店主数据（只读）。
 */
import {
  formatChainStoreStatusLabel,
  loadChainBrandOrgForContext,
  resolveChainBrandContext,
  syncChainBrandOrgForGroup,
  type ChainBrandOrgSnapshot,
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
      <p class="text-sm font-medium text-card-foreground">暂无集团品牌数据</p>
      <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
        集团及品牌由 M 平台统一创建与维护。请使用<strong class="text-foreground">连锁集团账号</strong>登录（如 <code class="rounded bg-muted px-1 font-mono text-xs">zhangji.admin@menusifu.cn</code>），或通过 M 平台「代登录」进入商家后台后查看。
      </p>
    </div>`;
}

function renderSyncBanner(snapshot: ChainBrandOrgSnapshot, anchorName: string, demoFlow?: boolean): string {
  const demoTag = demoFlow
    ? `<span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">连锁版 · M 平台数据流转演示</span>`
    : "";
  return `
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <span class="flex flex-wrap items-center gap-2">
        <span>
          数据来自 M 平台 · 集团 <strong class="text-foreground">${escapeHtml(snapshot.groupName)}</strong>
          · 当前视角 <strong class="text-foreground">${escapeHtml(anchorName)}</strong>
        </span>
        ${demoTag}
      </span>
      <span>最近同步 ${formatDate(snapshot.syncedAt)}</span>
    </div>`;
}

function renderOverviewStats(snapshot: ChainBrandOrgSnapshot): string {
  const storeCount = snapshot.brands.reduce((sum, b) => sum + b.stores.length, 0);
  const activeBrands = snapshot.brands.filter((b) => b.status === "active").length;
  const kpi = (label: string, value: string | number) =>
    `<div class="rounded-xl border border-border bg-card p-4"><p class="text-xs text-muted-foreground">${escapeHtml(label)}</p><p class="mt-1 text-2xl font-semibold tabular-nums">${escapeHtml(String(value))}</p></div>`;

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
    return `<p class="text-sm text-muted-foreground">该集团下尚无品牌。</p>`;
  }
  return `
    <div class="grid gap-4 lg:grid-cols-2">
      ${snapshot.brands
        .map((brand) => {
          const storePreview = brand.stores
            .slice(0, 3)
            .map((s) => `<li class="truncate">${escapeHtml(s.name)} <span class="text-muted-foreground">(${escapeHtml(s.storeId)})</span></li>`)
            .join("");
          const more = brand.stores.length > 3 ? `<li class="text-muted-foreground">另有 ${brand.stores.length - 3} 家门店…</li>` : "";
          return `
          <article class="rounded-xl border border-border bg-card p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 class="text-sm font-semibold text-card-foreground">${escapeHtml(brand.name)}</h3>
                <p class="mt-0.5 font-mono text-xs text-muted-foreground">${escapeHtml(brand.bid ?? "—")} · ${escapeHtml(brand.code)}</p>
              </div>
              <span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">${escapeHtml(brand.orgTypeLabel)}</span>
            </div>
            <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(brand.statusLabel)} · ${brand.stores.length} 家门店</p>
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

function renderBrandListTable(snapshot: ChainBrandOrgSnapshot): string {
  if (snapshot.brands.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">该集团下尚无品牌</p>`;
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
            <th class="px-3 py-2.5 font-medium">BID / 区域</th>
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
                  <td class="px-3 py-2.5 text-xs">${escapeHtml(formatChainStoreStatusLabel(store.status))}</td>
                </tr>`;
              });
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
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

  const snapshot = loadChainBrandOrgForContext();
  if (!snapshot) {
    return `<div class="space-y-4" data-chain-brand-mgmt-page>${renderEmptyState()}</div>`;
  }

  const banner = renderSyncBanner(snapshot, ctx.anchorMerchantName, ctx.demoFlow);

  if (path === "/brand/list") {
    return `
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" data-chain-brand-mgmt-page="list">
        ${banner}
        <p class="text-sm text-muted-foreground">查看当前集团下各品牌及其门店（由 M 平台创建并同步，商家后台只读）。</p>
        <div class="min-h-0 flex-1 overflow-y-auto">${renderBrandListTable(snapshot)}</div>
      </div>`;
  }

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" data-chain-brand-mgmt-page="overview">
      ${banner}
      <p class="text-sm text-muted-foreground">集团品牌总览：一个集团包含多个品牌，每个品牌可拥有多家门店。</p>
      ${renderOverviewStats(snapshot)}
      <div>
        <h2 class="mb-3 text-sm font-semibold text-card-foreground">集团下品牌</h2>
        ${renderBrandCards(snapshot)}
      </div>
    </div>`;
}

export function bindChainBrandMgmtControls(): void {
  document.querySelector<HTMLButtonElement>("[data-chain-brand-resync]")?.addEventListener("click", () => {
    const ctx = resolveChainBrandContext();
    if (!ctx) return;
    syncChainBrandOrgForGroup(ctx.groupId);
    window.dispatchEvent(new CustomEvent("menusifu:chain-brand-synced"));
  });
}
