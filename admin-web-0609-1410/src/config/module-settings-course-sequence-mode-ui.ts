/**
 * 前厅 · 点单页展示：seq 135 菜序模式（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const COURSE_SEQUENCE_MODE_SEQ = 135;

const LINES_STORAGE_ID = "135-course-sequence-mode-lines";

export const COURSE_SEQUENCE_MODE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type CourseSequenceModeProductLineId =
  (typeof COURSE_SEQUENCE_MODE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: CourseSequenceModeProductLineId[] =
  COURSE_SEQUENCE_MODE_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

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

export function ensureCourseSequenceModeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(COURSE_SEQUENCE_MODE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(COURSE_SEQUENCE_MODE_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(COURSE_SEQUENCE_MODE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): CourseSequenceModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is CourseSequenceModeProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readCourseSequenceModeLines(): CourseSequenceModeProductLineId[] {
  ensureCourseSequenceModeToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(COURSE_SEQUENCE_MODE_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeCourseSequenceModeLines(all);
    return all;
  }
  return [];
}

export function writeCourseSequenceModeLines(lines: CourseSequenceModeProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isCourseSequenceModeSeq(seq: number): boolean {
  return seq === COURSE_SEQUENCE_MODE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readCourseSequenceModeLines());
  const cells = COURSE_SEQUENCE_MODE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-course-sequence-mode-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-course-sequence-mode-lines="${COURSE_SEQUENCE_MODE_SEQ}"
      role="group"
      aria-label="菜序模式适用产线"
    >
      ${cells}
    </div>`;
}

export function renderCourseSequenceModePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-course-sequence-mode-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setCourseSequenceModePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-course-sequence-mode-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-course-sequence-mode-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): CourseSequenceModeProductLineId[] {
  const lines: CourseSequenceModeProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-course-sequence-mode-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-course-sequence-mode-line");
    if (id && ALL_LINE_IDS.includes(id as CourseSequenceModeProductLineId)) {
      lines.push(id as CourseSequenceModeProductLineId);
    }
  });
  writeCourseSequenceModeLines(lines);
  return lines;
}

export function bindCourseSequenceModeUi(root: ParentNode = document): void {
  ensureCourseSequenceModeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-course-sequence-mode-lines]").forEach((group) => {
    if (group.dataset.courseSequenceModeBound === "1") return;
    group.dataset.courseSequenceModeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-course-sequence-mode-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
