/**
 * 团队管理 · 休息与加班
 * 路径：/team/breaks-overtime
 * 布局：左侧快捷导航 + 右侧滚动内容（对齐设置页 module-settings 交互）
 */
import {
  buildChangeDetailRows,
  changeHasDiff,
  summarizeChangeDetails,
} from "./deployment-change-buffer";
import { diffCollection, type CollectionAdapter } from "./collection-change-diff";
import { resolveChangeGroupPath } from "./module-settings-deployment-change";
import { recordPageOrImmediateConfigChange } from "./page-config-change";
import {
  registerPageSaveDirtyProbe,
  registerPageSavePreCommit,
} from "./page-save-registry";
import { MODULE_SETTINGS_SUBNAV_SECTION_HEADING_CLASS } from "./module-settings-subnav";
import { readModuleSettingNumber } from "./module-settings-form-ui";

export const TEAM_BREAKS_OVERTIME_PATH = "/team/breaks-overtime";

const STORAGE_KEY = "bplant-team-breaks-overtime-v1";
/** 与 main.ts TEAM_TIME_INPUT_ROWS[329] 一致：员工报表 · 带薪休息时长 */
const PAID_BREAK_MINUTES_FIELD_ID = "329-paid-break-minutes";
const PAID_BREAK_MINUTES_DEFAULT = 10;

type BreakCompensation = "paid" | "unpaid";

type CustomBreak = {
  id: string;
  name: string;
  durationMinutes: number;
  compensation: BreakCompensation;
  mandatory: boolean;
};

/** 计算口径（影响考勤/薪资核算逻辑） */
type OvertimeScope = "daily" | "daily-double" | "weekly" | "nth-day";

type OvertimeRule = {
  id: string;
  name: string;
  scope: OvertimeScope;
  hoursBeforeOvertime: number;
  wageMultiplier: number;
  /** 仅「第 N 天」口径：连续工作第几天，默认 7 */
  dayNumber?: number;
  /** 仅「第 N 天」：第二档工时阈值，默认 8 */
  secondaryHoursBeforeOvertime?: number;
  /** 仅「第 N 天」：第二档工资倍率，默认 2 */
  secondaryWageMultiplier?: number;
};

type OvertimeRuleEditor = { mode: "create" } | { mode: "edit"; id: string };
type CustomBreakEditor = { mode: "create" } | { mode: "edit"; id: string };

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

const OVERTIME_SCOPES: OvertimeScope[] = ["daily", "daily-double", "weekly", "nth-day"];
const DEFAULT_NTH_DAY = 7;
const DEFAULT_NTH_DAY_TIER1 = { hours: 8, multiplier: 1.5 };
const DEFAULT_NTH_DAY_TIER2 = { hours: 8, multiplier: 2 };

const OVERTIME_SCOPE_META: Record<
  OvertimeScope,
  { title: string; desc: string; defaultHours: number; defaultMultiplier: number }
> = {
  daily: {
    title: "每日",
    desc: "单日工时超过阈值后，超出部分按加班倍率计薪。",
    defaultHours: 8,
    defaultMultiplier: 1.5,
  },
  "daily-double": {
    title: "每日双倍",
    desc: "单日工时超过更高阈值后，超出部分按双倍计薪。",
    defaultHours: 12,
    defaultMultiplier: 2,
  },
  weekly: {
    title: "每周",
    desc: "自然周内累计工时超过阈值后，超出部分按加班倍率计薪。",
    defaultHours: 40,
    defaultMultiplier: 1.5,
  },
  "nth-day": {
    title: "第 N 天",
    desc: "连续工作第 N 天时，按两档工时阈值与工资倍率计薪（如前 8 小时 1.5×，之后 2×）。",
    defaultHours: DEFAULT_NTH_DAY_TIER1.hours,
    defaultMultiplier: DEFAULT_NTH_DAY_TIER1.multiplier,
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
];

/** 与 main.ts 三级侧栏一致：仅侧栏自身过长时可滚，不随右侧四级内容同步滚动 */
const SUBNAV_SCROLL_CLASSES =
  "tertiary-inline-subnav-scroll min-h-0 max-h-[min(52dvh,26rem)] overflow-y-auto overscroll-y-contain sm:max-h-full sm:self-stretch";
const SUBNAV_LINK_BASE =
  "flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const SUBNAV_LINK_NESTED = "pl-4";
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
  /** 默认不预置规则，由用户新增 */
  overtimeRules: [],
};

/** 系统默认休息：名称固定不可改，可改时长/补偿/强制 */
const SYSTEM_CUSTOM_BREAKS: ReadonlyArray<Pick<CustomBreak, "id" | "name">> = [
  { id: "break-meal", name: "用餐休息" },
  { id: "break-rest", name: "短休" },
];
const SYSTEM_CUSTOM_BREAK_IDS = new Set(SYSTEM_CUSTOM_BREAKS.map((b) => b.id));
const SYSTEM_CUSTOM_BREAK_NAME_BY_ID = Object.fromEntries(
  SYSTEM_CUSTOM_BREAKS.map((b) => [b.id, b.name]),
) as Record<string, string>;

function isSystemCustomBreak(id: string): boolean {
  return SYSTEM_CUSTOM_BREAK_IDS.has(id);
}

/** 读取「员工报表:带薪休息时长(分钟)」；优先取页内输入框当前值 */
function readPaidBreakMinutes(root?: HTMLElement | null): number {
  const live = root?.querySelector<HTMLInputElement>(
    `[data-module-setting-number="${PAID_BREAK_MINUTES_FIELD_ID}"]`,
  );
  if (live) {
    const n = Math.round(Number(live.value));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  return Math.max(0, Math.round(readModuleSettingNumber(PAID_BREAK_MINUTES_FIELD_ID, PAID_BREAK_MINUTES_DEFAULT)));
}

/** 已设置带薪休息时长（>0）后，才允许开启「超时转为无薪」 */
function isPaidBreakDurationConfigured(root?: HTMLElement | null): boolean {
  const pageRoot =
    root ?? document.querySelector<HTMLElement>("[data-team-breaks-overtime-page]");
  return readPaidBreakMinutes(pageRoot) > 0;
}

function ensureSystemCustomBreaks(breaks: CustomBreak[]): CustomBreak[] {
  const byId = new Map(breaks.map((b) => [b.id, b]));
  const result: CustomBreak[] = [];

  for (const sys of SYSTEM_CUSTOM_BREAKS) {
    const existing = byId.get(sys.id);
    if (existing) {
      result.push({ ...existing, id: sys.id, name: sys.name });
      byId.delete(sys.id);
    } else {
      const fromDefault = DEFAULT_CONFIG.customBreaks.find((b) => b.id === sys.id);
      result.push(fromDefault ? { ...fromDefault } : { ...sys, durationMinutes: 15, compensation: "unpaid", mandatory: false });
    }
  }

  for (const b of byId.values()) {
    if (SYSTEM_CUSTOM_BREAK_IDS.has(b.id)) continue;
    result.push(b);
  }
  return result;
}

let draftConfig: BreaksOvertimeConfig | null = null;
let activeBreaksNavKey = "custom-breaks";
let overtimeRuleEditor: OvertimeRuleEditor | null = null;
let customBreakEditor: CustomBreakEditor | null = null;
/** 删除休息确认弹窗中的休息 id；null 表示关闭 */
let customBreakDeleteConfirmId: string | null = null;
/** 删除加班规则确认弹窗中的规则 id；null 表示关闭 */
let overtimeRuleDeleteConfirmId: string | null = null;

function markBreaksOvertimeDirty(): void {
  window.dispatchEvent(
    new CustomEvent("menusifu:page-settings-dirty", {
      detail: { pageKey: TEAM_BREAKS_OVERTIME_PATH },
    }),
  );
}

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

function newOvertimeRuleId(): string {
  return `ot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isOvertimeScope(value: unknown): value is OvertimeScope {
  return typeof value === "string" && (OVERTIME_SCOPES as string[]).includes(value);
}

/** 兼容旧值 seventh-day → nth-day */
function resolveOvertimeScope(value: unknown): OvertimeScope | null {
  if (isOvertimeScope(value)) return value;
  if (value === "seventh-day") return "nth-day";
  return null;
}

function normalizeDayNumber(value: unknown, scope: OvertimeScope): number | undefined {
  if (scope !== "nth-day") return undefined;
  const n = Math.round(Number(value));
  if (Number.isFinite(n) && n >= 1) return Math.min(n, 365);
  return DEFAULT_NTH_DAY;
}

function normalizeSecondaryHours(value: unknown, scope: OvertimeScope): number | undefined {
  if (scope !== "nth-day") return undefined;
  return Math.max(0.5, Number(value) || DEFAULT_NTH_DAY_TIER2.hours);
}

function normalizeSecondaryMultiplier(value: unknown, scope: OvertimeScope): number | undefined {
  if (scope !== "nth-day") return undefined;
  return Math.max(1, Number(value) || DEFAULT_NTH_DAY_TIER2.multiplier);
}

function formatOvertimeScopeLabel(rule: OvertimeRule): string {
  if (rule.scope === "nth-day") {
    const day = rule.dayNumber ?? DEFAULT_NTH_DAY;
    return `第 ${day} 天`;
  }
  return OVERTIME_SCOPE_META[rule.scope].title;
}

function formatOvertimeHoursLabel(rule: OvertimeRule): string {
  if (rule.scope === "nth-day") {
    const h2 = rule.secondaryHoursBeforeOvertime ?? DEFAULT_NTH_DAY_TIER2.hours;
    return `${rule.hoursBeforeOvertime} / ${h2}`;
  }
  return String(rule.hoursBeforeOvertime);
}

function formatOvertimeMultiplierLabel(rule: OvertimeRule): string {
  if (rule.scope === "nth-day") {
    const m2 = rule.secondaryWageMultiplier ?? DEFAULT_NTH_DAY_TIER2.multiplier;
    return `${rule.wageMultiplier}× / ${m2}×`;
  }
  return `${rule.wageMultiplier}×`;
}

/** 每种计算口径最多一条：排除已被其他规则占用的口径（编辑时保留当前规则自身口径） */
function getAvailableOvertimeScopes(
  rules: OvertimeRule[],
  excludeRuleId?: string,
): OvertimeScope[] {
  const taken = new Set(
    rules.filter((r) => r.id !== excludeRuleId).map((r) => r.scope),
  );
  return OVERTIME_SCOPES.filter((s) => !taken.has(s));
}

function buildOvertimeRuleFromRaw(
  item: Partial<OvertimeRule> & { type?: unknown; enabled?: unknown },
  forceEnabledCheck = false,
): OvertimeRule | null {
  if (forceEnabledCheck && !item.enabled) return null;
  const scope = resolveOvertimeScope(item.scope) ?? resolveOvertimeScope(item.type);
  if (!scope) return null;
  const meta = OVERTIME_SCOPE_META[scope];
  const name =
    typeof item.name === "string" && item.name.trim() ? item.name.trim() : meta.title;
  const rule: OvertimeRule = {
    id: typeof item.id === "string" && item.id ? item.id : newOvertimeRuleId(),
    name,
    scope,
    hoursBeforeOvertime: Math.max(0.5, Number(item.hoursBeforeOvertime) || meta.defaultHours),
    wageMultiplier: Math.max(1, Number(item.wageMultiplier) || meta.defaultMultiplier),
  };
  const dayNumber = normalizeDayNumber(item.dayNumber, scope);
  if (dayNumber !== undefined) rule.dayNumber = dayNumber;
  const secondaryHours = normalizeSecondaryHours(item.secondaryHoursBeforeOvertime, scope);
  if (secondaryHours !== undefined) rule.secondaryHoursBeforeOvertime = secondaryHours;
  const secondaryMultiplier = normalizeSecondaryMultiplier(item.secondaryWageMultiplier, scope);
  if (secondaryMultiplier !== undefined) rule.secondaryWageMultiplier = secondaryMultiplier;
  return rule;
}

/** 旧版固定四类卡片 → 仅迁移当时 enabled 的项；全新格式保留列表（可为空） */
function normalizeOvertimeRules(raw: unknown): OvertimeRule[] {
  if (!Array.isArray(raw)) return [];

  const legacy =
    raw.length > 0 &&
    raw.every(
      (r) =>
        r != null &&
        typeof r === "object" &&
        "type" in r &&
        "enabled" in r &&
        !("name" in r && typeof (r as { name?: unknown }).name === "string"),
    );

  if (legacy) {
    return raw
      .map((r) => buildOvertimeRuleFromRaw(r as Partial<OvertimeRule> & { type?: unknown; enabled?: unknown }, true))
      .filter((r): r is OvertimeRule => r != null);
  }

  return raw
    .map((r) =>
      r && typeof r === "object"
        ? buildOvertimeRuleFromRaw(r as Partial<OvertimeRule> & { type?: unknown })
        : null,
    )
    .filter((r): r is OvertimeRule => r != null);
}

function normalizeConfig(raw: Partial<BreaksOvertimeConfig> | null): BreaksOvertimeConfig {
  const presets = (arr: unknown, fallback: number[]) =>
    Array.isArray(arr) ? arr.map((n) => Math.max(1, Math.round(Number(n)) || 1)).filter((n) => n > 0) : fallback;

  const customBreaksRaw: CustomBreak[] = Array.isArray(raw?.customBreaks)
    ? raw!.customBreaks!
        .map((b): CustomBreak => {
          const id = typeof b.id === "string" && b.id ? b.id : newBreakId();
          const lockedName = SYSTEM_CUSTOM_BREAK_NAME_BY_ID[id];
          return {
            id,
            name: lockedName
              ? lockedName
              : typeof b.name === "string" && b.name.trim()
                ? b.name.trim()
                : "未命名休息",
            durationMinutes: Math.max(1, Math.round(Number(b.durationMinutes)) || 10),
            compensation: b.compensation === "paid" ? "paid" : "unpaid",
            mandatory: !!b.mandatory,
          };
        })
        .filter((b) => b.name)
    : DEFAULT_CONFIG.customBreaks.map((b) => ({ ...b }));

  return {
    unpaidPresets: presets(raw?.unpaidPresets, DEFAULT_CONFIG.unpaidPresets),
    paidPresets: presets(raw?.paidPresets, DEFAULT_CONFIG.paidPresets),
    customBreaks: ensureSystemCustomBreaks(
      customBreaksRaw.length > 0 ? customBreaksRaw : DEFAULT_CONFIG.customBreaks.map((b) => ({ ...b })),
    ),
    blockEarlyEnd: raw?.blockEarlyEnd !== undefined ? !!raw.blockEarlyEnd : DEFAULT_CONFIG.blockEarlyEnd,
    convertExcessPaidToUnpaid:
      isPaidBreakDurationConfigured() &&
      (raw?.convertExcessPaidToUnpaid !== undefined
        ? !!raw.convertExcessPaidToUnpaid
        : DEFAULT_CONFIG.convertExcessPaidToUnpaid),
    workWeekStartDay:
      typeof raw?.workWeekStartDay === "number" && raw.workWeekStartDay >= 0 && raw.workWeekStartDay <= 6
        ? raw.workWeekStartDay
        : DEFAULT_CONFIG.workWeekStartDay,
    overtimeRules: normalizeOvertimeRules(raw?.overtimeRules),
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
  const before = readConfig();
  const beforeStr = JSON.stringify(before);
  const afterStr = JSON.stringify(config);
  if (beforeStr === afterStr) return;
  localStorage.setItem(STORAGE_KEY, afterStr);

  const groupPath = resolveChangeGroupPath(TEAM_BREAKS_OVERTIME_PATH);
  const opts = { settingsPath: TEAM_BREAKS_OVERTIME_PATH, groupPath };

  const breaksChange = diffCollection(before.customBreaks, config.customBreaks, CUSTOM_BREAK_ADAPTER, opts);
  if (breaksChange) recordPageOrImmediateConfigChange(TEAM_BREAKS_OVERTIME_PATH, breaksChange);

  const overtimeChange = diffCollection(
    before.overtimeRules,
    config.overtimeRules,
    OVERTIME_RULE_ADAPTER,
    opts,
  );
  if (overtimeChange) recordPageOrImmediateConfigChange(TEAM_BREAKS_OVERTIME_PATH, overtimeChange);

  const scalarBefore = {
    unpaidPresets: before.unpaidPresets,
    paidPresets: before.paidPresets,
    blockEarlyEnd: before.blockEarlyEnd,
    convertExcessPaidToUnpaid: before.convertExcessPaidToUnpaid,
    workWeekStartDay: before.workWeekStartDay,
  };
  const scalarAfter = {
    unpaidPresets: config.unpaidPresets,
    paidPresets: config.paidPresets,
    blockEarlyEnd: config.blockEarlyEnd,
    convertExcessPaidToUnpaid: config.convertExcessPaidToUnpaid,
    workWeekStartDay: config.workWeekStartDay,
  };
  if (JSON.stringify(scalarBefore) !== JSON.stringify(scalarAfter)) {
    const details = buildChangeDetailRows(scalarBefore, scalarAfter, {
      rootKey: "team.breaks-overtime-rules",
      rootLabel: "休息与加班规则",
    }).map((row) => {
      if (row.key.endsWith("workWeekStartDay") || row.label.includes("workWeekStartDay")) {
        const dayLabel = (v: string) => {
          const n = Number(v);
          return WEEKDAY_OPTIONS.find((d) => d.value === n)?.label ?? v;
        };
        return {
          ...row,
          label: "工周起始日",
          before: dayLabel(row.before),
          after: dayLabel(row.after),
        };
      }
      if (row.key.includes("blockEarlyEnd")) return { ...row, label: "阻止提前结束休息" };
      if (row.key.includes("convertExcessPaidToUnpaid")) {
        return { ...row, label: "超时带薪转无薪" };
      }
      if (row.key.includes("unpaidPresets")) return { ...row, label: "无薪休息预设" };
      if (row.key.includes("paidPresets")) return { ...row, label: "带薪休息预设" };
      return row;
    });
    if (details.length > 0) {
      const summary = summarizeChangeDetails(details);
      const change = {
        fieldKey: "team.breaks-overtime-rules",
        label: "休息与加班规则",
        before: summary.before,
        after: summary.after,
        settingsPath: TEAM_BREAKS_OVERTIME_PATH,
        groupPath,
        details,
        changeKind: "setting" as const,
      };
      if (changeHasDiff(change)) {
        recordPageOrImmediateConfigChange(TEAM_BREAKS_OVERTIME_PATH, change);
      }
    }
  }
}

const CUSTOM_BREAK_ADAPTER: CollectionAdapter<CustomBreak> = {
  collectionKey: "team.custom-breaks",
  collectionLabel: "自定义休息",
  idOf: (item) => item.id,
  labelOf: (item) => item.name || item.id,
  fields: [
    { key: "name", label: "名称", get: (i) => i.name },
    { key: "durationMinutes", label: "时长（分钟）", get: (i) => i.durationMinutes },
    {
      key: "compensation",
      label: "补偿",
      get: (i) => i.compensation,
      format: (v) => (v === "paid" ? "带薪" : "无薪"),
    },
    {
      key: "mandatory",
      label: "强制休息",
      get: (i) => i.mandatory,
      format: (v) => (v ? "是" : "否"),
    },
  ],
};

const OVERTIME_RULE_ADAPTER: CollectionAdapter<OvertimeRule> = {
  collectionKey: "team.overtime-rules",
  collectionLabel: "加班规则",
  idOf: (item) => item.id,
  labelOf: (item) => item.name || item.id,
  fields: [
    { key: "name", label: "名称", get: (i) => i.name },
    {
      key: "scope",
      label: "计算口径",
      get: (i) => i.scope,
      format: (v) => OVERTIME_SCOPE_META[v as OvertimeScope]?.title ?? String(v),
    },
    { key: "hoursBeforeOvertime", label: "加班前工时阈值", get: (i) => i.hoursBeforeOvertime },
    { key: "wageMultiplier", label: "工资倍率", get: (i) => i.wageMultiplier },
    { key: "dayNumber", label: "第 N 天", get: (i) => i.dayNumber ?? "—" },
    {
      key: "secondaryHoursBeforeOvertime",
      label: "第二档工时阈值",
      get: (i) => i.secondaryHoursBeforeOvertime ?? "—",
    },
    {
      key: "secondaryWageMultiplier",
      label: "第二档工资倍率",
      get: (i) => i.secondaryWageMultiplier ?? "—",
    },
  ],
};

function getDraft(): BreaksOvertimeConfig {
  if (!draftConfig) draftConfig = readConfig();
  return draftConfig;
}

function resetDraft(): void {
  draftConfig = null;
  overtimeRuleEditor = null;
  customBreakEditor = null;
  customBreakDeleteConfirmId = null;
  overtimeRuleDeleteConfirmId = null;
}

const FORM_INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FORM_SELECT = FORM_INPUT;
const SECTION_CARD =
  "scroll-mt-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5";
const SECTION_TITLE = "text-sm font-semibold text-foreground";
const SECTION_DESC = "mt-1 text-xs text-muted-foreground";

function renderCustomBreakDialog(config: BreaksOvertimeConfig): string {
  if (!customBreakEditor) return "";
  const editor = customBreakEditor;
  const editing =
    editor.mode === "edit" ? config.customBreaks.find((b) => b.id === editor.id) : undefined;
  const title = editor.mode === "edit" ? "编辑休息" : "添加休息";
  const systemLocked = editor.mode === "edit" && editing ? isSystemCustomBreak(editing.id) : false;
  const name = systemLocked
    ? (SYSTEM_CUSTOM_BREAK_NAME_BY_ID[editing!.id] ?? editing!.name)
    : (editing?.name ?? "");
  const durationMinutes = editing?.durationMinutes ?? 15;
  const compensation: BreakCompensation = editing?.compensation ?? "unpaid";
  const mandatory = editing?.mandatory ?? false;
  const unpaidSel = compensation === "unpaid" ? " selected" : "";
  const paidSel = compensation === "paid" ? " selected" : "";
  const nameReadonly = systemLocked
    ? ` readonly class="${FORM_INPUT} cursor-not-allowed bg-muted/50 text-muted-foreground"`
    : ` class="${FORM_INPUT}" placeholder="如：用餐休息" maxlength="40"`;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-custom-break-dialog role="dialog" aria-modal="true" aria-labelledby="custom-break-dialog-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-custom-break-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 id="custom-break-dialog-title" class="text-base font-semibold">${escapeHtml(title)}</h2>
        <div class="mt-4 space-y-3">
          <label class="block text-sm">
            <span class="mb-1 block text-xs text-muted-foreground">休息名称${systemLocked ? "（系统默认，不可修改）" : ""}</span>
            <input type="text" value="${escapeHtml(name)}" data-custom-break-dialog-name${nameReadonly} />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-xs text-muted-foreground">时长（分钟）</span>
            <input type="number" min="1" step="1" value="${durationMinutes}" data-custom-break-dialog-duration class="${FORM_INPUT} tabular-nums" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-xs text-muted-foreground">补偿</span>
            <select data-custom-break-dialog-compensation class="${FORM_SELECT}">
              <option value="unpaid"${unpaidSel}>无薪</option>
              <option value="paid"${paidSel}>带薪</option>
            </select>
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" data-custom-break-dialog-mandatory class="size-4 accent-primary"${mandatory ? " checked" : ""} />
            <span>强制休息</span>
            <span class="text-xs text-muted-foreground">（未休息时触发合规提醒）</span>
          </label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-custom-break-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-custom-break-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

function renderCustomBreakDeleteConfirmDialog(config: BreaksOvertimeConfig): string {
  if (!customBreakDeleteConfirmId) return "";
  const target = config.customBreaks.find((b) => b.id === customBreakDeleteConfirmId);
  const name = target?.name || "未命名休息";
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" data-custom-break-delete-dialog role="dialog" aria-modal="true" aria-labelledby="custom-break-delete-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-custom-break-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="custom-break-delete-title" class="text-base font-semibold text-foreground">确认删除</h2>
        </div>
        <div class="px-5 py-4 text-sm text-muted-foreground">
          确定删除休息「<span class="font-medium text-foreground">${escapeHtml(name)}</span>」？删除后不可恢复。
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" data-custom-break-delete-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-custom-break-delete-ok class="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">删除</button>
        </div>
      </div>
    </div>`;
}

function renderCustomBreakRow(b: CustomBreak): string {
  const system = isSystemCustomBreak(b.id);
  const name = system ? (SYSTEM_CUSTOM_BREAK_NAME_BY_ID[b.id] ?? b.name) : b.name;
  const compensationLabel = b.compensation === "paid" ? "带薪" : "无薪";
  const mandatoryLabel = b.mandatory ? "是" : "否";
  const deleteBtn = system
    ? ""
    : `<button type="button" data-custom-break-remove="${escapeHtml(b.id)}" class="text-xs text-destructive hover:underline">删除</button>`;
  return `
    <tr class="border-b border-border/60" data-custom-break-row="${escapeHtml(b.id)}">
      <td class="px-2 py-2 font-medium text-foreground">
        ${escapeHtml(name)}
        ${system ? '<span class="ml-1 text-[10px] text-muted-foreground">系统</span>' : ""}
      </td>
      <td class="px-2 py-2 tabular-nums text-muted-foreground">${b.durationMinutes} 分</td>
      <td class="px-2 py-2 text-muted-foreground">${compensationLabel}</td>
      <td class="px-2 py-2 text-center text-muted-foreground">${mandatoryLabel}</td>
      <td class="px-2 py-2 text-right">
        <button type="button" data-custom-break-edit="${escapeHtml(b.id)}" class="${system ? "" : "mr-2 "}text-xs text-primary hover:underline">编辑</button>
        ${deleteBtn}
      </td>
    </tr>`;
}

function renderOvertimeRuleDeleteConfirmDialog(config: BreaksOvertimeConfig): string {
  if (!overtimeRuleDeleteConfirmId) return "";
  const target = config.overtimeRules.find((r) => r.id === overtimeRuleDeleteConfirmId);
  const name = target?.name || "未命名规则";
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" data-overtime-rule-delete-dialog role="dialog" aria-modal="true" aria-labelledby="overtime-rule-delete-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-overtime-rule-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="overtime-rule-delete-title" class="text-base font-semibold text-foreground">确认删除</h2>
        </div>
        <div class="px-5 py-4 text-sm text-muted-foreground">
          确定删除加班规则「<span class="font-medium text-foreground">${escapeHtml(name)}</span>」？删除后不可恢复。
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" data-overtime-rule-delete-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-overtime-rule-delete-ok class="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">删除</button>
        </div>
      </div>
    </div>`;
}

function renderOvertimeRuleRow(rule: OvertimeRule): string {
  const scopeLabel = formatOvertimeScopeLabel(rule);
  return `
    <tr class="border-b border-border/60" data-overtime-rule-row="${escapeHtml(rule.id)}">
      <td class="px-2 py-2 font-medium text-foreground">${escapeHtml(rule.name)}</td>
      <td class="px-2 py-2 text-muted-foreground">${escapeHtml(scopeLabel)}</td>
      <td class="px-2 py-2 tabular-nums">${escapeHtml(formatOvertimeHoursLabel(rule))}</td>
      <td class="px-2 py-2 tabular-nums">${escapeHtml(formatOvertimeMultiplierLabel(rule))}</td>
      <td class="px-2 py-2 text-right">
        <button type="button" data-overtime-rule-edit="${escapeHtml(rule.id)}" class="mr-2 text-xs text-primary hover:underline">编辑</button>
        <button type="button" data-overtime-rule-remove="${escapeHtml(rule.id)}" class="text-xs text-destructive hover:underline">删除</button>
      </td>
    </tr>`;
}

function renderOvertimeRuleDialog(config: BreaksOvertimeConfig): string {
  if (!overtimeRuleEditor) return "";
  const editor = overtimeRuleEditor;
  const editing =
    editor.mode === "edit" ? config.overtimeRules.find((r) => r.id === editor.id) : undefined;
  const availableScopes = getAvailableOvertimeScopes(
    config.overtimeRules,
    editor.mode === "edit" ? editor.id : undefined,
  );
  if (availableScopes.length === 0) return "";

  const title = editor.mode === "edit" ? "编辑加班规则" : "新增加班规则";
  const scope: OvertimeScope =
    editing && availableScopes.includes(editing.scope)
      ? editing.scope
      : availableScopes[0]!;
  const name = editing?.name ?? "";
  const isNthDay = scope === "nth-day";
  const hours =
    editing?.hoursBeforeOvertime ??
    (isNthDay ? DEFAULT_NTH_DAY_TIER1.hours : OVERTIME_SCOPE_META[scope].defaultHours);
  const multiplier =
    editing?.wageMultiplier ??
    (isNthDay ? DEFAULT_NTH_DAY_TIER1.multiplier : OVERTIME_SCOPE_META[scope].defaultMultiplier);
  const hours2 = editing?.secondaryHoursBeforeOvertime ?? DEFAULT_NTH_DAY_TIER2.hours;
  const multiplier2 = editing?.secondaryWageMultiplier ?? DEFAULT_NTH_DAY_TIER2.multiplier;
  const dayNumber = editing?.dayNumber ?? DEFAULT_NTH_DAY;
  const scopeOpts = availableScopes
    .map((s) => {
      const selected = s === scope ? " selected" : "";
      return `<option value="${s}"${selected}>${escapeHtml(OVERTIME_SCOPE_META[s].title)}</option>`;
    })
    .join("");
  const scopeDesc = OVERTIME_SCOPE_META[scope].desc;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-overtime-rule-dialog role="dialog" aria-modal="true" aria-labelledby="overtime-rule-dialog-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-overtime-rule-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 id="overtime-rule-dialog-title" class="text-base font-semibold">${escapeHtml(title)}</h2>
        <div class="mt-4 space-y-3">
          <label class="block text-sm">
            <span class="mb-1 block text-xs text-muted-foreground">名称</span>
            <input type="text" value="${escapeHtml(name)}" data-overtime-dialog-name class="${FORM_INPUT}" placeholder="如：平日加班" maxlength="40" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-xs text-muted-foreground">计算口径</span>
            <select data-overtime-dialog-scope class="${FORM_SELECT}">${scopeOpts}</select>
            <p class="mt-1 text-xs text-muted-foreground" data-overtime-dialog-scope-desc>${escapeHtml(scopeDesc)}</p>
          </label>
          <label class="block text-sm${isNthDay ? "" : " hidden"}" data-overtime-dialog-day-wrap>
            <span class="mb-1 block text-xs text-muted-foreground">天数 N</span>
            <div class="relative max-w-[10rem]">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">第</span>
              <input type="number" min="1" max="365" step="1" value="${dayNumber}" data-overtime-dialog-day class="${FORM_INPUT} px-8 tabular-nums" />
              <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">天</span>
            </div>
          </label>
          <div class="space-y-3" data-overtime-dialog-tiers>
            <div class="rounded-lg border border-border/70 p-3" data-overtime-dialog-tier="1">
              <p class="mb-2 text-xs font-medium text-muted-foreground" data-overtime-dialog-tier1-label>${isNthDay ? "档位 1" : "加班阈值"}</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block text-sm">
                  <span class="mb-1 block text-xs text-muted-foreground">工时超过（小时）</span>
                  <input type="number" min="0.5" step="0.5" value="${hours}" data-overtime-dialog-hours class="${FORM_INPUT} tabular-nums" />
                </label>
                <label class="block text-sm">
                  <span class="mb-1 block text-xs text-muted-foreground">工资倍率</span>
                  <div class="relative">
                    <input type="number" min="1" step="0.1" value="${multiplier}" data-overtime-dialog-multiplier class="${FORM_INPUT} pr-8 tabular-nums" />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                  </div>
                </label>
              </div>
            </div>
            <div class="rounded-lg border border-border/70 p-3${isNthDay ? "" : " hidden"}" data-overtime-dialog-tier="2">
              <p class="mb-2 text-xs font-medium text-muted-foreground">档位 2</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block text-sm">
                  <span class="mb-1 block text-xs text-muted-foreground">工时超过（小时）</span>
                  <input type="number" min="0.5" step="0.5" value="${hours2}" data-overtime-dialog-hours-2 class="${FORM_INPUT} tabular-nums" />
                </label>
                <label class="block text-sm">
                  <span class="mb-1 block text-xs text-muted-foreground">工资倍率</span>
                  <div class="relative">
                    <input type="number" min="1" step="0.1" value="${multiplier2}" data-overtime-dialog-multiplier-2 class="${FORM_INPUT} pr-8 tabular-nums" />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-overtime-rule-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-overtime-rule-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

function renderSectionShell(sectionKey: string, title: string, desc: string, bodyHtml: string): string {
  const descHtml = desc
    ? `<p class="${SECTION_DESC}">${escapeHtml(desc)}</p>`
    : "";
  return `
    <section
      id="breaks-section-${escapeHtml(sectionKey)}"
      class="${SECTION_CARD}"
      data-breaks-section="${escapeHtml(sectionKey)}"
      aria-labelledby="breaks-section-heading-${escapeHtml(sectionKey)}"
    >
      <h2 id="breaks-section-heading-${escapeHtml(sectionKey)}" class="${SECTION_TITLE}">${escapeHtml(title)}</h2>
      ${descHtml}
      ${bodyHtml}
    </section>`;
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
  return renderSectionShell("custom-breaks", "自定义休息", "", body);
}

function renderBreakRulesSection(config: BreaksOvertimeConfig, paidBreakRowsHtml = ""): string {
  const canConvertExcess = isPaidBreakDurationConfigured();
  const convertChecked = canConvertExcess && config.convertExcessPaidToUnpaid;
  const paidBreakBlock = paidBreakRowsHtml.trim()
    ? `<ul class="mt-3 m-0 list-none divide-y divide-border overflow-hidden rounded-lg border border-border/70 p-0" role="list">${paidBreakRowsHtml}</ul>`
    : "";
  const body = `
      ${paidBreakBlock}
      <div class="mt-3 space-y-2">
        <label class="flex cursor-pointer items-start gap-2 text-sm${canConvertExcess ? "" : " hidden"}" data-break-convert-excess-label>
          <input type="checkbox" data-break-convert-excess class="mt-0.5 size-4 accent-primary"${convertChecked ? " checked" : ""} />
          <span>带薪休息超时部分转为无薪</span>
        </label>
        <label class="flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" data-break-block-early class="mt-0.5 size-4 accent-primary"${config.blockEarlyEnd ? " checked" : ""} />
          <span>禁止提前结束休息</span>
        </label>
      </div>`;
  return renderSectionShell("break-rules", "休息规则", "", body);
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
  return renderSectionShell("work-week", "工作周设置", "", body);
}

function renderOvertimeRulesSection(config: BreaksOvertimeConfig): string {
  const rows = config.overtimeRules.map(renderOvertimeRuleRow).join("");
  const canAdd = getAvailableOvertimeScopes(config.overtimeRules).length > 0;
  const listBody =
    config.overtimeRules.length === 0
      ? `<p class="mt-4 text-sm text-muted-foreground">暂无加班规则，点击下方按钮新增。</p>`
      : `<div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr class="border-b border-border text-xs text-muted-foreground">
              <th class="px-2 py-2 font-medium">名称</th>
              <th class="px-2 py-2 font-medium">计算口径</th>
              <th class="px-2 py-2 font-medium">工时超过（小时）</th>
              <th class="px-2 py-2 font-medium">工资倍率</th>
              <th class="px-2 py-2 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  const addBtn = canAdd
    ? `<button type="button" data-overtime-rule-add class="rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-muted/50">+ 新增加班规则</button>`
    : `<button type="button" disabled class="cursor-not-allowed rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground opacity-60" title="四种计算口径均已配置">+ 新增加班规则</button>`;
  const body = `
      ${listBody}
      <div class="mt-3 flex flex-wrap items-center justify-end gap-2">
        ${addBtn}
      </div>`;
  return renderSectionShell("overtime-rules", "加班规则", "", body);
}

function renderBreaksOvertimeSubnav(activeKey: string): string {
  const groups = BREAKS_OVERTIME_NAV_GROUPS;
  const parts: string[] = [];

  groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      parts.push(`<li aria-hidden="true" class="my-2 list-none border-t border-border" role="presentation"></li>`);
    }
    parts.push(`
      <li class="list-none ${groupIndex > 0 ? "pt-2" : "pt-0.5"} pb-0.5" role="presentation">
        <p class="${MODULE_SETTINGS_SUBNAV_SECTION_HEADING_CLASS}">${escapeHtml(group.label)}</p>
      </li>`);
    for (const item of group.items) {
      const selected = activeKey === item.key;
      parts.push(`
      <li>
        <a href="#${TEAM_BREAKS_OVERTIME_PATH}/${item.key}"
          data-breaks-nav="${escapeHtml(item.key)}"
          data-breaks-subnav-nested="1"
          class="${SUBNAV_LINK_BASE} ${SUBNAV_LINK_NESTED} ${selected ? SUBNAV_LINK_SELECTED : SUBNAV_LINK_IDLE}"
          ${selected ? 'aria-current="true"' : ""}
        >
          <span class="min-w-0 flex-1 truncate">${escapeHtml(item.title)}</span>
        </a>
      </li>`);
    }
  });

  return `
    <nav class="breaks-overtime-subnav module-settings-subnav w-56 shrink-0 border-r border-border pr-4 ${SUBNAV_SCROLL_CLASSES}" aria-label="休息与加班">
      <ul class="space-y-0.5" role="list">${parts.join("")}</ul>
    </nav>`;
}

function renderBreaksOvertimeMainContent(config: BreaksOvertimeConfig, paidBreakRowsHtml = ""): string {
  return `
    <div class="breaks-overtime-scroll-host module-settings-scroll-host min-w-0 min-h-0 flex-1 space-y-4 overflow-y-auto">
      ${renderCustomBreaksSection(config)}
      ${renderBreakRulesSection(config, paidBreakRowsHtml)}
      ${renderWorkWeekSection(config)}
      ${renderOvertimeRulesSection(config)}
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

export function renderTeamBreaksOvertimePage(path?: string, paidBreakRowsHtml = ""): string {
  const config = getDraft();
  const sectionFromPath = path ? getTeamBreaksOvertimeActiveSectionKey(path) : undefined;
  if (sectionFromPath) activeBreaksNavKey = sectionFromPath;

  const validKeys = BREAKS_OVERTIME_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));
  if (!validKeys.includes(activeBreaksNavKey)) {
    activeBreaksNavKey = validKeys[0] ?? "custom-breaks";
  }

  return `
    <div class="team-breaks-overtime-page flex min-h-0 flex-1 flex-col overflow-hidden" data-team-breaks-overtime-page data-breaks-view="full">
      <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden sm:flex-row sm:items-stretch">
        ${renderBreaksOvertimeSubnav(activeBreaksNavKey)}
        ${renderBreaksOvertimeMainContent(config, paidBreakRowsHtml)}
      </div>
      ${renderCustomBreakDialog(config)}
      ${renderCustomBreakDeleteConfirmDialog(config)}
      ${renderOvertimeRuleDialog(config)}
      ${renderOvertimeRuleDeleteConfirmDialog(config)}
    </div>`;
}

function collectCustomBreaksFromDom(_root: HTMLElement): CustomBreak[] {
  /** 列表只读展示，数据以草稿为准（弹窗保存时写入 draft） */
  return ensureSystemCustomBreaks(getDraft().customBreaks.map((b) => ({ ...b })));
}

function collectConfigFromDom(root: HTMLElement): BreaksOvertimeConfig {
  const view = root.getAttribute("data-breaks-view") ?? "full";
  const current = getDraft();
  return normalizeConfig({
    unpaidPresets: current.unpaidPresets,
    paidPresets: current.paidPresets,
    customBreaks: view === "full" ? collectCustomBreaksFromDom(root) : current.customBreaks,
    blockEarlyEnd:
      view === "full"
        ? (root.querySelector<HTMLInputElement>("[data-break-block-early]")?.checked ?? current.blockEarlyEnd)
        : current.blockEarlyEnd,
    convertExcessPaidToUnpaid:
      view === "full"
        ? isPaidBreakDurationConfigured(root) &&
          (root.querySelector<HTMLInputElement>("[data-break-convert-excess]")?.checked ??
            current.convertExcessPaidToUnpaid)
        : isPaidBreakDurationConfigured() && current.convertExcessPaidToUnpaid,
    workWeekStartDay: Number(root.querySelector<HTMLSelectElement>("[data-overtime-week-start]")?.value) || 1,
    /** 加班规则仅通过弹窗维护，列表只读展示 */
    overtimeRules: current.overtimeRules,
  });
}

function syncBreaksOvertimeSubnavActive(root: HTMLElement, key: string): void {
  activeBreaksNavKey = key;
  root.querySelectorAll<HTMLAnchorElement>("[data-breaks-nav]").forEach((link) => {
    const linkKey = link.getAttribute("data-breaks-nav");
    const selected = linkKey === key;
    link.className = `${SUBNAV_LINK_BASE} ${SUBNAV_LINK_NESTED} ${selected ? SUBNAV_LINK_SELECTED : SUBNAV_LINK_IDLE}`;
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
  ensureBreaksOvertimePageSaveRegistry();

  const root = document.querySelector<HTMLElement>("[data-team-breaks-overtime-page]");
  if (!root || root.dataset.breaksOvertimeBound === "1") return;
  root.dataset.breaksOvertimeBound = "1";

  bindBreaksOvertimeSubnav(root);
  bindPaidBreakMinutesConvertExcessLink(root);

  const path = location.hash.slice(1) || "/dashboard/overview";
  const sectionKey = getTeamBreaksOvertimeActiveSectionKey(path);
  if (sectionKey) {
    requestAnimationFrame(() => scrollToBreaksOvertimeSection(root, sectionKey));
  }

  root.querySelector("[data-custom-break-add]")?.addEventListener("click", () => {
    draftConfig = collectConfigFromDom(root);
    customBreakEditor = { mode: "create" };
    remount();
  });

  root.querySelectorAll("[data-custom-break-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-custom-break-edit");
      if (!id) return;
      draftConfig = collectConfigFromDom(root);
      customBreakEditor = { mode: "edit", id };
      remount();
    });
  });

  root.querySelectorAll("[data-custom-break-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-custom-break-remove");
      if (!id || isSystemCustomBreak(id)) return;
      draftConfig = collectConfigFromDom(root);
      customBreakDeleteConfirmId = id;
      remount();
    });
  });

  bindCustomBreakDialog(root, remount);
  bindCustomBreakDeleteDialog(root, remount);
  bindOvertimeRulesUi(root, remount);

  root.addEventListener("input", () => {
    markBreaksOvertimeDirty();
  });
  root.addEventListener("change", () => {
    markBreaksOvertimeDirty();
  });
}

function syncConvertExcessAvailability(root: HTMLElement): void {
  const enabled = isPaidBreakDurationConfigured(root);
  const checkbox = root.querySelector<HTMLInputElement>("[data-break-convert-excess]");
  const label = root.querySelector<HTMLElement>("[data-break-convert-excess-label]");
  if (!checkbox || !label) return;

  label.classList.toggle("hidden", !enabled);
  if (!enabled) {
    checkbox.checked = false;
    if (draftConfig) draftConfig = { ...draftConfig, convertExcessPaidToUnpaid: false };
  }
}

function bindPaidBreakMinutesConvertExcessLink(root: HTMLElement): void {
  syncConvertExcessAvailability(root);
  const paidInput = root.querySelector<HTMLInputElement>(
    `[data-module-setting-number="${PAID_BREAK_MINUTES_FIELD_ID}"]`,
  );
  if (!paidInput || paidInput.dataset.convertExcessLinkBound === "1") return;
  paidInput.dataset.convertExcessLinkBound = "1";

  const sync = () => {
    syncConvertExcessAvailability(root);
    markBreaksOvertimeDirty();
  };
  paidInput.addEventListener("input", sync);
  paidInput.addEventListener("change", sync);
}

function closeCustomBreakDialog(remount: () => void): void {
  customBreakEditor = null;
  remount();
}

function closeCustomBreakDeleteDialog(remount: () => void): void {
  customBreakDeleteConfirmId = null;
  remount();
}

function bindCustomBreakDeleteDialog(root: HTMLElement, remount: () => void): void {
  const dialog = root.querySelector<HTMLElement>("[data-custom-break-delete-dialog]");
  if (!dialog || !customBreakDeleteConfirmId) return;

  const close = () => closeCustomBreakDeleteDialog(remount);
  dialog.querySelector("[data-custom-break-delete-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-custom-break-delete-cancel]")?.addEventListener("click", close);
  dialog.querySelector("[data-custom-break-delete-ok]")?.addEventListener("click", () => {
    const id = customBreakDeleteConfirmId;
    if (!id || isSystemCustomBreak(id)) {
      close();
      return;
    }
    const config = collectConfigFromDom(root);
    config.customBreaks = ensureSystemCustomBreaks(
      config.customBreaks.filter((b) => b.id !== id),
    );
    draftConfig = config;
    customBreakDeleteConfirmId = null;
    markBreaksOvertimeDirty();
    remount();
  });
}

function bindCustomBreakDialog(root: HTMLElement, remount: () => void): void {
  const dialog = root.querySelector<HTMLElement>("[data-custom-break-dialog]");
  if (!dialog) return;

  const close = () => closeCustomBreakDialog(remount);
  dialog.querySelector("[data-custom-break-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-custom-break-cancel]")?.addEventListener("click", close);

  const nameInput = dialog.querySelector<HTMLInputElement>("[data-custom-break-dialog-name]");
  const durationInput = dialog.querySelector<HTMLInputElement>("[data-custom-break-dialog-duration]");
  const compensationSelect = dialog.querySelector<HTMLSelectElement>("[data-custom-break-dialog-compensation]");
  const mandatoryInput = dialog.querySelector<HTMLInputElement>("[data-custom-break-dialog-mandatory]");

  dialog.querySelector("[data-custom-break-save]")?.addEventListener("click", () => {
    if (!customBreakEditor) return;
    const config = collectConfigFromDom(root);
    const editingId = customBreakEditor.mode === "edit" ? customBreakEditor.id : null;
    const systemLocked = editingId ? isSystemCustomBreak(editingId) : false;
    const lockedName = editingId ? SYSTEM_CUSTOM_BREAK_NAME_BY_ID[editingId] : undefined;
    const name = systemLocked
      ? (lockedName ?? nameInput?.value.trim() ?? "")
      : (nameInput?.value.trim() ?? "");
    if (!name) {
      nameInput?.focus();
      return;
    }
    const durationMinutes = Math.max(1, Math.round(Number(durationInput?.value) || 15));
    const compensation: BreakCompensation =
      compensationSelect?.value === "paid" ? "paid" : "unpaid";
    const mandatory = mandatoryInput?.checked ?? false;
    const next: CustomBreak = {
      id: editingId ?? newBreakId(),
      name,
      durationMinutes,
      compensation,
      mandatory,
    };

    if (customBreakEditor.mode === "edit") {
      config.customBreaks = ensureSystemCustomBreaks(
        config.customBreaks.map((b) => (b.id === next.id ? next : b)),
      );
    } else {
      config.customBreaks = ensureSystemCustomBreaks([...config.customBreaks, next]);
    }

    draftConfig = config;
    customBreakEditor = null;
    markBreaksOvertimeDirty();
    remount();
  });

  requestAnimationFrame(() => {
    if (nameInput && !nameInput.readOnly) nameInput.focus();
    else durationInput?.focus();
  });
}

function closeOvertimeRuleDialog(remount: () => void): void {
  overtimeRuleEditor = null;
  remount();
}

function closeOvertimeRuleDeleteDialog(remount: () => void): void {
  overtimeRuleDeleteConfirmId = null;
  remount();
}

function bindOvertimeRuleDeleteDialog(root: HTMLElement, remount: () => void): void {
  const dialog = root.querySelector<HTMLElement>("[data-overtime-rule-delete-dialog]");
  if (!dialog || !overtimeRuleDeleteConfirmId) return;

  const close = () => closeOvertimeRuleDeleteDialog(remount);
  dialog.querySelector("[data-overtime-rule-delete-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-overtime-rule-delete-cancel]")?.addEventListener("click", close);
  dialog.querySelector("[data-overtime-rule-delete-ok]")?.addEventListener("click", () => {
    const id = overtimeRuleDeleteConfirmId;
    if (!id) {
      close();
      return;
    }
    const config = collectConfigFromDom(root);
    config.overtimeRules = config.overtimeRules.filter((r) => r.id !== id);
    draftConfig = config;
    overtimeRuleDeleteConfirmId = null;
    markBreaksOvertimeDirty();
    remount();
  });
}

function bindOvertimeRulesUi(root: HTMLElement, remount: () => void): void {
  root.querySelector("[data-overtime-rule-add]")?.addEventListener("click", () => {
    draftConfig = collectConfigFromDom(root);
    if (getAvailableOvertimeScopes(draftConfig.overtimeRules).length === 0) return;
    overtimeRuleEditor = { mode: "create" };
    remount();
  });

  root.querySelectorAll("[data-overtime-rule-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-overtime-rule-edit");
      if (!id) return;
      draftConfig = collectConfigFromDom(root);
      overtimeRuleEditor = { mode: "edit", id };
      remount();
    });
  });

  root.querySelectorAll("[data-overtime-rule-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-overtime-rule-remove");
      if (!id) return;
      draftConfig = collectConfigFromDom(root);
      overtimeRuleDeleteConfirmId = id;
      remount();
    });
  });

  bindOvertimeRuleDeleteDialog(root, remount);

  const dialog = root.querySelector<HTMLElement>("[data-overtime-rule-dialog]");
  if (!dialog) return;

  const close = () => closeOvertimeRuleDialog(remount);
  dialog.querySelector("[data-overtime-rule-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-overtime-rule-cancel]")?.addEventListener("click", close);

  const scopeSelect = dialog.querySelector<HTMLSelectElement>("[data-overtime-dialog-scope]");
  const scopeDesc = dialog.querySelector<HTMLElement>("[data-overtime-dialog-scope-desc]");
  const dayWrap = dialog.querySelector<HTMLElement>("[data-overtime-dialog-day-wrap]");
  const dayInput = dialog.querySelector<HTMLInputElement>("[data-overtime-dialog-day]");
  const tier1Label = dialog.querySelector<HTMLElement>("[data-overtime-dialog-tier1-label]");
  const tier2 = dialog.querySelector<HTMLElement>('[data-overtime-dialog-tier="2"]');
  const hoursInput = dialog.querySelector<HTMLInputElement>("[data-overtime-dialog-hours]");
  const multiplierInput = dialog.querySelector<HTMLInputElement>("[data-overtime-dialog-multiplier]");
  const hours2Input = dialog.querySelector<HTMLInputElement>("[data-overtime-dialog-hours-2]");
  const multiplier2Input = dialog.querySelector<HTMLInputElement>("[data-overtime-dialog-multiplier-2]");
  const nameInput = dialog.querySelector<HTMLInputElement>("[data-overtime-dialog-name]");

  const syncNthDayFields = (scope: OvertimeScope): void => {
    const isNthDay = scope === "nth-day";
    dayWrap?.classList.toggle("hidden", !isNthDay);
    tier2?.classList.toggle("hidden", !isNthDay);
    if (tier1Label) tier1Label.textContent = isNthDay ? "档位 1" : "加班阈值";
    if (isNthDay && dayInput && (!dayInput.value || Number(dayInput.value) < 1)) {
      dayInput.value = String(DEFAULT_NTH_DAY);
    }
  };

  scopeSelect?.addEventListener("change", () => {
    const fallback = (scopeSelect.options[0]?.value as OvertimeScope | undefined) ?? "daily";
    const scope = isOvertimeScope(scopeSelect.value) ? scopeSelect.value : fallback;
    const meta = OVERTIME_SCOPE_META[scope];
    if (scopeDesc) scopeDesc.textContent = meta.desc;
    syncNthDayFields(scope);
    if (overtimeRuleEditor?.mode === "create") {
      if (scope === "nth-day") {
        if (hoursInput) hoursInput.value = String(DEFAULT_NTH_DAY_TIER1.hours);
        if (multiplierInput) multiplierInput.value = String(DEFAULT_NTH_DAY_TIER1.multiplier);
        if (hours2Input) hours2Input.value = String(DEFAULT_NTH_DAY_TIER2.hours);
        if (multiplier2Input) multiplier2Input.value = String(DEFAULT_NTH_DAY_TIER2.multiplier);
        if (dayInput) dayInput.value = String(DEFAULT_NTH_DAY);
      } else {
        if (hoursInput) hoursInput.value = String(meta.defaultHours);
        if (multiplierInput) multiplierInput.value = String(meta.defaultMultiplier);
      }
      if (nameInput && !nameInput.value.trim()) nameInput.value = meta.title;
    }
  });

  dialog.querySelector("[data-overtime-rule-save]")?.addEventListener("click", () => {
    if (!overtimeRuleEditor) return;
    const name = nameInput?.value.trim() ?? "";
    if (!name) {
      nameInput?.focus();
      return;
    }
    const config = collectConfigFromDom(root);
    const excludeId = overtimeRuleEditor.mode === "edit" ? overtimeRuleEditor.id : undefined;
    const available = getAvailableOvertimeScopes(config.overtimeRules, excludeId);
    if (available.length === 0) {
      close();
      return;
    }
    const fallback = available[0]!;
    const scope = isOvertimeScope(scopeSelect?.value) && available.includes(scopeSelect!.value)
      ? scopeSelect!.value
      : fallback;
    const meta = OVERTIME_SCOPE_META[scope];
    const hoursBeforeOvertime = Math.max(
      0.5,
      Number(hoursInput?.value) ||
        (scope === "nth-day" ? DEFAULT_NTH_DAY_TIER1.hours : meta.defaultHours),
    );
    const wageMultiplier = Math.max(
      1,
      Number(multiplierInput?.value) ||
        (scope === "nth-day" ? DEFAULT_NTH_DAY_TIER1.multiplier : meta.defaultMultiplier),
    );
    const dayNumber = normalizeDayNumber(dayInput?.value, scope);
    const secondaryHoursBeforeOvertime = normalizeSecondaryHours(hours2Input?.value, scope);
    const secondaryWageMultiplier = normalizeSecondaryMultiplier(multiplier2Input?.value, scope);
    const nextRule: OvertimeRule = {
      id: overtimeRuleEditor.mode === "edit" ? overtimeRuleEditor.id : newOvertimeRuleId(),
      name,
      scope,
      hoursBeforeOvertime,
      wageMultiplier,
    };
    if (dayNumber !== undefined) nextRule.dayNumber = dayNumber;
    if (secondaryHoursBeforeOvertime !== undefined) {
      nextRule.secondaryHoursBeforeOvertime = secondaryHoursBeforeOvertime;
    }
    if (secondaryWageMultiplier !== undefined) {
      nextRule.secondaryWageMultiplier = secondaryWageMultiplier;
    }

    if (overtimeRuleEditor.mode === "edit") {
      const id = overtimeRuleEditor.id;
      config.overtimeRules = config.overtimeRules.map((r) => (r.id === id ? nextRule : r));
    } else {
      config.overtimeRules = [...config.overtimeRules, nextRule];
    }

    draftConfig = config;
    overtimeRuleEditor = null;
    markBreaksOvertimeDirty();
    remount();
  });

  requestAnimationFrame(() => nameInput?.focus());
}

let breaksOvertimeSessionPath = "";
let breaksOvertimeRegistryBound = false;

function ensureBreaksOvertimePageSaveRegistry(): void {
  if (breaksOvertimeRegistryBound) return;
  breaksOvertimeRegistryBound = true;

  registerPageSavePreCommit(TEAM_BREAKS_OVERTIME_PATH, () => {
    const root = document.querySelector<HTMLElement>("[data-team-breaks-overtime-page]");
    if (!root) return false;
    const config = collectConfigFromDom(root);
    writeConfig(config);
    draftConfig = config;
    return true;
  });

  registerPageSaveDirtyProbe(TEAM_BREAKS_OVERTIME_PATH, () => {
    try {
      return JSON.stringify(getDraft()) !== JSON.stringify(readConfig());
    } catch {
      return false;
    }
  });

  window.addEventListener("menusifu:page-settings-discard", (event) => {
    const pageKey = (event as CustomEvent<{ pageKey?: string }>).detail?.pageKey;
    if (pageKey === TEAM_BREAKS_OVERTIME_PATH) {
      resetDraft();
    }
  });
}

/** 路由切换时维护编辑会话：离开页面则丢弃未保存草稿 */
export function syncTeamBreaksOvertimeSession(path: string): void {
  const active = isTeamBreaksOvertimePath(path);
  if (!active) {
    resetDraft();
    breaksOvertimeSessionPath = "";
    activeBreaksNavKey = "custom-breaks";
  } else if (!breaksOvertimeSessionPath) {
    breaksOvertimeSessionPath = path;
  }
}

/** 页面卸载或离开路由时丢弃未保存草稿 */
export function resetTeamBreaksOvertimeDraft(): void {
  resetDraft();
  breaksOvertimeSessionPath = "";
  activeBreaksNavKey = "custom-breaks";
}
