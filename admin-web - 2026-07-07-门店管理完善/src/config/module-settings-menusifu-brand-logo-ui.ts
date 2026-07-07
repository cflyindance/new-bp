/**
 * 前厅 · 食客端·首页与版式：seq 532 展示 MenuSifu 品牌 LOGO（主开关 + Kiosk / eMenu 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MENUSIFU_BRAND_LOGO_SEQ = 532;

const LINES_STORAGE_ID = "532-menusifu-brand-logo-lines";

export const MENUSIFU_BRAND_LOGO_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
] as const;

export type MenusifuBrandLogoProductLineId =
  (typeof MENUSIFU_BRAND_LOGO_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: MenusifuBrandLogoProductLineId[] = MENUSIFU_BRAND_LOGO_PRODUCT_LINES.map(
  (l) => l.id,
);

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

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(MENUSIFU_BRAND_LOGO_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureMenusifuBrandLogoToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(MENUSIFU_BRAND_LOGO_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(MENUSIFU_BRAND_LOGO_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): MenusifuBrandLogoProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is MenusifuBrandLogoProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readMenusifuBrandLogoLines(): MenusifuBrandLogoProductLineId[] {
  ensureMenusifuBrandLogoToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeMenusifuBrandLogoLines(all);
    return all;
  }
  return [];
}

export function writeMenusifuBrandLogoLines(lines: MenusifuBrandLogoProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isMenusifuBrandLogoSeq(seq: number): boolean {
  return seq === MENUSIFU_BRAND_LOGO_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readMenusifuBrandLogoLines());
  const cells = MENUSIFU_BRAND_LOGO_PRODUCT_LINES.map((line, index) => {
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
          data-menusifu-brand-logo-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-menusifu-brand-logo-lines="${MENUSIFU_BRAND_LOGO_SEQ}"
      role="group"
      aria-label="展示 MenuSifu 品牌 LOGO 适用产线"
    >
      ${cells}
    </div>`;
}

export function renderMenusifuBrandLogoPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-menusifu-brand-logo-panel="${MENUSIFU_BRAND_LOGO_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        LOGO 图片素材请在素材中心维护；本项仅控制是否在选定产线首页展示 MenuSifu 品牌标识。
      </p>
    </div>`;
}

export function setMenusifuBrandLogoPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-menusifu-brand-logo-panel="${MENUSIFU_BRAND_LOGO_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-menusifu-brand-logo-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): MenusifuBrandLogoProductLineId[] {
  const lines: MenusifuBrandLogoProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-menusifu-brand-logo-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-menusifu-brand-logo-line");
    if (id && ALL_LINE_IDS.includes(id as MenusifuBrandLogoProductLineId)) {
      lines.push(id as MenusifuBrandLogoProductLineId);
    }
  });
  writeMenusifuBrandLogoLines(lines);
  return lines;
}

export function bindMenusifuBrandLogoUi(root: ParentNode = document): void {
  ensureMenusifuBrandLogoToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-menusifu-brand-logo-lines]").forEach((group) => {
    if (group.dataset.menusifuBrandLogoBound === "1") return;
    group.dataset.menusifuBrandLogoBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-menusifu-brand-logo-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
