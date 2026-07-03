/**
 * M 平台 · 新增一级导航对话框
 */
import {
  createNavBlueprintL1WithChildren,
  createNavBlueprintL2UnderL1,
  createNavBlueprintL3UnderL2,
  customL2CreationBlockedReason,
  customL3CreationBlockedReasonForL2,
  getNavBlueprintDraft,
  getNavBlueprintCustomL1Node,
  getNavBlueprintCustomSubtreeIds,
  getOccupiedRoutesFromBlueprint,
  updateNavBlueprintL1WithChildren,
  type NavBlueprintL2CreateInput,
} from "./nav-blueprint-store";
import { getOccupiedL3GroupKeysUnderL2 } from "./nav-blueprint-tree";
import { slugifyModuleSettingsGroupKey } from "./module-settings-catalog";
import {
  getNavSettingRegistry,
  groupNavSettingEntries,
  searchNavSettingRegistry,
} from "./nav-setting-registry";
import {
  buildNavPresetItemRegistry,
  getNavPresetItemRegistryEntry,
  groupNavPresetItemEntries,
  searchNavPresetItemRegistry,
} from "./nav-preset-item-registry";
import {
  buildNavRouteRegistry,
  defaultSettingsPathForModuleRoot,
  deriveModuleRootFromPath,
  getNavRouteRegistryEntry,
  groupNavRouteEntries,
  searchNavRouteRegistry,
  type NavRouteRegistryEntry,
} from "./nav-route-registry";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const DIALOG_ID = "nb-add-l1-dialog";

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

type L1ChildMode = "page" | "features" | "manual-l2";

interface L2RowDraft {
  rowId: string;
  label: string;
  routeId: string;
  routePath: string;
  isSettingsHub: boolean;
  fromPresetItemKey?: string;
  manual?: boolean;
}

interface AddL1DialogState {
  blueprintId: string;
  /** 编辑模式：待更新的一级导航 id */
  editL1Id?: string;
  /** 新增二级模式：挂载到的一级导航 id */
  addL2UnderL1Id?: string;
  /** 新增二级模式：所属一级名称（只读展示） */
  parentL1Label?: string;
  /** 新增三级模式：挂载到的二级导航 id */
  addL3UnderL2Id?: string;
  /** 新增三级模式：所属二级名称（只读展示） */
  parentL2Label?: string;
  /** 新增三级模式：所属二级的 settingsPath */
  parentL2SettingsPath?: string;
  label: string;
  labelEn: string;
  selectedRouteId: string | null;
  manualL1Route: string;
  /** page | features | manual-l2 */
  childMode: L1ChildMode;
  presetItemKeys: string[];
  l2Rows: L2RowDraft[];
  settingsHubEnabled: boolean;
  routeSearch: string;
  routeGroupFilter: string;
  presetItemSearch: string;
  presetGroupFilter: string;
  settingSearch: string;
  selectedSeqs: number[];
}

let dialogState: AddL1DialogState | null = null;
let onMountCallback: (() => void) | null = null;
let rowCounter = 0;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newRowId(): string {
  rowCounter += 1;
  return `l2-row-${rowCounter}`;
}

function isEditMode(state: AddL1DialogState): boolean {
  return Boolean(state.editL1Id);
}

function isAddL2Mode(state: AddL1DialogState): boolean {
  return Boolean(state.addL2UnderL1Id);
}

function isAddL3Mode(state: AddL1DialogState): boolean {
  return Boolean(state.addL3UnderL2Id);
}

function deriveL3GroupKey(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";
  return slugifyModuleSettingsGroupKey(trimmed) || `group-${Date.now()}`;
}

function buildAddL3State(blueprintId: string, parentL2Key: string): AddL1DialogState | null {
  const draft = getNavBlueprintDraft(blueprintId);
  const l2 = draft.customNodes.find((n) => n.id === parentL2Key && n.level === 2);
  if (!l2) return null;
  const l1 = l2.parentKey ? getNavBlueprintCustomL1Node(blueprintId, l2.parentKey) : undefined;
  return {
    ...defaultState(blueprintId),
    addL3UnderL2Id: parentL2Key,
    parentL2Label: l2.label,
    parentL1Label: l1?.label,
    parentL2SettingsPath: l2.settingsPath ?? l2.route ?? "",
    childMode: "page",
  };
}

function buildAddL2State(blueprintId: string, parentL1Key: string): AddL1DialogState | null {
  const parent = getNavBlueprintCustomL1Node(blueprintId, parentL1Key);
  if (!parent) return null;
  return {
    ...defaultState(blueprintId),
    addL2UnderL1Id: parentL1Key,
    parentL1Label: parent.label,
    childMode: "page",
  };
}

function resolveL2PagePath(state: AddL1DialogState): string {
  if (state.manualL1Route.trim()) return state.manualL1Route.trim();
  const selected = state.selectedRouteId ? getNavRouteRegistryEntry(state.selectedRouteId) : undefined;
  if (selected) return selected.path;
  throw new Error("missing route");
}

function getOccupiedRoutesForState(state: AddL1DialogState): Set<string> {
  const exclude = state.editL1Id
    ? getNavBlueprintCustomSubtreeIds(state.blueprintId, state.editL1Id)
    : undefined;
  return getOccupiedRoutesFromBlueprint(state.blueprintId, exclude);
}

function findRouteIdByPath(path: string): string | null {
  const entry = buildNavRouteRegistry().find((e) => e.path === path);
  return entry?.id ?? null;
}

function findPresetKeyByLandingPath(path: string): string | undefined {
  return buildNavPresetItemRegistry().find((e) => e.landingPath === path)?.key;
}

function collectSelectedSeqsForSettingsHub(
  blueprintId: string,
  settingsHubL2Id: string,
): number[] {
  const draft = getNavBlueprintDraft(blueprintId);
  const l3Keys = new Set(
    draft.customNodes
      .filter((n) => n.level === 3 && n.parentKey === settingsHubL2Id)
      .map((n) => `${n.parentKey}:${n.groupKey ?? n.id}`),
  );
  return Object.entries(draft.customSeqAssignments)
    .filter(([, l3Key]) => l3Keys.has(l3Key))
    .map(([seq]) => Number(seq));
}

function l2RowFromCustomNode(l2: {
  label: string;
  route?: string;
  isSettingsHub?: boolean;
}): L2RowDraft {
  const path = l2.route ?? "";
  const routeId = findRouteIdByPath(path);
  const presetKey = findPresetKeyByLandingPath(path);
  return {
    rowId: newRowId(),
    label: l2.label,
    routeId: routeId ?? "",
    routePath: path,
    isSettingsHub: l2.isSettingsHub ?? false,
    fromPresetItemKey: presetKey,
    manual: !presetKey,
  };
}

function buildEditStateFromL1(blueprintId: string, l1NodeId: string): AddL1DialogState | null {
  const node = getNavBlueprintCustomL1Node(blueprintId, l1NodeId);
  if (!node) return null;

  const draft = getNavBlueprintDraft(blueprintId);
  const l2Children = draft.customNodes
    .filter((n) => n.level === 2 && n.parentKey === l1NodeId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childMode: L1ChildMode =
    node.l1MountKind ??
    (l2Children.length === 0
      ? "page"
      : l2Children.some((l2) => findPresetKeyByLandingPath(l2.route ?? ""))
        ? "features"
        : "manual-l2");

  const state: AddL1DialogState = {
    ...defaultState(blueprintId),
    editL1Id: l1NodeId,
    label: node.label,
    labelEn: node.labelEn ?? "",
    childMode,
  };

  if (childMode === "page") {
    const routeId = findRouteIdByPath(node.route ?? "");
    if (routeId) state.selectedRouteId = routeId;
    else state.manualL1Route = node.route ?? "";
  } else if (childMode === "features") {
    for (const l2 of l2Children) {
      if (l2.isSettingsHub) continue;
      const key = findPresetKeyByLandingPath(l2.route ?? "");
      if (key) state.presetItemKeys.push(key);
    }
  } else {
    state.l2Rows = l2Children.map((l2) => l2RowFromCustomNode(l2));
    const hub = l2Children.find((l2) => l2.isSettingsHub);
    state.settingsHubEnabled = Boolean(hub);
    if (hub) state.selectedSeqs = collectSelectedSeqsForSettingsHub(blueprintId, hub.id);
  }

  return state;
}

function getEditingL1SettingsL3Keys(blueprintId: string, editL1Id: string): Set<string> {
  const draft = getNavBlueprintDraft(blueprintId);
  const hub = draft.customNodes.find(
    (n) => n.level === 2 && n.parentKey === editL1Id && n.isSettingsHub,
  );
  if (!hub) return new Set();
  return new Set(
    draft.customNodes
      .filter((n) => n.level === 3 && n.parentKey === hub.id)
      .map((n) => `${n.parentKey}:${n.groupKey ?? n.id}`),
  );
}

function defaultState(blueprintId: string): AddL1DialogState {
  return {
    blueprintId,
    label: "",
    labelEn: "",
    selectedRouteId: null,
    manualL1Route: "",
    childMode: "page",
    presetItemKeys: [],
    l2Rows: [],
    settingsHubEnabled: false,
    routeSearch: "",
    routeGroupFilter: "",
    presetItemSearch: "",
    presetGroupFilter: "",
    settingSearch: "",
    selectedSeqs: [],
  };
}

function readStateFromDom(dialog: HTMLElement): AddL1DialogState {
  const base = dialogState ?? defaultState(dialog.dataset.blueprintId ?? "");
  return {
    ...base,
    label: dialog.querySelector<HTMLInputElement>("[data-nb-l1-label]")?.value ?? base.label,
    labelEn: dialog.querySelector<HTMLInputElement>("[data-nb-l1-label-en]")?.value ?? base.labelEn,
    selectedRouteId:
      dialog.querySelector<HTMLInputElement>("[name=nb-l1-route]:checked")?.value ?? base.selectedRouteId,
    manualL1Route:
      dialog.querySelector<HTMLInputElement>("[data-nb-l1-manual-route]")?.value ?? base.manualL1Route,
    childMode:
      (dialog.querySelector<HTMLInputElement>("[name=nb-l1-child-mode]:checked")?.value as L1ChildMode) ??
      base.childMode,
    routeSearch: dialog.querySelector<HTMLInputElement>("[data-nb-route-search]")?.value ?? base.routeSearch,
    routeGroupFilter: base.routeGroupFilter,
    presetItemSearch: dialog.querySelector<HTMLInputElement>("[data-nb-preset-item-search]")?.value ?? base.presetItemSearch,
    presetGroupFilter: base.presetGroupFilter,
    settingsHubEnabled:
      dialog.querySelector<HTMLInputElement>("[data-nb-settings-hub]")?.checked ?? base.settingsHubEnabled,
    presetItemKeys: [...dialog.querySelectorAll<HTMLInputElement>("[data-nb-preset-item]:checked")].map(
      (el) => el.value,
    ),
    l2Rows: [...dialog.querySelectorAll<HTMLElement>("[data-nb-l2-row]")].map((row) => ({
      rowId: row.dataset.nbL2Row!,
      label: row.querySelector<HTMLInputElement>("[data-nb-l2-label]")?.value ?? "",
      routeId: row.querySelector<HTMLSelectElement>("[data-nb-l2-route]")?.value ?? "",
      routePath: row.querySelector<HTMLInputElement>("[data-nb-l2-route-path]")?.value ?? "",
      isSettingsHub: row.querySelector<HTMLInputElement>("[data-nb-l2-settings-hub]")?.checked ?? false,
      fromPresetItemKey: row.dataset.fromPresetItemKey || undefined,
    })),
    settingSearch: dialog.querySelector<HTMLInputElement>("[data-nb-setting-search]")?.value ?? base.settingSearch,
    selectedSeqs: [...dialog.querySelectorAll<HTMLInputElement>("[data-nb-setting-seq]:checked")].map((el) =>
      Number(el.value),
    ),
  };
}

function resolveSettingsHubPath(state: AddL1DialogState): string | undefined {
  if (isAddL3Mode(state)) {
    const path = state.parentL2SettingsPath?.trim();
    return path || undefined;
  }
  const hub = syncFeatureRows(state).find((r) => r.isSettingsHub);
  const path = hub?.routePath?.trim();
  return path || undefined;
}

function resolveSettingsPathFilter(state: AddL1DialogState): string | undefined {
  const hubPath = resolveSettingsHubPath(state);
  if (!hubPath) return undefined;
  const draft = getNavBlueprintDraft(state.blueprintId);
  const hasCatalog = searchNavSettingRegistry("", draft.customSeqAssignments, hubPath).length > 0;
  return hasCatalog ? hubPath : undefined;
}

function normalizeDialogState(state: AddL1DialogState): AddL1DialogState {
  return state;
}

function syncFeatureRows(state: AddL1DialogState): L2RowDraft[] {
  const mode = normalizeDialogState(state).childMode;

  if (mode === "page") return [];

  if (mode === "manual-l2") {
    return state.l2Rows.filter((r) => !r.fromPresetItemKey);
  }

  const manualRows = state.l2Rows.filter((r) => !r.fromPresetItemKey && r.manual);
  const featureRows: L2RowDraft[] = [];

  for (const key of state.presetItemKeys) {
    const item = getNavPresetItemRegistryEntry(key);
    if (!item?.landingPath) continue;
    const existing = state.l2Rows.find((r) => r.fromPresetItemKey === key);
    featureRows.push({
      rowId: existing?.rowId ?? newRowId(),
      label: existing?.label || item.title,
      routeId: existing?.routeId ?? "",
      routePath: existing?.routePath || item.landingPath,
      isSettingsHub: false,
      fromPresetItemKey: key,
    });
  }

  let rows = [...manualRows, ...featureRows];

  if (mode === "features") {
    return rows.filter((r) => !r.isSettingsHub);
  }

  if (state.settingsHubEnabled) {
    const hub = state.l2Rows.find((r) => r.isSettingsHub && !r.fromPresetItemKey);
    const moduleRoot = resolveModuleRootForState(state);
    const settingsPath = defaultSettingsPathForModuleRoot(moduleRoot);
    rows = rows.filter((r) => !(r.isSettingsHub && r.label === "设置"));
    rows.push({
      rowId: hub?.rowId ?? newRowId(),
      label: hub?.label ?? "设置",
      routeId: hub?.routeId ?? "",
      routePath: hub?.routePath || settingsPath,
      isSettingsHub: true,
    });
  } else {
    rows = rows.filter((r) => !r.isSettingsHub || r.fromPresetItemKey);
  }

  return rows;
}

function resolveModuleRootForState(state: AddL1DialogState): string {
  if (state.manualL1Route.trim()) return state.manualL1Route.trim();
  const selected = state.selectedRouteId ? getNavRouteRegistryEntry(state.selectedRouteId) : undefined;
  if (selected) return selected.moduleRootPath;
  const firstL2 = state.l2Rows.find((r) => r.routePath.trim());
  if (firstL2) return deriveModuleRootFromPath(firstL2.routePath);
  return "/custom-module";
}

function resolveL1Route(state: AddL1DialogState): { route: string; defaultChildRoute?: string } {
  const mode = normalizeDialogState(state).childMode;

  if (mode === "page") {
    if (state.manualL1Route.trim()) {
      return { route: state.manualL1Route.trim() };
    }
    const selected = state.selectedRouteId ? getNavRouteRegistryEntry(state.selectedRouteId) : undefined;
    if (selected) {
      return { route: selected.path };
    }
    throw new Error("missing route");
  }

  if (mode === "features") {
    const rows = syncFeatureRows(state);
    const first = rows.find((r) => r.routePath.trim());
    if (!first) throw new Error("missing route");
    return {
      route: deriveModuleRootFromPath(first.routePath),
      defaultChildRoute: first.routePath,
    };
  }

  if (mode === "manual-l2") {
    const rows = syncFeatureRows(state);
    const first = rows.find((r) => r.routePath.trim() || r.routeId);
    if (first) {
      const path = first.routeId
        ? getNavRouteRegistryEntry(first.routeId)?.path ?? first.routePath.trim()
        : first.routePath.trim();
      if (path) {
        return {
          route: deriveModuleRootFromPath(path),
          defaultChildRoute: path,
        };
      }
    }
    return { route: `/custom/l1-${Date.now()}` };
  }

  throw new Error("missing route");
}

function validateState(state: AddL1DialogState): string[] {
  if (isAddL3Mode(state)) return validateAddL3State(state);
  if (isAddL2Mode(state)) return validateAddL2State(state);
  return validateAddL1State(state);
}

function validateAddL3State(state: AddL1DialogState): string[] {
  const errors: string[] = [];
  if (!state.label.trim()) errors.push("请填写三级分组名称");
  if (state.label.trim().length > 32) errors.push("三级分组名称不超过 32 字");

  const normalized = normalizeDialogState(state);
  const hasRoute = Boolean(state.selectedRouteId || state.manualL1Route.trim());
  const syncedL2 = syncFeatureRows(state);
  const parentL2Key = state.addL3UnderL2Id!;

  if (normalized.childMode === "page") {
    if (!hasRoute) errors.push("请选择要挂载的页面");
  } else if (normalized.childMode === "features") {
    if (normalized.presetItemKeys.length === 0) errors.push("请至少选择一项功能/设置");
  }

  const occupiedRoutes = getOccupiedRoutesFromBlueprint(state.blueprintId);
  const occupiedGroupKeys = getOccupiedL3GroupKeysUnderL2(getNavBlueprintDraft(state.blueprintId), parentL2Key);
  const usedPaths = new Set<string>();
  const usedGroupKeys = new Set<string>();

  if (normalized.childMode === "page") {
    try {
      const path = resolveL2PagePath(state);
      if (occupiedRoutes.has(path)) errors.push(`路由 ${path} 已被占用`);
      usedPaths.add(path);
      const groupKey = deriveL3GroupKey(state.label.trim());
      if (occupiedGroupKeys.has(groupKey)) errors.push(`分组键 ${groupKey} 在该二级下已存在`);
    } catch {
      /* handled above */
    }
  }

  if (normalized.childMode === "features") {
    for (const row of syncedL2) {
      if (!row.label.trim() && !row.routePath.trim() && !row.routeId) continue;
      if (!row.label.trim()) {
        errors.push("三级分组名称不能为空");
        continue;
      }
      const groupKey = deriveL3GroupKey(row.label.trim());
      if (usedGroupKeys.has(groupKey)) errors.push(`三级分组「${row.label.trim()}」分组键重复`);
      if (occupiedGroupKeys.has(groupKey)) errors.push(`分组键 ${groupKey} 在该二级下已存在`);
      usedGroupKeys.add(groupKey);

      const path = row.routeId
        ? getNavRouteRegistryEntry(row.routeId)?.path
        : row.routePath.trim();
      if (!path) {
        errors.push(`三级「${row.label}」须选择或填写路由`);
        continue;
      }
      if (occupiedRoutes.has(path)) errors.push(`路由 ${path} 已被占用`);
      if (usedPaths.has(path)) errors.push(`路由 ${path} 在表单内重复`);
      usedPaths.add(path);
    }
  }

  if (normalized.childMode === "manual-l2") {
    const groupKey = deriveL3GroupKey(state.label.trim());
    if (!groupKey) errors.push("请填写有效的三级分组名称");
    if (occupiedGroupKeys.has(groupKey)) errors.push(`分组键 ${groupKey} 在该二级下已存在`);
  }

  if (hasSettingsHubInState(state) && state.selectedSeqs.length) {
    const draft = getNavBlueprintDraft(state.blueprintId);
    for (const seq of state.selectedSeqs) {
      if (draft.customSeqAssignments[seq]) {
        errors.push(`设置项 seq ${seq} 已归属到其他三级分组`);
      }
    }
  }

  return errors;
}

function validateAddL2State(state: AddL1DialogState): string[] {
  const errors: string[] = [];
  if (!state.label.trim()) errors.push("请填写二级导航名称");
  if (state.label.trim().length > 32) errors.push("二级导航名称不超过 32 字");

  const normalized = normalizeDialogState(state);
  const hasRoute = Boolean(state.selectedRouteId || state.manualL1Route.trim());
  const syncedL2 = syncFeatureRows(state);

  if (normalized.childMode === "page") {
    if (!hasRoute) errors.push("请选择要挂载的页面");
  } else if (normalized.childMode === "features") {
    if (normalized.presetItemKeys.length === 0) errors.push("请至少选择一项功能/设置");
  }

  const occupied = getOccupiedRoutesFromBlueprint(state.blueprintId);
  const usedPaths = new Set<string>();

  if (normalized.childMode === "page") {
    try {
      const path = resolveL2PagePath(state);
      if (occupied.has(path)) errors.push(`路由 ${path} 已被占用`);
      usedPaths.add(path);
    } catch {
      /* handled above */
    }
  }

  const l2Labels = new Set<string>();
  if (normalized.childMode === "features") {
    for (const row of syncedL2) {
      if (!row.label.trim() && !row.routePath.trim() && !row.routeId) continue;
      if (!row.label.trim()) {
        errors.push("二级导航名称不能为空");
        continue;
      }
      if (l2Labels.has(row.label.trim())) errors.push(`二级导航「${row.label.trim()}」名称重复`);
      l2Labels.add(row.label.trim());

      const path = row.routeId
        ? getNavRouteRegistryEntry(row.routeId)?.path
        : row.routePath.trim();
      if (!path) {
        errors.push(`二级「${row.label}」须选择或填写路由`);
        continue;
      }
      if (occupied.has(path)) errors.push(`路由 ${path} 已被占用`);
      if (usedPaths.has(path)) errors.push(`路由 ${path} 在表单内重复`);
      usedPaths.add(path);
    }
  }

  if (hasSettingsHubInState(state) && state.selectedSeqs.length) {
    const draft = getNavBlueprintDraft(state.blueprintId);
    for (const seq of state.selectedSeqs) {
      if (draft.customSeqAssignments[seq]) {
        errors.push(`设置项 seq ${seq} 已归属到其他三级分组`);
      }
    }
  }

  return errors;
}

function validateAddL1State(state: AddL1DialogState): string[] {
  const errors: string[] = [];
  if (!state.label.trim()) errors.push("请填写一级导航名称");
  if (state.label.trim().length > 32) errors.push("一级导航名称不超过 32 字");

  const normalized = normalizeDialogState(state);
  const hasRoute = Boolean(state.selectedRouteId || state.manualL1Route.trim());
  const syncedL2 = syncFeatureRows(state);

  if (normalized.childMode === "page") {
    if (!hasRoute) errors.push("请选择要挂载的页面");
  } else if (normalized.childMode === "features") {
    if (normalized.presetItemKeys.length === 0) errors.push("请至少选择一项功能/设置");
  }

  const occupied = getOccupiedRoutesForState(state);
  const usedPaths = new Set<string>();

  try {
    const { route } = resolveL1Route(state);
    if (occupied.has(route)) errors.push(`一级路由 ${route} 已被占用`);
    usedPaths.add(route);
  } catch {
    /* handled above */
  }

  const l2Labels = new Set<string>();
  if (normalized.childMode === "features") {
    for (const row of syncedL2) {
      if (!row.label.trim() && !row.routePath.trim() && !row.routeId) continue;
      if (!row.label.trim()) {
        errors.push("二级导航名称不能为空");
        continue;
      }
      if (l2Labels.has(row.label.trim())) errors.push(`二级导航「${row.label.trim()}」名称重复`);
      l2Labels.add(row.label.trim());

      const path = row.routeId
        ? getNavRouteRegistryEntry(row.routeId)?.path
        : row.routePath.trim();
      if (!path) {
        errors.push(`二级「${row.label}」须选择或填写路由`);
        continue;
      }
      if (occupied.has(path)) errors.push(`路由 ${path} 已被占用`);
      if (usedPaths.has(path)) errors.push(`路由 ${path} 在表单内重复`);
      usedPaths.add(path);
    }
  }

  if (hasSettingsHubInState(state) && state.selectedSeqs.length) {
    const draft = getNavBlueprintDraft(state.blueprintId);
    const ownL3Keys = state.editL1Id
      ? getEditingL1SettingsL3Keys(state.blueprintId, state.editL1Id)
      : new Set<string>();
    for (const seq of state.selectedSeqs) {
      const assigned = draft.customSeqAssignments[seq];
      if (assigned && !ownL3Keys.has(assigned)) {
        errors.push(`设置项 seq ${seq} 已归属到其他三级分组`);
      }
    }
  }

  return errors;
}

function renderContextBreadcrumb(state: AddL1DialogState): string {
  if (isAddL3Mode(state) && state.parentL2Label) {
    const l1 = state.parentL1Label ?? "—";
    return `${l1} / ${state.parentL2Label}`;
  }
  if (isAddL2Mode(state) && state.parentL1Label) {
    return state.parentL1Label;
  }
  return "";
}

function renderFooterSummaryContent(state: AddL1DialogState): string {
  const label = state.label.trim();
  const namePart = label ? `「${label}」` : "未命名导航";
  if (state.childMode === "page") {
    const manual = state.manualL1Route.trim();
    const selected = state.selectedRouteId ? getNavRouteRegistryEntry(state.selectedRouteId) : undefined;
    const path = manual || selected?.path || "";
    const title = manual ? "自定义路径" : selected?.title;
    if (path) {
      return `${namePart} → ${title ? `${title} · ` : ""}<span class="font-mono">${escapeHtml(path)}</span>`;
    }
    return `${namePart} · 请选择挂载页面`;
  }
  if (state.childMode === "features") {
    return `${namePart} · 已选 <strong class="text-card-foreground">${state.presetItemKeys.length}</strong> 项功能/设置`;
  }
  return `${namePart} · 手动配置子导航`;
}

function renderSelectedPageChip(state: AddL1DialogState): string {
  if (state.manualL1Route.trim()) {
    return `<span class="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"><span class="truncate font-mono">${escapeHtml(state.manualL1Route.trim())}</span><span class="shrink-0 opacity-70">手动</span></span>`;
  }
  const entry = state.selectedRouteId ? getNavRouteRegistryEntry(state.selectedRouteId) : undefined;
  if (entry) {
    return `<span class="inline-flex max-w-full flex-col gap-0.5 truncate rounded-lg bg-primary/10 px-2.5 py-1 text-xs"><span class="truncate font-medium text-primary">${escapeHtml(entry.title)}</span><span class="truncate font-mono text-[11px] text-primary/70">${escapeHtml(entry.path)}</span></span>`;
  }
  return `<span class="text-xs text-muted-foreground">尚未选择</span>`;
}

function renderConfigModeCard(
  value: L1ChildMode,
  active: L1ChildMode,
  title: string,
  description: string,
): string {
  const checked = active === value;
  return `<label class="relative flex cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2.5 transition-all ${
    checked
      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
      : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
  }">
    <input type="radio" name="nb-l1-child-mode" value="${value}" class="sr-only" ${checked ? "checked" : ""} />
    <span class="text-sm font-medium text-card-foreground">${escapeHtml(title)}</span>
    <span class="text-xs leading-snug text-muted-foreground">${escapeHtml(description)}</span>
  </label>`;
}

function updateDialogSummary(): void {
  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog || !dialogState) return;
  const summary = dialog.querySelector("[data-nb-dialog-summary]");
  if (summary) summary.innerHTML = renderFooterSummaryContent(dialogState);
  const chip = dialog.querySelector("[data-nb-selected-page-chip]");
  if (chip) chip.innerHTML = renderSelectedPageChip(dialogState);
  const countEl = dialog.querySelector("[data-nb-preset-selected-count]");
  if (countEl) countEl.textContent = String(dialogState.presetItemKeys.length);
}

function refreshPickerContent(): void {
  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog || !dialogState) return;

  const active = document.activeElement;
  const activeInput =
    active instanceof HTMLInputElement && dialog.contains(active) ? active : null;
  const selStart = activeInput?.selectionStart ?? null;
  const selEnd = activeInput?.selectionEnd ?? null;

  syncDialogStateFromDom(dialog);
  dialogState = { ...normalizeDialogState(dialogState), l2Rows: syncFeatureRows(dialogState) };

  const state = dialogState;

  if (state.childMode === "page") {
    const routeList = dialog.querySelector("[data-nb-route-list]");
    if (routeList) {
      const searching = Boolean(state.routeSearch.trim());
      routeList.innerHTML = searching
        ? renderFilteredRoutes(state)
        : renderRouteOptions(state.selectedRouteId, false, state.routeGroupFilter);
    }
    const routeGroups = dialog.querySelector("[data-nb-route-groups]");
    if (routeGroups) {
      const grouped = groupNavRouteEntries(searchNavRouteRegistry("", false));
      routeGroups.innerHTML = renderRouteGroupNav(grouped, state.routeGroupFilter);
    }
  }

  if (state.childMode === "features") {
    const presetList = dialog.querySelector("[data-nb-preset-item-list]");
    if (presetList) {
      const searching = Boolean(state.presetItemSearch.trim());
      presetList.innerHTML = searching
        ? renderPresetItems(state, "select", "")
        : renderPresetItems(state, "select", state.presetGroupFilter);
    }
    const presetGroups = dialog.querySelector("[data-nb-preset-groups]");
    if (presetGroups) {
      const grouped = groupNavPresetItemEntries(searchNavPresetItemRegistry(""));
      presetGroups.innerHTML = renderPresetGroupNav(grouped, state.presetGroupFilter);
    }
  }

  if (hasSettingsHubInState(state)) {
    const settingList = dialog.querySelector("[data-nb-setting-list]");
    if (settingList) {
      settingList.innerHTML = renderSettingsListBody(state);
    }
  }

  updateDialogSummary();

  if (activeInput && document.contains(activeInput)) {
    activeInput.focus();
    if (selStart != null && selEnd != null) {
      try {
        activeInput.setSelectionRange(selStart, selEnd);
      } catch {
        /* ignore */
      }
    }
  }
}

function schedulePickerRefresh(): void {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null;
    refreshPickerContent();
  }, 100);
}

function renderGroupNavButton(
  groupKey: string,
  label: string,
  activeGroup: string,
  dataAttr: "data-nb-route-group" | "data-nb-preset-group",
  count?: number,
): string {
  const isActive = activeGroup === groupKey;
  const countMark = count != null ? ` (${count})` : "";
  return `<button
    type="button"
    ${dataAttr}="${escapeHtml(groupKey)}"
    class="w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
      isActive
        ? "bg-primary/10 font-medium text-primary"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }"
  >${escapeHtml(label)}${countMark}</button>`;
}

function renderRouteGroupNav(grouped: Map<string, NavRouteRegistryEntry[]>, activeGroup: string): string {
  const total = [...grouped.values()].reduce((sum, items) => sum + items.length, 0);
  const allBtn = renderGroupNavButton("", "全部", activeGroup, "data-nb-route-group", total);
  const groupBtns = [...grouped.entries()]
    .map(([title, items]) => renderGroupNavButton(title, title, activeGroup, "data-nb-route-group", items.length))
    .join("");
  return `<nav class="flex flex-col gap-0.5">${allBtn}${groupBtns}</nav>`;
}

function renderPresetGroupNav<T>(grouped: Map<string, T[]>, activeGroup: string): string {
  const total = [...grouped.values()].reduce((sum, items) => sum + items.length, 0);
  const allBtn = renderGroupNavButton("", "全部", activeGroup, "data-nb-preset-group", total);
  const groupBtns = [...grouped.entries()]
    .map(([title, items]) => renderGroupNavButton(title, title, activeGroup, "data-nb-preset-group", items.length))
    .join("");
  return `<nav class="flex flex-col gap-0.5">${allBtn}${groupBtns}</nav>`;
}

function filterGroupedEntries<T>(grouped: Map<string, T[]>, groupFilter: string): [string, T[]][] {
  if (!groupFilter) return [...grouped.entries()];
  const items = grouped.get(groupFilter);
  return items ? [[groupFilter, items]] : [];
}

function renderRouteOptions(
  selectedId: string | null,
  includeLevel3: boolean,
  groupFilter: string,
): string {
  const routes = searchNavRouteRegistry("", includeLevel3);
  const occupied = dialogState ? getOccupiedRoutesForState(dialogState) : new Set();
  const grouped = groupNavRouteEntries(routes);

  return filterGroupedEntries(grouped, groupFilter)
    .map(([groupTitle, items]) => {
      const rows = items
        .map((e) => {
          const occupiedMark = occupied.has(e.path) ? " · 已占用" : "";
          const levelMark = e.level === 3 ? "L3" : e.level === 2 ? "L2" : "L1";
          return `<label class="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 bg-card px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-sm">
            <input type="radio" name="nb-l1-route" value="${escapeHtml(e.id)}" class="mt-0.5 shrink-0" ${selectedId === e.id ? "checked" : ""} />
            <span class="min-w-0 flex-1 text-sm">
              <span class="text-card-foreground">${escapeHtml(e.title)}</span>
              <span class="ml-1 text-xs text-muted-foreground">${escapeHtml(levelMark)}${escapeHtml(occupiedMark)}</span>
              <span class="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">${escapeHtml(e.path)}</span>
            </span>
          </label>`;
        })
        .join("");
      const showGroupTitle = !groupFilter && grouped.size > 1;
      return `<div class="mb-3">
        ${showGroupTitle ? `<p class="mb-1.5 px-0.5 text-xs font-medium text-muted-foreground">${escapeHtml(groupTitle)}</p>` : ""}
        <div class="grid gap-1.5 sm:grid-cols-2">${rows}</div>
      </div>`;
    })
    .join("");
}

function renderFilteredRoutes(state: AddL1DialogState): string {
  const routes = searchNavRouteRegistry(state.routeSearch, false);
  const occupied = getOccupiedRoutesForState(state);
  if (!routes.length) {
    return `<p class="px-2 py-4 text-sm text-muted-foreground">无匹配路由</p>`;
  }
  const grouped = groupNavRouteEntries(routes);
  return [...grouped.entries()]
    .map(([groupTitle, items]) => {
      const rows = items
        .map((e) => {
          const occupiedMark = occupied.has(e.path) ? " · 已占用" : "";
          return `<label class="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 bg-card px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:shadow-sm">
            <input type="radio" name="nb-l1-route" value="${escapeHtml(e.id)}" class="mt-0.5 shrink-0" ${state.selectedRouteId === e.id ? "checked" : ""} />
            <span class="min-w-0 flex-1 text-sm">
              <span class="text-card-foreground">${escapeHtml(e.title)}</span>
              <span class="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">${escapeHtml(e.path)}${escapeHtml(occupiedMark)}</span>
            </span>
          </label>`;
        })
        .join("");
      return `<div class="mb-3">
        <p class="mb-1.5 px-0.5 text-xs font-medium text-muted-foreground">${escapeHtml(groupTitle)}</p>
        <div class="grid gap-1.5 sm:grid-cols-2">${rows}</div>
      </div>`;
    })
    .join("");
}

function renderRoutePickerSection(state: AddL1DialogState): string {
  const searching = Boolean(state.routeSearch.trim());
  const allRoutes = searchNavRouteRegistry("", false);
  const grouped = groupNavRouteEntries(allRoutes);
  const listContent = searching
    ? renderFilteredRoutes(state)
    : renderRouteOptions(state.selectedRouteId, false, state.routeGroupFilter);

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2">
        <span class="text-xs font-medium text-muted-foreground">当前选择</span>
        <div class="min-w-0 flex-1" data-nb-selected-page-chip>${renderSelectedPageChip(state)}</div>
      </div>
      <div class="grid min-h-0 flex-1 gap-3 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <aside class="${searching ? "hidden lg:flex lg:flex-col lg:opacity-60" : "flex flex-col"} min-h-0 overflow-hidden rounded-lg border border-border bg-muted/10">
          <div class="shrink-0 border-b border-border/60 px-2.5 py-2">
            <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">页面分组</p>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-2" data-nb-route-groups>
            ${renderRouteGroupNav(grouped, state.routeGroupFilter)}
          </div>
        </aside>
        <div class="flex min-h-0 flex-col gap-2">
          <div class="relative shrink-0">
            <input type="search" class="${INPUT_CLASS} pl-3" data-nb-route-search value="${escapeHtml(state.routeSearch)}" placeholder="搜索页面名称或路径…" />
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-2" data-nb-route-list>
            ${listContent || `<p class="px-2 py-6 text-center text-sm text-muted-foreground">暂无页面</p>`}
          </div>
          <details class="shrink-0 rounded-lg border border-dashed border-border/80 bg-muted/10 px-3 py-2">
            <summary class="cursor-pointer select-none text-xs font-medium text-muted-foreground">高级：手动输入路径</summary>
            <label class="mt-2 block">
              <input type="text" class="${INPUT_CLASS} font-mono text-xs" data-nb-l1-manual-route value="${escapeHtml(state.manualL1Route)}" placeholder="/module/page" />
            </label>
            <p class="mt-1.5 text-[11px] text-muted-foreground">填写后将覆盖上方所选页面</p>
          </details>
        </div>
      </div>
    </div>`;
}

function renderConfigModeSection(state: AddL1DialogState): string {
  const isPage = state.childMode === "page";
  const isFeatures = state.childMode === "features";
  const isManualL2 = state.childMode === "manual-l2";
  const addingL2 = isAddL2Mode(state);
  const addingL3 = isAddL3Mode(state);
  const manualModeLabel = addingL3 ? "手动配置四级设置项" : addingL2 ? "手动配置三级导航" : "手动配置二级导航";

  const pageBlock = `
    <div class="${isPage ? "flex min-h-0 flex-1 flex-col" : "hidden"}" data-nb-l1-page-panel>
      ${renderRoutePickerSection(state)}
    </div>`;

  const featuresBlock = `
    <div class="${isFeatures ? "flex min-h-0 flex-1 flex-col" : "hidden"}" data-nb-l1-features-panel>
      ${renderPresetItemsPicker(state)}
    </div>`;

  const manualL2Block = `
    <div class="${isManualL2 ? "" : "hidden"} rounded-lg border border-dashed border-border bg-muted/10 px-4 py-8 text-center" data-nb-l1-manual-l2-panel>
      <p class="text-sm text-muted-foreground">${escapeHtml(manualModeLabel)}</p>
      <p class="mt-1 text-xs text-muted-foreground">保存后可在导航树中继续编辑子级结构</p>
    </div>`;

  const pageModeTitle = addingL3 ? "直达页面" : addingL2 ? "直达页面" : "直达页面";
  const pageModeDesc = addingL3
    ? "三级直达，无四级子项"
    : addingL2
      ? "二级直达，无三级子导航"
      : "一级直达，无二级子导航";
  const featuresModeDesc = addingL2 ? "勾选后将生成二级导航" : "勾选后将生成二级导航";
  const manualModeDesc = addingL3 ? "手动勾选四级设置项" : addingL2 ? "手动添加三级子项" : "手动添加二级子项";
  const pickerPanel = isPage ? pageBlock : isFeatures ? featuresBlock : "";

  const modeCards = `
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      ${renderConfigModeCard("page", state.childMode, pageModeTitle, pageModeDesc)}
      ${renderConfigModeCard("features", state.childMode, "功能/设置", featuresModeDesc)}
      ${renderConfigModeCard("manual-l2", state.childMode, "手动配置", manualModeDesc)}
    </div>`;

  const pickerShell =
    isPage || isFeatures
      ? `<div class="mt-3 flex min-h-[min(42vh,22rem)] flex-1 flex-col overflow-hidden rounded-xl border border-border bg-muted/5 p-3 lg:min-h-[min(48vh,26rem)]">
        ${pickerPanel}
      </div>`
      : `<div class="mt-3">${manualL2Block}</div>`;

  return `
    <section class="${isPage || isFeatures ? "flex min-h-0 flex-1 flex-col" : ""}">
      <div class="shrink-0">
        <h3 class="text-sm font-semibold text-card-foreground">挂载方式</h3>
        <div class="mt-2">${modeCards}</div>
      </div>
      ${pickerShell}
    </section>`;
}

function renderPresetItemDescription(description?: string): string {
  const text = description?.trim() || "暂无功能描述";
  return `<p class="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-3" title="${escapeHtml(text)}">${escapeHtml(text)}</p>`;
}

function renderPresetItemsPicker(state: AddL1DialogState): string {
  const searching = Boolean(state.presetItemSearch.trim());
  const allItems = searchNavPresetItemRegistry("");
  const grouped = groupNavPresetItemEntries(allItems);
  const listContent = searching
    ? renderPresetItems(state, "select", "")
    : renderPresetItems(state, "select", state.presetGroupFilter);

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-border/70 bg-card px-3 py-2">
        <span class="text-xs font-medium text-muted-foreground">已选功能</span>
        <span class="text-xs text-muted-foreground">共 <strong class="text-card-foreground" data-nb-preset-selected-count>${state.presetItemKeys.length}</strong> 项</span>
      </div>
      <div class="grid min-h-0 flex-1 gap-3 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <aside class="${searching ? "hidden lg:flex lg:flex-col lg:opacity-60" : "flex flex-col"} min-h-0 overflow-hidden rounded-lg border border-border bg-muted/10">
          <div class="shrink-0 border-b border-border/60 px-2.5 py-2">
            <p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">功能分组</p>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-2" data-nb-preset-groups>
            ${renderPresetGroupNav(grouped, state.presetGroupFilter)}
          </div>
        </aside>
        <div class="flex min-h-0 flex-col gap-2">
          <input type="search" class="${INPUT_CLASS}" data-nb-preset-item-search value="${escapeHtml(state.presetItemSearch)}" placeholder="搜索名称、模块、路径或 seq…" />
          <div class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background p-2" data-nb-preset-item-list>
            ${listContent || `<p class="px-2 py-6 text-center text-sm text-muted-foreground">无匹配项</p>`}
          </div>
        </div>
      </div>
    </div>`;
}

function renderPresetItems(state: AddL1DialogState, mode: "select" | "readonly", groupFilter = ""): string {
  const items = searchNavPresetItemRegistry(state.presetItemSearch);
  const grouped = groupNavPresetItemEntries(items);
  const selected = new Set(state.presetItemKeys);

  if (!items.length) {
    return `<p class="px-2 py-4 text-sm text-muted-foreground">无匹配项</p>`;
  }

  return filterGroupedEntries(grouped, groupFilter)
    .map(([groupTitle, groupItems]) => {
      const rows = groupItems
        .map((item) => {
          const seqMark =
            item.seq != null
              ? `<span class="ml-1 font-mono text-xs text-muted-foreground">seq ${item.seq}</span>`
              : "";
          const titleLine = `<span class="font-medium text-card-foreground">${escapeHtml(item.title)}</span>${seqMark}`;
          const descLine = renderPresetItemDescription(item.description);
          const pathLine = `<span class="mt-0.5 block font-mono text-[11px] text-muted-foreground/80 truncate" title="${escapeHtml(item.landingPath)}">${escapeHtml(item.landingPath)}</span>`;
          const body = `<span class="min-w-0 flex-1">${titleLine}${descLine}${pathLine}</span>`;

          if (mode === "readonly") {
            return `<div class="rounded-md px-2 py-2 text-sm">${body}</div>`;
          }
          const checked = selected.has(item.key) ? "checked" : "";
          return `<label class="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 bg-card px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5" onclick="event.stopPropagation()">
            <input type="checkbox" class="mt-0.5 shrink-0" data-nb-preset-item value="${escapeHtml(item.key)}" ${checked} onclick="event.stopPropagation()" />
            ${body}
          </label>`;
        })
        .join("");
      const showGroupTitle = !groupFilter && grouped.size > 1;
      return `<div class="mb-3">
        ${showGroupTitle ? `<p class="mb-1.5 px-0.5 text-xs font-medium text-muted-foreground">${escapeHtml(groupTitle)}</p>` : ""}
        <div class="grid gap-1.5 lg:grid-cols-2">${rows}</div>
      </div>`;
    })
    .join("");
}

function hasSettingsHubInState(state: AddL1DialogState): boolean {
  if (isAddL3Mode(state)) {
    return state.childMode === "manual-l2";
  }
  if (state.childMode !== "manual-l2") return false;
  return syncFeatureRows(state).some((r) => r.isSettingsHub);
}

function applyChildModeSwitch(state: AddL1DialogState, prevMode: L1ChildMode): AddL1DialogState {
  if (state.childMode === prevMode) return state;
  if (state.childMode === "page") {
    return {
      ...state,
      presetItemKeys: [],
      settingsHubEnabled: false,
      l2Rows: [],
      selectedSeqs: [],
      presetGroupFilter: "",
    };
  }
  if (state.childMode === "features") {
    return {
      ...state,
      selectedRouteId: null,
      manualL1Route: "",
      settingsHubEnabled: false,
      l2Rows: [],
      selectedSeqs: [],
      routeGroupFilter: "",
    };
  }
  if (state.childMode === "manual-l2") {
    return {
      ...state,
      presetItemKeys: [],
      selectedRouteId: null,
      manualL1Route: "",
      selectedSeqs: [],
      settingsHubEnabled: false,
      routeGroupFilter: "",
      presetGroupFilter: "",
      l2Rows: state.l2Rows.filter((r) => !r.fromPresetItemKey),
    };
  }
  return state;
}

function renderSettingsListBody(state: AddL1DialogState): string {
  const draft = getNavBlueprintDraft(state.blueprintId);
  const pathFilter = resolveSettingsPathFilter(state);
  const entries = searchNavSettingRegistry(state.settingSearch, draft.customSeqAssignments, pathFilter);
  const selected = new Set(state.selectedSeqs);
  const grouped = groupNavSettingEntries(entries);

  if (entries.length === 0) {
    return `<p class="px-2 py-6 text-center text-sm text-muted-foreground">无匹配设置项</p>`;
  }

  return [...grouped.entries()]
    .map(([groupTitle, items]) => {
      const rows = items
        .map((e) => {
          const checked = selected.has(e.seq) ? "checked" : "";
          const assigned = e.assignedL3Key ? " · 已归属" : "";
          return `<label class="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:border-border hover:bg-muted/30" onclick="event.stopPropagation()">
            <input type="checkbox" class="mt-0.5 shrink-0" data-nb-setting-seq value="${e.seq}" ${checked} onclick="event.stopPropagation()" />
            <span class="min-w-0 text-sm">
              <span class="text-card-foreground">${escapeHtml(e.title)}</span>
              <span class="ml-1 font-mono text-xs text-muted-foreground">seq ${e.seq}${escapeHtml(assigned)}</span>
              <span class="block truncate text-xs text-muted-foreground">${escapeHtml(e.moduleName)}</span>
            </span>
          </label>`;
        })
        .join("");
      return `<div class="mb-3">
        <p class="mb-1 text-xs font-medium text-muted-foreground">${escapeHtml(groupTitle)}</p>
        <div class="space-y-0.5">${rows}</div>
      </div>`;
    })
    .join("");
}

function renderSettingsPicker(state: AddL1DialogState): string {
  if (!hasSettingsHubInState(state)) return "";

  const hubPath = resolveSettingsHubPath(state);
  const addingL3 = isAddL3Mode(state);
  const pathFilter = resolveSettingsPathFilter(state);
  const filterHint = pathFilter
    ? `仅展示与设置路径 ${pathFilter} 匹配的项`
    : hubPath
      ? `自定义路径 ${hubPath} 无目录匹配，展示全部设置项`
      : addingL3
        ? "勾选设置项后将归属到该三级分组"
        : "勾选设置项后将自动创建三级分组";

  return `
    <section class="shrink-0 rounded-xl border border-border bg-muted/5 p-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-card-foreground">设置项</h3>
        <span class="text-xs text-muted-foreground">已选 ${state.selectedSeqs.length} 项</span>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(filterHint)}</p>
      <input type="search" class="${INPUT_CLASS} mt-3 mb-2" data-nb-setting-search value="${escapeHtml(state.settingSearch)}" placeholder="搜索 seq / 名称 / 模块…" />
      <div class="max-h-44 overflow-y-auto rounded-lg border border-border bg-background p-2" data-nb-setting-list>
        ${renderSettingsListBody(state)}
      </div>
    </section>`;
}

function renderBasicInfoSection(state: AddL1DialogState): string {
  const addingL2 = isAddL2Mode(state);
  const addingL3 = isAddL3Mode(state);
  const nameLabel = addingL3 ? "分组名称" : addingL2 ? "导航名称" : "导航名称";
  const placeholder = addingL3 ? "如：员工端" : addingL2 ? "如：订单管理" : "如：运营中心";
  return `
    <section class="shrink-0 rounded-xl border border-border bg-muted/10 p-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">${nameLabel} <span class="text-destructive">*</span></span>
          <input type="text" class="${INPUT_CLASS}" data-nb-l1-label value="${escapeHtml(state.label)}" maxlength="32" placeholder="${escapeHtml(placeholder)}" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block text-xs font-medium text-muted-foreground">英文名称</span>
          <input type="text" class="${INPUT_CLASS}" data-nb-l1-label-en value="${escapeHtml(state.labelEn)}" placeholder="Ops Center" />
        </label>
      </div>
    </section>`;
}

function renderDialogBody(state: AddL1DialogState): string {
  const stateWithL2 = { ...state, l2Rows: syncFeatureRows(state) };
  const useFlexPicker = state.childMode === "page" || state.childMode === "features";
  return `
    <div class="${useFlexPicker ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "space-y-4"}">
      ${renderBasicInfoSection(state)}
      ${renderConfigModeSection(stateWithL2)}
      ${renderSettingsPicker(stateWithL2)}
    </div>`;
}

function renderDialog(state: AddL1DialogState, errors: string[] = []): string {
  const editing = isEditMode(state);
  const addingL2 = isAddL2Mode(state);
  const addingL3 = isAddL3Mode(state);

  const title = addingL3
    ? "新增三级分组"
    : addingL2
      ? "新增二级导航"
      : editing
        ? "编辑一级导航"
        : "新增一级导航";
  const subtitle =
    editing && !addingL2 && !addingL3
      ? "修改名称、挂载方式及挂载内容"
      : "";
  const breadcrumb = renderContextBreadcrumb(state);
  const submitLabel = addingL3
    ? "创建三级分组"
    : addingL2
      ? "创建二级导航"
      : editing
        ? "保存"
        : "创建一级导航";
  const footerHint = errors.length
    ? escapeHtml(errors.join("；"))
    : `<span data-nb-dialog-summary>${renderFooterSummaryContent(state)}</span>`;

  const widePicker = state.childMode === "page" || state.childMode === "features";
  const dialogWidth = widePicker ? "max-w-6xl" : "max-w-3xl";
  const dialogHeight = widePicker ? "max-h-[min(92dvh,52rem)]" : "max-h-[min(92dvh,44rem)]";

  return `
    <div
      id="${DIALOG_ID}"
      class="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nb-add-l1-title"
      tabindex="-1"
      data-blueprint-id="${escapeHtml(state.blueprintId)}"
      ${state.editL1Id ? `data-edit-l1-id="${escapeHtml(state.editL1Id)}"` : ""}
      ${state.addL2UnderL1Id ? `data-add-l2-under-l1="${escapeHtml(state.addL2UnderL1Id)}"` : ""}
      ${state.addL3UnderL2Id ? `data-add-l3-under-l2="${escapeHtml(state.addL3UnderL2Id)}"` : ""}
    >
      <button type="button" class="absolute inset-0 bg-black/40 backdrop-blur-[1px]" data-nb-add-l1-backdrop aria-label="关闭"></button>
      <div class="relative z-[1] flex ${dialogHeight} w-full ${dialogWidth} min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="min-w-0">
            <h2 id="nb-add-l1-title" class="text-base font-semibold text-card-foreground">${title}</h2>
            ${
              breadcrumb
                ? `<p class="mt-0.5 text-xs text-muted-foreground"><span class="text-muted-foreground/80">挂载位置</span> ${escapeHtml(breadcrumb)}</p>`
                : subtitle
                  ? `<p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(subtitle)}</p>`
                  : ""
            }
          </div>
          <button type="button" data-nb-add-l1-close class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label="关闭">✕</button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          ${renderDialogBody(state)}
        </div>

        <div class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p class="min-w-0 flex-1 text-xs ${errors.length ? "text-destructive" : "text-muted-foreground"}">
            ${footerHint}
          </p>
          <div class="flex gap-2">
            <button type="button" data-nb-add-l1-cancel class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">取消</button>
            <button type="button" data-nb-add-l1-submit class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">${submitLabel}</button>
          </div>
        </div>
      </div>
    </div>`;
}

function removeDialogFromDom(): void {
  document.getElementById(DIALOG_ID)?.remove();
  dialogState = null;
}

function closeDialog(): void {
  removeDialogFromDom();
  onMountCallback = null;
}

function mountDialog(state: AddL1DialogState, errors: string[] = []): void {
  removeDialogFromDom();
  const normalized = normalizeDialogState(state);
  dialogState = { ...normalized, l2Rows: syncFeatureRows(normalized) };
  const host = document.createElement("div");
  host.innerHTML = renderDialog(dialogState, errors);
  const dialog = host.firstElementChild as HTMLElement;
  document.body.appendChild(dialog);
  dialog.focus({ preventScroll: true });
}

function syncDialogStateFromDom(dialog: HTMLElement): void {
  const next = readStateFromDom(dialog);
  dialogState = { ...next, l2Rows: syncFeatureRows(next) };
}

function refreshDialog(errors: string[] = []): void {
  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog || !dialogState) return;
  const prevMode = dialogState.childMode;
  let next = readStateFromDom(dialog);
  next = applyChildModeSwitch(next, prevMode);
  next = normalizeDialogState(next);
  next.l2Rows = syncFeatureRows(next);
  mountDialog(next, errors);
}

function submitAddL2Dialog(state: AddL1DialogState): void {
  const parentL1Id = state.addL2UnderL1Id!;
  const labelEn = state.labelEn.trim() || undefined;
  const mode = state.childMode;

  if (mode === "page") {
    createNavBlueprintL2UnderL1(state.blueprintId, parentL1Id, {
      label: state.label.trim(),
      labelEn,
      route: resolveL2PagePath(state),
      isSettingsHub: false,
      l2MountKind: "page",
    });
    return;
  }

  if (mode === "features") {
    for (const row of syncFeatureRows(state)) {
      if (!row.label.trim()) continue;
      const path = row.routeId
        ? getNavRouteRegistryEntry(row.routeId)?.path ?? row.routePath.trim()
        : row.routePath.trim();
      if (!path) continue;
      createNavBlueprintL2UnderL1(state.blueprintId, parentL1Id, {
        label: row.label.trim(),
        route: path,
        isSettingsHub: false,
        l2MountKind: "features",
      });
    }
    return;
  }

  const hubPath = resolveSettingsHubPath(state);
  const isHub = hasSettingsHubInState(state);
  createNavBlueprintL2UnderL1(state.blueprintId, parentL1Id, {
    label: state.label.trim(),
    labelEn,
    route: isHub && hubPath ? hubPath : `/custom/l2-${Date.now()}`,
    isSettingsHub: isHub,
    settingsPath: isHub && hubPath ? hubPath : undefined,
    settingsSeqs: isHub && state.selectedSeqs.length ? state.selectedSeqs : undefined,
    l2MountKind: isHub ? "features" : "manual-l3",
  });
}

function submitAddL3Dialog(state: AddL1DialogState): void {
  const parentL2Key = state.addL3UnderL2Id!;
  const settingsPath = state.parentL2SettingsPath?.trim() || "";
  const labelEn = state.labelEn.trim() || undefined;
  const mode = state.childMode;

  if (mode === "page") {
    const path = resolveL2PagePath(state);
    createNavBlueprintL3UnderL2(state.blueprintId, parentL2Key, {
      label: state.label.trim(),
      labelEn,
      groupKey: deriveL3GroupKey(state.label.trim()),
      settingsPath,
      route: path,
      l3MountKind: "page",
    });
    return;
  }

  if (mode === "features") {
    for (const row of syncFeatureRows(state)) {
      if (!row.label.trim()) continue;
      const path = row.routeId
        ? getNavRouteRegistryEntry(row.routeId)?.path ?? row.routePath.trim()
        : row.routePath.trim();
      if (!path) continue;
      const item = row.fromPresetItemKey ? getNavPresetItemRegistryEntry(row.fromPresetItemKey) : undefined;
      createNavBlueprintL3UnderL2(state.blueprintId, parentL2Key, {
        label: row.label.trim(),
        groupKey: item?.groupKey ?? deriveL3GroupKey(row.label.trim()),
        settingsPath,
        route: path,
        l3MountKind: "features",
        settingsSeqs: item?.seq != null ? [item.seq] : undefined,
      });
    }
    return;
  }

  createNavBlueprintL3UnderL2(state.blueprintId, parentL2Key, {
    label: state.label.trim(),
    labelEn,
    groupKey: deriveL3GroupKey(state.label.trim()),
    settingsPath,
    l3MountKind: "manual-l4",
    settingsSeqs: state.selectedSeqs.length ? state.selectedSeqs : undefined,
  });
}

function submitDialog(): void {
  const dialog = document.getElementById(DIALOG_ID);
  if (!dialog || !dialogState) return;
  const state = normalizeDialogState(readStateFromDom(dialog));
  state.l2Rows = syncFeatureRows(state);
  state.selectedSeqs = [...dialog.querySelectorAll<HTMLInputElement>("[data-nb-setting-seq]:checked")].map(
    (el) => Number(el.value),
  );
  const errors = validateState(state);
  if (errors.length) {
    mountDialog(state, errors);
    return;
  }

  if (isAddL3Mode(state)) {
    submitAddL3Dialog(state);
    const refresh = onMountCallback;
    closeDialog();
    refresh?.();
    return;
  }

  if (isAddL2Mode(state)) {
    submitAddL2Dialog(state);
    const refresh = onMountCallback;
    closeDialog();
    refresh?.();
    return;
  }

  const { route, defaultChildRoute } = resolveL1Route(state);
  const l2Children: NavBlueprintL2CreateInput[] = [];

  for (const row of state.l2Rows) {
    if (!row.label.trim()) continue;
    const path = row.routeId
      ? getNavRouteRegistryEntry(row.routeId)?.path ?? row.routePath.trim()
      : row.routePath.trim();
    if (!path) continue;
    const l2MountKind =
      state.childMode === "features"
        ? ("features" as const)
        : row.isSettingsHub
          ? ("features" as const)
          : ("manual-l3" as const);
    l2Children.push({
      label: row.label.trim(),
      route: path,
      isSettingsHub: row.isSettingsHub,
      settingsPath: row.isSettingsHub ? path : undefined,
      l2MountKind,
    });
  }

  const payload = {
    label: state.label.trim(),
    labelEn: state.labelEn.trim() || undefined,
    route,
    defaultChildRoute,
    subNavPlacement: "sheet" as const,
    l1MountKind: state.childMode,
    l2Children,
    settingsSeqs: hasSettingsHubInState(state) && state.selectedSeqs.length ? state.selectedSeqs : undefined,
  };

  if (state.editL1Id) {
    updateNavBlueprintL1WithChildren(state.blueprintId, state.editL1Id, payload);
  } else {
    createNavBlueprintL1WithChildren(state.blueprintId, payload);
  }

  const refresh = onMountCallback;
  closeDialog();
  refresh?.();
}

let bound = false;

function bindDialogEvents(): void {
  if (bound) return;
  bound = true;

  document.body.addEventListener("click", (ev) => {
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog) return;
    const target = ev.target as HTMLElement;

    if (
      target.closest("[data-nb-add-l1-close]") ||
      target.closest("[data-nb-add-l1-cancel]") ||
      target.closest("[data-nb-add-l1-backdrop]")
    ) {
      if (dialogState) {
        const hasDraft =
          dialogState.editL1Id ||
          dialogState.addL2UnderL1Id ||
          dialogState.addL3UnderL2Id ||
          dialogState.label ||
          dialogState.presetItemKeys.length ||
          dialogState.l2Rows.some((r) => r.label.trim() || r.routePath.trim());
        if (hasDraft) {
          const msg = dialogState.editL1Id
            ? "放弃未保存的编辑？"
            : dialogState.addL3UnderL2Id
              ? "放弃未保存的新增三级分组？"
            : dialogState.addL2UnderL1Id
              ? "放弃未保存的新增二级导航？"
              : "放弃未保存的新增一级导航？";
          if (!window.confirm(msg)) return;
        }
      }
      closeDialog();
      return;
    }

    if (target.closest("[data-nb-add-l1-submit]")) {
      submitDialog();
      return;
    }

    if (target.closest("[data-nb-route-group]")) {
      if (!dialogState) return;
      const btn = target.closest("[data-nb-route-group]") as HTMLElement;
      syncDialogStateFromDom(dialog);
      dialogState.routeGroupFilter = btn.getAttribute("data-nb-route-group") ?? "";
      refreshPickerContent();
      return;
    }

    if (target.closest("[data-nb-preset-group]")) {
      if (!dialogState) return;
      const btn = target.closest("[data-nb-preset-group]") as HTMLElement;
      syncDialogStateFromDom(dialog);
      dialogState.presetGroupFilter = btn.getAttribute("data-nb-preset-group") ?? "";
      refreshPickerContent();
      return;
    }
  });

  document.body.addEventListener("change", (ev) => {
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog) return;
    const target = ev.target as HTMLElement;
    if (target.matches("[data-nb-preset-item]")) {
      syncDialogStateFromDom(dialog);
      updateDialogSummary();
      return;
    }
    if (target.matches("[data-nb-setting-seq]")) {
      syncDialogStateFromDom(dialog);
      updateDialogSummary();
      return;
    }
    if (target.matches("[name=nb-l1-child-mode]")) {
      refreshDialog();
      return;
    }
    if (target.matches("[name=nb-l1-route]")) {
      syncDialogStateFromDom(dialog);
      updateDialogSummary();
      return;
    }
  });

  document.body.addEventListener("input", (ev) => {
    const dialog = document.getElementById(DIALOG_ID);
    if (!dialog) return;
    const target = ev.target as HTMLElement;
    if (
      target.matches("[data-nb-route-search]") ||
      target.matches("[data-nb-preset-item-search]") ||
      target.matches("[data-nb-setting-search]")
    ) {
      schedulePickerRefresh();
      return;
    }
    if (target.matches("[data-nb-l1-label]") || target.matches("[data-nb-l1-manual-route]")) {
      syncDialogStateFromDom(dialog);
      updateDialogSummary();
    }
  });

  document.body.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && document.getElementById(DIALOG_ID)) {
      closeDialog();
    }
  });
}

export function openNavBlueprintAddL1Dialog(blueprintId: string, onMount: () => void): void {
  bindDialogEvents();
  onMountCallback = onMount;
  rowCounter = 0;
  buildNavRouteRegistry();
  buildNavPresetItemRegistry();
  getNavSettingRegistry();
  mountDialog(defaultState(blueprintId));
}

export function openNavBlueprintEditL1Dialog(
  blueprintId: string,
  l1NodeId: string,
  onMount: () => void,
): void {
  bindDialogEvents();
  onMountCallback = onMount;
  rowCounter = 0;
  buildNavRouteRegistry();
  buildNavPresetItemRegistry();
  getNavSettingRegistry();
  const editState = buildEditStateFromL1(blueprintId, l1NodeId);
  if (!editState) {
    window.alert("未找到该一级导航，可能已被删除");
    return;
  }
  mountDialog(editState);
}

export function openNavBlueprintAddL2Dialog(
  blueprintId: string,
  parentL1Key: string,
  onMount: () => void,
): void {
  const blocked = customL2CreationBlockedReason(blueprintId, parentL1Key);
  if (blocked) {
    window.alert(blocked);
    return;
  }
  bindDialogEvents();
  onMountCallback = onMount;
  rowCounter = 0;
  buildNavRouteRegistry();
  buildNavPresetItemRegistry();
  getNavSettingRegistry();
  const addL2State = buildAddL2State(blueprintId, parentL1Key);
  if (!addL2State) {
    window.alert("未找到该一级导航，可能已被删除");
    return;
  }
  mountDialog(addL2State);
}

export function openNavBlueprintAddL3Dialog(
  blueprintId: string,
  parentL2Key: string,
  onMount: () => void,
): boolean {
  const blocked = customL3CreationBlockedReasonForL2(blueprintId, parentL2Key);
  if (blocked) {
    window.alert(blocked);
    return false;
  }
  bindDialogEvents();
  onMountCallback = onMount;
  rowCounter = 0;
  buildNavRouteRegistry();
  buildNavPresetItemRegistry();
  getNavSettingRegistry();
  const addL3State = buildAddL3State(blueprintId, parentL2Key);
  if (!addL3State) {
    window.alert("未找到该二级导航，可能已被删除");
    return false;
  }
  mountDialog(addL3State);
  return true;
}

export function closeNavBlueprintAddL1Dialog(): void {
  closeDialog();
}
