/**
 * AI 助手 · 改配确认卡片（展示功能说明 + 确认/取消）
 */

import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import type { AiSettingMutation } from "./module-settings-ai-editable";

export type AiSettingConfirmAction =
  | { kind: "toggle"; seq: number; on: boolean }
  | { kind: "mutations"; mutations: AiSettingMutation[] };

export type AiSettingIndexedBrief = {
  hubTitle: string;
  href: string;
  item: ModuleSettingCatalogItem;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 功能说明区块：sceneDesc + 可选 feature */
export function formatSettingSceneDescBlock(
  indexed: AiSettingIndexedBrief,
  locale: "zh" | "en",
): string {
  const { item, hubTitle } = indexed;
  const descLabel = locale === "en" ? "What it does" : "功能说明";
  const sceneDesc =
    item.sceneDesc?.trim() ||
    (locale === "en" ? "No description available for this setting." : "暂无该功能的场景说明。");
  const meta =
    locale === "en"
      ? `${hubTitle} · ${item.groupTitle}`
      : `${hubTitle} · ${item.groupTitle}`;
  const featureLine = item.feature?.trim()
    ? `<p class="mt-2 text-xs text-muted-foreground">${escapeHtml(item.feature.trim())}</p>`
    : "";
  return `
    <div class="mt-2 rounded-lg border border-border bg-muted/30 p-3">
      <p class="text-xs font-medium text-muted-foreground">${escapeHtml(descLabel)}</p>
      <p class="mt-1 text-sm leading-relaxed text-card-foreground">${escapeHtml(sceneDesc)}</p>
      ${featureLine}
      <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(meta)}</p>
    </div>`;
}

export function buildAiSettingConfirmButtonsHtml(
  action: AiSettingConfirmAction,
  locale: "zh" | "en",
): string {
  const confirmLabel = locale === "en" ? "Confirm apply" : "确认应用";
  const cancelLabel = locale === "en" ? "Cancel" : "取消";
  const payload = encodeURIComponent(JSON.stringify(action));
  return `
    <div class="mt-3 flex flex-wrap gap-2" data-ai-confirm-actions>
      <button type="button" data-ai-setting-confirm data-ai-confirm-payload="${escapeHtml(payload)}" class="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">${escapeHtml(confirmLabel)}</button>
      <button type="button" data-ai-setting-cancel class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">${escapeHtml(cancelLabel)}</button>
    </div>`;
}

export function decodeAiSettingConfirmPayload(raw: string | null): AiSettingConfirmAction | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as AiSettingConfirmAction;
    if (parsed.kind === "toggle" && typeof parsed.seq === "number" && typeof parsed.on === "boolean") {
      return parsed;
    }
    if (parsed.kind === "mutations" && Array.isArray(parsed.mutations) && parsed.mutations.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
