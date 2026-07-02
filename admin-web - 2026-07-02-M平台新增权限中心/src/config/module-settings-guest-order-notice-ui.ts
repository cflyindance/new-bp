/**
 * 前厅 · 食客端·下单与规则：seq 569 点单须知（主开关 + 各产线独立标题/内容）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  readModuleSettingText,
  writeModuleSettingText,
} from "./module-settings-nested-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_ORDER_NOTICE_SEQ = 569;

const NOTICE_BY_LINE_STORAGE_ID = "569-order-notice-by-line";

/** @deprecated 仅用于旧版全局文案迁移 */
const LEGACY_TITLE_FIELD_ID = "569-title";
const LEGACY_CONTENT_FIELD_ID = "569-content";

export const GUEST_ORDER_NOTICE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type GuestOrderNoticeProductLineId =
  (typeof GUEST_ORDER_NOTICE_PRODUCT_LINES)[number]["id"];

export type GuestOrderNoticeCopy = {
  title: string;
  content: string;
};

export type GuestOrderNoticeByLine = Record<
  GuestOrderNoticeProductLineId,
  GuestOrderNoticeCopy
>;

export const GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH = 20;
export const GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH = 200;

const ALL_LINE_IDS: GuestOrderNoticeProductLineId[] =
  GUEST_ORDER_NOTICE_PRODUCT_LINES.map((l) => l.id);

const EMPTY_COPY: GuestOrderNoticeCopy = { title: "", content: "" };

const INPUT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textCounter(len: number, max: number): string {
  return `${len} / ${max}`;
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_ORDER_NOTICE_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestOrderNoticeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_ORDER_NOTICE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_ORDER_NOTICE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function defaultNoticeByLine(copy: GuestOrderNoticeCopy = EMPTY_COPY): GuestOrderNoticeByLine {
  return {
    kiosk: { ...copy },
    emenu: { ...copy },
    sdi: { ...copy },
    "online-order": { ...copy },
  };
}

function normalizeCopy(raw: unknown): GuestOrderNoticeCopy {
  if (!raw || typeof raw !== "object") return { ...EMPTY_COPY };
  const row = raw as Partial<GuestOrderNoticeCopy>;
  const title = typeof row.title === "string" ? row.title.slice(0, GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH) : "";
  const content =
    typeof row.content === "string" ? row.content.slice(0, GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH) : "";
  return { title, content };
}

function normalizeNoticeByLine(raw: Partial<Record<string, unknown>>): GuestOrderNoticeByLine {
  const base = defaultNoticeByLine();
  for (const line of GUEST_ORDER_NOTICE_PRODUCT_LINES) {
    base[line.id] = normalizeCopy(raw[line.id]);
  }
  return base;
}

function migrateFromLegacyGlobalCopy(): GuestOrderNoticeByLine {
  const legacy: GuestOrderNoticeCopy = {
    title: readModuleSettingText(LEGACY_TITLE_FIELD_ID, ""),
    content: readModuleSettingText(LEGACY_CONTENT_FIELD_ID, ""),
  };
  return defaultNoticeByLine(legacy);
}

export function readGuestOrderNoticeByLine(): GuestOrderNoticeByLine {
  ensureGuestOrderNoticeToggleMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(NOTICE_BY_LINE_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeNoticeByLine(raw);
  }

  const migrated = migrateFromLegacyGlobalCopy();
  writeGuestOrderNoticeByLine(migrated);
  return migrated;
}

export function writeGuestOrderNoticeByLine(values: GuestOrderNoticeByLine): void {
  writeModuleSettingJson(NOTICE_BY_LINE_STORAGE_ID, normalizeNoticeByLine(values));
}

export function isGuestOrderNoticeSeq(seq: number): boolean {
  return seq === GUEST_ORDER_NOTICE_SEQ;
}

function renderLineCopyFields(line: (typeof GUEST_ORDER_NOTICE_PRODUCT_LINES)[number], copy: GuestOrderNoticeCopy, enabled: boolean): string {
  const disabled = enabled ? "" : "disabled";
  return `
    <div class="space-y-3" data-guest-order-notice-line-block="${escapeHtml(line.id)}">
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">标题</label>
        <div class="relative">
          <input
            type="text"
            class="${INPUT_CLASS} pr-14"
            maxlength="${GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH}"
            value="${escapeHtml(copy.title)}"
            placeholder=""
            data-guest-order-notice-line="${escapeHtml(line.id)}"
            data-guest-order-notice-field="title"
            data-max-length="${GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH}"
            ${disabled}
            aria-label="${escapeHtml(line.label)} 点单须知标题"
          />
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground" data-guest-order-notice-counter="title">${escapeHtml(textCounter(copy.title.length, GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH))}</span>
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">内容</label>
        <textarea
          rows="3"
          class="${INPUT_CLASS} min-h-[4.5rem] resize-y"
          maxlength="${GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH}"
          placeholder=""
          data-guest-order-notice-line="${escapeHtml(line.id)}"
          data-guest-order-notice-field="content"
          data-max-length="${GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH}"
          ${disabled}
          aria-label="${escapeHtml(line.label)} 点单须知内容"
        >${escapeHtml(copy.content)}</textarea>
        <div class="flex justify-end">
          <span class="text-xs tabular-nums text-muted-foreground" data-guest-order-notice-counter="content">${escapeHtml(textCounter(copy.content.length, GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH))}</span>
        </div>
      </div>
    </div>`;
}

export function renderGuestOrderNoticeByLineEditorHtml(): string {
  const values = readGuestOrderNoticeByLine();
  const rows = GUEST_ORDER_NOTICE_PRODUCT_LINES.map((line) => {
    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">${renderLineCopyFields(line, values[line.id], true)}</td>
    </tr>`;
  }).join("");

  return `
    <div data-guest-order-notice-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        每条产线独立配置点单须知弹框的标题（${GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH} 字）与内容（${GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH} 字）。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[6.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">标题与内容</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderGuestOrderNoticePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-4xl ${hidden}"
      data-guest-order-notice-panel="${GUEST_ORDER_NOTICE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderGuestOrderNoticeByLineEditorHtml()}
    </div>`;
}

function syncTextCounter(el: HTMLInputElement | HTMLTextAreaElement): void {
  const max = Number(el.getAttribute("data-max-length") ?? "0");
  if (!max) return;
  const field = el.getAttribute("data-guest-order-notice-field");
  const block = el.closest("[data-guest-order-notice-line-block]");
  const counter = block?.querySelector(`[data-guest-order-notice-counter="${field}"]`);
  if (counter) counter.textContent = textCounter(el.value.length, max);
}

export function setGuestOrderNoticePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-order-notice-panel="${GUEST_ORDER_NOTICE_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
      panel.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-guest-order-notice-line]").forEach((input) => {
        input.disabled = !visible;
      });
    });
}

function collectNoticeByLineFromEditor(editor: HTMLElement): GuestOrderNoticeByLine {
  const values = readGuestOrderNoticeByLine();
  for (const line of GUEST_ORDER_NOTICE_PRODUCT_LINES) {
    const block = editor.querySelector<HTMLElement>(
      `[data-guest-order-notice-line-block="${line.id}"]`,
    );
    if (!block) continue;
    const titleEl = block.querySelector<HTMLInputElement>(
      `[data-guest-order-notice-line="${line.id}"][data-guest-order-notice-field="title"]`,
    );
    const contentEl = block.querySelector<HTMLTextAreaElement>(
      `[data-guest-order-notice-line="${line.id}"][data-guest-order-notice-field="content"]`,
    );
    values[line.id] = {
      title: (titleEl?.value ?? "").slice(0, GUEST_ORDER_NOTICE_TITLE_MAX_LENGTH),
      content: (contentEl?.value ?? "").slice(0, GUEST_ORDER_NOTICE_CONTENT_MAX_LENGTH),
    };
  }
  return values;
}

function persistFromEditor(editor: HTMLElement): void {
  writeGuestOrderNoticeByLine(collectNoticeByLineFromEditor(editor));
}

export function bindGuestOrderNoticeUi(root: ParentNode = document): void {
  ensureGuestOrderNoticeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-order-notice-editor]").forEach((editor) => {
    if (editor.dataset.guestOrderNoticeEditorBound === "1") return;
    editor.dataset.guestOrderNoticeEditorBound = "1";

    editor.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-guest-order-notice-line]").forEach((el) => {
      syncTextCounter(el);
      const persist = () => {
        const max = Number(el.getAttribute("data-max-length") ?? "0");
        if (max > 0 && el.value.length > max) el.value = el.value.slice(0, max);
        syncTextCounter(el);
        persistFromEditor(editor);
      };
      el.addEventListener("input", persist);
      el.addEventListener("change", persist);
      el.addEventListener("blur", persist);
    });
  });
}
