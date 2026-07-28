/**
 * 门店管理 · 营业与运营：营业时间库（seq 418）+ 额外时间（seq 583，与 418 同级）。
 * 数据原型 localStorage JSON；额外时间存储键仍为 418-business-hour-exceptions。
 */

import {
  readModuleSettingJson,
  readModuleSettingText,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { isMvpProductVersion } from "./product-version";

export const STORE_BUSINESS_HOURS_SEQ = 418;
/** 营业与运营 · 额外时间（与 418 同组同级；数据仍为 418-business-hour-exceptions） */
export const STORE_BUSINESS_HOUR_EXCEPTIONS_SEQ = 583;

export const STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID = "418-business-hour-schedules";
export const STORE_BUSINESS_HOUR_EXCEPTIONS_FIELD_ID = "418-business-hour-exceptions";

/** @deprecated 原型曾写入 417/418 纯文本 */
const LEGACY_BUSINESS_HOURS_TEXT_FIELD_IDS = ["418-business-hours", "417-business-hours"];

export type StoreBusinessHourDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type StoreBusinessHourSchedule = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  /** YYYY-MM-DD */
  fromDate: string;
  /** YYYY-MM-DD */
  toDate: string;
  fromDay: StoreBusinessHourDay;
  toDay: StoreBusinessHourDay;
  /** 若设置则优先于 fromDay/toDay 区间 */
  activeDays?: StoreBusinessHourDay[];
};

export type StoreBusinessHourExceptionMode = "include" | "exclude";

export type StoreBusinessHourException = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  /** YYYY-MM-DD */
  fromDate: string;
  /** YYYY-MM-DD */
  toDate: string;
  fromDay: StoreBusinessHourDay;
  toDay: StoreBusinessHourDay;
  activeDays?: StoreBusinessHourDay[];
  /** include=该时间生效；exclude=该时间不生效 */
  mode: StoreBusinessHourExceptionMode;
  /** 关联的营业时间规则 id；≥1 才可保存；空数组为待补全孤儿 */
  scheduleIds: string[];
};

export const STORE_BUSINESS_HOUR_DAYS: { day: StoreBusinessHourDay; label: string; short: string }[] = [
  { day: "mon", label: "周一", short: "一" },
  { day: "tue", label: "周二", short: "二" },
  { day: "wed", label: "周三", short: "三" },
  { day: "thu", label: "周四", short: "四" },
  { day: "fri", label: "周五", short: "五" },
  { day: "sat", label: "周六", short: "六" },
  { day: "sun", label: "周日", short: "日" },
];

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_ICON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SECTION_HEAD_CLASS = "text-sm font-semibold text-foreground";

const LABEL_CLASS = "block text-sm font-medium text-foreground";

const HINT_CLASS = "text-xs text-muted-foreground";

const WEEK_DAYS_MON_FIRST: StoreBusinessHourDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** 星期徽章顺序（与产线选择弹窗一致：SUN → SAT） */
export const STORE_BUSINESS_HOUR_DAY_BADGES: { day: StoreBusinessHourDay; badge: string }[] = [
  { day: "sun", badge: "SUN" },
  { day: "mon", badge: "MON" },
  { day: "tue", badge: "TUE" },
  { day: "wed", badge: "WED" },
  { day: "thu", badge: "THU" },
  { day: "fri", badge: "FRI" },
  { day: "sat", badge: "SAT" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isValidDay(day: string | undefined): day is StoreBusinessHourDay {
  return STORE_BUSINESS_HOUR_DAYS.some((d) => d.day === day);
}

function normalizeDay(day: string | undefined, fallback: StoreBusinessHourDay): StoreBusinessHourDay {
  return isValidDay(day) ? day : fallback;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isYearMonth(s: string | undefined): boolean {
  return !!s && /^\d{4}-\d{2}$/.test(s);
}

function isIsoDate(s: string | undefined): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function normalizeMonthValue(value: string | undefined): string {
  if (!value) return "";
  if (isYearMonth(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  return "";
}

function normalizeActiveDays(
  raw: StoreBusinessHourDay[] | undefined,
  fromDay: StoreBusinessHourDay,
  toDay: StoreBusinessHourDay,
): StoreBusinessHourDay[] | undefined {
  if (!raw?.length) return undefined;
  const valid = raw.filter(isValidDay);
  if (valid.length === 0) return undefined;
  const expanded = expandScheduleActiveDays(fromDay, toDay);
  if (valid.length === expanded.size && valid.every((d) => expanded.has(d))) return undefined;
  return [...new Set(valid)];
}

function monthEndDate(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${yearMonth}-${String(last).padStart(2, "0")}`;
}

function monthStartEnd(yearMonth: string): { fromDate: string; toDate: string } {
  return { fromDate: `${yearMonth}-01`, toDate: monthEndDate(yearMonth) };
}

function parseScheduleFromDate(
  raw: Partial<StoreBusinessHourSchedule> & { fromMonth?: string; toMonth?: string },
): string {
  if (raw.fromDate && isIsoDate(raw.fromDate)) return raw.fromDate;
  const ym = normalizeMonthValue(raw.fromMonth) || normalizeMonthValue(raw.fromDate);
  if (ym) return `${ym}-01`;
  return monthStartEnd(currentMonth()).fromDate;
}

function parseScheduleToDate(
  raw: Partial<StoreBusinessHourSchedule> & { fromMonth?: string; toMonth?: string },
  fromDate: string,
): string {
  if (raw.toDate && isIsoDate(raw.toDate)) return raw.toDate;
  const ym = normalizeMonthValue(raw.toMonth) || normalizeMonthValue(raw.toDate);
  if (ym) return monthEndDate(ym);
  return fromDate;
}

function normalizeSchedule(
  raw: Partial<StoreBusinessHourSchedule> & { fromMonth?: string; toMonth?: string; fromDate?: string; toDate?: string },
): StoreBusinessHourSchedule {
  const fromDate = parseScheduleFromDate(raw);
  let toDate = parseScheduleToDate(raw, fromDate);
  if (toDate < fromDate) toDate = fromDate;
  const fromDay = normalizeDay(raw.fromDay, "mon");
  const toDay = normalizeDay(raw.toDay, "fri");
  return {
    id: raw.id!,
    name: raw.name!,
    openTime: raw.openTime || "09:00",
    closeTime: raw.closeTime || "22:00",
    fromDate,
    toDate,
    fromDay,
    toDay,
    activeDays: normalizeActiveDays(raw.activeDays, fromDay, toDay),
  };
}

function normalizeScheduleIds(
  raw: Partial<StoreBusinessHourException> & { scheduleId?: string },
): string[] {
  const fromArray = Array.isArray(raw.scheduleIds)
    ? raw.scheduleIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0).map((id) => id.trim())
    : [];
  if (fromArray.length > 0) return [...new Set(fromArray)];
  const legacy = typeof raw.scheduleId === "string" ? raw.scheduleId.trim() : "";
  return legacy ? [legacy] : [];
}

function sanitizeExceptionScheduleIds(scheduleIds: string[], validIds: Set<string>): string[] {
  return [...new Set(scheduleIds.filter((id) => validIds.has(id)))];
}

function isOrphanException(exception: StoreBusinessHourException): boolean {
  return exception.scheduleIds.length === 0;
}

function normalizeException(
  raw: Partial<StoreBusinessHourException> & { date?: string; note?: string; scheduleId?: string },
): StoreBusinessHourException | null {
  if (!raw.id) return null;
  const legacyDate = raw.date && isIsoDate(raw.date) ? raw.date : "";
  let fromDate = raw.fromDate && isIsoDate(raw.fromDate) ? raw.fromDate : legacyDate;
  if (!fromDate) fromDate = currentDate();
  let toDate = raw.toDate && isIsoDate(raw.toDate) ? raw.toDate : fromDate;
  if (toDate < fromDate) toDate = fromDate;
  const fromDay = normalizeDay(raw.fromDay, "mon");
  const toDay = normalizeDay(raw.toDay, "fri");
  const mode: StoreBusinessHourExceptionMode = raw.mode === "exclude" ? "exclude" : "include";
  const name = raw.name?.trim() || raw.note?.trim() || "额外时间";
  return {
    id: raw.id,
    name,
    openTime: raw.openTime || "09:00",
    closeTime: raw.closeTime || "22:00",
    fromDate,
    toDate,
    fromDay,
    toDay,
    activeDays: normalizeActiveDays(raw.activeDays, fromDay, toDay),
    mode,
    scheduleIds: normalizeScheduleIds(raw),
  };
}

function dayLabel(day: StoreBusinessHourDay): string {
  return STORE_BUSINESS_HOUR_DAYS.find((d) => d.day === day)?.label ?? day;
}

function readLegacyBusinessHoursText(): string {
  for (const fieldId of LEGACY_BUSINESS_HOURS_TEXT_FIELD_IDS) {
    const text = readModuleSettingText(fieldId, "").trim();
    if (text) return text;
  }
  return "";
}

function defaultSchedulesFromLegacy(): StoreBusinessHourSchedule[] {
  const { fromDate, toDate } = monthStartEnd(currentMonth());
  const legacy = readLegacyBusinessHoursText();
  if (!legacy) {
    return [
      normalizeSchedule({
        id: "bh-preset-all-day",
        name: "All Day",
        openTime: "00:00",
        closeTime: "23:50",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
      normalizeSchedule({
        id: "bh-preset-morning",
        name: "早上",
        openTime: "06:00",
        closeTime: "11:00",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
      normalizeSchedule({
        id: "bh-preset-noon",
        name: "中午",
        openTime: "11:00",
        closeTime: "16:00",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
      normalizeSchedule({
        id: "bh-preset-evening",
        name: "晚上",
        openTime: "16:00",
        closeTime: "24:00",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
    ];
  }
  return [
    normalizeSchedule({
      id: "bh-preset-default",
      name: "默认营业时间",
      openTime: "09:00",
      closeTime: "22:00",
      fromDate,
      toDate,
      fromDay: "mon",
      toDay: "sun",
    }),
  ];
}

export function readBusinessHourSchedules(): StoreBusinessHourSchedule[] {
  const raw = readModuleSettingJson<
    (StoreBusinessHourSchedule & { fromMonth?: string; toMonth?: string; fromDate?: string; toDate?: string })[]
  >(
    STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID,
    [],
  );
  if (!Array.isArray(raw) || raw.length === 0) {
    const defaults = defaultSchedulesFromLegacy();
    // 首次读取即落库，避免每次生成新 id 导致关联配置（品类/分类/品牌）回显为「未设置」
    writeBusinessHourSchedules(defaults);
    return defaults;
  }
  return raw.filter((s) => s?.id && s?.name).map((s) => normalizeSchedule(s));
}

export function writeBusinessHourSchedules(schedules: StoreBusinessHourSchedule[]): void {
  writeModuleSettingJson(STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID, schedules);
}

export function readBusinessHourExceptions(): StoreBusinessHourException[] {
  const raw = readModuleSettingJson<
    (Partial<StoreBusinessHourException> & { date?: string; note?: string; scheduleId?: string })[]
  >(STORE_BUSINESS_HOUR_EXCEPTIONS_FIELD_ID, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeException(item))
    .filter((item): item is StoreBusinessHourException => item != null)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate) || a.name.localeCompare(b.name));
}

/** 展示用：与当前营业时间库求交清洗 scheduleIds（不单独写盘） */
function readBusinessHourExceptionsForDisplay(
  schedules: StoreBusinessHourSchedule[] = readBusinessHourSchedules(),
): StoreBusinessHourException[] {
  const validIds = new Set(schedules.map((s) => s.id));
  return readBusinessHourExceptions().map((e) => ({
    ...e,
    scheduleIds: sanitizeExceptionScheduleIds(e.scheduleIds, validIds),
  }));
}

export function writeBusinessHourExceptions(exceptions: StoreBusinessHourException[]): void {
  writeModuleSettingJson(STORE_BUSINESS_HOUR_EXCEPTIONS_FIELD_ID, exceptions);
}

function formatDateRange(fromDate: string, toDate: string): string {
  if (fromDate === toDate) return fromDate;
  return `${fromDate} 至 ${toDate}`;
}

function formatActiveDaysLabel(days: Set<StoreBusinessHourDay>): string {
  if (days.size === 7) return "每天";
  const ordered = WEEK_DAYS_MON_FIRST.filter((d) => days.has(d)).map((d) => dayLabel(d));
  return ordered.join("、");
}

export function formatScheduleSummary(schedule: StoreBusinessHourSchedule): string {
  const days = getScheduleActiveDays(schedule);
  return `${formatDateRange(schedule.fromDate, schedule.toDate)} · ${formatActiveDaysLabel(days)} · ${schedule.openTime}–${schedule.closeTime}`;
}

/** 产线展示：00:00 to 23:50 */
export function formatScheduleTimeRange(schedule: StoreBusinessHourSchedule): string {
  return `${schedule.openTime} to ${schedule.closeTime}`;
}

/** 展开 fromDay–toDay 为一周内生效的星期（含跨周区间） */
export function expandScheduleActiveDays(
  fromDay: StoreBusinessHourDay,
  toDay: StoreBusinessHourDay,
): Set<StoreBusinessHourDay> {
  const fromIdx = WEEK_DAYS_MON_FIRST.indexOf(fromDay);
  const toIdx = WEEK_DAYS_MON_FIRST.indexOf(toDay);
  const out = new Set<StoreBusinessHourDay>();
  if (fromIdx === -1 || toIdx === -1) {
    WEEK_DAYS_MON_FIRST.forEach((d) => out.add(d));
    return out;
  }
  if (fromIdx <= toIdx) {
    for (let i = fromIdx; i <= toIdx; i++) out.add(WEEK_DAYS_MON_FIRST[i]!);
  } else {
    for (let i = fromIdx; i < WEEK_DAYS_MON_FIRST.length; i++) out.add(WEEK_DAYS_MON_FIRST[i]!);
    for (let i = 0; i <= toIdx; i++) out.add(WEEK_DAYS_MON_FIRST[i]!);
  }
  return out;
}

export function getScheduleActiveDays(
  schedule: Pick<StoreBusinessHourSchedule, "fromDay" | "toDay" | "activeDays">,
): Set<StoreBusinessHourDay> {
  if (schedule.activeDays?.length) return new Set(schedule.activeDays.filter(isValidDay));
  return expandScheduleActiveDays(schedule.fromDay, schedule.toDay);
}

function deriveFromToDays(activeDays: StoreBusinessHourDay[]): {
  fromDay: StoreBusinessHourDay;
  toDay: StoreBusinessHourDay;
} {
  const ordered = WEEK_DAYS_MON_FIRST.filter((d) => activeDays.includes(d));
  return {
    fromDay: ordered[0] ?? "mon",
    toDay: ordered[ordered.length - 1] ?? "fri",
  };
}

function renderScheduleDayBadges(
  schedule: Pick<StoreBusinessHourSchedule, "fromDay" | "toDay" | "activeDays">,
): string {
  const active = getScheduleActiveDays(schedule);
  return STORE_BUSINESS_HOUR_DAY_BADGES.filter(({ day }) => active.has(day))
    .map(
      ({ badge }) => `<span
      class="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md px-1.5 text-[10px] font-semibold tracking-wide bg-primary/15 text-primary ring-1 ring-primary/30"
      aria-hidden="true"
    >${badge}</span>`,
    )
    .join("");
}

function formatExceptionModeLabel(mode: StoreBusinessHourExceptionMode): string {
  return mode === "include" ? "该时间生效" : "该时间不生效";
}

function exceptionModeBadgeClass(mode: StoreBusinessHourExceptionMode): string {
  return mode === "include"
    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400"
    : "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400";
}

function exceptionsLinkedToSchedule(
  exceptions: StoreBusinessHourException[],
  scheduleId: string,
): StoreBusinessHourException[] {
  return exceptions.filter(
    (e) => Array.isArray(e.scheduleIds) && e.scheduleIds.length > 0 && e.scheduleIds.includes(scheduleId),
  );
}

/** 营业时间卡片下的额外时间行：只展示本规则相关信息，不提示其他关联规则 */
function renderNestedExceptionRow(exception: StoreBusinessHourException): string {
  return `
    <li
      class="group flex items-start justify-between gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2"
      data-business-hour-exception
      data-exception-id="${escapeHtml(exception.id)}"
    >
      <div class="min-w-0 flex-1 space-y-0.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${exceptionModeBadgeClass(exception.mode)}">
            ${escapeHtml(formatExceptionModeLabel(exception.mode))}
          </span>
          <span class="text-sm font-medium text-foreground">${escapeHtml(exception.name)}</span>
          <span class="text-[11px] tabular-nums text-muted-foreground">${escapeHtml(formatDateRange(exception.fromDate, exception.toDate))}</span>
        </div>
        <p class="text-xs tabular-nums text-muted-foreground">
          ${escapeHtml(exception.openTime)} — ${escapeHtml(exception.closeTime)}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <button type="button" class="${BTN_ICON}" data-business-hour-exception-edit aria-label="编辑额外时间 ${escapeHtml(exception.name)}" title="编辑">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button type="button" class="${BTN_ICON} hover:text-destructive" data-business-hour-exception-remove aria-label="删除额外时间 ${escapeHtml(exception.name)}" title="删除">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          </svg>
        </button>
      </div>
    </li>`;
}

function renderScheduleCard(
  schedule: StoreBusinessHourSchedule,
  relatedExceptions: StoreBusinessHourException[],
): string {
  const nested =
    relatedExceptions.length > 0
      ? `<ul class="space-y-2">${relatedExceptions.map((e) => renderNestedExceptionRow(e)).join("")}</ul>`
      : `<p class="text-xs text-muted-foreground">暂无额外时间</p>`;

  return `
    <li
      class="group rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      data-business-hour-schedule
      data-schedule-id="${escapeHtml(schedule.id)}"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h5 class="text-sm font-semibold text-foreground">${escapeHtml(schedule.name)}</h5>
            ${
              isMvpProductVersion()
                ? ""
                : `<span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
              ${escapeHtml(formatDateRange(schedule.fromDate, schedule.toDate))}
            </span>`
            }
          </div>
          <p class="text-lg font-medium tabular-nums tracking-tight text-foreground">
            ${escapeHtml(schedule.openTime)}
            <span class="mx-1.5 text-muted-foreground font-normal">—</span>
            ${escapeHtml(schedule.closeTime)}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="flex flex-wrap gap-2">${renderScheduleDayBadges(schedule)}</span>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            type="button"
            class="${BTN_ICON}"
            data-business-hour-schedule-edit
            aria-label="编辑 ${escapeHtml(schedule.name)}"
            title="编辑"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <button
            type="button"
            class="${BTN_ICON} hover:text-destructive"
            data-business-hour-schedule-remove
            aria-label="删除 ${escapeHtml(schedule.name)}"
            title="删除"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="mt-4 space-y-2 border-t border-dashed border-border pt-3" data-business-hour-schedule-exceptions>
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-medium text-muted-foreground">额外时间</p>
          <button
            type="button"
            class="text-xs text-primary hover:underline"
            data-business-hour-exception-create
            data-source-schedule-id="${escapeHtml(schedule.id)}"
          >+ 添加额外时间</button>
        </div>
        ${nested}
      </div>
    </li>`;
}

function renderOrphanExceptionRow(exception: StoreBusinessHourException): string {
  return `
    <li
      class="group flex items-start justify-between gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2"
      data-business-hour-exception
      data-exception-id="${escapeHtml(exception.id)}"
    >
      <div class="min-w-0 flex-1 space-y-0.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${exceptionModeBadgeClass(exception.mode)}">
            ${escapeHtml(formatExceptionModeLabel(exception.mode))}
          </span>
          <span class="text-sm font-medium text-foreground">${escapeHtml(exception.name)}</span>
          <span class="text-[11px] tabular-nums text-muted-foreground">${escapeHtml(formatDateRange(exception.fromDate, exception.toDate))}</span>
        </div>
        <p class="text-xs tabular-nums text-muted-foreground">
          ${escapeHtml(exception.openTime)} — ${escapeHtml(exception.closeTime)}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <button type="button" class="${BTN_ICON}" data-business-hour-exception-edit aria-label="编辑额外时间 ${escapeHtml(exception.name)}" title="编辑">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button type="button" class="${BTN_ICON} hover:text-destructive" data-business-hour-exception-remove aria-label="删除额外时间 ${escapeHtml(exception.name)}" title="删除">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          </svg>
        </button>
      </div>
    </li>`;
}

function renderOrphanExceptionsBanner(orphans: StoreBusinessHourException[]): string {
  if (orphans.length === 0) return "";
  return `
    <details class="rounded-lg border border-amber-500/40 bg-amber-500/5 open:shadow-sm" data-business-hour-orphan-banner>
      <summary class="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span class="inline-flex items-center gap-2">
          <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[11px] tabular-nums text-amber-800 dark:text-amber-300">${orphans.length}</span>
          有 ${orphans.length} 条额外时间未关联营业时间，请编辑补全
        </span>
      </summary>
      <ul class="space-y-2 border-t border-amber-500/20 px-4 py-3">${orphans.map(renderOrphanExceptionRow).join("")}</ul>
    </details>`;
}

function renderDayChipSelector(selected: Set<StoreBusinessHourDay>, dataAttr: string): string {
  return `<div class="flex flex-wrap gap-2" role="group" aria-label="生效星期">
    ${STORE_BUSINESS_HOUR_DAYS.map(({ day, short }) => {
      const on = selected.has(day);
      return `<button
        type="button"
        class="inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          on
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
        }"
        ${dataAttr}="${escapeHtml(day)}"
        aria-pressed="${on ? "true" : "false"}"
      >${escapeHtml(short)}</button>`;
    }).join("")}
  </div>`;
}

function renderScheduleDialog(): string {
  const today = currentDate();
  const defaultDays = new Set<StoreBusinessHourDay>(["mon", "tue", "wed", "thu", "fri"]);
  const mvp = isMvpProductVersion();
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-business-hour-schedule-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hour-schedule-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-business-hour-schedule-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="business-hour-schedule-dialog-title" class="text-base font-semibold text-card-foreground" data-business-hour-schedule-dialog-title>新建营业时间</h3>
          <p class="mt-1 text-xs text-muted-foreground" data-business-hour-schedule-dialog-subtitle>${
            mvp ? "设置时段与每周重复规则" : "设置时段、生效日期与每周重复规则"
          }</p>
        </div>
        <div class="space-y-5 px-5 py-4">
          <input type="hidden" data-business-hour-schedule-edit-id value="" />
          <div class="space-y-1.5">
            <label class="${LABEL_CLASS}" for="business-hour-schedule-name">名称</label>
            <input id="business-hour-schedule-name" type="text" class="${INPUT_CLASS}" data-business-hour-schedule-name placeholder="如：午市、晚市" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="${LABEL_CLASS}" for="business-hour-schedule-open">开始时间</label>
              <input id="business-hour-schedule-open" type="time" class="${INPUT_CLASS} tabular-nums" data-business-hour-schedule-open value="11:00" />
            </div>
            <div class="space-y-1.5">
              <label class="${LABEL_CLASS}" for="business-hour-schedule-close">结束时间</label>
              <input id="business-hour-schedule-close" type="time" class="${INPUT_CLASS} tabular-nums" data-business-hour-schedule-close value="22:00" />
            </div>
          </div>
          <div class="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div class="space-y-4 ${mvp ? "hidden" : ""}" data-business-hour-schedule-effective-dates>
              <div>
                <p class="${LABEL_CLASS}">生效日期</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground" for="business-hour-schedule-from-date">开始日期</label>
                  <input id="business-hour-schedule-from-date" type="date" class="${INPUT_CLASS} tabular-nums" data-business-hour-schedule-from-date value="${escapeHtml(today)}" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs text-muted-foreground" for="business-hour-schedule-to-date">结束日期</label>
                  <input id="business-hour-schedule-to-date" type="date" class="${INPUT_CLASS} tabular-nums" data-business-hour-schedule-to-date value="${escapeHtml(today)}" />
                </div>
              </div>
            </div>
            <div class="space-y-2 ${mvp ? "" : "border-t border-border pt-4"}" data-business-hour-schedule-weekly-repeat>
              <div class="flex items-center justify-between gap-2">
                <p class="${LABEL_CLASS}">每周重复</p>
                <div class="flex gap-1">
                  <button type="button" class="text-xs text-primary hover:underline" data-business-hour-schedule-day-select-all>全选</button>
                  <span class="text-muted-foreground">·</span>
                  <button type="button" class="text-xs text-primary hover:underline" data-business-hour-schedule-day-select-weekdays>工作日</button>
                </div>
              </div>
              ${renderDayChipSelector(defaultDays, "data-business-hour-schedule-day-chip")}
            </div>
          </div>
          <p class="hidden text-xs text-destructive" data-business-hour-schedule-error role="alert"></p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-business-hour-schedule-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-business-hour-schedule-save>保存</button>
        </div>
      </div>
    </div>`;
}

function syncScheduleDialogVersionUi(panel: HTMLElement): void {
  const mvp = isMvpProductVersion();
  const dates = panel.querySelector<HTMLElement>("[data-business-hour-schedule-effective-dates]");
  const weekly = panel.querySelector<HTMLElement>("[data-business-hour-schedule-weekly-repeat]");
  const subtitle = panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog-subtitle]");
  if (dates) dates.classList.toggle("hidden", mvp);
  if (weekly) {
    weekly.classList.toggle("border-t", !mvp);
    weekly.classList.toggle("border-border", !mvp);
    weekly.classList.toggle("pt-4", !mvp);
  }
  if (subtitle) {
    subtitle.textContent = mvp ? "设置时段与每周重复规则" : "设置时段、生效日期与每周重复规则";
  }
}

function renderExceptionScheduleCheckboxes(
  schedules: StoreBusinessHourSchedule[],
  selectedIds: Set<string>,
  options?: { lockedScheduleId?: string },
): string {
  const lockedId = options?.lockedScheduleId?.trim() || "";
  const visible = lockedId ? schedules.filter((s) => s.id === lockedId) : schedules;

  if (visible.length === 0) {
    return `<p class="text-xs text-muted-foreground" data-business-hour-exception-schedule-empty>${
      lockedId ? "来源营业时间不存在，请关闭后重试" : "暂无营业时间可选，请先新建营业时间"
    }</p>`;
  }

  const items = visible
    .map((s) => {
      const checked = lockedId ? true : selectedIds.has(s.id);
      const locked = !!lockedId;
      return `<label class="flex items-start gap-2.5 rounded-md border border-border px-3 py-2 ${
        locked ? "cursor-default bg-muted/30" : "cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
      }">
        <input
          type="checkbox"
          class="mt-0.5 accent-primary"
          value="${escapeHtml(s.id)}"
          data-business-hour-exception-schedule
          ${checked ? "checked" : ""}
          ${locked ? "disabled" : ""}
        />
        <span class="min-w-0">
          <span class="block text-sm font-medium text-foreground">${escapeHtml(s.name)}</span>
          <span class="block text-xs tabular-nums text-muted-foreground">${escapeHtml(s.openTime)} — ${escapeHtml(s.closeTime)}</span>
        </span>
      </label>`;
    })
    .join("");

  const hiddenLock = lockedId
    ? `<input type="hidden" data-business-hour-exception-locked-schedule-id value="${escapeHtml(lockedId)}" />`
    : `<input type="hidden" data-business-hour-exception-locked-schedule-id value="" />`;

  return `${hiddenLock}${items}`;
}

function fillExceptionScheduleCheckboxes(
  panel: HTMLElement,
  selectedIds: Set<string>,
  options?: { lockedScheduleId?: string },
): void {
  const list = panel.querySelector<HTMLElement>("[data-business-hour-exception-schedule-list]");
  if (!list) return;
  list.innerHTML = renderExceptionScheduleCheckboxes(readBusinessHourSchedules(), selectedIds, options);
}

function getSelectedExceptionScheduleIds(panel: HTMLElement): string[] {
  const locked = panel
    .querySelector<HTMLInputElement>("[data-business-hour-exception-locked-schedule-id]")
    ?.value.trim();
  if (locked) return [locked];

  const ids: string[] = [];
  panel.querySelectorAll<HTMLInputElement>("[data-business-hour-exception-schedule]:checked").forEach((input) => {
    const id = input.value.trim();
    if (id) ids.push(id);
  });
  return [...new Set(ids)];
}

function renderExceptionDialog(): string {
  const today = currentDate();
  const defaultDays = new Set<StoreBusinessHourDay>(["mon", "tue", "wed", "thu", "fri"]);
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-business-hour-exception-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hour-exception-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-business-hour-exception-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="business-hour-exception-dialog-title" class="text-base font-semibold text-card-foreground" data-business-hour-exception-dialog-title>新增额外时间</h3>
        </div>
        <div class="space-y-5 px-5 py-4">
          <input type="hidden" data-business-hour-exception-edit-id value="" />
          <fieldset class="space-y-2">
            <legend class="${LABEL_CLASS}">规则类型</legend>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" name="business-hour-exception-mode" value="include" class="accent-primary" data-business-hour-exception-mode checked />
                <span class="text-sm font-medium text-foreground">该时间生效</span>
              </label>
              <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" name="business-hour-exception-mode" value="exclude" class="accent-primary" data-business-hour-exception-mode />
                <span class="text-sm font-medium text-foreground">该时间不生效</span>
              </label>
            </div>
          </fieldset>
          <div class="space-y-1.5" data-business-hour-exception-name-field>
            <label class="${LABEL_CLASS}" for="business-hour-exception-name">名称</label>
            <input id="business-hour-exception-name" type="text" class="${INPUT_CLASS}" data-business-hour-exception-name placeholder="如：国庆节、调休" />
          </div>
          <div class="grid grid-cols-2 gap-4" data-business-hour-exception-time-fields>
            <div class="space-y-1.5">
              <label class="${LABEL_CLASS}" for="business-hour-exception-open">开始时间</label>
              <input id="business-hour-exception-open" type="time" class="${INPUT_CLASS} tabular-nums" data-business-hour-exception-open value="11:00" />
            </div>
            <div class="space-y-1.5">
              <label class="${LABEL_CLASS}" for="business-hour-exception-close">结束时间</label>
              <input id="business-hour-exception-close" type="time" class="${INPUT_CLASS} tabular-nums" data-business-hour-exception-close value="22:00" />
            </div>
          </div>
          <div class="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div>
              <p class="${LABEL_CLASS}" data-business-hour-exception-date-section-label>生效日期</p>
            </div>
            <div class="space-y-1.5 hidden" data-business-hour-exception-single-date-field>
              <label class="text-xs text-muted-foreground" for="business-hour-exception-single-date">日期</label>
              <input id="business-hour-exception-single-date" type="date" class="${INPUT_CLASS} tabular-nums" data-business-hour-exception-single-date value="${escapeHtml(today)}" />
            </div>
            <div class="grid grid-cols-2 gap-4" data-business-hour-exception-date-range>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground" for="business-hour-exception-from-date">开始日期</label>
                <input id="business-hour-exception-from-date" type="date" class="${INPUT_CLASS} tabular-nums" data-business-hour-exception-from-date value="${escapeHtml(today)}" />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs text-muted-foreground" for="business-hour-exception-to-date">结束日期</label>
                <input id="business-hour-exception-to-date" type="date" class="${INPUT_CLASS} tabular-nums" data-business-hour-exception-to-date value="${escapeHtml(today)}" />
              </div>
            </div>
            <div class="space-y-2 border-t border-border pt-4" data-business-hour-exception-weekly-repeat>
              <div class="flex items-center justify-between gap-2">
                <p class="${LABEL_CLASS}">每周重复</p>
                <div class="flex gap-1">
                  <button type="button" class="text-xs text-primary hover:underline" data-business-hour-exception-day-select-all>全选</button>
                  <span class="text-muted-foreground">·</span>
                  <button type="button" class="text-xs text-primary hover:underline" data-business-hour-exception-day-select-weekdays>工作日</button>
                </div>
              </div>
              ${renderDayChipSelector(defaultDays, "data-business-hour-exception-day-chip")}
            </div>
          </div>
          <div class="space-y-2 rounded-lg border border-border bg-muted/10 p-4">
            <div>
              <p class="${LABEL_CLASS}">作用于营业时间 <span class="text-destructive">*</span></p>
            </div>
            <div class="space-y-2" data-business-hour-exception-schedule-list></div>
          </div>
          <p class="hidden text-xs text-destructive" data-business-hour-exception-error role="alert"></p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-business-hour-exception-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-business-hour-exception-save>保存</button>
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirmDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-business-hour-delete-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hour-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-business-hour-delete-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="business-hour-delete-dialog-title" class="text-base font-semibold text-card-foreground" data-business-hour-delete-dialog-title>确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-business-hour-delete-kind value="" />
          <input type="hidden" data-business-hour-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-business-hour-delete-message>确定删除？删除后无法恢复。</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-business-hour-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-business-hour-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function renderSchedulesSection(
  schedules: StoreBusinessHourSchedule[],
  exceptions: StoreBusinessHourException[],
): string {
  const list =
    schedules.length > 0
      ? `<ul class="grid gap-3 sm:grid-cols-1" data-business-hour-schedule-list>${schedules
          .map((schedule) => {
            // 仅挂载关联到本条营业时间的额外时间（由【额外时间】多选同步而来时亦按 id 过滤）
            const related = exceptionsLinkedToSchedule(exceptions, schedule.id);
            return renderScheduleCard(schedule, related);
          })
          .join("")}</ul>`
      : `<div class="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center" data-business-hour-empty>
          <p class="text-sm font-medium text-foreground">暂无营业时间</p>
          <p class="mt-1 text-xs text-muted-foreground">添加午市、晚市等时段，供品类与品牌绑定使用</p>
          <button type="button" class="${BTN_PRIMARY} mt-4" data-business-hour-create-toggle>新建营业时间</button>
        </div>`;

  const headerAction =
    schedules.length > 0
      ? `<button type="button" class="${BTN_PRIMARY}" data-business-hour-create-toggle>
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          新建
        </button>`
      : "";

  return `
    <section class="space-y-4" data-business-hour-schedules-section>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="${SECTION_HEAD_CLASS}">营业时间</h4>
        ${headerAction}
      </div>
      ${list}
    </section>`;
}

function renderStandaloneExceptionCard(
  exception: StoreBusinessHourException,
  schedulesById: Map<string, StoreBusinessHourSchedule>,
): string {
  const linkedNames = exception.scheduleIds
    .map((id) => schedulesById.get(id)?.name || id)
    .filter(Boolean);
  const linkedLabel =
    linkedNames.length > 0 ? linkedNames.map((n) => escapeHtml(n)).join("、") : "未关联";

  return `
    <li
      class="group rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      data-business-hour-exception
      data-exception-id="${escapeHtml(exception.id)}"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <h5 class="text-sm font-semibold text-foreground">${escapeHtml(exception.name)}</h5>
            <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${exceptionModeBadgeClass(exception.mode)}">
              ${escapeHtml(formatExceptionModeLabel(exception.mode))}
            </span>
            <span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
              ${escapeHtml(formatDateRange(exception.fromDate, exception.toDate))}
            </span>
          </div>
          <p class="text-lg font-medium tabular-nums tracking-tight text-foreground">
            ${escapeHtml(exception.openTime)}
            <span class="mx-1.5 text-muted-foreground font-normal">—</span>
            ${escapeHtml(exception.closeTime)}
          </p>
          <p class="text-xs text-muted-foreground">作用于：${linkedLabel}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="flex flex-wrap gap-2">${renderScheduleDayBadges(exception)}</span>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button type="button" class="${BTN_ICON}" data-business-hour-exception-edit aria-label="编辑额外时间 ${escapeHtml(exception.name)}" title="编辑">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>
          <button type="button" class="${BTN_ICON} hover:text-destructive" data-business-hour-exception-remove aria-label="删除额外时间 ${escapeHtml(exception.name)}" title="删除">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>
      </div>
    </li>`;
}

function renderExceptionsSection(
  schedules: StoreBusinessHourSchedule[],
  exceptions: StoreBusinessHourException[],
): string {
  const schedulesById = new Map(schedules.map((s) => [s.id, s]));
  const linked = exceptions.filter((e) => !isOrphanException(e));
  const list =
    linked.length > 0
      ? `<ul class="grid gap-3 sm:grid-cols-1" data-business-hour-exception-list>${linked
          .map((e) => renderStandaloneExceptionCard(e, schedulesById))
          .join("")}</ul>`
      : `<div class="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground" data-business-hour-exception-empty>
          暂无额外时间，可针对节假日或调休日设置生效/不生效，并选择作用的营业时间
        </div>`;

  const canCreate = schedules.length > 0;
  const createBtn = canCreate
    ? `<button type="button" class="${BTN_PRIMARY}" data-business-hour-exception-create>
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          新增
        </button>`
    : `<button type="button" class="${BTN_GHOST} opacity-60" disabled title="请先在营业时段中新建营业时间">新增</button>`;

  return `
    <section class="space-y-4" data-business-hour-exceptions-section>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 class="${SECTION_HEAD_CLASS}">额外时间</h4>
          <p class="${HINT_CLASS} mt-0.5">针对特定日期覆盖或暂停所选营业时间</p>
        </div>
        ${createBtn}
      </div>
      ${list}
    </section>`;
}

function renderSchedulesPanelBody(
  schedules: StoreBusinessHourSchedule[],
  exceptions: StoreBusinessHourException[],
): string {
  return renderSchedulesSection(schedules, exceptions);
}

function renderExceptionsPanelBody(
  schedules: StoreBusinessHourSchedule[],
  exceptions: StoreBusinessHourException[],
): string {
  const orphans = exceptions.filter(isOrphanException);
  return `${renderOrphanExceptionsBanner(orphans)}${renderExceptionsSection(schedules, exceptions)}`;
}

function renderPanelBody(
  schedules: StoreBusinessHourSchedule[],
  exceptions: StoreBusinessHourException[],
  mode: "schedules" | "exceptions",
): string {
  return mode === "exceptions"
    ? renderExceptionsPanelBody(schedules, exceptions)
    : renderSchedulesPanelBody(schedules, exceptions);
}

export function isStoreBusinessHoursSeq(seq: number): boolean {
  return seq === STORE_BUSINESS_HOURS_SEQ;
}

export function isStoreBusinessHourExceptionsSeq(seq: number): boolean {
  return seq === STORE_BUSINESS_HOUR_EXCEPTIONS_SEQ;
}

function renderBusinessHoursPanelShell(mode: "schedules" | "exceptions"): string {
  const schedules = readBusinessHourSchedules();
  const exceptions = readBusinessHourExceptionsForDisplay(schedules);
  return `
    <div class="space-y-5" data-store-business-hours-panel data-business-hours-panel-mode="${mode}">
      <div class="space-y-4" data-store-business-hours-body>${renderPanelBody(schedules, exceptions, mode)}</div>
      ${renderScheduleDialog()}
      ${renderExceptionDialog()}
      ${renderDeleteConfirmDialog()}
    </div>`;
}

export function renderStoreBusinessHoursHtml(): string {
  return renderBusinessHoursPanelShell("schedules");
}

export function renderStoreBusinessHourExceptionsHtml(): string {
  return renderBusinessHoursPanelShell("exceptions");
}

function refreshPanelBody(panel: HTMLElement): void {
  const body = panel.querySelector<HTMLElement>("[data-store-business-hours-body]");
  if (!body) return;
  const schedules = readBusinessHourSchedules();
  const exceptions = readBusinessHourExceptionsForDisplay(schedules);
  const mode = panel.getAttribute("data-business-hours-panel-mode") === "exceptions" ? "exceptions" : "schedules";
  body.innerHTML = renderPanelBody(schedules, exceptions, mode);
}

function refreshAllBusinessHoursPanels(): void {
  document.querySelectorAll<HTMLElement>("[data-store-business-hours-panel]").forEach((panel) => {
    refreshPanelBody(panel);
  });
}

function showDialog(dialog: HTMLElement | null): void {
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideDialog(dialog: HTMLElement | null): void {
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
}

const SCHEDULE_DAY_CHIP_ATTR = "data-business-hour-schedule-day-chip";
const EXCEPTION_DAY_CHIP_ATTR = "data-business-hour-exception-day-chip";

function getSelectedDays(panel: HTMLElement, chipAttr: string): Set<StoreBusinessHourDay> {
  const out = new Set<StoreBusinessHourDay>();
  panel.querySelectorAll<HTMLButtonElement>(`[${chipAttr}]`).forEach((btn) => {
    if (btn.getAttribute("aria-pressed") === "true") {
      const rawDay = btn.getAttribute(chipAttr);
      if (rawDay && isValidDay(rawDay)) out.add(rawDay);
    }
  });
  return out;
}

function setSelectedDays(panel: HTMLElement, days: Set<StoreBusinessHourDay>, chipAttr: string): void {
  panel.querySelectorAll<HTMLButtonElement>(`[${chipAttr}]`).forEach((btn) => {
    const rawDay = btn.getAttribute(chipAttr);
    const on = !!rawDay && isValidDay(rawDay) && days.has(rawDay);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.className = `inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      on
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
    }`;
  });
}

function setScheduleDialogError(panel: HTMLElement, message: string): void {
  const el = panel.querySelector<HTMLElement>("[data-business-hour-schedule-error]");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("hidden", !message);
}

function setExceptionDialogError(panel: HTMLElement, message: string): void {
  const el = panel.querySelector<HTMLElement>("[data-business-hour-exception-error]");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("hidden", !message);
}

function mvpScheduleEffectiveDateRange(): { fromDate: string; toDate: string } {
  return { fromDate: "2000-01-01", toDate: "2099-12-31" };
}

function resetScheduleDialog(panel: HTMLElement): void {
  const today = currentDate();
  const mvpRange = mvpScheduleEffectiveDateRange();
  const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-edit-id]");
  const title = panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog-title]");
  if (editId) editId.value = "";
  if (title) title.textContent = "新建营业时间";
  const name = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-name]");
  const open = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-open]");
  const close = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-close]");
  const fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-from-date]");
  const toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-to-date]");
  if (name) name.value = "";
  if (open) open.value = "11:00";
  if (close) close.value = "22:00";
  if (fromDate) fromDate.value = isMvpProductVersion() ? mvpRange.fromDate : today;
  if (toDate) toDate.value = isMvpProductVersion() ? mvpRange.toDate : today;
  setSelectedDays(panel, new Set(["mon", "tue", "wed", "thu", "fri"]), SCHEDULE_DAY_CHIP_ATTR);
  setScheduleDialogError(panel, "");
  syncScheduleDialogVersionUi(panel);
}

function openScheduleDialog(panel: HTMLElement, schedule?: StoreBusinessHourSchedule): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog]");
  resetScheduleDialog(panel);
  if (schedule) {
    const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-edit-id]");
    const title = panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog-title]");
    if (editId) editId.value = schedule.id;
    if (title) title.textContent = "编辑营业时间";
    const name = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-name]");
    const open = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-open]");
    const close = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-close]");
    const fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-from-date]");
    const toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-to-date]");
    if (name) name.value = schedule.name;
    if (open) open.value = schedule.openTime;
    if (close) close.value = schedule.closeTime;
    if (fromDate) fromDate.value = schedule.fromDate;
    if (toDate) toDate.value = schedule.toDate;
    setSelectedDays(panel, getScheduleActiveDays(schedule), SCHEDULE_DAY_CHIP_ATTR);
  }
  syncScheduleDialogVersionUi(panel);
  showDialog(dialog);
  panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-name]")?.focus();
}

function hideScheduleDialog(panel: HTMLElement): void {
  hideDialog(panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog]"));
}

function saveScheduleDialog(panel: HTMLElement): void {
  const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-edit-id]")?.value.trim();
  const name = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-name]")?.value.trim();
  const openTime = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-open]")?.value || "09:00";
  const closeTime = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-close]")?.value || "22:00";
  const mvp = isMvpProductVersion();
  const mvpRange = mvpScheduleEffectiveDateRange();
  let fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-from-date]")?.value ?? "";
  let toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-to-date]")?.value ?? "";
  const selectedDays = [...getSelectedDays(panel, SCHEDULE_DAY_CHIP_ATTR)];

  if (!name) {
    setScheduleDialogError(panel, "请填写名称");
    panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-name]")?.focus();
    return;
  }
  if (mvp) {
    // MVP 不展示生效日期：新建用长期区间；编辑沿用表单中已有值（打开时写入）
    if (!isIsoDate(fromDate) || !isIsoDate(toDate) || fromDate > toDate) {
      fromDate = mvpRange.fromDate;
      toDate = mvpRange.toDate;
    }
  } else {
    if (!isIsoDate(fromDate) || !isIsoDate(toDate)) {
      setScheduleDialogError(panel, "请选择有效的生效日期");
      return;
    }
    if (fromDate > toDate) {
      setScheduleDialogError(panel, "结束日期不能早于开始日期");
      return;
    }
  }
  if (selectedDays.length === 0) {
    setScheduleDialogError(panel, "请至少选择一天");
    return;
  }
  if (openTime >= closeTime) {
    setScheduleDialogError(panel, "结束时间应晚于开始时间");
    return;
  }

  const { fromDay, toDay } = deriveFromToDays(selectedDays);
  const schedule: StoreBusinessHourSchedule = normalizeSchedule({
    id: editId || newId("bh"),
    name,
    openTime,
    closeTime,
    fromDate,
    toDate,
    fromDay,
    toDay,
    activeDays: selectedDays,
  });

  const schedules = readBusinessHourSchedules();
  const idx = schedules.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) schedules[idx] = schedule;
  else schedules.push(schedule);
  writeBusinessHourSchedules(schedules);
  hideScheduleDialog(panel);
  refreshAllBusinessHoursPanels();
}

function removeSchedule(panel: HTMLElement, scheduleId: string): void {
  writeBusinessHourSchedules(readBusinessHourSchedules().filter((s) => s.id !== scheduleId));
  const next = readBusinessHourExceptions().map((e) => ({
    ...e,
    scheduleIds: e.scheduleIds.filter((id) => id !== scheduleId),
  }));
  writeBusinessHourExceptions(next);
  refreshAllBusinessHoursPanels();
}

type BusinessHourDeleteKind = "schedule" | "exception";

function openDeleteConfirmDialog(
  panel: HTMLElement,
  kind: BusinessHourDeleteKind,
  targetId: string,
  dialogTitle: string,
  message: string,
): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-delete-dialog]");
  const kindInput = panel.querySelector<HTMLInputElement>("[data-business-hour-delete-kind]");
  const idInput = panel.querySelector<HTMLInputElement>("[data-business-hour-delete-target-id]");
  const title = panel.querySelector<HTMLElement>("[data-business-hour-delete-dialog-title]");
  const messageEl = panel.querySelector<HTMLElement>("[data-business-hour-delete-message]");
  if (kindInput) kindInput.value = kind;
  if (idInput) idInput.value = targetId;
  if (title) title.textContent = dialogTitle;
  if (messageEl) messageEl.textContent = message;
  showDialog(dialog);
}

function hideDeleteConfirmDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-delete-dialog]");
  const kindInput = panel.querySelector<HTMLInputElement>("[data-business-hour-delete-kind]");
  const idInput = panel.querySelector<HTMLInputElement>("[data-business-hour-delete-target-id]");
  if (kindInput) kindInput.value = "";
  if (idInput) idInput.value = "";
  hideDialog(dialog);
}

function confirmDelete(panel: HTMLElement): void {
  const kind = panel.querySelector<HTMLInputElement>("[data-business-hour-delete-kind]")?.value as
    | BusinessHourDeleteKind
    | "";
  const targetId = panel.querySelector<HTMLInputElement>("[data-business-hour-delete-target-id]")?.value.trim();
  if (!kind || !targetId) return;
  if (kind === "schedule") removeSchedule(panel, targetId);
  else removeException(panel, targetId);
  hideDeleteConfirmDialog(panel);
}

function openDeleteScheduleDialog(panel: HTMLElement, scheduleId: string, scheduleName: string): void {
  const label = scheduleName ? `「${scheduleName}」` : "该营业时间";
  openDeleteConfirmDialog(
    panel,
    "schedule",
    scheduleId,
    "删除营业时间",
    `确定删除${label}？删除后无法恢复。`,
  );
}

function openDeleteExceptionDialog(panel: HTMLElement, exception: StoreBusinessHourException): void {
  const modeLabel = formatExceptionModeLabel(exception.mode);
  const dateRange = formatDateRange(exception.fromDate, exception.toDate);
  const label = exception.name ? `「${exception.name}」` : "该额外时间";
  openDeleteConfirmDialog(
    panel,
    "exception",
    exception.id,
    "删除额外时间",
    `确定删除${label}（${dateRange}，${modeLabel}）？删除后无法恢复。`,
  );
}

function syncExceptionDialogMvpCardUi(panel: HTMLElement, fromScheduleCard: boolean): void {
  const hideSimplified = isMvpProductVersion() && fromScheduleCard;
  panel.querySelector<HTMLElement>("[data-business-hour-exception-name-field]")?.classList.toggle(
    "hidden",
    hideSimplified,
  );
  panel.querySelector<HTMLElement>("[data-business-hour-exception-time-fields]")?.classList.toggle(
    "hidden",
    hideSimplified,
  );
  panel.querySelector<HTMLElement>("[data-business-hour-exception-weekly-repeat]")?.classList.toggle(
    "hidden",
    hideSimplified,
  );
  panel.querySelector<HTMLElement>("[data-business-hour-exception-date-range]")?.classList.toggle(
    "hidden",
    hideSimplified,
  );
  panel.querySelector<HTMLElement>("[data-business-hour-exception-single-date-field]")?.classList.toggle(
    "hidden",
    !hideSimplified,
  );
  panel.dataset.exceptionMvpCardSimplified = hideSimplified ? "1" : "0";
  syncExceptionDateSectionLabel(panel);
}

function syncExceptionDateSectionLabel(panel: HTMLElement): void {
  const mode = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-mode]:checked")?.value;
  const label = panel.querySelector<HTMLElement>("[data-business-hour-exception-date-section-label]");
  if (label) label.textContent = mode === "exclude" ? "不生效日期" : "生效日期";
}

function syncExceptionRangeFromSingleDate(panel: HTMLElement): void {
  const single = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-single-date]");
  const fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-from-date]");
  const toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-to-date]");
  const value = single?.value || currentDate();
  if (fromDate) fromDate.value = value;
  if (toDate) toDate.value = value;
}

function resetExceptionDialog(panel: HTMLElement, sourceSchedule?: StoreBusinessHourSchedule): void {
  const today = currentDate();
  const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-edit-id]");
  const title = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog-title]");
  if (editId) editId.value = "";
  if (title) title.textContent = "新增额外时间";
  const name = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-name]");
  const open = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-open]");
  const close = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-close]");
  const fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-from-date]");
  const toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-to-date]");
  const fromCard = !!sourceSchedule;
  const mvpCard = isMvpProductVersion() && fromCard;
  if (name) name.value = mvpCard ? "额外时间" : "";
  if (open) open.value = sourceSchedule?.openTime || "09:00";
  if (close) close.value = sourceSchedule?.closeTime || "22:00";
  if (fromDate) fromDate.value = today;
  if (toDate) toDate.value = today;
  const singleDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-single-date]");
  if (singleDate) singleDate.value = today;
  panel.querySelectorAll<HTMLInputElement>("[data-business-hour-exception-mode]").forEach((input, idx) => {
    input.checked = idx === 0;
  });
  const defaultDays = sourceSchedule
    ? getScheduleActiveDays(sourceSchedule)
    : new Set<StoreBusinessHourDay>(["mon", "tue", "wed", "thu", "fri"]);
  setSelectedDays(panel, defaultDays, EXCEPTION_DAY_CHIP_ATTR);
  // 从营业时间卡片进入：锁定为当前规则；额外时间设置入口：可多选
  fillExceptionScheduleCheckboxes(
    panel,
    sourceSchedule ? new Set([sourceSchedule.id]) : new Set(),
    sourceSchedule ? { lockedScheduleId: sourceSchedule.id } : undefined,
  );
  setExceptionDialogError(panel, "");
  syncExceptionDialogMvpCardUi(panel, fromCard);
}

function openExceptionDialog(
  panel: HTMLElement,
  exception?: StoreBusinessHourException,
  sourceScheduleId?: string,
): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog]");
  const schedules = readBusinessHourSchedules();
  const sourceSchedule = sourceScheduleId ? schedules.find((s) => s.id === sourceScheduleId) : undefined;
  const fromScheduleCard = !!sourceScheduleId;
  resetExceptionDialog(panel, sourceSchedule);
  if (exception) {
    const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-edit-id]");
    const title = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog-title]");
    if (editId) editId.value = exception.id;
    if (title) title.textContent = "编辑额外时间";
    const name = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-name]");
    const open = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-open]");
    const close = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-close]");
    const fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-from-date]");
    const toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-to-date]");
    if (name) name.value = exception.name;
    if (open) open.value = exception.openTime;
    if (close) close.value = exception.closeTime;
    if (fromDate) fromDate.value = exception.fromDate;
    if (toDate) toDate.value = exception.toDate;
    const singleDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-single-date]");
    if (singleDate) singleDate.value = exception.fromDate;
    panel.querySelectorAll<HTMLInputElement>("[data-business-hour-exception-mode]").forEach((input) => {
      input.checked = input.value === exception.mode;
    });
    setSelectedDays(panel, getScheduleActiveDays(exception), EXCEPTION_DAY_CHIP_ATTR);
    const validIds = new Set(schedules.map((s) => s.id));
    if (sourceScheduleId && validIds.has(sourceScheduleId)) {
      // 从营业时间卡片进入编辑：锁定为当前规则，不可改选
      fillExceptionScheduleCheckboxes(panel, new Set([sourceScheduleId]), {
        lockedScheduleId: sourceScheduleId,
      });
    } else {
      // 额外时间设置入口：可多选
      fillExceptionScheduleCheckboxes(
        panel,
        new Set(sanitizeExceptionScheduleIds(exception.scheduleIds, validIds)),
      );
    }
  }
  syncExceptionDialogMvpCardUi(panel, fromScheduleCard);
  showDialog(dialog);
  const mvpCard = isMvpProductVersion() && fromScheduleCard;
  if (mvpCard) {
    panel.querySelector<HTMLInputElement>("[data-business-hour-exception-single-date]")?.focus();
  } else {
    panel.querySelector<HTMLInputElement>("[data-business-hour-exception-name]")?.focus();
  }
}

function hideExceptionDialog(panel: HTMLElement): void {
  hideDialog(panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog]"));
}

function saveExceptionDialog(panel: HTMLElement): void {
  const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-edit-id]")?.value.trim();
  const mvpCardSimplified = panel.dataset.exceptionMvpCardSimplified === "1";
  let name = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-name]")?.value.trim() || "";
  const openTime = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-open]")?.value || "09:00";
  const closeTime = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-close]")?.value || "22:00";
  if (mvpCardSimplified) syncExceptionRangeFromSingleDate(panel);
  let fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-from-date]")?.value ?? "";
  let toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-to-date]")?.value ?? "";
  const modeInput = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-mode]:checked");
  let selectedDays = [...getSelectedDays(panel, EXCEPTION_DAY_CHIP_ATTR)];
  const schedules = readBusinessHourSchedules();
  const validIds = new Set(schedules.map((s) => s.id));
  const scheduleIds = sanitizeExceptionScheduleIds(getSelectedExceptionScheduleIds(panel), validIds);

  if (mvpCardSimplified) {
    if (!name) name = "额外时间";
    if (selectedDays.length === 0 && scheduleIds[0]) {
      const src = schedules.find((s) => s.id === scheduleIds[0]);
      if (src) selectedDays = [...getScheduleActiveDays(src)];
    }
    if (selectedDays.length === 0) {
      selectedDays = ["mon", "tue", "wed", "thu", "fri"];
    }
    // 单日生效：起止同一天
    if (isIsoDate(fromDate)) {
      toDate = fromDate;
    }
  } else if (!name) {
    setExceptionDialogError(panel, "请填写名称");
    panel.querySelector<HTMLInputElement>("[data-business-hour-exception-name]")?.focus();
    return;
  }
  if (!isIsoDate(fromDate) || !isIsoDate(toDate)) {
    const dateLabel = modeInput?.value === "exclude" ? "不生效日期" : "生效日期";
    setExceptionDialogError(
      panel,
      mvpCardSimplified ? `请选择${dateLabel}` : `请选择有效的${dateLabel}`,
    );
    if (mvpCardSimplified) {
      panel.querySelector<HTMLInputElement>("[data-business-hour-exception-single-date]")?.focus();
    }
    return;
  }
  if (!mvpCardSimplified && fromDate > toDate) {
    setExceptionDialogError(panel, "结束日期不能早于开始日期");
    return;
  }
  if (selectedDays.length === 0) {
    setExceptionDialogError(panel, "请至少选择一天");
    return;
  }
  if (openTime >= closeTime) {
    setExceptionDialogError(panel, "结束时间应晚于开始时间");
    return;
  }
  if (scheduleIds.length === 0) {
    setExceptionDialogError(panel, "请至少选择一条营业时间");
    return;
  }

  const mode: StoreBusinessHourExceptionMode = modeInput?.value === "exclude" ? "exclude" : "include";
  const { fromDay, toDay } = deriveFromToDays(selectedDays);
  const exception = normalizeException({
    id: editId || newId("bhx"),
    name,
    openTime,
    closeTime,
    fromDate,
    toDate,
    fromDay,
    toDay,
    activeDays: selectedDays,
    mode,
    scheduleIds,
  });
  if (!exception) return;

  const withoutCurrent = readBusinessHourExceptionsForDisplay(schedules).filter((e) => e.id !== exception.id);
  const duplicate = withoutCurrent.find(
    (e) =>
      e.name === exception.name &&
      e.fromDate === exception.fromDate &&
      e.toDate === exception.toDate &&
      e.openTime === exception.openTime &&
      e.closeTime === exception.closeTime &&
      e.mode === exception.mode &&
      formatActiveDaysLabel(getScheduleActiveDays(e)) === formatActiveDaysLabel(getScheduleActiveDays(exception)) &&
      [...e.scheduleIds].sort().join(",") === [...exception.scheduleIds].sort().join(","),
  );
  if (duplicate) {
    setExceptionDialogError(panel, "相同规则已存在");
    return;
  }

  withoutCurrent.push(exception);
  withoutCurrent.sort((a, b) => a.fromDate.localeCompare(b.fromDate) || a.name.localeCompare(b.name));
  writeBusinessHourExceptions(withoutCurrent);
  hideExceptionDialog(panel);
  refreshAllBusinessHoursPanels();
}

function removeException(panel: HTMLElement, exceptionId: string): void {
  writeBusinessHourExceptions(readBusinessHourExceptions().filter((e) => e.id !== exceptionId));
  refreshAllBusinessHoursPanels();
}

function toggleDayChip(chip: HTMLButtonElement): void {
  const on = chip.getAttribute("aria-pressed") !== "true";
  chip.setAttribute("aria-pressed", on ? "true" : "false");
  chip.className = `inline-flex h-9 min-w-[2.5rem] items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    on
      ? "border-primary bg-primary text-primary-foreground shadow-sm"
      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
  }`;
}

export function bindStoreBusinessHoursControls(): void {
  document.querySelectorAll<HTMLElement>("[data-store-business-hours-panel]").forEach((panel) => {
    if (panel.dataset.storeBusinessHoursBound === "1") return;
    panel.dataset.storeBusinessHoursBound = "1";
    syncScheduleDialogVersionUi(panel);

    panel.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (target.matches("[data-business-hour-exception-mode]")) {
        syncExceptionDateSectionLabel(panel);
      }
    });

    panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest("[data-business-hour-create-toggle]")) {
        openScheduleDialog(panel);
        return;
      }
      if (
        target.closest("[data-business-hour-schedule-cancel]") ||
        target.closest("[data-business-hour-schedule-dialog-backdrop]")
      ) {
        hideScheduleDialog(panel);
        return;
      }
      if (target.closest("[data-business-hour-schedule-save]")) {
        saveScheduleDialog(panel);
        return;
      }
      if (target.closest("[data-business-hour-schedule-day-select-all]")) {
        setSelectedDays(panel, new Set(WEEK_DAYS_MON_FIRST), SCHEDULE_DAY_CHIP_ATTR);
        return;
      }
      if (target.closest("[data-business-hour-schedule-day-select-weekdays]")) {
        setSelectedDays(panel, new Set(["mon", "tue", "wed", "thu", "fri"]), SCHEDULE_DAY_CHIP_ATTR);
        return;
      }
      if (target.closest("[data-business-hour-exception-day-select-all]")) {
        setSelectedDays(panel, new Set(WEEK_DAYS_MON_FIRST), EXCEPTION_DAY_CHIP_ATTR);
        return;
      }
      if (target.closest("[data-business-hour-exception-day-select-weekdays]")) {
        setSelectedDays(panel, new Set(["mon", "tue", "wed", "thu", "fri"]), EXCEPTION_DAY_CHIP_ATTR);
        return;
      }

      const scheduleDayChip = target.closest<HTMLButtonElement>(`[${SCHEDULE_DAY_CHIP_ATTR}]`);
      if (scheduleDayChip) {
        toggleDayChip(scheduleDayChip);
        return;
      }
      const exceptionDayChip = target.closest<HTMLButtonElement>(`[${EXCEPTION_DAY_CHIP_ATTR}]`);
      if (exceptionDayChip) {
        toggleDayChip(exceptionDayChip);
        return;
      }

      const editScheduleBtn = target.closest("[data-business-hour-schedule-edit]");
      if (editScheduleBtn) {
        const row = editScheduleBtn.closest<HTMLElement>("[data-business-hour-schedule]");
        const scheduleId = row?.getAttribute("data-schedule-id");
        const schedule = readBusinessHourSchedules().find((s) => s.id === scheduleId);
        if (schedule) openScheduleDialog(panel, schedule);
        return;
      }

      const removeScheduleBtn = target.closest("[data-business-hour-schedule-remove]");
      if (removeScheduleBtn) {
        const row = removeScheduleBtn.closest<HTMLElement>("[data-business-hour-schedule]");
        const scheduleId = row?.getAttribute("data-schedule-id");
        if (!scheduleId) return;
        const schedule = readBusinessHourSchedules().find((s) => s.id === scheduleId);
        openDeleteScheduleDialog(panel, scheduleId, schedule?.name ?? "");
        return;
      }

      if (
        target.closest("[data-business-hour-delete-cancel]") ||
        target.closest("[data-business-hour-delete-dialog-backdrop]")
      ) {
        hideDeleteConfirmDialog(panel);
        return;
      }
      if (target.closest("[data-business-hour-delete-confirm]")) {
        confirmDelete(panel);
        return;
      }

      const createExceptionBtn = target.closest<HTMLElement>("[data-business-hour-exception-create]");
      if (createExceptionBtn) {
        const sourceScheduleId = createExceptionBtn.getAttribute("data-source-schedule-id") || undefined;
        openExceptionDialog(panel, undefined, sourceScheduleId);
        return;
      }
      if (
        target.closest("[data-business-hour-exception-cancel]") ||
        target.closest("[data-business-hour-exception-dialog-backdrop]")
      ) {
        hideExceptionDialog(panel);
        return;
      }
      if (target.closest("[data-business-hour-exception-save]")) {
        saveExceptionDialog(panel);
        return;
      }

      const editExceptionBtn = target.closest("[data-business-hour-exception-edit]");
      if (editExceptionBtn) {
        const row = editExceptionBtn.closest<HTMLElement>("[data-business-hour-exception]");
        const exceptionId = row?.getAttribute("data-exception-id");
        const exception = readBusinessHourExceptionsForDisplay().find((e) => e.id === exceptionId);
        const scheduleCard = editExceptionBtn.closest<HTMLElement>("[data-business-hour-schedule]");
        const sourceScheduleId = scheduleCard?.getAttribute("data-schedule-id") || undefined;
        if (exception) openExceptionDialog(panel, exception, sourceScheduleId);
        return;
      }

      const removeExceptionBtn = target.closest("[data-business-hour-exception-remove]");
      if (removeExceptionBtn) {
        const row = removeExceptionBtn.closest<HTMLElement>("[data-business-hour-exception]");
        const exceptionId = row?.getAttribute("data-exception-id");
        if (!exceptionId) return;
        const exception = readBusinessHourExceptionsForDisplay().find((e) => e.id === exceptionId);
        if (exception) openDeleteExceptionDialog(panel, exception);
      }
    });

    panel.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      const deleteDialog = panel.querySelector<HTMLElement>("[data-business-hour-delete-dialog]");
      const scheduleDialog = panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog]");
      const exceptionDialog = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog]");
      if (deleteDialog && !deleteDialog.classList.contains("hidden")) {
        ev.preventDefault();
        hideDeleteConfirmDialog(panel);
        return;
      }
      if (scheduleDialog && !scheduleDialog.classList.contains("hidden")) {
        ev.preventDefault();
        hideScheduleDialog(panel);
        return;
      }
      if (exceptionDialog && !exceptionDialog.classList.contains("hidden")) {
        ev.preventDefault();
        hideExceptionDialog(panel);
      }
    });
  });

  if (typeof document !== "undefined" && document.documentElement.dataset.businessHoursVersionBound !== "1") {
    document.documentElement.dataset.businessHoursVersionBound = "1";
    window.addEventListener("menusifu:product-version-change", () => {
      document.querySelectorAll<HTMLElement>("[data-store-business-hours-panel]").forEach((panel) => {
        syncScheduleDialogVersionUi(panel);
        const locked = panel
          .querySelector<HTMLInputElement>("[data-business-hour-exception-locked-schedule-id]")
          ?.value.trim();
        syncExceptionDialogMvpCardUi(panel, !!locked);
        refreshPanelBody(panel);
      });
    });
  }
}
