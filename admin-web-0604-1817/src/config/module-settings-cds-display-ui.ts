/**
 * 客显屏展示设置（原前厅管理中心 · 客显屏 cds 组：10 / 461 / 462 / 466）。
 * SSOT：硬件管理中心 → 硬件 → CDS → 设备编辑页。
 */

import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const CDS_JOIN_MEMBER_SEQ = 10;
export const CDS_SHOW_COVER_SEQ = 461;
export const CDS_SHOW_LOGO_SEQ = 462;
export const CDS_PICKUP_DELIVERY_SEQ = 466;

export const CDS_FOH_DISPLAY_SEQS = [
  CDS_JOIN_MEMBER_SEQ,
  CDS_SHOW_COVER_SEQ,
  CDS_SHOW_LOGO_SEQ,
  CDS_PICKUP_DELIVERY_SEQ,
] as const;

export type CdsDisplaySettingKey =
  | "joinMember"
  | "showCover"
  | "showLogo"
  | "pickupDeliveryEnabled";

export type CdsDisplaySettings = Record<CdsDisplaySettingKey, boolean>;

const SEQ_BY_KEY: Record<CdsDisplaySettingKey, number> = {
  joinMember: CDS_JOIN_MEMBER_SEQ,
  showCover: CDS_SHOW_COVER_SEQ,
  showLogo: CDS_SHOW_LOGO_SEQ,
  pickupDeliveryEnabled: CDS_PICKUP_DELIVERY_SEQ,
};

export const CDS_DISPLAY_SETTING_ITEMS: {
  key: CdsDisplaySettingKey;
  seq: number;
  title: string;
  sceneDesc: string;
  assetNote?: boolean;
}[] = [
  {
    key: "showCover",
    seq: CDS_SHOW_COVER_SEQ,
    title: "封面",
    sceneDesc: "是否在客显屏展示广告宣传图（封面）。",
    assetNote: true,
  },
  {
    key: "showLogo",
    seq: CDS_SHOW_LOGO_SEQ,
    title: "Logo",
    sceneDesc: "是否在客显屏展示 Logo。",
    assetNote: true,
  },
  {
    key: "pickupDeliveryEnabled",
    seq: CDS_PICKUP_DELIVERY_SEQ,
    title: "Pickup/Delivery 启用客显",
    sceneDesc: "Pickup / Delivery 类型订单是否启用本客显屏。",
  },
  {
    key: "joinMember",
    seq: CDS_JOIN_MEMBER_SEQ,
    title: "加入会员",
    sceneDesc: "是否在客显屏展示「加入会员」按钮入口。",
  },
];

const TOGGLE_TRACK_ON = "border-primary bg-primary shadow-sm";
const TOGGLE_TRACK_OFF =
  "border-input bg-muted shadow-inner bg-neutral-300 border-neutral-400/80 dark:bg-neutral-600 dark:border-neutral-500";
const TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

const ASSET_CENTER_MATERIALS_PATH = "/asset-center/materials";

export const DEFAULT_CDS_DISPLAY_SETTINGS: CdsDisplaySettings = {
  joinMember: false,
  showCover: true,
  showLogo: true,
  pickupDeliveryEnabled: false,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyGlobalToggleOn(seq: number, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function migrateCdsDisplaySettingsFromFoh(
  partial?: Partial<CdsDisplaySettings>,
): CdsDisplaySettings {
  const base = { ...DEFAULT_CDS_DISPLAY_SETTINGS, ...partial };
  return {
    joinMember: readLegacyGlobalToggleOn(CDS_JOIN_MEMBER_SEQ, base.joinMember),
    showCover: readLegacyGlobalToggleOn(CDS_SHOW_COVER_SEQ, base.showCover),
    showLogo: readLegacyGlobalToggleOn(CDS_SHOW_LOGO_SEQ, base.showLogo),
    pickupDeliveryEnabled: readLegacyGlobalToggleOn(
      CDS_PICKUP_DELIVERY_SEQ,
      base.pickupDeliveryEnabled,
    ),
  };
}

export function normalizeCdsDisplaySettings(raw: unknown): CdsDisplaySettings {
  if (!raw || typeof raw !== "object") {
    return migrateCdsDisplaySettingsFromFoh();
  }
  const o = raw as Partial<CdsDisplaySettings>;
  return migrateCdsDisplaySettingsFromFoh({
    joinMember: !!o.joinMember,
    showCover: !!o.showCover,
    showLogo: !!o.showLogo,
    pickupDeliveryEnabled: !!o.pickupDeliveryEnabled,
  });
}

function toggleOffLabelClass(on: boolean): string {
  return on ? "text-xs text-muted-foreground" : "text-xs font-medium text-foreground";
}

function toggleOnLabelClass(on: boolean): string {
  return on ? "text-xs font-medium text-foreground" : "text-xs text-muted-foreground";
}

function syncCdsDisplayToggleButton(btn: HTMLButtonElement): void {
  const on = btn.getAttribute("aria-checked") === "true";
  const knob = btn.querySelector("span");
  if (knob) {
    knob.classList.toggle("translate-x-5", on);
    knob.classList.toggle("translate-x-0.5", !on);
  }
  for (const cls of TOGGLE_TRACK_ON.split(/\s+/)) {
    btn.classList.toggle(cls, on);
  }
  for (const cls of TOGGLE_TRACK_OFF.split(/\s+/)) {
    btn.classList.toggle(cls, !on);
  }
  const group = btn.closest("[data-cds-display-toggle-group]");
  const offLabel = group?.querySelector("[data-cds-toggle-off-label]");
  const onLabel = group?.querySelector("[data-cds-toggle-on-label]");
  if (offLabel) offLabel.className = toggleOffLabelClass(on);
  if (onLabel) onLabel.className = toggleOnLabelClass(on);
}

function renderToggleRow(
  deviceId: string,
  item: (typeof CDS_DISPLAY_SETTING_ITEMS)[number],
  on: boolean,
): string {
  const trackClass = on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF;
  const knobClass = on ? "translate-x-5" : "translate-x-0.5";
  const assetNote = item.assetNote
    ? `<p class="mt-1 text-xs text-muted-foreground">图片维护请至 <a href="#${ASSET_CENTER_MATERIALS_PATH}" class="font-medium text-primary hover:underline">素材中心 · 图片素材</a>。</p>`
    : "";

  return `
    <div class="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0" data-cds-display-setting-row>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-foreground">${escapeHtml(item.title)}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(item.sceneDesc)}</p>
        ${assetNote}
      </div>
      <div class="flex shrink-0 items-center gap-2" data-cds-display-toggle-group>
        <span data-cds-toggle-off-label class="${toggleOffLabelClass(on)}">关</span>
        <button
          type="button"
          role="switch"
          aria-checked="${on ? "true" : "false"}"
          aria-label="${escapeHtml(item.title)}"
          data-cds-display-toggle
          data-cds-display-field="${escapeHtml(item.key)}"
          data-cds-device-id="${escapeHtml(deviceId)}"
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
        >
          <span class="pointer-events-none block size-5 ${knobClass} ${TOGGLE_KNOB} rounded-full transition-transform duration-200"></span>
        </button>
        <span data-cds-toggle-on-label class="${toggleOnLabelClass(on)}">开</span>
      </div>
    </div>`;
}

export function renderCdsDisplaySettingsSectionHtml(
  deviceId: string,
  settings: CdsDisplaySettings,
): string {
  const rows = CDS_DISPLAY_SETTING_ITEMS.map((item) =>
    renderToggleRow(deviceId, item, settings[item.key]),
  ).join("");

  return `
    <section class="rounded-xl border border-border bg-card p-5 shadow-sm" data-cds-display-settings-section>
      <h2 class="text-base font-semibold text-card-foreground">客显屏展示</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        原前厅设置 · 客显屏（加入会员、封面、Logo、Pickup/Delivery）已按设备配置；结账小费、签名、小票见支付中心。
      </p>
      <div class="mt-4 rounded-lg border border-border bg-muted/20 px-4">${rows}</div>
    </section>`;
}

export function collectCdsDisplaySettingsFromForm(form: HTMLElement): CdsDisplaySettings {
  const out = { ...DEFAULT_CDS_DISPLAY_SETTINGS };
  form.querySelectorAll<HTMLButtonElement>("[data-cds-display-toggle]").forEach((btn) => {
    const field = btn.getAttribute("data-cds-display-field") as CdsDisplaySettingKey | null;
    if (!field || !(field in SEQ_BY_KEY)) return;
    out[field] = btn.getAttribute("aria-checked") === "true";
  });
  return out;
}

export function bindCdsDisplaySettingsToggles(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>("[data-cds-display-toggle]").forEach((btn) => {
    syncCdsDisplayToggleButton(btn);
    if (btn.dataset.cdsDisplayToggleBound === "1") return;
    btn.dataset.cdsDisplayToggleBound = "1";
    btn.addEventListener("click", () => {
      const next = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", next ? "true" : "false");
      syncCdsDisplayToggleButton(btn);
    });
  });
}
