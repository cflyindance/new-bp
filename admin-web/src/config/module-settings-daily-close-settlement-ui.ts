/**
 * 财务中心 · 现金日结与班结（seq 171、65、330）。
 * 171 每日日结总开关；开启后以复选框配置 65/330（结构对齐主开关 + 子项多选）。
 * 卡 Batch 日切见支付中心 238；Batch 后打印见 235。
 */

import {
  readModuleSettingToggleOn,
  writeModuleSettingToggleOn,
} from "./module-settings-toggle-ui";

export const DAILY_SETTLEMENT_ENABLE_SEQ = 171;
export const CASH_CLOSE_SHOW_SALES_SEQ = 65;
export const CASH_CLOSE_AUTO_PRINT_SEQ = 330;

/** 171 主开关；65/330 现金班结子项（嵌套复选，仍走 toggle 存储） */
export const DAILY_CLOSE_SETTLEMENT_TOGGLE_SEQS: readonly number[] = [
  DAILY_SETTLEMENT_ENABLE_SEQ,
  CASH_CLOSE_SHOW_SALES_SEQ,
  CASH_CLOSE_AUTO_PRINT_SEQ,
];

export const DAILY_CLOSE_CASH_OPTION_SEQS: readonly number[] = [
  CASH_CLOSE_SHOW_SALES_SEQ,
  CASH_CLOSE_AUTO_PRINT_SEQ,
];

const DAILY_CLOSE_CASH_OPTIONS = [
  {
    seq: CASH_CLOSE_SHOW_SALES_SEQ,
    label: "班结时显示系统现金销售额",
  },
  {
    seq: CASH_CLOSE_AUTO_PRINT_SEQ,
    label: "班结完成后自动打印现金报表",
  },
] as const;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isDailySettlementEnableSeq(seq: number): boolean {
  return seq === DAILY_SETTLEMENT_ENABLE_SEQ;
}

export function isDailyCloseCashOptionSeq(seq: number): boolean {
  return (DAILY_CLOSE_CASH_OPTION_SEQS as readonly number[]).includes(seq);
}

/** 65/330 已嵌套在 171 面板内，catalog 行不再单独渲染 */
export function shouldSkipDailyCloseCashOptionCatalogRow(seq: number): boolean {
  return isDailyCloseCashOptionSeq(seq);
}

export function renderDailyCloseSettlementIntroHtml(): string {
  return "";
}

export function renderDailyCloseOptionsPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  const checkboxes = DAILY_CLOSE_CASH_OPTIONS.map((opt) => {
    const checked = readModuleSettingToggleOn(opt.seq);
    return `
      <label class="inline-flex items-center gap-2 text-sm text-foreground ${on ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${opt.seq}"
          data-daily-close-cash-option-seq="${opt.seq}"
          ${checked ? "checked" : ""}
          ${on ? "" : "disabled"}
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-daily-close-enabled-panel="${DAILY_SETTLEMENT_ENABLE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <div class="flex flex-col gap-2.5" role="group" aria-label="现金班结关联设置" data-daily-close-cash-options>
        ${checkboxes}
      </div>
    </div>`;
}

export function setDailyCloseEnabledPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-daily-close-enabled-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-daily-close-cash-option-seq]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

/** @deprecated 子项已改为面板内复选框；保留空实现以免旧调用报错 */
export function setDailyCloseCashOptionRowsEnabled(_enabled: boolean): void {
  /* no-op：catalog 行已跳过 */
}

export function syncDailyCloseCashOptionRowsFromMaster(): void {
  setDailyCloseEnabledPanelVisible(
    DAILY_SETTLEMENT_ENABLE_SEQ,
    readModuleSettingToggleOn(DAILY_SETTLEMENT_ENABLE_SEQ),
  );
}

export function bindDailyCloseSettlementUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-daily-close-cash-options]").forEach((group) => {
    if (group.dataset.dailyCloseOptionsBound === "1") return;
    group.dataset.dailyCloseOptionsBound = "1";
    group.addEventListener("change", (e) => {
      const input = (e.target as HTMLElement).closest<HTMLInputElement>(
        "[data-daily-close-cash-option-seq]",
      );
      if (!input || input.disabled) return;
      const seq = Number(input.getAttribute("data-daily-close-cash-option-seq"));
      if (!seq) return;
      writeModuleSettingToggleOn(seq, input.checked);
      window.dispatchEvent(
        new CustomEvent("menusifu:module-setting-changed", {
          detail: { seq, on: input.checked },
        }),
      );
    });
  });
}
