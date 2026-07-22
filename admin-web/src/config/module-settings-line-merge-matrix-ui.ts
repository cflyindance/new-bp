/**
 * 行级合并规则：按规则行勾选适用票种（结构对齐点单显示座位，无产线列）。
 * 存储沿用各 seq 的 module-setting-toggle localStorage。
 */

import { writeModuleSettingToggleOn } from "./module-settings-toggle-ui";

export const LINE_MERGE_MATRIX_HOST_SEQ = 52;

/** 矩阵行定义：主菜合并、子菜合并 */
export const LINE_MERGE_MATRIX_ROWS = [
  {
    key: "items",
    label: "合并相同菜",
    kitchenSeq: 52,
    packingSeq: 301,
    receiptSeq: 288,
  },
  {
    key: "modifiers",
    label: "合并相同子菜",
    kitchenSeq: 53,
    packingSeq: 302,
    receiptSeq: 287,
  },
] as const;

const LINE_MERGE_TICKET_OPTIONS = [
  { key: "kitchen", label: "厨房单", seqKey: "kitchenSeq" },
  { key: "packing", label: "打包单", seqKey: "packingSeq" },
  { key: "receipt", label: "食客收据", seqKey: "receiptSeq" },
] as const;

/** @type {number[]} */
const LINE_MERGE_MATRIX_MEMBER_SEQ_LIST = LINE_MERGE_MATRIX_ROWS.flatMap((r) => [
  r.kitchenSeq,
  r.packingSeq,
  r.receiptSeq,
]);

const LINE_MERGE_MATRIX_SKIP_SEQS = new Set<number>(
  LINE_MERGE_MATRIX_MEMBER_SEQ_LIST.filter((s) => s !== LINE_MERGE_MATRIX_HOST_SEQ),
);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isLineMergeMatrixHostSeq(seq: number): boolean {
  return seq === LINE_MERGE_MATRIX_HOST_SEQ;
}

export function shouldSkipLineMergeMatrixMemberRow(seq: number): boolean {
  return LINE_MERGE_MATRIX_SKIP_SEQS.has(seq);
}

function renderTicketCheckboxesForRow(
  row: (typeof LINE_MERGE_MATRIX_ROWS)[number],
  readToggle: (seq: number) => boolean,
): string {
  const inputs = LINE_MERGE_TICKET_OPTIONS.map((ticket) => {
    const seq = row[ticket.seqKey];
    const checked = readToggle(seq);
    return `
      <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${seq}"
          data-line-merge-ticket-seq="${seq}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(row.label)} ${escapeHtml(ticket.label)}"
        />
        <span>${escapeHtml(ticket.label)}</span>
      </label>`;
  }).join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

/** @param {(seq: number) => boolean} readToggle */
export function renderLineMergeMatrixHtml(readToggle: (seq: number) => boolean): string {
  const rows = LINE_MERGE_MATRIX_ROWS.map(
    (row) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(row.label)}</td>
      <td class="px-3 py-2.5">
        ${renderTicketCheckboxesForRow(row, readToggle)}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-line-merge-matrix class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">规则</th>
            <th class="px-3 py-2 font-medium">适用票种（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function bindLineMergeMatrixUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-line-merge-matrix]").forEach((editor) => {
    if (editor.dataset.lineMergeMatrixBound === "1") return;
    editor.dataset.lineMergeMatrixBound = "1";
    editor.addEventListener("change", (e) => {
      const input = (e.target as HTMLElement).closest<HTMLInputElement>(
        "[data-line-merge-ticket-seq]",
      );
      if (!input) return;
      const seq = Number(input.getAttribute("data-line-merge-ticket-seq"));
      if (!seq) return;
      writeModuleSettingToggleOn(seq, input.checked);
      window.dispatchEvent(
        new CustomEvent("menusifu:module-setting-changed", {
          detail: { seq, on: input.checked },
        }),
      );
    });
  });
}
