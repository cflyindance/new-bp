/**
 * 团队管理 · 已迁出至业务页的设置项嵌入
 * 排班 / 休息与加班 / 员工打卡「规则设置」Tab（或页内嵌入区）
 */

import {
  getTeamEmbeddedSettingItems,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";

export const TEAM_SHIFT_SCHEDULING_SETTING_SEQS = [74] as const;

export const TEAM_BREAKS_OVERTIME_SETTING_SEQS = [66, 329] as const;

export const TEAM_CLOCK_IN_SETTING_SEQS = [72, 73, 71, 67, 68, 69, 241, 70] as const;

/** 员工打卡 · 规则设置分组顺序 */
export const TEAM_CLOCK_IN_GROUP_ORDER = [
  "clock-hours",
  "logout-gates",
  "punch-receipt",
] as const;

export function getTeamSettingItemsBySeqs(
  seqs: readonly number[],
): ModuleSettingCatalogItem[] {
  return getTeamEmbeddedSettingItems(seqs);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TeamSettingsEmbedSectionOpts = {
  embedKey: string;
  title?: string;
  description?: string;
  rowsHtml: string;
  defaultOpen?: boolean;
};

export type TeamSettingsTabPanelOpts = {
  description?: string;
  /** 扁平列表（排班等单项页） */
  rowsHtml?: string;
  /** 已分组的分类卡片 HTML（员工打卡规则等） */
  sectionsHtml?: string;
};

/** Tab 面板内：规则设置列表（员工打卡等页与业务 Tab 同级） */
export function renderTeamSettingsTabPanel(opts: TeamSettingsTabPanelOpts): string {
  const bodyHtml = (opts.sectionsHtml ?? opts.rowsHtml ?? "").trim();
  if (!bodyHtml) return "";

  const description =
    opts.description ??
    "以下规则与本页业务直接相关，修改后立即生效；完整薪酬规则仍在「设置 → 薪酬与小费」。";

  const listOrSections = opts.sectionsHtml
    ? `<div class="flex flex-col gap-4 p-4">${opts.sectionsHtml}</div>`
    : `<ul class="m-0 list-none divide-y divide-border p-0" role="list">${opts.rowsHtml}</ul>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col" data-clock-rules-panel role="tabpanel">
      <div class="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card shadow-sm">
        <div class="border-b border-border px-4 py-3">
          <p class="text-sm leading-relaxed text-muted-foreground">${escapeHtml(description)}</p>
        </div>
        ${listOrSections}
      </div>
    </div>`;
}

/** 业务页底：折叠「规则设置」区块（rowsHtml 由 main 侧 renderModuleSettingRow 生成） */
export function renderTeamSettingsEmbedSection(opts: TeamSettingsEmbedSectionOpts): string {
  const { embedKey, rowsHtml, defaultOpen = false } = opts;
  if (!rowsHtml.trim()) return "";

  const title = opts.title ?? "规则设置";
  const description =
    opts.description ??
    "以下规则与本页业务直接相关，修改后立即生效；完整薪酬规则仍在「设置 → 薪酬与小费」。";
  const openAttr = defaultOpen ? " open" : "";

  return `
    <details
      class="team-settings-embed shrink-0 rounded-xl border border-border bg-card shadow-sm"
      data-team-settings-embed="${escapeHtml(embedKey)}"
      ${openAttr}
    >
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-card-foreground">${escapeHtml(title)}</h2>
          <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">${escapeHtml(description)}</p>
        </div>
        <span class="shrink-0 text-xs text-muted-foreground" aria-hidden="true">展开</span>
      </summary>
      <ul class="m-0 list-none divide-y divide-border border-t border-border p-0" role="list">${rowsHtml}</ul>
    </details>`;
}
