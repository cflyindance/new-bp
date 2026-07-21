/**
 * 前厅 · 订单类型与取餐：订单类型可用范围（seq 487）
 * 支持多产线独立配置可用订单类型（堂吃/外带/来取）；样式对齐点单显示座位。
 */

import { FOH_LINE_CONFIG_ROW_ATTR, getFohActiveLineFilterId } from "./foh-settings-by-line-filter";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const ORDER_TYPE_BY_LINE_SEQ = 487;
const ORDER_TYPE_BY_LINE_STORAGE_ID = "487-order-type-by-line";

type ProductLineId = "kiosk" | "emenu" | "paypad" | "sdi" | "online-order";
type OrderTypeId = "dine-in" | "to-go" | "pick-up";

const PRODUCT_LINES: ReadonlyArray<{ id: ProductLineId; label: string }> = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
];

const ORDER_TYPES: ReadonlyArray<{ id: OrderTypeId; label: string }> = [
  { id: "dine-in", label: "堂吃" },
  { id: "to-go", label: "外带" },
  { id: "pick-up", label: "来取" },
];

type OrderTypeByLineConfig = {
  byLine: Record<ProductLineId, OrderTypeId[]>;
};

const ALL_ORDER_TYPE_IDS = ORDER_TYPES.map((o) => o.id);
const ALL_LINE_IDS = PRODUCT_LINES.map((p) => p.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defaultConfig(): OrderTypeByLineConfig {
  return {
    byLine: {
      kiosk: ["dine-in", "to-go", "pick-up"],
      emenu: ["dine-in", "to-go", "pick-up"],
      paypad: ["dine-in", "to-go", "pick-up"],
      sdi: ["dine-in", "to-go", "pick-up"],
      "online-order": ["to-go", "pick-up"],
    },
  };
}

function migrateLegacyByLineRaw(byLineRaw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...byLineRaw };
  if (out["scan-order"] !== undefined && out.sdi === undefined) {
    out.sdi = out["scan-order"];
  }
  delete out["scan-order"];
  return out;
}

function normalizeOrderTypeIds(values: unknown): OrderTypeId[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<OrderTypeId>();
  const out: OrderTypeId[] = [];
  for (const v of values) {
    if (typeof v !== "string") continue;
    if (!ALL_ORDER_TYPE_IDS.includes(v as OrderTypeId)) continue;
    const id = v as OrderTypeId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function normalizeConfig(raw: unknown): OrderTypeByLineConfig {
  const base = defaultConfig();
  if (!raw || typeof raw !== "object") return base;
  const byLineRaw = (raw as { byLine?: unknown }).byLine;
  if (!byLineRaw || typeof byLineRaw !== "object") return base;

  const migrated = migrateLegacyByLineRaw(byLineRaw as Record<string, unknown>);
  const byLine = { ...base.byLine };
  for (const lineId of ALL_LINE_IDS) {
    byLine[lineId] = normalizeOrderTypeIds(migrated[lineId]);
  }
  return { byLine };
}

export function isOrderTypeByLineSeq(seq: number): boolean {
  return seq === ORDER_TYPE_BY_LINE_SEQ;
}

function readOrderTypeByLineConfig(): OrderTypeByLineConfig {
  const raw = readModuleSettingJson<unknown>(ORDER_TYPE_BY_LINE_STORAGE_ID, defaultConfig());
  const normalized = normalizeConfig(raw);
  const byLineRaw = raw && typeof raw === "object" ? (raw as { byLine?: unknown }).byLine : null;
  if (byLineRaw && typeof byLineRaw === "object" && "scan-order" in (byLineRaw as object)) {
    writeOrderTypeByLineConfig(normalized);
  }
  return normalized;
}

function writeOrderTypeByLineConfig(config: OrderTypeByLineConfig): void {
  writeModuleSettingJson(ORDER_TYPE_BY_LINE_STORAGE_ID, normalizeConfig(config));
}

function isChecked(
  config: OrderTypeByLineConfig,
  lineId: ProductLineId,
  typeId: OrderTypeId,
): boolean {
  return (config.byLine[lineId] ?? []).includes(typeId);
}

function renderOrderTypeCheckboxesForLine(
  config: OrderTypeByLineConfig,
  lineId: ProductLineId,
  lineLabel: string,
): string {
  const inputs = ORDER_TYPES.map((type) => {
    const checked = isChecked(config, lineId, type.id);
    return `
      <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(type.id)}"
          data-order-type-line="${escapeHtml(lineId)}"
          data-order-type-id="${escapeHtml(type.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(lineLabel)} ${escapeHtml(type.label)}"
        />
        <span>${escapeHtml(type.label)}</span>
      </label>`;
  }).join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

export function renderOrderTypeByLineEditorHtml(): string {
  const config = readOrderTypeByLineConfig();
  const activeLine = getFohActiveLineFilterId();
  const visibleLines = activeLine
    ? PRODUCT_LINES.filter((line) => line.id === activeLine)
    : PRODUCT_LINES;

  const rows = visibleLines
    .map(
      (line) => `
    <tr class="border-t border-border" data-order-type-row="${escapeHtml(line.id)}" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderOrderTypeCheckboxesForLine(config, line.id, line.label)}
      </td>
    </tr>`,
    )
    .join("");

  return `
    <div data-order-type-by-line-editor class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">可用订单类型（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function bindOrderTypeByLineEditor(): void {
  document.querySelectorAll<HTMLElement>("[data-order-type-by-line-editor]").forEach((editor) => {
    if (editor.dataset.orderTypeByLineBound === "1") return;
    editor.dataset.orderTypeByLineBound = "1";

    const persist = () => {
      const byLine: Record<ProductLineId, OrderTypeId[]> = {
        kiosk: [],
        emenu: [],
        paypad: [],
        sdi: [],
        "online-order": [],
      };
      editor
        .querySelectorAll<HTMLInputElement>("[data-order-type-line][data-order-type-id]:checked")
        .forEach((input) => {
          const line = input.getAttribute("data-order-type-line") as ProductLineId | null;
          const type = input.getAttribute("data-order-type-id") as OrderTypeId | null;
          if (!line || !type) return;
          if (!ALL_LINE_IDS.includes(line) || !ALL_ORDER_TYPE_IDS.includes(type)) return;
          byLine[line].push(type);
        });

      for (const line of ALL_LINE_IDS) {
        byLine[line] = normalizeOrderTypeIds(byLine[line]);
      }

      writeOrderTypeByLineConfig({ byLine });
    };

    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-order-type-line][data-order-type-id]")) return;
      persist();
    });
  });
}
