/**
 * 前厅 · 计时与自助餐规则：用餐时长限制（674）与展示/提醒联动（577–580）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import { readModuleSettingJsonState } from "./module-setting-storage-state";
import { writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_DINING_DURATION_LIMIT_SEQ = 674;
export const GUEST_SHOW_DINING_DURATION_SEQ = 577;
export const GUEST_DINING_DURATION_COUNTDOWN_SEQ = 578;
export const GUEST_DINING_REMAINING_ALERT_SEQ = 579;
export const GUEST_DINING_BLOCK_ORDER_AFTER_ALERT_SEQ = 580;

export const GUEST_DINING_DURATION_SEQS = [
  GUEST_SHOW_DINING_DURATION_SEQ,
  GUEST_DINING_DURATION_COUNTDOWN_SEQ,
  GUEST_DINING_REMAINING_ALERT_SEQ,
  GUEST_DINING_BLOCK_ORDER_AFTER_ALERT_SEQ,
] as const;

export type GuestDiningDurationSeq = (typeof GUEST_DINING_DURATION_SEQS)[number];

export const GUEST_DINING_DURATION_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestDiningDurationProductLineId =
  (typeof GUEST_DINING_DURATION_PRODUCT_LINES)[number]["id"];

export type DiningDurationLimitLineConfig = {
  enabled: boolean;
  minutes: number;
};

export type DiningDurationLimitByLine = Record<
  GuestDiningDurationProductLineId,
  DiningDurationLimitLineConfig
>;

export const DINING_DURATION_LIMIT_BY_LINE_FIELD_ID =
  "674-dining-duration-limit-by-line";
export const DINING_DURATION_LIMIT_LINES_STORAGE_ID =
  "674-dining-duration-limit-lines";

export const DINING_DURATION_MINUTES_DEFAULT = 120;
export const DINING_DURATION_MINUTES_MIN = 1;
export const DINING_DURATION_MINUTES_MAX = 1440;

const EMENU_LINE_ID: GuestDiningDurationProductLineId = "emenu";
const ALL_LINE_IDS: GuestDiningDurationProductLineId[] =
  GUEST_DINING_DURATION_PRODUCT_LINES.map((line) => line.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";
const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isDiningDurationSeq(seq: number): seq is GuestDiningDurationSeq {
  return (GUEST_DINING_DURATION_SEQS as readonly number[]).includes(seq);
}

function isDiningDurationLineId(raw: unknown): raw is GuestDiningDurationProductLineId {
  return typeof raw === "string" && ALL_LINE_IDS.includes(raw as GuestDiningDurationProductLineId);
}

function linesStorageId(seq: GuestDiningDurationSeq): string {
  return `${seq}-guest-dining-duration-lines`;
}

export function normalizeDiningDurationMinutes(raw: unknown): number {
  if (typeof raw !== "number" && typeof raw !== "string") {
    return DINING_DURATION_MINUTES_DEFAULT;
  }
  if (typeof raw === "string" && raw.trim() === "") {
    return DINING_DURATION_MINUTES_DEFAULT;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) return DINING_DURATION_MINUTES_DEFAULT;
  return Math.min(
    DINING_DURATION_MINUTES_MAX,
    Math.max(DINING_DURATION_MINUTES_MIN, Math.round(value)),
  );
}

export function createDefaultDiningDurationLimitByLine(): DiningDurationLimitByLine {
  return Object.fromEntries(
    GUEST_DINING_DURATION_PRODUCT_LINES.map((line) => [
      line.id,
      { enabled: false, minutes: DINING_DURATION_MINUTES_DEFAULT },
    ]),
  ) as DiningDurationLimitByLine;
}

export function normalizeDiningDurationLimitByLine(raw: unknown): DiningDurationLimitByLine {
  const normalized = createDefaultDiningDurationLimitByLine();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return normalized;
  const record = raw as Record<string, unknown>;
  for (const line of GUEST_DINING_DURATION_PRODUCT_LINES) {
    const value = record[line.id];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const item = value as Partial<DiningDurationLimitLineConfig>;
    normalized[line.id] = {
      enabled: item.enabled === true,
      minutes: normalizeDiningDurationMinutes(item.minutes),
    };
  }
  return normalized;
}

export function readDiningDurationLimitByLine(): DiningDurationLimitByLine {
  const state = readModuleSettingJsonState(DINING_DURATION_LIMIT_BY_LINE_FIELD_ID);
  if (state.state !== "configured") return createDefaultDiningDurationLimitByLine();
  return normalizeDiningDurationLimitByLine(state.value);
}

export function writeDiningDurationLimitByLine(config: DiningDurationLimitByLine): void {
  const normalized = normalizeDiningDurationLimitByLine(config);
  writeModuleSettingJson(DINING_DURATION_LIMIT_BY_LINE_FIELD_ID, normalized);
  writeModuleSettingJson(
    DINING_DURATION_LIMIT_LINES_STORAGE_ID,
    ALL_LINE_IDS.filter((lineId) => normalized[lineId].enabled),
  );
}

export function syncDiningDurationLimitEnabledFromLines(lines: readonly string[]): void {
  const selected = new Set(lines.filter(isDiningDurationLineId));
  const config = readDiningDurationLimitByLine();
  for (const lineId of ALL_LINE_IDS) {
    config[lineId] = { ...config[lineId], enabled: selected.has(lineId) };
  }
  writeDiningDurationLimitByLine(config);
}

export function isGuestDiningDurationLineLimitEnabled(
  lineId: string,
  config: DiningDurationLimitByLine = readDiningDurationLimitByLine(),
): boolean {
  return isDiningDurationLineId(lineId) && config[lineId].enabled;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestDiningDurationToggleMigrated(seq: number): void {
  if (!isDiningDurationSeq(seq) || migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  const state = readModuleSettingJsonState(linesStorageId(seq));
  if (state.state !== "missing" || !readLegacyToggleOn(seq)) return;
  writeGuestDiningDurationLines(seq, [EMENU_LINE_ID]);
}

function ensureAllGuestDiningDurationTogglesMigrated(): void {
  for (const seq of GUEST_DINING_DURATION_SEQS) {
    ensureGuestDiningDurationToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): GuestDiningDurationProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const selected = new Set(raw.filter(isDiningDurationLineId));
  return ALL_LINE_IDS.filter((lineId) => selected.has(lineId));
}

export function readGuestDiningDurationLines(
  seq: GuestDiningDurationSeq,
): GuestDiningDurationProductLineId[] {
  const state = readModuleSettingJsonState(linesStorageId(seq));
  if (state.state === "configured") return normalizeLineIds(state.value);
  if (state.state === "invalid") return [];
  if (!readLegacyToggleOn(seq)) return [];
  writeGuestDiningDurationLines(seq, [EMENU_LINE_ID]);
  return [EMENU_LINE_ID];
}

export function writeGuestDiningDurationLines(
  seq: GuestDiningDurationSeq,
  lines: readonly string[],
): void {
  writeModuleSettingJson(linesStorageId(seq), normalizeLineIds(lines));
}

export function isGuestDiningDurationSeq(seq: number): seq is GuestDiningDurationSeq {
  return isDiningDurationSeq(seq);
}

export function isGuestDiningDurationLimitSeq(seq: number): boolean {
  return seq === GUEST_DINING_DURATION_LIMIT_SEQ;
}

function renderDiningDurationLimitTableHtml(): string {
  const config = readDiningDurationLimitByLine();
  const rows = GUEST_DINING_DURATION_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
      <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
        <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
        <td class="px-3 py-2.5 align-middle">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
              data-guest-dining-duration-limit-enabled="${escapeHtml(line.id)}"
              ${item.enabled ? "checked" : ""}
              aria-label="${escapeHtml(line.label)} 启用用餐时长限制"
            />
          </label>
        </td>
        <td class="px-3 py-2.5 align-middle">
          <div class="flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.minutes))}"
              min="${DINING_DURATION_MINUTES_MIN}"
              max="${DINING_DURATION_MINUTES_MAX}"
              step="1"
              data-guest-dining-duration-limit-minutes="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 用餐时长限制分钟数"
            />
            <span class="text-xs text-muted-foreground">分钟（${DINING_DURATION_MINUTES_MIN}–${DINING_DURATION_MINUTES_MAX}）</span>
          </div>
        </td>
      </tr>`;
  }).join("");

  return `
    <div data-guest-dining-duration-limit-editor="${GUEST_DINING_DURATION_LIMIT_SEQ}" class="mt-3 space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="w-[6rem] px-3 py-2 font-medium">产线</th>
              <th class="w-[5rem] px-3 py-2 font-medium">启用</th>
              <th class="px-3 py-2 font-medium">限制时长</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderGuestDiningDurationLimitPanelHtml(): string {
  return renderDiningDurationLimitTableHtml();
}

function renderLinesMultiselectHtml(seq: GuestDiningDurationSeq, masterEnabled: boolean): string {
  const selected = new Set(readGuestDiningDurationLines(seq));
  const limitConfig = readDiningDurationLimitByLine();
  const cells = GUEST_DINING_DURATION_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    const limitEnabled = limitConfig[line.id].enabled;
    const interactive = masterEnabled && limitEnabled;
    return `
      <label
        class="flex min-w-[7rem] flex-1 flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground ${interactive ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
        ${!limitEnabled ? 'title="需先启用该产线的用餐时长限制"' : ""}
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-dining-duration-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${interactive ? "" : "disabled"}
          aria-disabled="${interactive ? "false" : "true"}"
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
        <span class="text-center text-[11px] leading-tight text-muted-foreground ${limitEnabled ? "hidden" : ""}" data-guest-dining-duration-limit-hint="${escapeHtml(line.id)}">需先启用该产线的用餐时长限制</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-3xl flex-wrap overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-dining-duration-lines="${seq}"
      role="group"
      aria-label="用餐时长设置适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestDiningDurationPanelHtml(
  seq: GuestDiningDurationSeq,
  on: boolean,
): string {
  return `
    <div
      class="mt-3 ${on ? "" : "hidden"}"
      data-guest-dining-duration-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

function setInteractiveLabelState(label: HTMLElement | null, interactive: boolean): void {
  if (!label) return;
  label.classList.toggle("cursor-not-allowed", !interactive);
  label.classList.toggle("opacity-50", !interactive);
  label.classList.toggle("cursor-pointer", interactive);
}

export function refreshGuestDiningDurationLimitDependencies(
  root: ParentNode = document,
): void {
  const limitConfig = readDiningDurationLimitByLine();

  root
    .querySelectorAll<HTMLInputElement>("[data-guest-dining-duration-limit-enabled]")
    .forEach((checkbox) => {
      const lineId = checkbox.getAttribute("data-guest-dining-duration-limit-enabled");
      if (!lineId || !isDiningDurationLineId(lineId)) return;
      checkbox.checked = limitConfig[lineId].enabled;
      const input = checkbox
        .closest("[data-guest-dining-duration-limit-editor]")
        ?.querySelector<HTMLInputElement>(
          `[data-guest-dining-duration-limit-minutes="${lineId}"]`,
        );
      if (input) {
        input.disabled = !limitConfig[lineId].enabled;
        input.value = String(limitConfig[lineId].minutes);
      }
    });

  root.querySelectorAll<HTMLElement>("[data-guest-dining-duration-lines]").forEach((group) => {
    const panel = group.closest<HTMLElement>("[data-guest-dining-duration-panel]");
    const masterEnabled =
      panel !== null &&
      !panel.classList.contains("hidden") &&
      panel.getAttribute("aria-hidden") !== "true";
    group
      .querySelectorAll<HTMLInputElement>("[data-guest-dining-duration-line]")
      .forEach((input) => {
        const lineId = input.getAttribute("data-guest-dining-duration-line");
        if (!lineId || !isDiningDurationLineId(lineId)) return;
        const limitEnabled = limitConfig[lineId].enabled;
        const interactive = masterEnabled && limitEnabled;
        input.disabled = !interactive;
        input.setAttribute("aria-disabled", interactive ? "false" : "true");
        const label = input.closest<HTMLElement>("label");
        setInteractiveLabelState(label, interactive);
        if (label) {
          if (!limitEnabled) label.title = "需先启用该产线的用餐时长限制";
          else label.removeAttribute("title");
        }
        group
          .querySelectorAll<HTMLElement>(
            `[data-guest-dining-duration-limit-hint="${lineId}"]`,
          )
          .forEach((hint) => hint.classList.toggle("hidden", limitEnabled));
      });
  });

  root.querySelectorAll<HTMLElement>("[data-foh-by-line-view]").forEach((container) => {
    const lineId = container.getAttribute("data-foh-by-line-view");
    if (!lineId || !isDiningDurationLineId(lineId)) return;
    const restricted = !limitConfig[lineId].enabled;
    for (const seq of GUEST_DINING_DURATION_SEQS) {
      container
        .querySelectorAll<HTMLButtonElement>(`[data-module-setting-toggle="${seq}"]`)
        .forEach((button) => {
          button.disabled = restricted;
          button.setAttribute("aria-disabled", restricted ? "true" : "false");
          button.classList.toggle("cursor-not-allowed", restricted);
          button.classList.toggle("opacity-50", restricted);
          if (restricted) button.title = "需先启用该产线的用餐时长限制";
          else {
            button.title =
              button.getAttribute("aria-checked") === "true" ? "已开启" : "已关闭";
          }
        });
    }
  });
}

export function setGuestDiningDurationPanelVisible(seq: number, visible: boolean): void {
  if (!isDiningDurationSeq(seq)) return;
  document
    .querySelectorAll<HTMLElement>(`[data-guest-dining-duration-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
    });
  refreshGuestDiningDurationLimitDependencies();
}

function collectLinesFromGroup(
  group: HTMLElement,
  seq: GuestDiningDurationSeq,
): GuestDiningDurationProductLineId[] {
  const lines = ALL_LINE_IDS.filter((lineId) => {
    const input = group.querySelector<HTMLInputElement>(
      `[data-guest-dining-duration-line="${lineId}"]`,
    );
    return input?.checked === true;
  });
  writeGuestDiningDurationLines(seq, lines);
  return lines;
}

function persistLimitEditorChange(editor: HTMLElement, target: HTMLElement): void {
  const config = readDiningDurationLimitByLine();
  if (target instanceof HTMLInputElement) {
    const enabledLine = target.getAttribute("data-guest-dining-duration-limit-enabled");
    if (enabledLine && isDiningDurationLineId(enabledLine)) {
      config[enabledLine] = { ...config[enabledLine], enabled: target.checked };
    }
    const minutesLine = target.getAttribute("data-guest-dining-duration-limit-minutes");
    if (minutesLine && isDiningDurationLineId(minutesLine)) {
      const minutes = normalizeDiningDurationMinutes(target.value);
      config[minutesLine] = { ...config[minutesLine], minutes };
      target.value = String(minutes);
    }
  }
  writeDiningDurationLimitByLine(config);
  refreshGuestDiningDurationLimitDependencies(editor.ownerDocument ?? document);
}

export function bindGuestDiningDurationUi(root: ParentNode = document): void {
  ensureAllGuestDiningDurationTogglesMigrated();

  root
    .querySelectorAll<HTMLElement>("[data-guest-dining-duration-limit-editor]")
    .forEach((editor) => {
      if (editor.dataset.guestDiningDurationLimitBound === "1") return;
      editor.dataset.guestDiningDurationLimitBound = "1";
      editor.addEventListener("change", (event) => {
        const target = event.target as HTMLElement;
        if (
          !target.matches("[data-guest-dining-duration-limit-enabled]") &&
          !target.matches("[data-guest-dining-duration-limit-minutes]")
        ) {
          return;
        }
        persistLimitEditorChange(editor, target);
      });
      editor.addEventListener(
        "blur",
        (event) => {
          const target = event.target as HTMLElement;
          if (!target.matches("[data-guest-dining-duration-limit-minutes]")) return;
          persistLimitEditorChange(editor, target);
        },
        true,
      );
    });

  root.querySelectorAll<HTMLElement>("[data-guest-dining-duration-lines]").forEach((group) => {
    if (group.dataset.guestDiningDurationBound === "1") return;
    const seq = Number(group.getAttribute("data-guest-dining-duration-lines"));
    if (!isDiningDurationSeq(seq)) return;
    group.dataset.guestDiningDurationBound = "1";
    group.addEventListener("change", (event) => {
      const target = event.target as HTMLElement;
      if (!target.matches("[data-guest-dining-duration-line]")) return;
      collectLinesFromGroup(group, seq);
    });
  });

  refreshGuestDiningDurationLimitDependencies(root);
}
