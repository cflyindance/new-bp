/**
 * 团队管理 · 排班（员工排班表，seq 437）
 * 路径：/team/shift-scheduling
 * Tab：排班表 | 班次 | 规则设置
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
import { clearPageConfigChanges } from "./deployment-change-buffer";
import { diffCollection, type CollectionAdapter } from "./collection-change-diff";
import { resolveChangeGroupPath } from "./module-settings-deployment-change";
import { replacePageOrImmediateConfigChange } from "./page-config-change";
import {
  registerPageSaveDirtyProbe,
  registerPageSavePreCommit,
} from "./page-save-registry";
import { parseRosterStoreScopeId } from "./team-employee-roster-scope";

export const TEAM_SHIFT_SCHEDULING_PATH = "/team/shift-scheduling";

const SHIFT_TYPES_STORAGE_KEY = "bplant-team-shift-types-v1";
const ASSIGNMENTS_STORAGE_KEY = "bplant-team-shift-assignments-v1";
const EMPLOYEES_STORAGE_KEY = "tipout-employees-roster-v1";
const BREAKS_OVERTIME_STORAGE_KEY = "bplant-team-breaks-overtime-v1";

const DEFAULT_CUSTOM_BREAKS: CustomBreakOption[] = [
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
];

const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

type QuickPreset = "last-week" | "last-this-week" | "this-week" | "this-next-week" | "next-week" | "this-month";

type ShiftType = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  /** 所属门店 ID；空表示全部门店通用 */
  storeId?: string;
  /** 上班提前打卡（分钟） */
  earlyClockInMinutes: number;
  /** 是否启用下班自动打卡延迟 */
  autoClockOutDelayEnabled: boolean;
  /** 下班自动打卡延迟（分钟） */
  autoClockOutDelayMinutes: number;
  /** 班次默认是否安排休息 */
  breakEnabled?: boolean;
  /** 默认休息 ID */
  breakId?: string;
  /** 默认休息名称快照 */
  breakName?: string;
  /** 默认休息补偿 */
  breakCompensation?: "paid" | "unpaid";
  /** 默认休息时长（分钟） */
  breakDurationMinutes?: number;
  /** 默认是否强制休息 */
  breakMandatory?: boolean;
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
  /** 选用的自定义休息 ID */
  breakId?: string;
  /** 休息名称快照 */
  breakName?: string;
  /** 当日休息补偿：带薪 / 无薪 */
  breakCompensation?: "paid" | "unpaid";
  /** 当日休息时长（分钟） */
  breakDurationMinutes?: number;
  /** 是否强制休息 */
  breakMandatory?: boolean;
  /** 是否安排休息；缺省时兼容：有休息明细视为 true */
  breakEnabled?: boolean;
  /** 长工时手动关闭休息时的可选原因 */
  breakSkipReason?: string;
};

type CustomBreakOption = {
  id: string;
  name: string;
  durationMinutes: number;
  compensation: "paid" | "unpaid";
  mandatory: boolean;
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
  /** 员工筛选：空数组表示全部员工 */
  employeeFilterIds: string[];
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
  quickPreset: "this-week",
  employeeFilterIds: [],
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

type ShiftPageTab = "schedule" | "shifts" | "rules";

/** 排班页顶部 Tab：排班表 | 班次 | 规则设置 */
let shiftPageTab: ShiftPageTab = "schedule";
/** 「班次」Tab 门店筛选（storeId） */
let shiftConfigStoreFilter = "";
/** 新增/编辑班次弹窗；null 表示关闭 */
let shiftFormEditor: { mode: "create" | "edit"; shift: ShiftType } | null = null;
/** 排班表 · 员工多选筛选下拉是否展开 */
let employeeFilterDropdownOpen = false;
/** 排班表 · 员工多选筛选搜索词 */
let employeeFilterSearchQuery = "";
/** 员工筛选下拉：点击外部关闭的监听（避免 remount 重复绑定） */
let employeeFilterOutsideCloser: ((e: MouseEvent) => void) | null = null;
/** 安排排班弹窗 · 员工多选下拉是否展开 */
let editEmployeeDropdownOpen = false;
/** 安排排班弹窗 · 员工多选搜索词 */
let editEmployeeSearchQuery = "";
/** 安排排班弹窗员工多选：点击外部关闭 */
let editEmployeeOutsideCloser: ((e: MouseEvent) => void) | null = null;
/** 删除班次确认弹窗中的班次 id；null 表示关闭 */
let shiftDeleteConfirmId: string | null = null;
let cellEditor: {
  date: string;
  employeeIds: string[];
  /** 来自「员工排班」入口时日期可改，并允许员工为空再自选 */
  dateEditable: boolean;
  repeatMode: RepeatMode;
  repeatWeekdays: number[];
  /** 是否安排休息 */
  breakEnabled: boolean;
  /** 长工时关闭休息的可选原因 */
  breakSkipReason: string;
  /** 用户是否已手动改过「安排休息」开关 */
  breakSwitchTouched: boolean;
} | null = null;

/** 超过该工时（小时）默认要求安排休息 */
const BREAK_REQUIRED_HOURS_THRESHOLD = 4;

function defaultBreakEnabledForWorkHours(hours: number): boolean {
  if (!Number.isFinite(hours) || hours <= 0) return false;
  return hours > BREAK_REQUIRED_HOURS_THRESHOLD;
}

function assignmentHasBreak(a: ShiftAssignment | undefined): boolean {
  if (!a) return false;
  if (a.breakEnabled === false) return false;
  if (a.breakEnabled === true) return true;
  return !!(a.breakId || a.breakName);
}

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

/** 本地日历「今天」YYYY-MM-DD */
function todayIso(): string {
  return isoDate(new Date());
}

/** 今天及以后可排班；历史日期只读 */
function isScheduleDateEditable(date: string): boolean {
  return date >= todayIso();
}

/** 「员工排班」默认日期：今天（始终可排） */
function defaultEmployeeScheduleDate(): string {
  return todayIso();
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
  const thisWeekStart = startOfWeekMonday(new Date());
  pageState.dateFrom = isoDate(thisWeekStart);
  pageState.dateTo = isoDate(addDays(thisWeekStart, 6));
}

if (!pageState.dateFrom) initDefaultDateRange();

function normalizeShiftType(raw: Partial<ShiftType> & Pick<ShiftType, "id" | "name" | "startTime" | "endTime">): ShiftType {
  const storeId = typeof raw.storeId === "string" ? raw.storeId.trim() : "";
  const base: ShiftType = {
    id: raw.id,
    name: raw.name,
    startTime: raw.startTime,
    endTime: raw.endTime,
    color: raw.color?.startsWith("#") ? raw.color : "#dbeafe",
    storeId: storeId || undefined,
    earlyClockInMinutes:
      typeof raw.earlyClockInMinutes === "number" && raw.earlyClockInMinutes >= 0 ? raw.earlyClockInMinutes : 15,
    autoClockOutDelayEnabled: !!raw.autoClockOutDelayEnabled,
    autoClockOutDelayMinutes:
      typeof raw.autoClockOutDelayMinutes === "number" && raw.autoClockOutDelayMinutes >= 0
        ? raw.autoClockOutDelayMinutes
        : 30,
  };
  if (raw.breakEnabled === true) {
    base.breakEnabled = true;
    if (typeof raw.breakId === "string" && raw.breakId) base.breakId = raw.breakId;
    if (typeof raw.breakName === "string" && raw.breakName.trim()) base.breakName = raw.breakName.trim();
    if (raw.breakCompensation === "paid" || raw.breakCompensation === "unpaid") {
      base.breakCompensation = raw.breakCompensation;
    }
    if (typeof raw.breakDurationMinutes === "number" && raw.breakDurationMinutes > 0) {
      base.breakDurationMinutes = raw.breakDurationMinutes;
    }
    if (typeof raw.breakMandatory === "boolean") base.breakMandatory = raw.breakMandatory;
  } else if (raw.breakEnabled === false) {
    base.breakEnabled = false;
  } else if (typeof raw.breakId === "string" && raw.breakId) {
    // 兼容旧数据：仅有 breakId 视为开启
    base.breakEnabled = true;
    base.breakId = raw.breakId;
    if (typeof raw.breakName === "string" && raw.breakName.trim()) base.breakName = raw.breakName.trim();
    if (raw.breakCompensation === "paid" || raw.breakCompensation === "unpaid") {
      base.breakCompensation = raw.breakCompensation;
    }
    if (typeof raw.breakDurationMinutes === "number" && raw.breakDurationMinutes > 0) {
      base.breakDurationMinutes = raw.breakDurationMinutes;
    }
    if (typeof raw.breakMandatory === "boolean") base.breakMandatory = raw.breakMandatory;
  }
  return base;
}

function shiftTypeHasBreak(t: ShiftType | undefined): boolean {
  if (!t) return false;
  if (t.breakEnabled === false) return false;
  if (t.breakEnabled === true) return true;
  return !!t.breakId;
}

function shiftMatchesStoreFilter(shift: ShiftType, storeId: string): boolean {
  if (!storeId) return true;
  if (!shift.storeId) return true;
  return shift.storeId === storeId;
}

function filterShiftTypesByStore(types: ShiftType[], storeId: string): ShiftType[] {
  if (!storeId) return types;
  return types.filter((t) => shiftMatchesStoreFilter(t, storeId));
}

function listShiftStoreOptions(): { value: string; label: string }[] {
  const locale = getUiLocale();
  return getScopedFilterOptions()
    .stores.filter((o) => !!o.value)
    .map((o) => ({
      value: o.value,
      label: locale === "en" ? o.labelEn : o.labelZh,
    }));
}

function renderShiftStoreFilterSelect(
  selectedStoreId: string,
  opts: { id: string; dataAttr: string; allowAll?: boolean; className?: string },
): string {
  const stores = listShiftStoreOptions();
  const allowAll = opts.allowAll === true;
  const preferred = selectedStoreId || resolveDefaultScopedStoreId();
  const selected =
    preferred && stores.some((o) => o.value === preferred) ? preferred : stores[0]?.value || "";
  const options = [
    ...(allowAll
      ? [`<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`]
      : []),
    ...stores.map((o) => {
      const sel = o.value === selected ? " selected" : "";
      return `<option value="${escapeHtml(o.value)}"${sel}>${escapeHtml(o.label)}</option>`;
    }),
  ].join("");
  return `
    <select
      id="${escapeHtml(opts.id)}"
      ${opts.dataAttr}
      class="${opts.className ?? "h-9 w-auto min-w-[10rem] max-w-[16rem] shrink-0 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}"
      aria-label="${escapeHtml(t("header.scopeStoreAria"))}"
    >${options || `<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`}</select>`;
}

function readShiftTypes(): ShiftType[] {
  try {
    const raw = localStorage.getItem(SHIFT_TYPES_STORAGE_KEY);
    // 无 key：预置三班；已存 []：保持空（不回落预置）
    if (!raw) return DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
    const parsed = JSON.parse(raw) as Partial<ShiftType>[];
    if (!Array.isArray(parsed)) return DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
    if (parsed.length === 0) return [];
    return parsed
      .filter((t) => t?.id && t?.name && t?.startTime && t?.endTime)
      .map((t) => normalizeShiftType(t as ShiftType));
  } catch {
    return DEFAULT_SHIFT_TYPES.map((t) => ({ ...t }));
  }
}

function writeShiftTypes(types: ShiftType[]): void {
  const before = readShiftTypes();
  if (JSON.stringify(before) === JSON.stringify(types)) return;
  ensureShiftTypesBaseline(before);
  localStorage.setItem(SHIFT_TYPES_STORAGE_KEY, JSON.stringify(types));
  rerecordShiftTypesChange(types);
}

function writeAssignments(assignments: ShiftAssignment[]): void {
  const before = readAssignments();
  if (JSON.stringify(before) === JSON.stringify(assignments)) return;
  ensureAssignmentsBaseline(before);
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  rerecordAssignmentsChange(assignments);
}

let shiftTypesBaseline: ShiftType[] | null = null;
let assignmentsBaseline: ShiftAssignment[] | null = null;

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureShiftTypesBaseline(types: ShiftType[]): ShiftType[] {
  if (!shiftTypesBaseline) shiftTypesBaseline = cloneJson(types);
  return shiftTypesBaseline;
}

function ensureAssignmentsBaseline(assignments: ShiftAssignment[]): ShiftAssignment[] {
  if (!assignmentsBaseline) assignmentsBaseline = cloneJson(assignments);
  return assignmentsBaseline;
}

const SHIFT_TYPE_ADAPTER: CollectionAdapter<ShiftType> = {
  collectionKey: "team.shift-types",
  collectionLabel: "班次类型",
  idOf: (item) => item.id,
  labelOf: (item) => item.name || item.id,
  fields: [
    { key: "name", label: "名称", get: (i) => i.name },
    { key: "startTime", label: "开始时间", get: (i) => i.startTime },
    { key: "endTime", label: "结束时间", get: (i) => i.endTime },
    { key: "color", label: "颜色", get: (i) => i.color },
    { key: "storeId", label: "所属门店", get: (i) => i.storeId || "全部门店" },
    { key: "earlyClockInMinutes", label: "提前打卡（分钟）", get: (i) => i.earlyClockInMinutes },
    {
      key: "autoClockOutDelayEnabled",
      label: "下班自动打卡延迟",
      get: (i) => i.autoClockOutDelayEnabled,
      format: (v) => (v ? "开启" : "关闭"),
    },
    { key: "autoClockOutDelayMinutes", label: "延迟分钟", get: (i) => i.autoClockOutDelayMinutes },
    {
      key: "breakEnabled",
      label: "默认安排休息",
      get: (i) => i.breakEnabled ?? false,
      format: (v) => (v ? "是" : "否"),
    },
    { key: "breakName", label: "默认休息", get: (i) => i.breakName || "—" },
    {
      key: "breakCompensation",
      label: "默认休息补偿",
      get: (i) => i.breakCompensation,
      format: (v) => (v === "paid" ? "带薪" : v === "unpaid" ? "无薪" : "—"),
    },
    { key: "breakDurationMinutes", label: "默认休息时长", get: (i) => i.breakDurationMinutes ?? "—" },
    {
      key: "breakMandatory",
      label: "默认强制休息",
      get: (i) => i.breakMandatory ?? false,
      format: (v) => (v ? "是" : "否"),
    },
  ],
};

function assignmentEntityId(a: ShiftAssignment): string {
  return `${a.date}|${a.employeeId}|${a.shiftId}`;
}

function assignmentEntityLabel(a: ShiftAssignment): string {
  const emp = readEmployees().find((e) => e.id === a.employeeId);
  const shift = readShiftTypes().find((s) => s.id === a.shiftId);
  const name = emp?.name || a.employeeId;
  const shiftName = shift?.name || a.shiftId;
  return `${a.date} · ${name} · ${shiftName}`;
}

const SHIFT_ASSIGNMENT_ADAPTER: CollectionAdapter<ShiftAssignment> = {
  collectionKey: "team.shift-assignments",
  collectionLabel: "排班安排",
  idOf: assignmentEntityId,
  labelOf: assignmentEntityLabel,
  fields: [
    { key: "date", label: "日期", get: (i) => i.date },
    {
      key: "employeeId",
      label: "员工",
      get: (i) => i.employeeId,
      format: (v) => readEmployees().find((e) => e.id === v)?.name ?? String(v),
    },
    {
      key: "shiftId",
      label: "班次",
      get: (i) => i.shiftId,
      format: (v) => readShiftTypes().find((s) => s.id === v)?.name ?? String(v),
    },
    { key: "overrideStartTime", label: "特殊开始时间", get: (i) => i.overrideStartTime || "—" },
    { key: "overrideEndTime", label: "特殊结束时间", get: (i) => i.overrideEndTime || "—" },
    {
      key: "overrideEarlyClockInMinutes",
      label: "当日提前打卡",
      get: (i) => i.overrideEarlyClockInMinutes ?? "—",
    },
    {
      key: "overrideAutoClockOutDelayEnabled",
      label: "当日自动打卡延迟",
      get: (i) => i.overrideAutoClockOutDelayEnabled,
      format: (v) => (v === true ? "开启" : v === false ? "关闭" : "—"),
    },
    {
      key: "overrideAutoClockOutDelayMinutes",
      label: "当日延迟分钟",
      get: (i) => i.overrideAutoClockOutDelayMinutes ?? "—",
    },
    {
      key: "breakEnabled",
      label: "安排休息",
      get: (i) => i.breakEnabled,
      format: (v) => (v === true ? "是" : v === false ? "否" : "—"),
    },
    { key: "breakName", label: "休息", get: (i) => i.breakName || "—" },
    {
      key: "breakCompensation",
      label: "休息补偿",
      get: (i) => i.breakCompensation,
      format: (v) => (v === "paid" ? "带薪" : v === "unpaid" ? "无薪" : "—"),
    },
    { key: "breakDurationMinutes", label: "休息时长", get: (i) => i.breakDurationMinutes ?? "—" },
    {
      key: "breakMandatory",
      label: "强制休息",
      get: (i) => i.breakMandatory,
      format: (v) => (v === true ? "是" : v === false ? "否" : "—"),
    },
    { key: "breakSkipReason", label: "跳过休息原因", get: (i) => i.breakSkipReason || "—" },
  ],
};

function rerecordShiftTypesChange(types: ShiftType[]): void {
  const baseline = ensureShiftTypesBaseline(types);
  const groupPath = resolveChangeGroupPath(TEAM_SHIFT_SCHEDULING_PATH);
  const change = diffCollection(baseline, types, SHIFT_TYPE_ADAPTER, {
    settingsPath: TEAM_SHIFT_SCHEDULING_PATH,
    groupPath,
  });
  replacePageOrImmediateConfigChange(
    TEAM_SHIFT_SCHEDULING_PATH,
    change ?? {
      fieldKey: SHIFT_TYPE_ADAPTER.collectionKey,
      label: SHIFT_TYPE_ADAPTER.collectionLabel,
      before: "原 0 项",
      after: "现 0 项",
      entities: [],
      changeKind: "collection",
      settingsPath: TEAM_SHIFT_SCHEDULING_PATH,
      groupPath,
    },
  );
}

function rerecordAssignmentsChange(assignments: ShiftAssignment[]): void {
  const baseline = ensureAssignmentsBaseline(assignments);
  const groupPath = resolveChangeGroupPath(TEAM_SHIFT_SCHEDULING_PATH);
  const change = diffCollection(baseline, assignments, SHIFT_ASSIGNMENT_ADAPTER, {
    settingsPath: TEAM_SHIFT_SCHEDULING_PATH,
    groupPath,
  });
  replacePageOrImmediateConfigChange(
    TEAM_SHIFT_SCHEDULING_PATH,
    change ?? {
      fieldKey: SHIFT_ASSIGNMENT_ADAPTER.collectionKey,
      label: SHIFT_ASSIGNMENT_ADAPTER.collectionLabel,
      before: "原 0 项",
      after: "现 0 项",
      entities: [],
      changeKind: "collection",
      settingsPath: TEAM_SHIFT_SCHEDULING_PATH,
      groupPath,
    },
  );
}

let shiftSchedulingRegistryBound = false;

function ensureShiftSchedulingPageSaveRegistry(): void {
  if (shiftSchedulingRegistryBound) return;
  shiftSchedulingRegistryBound = true;

  registerPageSavePreCommit(TEAM_SHIFT_SCHEDULING_PATH, () => {
    ensureShiftTypesBaseline(readShiftTypes());
    ensureAssignmentsBaseline(readAssignments());
    rerecordShiftTypesChange(readShiftTypes());
    rerecordAssignmentsChange(readAssignments());
    return true;
  });

  registerPageSaveDirtyProbe(TEAM_SHIFT_SCHEDULING_PATH, () => {
    try {
      const typesDirty =
        !!shiftTypesBaseline && JSON.stringify(shiftTypesBaseline) !== JSON.stringify(readShiftTypes());
      const assignmentsDirty =
        !!assignmentsBaseline &&
        JSON.stringify(assignmentsBaseline) !== JSON.stringify(readAssignments());
      return typesDirty || assignmentsDirty;
    } catch {
      return false;
    }
  });

  window.addEventListener("menusifu:page-settings-discard", (event) => {
    const pageKey = (event as CustomEvent<{ pageKey?: string }>).detail?.pageKey;
    if (pageKey !== TEAM_SHIFT_SCHEDULING_PATH) return;
    if (shiftTypesBaseline) {
      localStorage.setItem(SHIFT_TYPES_STORAGE_KEY, JSON.stringify(shiftTypesBaseline));
    }
    if (assignmentsBaseline) {
      localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignmentsBaseline));
    }
    clearPageConfigChanges(TEAM_SHIFT_SCHEDULING_PATH);
  });

  window.addEventListener("menusifu:page-settings-saved", (event) => {
    const pageKey = (event as CustomEvent<{ pageKey?: string }>).detail?.pageKey;
    if (pageKey !== TEAM_SHIFT_SCHEDULING_PATH) return;
    shiftTypesBaseline = cloneJson(readShiftTypes());
    assignmentsBaseline = cloneJson(readAssignments());
  });
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
  if (typeof raw.breakId === "string" && raw.breakId) {
    assignment.breakId = raw.breakId;
  }
  if (typeof raw.breakName === "string" && raw.breakName.trim()) {
    assignment.breakName = raw.breakName.trim();
  }
  if (raw.breakCompensation === "paid" || raw.breakCompensation === "unpaid") {
    assignment.breakCompensation = raw.breakCompensation;
  }
  if (typeof raw.breakDurationMinutes === "number" && raw.breakDurationMinutes > 0) {
    assignment.breakDurationMinutes = Math.round(raw.breakDurationMinutes);
  }
  if (typeof raw.breakMandatory === "boolean") {
    assignment.breakMandatory = raw.breakMandatory;
  }
  if (typeof raw.breakEnabled === "boolean") {
    assignment.breakEnabled = raw.breakEnabled;
  } else if (assignment.breakId || assignment.breakName) {
    assignment.breakEnabled = true;
  }
  if (typeof raw.breakSkipReason === "string" && raw.breakSkipReason.trim()) {
    assignment.breakSkipReason = raw.breakSkipReason.trim();
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

/** 精简门店筛选：仅标签 + 下拉，置于日期选择器左侧 */
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
    <div class="flex shrink-0 items-center gap-2" data-shift-store-filter-wrap>
      <label for="shift-store-filter" class="shrink-0 text-sm text-muted-foreground">${escapeHtml(t("header.scopeStore"))}</label>
      <select
        id="shift-store-filter"
        data-shift-store-filter
        class="h-9 w-auto min-w-[10rem] max-w-[16rem] shrink-0 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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


function getAssignment(employeeId: string, date: string): ShiftAssignment | undefined {
  return readAssignments().find((a) => a.employeeId === employeeId && a.date === date);
}

/** 指定日期已排某班次的员工 id */
function employeeIdsAssignedToShiftOnDate(date: string, shiftId: string): Set<string> {
  if (!date || !shiftId) return new Set();
  return new Set(
    readAssignments()
      .filter((a) => a.date === date && a.shiftId === shiftId)
      .map((a) => a.employeeId),
  );
}

/**
 * 「员工排班」入口：已选班次时，当日已排该班次的员工不出现在可选列表。
 * 点格子进入时不过滤。
 */
function getEditDialogSelectableEmployees(dialog: HTMLElement): RosterEmployee[] {
  const all = readScopedEmployees();
  if (!cellEditor?.dateEditable) return all;
  const shiftId = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-shift]")?.value ?? "";
  if (!shiftId) return all;
  const taken = employeeIdsAssignedToShiftOnDate(cellEditor.date, shiftId);
  return all.filter((e) => !taken.has(e.id));
}

/** 读取「休息与加班 · 自定义休息」列表，供排班选用 */
function readCustomBreakOptions(): CustomBreakOption[] {
  try {
    const raw = localStorage.getItem(BREAKS_OVERTIME_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOM_BREAKS.map((b) => ({ ...b }));
    const parsed = JSON.parse(raw) as {
      customBreaks?: {
        id?: unknown;
        name?: unknown;
        durationMinutes?: unknown;
        compensation?: unknown;
        mandatory?: unknown;
      }[];
    };
    const rows = Array.isArray(parsed.customBreaks) ? parsed.customBreaks : [];
    const options = rows
      .map((b, index): CustomBreakOption | null => {
        const name = typeof b.name === "string" ? b.name.trim() : "";
        if (!name) return null;
        return {
          id: typeof b.id === "string" && b.id ? b.id : `custom-break-${index}`,
          name,
          durationMinutes: Math.max(1, Math.round(Number(b.durationMinutes)) || 10),
          compensation: b.compensation === "paid" ? "paid" : "unpaid",
          mandatory: !!b.mandatory,
        };
      })
      .filter((b): b is CustomBreakOption => b != null);
    return options.length > 0 ? options : DEFAULT_CUSTOM_BREAKS.map((b) => ({ ...b }));
  } catch {
    return DEFAULT_CUSTOM_BREAKS.map((b) => ({ ...b }));
  }
}

function resolveCustomBreakSelection(
  preferredId?: string,
  fallback?: {
    breakName?: string;
    breakCompensation?: "paid" | "unpaid";
    breakDurationMinutes?: number;
    breakMandatory?: boolean;
  },
  compensationFilter?: "paid" | "unpaid",
): CustomBreakOption | undefined {
  const compensation =
    compensationFilter ??
    fallback?.breakCompensation ??
    (preferredId
      ? readCustomBreakOptions().find((b) => b.id === preferredId)?.compensation
      : undefined) ??
    "unpaid";
  const options = readCustomBreakOptions().filter((b) => b.compensation === compensation);
  if (preferredId) {
    const byId = options.find((b) => b.id === preferredId);
    if (byId) return byId;
  }
  if (fallback?.breakName) {
    const byName = options.find(
      (b) =>
        b.name === fallback.breakName &&
        (fallback.breakDurationMinutes == null || b.durationMinutes === fallback.breakDurationMinutes),
    );
    if (byName) return byName;
  }
  return options[0];
}

function formatCustomBreakNameOptionLabel(b: CustomBreakOption): string {
  return b.name;
}

function renderCustomBreakNameSelectOptions(
  compensation: "paid" | "unpaid",
  selectedId?: string,
): string {
  const options = readCustomBreakOptions().filter((b) => b.compensation === compensation);
  if (options.length === 0) {
    return `<option value="">该类型下暂无自定义休息</option>`;
  }
  const selected =
    resolveCustomBreakSelection(selectedId, { breakCompensation: compensation }, compensation)?.id ??
    options[0]!.id;
  return options
    .map(
      (b) =>
        `<option value="${escapeHtml(b.id)}"${b.id === selected ? " selected" : ""}>${escapeHtml(formatCustomBreakNameOptionLabel(b))}</option>`,
    )
    .join("");
}

function renderSelectedBreakMetaHtml(
  breakOpt: CustomBreakOption | undefined,
  metaAttr = "data-shift-edit-break-meta",
): string {
  if (!breakOpt) {
    return `<p class="text-xs text-muted-foreground" ${metaAttr}>请先在「休息与加班」配置对应类型的自定义休息</p>`;
  }
  const mandatory = breakOpt.mandatory ? "是" : "否";
  return `<p class="text-xs text-muted-foreground" ${metaAttr}>
    时长 <span class="font-medium text-foreground tabular-nums">${breakOpt.durationMinutes}</span> 分钟
    · 强制 <span class="font-medium text-foreground">${mandatory}</span>
  </p>`;
}

function syncBreakNameSelectInRoot(
  root: HTMLElement,
  compensation: "paid" | "unpaid",
  opts: { idAttr: string; metaAttr: string; preferredId?: string },
): CustomBreakOption | undefined {
  const nameSelect = root.querySelector<HTMLSelectElement>(`[${opts.idAttr}]`);
  if (!nameSelect) return undefined;
  const selected = resolveCustomBreakSelection(
    opts.preferredId ?? nameSelect.value,
    { breakCompensation: compensation },
    compensation,
  );
  nameSelect.innerHTML = renderCustomBreakNameSelectOptions(compensation, selected?.id);
  const oldMeta = root.querySelector(`[${opts.metaAttr}]`);
  if (oldMeta) {
    oldMeta.insertAdjacentHTML("afterend", renderSelectedBreakMetaHtml(selected, opts.metaAttr));
    oldMeta.remove();
  }
  return selected;
}

function syncShiftEditBreakNameSelect(
  dialog: HTMLElement,
  compensation: "paid" | "unpaid",
  preferredId?: string,
): CustomBreakOption | undefined {
  return syncBreakNameSelectInRoot(dialog, compensation, {
    idAttr: "data-shift-edit-break-id",
    metaAttr: "data-shift-edit-break-meta",
    preferredId,
  });
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
    breakEnabled: boolean;
    breakSkipReason?: string;
    breakId?: string;
    breakName?: string;
    breakCompensation?: "paid" | "unpaid";
    breakDurationMinutes?: number;
    breakMandatory?: boolean;
  },
): ShiftAssignment {
  const base: ShiftAssignment = {
    employeeId,
    date,
    shiftId,
    breakEnabled: form.breakEnabled,
  };
  if (form.breakEnabled) {
    if (form.breakId) base.breakId = form.breakId;
    if (form.breakName) base.breakName = form.breakName;
    if (form.breakCompensation) base.breakCompensation = form.breakCompensation;
    if (form.breakDurationMinutes) base.breakDurationMinutes = form.breakDurationMinutes;
    if (form.breakMandatory !== undefined) base.breakMandatory = form.breakMandatory;
  } else if (form.breakSkipReason?.trim()) {
    base.breakSkipReason = form.breakSkipReason.trim();
  }
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
  breakEnabled: boolean,
  breakOpt: CustomBreakOption | null,
  breakSkipReason = "",
): boolean {
  if (employeeIds.length === 0 || dates.length === 0) return false;
  const shift = readShiftTypes().find((t) => t.id === shiftId);
  if (!shift || !startTime || !endTime) return false;
  if (breakEnabled && !breakOpt) return false;
  const form = {
    startTime,
    endTime,
    earlyClockInMinutes,
    autoClockOutDelayEnabled,
    autoClockOutDelayMinutes,
    breakEnabled,
    breakSkipReason: breakEnabled ? undefined : breakSkipReason,
    ...(breakEnabled && breakOpt
      ? {
          breakId: breakOpt.id,
          breakName: breakOpt.name,
          breakCompensation: breakOpt.compensation,
          breakDurationMinutes: breakOpt.durationMinutes,
          breakMandatory: breakOpt.mandatory,
        }
      : {}),
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
  if (repeatMode === "day") {
    return isScheduleDateEditable(anchorDate) ? [anchorDate] : [];
  }
  const weekdays =
    repeatWeekdays.length > 0 ? repeatWeekdays : [parseIsoDate(anchorDate).getDay()];
  return enumerateDates(pageState.dateFrom, pageState.dateTo).filter(
    (d) => weekdays.includes(parseIsoDate(d).getDay()) && isScheduleDateEditable(d),
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
  const next: ShiftAssignment = { employeeId, date, shiftId: assignment.shiftId };
  if (assignment.breakEnabled === false) {
    next.breakEnabled = false;
    if (assignment.breakSkipReason) next.breakSkipReason = assignment.breakSkipReason;
  } else if (assignmentHasBreak(assignment)) {
    next.breakEnabled = true;
    if (assignment.breakId) next.breakId = assignment.breakId;
    if (assignment.breakName) next.breakName = assignment.breakName;
    if (assignment.breakCompensation) next.breakCompensation = assignment.breakCompensation;
    if (assignment.breakDurationMinutes) next.breakDurationMinutes = assignment.breakDurationMinutes;
    if (assignment.breakMandatory !== undefined) next.breakMandatory = assignment.breakMandatory;
  }
  upsertAssignment(next);
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

const SYNC_TO_NEXT_WEEK_PRESETS: ReadonlySet<QuickPreset> = new Set([
  "last-week",
  "this-week",
  "next-week",
]);

/** 仅快捷条件为「上周 / 本周 / 下周」时展示「同步到下周」 */
function shouldShowSyncToNextWeek(): boolean {
  return SYNC_TO_NEXT_WEEK_PRESETS.has(pageState.quickPreset);
}

/** 将当前选中周（dateFrom 所在周）的排班复制到下一周 */
function syncSelectedWeekToNextWeek(): void {
  const weekStart = startOfWeekMonday(parseIsoDate(pageState.dateFrom || isoDate(new Date())));
  const weekDates = Array.from({ length: 7 }, (_, i) => isoDate(addDays(weekStart, i)));
  const nextWeekDates = Array.from({ length: 7 }, (_, i) => isoDate(addDays(weekStart, 7 + i)));
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
        ...(src.breakEnabled === false
          ? {
              breakEnabled: false as const,
              ...(src.breakSkipReason ? { breakSkipReason: src.breakSkipReason } : {}),
            }
          : {
              ...(src.breakEnabled === true ? { breakEnabled: true as const } : {}),
              ...(src.breakId ? { breakId: src.breakId } : {}),
              ...(src.breakName ? { breakName: src.breakName } : {}),
              ...(src.breakCompensation ? { breakCompensation: src.breakCompensation } : {}),
              ...(src.breakDurationMinutes ? { breakDurationMinutes: src.breakDurationMinutes } : {}),
              ...(src.breakMandatory !== undefined ? { breakMandatory: src.breakMandatory } : {}),
            }),
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

function renderEmployeeFilterTagsHtml(employees: RosterEmployee[], selectedIds: string[]): string {
  const selectedSet = new Set(selectedIds);
  const selectedEmployees = employees.filter((e) => selectedSet.has(e.id));
  if (selectedEmployees.length === 0) {
    return `<span class="px-1 text-[13px] text-muted-foreground">全部员工</span>`;
  }
  return selectedEmployees
    .map(
      (e) =>
        `<span class="inline-flex max-w-[10rem] items-center gap-1 overflow-hidden rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <span class="truncate">${escapeHtml(e.name)}</span>
          <button type="button" data-shift-employee-filter-remove="${escapeHtml(e.id)}" class="shrink-0 text-sm leading-none text-primary/60 hover:text-primary" aria-label="移除 ${escapeHtml(e.name)}">×</button>
        </span>`,
    )
    .join("");
}

function renderEmployeeFilterOptionsHtml(
  employees: RosterEmployee[],
  selectedIds: string[],
  q: string,
): string {
  const selectedSet = new Set(selectedIds);
  const query = q.trim().toLowerCase();
  if (employees.length === 0) {
    return `<div class="px-3 py-2 text-sm text-muted-foreground">暂无员工</div>`;
  }
  const optionsHtml = employees
    .map((e) => {
      const checked = selectedSet.has(e.id);
      const hidden = query && !e.name.toLowerCase().includes(query);
      return `<label class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60${checked ? " bg-primary/5 text-primary" : " text-foreground"}${hidden ? " hidden" : ""}" data-shift-employee-filter-option>
        <input type="checkbox" value="${escapeHtml(e.id)}" data-shift-employee-filter-option-cb class="size-4 shrink-0 accent-primary"${checked ? " checked" : ""} />
        <span class="min-w-0 truncate">${escapeHtml(e.name)}</span>
      </label>`;
    })
    .join("");
  const visibleCount = employees.filter((e) => !query || e.name.toLowerCase().includes(query)).length;
  const emptySearchHtml =
    visibleCount === 0
      ? `<div class="px-3 py-2 text-sm text-muted-foreground" data-shift-employee-filter-empty>没有匹配的员工</div>`
      : "";
  return `${optionsHtml}${emptySearchHtml}`;
}

function renderEmployeeFilterMultiSelect(employees: RosterEmployee[]): string {
  const tagsHtml = renderEmployeeFilterTagsHtml(employees, pageState.employeeFilterIds);
  return `
    <div class="relative min-w-[12rem] max-w-md flex-1 sm:flex-none sm:min-w-[14rem]" data-shift-employee-filter>
      <div
        class="flex min-h-9 cursor-pointer items-center rounded-md border border-input bg-background py-1 pl-1.5 pr-8 shadow-sm transition-colors hover:border-primary"
        data-shift-employee-filter-trigger
        role="combobox"
        aria-expanded="false"
        aria-haspopup="listbox"
        tabindex="0"
      >
        <div class="flex min-h-[26px] flex-1 flex-wrap items-center gap-1.5" data-shift-employee-filter-tags>${tagsHtml}</div>
        <svg data-shift-employee-filter-chevron class="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground transition-transform" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 8.825a.5.5 0 0 1-.354-.146l-4-4a.5.5 0 0 1 .708-.708L6 7.617l3.646-3.646a.5.5 0 0 1 .708.708l-4 4A.5.5 0 0 1 6 8.825z"/></svg>
      </div>
    </div>`;
}

function setEmployeeFilterOpenState(wrap: HTMLElement, open: boolean): void {
  if (open) wrap.setAttribute("data-open", "1");
  else wrap.removeAttribute("data-open");
  const trigger = wrap.querySelector<HTMLElement>("[data-shift-employee-filter-trigger]");
  if (trigger) {
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    trigger.classList.toggle("border-primary", open);
    trigger.classList.toggle("ring-2", open);
    trigger.classList.toggle("ring-ring/20", open);
  }
  wrap.querySelector("[data-shift-employee-filter-chevron]")?.classList.toggle("rotate-180", open);
}

function mountEmployeeFilterDropdown(wrap: HTMLElement): HTMLElement {
  let dropdown = wrap.querySelector<HTMLElement>("[data-shift-employee-filter-dropdown]");
  if (dropdown) return dropdown;
  const employees = readScopedEmployees();
  wrap.insertAdjacentHTML(
    "beforeend",
    `<div class="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-md border border-border bg-card shadow-lg" data-shift-employee-filter-dropdown role="listbox">
      <div class="border-b border-border p-2">
        <input type="search" value="${escapeHtml(employeeFilterSearchQuery)}" data-shift-employee-filter-search placeholder="搜索员工…" autocomplete="off" aria-label="搜索员工" class="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      <div class="max-h-56 overflow-y-auto py-1" data-shift-employee-filter-options>
        ${renderEmployeeFilterOptionsHtml(employees, pageState.employeeFilterIds, employeeFilterSearchQuery)}
      </div>
    </div>`,
  );
  dropdown = wrap.querySelector<HTMLElement>("[data-shift-employee-filter-dropdown]")!;
  return dropdown;
}

function unmountEmployeeFilterDropdown(wrap: HTMLElement): void {
  wrap.querySelector("[data-shift-employee-filter-dropdown]")?.remove();
}

function syncEmployeeFilterSelectionUi(root: HTMLElement): void {
  const employees = readScopedEmployees();
  const selectedIds = pageState.employeeFilterIds.filter((id) => employees.some((e) => e.id === id));
  pageState.employeeFilterIds = selectedIds;
  const selectedSet = new Set(selectedIds);
  const tags = root.querySelector("[data-shift-employee-filter-tags]");
  if (tags) tags.innerHTML = renderEmployeeFilterTagsHtml(employees, selectedIds);
  root.querySelectorAll<HTMLElement>("[data-shift-employee-filter-option]").forEach((opt) => {
    const cb = opt.querySelector<HTMLInputElement>("[data-shift-employee-filter-option-cb]");
    if (!cb) return;
    const checked = selectedSet.has(cb.value);
    cb.checked = checked;
    opt.classList.toggle("bg-primary/5", checked);
    opt.classList.toggle("text-primary", checked);
    opt.classList.toggle("text-foreground", !checked);
  });
}

function renderScheduleTableInnerHtml(): string {
  const shiftTypes = readShiftTypes();
  const typeMap = new Map(shiftTypes.map((t) => [t.id, t]));
  const employees = readScopedEmployees();
  const needsStore = usesInPageStorePicker() && !readScopeFilters().store;
  const validIds = new Set(employees.map((e) => e.id));
  pageState.employeeFilterIds = pageState.employeeFilterIds.filter((id) => validIds.has(id));
  const filtered =
    pageState.employeeFilterIds.length > 0
      ? employees.filter((e) => pageState.employeeFilterIds.includes(e.id))
      : employees;
  const dates = enumerateDates(pageState.dateFrom, pageState.dateTo);
  const headerCells = dates
    .map(
      (d) =>
        `<th class="min-w-[5.5rem] whitespace-nowrap border border-primary/20 px-2 py-2.5 text-center text-xs font-medium">${escapeHtml(formatColumnHeader(d))}</th>`,
    )
    .join("");
  const bodyRows = needsStore
    ? ""
    : filtered
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
  const emptyMessage = needsStore
    ? "请先选择门店"
    : "暂无员工数据，请先在「角色与员工」中添加员工。";
  return `<table class="w-full min-w-max border-collapse">
          <thead class="sticky top-0 z-[2]">
            <tr class="bg-primary text-primary-foreground">
              <th class="sticky left-0 z-[3] min-w-[8rem] border border-primary/20 bg-primary px-3 py-2.5 text-left text-sm font-medium">员工</th>
              ${headerCells}
            </tr>
          </thead>
          <tbody>${bodyRows || `<tr><td colspan="${dates.length + 1}" class="px-4 py-8 text-center text-sm text-muted-foreground">${escapeHtml(emptyMessage)}</td></tr>`}</tbody>
        </table>`;
}

function bindScheduleCellClicks(root: HTMLElement, remount: () => void): void {
  root.querySelectorAll("[data-shift-cell]").forEach((btn) => {
    if ((btn as HTMLElement).dataset.shiftCellBound === "1") return;
    (btn as HTMLElement).dataset.shiftCellBound = "1";
    btn.addEventListener("click", () => {
      const employeeId = btn.getAttribute("data-shift-employee");
      const date = btn.getAttribute("data-shift-date");
      if (!employeeId || !date || !isScheduleDateEditable(date)) return;
      clearEditEmployeePickerState();
      const existing = getAssignment(employeeId, date);
      const shiftTypes = readShiftTypes();
      const shift = existing ? shiftTypes.find((t) => t.id === existing.shiftId) : undefined;
      const { startTime, endTime } = existing && shift
        ? getEffectiveTimes(existing, shift)
        : { startTime: shift?.startTime ?? "", endTime: shift?.endTime ?? "" };
      const hours = shiftDurationHoursFromTimes(startTime, endTime);
      const hasBreak = assignmentHasBreak(existing);
      cellEditor = {
        date,
        employeeIds: [employeeId],
        dateEditable: false,
        repeatMode: "day",
        repeatWeekdays: [parseIsoDate(date).getDay()],
        breakEnabled: existing ? hasBreak : defaultBreakEnabledForWorkHours(hours),
        breakSkipReason: existing?.breakSkipReason ?? "",
        breakSwitchTouched: !!existing,
      };
      remount();
    });
  });
}

function refreshScheduleTable(root: HTMLElement, remount: () => void): void {
  const host = root.querySelector("[data-shift-schedule-table]");
  if (!host) {
    remount();
    return;
  }
  host.innerHTML = renderScheduleTableInnerHtml();
  bindScheduleCellClicks(root, remount);
}

function renderShiftCell(
  employeeId: string,
  date: string,
  assignment: ShiftAssignment | undefined,
  shift: ShiftType | undefined,
  weekend: boolean,
): string {
  const editable = isScheduleDateEditable(date);
  const bg = weekend ? "bg-background" : "bg-muted/40";
  let content = "";
  if (shift && assignment) {
    const { startTime, endTime } = getEffectiveTimes(assignment, shift);
    const customized = hasAnyDayOverride(assignment, shift);
    const breakOpt = assignmentHasBreak(assignment)
      ? resolveCustomBreakSelection(assignment.breakId, {
          breakName: assignment.breakName,
          breakCompensation: assignment.breakCompensation,
          breakDurationMinutes: assignment.breakDurationMinutes,
          breakMandatory: assignment.breakMandatory,
        })
      : undefined;
    const breakLabel = breakOpt
      ? `${breakOpt.name} ${breakOpt.durationMinutes}分${breakOpt.mandatory ? "·强" : ""}`
      : assignmentHasBreak(assignment) && assignment.breakName
        ? `${assignment.breakName}${assignment.breakDurationMinutes ? ` ${assignment.breakDurationMinutes}分` : ""}`
        : "";
    content = `<span class="block truncate rounded px-1 py-0.5 text-xs font-medium" style="background:${escapeHtml(shift.color)}">${escapeHtml(shift.name)}</span>
      <span class="mt-0.5 block truncate px-0.5 text-[10px] tabular-nums ${customized ? "font-medium text-primary" : "text-muted-foreground"}">${escapeHtml(startTime)}–${escapeHtml(endTime)}${customized ? "*" : ""}${breakLabel ? ` · ${escapeHtml(breakLabel)}` : ""}</span>`;
  }
  if (!editable) {
    return `<td class="min-w-[5.5rem] border border-border/60 px-1 py-1.5 align-middle ${bg}">
      <div
        class="flex h-12 w-full cursor-not-allowed flex-col items-center justify-center rounded-sm text-left opacity-60"
        aria-label="历史日期不可排班 ${escapeHtml(date)}"
        title="历史日期不可排班"
      >${content}</div>
    </td>`;
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

function renderShiftTypeDetailForm(t: ShiftType, opts?: { showDelete?: boolean }): string {
  const showDelete = opts?.showDelete !== false;
  const delayDisabled = t.autoClockOutDelayEnabled ? "" : " disabled";
  const hours = formatWorkHoursDisplay(t.startTime, t.endTime);
  const storeSelect = renderShiftStoreFilterSelect(t.storeId ?? "", {
    id: `shift-type-store-${t.id}`,
    dataAttr: 'data-shift-type-store',
    className: `${SHIFT_FORM_INPUT} sm:max-w-md`,
  });
  const breakEnabled =
    typeof t.breakEnabled === "boolean"
      ? t.breakEnabled
      : !!t.breakId || defaultBreakEnabledForWorkHours(shiftDurationHoursFromTimes(t.startTime, t.endTime));
  const breakCompensation =
    t.breakCompensation ??
    resolveCustomBreakSelection(t.breakId, t)?.compensation ??
    "unpaid";
  const breakOpt = resolveCustomBreakSelection(t.breakId, t, breakCompensation);
  return `
    <div class="space-y-4" data-shift-config-detail data-shift-type-row="${escapeHtml(t.id)}">
      <div class="space-y-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 门店:</span>
          ${storeSelect}
        </div>
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
          <span class="${SHIFT_FORM_LABEL}">安排休息:</span>
          <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" data-shift-type-break-enabled class="size-4 shrink-0 accent-primary"${breakEnabled ? " checked" : ""} />
            <span class="text-muted-foreground">合规要求工时超过 ${BREAK_REQUIRED_HOURS_THRESHOLD} 小时需要安排休息</span>
          </label>
        </div>
        <div class="space-y-3${breakEnabled ? "" : " hidden"}" data-shift-type-break-fields>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 休息类型:</span>
            <select data-shift-type-break-compensation class="${SHIFT_FORM_INPUT} sm:max-w-md"${breakEnabled ? " required" : ""}>
              <option value="unpaid"${breakCompensation === "unpaid" ? " selected" : ""}>无薪</option>
              <option value="paid"${breakCompensation === "paid" ? " selected" : ""}>带薪</option>
            </select>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 休息名称:</span>
            <div class="min-w-0 flex-1 space-y-1 sm:max-w-md">
              <select data-shift-type-break-id class="${SHIFT_FORM_INPUT}"${breakEnabled ? " required" : ""}>
                ${renderCustomBreakNameSelectOptions(breakCompensation, t.breakId)}
              </select>
              ${renderSelectedBreakMetaHtml(breakOpt, "data-shift-type-break-meta")}
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span class="${SHIFT_FORM_LABEL}">显示颜色:</span>
          <input type="color" value="${escapeHtml(t.color.startsWith("#") ? t.color : "#dbeafe")}" data-shift-type-color class="size-9 cursor-pointer rounded border border-input bg-background" />
        </div>
      </div>
      ${
        showDelete
          ? `<div class="border-t border-border pt-3">
        <button type="button" data-shift-type-remove="${escapeHtml(t.id)}" class="text-sm text-destructive hover:underline">删除此班次</button>
      </div>`
          : ""
      }
    </div>`;
}

function resolveShiftStoreLabel(storeId: string | undefined): string {
  if (!storeId) return "未指定门店";
  const hit = listShiftStoreOptions().find((o) => o.value === storeId);
  return hit?.label || storeId;
}

function renderShiftListRow(t: ShiftType): string {
  const hours = formatWorkHoursDisplay(t.startTime, t.endTime);
  const storeLabel = resolveShiftStoreLabel(t.storeId);
  const earlyLabel =
    t.earlyClockInMinutes > 0 ? `${t.earlyClockInMinutes} 分钟` : "不提前";
  const autoOutLabel = t.autoClockOutDelayEnabled
    ? `${t.autoClockOutDelayMinutes} 分钟`
    : "不启用";
  const breakLabel = shiftTypeHasBreak(t)
    ? t.breakName
      ? `${t.breakCompensation === "paid" ? "带薪" : "无薪"} · ${t.breakName}`
      : "已安排"
    : "不安排";
  return `
    <tr class="border-b border-border/60 hover:bg-muted/20" data-shift-list-item="${escapeHtml(t.id)}">
      <td class="px-3 py-2.5">
        <span class="inline-flex min-w-0 items-center gap-2">
          <span class="size-2.5 shrink-0 rounded-full" style="background:${escapeHtml(t.color)}" aria-hidden="true"></span>
          <span class="truncate font-medium text-foreground">${escapeHtml(t.name || "未命名班次")}</span>
        </span>
      </td>
      <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(storeLabel)}</td>
      <td class="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">${escapeHtml(t.startTime)}–${escapeHtml(t.endTime)}</td>
      <td class="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">${escapeHtml(hours)}</td>
      <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(earlyLabel)}</td>
      <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(autoOutLabel)}</td>
      <td class="px-3 py-2.5 text-sm text-muted-foreground">${escapeHtml(breakLabel)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" data-shift-list-edit="${escapeHtml(t.id)}" class="h-8 rounded-md border border-border px-3 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">编辑</button>
          <button type="button" data-shift-list-delete="${escapeHtml(t.id)}" class="h-8 rounded-md border border-destructive/30 px-3 text-sm text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">删除</button>
        </div>
      </td>
    </tr>`;
}

function openShiftDeleteConfirm(id: string): void {
  shiftDeleteConfirmId = id;
}

function closeShiftDeleteConfirm(): void {
  shiftDeleteConfirmId = null;
}

function executeDeleteShift(id: string): void {
  writeShiftTypes(readShiftTypes().filter((t) => t.id !== id));
  if (shiftFormEditor?.shift.id === id) closeShiftFormEditor();
  closeShiftDeleteConfirm();
}

function renderShiftDeleteConfirmDialog(): string {
  if (!shiftDeleteConfirmId) return "";
  const shift = readShiftTypes().find((t) => t.id === shiftDeleteConfirmId);
  const name = shift?.name || "未命名班次";
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" data-shift-delete-dialog role="dialog" aria-modal="true" aria-labelledby="shift-delete-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-shift-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="shift-delete-title" class="text-base font-semibold text-foreground">确认删除</h2>
        </div>
        <div class="px-5 py-4 text-sm text-muted-foreground">
          确定删除班次「<span class="font-medium text-foreground">${escapeHtml(name)}</span>」？已排班记录中引用该班次的格子将无法正常显示。
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" data-shift-delete-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-shift-delete-ok class="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">删除</button>
        </div>
      </div>
    </div>`;
}

function closeShiftFormEditor(): void {
  shiftFormEditor = null;
}

function openShiftFormCreate(): void {
  const storeId = shiftConfigStoreFilter || resolveDefaultScopedStoreId() || readScopeFilters().store || "";
  if (!storeId) {
    window.alert("请先选择门店，再新增班次。");
    return;
  }
  shiftFormEditor = {
    mode: "create",
    shift: normalizeShiftType({
      id: newShiftId(),
      name: "新班次",
      storeId,
      startTime: "09:00",
      endTime: "17:00",
      color: "#e0e7ff",
      earlyClockInMinutes: 15,
      autoClockOutDelayEnabled: false,
      autoClockOutDelayMinutes: 30,
    }),
  };
}

function openShiftFormEdit(id: string): void {
  const existing = readShiftTypes().find((t) => t.id === id);
  if (!existing) return;
  shiftFormEditor = { mode: "edit", shift: { ...existing } };
}

function ensureShiftListStoreFilter(): void {
  if (shiftConfigStoreFilter) return;
  shiftConfigStoreFilter = resolveDefaultScopedStoreId() || readScopeFilters().store || "";
}

function renderShiftTabBar(): string {
  const tabs: { key: ShiftPageTab; label: string }[] = [
    { key: "schedule", label: "排班表" },
    { key: "shifts", label: "班次" },
    { key: "rules", label: "规则设置" },
  ];
  return `
    <div class="flex shrink-0 gap-1 border-b border-border" role="tablist" aria-label="员工排班">
      ${tabs
        .map((tab) => {
          const selected = shiftPageTab === tab.key;
          return `
        <button type="button" role="tab"
          data-shift-tab="${tab.key}"
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

function renderShiftFormDialog(): string {
  if (!shiftFormEditor) return "";
  const isCreate = shiftFormEditor.mode === "create";
  const title = isCreate ? "新增班次" : "编辑班次";
  const form = renderShiftTypeDetailForm(shiftFormEditor.shift, { showDelete: false });
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-shift-form-dialog role="dialog" aria-modal="true" aria-labelledby="shift-form-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-shift-form-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="shift-form-title" class="text-base font-semibold text-foreground">${title}</h2>
          ${isCreate ? "" : `<p class="mt-1 text-xs text-muted-foreground">修改班次信息后保存。</p>`}
        </div>
        <div class="min-h-0 flex-1 overflow-auto p-4 sm:p-5">${form}</div>
        <div class="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" data-shift-form-cancel class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
          <button type="button" data-shift-form-save class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
        </div>
      </div>
    </div>`;
}

function renderShiftsPanel(): string {
  ensureShiftListStoreFilter();
  const types = readShiftTypes();
  const filtered = filterShiftTypesByStore(types, shiftConfigStoreFilter);
  const emptyMessage = shiftConfigStoreFilter
    ? "当前门店暂无班次，请点击「新增班次」"
    : "暂无班次，请点击「新增班次」";
  const tableRows =
    filtered.length > 0
      ? filtered.map((t) => renderShiftListRow(t)).join("")
      : `<tr><td colspan="8" class="px-4 py-10 text-center text-sm text-muted-foreground">${escapeHtml(emptyMessage)}</td></tr>`;
  const storeFilter = `
    <div class="flex flex-wrap items-center gap-2">
      <label for="shift-config-store-filter" class="shrink-0 text-sm text-muted-foreground">${escapeHtml(t("header.scopeStore"))}</label>
      ${renderShiftStoreFilterSelect(shiftConfigStoreFilter, {
        id: "shift-config-store-filter",
        dataAttr: "data-shift-config-store-filter",
      })}
    </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3" data-shift-shifts-panel>
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-3">
        ${storeFilter}
        <button type="button" data-shift-type-add class="h-9 shrink-0 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">+ 新增班次</button>
      </div>
      <div class="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm" data-shift-config-list>
        <div class="h-full overflow-auto">
          <table class="w-full min-w-[56rem] text-left text-sm">
            <thead class="sticky top-0 z-[1] border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th class="px-3 py-2.5 font-medium">班次</th>
                <th class="px-3 py-2.5 font-medium">门店</th>
                <th class="px-3 py-2.5 font-medium">时间</th>
                <th class="px-3 py-2.5 font-medium">工时</th>
                <th class="px-3 py-2.5 font-medium">提前打卡</th>
                <th class="px-3 py-2.5 font-medium">自动下班</th>
                <th class="px-3 py-2.5 font-medium">休息</th>
                <th class="px-3 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
      ${renderShiftFormDialog()}
      ${renderShiftDeleteConfirmDialog()}
    </div>`;
}

function bindShiftFormDialog(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-shift-form-dialog]");
  if (!dialog || !shiftFormEditor || dialog.dataset.shiftFormDialogBound === "1") return;
  dialog.dataset.shiftFormDialogBound = "1";

  const detail = dialog.querySelector<HTMLElement>("[data-shift-config-detail]");
  if (detail) {
    const onFieldChange = () => syncShiftWorkHoursInRow(detail);
    detail.querySelector("[data-shift-type-name]")?.addEventListener("input", onFieldChange);
    detail.querySelector("[data-shift-type-start]")?.addEventListener("input", onFieldChange);
    detail.querySelector("[data-shift-type-end]")?.addEventListener("input", onFieldChange);
    detail.querySelector("[data-shift-type-start]")?.addEventListener("change", onFieldChange);
    detail.querySelector("[data-shift-type-end]")?.addEventListener("change", onFieldChange);
    detail.querySelector("[data-shift-auto-clock-out-enabled]")?.addEventListener("change", () => {
      syncAutoClockOutDelayField(detail);
    });
    syncAutoClockOutDelayField(detail);
    syncShiftWorkHoursInRow(detail);

    const syncTypeBreakFields = () => {
      const enabled =
        detail.querySelector<HTMLInputElement>("[data-shift-type-break-enabled]")?.checked ?? false;
      detail.querySelector<HTMLElement>("[data-shift-type-break-fields]")?.classList.toggle("hidden", !enabled);
      const compensation = detail.querySelector<HTMLSelectElement>("[data-shift-type-break-compensation]");
      const breakId = detail.querySelector<HTMLSelectElement>("[data-shift-type-break-id]");
      if (compensation) compensation.required = enabled;
      if (breakId) breakId.required = enabled;
    };
    syncTypeBreakFields();
    detail.querySelector("[data-shift-type-break-enabled]")?.addEventListener("change", syncTypeBreakFields);
    detail.querySelector("[data-shift-type-break-compensation]")?.addEventListener("change", (e) => {
      const compensation =
        (e.target as HTMLSelectElement).value === "paid" ? "paid" : "unpaid";
      syncBreakNameSelectInRoot(detail, compensation, {
        idAttr: "data-shift-type-break-id",
        metaAttr: "data-shift-type-break-meta",
      });
    });
    detail.querySelector("[data-shift-type-break-id]")?.addEventListener("change", (e) => {
      const compensation =
        detail.querySelector<HTMLSelectElement>("[data-shift-type-break-compensation]")?.value === "paid"
          ? "paid"
          : "unpaid";
      const breakId = (e.target as HTMLSelectElement).value;
      const breakOpt = resolveCustomBreakSelection(breakId, { breakCompensation: compensation }, compensation);
      const oldMeta = detail.querySelector("[data-shift-type-break-meta]");
      if (!oldMeta) return;
      oldMeta.insertAdjacentHTML(
        "afterend",
        renderSelectedBreakMetaHtml(breakOpt, "data-shift-type-break-meta"),
      );
      oldMeta.remove();
    });
  }

  const close = () => {
    closeShiftFormEditor();
    remount();
  };

  dialog.querySelector("[data-shift-form-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-shift-form-cancel]")?.addEventListener("click", close);

  dialog.querySelector("[data-shift-form-save]")?.addEventListener("click", () => {
    if (!shiftFormEditor || !detail) return;
    const breakEnabled =
      detail.querySelector<HTMLInputElement>("[data-shift-type-break-enabled]")?.checked ?? false;
    if (breakEnabled) {
      const compensation =
        detail.querySelector<HTMLSelectElement>("[data-shift-type-break-compensation]")?.value === "paid"
          ? "paid"
          : "unpaid";
      const breakId = detail.querySelector<HTMLSelectElement>("[data-shift-type-break-id]")?.value ?? "";
      const breakOpt = resolveCustomBreakSelection(breakId, { breakCompensation: compensation }, compensation);
      if (!breakOpt) {
        detail.querySelector<HTMLSelectElement>("[data-shift-type-break-id]")?.focus();
        window.alert("请选择休息名称。");
        return;
      }
    }
    const updated = collectShiftTypeFromDetail(detail, shiftFormEditor.shift.id);
    if (!updated) {
      window.alert("请填写班次名称。");
      return;
    }
    if (!updated.storeId) {
      window.alert(`班次「${updated.name}」尚未选择门店，请先选择门店后再保存。`);
      return;
    }
    const types = readShiftTypes().map((t) => ({ ...t }));
    if (shiftFormEditor.mode === "create") {
      types.push(updated);
    } else {
      const idx = types.findIndex((t) => t.id === updated.id);
      if (idx >= 0) types[idx] = updated;
      else types.push(updated);
    }
    writeShiftTypes(types);
    closeShiftFormEditor();
    remount();
  });

}

function bindShiftsPanel(remount: () => void): void {
  const panel = document.querySelector<HTMLElement>("[data-shift-shifts-panel]");
  if (!panel || panel.dataset.shiftShiftsPanelBound === "1") return;
  panel.dataset.shiftShiftsPanelBound = "1";

  panel.querySelector("[data-shift-config-store-filter]")?.addEventListener("change", () => {
    const el = panel.querySelector<HTMLSelectElement>("[data-shift-config-store-filter]");
    shiftConfigStoreFilter = el?.value ?? "";
    remount();
  });

  panel.querySelectorAll("[data-shift-list-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-shift-list-edit");
      if (!id) return;
      openShiftFormEdit(id);
      remount();
    });
  });

  panel.querySelectorAll("[data-shift-list-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-shift-list-delete");
      if (!id) return;
      openShiftDeleteConfirm(id);
      remount();
    });
  });

  panel.querySelector("[data-shift-type-add]")?.addEventListener("click", () => {
    openShiftFormCreate();
    remount();
  });

  bindShiftFormDialog(remount);
  bindShiftDeleteConfirmDialog(remount);
}

function bindShiftDeleteConfirmDialog(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-shift-delete-dialog]");
  if (!dialog || !shiftDeleteConfirmId || dialog.dataset.shiftDeleteDialogBound === "1") return;
  dialog.dataset.shiftDeleteDialogBound = "1";

  const close = () => {
    closeShiftDeleteConfirm();
    remount();
  };

  dialog.querySelector("[data-shift-delete-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-shift-delete-cancel]")?.addEventListener("click", close);
  dialog.querySelector("[data-shift-delete-ok]")?.addEventListener("click", () => {
    if (!shiftDeleteConfirmId) return;
    executeDeleteShift(shiftDeleteConfirmId);
    remount();
  });
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

function renderEditEmployeeTagsHtml(employees: RosterEmployee[], selectedIds: string[]): string {
  const selectedSet = new Set(selectedIds);
  const selectedEmployees = employees.filter((e) => selectedSet.has(e.id));
  const allowEmptyEmployees = !!cellEditor?.dateEditable;
  if (selectedEmployees.length === 0) {
    return `<span class="px-1 text-[13px] text-muted-foreground">请选择员工（可多选）</span>`;
  }
  return selectedEmployees
    .map((e) => {
      const canRemove = allowEmptyEmployees || selectedEmployees.length > 1;
      return `<span class="inline-flex max-w-[10rem] items-center gap-1 overflow-hidden rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          <span class="truncate">${escapeHtml(e.name)}</span>
          ${
            canRemove
              ? `<button type="button" data-shift-edit-employee-remove="${escapeHtml(e.id)}" class="shrink-0 text-sm leading-none text-primary/60 hover:text-primary" aria-label="移除 ${escapeHtml(e.name)}">×</button>`
              : ""
          }
        </span>`;
    })
    .join("");
}

function renderEditEmployeeOptionsHtml(
  employees: RosterEmployee[],
  selectedIds: string[],
  q: string,
  emptyMessage = "暂无员工",
): string {
  const selectedSet = new Set(selectedIds);
  const query = q.trim().toLowerCase();
  if (employees.length === 0) {
    return `<div class="px-3 py-2 text-sm text-muted-foreground" data-shift-edit-employee-empty>${escapeHtml(emptyMessage)}</div>`;
  }
  const optionsHtml = employees
    .map((e) => {
      const checked = selectedSet.has(e.id);
      const hidden = query && !e.name.toLowerCase().includes(query);
      return `<label class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60${checked ? " bg-primary/5 text-primary" : " text-foreground"}${hidden ? " hidden" : ""}" data-shift-edit-employee-option>
        <input type="checkbox" value="${escapeHtml(e.id)}" data-shift-edit-employee-option-cb class="size-4 shrink-0 accent-primary"${checked ? " checked" : ""} />
        <span class="min-w-0 truncate">${escapeHtml(e.name)}</span>
      </label>`;
    })
    .join("");
  const visibleCount = employees.filter((e) => !query || e.name.toLowerCase().includes(query)).length;
  const emptySearchHtml =
    visibleCount === 0
      ? `<div class="px-3 py-2 text-sm text-muted-foreground" data-shift-edit-employee-empty>没有匹配的员工</div>`
      : "";
  return `${optionsHtml}${emptySearchHtml}`;
}

function pruneEditEmployeeSelectionToSelectable(dialog: HTMLElement): void {
  if (!cellEditor) return;
  const allowed = new Set(getEditDialogSelectableEmployees(dialog).map((e) => e.id));
  const nextIds = cellEditor.employeeIds.filter((id) => allowed.has(id));
  if (nextIds.length !== cellEditor.employeeIds.length) {
    cellEditor = { ...cellEditor, employeeIds: nextIds };
  }
}

/** 班次/日期变化后刷新可选员工列表（不 remount） */
function refreshEditEmployeeOptions(dialog: HTMLElement): void {
  if (!cellEditor) return;
  pruneEditEmployeeSelectionToSelectable(dialog);
  const employees = getEditDialogSelectableEmployees(dialog);
  const shiftId = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-shift]")?.value ?? "";
  const emptyMessage =
    cellEditor.dateEditable && shiftId
      ? "该班次当日已排员工不可再选"
      : "暂无员工";
  const optionsWrap = dialog.querySelector("[data-shift-edit-employee-options]");
  if (optionsWrap) {
    optionsWrap.innerHTML = renderEditEmployeeOptionsHtml(
      employees,
      cellEditor.employeeIds,
      editEmployeeSearchQuery,
      emptyMessage,
    );
  }
  syncEditEmployeeSelectionUi(dialog);
}

/** 员工选择器壳层：下拉不入 SSR，开合与改选均不 remount */
function renderEmployeeMultiSelect(employees: RosterEmployee[], selectedIds: string[]): string {
  const tagsHtml = renderEditEmployeeTagsHtml(employees, selectedIds);
  return `
    <div class="relative w-full max-w-md" data-shift-edit-employee-picker>
      <div
        class="flex min-h-9 cursor-pointer items-center rounded-md border border-input bg-background py-1 pl-1.5 pr-8 shadow-sm transition-colors hover:border-primary"
        data-shift-edit-employee-trigger
        role="combobox"
        aria-expanded="false"
        aria-haspopup="listbox"
        tabindex="0"
      >
        <div class="flex min-h-[26px] flex-1 flex-wrap items-center gap-1.5" data-shift-edit-employee-tags>${tagsHtml}</div>
        <svg data-shift-edit-employee-chevron class="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground transition-transform" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 8.825a.5.5 0 0 1-.354-.146l-4-4a.5.5 0 0 1 .708-.708L6 7.617l3.646-3.646a.5.5 0 0 1 .708.708l-4 4A.5.5 0 0 1 6 8.825z"/></svg>
      </div>
    </div>`;
}

function syncEditEmployeeSelectionUi(dialog: HTMLElement): void {
  if (!cellEditor) return;
  const employees = readScopedEmployees();
  const selectable = new Set(getEditDialogSelectableEmployees(dialog).map((e) => e.id));
  const selectedIds = cellEditor.employeeIds.filter(
    (id) => employees.some((e) => e.id === id) && selectable.has(id),
  );
  if (selectedIds.length !== cellEditor.employeeIds.length) {
    cellEditor = { ...cellEditor, employeeIds: selectedIds };
  }
  const selectedSet = new Set(selectedIds);
  const tags = dialog.querySelector("[data-shift-edit-employee-tags]");
  if (tags) tags.innerHTML = renderEditEmployeeTagsHtml(employees, selectedIds);

  dialog.querySelectorAll<HTMLElement>("[data-shift-edit-employee-option]").forEach((opt) => {
    const cb = opt.querySelector<HTMLInputElement>("[data-shift-edit-employee-option-cb]");
    if (!cb) return;
    const checked = selectedSet.has(cb.value);
    cb.checked = checked;
    opt.classList.toggle("bg-primary/5", checked);
    opt.classList.toggle("text-primary", checked);
    opt.classList.toggle("text-foreground", !checked);
  });

  const saveBtn = dialog.querySelector("[data-shift-edit-save]");
  if (saveBtn) saveBtn.textContent = selectedIds.length > 1 ? "批量保存" : "保存";

  const hint = dialog.querySelector<HTMLElement>("[data-shift-edit-batch-hint]");
  if (hint) {
    if (selectedIds.length > 1) {
      hint.textContent = `已选 ${selectedIds.length} 名员工，保存后统一应用以上设置`;
      hint.classList.remove("hidden");
      hint.classList.add("text-primary");
      hint.classList.remove("text-muted-foreground");
    } else {
      hint.classList.add("hidden");
    }
  }
}

function setEditEmployeePickerOpenState(wrap: HTMLElement, open: boolean): void {
  if (open) wrap.setAttribute("data-open", "1");
  else wrap.removeAttribute("data-open");
  const trigger = wrap.querySelector<HTMLElement>("[data-shift-edit-employee-trigger]");
  if (trigger) {
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    trigger.classList.toggle("border-primary", open);
    trigger.classList.toggle("ring-2", open);
    trigger.classList.toggle("ring-ring/20", open);
  }
  wrap.querySelector("[data-shift-edit-employee-chevron]")?.classList.toggle("rotate-180", open);
}

function mountEditEmployeeDropdown(wrap: HTMLElement): HTMLElement {
  let dropdown = wrap.querySelector<HTMLElement>("[data-shift-edit-employee-dropdown]");
  if (dropdown) return dropdown;
  const dialog = wrap.closest<HTMLElement>("[data-shift-edit-dialog]") ?? wrap;
  pruneEditEmployeeSelectionToSelectable(dialog);
  const employees = getEditDialogSelectableEmployees(dialog);
  const selectedIds = cellEditor?.employeeIds ?? [];
  const shiftId = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-shift]")?.value ?? "";
  const emptyMessage =
    cellEditor?.dateEditable && shiftId
      ? "该班次当日已排员工不可再选"
      : "暂无员工";
  wrap.insertAdjacentHTML(
    "beforeend",
    `<div class="fixed z-[70] overflow-hidden rounded-md border border-border bg-card shadow-lg" data-shift-edit-employee-dropdown role="listbox">
      <div class="border-b border-border p-2">
        <input type="search" value="${escapeHtml(editEmployeeSearchQuery)}" data-shift-edit-employee-search placeholder="搜索员工…" autocomplete="off" aria-label="搜索员工" class="h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      <div class="max-h-56 overflow-y-auto py-1" data-shift-edit-employee-options>
        ${renderEditEmployeeOptionsHtml(employees, selectedIds, editEmployeeSearchQuery, emptyMessage)}
      </div>
    </div>`,
  );
  dropdown = wrap.querySelector<HTMLElement>("[data-shift-edit-employee-dropdown]")!;
  return dropdown;
}

function unmountEditEmployeeDropdown(wrap: HTMLElement): void {
  wrap.querySelector("[data-shift-edit-employee-dropdown]")?.remove();
}

function collectSelectedEmployeeIdsFromDialog(_dialog: HTMLElement): string[] {
  return cellEditor?.employeeIds.filter(Boolean) ?? [];
}

function clearEditEmployeePickerState(): void {
  clearEditEmployeeOutsideCloser();
  editEmployeeDropdownOpen = false;
  editEmployeeSearchQuery = "";
}

function clearEditEmployeeOutsideCloser(): void {
  if (!editEmployeeOutsideCloser) return;
  document.removeEventListener("click", editEmployeeOutsideCloser, true);
  editEmployeeOutsideCloser = null;
}

function positionEditEmployeeDropdown(wrap: HTMLElement): void {
  const trigger = wrap.querySelector<HTMLElement>("[data-shift-edit-employee-trigger]");
  const dropdown = wrap.querySelector<HTMLElement>("[data-shift-edit-employee-dropdown]");
  if (!trigger || !dropdown) return;
  const rect = trigger.getBoundingClientRect();
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.top = `${rect.bottom + 4}px`;
  dropdown.style.width = `${Math.max(rect.width, 240)}px`;
}

function syncEditEmployeeOptionVisibility(dialog: HTMLElement): void {
  const q = editEmployeeSearchQuery.trim().toLowerCase();
  const options = dialog.querySelectorAll<HTMLElement>("[data-shift-edit-employee-option]");
  let visible = 0;
  options.forEach((opt) => {
    const label = (opt.textContent || "").trim().toLowerCase();
    const show = !q || label.includes(q);
    opt.classList.toggle("hidden", !show);
    if (show) visible += 1;
  });
  let emptyEl = dialog.querySelector<HTMLElement>("[data-shift-edit-employee-empty]");
  const optionsWrap = dialog.querySelector("[data-shift-edit-employee-options]");
  if (!optionsWrap) return;
  if (visible === 0 && options.length > 0) {
    if (!emptyEl) {
      emptyEl = document.createElement("div");
      emptyEl.className = "px-3 py-2 text-sm text-muted-foreground";
      emptyEl.setAttribute("data-shift-edit-employee-empty", "");
      optionsWrap.appendChild(emptyEl);
    }
    emptyEl.textContent = q ? "没有匹配的员工" : "暂无员工";
    emptyEl.classList.remove("hidden");
  } else if (emptyEl) {
    emptyEl.classList.add("hidden");
  }
}

function bindEditEmployeeMultiSelect(dialog: HTMLElement): void {
  const wrap = dialog.querySelector<HTMLElement>("[data-shift-edit-employee-picker]");
  if (!wrap || wrap.dataset.editEmployeeBound === "1" || !cellEditor) return;
  wrap.dataset.editEmployeeBound = "1";

  const close = () => {
    if (!editEmployeeDropdownOpen) return;
    clearEditEmployeeOutsideCloser();
    editEmployeeDropdownOpen = false;
    editEmployeeSearchQuery = "";
    unmountEditEmployeeDropdown(wrap);
    setEditEmployeePickerOpenState(wrap, false);
  };

  const bindDropdownChrome = (dropdown: HTMLElement) => {
    dropdown.addEventListener("click", (e) => e.stopPropagation());
    const search = dropdown.querySelector<HTMLInputElement>("[data-shift-edit-employee-search]");
    search?.addEventListener("input", () => {
      editEmployeeSearchQuery = search.value;
      syncEditEmployeeOptionVisibility(dialog);
    });
    search?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    });
  };

  const open = () => {
    const existed = !!wrap.querySelector("[data-shift-edit-employee-dropdown]");
    editEmployeeDropdownOpen = true;
    const dropdown = mountEditEmployeeDropdown(wrap);
    if (!existed) bindDropdownChrome(dropdown);
    setEditEmployeePickerOpenState(wrap, true);
    positionEditEmployeeDropdown(wrap);
    clearEditEmployeeOutsideCloser();
    editEmployeeOutsideCloser = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-shift-edit-employee-picker]")) return;
      if (target?.closest("[data-shift-edit-employee-dropdown]")) return;
      close();
    };
    requestAnimationFrame(() => {
      positionEditEmployeeDropdown(wrap);
      if (editEmployeeOutsideCloser) {
        document.addEventListener("click", editEmployeeOutsideCloser, true);
      }
      dropdown.querySelector<HTMLInputElement>("[data-shift-edit-employee-search]")?.focus();
    });
  };

  const openOrToggle = () => {
    if (editEmployeeDropdownOpen && wrap.querySelector("[data-shift-edit-employee-dropdown]")) close();
    else open();
  };

  const applyEmployeeIds = (ids: string[]) => {
    if (!cellEditor) return;
    cellEditor = { ...cellEditor, employeeIds: ids };
    syncEditEmployeeSelectionUi(dialog);
  };

  wrap.querySelector("[data-shift-edit-employee-trigger]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if ((e.target as HTMLElement | null)?.closest("[data-shift-edit-employee-remove]")) return;
    openOrToggle();
  });
  wrap.querySelector("[data-shift-edit-employee-trigger]")?.addEventListener("keydown", (e) => {
    const ke = e as KeyboardEvent;
    if (ke.key === "Enter" || ke.key === " ") {
      ke.preventDefault();
      openOrToggle();
    } else if (ke.key === "Escape") {
      close();
    }
  });

  wrap.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-shift-edit-employee-remove]");
    if (!btn || !wrap.contains(btn)) return;
    e.stopPropagation();
    if (!cellEditor) return;
    const id = btn.getAttribute("data-shift-edit-employee-remove");
    const allowEmpty = cellEditor.dateEditable;
    if (!id || (!allowEmpty && cellEditor.employeeIds.length <= 1)) return;
    applyEmployeeIds(cellEditor.employeeIds.filter((x) => x !== id));
  });

  wrap.addEventListener("change", (e) => {
    const cb = e.target as HTMLInputElement | null;
    if (!cb || !cb.matches("[data-shift-edit-employee-option-cb]")) return;
    if (!cellEditor) return;
    const id = cb.value;
    if (!id) return;
    const set = new Set(cellEditor.employeeIds);
    if (cb.checked) set.add(id);
    else {
      if (!cellEditor.dateEditable && set.size <= 1) {
        cb.checked = true;
        return;
      }
      set.delete(id);
    }
    applyEmployeeIds([...set]);
  });

  if (editEmployeeDropdownOpen) {
    open();
  }
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

function renderCellEditDialog(types: ShiftType[]): string {
  if (!cellEditor) return "";
  const pageStoreId = readScopeFilters().store;
  const scopedTypes = filterShiftTypesByStore(types, pageStoreId);
  const employees = readScopedEmployees();
  const selectedEmployeeIds = cellEditor.employeeIds.filter((id) => employees.some((e) => e.id === id));
  const primaryEmployeeId = selectedEmployeeIds[0] ?? cellEditor.employeeIds[0] ?? "";
  const assignment = primaryEmployeeId ? getAssignment(primaryEmployeeId, cellEditor.date) : undefined;
  const shift =
    (assignment ? scopedTypes.find((t) => t.id === assignment.shiftId) : undefined) ||
    (assignment ? types.find((t) => t.id === assignment.shiftId) : undefined);
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

  
  const breakCompensation =
    assignment?.breakCompensation ??
    resolveCustomBreakSelection(assignment?.breakId, assignment)?.compensation ??
    "unpaid";
  const breakId = assignment?.breakId;
  const breakOpt = resolveCustomBreakSelection(breakId, assignment, breakCompensation);
  const breakEnabled = cellEditor.breakEnabled;
  const workHours = shiftDurationHoursFromTimes(startTime, endTime);
  const showSkipReason = !breakEnabled && workHours > BREAK_REQUIRED_HOURS_THRESHOLD;

return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-shift-edit-dialog role="dialog" aria-modal="true" aria-labelledby="shift-edit-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-shift-edit-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div class="border-b border-border px-5 py-4">
          <h2 id="shift-edit-title" class="text-base font-semibold text-foreground">${hasAnyAssignment ? "当日班次调整" : "安排排班"}</h2>
        </div>
        <div class="min-h-0 flex-1 space-y-3 overflow-auto px-5 py-4">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 班次选择:</span>
            <select data-shift-edit-shift class="${SHIFT_FORM_INPUT} sm:max-w-md" required>
              ${renderShiftSelectOptions(scopedTypes, assignment?.shiftId ?? "")}
            </select>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 日期:</span>
            <div class="relative flex w-full max-w-md items-center">
              <input type="date" value="${escapeHtml(cellEditor.date)}" data-shift-edit-date${
                cellEditor.dateEditable
                  ? ` min="${escapeHtml(todayIso())}" required`
                  : " readonly"
              } class="${SHIFT_FORM_INPUT} pr-10" />
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

          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span class="${SHIFT_FORM_LABEL}">安排休息:</span>
            <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" data-shift-edit-break-enabled class="size-4 shrink-0 accent-primary"${breakEnabled ? " checked" : ""} />
              <span class="text-muted-foreground">合规要求工时超过 ${BREAK_REQUIRED_HOURS_THRESHOLD} 小时需要安排休息</span>
            </label>
          </div>
          <div class="space-y-3${breakEnabled ? "" : " hidden"}" data-shift-edit-break-fields>
            <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 休息类型:</span>
              <select data-shift-edit-break-compensation class="${SHIFT_FORM_INPUT} sm:max-w-md"${breakEnabled ? " required" : ""}>
                <option value="unpaid"${breakCompensation === "unpaid" ? " selected" : ""}>无薪</option>
                <option value="paid"${breakCompensation === "paid" ? " selected" : ""}>带薪</option>
              </select>
            </div>
            <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <span class="${SHIFT_FORM_LABEL}"><span class="text-destructive">*</span> 休息名称:</span>
              <div class="min-w-0 flex-1 space-y-1 sm:max-w-md">
                <select data-shift-edit-break-id class="${SHIFT_FORM_INPUT}"${breakEnabled ? " required" : ""}>
                  ${renderCustomBreakNameSelectOptions(breakCompensation, breakId)}
                </select>
                ${renderSelectedBreakMetaHtml(breakOpt)}
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3${showSkipReason ? "" : " hidden"}" data-shift-edit-break-skip-wrap>
            <span class="${SHIFT_FORM_LABEL}">关闭原因:</span>
            <input type="text" value="${escapeHtml(cellEditor.breakSkipReason)}" data-shift-edit-break-skip-reason maxlength="80" placeholder="选填，如：短班次无需休息" class="${SHIFT_FORM_INPUT} sm:max-w-md" />
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
          <p data-shift-edit-batch-hint class="text-xs text-primary sm:pl-[calc(9rem+0.75rem)]${multiEmployee ? "" : " hidden"}">${
            multiEmployee ? `已选 ${selectedEmployeeIds.length} 名员工，保存后统一应用以上设置` : ""
          }</p>
          ${
            !multiEmployee && !hasAnyAssignment && repeatMode === "week"
              ? `<p class="text-xs text-muted-foreground sm:pl-[calc(9rem+0.75rem)]">按周重复时，将在当前排班表可见日期范围内批量写入</p>`
              : !multiEmployee && customized
                ? `<p class="text-xs text-primary sm:pl-[calc(9rem+0.75rem)]">* 已针对当日调整，与班次默认不同</p>`
                : ""
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

export function renderTeamShiftSchedulingPage(rulesPanelHtml = ""): string {
  ensureShiftSchedulingPageSaveRegistry();
  ensureShiftTypesBaseline(readShiftTypes());
  ensureAssignmentsBaseline(readAssignments());
  const panel =
    shiftPageTab === "schedule"
      ? renderSchedulePanel()
      : shiftPageTab === "shifts"
        ? renderShiftsPanel()
        : `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-shift-rules-wrap role="tabpanel">
      ${
        rulesPanelHtml.trim()
          ? rulesPanelHtml
          : `<div class="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">暂无规则设置</div>`
      }
    </div>`;

  return `
    <div class="team-shift-scheduling-page flex min-h-0 flex-1 flex-col gap-3" data-shift-scheduling-page>
      ${renderShiftTabBar()}
      ${panel}
    </div>`;
}

function renderSchedulePanel(): string {
  const shiftTypes = readShiftTypes();
  const employees = readScopedEmployees();
  const syncVisible = shouldShowSyncToNextWeek();

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3" data-shift-schedule-panel>
      <div class="flex shrink-0 flex-wrap items-center gap-3">
        <div class="flex min-w-0 flex-nowrap items-center gap-3">
          ${renderCompactStoreFilter()}
          <div class="flex shrink-0 items-center gap-2 rounded-md border border-input bg-background px-2 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-muted-foreground" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <input type="date" data-shift-date-from value="${escapeHtml(pageState.dateFrom)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
            <span class="text-muted-foreground">→</span>
            <input type="date" data-shift-date-to value="${escapeHtml(pageState.dateTo)}" class="h-8 border-0 bg-transparent text-sm focus-visible:outline-none" />
          </div>
        </div>
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">${renderQuickPresetButtons()}</div>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-3">
        ${renderEmployeeFilterMultiSelect(employees)}
        <button type="button" data-shift-open-employee-schedule
          class="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >员工排班</button>
        ${
          syncVisible
            ? `<button type="button" data-shift-sync-next-week
          class="h-9 rounded-md border border-border bg-background px-4 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >同步到下周</button>`
            : ""
        }
      </div>

      <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border" data-shift-schedule-table>
        ${renderScheduleTableInnerHtml()}
      </div>

      ${renderCellEditDialog(shiftTypes)}
    </div>`;
}

function readPageStateFromDom(root: HTMLElement): void {
  const from = root.querySelector<HTMLInputElement>("[data-shift-date-from]");
  const to = root.querySelector<HTMLInputElement>("[data-shift-date-to]");
  if (from?.value) pageState.dateFrom = from.value;
  if (to?.value) pageState.dateTo = to.value;
}

function clearEmployeeFilterOutsideCloser(): void {
  if (!employeeFilterOutsideCloser) return;
  document.removeEventListener("click", employeeFilterOutsideCloser, true);
  employeeFilterOutsideCloser = null;
}

function syncEmployeeFilterOptionVisibility(root: HTMLElement): void {
  const q = employeeFilterSearchQuery.trim().toLowerCase();
  const options = root.querySelectorAll<HTMLElement>("[data-shift-employee-filter-option]");
  let visible = 0;
  options.forEach((opt) => {
    const label = (opt.textContent || "").trim().toLowerCase();
    const show = !q || label.includes(q);
    opt.classList.toggle("hidden", !show);
    if (show) visible += 1;
  });
  let emptyEl = root.querySelector<HTMLElement>("[data-shift-employee-filter-empty]");
  const optionsWrap = root.querySelector("[data-shift-employee-filter-options]");
  if (!optionsWrap) return;
  if (visible === 0 && options.length > 0) {
    if (!emptyEl) {
      emptyEl = document.createElement("div");
      emptyEl.className = "px-3 py-2 text-sm text-muted-foreground";
      emptyEl.setAttribute("data-shift-employee-filter-empty", "");
      optionsWrap.appendChild(emptyEl);
    }
    emptyEl.textContent = q ? "没有匹配的员工" : "暂无员工";
    emptyEl.classList.remove("hidden");
  } else if (emptyEl) {
    emptyEl.classList.add("hidden");
  }
}

function bindEmployeeFilterMultiSelect(root: HTMLElement, remount: () => void): void {
  const wrap = root.querySelector<HTMLElement>("[data-shift-employee-filter]");
  if (!wrap || wrap.dataset.employeeFilterBound === "1") return;
  wrap.dataset.employeeFilterBound = "1";

  const close = () => {
    if (!employeeFilterDropdownOpen) return;
    clearEmployeeFilterOutsideCloser();
    employeeFilterDropdownOpen = false;
    employeeFilterSearchQuery = "";
    unmountEmployeeFilterDropdown(wrap);
    setEmployeeFilterOpenState(wrap, false);
  };

  const bindDropdownChrome = (dropdown: HTMLElement) => {
    dropdown.addEventListener("click", (e) => e.stopPropagation());
    const search = dropdown.querySelector<HTMLInputElement>("[data-shift-employee-filter-search]");
    search?.addEventListener("input", () => {
      employeeFilterSearchQuery = search.value;
      syncEmployeeFilterOptionVisibility(root);
    });
    search?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    });
  };

  const open = () => {
    const existed = !!wrap.querySelector("[data-shift-employee-filter-dropdown]");
    employeeFilterDropdownOpen = true;
    const dropdown = mountEmployeeFilterDropdown(wrap);
    if (!existed) bindDropdownChrome(dropdown);
    setEmployeeFilterOpenState(wrap, true);
    clearEmployeeFilterOutsideCloser();
    employeeFilterOutsideCloser = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-shift-employee-filter]")) return;
      close();
    };
    requestAnimationFrame(() => {
      if (employeeFilterOutsideCloser) {
        document.addEventListener("click", employeeFilterOutsideCloser, true);
      }
      dropdown.querySelector<HTMLInputElement>("[data-shift-employee-filter-search]")?.focus();
    });
  };

  const openOrToggle = () => {
    if (employeeFilterDropdownOpen && wrap.querySelector("[data-shift-employee-filter-dropdown]")) close();
    else open();
  };

  const applyFilterIds = (ids: string[]) => {
    pageState.employeeFilterIds = ids;
    syncEmployeeFilterSelectionUi(root);
    refreshScheduleTable(root, remount);
  };

  wrap.querySelector("[data-shift-employee-filter-trigger]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if ((e.target as HTMLElement | null)?.closest("[data-shift-employee-filter-remove]")) return;
    openOrToggle();
  });
  wrap.querySelector("[data-shift-employee-filter-trigger]")?.addEventListener("keydown", (e) => {
    const ke = e as KeyboardEvent;
    if (ke.key === "Enter" || ke.key === " ") {
      ke.preventDefault();
      openOrToggle();
    } else if (ke.key === "Escape") {
      close();
    }
  });

  wrap.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-shift-employee-filter-remove]");
    if (!btn || !wrap.contains(btn)) return;
    e.stopPropagation();
    const id = btn.getAttribute("data-shift-employee-filter-remove");
    if (!id) return;
    applyFilterIds(pageState.employeeFilterIds.filter((x) => x !== id));
  });

  wrap.addEventListener("change", (e) => {
    const cb = e.target as HTMLInputElement | null;
    if (!cb || !cb.matches("[data-shift-employee-filter-option-cb]")) return;
    const id = cb.value;
    if (!id) return;
    const set = new Set(pageState.employeeFilterIds);
    if (cb.checked) set.add(id);
    else set.delete(id);
    applyFilterIds([...set]);
  });

  if (employeeFilterDropdownOpen) open();
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
  const storeId =
    root.querySelector<HTMLSelectElement>("[data-shift-type-store]")?.value.trim() ||
    shiftConfigStoreFilter ||
    "";
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
  const breakEnabled =
    root.querySelector<HTMLInputElement>("[data-shift-type-break-enabled]")?.checked ?? false;
  if (!name) return null;
  const partial: Partial<ShiftType> & Pick<ShiftType, "id" | "name" | "startTime" | "endTime"> = {
    id,
    name,
    storeId,
    startTime,
    endTime,
    color,
    earlyClockInMinutes,
    autoClockOutDelayEnabled,
    autoClockOutDelayMinutes,
    breakEnabled,
  };
  if (breakEnabled) {
    const compensation =
      root.querySelector<HTMLSelectElement>("[data-shift-type-break-compensation]")?.value === "paid"
        ? "paid"
        : "unpaid";
    const breakId = root.querySelector<HTMLSelectElement>("[data-shift-type-break-id]")?.value ?? "";
    const breakOpt = resolveCustomBreakSelection(breakId, { breakCompensation: compensation }, compensation);
    if (breakOpt) {
      partial.breakId = breakOpt.id;
      partial.breakName = breakOpt.name;
      partial.breakCompensation = breakOpt.compensation;
      partial.breakDurationMinutes = breakOpt.durationMinutes;
      partial.breakMandatory = breakOpt.mandatory;
    }
  }
  return normalizeShiftType(partial);
}

function syncEditWorkHoursInDialog(dialog: HTMLElement): void {
  const start = dialog.querySelector<HTMLInputElement>("[data-shift-edit-start]")?.value ?? "";
  const end = dialog.querySelector<HTMLInputElement>("[data-shift-edit-end]")?.value ?? "";
  const label = dialog.querySelector<HTMLElement>("[data-shift-edit-work-hours]");
  if (label) label.textContent = formatWorkHoursDisplay(start, end);
  syncEditBreakSkipReasonVisibility(dialog);
}

function syncEditBreakFieldsVisibility(dialog: HTMLElement): void {
  const enabled = dialog.querySelector<HTMLInputElement>("[data-shift-edit-break-enabled]")?.checked ?? false;
  dialog.querySelector<HTMLElement>("[data-shift-edit-break-fields]")?.classList.toggle("hidden", !enabled);
  const compensation = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-compensation]");
  const breakId = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-id]");
  if (compensation) compensation.required = enabled;
  if (breakId) breakId.required = enabled;
  syncEditBreakSkipReasonVisibility(dialog);
}

function syncEditBreakSkipReasonVisibility(dialog: HTMLElement): void {
  const enabled = dialog.querySelector<HTMLInputElement>("[data-shift-edit-break-enabled]")?.checked ?? false;
  const start = dialog.querySelector<HTMLInputElement>("[data-shift-edit-start]")?.value ?? "";
  const end = dialog.querySelector<HTMLInputElement>("[data-shift-edit-end]")?.value ?? "";
  const hours = shiftDurationHoursFromTimes(start, end);
  const show = !enabled && hours > BREAK_REQUIRED_HOURS_THRESHOLD;
  dialog.querySelector<HTMLElement>("[data-shift-edit-break-skip-wrap]")?.classList.toggle("hidden", !show);
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
  if (cellEditor) {
    cellEditor.breakSwitchTouched = false;
    cellEditor.breakEnabled = shiftTypeHasBreak(shift)
      ? true
      : shift.breakEnabled === false
        ? false
        : defaultBreakEnabledForWorkHours(shiftDurationHoursFromTimes(shift.startTime, shift.endTime));
    cellEditor.breakSkipReason = "";
    const breakToggle = dialog.querySelector<HTMLInputElement>("[data-shift-edit-break-enabled]");
    if (breakToggle) breakToggle.checked = cellEditor.breakEnabled;
    const skipReason = dialog.querySelector<HTMLInputElement>("[data-shift-edit-break-skip-reason]");
    if (skipReason) skipReason.value = "";
    if (cellEditor.breakEnabled && shiftTypeHasBreak(shift)) {
      const compensation =
        shift.breakCompensation ??
        resolveCustomBreakSelection(shift.breakId, shift)?.compensation ??
        "unpaid";
      const compensationSelect = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-compensation]");
      if (compensationSelect) compensationSelect.value = compensation;
      syncShiftEditBreakNameSelect(dialog, compensation, shift.breakId);
    }
    syncEditBreakFieldsVisibility(dialog);
  }
}

function bindCellEditDialog(remount: () => void): void {
  const dialog = document.querySelector<HTMLElement>("[data-shift-edit-dialog]");
  if (!dialog || !cellEditor) return;
  if (!isScheduleDateEditable(cellEditor.date)) {
    clearEditEmployeePickerState();
    cellEditor = null;
    remount();
    return;
  }

  const onTimeChange = () => syncEditWorkHoursInDialog(dialog);
  dialog.querySelector("[data-shift-edit-start]")?.addEventListener("input", onTimeChange);
  dialog.querySelector("[data-shift-edit-end]")?.addEventListener("input", onTimeChange);
  dialog.querySelector("[data-shift-edit-start]")?.addEventListener("change", onTimeChange);
  dialog.querySelector("[data-shift-edit-end]")?.addEventListener("change", onTimeChange);

  dialog.querySelector("[data-shift-edit-auto-clock-out-enabled]")?.addEventListener("change", () => {
    syncEditAutoClockOutDelayField(dialog);
  });
  syncEditAutoClockOutDelayField(dialog);
  syncEditBreakFieldsVisibility(dialog);

  dialog.querySelector("[data-shift-edit-break-enabled]")?.addEventListener("change", (e) => {
    if (!cellEditor) return;
    const checked = (e.target as HTMLInputElement).checked;
    cellEditor.breakEnabled = checked;
    cellEditor.breakSwitchTouched = true;
    if (checked) cellEditor.breakSkipReason = "";
    syncEditBreakFieldsVisibility(dialog);
  });
  dialog.querySelector("[data-shift-edit-break-skip-reason]")?.addEventListener("input", (e) => {
    if (!cellEditor) return;
    cellEditor.breakSkipReason = (e.target as HTMLInputElement).value;
  });

  dialog.querySelector("[data-shift-edit-shift]")?.addEventListener("change", (e) => {
    const shiftId = (e.target as HTMLSelectElement).value;
    const shift = readShiftTypes().find((t) => t.id === shiftId);
    if (shift) applyShiftTemplateToEditDialog(dialog, shift);
    refreshEditEmployeeOptions(dialog);
  });

  dialog.querySelector("[data-shift-edit-break-compensation]")?.addEventListener("change", (e) => {
    const compensation =
      (e.target as HTMLSelectElement).value === "paid" ? "paid" : "unpaid";
    syncShiftEditBreakNameSelect(dialog, compensation);
  });

  dialog.querySelector("[data-shift-edit-break-id]")?.addEventListener("change", (e) => {
    const compensation =
      dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-compensation]")?.value === "paid"
        ? "paid"
        : "unpaid";
    const breakId = (e.target as HTMLSelectElement).value;
    const breakOpt = resolveCustomBreakSelection(breakId, { breakCompensation: compensation }, compensation);
    const oldMeta = dialog.querySelector("[data-shift-edit-break-meta]");
    if (!oldMeta) return;
    oldMeta.insertAdjacentHTML("afterend", renderSelectedBreakMetaHtml(breakOpt));
    oldMeta.remove();
  });

  bindEditEmployeeMultiSelect(dialog);

  dialog.querySelector<HTMLInputElement>("[data-shift-edit-date]")?.addEventListener("change", (e) => {
    if (!cellEditor?.dateEditable) return;
    const next = (e.target as HTMLInputElement).value;
    if (!next || !isScheduleDateEditable(next)) {
      (e.target as HTMLInputElement).value = cellEditor.date;
      return;
    }
    cellEditor = {
      ...cellEditor,
      date: next,
      repeatWeekdays: [parseIsoDate(next).getDay()],
    };
    refreshEditEmployeeOptions(dialog);
    syncRepeatWeekdaysPanel(dialog, cellEditor.date);
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
    clearEditEmployeePickerState();
    cellEditor = null;
    remount();
  });
  dialog.querySelector("[data-shift-edit-cancel]")?.addEventListener("click", () => {
    clearEditEmployeePickerState();
    cellEditor = null;
    remount();
  });
  dialog.querySelector("[data-shift-edit-reset]")?.addEventListener("click", () => {
    if (!cellEditor || !isScheduleDateEditable(cellEditor.date)) return;
    const employeeIds = collectSelectedEmployeeIdsFromDialog(dialog);
    if (employeeIds.length === 0) return;
    clearAssignmentOverridesForEmployees(employeeIds, cellEditor.date);
    remount();
  });
  dialog.querySelector("[data-shift-edit-clear]")?.addEventListener("click", () => {
    if (!cellEditor || !isScheduleDateEditable(cellEditor.date)) return;
    const employeeIds = collectSelectedEmployeeIdsFromDialog(dialog);
    if (employeeIds.length === 0) return;
    clearAssignmentsForEmployees(employeeIds, cellEditor.date);
    clearEditEmployeePickerState();
    cellEditor = null;
    remount();
  });
  dialog.querySelector("[data-shift-edit-save]")?.addEventListener("click", () => {
    if (!cellEditor || !isScheduleDateEditable(cellEditor.date)) return;
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
    const compensation =
      dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-compensation]")?.value === "paid"
        ? "paid"
        : "unpaid";
    const breakEnabled =
      dialog.querySelector<HTMLInputElement>("[data-shift-edit-break-enabled]")?.checked ?? false;
    const breakSkipReason =
      dialog.querySelector<HTMLInputElement>("[data-shift-edit-break-skip-reason]")?.value.trim() ?? "";
    const breakId = dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-id]")?.value ?? "";
    const breakOpt = breakEnabled
      ? resolveCustomBreakSelection(breakId, { breakCompensation: compensation }, compensation) ?? null
      : null;
    if (employeeIds.length === 0) {
      dialog.querySelector<HTMLElement>("[data-shift-edit-employee-trigger]")?.focus();
      return;
    }
    if (!shiftId) {
      dialog.querySelector<HTMLSelectElement>("[data-shift-edit-shift]")?.focus();
      return;
    }
    if (breakEnabled && !breakOpt) {
      dialog.querySelector<HTMLSelectElement>("[data-shift-edit-break-id]")?.focus();
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
        breakEnabled,
        breakOpt,
        breakSkipReason,
      )
    ) {
      return;
    }
    clearEditEmployeePickerState();
    cellEditor = null;
    remount();
  });
}

export function bindTeamShiftSchedulingUi(remount: () => void): void {
  ensureShiftSchedulingPageSaveRegistry();
  const root = document.querySelector<HTMLElement>("[data-shift-scheduling-page]");
  if (!root) return;

  if (ensureInPageDefaultStoreSelected()) {
    remount();
    return;
  }

  root.querySelectorAll("[data-shift-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-shift-tab") as ShiftPageTab | null;
      if (!tab || tab === shiftPageTab) return;
      if (shiftPageTab === "shifts") {
        closeShiftFormEditor();
        closeShiftDeleteConfirm();
      }
      clearEmployeeFilterOutsideCloser();
      employeeFilterDropdownOpen = false;
      employeeFilterSearchQuery = "";
      shiftPageTab = tab;
      remount();
    });
  });

  if (shiftPageTab === "shifts") {
    bindShiftsPanel(remount);
    return;
  }

  if (shiftPageTab === "rules") {
    return;
  }

  const storeSelect = root.querySelector<HTMLSelectElement>("[data-shift-store-filter]");
  if (storeSelect && storeSelect.dataset.bound !== "1") {
    storeSelect.dataset.bound = "1";
    storeSelect.addEventListener("change", () => {
      const storeId = storeSelect.value;
      if (!storeId) return;
      const scope = readScopeFilters();
      writeScopeFilters({ ...scope, store: storeId });
      remount();
    });
  }

  root.querySelector("[data-shift-date-from]")?.addEventListener("change", () => {
    readPageStateFromDom(root);
    pageState.quickPreset = "this-week";
    clearEmployeeFilterOutsideCloser();
    employeeFilterDropdownOpen = false;
    employeeFilterSearchQuery = "";
    remount();
  });
  root.querySelector("[data-shift-date-to]")?.addEventListener("change", () => {
    readPageStateFromDom(root);
    pageState.quickPreset = "this-week";
    clearEmployeeFilterOutsideCloser();
    employeeFilterDropdownOpen = false;
    employeeFilterSearchQuery = "";
    remount();
  });

  root.querySelectorAll("[data-shift-quick-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-shift-quick-preset") as QuickPreset;
      if (preset) {
        applyQuickPreset(preset);
        clearEmployeeFilterOutsideCloser();
        employeeFilterDropdownOpen = false;
        employeeFilterSearchQuery = "";
        remount();
      }
    });
  });

  bindEmployeeFilterMultiSelect(root, remount);

  root.querySelector("[data-shift-open-employee-schedule]")?.addEventListener("click", () => {
    clearEditEmployeePickerState();
    const date = defaultEmployeeScheduleDate();
    cellEditor = {
      date,
      employeeIds: [],
      dateEditable: true,
      repeatMode: "day",
      repeatWeekdays: [parseIsoDate(date).getDay()],
      breakEnabled: false,
      breakSkipReason: "",
      breakSwitchTouched: false,
    };
    remount();
  });

  root.querySelector("[data-shift-sync-next-week]")?.addEventListener("click", () => {
    if (!shouldShowSyncToNextWeek()) return;
    syncSelectedWeekToNextWeek();
    remount();
  });

  bindScheduleCellClicks(root, remount);
  bindCellEditDialog(remount);
}
