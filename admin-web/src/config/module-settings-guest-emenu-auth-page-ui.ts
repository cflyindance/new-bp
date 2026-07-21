/**
 * 前厅 · 食客端·下单与规则：授权类展示/限制（主开关 + eMenu / SDI 产线）
 * — 620 限制食客提前开单、626 下单前需要服务员授权。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_PREORDER_RESTRICT_SEQ = 620;
export const GUEST_PRE_ORDER_SERVER_AUTH_SEQ = 626;

export const GUEST_EMENU_AUTH_PAGE_SEQS: readonly number[] = [
  GUEST_PREORDER_RESTRICT_SEQ,
  GUEST_PRE_ORDER_SERVER_AUTH_SEQ,
];

export const GUEST_EMENU_AUTH_PAGE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestEmenuAuthPageProductLineId =
  (typeof GUEST_EMENU_AUTH_PAGE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestEmenuAuthPageProductLineId[] =
  GUEST_EMENU_AUTH_PAGE_PRODUCT_LINES.map((l) => l.id);

const LINES_ARIA_LABEL_BY_SEQ: Record<number, string> = {
  [GUEST_PREORDER_RESTRICT_SEQ]: "限制食客提前开单适用产线",
  [GUEST_PRE_ORDER_SERVER_AUTH_SEQ]: "下单前需要服务员授权适用产线",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linesStorageId(seq: number): string {
  return `${seq}-guest-emenu-auth-page-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestEmenuAuthPageToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
  if (!isGuestEmenuAuthPageSeq(seq)) return;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

function ensureAllGuestEmenuAuthPageTogglesMigrated(): void {
  for (const seq of GUEST_EMENU_AUTH_PAGE_SEQS) {
    ensureGuestEmenuAuthPageToggleMigrated(seq);
  }
}

function resolveLineId(id: string): GuestEmenuAuthPageProductLineId | null {
  if (ALL_LINE_IDS.includes(id as GuestEmenuAuthPageProductLineId)) {
    return id as GuestEmenuAuthPageProductLineId;
  }
  // 旧数据曾用 kiosk 占位，迁移到 eMenu
  if (id === "kiosk") return "emenu";
  return null;
}

function normalizeLineIds(raw: unknown): GuestEmenuAuthPageProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<GuestEmenuAuthPageProductLineId>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const resolved = resolveLineId(item);
    if (resolved) seen.add(resolved);
  }
  return ALL_LINE_IDS.filter((id) => seen.has(id));
}

export function readGuestEmenuAuthPageLines(seq: number): GuestEmenuAuthPageProductLineId[] {
  if (!isGuestEmenuAuthPageSeq(seq)) return [];
  ensureGuestEmenuAuthPageToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) {
    if (Array.isArray(stored) && stored.some((id) => id === "kiosk")) {
      writeGuestEmenuAuthPageLines(seq, normalized);
    }
    return normalized;
  }

  if (readLegacyToggleOn(seq)) {
    writeGuestEmenuAuthPageLines(seq, ["emenu"]);
    return ["emenu"];
  }
  return [];
}

export function writeGuestEmenuAuthPageLines(
  seq: number,
  lines: GuestEmenuAuthPageProductLineId[],
): void {
  if (!isGuestEmenuAuthPageSeq(seq)) return;
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function isGuestEmenuAuthPageSeq(seq: number): boolean {
  return (GUEST_EMENU_AUTH_PAGE_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readGuestEmenuAuthPageLines(seq));
  const cells = GUEST_EMENU_AUTH_PAGE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-6 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-emenu-auth-page-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const ariaLabel = LINES_ARIA_LABEL_BY_SEQ[seq] ?? "适用产线";

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-emenu-auth-page-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderGuestEmenuAuthPagePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-emenu-auth-page-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setGuestEmenuAuthPagePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-emenu-auth-page-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-emenu-auth-page-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): GuestEmenuAuthPageProductLineId[] {
  const seq = Number(group.getAttribute("data-guest-emenu-auth-page-lines"));
  if (!seq || !isGuestEmenuAuthPageSeq(seq)) return [];

  const lines: GuestEmenuAuthPageProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-emenu-auth-page-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-emenu-auth-page-line");
    if (id && ALL_LINE_IDS.includes(id as GuestEmenuAuthPageProductLineId)) {
      lines.push(id as GuestEmenuAuthPageProductLineId);
    }
  });
  writeGuestEmenuAuthPageLines(seq, lines);
  return lines;
}

export function bindGuestEmenuAuthPageUi(root: ParentNode = document): void {
  ensureAllGuestEmenuAuthPageTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-emenu-auth-page-lines]").forEach((group) => {
    if (group.dataset.guestEmenuAuthPageBound === "1") return;
    group.dataset.guestEmenuAuthPageBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-emenu-auth-page-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
