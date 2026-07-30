/**
 * 平台预设 · 列表页与四列编辑页（支持商家级 / 企业级作用域）
 */
import type { PresetChangeItem } from "./platform-preset-changelog-diff";
import {
  renderFourColumnMatrix,
  renderFourColumnMatrixShell,
  rerenderFourColumnMatrix,
  syncFourColumnIndeterminate,
  resolveFourColumnHeaders,
} from "./permission-four-column-ui";
import {
  PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES,
  PLATFORM_PRESET_PRODUCT_LINES,
  businessTypeLabel,
  getPresetEditModuleTier,
  productLineLabel,
  type ProductLineId,
} from "./platform-preset-catalog";
import type { PresetScopeConfig } from "./platform-preset-scope";
import {
  MERCHANT_PLATFORM_PRESET_SCOPE,
  canAddCustomBusinessTypes,
  getPresetScopeForPath,
  isAnyPlatformPresetPath,
  isMerchantPlatformPresetPath,
  listCustomBusinessTypesForScope,
  parsePlatformPresetEditPathForScope,
} from "./platform-preset-scope";
import {
  buildPresetEditorPlatformPresetIndex,
  describePlatformPresetTreeSource,
  resolvePlatformPresetTreeOptions,
  type PlatformPresetTreeOptions,
} from "./platform-preset-tree";
import {
  clampSelectedBusinessTypeId,
  filterProductLinesForMerchantView,
  formatMerchantViewAppliedAt,
  formatMerchantViewScopeLabels,
  isComboInMerchantViewScope,
  resolveMerchantPresetViewScope,
  type MerchantPresetViewScope,
} from "./platform-preset-merchant-view";
import { ONBOARDING_PATH } from "./platform-preset-onboarding";
import { shouldShowRestartOnboardingControl } from "./product-version";
import {
  formatMerchantPresetSyncStatusLabel,
  resolveMerchantPresetSyncStatus,
  syncEnterprisePresetsToMerchant,
} from "./platform-preset-enterprise-sync";
import {
  formatBlueprintVersionLabel,
  getActivePublishedBlueprint,
} from "./nav-blueprint-sync";
import {
  cascadeEnableSelection,
  normalizeSelectionForSnapshot,
  type PlatformPresetChangeLogEntry,
  type PlatformPresetNodeSelection,
  type PlatformPresetSnapshot,
} from "./platform-preset-store";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPlatformPresetPath(path: string): boolean {
  return isMerchantPlatformPresetPath(path);
}

export function parsePlatformPresetEditPath(path: string): {
  businessTypeId: string;
  productLineId: ProductLineId;
} | null {
  return parsePlatformPresetEditPathForScope(path, MERCHANT_PLATFORM_PRESET_SCOPE);
}

function renderBusinessTypeNavItem(
  id: string,
  label: string,
  selected: boolean,
  badge?: number,
  custom = false,
  allowCustomEdit = false,
): string {
  return `
    <li>
      <button
        type="button"
        data-pp-select-bt="${escapeHtml(id)}"
        class="flex w-full min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted/60"}"
      >
        <span class="min-w-0 flex-1 truncate">${escapeHtml(label)}</span>
        ${badge != null ? `<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">${badge}</span>` : ""}
        ${custom && allowCustomEdit ? `<span class="shrink-0 text-xs text-muted-foreground" data-pp-custom-actions="${escapeHtml(id)}">编辑</span>` : ""}
      </button>
    </li>`;
}

function renderProductLineCard(
  scope: PresetScopeConfig,
  businessTypeId: string,
  lineId: ProductLineId,
): string {
  const store = scope.store;
  const published = store.getPublishedSnapshot(businessTypeId, lineId);
  const displaySnap = published ?? store.getDefaultPresetSnapshot(businessTypeId, lineId);
  const recSettings = store.countRecommendedSettings(businessTypeId, lineId);
  const enabledSettings = store.countEnabledSettings(displaySnap);
  const version = published?.version ?? 0;
  const comboSlug = `${businessTypeId}:${lineId}`;
  const editHref = `#${scope.routePrefix}/${encodeURIComponent(businessTypeId)}/${encodeURIComponent(lineId)}/edit`;
  const syncStatus =
    scope.scope === "merchant"
      ? formatMerchantPresetSyncStatusLabel(
          resolveMerchantPresetSyncStatus(businessTypeId, lineId),
        )
      : null;
  const blueprintTag =
    published?.blueprintVersion
      ? ` · 蓝图 v${published.blueprintVersion}`
      : "";

  return `
    <article class="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3" data-pp-line-card="${escapeHtml(lineId)}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-base font-semibold text-card-foreground">${escapeHtml(productLineLabel(lineId))}</h3>
          <p class="mt-0.5 font-mono text-xs text-muted-foreground">${escapeHtml(comboSlug)}</p>
        </div>
        <span class="shrink-0 text-xs tabular-nums text-muted-foreground">${escapeHtml(scope.versionBadge(version, Boolean(published)))}${escapeHtml(blueprintTag)}</span>
      </div>
      <p class="text-sm text-muted-foreground">
        业态推荐 <strong class="text-card-foreground">${recSettings}</strong> 项 ·
        当前启用 <strong class="text-card-foreground">${enabledSettings}</strong> 项
        ${syncStatus ? `<span class="block mt-1 text-xs">${escapeHtml(syncStatus)}</span>` : ""}
      </p>
      <div class="mt-auto flex flex-wrap gap-2 pt-1">
        <a href="${editHref}" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">配置预设</a>
        <button type="button" data-pp-changelog="${escapeHtml(businessTypeId)}:${escapeHtml(lineId)}" class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">变更记录</button>
      </div>
    </article>`;
}

function renderMerchantPresetContextBanner(viewScope: MerchantPresetViewScope): string {
  const { businessTypes, productLines } = formatMerchantViewScopeLabels(viewScope);
  const applied = formatMerchantViewAppliedAt(viewScope.appliedAt);
  return `
    <div class="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <p class="text-card-foreground">
        当前门店（来自登录引导）：
        <strong>${escapeHtml(businessTypes)}</strong>
        ·
        <strong>${escapeHtml(productLines)}</strong>
      </p>
      <p class="mt-1 text-xs text-muted-foreground">
        共 ${viewScope.comboCount} 组预设并集${applied ? ` · 上次应用 ${escapeHtml(applied)}` : ""}
      </p>
      ${
        shouldShowRestartOnboardingControl()
          ? `<button
        type="button"
        data-restart-onboarding
        data-future-version-diff
        class="mt-2 text-xs font-medium text-primary hover:underline"
      >重新引导</button>`
          : ""
      }
    </div>`;
}

function renderMerchantPresetNoContextEmpty(): string {
  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-pp-list data-pp-scope="merchant">
      <div class="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
        <h2 class="text-lg font-semibold text-card-foreground">尚未确定本店业态与产线范围</h2>
        <p class="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          平台预设仅展示登录引导中所选的经营业态与产线。请先完成引导，再在此配置各组合的功能范围。
        </p>
        <a
          href="#${ONBOARDING_PATH}"
          class="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >去引导</a>
      </div>
    </div>`;
}

function renderPlatformPresetListMainPanel(
  scope: PresetScopeConfig,
  selectedId: string,
  viewScope?: MerchantPresetViewScope,
): string {
  const store = scope.store;
  const customTypes = listCustomBusinessTypesForScope(scope);
  const selectedLabel = businessTypeLabel(
    selectedId,
    customTypes.find((c) => c.id === selectedId)?.label,
  );
  const visibleLines =
    scope.scope === "merchant" && viewScope?.hasContext
      ? filterProductLinesForMerchantView(viewScope)
      : PLATFORM_PRESET_PRODUCT_LINES;
  const lineCards = visibleLines
    .map((l) => renderProductLineCard(scope, selectedId, l.id))
    .join("");
  const recL1 = store.countRecommendedLevel1(selectedId, visibleLines[0]?.id ?? "pos");
  const contextBanner =
    scope.scope === "merchant" && viewScope?.hasContext
      ? renderMerchantPresetContextBanner(viewScope)
      : "";
  const blueprint = scope.scope === "enterprise" ? getActivePublishedBlueprint() : undefined;
  const enterpriseToolbar =
    scope.scope === "enterprise"
      ? `<button type="button" data-pp-sync-merchant class="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15">同步到商家后台</button>`
      : "";

  return `
        ${contextBanner ? `<div class="mb-4">${contextBanner}</div>` : ""}
        ${
          scope.scope === "enterprise"
            ? `<div class="mb-4 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-muted-foreground">
          当前导航结构：<strong class="text-card-foreground">${escapeHtml(formatBlueprintVersionLabel(blueprint))}</strong>。
          菜单路由发布后请同步至平台预设，再下发商家后台。
        </div>`
            : ""
        }
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-card-foreground">${escapeHtml(selectedLabel)} · 产线预设</h2>
            <p class="mt-1 max-w-2xl text-sm text-muted-foreground">${escapeHtml(scope.listIntro)}</p>
            <p class="mt-2 text-xs text-muted-foreground">业态功能画像：核心 ${recL1 || "—"} · 推荐 — · 可选 —</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${enterpriseToolbar}
            <button type="button" data-pp-list-changelog class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">变更记录</button>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">${lineCards || `<p class="text-sm text-muted-foreground col-span-full">当前引导范围内无产线可配置。</p>`}</div>`;
}

function syncPlatformPresetBusinessTypeNavSelection(selectedId: string): void {
  document.querySelectorAll<HTMLElement>("[data-pp-select-bt]").forEach((btn) => {
    const active = btn.dataset.ppSelectBt === selectedId;
    btn.classList.toggle("bg-primary/10", active);
    btn.classList.toggle("font-medium", active);
    btn.classList.toggle("text-primary", active);
    btn.classList.toggle("text-foreground", !active);
    btn.classList.toggle("hover:bg-muted/60", !active);
  });
}

export function patchPlatformPresetListSelection(scope: PresetScopeConfig, businessTypeId: string): void {
  const root = document.querySelector<HTMLElement>(`[data-pp-list][data-pp-scope="${scope.scope}"]`);
  if (!root) return;
  root.dataset.selectedBt = businessTypeId;
  syncPlatformPresetBusinessTypeNavSelection(businessTypeId);
  const main = root.querySelector<HTMLElement>("[data-pp-list-main]");
  const viewScope = scope.scope === "merchant" ? resolveMerchantPresetViewScope() : undefined;
  if (main) main.innerHTML = renderPlatformPresetListMainPanel(scope, businessTypeId, viewScope);
}

function formatPlatformPresetChangelogTime(at: string): string {
  return at.slice(0, 19).replace("T", " ");
}

function renderPresetChangeItemList(items: PresetChangeItem[] | undefined, emptyText: string): string {
  if (!items?.length) {
    return `<p class="text-xs text-muted-foreground">${escapeHtml(emptyText)}</p>`;
  }
  return `<ul class="max-h-48 space-y-1 overflow-y-auto text-sm" role="list">
    ${items
      .map(
        (item) => `<li class="rounded-md border border-border/60 bg-background px-2.5 py-1.5">
          <span class="mr-1.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">${escapeHtml(item.levelLabel)}</span>
          <span class="text-card-foreground">${escapeHtml(item.pathLabel)}</span>
        </li>`,
      )
      .join("")}
  </ul>`;
}

function renderPresetChangeSection(
  title: string,
  count: number,
  items: PresetChangeItem[] | undefined,
  tone: "add" | "remove" | "display-on" | "display-off",
): string {
  if (!count) return "";
  const toneClass =
    tone === "add"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "remove"
        ? "text-rose-700 dark:text-rose-400"
        : tone === "display-on"
          ? "text-sky-700 dark:text-sky-400"
          : "text-amber-700 dark:text-amber-400";
  return `
    <div>
      <p class="mb-1.5 text-xs font-semibold ${toneClass}">${escapeHtml(title)}（${count}）</p>
      ${renderPresetChangeItemList(items, "无")}
    </div>`;
}

function renderPlatformPresetChangelogEntryDetails(e: PlatformPresetChangeLogEntry): string {
  const added = e.enabledAdded?.length ?? 0;
  const removed = e.enabledRemoved?.length ?? 0;
  const displayOn = e.displayAdded?.length ?? 0;
  const displayOff = e.displayRemoved?.length ?? 0;
  const hasDetail = added + removed + displayOn + displayOff > 0;

  if (!hasDetail) {
    return `<p class="px-4 pb-4 text-xs text-muted-foreground">本条为历史摘要记录，无明细数据。请重新发布后将记录完整变更项。</p>`;
  }

  return `
    <div class="space-y-4 border-t border-border bg-muted/20 px-4 py-4">
      ${renderPresetChangeSection("新增启用", added, e.enabledAdded, "add")}
      ${renderPresetChangeSection("取消启用", removed, e.enabledRemoved, "remove")}
      ${renderPresetChangeSection("开启展示", displayOn, e.displayAdded, "display-on")}
      ${renderPresetChangeSection("关闭展示", displayOff, e.displayRemoved, "display-off")}
    </div>`;
}

function renderPlatformPresetChangelogRows(
  entries: PlatformPresetChangeLogEntry[],
  showProductLine: boolean,
): string {
  if (entries.length === 0) {
    return `<p class="px-4 py-10 text-center text-sm text-muted-foreground">暂无变更记录</p>`;
  }

  return `<div class="divide-y divide-border">
    ${entries
      .map(
        (e) => `
      <details class="group bg-card">
        <summary class="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
          <span class="shrink-0 text-muted-foreground">${escapeHtml(formatPlatformPresetChangelogTime(e.at))}</span>
          ${
            showProductLine
              ? `<span class="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-card-foreground">${escapeHtml(productLineLabel(e.productLineId))}</span>`
              : ""
          }
          <span class="shrink-0 font-mono text-xs font-medium text-primary">v${e.version}</span>
          <span class="min-w-0 flex-1 truncate text-card-foreground">${escapeHtml(e.actor)}</span>
          <span class="w-full text-xs text-muted-foreground sm:w-auto sm:max-w-[50%] sm:text-right">${escapeHtml(e.summary)}</span>
          <span class="shrink-0 text-xs text-muted-foreground group-open:hidden">展开明细</span>
          <span class="hidden shrink-0 text-xs text-muted-foreground group-open:inline">收起明细</span>
        </summary>
        ${renderPlatformPresetChangelogEntryDetails(e)}
      </details>`,
      )
      .join("")}
  </div>`;
}

function renderPlatformPresetChangelogDialog(
  title: string,
  entries: PlatformPresetChangeLogEntry[],
  showProductLine: boolean,
): string {
  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

  return `
    <div
      id="pp-changelog-dialog"
      class="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pp-changelog-dialog-title"
      tabindex="-1"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        data-pp-changelog-backdrop
        aria-label="关闭"
      ></button>
      <div class="relative z-[1] flex max-h-[min(92dvh,40rem)] w-full max-w-4xl min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="min-w-0">
            <h2 id="pp-changelog-dialog-title" class="truncate text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">共 ${entries.length} 条记录；点击条目展开新增/删除变更明细</p>
          </div>
          <button
            type="button"
            data-pp-changelog-close
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="关闭"
          >
            ${closeIcon}
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-auto">
          ${renderPlatformPresetChangelogRows(entries, showProductLine)}
        </div>
        <div class="flex shrink-0 justify-end border-t border-border px-4 py-3">
          <button type="button" data-pp-changelog-close class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">关闭</button>
        </div>
      </div>
    </div>`;
}

function closePlatformPresetChangelogDialog(): void {
  document.getElementById("pp-changelog-dialog")?.remove();
}

function openPlatformPresetChangelogDialog(
  title: string,
  entries: PlatformPresetChangeLogEntry[],
  showProductLine: boolean,
): void {
  closePlatformPresetChangelogDialog();
  const host = document.createElement("div");
  host.innerHTML = renderPlatformPresetChangelogDialog(title, entries, showProductLine);
  const dialog = host.firstElementChild;
  if (!dialog) return;
  document.body.appendChild(dialog);
  (dialog as HTMLElement).focus({ preventScroll: true });
}

let platformPresetChangelogDialogBound = false;

function bindPlatformPresetChangelogDialog(): void {
  if (platformPresetChangelogDialogBound) return;
  platformPresetChangelogDialogBound = true;

  document.body.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    if (target.closest("[data-pp-changelog-close]") || target.closest("[data-pp-changelog-backdrop]")) {
      closePlatformPresetChangelogDialog();
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && document.getElementById("pp-changelog-dialog")) {
      closePlatformPresetChangelogDialog();
    }
  });
}

export function renderPlatformPresetListPage(scope: PresetScopeConfig): string {
  const store = scope.store;
  const viewScope = scope.scope === "merchant" ? resolveMerchantPresetViewScope() : undefined;

  if (scope.scope === "merchant" && !viewScope?.hasContext) {
    return renderMerchantPresetNoContextEmpty();
  }

  const allowedBusinessTypeIds =
    scope.scope === "merchant" && viewScope?.hasContext ? viewScope.businessTypeIds : null;

  let selectedId = store.readSelectedBusinessTypeId();
  if (allowedBusinessTypeIds) {
    const clamped = clampSelectedBusinessTypeId(selectedId, allowedBusinessTypeIds);
    if (clamped !== selectedId) {
      selectedId = clamped;
      store.writeSelectedBusinessTypeId(selectedId);
    }
  }

  const allowCustomAdd = canAddCustomBusinessTypes(scope);
  const allowedBtSet = allowedBusinessTypeIds ? new Set(allowedBusinessTypeIds) : null;

  const serviceItems = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter(
    (b) => b.category === "service-mode" && (!allowedBtSet || allowedBtSet.has(b.id)),
  )
    .map((b) =>
      renderBusinessTypeNavItem(
        b.id,
        b.label,
        b.id === selectedId,
        store.countPublishedLinesForBusinessType(b.id),
      ),
    )
    .join("");

  const categoryItems = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter(
    (b) => b.category === "category" && (!allowedBtSet || allowedBtSet.has(b.id)),
  )
    .map((b) =>
      renderBusinessTypeNavItem(
        b.id,
        b.label,
        b.id === selectedId,
        store.countPublishedLinesForBusinessType(b.id),
      ),
    )
    .join("");

  const customTypes = listCustomBusinessTypesForScope(scope).filter(
    (c) => !allowedBtSet || allowedBtSet.has(c.id),
  );
  const customItems = customTypes
    .map((c) =>
      renderBusinessTypeNavItem(
        c.id,
        c.label,
        c.id === selectedId,
        store.countPublishedLinesForBusinessType(c.id),
        true,
        allowCustomAdd,
      ),
    )
    .join("");

  const addButton = allowCustomAdd
    ? `<button type="button" data-pp-add-custom class="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">+ 新增</button>`
    : "";
  const merchantHint = allowCustomAdd
    ? ""
    : `<p class="mb-3 text-xs text-muted-foreground">业态目录由 M 平台维护，商家后台不支持新增。</p>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch" data-pp-list data-pp-scope="${scope.scope}" data-selected-bt="${escapeHtml(selectedId)}">
      <aside class="flex w-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:w-72 lg:self-stretch">
        <div class="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold text-card-foreground">经营业态</h2>
          ${addButton}
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-sm max-h-[min(45dvh,22rem)] lg:max-h-none" data-pp-business-type-scroll>
          ${merchantHint}
          <div class="space-y-4">
            <div>
              <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">按服务方式</p>
              <ul class="space-y-0.5" role="list">${serviceItems}</ul>
            </div>
            <div>
              <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">按品类</p>
              <ul class="space-y-0.5" role="list">${categoryItems}</ul>
            </div>
            ${
              customItems
                ? `<div>
              <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">自定义业态</p>
              <ul class="space-y-0.5" role="list">${customItems}</ul>
            </div>`
                : ""
            }
          </div>
        </div>
      </aside>
      <div class="min-w-0 min-h-0 flex-1 space-y-4 overflow-y-auto" data-pp-list-main>
        ${renderPlatformPresetListMainPanel(scope, selectedId, viewScope)}
      </div>
    </div>`;
}

export function renderPlatformPresetEditPage(
  scope: PresetScopeConfig,
  businessTypeId: string,
  productLineId: ProductLineId,
): string {
  const store = scope.store;
  const snapshot = store.getOrCreateDraftSelection(businessTypeId, productLineId);
  const selection = normalizeSelectionForSnapshot(snapshot);
  const treeOptions = resolvePlatformPresetTreeOptions(scope.scope, snapshot);
  const index = buildPresetEditorPlatformPresetIndex(productLineId, treeOptions);
  const customTypes = listCustomBusinessTypesForScope(scope);
  const customTiers = customTypes.find((c) => c.id === businessTypeId)?.moduleTiers;
  const btLabel = businessTypeLabel(
    businessTypeId,
    customTypes.find((c) => c.id === businessTypeId)?.label,
  );
  const plLabel = productLineLabel(productLineId);

  const activeL1 = index.groups[0]?.moduleKey ?? "";
  const activeL2 = index.groups[0]?.tree.children[0]?.resource.key ?? "";
  const activeL3 = index.groups[0]?.tree.children[0]?.children[0]?.resource.key ?? "";
  const enabledL1 = countEnabledLevel1ForSelection(selection, productLineId, treeOptions);
  const recCount = store.countRecommendedSettings(businessTypeId, productLineId);
  const initialL2Node = index.groups[0]?.tree.children[0];
  const columnHeaders = resolveFourColumnHeaders(initialL2Node);

  const { col1, col2, col3, col4 } = renderFourColumnMatrix(
    selection,
    index,
    activeL1,
    activeL2,
    activeL3,
    "",
    (moduleId) => getPresetEditModuleTier(businessTypeId, productLineId, moduleId, customTiers),
  );

  const listHref = `#${scope.routePrefix}`;
  const blueprint = getActivePublishedBlueprint();
  const { hint: navStructureHint } = describePlatformPresetTreeSource(snapshot);

  return `
    <div
      class="flex min-h-0 flex-1 flex-col gap-4"
      data-pp-editor
      data-pp-scope="${scope.scope}"
      data-bt="${escapeHtml(businessTypeId)}"
      data-pl="${escapeHtml(productLineId)}"
      data-active-l1="${escapeHtml(activeL1)}"
      data-active-l2="${escapeHtml(activeL2)}"
      data-active-l3="${escapeHtml(activeL3)}"
      data-version="${snapshot.version}"
      data-synced-blueprint-version="${snapshot.blueprintVersion ?? ""}"
    >
      <input type="hidden" data-pp-selection-json value="${escapeHtml(JSON.stringify(selection))}" />
      <div class="rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-muted-foreground">
        基于<strong class="text-card-foreground">${escapeHtml(btLabel)}</strong>业态，系统默认推荐
        <strong class="text-card-foreground">${recCount}</strong> 项功能设置；带标签项可作为业态分级参考。
        当前已启用 <strong class="text-card-foreground">${enabledL1}</strong> 个一级导航。
        ${escapeHtml(navStructureHint)}
        ${scope.scope === "enterprise" ? ` 当前蓝图：${escapeHtml(formatBlueprintVersionLabel(blueprint))}。` : ""}
        ${escapeHtml(scope.editorHint)}
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <a href="${listHref}" class="text-sm text-primary hover:underline">← 返回产线列表</a>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-pp-restore-defaults class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">恢复业态推荐默认</button>
        </div>
      </div>
      <div class="min-h-0 flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div class="border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold text-card-foreground">按导航树配置功能</h2>
          <p class="text-xs text-muted-foreground mt-0.5">配置预设 · ${escapeHtml(btLabel)} · ${escapeHtml(plLabel)}</p>
          <p class="text-xs text-muted-foreground mt-1">分组内功能 / 设置：勾选即展示，未勾选则不展示。</p>
        </div>
        ${renderFourColumnMatrixShell(col1, col2, col3, col4, columnHeaders)}
      </div>
      <div class="flex flex-wrap gap-3 shrink-0">
        <button type="button" data-pp-publish class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          保存并发布 v${snapshot.version + 1}
        </button>
        <a href="${listHref}" class="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted">取消</a>
      </div>
    </div>`;
}

function countEnabledLevel1ForSelection(
  selection: Record<string, PlatformPresetNodeSelection>,
  productLineId: ProductLineId,
  treeOptions?: PlatformPresetTreeOptions,
): number {
  const { groups } = buildPresetEditorPlatformPresetIndex(productLineId, treeOptions);
  return groups.filter((g) => selection[g.moduleKey]?.enabled).length;
}

export function findPlatformPresetPageTitle(
  path: string,
  scope: PresetScopeConfig = getPresetScopeForPath(path),
): { title: string; module: string } | null {
  if (!path.startsWith(scope.routePrefix)) return null;
  const edit = parsePlatformPresetEditPathForScope(path, scope);
  if (edit) {
    const customTypes = listCustomBusinessTypesForScope(scope);
    const btLabel = businessTypeLabel(
      edit.businessTypeId,
      customTypes.find((c) => c.id === edit.businessTypeId)?.label,
    );
    return {
      title: `配置预设 · ${btLabel} · ${productLineLabel(edit.productLineId)}`,
      module: scope.moduleLabel,
    };
  }
  if (path === scope.routePrefix || path.startsWith(`${scope.routePrefix}/`)) {
    return { title: "平台预设", module: scope.moduleLabel };
  }
  return null;
}

export function guardMerchantPlatformPresetPath(path: string): {
  path: string;
  rejectedEdit: boolean;
} {
  const edit = parsePlatformPresetEditPathForScope(path, MERCHANT_PLATFORM_PRESET_SCOPE);
  if (!edit) return { path, rejectedEdit: false };
  if (isComboInMerchantViewScope(edit.businessTypeId, edit.productLineId)) {
    return { path, rejectedEdit: false };
  }
  return { path: MERCHANT_PLATFORM_PRESET_SCOPE.routePrefix, rejectedEdit: true };
}

export function renderPlatformPresetPage(path: string, scope: PresetScopeConfig = getPresetScopeForPath(path)): string {
  const edit = parsePlatformPresetEditPathForScope(path, scope);
  if (edit) return renderPlatformPresetEditPage(scope, edit.businessTypeId, edit.productLineId);
  return renderPlatformPresetListPage(scope);
}

function readSelectionFromEditor(editor: HTMLElement): Record<string, PlatformPresetNodeSelection> {
  const raw = editor.querySelector<HTMLInputElement>("[data-pp-selection-json]")?.value;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, PlatformPresetNodeSelection>;
    } catch {
      /* fall through */
    }
  }
  return {};
}

function writeSelectionToEditor(editor: HTMLElement, selection: Record<string, PlatformPresetNodeSelection>): void {
  const input = editor.querySelector<HTMLInputElement>("[data-pp-selection-json]");
  if (input) input.value = JSON.stringify(selection);
}

function rerenderEditorColumns(editor: HTMLElement, scope: PresetScopeConfig): void {
  const bt = editor.dataset.bt!;
  const pl = editor.dataset.pl! as ProductLineId;
  const selection = readSelectionFromEditor(editor);
  const syncedBv = editor.dataset.syncedBlueprintVersion
    ? Number(editor.dataset.syncedBlueprintVersion)
    : undefined;
  const treeOptions = resolvePlatformPresetTreeOptions(scope.scope, {
    blueprintVersion: syncedBv && syncedBv > 0 ? syncedBv : undefined,
  });
  const index = buildPresetEditorPlatformPresetIndex(pl, treeOptions);
  const customTiers = listCustomBusinessTypesForScope(scope).find((c) => c.id === bt)?.moduleTiers;
  rerenderFourColumnMatrix(editor, selection, index, "", (moduleId) =>
    getPresetEditModuleTier(bt, pl, moduleId, customTiers),
  );
}

function resolveScopeFromElement(el: HTMLElement | null): PresetScopeConfig | null {
  if (!el) return null;
  const scopeAttr = el.dataset.ppScope;
  if (scopeAttr === "enterprise") return getPresetScopeForPath("/m-platform/platform-preset");
  if (scopeAttr === "merchant") return MERCHANT_PLATFORM_PRESET_SCOPE;
  return null;
}

const boundScopes = new Set<string>();

export function bindPlatformPreset(onMount: () => void, scope: PresetScopeConfig): void {
  bindPlatformPresetChangelogDialog();
  if (boundScopes.has(scope.scope)) return;
  boundScopes.add(scope.scope);

  function syncIndeterminateCheckboxes(): void {
    syncFourColumnIndeterminate(document);
  }

  document.body.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    const listRoot = target.closest<HTMLElement>("[data-pp-list]");
    const listScope = resolveScopeFromElement(listRoot);
    if (listScope && listScope.scope !== scope.scope) return;

    const editorRoot = target.closest<HTMLElement>("[data-pp-editor]");
    const editorScope = resolveScopeFromElement(editorRoot);
    if (editorRoot && editorScope && editorScope.scope !== scope.scope) return;

    const selectBt = target.closest<HTMLElement>("[data-pp-select-bt]");
    if (selectBt && listScope?.scope === scope.scope) {
      const id = selectBt.dataset.ppSelectBt!;
      if (id === listRoot?.dataset.selectedBt) return;
      scope.store.writeSelectedBusinessTypeId(id);
      if (listRoot) {
        patchPlatformPresetListSelection(scope, id);
      } else {
        onMount();
      }
      return;
    }

    if (target.closest("[data-pp-add-custom]") && listScope?.scope === scope.scope) {
      if (!canAddCustomBusinessTypes(scope)) return;
      const label = window.prompt("自定义业态名称");
      if (!label?.trim()) return;
      scope.store.upsertCustomBusinessType(label.trim());
      onMount();
      return;
    }

    const changelogBtn = target.closest<HTMLElement>("[data-pp-changelog]");
    if (changelogBtn && listScope?.scope === scope.scope) {
      const [bt, pl] = (changelogBtn.dataset.ppChangelog ?? "").split(":");
      if (!bt || !pl) return;
      const customTypes = listCustomBusinessTypesForScope(scope);
      const btLabel = businessTypeLabel(bt, customTypes.find((c) => c.id === bt)?.label);
      const plLabel = productLineLabel(pl as ProductLineId);
      const entries = scope.store.getChangelogForCombo(bt, pl as ProductLineId);
      openPlatformPresetChangelogDialog(`${btLabel} · ${plLabel} · 变更记录`, entries, false);
      return;
    }

    if (target.closest("[data-pp-list-changelog]") && listScope?.scope === scope.scope) {
      const selectedId = listRoot?.dataset.selectedBt ?? scope.store.readSelectedBusinessTypeId();
      const customTypes = listCustomBusinessTypesForScope(scope);
      const btLabel = businessTypeLabel(
        selectedId,
        customTypes.find((c) => c.id === selectedId)?.label,
      );
      const entries = scope.store.getChangelogForBusinessType(selectedId);
      openPlatformPresetChangelogDialog(`${btLabel} · 全部产线变更记录`, entries, true);
      return;
    }

    if (target.closest("[data-pp-sync-merchant]") && listScope?.scope === "enterprise" && scope.scope === "enterprise") {
      const force = window.confirm(
        "将企业级平台预设同步到商家后台？\n\n· 未自定义的商家组合将被覆盖\n· 已自定义的组合将跳过\n\n确定继续？",
      );
      if (!force) return;
      const result = syncEnterprisePresetsToMerchant();
      window.alert(`已同步 ${result.updated} 个组合，跳过 ${result.skipped} 个已自定义组合。`);
      onMount();
      return;
    }

    const editor = document.querySelector<HTMLElement>(`[data-pp-editor][data-pp-scope="${scope.scope}"]`);
    if (!editor) return;

    if (target.closest("[data-pp-restore-defaults]")) {
      const bt = editor.dataset.bt!;
      const pl = editor.dataset.pl! as ProductLineId;
      writeSelectionToEditor(editor, scope.store.restoreBusinessRecommendationDefaults(bt, pl));
      rerenderEditorColumns(editor, scope);
      syncIndeterminateCheckboxes();
      return;
    }

    if (target.closest("[data-pp-publish]")) {
      const bt = editor.dataset.bt!;
      const pl = editor.dataset.pl! as ProductLineId;
      const syncedBv = editor.dataset.syncedBlueprintVersion
        ? Number(editor.dataset.syncedBlueprintVersion)
        : undefined;
      const blueprintVersion = syncedBv && syncedBv > 0 ? syncedBv : undefined;
      const selection = normalizeSelectionForSnapshot({
        productLineId: pl,
        blueprintVersion,
        selection: readSelectionFromEditor(editor),
      });
      const snapshot: PlatformPresetSnapshot = {
        businessTypeId: bt,
        productLineId: pl,
        version: Number(editor.dataset.version ?? 0),
        publishedAt: "",
        blueprintVersion,
        selection,
      };
      const published = scope.store.publishPlatformPresetSnapshot(snapshot);
      window.alert(scope.publishSuccessMessage(published.version));
      location.hash = `#${scope.routePrefix}`;
      onMount();
      return;
    }

    const colSelect = target.closest<HTMLElement>("[data-pp-col-select]");
    if (colSelect) {
      const key = colSelect.dataset.ppColSelect!;
      const syncedBv = editor.dataset.syncedBlueprintVersion
        ? Number(editor.dataset.syncedBlueprintVersion)
        : undefined;
      const treeOptions = resolvePlatformPresetTreeOptions(scope.scope, {
        blueprintVersion: syncedBv && syncedBv > 0 ? syncedBv : undefined,
      });
      const index = buildPresetEditorPlatformPresetIndex(editor.dataset.pl! as ProductLineId, treeOptions);
      const node = index.byKey.get(key);
      if (!node) return;
      if (node.level === 1) {
        editor.dataset.activeL1 = key;
        editor.dataset.activeL2 = "";
        editor.dataset.activeL3 = "";
      } else if (node.level === 2) {
        editor.dataset.activeL2 = key;
        editor.dataset.activeL3 = "";
      } else if (node.level === 3) {
        editor.dataset.activeL3 = key;
      }
      rerenderEditorColumns(editor, scope);
      syncIndeterminateCheckboxes();
    }
  });

  document.body.addEventListener("change", (ev) => {
    const editor = document.querySelector<HTMLElement>(`[data-pp-editor][data-pp-scope="${scope.scope}"]`);
    if (!editor) return;
    const target = ev.target as HTMLInputElement;
    const pl = editor.dataset.pl! as ProductLineId;
    let selection = readSelectionFromEditor(editor);

    if (target.matches("[data-pp-enable]")) {
      const key = target.dataset.ppEnable!;
      const syncedBv = editor.dataset.syncedBlueprintVersion
        ? Number(editor.dataset.syncedBlueprintVersion)
        : undefined;
      const treeOptions = resolvePlatformPresetTreeOptions(scope.scope, {
        blueprintVersion: syncedBv && syncedBv > 0 ? syncedBv : undefined,
      });
      selection = cascadeEnableSelection(selection, key, target.checked, pl, treeOptions);
      writeSelectionToEditor(editor, selection);
      rerenderEditorColumns(editor, scope);
      syncIndeterminateCheckboxes();
    }
  });
}

export { isAnyPlatformPresetPath };
