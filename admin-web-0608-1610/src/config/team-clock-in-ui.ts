/**
 * 团队管理 · 员工打卡（含考勤记录）
 * 路径：/team/clock-in
 */

import {
  moduleSettingToggleStorageKey,
  readModuleSettingToggleOn,
  writeModuleSettingToggleOn,
} from "./module-settings-toggle-ui";
import { TEAM_SHIFT_SCHEDULING_SETTING_SEQS } from "./team-settings-embed-ui";

export const TEAM_CLOCK_IN_PATH = "/team/clock-in";
const CLOCK_TAB_STORAGE_KEY = "team-clock-in-tab";
const REQUIRE_SHIFT_SEQ = TEAM_SHIFT_SCHEDULING_SETTING_SEQS[0];

const PUNCHES_STORAGE_KEY = "bplant-team-clock-punches-v1";
const SETTINGS_STORAGE_KEY = "bplant-team-clock-settings-v1";
const SHIFT_TYPES_STORAGE_KEY = "bplant-team-shift-types-v1";
const ASSIGNMENTS_STORAGE_KEY = "bplant-team-shift-assignments-v1";
const EMPLOYEES_STORAGE_KEY = "tipout-employees-roster-v1";
const BREAKS_STORAGE_KEY = "bplant-team-breaks-overtime-v1";

type PunchType = "in" | "out" | "break-start" | "break-end";

type PunchRecord = {
  id: string;
  employeeId: string;
  timestamp: string;
  type: PunchType;
  source: "manager" | "terminal" | "auto";
  note?: string;
  breakLabel?: string;
};

type ClockSettings = {
  lateGraceMinutes: number;
};

type RosterEmployee = {
  id: string;
  name: string;
  role?: string;
};

type ShiftType = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  earlyClockInMinutes: number;
};

type ShiftAssignment = {
  employeeId: string;
  date: string;
  shiftId: string;
  overrideStartTime?: string;
  overrideEndTime?: string;
  overrideEarlyClockInMinutes?: number;
};

type TimecardStatus = "off" | "working" | "break" | "done";

type TimecardState = {
  clockIn: string | null;
  clockOut: string | null;
  openBreakStart: string | null;
  status: TimecardStatus;
  workedMinutes: number;
  breakMinutes: number;
  punches: PunchRecord[];
};

type StatusFilter = "all" | "off" | "working" | "break" | "done";

type PageState = {
  date: string;
  employeeFilter: string;
  statusFilter: StatusFilter;
};

type AttendancePageState = {
  dateFrom: string;
  dateTo: string;
  employeeFilter: string;
};

type ClockTab = "live" | "records" | "rules";

const DEFAULT_EMPLOYEES: RosterEmployee[] = [
  { id: "emp-boss", name: "Boss", role: "Owner" },
  { id: "emp-demo-1", name: "Maria Garcia", role: "Server" },
  { id: "emp-demo-2", name: "Jason Chen", role: "Server" },
  { id: "emp-demo-3", name: "Mike Johnson", role: "Bartender" },
  { id: "emp-demo-4", name: "Tom Wilson", role: "Kitchen" },
];

const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  { id: "shift-morning", name: "早班", startTime: "09:00", endTime: "17:00", earlyClockInMinutes: 15 },
  { id: "shift-evening", name: "晚班", startTime: "17:00", endTime: "23:00", earlyClockInMinutes: 15 },
];

const DEFAULT_SETTINGS: ClockSettings = {
  lateGraceMinutes: 15,
};

const pageState: PageState = {
  date: "",
  employeeFilter: "",
  statusFilter: "all",
};

const attendancePageState: AttendancePageState = {
  dateFrom: "",
  dateTo: "",
  employeeFilter: "",
};

let clockTab: ClockTab = "live";
let adjustDialog: { employeeId: string; date: string } | null = null;
let historyDialog: { employeeId: string; date: string } | null = null;
let breakDialog: { employeeId: string; date: string } | null = null;

function consumeClockTabFromStorage(): void {
  try {
    const stored = sessionStorage.getItem(CLOCK_TAB_STORAGE_KEY);
    if (stored === "records") {
      clockTab = "records";
      sessionStorage.removeItem(CLOCK_TAB_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function requestTeamClockInRecordsTab(): void {
  try {
    sessionStorage.setItem(CLOCK_TAB_STORAGE_KEY, "records");
  } catch {
    clockTab = "records";
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function initPageDates(): void {
  const today = todayIso();
  if (!pageState.date) pageState.date = today;
  if (!attendancePageState.dateFrom) {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    attendancePageState.dateFrom = d.toISOString().slice(0, 10);
  }
  if (!attendancePageState.dateTo) attendancePageState.dateTo = today;
}

initPageDates();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newPunchId(): string {
  return `punch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function minutesBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} 分`;
  return m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

function parseTimeOnDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

function migrateLegacyRequireScheduledShift(): void {
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(REQUIRE_SHIFT_SEQ)) !== null) return;
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { requireScheduledShift?: boolean };
    if (parsed.requireScheduledShift) {
      writeModuleSettingToggleOn(REQUIRE_SHIFT_SEQ, true);
    }
  } catch {
    /* ignore */
  }
}

function isRequireScheduledShiftEnabled(): boolean {
  migrateLegacyRequireScheduledShift();
  return readModuleSettingToggleOn(REQUIRE_SHIFT_SEQ);
}

function readSettings(): ClockSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<ClockSettings & { requireScheduledShift?: boolean }>;
    return {
      lateGraceMinutes: Math.max(0, Number(parsed.lateGraceMinutes) || DEFAULT_SETTINGS.lateGraceMinutes),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings: ClockSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function readPunches(): PunchRecord[] {
  try {
    const raw = localStorage.getItem(PUNCHES_STORAGE_KEY);
    if (!raw) return seedDemoPunches();
    const parsed = JSON.parse(raw) as Partial<PunchRecord>[];
    if (!Array.isArray(parsed)) return seedDemoPunches();
    return parsed
      .filter((p) => p?.id && p?.employeeId && p?.timestamp && p?.type)
      .map((p) => ({
        id: String(p.id),
        employeeId: String(p.employeeId),
        timestamp: String(p.timestamp),
        type: p.type as PunchType,
        source: p.source === "terminal" || p.source === "auto" ? p.source : "manager",
        note: typeof p.note === "string" ? p.note : undefined,
        breakLabel: typeof p.breakLabel === "string" ? p.breakLabel : undefined,
      }));
  } catch {
    return seedDemoPunches();
  }
}

function writePunches(punches: PunchRecord[]): void {
  localStorage.setItem(PUNCHES_STORAGE_KEY, JSON.stringify(punches));
}

function seedDemoPunches(): PunchRecord[] {
  const date = todayIso();
  const morning = new Date();
  morning.setHours(8, 55, 0, 0);
  const demo: PunchRecord[] = [
    {
      id: "demo-punch-1",
      employeeId: "emp-demo-1",
      timestamp: morning.toISOString(),
      type: "in" as const,
      source: "terminal" as const,
    },
    {
      id: "demo-punch-2",
      employeeId: "emp-demo-3",
      timestamp: new Date(morning.getTime() + 8 * 3600000).toISOString(),
      type: "in" as const,
      source: "terminal" as const,
    },
  ].filter((p) => p.timestamp.slice(0, 10) === date);
  writePunches(demo);
  return demo;
}

function readEmployees(): RosterEmployee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_EMPLOYEES];
    const parsed = JSON.parse(raw) as RosterEmployee[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_EMPLOYEES];
    return parsed.map((e) => ({ id: e.id, name: e.name, role: e.role }));
  } catch {
    return [...DEFAULT_EMPLOYEES];
  }
}

function readShiftTypes(): ShiftType[] {
  try {
    const raw = localStorage.getItem(SHIFT_TYPES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_SHIFT_TYPES];
    const parsed = JSON.parse(raw) as Partial<ShiftType>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_SHIFT_TYPES];
    return parsed
      .filter((t) => t?.id && t?.name && t?.startTime && t?.endTime)
      .map((t) => ({
        id: t.id!,
        name: t.name!,
        startTime: t.startTime!,
        endTime: t.endTime!,
        earlyClockInMinutes:
          typeof t.earlyClockInMinutes === "number" && t.earlyClockInMinutes >= 0
            ? t.earlyClockInMinutes
            : 15,
      }));
  } catch {
    return [...DEFAULT_SHIFT_TYPES];
  }
}

function readAssignments(): ShiftAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShiftAssignment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readBreakOptions(): { label: string; minutes: number }[] {
  try {
    const raw = localStorage.getItem(BREAKS_STORAGE_KEY);
    if (!raw) return [
      { label: "用餐休息", minutes: 30 },
      { label: "短休", minutes: 10 },
    ];
    const parsed = JSON.parse(raw) as {
      customBreaks?: { name: string; durationMinutes: number }[];
      unpaidPresets?: number[];
      paidPresets?: number[];
    };
    const opts: { label: string; minutes: number }[] = [];
    for (const b of parsed.customBreaks ?? []) {
      if (b?.name) opts.push({ label: b.name, minutes: b.durationMinutes || 10 });
    }
    for (const m of [...(parsed.unpaidPresets ?? []), ...(parsed.paidPresets ?? [])]) {
      opts.push({ label: `${m} 分钟休息`, minutes: m });
    }
    return opts.length > 0 ? opts : [{ label: "休息", minutes: 15 }];
  } catch {
    return [{ label: "休息", minutes: 15 }];
  }
}

function getAssignment(employeeId: string, date: string): ShiftAssignment | undefined {
  return readAssignments().find((a) => a.employeeId === employeeId && a.date === date);
}

function getEffectiveShiftTimes(assignment: ShiftAssignment, shift: ShiftType): { start: string; end: string } {
  return {
    start: assignment.overrideStartTime ?? shift.startTime,
    end: assignment.overrideEndTime ?? shift.endTime,
  };
}

function getEmployeePunches(employeeId: string, date: string): PunchRecord[] {
  return readPunches()
    .filter((p) => p.employeeId === employeeId && p.timestamp.slice(0, 10) === date)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function computeTimecard(punches: PunchRecord[]): TimecardState {
  let clockIn: string | null = null;
  let clockOut: string | null = null;
  let openBreakStart: string | null = null;
  let status: TimecardStatus = "off";
  let workedMinutes = 0;
  let breakMinutes = 0;
  let segmentStart: string | null = null;

  const closeSegment = (endIso: string) => {
    if (segmentStart) {
      workedMinutes += minutesBetween(segmentStart, endIso);
      segmentStart = null;
    }
  };

  for (const p of punches) {
    switch (p.type) {
      case "in":
        clockIn = p.timestamp;
        clockOut = null;
        openBreakStart = null;
        segmentStart = p.timestamp;
        status = "working";
        break;
      case "break-start":
        if (status === "working" && segmentStart) {
          workedMinutes += minutesBetween(segmentStart, p.timestamp);
          segmentStart = null;
        }
        openBreakStart = p.timestamp;
        status = "break";
        break;
      case "break-end":
        if (openBreakStart) {
          breakMinutes += minutesBetween(openBreakStart, p.timestamp);
          openBreakStart = null;
        }
        if (clockIn && !clockOut) {
          segmentStart = p.timestamp;
          status = "working";
        }
        break;
      case "out":
        if (status === "break" && openBreakStart) {
          breakMinutes += minutesBetween(openBreakStart, p.timestamp);
          openBreakStart = null;
        }
        closeSegment(p.timestamp);
        clockOut = p.timestamp;
        status = "done";
        break;
    }
  }

  if (status === "working" && segmentStart) {
    workedMinutes += minutesBetween(segmentStart, nowIso());
  }
  if (status === "break" && openBreakStart) {
    breakMinutes += minutesBetween(openBreakStart, nowIso());
  }

  return {
    clockIn,
    clockOut,
    openBreakStart,
    status,
    workedMinutes,
    breakMinutes,
    punches,
  };
}

function punchTypeLabel(type: PunchType): string {
  switch (type) {
    case "in":
      return "上班";
    case "out":
      return "下班";
    case "break-start":
      return "开始休息";
    case "break-end":
      return "结束休息";
  }
}

function statusLabel(status: TimecardStatus): string {
  switch (status) {
    case "off":
      return "未打卡";
    case "working":
      return "在岗";
    case "break":
      return "休息中";
    case "done":
      return "已下班";
  }
}

function statusBadgeClass(status: TimecardStatus): string {
  switch (status) {
    case "off":
      return "bg-muted text-muted-foreground";
    case "working":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "break":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "done":
      return "bg-slate-500/15 text-slate-600 dark:text-slate-400";
  }
}

function computeAlerts(
  employeeId: string,
  date: string,
  timecard: TimecardState,
  settings: ClockSettings,
): string[] {
  const alerts: string[] = [];
  const assignment = getAssignment(employeeId, date);
  const shiftTypes = readShiftTypes();
  const shift = assignment ? shiftTypes.find((t) => t.id === assignment.shiftId) : undefined;

  if (isRequireScheduledShiftEnabled() && !assignment) {
    alerts.push("无排班");
  }
  if (!shift || !assignment) return alerts;

  const { start, end } = getEffectiveShiftTimes(assignment, shift);
  const earlyMin = assignment.overrideEarlyClockInMinutes ?? shift.earlyClockInMinutes;
  const schedStart = parseTimeOnDate(date, start);
  const schedEnd = parseTimeOnDate(date, end);
  const earliestIn = new Date(schedStart.getTime() - earlyMin * 60000);
  const latestIn = new Date(schedStart.getTime() + settings.lateGraceMinutes * 60000);
  const now = new Date();

  if (timecard.clockIn) {
    const inTime = new Date(timecard.clockIn);
    if (inTime < earliestIn) alerts.push("提前打卡");
    if (inTime > latestIn) alerts.push("迟到");
  } else if (now > latestIn && date === todayIso()) {
    alerts.push("未打上班卡");
  }

  if (timecard.status === "working" && now > schedEnd && date === todayIso()) {
    alerts.push("超时未下班");
  }

  return alerts;
}

function addPunch(
  employeeId: string,
  type: PunchType,
  source: PunchRecord["source"] = "manager",
  opts?: { timestamp?: string; note?: string; breakLabel?: string },
): boolean {
  const date = (opts?.timestamp ?? nowIso()).slice(0, 10);
  const timecard = computeTimecard(getEmployeePunches(employeeId, date));

  if (type === "in") {
    if (timecard.status === "working" || timecard.status === "break") return false;
    if (timecard.status === "done") return false;
    if (isRequireScheduledShiftEnabled() && !getAssignment(employeeId, date)) return false;
  }
  if (type === "out" && timecard.status !== "working" && timecard.status !== "break") return false;
  if (type === "break-start" && timecard.status !== "working") return false;
  if (type === "break-end" && timecard.status !== "break") return false;

  const all = readPunches();
  all.push({
    id: newPunchId(),
    employeeId,
    timestamp: opts?.timestamp ?? nowIso(),
    type,
    source,
    note: opts?.note,
    breakLabel: opts?.breakLabel,
  });
  writePunches(all);
  return true;
}

const FORM_INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function renderEmployeeFilterOptions(employees: RosterEmployee[], selected: string, allLabel: string): string {
  const opts = [`<option value="">${escapeHtml(allLabel)}</option>`];
  for (const e of employees) {
    const sel = e.id === selected ? " selected" : "";
    opts.push(`<option value="${escapeHtml(e.id)}"${sel}>${escapeHtml(e.name)}</option>`);
  }
  return opts.join("");
}

function renderSummaryCards(rows: { status: TimecardStatus }[]): string {
  const counts = { off: 0, working: 0, break: 0, done: 0 };
  for (const r of rows) counts[r.status]++;
  const items = [
    { key: "off", label: "未打卡", count: counts.off, cls: "text-muted-foreground" },
    { key: "working", label: "在岗", count: counts.working, cls: "text-emerald-600 dark:text-emerald-400" },
    { key: "break", label: "休息中", count: counts.break, cls: "text-amber-600 dark:text-amber-400" },
    { key: "done", label: "已下班", count: counts.done, cls: "text-slate-600 dark:text-slate-400" },
  ];
  return items
    .map(
      (item) => `
    <div class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <p class="text-xs text-muted-foreground">${item.label}</p>
      <p class="mt-1 text-2xl font-semibold tabular-nums ${item.cls}">${item.count}</p>
    </div>`,
    )
    .join("");
}

function renderStatusFilterTabs(): string {
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "off", label: "未打卡" },
    { key: "working", label: "在岗" },
    { key: "break", label: "休息中" },
    { key: "done", label: "已下班" },
  ];
  return tabs
    .map((tab) => {
      const selected = pageState.statusFilter === tab.key;
      return `
      <button type="button"
        data-clock-status-filter="${tab.key}"
        class="rounded-md px-3 py-1.5 text-sm transition-colors ${
          selected ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }"
        ${selected ? 'aria-current="true"' : ""}
      >${tab.label}</button>`;
    })
    .join("");
}

function renderClockRow(
  emp: RosterEmployee,
  date: string,
  settings: ClockSettings,
): { html: string; status: TimecardStatus } {
  const punches = getEmployeePunches(emp.id, date);
  const timecard = computeTimecard(punches);
  const alerts = computeAlerts(emp.id, date, timecard, settings);
  const assignment = getAssignment(emp.id, date);
  const shift = assignment ? readShiftTypes().find((t) => t.id === assignment.shiftId) : undefined;
  const scheduleText = shift && assignment
    ? `${shift.name} ${getEffectiveShiftTimes(assignment, shift).start}–${getEffectiveShiftTimes(assignment, shift).end}`
    : "—";

  const alertHtml =
    alerts.length > 0
      ? alerts.map((a) => `<span class="mr-1 inline-flex rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">${escapeHtml(a)}</span>`).join("")
      : `<span class="text-xs text-muted-foreground">—</span>`;

  const canIn = timecard.status === "off";
  const canOut = timecard.status === "working" || timecard.status === "break";
  const canBreakStart = timecard.status === "working";
  const canBreakEnd = timecard.status === "break";

  const html = `
    <tr class="border-b border-border/60 hover:bg-muted/20" data-clock-row="${escapeHtml(emp.id)}">
      <td class="px-3 py-2.5">
        <span class="font-medium text-foreground">${escapeHtml(emp.name)}</span>
        ${emp.role ? `<span class="mt-0.5 block text-xs text-muted-foreground">${escapeHtml(emp.role)}</span>` : ""}
      </td>
      <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(scheduleText)}</td>
      <td class="px-3 py-2.5">
        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(timecard.status)}">${statusLabel(timecard.status)}</span>
      </td>
      <td class="px-3 py-2.5 text-sm tabular-nums">${formatTime(timecard.clockIn)}</td>
      <td class="px-3 py-2.5 text-sm tabular-nums">${formatTime(timecard.clockOut)}</td>
      <td class="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">${formatDuration(timecard.workedMinutes)}</td>
      <td class="px-3 py-2.5">${alertHtml}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap gap-1">
          <button type="button" data-clock-punch="in" data-clock-employee="${escapeHtml(emp.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"${canIn ? "" : " disabled"}>上班</button>
          <button type="button" data-clock-punch="out" data-clock-employee="${escapeHtml(emp.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"${canOut ? "" : " disabled"}>下班</button>
          <button type="button" data-clock-punch="break-start" data-clock-employee="${escapeHtml(emp.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"${canBreakStart ? "" : " disabled"}>休息</button>
          <button type="button" data-clock-punch="break-end" data-clock-employee="${escapeHtml(emp.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-40"${canBreakEnd ? "" : " disabled"}>结束休息</button>
          <button type="button" data-clock-adjust="${escapeHtml(emp.id)}" class="rounded border border-border px-2 py-1 text-xs text-primary hover:bg-muted">补卡</button>
          <button type="button" data-clock-history="${escapeHtml(emp.id)}" class="rounded border border-border px-2 py-1 text-xs hover:bg-muted">记录</button>
        </div>
      </td>
    </tr>`;

  return { html, status: timecard.status };
}

function renderAdjustDialog(): string {
  if (!adjustDialog) return "";
  const emp = readEmployees().find((e) => e.id === adjustDialog!.employeeId);
  const punches = getEmployeePunches(adjustDialog.employeeId, adjustDialog.date);
  const timecard = computeTimecard(punches);
  const clockInVal = timecard.clockIn ? timecard.clockIn.slice(0, 16) : "";
  const clockOutVal = timecard.clockOut ? timecard.clockOut.slice(0, 16) : "";

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-clock-adjust-dialog role="dialog" aria-modal="true">
      <button type="button" class="absolute inset-0 bg-black/40" data-clock-adjust-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 class="text-base font-semibold">手动补卡 · ${escapeHtml(emp?.name ?? "")}</h2>
        <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(adjustDialog.date)}</p>
        <div class="mt-4 space-y-3">
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">上班时间</span>
            <input type="datetime-local" data-clock-adjust-in value="${escapeHtml(clockInVal)}" class="${FORM_INPUT}" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">下班时间</span>
            <input type="datetime-local" data-clock-adjust-out value="${escapeHtml(clockOutVal)}" class="${FORM_INPUT}" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">备注</span>
            <input type="text" data-clock-adjust-note placeholder="补卡原因（可选）" class="${FORM_INPUT}" />
          </label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-clock-adjust-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-clock-adjust-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

function renderHistoryDialog(): string {
  if (!historyDialog) return "";
  const emp = readEmployees().find((e) => e.id === historyDialog!.employeeId);
  const punches = getEmployeePunches(historyDialog.employeeId, historyDialog.date);
  const rows =
    punches.length === 0
      ? `<tr><td colspan="4" class="px-3 py-6 text-center text-sm text-muted-foreground">暂无打卡记录</td></tr>`
      : punches
          .map(
            (p) => `
        <tr class="border-b border-border/60">
          <td class="px-3 py-2 text-sm tabular-nums">${formatDateTime(p.timestamp)}</td>
          <td class="px-3 py-2 text-sm">${escapeHtml(punchTypeLabel(p.type))}</td>
          <td class="px-3 py-2 text-sm text-muted-foreground">${escapeHtml(p.breakLabel ?? "—")}</td>
          <td class="px-3 py-2 text-sm text-muted-foreground">${p.source === "terminal" ? "终端" : p.source === "auto" ? "自动" : "经理"}</td>
        </tr>`,
          )
          .join("");

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-clock-history-dialog role="dialog" aria-modal="true">
      <button type="button" class="absolute inset-0 bg-black/40" data-clock-history-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 class="text-base font-semibold">打卡记录 · ${escapeHtml(emp?.name ?? "")}</h2>
          <p class="text-xs text-muted-foreground">${escapeHtml(historyDialog.date)}</p>
        </div>
        <div class="min-h-0 flex-1 overflow-auto">
          <table class="w-full text-left text-sm">
            <thead class="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr class="border-b border-border">
                <th class="px-3 py-2 font-medium">时间</th>
                <th class="px-3 py-2 font-medium">类型</th>
                <th class="px-3 py-2 font-medium">休息</th>
                <th class="px-3 py-2 font-medium">来源</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="border-t border-border px-5 py-3 text-right">
          <button type="button" data-clock-history-close class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">关闭</button>
        </div>
      </div>
    </div>`;
}

function renderBreakDialog(): string {
  if (!breakDialog) return "";
  const emp = readEmployees().find((e) => e.id === breakDialog!.employeeId);
  const options = readBreakOptions()
    .map(
      (o, i) =>
        `<option value="${escapeHtml(o.label)}" data-break-minutes="${o.minutes}"${i === 0 ? " selected" : ""}>${escapeHtml(o.label)}（${o.minutes} 分）</option>`,
    )
    .join("");

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-clock-break-dialog role="dialog" aria-modal="true">
      <button type="button" class="absolute inset-0 bg-black/40" data-clock-break-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 class="text-base font-semibold">开始休息 · ${escapeHtml(emp?.name ?? "")}</h2>
        <label class="mt-4 block text-sm">
          <span class="mb-1 block text-muted-foreground">休息类型</span>
          <select data-clock-break-type class="${FORM_INPUT}">${options}</select>
        </label>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-clock-break-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-clock-break-confirm class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">确认</button>
        </div>
      </div>
    </div>`;
}

export function isTeamClockInPath(path: string): boolean {
  return path === TEAM_CLOCK_IN_PATH || path.startsWith(`${TEAM_CLOCK_IN_PATH}/`);
}

function renderClockTabBar(): string {
  const tabs: { key: ClockTab; label: string }[] = [
    { key: "live", label: "打卡管理" },
    { key: "records", label: "考勤记录" },
    { key: "rules", label: "规则设置" },
  ];
  return `
    <div class="flex shrink-0 gap-1 border-b border-border" role="tablist" aria-label="员工打卡">
      ${tabs
        .map((tab) => {
          const selected = clockTab === tab.key;
          return `
        <button type="button" role="tab"
          data-clock-tab="${tab.key}"
          class="min-h-10 border-b-2 px-4 text-sm font-medium transition-colors ${
            selected
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          }"
          ${selected ? 'aria-selected="true"' : 'aria-selected="false"'}
        >${tab.label}</button>`;
        })
        .join("")}
    </div>`;
}

function renderLiveClockPanel(): string {
  const settings = readSettings();
  const employees = readEmployees();
  const filteredEmployees = pageState.employeeFilter
    ? employees.filter((e) => e.id === pageState.employeeFilter)
    : employees;

  const rowData = filteredEmployees.map((emp) => renderClockRow(emp, pageState.date, settings));
  const statusFiltered =
    pageState.statusFilter === "all"
      ? rowData
      : rowData.filter((r) => r.status === pageState.statusFilter);

  const tableRows =
    statusFiltered.length > 0
      ? statusFiltered.map((r) => r.html).join("")
      : `<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无符合筛选条件的员工</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-clock-live-panel>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <input type="date" data-clock-date value="${escapeHtml(pageState.date)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
        </div>
        <select data-clock-employee-filter class="${FORM_INPUT} w-auto min-w-[10rem]">${renderEmployeeFilterOptions(employees, pageState.employeeFilter, "全部员工")}</select>
        <div class="flex flex-wrap gap-1 rounded-md border border-border bg-muted/30 p-1">${renderStatusFilterTabs()}</div>
      </div>

      <div class="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">${renderSummaryCards(rowData)}</div>

      <div class="rounded-xl border border-border bg-card shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p class="text-sm font-medium text-foreground">员工打卡</p>
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <label class="flex items-center gap-1">
              <span>迟到宽限</span>
              <input type="number" min="0" step="1" value="${settings.lateGraceMinutes}" data-clock-late-grace class="h-7 w-14 rounded border border-input px-2 text-center text-xs tabular-nums" />
              <span>分钟</span>
            </label>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[56rem] text-left text-sm">
            <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th class="px-3 py-2.5 font-medium">员工</th>
                <th class="px-3 py-2.5 font-medium">排班</th>
                <th class="px-3 py-2.5 font-medium">状态</th>
                <th class="px-3 py-2.5 font-medium">上班</th>
                <th class="px-3 py-2.5 font-medium">下班</th>
                <th class="px-3 py-2.5 font-medium">工时</th>
                <th class="px-3 py-2.5 font-medium">提醒</th>
                <th class="px-3 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return dates;
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function renderAttendanceRecordsPanel(): string {
  const employees = readEmployees();
  const dates = enumerateDates(attendancePageState.dateFrom, attendancePageState.dateTo);
  const rows: string[] = [];

  for (const date of dates) {
    const dayPunches = readPunches().filter((p) => {
      if (p.timestamp.slice(0, 10) !== date) return false;
      if (attendancePageState.employeeFilter && p.employeeId !== attendancePageState.employeeFilter) return false;
      return true;
    });
    for (const emp of employees) {
      if (attendancePageState.employeeFilter && emp.id !== attendancePageState.employeeFilter) continue;
      const punches = dayPunches.filter((p) => p.employeeId === emp.id);
      if (punches.length === 0) continue;
      const timecard = computeTimecard(punches.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
      rows.push(`
        <tr class="border-b border-border/60 hover:bg-muted/20">
          <td class="px-3 py-2.5 text-sm">${escapeHtml(date)}</td>
          <td class="px-3 py-2.5 text-sm font-medium">${escapeHtml(emp.name)}</td>
          <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(timecard.status)}">${statusLabel(timecard.status)}</span></td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${formatTime(timecard.clockIn)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${formatTime(timecard.clockOut)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${formatDuration(timecard.workedMinutes)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">${formatDuration(timecard.breakMinutes)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${punches.length}</td>
        </tr>`);
    }
  }

  const tableBody =
    rows.length > 0
      ? rows.join("")
      : `<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-muted-foreground">所选日期范围内暂无考勤记录</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-clock-records-panel>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
          <input type="date" data-attendance-date-from value="${escapeHtml(attendancePageState.dateFrom)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
          <span class="text-muted-foreground">→</span>
          <input type="date" data-attendance-date-to value="${escapeHtml(attendancePageState.dateTo)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
        </div>
        <select data-attendance-employee-filter class="${FORM_INPUT} w-auto min-w-[10rem]">${renderEmployeeFilterOptions(employees, attendancePageState.employeeFilter, "全部员工")}</select>
      </div>
      <div class="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table class="w-full min-w-[48rem] text-left text-sm">
          <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5 font-medium">日期</th>
              <th class="px-3 py-2.5 font-medium">员工</th>
              <th class="px-3 py-2.5 font-medium">状态</th>
              <th class="px-3 py-2.5 font-medium">上班</th>
              <th class="px-3 py-2.5 font-medium">下班</th>
              <th class="px-3 py-2.5 font-medium">工时</th>
              <th class="px-3 py-2.5 font-medium">休息</th>
              <th class="px-3 py-2.5 font-medium">打卡次数</th>
            </tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderTeamClockInPage(rulesPanelHtml = ""): string {
  consumeClockTabFromStorage();
  const livePanel = clockTab === "live" ? renderLiveClockPanel() : "";
  const recordsPanel = clockTab === "records" ? renderAttendanceRecordsPanel() : "";
  const rulesPanel = clockTab === "rules" ? rulesPanelHtml : "";

  return `
    <div class="team-clock-in-page flex min-h-0 flex-1 flex-col gap-4" data-team-clock-in-page>
      ${renderClockTabBar()}
      ${livePanel}
      ${recordsPanel}
      ${rulesPanel}
      ${renderAdjustDialog()}
      ${renderHistoryDialog()}
      ${renderBreakDialog()}
    </div>`;
}

function saveAdjustFromDialog(): void {
  if (!adjustDialog) return;
  const dialog = document.querySelector("[data-clock-adjust-dialog]");
  if (!dialog) return;
  const inVal = dialog.querySelector<HTMLInputElement>("[data-clock-adjust-in]")?.value;
  const outVal = dialog.querySelector<HTMLInputElement>("[data-clock-adjust-out]")?.value;
  const note = dialog.querySelector<HTMLInputElement>("[data-clock-adjust-note]")?.value?.trim() ?? "";
  const { employeeId, date } = adjustDialog;

  let punches = readPunches().filter(
    (p) => !(p.employeeId === employeeId && p.timestamp.slice(0, 10) === date),
  );

  if (inVal) {
    punches.push({
      id: newPunchId(),
      employeeId,
      timestamp: new Date(inVal).toISOString(),
      type: "in",
      source: "manager",
      note: note || "手动补卡",
    });
  }
  if (outVal) {
    punches.push({
      id: newPunchId(),
      employeeId,
      timestamp: new Date(outVal).toISOString(),
      type: "out",
      source: "manager",
      note: note || "手动补卡",
    });
  }
  punches.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  writePunches(punches);
  adjustDialog = null;
}

function persistClockSettingsFromDom(root: HTMLElement): void {
  writeSettings({
    lateGraceMinutes: Math.max(
      0,
      Number(root.querySelector<HTMLInputElement>("[data-clock-late-grace]")?.value) ||
        DEFAULT_SETTINGS.lateGraceMinutes,
    ),
  });
}

function bindAttendanceRecordsPanel(root: HTMLElement, remount: () => void): void {
  root.querySelector("[data-attendance-date-from]")?.addEventListener("change", () => {
    attendancePageState.dateFrom =
      root.querySelector<HTMLInputElement>("[data-attendance-date-from]")?.value ?? attendancePageState.dateFrom;
    remount();
  });
  root.querySelector("[data-attendance-date-to]")?.addEventListener("change", () => {
    attendancePageState.dateTo =
      root.querySelector<HTMLInputElement>("[data-attendance-date-to]")?.value ?? attendancePageState.dateTo;
    remount();
  });
  root.querySelector("[data-attendance-employee-filter]")?.addEventListener("change", () => {
    attendancePageState.employeeFilter =
      root.querySelector<HTMLSelectElement>("[data-attendance-employee-filter]")?.value ?? "";
    remount();
  });
}

export function bindTeamClockInUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-team-clock-in-page]");
  if (!root || root.dataset.clockInBound === "1") return;
  root.dataset.clockInBound = "1";

  root.querySelectorAll("[data-clock-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-clock-tab") as ClockTab;
      if (!tab || tab === clockTab) return;
      clockTab = tab;
      remount();
    });
  });

  bindAttendanceRecordsPanel(root, remount);

  root.querySelector("[data-clock-date]")?.addEventListener("change", () => {
    const el = root.querySelector<HTMLInputElement>("[data-clock-date]");
    if (el?.value) pageState.date = el.value;
    remount();
  });

  root.querySelector("[data-clock-employee-filter]")?.addEventListener("change", () => {
    pageState.employeeFilter = root.querySelector<HTMLSelectElement>("[data-clock-employee-filter]")?.value ?? "";
    remount();
  });

  root.querySelectorAll("[data-clock-status-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-clock-status-filter") as StatusFilter;
      if (key) {
        pageState.statusFilter = key;
        remount();
      }
    });
  });

  root.querySelector("[data-clock-late-grace]")?.addEventListener("change", () => {
    persistClockSettingsFromDom(root);
  });

  root.querySelectorAll("[data-clock-punch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-clock-punch") as PunchType;
      const employeeId = btn.getAttribute("data-clock-employee");
      if (!type || !employeeId) return;
      if (type === "break-start") {
        breakDialog = { employeeId, date: pageState.date };
        remount();
        return;
      }
      if (!addPunch(employeeId, type)) {
        window.alert(type === "in" && isRequireScheduledShiftEnabled() ? "该员工今日无排班，无法上班打卡。" : "当前状态无法执行此操作。");
        return;
      }
      remount();
    });
  });

  root.querySelectorAll("[data-clock-adjust]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const employeeId = btn.getAttribute("data-clock-adjust");
      if (!employeeId) return;
      adjustDialog = { employeeId, date: pageState.date };
      remount();
    });
  });

  root.querySelectorAll("[data-clock-history]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const employeeId = btn.getAttribute("data-clock-history");
      if (!employeeId) return;
      historyDialog = { employeeId, date: pageState.date };
      remount();
    });
  });

  const adjustDialogEl = root.querySelector("[data-clock-adjust-dialog]");
  adjustDialogEl?.querySelector("[data-clock-adjust-backdrop]")?.addEventListener("click", () => {
    adjustDialog = null;
    remount();
  });
  adjustDialogEl?.querySelector("[data-clock-adjust-cancel]")?.addEventListener("click", () => {
    adjustDialog = null;
    remount();
  });
  adjustDialogEl?.querySelector("[data-clock-adjust-save]")?.addEventListener("click", () => {
    saveAdjustFromDialog();
    remount();
  });

  const historyDialogEl = root.querySelector("[data-clock-history-dialog]");
  historyDialogEl?.querySelector("[data-clock-history-backdrop]")?.addEventListener("click", () => {
    historyDialog = null;
    remount();
  });
  historyDialogEl?.querySelector("[data-clock-history-close]")?.addEventListener("click", () => {
    historyDialog = null;
    remount();
  });

  const breakDialogEl = root.querySelector("[data-clock-break-dialog]");
  breakDialogEl?.querySelector("[data-clock-break-backdrop]")?.addEventListener("click", () => {
    breakDialog = null;
    remount();
  });
  breakDialogEl?.querySelector("[data-clock-break-cancel]")?.addEventListener("click", () => {
    breakDialog = null;
    remount();
  });
  breakDialogEl?.querySelector("[data-clock-break-confirm]")?.addEventListener("click", () => {
    if (!breakDialog) return;
    const select = breakDialogEl.querySelector<HTMLSelectElement>("[data-clock-break-type]");
    const label = select?.value ?? "休息";
    if (!addPunch(breakDialog.employeeId, "break-start", "manager", { breakLabel: label })) {
      window.alert("当前状态无法开始休息。");
      return;
    }
    breakDialog = null;
    remount();
  });
}

