/**
 * 团队管理 · 休息与加班
 * 路径：/team/breaks-overtime
 * 布局：左侧快捷导航 + 右侧滚动内容（对齐设置页 module-settings 交互）
 */

export const TEAM_BREAKS_OVERTIME_PATH = "/team/breaks-overtime";

const STORAGE_KEY = "bplant-team-breaks-overtime-v1";

type BreakCompensation = "paid" | "unpaid";

type CustomBreak = {
  id: string;
  name: string;
  durationMinutes: number;
  compensation: BreakCompensation;
  mandatory: boolean;
};

type OvertimeRuleType = "daily" | "daily-double" | "weekly" | "seventh-day";

type OvertimeRule = {
  type: OvertimeRuleType;
  enabled: boolean;
  hoursBeforeOvertime: number;
  wageMultiplier: number;
};

type BreaksOvertimeConfig = {
  unpaidPresets: number[];
  paidPresets: number[];
  customBreaks: CustomBreak[];
  blockEarlyEnd: boolean;
  convertExcessPaidToUnpaid: boolean;
  workWeekStartDay: number;
  overtimeRules: OvertimeRule[];
};

type NavItem = { key: string; title: string };
type NavGroup = { label: string; items: NavItem[] };

const OVERTIME_RULE_META: Record<
  OvertimeRuleType,
  { title: string; desc: string; defaultHours: number; defaultMultiplier: number }
> = {
  daily: {
    title: "每日加班",
    desc: "单日工时超过阈值后，超出部分按加班倍率计薪。",
    defaultHours: 8,
    defaultMultiplier: 1.5,
  },
  "daily-double": {
    title: "每日双倍加班",
    desc: "单日工时超过更高阈值后，超出部分按双倍计薪。",
    defaultHours: 12,
    defaultMultiplier: 2,
  },
  weekly: {
    title: "每周加班",
    desc: "自然周内累计工时超过阈值后，超出部分按加班倍率计薪。",
    defaultHours: 40,
    defaultMultiplier: 1.5,
  },
  "seventh-day": {
    title: "第 7 天加班",
    desc: "连续工作第 7 天时，前 8 小时按加班计薪，之后按双倍计薪（以当地法规为准）。",
    defaultHours: 8,
    defaultMultiplier: 1.5,
  },
};

const WEEKDAY_OPTIONS = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 0, label: "周日" },
] as const;

const BREAKS_OVERTIME_NAV_GROUPS: NavGroup[] = [
  {
    label: "休息",
    items: [
      { key: "default-breaks", title: "默认休息选项" },
      { key: "custom-breaks", title: "自定义休息" },
      { key: "break-rules", title: "休息规则" },
    ],
  },
  {
    label: "加班",
    items: [
      { key: "work-week", title: "工作周设置" },
      { key: "overtime-rules", title: "加班规则" },
    ],
  },
  {
    label: "全局规则",
    items: [{ key: "global-rules", title: "全局休息规则" }],
  },
];

const SUBNAV_SCROLL_CLASSES = "max-h-[min(70vh,100%)] overflow-y-auto overscroll-y-contain";
const SUBNAV_LINK_BASE =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const SUBNAV_LINK_SELECTED = "bg-primary/10 font-medium text-primary";
const SUBNAV_LINK_IDLE = "text-muted-foreground hover:bg-muted/60 hover:text-foreground";

const DEFAULT_CONFIG: BreaksOvertimeConfig = {
  unpaidPresets: [10, 30],
  paidPresets: [15],
  customBreaks: [
    {
      id: "break-meal",
      name: "用餐休息",
      durationMinutes: 30,
      compensation: "unpaid",
      mandatory: true,
    },
    {
      id: "break-rest",
      name: "短休",
      durationMinutes: 10,
      compensation: "paid",
      mandatory: false,
    },
  ],
  blockEarlyEnd: true,
  convertExcessPaidToUnpaid: false,
  workWeekStartDay: 1,
  overtimeRules: (["daily", "daily-double", "weekly", "seventh-day"] as OvertimeRuleType[]).map((type) => ({
    type,
    enabled: type === "daily" || type === "weekly",
    hoursBeforeOvertime: OVERTIME_RULE_META[type].defaultHours,
    wageMultiplier: OVERTIME_RULE_META[type].defaultMultiplier,
  })),
};

let draftConfig: BreaksOvertimeConfig | null = null;
let saveToastVisible = false;
let activeBreaksNavKey = "default-breaks";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newBreakId(): string {
  return `break-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeConfig(raw: Partial<BreaksOvertimeConfig> | null): BreaksOvertimeConfig {
  const base = { ...DEFAULT_CONFIG, ...raw };
  const presets = (arr: unknown, fallback: number[]) =>
    Array.isArray(arr) ? arr.map((n) => Math.max(1, Math.round(Number(n)) || 1)).filter((n) => n > 0) : fallback;

  const customBreaks: CustomBreak[] = Array.isArray(raw?.customBreaks)
    ? raw!.customBreaks!
        .map((b): CustomBreak => ({
          id: typeof b.id === "string" ? b.id : newBreakId(),
          name: typeof b.name === "string" && b.name.trim() ? b.name.trim() : "未命名休息",
          durationMinutes: Math.max(1, Math.round(Number(b.durationMinutes)) || 10),
          compensation: b.compensation === "paid" ? "paid" : "unpaid",
          mandatory: !!b.mandatory,
        }))
        .filter((b) => b.name)
    : DEFAULT_CONFIG.customBreaks.map((b) => ({ ...b }));

  const overtimeRules: OvertimeRule[] = (["daily", "daily-double", "weekly", "seventh-day"] as OvertimeRuleType[]).map(
    (type) => {
      const found = Array.isArray(raw?.overtimeRules)
        ? raw!.overtimeRules!.find((r) => r.type === type)
        : undefined;
      const meta = OVERTIME_RULE_META[type];
      return {
        type,
        enabled: found ? !!found.enabled : type === "daily" || type === "weekly",
        hoursBeforeOvertime: Math.max(
          0.5,
          Number(found?.hoursBeforeOvertime) || meta.defaultHours,
        ),
        wageMultiplier: Math.max(1, Number(found?.wageMultiplier) || meta.defaultMultiplier),
      };
    },
  );

  return {
    unpaidPresets: presets(raw?.unpaidPresets, DEFAULT_CONFIG.unpaidPresets),
    paidPresets: presets(raw?.paidPresets, DEFAULT_CONFIG.paidPresets),
    customBreaks: customBreaks.length > 0 ? customBreaks : DEFAULT_CONFIG.customBreaks.map((b) => ({ ...b })),
    blockEarlyEnd: raw?.blockEarlyEnd !== undefined ? !!raw.blockEarlyEnd : DEFAULT_CONFIG.blockEarlyEnd,
    convertExcessPaidToUnpaid:
      raw?.convertExcessPaidToUnpaid !== undefined
        ? !!raw.convertExcessPaidToUnpaid
        : DEFAULT_CONFIG.convertExcessPaidToUnpaid,
    workWeekStartDay:
      typeof raw?.workWeekStartDay === "number" && raw.workWeekStartDay >= 0 && raw.workWeekStartDay <= 6
        ? raw.workWeekStartDay
        : DEFAULT_CONFIG.workWeekStartDay,
    overtimeRules,
  };
}

function readConfig(): BreaksOvertimeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeConfig(null);
    return normalizeConfig(JSON.parse(raw) as Partial<BreaksOvertimeConfig>);
  } catch {
    return normalizeConfig(null);
  }
}

function writeConfig(config: BreaksOvertimeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function getDraft(): BreaksOvertimeConfig {
  if (!draftConfig) draftConfig = readConfig();
  return draftConfig;
}

function resetDraft(): void {
  draftConfig = null;
}

const FORM_INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FORM_SELECT = FORM_INPUT;
const SECTION_CARD =
  "scroll-mt-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5";
const SECTION_TITLE = "text-sm font-semibold text-foreground";
const SECTION_DESC = "mt-1 text-xs text-muted-foreground";

function renderPresetChips(presets: number[], compensation: BreakCompensation): string {
  if (presets.length === 0) {
    return `<p class="text-xs text-muted-foreground">暂无预设，可在下方添加。</p>`;
  }
  return presets
    .map(
      (min) => `
    <span class="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs tabular-nums">
      ${min} 分钟
      <button type="button" data-break-preset-remove="${compensation}" data-break-preset-minutes="${min}" class="rounded-full px-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="移除 ${min} 分钟">×</button>
    </span>`,
    )
    .join("");
}

function renderCustomBreakRow(b: CustomBreak): string {
  const paidSel = b.compensation === "paid" ? " selected" : "";
  const unpaidSel = b.compensation === "unpaid" ? " selected" : "";
  return `
    <tr class="border-b border-border/60" data-custom-break-row="${escapeHtml(b.id)}">
      <td class="px-2 py-2">
        <input type="text" value="${escapeHtml(b.name)}" data-custom-break-name class="${FORM_INPUT} min-w-[7rem]" placeholder="休息名称" />
      </td>
      <td class="px-2 py-2">
        <div class="relative max-w-[6rem]">
          <input type="number" min="1" step="1" value="${b.durationMinutes}" data-custom-break-duration class="${FORM_INPUT} pr-10 tabular-nums" />
          <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">分</span>
        </div>
      </td>
      <td class="px-2 py-2">
        <select data-custom-break-compensation class="${FORM_SELECT} max-w-[6.5rem]">
          <option value="unpaid"${unpaidSel}>无薪</option>
          <option value="paid"${paidSel}>带薪</option>
        </select>
      </td>
      <td class="px-2 py-2 text-center">
        <input type="checkbox" data-custom-break-mandatory class="size-4 accent-primary"${b.mandatory ? " checked" : ""} title="强制休息：未休息时触发合规提醒" />
      </td>
      <td class="px-2 py-2 text-right">
        <button type="button" data-custom-break-remove="${escapeHtml(b.id)}" class="text-xs text-destructive hover:underline">删除</button>
      </td>
    </tr>`;
}

function renderOvertimeRuleCard(rule: OvertimeRule): string {
  const meta = OVERTIME_RULE_META[rule.type];
  const disabledCls = rule.enabled ? "" : " opacity-60";
  return `
    <div class="rounded-lg border border-border/80 p-4${disabledCls}" data-overtime-rule="${rule.type}">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" data-overtime-enabled class="size-4 accent-primary"${rule.enabled ? " checked" : ""} />
            <span class="text-sm font-medium text-foreground">${escapeHtml(meta.title)}</span>
          </label>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(meta.desc)}</p>
        </div>
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs text-muted-foreground">工时超过（小时）</label>
          <input type="number" min="0.5" step="0.5" value="${rule.hoursBeforeOvertime}" data-overtime-hours class="${FORM_INPUT} max-w-xs tabular-nums"${rule.enabled ? "" : " disabled"} />
        </div>
        <div>
          <label class="mb-1 block text-xs text-muted-foreground">工资倍率</label>
          <div class="relative max-w-xs">
            <input type="number" min="1" step="0.1" value="${rule.wageMultiplier}" data-overtime-multiplier class="${FORM_INPUT} pr-8 tabular-nums"${rule.enabled ? "" : " disabled"} />
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderSectionShell(sectionKey: string, title: string, desc: string, bodyHtml: string): string {
  return `
    <section
      id="breaks-section-${escapeHtml(sectionKey)}"
      class="${SECTION_CARD}"
      data-breaks-section="${escapeHtml(sectionKey)}"
      aria-labelledby="breaks-section-heading-${escapeHtml(sectionKey)}"
    >
      <h2 id="breaks-section-heading-${escapeHtml(sectionKey)}" class="${SECTION_TITLE}">${escapeHtml(title)}</h2>
      <p class="${SECTION_DESC}">${escapeHtml(desc)}</p>
      ${bodyHtml}
    </section>`;
}

function renderDefaultBreaksSection(config: BreaksOvertimeConfig): string {
  const body = `
      <div class="mt-4 space-y-4">
        <div>
          <p class="mb-2 text-xs font-medium text-muted-foreground">无薪休息</p>
          <div class="flex flex-wrap gap-2" data-break-unpaid-presets>${renderPresetChips(config.unpaidPresets, "unpaid")}</div>
          <div class="mt-2 flex max-w-xs items-center gap-2">
            <input type="number" min="1" step="1" placeholder="分钟" data-break-unpaid-add class="${FORM_INPUT} tabular-nums" />
            <button type="button" data-break-unpaid-add-btn class="shrink-0 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">添加</button>
          </div>
        </div>
        <div>
          <p class="mb-2 text-xs font-medium text-muted-foreground">带薪休息</p>
          <div class="flex flex-wrap gap-2" data-break-paid-presets>${renderPresetChips(config.paidPresets, "paid")}</div>
          <div class="mt-2 flex max-w-xs items-center gap-2">
            <input type="number" min="1" step="1" placeholder="分钟" data-break-paid-add class="${FORM_INPUT} tabular-nums" />
            <button type="button" data-break-paid-add-btn class="shrink-0 rounded-md border border-border px-3 py-2 text-xs hover:bg-muted">添加</button>
          </div>
        </div>
      </div>`;
  return renderSectionShell(
    "default-breaks",
    "默认休息选项",
    "设置常用休息时长预设，排班与打卡时可快速选用。",
    body,
  );
}

function renderCustomBreaksSection(config: BreaksOvertimeConfig): string {
  const customRows = config.customBreaks.map(renderCustomBreakRow).join("");
  const body = `
      <div class="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button type="button" data-custom-break-add class="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted/50">+ 添加休息</button>
      </div>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr class="border-b border-border text-xs text-muted-foreground">
              <th class="px-2 py-2 font-medium">名称</th>
              <th class="px-2 py-2 font-medium">时长</th>
              <th class="px-2 py-2 font-medium">补偿</th>
              <th class="px-2 py-2 text-center font-medium">强制</th>
              <th class="px-2 py-2 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody data-custom-break-tbody>${customRows}</tbody>
        </table>
      </div>`;
  return renderSectionShell(
    "custom-breaks",
    "自定义休息",
    "与默认预设一并生效；可标记为强制休息以启用合规提醒。",
    body,
  );
}

function renderBreakRulesSection(config: BreaksOvertimeConfig): string {
  const body = `
      <div class="mt-3 space-y-2">
        <label class="flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" data-break-block-early class="mt-0.5 size-4 accent-primary"${config.blockEarlyEnd ? " checked" : ""} />
          <span>禁止提前结束休息</span>
        </label>
        <label class="flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" data-break-convert-excess class="mt-0.5 size-4 accent-primary"${config.convertExcessPaidToUnpaid ? " checked" : ""} />
          <span>带薪休息超时部分转为无薪</span>
        </label>
      </div>`;
  return renderSectionShell(
    "break-rules",
    "休息规则",
    "控制员工提前结束休息及带薪休息超额时的处理方式。",
    body,
  );
}

function renderWorkWeekSection(config: BreaksOvertimeConfig): string {
  const weekOpts = WEEKDAY_OPTIONS.map(
    (w) =>
      `<option value="${w.value}"${config.workWeekStartDay === w.value ? " selected" : ""}>${w.label}</option>`,
  ).join("");
  const body = `
      <div class="mt-3 max-w-xs">
        <label class="mb-1 block text-xs text-muted-foreground">工作周开始于</label>
        <select data-overtime-week-start class="${FORM_SELECT}">${weekOpts}</select>
      </div>`;
  return renderSectionShell(
    "work-week",
    "工作周设置",
    "工作周起始日影响每周加班的计算口径，请与薪资周期保持一致。",
    body,
  );
}

function renderOvertimeRulesSection(config: BreaksOvertimeConfig): string {
  const ruleCards = config.overtimeRules.map(renderOvertimeRuleCard).join("");
  const body = `<div class="mt-4 space-y-3">${ruleCards}</div>`;
  return renderSectionShell(
    "overtime-rules",
    "加班规则",
    "请根据当地劳动法配置每日/每周加班阈值与工资倍率；保存后用于考勤与薪资核算。",
    body,
  );
}

function renderGlobalRulesSection(globalRulesRowsHtml: string): string {
  if (!globalRulesRowsHtml.trim()) return "";
  const body = `
      <ul class="mt-3 m-0 list-none divide-y divide-border p-0" role="list">${globalRulesRowsHtml}</ul>`;
  return renderSectionShell(
    "global-rules",
    "全局休息规则",
    "强制休息时长与带薪休息时长等全店统一参数；与上方休息预设配合使用。",
    body,
  );
}

function getBreaksOvertimeNavGroups(hasGlobalRules: boolean): NavGroup[] {
  if (hasGlobalRules) return BREAKS_OVERTIME_NAV_GROUPS;
  return BREAKS_OVERTIME_NAV_GROUPS.filter((g) => g.label !== "全局规则");
}

function renderBreaksOvertimeSubnav(activeKey: string, hasGlobalRules: boolean): string {
  const groups = getBreaksOvertimeNavGroups(hasGlobalRules);
  const parts: string[] = [];

  groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      parts.push(`<li aria-hidden="true" class="my-2 list-none border-t border-border" role="presentation"></li>`);
    }
    parts.push(`
      <li class="list-none ${groupIndex > 0 ? "pt-1" : ""} pb-1" role="presentation">
        <p class="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">${escapeHtml(group.label)}</p>
      </li>`);
    for (const item of group.items) {
      const selected = activeKey === item.key;
      parts.push(`
      <li>
        <a href="#${TEAM_BREAKS_OVERTIME_PATH}/${item.key}"
          data-breaks-nav="${escapeHtml(item.key)}"
          class="${SUBNAV_LINK_BASE} ${selected ? SUBNAV_LINK_SELECTED : SUBNAV_LINK_IDLE}"
          ${selected ? 'aria-current="true"' : ""}
        >
          <span class="min-w-0 flex-1 truncate">${escapeHtml(item.title)}</span>
        </a>
      </li>`);
    }
  });

  return `
    <nav class="breaks-overtime-subnav module-settings-subnav w-56 shrink-0 border-r border-border pr-4 ${SUBNAV_SCROLL_CLASSES}" aria-label="休息与加班">
      <p class="mb-2 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">快捷导航</p>
      <ul class="space-y-0.5" role="list">${parts.join("")}</ul>
    </nav>`;
}

function renderBreaksOvertimeMainContent(config: BreaksOvertimeConfig, globalRulesRowsHtml: string): string {
  return `
    <div class="breaks-overtime-scroll-host module-settings-scroll-host min-w-0 min-h-0 flex-1 space-y-4 overflow-y-auto">
      ${renderDefaultBreaksSection(config)}
      ${renderCustomBreaksSection(config)}
      ${renderBreakRulesSection(config)}
      ${renderWorkWeekSection(config)}
      ${renderOvertimeRulesSection(config)}
      ${renderGlobalRulesSection(globalRulesRowsHtml)}
    </div>`;
}

export function isTeamBreaksOvertimePath(path: string): boolean {
  return path === TEAM_BREAKS_OVERTIME_PATH || path.startsWith(`${TEAM_BREAKS_OVERTIME_PATH}/`);
}

export function getTeamBreaksOvertimeActiveSectionKey(path: string): string | undefined {
  if (!isTeamBreaksOvertimePath(path)) return undefined;
  const suffix = path.slice(TEAM_BREAKS_OVERTIME_PATH.length).replace(/^\//, "");
  if (!suffix) return undefined;
  const allKeys = BREAKS_OVERTIME_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));
  return allKeys.includes(suffix) ? suffix : undefined;
}

export function renderTeamBreaksOvertimePage(globalRulesRowsHtml = "", path?: string): string {
  const config = getDraft();
  const sectionFromPath = path ? getTeamBreaksOvertimeActiveSectionKey(path) : undefined;
  if (sectionFromPath) activeBreaksNavKey = sectionFromPath;

  const hasGlobalRules = globalRulesRowsHtml.trim().length > 0;
  const navGroups = getBreaksOvertimeNavGroups(hasGlobalRules);
  const validKeys = navGroups.flatMap((g) => g.items.map((i) => i.key));
  if (!validKeys.includes(activeBreaksNavKey)) {
    activeBreaksNavKey = validKeys[0] ?? "default-breaks";
  }

  const toast = saveToastVisible
    ? `<div class="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary" role="status">已保存</div>`
    : "";

  return `
    <div class="team-breaks-overtime-page flex min-h-0 flex-1 flex-col gap-4" data-team-breaks-overtime-page data-breaks-view="full">
      <div class="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-muted-foreground">配置休息预设、自定义休息与加班规则，应用于打卡考勤与薪资核算。</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          ${toast}
          <button type="button" data-breaks-overtime-save class="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">保存</button>
        </div>
      </div>
      <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden sm:flex-row sm:items-stretch">
        ${renderBreaksOvertimeSubnav(activeBreaksNavKey, hasGlobalRules)}
        ${renderBreaksOvertimeMainContent(config, globalRulesRowsHtml)}
      </div>
    </div>`;
}

function collectPresetsFromDom(root: HTMLElement, compensation: BreakCompensation): number[] {
  const container = root.querySelector<HTMLElement>(
    compensation === "paid" ? "[data-break-paid-presets]" : "[data-break-unpaid-presets]",
  );
  if (!container) return compensation === "paid" ? getDraft().paidPresets : getDraft().unpaidPresets;
  const mins: number[] = [];
  container.querySelectorAll<HTMLElement>("[data-break-preset-minutes]").forEach((el) => {
    const n = Number(el.getAttribute("data-break-preset-minutes"));
    if (n > 0) mins.push(Math.round(n));
  });
  return [...new Set(mins)].sort((a, b) => a - b);
}

function collectCustomBreaksFromDom(root: HTMLElement): CustomBreak[] {
  const rows: CustomBreak[] = [];
  root.querySelectorAll<HTMLElement>("[data-custom-break-row]").forEach((row) => {
    const id = row.getAttribute("data-custom-break-row") ?? newBreakId();
    const name = row.querySelector<HTMLInputElement>("[data-custom-break-name]")?.value.trim() ?? "";
    const durationMinutes = Math.max(
      1,
      Number(row.querySelector<HTMLInputElement>("[data-custom-break-duration]")?.value) || 10,
    );
    const compensation =
      row.querySelector<HTMLSelectElement>("[data-custom-break-compensation]")?.value === "paid"
        ? "paid"
        : "unpaid";
    const mandatory = row.querySelector<HTMLInputElement>("[data-custom-break-mandatory]")?.checked ?? false;
    if (name) rows.push({ id, name, durationMinutes, compensation, mandatory });
  });
  return rows;
}

function collectOvertimeRulesFromDom(root: HTMLElement): OvertimeRule[] {
  return (["daily", "daily-double", "weekly", "seventh-day"] as OvertimeRuleType[]).map((type) => {
    const card = root.querySelector<HTMLElement>(`[data-overtime-rule="${type}"]`);
    const enabled = card?.querySelector<HTMLInputElement>("[data-overtime-enabled]")?.checked ?? false;
    const hoursBeforeOvertime = Math.max(
      0.5,
      Number(card?.querySelector<HTMLInputElement>("[data-overtime-hours]")?.value) ||
        OVERTIME_RULE_META[type].defaultHours,
    );
    const wageMultiplier = Math.max(
      1,
      Number(card?.querySelector<HTMLInputElement>("[data-overtime-multiplier]")?.value) ||
        OVERTIME_RULE_META[type].defaultMultiplier,
    );
    return { type, enabled, hoursBeforeOvertime, wageMultiplier };
  });
}

function collectConfigFromDom(root: HTMLElement): BreaksOvertimeConfig {
  const view = root.getAttribute("data-breaks-view") ?? "full";
  const current = getDraft();
  return normalizeConfig({
    unpaidPresets: view === "full" ? collectPresetsFromDom(root, "unpaid") : current.unpaidPresets,
    paidPresets: view === "full" ? collectPresetsFromDom(root, "paid") : current.paidPresets,
    customBreaks: view === "full" ? collectCustomBreaksFromDom(root) : current.customBreaks,
    blockEarlyEnd:
      view === "full"
        ? (root.querySelector<HTMLInputElement>("[data-break-block-early]")?.checked ?? current.blockEarlyEnd)
        : current.blockEarlyEnd,
    convertExcessPaidToUnpaid:
      view === "full"
        ? (root.querySelector<HTMLInputElement>("[data-break-convert-excess]")?.checked ??
          current.convertExcessPaidToUnpaid)
        : current.convertExcessPaidToUnpaid,
    workWeekStartDay: Number(root.querySelector<HTMLSelectElement>("[data-overtime-week-start]")?.value) || 1,
    overtimeRules: collectOvertimeRulesFromDom(root),
  });
}

function syncOvertimeRuleDisabled(card: HTMLElement): void {
  const enabled = card.querySelector<HTMLInputElement>("[data-overtime-enabled]")?.checked ?? false;
  card.classList.toggle("opacity-60", !enabled);
  card.querySelectorAll<HTMLInputElement>("[data-overtime-hours], [data-overtime-multiplier]").forEach((input) => {
    input.disabled = !enabled;
  });
}

function addPresetMinutes(root: HTMLElement, compensation: BreakCompensation, minutes: number): void {
  const config = collectConfigFromDom(root);
  const key = compensation === "paid" ? "paidPresets" : "unpaidPresets";
  if (config[key].includes(minutes)) return;
  config[key] = [...config[key], minutes].sort((a, b) => a - b);
  draftConfig = config;
}

function bindPresetAdd(root: HTMLElement, compensation: BreakCompensation, remount: () => void): void {
  const inputSel = compensation === "paid" ? "[data-break-paid-add]" : "[data-break-unpaid-add]";
  const btnSel = compensation === "paid" ? "[data-break-paid-add-btn]" : "[data-break-unpaid-add-btn]";
  const tryAdd = () => {
    const input = root.querySelector<HTMLInputElement>(inputSel);
    const minutes = Math.max(1, Math.round(Number(input?.value) || 0));
    if (!minutes) {
      input?.focus();
      return;
    }
    addPresetMinutes(root, compensation, minutes);
    if (input) input.value = "";
    remount();
  };
  root.querySelector(btnSel)?.addEventListener("click", tryAdd);
  root.querySelector<HTMLInputElement>(inputSel)?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryAdd();
    }
  });
}

function syncBreaksOvertimeSubnavActive(root: HTMLElement, key: string): void {
  activeBreaksNavKey = key;
  root.querySelectorAll<HTMLAnchorElement>("[data-breaks-nav]").forEach((link) => {
    const linkKey = link.getAttribute("data-breaks-nav");
    const selected = linkKey === key;
    link.className = `${SUBNAV_LINK_BASE} ${selected ? SUBNAV_LINK_SELECTED : SUBNAV_LINK_IDLE}`;
    if (selected) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

function scrollToBreaksOvertimeSection(root: HTMLElement, sectionKey: string): void {
  const scrollHost = root.querySelector<HTMLElement>(".breaks-overtime-scroll-host");
  const section = root.querySelector<HTMLElement>(`#breaks-section-${sectionKey}`);
  if (!scrollHost || !section) return;
  const hostRect = scrollHost.getBoundingClientRect();
  const elRect = section.getBoundingClientRect();
  scrollHost.scrollTo({
    top: Math.max(0, scrollHost.scrollTop + (elRect.top - hostRect.top) - 12),
    behavior: "smooth",
  });
}

function bindBreaksOvertimeSubnav(root: HTMLElement): void {
  const scrollHost = root.querySelector<HTMLElement>(".breaks-overtime-scroll-host");
  if (!scrollHost) return;

  root.querySelectorAll<HTMLAnchorElement>("[data-breaks-nav]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const key = link.getAttribute("data-breaks-nav");
      if (!key) return;
      const href = `#${TEAM_BREAKS_OVERTIME_PATH}/${key}`;
      if (location.hash !== href) {
        history.replaceState(null, "", href);
      }
      scrollToBreaksOvertimeSection(root, key);
      syncBreaksOvertimeSubnavActive(root, key);
    });
  });

  const sections = root.querySelectorAll<HTMLElement>("[data-breaks-section]");
  if (sections.length === 0) return;

  let scrollRaf = 0;
  const onScroll = (): void => {
    const hostRect = scrollHost.getBoundingClientRect();
    const anchor = hostRect.top + 80;
    let currentKey = sections[0]?.getAttribute("data-breaks-section") ?? activeBreaksNavKey;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= anchor) {
        currentKey = section.getAttribute("data-breaks-section") ?? currentKey;
      }
    }
    if (currentKey && currentKey !== activeBreaksNavKey) {
      syncBreaksOvertimeSubnavActive(root, currentKey);
    }
  };

  scrollHost.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        onScroll();
      });
    },
    { passive: true },
  );
}

export function bindTeamBreaksOvertimeUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-team-breaks-overtime-page]");
  if (!root || root.dataset.breaksOvertimeBound === "1") return;
  root.dataset.breaksOvertimeBound = "1";

  bindBreaksOvertimeSubnav(root);

  const path = location.hash.slice(1) || "/dashboard/overview";
  const sectionKey = getTeamBreaksOvertimeActiveSectionKey(path);
  if (sectionKey) {
    requestAnimationFrame(() => scrollToBreaksOvertimeSection(root, sectionKey));
  }

  bindPresetAdd(root, "unpaid", remount);
  bindPresetAdd(root, "paid", remount);

  root.querySelectorAll("[data-break-preset-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const compensation = btn.getAttribute("data-break-preset-remove") as BreakCompensation;
      const minutes = Number(btn.getAttribute("data-break-preset-minutes"));
      const config = collectConfigFromDom(root);
      const key = compensation === "paid" ? "paidPresets" : "unpaidPresets";
      config[key] = config[key].filter((m) => m !== minutes);
      draftConfig = config;
      remount();
    });
  });

  root.querySelector("[data-custom-break-add]")?.addEventListener("click", () => {
    const config = collectConfigFromDom(root);
    const newBreak: CustomBreak = {
      id: newBreakId(),
      name: "新休息",
      durationMinutes: 15,
      compensation: "unpaid",
      mandatory: false,
    };
    config.customBreaks = [...config.customBreaks, newBreak];
    draftConfig = config;
    remount();
  });

  root.querySelectorAll("[data-custom-break-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-custom-break-remove");
      if (!id) return;
      const config = collectConfigFromDom(root);
      config.customBreaks = config.customBreaks.filter((b) => b.id !== id);
      if (config.customBreaks.length === 0) {
        config.customBreaks = [{ id: newBreakId(), name: "短休", durationMinutes: 10, compensation: "paid", mandatory: false }];
      }
      draftConfig = config;
      remount();
    });
  });

  root.querySelectorAll<HTMLElement>("[data-overtime-rule]").forEach((card) => {
    card.querySelector("[data-overtime-enabled]")?.addEventListener("change", () => {
      syncOvertimeRuleDisabled(card);
    });
    syncOvertimeRuleDisabled(card);
  });

  root.querySelector("[data-breaks-overtime-save]")?.addEventListener("click", () => {
    const config = collectConfigFromDom(root);
    writeConfig(config);
    draftConfig = config;
    saveToastVisible = true;
    remount();
    window.setTimeout(() => {
      saveToastVisible = false;
      remount();
    }, 2000);
  });
}

let breaksOvertimeSessionPath = "";

/** 路由切换时维护编辑会话：离开页面则丢弃未保存草稿 */
export function syncTeamBreaksOvertimeSession(path: string): void {
  const active = isTeamBreaksOvertimePath(path);
  if (!active) {
    resetDraft();
    saveToastVisible = false;
    breaksOvertimeSessionPath = "";
    activeBreaksNavKey = "default-breaks";
  } else if (!breaksOvertimeSessionPath) {
    breaksOvertimeSessionPath = path;
  }
}

/** 页面卸载或离开路由时丢弃未保存草稿 */
export function resetTeamBreaksOvertimeDraft(): void {
  resetDraft();
  saveToastVisible = false;
  breaksOvertimeSessionPath = "";
  activeBreaksNavKey = "default-breaks";
}
