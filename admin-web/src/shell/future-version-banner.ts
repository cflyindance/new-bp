import { t } from "../i18n";
import { isMvpProductVersion } from "../config/product-version";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[char]!));

export function renderFutureVersionDiffBanner(alwaysVisible = false): string {
  if (!alwaysVisible && isMvpProductVersion()) return "";
  return `
    <div
      class="z-50 flex shrink-0 items-center justify-center bg-[#ef4444] px-4 py-2.5 text-center text-sm font-medium leading-snug text-white"
      data-future-version-diff-banner
      role="status"
    >
      ${escapeHtml(t("shell.futureVersionDiffBanner"))}
    </div>`;
}
