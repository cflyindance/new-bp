/**
 * 前厅 · 食客端·首页与版式：seq 599 选择您想展示的菜单组
 * （产线表格：产线 + 菜单设置；菜单设置以对话框勾选菜单组，结构对齐展示菜详情 608）。
 */

import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getFohActiveLineFilterId,
} from "./foh-settings-by-line-filter";
import {
  MODULE_SETTING_MOCK_MENU_GROUPS,
  readMenuGroupTags,
  writeMenuGroupTags,
  type MenuGroupTag,
} from "./module-settings-menu-group-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const GUEST_MENU_GROUP_BY_LINE_SEQ = 599;

const LINES_STORAGE_ID = "599-guest-menu-group-lines";
const LEGACY_GROUPS_STORAGE_ID = "599-menu-groups";

export const GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type GuestMenuGroupByLineProductLineId =
  (typeof GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuGroupByLineProductLineId[] =
  GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES.map((l) => l.id);

const MENU_GROUP_BY_ID = new Map(MODULE_SETTING_MOCK_MENU_GROUPS.map((g) => [g.id, g]));

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DIALOG_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

let legacyGroupsMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function menuGroupByLineStorageFieldId(lineId: GuestMenuGroupByLineProductLineId): string {
  return `${GUEST_MENU_GROUP_BY_LINE_SEQ}-menu-groups-${lineId}`;
}

function normalizeLineIds(raw: unknown): GuestMenuGroupByLineProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuGroupByLineProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function formatMenuGroupSummary(tags: MenuGroupTag[]): string {
  if (tags.length === 0) return "未选择菜单组";
  return tags.map((t) => t.name).join("、");
}

function formatMenuGroupCountLabel(tags: MenuGroupTag[]): string {
  return tags.length > 0 ? `已选 ${tags.length} 个菜单组` : "未选择菜单组";
}

/** 按各产线已选菜单组同步「生效产线」缓存（供后续对接运行时读取） */
function syncActiveLinesFromMenuGroups(): void {
  const active = ALL_LINE_IDS.filter(
    (lineId) => readMenuGroupTags(menuGroupByLineStorageFieldId(lineId)).length > 0,
  );
  writeModuleSettingJson(LINES_STORAGE_ID, active);
}

export function ensureGuestMenuGroupByLineLegacyMigrated(): void {
  if (legacyGroupsMigrated) return;
  legacyGroupsMigrated = true;

  const legacy = readMenuGroupTags(LEGACY_GROUPS_STORAGE_ID);
  if (legacy.length === 0) return;

  for (const lineId of ALL_LINE_IDS) {
    const fieldId = menuGroupByLineStorageFieldId(lineId);
    if (readMenuGroupTags(fieldId).length === 0) {
      writeMenuGroupTags(fieldId, legacy);
    }
  }
  syncActiveLinesFromMenuGroups();
}

/** 已配置菜单组的产线（由勾选结果推导） */
export function readGuestMenuGroupByLineLines(): GuestMenuGroupByLineProductLineId[] {
  ensureGuestMenuGroupByLineLegacyMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  const fromGroups = ALL_LINE_IDS.filter(
    (lineId) => readMenuGroupTags(menuGroupByLineStorageFieldId(lineId)).length > 0,
  );
  if (fromGroups.length > 0) {
    writeModuleSettingJson(LINES_STORAGE_ID, fromGroups);
    return fromGroups;
  }
  if (readMenuGroupTags(LEGACY_GROUPS_STORAGE_ID).length > 0) {
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function readGuestMenuGroupTagsForLine(
  lineId: GuestMenuGroupByLineProductLineId,
): MenuGroupTag[] {
  ensureGuestMenuGroupByLineLegacyMigrated();
  return readMenuGroupTags(menuGroupByLineStorageFieldId(lineId));
}

export function isGuestMenuGroupByLineSeq(seq: number): boolean {
  return seq === GUEST_MENU_GROUP_BY_LINE_SEQ;
}

function visibleProductLines(): (typeof GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES)[number][] {
  const activeLine = getFohActiveLineFilterId();
  if (!activeLine) return [...GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES];
  return GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES.filter((line) => line.id === activeLine);
}

function renderMenuSettingsCell(lineId: GuestMenuGroupByLineProductLineId): string {
  const storageId = menuGroupByLineStorageFieldId(lineId);
  const tags = readGuestMenuGroupTagsForLine(lineId);
  const summary = formatMenuGroupSummary(tags);
  const countLabel = formatMenuGroupCountLabel(tags);

  return `
    <div class="min-w-[14rem] space-y-1.5" data-guest-menu-group-menu-settings="${escapeHtml(lineId)}">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="${BTN_PRIMARY}"
          data-guest-menu-group-pick
          data-line-id="${escapeHtml(lineId)}"
          data-storage-id="${escapeHtml(storageId)}"
        >选择菜单组</button>
        <span class="text-xs text-muted-foreground" data-guest-menu-group-pick-count="${escapeHtml(storageId)}">${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground" data-guest-menu-group-pick-summary="${escapeHtml(storageId)}">${escapeHtml(summary)}</p>
    </div>`;
}

function renderLineRow(line: (typeof GUEST_MENU_GROUP_BY_LINE_PRODUCT_LINES)[number]): string {
  return `
    <tr
      class="border-t border-border"
      ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}"
      data-guest-menu-group-by-line-row="${escapeHtml(line.id)}"
    >
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">${renderMenuSettingsCell(line.id)}</td>
    </tr>`;
}

function renderMenuGroupPickerBody(selectedIds: Set<string>): string {
  const cells = MODULE_SETTING_MOCK_MENU_GROUPS.map((group) => {
    const checked = selectedIds.has(group.id);
    return `
      <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(group.id)}"
          data-guest-menu-group-dialog-id="${escapeHtml(group.id)}"
          data-guest-menu-group-dialog-name="${escapeHtml(group.name)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(group.name)}"
        />
        <span>${escapeHtml(group.name)}</span>
      </label>`;
  }).join("");

  return `
    <p class="m-0 text-xs text-muted-foreground">勾选要在该产线展示的菜单组</p>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2" role="group" aria-label="可选菜单组">${cells}</div>`;
}

function renderGroupPickDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-guest-menu-group-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-menu-group-dialog-title"
      data-line-id=""
      data-storage-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-guest-menu-group-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="guest-menu-group-dialog-title" class="text-base font-semibold text-card-foreground">选择菜单组</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-guest-menu-group-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4" data-guest-menu-group-dialog-body>
          <p class="m-0 text-xs text-muted-foreground">勾选要在该产线展示的菜单组</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-guest-menu-group-dialog-cancel>取消</button>
          <button type="button" class="${BTN_DIALOG_PRIMARY}" data-guest-menu-group-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

export function renderGuestMenuGroupByLinePanelHtml(): string {
  ensureGuestMenuGroupByLineLegacyMigrated();
  const rows = visibleProductLines().map((line) => renderLineRow(line)).join("");

  return `
    <div
      class="mt-3 max-w-4xl"
      data-guest-menu-group-by-line-panel="${GUEST_MENU_GROUP_BY_LINE_SEQ}"
    >
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">菜单设置</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${renderGroupPickDialog()}
    </div>`;
}

function showGroupPickDialog(dialog: HTMLElement): void {
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideGroupPickDialog(dialog: HTMLElement): void {
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-line-id", "");
  dialog.setAttribute("data-storage-id", "");
  const body = dialog.querySelector<HTMLElement>("[data-guest-menu-group-dialog-body]");
  if (body) {
    body.innerHTML = `<p class="m-0 text-xs text-muted-foreground">勾选要在该产线展示的菜单组</p>`;
  }
}

function closeGroupPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-guest-menu-group-dialog]");
  if (dialog) hideGroupPickDialog(dialog);
}

function refreshPickSummary(host: HTMLElement, storageId: string): void {
  const tags = readMenuGroupTags(storageId);
  const summary = formatMenuGroupSummary(tags);
  const countLabel = formatMenuGroupCountLabel(tags);

  host
    .querySelectorAll<HTMLElement>(`[data-guest-menu-group-pick-summary="${storageId}"]`)
    .forEach((el) => {
      el.textContent = summary;
    });
  host
    .querySelectorAll<HTMLElement>(`[data-guest-menu-group-pick-count="${storageId}"]`)
    .forEach((el) => {
      el.textContent = countLabel;
    });
}

function openGroupPickDialog(
  host: HTMLElement,
  lineId: GuestMenuGroupByLineProductLineId,
  storageId: string,
): void {
  const dialog = host.querySelector<HTMLElement>("[data-guest-menu-group-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-guest-menu-group-dialog-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#guest-menu-group-dialog-title");
  if (!dialog || !body) return;

  dialog.setAttribute("data-line-id", lineId);
  dialog.setAttribute("data-storage-id", storageId);
  if (titleEl) titleEl.textContent = "选择菜单组";

  const selected = new Set(readMenuGroupTags(storageId).map((t) => t.id));
  body.innerHTML = renderMenuGroupPickerBody(selected);
  showGroupPickDialog(dialog);
}

function collectTagsFromDialog(dialog: HTMLElement): MenuGroupTag[] {
  const checked = new Set<string>();
  dialog.querySelectorAll<HTMLInputElement>("[data-guest-menu-group-dialog-id]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-menu-group-dialog-id");
    if (id && MENU_GROUP_BY_ID.has(id)) checked.add(id);
  });
  return MODULE_SETTING_MOCK_MENU_GROUPS.filter((g) => checked.has(g.id));
}

function saveGroupPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-guest-menu-group-dialog]");
  if (!dialog) return;
  const lineId = dialog.getAttribute("data-line-id") as GuestMenuGroupByLineProductLineId | null;
  const storageId = dialog.getAttribute("data-storage-id") ?? "";
  if (!lineId || !storageId || !ALL_LINE_IDS.includes(lineId)) {
    hideGroupPickDialog(dialog);
    return;
  }
  writeMenuGroupTags(storageId, collectTagsFromDialog(dialog));
  syncActiveLinesFromMenuGroups();
  refreshPickSummary(host, storageId);
  hideGroupPickDialog(dialog);
}

function bindGuestMenuGroupPanel(panel: HTMLElement): void {
  if (panel.dataset.guestMenuGroupByLinePanelBound === "1") return;
  panel.dataset.guestMenuGroupByLinePanelBound = "1";

  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const pickBtn = target.closest<HTMLElement>("[data-guest-menu-group-pick]");
    if (pickBtn) {
      const lineId = pickBtn.getAttribute("data-line-id") as GuestMenuGroupByLineProductLineId | null;
      const storageId = pickBtn.getAttribute("data-storage-id") ?? "";
      if (lineId && storageId && ALL_LINE_IDS.includes(lineId)) {
        openGroupPickDialog(panel, lineId, storageId);
      }
      return;
    }

    if (
      target.closest("[data-guest-menu-group-dialog-close]") ||
      target.closest("[data-guest-menu-group-dialog-cancel]") ||
      target.closest("[data-guest-menu-group-dialog-backdrop]")
    ) {
      closeGroupPickDialog(panel);
      return;
    }

    if (target.closest("[data-guest-menu-group-dialog-save]")) {
      saveGroupPickDialog(panel);
    }
  });
}

export function bindGuestMenuGroupByLineUi(root: ParentNode = document): void {
  ensureGuestMenuGroupByLineLegacyMigrated();

  root
    .querySelectorAll<HTMLElement>(`[data-guest-menu-group-by-line-panel="${GUEST_MENU_GROUP_BY_LINE_SEQ}"]`)
    .forEach((panel) => {
      bindGuestMenuGroupPanel(panel);
    });
}
