/**
 * 导航蓝图 · 四列矩阵同级拖动排序
 */
import { buildNavBlueprintIndexFromSnapshot } from "./nav-blueprint-tree";
import type { PermissionTreeNode } from "./permission-registry";
import {
  getNavBlueprintDraft,
  reorderNavBlueprintCustomSiblings,
  reorderNavBlueprintSeqInL3,
  reorderNavBlueprintSystemStructure,
  type NavBlueprintSnapshot,
} from "./nav-blueprint-store";

let dragKey = "";

function findSeqForKey(groups: { tree: PermissionTreeNode }[], key: string): number | undefined {
  let found: number | undefined;
  const walk = (node: PermissionTreeNode): void => {
    if (node.resource.key === key && node.resource.level === 4) {
      found = node.resource.seq;
    }
    for (const c of node.children) walk(c);
  };
  for (const g of groups) walk(g.tree);
  return found;
}

function reorderDomRows(list: HTMLElement, dragId: string, targetRow: HTMLElement, clientY: number): void {
  if (dragId === targetRow.getAttribute("data-nb-sort-key")) return;
  const dragEl = list.querySelector<HTMLElement>(`[data-nb-draggable-row][data-nb-sort-key="${CSS.escape(dragId)}"]`);
  if (!dragEl) return;
  const rect = targetRow.getBoundingClientRect();
  const after = clientY > rect.top + rect.height / 2;
  if (after) targetRow.after(dragEl);
  else targetRow.before(dragEl);
}

function collectSortKeys(col: HTMLElement): string[] {
  return [...col.querySelectorAll<HTMLElement>("[data-nb-draggable-row]")]
    .map((el) => el.getAttribute("data-nb-sort-key") ?? "")
    .filter(Boolean);
}

function levelFromCol(col: HTMLElement): 1 | 2 | 3 | 4 | null {
  const raw = col.getAttribute("data-pp-col");
  if (raw === "1") return 1;
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  if (raw === "4") return 4;
  return null;
}

function persistColumnOrder(
  panel: HTMLElement,
  col: HTMLElement,
  blueprintId: string,
  module: "system" | "custom",
  snapshot: NavBlueprintSnapshot,
): NavBlueprintSnapshot {
  const level = levelFromCol(col);
  if (!level || level === 4) {
    const l3Key = panel.dataset.activeL3 ?? "";
    if (!l3Key) return snapshot;
    const keys = collectSortKeys(col);
    const index = buildNavBlueprintIndexFromSnapshot(snapshot, module);
    const orderedSeqs: number[] = [];
    for (const key of keys) {
      const seq = findSeqForKey(index.groups, key);
      if (seq != null) orderedSeqs.push(seq);
    }
    reorderNavBlueprintSeqInL3(blueprintId, module, l3Key, orderedSeqs);
    return getNavBlueprintDraft(blueprintId);
  }

  const orderedKeys = collectSortKeys(col);
  if (level === 1) {
    if (module === "custom") {
      reorderNavBlueprintCustomSiblings(blueprintId, 1, null, orderedKeys);
    } else {
      reorderNavBlueprintSystemStructure(blueprintId, 1, null, orderedKeys);
    }
  } else if (level === 2) {
    const parentKey = panel.dataset.activeL1 ?? "";
    if (!parentKey) return snapshot;
    if (module === "custom") {
      reorderNavBlueprintCustomSiblings(blueprintId, 2, parentKey, orderedKeys);
    } else {
      reorderNavBlueprintSystemStructure(blueprintId, 2, parentKey, orderedKeys);
    }
  } else if (level === 3) {
    const parentKey = panel.dataset.activeL2 ?? "";
    if (!parentKey) return snapshot;
    if (module === "custom") {
      reorderNavBlueprintCustomSiblings(blueprintId, 3, parentKey, orderedKeys);
    } else {
      reorderNavBlueprintSystemStructure(blueprintId, 3, parentKey, orderedKeys);
    }
  }
  return getNavBlueprintDraft(blueprintId);
}

export function bindNavBlueprintDragSort(
  onReorder: (panel: HTMLElement, snapshot: NavBlueprintSnapshot) => void,
): void {
  if (document.body.dataset.nbDragSortBound === "1") return;
  document.body.dataset.nbDragSortBound = "1";

  document.body.addEventListener("dragstart", (e) => {
    const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-nb-drag-handle]");
    if (!handle) return;
    const row = handle.closest<HTMLElement>("[data-nb-draggable-row]");
    const panel = handle.closest<HTMLElement>("[data-nb-tree-panel]");
    const editor = handle.closest<HTMLElement>("[data-nb-editor]");
    if (!row || !panel || !editor) return;
    dragKey = row.getAttribute("data-nb-sort-key") ?? "";
    e.dataTransfer?.setData("text/plain", dragKey);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    row.classList.add("opacity-50");
  });

  document.body.addEventListener("dragend", (e) => {
    const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-nb-drag-handle]");
    const row = handle?.closest<HTMLElement>("[data-nb-draggable-row]");
    row?.classList.remove("opacity-50");
    dragKey = "";
  });

  document.body.addEventListener("dragover", (e) => {
    const col = (e.target as HTMLElement).closest<HTMLElement>("[data-pp-col]");
    if (!col?.querySelector("[data-nb-draggable-row]")) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  });

  document.body.addEventListener("drop", (e) => {
    const col = (e.target as HTMLElement).closest<HTMLElement>("[data-pp-col]");
    const panel = col?.closest<HTMLElement>("[data-nb-tree-panel]");
    const editor = panel?.closest<HTMLElement>("[data-nb-editor]");
    if (!col || !panel || !editor) return;
    e.preventDefault();

    const targetRow = (e.target as HTMLElement).closest<HTMLElement>("[data-nb-draggable-row]");
    const id = dragKey || e.dataTransfer?.getData("text/plain") || "";
    if (!id || !targetRow) return;

    reorderDomRows(col, id, targetRow, e.clientY);

    const blueprintId = editor.dataset.blueprintId ?? "";
    const module = panel.dataset.nbTreePanel === "custom" ? "custom" : "system";
    const snapshot = getNavBlueprintDraft(blueprintId);
    const next = persistColumnOrder(panel, col, blueprintId, module, snapshot);
    onReorder(panel, next);
  });
}
