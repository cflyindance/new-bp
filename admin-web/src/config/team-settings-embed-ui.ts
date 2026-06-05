/**
 * 团队管理 · 已迁出至业务页的设置项嵌入
 * 排班 / 休息与加班 / 员工打卡 页底「规则设置」折叠区
 */

import {
  getTeamEmbeddedSettingItems,
  type ModuleSettingCatalogItem,
} from "./module-settings-catalog";

export const TEAM_SHIFT_SCHEDULING_SETTING_SEQS = [74] as const;

export const TEAM_BREAKS_OVERTIME_SETTING_SEQS = [66, 329] as const;

export const TEAM_CLOCK_IN_SETTING_SEQS = [67, 68, 69, 70, 71, 72, 73, 241] as const;

export const TEAM_SETTINGS_RETAINED_SEQS = [186, 306, 309, 310] as const;

export const TEAM_SETTINGS_MIGRATED_TARGETS = [
  {
    label: "排班",
    path: "/team/shift-scheduling",
    seqs: TEAM_SHIFT_SCHEDULING_SETTING_SEQS,
  },
  {
    label: "休息与加班",
    path: "/team/breaks-overtime",
    seqs: TEAM_BREAKS_OVERTIME_SETTING_SEQS,
  },
  {
    label: "员工打卡",
    path: "/team/clock-in",
    seqs: TEAM_CLOCK_IN_SETTING_SEQS,
  },
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
  rowsHtml: string;
};

/** Tab 面板内：规则设置列表（员工打卡等页与业务 Tab 同级） */
export function renderTeamSettingsTabPanel(opts: TeamSettingsTabPanelOpts): string {
  const { rowsHtml } = opts;
  if (!rowsHtml.trim()) return "";

  const description =
    opts.description ??
    "以下规则与本页业务直接相关，修改后立即生效；完整薪酬规则仍在「设置 → 薪酬与小费」。";

  return `
    <div class="flex min-h-0 flex-1 flex-col" data-clock-rules-panel role="tabpanel">
      <div class="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card shadow-sm">
        <div class="border-b border-border px-4 py-3">
          <p class="text-sm leading-relaxed text-muted-foreground">${escapeHtml(description)}</p>
        </div>
        <ul class="m-0 list-none divide-y divide-border p-0" role="list">${rowsHtml}</ul>
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

/** 团队设置 hub：已迁出项摘要 + 跳转链接 */
export function renderTeamSettingsHubMigrationNoticeHtml(): string {
  const links = TEAM_SETTINGS_MIGRATED_TARGETS.map(
    (t) =>
      `<li class="flex flex-wrap items-baseline justify-between gap-2 py-2">
        <span class="text-sm text-foreground">${escapeHtml(t.label)}</span>
        <a href="#${escapeHtml(t.path)}" class="text-sm font-medium text-primary hover:underline">${escapeHtml(t.label)}页 · ${t.seqs.length} 项</a>
      </li>`,
  ).join("");

  return `
    <div class="rounded-lg border border-primary/25 bg-primary/[0.04] px-4 py-3">
      <p class="text-sm font-medium text-foreground">考勤与排班相关规则已迁至业务页</p>
      <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
        本页仅保留薪酬与小费计算口径。强制休息、打卡门禁、Batch 考勤检查等请在对应业务页配置（休息与加班为左侧快捷导航；员工打卡为「规则设置」Tab）。
      </p>
      <ul class="mt-3 m-0 list-none divide-y divide-border/60 p-0" role="list">${links}</ul>
    </div>`;
}
