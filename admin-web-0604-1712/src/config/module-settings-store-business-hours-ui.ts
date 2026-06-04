/**
 * 门店管理 · 营业与运营：营业时间库（对话框新建 + 列表管理）。
 * seq 418；生效范围含年月段、星期段与时间段；数据原型 localStorage JSON。
 */

import { renderModuleSettingInlineSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingText,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const STORE_BUSINESS_HOURS_SEQ = 418;

export const STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID = "418-business-hour-schedules";

/** @deprecated 原型曾写入 417/418 纯文本 */
const LEGACY_BUSINESS_HOURS_TEXT_FIELD_IDS = ["418-business-hours", "417-business-hours"];

export type StoreBusinessHourDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type StoreBusinessHourSchedule = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  /** YYYY-MM */
  fromMonth: string;
  /** YYYY-MM */
  toMonth: string;
  fromDay: StoreBusinessHourDay;
  toDay: StoreBusinessHourDay;
};

export const STORE_BUSINESS_HOUR_DAYS: { day: StoreBusinessHourDay; label: string }[] = [
  { day: "mon", label: "周一" },
  { day: "tue", label: "周二" },
  { day: "wed", label: "周三" },
  { day: "thu", label: "周四" },
  { day: "fri", label: "周五" },
  { day: "sat", label: "周六" },
  { day: "sun", label: "周日" },
];

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_LINK =
  "inline-flex shrink-0 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SECTION_HEAD_CLASS =
  "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const SUBSECTION_CLASS = "text-xs font-medium text-muted-foreground";

const LABEL_CLASS = "block text-sm font-medium text-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newScheduleId(): string {
  return `bh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

function isYearMonth(s: string | undefined): boolean {
  return !!s && /^\d{4}-\d{2}$/.test(s);
}

/** 从旧版 YYYY-MM-DD 或 YYYY-MM 字段归一化 */
function normalizeMonthValue(value: string | undefined): string {
  if (!value) return "";
  if (isYearMonth(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  return "";
}

function normalizeSchedule(raw: Partial<StoreBusinessHourSchedule> & { fromDate?: string; toDate?: string; rangeType?: string }): StoreBusinessHourSchedule {
  const legacy = raw as { fromDate?: string; toDate?: string };
  let fromMonth = normalizeMonthValue(raw.fromMonth) || normalizeMonthValue(legacy.fromDate);
  let toMonth = normalizeMonthValue(raw.toMonth) || normalizeMonthValue(legacy.toDate);
  if (!fromMonth) fromMonth = currentMonth();
  if (!toMonth) toMonth = fromMonth;
  return {
    id: raw.id!,
    name: raw.name!,
    openTime: raw.openTime || "09:00",
    closeTime: raw.closeTime || "22:00",
    fromMonth,
    toMonth,
    fromDay: normalizeDay(raw.fromDay, "mon"),
    toDay: normalizeDay(raw.toDay, "fri"),
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
  const month = currentMonth();
  const legacy = readLegacyBusinessHoursText();
  if (!legacy) {
    return [
      normalizeSchedule({
        id: newScheduleId(),
        name: "平日营业",
        openTime: "11:00",
        closeTime: "22:00",
        fromMonth: month,
        toMonth: month,
        fromDay: "mon",
        toDay: "fri",
      }),
      normalizeSchedule({
        id: newScheduleId(),
        name: "周末营业",
        openTime: "10:00",
        closeTime: "23:00",
        fromMonth: month,
        toMonth: month,
        fromDay: "sat",
        toDay: "sun",
      }),
    ];
  }
  return [
    normalizeSchedule({
      id: newScheduleId(),
      name: "默认营业时间",
      openTime: "09:00",
      closeTime: "22:00",
      fromMonth: month,
      toMonth: month,
      fromDay: "mon",
      toDay: "sun",
    }),
  ];
}

export function readBusinessHourSchedules(): StoreBusinessHourSchedule[] {
  const raw = readModuleSettingJson<(StoreBusinessHourSchedule & { fromDate?: string; toDate?: string })[]>(
    STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID,
    [],
  );
  if (!Array.isArray(raw) || raw.length === 0) return defaultSchedulesFromLegacy();
  return raw.filter((s) => s?.id && s?.name).map((s) => normalizeSchedule(s));
}

export function writeBusinessHourSchedules(schedules: StoreBusinessHourSchedule[]): void {
  writeModuleSettingJson(STORE_BUSINESS_HOUR_SCHEDULES_FIELD_ID, schedules);
}

function formatMonthRange(fromMonth: string, toMonth: string): string {
  if (fromMonth === toMonth) return fromMonth;
  return `${fromMonth} 至 ${toMonth}`;
}

function formatDayRange(fromDay: StoreBusinessHourDay, toDay: StoreBusinessHourDay): string {
  if (fromDay === toDay) return dayLabel(fromDay);
  return `${dayLabel(fromDay)}至${dayLabel(toDay)}`;
}

export function formatScheduleSummary(schedule: StoreBusinessHourSchedule): string {
  return `${formatMonthRange(schedule.fromMonth, schedule.toMonth)} · ${formatDayRange(schedule.fromDay, schedule.toDay)} · ${schedule.openTime}–${schedule.closeTime}`;
}

function renderDayChoice(
  selected: StoreBusinessHourDay,
  groupName: string,
  radioDataAttr: string,
): string {
  return renderModuleSettingInlineSingleChoiceHtml({
    options: STORE_BUSINESS_HOUR_DAYS.map((d) => ({ value: d.day, label: d.label })),
    groupName,
    currentValue: selected,
    radioDataAttr,
    layout: "wrap",
  });
}

function renderScheduleRow(schedule: StoreBusinessHourSchedule): string {
  return `
    <li
      class="flex flex-col gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
      data-business-hour-schedule
      data-schedule-id="${escapeHtml(schedule.id)}"
    >
      <div class="min-w-0">
        <p class="text-sm font-medium text-foreground">${escapeHtml(schedule.name)}</p>
        <p class="text-xs text-muted-foreground tabular-nums">${escapeHtml(formatScheduleSummary(schedule))}</p>
      </div>
      <button
        type="button"
        class="self-start text-sm text-destructive hover:underline sm:self-center"
        data-business-hour-schedule-remove
        aria-label="删除 ${escapeHtml(schedule.name)}"
      >删除</button>
    </li>`;
}

function renderCreateDialog(): string {
  const month = currentMonth();
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-business-hour-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-hour-dialog-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        data-business-hour-dialog-backdrop
        aria-label="关闭对话框"
      ></button>
      <div class="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg">
        <h3 id="business-hour-dialog-title" class="text-base font-semibold text-card-foreground">新建营业时间</h3>
        <div class="mt-4 space-y-4">
          <div class="space-y-1.5">
            <label class="${LABEL_CLASS}" for="business-hour-create-name">名称</label>
            <input
              id="business-hour-create-name"
              type="text"
              class="${INPUT_CLASS}"
              data-business-hour-create-name
              aria-label="名称"
            />
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="${LABEL_CLASS}" for="business-hour-create-open">从(hh:mm)</label>
              <input
                id="business-hour-create-open"
                type="time"
                class="${INPUT_CLASS} tabular-nums"
                data-business-hour-create-open
                value="11:00"
                aria-label="从(hh:mm)"
              />
            </div>
            <div class="space-y-1.5">
              <label class="${LABEL_CLASS}" for="business-hour-create-close">到(hh:mm)</label>
              <input
                id="business-hour-create-close"
                type="time"
                class="${INPUT_CLASS} tabular-nums"
                data-business-hour-create-close
                value="22:00"
                aria-label="到(hh:mm)"
              />
            </div>
          </div>
          <fieldset class="space-y-4 rounded-md border border-border p-3">
            <legend class="${LABEL_CLASS} px-1">生效范围</legend>
            <div class="space-y-3">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="${LABEL_CLASS}" for="business-hour-create-from-month">开始年月</label>
                  <input
                    id="business-hour-create-from-month"
                    type="month"
                    class="${INPUT_CLASS} tabular-nums"
                    data-business-hour-create-from-month
                    value="${escapeHtml(month)}"
                    aria-label="开始年月"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="${LABEL_CLASS}" for="business-hour-create-to-month">结束年月</label>
                  <input
                    id="business-hour-create-to-month"
                    type="month"
                    class="${INPUT_CLASS} tabular-nums"
                    data-business-hour-create-to-month
                    value="${escapeHtml(month)}"
                    aria-label="结束年月"
                  />
                </div>
              </div>
            </div>
            <div class="space-y-3 border-t border-border pt-3">
              <p class="${SUBSECTION_CLASS}">星期</p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <span class="${LABEL_CLASS}">从周几</span>
                  ${renderDayChoice("mon", "business-hour-create-from-day", "data-business-hour-create-from-day")}
                </div>
                <div class="space-y-2">
                  <span class="${LABEL_CLASS}">到周几</span>
                  ${renderDayChoice("fri", "business-hour-create-to-day", "data-business-hour-create-to-day")}
                </div>
              </div>
            </div>
          </fieldset>
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" class="${BTN_GHOST}" data-business-hour-create-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-business-hour-create-save>保存</button>
        </div>
      </div>
    </div>`;
}

function renderSchedulesSection(schedules: StoreBusinessHourSchedule[]): string {
  const list =
    schedules.length > 0
      ? `<ul class="space-y-2" data-business-hour-schedule-list>${schedules.map(renderScheduleRow).join("")}</ul>`
      : `<p class="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground" data-business-hour-empty>暂无营业时间，请点击「新建营业时间」</p>`;

  return `
    <section class="space-y-3" data-business-hour-schedules-section>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="${SECTION_HEAD_CLASS}">营业时间</h4>
        <button type="button" class="${BTN_LINK}" data-business-hour-create-toggle>+ 新建营业时间</button>
      </div>
      ${list}
    </section>`;
}

function renderPanelBody(schedules: StoreBusinessHourSchedule[]): string {
  return renderSchedulesSection(schedules);
}

export function isStoreBusinessHoursSeq(seq: number): boolean {
  return seq === STORE_BUSINESS_HOURS_SEQ;
}

export function renderStoreBusinessHoursHtml(): string {
  const schedules = readBusinessHourSchedules();
  return `
    <div class="mt-3 space-y-5" data-store-business-hours-panel>
      <div data-store-business-hours-body>${renderPanelBody(schedules)}</div>
      ${renderCreateDialog()}
    </div>`;
}

function refreshPanelBody(panel: HTMLElement): void {
  const body = panel.querySelector<HTMLElement>("[data-store-business-hours-body]");
  if (!body) return;
  body.innerHTML = renderPanelBody(readBusinessHourSchedules());
}

function resetCreateDialog(panel: HTMLElement): void {
  const month = currentMonth();
  const name = panel.querySelector<HTMLInputElement>("[data-business-hour-create-name]");
  const open = panel.querySelector<HTMLInputElement>("[data-business-hour-create-open]");
  const close = panel.querySelector<HTMLInputElement>("[data-business-hour-create-close]");
  const fromMonth = panel.querySelector<HTMLInputElement>("[data-business-hour-create-from-month]");
  const toMonth = panel.querySelector<HTMLInputElement>("[data-business-hour-create-to-month]");
  if (name) name.value = "";
  if (open) open.value = "11:00";
  if (close) close.value = "22:00";
  if (fromMonth) fromMonth.value = month;
  if (toMonth) toMonth.value = month;
  const fromMon = panel.querySelector<HTMLInputElement>(
    '[data-business-hour-create-from-day][value="mon"]',
  );
  const toFri = panel.querySelector<HTMLInputElement>(
    '[data-business-hour-create-to-day][value="fri"]',
  );
  if (fromMon) fromMon.checked = true;
  if (toFri) toFri.checked = true;
}

function showCreateDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-dialog]");
  if (!dialog) return;
  resetCreateDialog(panel);
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  panel.querySelector<HTMLInputElement>("[data-business-hour-create-name]")?.focus();
}

function hideCreateDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-business-hour-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
}

function saveNewSchedule(panel: HTMLElement): void {
  const name = panel.querySelector<HTMLInputElement>("[data-business-hour-create-name]")?.value.trim();
  const openTime = panel.querySelector<HTMLInputElement>("[data-business-hour-create-open]")?.value || "09:00";
  const closeTime = panel.querySelector<HTMLInputElement>("[data-business-hour-create-close]")?.value || "22:00";
  const fromMonth = panel.querySelector<HTMLInputElement>("[data-business-hour-create-from-month]")?.value ?? "";
  const toMonth = panel.querySelector<HTMLInputElement>("[data-business-hour-create-to-month]")?.value ?? "";
  const fromDay = normalizeDay(
    panel.querySelector<HTMLInputElement>("[data-business-hour-create-from-day]:checked")?.value,
    "mon",
  );
  const toDay = normalizeDay(
    panel.querySelector<HTMLInputElement>("[data-business-hour-create-to-day]:checked")?.value,
    "fri",
  );
  if (!name) {
    panel.querySelector<HTMLInputElement>("[data-business-hour-create-name]")?.focus();
    return;
  }
  if (!isYearMonth(fromMonth) || !isYearMonth(toMonth)) {
    panel.querySelector<HTMLInputElement>("[data-business-hour-create-from-month]")?.focus();
    return;
  }
  if (fromMonth > toMonth) {
    panel.querySelector<HTMLInputElement>("[data-business-hour-create-to-month]")?.focus();
    return;
  }
  const schedule: StoreBusinessHourSchedule = {
    id: newScheduleId(),
    name,
    openTime,
    closeTime,
    fromMonth,
    toMonth,
    fromDay,
    toDay,
  };
  const schedules = readBusinessHourSchedules();
  schedules.push(schedule);
  writeBusinessHourSchedules(schedules);
  hideCreateDialog(panel);
  refreshPanelBody(panel);
}

function removeSchedule(panel: HTMLElement, scheduleId: string): void {
  writeBusinessHourSchedules(readBusinessHourSchedules().filter((s) => s.id !== scheduleId));
  refreshPanelBody(panel);
}

export function bindStoreBusinessHoursControls(): void {
  document.querySelectorAll<HTMLElement>("[data-store-business-hours-panel]").forEach((panel) => {
    if (panel.dataset.storeBusinessHoursBound === "1") return;
    panel.dataset.storeBusinessHoursBound = "1";

    panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-business-hour-create-toggle]")) {
        showCreateDialog(panel);
        return;
      }
      if (
        target.closest("[data-business-hour-create-cancel]") ||
        target.closest("[data-business-hour-dialog-backdrop]")
      ) {
        hideCreateDialog(panel);
        return;
      }
      if (target.closest("[data-business-hour-create-save]")) {
        saveNewSchedule(panel);
        return;
      }
      const removeBtn = target.closest("[data-business-hour-schedule-remove]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-business-hour-schedule]");
        const scheduleId = row?.getAttribute("data-schedule-id");
        if (scheduleId) removeSchedule(panel, scheduleId);
      }
    });

    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const dialog = panel.querySelector<HTMLElement>("[data-business-hour-dialog]");
      if (dialog && !dialog.classList.contains("hidden")) {
        e.preventDefault();
        hideCreateDialog(panel);
      }
    });
  });
}
