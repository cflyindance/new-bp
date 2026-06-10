/**
 * 后厨 · 跨票种显示：seq 258 外带订单增强显示（主开关 + 打包单/订单收据/厨房单多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const TAKEOUT_ENHANCED_DISPLAY_SEQ = 258;

const TICKETS_STORAGE_ID = "258-takeout-enhanced-display-tickets";

/** 旧版文案仅含厨房单/收据单，迁移默认不含打包单 */
const LEGACY_DEFAULT_TICKETS = ["kitchen-ticket", "order-receipt"] as const;

export const TAKEOUT_ENHANCED_DISPLAY_TICKET_OPTIONS = [
  { id: "packing-slip", label: "打包单" },
  { id: "order-receipt", label: "订单收据" },
  { id: "kitchen-ticket", label: "厨房单" },
] as const;

export type TakeoutEnhancedDisplayTicketId =
  (typeof TAKEOUT_ENHANCED_DISPLAY_TICKET_OPTIONS)[number]["id"];

const ALL_TICKET_IDS: TakeoutEnhancedDisplayTicketId[] =
  TAKEOUT_ENHANCED_DISPLAY_TICKET_OPTIONS.map((t) => t.id);

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

function normalizeTicketIds(raw: unknown): TakeoutEnhancedDisplayTicketId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_TICKET_IDS);
  return raw.filter(
    (id): id is TakeoutEnhancedDisplayTicketId => typeof id === "string" && valid.has(id),
  );
}

export function readTakeoutEnhancedDisplayTickets(): TakeoutEnhancedDisplayTicketId[] {
  const stored = readModuleSettingJson<unknown>(TICKETS_STORAGE_ID, null);
  const normalized = normalizeTicketIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(TAKEOUT_ENHANCED_DISPLAY_SEQ)) {
    const legacy = [...LEGACY_DEFAULT_TICKETS] as TakeoutEnhancedDisplayTicketId[];
    writeTakeoutEnhancedDisplayTickets(legacy);
    return legacy;
  }
  return [];
}

export function writeTakeoutEnhancedDisplayTickets(
  tickets: TakeoutEnhancedDisplayTicketId[],
): void {
  const unique = ALL_TICKET_IDS.filter((id) => tickets.includes(id));
  writeModuleSettingJson(TICKETS_STORAGE_ID, unique);
}

export function isTakeoutEnhancedDisplaySeq(seq: number): boolean {
  return seq === TAKEOUT_ENHANCED_DISPLAY_SEQ;
}

function renderTicketsMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readTakeoutEnhancedDisplayTickets());
  const cells = TAKEOUT_ENHANCED_DISPLAY_TICKET_OPTIONS.map((ticket, index) => {
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
          data-takeout-enhanced-display-ticket="${escapeHtml(ticket.id)}"
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
      data-takeout-enhanced-display-tickets="${TAKEOUT_ENHANCED_DISPLAY_SEQ}"
      role="group"
      aria-label="外带订单增强显示适用票种"
    >
      ${cells}
    </div>`;
}

export function renderTakeoutEnhancedDisplayPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-takeout-enhanced-display-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用票种（多选）</p>
      ${renderTicketsMultiselectHtml(on)}
    </div>`;
}

export function setTakeoutEnhancedDisplayPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-takeout-enhanced-display-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-takeout-enhanced-display-ticket]").forEach(
        (input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        },
      );
    });
}

function collectTicketsFromGroup(group: HTMLElement): TakeoutEnhancedDisplayTicketId[] {
  const tickets: TakeoutEnhancedDisplayTicketId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-takeout-enhanced-display-ticket]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-takeout-enhanced-display-ticket");
      if (id && ALL_TICKET_IDS.includes(id as TakeoutEnhancedDisplayTicketId)) {
        tickets.push(id as TakeoutEnhancedDisplayTicketId);
      }
    });
  writeTakeoutEnhancedDisplayTickets(tickets);
  return tickets;
}

export function bindTakeoutEnhancedDisplayUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-takeout-enhanced-display-tickets]").forEach((group) => {
    if (group.dataset.takeoutEnhancedDisplayBound === "1") return;
    group.dataset.takeoutEnhancedDisplayBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-takeout-enhanced-display-ticket]")) return;
      collectTicketsFromGroup(group);
    });
  });
}
