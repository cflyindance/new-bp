/**
 * 前厅 · 食客下单限流：seq 591 菜品间隔时间内允许加购（依赖 seq 590 主开关）。
 * 配置菜品下单间隔内是否允许加入购物车，以及触发服务员授权的条件。
 */

import {
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import {
  GUEST_MENU_ORDER_INTERVAL_SEQ,
  ensureGuestMenuOrderIntervalToggleMigrated,
} from "./module-settings-guest-menu-order-interval-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_INTERVAL_ALLOW_CART_SEQ = 591;

const MODE_STORAGE_ID = "591-menu-interval-add-cart-mode";
const QTY_STORAGE_ID = "591-menu-interval-add-cart-qty-threshold";

export type GuestMenuIntervalAllowCartMode = "blocked" | "auth-every" | "auth-qty";

const MODE_OPTIONS: ReadonlyArray<{ value: GuestMenuIntervalAllowCartMode; label: string }> = [
  { value: "blocked", label: "间隔内不允许加入购物车" },
  { value: "auth-every", label: "间隔内允许加入购物车，每次加购均需服务员授权" },
  {
    value: "auth-qty",
    label: "间隔内允许加入购物车，当间隔内累计加购菜品数达到阈值时需服务员授权",
  },
];

const QTY_MIN = 1;
const QTY_MAX = 99;
const QTY_DEFAULT = 1;

const MODULE_SETTING_CHOICE_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-16 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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

export function readGuestMenuOrderIntervalEnabled(): boolean {
  ensureGuestMenuOrderIntervalToggleMigrated();
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_ORDER_INTERVAL_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function readGuestMenuIntervalAllowCartMode(): GuestMenuIntervalAllowCartMode {
  const stored = readModuleSettingJson<unknown>(MODE_STORAGE_ID, null);
  if (typeof stored === "string" && isValidMode(stored)) return stored;
  return "auth-every";
}

export function writeGuestMenuIntervalAllowCartMode(mode: GuestMenuIntervalAllowCartMode): void {
  writeModuleSettingJson(MODE_STORAGE_ID, mode);
}

export function readGuestMenuIntervalAllowCartQtyThreshold(): number {
  const stored = readModuleSettingNumber(QTY_STORAGE_ID, QTY_DEFAULT);
  if (!Number.isFinite(stored)) return QTY_DEFAULT;
  return Math.min(QTY_MAX, Math.max(QTY_MIN, Math.round(stored)));
}

export function writeGuestMenuIntervalAllowCartQtyThreshold(qty: number): void {
  const value = Math.min(QTY_MAX, Math.max(QTY_MIN, Math.round(qty)));
  writeModuleSettingNumber(QTY_STORAGE_ID, value);
}

export function isGuestMenuIntervalAllowCartSeq(seq: number): boolean {
  return seq === GUEST_MENU_INTERVAL_ALLOW_CART_SEQ;
}

function renderModeRadiosHtml(enabled: boolean): string {
  const mode = readGuestMenuIntervalAllowCartMode();
  const qty = readGuestMenuIntervalAllowCartQtyThreshold();
  const showQty = mode === "auth-qty";

  const radios = MODE_OPTIONS.map((opt) => {
    const checked = mode === opt.value;
    return `
      <label class="inline-flex cursor-pointer items-start gap-2 text-sm text-foreground ${enabled ? "" : "cursor-not-allowed opacity-50"}">
        <input
          type="radio"
          name="guest-menu-interval-allow-cart-mode"
          value="${escapeHtml(opt.value)}"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
          data-guest-menu-interval-allow-cart-mode
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(opt.label)}"
        />
        <span class="leading-snug">${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="space-y-3"
      data-guest-menu-interval-allow-cart-editor="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}"
      role="radiogroup"
      aria-label="菜品下单间隔内加入购物车策略"
    >
      <div class="flex flex-col gap-2.5">${radios}</div>
      <div
        class="flex flex-wrap items-center gap-2 pl-6 text-sm ${showQty ? "" : "hidden"}"
        data-guest-menu-interval-allow-cart-qty-wrap
        ${showQty ? "" : 'aria-hidden="true"'}
      >
        <span class="text-muted-foreground">累计加购菜品数阈值</span>
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(qty))}"
          min="${QTY_MIN}"
          max="${QTY_MAX}"
          step="1"
          data-guest-menu-interval-allow-cart-qty
          ${enabled && showQty ? "" : "disabled"}
          aria-label="间隔内累计加购菜品数阈值"
        />
        <span class="text-xs text-muted-foreground">（${QTY_MIN}–${QTY_MAX} 道）</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        仅当已开启「菜品下单时间间隔」且适用产线与 590 一致时生效；间隔内加购与再次提交菜品的授权策略可分别配置。
      </p>
    </div>`;
}

export function renderGuestMenuIntervalAllowCartPanelHtml(parentOn: boolean): string {
  const hidden = parentOn ? "" : "hidden";
  const hintHidden = parentOn ? "hidden" : "";
  return `
    <div
      class="mt-3 max-w-2xl"
      data-guest-menu-interval-allow-cart-panel="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}"
    >
      <p
        class="m-0 text-xs leading-relaxed text-muted-foreground ${hintHidden}"
        data-guest-menu-interval-allow-cart-hint
        ${parentOn ? 'aria-hidden="true"' : ""}
      >
        请先开启「菜品下单时间间隔」后，再配置间隔内是否允许加入购物车及授权触发条件。
      </p>
      <div
        class="${hidden}"
        data-guest-menu-interval-allow-cart-body
        ${parentOn ? "" : 'aria-hidden="true"'}
      >
        ${renderModeRadiosHtml(parentOn)}
      </div>
    </div>`;
}

function syncQtyWrapVisibility(editor: HTMLElement): void {
  const mode = readGuestMenuIntervalAllowCartMode();
  const showQty = mode === "auth-qty";
  const wrap = editor.querySelector<HTMLElement>("[data-guest-menu-interval-allow-cart-qty-wrap]");
  const qtyInput = editor.querySelector<HTMLInputElement>("[data-guest-menu-interval-allow-cart-qty]");
  if (wrap) {
    wrap.classList.toggle("hidden", !showQty);
    if (showQty) wrap.removeAttribute("aria-hidden");
    else wrap.setAttribute("aria-hidden", "true");
  }
  if (qtyInput) {
    const parentOn = readGuestMenuOrderIntervalEnabled();
    qtyInput.disabled = !parentOn || !showQty;
  }
}

export function setGuestMenuIntervalAllowCartPanelVisible(parentOn: boolean): void {
  document
    .querySelectorAll<HTMLElement>(
      `[data-guest-menu-interval-allow-cart-panel="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}"]`,
    )
    .forEach((panel) => {
      const hint = panel.querySelector<HTMLElement>("[data-guest-menu-interval-allow-cart-hint]");
      const body = panel.querySelector<HTMLElement>("[data-guest-menu-interval-allow-cart-body]");
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

      panel.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
        const isQty = input.hasAttribute("data-guest-menu-interval-allow-cart-qty");
        const mode = readGuestMenuIntervalAllowCartMode();
        const enabled = parentOn && (!isQty || mode === "auth-qty");
        input.disabled = !enabled;
        const label = input.closest("label");
        if (!label || !input.matches("[data-guest-menu-interval-allow-cart-mode]")) return;
        label.classList.toggle("cursor-not-allowed", !parentOn);
        label.classList.toggle("opacity-50", !parentOn);
        label.classList.toggle("cursor-pointer", parentOn);
      });

      const editor = panel.querySelector<HTMLElement>(
        `[data-guest-menu-interval-allow-cart-editor="${GUEST_MENU_INTERVAL_ALLOW_CART_SEQ}"]`,
      );
      if (editor) syncQtyWrapVisibility(editor);
    });
}

function collectModeFromEditor(editor: HTMLElement): GuestMenuIntervalAllowCartMode {
  const checked = editor.querySelector<HTMLInputElement>(
    "[data-guest-menu-interval-allow-cart-mode]:checked",
  );
  const value = checked?.value ?? "";
  if (isValidMode(value)) return value;
  return readGuestMenuIntervalAllowCartMode();
}

export function bindGuestMenuIntervalAllowCartUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-guest-menu-interval-allow-cart-editor]").forEach((editor) => {
    if (editor.dataset.guestMenuIntervalAllowCartEditorBound === "1") return;
    editor.dataset.guestMenuIntervalAllowCartEditorBound = "1";

    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (target.matches("[data-guest-menu-interval-allow-cart-mode]")) {
        const mode = collectModeFromEditor(editor);
        writeGuestMenuIntervalAllowCartMode(mode);
        syncQtyWrapVisibility(editor);
        setGuestMenuIntervalAllowCartPanelVisible(readGuestMenuOrderIntervalEnabled());
        return;
      }
      if (target.matches("[data-guest-menu-interval-allow-cart-qty]")) {
        const n = Number((target as HTMLInputElement).value);
        if (Number.isFinite(n)) writeGuestMenuIntervalAllowCartQtyThreshold(n);
      }
    });

    editor.querySelectorAll<HTMLInputElement>("[data-guest-menu-interval-allow-cart-qty]").forEach((input) => {
      if (input.dataset.guestMenuIntervalAllowCartQtyBound === "1") return;
      input.dataset.guestMenuIntervalAllowCartQtyBound = "1";
      const persist = () => {
        const n = Number(input.value);
        if (Number.isFinite(n)) writeGuestMenuIntervalAllowCartQtyThreshold(n);
      };
      input.addEventListener("blur", persist);
    });
  });
}
