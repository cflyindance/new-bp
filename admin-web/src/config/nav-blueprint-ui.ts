/**

 * M 平台 · 菜单路由配置（系统预设 / 自定义 双模块）

 */

import {

  FOUR_COLUMN_HEADERS,

  renderFourColumnMatrix,

  renderFourColumnMatrixShell,

  rerenderFourColumnMatrix,

  syncFourColumnIndeterminate,

  type FourColumnMatrixRenderOpts,

} from "./permission-four-column-ui";
import { bindNavBlueprintDragSort } from "./nav-blueprint-drag-sort";

import { showAppToast } from "../ui/app-toast";

import { openConfirmDialog } from "../ui/app-confirm-dialog";

import { findL2Node } from "./permission-four-column-nav";

import { l2HasCatalogNavSections } from "./module-settings-subnav";

import type { PermissionTreeNode } from "./permission-registry";

import {

  countAssignedSeqs,

  DEFAULT_NAV_BLUEPRINT_ID,

  getNavBlueprintDraft,

  getPublishedNavBlueprint,

  publishNavBlueprint,

  restoreNavBlueprintCustomTree,

  restoreNavBlueprintSystemDefault,

  writeNavBlueprintDraft,

  consumeNavBlueprintCustomFocus,

  removeNavBlueprintCustomNode,

  getNavBlueprintCustomL1Node,

  canCreateCustomL2UnderL1,

  customL2CreationBlockedReason,

  customL3CreationBlockedReason,

  resolveCustomStructureToolbarView,

  type NavBlueprintNavigationSource,

  type NavBlueprintSnapshot,

} from "./nav-blueprint-store";

import {

  buildNavBlueprintIndexFromSnapshot,

  buildNavBlueprintGroupsForModule,

  countCustomNodes,

  type NavBlueprintTreeModule,

} from "./nav-blueprint-tree";

import { openNavBlueprintAddL1Dialog, openNavBlueprintEditL1Dialog, openNavBlueprintAddL2Dialog } from "./nav-blueprint-add-l1-dialog";

import { openNavBlueprintAddL3Dialog } from "./nav-blueprint-add-l1-dialog";

import {

  formatBlueprintVersionLabel,

  syncBlueprintToEnterprisePresets,

} from "./nav-blueprint-sync";

import { invalidatePlatformPresetTreeCache } from "./platform-preset-tree";

import { ENTERPRISE_PLATFORM_PRESET_SCOPE } from "./platform-preset-scope";

import {

  syncNodeDisplayWithEnabled,

  type PlatformPresetNodeSelection,

} from "./platform-preset-store";

import { bindJsonMenuEditor, renderJsonMenuEditorPage } from "./json-menu-editor-ui";




function cascadeBlueprintSelection(

  selection: Record<string, PlatformPresetNodeSelection>,

  key: string,

  enabled: boolean,

  getDescendantKeys: (key: string) => string[],

): Record<string, PlatformPresetNodeSelection> {

  const next = { ...selection };

  next[key] = syncNodeDisplayWithEnabled(next[key], enabled);

  for (const dk of getDescendantKeys(key)) {

    next[dk] = syncNodeDisplayWithEnabled(next[dk], enabled);

  }

  return next;

}



const ROUTE_PREFIX = "/m-platform/nav-blueprint";



function escapeHtml(s: string): string {

  return s

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;");

}



export function isNavBlueprintPath(path: string): boolean {

  return path === ROUTE_PREFIX || path.startsWith(`${ROUTE_PREFIX}/`);

}



export function parseNavBlueprintEditPath(path: string): { blueprintId: string } | null {

  const m = path.match(/^\/m-platform\/nav-blueprint\/([^/]+)\/edit$/);

  if (!m) return null;

  return { blueprintId: decodeURIComponent(m[1]!) };

}



function walkTree(node: PermissionTreeNode, visit: (n: PermissionTreeNode) => void): void {

  visit(node);

  for (const c of node.children) walkTree(c, visit);

}



function initModuleSelection(

  snapshot: NavBlueprintSnapshot,

  module: NavBlueprintTreeModule,

): Record<string, PlatformPresetNodeSelection> {

  const stored =

    module === "custom" ? snapshot.customStructureSelection : snapshot.systemStructureSelection;

  const groups = buildNavBlueprintGroupsForModule(snapshot, module);

  const selection: Record<string, PlatformPresetNodeSelection> = { ...stored };

  for (const g of groups) {

    walkTree(g.tree, (n) => {

      if (!selection[n.resource.key]) {

        selection[n.resource.key] = syncNodeDisplayWithEnabled(undefined, true);

      }

    });

  }

  return selection;

}



function navigationSourceLabel(source: NavBlueprintNavigationSource): string {

  return source === "custom" ? "自定义导航树" : "系统默认导航";

}



function renderNavigationSourceSection(snapshot: NavBlueprintSnapshot): string {

  const isSystem = snapshot.navigationSource === "system";

  return `

    <section class="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <h3 class="text-sm font-semibold text-card-foreground">导航默认来源</h3>
      <fieldset class="mt-3 space-y-2">
        <legend class="sr-only">导航默认来源</legend>
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" name="nb-navigation-source" value="system" class="shrink-0" ${isSystem ? "checked" : ""} />
          <span class="font-medium text-card-foreground">系统默认导航</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" name="nb-navigation-source" value="custom" class="shrink-0" ${!isSystem ? "checked" : ""} />
          <span class="font-medium text-card-foreground">自定义导航树</span>
        </label>
      </fieldset>
    </section>`;

}



function resolveActiveTreeKeys(

  snapshot: NavBlueprintSnapshot,

  module: "system" | "custom",

  index: ReturnType<typeof buildNavBlueprintIndexFromSnapshot>,

): { l1: string; l2: string; l3: string } {

  const defaultL1 = index.groups[0]?.moduleKey ?? "";

  const defaultL2 = index.groups[0]?.tree.children[0]?.resource.key ?? "";

  const defaultL3 = index.groups[0]?.tree.children[0]?.children[0]?.resource.key ?? "";



  if (module !== "custom") {

    return { l1: defaultL1, l2: defaultL2, l3: defaultL3 };

  }



  const focus = consumeNavBlueprintCustomFocus(snapshot.blueprintId);

  if (!focus) {

    if (canCreateCustomL2UnderL1(snapshot.blueprintId, defaultL1)) {

      return { l1: defaultL1, l2: "", l3: "" };

    }

    return { l1: defaultL1, l2: defaultL2, l3: defaultL3 };

  }



  const group = index.groups.find((g) => g.moduleKey === focus.l1Key);

  if (!group) {

    if (canCreateCustomL2UnderL1(snapshot.blueprintId, defaultL1)) {

      return { l1: defaultL1, l2: "", l3: "" };

    }

    return { l1: defaultL1, l2: defaultL2, l3: defaultL3 };

  }



  let l2 = focus.l2Key ?? "";

  if (!focus.l2Key && canCreateCustomL2UnderL1(snapshot.blueprintId, focus.l1Key)) {

    l2 = "";

  } else if (!l2) {

    l2 = group.tree.children[0]?.resource.key ?? "";

  }

  if (l2 && !findL2Node(index.groups, l2)) {

    l2 = group.tree.children[0]?.resource.key ?? "";

  }



  let l3 = focus.l3Key ?? "";

  if (l2 && !l3) {

    l3 = findL2Node(index.groups, l2)?.children[0]?.resource.key ?? "";

  }

  if (l3) {

    let found = false;

    walkTree(group.tree, (n) => {

      if (n.resource.key === l3) found = true;

    });

    if (!found) {

      l3 = findL2Node(index.groups, l2)?.children[0]?.resource.key ?? "";

    }

  }



  return { l1: focus.l1Key, l2, l3 };

}



function buildNavBlueprintMatrixRenderOpts(
  snapshot: NavBlueprintSnapshot,
  module: "system" | "custom",
): FourColumnMatrixRenderOpts {
  return {
    enableSiblingSort: true,
    structureOrder: module === "custom" ? snapshot.customStructureOrder : snapshot.systemStructureOrder,
    seqOrder: module === "custom" ? snapshot.customSeqOrder : snapshot.systemSeqOrder,
  };
}



function renderTreeModulePanel(

  snapshot: NavBlueprintSnapshot,

  module: "system" | "custom",

): string {

  const selection = initModuleSelection(snapshot, module);

  const index = buildNavBlueprintIndexFromSnapshot(snapshot, module);

  const { l1: activeL1, l2: activeL2, l3: activeL3 } = resolveActiveTreeKeys(snapshot, module, index);

  const isSystem = module === "system";

  const matrixMode = isSystem ? "nav-blueprint-system" : "platform-preset";

  const l2Node = findL2Node(index.groups, activeL2);

  const columnHeaders = [...FOUR_COLUMN_HEADERS] as string[];

  if (isSystem && l2HasCatalogNavSections(l2Node)) {

    columnHeaders[2] = "三级 / 分组 · 侧栏分类";

  }



  const { col1, col2, col3, col4 } = renderFourColumnMatrix(

    selection,

    index,

    activeL1,

    activeL2,

    activeL3,

    "",

    undefined,

    matrixMode,

    buildNavBlueprintMatrixRenderOpts(snapshot, module),

  );



  const title = isSystem ? "系统预设导航树" : "自定义导航树";

  const toolbarView = !isSystem
    ? resolveCustomStructureToolbarView(snapshot.blueprintId, activeL1, activeL2)
    : null;

  const structureFocus =
    !isSystem && canCreateCustomL2UnderL1(snapshot.blueprintId, activeL1)
      ? activeL2
        ? "l2"
        : "l1"
      : "";

  const disabledBtnClass = "rounded-lg border border-border px-3 py-2 text-sm opacity-50 cursor-not-allowed";
  const enabledBtnClass = "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted";

  const addL2BtnClass = toolbarView?.enableAddL2 ? enabledBtnClass : disabledBtnClass;
  const addL3BtnClass = toolbarView?.enableAddL3 ? enabledBtnClass : disabledBtnClass;
  const addL2Hidden = toolbarView ? !toolbarView.showAddL2 : true;
  const addL3Hidden = toolbarView ? !toolbarView.showAddL3 : true;

  const toolbar = isSystem

    ? `<button type="button" data-nb-restore-system class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">恢复系统默认</button>`

    : `<div class="flex flex-wrap gap-2">

          <button type="button" data-nb-add-l1 class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">+ 一级导航</button>

          <button type="button" data-nb-add-l2 class="${addL2BtnClass}" ${toolbarView?.enableAddL2 ? "" : "disabled"} ${addL2Hidden ? "hidden" : ""} title="${escapeHtml(toolbarView?.addL2Title ?? "")}">+ 二级导航</button>

          <button type="button" data-nb-add-l3 class="${addL3BtnClass}" ${toolbarView?.enableAddL3 ? "" : "disabled"} ${addL3Hidden ? "hidden" : ""} title="${escapeHtml(toolbarView?.addL3Title ?? "")}">+ 三级分组</button>

          <button type="button" data-nb-restore-custom class="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">清空自定义导航</button>

        </div>`;



  return `

    <div

      class="min-h-0 flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col"

      data-nb-tree-panel="${module}"

      data-active-l1="${escapeHtml(activeL1)}"

      data-active-l2="${escapeHtml(activeL2)}"

      data-active-l3="${escapeHtml(activeL3)}"

      ${structureFocus ? `data-nb-structure-focus="${structureFocus}"` : ""}

    >

      <input type="hidden" data-pp-selection-json value="${escapeHtml(JSON.stringify(selection))}" />

      <div class="border-b border-border px-4 py-3 flex flex-wrap items-start justify-between gap-3">

        <div class="min-w-0">

          <h2 class="text-sm font-semibold text-card-foreground">${escapeHtml(title)}</h2>

        </div>

        ${toolbar}

      </div>

      ${renderFourColumnMatrixShell(col1, col2, col3, col4, columnHeaders)}

    </div>`;

}



export function renderNavBlueprintListPage(): string {

  const blueprintId = DEFAULT_NAV_BLUEPRINT_ID;

  const published = getPublishedNavBlueprint(blueprintId);

  const draft = getNavBlueprintDraft(blueprintId);

  const version = published?.version ?? 0;

  const customCount = countCustomNodes(draft);

  const assignedCount = countAssignedSeqs(draft);

  const activeSource = navigationSourceLabel(draft.navigationSource);



  return `

    <div class="flex min-h-0 flex-1 flex-col gap-4">

      <div>

        <h2 class="text-lg font-semibold text-card-foreground">企业导航蓝图</h2>

        <p class="mt-1 max-w-2xl text-sm text-muted-foreground">

          系统预设与自定义导航分模块配置；选择默认来源后发布，再同步至平台预设并下发商家。

        </p>

      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <article class="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-3">

          <div class="flex items-start justify-between gap-3">

            <div class="min-w-0">

              <h3 class="text-base font-semibold text-card-foreground">默认导航蓝图</h3>

              <p class="mt-0.5 font-mono text-xs text-muted-foreground">${escapeHtml(blueprintId)}</p>

            </div>

            <span class="shrink-0 text-xs tabular-nums text-muted-foreground">${version > 0 ? `v${version} · 企业默认` : "未发布"}</span>

          </div>

          <p class="text-sm text-muted-foreground">

            默认来源 <strong class="text-card-foreground">${escapeHtml(activeSource)}</strong> ·

            自定义节点 <strong class="text-card-foreground">${customCount}</strong> 项 ·

            设置重归属 <strong class="text-card-foreground">${assignedCount}</strong> 项

          </p>

          <div class="mt-auto flex flex-wrap gap-2 pt-1">

            <a href="#${ROUTE_PREFIX}/${encodeURIComponent(blueprintId)}/edit" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">配置菜单路由</a>

            ${version > 0 ? `<button type="button" data-nb-sync-presets class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">同步到平台预设</button>` : ""}

          </div>

        </article>

      </div>

    </div>`;

}



export function renderNavBlueprintEditPage(blueprintId: string): string {

  const snapshot = getNavBlueprintDraft(blueprintId);

  const version = snapshot.version;

  const listHref = `#${ROUTE_PREFIX}`;

  const activeModule = snapshot.navigationSource === "custom" ? "custom" : "system";



  return `

    <div

      class="flex min-h-0 flex-1 flex-col gap-4"

      data-nb-editor

      data-blueprint-id="${escapeHtml(blueprintId)}"

      data-version="${version}"

    >

      <input type="hidden" data-nb-meta-json value="${escapeHtml(

        JSON.stringify({

          customNodes: snapshot.customNodes,

          systemSeqAssignments: snapshot.systemSeqAssignments,

          customSeqAssignments: snapshot.customSeqAssignments,

        }),

      )}" />

      <div class="flex flex-wrap items-center justify-between gap-2">

        <a href="${listHref}" class="text-sm text-primary hover:underline">← 返回蓝图列表</a>

      </div>

      ${renderNavigationSourceSection(snapshot)}

      ${renderTreeModulePanel(snapshot, activeModule)}

      <div class="flex flex-wrap gap-3 shrink-0">

        <button type="button" data-nb-publish class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">

          保存并发布 v${version + 1}

        </button>

        <button type="button" data-nb-publish-sync class="rounded-lg border border-primary bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/15">

          发布并同步到平台预设

        </button>

        <a href="${listHref}" class="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted">取消</a>

      </div>

    </div>`;

}



export function renderNavBlueprintPage(path: string): string {

  const edit = parseNavBlueprintEditPath(path);

  if (edit) return renderJsonMenuEditorPage();

  return renderJsonMenuEditorPage();

}



export function findNavBlueprintPageTitle(path: string): { title: string; module: string } | null {

  if (!isNavBlueprintPath(path)) return null;

  const edit = parseNavBlueprintEditPath(path);

  if (edit) return { title: "菜单路由可视化编辑器", module: "M 平台" };

  return { title: "菜单路由配置", module: "M 平台" };

}



function readPanelSelection(panel: HTMLElement): Record<string, PlatformPresetNodeSelection> {

  const raw = panel.querySelector<HTMLInputElement>("[data-pp-selection-json]")?.value;

  if (!raw) return {};

  try {

    return JSON.parse(raw) as Record<string, PlatformPresetNodeSelection>;

  } catch {

    return {};

  }

}



function writePanelSelection(

  panel: HTMLElement,

  selection: Record<string, PlatformPresetNodeSelection>,

): void {

  const input = panel.querySelector<HTMLInputElement>("[data-pp-selection-json]");

  if (input) input.value = JSON.stringify(selection);

}



function readEditorMeta(editor: HTMLElement): {

  customNodes: NavBlueprintSnapshot["customNodes"];

  systemSeqAssignments: NavBlueprintSnapshot["systemSeqAssignments"];

  customSeqAssignments: NavBlueprintSnapshot["customSeqAssignments"];

} {

  try {

    const raw = editor.querySelector<HTMLInputElement>("[data-nb-meta-json]")?.value;

    if (raw) {

      return JSON.parse(raw) as ReturnType<typeof readEditorMeta>;

    }

  } catch {

    /* ignore */

  }

  const draft = getNavBlueprintDraft(editor.dataset.blueprintId!);

  return {

    customNodes: draft.customNodes,

    systemSeqAssignments: draft.systemSeqAssignments,

    customSeqAssignments: draft.customSeqAssignments,

  };

}



function writeEditorMeta(

  editor: HTMLElement,

  meta: ReturnType<typeof readEditorMeta>,

): void {

  const input = editor.querySelector<HTMLInputElement>("[data-nb-meta-json]");

  if (input) input.value = JSON.stringify(meta);

}



function readNavigationSourceFromEditor(editor: HTMLElement): NavBlueprintNavigationSource {

  const val = editor.querySelector<HTMLInputElement>("[name=nb-navigation-source]:checked")?.value;

  return val === "custom" ? "custom" : "system";

}



function getVisibleTreeModuleFromEditor(editor: HTMLElement): "system" | "custom" {

  const panel = editor.querySelector<HTMLElement>("[data-nb-tree-panel]");

  return panel?.dataset.nbTreePanel === "custom" ? "custom" : "system";

}



function getSnapshotFromEditor(editor: HTMLElement): NavBlueprintSnapshot {

  const blueprintId = editor.dataset.blueprintId!;

  const draft = getNavBlueprintDraft(blueprintId);

  const navigationSource = readNavigationSourceFromEditor(editor);

  const visibleModule = getVisibleTreeModuleFromEditor(editor);

  const visiblePanel = editor.querySelector<HTMLElement>("[data-nb-tree-panel]");



  let systemStructureSelection = draft.systemStructureSelection;

  let customStructureSelection = draft.customStructureSelection;

  if (visiblePanel) {

    const sel = readPanelSelection(visiblePanel);

    if (visibleModule === "system") systemStructureSelection = sel;

    else customStructureSelection = sel;

  }



  return {

    ...draft,

    navigationSource,

    systemStructureSelection,

    customStructureSelection,

  };

}



function rerenderActiveTreePanel(editor: HTMLElement): void {

  const snapshot = getSnapshotFromEditor(editor);

  const module = getVisibleTreeModuleFromEditor(editor);

  rerenderTreePanel(editor, module, snapshot);

}



function matrixModeForTreeModule(module: "system" | "custom"): "nav-blueprint-system" | "platform-preset" {

  return module === "system" ? "nav-blueprint-system" : "platform-preset";

}



function syncToolbarButton(
  btn: HTMLButtonElement | null,
  show: boolean,
  canAdd: boolean,
  title: string,
): void {
  if (!btn) return;
  btn.hidden = !show;
  btn.disabled = !canAdd;
  btn.title = title;
  btn.classList.toggle("opacity-50", show && !canAdd);
  btn.classList.toggle("cursor-not-allowed", show && !canAdd);
  btn.classList.toggle("hover:bg-muted", show && canAdd);
}

function syncCustomStructureToolbar(panel: HTMLElement, blueprintId: string): void {
  if (panel.dataset.nbTreePanel !== "custom") return;

  const view = resolveCustomStructureToolbarView(
    blueprintId,
    panel.dataset.activeL1 ?? "",
    panel.dataset.activeL2 ?? "",
  );

  syncToolbarButton(panel.querySelector<HTMLButtonElement>("[data-nb-add-l2]"), view.showAddL2, view.enableAddL2, view.addL2Title);
  syncToolbarButton(panel.querySelector<HTMLButtonElement>("[data-nb-add-l3]"), view.showAddL3, view.enableAddL3, view.addL3Title);
}



function rerenderTreePanel(

  editor: HTMLElement,

  module: "system" | "custom",

  snapshot?: NavBlueprintSnapshot,

): void {

  const snap = snapshot ?? getSnapshotFromEditor(editor);

  const panel = editor.querySelector<HTMLElement>(`[data-nb-tree-panel="${module}"]`);

  if (!panel) return;

  const selection =

    module === "custom" ? snap.customStructureSelection : snap.systemStructureSelection;

  const index = buildNavBlueprintIndexFromSnapshot(snap, module);

  const preserveL1Focus = module === "custom" && panel.dataset.nbStructureFocus === "l1";

  rerenderFourColumnMatrix(
    panel,
    selection,
    index,
    "",
    undefined,
    matrixModeForTreeModule(module),
    {
      ...(preserveL1Focus ? { preserveEmptyL2: true, preserveEmptyL3: true } : {}),
      ...buildNavBlueprintMatrixRenderOpts(snap, module),
    },
  );

  syncFourColumnIndeterminate(panel);

  if (module === "custom") {
    syncCustomStructureToolbar(panel, snap.blueprintId);
  }

}



function findTreePanelFromEvent(target: HTMLElement): HTMLElement | null {

  return target.closest<HTMLElement>("[data-nb-tree-panel]");

}



function treeModuleFromPanel(panel: HTMLElement): "system" | "custom" {

  return panel.dataset.nbTreePanel === "custom" ? "custom" : "system";

}



let navBlueprintBound = false;



export function bindNavBlueprint(onMount: () => void): void {

  bindJsonMenuEditor(onMount);

  if (navBlueprintBound) return;

  navBlueprintBound = true;



  document.body.addEventListener("click", (ev) => {

    const target = ev.target as HTMLElement;



    if (target.closest("[data-nb-sync-presets]")) {

      void (async () => {

        const published = getPublishedNavBlueprint(DEFAULT_NAV_BLUEPRINT_ID);

        if (!published || published.version <= 0) {

          showAppToast("请先发布导航蓝图。", { variant: "error" });

          return;

        }

        const ok = await openConfirmDialog({

          title: "同步到平台预设",

          message: `将 ${formatBlueprintVersionLabel(published)} 同步到全业态×产线平台预设？`,

          confirmLabel: "确认同步",

        });

        if (!ok) return;

        const result = syncBlueprintToEnterprisePresets(published);

        showAppToast(`已同步到 ${result.updated} 个组合。`, { variant: "success" });

        location.hash = `#${ENTERPRISE_PLATFORM_PRESET_SCOPE.routePrefix}`;

        onMount();

      })();

      return;

    }



    const editor = document.querySelector<HTMLElement>("[data-nb-editor]");

    if (!editor) return;



    const blueprintId = editor.dataset.blueprintId!;



    if (target.closest("[data-nb-restore-system]")) {

      void (async () => {

        const ok = await openConfirmDialog({

          title: "恢复系统预设",

          message: "确定恢复系统预设导航为默认？仅清空系统模块的启用态与设置重归属。",

          confirmLabel: "确认恢复",

          danger: true,

        });

        if (!ok) return;

        restoreNavBlueprintSystemDefault(blueprintId);

        onMount();

      })();

      return;

    }



    if (target.closest("[data-nb-restore-custom]")) {

      void (async () => {

        const ok = await openConfirmDialog({

          title: "清空自定义导航",

          message: "确定清空全部自定义导航？自定义 L1/L2/L3 与设置归属将删除。",

          confirmLabel: "确认清空",

          danger: true,

        });

        if (!ok) return;

        restoreNavBlueprintCustomTree(blueprintId);

        onMount();

      })();

      return;

    }



    if (target.closest("[data-nb-add-l1]")) {

      openNavBlueprintAddL1Dialog(blueprintId, onMount);

      return;

    }



    const editL1Btn = target.closest<HTMLElement>("[data-nb-edit-l1]");

    const editL1Id = editL1Btn?.getAttribute("data-nb-edit-l1");

    if (editL1Id) {

      ev.stopPropagation();

      openNavBlueprintEditL1Dialog(blueprintId, editL1Id, onMount);

      return;

    }



    const deleteL1Btn = target.closest<HTMLElement>("[data-nb-delete-l1]");

    const deleteL1Id = deleteL1Btn?.getAttribute("data-nb-delete-l1");

    if (deleteL1Id) {

      ev.stopPropagation();

      void (async () => {

        const l1Node = getNavBlueprintCustomL1Node(blueprintId, deleteL1Id);

        if (!l1Node) {

          showAppToast("未找到该一级导航，可能已被删除。", { variant: "error" });

          onMount();

          return;

        }

        const ok = await openConfirmDialog({

          title: "删除一级导航",

          message: `确定删除一级导航「${l1Node.label}」？其下二级 / 三级导航与设置归属将一并移除。`,

          confirmLabel: "确认删除",

          danger: true,

        });

        if (!ok) return;

        removeNavBlueprintCustomNode(blueprintId, l1Node.id);

        onMount();

      })();

      return;

    }



    if (target.closest("[data-nb-add-l2]")) {

      const customPanel = editor.querySelector<HTMLElement>("[data-nb-tree-panel]");

      const parentKey = customPanel?.dataset.activeL1;

      if (!parentKey) {

        showAppToast("请先在自定义模块左侧选择一级导航。", { variant: "error" });

        return;

      }

      const blocked = customL2CreationBlockedReason(blueprintId, parentKey);

      if (blocked) {

        showAppToast(blocked, { variant: "error" });

        return;

      }

      openNavBlueprintAddL2Dialog(blueprintId, parentKey, onMount);

      return;

    }



    if (target.closest("[data-nb-add-l3]")) {

      const customPanel = editor.querySelector<HTMLElement>("[data-nb-tree-panel]");

      const activeL1 = customPanel?.dataset.activeL1;

      if (activeL1) {

        const l1Blocked = customL3CreationBlockedReason(blueprintId, activeL1);

        if (l1Blocked) {

          showAppToast(l1Blocked, { variant: "error" });

          return;

        }

      }

      const parentKey = customPanel?.dataset.activeL2;

      if (!parentKey) {

        showAppToast("请先在自定义模块中选择二级导航。", { variant: "error" });

        return;

      }

      openNavBlueprintAddL3Dialog(blueprintId, parentKey, onMount);

      return;

    }



    if (target.closest("[data-nb-publish]") || target.closest("[data-nb-publish-sync]")) {

      void (async () => {

        const snapshot = getSnapshotFromEditor(editor);

        writeNavBlueprintDraft(snapshot);

        const published = publishNavBlueprint(snapshot);

        invalidatePlatformPresetTreeCache();

        const withSync = Boolean(target.closest("[data-nb-publish-sync]"));

        const sourceLabel = navigationSourceLabel(published.navigationSource);

        const doSync =

          withSync ||

          (await openConfirmDialog({

            title: "同步到平台预设",

            message: `已发布导航蓝图 v${published.version}（${sourceLabel}）。是否同步到企业级平台预设？`,

            confirmLabel: "确认同步",

          }));

        if (doSync) {

          const result = syncBlueprintToEnterprisePresets(published);

          showAppToast(

            `已同步到 ${result.updated} 个业态×产线组合（${sourceLabel}）。请进入平台预设确认各组合可见性。`,

            { variant: "success" },

          );

          location.hash = `#${ENTERPRISE_PLATFORM_PRESET_SCOPE.routePrefix}`;

        } else {

          showAppToast(`已发布导航蓝图 v${published.version}（${sourceLabel}）。`, {

            variant: "success",

          });

          location.hash = `#${ROUTE_PREFIX}`;

        }

        onMount();

      })();

      return;

    }



    const panel = findTreePanelFromEvent(target);

    if (!panel || !editor.contains(panel)) return;



    const colSelect = target.closest<HTMLElement>("[data-pp-col-select]");

    if (colSelect) {

      const key = colSelect.dataset.ppColSelect!;

      const snapshot = getSnapshotFromEditor(editor);

      const module = treeModuleFromPanel(panel);

      const index = buildNavBlueprintIndexFromSnapshot(snapshot, module);

      let level: number | undefined;

      for (const g of index.groups) {

        walkTree(g.tree, (n) => {

          if (n.resource.key === key) level = n.resource.level;

        });

      }

      if (level === 1) {

        panel.dataset.activeL1 = key;

        panel.dataset.activeL2 = "";

        panel.dataset.activeL3 = "";

        if (canCreateCustomL2UnderL1(snapshot.blueprintId, key)) {

          panel.dataset.nbStructureFocus = "l1";

        } else {

          delete panel.dataset.nbStructureFocus;

        }

      } else if (level === 2) {

        panel.dataset.activeL2 = key;

        panel.dataset.activeL3 = "";

        panel.dataset.nbStructureFocus = "l2";

      } else if (level === 3) {

        panel.dataset.activeL3 = key;

      }

      rerenderActiveTreePanel(editor);

    }

  });



  document.body.addEventListener("change", (ev) => {

    const target = ev.target as HTMLElement;

    if (target.closest("#nb-add-l1-dialog, #nb-add-l2-dialog, #nb-add-l3-dialog, #nb-edit-l1-dialog")) return;

    const editor = document.querySelector<HTMLElement>("[data-nb-editor]");

    if (!editor) return;

    const input = target as HTMLInputElement;



    if (target.matches("[name=nb-navigation-source]")) {

      const snapshot = getSnapshotFromEditor(editor);

      writeNavBlueprintDraft(snapshot);

      onMount();

      return;

    }



    const panel = findTreePanelFromEvent(target);

    if (!panel || !editor.contains(panel)) return;



    const module = treeModuleFromPanel(panel);

    const snapshot = getSnapshotFromEditor(editor);

    const index = buildNavBlueprintIndexFromSnapshot(snapshot, module);

    const activeL3 = panel.dataset.activeL3 ?? "";

    const selectionKey = module === "custom" ? "customStructureSelection" : "systemStructureSelection";

    const seqKey = module === "custom" ? "customSeqAssignments" : "systemSeqAssignments";

    let selection = { ...snapshot[selectionKey] };

    const meta = readEditorMeta(editor);



    if (target.matches("[data-pp-enable]")) {

      const key = target.dataset.ppEnable!;

      let level: number | undefined;

      let seq: number | undefined;

      for (const g of index.groups) {

        walkTree(g.tree, (n) => {

          if (n.resource.key === key) {

            level = n.resource.level;

            if (n.resource.seq != null) seq = n.resource.seq;

          }

        });

      }



      if (level != null && level <= 3) {

        const next = cascadeBlueprintSelection(

          selection,

          key,

          input.checked,

          index.getDescendantKeys,

        );

        snapshot[selectionKey] = next;

        writeNavBlueprintDraft(snapshot);

        writePanelSelection(panel, next);

        rerenderActiveTreePanel(editor);

        return;

      }



      if (level === 4 && seq != null && activeL3) {

        if (input.checked) meta[seqKey][seq] = activeL3;

        else delete meta[seqKey][seq];

        selection[key] = syncNodeDisplayWithEnabled(selection[key], input.checked);

        snapshot[selectionKey] = selection;

        if (module === "custom") snapshot.customSeqAssignments = { ...meta.customSeqAssignments };

        else snapshot.systemSeqAssignments = { ...meta.systemSeqAssignments };

        writeNavBlueprintDraft(snapshot);

        writePanelSelection(panel, selection);

        writeEditorMeta(editor, meta);

        rerenderActiveTreePanel(editor);

      }

    }

  });

  bindNavBlueprintDragSort((panel, snapshot) => {
    const editor = panel.closest<HTMLElement>("[data-nb-editor]");
    if (!editor) return;
    const module = panel.dataset.nbTreePanel === "custom" ? "custom" : "system";
    rerenderTreePanel(editor, module, snapshot);
  });

}



export { ROUTE_PREFIX as NAV_BLUEPRINT_ROUTE_PREFIX };


