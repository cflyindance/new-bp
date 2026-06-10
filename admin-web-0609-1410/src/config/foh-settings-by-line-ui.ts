/**
 * 前厅设置 · 按产线视图（顶栏切换、产线侧栏、场景分组二级导航、分组卡片主区）
 */
import { t, tf } from "../i18n";
import {
  groupCatalogItemsByCategory,
  type ModuleSettingCatalogHub,
} from "./module-settings-catalog";
import {
  FOH_LINE_NAV_ORDER,
  fohLineNavLabel,
  fohSeqAppliesToLine,
  type FohLineNavId,
} from "./foh-settings-line-scope";

export const FOH_SETTINGS_PATH = "/operations/queue-call/settings";
export const FOH_BY_LINE_PREFIX = `${FOH_SETTINGS_PATH}/by-line`;
export const FOH_VIEW_MODE_STORAGE_KEY = "bplant-foh-settings-view-mode";
export const FOH_LAST_LINE_STORAGE_KEY = "bplant-foh-settings-last-line";
export const FOH_DEFAULT_LINE_ID: FohLineNavId = "pos";

const SUBNAV_LINK_BASE =
  "flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SUBNAV_LINK_SELECTED = "bg-primary/10 font-medium text-primary";
const SUBNAV_LINK_IDLE = "text-muted-foreground hover:bg-muted/60 hover:text-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isFohSettingsPath(path: string): boolean {
  return path === FOH_SETTINGS_PATH || path.startsWith(`${FOH_SETTINGS_PATH}/`);
}

export function isFohSettingsByLinePath(path: string): boolean {
  return path === FOH_BY_LINE_PREFIX || path.startsWith(`${FOH_BY_LINE_PREFIX}/`);
}

export function getFohSettingsByLineId(path: string): FohLineNavId | null {
  if (!isFohSettingsByLinePath(path)) return null;
  const rest = path.slice(FOH_BY_LINE_PREFIX.length).replace(/^\//, "");
  if (!rest) return null;
  const id = rest.split("/")[0] ?? "";
  return FOH_LINE_NAV_ORDER.some((l) => l.id === id) ? (id as FohLineNavId) : null;
}

export type FohLineViewGroup = ReturnType<typeof groupCatalogItemsByCategory>[number];

function slugifyModuleSettingsCategory(category: string): string {
  return (
    category
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "item"
  );
}

export function getFohSettingsByLineGroupSlugFromPath(path: string): string {
  if (!isFohSettingsByLinePath(path)) return "";
  const rest = path.slice(FOH_BY_LINE_PREFIX.length).replace(/^\//, "");
  const parts = rest.split("/").filter(Boolean);
  if (parts.length < 2) return "";
  try {
    return decodeURIComponent(parts[1] ?? "");
  } catch {
    return parts[1] ?? "";
  }
}

export function getFohSettingsByLineCategoryPath(lineId: FohLineNavId, groupKey: string): string {
  return `${FOH_BY_LINE_PREFIX}/${lineId}/${encodeURIComponent(slugifyModuleSettingsCategory(groupKey))}`;
}

/** 按场景组顺序归类，仅保留当前产线适用项（空组自动剔除） */
export function getFohLineViewGroups(
  catalog: ModuleSettingCatalogHub,
  lineId: FohLineNavId,
): FohLineViewGroup[] {
  const filtered = catalog.items.filter((item) => fohSeqAppliesToLine(item.seq, lineId));
  return groupCatalogItemsByCategory(filtered, catalog.groupOrder);
}

export function getFohSettingsByLineActiveGroup(
  path: string,
  lineId: FohLineNavId,
  groups: FohLineViewGroup[],
): FohLineViewGroup | undefined {
  if (groups.length === 0) return undefined;
  const slug = getFohSettingsByLineGroupSlugFromPath(path);
  if (!slug) return undefined;
  return groups.find(
    (g) => slugifyModuleSettingsCategory(g.groupKey) === slugifyModuleSettingsCategory(slug),
  );
}

/** 切换产线时尽量保留当前分组；目标产线无该组则落到首组 */
export function resolveFohByLineLineHref(
  catalog: ModuleSettingCatalogHub,
  targetLineId: FohLineNavId,
  currentPath: string,
): string {
  const currentLineId = getFohSettingsByLineId(currentPath);
  let preserveKey: string | undefined;
  if (currentLineId) {
    const currentGroups = getFohLineViewGroups(catalog, currentLineId);
    preserveKey = getFohSettingsByLineActiveGroup(currentPath, currentLineId, currentGroups)?.groupKey;
  }
  const targetGroups = getFohLineViewGroups(catalog, targetLineId);
  if (preserveKey && targetGroups.some((g) => g.groupKey === preserveKey)) {
    return getFohSettingsByLineCategoryPath(targetLineId, preserveKey);
  }
  const first = targetGroups[0]?.groupKey;
  return first
    ? getFohSettingsByLineCategoryPath(targetLineId, first)
    : getFohSettingsByLinePath(targetLineId);
}

export function getFohSettingsByLinePath(lineId: FohLineNavId): string {
  return `${FOH_BY_LINE_PREFIX}/${lineId}`;
}

export function readFohSettingsLastLineId(): FohLineNavId {
  try {
    const raw = localStorage.getItem(FOH_LAST_LINE_STORAGE_KEY);
    if (raw && FOH_LINE_NAV_ORDER.some((l) => l.id === raw)) return raw as FohLineNavId;
  } catch {
    /* ignore */
  }
  return FOH_DEFAULT_LINE_ID;
}

export function writeFohSettingsLastLineId(lineId: FohLineNavId): void {
  try {
    localStorage.setItem(FOH_LAST_LINE_STORAGE_KEY, lineId);
  } catch {
    /* ignore */
  }
}

export function writeFohSettingsViewMode(mode: "scenario" | "by-line"): void {
  try {
    localStorage.setItem(FOH_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function countFohCatalogItemsForLine(
  catalog: ModuleSettingCatalogHub,
  lineId: FohLineNavId,
): number {
  return catalog.items.filter((item) => fohSeqAppliesToLine(item.seq, lineId)).length;
}

export function renderFohSettingsViewModeBar(path: string): string {
  const byLine = isFohSettingsByLinePath(path);
  const scenarioSelected = !byLine;
  const byLineSelected = byLine;
  const scenarioHref = FOH_SETTINGS_PATH;
  const lineId = getFohSettingsByLineId(path) ?? readFohSettingsLastLineId();
  const byLineHref = getFohSettingsByLinePath(lineId);
  const tabBase =
    "inline-flex min-h-9 items-center rounded-md px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  return `
    <div
      class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      data-foh-settings-view-mode-bar
      role="group"
      aria-label="${escapeHtml(t("moduleSettings.fohView.modeAria"))}"
    >
      <span class="text-sm font-medium text-card-foreground">${escapeHtml(t("moduleSettings.fohView.viewAs"))}</span>
      <div class="inline-flex rounded-lg border border-border bg-muted/40 p-0.5" role="presentation">
        <a
          href="#${scenarioHref}"
          data-foh-settings-view-mode="scenario"
          class="${tabBase} ${scenarioSelected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}"
          aria-pressed="${scenarioSelected ? "true" : "false"}"
        >${escapeHtml(t("moduleSettings.fohView.scenario"))}</a>
        <a
          href="#${byLineHref}"
          data-foh-settings-view-mode="by-line"
          class="${tabBase} ${byLineSelected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}"
          aria-pressed="${byLineSelected ? "true" : "false"}"
        >${escapeHtml(t("moduleSettings.fohView.byLine"))}</a>
      </div>
    </div>`;
}

export function renderFohSettingsByLineSidebar(
  path: string,
  catalog: ModuleSettingCatalogHub,
  pageTitle: string,
): string {
  const activeLineId = getFohSettingsByLineId(path) ?? readFohSettingsLastLineId();
  const links = FOH_LINE_NAV_ORDER.map((line) => {
    const href = resolveFohByLineLineHref(catalog, line.id, path);
    const selected = line.id === activeLineId;
    const count = countFohCatalogItemsForLine(catalog, line.id);
    return `
              <li>
                <a href="#${href}"
                  data-foh-settings-line-id="${escapeHtml(line.id)}"
                  class="${SUBNAV_LINK_BASE} ${selected ? SUBNAV_LINK_SELECTED : SUBNAV_LINK_IDLE}"
                  ${selected ? 'aria-current="page"' : ""}
                >
                  <span class="min-w-0 flex-1 truncate">${escapeHtml(line.label)}</span>
                  <span class="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">${count}</span>
                </a>
              </li>`;
  }).join("");

  return `
    <nav class="foh-by-line-nav module-settings-subnav w-44 shrink-0 border-r border-border pr-3 ${TERTIARY_SUBNAV_SCROLL_CLASSES}" aria-label="${escapeHtml(pageTitle)}">
      <ul class="space-y-0.5" role="list">
        ${links}
      </ul>
    </nav>`;
}

export function renderFohSettingsByLineIntroCard(lineId: FohLineNavId, count: number): string {
  const lineLabel = fohLineNavLabel(lineId);
  const countLabel = tf("moduleSettings.fohView.byLineCount", { count: String(count) });
  return `
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p class="text-sm leading-relaxed text-muted-foreground">${escapeHtml(t("moduleSettings.fohView.byLineIntro"))}</p>
        <p class="mt-2 text-sm font-medium text-card-foreground">${escapeHtml(lineLabel)}</p>
        <p class="mt-1 text-xs font-medium tabular-nums text-muted-foreground">${escapeHtml(countLabel)}</p>
      </div>`;
}

/** 与 main.ts 三级侧栏滚动类保持一致 */
const TERTIARY_SUBNAV_SCROLL_CLASSES =
  "tertiary-inline-subnav-scroll min-h-0 max-h-[min(52dvh,26rem)] overflow-y-auto overscroll-y-contain sm:max-h-full sm:self-stretch";

export function bindFohSettingsViewMode(): void {
  document.querySelectorAll<HTMLAnchorElement>("[data-foh-settings-view-mode]").forEach((link) => {
    link.addEventListener("click", () => {
      const mode = link.dataset.fohSettingsViewMode;
      if (mode === "scenario" || mode === "by-line") {
        writeFohSettingsViewMode(mode);
      }
    });
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-foh-settings-line-id]").forEach((link) => {
    link.addEventListener("click", () => {
      const lineId = link.dataset.fohSettingsLineId;
      if (lineId && FOH_LINE_NAV_ORDER.some((l) => l.id === lineId)) {
        writeFohSettingsLastLineId(lineId as FohLineNavId);
        writeFohSettingsViewMode("by-line");
      }
    });
  });
}
