/**
 * 前厅 · 备注与附加服务：seq 522 商品备注（主开关 + 按产线选择支持备注的商品）。
 */

import {
  readDishTags,
  renderStandaloneDishPickerHtml,
  writeDishTags,
  type DishTag,
} from "./module-settings-dish-rules-ui";
export const PRODUCT_REMARK_SEQ = 522;

const LEGACY_DISHES_STORAGE_ID = "522-remark-dishes";

export const PRODUCT_REMARK_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type ProductRemarkProductLineId =
  (typeof PRODUCT_REMARK_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ProductRemarkProductLineId[] =
  PRODUCT_REMARK_PRODUCT_LINES.map((l) => l.id);

let dishesMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dishesStorageId(lineId: ProductRemarkProductLineId): string {
  return `522-remark-dishes-${lineId}`;
}

export function ensureProductRemarkDishesMigrated(): void {
  if (dishesMigrated) return;
  dishesMigrated = true;

  const legacy = readDishTags(LEGACY_DISHES_STORAGE_ID);
  if (legacy.length === 0) return;

  for (const lineId of ALL_LINE_IDS) {
    const storageId = dishesStorageId(lineId);
    if (readDishTags(storageId).length === 0) {
      writeDishTags(storageId, [...legacy]);
    }
  }
}

export function readProductRemarkDishesForLine(
  lineId: ProductRemarkProductLineId,
): DishTag[] {
  ensureProductRemarkDishesMigrated();
  return readDishTags(dishesStorageId(lineId));
}

export function isProductRemarkSeq(seq: number): boolean {
  return seq === PRODUCT_REMARK_SEQ;
}

function renderDishesByLineTableHtml(panelEnabled: boolean): string {
  const rows = PRODUCT_REMARK_PRODUCT_LINES.map((line) => {
    const picker = renderStandaloneDishPickerHtml(
      PRODUCT_REMARK_SEQ,
      line.id,
      dishesStorageId(line.id),
      "select",
    );
    const pickerDisabled = panelEnabled ? "" : "pointer-events-none opacity-50";
    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 ${pickerDisabled}">
        ${picker}
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-product-remark-dishes-editor class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[22rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">支持备注的商品（下拉选择）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderProductRemarkPanelHtml(seq: number, on: boolean): string {
  ensureProductRemarkDishesMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-3xl ${hidden}"
      data-product-remark-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs leading-relaxed text-muted-foreground">
        为各产线通过下拉分别添加支持食客填写特殊备注的商品；已选商品以标签展示，可移除。未选择商品的产线不开放商品备注。
      </p>
      ${renderDishesByLineTableHtml(on)}
    </div>`;
}

export function setProductRemarkPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-product-remark-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLElement>("[data-standalone-dish-picker]").forEach((wrap) => {
      wrap.classList.toggle("pointer-events-none", !visible);
      wrap.classList.toggle("opacity-50", !visible);
      wrap.querySelectorAll<HTMLInputElement>("[data-dish-choice], [data-dish-select]").forEach(
        (input) => {
          input.disabled = !visible;
        },
      );
      wrap.querySelectorAll<HTMLButtonElement>("[data-dish-tag-remove]").forEach((btn) => {
        btn.disabled = !visible;
      });
    });
  });
}

export function bindProductRemarkUi(_root: ParentNode = document): void {
  ensureProductRemarkDishesMigrated();
}
