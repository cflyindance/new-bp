/**
 * 滑层 Hub 作用域搜索：索引 / 查询 / 会话状态 / 结果面板渲染。
 * 设计：docs/项目文档/滑层Hub搜索设计方案.md
 */
import { getUiLocale, t, tf } from "../i18n";
import {
  BRAND_MENU_SUBNAV,
  BRAND_PRODUCTS_SUBNAV,
  FINANCE_SHEET_SETTINGS_SUBNAV,
  FINANCE_SHEET_SUBNAV,
  GIFT_CARDS_SHEET_SUBNAV,
  MARKETING_SHEET_SUBNAV,
  MEMBERS_SHEET_SETTINGS_SUBNAV,
  MEMBERS_SHEET_SUBNAV,
  NAV_MODULES,
  PRINT_SHEET_SUBNAV,
  PROMOTIONS_MGMT_SUBNAV,
  REPORTS_SHEET_SUBNAV,
  RESERVATIONS_SHEET_SUBNAV,
  STORE_MENU_SUBNAV,
  type NavModule,
  type ProductCenterSidebarSubItem,
} from "./navigation";
import {
  getModuleSettingsCategoryPath,
  MODULE_SETTINGS_BY_PATH,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";
import { normalizeFohCatalogItemsForGrouping } from "./foh-settings-group-keys";
import { FOH_SETTINGS_PATH } from "./foh-settings-by-line-ui";
import { filterCatalogItemsForPreset } from "./platform-preset-settings-filter";
import { filterModuleSettingItemsForProductVersion, isFutureVersionDiffModuleSettingSeq } from "./product-version";
import { filterSheetSubnavByPlatformPreset, getFilteredNavModuleSheetSubnav } from "./platform-preset-nav-filter";

/** 无 `subNavPlacement: sheet`、走专用滑层壳的 Hub（与通用壳一并启用搜索） */
export const DEDICATED_HUB_SHEET_SEARCH_IDS: readonly string[] = [
  "marketing",
  "promotions",
  "members",
  "gift-cards",
  "reports-finance",
  "print-templates",
  "reservations",
  "product-center-main",
  "inventory-ordering",
  "finance-center",
];

const HUB_SHEET_DOM_ID: Readonly<Record<string, string>> = {
  marketing: "marketing-secondary-sheet",
  promotions: "promotions-secondary-sheet",
  members: "members-secondary-sheet",
  "gift-cards": "gift-cards-secondary-sheet",
  "reports-finance": "reports-secondary-sheet",
  "print-templates": "print-secondary-sheet",
  reservations: "reservations-secondary-sheet",
  "product-center-main": "product-center-main-secondary-sheet",
  "inventory-ordering": "inventory-secondary-sheet",
  "finance-center": "finance-center-secondary-sheet",
};
export type HubSearchHitKind = "nav" | "setting";
export type HubSearchDisplayGroup = "nav" | "setting" | "desc";

export type HubSearchIndexEntry = {
  id: string;
  kind: HubSearchHitKind;
  title: string;
  titleEn?: string;
  /** 应用内 path（无 #） */
  navPath: string;
  /** 左栏应保留的 L2 path */
  sheetNavPath: string;
  breadcrumb: string;
  seq?: number;
  groupTitle?: string;
  moduleName?: string;
  feature?: string;
  sceneDesc?: string;
  /** 设置条目的真实 catalog 来源；导航条目为空。 */
  settingsPath?: string;
};

export type HubSearchHit = HubSearchIndexEntry & {
  score: number;
  displayGroup: HubSearchDisplayGroup;
  summary: string;
  matchedField: string;
};

export type HubSearchIndex = {
  hubId: string;
  hubTitle: string;
  settingsPath: string | null;
  entries: HubSearchIndexEntry[];
};

export type HubSearchFocusTarget = {
  path: string;
  seq?: number;
  itemId?: string;
};

const queryByHubId = new Map<string, string>();
let focusTarget: HubSearchFocusTarget | null = null;
let shouldRefocusSearchInput = false;

const WEIGHT_TITLE = 100;
const WEIGHT_SEQ = 90;
const WEIGHT_GROUP_FEATURE = 60;
const WEIGHT_DESC = 30;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isHubSheetSearchEnabled(hubId: string): boolean {
  const m = NAV_MODULES.find((x) => x.id === hubId);
  if (m?.subNavPlacement === "sheet") return true;
  return DEDICATED_HUB_SHEET_SEARCH_IDS.includes(hubId);
}

/** 所有已启用搜索的 Hub id */
export function listHubSheetSearchHubIds(): string[] {
  const ids = new Set<string>();
  for (const m of NAV_MODULES) {
    if (isHubSheetSearchEnabled(m.id)) ids.add(m.id);
  }
  for (const id of DEDICATED_HUB_SHEET_SEARCH_IDS) ids.add(id);
  return [...ids];
}

export function getHubSheetDomId(hubId: string): string {
  return HUB_SHEET_DOM_ID[hubId] ?? `${hubId}-secondary-sheet`;
}

export function getHubSheetSearchQuery(hubId: string): string {
  return queryByHubId.get(hubId) ?? "";
}

export function setHubSheetSearchQuery(hubId: string, q: string): void {
  const next = q;
  if (!next.trim()) queryByHubId.delete(hubId);
  else queryByHubId.set(hubId, next);
}

export function clearHubSheetSearch(hubId: string): void {
  queryByHubId.delete(hubId);
}

export function clearAllHubSheetSearch(): void {
  queryByHubId.clear();
}

export function setHubSearchFocusTarget(target: HubSearchFocusTarget | null): void {
  focusTarget = target;
}

export function consumeHubSearchFocusTarget(): HubSearchFocusTarget | null {
  const t0 = focusTarget;
  focusTarget = null;
  return t0;
}

export function markHubSheetSearchInputRefocus(): void {
  shouldRefocusSearchInput = true;
}

export function consumeHubSheetSearchInputRefocus(): boolean {
  const v = shouldRefocusSearchInput;
  shouldRefocusSearchInput = false;
  return v;
}

/** 中文 ≥1 字；纯英文/数字 ≥2 字符 */
export function shouldEnterHubSearch(q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return false;
  if (/[\u4e00-\u9fff]/.test(trimmed)) return true;
  return trimmed.length >= 2;
}

function resolveHubSettingsCatalogPaths(m: NavModule): string[] {
  const paths = new Set<string>();
  for (const c of m.children ?? []) {
    if (MODULE_SETTINGS_BY_PATH[c.path]) paths.add(c.path);
  }
  const prefixes = [...(m.matchPrefixes?.length ? m.matchPrefixes : [m.path]), m.path];
  for (const prefix of prefixes) {
    for (const sp of Object.keys(MODULE_SETTINGS_BY_PATH)) {
      if (sp === prefix || sp.startsWith(`${prefix}/`)) paths.add(sp);
    }
  }
  return [...paths];
}

function pickLocaleTitle(title: string, titleEn?: string): string {
  return getUiLocale() === "en" && titleEn ? titleEn : title;
}

/** 各 Hub 滑层实际展示的导航（含专用壳的平铺/分组表） */
export function resolveHubSheetNavItems(hubId: string): ProductCenterSidebarSubItem[] {
  const m = NAV_MODULES.find((x) => x.id === hubId);
  switch (hubId) {
    case "marketing":
      return filterSheetSubnavByPlatformPreset("marketing", MARKETING_SHEET_SUBNAV);
    case "promotions":
      return filterSheetSubnavByPlatformPreset("promotions", PROMOTIONS_MGMT_SUBNAV);
    case "members":
      return [
        ...filterSheetSubnavByPlatformPreset("members", MEMBERS_SHEET_SUBNAV),
        ...filterSheetSubnavByPlatformPreset("members", MEMBERS_SHEET_SETTINGS_SUBNAV),
      ];
    case "gift-cards":
      return filterSheetSubnavByPlatformPreset("gift-cards", GIFT_CARDS_SHEET_SUBNAV);
    case "print-templates":
      return filterSheetSubnavByPlatformPreset("print-templates", PRINT_SHEET_SUBNAV);
    case "reservations":
      return filterSheetSubnavByPlatformPreset("reservations", RESERVATIONS_SHEET_SUBNAV);
    case "reports-finance":
      return filterSheetSubnavByPlatformPreset("reports-finance", REPORTS_SHEET_SUBNAV);
    case "finance-center":
      return [
        ...filterSheetSubnavByPlatformPreset("finance-center", FINANCE_SHEET_SUBNAV),
        ...FINANCE_SHEET_SETTINGS_SUBNAV,
      ];
    case "product-center-main":
      return [
        ...filterSheetSubnavByPlatformPreset("product-center-main", BRAND_PRODUCTS_SUBNAV),
        ...filterSheetSubnavByPlatformPreset("product-center-main", BRAND_MENU_SUBNAV),
        ...filterSheetSubnavByPlatformPreset("product-center-main", STORE_MENU_SUBNAV),
      ];
    case "inventory-ordering":
      return m
        ? filterSheetSubnavByPlatformPreset(
            "inventory-ordering",
            (m.children ?? []).map((c) => ({
              id: c.id,
              title: c.title,
              titleEn: c.titleEn,
              path: c.path,
            })),
          )
        : [];
    default:
      return m ? getFilteredNavModuleSheetSubnav(m) : [];
  }
}

function buildNavEntries(hubId: string, subnav: ProductCenterSidebarSubItem[]): HubSearchIndexEntry[] {
  const hub = NAV_MODULES.find((x) => x.id === hubId);
  const hubTitle = hub ? pickLocaleTitle(hub.title, hub.titleEn) : hubId;
  const entries: HubSearchIndexEntry[] = [];
  for (const item of subnav) {
    entries.push({
      id: `nav:${item.id}`,
      kind: "nav",
      title: item.title,
      titleEn: item.titleEn,
      navPath: item.path,
      sheetNavPath: item.path,
      breadcrumb: `${hubTitle} › ${pickLocaleTitle(item.title, item.titleEn)}`,
    });
    for (const [i, child] of (item.sidebarChildren ?? []).entries()) {
      entries.push({
        id: `nav:${item.id}:c${i}`,
        kind: "nav",
        title: child.title,
        titleEn: child.titleEn,
        navPath: child.path,
        sheetNavPath: item.path,
        breadcrumb: `${hubTitle} › ${pickLocaleTitle(item.title, item.titleEn)} › ${pickLocaleTitle(child.title, child.titleEn)}`,
      });
    }
  }
  return entries;
}

function buildSettingEntries(
  settingsPath: string,
  settingsNavPath: string,
  hubTitle: string,
): HubSearchIndexEntry[] {
  const catalog = MODULE_SETTINGS_BY_PATH[settingsPath];
  if (!catalog) return [];
  let items = catalog.items;
  if (settingsPath === FOH_SETTINGS_PATH) {
    items = normalizeFohCatalogItemsForGrouping(items);
  }
  items = filterCatalogItemsForPreset(settingsPath, items);
  items = filterModuleSettingItemsForProductVersion(items);
  return items.map((item: ModuleSettingCatalogItem) => ({
    id: `setting:${settingsPath}:${item.seq}`,
    kind: "setting" as const,
    title: item.title,
    navPath: getModuleSettingsCategoryPath(settingsPath, item.groupKey),
    sheetNavPath: settingsNavPath,
    breadcrumb: `${hubTitle} › ${t("hubSearch.crumbSettings")} › ${item.groupTitle}`,
    seq: item.seq,
    groupTitle: item.groupTitle,
    moduleName: item.moduleName,
    feature: item.feature === "（未填写）" ? "" : item.feature,
    sceneDesc: item.sceneDesc,
    settingsPath,
  }));
}

function resolveSettingsNavPathForCatalog(
  subnav: ProductCenterSidebarSubItem[],
  settingsPath: string,
): string {
  const hit = subnav.find(
    (s) =>
      s.path === settingsPath ||
      settingsPath.startsWith(`${s.path}/`) ||
      (s.path.endsWith("/settings") && settingsPath.startsWith(s.path.replace(/\/settings$/, ""))),
  );
  if (hit) return hit.path;
  const settingsItem = subnav.find((s) => s.path.endsWith("/settings") || s.id.includes("settings"));
  return settingsItem?.path ?? settingsPath;
}

export function buildHubSearchIndex(hubId: string): HubSearchIndex | null {
  const m = NAV_MODULES.find((x) => x.id === hubId);
  if (!m || !isHubSheetSearchEnabled(hubId)) return null;
  const subnav = resolveHubSheetNavItems(hubId);
  const catalogPaths = resolveHubSettingsCatalogPaths(m);
  const hubTitle = pickLocaleTitle(m.title, m.titleEn);
  const settingEntries = catalogPaths.flatMap((settingsPath) =>
    buildSettingEntries(settingsPath, resolveSettingsNavPathForCatalog(subnav, settingsPath), hubTitle),
  );
  const entries = [...buildNavEntries(hubId, subnav), ...settingEntries];
  return {
    hubId,
    hubTitle,
    settingsPath: catalogPaths[0] ?? null,
    entries,
  };
}

function fieldMatch(
  haystack: string | undefined,
  needle: string,
): boolean {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(needle);
}

function snippetAround(text: string, needle: string, maxLen = 72): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
  const start = Math.max(0, idx - 16);
  const end = Math.min(text.length, idx + needle.length + 40);
  let s = text.slice(start, end);
  if (start > 0) s = `…${s}`;
  if (end < text.length) s = `${s}…`;
  return s;
}

function highlightNeedle(text: string, needle: string): string {
  if (!needle) return escapeHtml(text);
  const lower = text.toLowerCase();
  const idx = lower.indexOf(needle);
  if (idx < 0) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const mid = escapeHtml(text.slice(idx, idx + needle.length));
  const after = escapeHtml(text.slice(idx + needle.length));
  return `${before}<mark class="rounded bg-primary/20 px-0.5 text-foreground">${mid}</mark>${after}`;
}

export function queryHubSearchIndex(index: HubSearchIndex, q: string): HubSearchHit[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hits: HubSearchHit[] = [];

  for (const entry of index.entries) {
    let bestScore = 0;
    let matchedField = "";
    let summarySource = "";

    const titleLocale = pickLocaleTitle(entry.title, entry.titleEn);
    if (fieldMatch(titleLocale, needle) || fieldMatch(entry.title, needle) || fieldMatch(entry.titleEn, needle)) {
      bestScore = WEIGHT_TITLE;
      matchedField = "title";
      summarySource = titleLocale;
    }
    if (entry.seq != null && String(entry.seq) === needle) {
      if (WEIGHT_SEQ > bestScore) {
        bestScore = WEIGHT_SEQ;
        matchedField = "seq";
        summarySource = `seq ${entry.seq}`;
      }
    }
    if (fieldMatch(entry.groupTitle, needle) || fieldMatch(entry.feature, needle)) {
      if (WEIGHT_GROUP_FEATURE > bestScore) {
        bestScore = WEIGHT_GROUP_FEATURE;
        matchedField = entry.groupTitle && fieldMatch(entry.groupTitle, needle) ? "groupTitle" : "feature";
        summarySource = matchedField === "groupTitle" ? (entry.groupTitle ?? "") : (entry.feature ?? "");
      }
    }
    if (fieldMatch(entry.sceneDesc, needle) || fieldMatch(entry.moduleName, needle)) {
      if (WEIGHT_DESC >= bestScore) {
        // title 已更高分时不降；相等时 desc 不覆盖 title；仅当更高或仅有 desc
        if (WEIGHT_DESC > bestScore) {
          bestScore = WEIGHT_DESC;
          matchedField = entry.sceneDesc && fieldMatch(entry.sceneDesc, needle) ? "sceneDesc" : "moduleName";
          summarySource =
            matchedField === "sceneDesc" ? (entry.sceneDesc ?? "") : (entry.moduleName ?? "");
        }
      }
    }

    if (bestScore <= 0) continue;

    let displayGroup: HubSearchDisplayGroup;
    if (entry.kind === "nav") displayGroup = "nav";
    else if (matchedField === "sceneDesc" || matchedField === "moduleName") displayGroup = "desc";
    else displayGroup = "setting";

    hits.push({
      ...entry,
      score: bestScore,
      displayGroup,
      matchedField,
      summary: snippetAround(summarySource || titleLocale, needle),
    });
  }

  const groupOrder: Record<HubSearchDisplayGroup, number> = { nav: 0, setting: 1, desc: 2 };
  hits.sort((a, b) => {
    const g = groupOrder[a.displayGroup] - groupOrder[b.displayGroup];
    if (g !== 0) return g;
    if (b.score !== a.score) return b.score - a.score;
    return pickLocaleTitle(a.title, a.titleEn).localeCompare(pickLocaleTitle(b.title, b.titleEn), "zh");
  });
  return hits;
}

export function navPathsToKeepFromHits(hits: HubSearchHit[]): Set<string> {
  const paths = new Set<string>();
  for (const h of hits) paths.add(h.sheetNavPath);
  return paths;
}

export function filterSubnavBySearchPaths(
  subnav: ProductCenterSidebarSubItem[],
  keep: Set<string>,
): ProductCenterSidebarSubItem[] {
  if (keep.size === 0) return [];
  const pathKept = (path: string, prefix?: string): boolean => {
    if (keep.has(path)) return true;
    const p = prefix ?? path;
    for (const k of keep) {
      if (k === p || k.startsWith(`${p}/`)) return true;
    }
    return false;
  };
  return subnav
    .map((item) => {
      const selfKeep = pathKept(item.path, item.activePrefix ?? item.path);
      const children = (item.sidebarChildren ?? []).filter((c) => keep.has(c.path) || selfKeep);
      const childKeep = (item.sidebarChildren ?? []).some((c) => keep.has(c.path));
      if (!selfKeep && !childKeep) return null;
      if (!item.sidebarChildren?.length) return item;
      return { ...item, sidebarChildren: childKeep && !keep.has(item.path) ? children : item.sidebarChildren };
    })
    .filter((x): x is ProductCenterSidebarSubItem => x != null);
}

/** 当前 Hub 若处于搜索态，返回应保留的导航 path；否则 null */
export function getHubSheetSearchKeepPaths(hubId: string): Set<string> | null {
  if (!isHubSheetSearchEnabled(hubId)) return null;
  const q = getHubSheetSearchQuery(hubId);
  if (!shouldEnterHubSearch(q)) return null;
  const index = buildHubSearchIndex(hubId);
  const hits = index ? queryHubSearchIndex(index, q) : [];
  return navPathsToKeepFromHits(hits);
}

export function filterSheetSubnavForHubSearch(
  hubId: string,
  subnav: ProductCenterSidebarSubItem[],
): ProductCenterSidebarSubItem[] {
  const keep = getHubSheetSearchKeepPaths(hubId);
  if (keep == null) return subnav;
  return filterSubnavBySearchPaths(subnav, keep);
}

export function renderHubSheetSearchBox(hubId: string): string {
  if (!isHubSheetSearchEnabled(hubId)) return "";
  const q = getHubSheetSearchQuery(hubId);
  const placeholder = escapeHtml(t("hubSearch.placeholder"));
  const clearLabel = escapeHtml(t("hubSearch.clear"));
  return `
    <div class="shrink-0 border-b border-sidebar-foreground/10 px-2 py-2 dark:border-white/10" role="search" data-hub-sheet-search="${escapeHtml(hubId)}">
      <div class="relative flex items-center">
        <span class="pointer-events-none absolute left-2.5 text-sidebar-muted" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </span>
        <input
          type="search"
          name="hub-sheet-navigation-search"
          data-hub-sheet-search-input="${escapeHtml(hubId)}"
          value="${escapeHtml(q)}"
          placeholder="${placeholder}"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          class="h-9 w-full rounded-lg border border-sidebar-foreground/15 bg-sidebar-foreground/[0.04] py-1.5 pl-8 pr-8 text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active dark:border-white/15 dark:bg-white/5"
        />
        ${
          q
            ? `<button
          type="button"
          data-hub-sheet-search-clear="${escapeHtml(hubId)}"
          class="absolute right-1 inline-flex size-7 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground"
          aria-label="${clearLabel}"
        >✕</button>`
            : ""
        }
      </div>
    </div>`;
}

function displayGroupLabel(g: HubSearchDisplayGroup): string {
  if (g === "nav") return t("hubSearch.groupNav");
  if (g === "setting") return t("hubSearch.groupSetting");
  return t("hubSearch.groupDesc");
}

function typeLabel(g: HubSearchDisplayGroup): string {
  if (g === "nav") return t("hubSearch.typeNav");
  if (g === "setting") return t("hubSearch.typeSetting");
  return t("hubSearch.typeDesc");
}

export type HubSearchSettingResultRenderer = (hit: HubSearchHit) => string;

export function renderHubSearchResultsPane(
  hubId: string,
  q: string,
  hits: HubSearchHit[],
  renderSettingResult?: HubSearchSettingResultRenderer,
): string {
  const needle = q.trim().toLowerCase();
  const title = escapeHtml(t("hubSearch.resultsTitle"));
  const meta = escapeHtml(tf("hubSearch.resultsMeta", { q: q.trim(), count: String(hits.length) }));

  if (hits.length === 0) {
    return `
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6" data-hub-search-results="${escapeHtml(hubId)}">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-foreground">${title}</h2>
          <p class="mt-1 text-sm text-muted-foreground">${meta}</p>
        </div>
        <p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          ${escapeHtml(tf("hubSearch.emptyResults", { q: q.trim() }))}
        </p>
      </div>`;
  }

  const groups: HubSearchDisplayGroup[] = ["nav", "setting", "desc"];
  const sections = groups
    .map((g) => {
      const list = hits.filter((h) => h.displayGroup === g);
      if (list.length === 0) return "";
      const rows = list
        .map((h) => {
          const label = pickLocaleTitle(h.title, h.titleEn);
          const titleHtml =
            h.seq != null && h.kind === "setting"
              ? `<strong class="text-foreground">${escapeHtml(String(h.seq))} · ${highlightNeedle(label, needle)}</strong>`
              : `<strong class="text-foreground">${highlightNeedle(label, needle)}</strong>`;
          if (h.kind === "setting" && renderSettingResult) {
            const settingHtml = renderSettingResult(h);
            if (settingHtml) {
              return `
          <article
            data-hub-search-setting-result
            data-hub-id="${escapeHtml(hubId)}"
            data-hit-path="${escapeHtml(h.navPath)}"
            data-hit-seq="${h.seq != null ? String(h.seq) : ""}"
            ${h.seq != null && isFutureVersionDiffModuleSettingSeq(h.seq) ? "data-future-version-diff" : ""}
            class="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground">${escapeHtml(h.breadcrumb)}</p>
                <p class="mt-1 text-xs text-muted-foreground/80">${highlightNeedle(h.summary, needle)}</p>
              </div>
              <span class="shrink-0 rounded-full border border-border bg-background px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">${escapeHtml(typeLabel(h.displayGroup))}</span>
            </div>
            ${settingHtml}
          </article>`;
            }
          }
          return `
          <button
            type="button"
            data-hub-search-hit
            data-hub-id="${escapeHtml(hubId)}"
            data-hit-path="${escapeHtml(h.navPath)}"
            data-hit-seq="${h.seq != null ? String(h.seq) : ""}"
            data-hit-kind="${h.kind}"
            ${h.seq != null && isFutureVersionDiffModuleSettingSeq(h.seq) ? "data-future-version-diff" : ""}
            class="w-full rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">${titleHtml}</div>
              <span class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">${escapeHtml(typeLabel(h.displayGroup))}</span>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">${highlightNeedle(h.summary, needle)}</p>
            <p class="mt-1.5 text-xs text-muted-foreground/80">${escapeHtml(h.breadcrumb)}</p>
          </button>`;
        })
        .join("");
      return `
        <section class="space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">${escapeHtml(displayGroupLabel(g))}</h3>
          <div class="space-y-2">${rows}</div>
        </section>`;
    })
    .join("");

  return `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6" data-hub-search-results="${escapeHtml(hubId)}">
      <div>
        <h2 class="text-lg font-semibold tracking-tight text-foreground">${title}</h2>
        <p class="mt-1 text-sm text-muted-foreground">${meta}</p>
      </div>
      ${sections}
    </div>`;
}

export function renderHubSheetNavEmpty(): string {
  return `<p class="px-2 py-3 text-xs text-sidebar-muted">${escapeHtml(t("hubSearch.emptyNav"))}</p>`;
}
