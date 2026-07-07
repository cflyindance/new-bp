/**
 * 门店管理 · 营业与运营：营业时间库 + 额外时间（指定日期生效/不生效）。
 * seq 418；数据原型 localStorage JSON。
 */

import {
  readModuleSettingJson,
  readModuleSettingText,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const STORE_BUSINESS_HOURS_SEQ = 418;

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
  /** YYYY-MM-DD */
  date: string;
  /** include=该日生效；exclude=该日不生效 */
  mode: StoreBusinessHourExceptionMode;
  /** 关联营业时间；省略表示全部规则 */
  scheduleId?: string;
  note?: string;
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

function normalizeException(raw: Partial<StoreBusinessHourException>): StoreBusinessHourException | null {
  if (!raw.id || !raw.date || !isIsoDate(raw.date)) return null;
  const mode = raw.mode === "exclude" ? "exclude" : "include";
  return {
    id: raw.id,
    date: raw.date,
    mode,
    scheduleId: raw.scheduleId?.trim() || undefined,
    note: raw.note?.trim() || undefined,
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
        id: newId("bh"),
        name: "All Day",
        openTime: "00:00",
        closeTime: "23:50",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
      normalizeSchedule({
        id: newId("bh"),
        name: "早上",
        openTime: "06:00",
        closeTime: "11:00",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
      normalizeSchedule({
        id: newId("bh"),
        name: "中午",
        openTime: "11:00",
        closeTime: "16:00",
        fromDate,
        toDate,
        fromDay: "sun",
        toDay: "sat",
      }),
      normalizeSchedule({
        id: newId("bh"),
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
      id: newId("bh"),
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
  if (!Array.isArray(raw) || raw.length === 0) return defaultSchedulesFromLegacy();
  return raw.filter((s) => s?.id && s?.name).map((s) => normalizeSchedule(s));
}

export function writeBusinessHourSchedules(schedules: StoreBusinessHourSchedule[]): void {
  writeModuleSettingJson(STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID, schedules);
}

export function readBusinessHourExceptions(): StoreBusinessHourException[] {
  const raw = readModuleSettingJson<StoreBusinessHourException[]>(STORE_BUSINESS_HOUR_EXCEPTIONS_FIELD_ID, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeException(item))
    .filter((item): item is StoreBusinessHourException => item != null)
    .sort((a, b) => a.date.localeCompare(b.date));
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

export function getScheduleActiveDays(schedule: StoreBusinessHourSchedule): Set<StoreBusinessHourDay> {
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

function renderScheduleDayBadges(schedule: StoreBusinessHourSchedule): string {
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

function scheduleNameById(scheduleId: string | undefined, schedules: StoreBusinessHourSchedule[]): string {
  if (!scheduleId) return "全部营业时间";
  return schedules.find((s) => s.id === scheduleId)?.name ?? "已删除规则";
}

function formatExceptionModeLabel(mode: StoreBusinessHourExceptionMode): string {
  return mode === "include" ? "该日生效" : "该日不生效";
}

function exceptionModeBadgeClass(mode: StoreBusinessHourExceptionMode): string {
  return mode === "include"
    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400"
    : "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400";
}

function renderScheduleCard(schedule: StoreBusinessHourSchedule): string {
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
            <span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">
              ${escapeHtml(formatDateRange(schedule.fromDate, schedule.toDate))}
            </span>
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
    </li>`;
}

function renderExceptionCard(
  exception: StoreBusinessHourException,
  schedules: StoreBusinessHourSchedule[],
): string {
  const scheduleLabel = scheduleNameById(exception.scheduleId, schedules);
  return `
    <li
      class="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      data-business-hour-exception
      data-exception-id="${escapeHtml(exception.id)}"
    >
      <div class="min-w-0 space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold tabular-nums text-foreground">${escapeHtml(exception.date)}</span>
          <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${exceptionModeBadgeClass(exception.mode)}">
            ${escapeHtml(formatExceptionModeLabel(exception.mode))}
          </span>
        </div>
        <p class="text-xs text-muted-foreground">
          关联：<span class="text-foreground">${escapeHtml(scheduleLabel)}</span>
          ${exception.note ? ` · ${escapeHtml(exception.note)}` : ""}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="${BTN_ICON}"
          data-business-hour-exception-edit
          aria-label="编辑额外时间 ${escapeHtml(exception.date)}"
          title="编辑"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button
          type="button"
          class="${BTN_ICON} hover:text-destructive"
          data-business-hour-exception-remove
          aria-label="删除额外时间 ${escapeHtml(exception.date)}"
          title="删除"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          </svg>
        </button>
      </div>
    </li>`;
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
          <p class="mt-1 text-xs text-muted-foreground">设置时段、生效日期与每周重复规则</p>
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
            <div>
              <p class="${LABEL_CLASS}">生效日期</p>
              <p class="${HINT_CLASS} mt-0.5">规则在以下日期区间内重复生效</p>
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
            <div class="space-y-2 border-t border-border pt-4">
              <div class="flex items-center justify-between gap-2">
                <p class="${LABEL_CLASS}">每周重复</p>
                <div class="flex gap-1">
                  <button type="button" class="text-xs text-primary hover:underline" data-business-hour-day-select-all>全选</button>
                  <span class="text-muted-foreground">·</span>
                  <button type="button" class="text-xs text-primary hover:underline" data-business-hour-day-select-weekdays>工作日</button>
                </div>
              </div>
              ${renderDayChipSelector(defaultDays, "data-business-hour-day-chip")}
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

function renderExceptionScheduleOptions(schedules: StoreBusinessHourSchedule[], selectedId?: string): string {
  const options = [
    `<option value="">全部营业时间</option>`,
    ...schedules.map(
      (s) =>
        `<option value="${escapeHtml(s.id)}"${selectedId === s.id ? " selected" : ""}>${escapeHtml(s.name)}</option>`,
    ),
  ];
  return options.join("");
}

function renderExceptionDialog(schedules: StoreBusinessHourSchedule[]): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-business-hour-exception-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hour-exception-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-business-hour-exception-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="business-hour-exception-dialog-title" class="text-base font-semibold text-card-foreground" data-business-hour-exception-dialog-title>新增额外时间</h3>
          <p class="mt-1 text-xs text-muted-foreground">指定某一天覆盖常规营业时间规则</p>
        </div>
        <div class="space-y-4 px-5 py-4">
          <input type="hidden" data-business-hour-exception-edit-id value="" />
          <div class="space-y-1.5">
            <label class="${LABEL_CLASS}" for="business-hour-exception-date">日期</label>
            <input id="business-hour-exception-date" type="date" class="${INPUT_CLASS} tabular-nums" data-business-hour-exception-date value="${escapeHtml(currentDate())}" />
          </div>
          <fieldset class="space-y-2">
            <legend class="${LABEL_CLASS}">规则类型</legend>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" name="business-hour-exception-mode" value="include" class="mt-0.5 accent-primary" data-business-hour-exception-mode checked />
                <span>
                  <span class="block text-sm font-medium text-foreground">该日生效</span>
                  <span class="block text-xs text-muted-foreground">仅在选定日期启用对应营业时间</span>
                </span>
              </label>
              <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input type="radio" name="business-hour-exception-mode" value="exclude" class="mt-0.5 accent-primary" data-business-hour-exception-mode />
                <span>
                  <span class="block text-sm font-medium text-foreground">该日不生效</span>
                  <span class="block text-xs text-muted-foreground">选定日期暂停对应营业时间</span>
                </span>
              </label>
            </div>
          </fieldset>
          <div class="space-y-1.5">
            <label class="${LABEL_CLASS}" for="business-hour-exception-schedule">关联营业时间</label>
            <select id="business-hour-exception-schedule" class="${INPUT_CLASS}" data-business-hour-exception-schedule>
              ${renderExceptionScheduleOptions(schedules)}
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="${LABEL_CLASS}" for="business-hour-exception-note">备注（可选）</label>
            <input id="business-hour-exception-note" type="text" class="${INPUT_CLASS}" data-business-hour-exception-note placeholder="如：国庆节调休" />
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

function renderSchedulesSection(schedules: StoreBusinessHourSchedule[]): string {
  const list =
    schedules.length > 0
      ? `<ul class="grid gap-3 sm:grid-cols-1" data-business-hour-schedule-list>${schedules.map(renderScheduleCard).join("")}</ul>`
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

function renderExceptionsSection(
  exceptions: StoreBusinessHourException[],
  schedules: StoreBusinessHourSchedule[],
): string {
  const list =
    exceptions.length > 0
      ? `<ul class="space-y-2" data-business-hour-exception-list>${exceptions.map((e) => renderExceptionCard(e, schedules)).join("")}</ul>`
      : `<div class="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground" data-business-hour-exception-empty>
          暂无额外时间，可针对节假日或调休日单独设置生效/不生效
        </div>`;

  return `
    <section class="space-y-4 border-t border-border pt-6" data-business-hour-exceptions-section>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 class="${SECTION_HEAD_CLASS}">额外时间</h4>
          <p class="${HINT_CLASS} mt-0.5">指定某一天使营业时间生效或不生效</p>
        </div>
        <button type="button" class="${BTN_GHOST}" data-business-hour-exception-create>
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          新增
        </button>
      </div>
      ${list}
    </section>`;
}

function renderPanelBody(
  schedules: StoreBusinessHourSchedule[],
  exceptions: StoreBusinessHourException[],
): string {
  return `${renderSchedulesSection(schedules)}${renderExceptionsSection(exceptions, schedules)}`;
}

export function isStoreBusinessHoursSeq(seq: number): boolean {
  return seq === STORE_BUSINESS_HOURS_SEQ;
}

export function renderStoreBusinessHoursHtml(): string {
  const schedules = readBusinessHourSchedules();
  const exceptions = readBusinessHourExceptions();
  return `
    <div class="space-y-5" data-store-business-hours-panel>
      <div data-store-business-hours-body>${renderPanelBody(schedules, exceptions)}</div>
      ${renderScheduleDialog()}
      ${renderExceptionDialog(schedules)}
    </div>`;
}

function refreshPanelBody(panel: HTMLElement): void {
  const body = panel.querySelector<HTMLElement>("[data-store-business-hours-body]");
  if (!body) return;
  const schedules = readBusinessHourSchedules();
  const exceptions = readBusinessHourExceptions();
  body.innerHTML = renderPanelBody(schedules, exceptions);
  refreshExceptionDialogScheduleOptions(panel, schedules);
}

function refreshExceptionDialogScheduleOptions(
  panel: HTMLElement,
  schedules: StoreBusinessHourSchedule[],
): void {
  const select = panel.querySelector<HTMLSelectElement>("[data-business-hour-exception-schedule]");
  if (!select) return;
  const current = select.value;
  select.innerHTML = renderExceptionScheduleOptions(
    schedules,
    schedules.some((s) => s.id === current) ? current : undefined,
  );
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

function getSelectedDays(panel: HTMLElement): Set<StoreBusinessHourDay> {
  const out = new Set<StoreBusinessHourDay>();
  panel.querySelectorAll<HTMLButtonElement>("[data-business-hour-day-chip]").forEach((btn) => {
    if (btn.getAttribute("aria-pressed") === "true") {
      const rawDay = btn.getAttribute("data-business-hour-day-chip");
      if (rawDay && isValidDay(rawDay)) out.add(rawDay);
    }
  });
  return out;
}

function setSelectedDays(panel: HTMLElement, days: Set<StoreBusinessHourDay>): void {
  panel.querySelectorAll<HTMLButtonElement>("[data-business-hour-day-chip]").forEach((btn) => {
    const rawDay = btn.getAttribute("data-business-hour-day-chip");
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

function resetScheduleDialog(panel: HTMLElement): void {
  const today = currentDate();
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
  if (fromDate) fromDate.value = today;
  if (toDate) toDate.value = today;
  setSelectedDays(panel, new Set(["mon", "tue", "wed", "thu", "fri"]));
  setScheduleDialogError(panel, "");
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
    setSelectedDays(panel, getScheduleActiveDays(schedule));
  }
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
  const fromDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-from-date]")?.value ?? "";
  const toDate = panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-to-date]")?.value ?? "";
  const selectedDays = [...getSelectedDays(panel)];

  if (!name) {
    setScheduleDialogError(panel, "请填写名称");
    panel.querySelector<HTMLInputElement>("[data-business-hour-schedule-name]")?.focus();
    return;
  }
  if (!isIsoDate(fromDate) || !isIsoDate(toDate)) {
    setScheduleDialogError(panel, "请选择有效的生效日期");
    return;
  }
  if (fromDate > toDate) {
    setScheduleDialogError(panel, "结束日期不能早于开始日期");
    return;
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
  refreshPanelBody(panel);
}

function removeSchedule(panel: HTMLElement, scheduleId: string): void {
  writeBusinessHourSchedules(readBusinessHourSchedules().filter((s) => s.id !== scheduleId));
  writeBusinessHourExceptions(
    readBusinessHourExceptions().map((e) =>
      e.scheduleId === scheduleId ? { ...e, scheduleId: undefined } : e,
    ),
  );
  refreshPanelBody(panel);
}

function resetExceptionDialog(panel: HTMLElement): void {
  const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-edit-id]");
  const title = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog-title]");
  if (editId) editId.value = "";
  if (title) title.textContent = "新增额外时间";
  const date = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-date]");
  const note = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-note]");
  const schedule = panel.querySelector<HTMLSelectElement>("[data-business-hour-exception-schedule]");
  if (date) date.value = currentDate();
  if (note) note.value = "";
  if (schedule) schedule.value = "";
  panel.querySelectorAll<HTMLInputElement>("[data-business-hour-exception-mode]").forEach((input, idx) => {
    input.checked = idx === 0;
  });
  setExceptionDialogError(panel, "");
}

function openExceptionDialog(panel: HTMLElement, exception?: StoreBusinessHourException): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog]");
  resetExceptionDialog(panel);
  refreshExceptionDialogScheduleOptions(panel, readBusinessHourSchedules());
  if (exception) {
    const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-edit-id]");
    const title = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog-title]");
    if (editId) editId.value = exception.id;
    if (title) title.textContent = "编辑额外时间";
    const date = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-date]");
    const note = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-note]");
    const schedule = panel.querySelector<HTMLSelectElement>("[data-business-hour-exception-schedule]");
    if (date) date.value = exception.date;
    if (note) note.value = exception.note ?? "";
    if (schedule) schedule.value = exception.scheduleId ?? "";
    panel.querySelectorAll<HTMLInputElement>("[data-business-hour-exception-mode]").forEach((input) => {
      input.checked = input.value === exception.mode;
    });
  }
  showDialog(dialog);
  panel.querySelector<HTMLInputElement>("[data-business-hour-exception-date]")?.focus();
}

function hideExceptionDialog(panel: HTMLElement): void {
  hideDialog(panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog]"));
}

function saveExceptionDialog(panel: HTMLElement): void {
  const editId = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-edit-id]")?.value.trim();
  const date = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-date]")?.value ?? "";
  const modeInput = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-mode]:checked");
  const scheduleId = panel.querySelector<HTMLSelectElement>("[data-business-hour-exception-schedule]")?.value.trim();
  const note = panel.querySelector<HTMLInputElement>("[data-business-hour-exception-note]")?.value.trim();

  if (!isIsoDate(date)) {
    setExceptionDialogError(panel, "请选择有效日期");
    return;
  }

  const mode: StoreBusinessHourExceptionMode = modeInput?.value === "exclude" ? "exclude" : "include";
  const exception: StoreBusinessHourException = {
    id: editId || newId("bhx"),
    date,
    mode,
    scheduleId: scheduleId || undefined,
    note: note || undefined,
  };

  const exceptions = readBusinessHourExceptions().filter((e) => e.id !== exception.id);
  const duplicate = exceptions.find(
    (e) => e.date === exception.date && e.mode === exception.mode && (e.scheduleId ?? "") === (exception.scheduleId ?? ""),
  );
  if (duplicate) {
    setExceptionDialogError(panel, "相同日期与规则已存在");
    return;
  }

  exceptions.push(exception);
  exceptions.sort((a, b) => a.date.localeCompare(b.date));
  writeBusinessHourExceptions(exceptions);
  hideExceptionDialog(panel);
  refreshPanelBody(panel);
}

function removeException(panel: HTMLElement, exceptionId: string): void {
  writeBusinessHourExceptions(readBusinessHourExceptions().filter((e) => e.id !== exceptionId));
  refreshPanelBody(panel);
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
      if (target.closest("[data-business-hour-day-select-all]")) {
        setSelectedDays(panel, new Set(WEEK_DAYS_MON_FIRST));
        return;
      }
      if (target.closest("[data-business-hour-day-select-weekdays]")) {
        setSelectedDays(panel, new Set(["mon", "tue", "wed", "thu", "fri"]));
        return;
      }

      const dayChip = target.closest<HTMLButtonElement>("[data-business-hour-day-chip]");
      if (dayChip) {
        toggleDayChip(dayChip);
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
        if (scheduleId) removeSchedule(panel, scheduleId);
        return;
      }

      if (target.closest("[data-business-hour-exception-create]")) {
        openExceptionDialog(panel);
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
        const exception = readBusinessHourExceptions().find((e) => e.id === exceptionId);
        if (exception) openExceptionDialog(panel, exception);
        return;
      }

      const removeExceptionBtn = target.closest("[data-business-hour-exception-remove]");
      if (removeExceptionBtn) {
        const row = removeExceptionBtn.closest<HTMLElement>("[data-business-hour-exception]");
        const exceptionId = row?.getAttribute("data-exception-id");
        if (exceptionId) removeException(panel, exceptionId);
      }
    });

    panel.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      const scheduleDialog = panel.querySelector<HTMLElement>("[data-business-hour-schedule-dialog]");
      const exceptionDialog = panel.querySelector<HTMLElement>("[data-business-hour-exception-dialog]");
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
}
