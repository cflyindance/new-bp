/**
 * 团队管理 · 员工打卡（含考勤记录）
 * 路径：/team/clock-in
 */

import {
  getScopedFilterOptions,
  readScopeFilters,
  ensureInPageDefaultStoreSelected,
  resolveDefaultScopedStoreId,
  usesInPageStorePicker,
  writeScopeFilters,
} from "../auth/session-scope";
import { getUiLocale, t } from "../i18n";
import { parseRosterStoreScopeId } from "./team-employee-roster-scope";
import {
  moduleSettingToggleStorageKey,
  readModuleSettingToggleOn,
  writeModuleSettingToggleOn,
} from "./module-settings-toggle-ui";
import { formatConfigDisplayValue } from "./deployment-change-buffer";
import { recordPageOrImmediateConfigChange } from "./page-config-change";
import { TEAM_SHIFT_SCHEDULING_SETTING_SEQS } from "./team-settings-embed-ui";

export const TEAM_CLOCK_IN_PATH = "/team/clock-in";
const CLOCK_TAB_STORAGE_KEY = "team-clock-in-tab";
const REQUIRE_SHIFT_SEQ = TEAM_SHIFT_SCHEDULING_SETTING_SEQS[0];

const PUNCHES_STORAGE_KEY = "bplant-team-clock-punches-v4";
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
  store?: string;
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
  /** 休息合计（无薪 + 带薪） */
  breakMinutes: number;
  unpaidBreakMinutes: number;
  paidBreakMinutes: number;
  punches: PunchRecord[];
};

type StatusFilter = "all" | "off" | "working" | "break" | "done";

type PageState = {
  date: string;
  roleFilter: string;
  employeeFilter: string;
  statusFilter: StatusFilter;
};

type AttendancePageState = {
  dateFrom: string;
  dateTo: string;
  roleFilter: string;
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
  roleFilter: "",
  employeeFilter: "",
  statusFilter: "all",
};

const attendancePageState: AttendancePageState = {
  dateFrom: "",
  dateTo: "",
  roleFilter: "",
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

/** 仅「规则设置」Tab 需要页脚保存栏；实时打卡 / 考勤记录为操作与查询，不展示 */
export function shouldShowTeamClockInSaveBar(): boolean {
  return clockTab === "rules";
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
  const before = readSettings();
  if (JSON.stringify(before) === JSON.stringify(settings)) return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  recordPageOrImmediateConfigChange(TEAM_CLOCK_IN_PATH, {
    label: "员工打卡设置",
    before: formatConfigDisplayValue(before),
    after: formatConfigDisplayValue(settings),
  });
}

function readPunches(): PunchRecord[] {
  try {
    const raw = localStorage.getItem(PUNCHES_STORAGE_KEY);
    if (!raw) return seedDemoPunches();
    const parsed = JSON.parse(raw) as Partial<PunchRecord>[];
    if (!Array.isArray(parsed)) return seedDemoPunches();
    const punches: PunchRecord[] = parsed
      .filter((p) => p?.id && p?.employeeId && p?.timestamp && p?.type)
      .map((p) => {
        const source: PunchRecord["source"] =
          p.source === "terminal" ? "terminal" : p.source === "auto" ? "auto" : "manager";
        return {
          id: String(p.id),
          employeeId: String(p.employeeId),
          timestamp: String(p.timestamp),
          type: p.type as PunchType,
          source,
          note: typeof p.note === "string" ? p.note : undefined,
          breakLabel: typeof p.breakLabel === "string" ? p.breakLabel : undefined,
        };
      });
    if (punches.length === 0) return seedDemoPunches();
    // 旧演示数据用 emp-demo-*，与花名册 roster-preset-* 对不上时重新灌入
    const empIds = new Set(readEmployees().map((e) => e.id));
    if (empIds.size > 0 && !punches.some((p) => empIds.has(p.employeeId))) {
      return seedDemoPunches();
    }
    return punches;
  } catch {
    return seedDemoPunches();
  }
}

function writePunches(punches: PunchRecord[]): void {
  localStorage.setItem(PUNCHES_STORAGE_KEY, JSON.stringify(punches));
}

/** 本地日期 + 时分 → ISO（与打卡展示/按日筛选一致） */
function punchAt(date: string, hour: number, minute: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOffsetIso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

/** 用真实花名册员工生成演示打卡（无花名册时回退 DEFAULT_EMPLOYEES） */
function pickSeedEmployees(): RosterEmployee[] {
  const fromRoster = readEmployees().filter((e) => e.id && e.id !== "emp-boss");
  if (fromRoster.length > 0) return fromRoster;
  return DEFAULT_EMPLOYEES.filter((e) => e.id !== "emp-boss");
}

/**
 * 近 7 天考勤演示数据：按花名册员工生成完整班次 / 休息 / 进行中 / 补卡等，
 * 覆盖「考勤记录」默认日期范围，并与门店筛选下的员工 id 对齐。
 */
function seedDemoPunches(): PunchRecord[] {
  const employees = pickSeedEmployees();
  const demo: PunchRecord[] = [];
  let seq = 0;
  const now = new Date();
  const push = (
    employeeId: string,
    date: string,
    hour: number,
    minute: number,
    type: PunchType,
    source: PunchRecord["source"] = "terminal",
    extra?: Pick<PunchRecord, "note" | "breakLabel">,
  ) => {
    const ts = punchAt(date, hour, minute);
    // 今日不写入未来时刻，避免演示数据“穿越”
    if (date === todayIso() && new Date(ts).getTime() > now.getTime()) return;
    demo.push({
      id: `demo-punch-${++seq}`,
      employeeId,
      timestamp: ts,
      type,
      source,
      ...extra,
    });
  };

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = dateOffsetIso(daysAgo);
    const isToday = daysAgo === 0;
    const weekday = new Date(`${date}T12:00:00`).getDay(); // 0 Sun … 6 Sat
    const isWeekend = weekday === 0 || weekday === 6;

    employees.forEach((emp, index) => {
      const pattern = index % 4;

      if (pattern === 0) {
        // 早班 + 午餐；今日仍在岗
        if (isWeekend) return;
        push(emp.id, date, 8, 52, "in");
        push(emp.id, date, 12, 5, "break-start", "terminal", { breakLabel: "用餐休息" });
        push(emp.id, date, 12, 35, "break-end");
        if (!isToday) push(emp.id, date, 17, 8, "out");
        return;
      }

      if (pattern === 1) {
        // 晚班（周一三五；今日过开班时刻后记为在岗）
        if (!(weekday === 1 || weekday === 3 || weekday === 5)) return;
        if (isToday) {
          push(emp.id, date, 16, 50, "in");
        } else {
          push(emp.id, date, 16, 55, "in");
          push(emp.id, date, 19, 30, "break-start", "terminal", { breakLabel: "用餐休息" });
          push(emp.id, date, 20, 0, "break-end");
          push(emp.id, date, 23, 5, "out");
        }
        return;
      }

      if (pattern === 2) {
        // 早班；含迟到补卡日 / 今日未下班
        if (isWeekend) return;
        if (daysAgo === 2) {
          push(emp.id, date, 9, 25, "in", "manager", { note: "迟到补卡" });
          push(emp.id, date, 17, 0, "out", "manager", { note: "手动下班" });
        } else if (isToday) {
          push(emp.id, date, 9, 2, "in");
        } else {
          push(emp.id, date, 8, 58, "in");
          push(emp.id, date, 14, 0, "break-start", "terminal", { breakLabel: "短休" });
          push(emp.id, date, 14, 20, "break-end");
          push(emp.id, date, 17, 2, "out");
        }
        return;
      }

      // pattern === 3：后厨；周末短班 / 今日休息中
      if (isWeekend) {
        push(emp.id, date, 10, 0, "in");
        push(emp.id, date, 15, 0, "out");
      } else if (!isToday) {
        push(emp.id, date, 8, 45, "in");
        push(emp.id, date, 11, 30, "break-start", "terminal", { breakLabel: "短休" });
        push(emp.id, date, 11, 45, "break-end");
        push(emp.id, date, 16, 50, "out");
      } else {
        push(emp.id, date, 8, 48, "in");
        push(emp.id, date, 11, 30, "break-start", "terminal", { breakLabel: "短休" });
      }
    });
  }

  writePunches(demo);
  return demo;
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
      store: e.store ? String(e.store) : undefined,
    }));
  } catch {
    return [...DEFAULT_EMPLOYEES];
  }
}

function normalizeStoreText(value: string): string {
  return value.trim().toLowerCase();
}

function employeeMatchesSelectedStore(emp: RosterEmployee): boolean {
  if (!usesInPageStorePicker()) return true;
  const scope = readScopeFilters();
  if (!scope.store) return true;
  const storeOpt = getScopedFilterOptions().stores.find((o) => o.value === scope.store);
  const matchers = [
    storeOpt?.labelZh,
    storeOpt?.labelEn,
    parseRosterStoreScopeId(scope.store) ?? undefined,
    scope.store,
  ]
    .map((v) => normalizeStoreText(String(v || "")))
    .filter(Boolean);
  if (!matchers.length) return true;
  const empStore = normalizeStoreText(emp.store || "");
  if (!empStore) return true;
  return matchers.some((m) => empStore === m || empStore.includes(m) || m.includes(empStore));
}

function readScopedEmployees(): RosterEmployee[] {
  return readEmployees().filter(employeeMatchesSelectedStore);
}

/** 精简门店筛选：仅标签 + 下拉 */
function renderCompactStoreFilter(): string {
  if (!usesInPageStorePicker()) return "";
  const locale = getUiLocale();
  const stores = getScopedFilterOptions().stores.filter((o) => !!o.value);
  const selected = resolveDefaultScopedStoreId();
  const options = stores
    .map((o) => {
      const lab = escapeHtml(locale === "en" ? o.labelEn : o.labelZh);
      const sel = o.value === selected ? " selected" : "";
      return `<option value="${escapeHtml(o.value)}"${sel}>${lab}</option>`;
    })
    .join("");

  return `
    <div class="flex items-center gap-2" data-clock-store-filter-wrap>
      <label for="clock-store-filter" class="shrink-0 text-sm text-muted-foreground">${escapeHtml(t("header.scopeStore"))}</label>
      <select
        id="clock-store-filter"
        data-clock-store-filter
        class="${FORM_INPUT} w-auto min-w-[10rem] max-w-[16rem]"
        aria-label="${escapeHtml(t("header.scopeStoreAria"))}"
      >
        ${
          stores.length
            ? options
            : `<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`
        }
      </select>
    </div>`;
}

function bindCompactStoreFilter(root: HTMLElement, remount: () => void): void {
  if (ensureInPageDefaultStoreSelected()) {
    remount();
    return;
  }
  const select = root.querySelector<HTMLSelectElement>("[data-clock-store-filter]");
  if (!select || select.dataset.bound === "1") return;
  select.dataset.bound = "1";
  select.addEventListener("change", () => {
    const storeId = select.value;
    if (!storeId) return;
    const scope = readScopeFilters();
    writeScopeFilters({ ...scope, store: storeId });
    remount();
  });
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

function writeAssignmentsQuiet(assignments: ShiftAssignment[]): void {
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
}

function pickDemoShiftPair(): { morning: ShiftType; evening: ShiftType } | null {
  const shifts = readShiftTypes();
  if (!shifts.length) return null;
  const morning =
    shifts.find((s) => /早|morning/i.test(s.name) || s.id.includes("morning")) ?? shifts[0]!;
  const evening =
    shifts.find((s) => /晚|evening/i.test(s.name) || s.id.includes("evening")) ??
    shifts[Math.min(1, shifts.length - 1)]!;
  return { morning, evening };
}

/**
 * 打卡管理所选日期若尚无排班，按员工补齐演示排班，使「排班」列可展示。
 * 当日已有任意排班时不覆盖，避免干扰用户手动排班。
 */
function ensureDemoAssignmentsForDate(date: string): void {
  if (!date) return;
  const employees = readScopedEmployees().filter((e) => e.id && e.id !== "emp-boss");
  if (!employees.length) return;
  const pair = pickDemoShiftPair();
  if (!pair) return;

  const assignments = readAssignments();
  const empIds = new Set(employees.map((e) => e.id));
  const hasAnyForDate = assignments.some((a) => a.date === date && empIds.has(a.employeeId));
  if (hasAnyForDate) return;

  const weekday = new Date(`${date}T12:00:00`).getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const next = [...assignments];

  employees.forEach((emp, index) => {
    const pattern = index % 4;
    let shiftId: string | null = null;
    if (pattern === 0 || pattern === 2) {
      if (!isWeekend) shiftId = pair.morning.id;
    } else if (pattern === 1) {
      if (weekday === 1 || weekday === 3 || weekday === 5) shiftId = pair.evening.id;
    } else {
      shiftId = pair.morning.id;
    }
    if (!shiftId) return;
    next.push({ employeeId: emp.id, date, shiftId });
  });

  if (next.length !== assignments.length) writeAssignmentsQuiet(next);
}

function formatScheduleText(employeeId: string, date: string): string {
  const assignment = getAssignment(employeeId, date);
  if (!assignment) return "—";
  const shift = readShiftTypes().find((t) => t.id === assignment.shiftId);
  if (shift) {
    const times = getEffectiveShiftTimes(assignment, shift);
    return `${shift.name} ${times.start}–${times.end}`;
  }
  if (assignment.overrideStartTime && assignment.overrideEndTime) {
    return `${assignment.overrideStartTime}–${assignment.overrideEndTime}`;
  }
  return "已排班";
}

function readBreakOptions(): { label: string; minutes: number; compensation: "paid" | "unpaid" }[] {
  try {
    const raw = localStorage.getItem(BREAKS_STORAGE_KEY);
    if (!raw) {
      return [
        { label: "用餐休息", minutes: 30, compensation: "unpaid" },
        { label: "短休", minutes: 10, compensation: "paid" },
      ];
    }
    const parsed = JSON.parse(raw) as {
      customBreaks?: { name: string; durationMinutes: number; compensation?: string }[];
    };
    const opts: { label: string; minutes: number; compensation: "paid" | "unpaid" }[] = [];
    for (const b of parsed.customBreaks ?? []) {
      if (b?.name) {
        opts.push({
          label: b.name,
          minutes: b.durationMinutes || 10,
          compensation: b.compensation === "paid" ? "paid" : "unpaid",
        });
      }
    }
    return opts.length > 0 ? opts : [{ label: "休息", minutes: 15, compensation: "unpaid" }];
  } catch {
    return [{ label: "休息", minutes: 15, compensation: "unpaid" }];
  }
}

function resolveBreakCompensation(label?: string): "paid" | "unpaid" {
  if (!label) return "unpaid";
  const hit = readBreakOptions().find((o) => o.label === label);
  return hit?.compensation ?? "unpaid";
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
  let openBreakCompensation: "paid" | "unpaid" = "unpaid";
  let status: TimecardStatus = "off";
  let workedMinutes = 0;
  let unpaidBreakMinutes = 0;
  let paidBreakMinutes = 0;
  let segmentStart: string | null = null;

  const addBreakMinutes = (mins: number, compensation: "paid" | "unpaid") => {
    if (compensation === "paid") paidBreakMinutes += mins;
    else unpaidBreakMinutes += mins;
  };

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
        openBreakCompensation = resolveBreakCompensation(p.breakLabel);
        status = "break";
        break;
      case "break-end":
        if (openBreakStart) {
          addBreakMinutes(minutesBetween(openBreakStart, p.timestamp), openBreakCompensation);
          openBreakStart = null;
        }
        if (clockIn && !clockOut) {
          segmentStart = p.timestamp;
          status = "working";
        }
        break;
      case "out":
        if (status === "break" && openBreakStart) {
          addBreakMinutes(minutesBetween(openBreakStart, p.timestamp), openBreakCompensation);
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
    addBreakMinutes(minutesBetween(openBreakStart, nowIso()), openBreakCompensation);
  }

  const breakMinutes = unpaidBreakMinutes + paidBreakMinutes;
  return {
    clockIn,
    clockOut,
    openBreakStart,
    status,
    workedMinutes,
    breakMinutes,
    unpaidBreakMinutes,
    paidBreakMinutes,
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

function collectRoleOptions(employees: RosterEmployee[]): string[] {
  const seen = new Set<string>();
  const roles: string[] = [];
  for (const e of employees) {
    const role = String(e.role || "").trim();
    if (!role) continue;
    const key = role.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    roles.push(role);
  }
  return roles.sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function renderRoleFilterOptions(employees: RosterEmployee[], selected: string): string {
  const opts = [`<option value="">全部角色</option>`];
  for (const role of collectRoleOptions(employees)) {
    const sel = role === selected ? " selected" : "";
    opts.push(`<option value="${escapeHtml(role)}"${sel}>${escapeHtml(role)}</option>`);
  }
  return opts.join("");
}

function employeesMatchingRole(employees: RosterEmployee[], roleFilter: string): RosterEmployee[] {
  if (!roleFilter) return employees;
  return employees.filter((e) => String(e.role || "").trim() === roleFilter);
}

const FILTER_SELECT_CLASS =
  "h-9 w-auto min-w-[10rem] shrink-0 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

function renderStatusFilterSelect(): string {
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "全部状态" },
    { key: "off", label: "未打卡" },
    { key: "working", label: "在岗" },
    { key: "break", label: "休息中" },
    { key: "done", label: "已下班" },
  ];
  const options = tabs
    .map((tab) => {
      const selected = pageState.statusFilter === tab.key ? " selected" : "";
      return `<option value="${tab.key}"${selected}>${escapeHtml(tab.label)}</option>`;
    })
    .join("");
  return `
    <select
      data-clock-status-filter
      class="h-9 w-auto min-w-[8rem] shrink-0 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="按打卡状态筛选"
    >${options}</select>`;
}

function renderClockRow(
  emp: RosterEmployee,
  date: string,
  settings: ClockSettings,
): { html: string; status: TimecardStatus } {
  const punches = getEmployeePunches(emp.id, date);
  const timecard = computeTimecard(punches);
  const alerts = computeAlerts(emp.id, date, timecard, settings);
  const scheduleText = formatScheduleText(emp.id, date);

  const alertHtml =
    alerts.length > 0
      ? alerts.map((a) => `<span class="mr-1 inline-flex rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">${escapeHtml(a)}</span>`).join("")
      : `<span class="text-xs text-muted-foreground">—</span>`;

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
  ensureDemoAssignmentsForDate(pageState.date);
  const settings = readSettings();
  const employees = readScopedEmployees();
  const roleFiltered = employeesMatchingRole(employees, pageState.roleFilter);
  // 角色变更后若当前员工不在范围内，忽略员工筛选
  const employeeStillValid =
    !pageState.employeeFilter || roleFiltered.some((e) => e.id === pageState.employeeFilter);
  if (!employeeStillValid) pageState.employeeFilter = "";
  const filteredEmployees = pageState.employeeFilter
    ? roleFiltered.filter((e) => e.id === pageState.employeeFilter)
    : roleFiltered;

  const rowData = filteredEmployees.map((emp) => renderClockRow(emp, pageState.date, settings));
  const statusFiltered =
    pageState.statusFilter === "all"
      ? rowData
      : rowData.filter((r) => r.status === pageState.statusFilter);

  const needsStore =
    usesInPageStorePicker() && !readScopeFilters().store;
  const tableRows = needsStore
    ? `<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-muted-foreground">请先选择门店</td></tr>`
    : statusFiltered.length > 0
      ? statusFiltered.map((r) => r.html).join("")
      : `<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无符合筛选条件的员工</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-clock-live-panel>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        ${renderCompactStoreFilter()}
        <div class="flex min-w-0 flex-nowrap items-center gap-3">
          <div class="flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <input type="date" data-clock-date value="${escapeHtml(pageState.date)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
          </div>
          <select data-clock-role-filter class="${FILTER_SELECT_CLASS}" aria-label="按角色筛选">${renderRoleFilterOptions(employees, pageState.roleFilter)}</select>
          <select data-clock-employee-filter class="${FILTER_SELECT_CLASS}" aria-label="按员工筛选">${renderEmployeeFilterOptions(roleFiltered, pageState.employeeFilter, "全部员工")}</select>
          ${renderStatusFilterSelect()}
        </div>
      </div>

      <div class="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">${renderSummaryCards(needsStore ? [] : rowData)}</div>

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
  const employees = readScopedEmployees();
  const roleFiltered = employeesMatchingRole(employees, attendancePageState.roleFilter);
  const employeeStillValid =
    !attendancePageState.employeeFilter ||
    roleFiltered.some((e) => e.id === attendancePageState.employeeFilter);
  if (!employeeStillValid) attendancePageState.employeeFilter = "";
  const filteredEmployees = attendancePageState.employeeFilter
    ? roleFiltered.filter((e) => e.id === attendancePageState.employeeFilter)
    : roleFiltered;
  const dates = enumerateDates(attendancePageState.dateFrom, attendancePageState.dateTo);
  const rows: string[] = [];
  const needsStore = usesInPageStorePicker() && !readScopeFilters().store;

  if (!needsStore) {
    const allowedIds = new Set(filteredEmployees.map((e) => e.id));
    for (const date of dates) {
      const dayPunches = readPunches().filter((p) => {
        if (p.timestamp.slice(0, 10) !== date) return false;
        if (!allowedIds.has(p.employeeId)) return false;
        return true;
      });
      for (const emp of filteredEmployees) {
        const punches = dayPunches.filter((p) => p.employeeId === emp.id);
        if (punches.length === 0) continue;
        const timecard = computeTimecard(punches.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
        const totalMinutes = timecard.workedMinutes + timecard.breakMinutes;
        rows.push(`
        <tr class="border-b border-border/60 hover:bg-muted/20">
          <td class="px-3 py-2.5 text-sm">${escapeHtml(date)}</td>
          <td class="px-3 py-2.5 text-sm font-medium">${escapeHtml(emp.name)}</td>
          <td class="px-3 py-2.5"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(timecard.status)}">${statusLabel(timecard.status)}</span></td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${formatTime(timecard.clockIn)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${formatTime(timecard.clockOut)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${formatDuration(timecard.workedMinutes)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">${formatDuration(timecard.unpaidBreakMinutes)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">${formatDuration(timecard.paidBreakMinutes)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums font-medium">${formatDuration(totalMinutes)}</td>
          <td class="px-3 py-2.5 text-sm tabular-nums">${punches.length}</td>
        </tr>`);
      }
    }
  }

  const tableBody = needsStore
    ? `<tr><td colspan="10" class="px-4 py-10 text-center text-sm text-muted-foreground">请先选择门店</td></tr>`
    : rows.length > 0
      ? rows.join("")
      : `<tr><td colspan="10" class="px-4 py-10 text-center text-sm text-muted-foreground">所选日期范围内暂无考勤记录</td></tr>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-clock-records-panel>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        ${renderCompactStoreFilter()}
        <div class="flex min-w-0 flex-nowrap items-center gap-3">
          <div class="flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
            <input type="date" data-attendance-date-from value="${escapeHtml(attendancePageState.dateFrom)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
            <span class="text-muted-foreground">→</span>
            <input type="date" data-attendance-date-to value="${escapeHtml(attendancePageState.dateTo)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
          </div>
          <select data-attendance-role-filter class="${FILTER_SELECT_CLASS}" aria-label="按角色筛选">${renderRoleFilterOptions(employees, attendancePageState.roleFilter)}</select>
          <select data-attendance-employee-filter class="${FILTER_SELECT_CLASS}" aria-label="按员工筛选">${renderEmployeeFilterOptions(roleFiltered, attendancePageState.employeeFilter, "全部员工")}</select>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table class="w-full min-w-[56rem] text-left text-sm">
          <thead class="border-b border-border bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2.5 font-medium">日期</th>
              <th class="px-3 py-2.5 font-medium">员工</th>
              <th class="px-3 py-2.5 font-medium">状态</th>
              <th class="px-3 py-2.5 font-medium">上班</th>
              <th class="px-3 py-2.5 font-medium">下班</th>
              <th class="px-3 py-2.5 font-medium">工时</th>
              <th class="px-3 py-2.5 font-medium">无薪休息</th>
              <th class="px-3 py-2.5 font-medium">带薪休息</th>
              <th class="px-3 py-2.5 font-medium">总时长</th>
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
  const rulesPanel =
    clockTab === "rules"
      ? `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-clock-rules-wrap>
      <div class="flex shrink-0 flex-wrap items-center gap-3">${renderCompactStoreFilter()}</div>
      ${
        usesInPageStorePicker() && !readScopeFilters().store
          ? `<div class="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">请先选择门店后再配置规则</div>`
          : rulesPanelHtml
      }
    </div>`
      : "";

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
  root.querySelector("[data-attendance-role-filter]")?.addEventListener("change", () => {
    attendancePageState.roleFilter =
      root.querySelector<HTMLSelectElement>("[data-attendance-role-filter]")?.value ?? "";
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
  bindCompactStoreFilter(root, remount);

  root.querySelector("[data-clock-date]")?.addEventListener("change", () => {
    const el = root.querySelector<HTMLInputElement>("[data-clock-date]");
    if (el?.value) pageState.date = el.value;
    remount();
  });

  root.querySelector("[data-clock-role-filter]")?.addEventListener("change", () => {
    pageState.roleFilter = root.querySelector<HTMLSelectElement>("[data-clock-role-filter]")?.value ?? "";
    remount();
  });

  root.querySelector("[data-clock-employee-filter]")?.addEventListener("change", () => {
    pageState.employeeFilter = root.querySelector<HTMLSelectElement>("[data-clock-employee-filter]")?.value ?? "";
    remount();
  });

  root.querySelector("[data-clock-status-filter]")?.addEventListener("change", () => {
    const el = root.querySelector<HTMLSelectElement>("[data-clock-status-filter]");
    const key = (el?.value || "all") as StatusFilter;
    if (key === "all" || key === "off" || key === "working" || key === "break" || key === "done") {
      pageState.statusFilter = key;
      remount();
    }
  });

  root.querySelector("[data-clock-late-grace]")?.addEventListener("change", () => {
    persistClockSettingsFromDom(root);
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

