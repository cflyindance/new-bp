import {
  applyUiLocaleToDocument,
  getUiLocale,
  setUiLocale,
  t,
  type UiLocale,
} from "../i18n";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 顶栏界面语言下拉（商家后台与 eMenu/Kiosk 本地壳层共用） */
export function renderUiLocaleControl(): string {
  const cur = getUiLocale();
  const lab = escapeHtml(t("locale.label"));
  return `<div class="flex shrink-0 items-center">
      <label for="global-ui-locale" class="sr-only">${lab}</label>
      <select
        id="global-ui-locale"
        title="${lab}"
        class="h-9 max-w-[8.5rem] cursor-pointer rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-11 sm:max-w-none sm:px-2.5"
        aria-label="${lab}"
      >
        <option value="zh" ${cur === "zh" ? "selected" : ""}>${escapeHtml(t("locale.optionZh"))}</option>
        <option value="en" ${cur === "en" ? "selected" : ""}>${escapeHtml(t("locale.optionEn"))}</option>
      </select>
    </div>`;
}

export function bindUiLocaleControl(onLocaleChange: (locale: UiLocale) => void): void {
  const sel = document.getElementById("global-ui-locale") as HTMLSelectElement | null;
  if (!sel) return;
  sel.value = getUiLocale();
  sel.addEventListener("change", () => {
    const v: UiLocale = sel.value === "en" ? "en" : "zh";
    setUiLocale(v);
    applyUiLocaleToDocument(v);
    window.dispatchEvent(new CustomEvent("menusifu:ui-locale-change", { detail: { locale: v } }));
    onLocaleChange(v);
  });
}
