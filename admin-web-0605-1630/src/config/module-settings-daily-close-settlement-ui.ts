/**
 * 财务中心 · 日结与结算（seq 171、65、330）。
 * 171 每日日结总开关；65/330 现金班结体验（依赖 171）。
 * 卡 Batch 日切见支付中心 238；Batch 后打印见 235。
 */

export const DAILY_SETTLEMENT_ENABLE_SEQ = 171;
export const CASH_CLOSE_SHOW_SALES_SEQ = 65;
export const CASH_CLOSE_AUTO_PRINT_SEQ = 330;

/** 171 主开关；65/330 现金班结子项 */
export const DAILY_CLOSE_SETTLEMENT_TOGGLE_SEQS: readonly number[] = [
  DAILY_SETTLEMENT_ENABLE_SEQ,
  CASH_CLOSE_SHOW_SALES_SEQ,
  CASH_CLOSE_AUTO_PRINT_SEQ,
];

export const DAILY_CLOSE_CASH_OPTION_SEQS: readonly number[] = [
  CASH_CLOSE_SHOW_SALES_SEQ,
  CASH_CLOSE_AUTO_PRINT_SEQ,
];

export function isDailySettlementEnableSeq(seq: number): boolean {
  return seq === DAILY_SETTLEMENT_ENABLE_SEQ;
}

export function isDailyCloseCashOptionSeq(seq: number): boolean {
  return (DAILY_CLOSE_CASH_OPTION_SEQS as readonly number[]).includes(seq);
}

export function renderDailyCloseSettlementIntroHtml(): string {
  return `
    <p class="m-0 mb-3 text-xs leading-relaxed text-muted-foreground">
      本组配置<strong>门店现金日结/班结</strong>流程：是否按营业日执行班结、班结界面展示与完成后报表输出。
      <strong>不是</strong>卡交易 Batch 调度——自动关账时刻、收单结算周期、Batch 后打印见支付中心「BATCH与日结」（238、230、235）。
      钱箱容差与备款见「钱箱与现金平账」（63、76、181）。
    </p>`;
}

export function renderDailyCloseCrossRefPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-daily-close-enabled-panel="${DAILY_SETTLEMENT_ENABLE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">开启后可配置的现金班结项</p>
      <ul class="m-0 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
        <li><strong>65</strong> 班结界面是否展示系统现金销售总额</li>
        <li><strong>330</strong> 班结完成后是否自动打印备款/现金结算报表</li>
      </ul>
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        关闭主开关后，65/330 不可用；不影响支付中心 Batch 关账时刻（238）。
      </p>
    </div>`;
}

export function setDailyCloseEnabledPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-daily-close-enabled-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  });
}

export function setDailyCloseCashOptionRowsEnabled(enabled: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-daily-close-cash-option]").forEach((row) => {
    row.classList.toggle("opacity-50", !enabled);
    row.querySelectorAll<HTMLButtonElement>("[data-module-setting-toggle]").forEach((btn) => {
      btn.disabled = !enabled;
      if (!enabled) btn.setAttribute("aria-disabled", "true");
      else btn.removeAttribute("aria-disabled");
    });
  });
}

export function syncDailyCloseCashOptionRowsFromMaster(): void {
  try {
    const key = `bplant-module-setting-toggle:${DAILY_SETTLEMENT_ENABLE_SEQ}`;
    const on = localStorage.getItem(key) === "1";
    setDailyCloseCashOptionRowsEnabled(on);
    setDailyCloseEnabledPanelVisible(DAILY_SETTLEMENT_ENABLE_SEQ, on);
  } catch {
    setDailyCloseCashOptionRowsEnabled(true);
  }
}
