/**
 * 前厅管理中心 · 主界面与导航 · 默认主界面（seq 165）。
 * 门店兜底：员工登录 POS / POS GO / PayPad 后的默认落地页。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const DEFAULT_MAIN_SCREEN_SEQ = 165;

const DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID = "165-default-main-screen-by-line";

export const STAFF_TERMINAL_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type StaffTerminalProductLineId = (typeof STAFF_TERMINAL_PRODUCT_LINES)[number]["id"];

export const DEFAULT_MAIN_SCREEN_OPTIONS = [
  { value: "MAIN", label: "MAIN（主页）" },
  { value: "TABLE", label: "TABLE（桌台）" },
  { value: "ORDER", label: "ORDER（点单）" },
  { value: "RECALL", label: "RECALL（找单）" },
] as const;

export type DefaultMainScreen = (typeof DEFAULT_MAIN_SCREEN_OPTIONS)[number]["value"];

export type DefaultMainScreenByLine = Record<StaffTerminalProductLineId, DefaultMainScreen>;

const DEFAULT_SCREEN: DefaultMainScreen = "ORDER";

const ALL_LINE_IDS = STAFF_TERMINAL_PRODUCT_LINES.map((l) => l.id);
const VALID_SCREENS = new Set<string>(DEFAULT_MAIN_SCREEN_OPTIONS.map((o) => o.value));

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMainScreen(value: string): value is DefaultMainScreen {
  return VALID_SCREENS.has(value);
}

function defaultMainScreenByLine(screen: DefaultMainScreen = DEFAULT_SCREEN): DefaultMainScreenByLine {
  return Object.fromEntries(ALL_LINE_IDS.map((id) => [id, screen])) as DefaultMainScreenByLine;
}

function normalizeMainScreenByLine(raw: Partial<DefaultMainScreenByLine>): DefaultMainScreenByLine {
  const base = defaultMainScreenByLine();
  for (const line of STAFF_TERMINAL_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = isValidMainScreen(String(v ?? "")) ? v! : DEFAULT_SCREEN;
  }
  return base;
}

export function readDefaultMainScreenByLine(): DefaultMainScreenByLine {
  const raw = readModuleSettingJson<Partial<DefaultMainScreenByLine>>(
    DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeMainScreenByLine(raw);
  }
  const initial = defaultMainScreenByLine();
  writeDefaultMainScreenByLine(initial);
  return initial;
}

export function writeDefaultMainScreenByLine(values: DefaultMainScreenByLine): void {
  writeModuleSettingJson(DEFAULT_MAIN_SCREEN_BY_LINE_STORAGE_ID, normalizeMainScreenByLine(values));
}

export function isDefaultMainScreenSeq(seq: number): boolean {
  return seq === DEFAULT_MAIN_SCREEN_SEQ;
}

export function renderPosShellLandingGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组配置店员端终端登录后的<strong>默认主界面（壳层路由）</strong>。
      作用于员工登录 <strong>POS / POS GO / PayPad</strong> 后的首个落地页；为<strong>门店 × 产线</strong>兜底，未单独配置角色/员工时生效。
    </p>`;
}

export function renderDefaultMainScreenEditorHtml(): string {
  const values = readDefaultMainScreenByLine();
  const optionHeaders = DEFAULT_MAIN_SCREEN_OPTIONS.map(
    (opt) => `<th class="px-2 py-2 font-medium text-center">${escapeHtml(opt.value)}</th>`,
  ).join("");

  const rows = STAFF_TERMINAL_PRODUCT_LINES.map((line) => {
    const groupName = `default-main-screen-${line.id}`;
    const cells = DEFAULT_MAIN_SCREEN_OPTIONS.map((opt) => {
      const checked = values[line.id] === opt.value;
      return `
        <td class="px-2 py-2 text-center">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-default-main-screen-line="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
        </td>`;
    }).join("");

    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap">${escapeHtml(line.label)}</td>
      ${cells}
    </tr>`;
  }).join("");

  return `
    <div data-default-main-screen-editor class="space-y-2">
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        设置员工登录对应终端后，门店兜底的默认主界面：<strong>MAIN</strong> 主页、<strong>TABLE</strong> 桌台、<strong>ORDER</strong> 点单、<strong>RECALL</strong> 找单；各产线独立配置。
      </p>
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium">产线</th>
              ${optionHeaders}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="m-0 text-xs text-muted-foreground">
        MAIN / TABLE / ORDER / RECALL 为 POS 壳层路由标识；员工仍可在会话内切换页面。
      </p>
    </div>`;
}

function collectMainScreenByLineFromEditor(editor: HTMLElement): DefaultMainScreenByLine {
  const values = readDefaultMainScreenByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-default-main-screen-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-default-main-screen-line") as StaffTerminalProductLineId | null;
    const value = input.value;
    if (!lineId || !isValidMainScreen(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindDefaultMainScreenEditor(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-default-main-screen-editor]").forEach((editor) => {
    if (editor.dataset.defaultMainScreenEditorBound === "1") return;
    editor.dataset.defaultMainScreenEditorBound = "1";
    editor.addEventListener("change", (e) => {
      if (!(e.target as HTMLElement).matches("[data-default-main-screen-line]")) return;
      writeDefaultMainScreenByLine(collectMainScreenByLineFromEditor(editor));
    });
  });
}
