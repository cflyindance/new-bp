import type { ModuleSettingCatalogItem } from "./module-settings-catalog";

const UNFILLED_FEATURE = new Set(["（未填写）", "(未填写)"]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 设置 catalog 中的功能说明：优先 sceneDesc，其次 feature */
export function resolveModuleSettingDescription(
  item: Pick<ModuleSettingCatalogItem, "sceneDesc" | "feature">,
): string {
  const scene = item.sceneDesc.trim();
  if (scene) return scene;
  const feature = item.feature.trim();
  if (feature && !UNFILLED_FEATURE.has(feature)) return feature;
  return "";
}

/** AI 助手回复中附带的功能说明块（纯文本 + HTML） */
export function formatAiSettingDescription(
  item: Pick<ModuleSettingCatalogItem, "sceneDesc" | "feature">,
  locale: "zh" | "en",
): { textSuffix: string; htmlBlock: string } {
  const desc = resolveModuleSettingDescription(item);
  if (!desc) return { textSuffix: "", htmlBlock: "" };
  const label = locale === "en" ? "About this setting" : "功能说明";
  return {
    textSuffix: `\n${label}：${desc}`,
    htmlBlock: `<p class="mt-2 text-xs leading-relaxed text-muted-foreground"><span class="font-medium text-foreground/80">${escapeHtml(label)}：</span>${escapeHtml(desc)}</p>`,
  };
}
