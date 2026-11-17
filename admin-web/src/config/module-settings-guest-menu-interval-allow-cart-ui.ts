/**
 * 前厅 · 食客下单限流：seq 591 菜品间隔时间内允许加购（按产线分别配置策略，对齐 589）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES,
  type MenuOrderLimitOtherProductLineId,
} from "./menu-order-limit-product-lines";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";

export const GUEST_MENU_INTERVAL_ALLOW_CART_SEQ = 591;

/** @deprecated 旧版全局策略；迁移后由按产线配置同步 */
const MODE_STORAGE_ID = "591-menu-interval-add-cart-mode";
/** @deprecated 旧版全局阈值；迁移后由按产线配置同步 */
const QTY_STORAGE_ID = "591-menu-interval-add-cart-qty-threshold";
export const GUEST_MENU_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID =
  "591-menu-interval-add-cart-by-line";

export const GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES =
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES;

export type GuestMenuIntervalAllowCartProductLineId =
  MenuOrderLimitOtherProductLineId;

export type GuestMenuIntervalAllowCartMode = "blocked" | "allowed";

export type GuestMenuIntervalAllowCartLineConfig = {
  enabled: boolean;
  mode: GuestMenuIntervalAllowCartMode;
  /** Retained for legacy data compatibility; not used by allowed/blocked policy. */
  qtyThreshold: number;
};

export type GuestMenuIntervalAllowCartByLine = Record<
  GuestMenuIntervalAllowCartProductLineId,
  GuestMenuIntervalAllowCartLineConfig
>;

const ALL_LINE_IDS: GuestMenuIntervalAllowCartProductLineId[] = [
  ...MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
];

const MODE_OPTIONS: ReadonlyArray<{
  value: GuestMenuIntervalAllowCartMode;
  label: string;
}> = [
  { value: "allowed", label: "允许加购" },
  { value: "blocked", label: "不允许加购" },
];

const QTY_MIN = 1;
const QTY_MAX = 99;
const QTY_DEFAULT = 1;
const MODE_DEFAULT: GuestMenuIntervalAllowCartMode = "blocked";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const MODULE_SETTING_CHOICE_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let byLineMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMode(value: string): value is GuestMenuIntervalAllowCartMode {
  return MODE_OPTIONS.some((o) => o.value === value);
}

function normalizePolicyMode(value: unknown): GuestMenuIntervalAllowCartMode {
  return value === "allowed" || value === "auth-every" || value === "auth-qty" ? "allowed" : "blocked";
}

function clampQty(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return QTY_DEFAULT;
  return Math.min(QTY_MAX, Math.max(QTY_MIN, Math.round(n)));
}

function defaultLineConfig(
  enabled = true,
): GuestMenuIntervalAllowCartLineConfig {
  return { enabled, mode: MODE_DEFAULT, qtyThreshold: QTY_DEFAULT };
}

function defaultByLineConfig(enabled = true): GuestMenuIntervalAllowCartByLine {
  return Object.fromEntries(
    GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES.map((line) => [
      line.id,
      defaultLineConfig(enabled),
    ]),
  ) as GuestMenuIntervalAllowCartByLine;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<GuestMenuIntervalAllowCartLineConfig>>>,
): GuestMenuIntervalAllowCartByLine {
  const base = defaultByLineConfig(true);
  // Retired auth-every/auth-qty values resolve to allowed; threshold data stays inert.
  for (const line of GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    const mode = item.enabled === false ? "blocked" : normalizePolicyMode(item.mode);
    base[line.id] = {
      enabled: true,
      mode,
      qtyThreshold: clampQty(item.qtyThreshold ?? QTY_DEFAULT),
    };
  }
  return base;
}

function syncLegacyFields(config: GuestMenuIntervalAllowCartByLine): void {
  const firstEnabled = GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES.find(
    (line) => config[line.id].enabled,
  );
  if (!firstEnabled) return;
  const item = config[firstEnabled.id];
  writeModuleSettingJson(MODE_STORAGE_ID, item.mode);
  writeModuleSettingNumber(QTY_STORAGE_ID, item.qtyThreshold);
}

function hasStoredKey(storageId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(storageId)) !== null;
  } catch {
    return false;
  }
}

export function ensureGuestMenuIntervalAllowCartByLineMigrated(): void {
  if (byLineMigrated) return;
  byLineMigrated = true;

  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<GuestMenuIntervalAllowCartLineConfig>>>
  >(GUEST_MENU_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeGuestMenuIntervalAllowCartByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyMode = hasStoredKey(MODE_STORAGE_ID);
  const hasLegacyQty = hasStoredKey(QTY_STORAGE_ID);

  if (!hasLegacyMode && !hasLegacyQty) {
    writeGuestMenuIntervalAllowCartByLine(defaultByLineConfig(true));
    return;
  }

  const modeRaw = readModuleSettingJson<unknown>(MODE_STORAGE_ID, null);
  const mode = normalizePolicyMode(modeRaw);
  const qty = clampQty(readModuleSettingNumber(QTY_STORAGE_ID, QTY_DEFAULT));

  const config = defaultByLineConfig(true);
  for (const line of GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES) {
    config[line.id] = { enabled: true, mode, qtyThreshold: qty };
  }
  writeGuestMenuIntervalAllowCartByLine(config);
}

export function readGuestMenuIntervalAllowCartByLine(): GuestMenuIntervalAllowCartByLine {
  ensureGuestMenuIntervalAllowCartByLineMigrated();
  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<GuestMenuIntervalAllowCartLineConfig>>>
  >(GUEST_MENU_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig(true);
}

export function writeGuestMenuIntervalAllowCartByLine(
  config: GuestMenuIntervalAllowCartByLine,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(
    GUEST_MENU_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID,
    normalized,
  );
  syncLegacyFields(normalized);
}

/** 父规则 590 在菜单下单限制页默认开启 */
export function readGuestMenuOrderIntervalEnabled(): boolean {
  return true;
}

/** @deprecated 返回首个启用产线的策略 */
export function readGuestMenuIntervalAllowCartMode(): GuestMenuIntervalAllowCartMode {
  const config = readGuestMenuIntervalAllowCartByLine();
  const firstEnabled = GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES.find(
    (line) => config[line.id].enabled,
  );
  if (firstEnabled) return config[firstEnabled.id].mode;
  return MODE_DEFAULT;
}

/** @deprecated 写入所有启用产线（无启用时写入全部） */
export function writeGuestMenuIntervalAllowCartMode(
  mode: GuestMenuIntervalAllowCartMode,
): void {
  if (!isValidMode(mode)) return;
  const config = readGuestMenuIntervalAllowCartByLine();
  const targets = ALL_LINE_IDS.filter((id) => config[id].enabled);
  const ids = targets.length > 0 ? targets : ALL_LINE_IDS;
  for (const id of ids) {
    config[id] = { ...config[id], mode };
  }
  writeGuestMenuIntervalAllowCartByLine(config);
}

/** @deprecated 返回首个启用产线的阈值 */
export function readGuestMenuIntervalAllowCartQtyThreshold(): number {
  const config = readGuestMenuIntervalAllowCartByLine();
  const firstEnabled = GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES.find(
    (line) => config[line.id].enabled,
  );
  if (firstEnabled) return config[firstEnabled.id].qtyThreshold;
  return QTY_DEFAULT;
}

/** @deprecated 写入所有启用产线（无启用时写入全部） */
export function writeGuestMenuIntervalAllowCartQtyThreshold(qty: number): void {
  const value = clampQty(qty);
  const config = readGuestMenuIntervalAllowCartByLine();
  const targets = ALL_LINE_IDS.filter((id) => config[id].enabled);
  const ids = targets.length > 0 ? targets : ALL_LINE_IDS;
  for (const id of ids) {
    config[id] = { ...config[id], qtyThreshold: value };
  }
  writeGuestMenuIntervalAllowCartByLine(config);
}

export function isGuestMenuIntervalAllowCartSeq(seq: number): boolean {
  return seq === GUEST_MENU_INTERVAL_ALLOW_CART_SEQ;
}

function syncRowControls(editor: HTMLElement, panelEnabled: boolean): void {
  editor.querySelectorAll<HTMLInputElement>("[data-guest-menu-interval-allow-cart-line-mode]").forEach(radio => { radio.disabled = !panelEnabled; });
}

function collectByLineFromEditor(
  editor: HTMLElement,
): GuestMenuIntervalAllowCartByLine {
  const config = readGuestMenuIntervalAllowCartByLine();
  editor
    .querySelectorAll<HTMLInputElement>(
      "[data-guest-menu-interval-allow-cart-line-enabled]",
    )
    .forEach((cb) => {
      const lineId = cb.getAttribute(
        "data-guest-menu-interval-allow-cart-line-enabled",
      ) as GuestMenuIntervalAllowCartProductLineId | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
      config[lineId].enabled = cb.checked;
    });
  editor
    .querySelectorAll<HTMLInputElement>(
      "[data-guest-menu-interval-allow-cart-line-mode]:checked",
    )
    .forEach((radio) => {
      const lineId = radio.getAttribute(
        "data-guest-menu-interval-allow-cart-line-mode",
      ) as GuestMenuIntervalAllowCartProductLineId | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
      if (isValidMode(radio.value)) config[lineId].mode = radio.value;
    });
  writeGuestMenuIntervalAllowCartByLine(config);
  syncRowControls(editor, true);
  return config;
}

function renderByLineEditorHtml(enabled: boolean): string {
  const config = readGuestMenuIntervalAllowCartByLine();
  return `<div data-guest-menu-interval-allow-cart-by-line-editor="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}" class="space-y-2"><div class="overflow-x-auto rounded-md border border-border"><table class="w-full border-collapse text-left text-sm"><thead><tr><th class="px-3 py-2">产线</th><th class="px-3 py-2">加购策略</th></tr></thead><tbody>${GUEST_MENU_INTERVAL_ALLOW_CART_PRODUCT_LINES.map(line => `<tr ${FOH_LINE_CONFIG_ROW_ATTR}="${line.id}"><td class="px-3 py-2">${line.label}</td><td class="px-3 py-2"><div class="flex gap-4" role="radiogroup" aria-label="${line.label} 加购策略">${MODE_OPTIONS.map(opt => `<label class="inline-flex items-center gap-2"><input type="radio" name="guest-menu-interval-allow-cart-mode-${line.id}" data-guest-menu-interval-allow-cart-line-mode="${line.id}" value="${opt.value}" ${config[line.id].mode === opt.value ? "checked" : ""} ${enabled ? "" : "disabled"}><span>${opt.label}</span></label>`).join("")}</div></td></tr>`).join("")}</tbody></table></div></div>`;
}

export function renderGuestMenuIntervalAllowCartPanelHtml(
  parentOn: boolean,
): string {
  ensureGuestMenuIntervalAllowCartByLineMigrated();
  const hidden = parentOn ? "" : "hidden";
  const hintHidden = parentOn ? "hidden" : "";
  return `
    <div
      class="mt-3"
      data-guest-menu-interval-allow-cart-panel="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}"
    >
      <p
        class="m-0 text-xs leading-relaxed text-muted-foreground ${hintHidden}"
        data-guest-menu-interval-allow-cart-hint
        ${parentOn ? 'aria-hidden="true"' : ""}
      >
        请先配置「菜品下单时间间隔」后，再配置间隔内是否允许加入购物车及授权触发条件。
      </p>
      <div
        class="${hidden}"
        data-guest-menu-interval-allow-cart-body
        ${parentOn ? "" : 'aria-hidden="true"'}
      >
        ${renderByLineEditorHtml(parentOn)}
      </div>
    </div>`;
}

export function setGuestMenuIntervalAllowCartPanelVisible(
  parentOn: boolean,
): void {
  document
    .querySelectorAll<HTMLElement>(
      `[data-guest-menu-interval-allow-cart-panel="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}"]`,
    )
    .forEach((panel) => {
      const hint = panel.querySelector<HTMLElement>(
        "[data-guest-menu-interval-allow-cart-hint]",
      );
      const body = panel.querySelector<HTMLElement>(
        "[data-guest-menu-interval-allow-cart-body]",
      );
      if (hint) {
        hint.classList.toggle("hidden", parentOn);
        if (parentOn) hint.setAttribute("aria-hidden", "true");
        else hint.removeAttribute("aria-hidden");
      }
      if (body) {
        body.classList.toggle("hidden", !parentOn);
        if (parentOn) body.removeAttribute("aria-hidden");
        else body.setAttribute("aria-hidden", "true");
      }

      panel
        .querySelectorAll<HTMLInputElement>(
          "[data-guest-menu-interval-allow-cart-line-enabled]",
        )
        .forEach((input) => {
          input.disabled = !parentOn;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !parentOn);
          label.classList.toggle("opacity-50", !parentOn);
          label.classList.toggle("cursor-pointer", parentOn);
        });

      const editor = panel.querySelector<HTMLElement>(
        "[data-guest-menu-interval-allow-cart-by-line-editor]",
      );
      if (editor) syncRowControls(editor, parentOn);
    });
}

export function bindGuestMenuIntervalAllowCartUi(
  root: ParentNode = document,
): void {
  ensureGuestMenuIntervalAllowCartByLineMigrated();

  root
    .querySelectorAll<HTMLElement>(
      "[data-guest-menu-interval-allow-cart-by-line-editor]",
    )
    .forEach((editor) => {
      if (editor.dataset.guestMenuIntervalAllowCartByLineBound === "1") return;
      editor.dataset.guestMenuIntervalAllowCartByLineBound = "1";

      syncRowControls(editor, true);

      const persist = () => collectByLineFromEditor(editor);
      editor.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (
          !target.matches(
            "[data-guest-menu-interval-allow-cart-line-enabled], [data-guest-menu-interval-allow-cart-line-mode], [data-guest-menu-interval-allow-cart-line-qty]",
          )
        ) {
          return;
        }
        persist();
      });
      editor.addEventListener(
        "blur",
        (e) => {
          const target = e.target as HTMLElement;
          if (!target.matches("[data-guest-menu-interval-allow-cart-line-qty]"))
            return;
          persist();
        },
        true,
      );
    });
}
