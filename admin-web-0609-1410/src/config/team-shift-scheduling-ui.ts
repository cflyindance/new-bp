/**
 * 团队管理 · 排班（员工排班表，seq 437）
 * 路径：/team/shift-scheduling
 */

export const TEAM_SHIFT_SCHEDULING_PATH = "/team/shift-scheduling";

const SHIFT_TYPES_STORAGE_KEY = "bplant-team-shift-types-v1";
const ASSIGNMENTS_STORAGE_KEY = "bplant-team-shift-assignments-v1";
const EMPLOYEES_STORAGE_KEY = "tipout-employees-roster-v1";

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

type QuickPreset = "last-week" | "last-this-week" | "this-week" | "this-next-week" | "next-week" | "this-month";

type ShiftType = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  /** 上班提前打卡（分钟） */
  earlyClockInMinutes: number;
  /** 是否启用下班自动打卡延迟 */
  autoClockOutDelayEnabled: boolean;
  /** 下班自动打卡延迟（分钟） */
  autoClockOutDelayMinutes: number;
};

type ShiftAssignment = {
  employeeId: string;
  date: string;
  shiftId: string;
  /** 当日特殊开始时间；未设置则沿用班次模板 */
  overrideStartTime?: string;
  /** 当日特殊结束时间 */
  overrideEndTime?: string;
  /** 当日上班提前打卡（分钟） */
  overrideEarlyClockInMinutes?: number;
  /** 当日是否启用下班自动打卡延迟 */
  overrideAutoClockOutDelayEnabled?: boolean;
  /** 当日下班自动打卡延迟（分钟） */
  overrideAutoClockOutDelayMinutes?: number;
};

type RosterEmployee = {
  id: string;
  name: string;
  role?: string;
  store?: string;
};

type PageState = {
  dateFrom: string;
  dateTo: string;
  quickPreset: QuickPreset;
  employeeFilter: string;
};

const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  {
    id: "shift-morning",
    name: "早班",
    startTime: "09:00",
    endTime: "17:00",
    color: "#dbeafe",
    earlyClockInMinutes: 15,
    autoClockOutDelayEnabled: false,
    autoClockOutDelayMinutes: 30,
  },
  {
    id: "shift-evening",
    name: "晚班",
    startTime: "17:00",
    endTime: "23:00",
    color: "#fef3c7",
    earlyClockInMinutes: 15,
    autoClockOutDelayEnabled: true,
    autoClockOutDelayMinutes: 30,
  },
  {
    id: "shift-full",
    name: "全天",
    startTime: "09:00",
    endTime: "23:00",
    color: "#dcfce7",
    earlyClockInMinutes: 15,
    autoClockOutDelayEnabled: false,
    autoClockOutDelayMinutes: 30,
  },
];

const DEFAULT_EMPLOYEES: RosterEmployee[] = [
  { id: "emp-boss", name: "Boss", role: "Owner" },
  { id: "emp-demo-1", name: "Maria Garcia", role: "Server" },
  { id: "emp-demo-2", name: "Jason Chen", role: "Server" },
  { id: "emp-demo-3", name: "Mike Johnson", role: "Bartender" },
  { id: "emp-demo-4", name: "Tom Wilson", role: "Kitchen" },
];

const pageState: PageState = {
  dateFrom: "",
  dateTo: "",
  quickPreset: "last-this-week",
  employeeFilter: "",
};

type RepeatMode = "day" | "week";

/** JS Date.getDay()：0=周日 … 6=周六 */
const REPEAT_WEEKDAY_OPTIONS: { day: number; label: string }[] = [
  { day: 1, label: "周一" },
  { day: 2, label: "周二" },
  { day: 3, label: "周三" },
  { day: 4, label: "周四" },
  { day: 5, label: "周五" },
  { day: 6, label: "周六" },
  { day: 0, label: "周日" },
];

let shiftConfigDialogOpen = false;
/** 班次配置弹窗内的编辑草稿（取消时不写回） */
let shiftConfigDraft: ShiftType[] | null = null;
let shiftConfigSelectedId: string | null = null;
let cellEditor: {
  date: string;
  employeeIds: string[];
  repeatMode: RepeatMode;
  repeatWeekdays: number[];
} | null = null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + n);
  return copy;
}

function initDefaultDateRange(): void {
  const today = new Date();
  const thisWeekStart = startOfWeekMonday(today);
  const lastWeekStart = addDays(thisWeekStart, -7);
  const nextWeekEnd = addDays(thisWeekStart, 13);
  pageState.dateFrom = isoDate(lastWeekStart);
  pageState.dateTo = isoDate(nextWeekEnd);
}

if (!pageState.dateFrom) initDefaultDateRange();

function normalizeShiftType(raw: Partial<ShiftType> & Pick<ShiftType, "id" | "name" | "startTime" | "endTime">): ShiftType {
  return {
    id: raw.id,
    name: raw.name,
    startTime: raw.startTime,
    endTime: raw.endTime,
    color: raw.color?.startsWith("#") ? raw.color : "#dbeafe",
    earlyClockInMinutes:
      typeof raw.earlyClockInMinutes === "number" && raw.earlyClockInMinutes >= 0 ? raw.earlyClockInMinutes : 15,
    autoClockOutDelayEnabled: !!raw.autoClockOutDelayEnabled,
    autoClockOutDelayMinutes:
      typeof raw.autoClockOutDelayMinutes === "number" && raw.autoClockOutDelayMinutes >= 0
        ? raw.autoClockOutDelayMinutes
        : 30,
  };
}

function readShiftTypes(): ShiftType[] {
  try {
    const raw = localStorage.getItem(SHIFT_TYPES_STORAGE_KEY);
    if (!raw) return DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
    const parsed = JSON.parse(raw) as Partial<ShiftType>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
    return parsed
      .filter((t) => t?.id && t?.name && t?.startTime && t?.endTime)
      .map((t) => normalizeShiftType(t as ShiftType));
  } catch {
    return DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
  }
}

function writeShiftTypes(types: ShiftType[]): void {
  localStorage.setItem(SHIFT_TYPES_STORAGE_KEY, JSON.stringify(types));
}

function normalizeAssignment(raw: Partial<ShiftAssignment>): ShiftAssignment | null {
  if (!raw.employeeId || !raw.date || !raw.shiftId) return null;
  const assignment: ShiftAssignment = {
    employeeId: raw.employeeId,
    date: raw.date,
    shiftId: raw.shiftId,
  };
  if (raw.overrideStartTime && raw.overrideEndTime) {
    assignment.overrideStartTime = raw.overrideStartTime;
    assignment.overrideEndTime = raw.overrideEndTime;
  }
  if (typeof raw.overrideEarlyClockInMinutes === "number" && raw.overrideEarlyClockInMinutes >= 0) {
    assignment.overrideEarlyClockInMinutes = raw.overrideEarlyClockInMinutes;
  }
  if (typeof raw.overrideAutoClockOutDelayEnabled === "boolean") {
    assignment.overrideAutoClockOutDelayEnabled = raw.overrideAutoClockOutDelayEnabled;
  }
  if (typeof raw.overrideAutoClockOutDelayMinutes === "number" && raw.overrideAutoClockOutDelayMinutes >= 0) {
    assignment.overrideAutoClockOutDelayMinutes = raw.overrideAutoClockOutDelayMinutes;
  }
  return assignment;
}

function readAssignments(): ShiftAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<ShiftAssignment>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeAssignment).filter((a): a is ShiftAssignment => a !== null);
  } catch {
    return [];
  }
}

function writeAssignments(assignments: ShiftAssignment[]): void {
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
}

function readEmployees(): RosterEmployee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_EMPLOYEES];
    const parsed = JSON.parse(raw) as RosterEmployee[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_EMPLOYEES];
    return parsed.map((e) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      store: e.store,
    }));
  } catch {
    return [...DEFAULT_EMPLOYEES];
  }
}


function getAssignment(employeeId: string, date: string): ShiftAssignment | undefined {
  return readAssignments().find((a) => a.employeeId === employeeId && a.date === date);
}

function getEffectiveTimes(assignment: ShiftAssignment, shift: ShiftType): { startTime: string; endTime: string } {
  if (assignment.overrideStartTime && assignment.overrideEndTime) {
    return { startTime: assignment.overrideStartTime, endTime: assignment.overrideEndTime };
  }
  return { startTime: shift.startTime, endTime: shift.endTime };
}

function hasTimeOverride(assignment: ShiftAssignment, shift: ShiftType): boolean {
  if (!assignment.overrideStartTime || !assignment.overrideEndTime) return false;
  return (
    assignment.overrideStartTime !== shift.startTime || assignment.overrideEndTime !== shift.endTime
  );
}

function assignmentDurationHours(assignment: ShiftAssignment, shift: ShiftType): number {
  const { startTime, endTime } = getEffectiveTimes(assignment, shift);
  return shiftDurationHoursFromTimes(startTime, endTime);
}

function upsertAssignment(assignment: ShiftAssignment): void {
  const all = readAssignments().filter(
    (a) => !(a.employeeId === assignment.employeeId && a.date === assignment.date),
  );
  all.push(assignment);
  writeAssignments(all);
}

function setAssignment(employeeId: string, date: string, shiftId: string | null): void {
  const all = readAssignments().filter((a) => !(a.employeeId === employeeId && a.date === date));
  if (shiftId) all.push({ employeeId, date, shiftId });
  writeAssignments(all);
}

function getEffectiveEarlyClockInMinutes(assignment: ShiftAssignment, shift: ShiftType): number {
  return assignment.overrideEarlyClockInMinutes ?? shift.earlyClockInMinutes;
}

function getEffectiveAutoClockOutDelayEnabled(assignment: ShiftAssignment, shift: ShiftType): boolean {
  return assignment.overrideAutoClockOutDelayEnabled ?? shift.autoClockOutDelayEnabled;
}

function getEffectiveAutoClockOutDelayMinutes(assignment: ShiftAssignment, shift: ShiftType): number {
  return assignment.overrideAutoClockOutDelayMinutes ?? shift.autoClockOutDelayMinutes;
}

function hasAnyDayOverride(assignment: ShiftAssignment, shift: ShiftType): boolean {
  return (
    hasTimeOverride(assignment, shift) ||
    (assignment.overrideEarlyClockInMinutes !== undefined &&
      assignment.overrideEarlyClockInMinutes !== shift.earlyClockInMinutes) ||
    (assignment.overrideAutoClockOutDelayEnabled !== undefined &&
      assignment.overrideAutoClockOutDelayEnabled !== shift.autoClockOutDelayEnabled) ||
    (assignment.overrideAutoClockOutDelayMinutes !== undefined &&
      assignment.overrideAutoClockOutDelayMinutes !== shift.autoClockOutDelayMinutes)
  );
}

function buildAssignmentWithOverrides(
  employeeId: string,
  date: string,
  shiftId: string,
  shift: ShiftType,
  form: {
    startTime: string;
    endTime: string;
    earlyClockInMinutes: number;
    autoClockOutDelayEnabled: boolean;
    autoClockOutDelayMinutes: number;
  },
): ShiftAssignment {
  const base: ShiftAssignment = { employeeId, date, shiftId };
  if (form.startTime !== shift.startTime || form.endTime !== shift.endTime) {
    base.overrideStartTime = form.startTime;
    base.overrideEndTime = form.endTime;
  }
  if (form.earlyClockInMinutes !== shift.earlyClockInMinutes) {
    base.overrideEarlyClockInMinutes = form.earlyClockInMinutes;
  }
  if (form.autoClockOutDelayEnabled !== shift.autoClockOutDelayEnabled) {
    base.overrideAutoClockOutDelayEnabled = form.autoClockOutDelayEnabled;
  }
  if (form.autoClockOutDelayMinutes !== shift.autoClockOutDelayMinutes) {
    base.overrideAutoClockOutDelayMinutes = form.autoClockOutDelayMinutes;
  }
  return base;
}

function saveAssignmentDayAdjustForEmployees(
  employeeIds: string[],
  dates: string[],
  shiftId: string,
  startTime: string,
  endTime: string,
  earlyClockInMinutes: number,
  autoClockOutDelayEnabled: boolean,
  autoClockOutDelayMinutes: number,
): boolean {
  if (employeeIds.length === 0 || dates.length === 0) return false;
  const shift = readShiftTypes().find((t) => t.id === shiftId);
  if (!shift || !startTime || !endTime) return false;
  const form = {
    startTime,
    endTime,
    earlyClockInMinutes,
    autoClockOutDelayEnabled,
    autoClockOutDelayMinutes,
  };
  let all = readAssignments();
  for (const date of dates) {
    const built = buildAssignmentWithOverrides(employeeIds[0]!, date, shiftId, shift, form);
    const { employeeId: _primary, ...shared } = built;
    for (const employeeId of employeeIds) {
      all = all.filter((a) => !(a.employeeId === employeeId && a.date === date));
      all.push({ ...shared, employeeId });
    }
  }
  writeAssignments(all);
  return true;
}

function resolveRepeatTargetDates(
  anchorDate: string,
  repeatMode: RepeatMode,
  repeatWeekdays: number[],
): string[] {
  if (repeatMode === "day") return [anchorDate];
  const weekdays =
    repeatWeekdays.length > 0 ? repeatWeekdays : [parseIsoDate(anchorDate).getDay()];
  return enumerateDates(pageState.dateFrom, pageState.dateTo).filter((d) =>
    weekdays.includes(parseIsoDate(d).getDay()),
  );
}

function countRepeatTargetDates(repeatMode: RepeatMode, repeatWeekdays: number[], anchorDate: string): number {
  return resolveRepeatTargetDates(anchorDate, repeatMode, repeatWeekdays).length;
}

function clearAssignmentsForEmployees(employeeIds: string[], date: string): void {
  const idSet = new Set(employeeIds);
  writeAssignments(readAssignments().filter((a) => !(a.date === date && idSet.has(a.employeeId))));
}

function clearAssignmentOverridesForEmployees(employeeIds: string[], date: string): void {
  for (const employeeId of employeeIds) {
    clearAssignmentOverrides(employeeId, date);
  }
}

function clearAssignmentOverrides(employeeId: string, date: string): void {
  const assignment = getAssignment(employeeId, date);
  if (!assignment) return;
  upsertAssignment({ employeeId, date, shiftId: assignment.shiftId });
}

function shiftDurationHoursFromTimes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return 0;
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  return (endMin - startMin) / 60;
}

function shiftDurationHours(shift: ShiftType): number {
  return shiftDurationHoursFromTimes(shift.startTime, shift.endTime);
}

function formatWorkHoursDisplay(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "--小时";
  const hours = shiftDurationHoursFromTimes(startTime, endTime);
  if (!Number.isFinite(hours) || hours <= 0) return "--小时";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} 小时`;
}

function employeeTotalHours(employeeId: string, dates: string[]): number {
  const types = readShiftTypes();
  const typeMap = new Map(types.map((t) => [t.id, t]));
  let total = 0;
  for (const date of dates) {
    const a = getAssignment(employeeId, date);
    if (!a) continue;
    const shift = typeMap.get(a.shiftId);
    if (shift) total += assignmentDurationHours(a, shift);
  }
  return Math.round(total * 10) / 10;
}

function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  let cur = parseIsoDate(from);
  const end = parseIsoDate(to);
  while (cur <= end) {
    dates.push(isoDate(cur));
    cur = addDays(cur, 1);
  }
  return dates;
}

function applyQuickPreset(preset: QuickPreset): void {
  const today = new Date();
  const thisWeekStart = startOfWeekMonday(today);
  pageState.quickPreset = preset;
  switch (preset) {
    case "last-week": {
      const start = addDays(thisWeekStart, -7);
      pageState.dateFrom = isoDate(start);
      pageState.dateTo = isoDate(addDays(start, 6));
      break;
    }
    case "last-this-week": {
      pageState.dateFrom = isoDate(addDays(thisWeekStart, -7));
      pageState.dateTo = isoDate(addDays(thisWeekStart, 6));
      break;
    }
    case "this-week": {
      pageState.dateFrom = isoDate(thisWeekStart);
      pageState.dateTo = isoDate(addDays(thisWeekStart, 6));
      break;
    }
    case "this-next-week": {
      pageState.dateFrom = isoDate(thisWeekStart);
      pageState.dateTo = isoDate(addDays(thisWeekStart, 13));
      break;
    }
    case "next-week": {
      const start = addDays(thisWeekStart, 7);
      pageState.dateFrom = isoDate(start);
      pageState.dateTo = isoDate(addDays(start, 6));
      break;
    }
    case "this-month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      pageState.dateFrom = isoDate(start);
      pageState.dateTo = isoDate(end);
      break;
    }
  }
}

function formatColumnHeader(dateStr: string): string {
  const d = parseIsoDate(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd} ${WEEKDAY_LABELS[d.getDay()]}`;
}

function isWeekend(dateStr: string): boolean {
  const day = parseIsoDate(dateStr).getDay();
  return day === 0 || day === 6;
}

function canSyncToNextWeek(): boolean {
  const dates = enumerateDates(pageState.dateFrom, pageState.dateTo);
  if (dates.length < 7) return false;
  const thisWeekStart = isoDate(startOfWeekMonday(new Date()));
  return dates.includes(thisWeekStart);
}

function syncCurrentWeekToNextWeek(): void {
  const thisWeekStart = startOfWeekMonday(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => isoDate(addDays(thisWeekStart, i)));
  const nextWeekDates = Array.from({ length: 7 }, (_, i) => isoDate(addDays(thisWeekStart, 7 + i)));
  const current = readAssignments();
  const all = current.filter((a) => !nextWeekDates.includes(a.date));
  for (const srcDate of weekDates) {
    const dstDate = isoDate(addDays(parseIsoDate(srcDate), 7));
    for (const src of current.filter((a) => a.date === srcDate)) {
      all.push({
        employeeId: src.employeeId,
        date: dstDate,
        shiftId: src.shiftId,
        ...(src.overrideStartTime && src.overrideEndTime
          ? { overrideStartTime: src.overrideStartTime, overrideEndTime: src.overrideEndTime }
          : {}),
        ...(src.overrideEarlyClockInMinutes !== undefined
          ? { overrideEarlyClockInMinutes: src.overrideEarlyClockInMinutes }
          : {}),
        ...(src.overrideAutoClockOutDelayEnabled !== undefined
          ? { overrideAutoClockOutDelayEnabled: src.overrideAutoClockOutDelayEnabled }
          : {}),
        ...(src.overrideAutoClockOutDelayMinutes !== undefined
          ? { overrideAutoClockOutDelayMinutes: src.overrideAutoClockOutDelayMinutes }
          : {}),
      });
    }
  }
  writeAssignments(all);
}

function newShiftId(): string {
  return `shift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const QUICK_PRESETS: { id: QuickPreset; label: string }[] = [
  { id: "last-week", label: "上周" },
  { id: "last-this-week", label: "上周，本周" },
  { id: "this-week", label: "本周" },
  { id: "this-next-week", label: "本周，下周" },
  { id: "next-week", label: "下周" },
  { id: "this-month", label: "本月" },
];

function renderQuickPresetButtons(): string {
  return QUICK_PRESETS.map((p) => {
    const active = pageState.quickPreset === p.id;
    return `<button type="button"
      data-shift-quick-preset="${p.id}"
      class="h-8 shrink-0 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        active
          ? "bg-primary font-medium text-primary-foreground"
          : "border border-border bg-background text-foreground hover:bg-muted"
      }">${escapeHtml(p.label)}</button>`;
  }).join("");
}

function renderEmployeeFilterOptions(employees: RosterEmployee[]): string {
  const opts = [`<option value="">员工</option>`];
  for (const e of employees) {
    const sel = pageState.employeeFilter === e.id ? " selected" : "";
    opts.push(`<option value="${escapeHtml(e.id)}"${sel}>${escapeHtml(e.name)}</option>`);
  }
  return opts.join("");
}

function renderShiftCell(
  employeeId: string,
  date: string,
  assignment: ShiftAssignment | undefined,
  shift: ShiftType | undefined,
  weekend: boolean,
): string {
  const bg = weekend ? "bg-background" : "bg-muted/40";
  let content = "";
  if (shift && assignment) {
    const { startTime, endTime } = getEffectiveTimes(assignment, shift);
    const customized = hasAnyDayOverride(assignment, shift);
    content = `<span class="block truncate rounded px-1 py-0.5 text-xs font-medium" style="background:${escapeHtml(shift.color)}">${escapeHtml(shift.name)}</span>
      <span class="mt-0.5 block truncate px-0.5 text-[10px] tabular-nums ${customized ? "font-medium text-primary" : "text-muted-foreground"}">${escapeHtml(startTime)}–${escapeHtml(endTime)}${customized ? "*" : ""}</span>`;
  }
  return `<td class="min-w-[5.5rem] border border-border/60 px-1 py-1.5 align-middle ${bg}">
    <button type="button"
      class="flex h-12 w-full flex-col items-center justify-center rounded-sm text-left transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-shift-cell
      data-shift-employee="${escapeHtml(employeeId)}"
      data-shift-date="${escapeHtml(date)}"
      aria-label="排班 ${escapeHtml(date)}"
    >${content}</button>
  </td>`;
}

const SHIFT_FORM_LABEL =
  "w-36 shrink-0 pt-2 text-right text-sm text-foreground sm:w-40";
const SHIFT_FORM_INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const SHIFT_FORM_NUMBER_WRAP =
  "relative flex w-full max-w-xs items-center";
const SHIFT_FORM_NUMBER_UNIT =
  "pointer-events-none absolute right-3 text-sm text-muted-foreground";

function renderShiftTypeDetailForm(t: ShiftType): string {
  const delayDisabled = t.autoClockOutDelayEnabled ? "" : " disabled";
  const hours = formatWorkHoursDisplay(t.startTime, t.endTime);
  return `
    <div class="space-y-4" data-shift-config-detail data-shift-type-row="${escapeHtml(t.id)}">
      <div class="flex items-center gap-2 border-b border-border pb-3">
        <span class="size-4 shrink-0 rounded-full" style="background:${escapeHtml(t.color)}" aria-hidden="true"></span>
        <h3 class="text-sm font-semibold text-foreground">${escapeHtml(t.name || "未命名班次")}</h3>
        <span class="text-xs tabular-nums text-muted-foreground">${escapeHtml(t.startTime)}–${escapeHtml(t.endTime)} · ${escapeHtml(hours)}</span>
      </div>
      <div class="space-y-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}">名字:</span>
          <input type="text" value="${escapeHtml(t.name)}" data-shift-type-name placeholder="班次名称" class="${SHIFT_FORM_INPUT} sm:max-w-md" />
        </div>
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 时间:</span>
          <div class="flex min-w-0 flex-1 max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 shadow-sm">
            <input type="time" value="${escapeHtml(t.startTime)}" data-shift-type-start required class="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm focus-visible:outline-none" />
            <span class="shrink-0 text-muted-foreground" aria-hidden="true">→</span>
            <input type="time" value="${escapeHtml(t.endTime)}" data-shift-type-end required class="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm focus-visible:outline-none" />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}">工时:</span>
          <span data-shift-work-hours class="text-sm tabular-nums text-muted-foreground">${escapeHtml(hours)}</span>
        </div>
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}">上班提前打卡:</span>
          <div class="${SHIFT_FORM_NUMBER_WRAP}">
            <input type="number" min="0" step="1" value="${t.earlyClockInMinutes}" data-shift-early-clock-in class="${SHIFT_FORM_INPUT} pr-14" />
            <span class="${SHIFT_FORM_NUMBER_UNIT}">分钟</span>
          </div>
        </div>
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
          <span class="${SHIFT_FORM_LABEL} flex items-center justify-end gap-2 sm:pt-2">
            <input type="checkbox" data-shift-auto-clock-out-enabled class="size-4 shrink-0 accent-primary"${t.autoClockOutDelayEnabled ? " checked" : ""} />
            <span>下班自动打卡延迟:</span>
          </span>
          <div class="${SHIFT_FORM_NUMBER_WRAP}">
            <input type="number" min="0" step="1" value="${t.autoClockOutDelayMinutes}" data-shift-auto-clock-out-delay class="${SHIFT_FORM_INPUT} pr-14"${delayDisabled} />
            <span class="${SHIFT_FORM_NUMBER_UNIT}">分钟</span>
          </div>
        </div>
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}">显示颜色:</span>
          <input type="color" value="${escapeHtml(t.color.startsWith("#") ? t.color : "#dbeafe")}" data-shift-type-color class="size-9 cursor-pointer rounded border border-input bg-background" />
        </div>
      </div>
      <div class="border-t border-border pt-3">
        <button type="button" data-shift-type-remove="${escapeHtml(t.id)}" class="text-sm text-destructive hover:underline">删除此班次</button>
      </div>
    </div>`;
}

function renderShiftConfigListItem(t: ShiftType, selected: boolean): string {
  const hours = formatWorkHoursDisplay(t.startTime, t.endTime);
  return `
    <button type="button"
      data-shift-config-select="${escapeHtml(t.id)}"
      data-shift-config-list-item="${escapeHtml(t.id)}"
      class="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
      }"
      ${selected ? 'aria-current="true"' : ""}
    >
      <span class="mt-1.5 size-2.5 shrink-0 rounded-full" data-shift-config-list-color style="background:${escapeHtml(t.color)}" aria-hidden="true"></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-medium" data-shift-config-list-name>${escapeHtml(t.name || "未命名班次")}</span>
        <span class="mt-0.5 block truncate text-xs tabular-nums ${selected ? "text-primary/80" : "text-muted-foreground"}" data-shift-config-list-meta>${escapeHtml(t.startTime)}–${escapeHtml(t.endTime)} · ${escapeHtml(hours)}</span>
      </span>
    </button>`;
}

function renderShiftConfigDialog(types: ShiftType[]): string {
  if (!shiftConfigDialogOpen) return "";
  const draft = shiftConfigDraft ?? types;
  const selectedId =
    shiftConfigSelectedId && draft.some((t) => t.id === shiftConfigSelectedId)
      ? shiftConfigSelectedId
      : draft[0]?.id ?? null;
  const selected = selectedId ? draft.find((t) => t.id === selectedId) : undefined;
  const listItems = draft.map((t) => renderShiftConfigListItem(t, t.id === selectedId)).join("");
  const detailPanel = selected
    ? renderShiftTypeDetailForm(selected)
    : `<div class="flex h-full min-h-[16rem] flex-col items-center justify-center text-sm text-muted-foreground">暂无班次，请点击左侧「新增班次」</div>`;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-shift-config-dialog role="dialog" aria-modal="true" aria-labelledby="shift-config-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-shift-config-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="shift-config-title" class="text-base font-semibold text-foreground">班次配置</h2>
          <p class="mt-1 text-xs text-muted-foreground">左侧选择班次，右侧编辑详情；保存后应用于排班表。</p>
        </div>
        <div class="flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside class="flex w-full shrink-0 flex-col border-b border-border sm:w-56 sm:border-b-0 sm:border-r">
            <div class="min-h-0 flex-1 space-y-0.5 overflow-auto p-2" data-shift-config-list role="list">${listItems}</div>
            <div class="shrink-0 border-t border-border p-2">
              <button type="button" data-shift-type-add class="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border px-3 py-2 text-sm font-medium text-primary hover:bg-muted/50">+ 新增班次</button>
            </div>
          </aside>
          <div class="min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-5">${detailPanel}</div>
        </div>
        <div class="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" data-shift-config-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-shift-config-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

function renderShiftSelectOptions(types: ShiftType[], selectedId: string): string {
  const opts = [`<option value="">请选择班次</option>`];
  for (const t of types) {
    const sel = selectedId === t.id ? " selected" : "";
    opts.push(
      `<option value="${escapeHtml(t.id)}"${sel}>${escapeHtml(t.name)} (${escapeHtml(t.startTime)}–${escapeHtml(t.endTime)})</option>`,
    );
  }
  return opts.join("");
}

function renderEmployeeMultiSelect(employees: RosterEmployee[], selectedIds: string[]): string {
  const selectedSet = new Set(selectedIds);
  const tags = selectedIds
    .map((id) => {
      const emp = employees.find((e) => e.id === id);
      if (!emp) return "";
      const removable = selectedIds.length > 1;
      return `<span class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm text-foreground" data-shift-edit-employee-tag="${escapeHtml(id)}">
        <span>${escapeHtml(emp.name)}</span>
        ${
          removable
            ? `<button type="button" data-shift-edit-employee-remove="${escapeHtml(id)}" class="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground" aria-label="移除 ${escapeHtml(emp.name)}">×</button>`
            : ""
        }
      </span>`;
    })
    .join("");
  const addOptions = employees
    .filter((e) => !selectedSet.has(e.id))
    .map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`)
    .join("");
  const addSelect =
    addOptions.length > 0
      ? `<select data-shift-edit-employee-add class="h-7 min-w-[5.5rem] shrink-0 border-0 bg-transparent text-sm text-muted-foreground focus-visible:outline-none">
          <option value="">+ 添加员工</option>
          ${addOptions}
        </select>`
      : "";

  return `<div data-shift-edit-employee-picker class="flex min-h-9 w-full max-w-md flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-sm">
    ${tags}
    ${addSelect}
  </div>`;
}

function collectSelectedEmployeeIdsFromDialog(dialog: HTMLElement): string[] {
  return [...dialog.querySelectorAll<HTMLElement>("[data-shift-edit-employee-tag]")]
    .map((tag) => tag.getAttribute("data-shift-edit-employee-tag") ?? "")
    .filter(Boolean);
}

function appendEmployeeTag(dialog: HTMLElement, employee: RosterEmployee): void {
  const picker = dialog.querySelector<HTMLElement>("[data-shift-edit-employee-picker]");
  const addSelect = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-employee-add]");
  if (!picker || picker.querySelector(`[data-shift-edit-employee-tag="${employee.id}"]`)) return;

  const tag = document.createElement("span");
  tag.className =
    "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm text-foreground";
  tag.setAttribute("data-shift-edit-employee-tag", employee.id);
  tag.innerHTML = `<span>${escapeHtml(employee.name)}</span>
    <button type="button" data-shift-edit-employee-remove="${escapeHtml(employee.id)}" class="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground" aria-label="移除 ${escapeHtml(employee.name)}">×</button>`;
  if (addSelect) picker.insertBefore(tag, addSelect);
  else picker.appendChild(tag);

  refreshEmployeePickerRemoveButtons(dialog);
  refreshEmployeeAddSelectOptions(dialog);
}

function refreshEmployeePickerRemoveButtons(dialog: HTMLElement): void {
  const tags = dialog.querySelectorAll<HTMLElement>("[data-shift-edit-employee-tag]");
  const removable = tags.length > 1;
  tags.forEach((tag) => {
    const id = tag.getAttribute("data-shift-edit-employee-tag") ?? "";
    const existing = tag.querySelector("[data-shift-edit-employee-remove]");
    if (!removable) {
      existing?.remove();
      return;
    }
    if (!existing && id) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-shift-edit-employee-remove", id);
      btn.className =
        "inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground";
      btn.setAttribute("aria-label", "移除员工");
      btn.textContent = "×";
      tag.appendChild(btn);
    }
  });
}

function renderRepeatWeekdayCheckboxes(selectedDays: number[]): string {
  const selected = new Set(selectedDays);
  return REPEAT_WEEKDAY_OPTIONS.map(
    ({ day, label }) =>
      `<label class="inline-flex items-center gap-1 text-sm text-foreground">
        <input type="checkbox" data-shift-edit-repeat-weekday value="${day}" class="size-4 shrink-0 accent-primary"${selected.has(day) ? " checked" : ""} />
        <span>${label}</span>
      </label>`,
  ).join("");
}

function renderRepeatSection(repeatMode: RepeatMode, repeatWeekdays: number[], anchorDate: string): string {
  const targetCount =
    repeatMode === "week" ? countRepeatTargetDates("week", repeatWeekdays, anchorDate) : 1;
  return `
    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
      <span class="${SHIFT_FORM_LABEL}">重复:</span>
      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="shift-edit-repeat-mode" value="day" data-shift-edit-repeat-mode class="size-4 accent-primary"${repeatMode === "day" ? " checked" : ""} />
            <span>1天</span>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="shift-edit-repeat-mode" value="week" data-shift-edit-repeat-mode class="size-4 accent-primary"${repeatMode === "week" ? " checked" : ""} />
            <span>1周</span>
          </label>
        </div>
        <div data-shift-edit-repeat-weekdays-wrap class="space-y-1.5${repeatMode === "week" ? "" : " hidden"}">
          <div class="flex flex-wrap gap-x-3 gap-y-2">${renderRepeatWeekdayCheckboxes(repeatWeekdays)}</div>
          <p data-shift-edit-repeat-hint class="text-xs text-muted-foreground">在当前排班表日期范围（${escapeHtml(pageState.dateFrom)} 至 ${escapeHtml(pageState.dateTo)}）内，对所选星期几共 <span data-shift-edit-repeat-count>${targetCount}</span> 天应用排班</p>
        </div>
      </div>
    </div>`;
}

function collectRepeatFromDialog(dialog: HTMLElement): { repeatMode: RepeatMode; repeatWeekdays: number[] } {
  const modeInput = dialog.querySelector<HTMLInputElement>("[data-shift-edit-repeat-mode]:checked");
  const repeatMode: RepeatMode = modeInput?.value === "week" ? "week" : "day";
  const repeatWeekdays = [...dialog.querySelectorAll<HTMLInputElement>("[data-shift-edit-repeat-weekday]:checked")]
    .map((el) => Number(el.value))
    .filter((n) => Number.isFinite(n));
  return { repeatMode, repeatWeekdays };
}

function syncRepeatWeekdaysPanel(dialog: HTMLElement, anchorDate: string): void {
  const { repeatMode, repeatWeekdays } = collectRepeatFromDialog(dialog);
  const wrap = dialog.querySelector<HTMLElement>("[data-shift-edit-repeat-weekdays-wrap]");
  wrap?.classList.toggle("hidden", repeatMode !== "week");
  const countEl = dialog.querySelector<HTMLElement>("[data-shift-edit-repeat-count]");
  if (countEl && repeatMode === "week") {
    countEl.textContent = String(countRepeatTargetDates("week", repeatWeekdays, anchorDate));
  }
  if (cellEditor) {
    cellEditor.repeatMode = repeatMode;
    cellEditor.repeatWeekdays = repeatWeekdays;
  }
}

function refreshEmployeeAddSelectOptions(dialog: HTMLElement): void {
  const addSelect = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-employee-add]");
  if (!addSelect) return;
  const selected = new Set(collectSelectedEmployeeIdsFromDialog(dialog));
  const employees = readEmployees().filter((e) => !selected.has(e.id));
  addSelect.innerHTML =
    employees.length > 0
      ? `<option value="">+ 添加员工</option>${employees.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`).join("")}`
      : "";
  addSelect.classList.toggle("hidden", employees.length === 0);
}

function renderCellEditDialog(types: ShiftType[]): string {
  if (!cellEditor) return "";
  const employees = readEmployees();
  const selectedEmployeeIds = cellEditor.employeeIds.filter((id) => employees.some((e) => e.id === id));
  const primaryEmployeeId = selectedEmployeeIds[0] ?? cellEditor.employeeIds[0] ?? "";
  const assignment = primaryEmployeeId ? getAssignment(primaryEmployeeId, cellEditor.date) : undefined;
  const shift = assignment ? types.find((t) => t.id === assignment.shiftId) : undefined;
  const hasAnyAssignment = selectedEmployeeIds.some((id) => getAssignment(id, cellEditor!.date));

  const startTime = shift && assignment ? getEffectiveTimes(assignment, shift).startTime : shift?.startTime ?? "";
  const endTime = shift && assignment ? getEffectiveTimes(assignment, shift).endTime : shift?.endTime ?? "";
  const earlyClockIn =
    shift && assignment
      ? getEffectiveEarlyClockInMinutes(assignment, shift)
      : shift?.earlyClockInMinutes ?? 15;
  const autoDelayEnabled =
    shift && assignment
      ? getEffectiveAutoClockOutDelayEnabled(assignment, shift)
      : shift?.autoClockOutDelayEnabled ?? false;
  const autoDelayMinutes =
    shift && assignment
      ? getEffectiveAutoClockOutDelayMinutes(assignment, shift)
      : shift?.autoClockOutDelayMinutes ?? 30;
  const customized = assignment && shift ? hasAnyDayOverride(assignment, shift) : false;
  const hasAnyCustomized = selectedEmployeeIds.some((id) => {
    const a = getAssignment(id, cellEditor!.date);
    const s = a ? types.find((t) => t.id === a.shiftId) : undefined;
    return !!(a && s && hasAnyDayOverride(a, s));
  });
  const delayDisabled = autoDelayEnabled ? "" : " disabled";
  const multiEmployee = selectedEmployeeIds.length > 1;
  const repeatMode = cellEditor.repeatMode;
  const repeatWeekdays = cellEditor.repeatWeekdays;

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-shift-edit-dialog role="dialog" aria-modal="true" aria-labelledby="shift-edit-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-shift-edit-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="shift-edit-title" class="text-base font-semibold text-foreground">${hasAnyAssignment ? "当日班次调整" : "安排排班"}</h2>
          <p class="mt-1 text-xs text-muted-foreground">可调整项与班次配置一致；选中多名员工时，保存后将批量应用相同排班，不修改班次模板。</p>
        </div>
        <div class="min-h-0 flex-1 space-y-3 overflow-auto px-5 py-4">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 班次选择:</span>
            <select data-shift-edit-shift class="${SHIFT_FORM_INPUT} sm:max-w-md" required>
              ${renderShiftSelectOptions(types, assignment?.shiftId ?? "")}
            </select>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 日期:</span>
            <div class="relative flex w-full max-w-md items-center">
              <input type="date" value="${escapeHtml(cellEditor.date)}" readonly class="${SHIFT_FORM_INPUT} pr-10" />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pointer-events-none absolute right-3 text-muted-foreground" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 时间:</span>
            <div class="flex min-w-0 flex-1 max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 shadow-sm">
              <input type="time" value="${escapeHtml(startTime)}" data-shift-edit-start required class="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm focus-visible:outline-none" />
              <span class="shrink-0 text-muted-foreground" aria-hidden="true">→</span>
              <input type="time" value="${escapeHtml(endTime)}" data-shift-edit-end required class="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm focus-visible:outline-none" />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}">工时:</span>
            <span data-shift-edit-work-hours class="text-sm tabular-nums text-muted-foreground">${escapeHtml(formatWorkHoursDisplay(startTime, endTime))}</span>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 员工:</span>
            ${renderEmployeeMultiSelect(employees, selectedEmployeeIds.length > 0 ? selectedEmployeeIds : [primaryEmployeeId].filter(Boolean))}
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}">上班提前打卡:</span>
            <div class="${SHIFT_FORM_NUMBER_WRAP}">
              <input type="number" min="0" step="1" value="${earlyClockIn}" data-shift-edit-early-clock-in class="${SHIFT_FORM_INPUT} pr-14" />
              <span class="${SHIFT_FORM_NUMBER_UNIT}">分钟</span>
            </div>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL} flex items-center justify-end gap-2 sm:pt-2">
              <input type="checkbox" data-shift-edit-auto-clock-out-enabled class="size-4 shrink-0 accent-primary"${autoDelayEnabled ? " checked" : ""} />
              <span>下班自动打卡延迟:</span>
            </span>
            <div class="${SHIFT_FORM_NUMBER_WRAP}">
              <input type="number" min="0" step="1" value="${autoDelayMinutes}" data-shift-edit-auto-clock-out-delay class="${SHIFT_FORM_INPUT} pr-14"${delayDisabled} />
              <span class="${SHIFT_FORM_NUMBER_UNIT}">分钟</span>
            </div>
          </div>
          ${!hasAnyAssignment ? renderRepeatSection(repeatMode, repeatWeekdays, cellEditor.date) : ""}
          ${
            multiEmployee
              ? `<p class="text-xs text-primary sm:pl-[calc(9rem+0.75rem)]">已选 ${selectedEmployeeIds.length} 名员工，保存后统一应用以上设置</p>`
              : !hasAnyAssignment && repeatMode === "week"
                ? `<p class="text-xs text-muted-foreground sm:pl-[calc(9rem+0.75rem)]">按周重复时，将在当前排班表可见日期范围内批量写入</p>`
              : customized
                ? `<p class="text-xs text-primary sm:pl-[calc(9rem+0.75rem)]">* 已针对当日调整，与班次默认不同</p>`
                : `<p class="text-xs text-muted-foreground sm:pl-[calc(9rem+0.75rem)]">修改后将仅应用于 ${escapeHtml(cellEditor.date)}</p>`
          }
        </div>
        <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
          <div class="flex gap-2">
            ${
              hasAnyAssignment
                ? `<button type="button" data-shift-edit-reset class="text-sm text-muted-foreground hover:text-foreground hover:underline"${hasAnyCustomized ? "" : " disabled"}>恢复默认</button>
            <button type="button" data-shift-edit-clear class="text-sm text-destructive hover:underline">清除排班</button>`
                : ""
            }
          </div>
          <div class="flex gap-2">
            <button type="button" data-shift-edit-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
            <button type="button" data-shift-edit-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">${multiEmployee ? "批量保存" : "保存"}</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function isTeamShiftSchedulingPath(path: string): boolean {
  return path === TEAM_SHIFT_SCHEDULING_PATH || path.startsWith(`${TEAM_SHIFT_SCHEDULING_PATH}/`);
}

export function renderTeamShiftSchedulingPage(): string {
  const shiftTypes = readShiftTypes();
  const typeMap = new Map(shiftTypes.map((t) => [t.id, t]));
  const employees = readEmployees();
  const filtered = pageState.employeeFilter
    ? employees.filter((e) => e.id === pageState.employeeFilter)
    : employees;
  const dates = enumerateDates(pageState.dateFrom, pageState.dateTo);
  const syncEnabled = canSyncToNextWeek();

  const headerCells = dates
    .map(
      (d) =>
        `<th class="min-w-[5.5rem] whitespace-nowrap border border-primary/20 px-2 py-2.5 text-center text-xs font-medium">${escapeHtml(formatColumnHeader(d))}</th>`,
    )
    .join("");

  const bodyRows = filtered
    .map((emp) => {
      const hours = employeeTotalHours(emp.id, dates);
      const cells = dates
        .map((d) => {
          const a = getAssignment(emp.id, d);
          const shift = a ? typeMap.get(a.shiftId) : undefined;
          return renderShiftCell(emp.id, d, a, shift, isWeekend(d));
        })
        .join("");
      return `<tr class="border-b border-border/60">
        <td class="sticky left-0 z-[1] min-w-[8rem] border border-border/60 bg-card px-3 py-2 text-sm">
          <span class="font-medium text-foreground">${escapeHtml(emp.name)}</span>
          <span class="mt-0.5 block text-xs tabular-nums text-muted-foreground">${hours} 小时</span>
        </td>
        ${cells}
      </tr>`;
    })
    .join("");

  return `
    <div class="team-shift-scheduling-page flex min-h-0 flex-1 flex-col gap-3" data-shift-scheduling-page>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <input type="date" data-shift-date-from value="${escapeHtml(pageState.dateFrom)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
          <span class="text-muted-foreground">→</span>
          <input type="date" data-shift-date-to value="${escapeHtml(pageState.dateTo)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
        </div>
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">${renderQuickPresetButtons()}</div>
        <button type="button" data-shift-config-open class="h-9 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">班次配置</button>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <select data-shift-employee-filter class="h-9 min-w-[8rem] rounded-md border border-input bg-background px-3 text-sm">${renderEmployeeFilterOptions(employees)}</select>
        <button type="button" data-shift-sync-next-week
          class="h-9 rounded-md border border-border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            syncEnabled
              ? "bg-background text-foreground hover:bg-muted"
              : "cursor-not-allowed bg-muted/50 text-muted-foreground"
          }"
          ${syncEnabled ? "" : "disabled"}
        >同步到下周</button>
      </div>

      <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        <table class="w-full min-w-max border-collapse">
          <thead class="sticky top-0 z-[2]">
            <tr class="bg-primary text-primary-foreground">
              <th class="sticky left-0 z-[3] min-w-[8rem] border border-primary/20 bg-primary px-3 py-2.5 text-left text-sm font-medium">员工</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>${bodyRows || `<tr><td colspan="${dates.length + 1}" class="px-4 py-8 text-center text-sm text-muted-foreground">暂无员工数据，请先在「角色与员工」中添加员工。</td></tr>`}</tbody>
        </table>
      </div>

      ${renderShiftConfigDialog(shiftTypes)}
      ${renderCellEditDialog(shiftTypes)}
    </div>`;
}

function readPageStateFromDom(root: HTMLElement): void {
  const from = root.querySelector<HTMLInputElement>("[data-shift-date-from]");
  const to = root.querySelector<HTMLInputElement>("[data-shift-date-to]");
  const emp = root.querySelector<HTMLSelectElement>("[data-shift-employee-filter]");
  if (from?.value) pageState.dateFrom = from.value;
  if (to?.value) pageState.dateTo = to.value;
  if (emp) pageState.employeeFilter = emp.value;
}

function syncShiftWorkHoursInRow(row: HTMLElement): void {
  const start = row.querySelector<HTMLInputElement>("[data-shift-type-start]")?.value ?? "";
  const end = row.querySelector<HTMLInputElement>("[data-shift-type-end]")?.value ?? "";
  const label = row.querySelector<HTMLElement>("[data-shift-work-hours]");
  if (label) label.textContent = formatWorkHoursDisplay(start, end);
}

function syncAutoClockOutDelayField(row: HTMLElement): void {
  const enabled = row.querySelector<HTMLInputElement>("[data-shift-auto-clock-out-enabled]")?.checked ?? false;
  const delay = row.querySelector<HTMLInputElement>("[data-shift-auto-clock-out-delay]");
  if (!delay) return;
  delay.disabled = !enabled;
  delay.classList.toggle("opacity-50", !enabled);
}

function collectShiftTypeFromDetail(root: HTMLElement, id: string): ShiftType | null {
  const name = root.querySelector<HTMLInputElement>("[data-shift-type-name]")?.value.trim() ?? "";
  const startTime = root.querySelector<HTMLInputElement>("[data-shift-type-start]")?.value ?? "09:00";
  const endTime = root.querySelector<HTMLInputElement>("[data-shift-type-end]")?.value ?? "17:00";
  const color = root.querySelector<HTMLInputElement>("[data-shift-type-color]")?.value ?? "#dbeafe";
  const earlyClockInMinutes = Math.max(
    0,
    Number(root.querySelector<HTMLInputElement>("[data-shift-early-clock-in]")?.value) || 0,
  );
  const autoClockOutDelayEnabled =
    root.querySelector<HTMLInputElement>("[data-shift-auto-clock-out-enabled]")?.checked ?? false;
  const autoClockOutDelayMinutes = Math.max(
    0,
    Number(root.querySelector<HTMLInputElement>("[data-shift-auto-clock-out-delay]")?.value) || 0,
  );
  if (!name) return null;
  return normalizeShiftType({
    id,
    name,
    startTime,
    endTime,
    color,
    earlyClockInMinutes,
    autoClockOutDelayEnabled,
    autoClockOutDelayMinutes,
  });
}

function persistShiftConfigDetailToDraft(): void {
  if (!shiftConfigDraft || !shiftConfigSelectedId) return;
  const dialog = document.querySelector("[data-shift-config-dialog]");
  const detail = dialog?.querySelector<HTMLElement>("[data-shift-config-detail]");
  if (!detail) return;
  const updated = collectShiftTypeFromDetail(detail, shiftConfigSelectedId);
  if (!updated) return;
  const idx = shiftConfigDraft.findIndex((t) => t.id === shiftConfigSelectedId);
  if (idx >= 0) shiftConfigDraft[idx] = updated;
}

function collectShiftTypesFromDialog(): ShiftType[] {
  persistShiftConfigDetailToDraft();
  const draft = shiftConfigDraft ?? readShiftTypes();
  return draft.length > 0 ? draft : readShiftTypes();
}

function syncShiftConfigListItemPreview(dialog: HTMLElement): void {
  if (!shiftConfigSelectedId) return;
  const detail = dialog.querySelector<HTMLElement>("[data-shift-config-detail]");
  const listItem = dialog.querySelector<HTMLElement>(`[data-shift-config-list-item="${shiftConfigSelectedId}"]`);
  if (!detail || !listItem) return;
  const name = detail.querySelector<HTMLInputElement>("[data-shift-type-name]")?.value.trim() ?? "";
  const start = detail.querySelector<HTMLInputElement>("[data-shift-type-start]")?.value ?? "";
  const end = detail.querySelector<HTMLInputElement>("[data-shift-type-end]")?.value ?? "";
  const color = detail.querySelector<HTMLInputElement>("[data-shift-type-color]")?.value ?? "";
  const nameEl = listItem.querySelector<HTMLElement>("[data-shift-config-list-name]");
  const metaEl = listItem.querySelector<HTMLElement>("[data-shift-config-list-meta]");
  const colorEl = listItem.querySelector<HTMLElement>("[data-shift-config-list-color]");
  if (nameEl) nameEl.textContent = name || "未命名班次";
  if (metaEl) metaEl.textContent = `${start}–${end} · ${formatWorkHoursDisplay(start, end)}`;
  if (colorEl && color) colorEl.style.background = color;
}

function bindShiftConfigDetailPanel(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-shift-config-dialog]");
  const detail = dialog?.querySelector<HTMLElement>("[data-shift-config-detail]");
  if (!dialog || !detail || detail.dataset.shiftConfigDetailBound === "1") return;
  detail.dataset.shiftConfigDetailBound = "1";

  const onFieldChange = () => {
    syncShiftWorkHoursInRow(detail);
    syncShiftConfigListItemPreview(dialog);
  };
  detail.querySelector("[data-shift-type-name]")?.addEventListener("input", onFieldChange);
  detail.querySelector("[data-shift-type-start]")?.addEventListener("input", onFieldChange);
  detail.querySelector("[data-shift-type-end]")?.addEventListener("input", onFieldChange);
  detail.querySelector("[data-shift-type-start]")?.addEventListener("change", onFieldChange);
  detail.querySelector("[data-shift-type-end]")?.addEventListener("change", onFieldChange);
  detail.querySelector("[data-shift-type-color]")?.addEventListener("input", onFieldChange);

  detail.querySelector("[data-shift-auto-clock-out-enabled]")?.addEventListener("change", () => {
    syncAutoClockOutDelayField(detail);
  });
  syncAutoClockOutDelayField(detail);
  syncShiftWorkHoursInRow(detail);
}

function closeShiftConfigDialog(): void {
  shiftConfigDialogOpen = false;
  shiftConfigDraft = null;
  shiftConfigSelectedId = null;
}

function openShiftConfigDialog(): void {
  shiftConfigDraft = readShiftTypes().map((t) => ({ ...t }));
  shiftConfigSelectedId = shiftConfigDraft[0]?.id ?? null;
  shiftConfigDialogOpen = true;
}

function bindShiftConfigDialog(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-shift-config-dialog]");
  if (!dialog || dialog.dataset.shiftConfigDialogBound === "1") return;
  dialog.dataset.shiftConfigDialogBound = "1";

  bindShiftConfigDetailPanel(remount);

  dialog.querySelectorAll("[data-shift-config-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-shift-config-select");
      if (!id || id === shiftConfigSelectedId) return;
      persistShiftConfigDetailToDraft();
      shiftConfigSelectedId = id;
      remount();
    });
  });

  dialog.querySelector("[data-shift-config-backdrop]")?.addEventListener("click", () => {
    closeShiftConfigDialog();
    remount();
  });
  dialog.querySelector("[data-shift-config-cancel]")?.addEventListener("click", () => {
    closeShiftConfigDialog();
    remount();
  });
  dialog.querySelector("[data-shift-config-save]")?.addEventListener("click", () => {
    const types = collectShiftTypesFromDialog();
    writeShiftTypes(types);
    closeShiftConfigDialog();
    remount();
  });
  dialog.querySelector("[data-shift-type-add]")?.addEventListener("click", () => {
    persistShiftConfigDetailToDraft();
    if (!shiftConfigDraft) shiftConfigDraft = readShiftTypes().map((t) => ({ ...t }));
    const newType = normalizeShiftType({
      id: newShiftId(),
      name: "新班次",
      startTime: "09:00",
      endTime: "17:00",
      color: "#e0e7ff",
      earlyClockInMinutes: 15,
      autoClockOutDelayEnabled: false,
      autoClockOutDelayMinutes: 30,
    });
    shiftConfigDraft.push(newType);
    shiftConfigSelectedId = newType.id;
    remount();
  });
  dialog.querySelector("[data-shift-type-remove]")?.addEventListener("click", () => {
    const id = dialog.querySelector<HTMLElement>("[data-shift-type-remove]")?.getAttribute("data-shift-type-remove");
    if (!id || !shiftConfigDraft) return;
    if (!window.confirm("确定删除此班次？已排班记录中引用该班次的格子将无法正常显示。")) return;
    persistShiftConfigDetailToDraft();
    shiftConfigDraft = shiftConfigDraft.filter((t) => t.id !== id);
    if (shiftConfigDraft.length === 0) {
      shiftConfigDraft = DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
    }
    shiftConfigSelectedId = shiftConfigDraft[0]?.id ?? null;
    remount();
  });
}

function syncEditWorkHoursInDialog(dialog: HTMLElement): void {
  const start = dialog.querySelector<HTMLInputElement>("[data-shift-edit-start]")?.value ?? "";
  const end = dialog.querySelector<HTMLInputElement>("[data-shift-edit-end]")?.value ?? "";
  const label = dialog.querySelector<HTMLElement>("[data-shift-edit-work-hours]");
  if (label) label.textContent = formatWorkHoursDisplay(start, end);
}

function syncEditAutoClockOutDelayField(dialog: HTMLElement): void {
  const enabled = dialog.querySelector<HTMLInputElement>("[data-shift-edit-auto-clock-out-enabled]")?.checked ?? false;
  const delay = dialog.querySelector<HTMLInputElement>("[data-shift-edit-auto-clock-out-delay]");
  if (!delay) return;
  delay.disabled = !enabled;
  delay.classList.toggle("opacity-50", !enabled);
}

function applyShiftTemplateToEditDialog(dialog: HTMLElement, shift: ShiftType): void {
  const start = dialog.querySelector<HTMLInputElement>("[data-shift-edit-start]");
  const end = dialog.querySelector<HTMLInputElement>("[data-shift-edit-end]");
  const early = dialog.querySelector<HTMLInputElement>("[data-shift-edit-early-clock-in]");
  const enabled = dialog.querySelector<HTMLInputElement>("[data-shift-edit-auto-clock-out-enabled]");
  const delay = dialog.querySelector<HTMLInputElement>("[data-shift-edit-auto-clock-out-delay]");
  if (start) start.value = shift.startTime;
  if (end) end.value = shift.endTime;
  if (early) early.value = String(shift.earlyClockInMinutes);
  if (enabled) enabled.checked = shift.autoClockOutDelayEnabled;
  if (delay) delay.value = String(shift.autoClockOutDelayMinutes);
  syncEditWorkHoursInDialog(dialog);
  syncEditAutoClockOutDelayField(dialog);
}

function bindCellEditDialog(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-shift-edit-dialog]");
  if (!dialog || !cellEditor) return;

  const onTimeChange = () => syncEditWorkHoursInDialog(dialog);
  dialog.querySelector("[data-shift-edit-start]")?.addEventListener("input", onTimeChange);
  dialog.querySelector("[data-shift-edit-end]")?.addEventListener("input", onTimeChange);
  dialog.querySelector("[data-shift-edit-start]")?.addEventListener("change", onTimeChange);
  dialog.querySelector("[data-shift-edit-end]")?.addEventListener("change", onTimeChange);

  dialog.querySelector("[data-shift-edit-auto-clock-out-enabled]")?.addEventListener("change", () => {
    syncEditAutoClockOutDelayField(dialog);
  });
  syncEditAutoClockOutDelayField(dialog);

  dialog.querySelector("[data-shift-edit-shift]")?.addEventListener("change", (e) => {
    const shiftId = (e.target as HTMLSelectElement).value;
    const shift = readShiftTypes().find((t) => t.id === shiftId);
    if (shift) applyShiftTemplateToEditDialog(dialog, shift);
  });

  dialog.querySelector("[data-shift-edit-employee-add]")?.addEventListener("change", (e) => {
    const employeeId = (e.target as HTMLSelectElement).value;
    if (!employeeId) return;
    const employee = readEmployees().find((emp) => emp.id === employeeId);
    if (employee) appendEmployeeTag(dialog, employee);
    (e.target as HTMLSelectElement).value = "";
  });

  dialog.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const removeBtn = target.closest<HTMLElement>("[data-shift-edit-employee-remove]");
    if (!removeBtn) return;
    const employeeId = removeBtn.getAttribute("data-shift-edit-employee-remove");
    if (!employeeId) return;
    const tags = dialog.querySelectorAll("[data-shift-edit-employee-tag]");
    if (tags.length <= 1) return;
    removeBtn.closest("[data-shift-edit-employee-tag]")?.remove();
    refreshEmployeePickerRemoveButtons(dialog);
    refreshEmployeeAddSelectOptions(dialog);
  });

  dialog.querySelectorAll("[data-shift-edit-repeat-mode]").forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!cellEditor) return;
      syncRepeatWeekdaysPanel(dialog, cellEditor.date);
    });
  });
  dialog.querySelectorAll("[data-shift-edit-repeat-weekday]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (!cellEditor) return;
      syncRepeatWeekdaysPanel(dialog, cellEditor.date);
    });
  });

  dialog.querySelector("[data-shift-edit-backdrop]")?.addEventListener("click", () => {
    cellEditor = null;
    remount();
  });
  dialog.querySelector("[data-shift-edit-cancel]")?.addEventListener("click", () => {
    cellEditor = null;
    remount();
  });
  dialog.querySelector("[data-shift-edit-reset]")?.addEventListener("click", () => {
    if (!cellEditor) return;
    const employeeIds = collectSelectedEmployeeIdsFromDialog(dialog);
    if (employeeIds.length === 0) return;
    clearAssignmentOverridesForEmployees(employeeIds, cellEditor.date);
    remount();
  });
  dialog.querySelector("[data-shift-edit-clear]")?.addEventListener("click", () => {
    if (!cellEditor) return;
    const employeeIds = collectSelectedEmployeeIdsFromDialog(dialog);
    if (employeeIds.length === 0) return;
    clearAssignmentsForEmployees(employeeIds, cellEditor.date);
    cellEditor = null;
    remount();
  });
  dialog.querySelector("[data-shift-edit-save]")?.addEventListener("click", () => {
    if (!cellEditor) return;
    const employeeIds = collectSelectedEmployeeIdsFromDialog(dialog);
    const shiftId = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-shift]")?.value ?? "";
    const start = dialog.querySelector<HTMLInputElement>("[data-shift-edit-start]")?.value ?? "";
    const end = dialog.querySelector<HTMLInputElement>("[data-shift-edit-end]")?.value ?? "";
    const earlyClockInMinutes = Math.max(
      0,
      Number(dialog.querySelector<HTMLInputElement>("[data-shift-edit-early-clock-in]")?.value) || 0,
    );
    const autoClockOutDelayEnabled =
      dialog.querySelector<HTMLInputElement>("[data-shift-edit-auto-clock-out-enabled]")?.checked ?? false;
    const autoClockOutDelayMinutes = Math.max(
      0,
      Number(dialog.querySelector<HTMLInputElement>("[data-shift-edit-auto-clock-out-delay]")?.value) || 0,
    );
    if (employeeIds.length === 0) return;
    if (!shiftId) {
      dialog.querySelector<HTMLSelectElement>("[data-shift-edit-shift]")?.focus();
      return;
    }
    const { repeatMode, repeatWeekdays } = collectRepeatFromDialog(dialog);
    if (repeatMode === "week" && repeatWeekdays.length === 0) {
      dialog.querySelector<HTMLInputElement>("[data-shift-edit-repeat-weekday]")?.focus();
      return;
    }
    const targetDates = resolveRepeatTargetDates(cellEditor.date, repeatMode, repeatWeekdays);
    if (targetDates.length === 0) return;
    if (
      !saveAssignmentDayAdjustForEmployees(
        employeeIds,
        targetDates,
        shiftId,
        start,
        end,
        earlyClockInMinutes,
        autoClockOutDelayEnabled,
        autoClockOutDelayMinutes,
      )
    ) {
      return;
    }
    cellEditor = null;
    remount();
  });
}

export function bindTeamShiftSchedulingUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-shift-scheduling-page]");
  if (!root) return;

  root.querySelector("[data-shift-date-from]")?.addEventListener("change", () => {
    readPageStateFromDom(root);
    pageState.quickPreset = "this-week";
    remount();
  });
  root.querySelector("[data-shift-date-to]")?.addEventListener("change", () => {
    readPageStateFromDom(root);
    pageState.quickPreset = "this-week";
    remount();
  });

  root.querySelectorAll("[data-shift-quick-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-shift-quick-preset") as QuickPreset;
      if (preset) {
        applyQuickPreset(preset);
        remount();
      }
    });
  });

  root.querySelector("[data-shift-employee-filter]")?.addEventListener("change", () => {
    readPageStateFromDom(root);
    remount();
  });

  root.querySelector("[data-shift-config-open]")?.addEventListener("click", () => {
    openShiftConfigDialog();
    remount();
  });

  bindShiftConfigDialog(remount);

  root.querySelector("[data-shift-sync-next-week]")?.addEventListener("click", () => {
    if (!canSyncToNextWeek()) return;
    syncCurrentWeekToNextWeek();
    remount();
  });

  root.querySelectorAll("[data-shift-cell]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const employeeId = btn.getAttribute("data-shift-employee");
      const date = btn.getAttribute("data-shift-date");
      if (!employeeId || !date) return;
      cellEditor = {
        date,
        employeeIds: [employeeId],
        repeatMode: "day",
        repeatWeekdays: [parseIsoDate(date).getDay()],
      };
      remount();
    });
  });

  bindCellEditDialog(remount);
}
