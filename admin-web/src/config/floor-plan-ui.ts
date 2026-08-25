/**
 * 前厅 · 餐位平面图（seq 428 能力页，非设置滑层项）
 * 原型：localStorage 按门店隔离持久化区域与桌位布局
 */
import { getScopedFilterOptions, readScopeFilters } from "../auth/session-scope";
import { clearPageConfigChanges } from "./deployment-change-buffer";
import { showAppToast } from "../ui/app-toast";
import { diffCollection, type CollectionAdapter } from "./collection-change-diff";
import { resolveChangeGroupPath } from "./module-settings-deployment-change";
import { replacePageOrImmediateConfigChange } from "./page-config-change";
import {
  registerPageSaveDirtyProbe,
  registerPageSavePreCommit,
} from "./page-save-registry";
import {
  formatRulePricingSummary,
  getDurationBillingRule,
  listEnabledDurationBillingRules,
} from "./duration-billing-rules-store";
import { readModuleSettingToggleOn } from "./module-settings-toggle-ui";
import {
  deleteKposTable,
  loadKposFloorPlan,
  loadKposKtvSaleItems,
  loadKposTableCategories,
  readKposFloorPlanConnection,
  saveKposTable,
  saveKposFloorPlanArea,
  type KposFloorPlanArea,
  type KposNamedOption,
} from "./kpos-floor-plan-client";
import {
  applyFloorPlanGeometryAction,
  requiredFloorPlanSelectionCount,
  type FloorPlanGeometryAction,
} from "./floor-plan-geometry";
import {
  findTableVacancy,
  rectanglesOverlap,
  validateNewTable,
} from "./floor-plan-table-placement";
import { listPendingKposFloorPlanOperations, putKposFloorPlanOperation, type KposFloorPlanOperation } from "./kpos-floor-plan-operation-ledger";

export const FLOOR_PLAN_PATH = "/operations/queue-call/floor-plan";

const STORAGE_KEY_PREFIX = "bplant-floor-plan:v1";
/** 旧版未按门店隔离的存储键，首次读取时迁移到当前门店 */
const LEGACY_STORAGE_KEY = "bplant-floor-plan:v1";
const DEFAULT_STORE_BUCKET = "__default__";
const KPOS_CANVAS_WIDTH = 1000;
const KPOS_CANVAS_HEIGHT = 650;

export type FloorPlanTableShape = "rectangle" | "circle" | "oval" | "bar" | "ktv";
export type KposTableShape = "RECTANGLE" | "ROUND" | "HIBACHI" | "BAR" | "KTV";
export type FloorPlanTableCategory = "standard" | "booth" | "bar" | "private" | "ktv";

export type FloorPlanTable = {
  id: string;
  name: string;
  seats: number;
  width: number;
  height: number;
  rotation: number;
  shape: FloorPlanTableShape;
  kposShape: KposTableShape | string;
  tableCategoryId?: string;
  hibachiTableShape?: string;
  seatingOrientation?: string;
  defaultSaleItemId?: string;
  category: FloorPlanTableCategory;
  /** KTV 桌位绑定的按时计价规则 id */
  durationBillingRuleId?: string | null;
  x: number;
  y: number;
  /** KPOS 运行态，只读并在保存前重新合并 */
  status?: string;
  currentGuestCount?: number;
};

export type FloorPlanArea = {
  id: string;
  name: string;
  tables: FloorPlanTable[];
};

type FloorPlanTableDialog =
  | { mode: "create"; areaId: string; vacancyWarning?: boolean }
  | { mode: "edit"; tableId: string };

type FloorPlanAreaDialog = { mode: "create" } | { mode: "edit"; areaId: string };

type FloorPlanState = {
  areas: FloorPlanArea[];
  activeAreaId: string;
  /** 画布高亮 */
  selectedTableId: string | null;
  /** 桌子信息弹框；create 时草稿存于 dialogDraft */
  tableDialog: FloorPlanTableDialog | null;
  dialogDraft?: FloorPlanTable;
  /** 区域名称弹框 */
  areaDialog: FloorPlanAreaDialog | null;
};

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

/** 当前页内/顶栏所选门店；无选择时落入默认桶 */
function resolveFloorPlanStoreId(): string {
  const storeId = readScopeFilters().store?.trim() || "";
  return storeId || DEFAULT_STORE_BUCKET;
}

function storageKeyForStore(storeId: string): string {
  return `${STORAGE_KEY_PREFIX}:store:${encodeURIComponent(storeId)}`;
}

function resolveFloorPlanStoreLabel(storeId: string): string {
  if (!storeId || storeId === DEFAULT_STORE_BUCKET) return "当前门店";
  const opt = getScopedFilterOptions().stores.find((o) => o.value === storeId);
  return (opt?.labelZh || opt?.labelEn || storeId).trim() || "当前门店";
}

function migrateLegacyFloorPlanIfNeeded(storeId: string): void {
  if (typeof window === "undefined") return;
  const key = storageKeyForStore(storeId);
  try {
    if (localStorage.getItem(key)) return;
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return;
    const parsed = JSON.parse(legacy) as { areas?: unknown };
    if (!Array.isArray(parsed?.areas)) return;
    localStorage.setItem(key, legacy);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function defaultState(): FloorPlanState {
  return {
    areas: [],
    activeAreaId: "",
    selectedTableId: null,
    tableDialog: null,
    areaDialog: null,
  };
}

function createDraftTable(area: FloorPlanArea): FloorPlanTable {
  const vacancy = findTableVacancy(area.tables, 80, 60, KPOS_CANVAS_WIDTH, KPOS_CANVAS_HEIGHT);
  const categories = resolveKposTableCategoryOptions(resolveFloorPlanStoreId());
  const allTablesCategory = categories.find((option) => option.name === "全部桌子") ?? categories[0];
  return {
    id: newId("t"),
    name: `T${area.tables.length + 1}`,
    seats: 4,
    width: 80,
    height: 60,
    rotation: 0,
    shape: "rectangle",
    kposShape: "RECTANGLE",
    tableCategoryId: allTablesCategory?.id,
    category: "standard",
    x: vacancy.x,
    y: vacancy.y,
  };
}

function getDialogTable(state: FloorPlanState): FloorPlanTable | null {
  const dialog = state.tableDialog;
  if (!dialog) return null;
  if (dialog.mode === "create") return state.dialogDraft ?? null;
  const area = getActiveArea(state);
  return area?.tables.find((t) => t.id === dialog.tableId) ?? null;
}

function parseFloorPlanState(raw: string | null): FloorPlanState {
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as FloorPlanState;
    if (!Array.isArray(parsed?.areas)) return defaultState();
    const areas = parsed.areas;
    return {
      areas,
      activeAreaId:
        areas.length > 0
          ? parsed.activeAreaId && areas.some((a) => a.id === parsed.activeAreaId)
            ? parsed.activeAreaId
            : areas[0]!.id
          : "",
      selectedTableId: parsed.selectedTableId ?? null,
      tableDialog: parsed.tableDialog ?? null,
      dialogDraft: parsed.dialogDraft,
      areaDialog: parsed.areaDialog ?? null,
    };
  } catch {
    return defaultState();
  }
}

function readState(): FloorPlanState {
  const storeId = resolveFloorPlanStoreId();
  if (isKposLiveMode()) return liveStateByStore.get(storeId) ?? defaultState();
  migrateLegacyFloorPlanIfNeeded(storeId);
  try {
    return parseFloorPlanState(localStorage.getItem(storageKeyForStore(storeId)));
  } catch {
    return defaultState();
  }
}

function cloneAreas(areas: FloorPlanArea[]): FloorPlanArea[] {
  return JSON.parse(JSON.stringify(areas)) as FloorPlanArea[];
}

type FlatFloorPlanTable = FloorPlanTable & { areaId: string; areaName: string };

const SHAPE_LABEL: Record<FloorPlanTableShape, string> = {
  rectangle: "矩形",
  circle: "圆形",
  oval: "Hibachi / 长桌",
  bar: "吧台",
  ktv: "卡拉 OK",
};

const CATEGORY_LABEL: Record<FloorPlanTableCategory, string> = {
  standard: "标准",
  booth: "卡座",
  bar: "吧台",
  private: "包间",
  ktv: "KTV",
};

const FLOOR_PLAN_AREA_ADAPTER: CollectionAdapter<FloorPlanArea> = {
  collectionKey: "foh.floor-plan-areas",
  collectionLabel: "平面图区域",
  idOf: (item) => item.id,
  labelOf: (item) => item.name || item.id,
  fields: [
    { key: "name", label: "区域名称", get: (i) => i.name },
    {
      key: "tableCount",
      label: "桌位数",
      get: (i) => i.tables.length,
    },
  ],
};

const FLOOR_PLAN_TABLE_ADAPTER: CollectionAdapter<FlatFloorPlanTable> = {
  collectionKey: "foh.floor-plan-tables",
  collectionLabel: "平面图桌位",
  idOf: (item) => item.id,
  labelOf: (item) => `${item.areaName} · ${item.name || item.id}`,
  fields: [
    { key: "areaName", label: "所属区域", get: (i) => i.areaName },
    { key: "name", label: "桌位名称", get: (i) => i.name },
    { key: "seats", label: "座位数", get: (i) => i.seats },
    {
      key: "shape",
      label: "形状",
      get: (i) => i.shape,
      format: (v) => SHAPE_LABEL[v as FloorPlanTableShape] ?? String(v),
    },
    {
      key: "category",
      label: "类型",
      get: (i) => i.category,
      format: (v) => CATEGORY_LABEL[v as FloorPlanTableCategory] ?? String(v),
    },
    { key: "width", label: "宽度", get: (i) => i.width },
    { key: "height", label: "高度", get: (i) => i.height },
    { key: "rotation", label: "旋转角", get: (i) => i.rotation },
    { key: "kposShape", label: "KPOS 桌型", get: (i) => i.kposShape },
    { key: "tableCategoryId", label: "KPOS 桌子类别", get: (i) => i.tableCategoryId ?? "" },
    { key: "hibachiTableShape", label: "铁板桌类型", get: (i) => i.hibachiTableShape ?? "" },
    { key: "seatingOrientation", label: "座位排布", get: (i) => i.seatingOrientation ?? "" },
    { key: "defaultSaleItemId", label: "KTV 默认商品", get: (i) => i.defaultSaleItemId ?? "" },
    { key: "x", label: "X 坐标", get: (i) => i.x },
    { key: "y", label: "Y 坐标", get: (i) => i.y },
    {
      key: "durationBillingRuleId",
      label: "按时计价规则",
      get: (i) => i.durationBillingRuleId ?? "",
      format: (v) => {
        if (!v) return "未绑定";
        const rule = getDurationBillingRule(resolveFloorPlanStoreId(), String(v));
        return rule?.name ?? String(v);
      },
    },
  ],
};

function flattenFloorPlanTables(areas: FloorPlanArea[]): FlatFloorPlanTable[] {
  return areas.flatMap((area) =>
    area.tables.map((table) => ({
      ...table,
      areaId: area.id,
      areaName: area.name,
    })),
  );
}

/** 进入页后的区域快照（按门店）；放弃修改时回滚 */
const floorPlanBaselineByStore = new Map<string, FloorPlanArea[]>();
const kposTableCategoriesByStore = new Map<string, KposNamedOption[]>();
const kposKtvItemsByStore = new Map<string, KposNamedOption[]>();

function resolveKposTableCategoryOptions(storeId: string): KposNamedOption[] {
  const loaded = kposTableCategoriesByStore.get(storeId) ?? [];
  const allIndex = loaded.findIndex((option) => /^(all tables|全部|全部桌子|所有桌台)$/i.test(option.name.trim()));
  if (allIndex >= 0) {
    return loaded.map((option, index) => index === allIndex ? { ...option, name: "全部桌子" } : option);
  }
  // KPOS 内建 All tables 类别的固定 ID；接口未返回或仍在加载时也必须可选择。
  return [{ id: "1", name: "全部桌子" }, ...loaded];
}

function ensureFloorPlanBaseline(storeId: string, areas: FloorPlanArea[]): FloorPlanArea[] {
  const existing = floorPlanBaselineByStore.get(storeId);
  if (existing) return existing;
  const cloned = cloneAreas(areas);
  floorPlanBaselineByStore.set(storeId, cloned);
  return cloned;
}

function ensureLiveFloorPlanLoaded(storeId: string): void {
  if (!isKposLiveMode() || liveStateByStore.has(storeId) || liveLoadByStore.has(storeId)) return;
  const load = loadKposFloorPlan()
    .then((areas) => {
      const state = mapKposAreas(areas);
      liveStateByStore.set(storeId, state);
      floorPlanBaselineByStore.set(storeId, cloneAreas(state.areas));
      liveErrorByStore.delete(storeId);
    })
    .catch((error: unknown) => {
      liveErrorByStore.set(storeId, error instanceof Error ? error.message : "读取 KPOS 桌台失败");
    })
    .finally(() => {
      liveLoadByStore.delete(storeId);
      remountFloorPlan();
    });
  liveLoadByStore.set(storeId, load);
  const connection = readKposFloorPlanConnection();
  const ledgerScope = `${storeId}|${connection?.host ?? ""}|${connection?.licenseName ?? ""}`;
  void listPendingKposFloorPlanOperations(ledgerScope).then((rows) => {
    if (!rows.length) return;
    const latest = rows.sort((a, b) => b.updatedAt - a.updatedAt)[0]!;
    liveErrorByStore.set(storeId, `检测到未完成的 KPOS 同步（${latest.stage}）。系统已停止自动重放，请刷新服务器数据后核对。${latest.lastError ? ` ${latest.lastError}` : ""}`);
    remountFloorPlan();
  }).catch(() => { /* IndexedDB may be unavailable in restricted browser contexts */ });
  void Promise.all([loadKposTableCategories(), loadKposKtvSaleItems()]).then(([categories, items]) => {
    kposTableCategoriesByStore.set(storeId, categories);
    kposKtvItemsByStore.set(storeId, items);
    remountFloorPlan();
  }).catch(() => { /* table data remains usable if option lookup fails */ });
}

function kposPropertyFingerprint(table: FloorPlanTable): string {
  return JSON.stringify({
    name: table.name.trim().toUpperCase(), seats: table.seats, width: table.width, height: table.height,
    kposShape: table.kposShape, tableCategoryId: table.tableCategoryId ?? "",
    hibachiTableShape: table.hibachiTableShape ?? "", seatingOrientation: table.seatingOrientation ?? "",
    defaultSaleItemId: table.defaultSaleItemId ?? "",
  });
}

async function syncKposArea(area: FloorPlanArea, baseline?: FloorPlanArea): Promise<void> {
  const connection = readKposFloorPlanConnection();
  const operation: KposFloorPlanOperation = {
    id: crypto.randomUUID(),
    scope: `${resolveFloorPlanStoreId()}|${connection?.host ?? ""}|${connection?.licenseName ?? ""}`,
    areaId: area.id,
    stage: "pending",
    baselineFingerprint: JSON.stringify(baseline ?? null),
    targetFingerprint: JSON.stringify(area),
    temporaryIdMap: {},
    updatedAt: Date.now(),
  };
  await putKposFloorPlanOperation(operation);
  const baselineById = new Map(baseline?.tables.map((table) => [table.id, table]) ?? []);
  try {
    for (const table of area.tables) {
      const previous = baselineById.get(table.id);
      if (!previous || kposPropertyFingerprint(previous) !== kposPropertyFingerprint(table)) {
        await saveKposTable(toKposArea({ ...area, tables: [table] }).tables[0]!, area.id);
      }
    }
    const targetIds = new Set(area.tables.map((table) => table.id));
    for (const removed of baseline?.tables.filter((table) => !targetIds.has(table.id)) ?? []) {
      if (!isKposTableDeletable(removed)) throw new Error(`桌台 ${removed.name} 正在使用，无法删除`);
      await deleteKposTable(removed.id);
    }
    operation.stage = "table-saved";
    await putKposFloorPlanOperation(operation);
    const afterProperties = await loadKposFloorPlan();
    const serverArea = afterProperties.find((candidate) => candidate.id === area.id);
    if (!serverArea) throw new Error("单桌属性保存后无法回读目标区域");
    const reconciled: FloorPlanArea = {
      ...area,
      tables: area.tables.map((table) => {
        if (!table.id.startsWith("t-")) return table;
        const matches = serverArea.tables.filter((candidate) => candidate.name.trim().toUpperCase() === table.name.trim().toUpperCase());
        if (matches.length !== 1) throw new Error(`无法唯一认领新桌台“${table.name}”的真实 KPOS ID`);
        operation.temporaryIdMap[table.id] = matches[0]!.id;
        return { ...table, id: matches[0]!.id };
      }),
    };
    await putKposFloorPlanOperation(operation);
    await saveKposFloorPlanArea(toKposArea(reconciled), serverArea);
    operation.stage = "layout-saved";
    await putKposFloorPlanOperation(operation);
    operation.stage = "reconciled";
    await putKposFloorPlanOperation(operation);
  } catch (error) {
    operation.lastError = error instanceof Error ? error.message : "KPOS 同步失败";
    await putKposFloorPlanOperation(operation);
    throw error;
  }
}

function rerecordFloorPlanCollectionChanges(storeId: string, areas: FloorPlanArea[]): void {
  const baseline = ensureFloorPlanBaseline(storeId, areas);
  const groupPath = resolveChangeGroupPath(FLOOR_PLAN_PATH);
  const opts = { settingsPath: FLOOR_PLAN_PATH, groupPath };
  const storeLabel = resolveFloorPlanStoreLabel(storeId);

  const areasChange = diffCollection(baseline, areas, FLOOR_PLAN_AREA_ADAPTER, opts);
  if (areasChange) {
    replacePageOrImmediateConfigChange(FLOOR_PLAN_PATH, {
      ...areasChange,
      label: `${areasChange.label} · ${storeLabel}`,
    });
  } else {
    replacePageOrImmediateConfigChange(FLOOR_PLAN_PATH, {
      fieldKey: FLOOR_PLAN_AREA_ADAPTER.collectionKey,
      label: `${FLOOR_PLAN_AREA_ADAPTER.collectionLabel} · ${storeLabel}`,
      before: "原 0 项",
      after: "现 0 项",
      entities: [],
      changeKind: "collection",
      settingsPath: FLOOR_PLAN_PATH,
      groupPath,
    });
  }

  const tablesChange = diffCollection(
    flattenFloorPlanTables(baseline),
    flattenFloorPlanTables(areas),
    FLOOR_PLAN_TABLE_ADAPTER,
    opts,
  );
  if (tablesChange) {
    replacePageOrImmediateConfigChange(FLOOR_PLAN_PATH, {
      ...tablesChange,
      label: `${tablesChange.label} · ${storeLabel}`,
    });
  } else {
    replacePageOrImmediateConfigChange(FLOOR_PLAN_PATH, {
      fieldKey: FLOOR_PLAN_TABLE_ADAPTER.collectionKey,
      label: `${FLOOR_PLAN_TABLE_ADAPTER.collectionLabel} · ${storeLabel}`,
      before: "原 0 项",
      after: "现 0 项",
      entities: [],
      changeKind: "collection",
      settingsPath: FLOOR_PLAN_PATH,
      groupPath,
    });
  }
}

function writeState(state: FloorPlanState): void {
  const storeId = resolveFloorPlanStoreId();
  const before = readState();
  const beforePayload = JSON.stringify(before.areas);
  const afterPayload = JSON.stringify(state.areas);
  // 始终持久化完整状态（含弹窗/选中），否则「新增区域」等仅改 UI 态的操作会在 remount 后丢失
  if (isKposLiveMode()) liveStateByStore.set(storeId, state);
  else localStorage.setItem(storageKeyForStore(storeId), JSON.stringify(state));
  if (beforePayload === afterPayload) return;
  ensureFloorPlanBaseline(storeId, before.areas);
  rerecordFloorPlanCollectionChanges(storeId, state.areas);
}

let floorPlanRegistryBound = false;

function ensureFloorPlanPageSaveRegistry(): void {
  if (floorPlanRegistryBound) return;
  floorPlanRegistryBound = true;

  registerPageSavePreCommit(FLOOR_PLAN_PATH, async () => {
    const storeId = resolveFloorPlanStoreId();
    const state = readState();
    const baseline = ensureFloorPlanBaseline(storeId, state.areas);
    rerecordFloorPlanCollectionChanges(storeId, state.areas);
    if (isKposLiveMode()) {
      const baselineById = new Map(baseline.map((area) => [area.id, area]));
      if (baseline.some((area) => !state.areas.some((next) => next.id === area.id))) {
        liveErrorByStore.set(storeId, "真实 KPOS 模式暂不支持删除区域，请先恢复删除项");
        remountFloorPlan();
        return false;
      }
      try {
        const changed = state.areas.filter(
          (area) => JSON.stringify(area) !== JSON.stringify(baselineById.get(area.id)),
        );
        for (const area of changed) {
          const expected = baselineById.get(area.id);
          await syncKposArea(area, expected);
        }
        const refreshed = mapKposAreas(await loadKposFloorPlan(), state);
        liveStateByStore.set(storeId, refreshed);
        floorPlanBaselineByStore.set(storeId, cloneAreas(refreshed.areas));
        liveErrorByStore.delete(storeId);
      } catch (error) {
        liveErrorByStore.set(storeId, error instanceof Error ? error.message : "保存 KPOS 桌台失败");
        remountFloorPlan();
        return false;
      }
    }
    return true;
  });

  registerPageSaveDirtyProbe(FLOOR_PLAN_PATH, () => {
    const storeId = resolveFloorPlanStoreId();
    const baseline = floorPlanBaselineByStore.get(storeId);
    if (!baseline) return false;
    try {
      return JSON.stringify(baseline) !== JSON.stringify(readState().areas);
    } catch {
      return false;
    }
  });

  window.addEventListener("menusifu:page-settings-discard", (event) => {
    const pageKey = (event as CustomEvent<{ pageKey?: string }>).detail?.pageKey;
    if (pageKey !== FLOOR_PLAN_PATH) return;
    const storeId = resolveFloorPlanStoreId();
    const baseline = floorPlanBaselineByStore.get(storeId);
    if (!baseline) return;
    const current = readState();
    const restored: FloorPlanState = {
      ...current,
      areas: cloneAreas(baseline),
      activeAreaId: baseline[0]?.id ?? "",
      selectedTableId: null,
      tableDialog: null,
      areaDialog: null,
      dialogDraft: undefined,
    };
    if (isKposLiveMode()) liveStateByStore.set(storeId, restored);
    else localStorage.setItem(storageKeyForStore(storeId), JSON.stringify(restored));
    clearPageConfigChanges(FLOOR_PLAN_PATH);
    remountFloorPlan();
  });

  window.addEventListener("menusifu:page-settings-saved", (event) => {
    const pageKey = (event as CustomEvent<{ pageKey?: string }>).detail?.pageKey;
    if (pageKey !== FLOOR_PLAN_PATH) return;
    const storeId = resolveFloorPlanStoreId();
    floorPlanBaselineByStore.set(storeId, cloneAreas(readState().areas));
  });

  window.addEventListener("menusifu:kpos-floor-plan-connection-change", () => {
    liveStateByStore.clear();
    liveLoadByStore.clear();
    liveErrorByStore.clear();
    floorPlanBaselineByStore.clear();
    selectedTableIdsByStore.clear();
    multiSelectByStore.clear();
    if (isFloorPlanPath(window.location.pathname)) remountFloorPlan();
  });
}

export function isFloorPlanPath(path: string): boolean {
  return path === FLOOR_PLAN_PATH || path.startsWith(`${FLOOR_PLAN_PATH}/`);
}

function getActiveArea(state: FloorPlanState): FloorPlanArea | null {
  if (!state.areas.length) return null;
  return state.areas.find((a) => a.id === state.activeAreaId) ?? state.areas[0] ?? null;
}

function getSelectedTable(state: FloorPlanState): FloorPlanTable | null {
  const area = getActiveArea(state);
  if (!area || !state.selectedTableId) return null;
  return area.tables.find((t) => t.id === state.selectedTableId) ?? null;
}

function closeAreaDialog(state: FloorPlanState): FloorPlanState {
  return { ...state, areaDialog: null };
}

function closeTableDialog(state: FloorPlanState): FloorPlanState {
  return { ...state, tableDialog: null, dialogDraft: undefined };
}

function closeAllFloorPlanDialogs(state: FloorPlanState): FloorPlanState {
  return closeAreaDialog(closeTableDialog(state));
}

const TABLE_NAME_PRESETS = [
  "A1",
  "A2",
  "A3",
  "A4",
  "B1",
  "B2",
  "B3",
  "C1",
  "C2",
  "VIP1",
  "VIP2",
  "吧台1",
  "包间1",
];

const SEATS_PRESETS = [1, 2, 4, 6, 8, 10, 12, 14];
const SIZE_PRESETS = [48, 60, 64, 80, 100, 120, 140];
const ROTATION_PRESETS = [0, 45, 90, 135, 180, 270];

const SHAPE_OPTIONS: { value: FloorPlanTableShape; label: string }[] = [
  { value: "rectangle", label: "Rectangle / 矩形" },
  { value: "circle", label: "Circle / 圆形" },
  { value: "oval", label: "Hibachi / 长桌" },
  { value: "bar", label: "Bar / 吧台" },
  { value: "ktv", label: "KTV / 卡拉 OK" },
];

const CATEGORY_OPTIONS: { value: FloorPlanTableCategory; label: string }[] = [
  { value: "standard", label: "标准桌" },
  { value: "booth", label: "卡座" },
  { value: "bar", label: "吧台" },
  { value: "private", label: "包间" },
  { value: "ktv", label: "KTV" },
];

const FIELD_INPUT_CLASS =
  "min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm";
const FIELD_SELECT_CLASS =
  "w-[5.75rem] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm text-muted-foreground";
const FIELD_PRESET_TRIGGER_CLASS =
  "w-[5.75rem] shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm text-muted-foreground hover:bg-muted";

/** 高于编辑弹框 overlay (10050)，避免下拉被裁切 */
const FLOOR_PLAN_PRESET_MENU_Z = 10060;

function shapeLabel(shape: FloorPlanTableShape): string {
  return SHAPE_OPTIONS.find((o) => o.value === shape)?.label ?? shape;
}

function categoryLabel(cat: FloorPlanTableCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;
}

function isFloorPlanTableShape(v: string): v is FloorPlanTableShape {
  return v === "rectangle" || v === "circle" || v === "oval" || v === "bar" || v === "ktv";
}

function isFloorPlanTableCategory(v: string): v is FloorPlanTableCategory {
  return v === "standard" || v === "booth" || v === "bar" || v === "private" || v === "ktv";
}

function shapeFromLabel(text: string): FloorPlanTableShape | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("rect") || t.includes("矩")) return "rectangle";
  if (t.includes("circle") || t.includes("圆")) return "circle";
  if (t.includes("oval") || t.includes("椭")) return "oval";
  if (t.includes("hibachi") || t.includes("铁板")) return "oval";
  if (t.includes("ktv") || t.includes("卡拉")) return "ktv";
  if (t.includes("bar") || t.includes("吧台")) return "bar";
  return isFloorPlanTableShape(t) ? t : null;
}

/** KTV 桌位 + 存在启用且商品有效的规则时展示绑定下拉 */
export function canShowDurationBillingRuleField(category: FloorPlanTableCategory): boolean {
  if (category !== "ktv") return false;
  return listEnabledDurationBillingRules(resolveFloorPlanStoreId()).length > 0;
}

function isKposTableDeletable(table: Pick<FloorPlanTable, "status" | "currentGuestCount">): boolean {
  const status = (table.status ?? "").trim().toUpperCase();
  return (!status || status === "AVAILABLE" || status === "EMPTY") && (table.currentGuestCount ?? 0) === 0;
}

const liveStateByStore = new Map<string, FloorPlanState>();
const liveLoadByStore = new Map<string, Promise<void>>();
const liveErrorByStore = new Map<string, string>();
const selectedTableIdsByStore = new Map<string, string[]>();
const multiSelectByStore = new Map<string, boolean>();

function isKposLiveMode(): boolean {
  return readKposFloorPlanConnection() !== null;
}

function fromKposMeasure(value: number, canvasSize: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return value >= 0 && value <= 1 ? Math.round(value * canvasSize) : Math.round(value);
}

function mapKposAreas(areas: KposFloorPlanArea[], previous?: FloorPlanState): FloorPlanState {
  const previousTables = new Map(
    previous?.areas.flatMap((area) => area.tables.map((table) => [table.id, table] as const)) ?? [],
  );
  const mapped: FloorPlanArea[] = areas.map((area) => {
    const previousArea = previous?.areas.find((item) => item.id === area.id);
    return {
    id: area.id,
    name: area.name,
    tables: area.tables.map((table) => {
      const shape = table.shape.toUpperCase();
      const mappedGeometry = {
        width: fromKposMeasure(table.width, KPOS_CANVAS_WIDTH, 80),
        height: fromKposMeasure(table.height, KPOS_CANVAS_HEIGHT, 60),
        x: fromKposMeasure(table.x, KPOS_CANVAS_WIDTH, 0),
        y: fromKposMeasure(table.y, KPOS_CANVAS_HEIGHT, 0),
      };
      const signatureMatches = previousArea?.tables.filter((candidate) =>
        candidate.id.startsWith("t-") && candidate.name.trim() === table.name.trim() && candidate.seats === table.seats &&
        candidate.kposShape === shape &&
        candidate.x === mappedGeometry.x && candidate.y === mappedGeometry.y && candidate.width === mappedGeometry.width && candidate.height === mappedGeometry.height,
      ) ?? [];
      const prior = previousTables.get(table.id) ?? (signatureMatches.length === 1 ? signatureMatches[0] : undefined);
      return {
        id: table.id,
        name: table.name,
        seats: table.seats,
        ...mappedGeometry,
        rotation: prior?.rotation ?? 0,
        shape: shape === "ROUND" ? "circle" : shape === "HIBACHI" ? "oval" : shape === "BAR" ? "bar" : shape === "KTV" ? "ktv" : "rectangle",
        kposShape: shape,
        tableCategoryId: table.tableCategoryId,
        hibachiTableShape: table.hibachiTableShape,
        seatingOrientation: table.seatingOrientation,
        defaultSaleItemId: table.defaultSaleItemId,
        category: prior?.category ?? "standard",
        durationBillingRuleId: null,
        status: table.status,
        currentGuestCount: table.currentGuestCount,
      };
    }),
  }});
  const activeAreaId =
    previous?.activeAreaId && mapped.some((area) => area.id === previous.activeAreaId)
      ? previous.activeAreaId
      : mapped[0]?.id ?? "";
  return { ...defaultState(), areas: mapped, activeAreaId };
}

function toKposArea(area: FloorPlanArea): KposFloorPlanArea {
  const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
  return {
    id: area.id.startsWith("area-") ? "" : area.id,
    name: area.name,
    tables: area.tables.map((table) => ({
      id: table.id.startsWith("t-") ? "" : table.id,
      name: table.name,
      seats: table.seats,
      width: round6(table.width / KPOS_CANVAS_WIDTH),
      height: round6(table.height / KPOS_CANVAS_HEIGHT),
      x: round6(table.x / KPOS_CANVAS_WIDTH),
      y: round6(table.y / KPOS_CANVAS_HEIGHT),
      shape: table.kposShape || (table.shape === "circle" ? "ROUND" : table.shape === "oval" ? "HIBACHI" : table.shape === "bar" ? "BAR" : table.shape === "ktv" ? "KTV" : "RECTANGLE"),
      tableCategoryId: table.tableCategoryId,
      hibachiTableShape: table.hibachiTableShape,
      seatingOrientation: table.seatingOrientation,
      defaultSaleItemId: table.defaultSaleItemId,
    })),
  };
}

function resolveTableDurationBillingRuleLabel(table: FloorPlanTable): string | null {
  const ruleId = table.durationBillingRuleId;
  if (!ruleId) return null;
  const rule = getDurationBillingRule(resolveFloorPlanStoreId(), ruleId);
  return rule?.name ?? ruleId;
}

function renderDurationBillingRuleField(table: FloorPlanTable): string {
  const storeId = resolveFloorPlanStoreId();
  const rules = listEnabledDurationBillingRules(storeId);
  const current = table.durationBillingRuleId ?? "";
  const options = [
    `<option value=""${!current ? " selected" : ""}>不绑定</option>`,
    ...rules.map(
      (r) =>
        `<option value="${escapeHtml(r.id)}"${r.id === current ? " selected" : ""}>${escapeHtml(r.name)}（${escapeHtml(formatRulePricingSummary(r))}）</option>`,
    ),
  ].join("");
  return `
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">按时计价规则</span>
      <select data-floor-plan-field="durationBillingRuleId" class="${FIELD_SELECT_CLASS} w-full">
        ${options}
      </select>
      <p class="text-xs text-muted-foreground">仅 KTV 桌位可绑定；切换为其他类型会清除绑定</p>
    </label>`;
}

function categoryFromLabel(text: string): FloorPlanTableCategory | null {
  const t = text.trim();
  if (!t) return null;
  const hit = CATEGORY_OPTIONS.find((o) => o.label === t || o.value === t);
  if (hit) return hit.value;
  if (t.toUpperCase().includes("KTV") || t.includes("卡拉")) return "ktv";
  if (t.includes("卡座")) return "booth";
  if (t.includes("吧台")) return "bar";
  if (t.includes("包间")) return "private";
  if (t.includes("标准")) return "standard";
  return isFloorPlanTableCategory(t) ? t : null;
}

function collectNameSuggestions(state: FloorPlanState): string[] {
  const set = new Set<string>(TABLE_NAME_PRESETS);
  for (const area of state.areas) {
    for (const table of area.tables) {
      if (table.name.trim()) set.add(table.name.trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "zh"));
}

function buildNumberSelectOptions(current: number, presets: readonly number[]): string {
  const values = [...new Set([...presets, current])].sort((a, b) => a - b);
  const opts = values
    .map((n) => `<option value="${n}"${n === current ? " selected" : ""}>${n}</option>`)
    .join("");
  return `<option value="">选择</option>${opts}`;
}

function buildTextSelectOptions(current: string, suggestions: string[]): string {
  const values = [...new Set([...suggestions, current].filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh"),
  );
  const opts = values
    .map((s) => `<option value="${escapeHtml(s)}"${s === current ? " selected" : ""}>${escapeHtml(s)}</option>`)
    .join("");
  const selectedInList = values.includes(current);
  const customOpt =
    current && !selectedInList
      ? `<option value="${escapeHtml(current)}" selected>${escapeHtml(current)}</option>`
      : "";
  return `<option value="">选择</option>${customOpt}${opts}`;
}

function renderEnumComboField(
  label: string,
  field: "shape" | "category",
  displayValue: string,
  datalistId: string,
  datalistOptions: string,
): string {
  return `
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">${escapeHtml(label)}</span>
      <div class="flex gap-2">
        <input
          data-floor-plan-field="${field}"
          type="text"
          class="${FIELD_INPUT_CLASS}"
          value="${escapeHtml(displayValue)}"
          list="${datalistId}"
          autocomplete="off"
          placeholder="可输入或点击选择"
        />
        <datalist id="${datalistId}">${datalistOptions}</datalist>
        <button
          type="button"
          class="${FIELD_PRESET_TRIGGER_CLASS}"
          data-floor-plan-preset-trigger="${field}"
          aria-haspopup="listbox"
          aria-expanded="false"
          title="快捷选择"
        >选择</button>
      </div>
    </label>`;
}

function renderComboNumberField(
  label: string,
  field: string,
  value: number,
  presets: readonly number[],
  disabled: boolean,
  inputAttrs = "",
): string {
  const dis = disabled ? "disabled" : "";
  return `
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">${escapeHtml(label)}</span>
      <div class="flex gap-2">
        <input
          data-floor-plan-field="${field}"
          type="number"
          class="${FIELD_INPUT_CLASS}"
          value="${value}"
          ${inputAttrs}
          ${dis}
        />
        <select data-floor-plan-preset="${field}" class="${FIELD_SELECT_CLASS}" title="快捷选择" ${dis}>
          ${buildNumberSelectOptions(value, presets)}
        </select>
      </div>
    </label>`;
}

function renderComboTextField(
  label: string,
  field: string,
  value: string,
  suggestions: string[],
  disabled: boolean,
  inputAttrs = "",
): string {
  const dis = disabled ? "disabled" : "";
  const listId = `floor-plan-${field}-datalist`;
  const datalist = suggestions
    .map((s) => `<option value="${escapeHtml(s)}"></option>`)
    .join("");
  return `
    <label class="block space-y-1">
      <span class="text-xs text-muted-foreground">${escapeHtml(label)}</span>
      <div class="flex gap-2">
        <input
          data-floor-plan-field="${field}"
          type="text"
          class="${FIELD_INPUT_CLASS}"
          value="${escapeHtml(value)}"
          list="${listId}"
          autocomplete="off"
          ${inputAttrs}
          ${dis}
        />
        <datalist id="${listId}">${datalist}</datalist>
        <select data-floor-plan-preset="${field}" class="${FIELD_SELECT_CLASS} max-w-[7.5rem]" title="快捷选择" ${dis}>
          ${buildTextSelectOptions(value, suggestions)}
        </select>
      </div>
    </label>`;
}

function renderTableOnCanvas(table: FloorPlanTable, selected: boolean, base: boolean): string {
  const selectedCls = selected
    ? "z-20 border-primary bg-primary/20 ring-2 ring-primary shadow-md"
    : "z-10 border-border bg-card/90 hover:border-primary/60 hover:shadow";
  const radius =
    table.shape === "circle" ? "rounded-full" : table.shape === "oval" ? "rounded-[999px]" : "rounded-md";
  const ruleLabel = resolveTableDurationBillingRuleLabel(table);
  const durationCls = ruleLabel ? " floor-plan-table--duration-billing" : "";
  const runtimeLabel = table.status ? ` · ${table.status} · 当前 ${table.currentGuestCount ?? 0} 人` : "";
  const titleBase = `${table.name} · ${table.seats}人${runtimeLabel}`;
  const title = ruleLabel ? `${titleBase} · 计时：${ruleLabel}` : titleBase;
  const badge = ruleLabel
    ? `<span class="pointer-events-none absolute -right-0.5 -top-0.5 rounded bg-primary px-1 py-0 text-[9px] leading-tight text-primary-foreground" aria-hidden="true">计时</span>`
    : "";
  const baseBadge = base
    ? `<span class="pointer-events-none absolute -left-1 -top-1 grid size-4 place-items-center rounded-full bg-foreground text-[9px] font-bold text-background" title="对齐基准">1</span>`
    : "";
  const occupiedBadge = table.status && table.status.toUpperCase() !== "AVAILABLE"
    ? `<span class="pointer-events-none absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">${table.currentGuestCount ?? 0}</span>`
    : "";
  const draftBadge = isKposLiveMode() && table.id.startsWith("t-")
    ? `<span class="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-sky-700 px-1.5 py-0.5 text-[9px] text-white">未同步 KPOS</span>`
    : "";
  return `<button
    type="button"
    class="floor-plan-table absolute relative flex items-center justify-center border text-xs font-medium shadow-sm transition-[box-shadow,background-color,border-color] ${selectedCls}${durationCls} ${radius}"
    data-floor-plan-table-id="${escapeHtml(table.id)}"
    data-floor-plan-selected="${selected ? "true" : "false"}"
    aria-pressed="${selected ? "true" : "false"}"
    style="left:${table.x}px;top:${table.y}px;width:${table.width}px;height:${table.height}px;transform:rotate(${table.rotation}deg)"
    title="${escapeHtml(title)}"
  >${escapeHtml(table.name)}${badge}${baseBadge}${occupiedBadge}${draftBadge}</button>`;
}

function renderDraftTablePreview(table: FloorPlanTable): string {
  const radius = table.shape === "circle" ? "rounded-full" : table.shape === "oval" ? "rounded-[999px]" : "rounded-md";
  return `<button type="button" class="absolute z-30 flex items-center justify-center border-2 border-dashed border-emerald-600 bg-emerald-100/80 text-xs font-semibold text-emerald-800 shadow-lg ${radius}" data-floor-plan-draft-preview style="left:${table.x}px;top:${table.y}px;width:${table.width}px;height:${table.height}px;transform:rotate(${table.rotation}deg)" title="新增桌台预览，可拖动调整位置"><span data-floor-plan-draft-label>${escapeHtml(table.name)}</span><span class="absolute -top-5 rounded bg-emerald-700 px-1.5 py-0.5 text-[9px] text-white">预览</span></button>`;
}

function getSelectedTableIds(storeId: string, state: FloorPlanState): string[] {
  const area = getActiveArea(state);
  if (!area) return [];
  const valid = (selectedTableIdsByStore.get(storeId) ?? []).filter((id) =>
    area.tables.some((table) => table.id === id),
  );
  if (valid.length) return valid;
  return state.selectedTableId && area.tables.some((table) => table.id === state.selectedTableId)
    ? [state.selectedTableId]
    : [];
}

function renderFloorPlanBulkToolbar(storeId: string, state: FloorPlanState): string {
  const selected = getSelectedTableIds(storeId, state);
  const multi = multiSelectByStore.get(storeId) === true;
  const button = (action: FloorPlanGeometryAction, label: string) =>
    `<button type="button" data-floor-plan-geometry-action="${action}" class="rounded-md px-2 py-1.5 text-xs hover:bg-muted disabled:opacity-40" ${selected.length < requiredFloorPlanSelectionCount(action) ? "disabled" : ""}>${label}</button>`;
  const group = (label: string, content: string) =>
    `<details class="relative"><summary class="cursor-pointer list-none rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted">${label} ▾</summary><div class="absolute left-0 top-full z-40 mt-1 flex min-w-max gap-1 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">${content}</div></details>`;
  return `<div class="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-sm" data-floor-plan-bulk-toolbar>
    <button type="button" data-floor-plan-multi-toggle class="rounded-lg border px-3 py-2 text-xs font-semibold ${multi ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}">${multi ? "退出多选" : "多选"}</button>
    <button type="button" data-floor-plan-select-all class="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted disabled:opacity-40" ${multi ? "" : "disabled"}>全选</button>
    <button type="button" data-floor-plan-select-none class="rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted disabled:opacity-40" ${selected.length ? "" : "disabled"}>取消选择</button>
    ${group("对齐", button("align-left", "左") + button("align-center-x", "水平居中") + button("align-right", "右") + button("align-top", "上") + button("align-center-y", "垂直居中") + button("align-bottom", "下"))}
    ${group("分布", button("distribute-x", "水平等距") + button("distribute-y", "垂直等距"))}
    ${group("统一尺寸", button("equal-width", "统一宽度") + button("equal-height", "统一高度"))}
    ${group("缩放", button("wider", "增宽") + button("narrower", "减宽") + button("taller", "增高") + button("shorter", "减高"))}
    ${group("微调", button("move-left", "←") + button("move-right", "→") + button("move-up", "↑") + button("move-down", "↓"))}
    <span class="ml-auto px-2 text-xs text-muted-foreground">已选 ${selected.length} 张${selected.length ? " · 1 为基准" : ""}</span>
  </div>`;
}

function renderFormFields(table: FloorPlanTable, state: FloorPlanState): string {
  const name = table.name;
  const seats = table.seats;
  const width = table.width;
  const height = table.height;
  const rotation = table.rotation;
  const shape = table.shape;
  const category = table.category;
  const createAreaId = state.tableDialog?.mode === "create" ? state.tableDialog.areaId : null;
  const storeId = resolveFloorPlanStoreId();
  const optionSelect = (label: string, field: string, current: string | undefined, options: KposNamedOption[]) => {
    const known = options.some((option) => option.id === current);
    const rows = [
      `<option value="">请选择</option>`,
      current && !known ? `<option value="${escapeHtml(current)}" selected>未知值（${escapeHtml(current)}）</option>` : "",
      ...options.map((option) => `<option value="${escapeHtml(option.id)}"${option.id === current ? " selected" : ""}>${escapeHtml(option.name)}</option>`),
    ].join("");
    return `<label class="block space-y-1"><span class="text-xs text-muted-foreground">${label}</span><select data-floor-plan-field="${field}" class="${FIELD_INPUT_CLASS} w-full">${rows}</select></label>`;
  };
  const simpleSelect = (label: string, field: string, current: string | undefined, options: Array<[string, string]>) => optionSelect(label, field, current, options.map(([id, name]) => ({ id, name })));

  return `
    <fieldset class="${state.tableDialog?.mode === "create" ? "space-y-2" : "space-y-3"}" data-floor-plan-form>
      ${createAreaId ? `<label class="block space-y-1"><span class="text-xs text-muted-foreground">目标区域</span><select data-floor-plan-create-area class="${FIELD_SELECT_CLASS} w-full">${state.areas.map((area) => `<option value="${escapeHtml(area.id)}"${area.id === createAreaId ? " selected" : ""}>${escapeHtml(area.name)}</option>`).join("")}</select></label>` : ""}
      <p class="text-xs font-medium text-muted-foreground">KPOS 桌台信息</p>
      <label class="block space-y-1"><span class="text-xs text-muted-foreground">名称</span><input data-floor-plan-field="name" type="text" class="${FIELD_INPUT_CLASS} w-full" value="${escapeHtml(name)}" placeholder="如 A1、包间1" autocomplete="off" /></label>
      <label class="block space-y-1"><span class="text-xs text-muted-foreground">人数</span><input data-floor-plan-field="seats" type="number" min="1" step="1" class="${FIELD_INPUT_CLASS} w-full" value="${seats}" /></label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block space-y-1"><span class="text-xs text-muted-foreground">宽（%）</span><input data-floor-plan-field="widthPercent" type="number" min="0.00001" max="100" step="0.00001" class="${FIELD_INPUT_CLASS} w-full" value="${Math.round(width / KPOS_CANVAS_WIDTH * 10_000_000) / 100_000}" /></label>
        <label class="block space-y-1"><span class="text-xs text-muted-foreground">高（%）</span><input data-floor-plan-field="heightPercent" type="number" min="0.00001" max="100" step="0.00001" class="${FIELD_INPUT_CLASS} w-full" value="${Math.round(height / KPOS_CANVAS_HEIGHT * 10_000_000) / 100_000}" /></label>
      </div>
      <label class="block space-y-1"><span class="text-xs text-muted-foreground">类型</span><select data-floor-plan-field="shape" class="${FIELD_INPUT_CLASS} w-full">${SHAPE_OPTIONS.map((option) => `<option value="${option.value}"${option.value === shape ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></label>
      ${optionSelect("桌子类别", "tableCategoryId", table.tableCategoryId ?? "1", resolveKposTableCategoryOptions(storeId))}
      <div data-kpos-condition="HIBACHI" class="grid grid-cols-2 gap-3${table.kposShape === "HIBACHI" ? "" : " hidden"}">${simpleSelect("铁板桌类型", "hibachiTableShape", table.hibachiTableShape, [["0", "Default (3-4-3)"], ["1", "2-4-2"], ["2", "4-4-4"]])}${simpleSelect("座位排布", "seatingOrientation", table.seatingOrientation, [["0", "Left"], ["1", "Right"]])}</div>
      <div data-kpos-condition="KTV" class="${table.kposShape === "KTV" ? "" : "hidden"}">${optionSelect("【KTV/卡拉OK】房间", "defaultSaleItemId", table.defaultSaleItemId, kposKtvItemsByStore.get(storeId) ?? [])}</div>
      <details class="rounded-lg border border-border p-3">
        <summary class="cursor-pointer text-sm font-medium">商家扩展（不写入 KPOS）</summary>
        <div class="mt-3 space-y-3">
          ${renderComboNumberField("旋转(度)", "rotation", rotation, ROTATION_PRESETS, false, 'step="1"')}
          ${renderEnumComboField("桌位分类", "category", categoryLabel(category), "floor-plan-category-datalist", CATEGORY_OPTIONS.map((o) => `<option value="${escapeHtml(o.label)}"></option>`).join(""))}
        </div>
      </details>
    </fieldset>`;
}

function renderAreaEditorDialog(state: FloorPlanState): string {
  if (!state.areaDialog) return "";
  const dialog = state.areaDialog;
  const isCreate = dialog.mode === "create";
  const area =
    dialog.mode === "edit" ? state.areas.find((a) => a.id === dialog.areaId) : null;
  const title = isCreate ? "新增区域" : `编辑区域 · ${area?.name ?? ""}`;
  const nameValue = isCreate ? "" : (area?.name ?? "");
  const storeLabel = resolveFloorPlanStoreLabel(resolveFloorPlanStoreId());

  return `
    <div
      class="fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto p-4"
      data-floor-plan-area-dialog-overlay
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        data-floor-plan-area-dialog-close
        aria-label="关闭"
      ></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="floor-plan-area-dialog-title"
        class="relative z-10 my-auto w-full max-w-md overflow-visible rounded-xl border border-border bg-card shadow-xl"
        data-floor-plan-area-dialog
      >
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="floor-plan-area-dialog-title" class="text-base font-semibold text-foreground">${escapeHtml(title)}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            data-floor-plan-area-dialog-close
            aria-label="关闭"
          >×</button>
        </header>
        <div class="space-y-4 px-5 py-4">
          <div class="block space-y-1">
            <span class="text-xs text-muted-foreground">归属门店</span>
            <p
              class="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground"
              data-floor-plan-area-store
            >${escapeHtml(storeLabel)}</p>
          </div>
          <label class="block space-y-1">
            <span class="text-xs text-muted-foreground">区域名称</span>
            <input
              data-floor-plan-area-name
              type="text"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value="${escapeHtml(nameValue)}"
              placeholder="如 Floor 1、大厅、KTV"
              autocomplete="off"
            />
          </label>
        </div>
        <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div class="shrink-0">
            ${
              isCreate
                ? ""
                : `<button
              type="button"
              class="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
              data-floor-plan-area-dialog-delete
            >删除区域</button>`
            }
          </div>
          <div class="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              data-floor-plan-area-dialog-cancel
            >取消</button>
            <button
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              data-floor-plan-area-dialog-save
            >保存</button>
          </div>
        </footer>
      </div>
    </div>`;
}

function openCreateAreaDialog(state: FloorPlanState): FloorPlanState {
  return {
    ...closeTableDialog(state),
    selectedTableId: null,
    areaDialog: { mode: "create" },
  };
}

function openEditAreaDialog(state: FloorPlanState, areaId: string): FloorPlanState {
  return {
    ...closeTableDialog(state),
    selectedTableId: null,
    areaDialog: { mode: "edit", areaId },
  };
}

function readAreaNameFromDialog(): string {
  const input = document.querySelector<HTMLInputElement>("[data-floor-plan-area-name]");
  return input?.value.trim() ?? "";
}

function renderStoreOwnershipHint(): string {
  const storeLabel = resolveFloorPlanStoreLabel(resolveFloorPlanStoreId());
  return `<p class="text-xs text-muted-foreground" title="新增区域与桌子将归属此门店">归属门店：<span class="font-medium text-foreground">${escapeHtml(storeLabel)}</span></p>`;
}

function renderSidebarPanel(state: FloorPlanState, active: FloorPlanArea | null): string {
  if (!state.areas.length) {
    return `
      <div class="space-y-3">
        ${renderStoreOwnershipHint()}
        <div class="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
          <p class="text-sm text-muted-foreground">请先创建就餐区域，再布置桌位（将归属当前所选门店）</p>
          <button
            type="button"
            class="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            data-floor-plan-area-add
          >新增区域</button>
        </div>
      </div>`;
  }

  const selected = getSelectedTable(state);
  const tableList =
    !active || active.tables.length === 0
      ? `<p class="text-sm text-muted-foreground">当前区域暂无桌位</p>`
      : `<ul class="max-h-48 space-y-1 overflow-y-auto" role="list">
          ${active.tables
            .map((t) => {
              const on = t.id === state.selectedTableId;
              const ruleLabel = resolveTableDurationBillingRuleLabel(t);
              const timingTag = ruleLabel
                ? `<span class="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary" title="计时：${escapeHtml(ruleLabel)}">计时</span>`
                : "";
              return `<li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    on
                      ? "border-primary bg-primary/10 font-medium text-foreground"
                      : "border-border hover:bg-muted"
                  }"
                  data-floor-plan-table-pick="${escapeHtml(t.id)}"
                >
                  <span class="flex min-w-0 items-center gap-1"><span class="truncate">${escapeHtml(t.name)}</span>${timingTag}</span>
                  <span class="shrink-0 text-xs text-muted-foreground">${t.seats}人</span>
                </button>
              </li>`;
            })
            .join("")}
        </ul>`;

  const areaTabs = state.areas
    .map((area) => {
      const activeCls =
        area.id === state.activeAreaId
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/80";
      return `<button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium ${activeCls}" data-floor-plan-area-id="${escapeHtml(area.id)}">${escapeHtml(area.name)}</button>`;
    })
    .join("");

  return `
    <div class="space-y-4">
      ${renderStoreOwnershipHint()}
      <div class="space-y-2">
        <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">当前区域</h3>
        <div class="flex flex-wrap gap-2" role="tablist" aria-label="区域">${areaTabs}</div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted" data-floor-plan-area-edit>编辑区域</button>
          <button type="button" class="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10" data-floor-plan-area-delete>删除区域</button>
          <button type="button" class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted" data-floor-plan-area-add>新增区域</button>
        </div>
      </div>
      <div class="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
        <p class="text-sm text-muted-foreground">在画布点击桌位可编辑；为「${escapeHtml(active?.name ?? "")}」新增桌位</p>
        <button
          type="button"
          class="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-floor-plan-table-add
        >新增桌子</button>
      </div>
      ${
        selected
          ? `<p class="text-xs text-muted-foreground">已选中：<span class="font-medium text-foreground">${escapeHtml(selected.name)}</span>（点击画布或列表可编辑）</p>`
          : ""
      }
      <div class="space-y-2">
        <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">本区域桌位 (${active?.tables.length ?? 0})</h3>
        ${tableList}
      </div>
    </div>`;
}

function renderTableEditorDialog(state: FloorPlanState): string {
  if (!state.tableDialog) return "";
  const table = getDialogTable(state);
  if (!table) return "";

  const isCreate = state.tableDialog.mode === "create";
  const title = isCreate ? "新增桌子" : `编辑桌子 · ${table.name}`;

  const drawer = isCreate;
  const warning = isCreate && state.tableDialog?.mode === "create" && state.tableDialog.vacancyWarning
    ? `<div class="mx-5 mt-4 rounded-lg border border-amber-400/50 bg-amber-50 px-3 py-2 text-xs text-amber-800">当前区域空间不足，预览桌台可能与其他桌台重叠；创建时需要再次确认。</div>`
    : "";
  return `
    <div
      class="fixed inset-0 z-[10050] flex ${drawer ? "pointer-events-none items-stretch justify-end" : "items-center justify-center overflow-y-auto p-4"}"
      data-floor-plan-dialog-overlay
      role="presentation"
    >
      ${drawer ? "" : `<button
        type="button"
        class="absolute inset-0 bg-black/50"
        data-floor-plan-dialog-close
        aria-label="关闭"
      ></button>`}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="floor-plan-dialog-title"
        class="relative z-10 flex w-full flex-col ${drawer ? "pointer-events-auto h-dvh max-h-dvh max-w-[420px] overflow-hidden border-l" : "my-auto max-w-xl overflow-visible rounded-xl border"} border-border bg-card shadow-xl"
        data-floor-plan-dialog
      >
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="floor-plan-dialog-title" class="text-base font-semibold text-foreground">${escapeHtml(title)}</h2>
          <button
            type="button"
            class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            data-floor-plan-dialog-close
            aria-label="关闭"
          >×</button>
        </header>
        ${warning}
        <div class="${drawer ? "min-h-0 flex-1 overflow-hidden px-5 py-3" : "overflow-visible px-5 py-4"}">
          ${renderFormFields(table, state)}
        </div>
        <footer class="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div class="shrink-0">
            ${
              isCreate
                ? ""
                : `<button
              type="button"
              class="rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
              data-floor-plan-dialog-delete
            >删除</button>`
            }
          </div>
          <div class="flex shrink-0 items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              data-floor-plan-dialog-cancel
            >取消</button>
            <button
              type="button"
              class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              data-floor-plan-dialog-save
            >${isCreate ? "创建桌子" : "保存"}</button>
          </div>
        </footer>
      </div>
    </div>`;
}

function openCreateTableDialog(state: FloorPlanState): FloorPlanState {
  const area = getActiveArea(state);
  if (!area) return state;
  const draft = createDraftTable(area);
  return {
    ...closeAreaDialog(closeTableDialog(state)),
    selectedTableId: null,
    tableDialog: { mode: "create", areaId: area.id, vacancyWarning: findTableVacancy(area.tables, draft.width, draft.height, KPOS_CANVAS_WIDTH, KPOS_CANVAS_HEIGHT).overlaps },
    dialogDraft: draft,
  };
}

function openEditTableDialog(state: FloorPlanState, tableId: string): FloorPlanState {
  return {
    ...state,
    selectedTableId: tableId,
    tableDialog: { mode: "edit", tableId },
    dialogDraft: undefined,
  };
}

export function renderFloorPlanPage(): string {
  ensureFloorPlanPageSaveRegistry();
  const storeId = resolveFloorPlanStoreId();
  ensureLiveFloorPlanLoaded(storeId);
  const state = readState();
  ensureFloorPlanBaseline(storeId, state.areas);
  const active = getActiveArea(state);
  const hasAreas = state.areas.length > 0;
  const selectedIds = getSelectedTableIds(storeId, state);

  let tablesHtml =
    active?.tables
      .map((t) => renderTableOnCanvas(t, selectedIds.includes(t.id), selectedIds[0] === t.id))
      .join("") ?? "";
  if (state.tableDialog?.mode === "create" && state.tableDialog.areaId === active?.id && state.dialogDraft) {
    tablesHtml += renderDraftTablePreview(state.dialogDraft);
  }

  const storeLabel = resolveFloorPlanStoreLabel(resolveFloorPlanStoreId());
  const canvasEmpty = !hasAreas
    ? `<p class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">${isKposLiveMode() && liveLoadByStore.has(storeId) ? "正在从 KPOS 读取真实桌台…" : `请先点击右侧「新增区域」创建楼层或分区（归属「${escapeHtml(storeLabel)}」）`}</p>`
    : !tablesHtml
      ? `<p class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">当前区域暂无桌位，请点击右侧「新增桌子」</p>`
      : "";

  const liveNotice = isKposLiveMode()
    ? `<div class="mb-4 rounded-lg border px-4 py-3 text-sm ${liveErrorByStore.has(storeId) ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}">${liveErrorByStore.has(storeId) ? `KPOS 同步失败：${escapeHtml(liveErrorByStore.get(storeId) ?? "未知错误")}` : `已连接真实 KPOS · ${escapeHtml(readKposFloorPlanConnection()?.licenseName ?? "PC")}`}</div>`
    : "";

  return `${liveNotice}
    <div class="floor-plan-editor flex min-h-[min(72vh,640px)] flex-col gap-4 lg:flex-row" data-floor-plan-root>
      <div class="flex min-w-0 flex-1 flex-col gap-3">
        ${renderFloorPlanBulkToolbar(storeId, state)}
        <div
          class="floor-plan-canvas relative min-h-[420px] flex-1 overflow-hidden rounded-xl border border-border bg-sky-100/70 dark:bg-sky-950/40"
          data-floor-plan-canvas
          role="application"
          aria-label="餐位平面图画布"
          data-floor-plan-has-areas="${hasAreas ? "true" : "false"}"
        >
          ${tablesHtml}
          ${canvasEmpty}
        </div>
        <button
          type="button"
          class="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          data-floor-plan-save-area
          ${hasAreas ? "" : "disabled"}
        >保存区域图</button>
      </div>
      <aside class="w-full shrink-0 space-y-4 rounded-xl border border-border bg-card p-4 lg:w-80">
        ${renderSidebarPanel(state, active)}
        <p class="text-xs text-muted-foreground">拖拽画布上的桌子可调整位置 · seq 428</p>
      </aside>
      ${renderAreaEditorDialog(state)}
      ${renderTableEditorDialog(state)}
    </div>`;
}

function remountFloorPlan(): void {
  closeFloorPlanPresetMenu();
  window.dispatchEvent(new CustomEvent("menusifu:floor-plan-remount"));
}

const TABLE_SELECTED_CLASS =
  "z-20 border-primary bg-primary/20 ring-2 ring-primary shadow-md";
const TABLE_IDLE_CLASS =
  "z-10 border-border bg-card/90 hover:border-primary/60 hover:shadow";

function applyCanvasTableHighlight(root: Element, selectedTableId: string | null): void {
  root.querySelectorAll<HTMLElement>("[data-floor-plan-table-id]").forEach((el) => {
    const on = el.getAttribute("data-floor-plan-table-id") === selectedTableId;
    el.dataset.floorPlanSelected = on ? "true" : "false";
    el.setAttribute("aria-pressed", on ? "true" : "false");
    el.classList.remove(...TABLE_SELECTED_CLASS.split(" "), ...TABLE_IDLE_CLASS.split(" "));
    el.classList.add(...(on ? TABLE_SELECTED_CLASS : TABLE_IDLE_CLASS).split(" "));
  });
}

function readFormTable(base: FloorPlanTable): FloorPlanTable {
  const dialog = document.querySelector("[data-floor-plan-dialog]");
  const getInput = (field: string) =>
    (dialog?.querySelector(`[data-floor-plan-field="${field}"]`) as HTMLInputElement | null)?.value ?? "";
  const shape = shapeFromLabel(getInput("shape")) ?? base.shape;
  const kposShape: KposTableShape = shape === "circle" ? "ROUND" : shape === "oval" ? "HIBACHI" : shape === "bar" ? "BAR" : shape === "ktv" ? "KTV" : "RECTANGLE";
  const category = categoryFromLabel(getInput("category")) ?? base.category;
  const durationBillingRuleId: string | null = null;
  const numericField = (field: string, fallback: number) => {
    const value = Number(getInput(field));
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    ...base,
    name: getInput("name").trim().toUpperCase(),
    seats: numericField("seats", base.seats),
    width: numericField("widthPercent", base.width / KPOS_CANVAS_WIDTH * 100) / 100 * KPOS_CANVAS_WIDTH,
    height: numericField("heightPercent", base.height / KPOS_CANVAS_HEIGHT * 100) / 100 * KPOS_CANVAS_HEIGHT,
    rotation: numericField("rotation", 0),
    shape,
    kposShape,
    tableCategoryId: getInput("tableCategoryId").trim() || base.tableCategoryId,
    hibachiTableShape: getInput("hibachiTableShape").trim() || base.hibachiTableShape,
    seatingOrientation: getInput("seatingOrientation").trim() || base.seatingOrientation,
    defaultSaleItemId: kposShape === "KTV" ? (getInput("defaultSaleItemId").trim() || undefined) : undefined,
    category,
    durationBillingRuleId,
  };
}

let activeFloorPlanPresetMenu: HTMLElement | null = null;
let activeFloorPlanPresetTrigger: HTMLElement | null = null;
let floorPlanPresetMenuListenersBound = false;

export function closeFloorPlanPresetMenu(): void {
  activeFloorPlanPresetMenu?.remove();
  activeFloorPlanPresetMenu = null;
  activeFloorPlanPresetTrigger?.setAttribute("aria-expanded", "false");
  activeFloorPlanPresetTrigger = null;
}

function positionFloorPlanPresetMenu(menu: HTMLElement, trigger: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const menuW = menu.offsetWidth;
  const menuH = menu.offsetHeight;
  const pad = 8;

  let left = rect.right - menuW;
  let top = rect.bottom + gap;
  if (left < pad) left = pad;
  if (left + menuW > window.innerWidth - pad) left = window.innerWidth - menuW - pad;
  if (top + menuH > window.innerHeight - pad) top = rect.top - menuH - gap;
  if (top < pad) top = pad;

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function openFloorPlanPresetMenu(
  trigger: HTMLElement,
  field: "shape" | "category",
  scope: Element,
): void {
  if (activeFloorPlanPresetTrigger === trigger && activeFloorPlanPresetMenu) {
    closeFloorPlanPresetMenu();
    return;
  }

  closeFloorPlanPresetMenu();

  const options = field === "shape" ? SHAPE_OPTIONS : CATEGORY_OPTIONS;
  const menu = document.createElement("div");
  menu.className =
    "floor-plan-preset-menu fixed min-w-[10.5rem] max-h-[min(240px,50vh)] overflow-y-auto rounded-lg border border-border bg-card p-1 text-card-foreground shadow-md";
  menu.style.zIndex = String(FLOOR_PLAN_PRESET_MENU_Z);
  menu.style.backgroundColor = "var(--color-card)";
  menu.setAttribute("role", "listbox");
  menu.setAttribute("data-floor-plan-preset-menu", field);
  menu.innerHTML = options
    .map(
      (o) =>
        `<button
          type="button"
          role="option"
          class="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
          data-floor-plan-preset-pick="${escapeHtml(o.value)}"
          data-floor-plan-preset-field="${field}"
        >${escapeHtml(o.label)}</button>`,
    )
    .join("");

  menu.style.left = "-9999px";
  menu.style.top = "0";
  document.body.appendChild(menu);
  activeFloorPlanPresetMenu = menu;
  activeFloorPlanPresetTrigger = trigger;
  trigger.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    if (!activeFloorPlanPresetMenu || !activeFloorPlanPresetTrigger) return;
    positionFloorPlanPresetMenu(activeFloorPlanPresetMenu, activeFloorPlanPresetTrigger);
  });

  menu.addEventListener("click", (e) => {
    const pick = (e.target as HTMLElement).closest<HTMLElement>("[data-floor-plan-preset-pick]");
    if (!pick) return;
    e.preventDefault();
    e.stopPropagation();
    const pickField = pick.getAttribute("data-floor-plan-preset-field");
    const value = pick.getAttribute("data-floor-plan-preset-pick");
    if (!pickField || !value) return;

    const input = scope.querySelector<HTMLInputElement>(`[data-floor-plan-field="${pickField}"]`);
    if (!input) return;

    if (pickField === "shape") {
      const opt = SHAPE_OPTIONS.find((o) => o.value === value);
      if (opt) input.value = opt.label;
    } else if (pickField === "category") {
      const opt = CATEGORY_OPTIONS.find((o) => o.value === value);
      if (opt) input.value = opt.label;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    closeFloorPlanPresetMenu();
  });
}

function bindFloorPlanPresetMenuDismiss(): void {
  if (floorPlanPresetMenuListenersBound) return;
  floorPlanPresetMenuListenersBound = true;

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!activeFloorPlanPresetMenu) return;
      const target = e.target as HTMLElement;
      if (activeFloorPlanPresetMenu.contains(target)) return;
      if (activeFloorPlanPresetTrigger?.contains(target)) return;
      closeFloorPlanPresetMenu();
    },
    true,
  );

  window.addEventListener(
    "scroll",
    () => {
      if (activeFloorPlanPresetMenu) closeFloorPlanPresetMenu();
    },
    true,
  );
}

function bindFloorPlanFormPresets(scope: Element): void {
  bindFloorPlanPresetMenuDismiss();

  scope.querySelectorAll<HTMLElement>("[data-floor-plan-preset-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const field = trigger.getAttribute("data-floor-plan-preset-trigger");
      if (field !== "shape" && field !== "category") return;
      openFloorPlanPresetMenu(trigger, field, scope);
    });
  });

  scope.querySelectorAll<HTMLSelectElement>("[data-floor-plan-preset]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const field = sel.getAttribute("data-floor-plan-preset");
      if (!field || !sel.value) return;
      const input = scope.querySelector<HTMLInputElement>(`[data-floor-plan-field="${field}"]`);
      if (!input) return;
      input.value = sel.value;
    });
  });

  scope.querySelectorAll<HTMLInputElement>("[data-floor-plan-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const field = input.getAttribute("data-floor-plan-field");
      if (field === "shape") {
        const shape = shapeFromLabel(input.value);
        const kposShape = shape === "oval" ? "HIBACHI" : shape === "ktv" ? "KTV" : "";
        scope.querySelectorAll<HTMLElement>("[data-kpos-condition]").forEach((section) => {
          section.classList.toggle("hidden", section.dataset.kposCondition !== kposShape);
        });
      }
      if (!field || field === "shape" || field === "category") return;
      const sel = scope.querySelector<HTMLSelectElement>(`[data-floor-plan-preset="${field}"]`);
      if (!sel) return;
      const trimmed = input.value.trim();
      const match = [...sel.options].find((o) => o.value === trimmed || o.value === input.value);
      sel.value = match?.value ?? "";
    });
  });
  scope.querySelector<HTMLSelectElement>('[data-floor-plan-field="shape"]')?.addEventListener("change", (event) => {
    const shape = shapeFromLabel((event.currentTarget as HTMLSelectElement).value);
    const kposShape = shape === "oval" ? "HIBACHI" : shape === "ktv" ? "KTV" : "";
    scope.querySelectorAll<HTMLElement>("[data-kpos-condition]").forEach((section) => {
      section.classList.toggle("hidden", section.dataset.kposCondition !== kposShape);
    });
  });
}

export function bindFloorPlanEditor(onRemount: () => void): void {
  ensureFloorPlanPageSaveRegistry();
  const root = document.querySelector("[data-floor-plan-root]");
  if (!root) return;

  window.addEventListener("menusifu:floor-plan-remount", onRemount, { once: true });

  const dialogEl = root.querySelector("[data-floor-plan-dialog]");
  if (dialogEl) bindFloorPlanFormPresets(dialogEl);

  const persist = (state: FloorPlanState) => {
    writeState(state);
    remountFloorPlan();
  };

  const storeId = resolveFloorPlanStoreId();
  root.querySelector("[data-floor-plan-multi-toggle]")?.addEventListener("click", () => {
    const next = multiSelectByStore.get(storeId) !== true;
    multiSelectByStore.set(storeId, next);
    if (!next) selectedTableIdsByStore.set(storeId, readState().selectedTableId ? [readState().selectedTableId!] : []);
    remountFloorPlan();
  });
  root.querySelector("[data-floor-plan-select-all]")?.addEventListener("click", () => {
    const state = readState();
    const ids = getActiveArea(state)?.tables.map((table) => table.id) ?? [];
    selectedTableIdsByStore.set(storeId, ids);
    persist({ ...state, selectedTableId: ids[0] ?? null, tableDialog: null });
  });
  root.querySelector("[data-floor-plan-select-none]")?.addEventListener("click", () => {
    selectedTableIdsByStore.set(storeId, []);
    persist({ ...readState(), selectedTableId: null, tableDialog: null });
  });
  root.querySelectorAll<HTMLElement>("[data-floor-plan-geometry-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.floorPlanGeometryAction as FloorPlanGeometryAction | undefined;
      if (!action) return;
      const state = readState();
      const area = getActiveArea(state);
      if (!area) return;
      const ids = getSelectedTableIds(storeId, state);
      const selected = ids.map((id) => area.tables.find((table) => table.id === id)).filter((table): table is FloorPlanTable => Boolean(table));
      const result = applyFloorPlanGeometryAction(selected, action, KPOS_CANVAS_WIDTH, KPOS_CANVAS_HEIGHT);
      if (!result.ok) {
        alert(result.reason);
        return;
      }
      const geometryById = new Map(result.tables.map((table) => [table.id, table]));
      persist({
        ...state,
        areas: state.areas.map((item) => item.id === area.id ? {
          ...item,
          tables: item.tables.map((table) => ({ ...table, ...geometryById.get(table.id) })),
        } : item),
        tableDialog: null,
      });
    });
  });

  const closeDialog = () => {
    closeFloorPlanPresetMenu();
    const state = readState();
    persist(closeTableDialog({ ...state, selectedTableId: null }));
  };

  const saveTableDialog = () => {
    const state = readState();
    const base = getDialogTable(state);
    if (!base || !state.tableDialog) return;
    const updated = readFormTable(base);
    const targetAreaId = state.tableDialog.mode === "create" ? state.tableDialog.areaId : state.activeAreaId;
    const area = state.areas.find((item) => item.id === targetAreaId);
    if (!area) return;

    if (!updated.name.trim()) {
      alert("请输入桌台名称");
      return;
    }
    const normalizedName = updated.name.trim().toUpperCase();
    const duplicate = state.areas.some((candidateArea) => candidateArea.tables.some((candidate) =>
      candidate.id !== updated.id && candidate.name.trim().toUpperCase() === normalizedName,
    ));
    if (duplicate) {
      alert(`KPOS 已存在桌台“${normalizedName}”，名称必须全局唯一`);
      return;
    }
    if (updated.width <= 0 || updated.width > KPOS_CANVAS_WIDTH || updated.height <= 0 || updated.height > KPOS_CANVAS_HEIGHT) {
      alert("桌台宽、高百分比必须大于 0 且不超过 100");
      return;
    }
    if (updated.kposShape === "HIBACHI" && (!updated.hibachiTableShape || !updated.seatingOrientation)) {
      alert("铁板桌必须选择铁板桌类型和座位排布");
      return;
    }
    if (updated.kposShape === "KTV" && !updated.defaultSaleItemId) {
      alert("KTV 桌必须选择默认销售商品");
      return;
    }

    if (state.tableDialog.mode === "create") {
      if (isKposLiveMode() && !readKposFloorPlanConnection()) {
        alert("请先连接并验证 KPOS，再创建真实桌台草稿。");
        return;
      }
      const errors = validateNewTable(updated, area.tables.map((table) => table.name), KPOS_CANVAS_WIDTH, KPOS_CANVAS_HEIGHT);
      const firstError = Object.values(errors)[0];
      if (firstError) {
        alert(firstError);
        return;
      }
      const overlaps = area.tables.some((table) => rectanglesOverlap(updated, table, 0));
      if (overlaps && !window.confirm("该桌台与现有桌台重叠，仍要加入草稿吗？")) return;
    }

    const withTables =
      state.tableDialog.mode === "create"
        ? { ...area, tables: [...area.tables, updated] }
        : {
            ...area,
            tables: area.tables.map((t) => (t.id === updated.id ? updated : t)),
          };

    persist(
      closeTableDialog({
        ...state,
        areas: state.areas.map((a) => (a.id === area.id ? withTables : a)),
        activeAreaId: area.id,
        selectedTableId: updated.id,
      }),
    );
  };

  const DRAG_THRESHOLD_PX = 5;

  const areaDialogEl = root.querySelector("[data-floor-plan-area-dialog]");

  const closeAreaDialogUi = () => {
    closeFloorPlanPresetMenu();
    persist(closeAreaDialog(closeTableDialog({ ...readState(), selectedTableId: null })));
  };

  const saveAreaDialog = () => {
    const state = readState();
    if (!state.areaDialog) return;
    const name = readAreaNameFromDialog();
    if (!name) {
      alert("请输入区域名称");
      return;
    }

    if (state.areaDialog.mode === "create") {
      const area: FloorPlanArea = { id: newId("area"), name, tables: [] };
      persist(
        closeAreaDialog({
          ...closeTableDialog(state),
          areas: [...state.areas, area],
          activeAreaId: area.id,
          selectedTableId: null,
        }),
      );
      return;
    }

    const areaId = state.areaDialog.areaId;
    persist(
      closeAreaDialog({
        ...state,
        areas: state.areas.map((a) => (a.id === areaId ? { ...a, name } : a)),
      }),
    );
  };

  const deleteAreaById = (areaId: string) => {
    if (isKposLiveMode()) {
      alert("真实 KPOS 模式的删除接口尚未完成安全验证，当前暂不允许删除区域。");
      return;
    }
    const state = readState();
    const area = state.areas.find((a) => a.id === areaId);
    if (!area || !window.confirm(`删除区域「${area.name}」及其全部桌位？`)) return;
    const areas = state.areas.filter((a) => a.id !== areaId);
    persist(
      closeAllFloorPlanDialogs({
        ...state,
        areas,
        activeAreaId: areas[0]?.id ?? "",
        selectedTableId: null,
      }),
    );
  };

  root.querySelector("[data-floor-plan-save-area]")?.addEventListener("click", async () => {
    const area = getActiveArea(readState());
    if (!area) {
      alert("请先新增区域");
      return;
    }
    if (!isKposLiveMode()) {
      alert(`已保存「${area.name}」区域图（${area.tables.length} 张桌）`);
      return;
    }
    const storeId = resolveFloorPlanStoreId();
    try {
      const baseline = floorPlanBaselineByStore.get(storeId)?.find((item) => item.id === area.id);
      await syncKposArea(area, baseline);
      const refreshed = mapKposAreas(await loadKposFloorPlan(), readState());
      liveStateByStore.set(storeId, refreshed);
      floorPlanBaselineByStore.set(storeId, cloneAreas(refreshed.areas));
      liveErrorByStore.delete(storeId);
      clearPageConfigChanges(FLOOR_PLAN_PATH);
      alert(`已同步「${area.name}」到真实 KPOS（${area.tables.length} 张桌）`);
      remountFloorPlan();
    } catch (error) {
      liveErrorByStore.set(storeId, error instanceof Error ? error.message : "保存 KPOS 桌台失败");
      remountFloorPlan();
    }
  });

  root.querySelectorAll("[data-floor-plan-area-add]").forEach((btn) => {
    btn.addEventListener("click", () => persist(openCreateAreaDialog(readState())));
  });

  root.querySelectorAll("[data-floor-plan-area-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).getAttribute("data-floor-plan-area-id");
      if (!id) return;
      const state = readState();
      selectedTableIdsByStore.set(storeId, []);
      persist(closeTableDialog({ ...state, activeAreaId: id, selectedTableId: null }));
    });
  });

  root.querySelector("[data-floor-plan-area-edit]")?.addEventListener("click", () => {
    const state = readState();
    const area = getActiveArea(state);
    if (!area) return;
    persist(openEditAreaDialog(state, area.id));
  });

  root.querySelector("[data-floor-plan-area-delete]")?.addEventListener("click", () => {
    const area = getActiveArea(readState());
    if (!area) return;
    deleteAreaById(area.id);
  });

  areaDialogEl?.querySelector("[data-floor-plan-area-dialog-save]")?.addEventListener("click", saveAreaDialog);
  areaDialogEl?.querySelector("[data-floor-plan-area-dialog-cancel]")?.addEventListener("click", closeAreaDialogUi);
  areaDialogEl?.querySelectorAll("[data-floor-plan-area-dialog-close]").forEach((btn) => {
    btn.addEventListener("click", closeAreaDialogUi);
  });
  areaDialogEl?.querySelector("[data-floor-plan-area-dialog-delete]")?.addEventListener("click", () => {
    const state = readState();
    if (state.areaDialog?.mode !== "edit") return;
    deleteAreaById(state.areaDialog.areaId);
  });
  areaDialogEl?.querySelector<HTMLInputElement>("[data-floor-plan-area-name]")?.focus();

  root.querySelector("[data-floor-plan-table-add]")?.addEventListener("click", () => {
    persist(openCreateTableDialog(readState()));
  });

  dialogEl?.querySelector<HTMLSelectElement>("[data-floor-plan-create-area]")?.addEventListener("change", (event) => {
    const state = readState();
    if (state.tableDialog?.mode !== "create" || !state.dialogDraft) return;
    const areaId = (event.currentTarget as HTMLSelectElement).value;
    const area = state.areas.find((item) => item.id === areaId);
    if (!area) return;
    const vacancy = findTableVacancy(area.tables, state.dialogDraft.width, state.dialogDraft.height, KPOS_CANVAS_WIDTH, KPOS_CANVAS_HEIGHT);
    writeState({
      ...state,
      activeAreaId: areaId,
      tableDialog: { ...state.tableDialog, areaId, vacancyWarning: vacancy.overlaps },
      dialogDraft: { ...state.dialogDraft, x: vacancy.x, y: vacancy.y },
    });
    remountFloorPlan();
  });

  if (dialogEl && readState().tableDialog?.mode === "create") {
    dialogEl.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-floor-plan-field]").forEach((field) => {
      field.addEventListener("input", () => {
        const state = readState();
        if (state.tableDialog?.mode !== "create" || !state.dialogDraft) return;
        const createDialog = state.tableDialog;
        const next = readFormTable(state.dialogDraft);
        const area = state.areas.find((item) => item.id === createDialog.areaId);
        const warning = area ? area.tables.some((table) => rectanglesOverlap(next, table, 0)) : false;
        writeState({ ...state, dialogDraft: next, tableDialog: { ...state.tableDialog, vacancyWarning: warning } });
        const preview = root.querySelector<HTMLElement>("[data-floor-plan-draft-preview]");
        if (preview) {
          preview.style.left = `${next.x}px`;
          preview.style.top = `${next.y}px`;
          preview.style.width = `${next.width}px`;
          preview.style.height = `${next.height}px`;
          preview.style.transform = `rotate(${next.rotation}deg)`;
          const label = preview.querySelector<HTMLElement>("[data-floor-plan-draft-label]");
          if (label) label.textContent = next.name;
          preview.classList.toggle("rounded-full", next.shape === "circle");
          preview.classList.toggle("rounded-[999px]", next.shape === "oval");
          preview.classList.toggle("rounded-md", next.shape === "rectangle");
        }
      });
    });
  }

  root.querySelectorAll("[data-floor-plan-table-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).getAttribute("data-floor-plan-table-pick");
      if (!id) return;
      selectedTableIdsByStore.set(storeId, [id]);
      persist(openEditTableDialog(readState(), id));
    });
  });

  dialogEl?.querySelector("[data-floor-plan-dialog-save]")?.addEventListener("click", saveTableDialog);
  dialogEl?.querySelector("[data-floor-plan-dialog-cancel]")?.addEventListener("click", closeDialog);
  dialogEl?.querySelectorAll("[data-floor-plan-dialog-close]").forEach((btn) => {
    btn.addEventListener("click", closeDialog);
  });
  dialogEl?.querySelector("[data-floor-plan-dialog-delete]")?.addEventListener("click", () => {
    const state = readState();
    if (state.tableDialog?.mode !== "edit") return;
    const tableId = state.tableDialog.tableId;
    const area = getActiveArea(state);
    if (!area) return;
    const table = area.tables.find((t) => t.id === tableId);
    if (table && isKposLiveMode() && !isKposTableDeletable(table)) {
      alert("该桌台正在使用或仍有就餐人数，请先在 POS 清台后再删除。");
      return;
    }
    if (!table || !window.confirm(`删除桌子「${table.name}」？`)) return;
    persist(
      closeTableDialog({
        ...state,
        areas: state.areas.map((a) =>
          a.id === area.id ? { ...a, tables: a.tables.filter((t) => t.id !== tableId) } : a,
        ),
        selectedTableId: null,
      }),
    );
  });

  const onDialogKeydown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const state = readState();
    if (state.tableDialog) {
      e.preventDefault();
      closeDialog();
      return;
    }
    if (state.areaDialog) {
      e.preventDefault();
      closeAreaDialogUi();
    }
  };
  document.addEventListener("keydown", onDialogKeydown);
  window.addEventListener(
    "menusifu:floor-plan-remount",
    () => document.removeEventListener("keydown", onDialogKeydown),
    { once: true },
  );

  const canvas = root.querySelector("[data-floor-plan-canvas]") as HTMLElement | null;
  if (!canvas) return;

  let interaction: {
    tableId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    dragged: boolean;
  } | null = null;

  const onMove = (e: PointerEvent) => {
    if (!interaction || e.pointerId !== interaction.pointerId) return;
    const dx = e.clientX - interaction.startClientX;
    const dy = e.clientY - interaction.startClientY;
    if (!interaction.dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

    interaction.dragged = true;
    const moving = getActiveArea(readState())?.tables.find((table) => table.id === interaction?.tableId);
    const nextX = Math.min(
      KPOS_CANVAS_WIDTH - (moving?.width ?? 0),
      Math.max(0, interaction.originX + dx),
    );
    const nextY = Math.min(
      KPOS_CANVAS_HEIGHT - (moving?.height ?? 0),
      Math.max(0, interaction.originY + dy),
    );
    const el = canvas.querySelector(
      `[data-floor-plan-table-id="${interaction.tableId}"]`,
    ) as HTMLElement | null;
    if (el) {
      el.style.left = `${nextX}px`;
      el.style.top = `${nextY}px`;
    }
  };

  const finishInteraction = () => {
    if (!interaction) return;
    const { tableId, dragged } = interaction;
    let state = readState();

    if (dragged) {
      const area = getActiveArea(state);
      if (!area) return;
      const el = canvas.querySelector(`[data-floor-plan-table-id="${tableId}"]`) as HTMLElement | null;
      const x = el ? parseFloat(el.style.left) : 0;
      const y = el ? parseFloat(el.style.top) : 0;
      state = {
        ...state,
        areas: state.areas.map((a) =>
          a.id === area.id
            ? {
                ...a,
                tables: a.tables.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
              }
            : a,
        ),
      };
      writeState(closeTableDialog({ ...state, selectedTableId: tableId }));
      interaction = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      remountFloorPlan();
      return;
    }

    interaction = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    persist(openEditTableDialog(state, tableId));
  };

  const onUp = () => finishInteraction();

  canvas.querySelectorAll("[data-floor-plan-table-id]").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      const ev = e as PointerEvent;
      if (ev.button !== 0) return;
      const id = (btn as HTMLElement).getAttribute("data-floor-plan-table-id");
      if (!id) return;
      const state = readState();
      const area = getActiveArea(state);
      const table = area?.tables.find((t) => t.id === id);
      if (!table || !area) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (multiSelectByStore.get(storeId) === true || ev.ctrlKey || ev.metaKey) {
        multiSelectByStore.set(storeId, true);
        const current = getSelectedTableIds(storeId, state);
        const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        selectedTableIdsByStore.set(storeId, next);
        persist(closeTableDialog({ ...state, selectedTableId: next[0] ?? null }));
        return;
      }
      selectedTableIdsByStore.set(storeId, [id]);
      (btn as HTMLElement).setPointerCapture(ev.pointerId);

      applyCanvasTableHighlight(root, id);

      interaction = {
        tableId: id,
        pointerId: ev.pointerId,
        startClientX: ev.clientX,
        startClientY: ev.clientY,
        originX: table.x,
        originY: table.y,
        dragged: false,
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });
  });

  const draftPreview = canvas.querySelector<HTMLElement>("[data-floor-plan-draft-preview]");
  draftPreview?.addEventListener("pointerdown", (event) => {
    const ev = event as PointerEvent;
    if (ev.button !== 0) return;
    const state = readState();
    if (state.tableDialog?.mode !== "create" || !state.dialogDraft) return;
    ev.preventDefault();
    ev.stopPropagation();
    draftPreview.setPointerCapture(ev.pointerId);
    const startX = ev.clientX;
    const startY = ev.clientY;
    const originX = state.dialogDraft.x;
    const originY = state.dialogDraft.y;
    const width = state.dialogDraft.width;
    const height = state.dialogDraft.height;
    const onDraftMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== ev.pointerId) return;
      const x = Math.min(KPOS_CANVAS_WIDTH - width, Math.max(0, originX + moveEvent.clientX - startX));
      const y = Math.min(KPOS_CANVAS_HEIGHT - height, Math.max(0, originY + moveEvent.clientY - startY));
      draftPreview.style.left = `${Math.round(x)}px`;
      draftPreview.style.top = `${Math.round(y)}px`;
    };
    const onDraftUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== ev.pointerId) return;
      window.removeEventListener("pointermove", onDraftMove);
      window.removeEventListener("pointerup", onDraftUp);
      window.removeEventListener("pointercancel", onDraftUp);
      const current = readState();
      if (current.tableDialog?.mode !== "create" || !current.dialogDraft) return;
      const createDialog = current.tableDialog;
      const next = {
        ...current.dialogDraft,
        x: Math.round(parseFloat(draftPreview.style.left)),
        y: Math.round(parseFloat(draftPreview.style.top)),
      };
      const area = current.areas.find((item) => item.id === createDialog.areaId);
      const warning = area ? area.tables.some((table) => rectanglesOverlap(next, table, 0)) : false;
      writeState({ ...current, dialogDraft: next, tableDialog: { ...current.tableDialog, vacancyWarning: warning } });
    };
    window.addEventListener("pointermove", onDraftMove);
    window.addEventListener("pointerup", onDraftUp);
    window.addEventListener("pointercancel", onDraftUp);
  });

  canvas.addEventListener("pointerdown", (e) => {
    const hit = (e.target as HTMLElement).closest("[data-floor-plan-table-id], [data-floor-plan-draft-preview]");
    if (hit) return;
    const state = readState();
    if (!state.selectedTableId && !state.tableDialog && !state.areaDialog) return;
    selectedTableIdsByStore.set(storeId, []);
    persist(closeAllFloorPlanDialogs({ ...state, selectedTableId: null }));
  });
}
