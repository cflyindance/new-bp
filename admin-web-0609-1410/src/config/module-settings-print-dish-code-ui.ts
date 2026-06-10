/**
 * 后厨 · 跨票种显示：seq 271 打印菜品编号（主开关 + 打包单/订单收据/厨房单多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PRINT_DISH_CODE_BY_TICKET_SEQ = 271;

const TICKETS_STORAGE_ID = "271-print-dish-code-tickets";

export const PRINT_DISH_CODE_TICKET_OPTIONS = [
  { id: "packing-slip", label: "打包单" },
  { id: "order-receipt", label: "订单收据" },
  { id: "kitchen-ticket", label: "厨房单" },
] as const;

export type PrintDishCodeTicketId = (typeof PRINT_DISH_CODE_TICKET_OPTIONS)[number]["id"];

const ALL_TICKET_IDS: PrintDishCodeTicketId[] = PRINT_DISH_CODE_TICKET_OPTIONS.map((t) => t.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizeTicketIds(raw: unknown): PrintDishCodeTicketId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_TICKET_IDS);
  return raw.filter(
    (id): id is PrintDishCodeTicketId => typeof id === "string" && valid.has(id),
  );
}

export function readPrintDishCodeTickets(): PrintDishCodeTicketId[] {
  const stored = readModuleSettingJson<unknown>(TICKETS_STORAGE_ID, null);
  const normalized = normalizeTicketIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(PRINT_DISH_CODE_BY_TICKET_SEQ)) {
    writePrintDishCodeTickets([...ALL_TICKET_IDS]);
    return [...ALL_TICKET_IDS];
  }
  return [];
}

export function writePrintDishCodeTickets(tickets: PrintDishCodeTicketId[]): void {
  const unique = ALL_TICKET_IDS.filter((id) => tickets.includes(id));
  writeModuleSettingJson(TICKETS_STORAGE_ID, unique);
}

export function isPrintDishCodeByTicketSeq(seq: number): boolean {
  return seq === PRINT_DISH_CODE_BY_TICKET_SEQ;
}

function renderTicketsMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readPrintDishCodeTickets());
  const cells = PRINT_DISH_CODE_TICKET_OPTIONS.map((ticket, index) => {
    const checked = selected.has(ticket.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-6 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(ticket.id)}"
          data-print-dish-code-ticket="${escapeHtml(ticket.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(ticket.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(ticket.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-print-dish-code-tickets="${PRINT_DISH_CODE_BY_TICKET_SEQ}"
      role="group"
      aria-label="打印菜品编号适用票种"
    >
      ${cells}
    </div>`;
}

export function renderPrintDishCodeTicketsPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-print-dish-code-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用票种（多选）</p>
      ${renderTicketsMultiselectHtml(on)}
    </div>`;
}

export function setPrintDishCodeTicketsPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-print-dish-code-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-print-dish-code-ticket]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectTicketsFromGroup(group: HTMLElement): PrintDishCodeTicketId[] {
  const tickets: PrintDishCodeTicketId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-print-dish-code-ticket]:checked").forEach((input) => {
    const id = input.getAttribute("data-print-dish-code-ticket");
    if (id && ALL_TICKET_IDS.includes(id as PrintDishCodeTicketId)) {
      tickets.push(id as PrintDishCodeTicketId);
    }
  });
  writePrintDishCodeTickets(tickets);
  return tickets;
}

export function bindPrintDishCodeByTicketUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-print-dish-code-tickets]").forEach((group) => {
    if (group.dataset.printDishCodeBound === "1") return;
    group.dataset.printDishCodeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-print-dish-code-ticket]")) return;
      collectTicketsFromGroup(group);
    });
  });
}
