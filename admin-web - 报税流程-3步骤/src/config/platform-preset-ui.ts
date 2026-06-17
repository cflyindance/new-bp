/**
 * 平台预设 · 列表页与四列编辑页
 */
import type { PresetChangeItem } from "./platform-preset-changelog-diff";
import type { PermissionTreeNode } from "./permission-registry";
import { getModuleSettingsCatalog } from "./module-settings-catalog";
import { t, type MessageKey } from "../i18n";
import {
  PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES,
  PLATFORM_PRESET_PRODUCT_LINES,
  businessTypeLabel,
  getPresetEditModuleTier,
  productLineLabel,
  tierBadgeClass,
  tierBadgeLabel,
  type ProductLineId,
} from "./platform-preset-catalog";
import { buildPlatformPresetIndex } from "./platform-preset-tree";
import {
  cascadeEnableSelection,
  countEnabledLevel1,
  countEnabledSettings,
  countPublishedLinesForBusinessType,
  countRecommendedLevel1,
  countRecommendedSettings,
  getChangelogForCombo,
  getChangelogForBusinessType,
  getDefaultPresetSnapshot,
  getOrCreateDraftSelection,
  getPublishedSnapshot,
  listCustomBusinessTypes,
  normalizeSelectionForLine,
  publishPlatformPresetSnapshot,
  readSelectedBusinessTypeId,
  restoreBusinessRecommendationDefaults,
  upsertCustomBusinessType,
  writeSelectedBusinessTypeId,
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

function pickZh(title: string, titleEn?: string): string {
  return title || titleEn || "";
}

export function isPlatformPresetPath(path: string): boolean {
  return path === "/settings/platform-preset" || path.startsWith("/settings/platform-preset/");
}

export function parsePlatformPresetEditPath(path: string): {
  businessTypeId: string;
  productLineId: ProductLineId;
} | null {
  const m = path.match(/^\/settings\/platform-preset\/([^/]+)\/([^/]+)\/edit$/);
  if (!m) return null;
  const businessTypeId = decodeURIComponent(m[1]!);
  const productLineId = decodeURIComponent(m[2]!) as ProductLineId;
  if (!PLATFORM_PRESET_PRODUCT_LINES.some((l) => l.id === productLineId)) return null;
  return { businessTypeId, productLineId };
}

function renderBusinessTypeNavItem(
  id: string,
  label: string,
  selected: boolean,
  badge?: number,
  custom = false,
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
        ${custom ? `<span class="shrink-0 text-xs text-muted-foreground" data-pp-custom-actions="${escapeHtml(id)}">编辑</span>` : ""}
      </button>
    </li>`;
}

function renderProductLineCard(businessTypeId: string, lineId: ProductLineId): string {
  const published = getPublishedSnapshot(businessTypeId, lineId);
  const displaySnap = published ?? getDefaultPresetSnapshot(businessTypeId, lineId);
  const recSettings = countRecommendedSettings(businessTypeId, lineId);
  const enabledSettings = countEnabledSettings(displaySnap);
  const version = published?.version ?? 0;
  const comboSlug = `${businessTypeId}:${lineId}`;

  return `
    <article class="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3" data-pp-line-card="${escapeHtml(lineId)}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-base font-semibold text-card-foreground">${escapeHtml(productLineLabel(lineId))}</h3>
          <p class="mt-0.5 font-mono text-xs text-muted-foreground">${escapeHtml(comboSlug)}</p>
        </div>
        <span class="shrink-0 text-xs tabular-nums text-muted-foreground">${version > 0 ? `v${version}${published ? " · 已覆盖" : ""}` : "v1"}</span>
      </div>
      <p class="text-sm text-muted-foreground">
        业态推荐 <strong class="text-card-foreground">${recSettings}</strong> 项 ·
        当前启用 <strong class="text-card-foreground">${enabledSettings}</strong> 项
      </p>
      <div class="mt-auto flex flex-wrap gap-2 pt-1">
        <a href="#/settings/platform-preset/${encodeURIComponent(businessTypeId)}/${encodeURIComponent(lineId)}/edit" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">配置预设</a>
        <button type="button" data-pp-changelog="${escapeHtml(businessTypeId)}:${escapeHtml(lineId)}" class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">变更记录</button>
      </div>
    </article>`;
}

function renderPlatformPresetListMainPanel(selectedId: string): string {
  const customTypes = listCustomBusinessTypes();
  const selectedLabel = businessTypeLabel(
    selectedId,
    customTypes.find((c) => c.id === selectedId)?.label,
  );
  const lineCards = PLATFORM_PRESET_PRODUCT_LINES.map((l) =>
    renderProductLineCard(selectedId, l.id),
  ).join("");
  const recL1 = countRecommendedLevel1(selectedId, "pos");

  return `
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-card-foreground">${escapeHtml(selectedLabel)} · 产线预设</h2>
            <p class="mt-1 max-w-2xl text-sm text-muted-foreground">在左侧选择经营业态后，在此配置该业态下各产线组合的默认功能与设置展示范围。</p>
            <p class="mt-2 text-xs text-muted-foreground">业态功能画像：核心 ${recL1 || "—"} · 推荐 — · 可选 —</p>
          </div>
          <button type="button" data-pp-list-changelog class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">变更记录</button>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">${lineCards}</div>`;
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

/** 列表页切换经营业态：仅更新选中态与右侧产线区，避免整页 mount */
export function patchPlatformPresetListSelection(businessTypeId: string): void {
  const root = document.querySelector<HTMLElement>("[data-pp-list]");
  if (!root) return;
  root.dataset.selectedBt = businessTypeId;
  syncPlatformPresetBusinessTypeNavSelection(businessTypeId);
  const main = root.querySelector<HTMLElement>("[data-pp-list-main]");
  if (main) main.innerHTML = renderPlatformPresetListMainPanel(businessTypeId);
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
            <p class="mt-0.5 text-xs text-muted-foreground">共 ${entries.length} 条记录；点击条目展开新增/删除/展示变更明细</p>
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

export function renderPlatformPresetListPage(_path: string): string {
  const selectedId = readSelectedBusinessTypeId();

  const serviceItems = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter((b) => b.category === "service-mode")
    .map((b) =>
      renderBusinessTypeNavItem(
        b.id,
        b.label,
        b.id === selectedId,
        countPublishedLinesForBusinessType(b.id),
      ),
    )
    .join("");

  const categoryItems = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter((b) => b.category === "category")
    .map((b) =>
      renderBusinessTypeNavItem(
        b.id,
        b.label,
        b.id === selectedId,
        countPublishedLinesForBusinessType(b.id),
      ),
    )
    .join("");

  const customTypes = listCustomBusinessTypes();
  const customItems = customTypes
    .map((c) =>
      renderBusinessTypeNavItem(
        c.id,
        c.label,
        c.id === selectedId,
        countPublishedLinesForBusinessType(c.id),
        true,
      ),
    )
    .join("");

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch" data-pp-list data-selected-bt="${escapeHtml(selectedId)}">
      <aside class="w-full shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm lg:w-72">
        <div class="mb-4 flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-card-foreground">经营业态</h2>
          <button type="button" data-pp-add-custom class="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">+ 新增</button>
        </div>
        <div class="space-y-4 text-sm">
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
      </aside>
      <div class="min-w-0 flex-1 space-y-4" data-pp-list-main>
        ${renderPlatformPresetListMainPanel(selectedId)}
      </div>
    </div>`;
}

function checkboxState(
  key: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: ReturnType<typeof buildPlatformPresetIndex>,
): { checked: boolean; indeterminate: boolean } {
  const self = selection[key]?.enabled ?? false;
  const descendants = index.getDescendantKeys(key);
  if (descendants.length === 0) return { checked: self, indeterminate: false };
  const enabledCount = descendants.filter((d) => selection[d]?.enabled).length;
  if (self && enabledCount === descendants.length) return { checked: true, indeterminate: false };
  if (!self && enabledCount === 0) return { checked: false, indeterminate: false };
  return { checked: false, indeterminate: true };
}

function formatPresetGroupNavLabel(label: string): string {
  if (label.endsWith("设置") && label.length > 2) return label.slice(0, -2);
  return label;
}

function renderColumnItem(
  key: string,
  title: string,
  selected: boolean,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: ReturnType<typeof buildPlatformPresetIndex>,
  tier?: string,
  level?: number,
  showDisplay = false,
  childCount?: number,
  nested = false,
): string {
  const { checked, indeterminate } = checkboxState(key, selection, index);
  const displayChecked = selection[key]?.display !== false;
  const countBadge =
    childCount != null && level === 3
      ? `<span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">${childCount}</span>`
      : "";
  return `
    <button
      type="button"
      data-pp-col-select="${escapeHtml(key)}"
      class="flex w-full items-start gap-2 rounded-lg py-2 text-left text-sm transition-colors ${nested ? "pl-4 pr-2" : "px-2"} ${selected ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-muted/50"}"
    >
      <input
        type="checkbox"
        class="pp-enable-cb mt-0.5 size-4 shrink-0 accent-primary"
        data-pp-enable="${escapeHtml(key)}"
        ${checked ? "checked" : ""}
        ${indeterminate ? 'data-indeterminate="1"' : ""}
        onclick="event.stopPropagation()"
      />
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-1">
          ${tier ? `<span class="rounded px-1.5 py-0.5 text-[10px] font-medium ${tierBadgeClass(tier as "core" | "recommended" | "optional")}">${escapeHtml(tierBadgeLabel(tier as "core" | "recommended" | "optional"))}</span>` : ""}
          <span class="min-w-0 flex-1 truncate ${level === 4 ? "text-muted-foreground" : "font-medium text-card-foreground"}">${escapeHtml(title)}</span>
          ${countBadge}
        </span>
        ${showDisplay ? `<label class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground" onclick="event.stopPropagation()"><input type="checkbox" class="pp-display-cb size-3.5 accent-primary" data-pp-display="${escapeHtml(key)}" ${displayChecked ? "checked" : ""} />展示</label>` : ""}
      </span>
    </button>`;
}

function renderPresetL3GroupItem(
  node: PermissionTreeNode,
  activeL3: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: ReturnType<typeof buildPlatformPresetIndex>,
  nested = false,
): string {
  return renderColumnItem(
    node.resource.key,
    formatPresetGroupNavLabel(pickZh(node.resource.title, node.resource.titleEn)),
    node.resource.key === activeL3,
    selection,
    index,
    undefined,
    3,
    false,
    node.children.length,
    nested,
  );
}

/** 三级分组列：按 catalog.groupNavSections 分段（如前厅 员工端/食客端），并展示每组 L4 数量 */
function renderPresetL3Column(
  l2Node: PermissionTreeNode | undefined,
  activeL3: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: ReturnType<typeof buildPlatformPresetIndex>,
): string {
  if (!l2Node?.children.length) return "";

  const l3Nodes = l2Node.children;
  const catalog = l2Node.resource.path ? getModuleSettingsCatalog(l2Node.resource.path) : undefined;

  if (!catalog?.groupNavSections?.length) {
    return l3Nodes.map((n) => renderPresetL3GroupItem(n, activeL3, selection, index)).join("");
  }

  const byGroupKey = new Map<string, PermissionTreeNode>();
  for (const node of l3Nodes) {
    if (node.resource.groupKey) byGroupKey.set(node.resource.groupKey, node);
  }

  const rendered = new Set<string>();
  const parts: string[] = [];

  for (let i = 0; i < catalog.groupNavSections.length; i++) {
    const section = catalog.groupNavSections[i]!;
    if (i > 0) {
      parts.push('<div class="my-2 border-t border-border" role="presentation"></div>');
    }
    parts.push(
      `<p class="px-2 ${i > 0 ? "pt-1" : "pt-0.5"} pb-1 text-sm font-semibold tracking-tight text-foreground">${escapeHtml(t(section.labelKey as MessageKey))}</p>`,
    );
    for (const groupKey of section.groupKeys) {
      const node = byGroupKey.get(groupKey);
      if (!node || rendered.has(groupKey)) continue;
      rendered.add(groupKey);
      parts.push(renderPresetL3GroupItem(node, activeL3, selection, index, true));
    }
  }

  for (const node of l3Nodes) {
    const groupKey = node.resource.groupKey;
    if (groupKey && rendered.has(groupKey)) continue;
    parts.push(renderPresetL3GroupItem(node, activeL3, selection, index));
  }

  return parts.join("");
}

function findL2Node(groups: ReturnType<typeof buildPlatformPresetIndex>["groups"], l2Key: string): PermissionTreeNode | undefined {
  for (const g of groups) {
    for (const c of g.tree.children) {
      if (c.resource.key === l2Key) return c;
    }
  }
  return undefined;
}

function findL3Node(groups: ReturnType<typeof buildPlatformPresetIndex>["groups"], l3Key: string): PermissionTreeNode | undefined {
  for (const g of groups) {
    for (const l2 of g.tree.children) {
      for (const l3 of l2.children) {
        if (l3.resource.key === l3Key) return l3;
      }
    }
  }
  return undefined;
}

export function renderPlatformPresetEditPage(
  businessTypeId: string,
  productLineId: ProductLineId,
): string {
  const snapshot = getOrCreateDraftSelection(businessTypeId, productLineId);
  const selection = normalizeSelectionForLine(snapshot.selection, productLineId);
  const index = buildPlatformPresetIndex(productLineId);
  const btLabel = businessTypeLabel(businessTypeId, listCustomBusinessTypes().find((c) => c.id === businessTypeId)?.label);
  const plLabel = productLineLabel(productLineId);

  const activeL1 = index.groups[0]?.moduleKey ?? "";
  const activeL2 = index.groups[0]?.tree.children[0]?.resource.key ?? "";
  const activeL3 = index.groups[0]?.tree.children[0]?.children[0]?.resource.key ?? "";

  const col1 = index.groups
    .map((g) => {
      const tier = getPresetEditModuleTier(businessTypeId, productLineId, g.moduleId);
      return renderColumnItem(
        g.moduleKey,
        pickZh(g.moduleTitle, g.moduleTitleEn),
        g.moduleKey === activeL1,
        selection,
        index,
        tier,
        1,
      );
    })
    .join("");

  const l1Node = index.groups.find((g) => g.moduleKey === activeL1)?.tree;
  const col2 = (l1Node?.children ?? [])
    .map((c) =>
      renderColumnItem(
        c.resource.key,
        pickZh(c.resource.title, c.resource.titleEn),
        c.resource.key === activeL2,
        selection,
        index,
        undefined,
        2,
      ),
    )
    .join("");

  const l2Node = findL2Node(index.groups, activeL2);
  const col3 = renderPresetL3Column(l2Node, activeL3, selection, index);

  const l3Node = findL3Node(index.groups, activeL3);
  const col4 = (l3Node?.children ?? [])
    .map((c) =>
      renderColumnItem(
        c.resource.key,
        pickZh(c.resource.title, c.resource.titleEn),
        false,
        selection,
        index,
        undefined,
        4,
        true,
      ),
    )
    .join("");

  const enabledL1 = countEnabledLevel1({ ...snapshot, selection });
  const recCount = countRecommendedSettings(businessTypeId, productLineId);

  return `
    <div
      class="flex min-h-0 flex-1 flex-col gap-4"
      data-pp-editor
      data-bt="${escapeHtml(businessTypeId)}"
      data-pl="${escapeHtml(productLineId)}"
      data-active-l1="${escapeHtml(activeL1)}"
      data-active-l2="${escapeHtml(activeL2)}"
      data-active-l3="${escapeHtml(activeL3)}"
      data-version="${snapshot.version}"
    >
      <input type="hidden" data-pp-selection-json value="${escapeHtml(JSON.stringify(selection))}" />
      <div class="rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-muted-foreground">
        基于<strong class="text-card-foreground">${escapeHtml(btLabel)}</strong>业态，系统默认推荐
        <strong class="text-card-foreground">${recCount}</strong> 项功能设置；带标签项可作为业态分级参考。
        当前已启用 <strong class="text-card-foreground">${enabledL1}</strong> 个一级导航。
        此处勾选不会实时改变侧栏；保存并发布后，请通过顶栏「重新引导」验证效果。
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <a href="#/settings/platform-preset" class="text-sm text-primary hover:underline">← 返回产线列表</a>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-pp-restore-defaults class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">恢复业态推荐默认</button>
        </div>
      </div>
      <div class="min-h-0 flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        <div class="border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold text-card-foreground">按导航树配置功能</h2>
          <p class="text-xs text-muted-foreground mt-0.5">配置预设 · ${escapeHtml(btLabel)} · ${escapeHtml(plLabel)}</p>
        </div>
        <div class="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          <div class="flex min-h-0 flex-col">
            <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">一级导航</p>
            <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="1">${col1 || `<p class="p-3 text-sm text-muted-foreground">无模块</p>`}</div>
          </div>
          <div class="flex min-h-0 flex-col">
            <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">二级导航</p>
            <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="2">${col2 || `<p class="p-3 text-sm text-muted-foreground">请选择一级导航</p>`}</div>
          </div>
          <div class="flex min-h-0 flex-col">
            <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">三级 / 分组</p>
            <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="3">${col3 || `<p class="p-3 text-sm text-muted-foreground">请选择二级导航</p>`}</div>
          </div>
          <div class="flex min-h-0 flex-col">
            <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">分组内功能 / 设置</p>
            <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="4">${col4 || `<p class="p-3 text-sm text-muted-foreground">请选择分组</p>`}</div>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-3 shrink-0">
        <button type="button" data-pp-publish class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          保存并发布 v${snapshot.version + 1}
        </button>
        <a href="#/settings/platform-preset" class="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted">取消</a>
      </div>
    </div>`;
}

export function findPlatformPresetPageTitle(path: string): { title: string; module: string } | null {
  if (!isPlatformPresetPath(path)) return null;
  const edit = parsePlatformPresetEditPath(path);
  if (edit) {
    const btLabel = businessTypeLabel(
      edit.businessTypeId,
      listCustomBusinessTypes().find((c) => c.id === edit.businessTypeId)?.label,
    );
    return {
      title: `配置预设 · ${btLabel} · ${productLineLabel(edit.productLineId)}`,
      module: "系统设置",
    };
  }
  return { title: "平台预设", module: "系统设置" };
}

export function renderPlatformPresetPage(path: string): string {
  const edit = parsePlatformPresetEditPath(path);
  if (edit) return renderPlatformPresetEditPage(edit.businessTypeId, edit.productLineId);
  return renderPlatformPresetListPage(path);
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

function rerenderEditorColumns(editor: HTMLElement): void {
  const bt = editor.dataset.bt!;
  const pl = editor.dataset.pl! as ProductLineId;
  const selection = readSelectionFromEditor(editor);
  const index = buildPlatformPresetIndex(pl);
  const l1 = editor.dataset.activeL1 ?? index.groups[0]?.moduleKey ?? "";
  let l2 = editor.dataset.activeL2 ?? "";
  let l3 = editor.dataset.activeL3 ?? "";

  const l1Node = index.groups.find((g) => g.moduleKey === l1)?.tree;
  if (!l2 || !l1Node?.children.some((c) => c.resource.key === l2)) {
    l2 = l1Node?.children[0]?.resource.key ?? "";
    editor.dataset.activeL2 = l2;
  }
  const l2Node = findL2Node(index.groups, l2);
  if (!l3 || !l2Node?.children.some((c) => c.resource.key === l3)) {
    l3 = l2Node?.children[0]?.resource.key ?? "";
    editor.dataset.activeL3 = l3;
  }

  const col1El = editor.querySelector('[data-pp-col="1"]');
  const col2El = editor.querySelector('[data-pp-col="2"]');
  const col3El = editor.querySelector('[data-pp-col="3"]');
  const col4El = editor.querySelector('[data-pp-col="4"]');

  if (col1El) {
    col1El.innerHTML = index.groups
      .map((g) => {
        const tier = getPresetEditModuleTier(bt, pl, g.moduleId);
        return renderColumnItem(g.moduleKey, pickZh(g.moduleTitle, g.moduleTitleEn), g.moduleKey === l1, selection, index, tier, 1);
      })
      .join("");
  }
  if (col2El && l1Node) {
    col2El.innerHTML = l1Node.children
      .map((c) =>
        renderColumnItem(c.resource.key, pickZh(c.resource.title, c.resource.titleEn), c.resource.key === l2, selection, index, undefined, 2),
      )
      .join("");
  }
  if (col3El && l2Node) {
    col3El.innerHTML = renderPresetL3Column(l2Node, l3, selection, index);
  }
  const l3Node = findL3Node(index.groups, l3);
  if (col4El) {
    col4El.innerHTML = (l3Node?.children ?? [])
      .map((c) =>
        renderColumnItem(c.resource.key, pickZh(c.resource.title, c.resource.titleEn), false, selection, index, undefined, 4, true),
      )
      .join("") || `<p class="p-3 text-sm text-muted-foreground">请选择分组</p>`;
  }

  editor.querySelectorAll<HTMLInputElement>("[data-indeterminate]").forEach((cb) => {
    cb.indeterminate = true;
  });
}

export function bindPlatformPreset(onMount: () => void): void {
  bindPlatformPresetChangelogDialog();

  function syncIndeterminateCheckboxes(): void {
    document.querySelectorAll<HTMLInputElement>(".pp-enable-cb[data-indeterminate]").forEach((cb) => {
      cb.indeterminate = true;
    });
  }

  syncIndeterminateCheckboxes();
  document.body.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;

    const selectBt = target.closest<HTMLElement>("[data-pp-select-bt]");
    if (selectBt) {
      const id = selectBt.dataset.ppSelectBt!;
      if (id === document.querySelector<HTMLElement>("[data-pp-list]")?.dataset.selectedBt) return;
      writeSelectedBusinessTypeId(id);
      if (document.querySelector("[data-pp-list]")) {
        patchPlatformPresetListSelection(id);
      } else {
        onMount();
      }
      return;
    }

    if (target.closest("[data-pp-add-custom]")) {
      const label = window.prompt("自定义业态名称");
      if (!label?.trim()) return;
      upsertCustomBusinessType(label.trim());
      onMount();
      return;
    }

    const changelogBtn = target.closest<HTMLElement>("[data-pp-changelog]");
    if (changelogBtn) {
      const [bt, pl] = (changelogBtn.dataset.ppChangelog ?? "").split(":");
      if (!bt || !pl) return;
      const customTypes = listCustomBusinessTypes();
      const btLabel = businessTypeLabel(bt, customTypes.find((c) => c.id === bt)?.label);
      const plLabel = productLineLabel(pl as ProductLineId);
      const entries = getChangelogForCombo(bt, pl as ProductLineId);
      openPlatformPresetChangelogDialog(`${btLabel} · ${plLabel} · 变更记录`, entries, false);
      return;
    }

    if (target.closest("[data-pp-list-changelog]")) {
      const listRoot = document.querySelector<HTMLElement>("[data-pp-list]");
      const selectedId = listRoot?.dataset.selectedBt ?? readSelectedBusinessTypeId();
      const customTypes = listCustomBusinessTypes();
      const btLabel = businessTypeLabel(
        selectedId,
        customTypes.find((c) => c.id === selectedId)?.label,
      );
      const entries = getChangelogForBusinessType(selectedId);
      openPlatformPresetChangelogDialog(`${btLabel} · 全部产线变更记录`, entries, true);
      return;
    }

    const editor = document.querySelector<HTMLElement>("[data-pp-editor]");
    if (!editor) return;

    if (target.closest("[data-pp-restore-defaults]")) {
      const bt = editor.dataset.bt!;
      const pl = editor.dataset.pl! as ProductLineId;
      writeSelectionToEditor(editor, restoreBusinessRecommendationDefaults(bt, pl));
      rerenderEditorColumns(editor);
      syncIndeterminateCheckboxes();
      return;
    }

    if (target.closest("[data-pp-publish]")) {
      const bt = editor.dataset.bt!;
      const pl = editor.dataset.pl! as ProductLineId;
      const selection = normalizeSelectionForLine(readSelectionFromEditor(editor), pl);
      const snapshot: PlatformPresetSnapshot = {
        businessTypeId: bt,
        productLineId: pl,
        version: Number(editor.dataset.version ?? 0),
        publishedAt: "",
        selection,
      };
      const published = publishPlatformPresetSnapshot(snapshot);
      window.alert(`已发布 v${published.version}。可通过顶栏「重新引导」选择对应业态与产线，验证预设效果。`);
      location.hash = "#/settings/platform-preset";
      onMount();
      return;
    }

    const colSelect = target.closest<HTMLElement>("[data-pp-col-select]");
    if (colSelect) {
      const key = colSelect.dataset.ppColSelect!;
      const index = buildPlatformPresetIndex(editor.dataset.pl! as ProductLineId);
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
      rerenderEditorColumns(editor);
      syncIndeterminateCheckboxes();
    }
  });

  document.body.addEventListener("change", (ev) => {
    const editor = document.querySelector<HTMLElement>("[data-pp-editor]");
    if (!editor) return;
    const target = ev.target as HTMLInputElement;
    const pl = editor.dataset.pl! as ProductLineId;
    let selection = readSelectionFromEditor(editor);

    if (target.matches("[data-pp-enable]")) {
      const key = target.dataset.ppEnable!;
      selection = cascadeEnableSelection(selection, key, target.checked, pl);
      writeSelectionToEditor(editor, selection);
      rerenderEditorColumns(editor);
      syncIndeterminateCheckboxes();
      return;
    }

    if (target.matches("[data-pp-display]")) {
      const key = target.dataset.ppDisplay!;
      selection[key] = { ...selection[key], enabled: selection[key]?.enabled ?? false, display: target.checked };
      writeSelectionToEditor(editor, selection);
    }
  });
}
