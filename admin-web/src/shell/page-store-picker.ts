/**
 * 品牌多门店视角 · 页内门店选择（顶栏不展示门店下拉，进入二/三级配置页后先选门店）
 */
import {
  ensureInPageDefaultStoreSelected,
  getScopedFilterOptions,
  readScopeFilters,
  resolveDefaultScopedStoreId,
  usesInPageStorePicker,
  writeScopeFilters,
  type ScopeOption,
} from "../auth/session-scope";
import { isNavHomePath } from "../config/app-routes";
import { isFohSettingsPath } from "../config/foh-settings-by-line-ui";
import { getModuleSettingsBasePath } from "../config/module-settings-catalog";
import { isDeviceManagementHardwarePath } from "../config/navigation";
import { isFinanceStoreScopedNavigationPath } from "../config/finance-store-scope";
import { isFohStoreScopedNavigationPath } from "../config/foh-store-scope";
import { isTeamStoreScopedNavigationPath } from "../config/team-store-scope";
import { getUiLocale, t, tf } from "../i18n";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CONFIG_PATH_PREFIX_EXCLUSIONS = [
  "/permissions/",
  "/log-management/",
  "/group-stores/",
  "/brand-stores/",
  "/brand/",
  "/settings/platform-preset",
  "/settings/overview",
  /** 下发记录：门店筛选在状态筛选左侧精简下拉，不走外层 page-store-picker */
  "/settings/deployment-log",
];

/** 是否已进入需先选门店的二/三级配置导航 */
export function isStoreConfigNavigationPath(path: string): boolean {
  if (!usesInPageStorePicker()) return false;
  if (isNavHomePath(path)) return false;
  if (path.startsWith("/dashboard")) return false;
  if (CONFIG_PATH_PREFIX_EXCLUSIONS.some((p) => path === p || path.startsWith(p))) return false;

  if (getModuleSettingsBasePath(path)) return true;
  if (isFohSettingsPath(path)) return true;
  if (isDeviceManagementHardwarePath(path)) return true;
  if (isTeamStoreScopedNavigationPath(path)) return true;
  if (isFohStoreScopedNavigationPath(path)) return true;
  if (isFinanceStoreScopedNavigationPath(path)) return true;

  if (path.includes("/settings") && !path.startsWith("/settings/overview")) return true;

  return false;
}

export function hasPageStoreSelected(): boolean {
  return !!readScopeFilters().store;
}

function listPageStoreOptions(): ScopeOption[] {
  return getScopedFilterOptions().stores.filter((o) => !!o.value);
}

function optionLabel(opt: ScopeOption, locale: "zh" | "en"): string {
  return locale === "en" ? opt.labelEn : opt.labelZh;
}

function resolveSelectedStoreId(stores: ScopeOption[]): string {
  const scope = readScopeFilters();
  if (scope.store && stores.some((o) => o.value === scope.store)) return scope.store;
  return resolveDefaultScopedStoreId() || stores[0]?.value || "";
}

/** 页内门店选择条（已选门店时展示在配置区顶部） */
export function renderPageStorePickerBar(): string {
  const locale = getUiLocale();
  const stores = listPageStoreOptions();
  const selected = resolveSelectedStoreId(stores);

  const options = stores
    .map((o) => {
      const lab = escapeHtml(optionLabel(o, locale));
      const sel = o.value === selected ? " selected" : "";
      return `<option value="${escapeHtml(o.value)}"${sel}>${lab}</option>`;
    })
    .join("");

  return `
    <div
      data-page-store-picker
      class="mb-4 shrink-0 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 shadow-sm"
      role="group"
      aria-label="${escapeHtml(t("pageStorePicker.groupAria"))}"
    >
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-foreground">${escapeHtml(t("pageStorePicker.title"))}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(t("pageStorePicker.hint"))}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <label for="page-store-picker-select" class="text-sm text-muted-foreground">${escapeHtml(t("header.scopeStore"))}</label>
          <select
            id="page-store-picker-select"
            class="h-9 min-w-[10rem] max-w-[14rem] rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="${escapeHtml(t("pageStorePicker.selectAria"))}"
          >
            ${
              stores.length
                ? options
                : `<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`
            }
          </select>
        </div>
      </div>
    </div>`;
}

/** 未选门店时的占位引导（无可用门店时兜底） */
export function renderPageStorePickerGate(): string {
  const locale = getUiLocale();
  const stores = listPageStoreOptions();
  const options = stores
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(optionLabel(o, locale))}</option>`)
    .join("");

  return `
    <div
      data-page-store-picker-gate
      class="flex min-h-[min(24rem,50vh)] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
    >
      <p class="text-base font-medium text-foreground">${escapeHtml(t("pageStorePicker.gateTitle"))}</p>
      <p class="mt-2 max-w-md text-sm text-muted-foreground">${escapeHtml(t("pageStorePicker.gateHint"))}</p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
        <label for="page-store-picker-gate-select" class="text-sm text-muted-foreground">${escapeHtml(t("header.scopeStore"))}</label>
        <select
          id="page-store-picker-gate-select"
          class="h-10 min-w-[12rem] rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="${escapeHtml(t("pageStorePicker.selectAria"))}"
        >
          ${
            stores.length
              ? options
              : `<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`
          }
        </select>
      </div>
      <p class="mt-4 text-xs text-muted-foreground">${escapeHtml(tf("pageStorePicker.storeCount", { count: String(stores.length) }))}</p>
    </div>`;
}

/** 包装配置页主内容：优先默认选店后展示选择条 + 内容 */
export function wrapPageStoreConfigContent(path: string, contentHtml: string): string {
  if (!isStoreConfigNavigationPath(path)) return contentHtml;
  ensureInPageDefaultStoreSelected();
  if (!hasPageStoreSelected()) return renderPageStorePickerGate();
  return `<div class="flex min-h-0 min-w-0 flex-1 flex-col">${renderPageStorePickerBar()}<div data-page-store-config-body class="flex min-h-0 min-w-0 flex-1 flex-col">${contentHtml}</div></div>`;
}

function persistPageStore(storeId: string, onMount: () => void): void {
  const scope = readScopeFilters();
  writeScopeFilters({ ...scope, store: storeId });
  onMount();
}

export function bindPageStorePicker(onMount: () => void): void {
  if (!usesInPageStorePicker()) return;

  if (ensureInPageDefaultStoreSelected()) {
    onMount();
    return;
  }

  const barSelect = document.getElementById("page-store-picker-select") as HTMLSelectElement | null;
  const gateSelect = document.getElementById("page-store-picker-gate-select") as HTMLSelectElement | null;
  const select = barSelect ?? gateSelect;
  if (!select || select.dataset.pageStorePickerBound === "1") return;
  select.dataset.pageStorePickerBound = "1";

  const stores = listPageStoreOptions();
  const selected = resolveSelectedStoreId(stores);
  if (selected && Array.from(select.options).some((o) => o.value === selected)) {
    select.value = selected;
  }

  select.addEventListener("change", () => {
    const storeId = select.value;
    if (!storeId) return;
    persistPageStore(storeId, onMount);
  });
}
