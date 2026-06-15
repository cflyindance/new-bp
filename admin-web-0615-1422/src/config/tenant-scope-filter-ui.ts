/**
 * 顶栏品牌 / 区域 / 门店范围筛选
 */
import { t } from "../i18n";
import { applyActiveTenantPresetSettings } from "./feature-presets-setting-apply";
import {
  getScopeCatalog,
  hydrateScopeCatalog,
  storesForBrand,
} from "./tenant-scope-catalog";
import { refreshTenantProfileForScope } from "./tenant-profile-api";

export const SCOPE_FILTER_STORAGE_KEYS = {
  brand: "header-scope-filter-brand",
  region: "header-scope-filter-region",
  store: "header-scope-filter-store",
} as const;

const REGION_OPTIONS = [
  { id: "", labelKey: "header.scopeAllRegions" as const },
  { id: "east-cn", label: "华东大区" },
  { id: "south-cn", label: "华南大区" },
  { id: "north-cn", label: "华北大区" },
  { id: "us-west", label: "美国西海岸" },
  { id: "us-east", label: "美国东海岸" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderHeaderScopeFilters(): string {
  const catalog = getScopeCatalog();
  const sel =
    "h-9 max-w-[9rem] rounded-md border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:max-w-[10.5rem]";

  const brandOptions = catalog.brands
    .map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.label)}</option>`)
    .join("");

  const storeOptions = catalog.stores
    .map(
      (s) =>
        `<option value="${escapeHtml(s.id)}" data-brand-id="${escapeHtml(s.brandId ?? "")}">${escapeHtml(s.label)}</option>`,
    )
    .join("");

  const regionOptions = REGION_OPTIONS.map((r) => {
    const label = "labelKey" in r && r.labelKey ? t(r.labelKey) : (r.label ?? "");
    return `<option value="${escapeHtml(r.id)}">${escapeHtml(label)}</option>`;
  }).join("");

  return `
    <div
      class="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2"
      role="group"
      aria-label="${escapeHtml(t("header.scopeGroup"))}"
      title="${escapeHtml(t("header.scopeGroupTitle"))}"
    >
      <label class="sr-only" for="scope-brand-select">${escapeHtml(t("header.scopeBrand"))}</label>
      <select id="scope-brand-select" class="${sel}" aria-label="${escapeHtml(t("header.scopeBrandAria"))}">
        <option value="">${escapeHtml(t("header.scopeAllBrands"))}</option>
        ${brandOptions}
      </select>
      <label class="sr-only" for="scope-region-select">${escapeHtml(t("header.scopeRegion"))}</label>
      <select id="scope-region-select" class="${sel}" aria-label="${escapeHtml(t("header.scopeRegionAria"))}">
        ${regionOptions}
      </select>
      <label class="sr-only" for="scope-store-select">${escapeHtml(t("header.scopeStore"))}</label>
      <select id="scope-store-select" class="${sel}" aria-label="${escapeHtml(t("header.scopeStoreAria"))}">
        <option value="">${escapeHtml(t("header.scopeAllStores"))}</option>
        ${storeOptions}
      </select>
    </div>
  `;
}

function refillStoreOptions(
  storeEl: HTMLSelectElement,
  brandId: string,
  preserveStoreId: string,
): void {
  const catalog = getScopeCatalog();
  const stores = storesForBrand(catalog, brandId);
  const allLabel = t("header.scopeAllStores");
  storeEl.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>${stores
    .map(
      (s) =>
        `<option value="${escapeHtml(s.id)}" data-brand-id="${escapeHtml(s.brandId ?? "")}">${escapeHtml(s.label)}</option>`,
    )
    .join("")}`;
  if (preserveStoreId && Array.from(storeEl.options).some((o) => o.value === preserveStoreId)) {
    storeEl.value = preserveStoreId;
  } else {
    storeEl.value = "";
  }
}

export function bindHeaderScopeFilters(onScopeChange: () => void): void {
  const brandEl = document.getElementById("scope-brand-select") as HTMLSelectElement | null;
  const regionEl = document.getElementById("scope-region-select") as HTMLSelectElement | null;
  const storeEl = document.getElementById("scope-store-select") as HTMLSelectElement | null;
  if (!brandEl || !regionEl || !storeEl) return;

  const optionValues = (el: HTMLSelectElement): Set<string> =>
    new Set(Array.from(el.options, (o) => o.value));

  const applyStored = (): void => {
    try {
      const b = sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.brand);
      if (b != null && optionValues(brandEl).has(b)) brandEl.value = b;
      refillStoreOptions(storeEl, brandEl.value, sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.store) ?? "");
      const r = sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.region);
      if (r != null && optionValues(regionEl).has(r)) regionEl.value = r;
      const s = sessionStorage.getItem(SCOPE_FILTER_STORAGE_KEYS.store);
      if (s != null && optionValues(storeEl).has(s)) storeEl.value = s;
    } catch {
      /* ignore */
    }
  };
  applyStored();

  const persistAndNotify = (): void => {
    try {
      sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.brand, brandEl.value);
      sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.region, regionEl.value);
      sessionStorage.setItem(SCOPE_FILTER_STORAGE_KEYS.store, storeEl.value);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("menusifu:scope-filter-change", {
        detail: {
          brand: brandEl.value,
          region: regionEl.value,
          store: storeEl.value,
        },
      }),
    );
    void refreshTenantProfileForScope().then((profile) => {
      applyActiveTenantPresetSettings(profile);
      onScopeChange();
    });
  };

  brandEl.addEventListener("change", () => {
    refillStoreOptions(storeEl, brandEl.value, storeEl.value);
    persistAndNotify();
  });
  regionEl.addEventListener("change", persistAndNotify);
  storeEl.addEventListener("change", persistAndNotify);
}

export async function initTenantScopeCatalog(): Promise<void> {
  await hydrateScopeCatalog();
}
