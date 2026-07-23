/**
 * 前厅 · 食客下单限流：seq 589 订单间隔时间内允许加购（按产线分别配置策略）。
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

export const GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ = 589;

/** @deprecated 旧版全局策略；迁移后由按产线配置同步 */
const MODE_STORAGE_ID = "589-order-interval-add-cart-mode";
/** @deprecated 旧版全局阈值；迁移后由按产线配置同步 */
const QTY_STORAGE_ID = "589-order-interval-add-cart-qty-threshold";
export const GUEST_ORDER_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID = "589-order-interval-add-cart-by-line";

export const GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES = MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES;

export type GuestOrderIntervalAllowCartProductLineId = MenuOrderLimitOtherProductLineId;

export type GuestOrderIntervalAllowCartMode = "blocked" | "auth-every" | "auth-qty";

export type GuestOrderIntervalAllowCartLineConfig = {
  enabled: boolean;
  mode: GuestOrderIntervalAllowCartMode;
  qtyThreshold: number;
};

export type GuestOrderIntervalAllowCartByLine = Record<
  GuestOrderIntervalAllowCartProductLineId,
  GuestOrderIntervalAllowCartLineConfig
>;

const ALL_LINE_IDS: GuestOrderIntervalAllowCartProductLineId[] = [
  ...MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
];

const MODE_OPTIONS: ReadonlyArray<{
  value: GuestOrderIntervalAllowCartMode;
  label: string;
}> = [
  { value: "blocked", label: "间隔内不允许加购" },
  {
    value: "auth-every",
    label: "间隔内允许加购，每次加购均需服务员授权",
  },
  {
    value: "auth-qty",
    label: "间隔内允许加购，当间隔内累计加购菜品数达到阈值时需服务员授权",
  },
];

const QTY_MIN = 1;
const QTY_MAX = 99;
const QTY_DEFAULT = 1;
const MODE_DEFAULT: GuestOrderIntervalAllowCartMode = "auth-every";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const MODULE_SETTING_CHOICE_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-16 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let byLineMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMode(value: string): value is GuestOrderIntervalAllowCartMode {
  return MODE_OPTIONS.some((o) => o.value === value);
}

function clampQty(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return QTY_DEFAULT;
  return Math.min(QTY_MAX, Math.max(QTY_MIN, Math.round(n)));
}

function defaultLineConfig(enabled = true): GuestOrderIntervalAllowCartLineConfig {
  return { enabled, mode: MODE_DEFAULT, qtyThreshold: QTY_DEFAULT };
}

function defaultByLineConfig(enabled = true): GuestOrderIntervalAllowCartByLine {
  return Object.fromEntries(
    GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(enabled)]),
  ) as GuestOrderIntervalAllowCartByLine;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<GuestOrderIntervalAllowCartLineConfig>>>,
): GuestOrderIntervalAllowCartByLine {
  const base = defaultByLineConfig(false);
  for (const line of GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    const mode = typeof item.mode === "string" && isValidMode(item.mode) ? item.mode : MODE_DEFAULT;
    base[line.id] = {
      enabled: item.enabled === true,
      mode,
      qtyThreshold: clampQty(item.qtyThreshold ?? QTY_DEFAULT),
    };
  }
  return base;
}

function syncLegacyFields(config: GuestOrderIntervalAllowCartByLine): void {
  const firstEnabled = GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES.find(
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

export function ensureGuestOrderIntervalAllowCartByLineMigrated(): void {
  if (byLineMigrated) return;
  byLineMigrated = true;

  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<GuestOrderIntervalAllowCartLineConfig>>>
  >(GUEST_ORDER_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeGuestOrderIntervalAllowCartByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyMode = hasStoredKey(MODE_STORAGE_ID);
  const hasLegacyQty = hasStoredKey(QTY_STORAGE_ID);

  if (!hasLegacyMode && !hasLegacyQty) {
    writeGuestOrderIntervalAllowCartByLine(defaultByLineConfig(true));
    return;
  }

  const modeRaw = readModuleSettingJson<unknown>(MODE_STORAGE_ID, null);
  const mode =
    typeof modeRaw === "string" && isValidMode(modeRaw) ? modeRaw : MODE_DEFAULT;
  const qty = clampQty(readModuleSettingNumber(QTY_STORAGE_ID, QTY_DEFAULT));

  const config = defaultByLineConfig(true);
  for (const line of GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES) {
    config[line.id] = { enabled: true, mode, qtyThreshold: qty };
  }
  writeGuestOrderIntervalAllowCartByLine(config);
}

export function readGuestOrderIntervalAllowCartByLine(): GuestOrderIntervalAllowCartByLine {
  ensureGuestOrderIntervalAllowCartByLineMigrated();
  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<GuestOrderIntervalAllowCartLineConfig>>>
  >(GUEST_ORDER_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig(true);
}

export function writeGuestOrderIntervalAllowCartByLine(
  config: GuestOrderIntervalAllowCartByLine,
): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(GUEST_ORDER_INTERVAL_ALLOW_CART_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

/** 父规则 588 在菜单下单限制页默认开启 */
export function readGuestOrderPlaceIntervalEnabled(): boolean {
  return true;
}

/** @deprecated 返回首个启用产线的策略 */
export function readGuestOrderIntervalAllowCartMode(): GuestOrderIntervalAllowCartMode {
  const config = readGuestOrderIntervalAllowCartByLine();
  const firstEnabled = GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES.find(
    (line) => config[line.id].enabled,
  );
  if (firstEnabled) return config[firstEnabled.id].mode;
  return MODE_DEFAULT;
}

/** @deprecated 写入所有启用产线（无启用时写入全部） */
export function writeGuestOrderIntervalAllowCartMode(mode: GuestOrderIntervalAllowCartMode): void {
  if (!isValidMode(mode)) return;
  const config = readGuestOrderIntervalAllowCartByLine();
  const targets = ALL_LINE_IDS.filter((id) => config[id].enabled);
  const ids = targets.length > 0 ? targets : ALL_LINE_IDS;
  for (const id of ids) {
    config[id] = { ...config[id], mode };
  }
  writeGuestOrderIntervalAllowCartByLine(config);
}

/** @deprecated 返回首个启用产线的阈值 */
export function readGuestOrderIntervalAllowCartQtyThreshold(): number {
  const config = readGuestOrderIntervalAllowCartByLine();
  const firstEnabled = GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES.find(
    (line) => config[line.id].enabled,
  );
  if (firstEnabled) return config[firstEnabled.id].qtyThreshold;
  return QTY_DEFAULT;
}

/** @deprecated 写入所有启用产线（无启用时写入全部） */
export function writeGuestOrderIntervalAllowCartQtyThreshold(qty: number): void {
  const value = clampQty(qty);
  const config = readGuestOrderIntervalAllowCartByLine();
  const targets = ALL_LINE_IDS.filter((id) => config[id].enabled);
  const ids = targets.length > 0 ? targets : ALL_LINE_IDS;
  for (const id of ids) {
    config[id] = { ...config[id], qtyThreshold: value };
  }
  writeGuestOrderIntervalAllowCartByLine(config);
}

export function isGuestOrderIntervalAllowCartSeq(seq: number): boolean {
  return seq === GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ;
}

function syncRowControls(editor: HTMLElement, panelEnabled: boolean): void {
  editor.querySelectorAll<HTMLInputElement>("[data-guest-order-interval-allow-cart-line-enabled]").forEach((cb) => {
    const lineId = cb.getAttribute("data-guest-order-interval-allow-cart-line-enabled");
    if (!lineId) return;
    const lineEnabled = panelEnabled && cb.checked;
    const modeRadios = editor.querySelectorAll<HTMLInputElement>(
      `[data-guest-order-interval-allow-cart-line-mode="${CSS.escape(lineId)}"]`,
    );
    const qtyInput = editor.querySelector<HTMLInputElement>(
      `[data-guest-order-interval-allow-cart-line-qty="${CSS.escape(lineId)}"]`,
    );
    const qtyWrap = editor.querySelector<HTMLElement>(
      `[data-guest-order-interval-allow-cart-line-qty-wrap="${CSS.escape(lineId)}"]`,
    );
    modeRadios.forEach((radio) => {
      radio.disabled = !lineEnabled;
      const label = radio.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !lineEnabled);
      label.classList.toggle("opacity-50", !lineEnabled);
      label.classList.toggle("cursor-pointer", lineEnabled);
    });
    const checkedMode = Array.from(modeRadios).find((r) => r.checked)?.value;
    const showQty = checkedMode === "auth-qty";
    if (qtyWrap) {
      qtyWrap.classList.toggle("hidden", !showQty);
      if (showQty) qtyWrap.removeAttribute("aria-hidden");
      else qtyWrap.setAttribute("aria-hidden", "true");
    }
    if (qtyInput) qtyInput.disabled = !lineEnabled || !showQty;
  });
}

function collectByLineFromEditor(editor: HTMLElement): GuestOrderIntervalAllowCartByLine {
  const config = defaultByLineConfig(false);
  editor
    .querySelectorAll<HTMLInputElement>("[data-guest-order-interval-allow-cart-line-enabled]")
    .forEach((cb) => {
      const lineId = cb.getAttribute(
        "data-guest-order-interval-allow-cart-line-enabled",
      ) as GuestOrderIntervalAllowCartProductLineId | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
      config[lineId].enabled = cb.checked;
    });
  editor
    .querySelectorAll<HTMLInputElement>("[data-guest-order-interval-allow-cart-line-mode]:checked")
    .forEach((radio) => {
      const lineId = radio.getAttribute(
        "data-guest-order-interval-allow-cart-line-mode",
      ) as GuestOrderIntervalAllowCartProductLineId | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
      if (isValidMode(radio.value)) config[lineId].mode = radio.value;
    });
  editor
    .querySelectorAll<HTMLInputElement>("[data-guest-order-interval-allow-cart-line-qty]")
    .forEach((input) => {
      const lineId = input.getAttribute(
        "data-guest-order-interval-allow-cart-line-qty",
      ) as GuestOrderIntervalAllowCartProductLineId | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
      config[lineId].qtyThreshold = clampQty(input.value);
    });
  writeGuestOrderIntervalAllowCartByLine(config);
  syncRowControls(editor, true);
  return config;
}

function renderByLineEditorHtml(enabled: boolean): string {
  const config = readGuestOrderIntervalAllowCartByLine();
  const rows = GUEST_ORDER_INTERVAL_ALLOW_CART_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const showQty = item.mode === "auth-qty";
    const lineControlsOn = enabled && item.enabled;
    const radios = MODE_OPTIONS.map((opt) => {
      const checked = item.mode === opt.value;
      const qtyBlock =
        opt.value === "auth-qty"
          ? `
        <div
          class="mt-1.5 flex flex-wrap items-center gap-2 pl-6 text-sm ${showQty ? "" : "hidden"}"
          data-guest-order-interval-allow-cart-line-qty-wrap="${escapeHtml(line.id)}"
          ${showQty ? "" : 'aria-hidden="true"'}
        >
          <span class="text-muted-foreground">累计加购菜品数阈值</span>
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.qtyThreshold))}"
            min="${QTY_MIN}"
            max="${QTY_MAX}"
            step="1"
            data-guest-order-interval-allow-cart-line-qty="${escapeHtml(line.id)}"
            ${lineControlsOn && showQty ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 累计加购菜品数阈值"
          />
          <span class="text-xs text-muted-foreground">（${QTY_MIN}–${QTY_MAX} 道）</span>
        </div>`
          : "";

      return `
      <div>
        <label class="inline-flex items-start gap-2 text-sm text-foreground ${lineControlsOn ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
          <input
            type="radio"
            name="guest-order-interval-allow-cart-mode-${escapeHtml(line.id)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
            data-guest-order-interval-allow-cart-line-mode="${escapeHtml(line.id)}"
            ${checked ? "checked" : ""}
            ${lineControlsOn ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span class="leading-snug">${escapeHtml(opt.label)}</span>
        </label>
        ${qtyBlock}
      </div>`;
    }).join("");

    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">
        <label class="inline-flex ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} items-center gap-2">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
            ${item.enabled ? "checked" : ""}
            ${enabled ? "" : "disabled"}
            data-guest-order-interval-allow-cart-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用间隔内加购策略"
          />
        </label>
      </td>
      <td class="px-3 py-2.5 align-top">
        <div
          class="flex flex-col gap-2.5"
          role="radiogroup"
          aria-label="${escapeHtml(line.label)} 间隔内加购策略"
        >
          ${radios}
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div
      data-guest-order-interval-allow-cart-by-line-editor="${GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ}"
      class="space-y-2"
    >
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">加购策略</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderGuestOrderIntervalAllowCartPanelHtml(parentOn: boolean): string {
  ensureGuestOrderIntervalAllowCartByLineMigrated();
  const hidden = parentOn ? "" : "hidden";
  const hintHidden = parentOn ? "hidden" : "";
  return `
    <div
      class="mt-3"
      data-guest-order-interval-allow-cart-panel="${GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ}"
    >
      <p
        class="m-0 text-xs leading-relaxed text-muted-foreground ${hintHidden}"
        data-guest-order-interval-allow-cart-hint
        ${parentOn ? 'aria-hidden="true"' : ""}
      >
        请先开启「订单下单时间间隔」后，再配置间隔内是否允许加购及授权触发条件。
      </p>
      <div
        class="${hidden}"
        data-guest-order-interval-allow-cart-body
        ${parentOn ? "" : 'aria-hidden="true"'}
      >
        ${renderByLineEditorHtml(parentOn)}
      </div>
    </div>`;
}

export function setGuestOrderIntervalAllowCartPanelVisible(parentOn: boolean): void {
  document
    .querySelectorAll<HTMLElement>(
      `[data-guest-order-interval-allow-cart-panel="${GUEST_ORDER_INTERVAL_ALLOW_CART_SEQ}"]`,
    )
    .forEach((panel) => {
      const hint = panel.querySelector<HTMLElement>("[data-guest-order-interval-allow-cart-hint]");
      const body = panel.querySelector<HTMLElement>("[data-guest-order-interval-allow-cart-body]");
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
        .querySelectorAll<HTMLInputElement>("[data-guest-order-interval-allow-cart-line-enabled]")
        .forEach((input) => {
          input.disabled = !parentOn;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !parentOn);
          label.classList.toggle("opacity-50", !parentOn);
          label.classList.toggle("cursor-pointer", parentOn);
        });

      const editor = panel.querySelector<HTMLElement>(
        "[data-guest-order-interval-allow-cart-by-line-editor]",
      );
      if (editor) syncRowControls(editor, parentOn);
    });
}

export function bindGuestOrderIntervalAllowCartUi(root: ParentNode = document): void {
  ensureGuestOrderIntervalAllowCartByLineMigrated();

  root
    .querySelectorAll<HTMLElement>("[data-guest-order-interval-allow-cart-by-line-editor]")
    .forEach((editor) => {
      if (editor.dataset.guestOrderIntervalAllowCartByLineBound === "1") return;
      editor.dataset.guestOrderIntervalAllowCartByLineBound = "1";

      syncRowControls(editor, true);

      const persist = () => collectByLineFromEditor(editor);
      editor.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (
          !target.matches(
            "[data-guest-order-interval-allow-cart-line-enabled], [data-guest-order-interval-allow-cart-line-mode], [data-guest-order-interval-allow-cart-line-qty]",
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
          if (!target.matches("[data-guest-order-interval-allow-cart-line-qty]")) return;
          persist();
        },
        true,
      );
    });
}
