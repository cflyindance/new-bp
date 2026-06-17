/**
 * 前厅 · 送厨流程：seq 581 下单后送厨方式（各产线：自动送厨 / 手动送厨）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const POST_ORDER_KITCHEN_SEND_MODE_SEQ = 581;

const MODE_BY_LINE_STORAGE_ID = "581-post-order-kitchen-send-mode-by-line";

export const POST_ORDER_KITCHEN_SEND_MODE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type PostOrderKitchenSendModeProductLineId =
  (typeof POST_ORDER_KITCHEN_SEND_MODE_PRODUCT_LINES)[number]["id"];

export type PostOrderKitchenSendMode = "auto" | "manual";

export type PostOrderKitchenSendModeByLine = Record<
  PostOrderKitchenSendModeProductLineId,
  PostOrderKitchenSendMode
>;

const ALL_LINE_IDS: PostOrderKitchenSendModeProductLineId[] =
  POST_ORDER_KITCHEN_SEND_MODE_PRODUCT_LINES.map((l) => l.id);

const DEFAULT_MODE: PostOrderKitchenSendMode = "manual";

export const POST_ORDER_KITCHEN_SEND_MODE_OPTIONS: ReadonlyArray<{
  value: PostOrderKitchenSendMode;
  label: string;
}> = [
  { value: "auto", label: "自动送厨" },
  { value: "manual", label: "手动送厨" },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMode(value: string): value is PostOrderKitchenSendMode {
  return value === "auto" || value === "manual";
}

function defaultModeByLine(): PostOrderKitchenSendModeByLine {
  return Object.fromEntries(ALL_LINE_IDS.map((id) => [id, DEFAULT_MODE])) as PostOrderKitchenSendModeByLine;
}

function normalizeModeByLine(raw: unknown): PostOrderKitchenSendModeByLine {
  const base = defaultModeByLine();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Partial<Record<string, unknown>>;
  for (const lineId of ALL_LINE_IDS) {
    const value = record[lineId];
    if (typeof value === "string" && isValidMode(value)) {
      base[lineId] = value;
    }
  }
  return base;
}

export function readPostOrderKitchenSendModeByLine(): PostOrderKitchenSendModeByLine {
  const raw = readModuleSettingJson<unknown>(MODE_BY_LINE_STORAGE_ID, null);
  return normalizeModeByLine(raw);
}

export function writePostOrderKitchenSendModeByLine(values: PostOrderKitchenSendModeByLine): void {
  writeModuleSettingJson(MODE_BY_LINE_STORAGE_ID, values);
}

export function isPostOrderKitchenSendModeSeq(seq: number): boolean {
  return seq === POST_ORDER_KITCHEN_SEND_MODE_SEQ;
}

function renderModeRadiosForLine(options: {
  lineId: PostOrderKitchenSendModeProductLineId;
  lineLabel: string;
  mode: PostOrderKitchenSendMode;
}): string {
  const groupName = `post-order-kitchen-send-mode-${options.lineId}`;
  const radios = POST_ORDER_KITCHEN_SEND_MODE_OPTIONS.map((opt) => {
    const checked = options.mode === opt.value;
    return `
        <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-post-order-kitchen-send-mode-line="${escapeHtml(options.lineId)}"
            aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
  }).join("");

  return `
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4" role="radiogroup" aria-label="${escapeHtml(options.lineLabel)} 下单后送厨方式">${radios}</div>`;
}

export function renderPostOrderKitchenSendModeByLineTableHtml(): string {
  const values = readPostOrderKitchenSendModeByLine();
  const rows = POST_ORDER_KITCHEN_SEND_MODE_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderModeRadiosForLine({
          lineId: line.id,
          lineLabel: line.label,
          mode: values[line.id],
        })}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-post-order-kitchen-send-mode-by-line-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[22rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">下单后送厨方式</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderPostOrderKitchenSendModeRowHtml(_seq: number): string {
  return `
    <p class="m-0 text-xs leading-relaxed text-muted-foreground">
      各产线独立配置：订单提交后<strong>自动送厨</strong>，或由服务员在终端<strong>手动送厨</strong>。
    </p>
    <div class="mt-3 max-w-2xl">
      ${renderPostOrderKitchenSendModeByLineTableHtml()}
    </div>`;
}

function collectModeByLineFromRoot(root: ParentNode): PostOrderKitchenSendModeByLine {
  const values = readPostOrderKitchenSendModeByLine();
  root.querySelectorAll<HTMLInputElement>("[data-post-order-kitchen-send-mode-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute(
      "data-post-order-kitchen-send-mode-line",
    ) as PostOrderKitchenSendModeProductLineId | null;
    const value = input.value;
    if (!lineId || !ALL_LINE_IDS.includes(lineId) || !isValidMode(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindPostOrderKitchenSendModeUi(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>("[data-post-order-kitchen-send-mode-by-line-editor]")
    .forEach((editor) => {
      if (editor.dataset.postOrderKitchenSendModeByLineBound === "1") return;
      editor.dataset.postOrderKitchenSendModeByLineBound = "1";
      editor.addEventListener("change", (e) => {
        if ((e.target as HTMLElement).matches("[data-post-order-kitchen-send-mode-line]")) {
          writePostOrderKitchenSendModeByLine(collectModeByLineFromRoot(editor));
        }
      });
    });
}
