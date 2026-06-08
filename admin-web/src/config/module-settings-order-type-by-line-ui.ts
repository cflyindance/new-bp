/**
 * 前厅 · 订单类型与取餐：订单类型可用范围（seq 487）
 * 支持多产线独立配置可用订单类型（堂吃/外带/来取）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR, getFohActiveLineFilterId } from "./foh-settings-by-line-filter";
import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
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

export function renderOrderTypeByLineEditorHtml(): string {
  const config = readOrderTypeByLineConfig();
  const activeLine = getFohActiveLineFilterId();
  const visibleLines = activeLine
    ? PRODUCT_LINES.filter((line) => line.id === activeLine)
    : PRODUCT_LINES;
  const headCells = ORDER_TYPES.map(
    (o) =>
      `<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">${escapeHtml(o.label)}</th>`,
  ).join("");

  const rows = visibleLines.map((line) => {
    const cells = ORDER_TYPES.map((type) => {
      const checked = isChecked(config, line.id, type.id);
      return `
        <td class="border-t border-border px-2 py-2 text-center align-middle">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
            ${checked ? "checked" : ""}
            data-order-type-line="${escapeHtml(line.id)}"
            data-order-type-id="${escapeHtml(type.id)}"
          />
        </td>`;
    }).join("");
    return `
      <tr data-order-type-row="${escapeHtml(line.id)}" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
        <th scope="row" class="border-t border-border px-3 py-2 text-left text-sm font-medium text-foreground whitespace-nowrap">${escapeHtml(line.label)}</th>
        ${cells}
      </tr>`;
  }).join("");

  return `
    <div class="space-y-2" data-order-type-by-line-editor>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[34rem] border-collapse">
          <thead class="bg-muted/40">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">产线 \\ 订单类型</th>
              ${headCells}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground">可按产线独立设置可用订单类型（堂吃/外带/来取）。</p>
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

