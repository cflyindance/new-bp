/**
 * 行级合并规则：厨房单 / 打包单 / 食客收据 三列矩阵（后厨设置 SSOT 展示）。
 * 存储沿用各 seq 的 module-setting-toggle localStorage。
 */

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

/** @type {number[]} */
const LINE_MERGE_MATRIX_MEMBER_SEQ_LIST = LINE_MERGE_MATRIX_ROWS.flatMap((r) => [
  r.kitchenSeq,
  r.packingSeq,
  r.receiptSeq,
]);

const LINE_MERGE_MATRIX_SKIP_SEQS = new Set<number>(
  LINE_MERGE_MATRIX_MEMBER_SEQ_LIST.filter((s) => s !== LINE_MERGE_MATRIX_HOST_SEQ),
);

const COLUMN_LABELS = [
  { key: "kitchen", label: "厨房单" },
  { key: "packing", label: "打包单" },
  { key: "receipt", label: "食客收据" },
] as const;

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

/** @param {(seq: number) => boolean} readToggle */
export function renderLineMergeMatrixHtml(readToggle: (seq: number) => boolean): string {
  const headerCells = COLUMN_LABELS.map(
    (col) =>
      `<th scope="col" class="px-3 py-2 text-center text-xs font-medium text-muted-foreground">${escapeHtml(col.label)}</th>`,
  ).join("");

  const bodyRows = LINE_MERGE_MATRIX_ROWS.map((row) => {
    const seqs: number[] = [row.kitchenSeq, row.packingSeq, row.receiptSeq];
    const cells = seqs
      .map((seq) => {
        const on = readToggle(seq);
        const ariaLabel = `${row.label} · seq ${seq}`;
        const trackClass = on
          ? "bg-primary border-primary"
          : "bg-muted border-border";
        const knobClass = on ? "translate-x-5" : "translate-x-0.5";
        return `
        <td class="border-t border-border px-3 py-2.5 text-center align-middle">
          <button
            type="button"
            role="switch"
            aria-checked="${on ? "true" : "false"}"
            aria-label="${escapeHtml(ariaLabel)}"
            data-module-setting-toggle="${seq}"
            class="module-setting-toggle relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${trackClass}"
          >
            <span class="pointer-events-none block size-5 rounded-full bg-background shadow transition-transform duration-200 ${knobClass}" aria-hidden="true"></span>
          </button>
        </td>`;
      })
      .join("");

    return `
      <tr>
        <th scope="row" class="border-t border-border px-3 py-2.5 text-left text-sm font-medium text-foreground">${escapeHtml(row.label)}</th>
        ${cells}
      </tr>`;
  }).join("");

  return `
    <div class="mt-3 overflow-x-auto rounded-md border border-border" data-line-merge-matrix>
      <table class="w-full min-w-[20rem] border-collapse text-sm">
        <thead>
          <tr class="bg-muted/40">
            <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">规则</th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}
