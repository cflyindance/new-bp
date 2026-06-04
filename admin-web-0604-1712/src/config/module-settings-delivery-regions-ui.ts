/**
 * 外卖/来取 · 外送区域设置（seq 429）
 * 支持新增/删除区域行，字段：城市、州/省、邮编。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const DELIVERY_REGION_SEQ = 429;
export const DELIVERY_REGION_STORAGE_FIELD_ID = "429-delivery-regions";

export type DeliveryRegion = {
  id: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
};

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newRegionId(): string {
  return `dr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeRegion(raw: Partial<DeliveryRegion>): DeliveryRegion {
  return {
    id: raw.id ?? newRegionId(),
    city: (raw.city ?? "").trim(),
    stateOrProvince: (raw.stateOrProvince ?? "").trim(),
    postalCode: (raw.postalCode ?? "").trim(),
  };
}

function defaultRegions(): DeliveryRegion[] {
  return [
    normalizeRegion({ city: "San Jose", stateOrProvince: "CA", postalCode: "95112" }),
  ];
}

export function isDeliveryRegionSeq(seq: number): boolean {
  return seq === DELIVERY_REGION_SEQ;
}

export function readDeliveryRegions(): DeliveryRegion[] {
  const raw = readModuleSettingJson<Partial<DeliveryRegion>[]>(DELIVERY_REGION_STORAGE_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return defaultRegions();
  return raw.map((r) => normalizeRegion(r)).filter((r) => r.id);
}

function writeDeliveryRegions(regions: DeliveryRegion[]): void {
  writeModuleSettingJson(
    DELIVERY_REGION_STORAGE_FIELD_ID,
    regions.map((r) => normalizeRegion(r)),
  );
}

function renderRegionRow(region: DeliveryRegion): string {
  return `
    <div
      class="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/20 p-2 sm:grid-cols-[1fr_1fr_140px_auto]"
      data-delivery-region-row
      data-region-id="${escapeHtml(region.id)}"
    >
      <label class="space-y-1">
        <span class="block text-xs text-muted-foreground">城市</span>
        <input
          type="text"
          class="${INPUT_CLASS}"
          value="${escapeHtml(region.city)}"
          placeholder="请输入城市"
          data-delivery-region-city
        />
      </label>
      <label class="space-y-1">
        <span class="block text-xs text-muted-foreground">州/省</span>
        <input
          type="text"
          class="${INPUT_CLASS}"
          value="${escapeHtml(region.stateOrProvince)}"
          placeholder="请输入州/省"
          data-delivery-region-state
        />
      </label>
      <label class="space-y-1">
        <span class="block text-xs text-muted-foreground">邮编</span>
        <input
          type="text"
          class="${INPUT_CLASS}"
          value="${escapeHtml(region.postalCode)}"
          placeholder="请输入邮编"
          data-delivery-region-zip
        />
      </label>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center self-end rounded-md border border-border px-3 text-sm text-destructive hover:bg-destructive/10"
        data-delivery-region-remove
      >删除</button>
    </div>`;
}

function collectRegions(editor: HTMLElement): DeliveryRegion[] {
  return [...editor.querySelectorAll<HTMLElement>("[data-delivery-region-row]")]
    .map((row) => {
      const id = row.getAttribute("data-region-id") ?? newRegionId();
      const city = row.querySelector<HTMLInputElement>("[data-delivery-region-city]")?.value.trim() ?? "";
      const stateOrProvince =
        row.querySelector<HTMLInputElement>("[data-delivery-region-state]")?.value.trim() ?? "";
      const postalCode =
        row.querySelector<HTMLInputElement>("[data-delivery-region-zip]")?.value.trim() ?? "";
      return normalizeRegion({ id, city, stateOrProvince, postalCode });
    })
    .filter((r) => r.city || r.stateOrProvince || r.postalCode);
}

function renderRows(editor: HTMLElement, regions: DeliveryRegion[]): void {
  const rowsWrap = editor.querySelector<HTMLElement>("[data-delivery-region-rows]");
  if (!rowsWrap) return;
  rowsWrap.innerHTML = regions.map(renderRegionRow).join("");
}

export function renderDeliveryRegionEditorHtml(): string {
  const regions = readDeliveryRegions();
  return `
    <div
      class="mt-3 space-y-2 rounded-md border border-input bg-background p-3"
      data-delivery-region-editor
    >
      <div class="space-y-2" data-delivery-region-rows>
        ${regions.map(renderRegionRow).join("")}
      </div>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-primary hover:bg-primary/10"
        data-delivery-region-add
      >新增区域</button>
    </div>`;
}

export function bindDeliveryRegionEditor(): void {
  document.querySelectorAll<HTMLElement>("[data-delivery-region-editor]").forEach((editor) => {
    if (editor.dataset.deliveryRegionBound === "1") return;
    editor.dataset.deliveryRegionBound = "1";

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-delivery-region-add]")) {
        const regions = collectRegions(editor);
        regions.push(normalizeRegion({ id: newRegionId() }));
        writeDeliveryRegions(regions);
        renderRows(editor, regions);
        return;
      }

      const removeBtn = target.closest("[data-delivery-region-remove]");
      if (!removeBtn) return;
      const row = removeBtn.closest<HTMLElement>("[data-delivery-region-row]");
      if (!row) return;
      row.remove();
      const regions = collectRegions(editor);
      writeDeliveryRegions(regions);
      renderRows(editor, regions.length > 0 ? regions : []);
    });

    const persist = () => writeDeliveryRegions(collectRegions(editor));
    editor.addEventListener("input", persist);
    editor.addEventListener("change", persist);
  });
}
