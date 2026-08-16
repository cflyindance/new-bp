import type { UiLocale } from "../i18n";
import { getUiLocale } from "../i18n";

/** 壳层 zh/en → 嵌入端 URL language（Kiosk Lite 约定） */
export function uiLocaleToEmbedLanguage(locale: UiLocale = getUiLocale()): "zh-cn" | "en" {
  return locale === "en" ? "en" : "zh-cn";
}

/** eMenu i18n 码：localStorage emenu_lang 存 JSON 字符串 "zh" | "en" */
export function uiLocaleToEmenuLang(locale: UiLocale = getUiLocale()): "zh" | "en" {
  return locale === "en" ? "en" : "zh";
}

/**
 * 在已有 iframe URL 上写入/覆盖 language 查询参数。
 * 支持 `...?a=1#/hash`：language 落在 search，不破坏 hash。
 */
export function withEmbedLanguageParam(src: string, locale: UiLocale = getUiLocale()): string {
  const language = uiLocaleToEmbedLanguage(locale);
  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
  const hash = hashIndex >= 0 ? src.slice(hashIndex) : "";
  const qIndex = beforeHash.indexOf("?");
  const path = qIndex >= 0 ? beforeHash.slice(0, qIndex) : beforeHash;
  const query = qIndex >= 0 ? beforeHash.slice(qIndex + 1) : "";
  const params = new URLSearchParams(query);
  params.set("language", language);
  const nextQuery = params.toString();
  return `${path}?${nextQuery}${hash}`;
}

/** 同源 eMenu iframe 启动读 emenu_lang；切换语言时先写再 remount。 */
export function syncEmenuLangStorage(locale: UiLocale = getUiLocale()): void {
  try {
    localStorage.setItem("emenu_lang", JSON.stringify(uiLocaleToEmenuLang(locale)));
  } catch {
    /* ignore */
  }
}
