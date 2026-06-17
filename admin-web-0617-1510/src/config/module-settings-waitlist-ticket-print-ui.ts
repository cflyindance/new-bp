/**
 * 预约等位中心 · 等位出纸与凭条：打印小票（seq 11）— 适用产线多选。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const WAITLIST_TICKET_PRINT_SEQ = 11;

const WAITLIST_TICKET_PRINT_LINES_STORAGE_ID = "11-waitlist-ticket-print-lines";

export const WAITLIST_TICKET_PRINT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type WaitlistTicketPrintLineId = (typeof WAITLIST_TICKET_PRINT_LINES)[number]["id"];

const ALL_LINE_IDS: WaitlistTicketPrintLineId[] = WAITLIST_TICKET_PRINT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    return raw === "1" || raw === "true";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): WaitlistTicketPrintLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is WaitlistTicketPrintLineId => typeof id === "string" && valid.has(id),
  );
}

export function readWaitlistTicketPrintLines(): WaitlistTicketPrintLineId[] {
  const stored = readModuleSettingJson<unknown>(WAITLIST_TICKET_PRINT_LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(WAITLIST_TICKET_PRINT_SEQ)) {
    writeWaitlistTicketPrintLines([...ALL_LINE_IDS]);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeWaitlistTicketPrintLines(lines: WaitlistTicketPrintLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(WAITLIST_TICKET_PRINT_LINES_STORAGE_ID, unique);
}

export function isWaitlistTicketPrintSeq(seq: number): boolean {
  return seq === WAITLIST_TICKET_PRINT_SEQ;
}

export function renderWaitlistTicketPrintByLineHtml(): string {
  const selected = new Set(readWaitlistTicketPrintLines());
  const cells = WAITLIST_TICKET_PRINT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-waitlist-ticket-print-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-waitlist-ticket-print-by-line="${WAITLIST_TICKET_PRINT_SEQ}"
      role="group"
      aria-label="等位取号打印纸质凭条适用产线"
    >
      ${cells}
    </div>
    <p class="mt-2 text-xs text-muted-foreground">
      出纸依赖终端绑定的
      <a href="#/device-management/hardware/printers" class="font-medium text-primary hover:underline">等位打印机</a>
      （Kiosk / eMenu 编辑页 → 客户端绑定）。
    </p>`;
}

function collectWaitlistTicketPrintLines(group: HTMLElement): void {
  const lines: WaitlistTicketPrintLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-waitlist-ticket-print-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-waitlist-ticket-print-line");
    if (id && ALL_LINE_IDS.includes(id as WaitlistTicketPrintLineId)) {
      lines.push(id as WaitlistTicketPrintLineId);
    }
  });
  writeWaitlistTicketPrintLines(lines);
}

export function bindWaitlistTicketPrintUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-waitlist-ticket-print-by-line]").forEach((group) => {
    if (group.dataset.waitlistTicketPrintBound === "1") return;
    group.dataset.waitlistTicketPrintBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-waitlist-ticket-print-line]")) return;
      collectWaitlistTicketPrintLines(group);
    });
  });
}
