/**
 * 租户功能画像横幅 — 主页 / 待办复用
 */
import { getEffectiveBusinessTypePresets } from "./feature-presets-catalog-runtime";
import { PRODUCT_LINE_KEYS } from "./feature-presets";
import { listEffectiveVariantsForTenant } from "./feature-presets-variant-runtime";
import { listVariantSettingHighlights } from "./feature-presets-variant-summary";
import { getHeaderScopeContext } from "./tenant-profile-api";
import { loadTenantProfile, type TenantProfile } from "./tenant-profile-storage";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface TenantProfileBannerOptions {
  /** 展示变体设置摘要（主页用紧凑模式） */
  compactVariants?: boolean;
  /** 无 onboarding 完成时也展示 */
  force?: boolean;
}

export function renderTenantProfileBanner(options: TenantProfileBannerOptions = {}): string {
  const profile = loadTenantProfile();
  if (!profile) return "";
  if (!options.force && !profile.onboardingCompleted && !profile.implementationPreConfigured) {
    return "";
  }

  const scope = getHeaderScopeContext();
  const bt = getEffectiveBusinessTypePresets().find((b) => b.id === profile.primaryBusinessType);
  const lines = profile.productLinePresetIds
    .map((id) => PRODUCT_LINE_KEYS.find((p) => p.id === id)?.title ?? id)
    .join("、");
  const scopeHint =
    scope.brandId || scope.storeId
      ? `品牌 ${scope.brandId || "—"} · 门店 ${scope.storeId || "—"}`
      : "租户默认";

  const variants = listEffectiveVariantsForTenant(
    profile.primaryBusinessType,
    profile.productLinePresetIds,
  );

  const variantChips =
    variants.length > 0
      ? `<span class="mt-2 flex flex-wrap gap-1.5">${variants
          .map(
            (v) =>
              `<span class="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-xs text-primary" title="${escapeHtml(v.id)}">${escapeHtml(v.title)}</span>`,
          )
          .join("")}</span>`
      : "";

  const variantDetail =
    !options.compactVariants && variants.length > 0
      ? `<ul class="mt-2 space-y-1 text-xs text-muted-foreground">${variants
          .flatMap((v) => listVariantSettingHighlights(v, 2).map((h) => `<li>· ${escapeHtml(v.title)}：${escapeHtml(h)}</li>`))
          .slice(0, 4)
          .join("")}</ul>`
      : "";

  const preConfiguredBadge = profile.implementationPreConfigured
    ? `<span class="ml-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">实施代配</span>`
    : "";

  return `
    <div class="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <span class="text-muted-foreground">功能画像（${escapeHtml(scopeHint)}）：</span>
          <span class="font-medium text-foreground">${escapeHtml(bt?.title ?? profile.primaryBusinessType)}</span>
          ${lines ? `<span class="text-muted-foreground"> · ${escapeHtml(lines)}</span>` : ""}
          ${preConfiguredBadge}
          ${variantChips}
          ${variantDetail}
        </div>
        <a href="#/settings/feature-presets" class="shrink-0 text-primary underline-offset-2 hover:underline">平台预设</a>
      </div>
    </div>`;
}

export function profileHasActiveVariants(profile: TenantProfile): boolean {
  return (
    listEffectiveVariantsForTenant(profile.primaryBusinessType, profile.productLinePresetIds).length > 0
  );
}
