/**
 * 前厅 · 餐位平面图（seq 428 能力页，非设置滑层项）
 * 原型：localStorage 持久化区域与桌位布局
 */

export const FLOOR_PLAN_PATH = "/operations/queue-call/floor-plan";

const STORAGE_KEY = "bplant-floor-plan:v1";

export type FloorPlanTableShape = "rectangle" | "circle" | "oval";
export type FloorPlanTableCategory = "standard" | "booth" | "bar" | "private";

export type FloorPlanTable = {
  id: string;
  name: string;
  seats: number;
  width: number;
  height: number;
  rotation: number;
  shape: FloorPlanTableShape;
  category: FloorPlanTableCategory;
  x: number;
  y: number;
};

export type FloorPlanArea = {
  id: string;
  name: string;
  tables: FloorPlanTable[];
};

type FloorPlanTableDialog =
  | { mode: "create" }
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
  return {
    id: newId("t"),
    name: `T${area.tables.length + 1}`,
    seats: 4,
    width: 80,
    height: 60,
    rotation: 0,
    shape: "rectangle",
    category: "standard",
    x: 32 + area.tables.length * 24,
    y: 32 + area.tables.length * 16,
  };
}

function getDialogTable(state: FloorPlanState): FloorPlanTable | null {
  const dialog = state.tableDialog;
  if (!dialog) return null;
  if (dialog.mode === "create") return state.dialogDraft ?? null;
  const area = getActiveArea(state);
  return area?.tables.find((t) => t.id === dialog.tableId) ?? null;
}

function readState(): FloorPlanState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
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

function writeState(state: FloorPlanState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  { value: "oval", label: "Oval / 椭圆" },
];

const CATEGORY_OPTIONS: { value: FloorPlanTableCategory; label: string }[] = [
  { value: "standard", label: "标准桌" },
  { value: "booth", label: "卡座" },
  { value: "bar", label: "吧台" },
  { value: "private", label: "包间" },
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
  return v === "rectangle" || v === "circle" || v === "oval";
}

function isFloorPlanTableCategory(v: string): v is FloorPlanTableCategory {
  return v === "standard" || v === "booth" || v === "bar" || v === "private";
}

function shapeFromLabel(text: string): FloorPlanTableShape | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("rect") || t.includes("矩")) return "rectangle";
  if (t.includes("circle") || t.includes("圆")) return "circle";
  if (t.includes("oval") || t.includes("椭")) return "oval";
  return isFloorPlanTableShape(t) ? t : null;
}

function categoryFromLabel(text: string): FloorPlanTableCategory | null {
  const t = text.trim();
  if (!t) return null;
  const hit = CATEGORY_OPTIONS.find((o) => o.label === t || o.value === t);
  if (hit) return hit.value;
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

function renderTableOnCanvas(table: FloorPlanTable, selected: boolean): string {
  const selectedCls = selected
    ? "z-20 border-primary bg-primary/20 ring-2 ring-primary shadow-md"
    : "z-10 border-border bg-card/90 hover:border-primary/60 hover:shadow";
  const radius =
    table.shape === "circle" ? "rounded-full" : table.shape === "oval" ? "rounded-[999px]" : "rounded-md";
  return `<button
    type="button"
    class="floor-plan-table absolute flex items-center justify-center border text-xs font-medium shadow-sm transition-[box-shadow,background-color,border-color] ${selectedCls} ${radius}"
    data-floor-plan-table-id="${escapeHtml(table.id)}"
    data-floor-plan-selected="${selected ? "true" : "false"}"
    aria-pressed="${selected ? "true" : "false"}"
    style="left:${table.x}px;top:${table.y}px;width:${table.width}px;height:${table.height}px;transform:rotate(${table.rotation}deg)"
    title="${escapeHtml(table.name)} · ${table.seats}人"
  >${escapeHtml(table.name)}</button>`;
}

function renderFormFields(table: FloorPlanTable, state: FloorPlanState): string {
  const name = table.name;
  const seats = table.seats;
  const width = table.width;
  const height = table.height;
  const rotation = table.rotation;
  const shape = table.shape;
  const category = table.category;
  const nameSuggestions = collectNameSuggestions(state);

  return `
    <fieldset class="space-y-3" data-floor-plan-form>
      <p class="text-xs text-muted-foreground">各字段左侧可输入，右侧下拉可快捷选择</p>
      ${renderComboTextField("名称", "name", name, nameSuggestions, false, 'placeholder="如 A1、包间1"')}
      ${renderComboNumberField("人数", "seats", seats, SEATS_PRESETS, false, 'min="1" step="1"')}
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${renderComboNumberField("宽", "width", width, SIZE_PRESETS, false, 'min="24" step="1"')}
        ${renderComboNumberField("高", "height", height, SIZE_PRESETS, false, 'min="24" step="1"')}
      </div>
      ${renderComboNumberField("旋转(度)", "rotation", rotation, ROTATION_PRESETS, false, 'step="1"')}
      ${renderEnumComboField(
        "类型",
        "shape",
        shapeLabel(shape),
        "floor-plan-shape-datalist",
        SHAPE_OPTIONS.map((o) => `<option value="${escapeHtml(o.label)}"></option>`).join(""),
      )}
      ${renderEnumComboField(
        "桌子类别",
        "category",
        categoryLabel(category),
        "floor-plan-category-datalist",
        CATEGORY_OPTIONS.map((o) => `<option value="${escapeHtml(o.label)}"></option>`).join(""),
      )}
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
        <div class="px-5 py-4">
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

function renderSidebarPanel(state: FloorPlanState, active: FloorPlanArea | null): string {
  if (!state.areas.length) {
    return `
      <div class="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
        <p class="text-sm text-muted-foreground">请先创建就餐区域，再布置桌位</p>
        <button
          type="button"
          class="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-floor-plan-area-add
        >新增区域</button>
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
                  <span>${escapeHtml(t.name)}</span>
                  <span class="text-xs text-muted-foreground">${t.seats}人</span>
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

  return `
    <div
      class="fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto p-4"
      data-floor-plan-dialog-overlay
      role="presentation"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        data-floor-plan-dialog-close
        aria-label="关闭"
      ></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="floor-plan-dialog-title"
        class="relative z-10 my-auto flex w-full max-w-xl flex-col overflow-visible rounded-xl border border-border bg-card shadow-xl"
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
        <div class="overflow-visible px-5 py-4">
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
            >保存</button>
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
    tableDialog: { mode: "create" },
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
  const state = readState();
  const active = getActiveArea(state);
  const hasAreas = state.areas.length > 0;

  const tablesHtml =
    active?.tables
      .map((t) => renderTableOnCanvas(t, t.id === state.selectedTableId))
      .join("") ?? "";

  const canvasEmpty = !hasAreas
    ? `<p class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">请先点击右侧「新增区域」创建楼层或分区</p>`
    : !tablesHtml
      ? `<p class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">当前区域暂无桌位，请点击右侧「新增桌子」</p>`
      : "";

  return `
    <div class="floor-plan-editor flex min-h-[min(72vh,640px)] flex-col gap-4 lg:flex-row" data-floor-plan-root>
      <div class="flex min-w-0 flex-1 flex-col gap-3">
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
  const category = categoryFromLabel(getInput("category")) ?? base.category;

  return {
    ...base,
    name: getInput("name").trim() || base.name,
    seats: Math.max(1, Number(getInput("seats")) || base.seats),
    width: Math.max(24, Number(getInput("width")) || base.width),
    height: Math.max(24, Number(getInput("height")) || base.height),
    rotation: Number(getInput("rotation")) || 0,
    shape,
    category,
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
      if (!field || field === "shape" || field === "category") return;
      const sel = scope.querySelector<HTMLSelectElement>(`[data-floor-plan-preset="${field}"]`);
      if (!sel) return;
      const trimmed = input.value.trim();
      const match = [...sel.options].find((o) => o.value === trimmed || o.value === input.value);
      sel.value = match?.value ?? "";
    });
  });
}

export function bindFloorPlanEditor(onRemount: () => void): void {
  const root = document.querySelector("[data-floor-plan-root]");
  if (!root) return;

  window.addEventListener("menusifu:floor-plan-remount", onRemount, { once: true });

  const dialogEl = root.querySelector("[data-floor-plan-dialog]");
  if (dialogEl) bindFloorPlanFormPresets(dialogEl);

  const persist = (state: FloorPlanState) => {
    writeState(state);
    remountFloorPlan();
  };

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
    const area = getActiveArea(state);
    if (!area) return;

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

  root.querySelector("[data-floor-plan-save-area]")?.addEventListener("click", () => {
    const area = getActiveArea(readState());
    if (!area) {
      alert("请先新增区域");
      return;
    }
    alert(`已保存「${area.name}」区域图（${area.tables.length} 张桌）`);
  });

  root.querySelectorAll("[data-floor-plan-area-add]").forEach((btn) => {
    btn.addEventListener("click", () => persist(openCreateAreaDialog(readState())));
  });

  root.querySelectorAll("[data-floor-plan-area-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).getAttribute("data-floor-plan-area-id");
      if (!id) return;
      const state = readState();
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

  root.querySelectorAll("[data-floor-plan-table-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).getAttribute("data-floor-plan-table-pick");
      if (!id) return;
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
    const nextX = Math.max(0, interaction.originX + dx);
    const nextY = Math.max(0, interaction.originY + dy);
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

  canvas.addEventListener("pointerdown", (e) => {
    const hit = (e.target as HTMLElement).closest("[data-floor-plan-table-id]");
    if (hit) return;
    const state = readState();
    if (!state.selectedTableId && !state.tableDialog && !state.areaDialog) return;
    persist(closeAllFloorPlanDialogs({ ...state, selectedTableId: null }));
  });
}
