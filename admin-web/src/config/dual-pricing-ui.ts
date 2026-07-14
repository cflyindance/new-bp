/**
 * 支付中心 · Dual Pricing。
 * 单页门店配置列表；行内「任务列表」当前页弹层展示该店任务。
 */
import {
  getDpStore,
  listDpStoreOptions,
  listDpStores,
  listDpTasks,
  retryDpTask,
  setDualPricingMockListError,
  getDualPricingMockListError,
} from "./dual-pricing-store";
import {
  DP_TASK_TYPE_LABEL_ZH,
  formatDpPosStatus,
  formatDpRate,
  formatDpReceiptDisplay,
  formatDpUpstreamStatus,
  isDpRetryableTask,
  type DpPosStatus,
  type DpStoreSnapshot,
  type DpTask,
  type DpUpstreamStatus,
} from "./dual-pricing-types";
import { getUiLocale, t } from "../i18n";

export const DUAL_PRICING_PATH = "/transactions/dual-pricing";
/** @deprecated 已取消独立任务 Tab；旧书签重定向到 DUAL_PRICING_PATH */
export const DUAL_PRICING_TASKS_PATH = "/transactions/dual-pricing/tasks";
export const DUAL_PRICING_PREFIX = "/transactions/dual-pricing";

const SELECT_CLASS =
  "h-9 w-full min-w-[10rem] max-w-[16rem] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const INPUT_CLASS =
  "h-9 w-full min-w-[8rem] max-w-[14rem] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const BTN_SECONDARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type StoreFilterApplied = { storeId: string; mid: string };

type TasksDialogState = {
  storeId: string;
  mid: string;
};

let storeFilterApplied: StoreFilterApplied = { storeId: "", mid: "" };
let tasksDialog: TasksDialogState | null = null;
let lastActionMessage: string | null = null;
let tasksDialogEscHandler: ((e: KeyboardEvent) => void) | null = null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHashQuery(path: string): string {
  const i = path.indexOf("?");
  return i >= 0 ? path.slice(0, i) : path;
}

function parseHashQuery(path?: string): URLSearchParams {
  const raw = path ?? location.hash.slice(1);
  const i = raw.indexOf("?");
  return new URLSearchParams(i >= 0 ? raw.slice(i + 1) : "");
}

export function isDualPricingPath(path: string): boolean {
  const p = stripHashQuery(path);
  return p === DUAL_PRICING_PREFIX || p.startsWith(`${DUAL_PRICING_PREFIX}/`);
}

export function getActiveDualPricingSubPath(_path: string): string {
  return DUAL_PRICING_PATH;
}

export function findDualPricingTitle(path: string): { title: string; module: string } | null {
  if (!isDualPricingPath(path)) return null;
  return {
    title: "Dual Pricing",
    module: "支付中心 · Dual Pricing",
  };
}

/** 旧 `/tasks` 书签 → 主路径；若带 storeId/mid 则打开对应弹层 */
function consumeLegacyTasksRoute(path: string): void {
  const p = stripHashQuery(path);
  if (p !== DUAL_PRICING_TASKS_PATH && !p.startsWith(`${DUAL_PRICING_TASKS_PATH}/`)) {
    return;
  }
  const raw = path.includes("?") ? path : location.hash.slice(1);
  const q = parseHashQuery(raw);
  const storeId = (q.get("storeId") ?? "").trim();
  const mid = (q.get("mid") ?? "").trim();
  if (storeId || mid) {
    tasksDialog = { storeId, mid };
  }
  if (location.hash.slice(1).startsWith(DUAL_PRICING_TASKS_PATH)) {
    const next = `#${DUAL_PRICING_PATH}`;
    if (location.hash !== next) {
      location.replace(next);
    }
  }
}

function renderActionBanner(): string {
  if (!lastActionMessage) return "";
  return `
    <div class="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground" data-dp-action-banner role="status">
      ${escapeHtml(lastActionMessage)}
    </div>`;
}

function renderErrorState(message: string): string {
  return `
    <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-border px-6 py-16" data-dp-error>
      <p class="text-sm text-destructive">${escapeHtml(message)}</p>
      <button type="button" class="${BTN_PRIMARY}" data-dp-error-retry>重试</button>
    </div>`;
}

function renderStoreFilters(): string {
  const locale = getUiLocale();
  let storeOptionsHtml = "";
  try {
    const allStores = listDpStoreOptions();
    storeOptionsHtml = [
      `<option value="">${escapeHtml(locale === "en" ? "All stores" : "全部门店")}</option>`,
      ...allStores.map((s) => {
        const sel = s.storeId === storeFilterApplied.storeId ? " selected" : "";
        return `<option value="${escapeHtml(s.storeId)}"${sel}>${escapeHtml(s.storeName)}</option>`;
      }),
    ].join("");
  } catch {
    storeOptionsHtml = `<option value="">${escapeHtml(t("pageStorePicker.placeholder"))}</option>`;
  }

  return `
    <div class="flex shrink-0 flex-wrap items-end gap-3" data-dp-store-filters>
      <label class="text-sm" for="dp-filter-store-select">
        <span class="mb-1 block text-xs text-muted-foreground">${escapeHtml(locale === "en" ? "Store" : "门店名称")}</span>
        <select
          id="dp-filter-store-select"
          data-dp-filter-store-id
          class="${SELECT_CLASS}"
          aria-label="${escapeHtml(locale === "en" ? "Select store" : "选择门店")}"
        >
          ${storeOptionsHtml}
        </select>
      </label>
      <label class="text-sm">
        <span class="mb-1 block text-xs text-muted-foreground">MID</span>
        <input type="text" data-dp-filter-mid value="${escapeHtml(storeFilterApplied.mid)}" class="${INPUT_CLASS}" placeholder="MID" />
      </label>
      <button type="button" class="${BTN_PRIMARY}" data-dp-filter-search>查找</button>
      <button type="button" class="${BTN_SECONDARY}" data-dp-filter-reset>重置</button>
    </div>`;
}

function renderStoreTable(rows: DpStoreSnapshot[]): string {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="5" class="px-4 py-12 text-center text-sm text-muted-foreground">
          暂无门店 Dual Pricing 配置
        </td>
      </tr>`;
  }
  return rows
    .map((s) => {
      return `
      <tr class="border-b border-border/60 hover:bg-muted/30">
        <td class="px-4 py-2.5 text-center text-sm">${escapeHtml(s.storeName)}</td>
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(s.mid)}</td>
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(formatDpRate(s.rate))}</td>
        <td class="px-4 py-2.5 text-center text-sm">${escapeHtml(formatDpReceiptDisplay(s.receiptUnpaidDisplay))}</td>
        <td class="px-4 py-2.5 text-center text-sm">
          <button
            type="button"
            class="font-medium text-primary underline-offset-2 hover:underline"
            data-dp-open-tasks
            data-store-id="${escapeHtml(s.storeId)}"
            data-mid="${escapeHtml(s.mid)}"
          >任务列表</button>
        </td>
      </tr>`;
    })
    .join("");
}

function upstreamBadgeClass(status: DpUpstreamStatus): string {
  if (status === "received") return "text-emerald-700 dark:text-emerald-400";
  if (status === "failed") return "text-destructive";
  return "text-muted-foreground";
}

function posBadgeClass(status: DpPosStatus): string {
  if (status === "ok") return "text-emerald-700 dark:text-emerald-400";
  if (status === "failed") return "text-destructive";
  return "text-muted-foreground";
}

function formatUpdatedAtCell(updatedAt: string): string {
  const parts = updatedAt.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `<span class="inline-block leading-tight">${escapeHtml(parts[0]!)}<br />${escapeHtml(parts.slice(1).join(" "))}</span>`;
  }
  return escapeHtml(updatedAt);
}

function renderTaskTable(rows: DpTask[]): string {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="8" class="px-4 py-12 text-center text-sm text-muted-foreground">
          暂无 Dual Pricing 任务
        </td>
      </tr>`;
  }
  return rows
    .map((t) => {
      const retryable = isDpRetryableTask(t);
      const op = retryable
        ? `<button type="button" class="font-medium text-primary underline-offset-2 hover:underline" data-dp-retry="${escapeHtml(t.taskId)}">更新</button>`
        : `<span class="text-muted-foreground">/</span>`;
      return `
      <tr class="border-b border-border/60 hover:bg-muted/30">
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(t.taskId)}</td>
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(t.caseNumber)}</td>
        <td class="px-4 py-2.5 text-center text-sm">${escapeHtml(DP_TASK_TYPE_LABEL_ZH[t.type])}</td>
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(formatDpRate(t.rate))}</td>
        <td class="px-4 py-2.5 text-center text-sm ${upstreamBadgeClass(t.upstreamStatus)}">${escapeHtml(formatDpUpstreamStatus(t.upstreamStatus))}</td>
        <td class="px-4 py-2.5 text-center text-sm ${posBadgeClass(t.posStatus)}">${escapeHtml(formatDpPosStatus(t.posStatus))}</td>
        <td class="px-4 py-2.5 text-center text-sm">${formatUpdatedAtCell(t.updatedAt)}</td>
        <td class="px-4 py-2.5 text-center text-sm">${op}</td>
      </tr>`;
    })
    .join("");
}

function renderTasksTableBlock(rows: DpTask[]): string {
  return `
    <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
      <table class="w-full min-w-[900px] border-collapse">
        <thead class="sticky top-0 z-[1]">
          <tr class="bg-muted text-foreground">
            <th class="px-4 py-2.5 text-center text-sm font-medium">任务ID</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">case number</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">类型</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">rate</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">上游同步</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">POS 下发</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">更新时间</th>
            <th class="px-4 py-2.5 text-center text-sm font-medium">操作</th>
          </tr>
        </thead>
        <tbody>${renderTaskTable(rows)}</tbody>
      </table>
    </div>`;
}

function renderStorePanel(): string {
  try {
    const rows = listDpStores({
      storeId: storeFilterApplied.storeId || undefined,
      mid: storeFilterApplied.mid || undefined,
    });
    return `
      ${renderStoreFilters()}
      <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        <table class="w-full min-w-[720px] border-collapse">
          <thead class="sticky top-0 z-[1]">
            <tr class="bg-muted text-foreground">
              <th class="px-4 py-2.5 text-center text-sm font-medium">门店名称</th>
              <th class="px-4 py-2.5 text-center text-sm font-medium">MID</th>
              <th class="px-4 py-2.5 text-center text-sm font-medium">Rate</th>
              <th class="px-4 py-2.5 text-center text-sm font-medium">Receipt (Unpaid) Display</th>
              <th class="px-4 py-2.5 text-center text-sm font-medium">按钮</th>
            </tr>
          </thead>
          <tbody>${renderStoreTable(rows)}</tbody>
        </table>
      </div>`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "门店列表加载失败";
    return `${renderStoreFilters()}${renderErrorState(msg)}`;
  }
}

function renderStoreTasksDialog(): string {
  if (!tasksDialog) return "";
  const store = getDpStore(tasksDialog.storeId);
  const title = store
    ? `${store.storeName} · 任务列表`
    : `任务列表（${tasksDialog.mid || tasksDialog.storeId}）`;
  let body: string;
  try {
    const rows = listDpTasks({
      storeId: tasksDialog.storeId || undefined,
      mid: tasksDialog.mid || undefined,
    });
    body = renderTasksTableBlock(rows);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "任务列表加载失败";
    body = renderErrorState(msg);
  }

  return `
    <div
      id="dual-pricing-tasks-dialog"
      class="fixed inset-0 z-[10040] flex items-center justify-center overflow-y-auto p-4"
      data-dp-tasks-overlay
      aria-hidden="false"
      role="presentation"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-dp-tasks-backdrop aria-label="关闭"></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dual-pricing-tasks-dialog-title"
        class="relative z-10 my-auto flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        data-dp-tasks-dialog
      >
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="dual-pricing-tasks-dialog-title" class="text-base font-semibold text-foreground">${escapeHtml(title)}</h2>
          <button type="button" class="${BTN_SECONDARY}" data-dp-tasks-close>关闭</button>
        </div>
        <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 py-4">
          ${lastActionMessage ? renderActionBanner() : ""}
          ${body}
        </div>
      </div>
    </div>`;
}

export function renderDualPricingPageContent(path: string): string {
  consumeLegacyTasksRoute(path);

  return `
    <div class="dual-pricing-page flex min-h-0 flex-1 flex-col gap-4" data-dual-pricing-page="stores">
      ${!tasksDialog ? renderActionBanner() : ""}
      ${renderStorePanel()}
      ${renderStoreTasksDialog()}
    </div>`;
}

function closeTasksDialog(remount: () => void): void {
  if (tasksDialogEscHandler) {
    document.removeEventListener("keydown", tasksDialogEscHandler);
    tasksDialogEscHandler = null;
  }
  tasksDialog = null;
  lastActionMessage = null;
  remount();
}

export function bindDualPricingUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-dual-pricing-page]");
  if (!root) return;

  if (tasksDialogEscHandler) {
    document.removeEventListener("keydown", tasksDialogEscHandler);
    tasksDialogEscHandler = null;
  }
  if (tasksDialog) {
    tasksDialogEscHandler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      closeTasksDialog(remount);
    };
    document.addEventListener("keydown", tasksDialogEscHandler);
  }

  root.querySelector("[data-dp-filter-search]")?.addEventListener("click", () => {
    const storeSelect = root.querySelector<HTMLSelectElement>("[data-dp-filter-store-id]");
    const mid = root.querySelector<HTMLInputElement>("[data-dp-filter-mid]");
    storeFilterApplied = {
      storeId: storeSelect?.value.trim() ?? "",
      mid: mid?.value.trim() ?? "",
    };
    lastActionMessage = null;
    remount();
  });

  root.querySelector("[data-dp-filter-reset]")?.addEventListener("click", () => {
    storeFilterApplied = { storeId: "", mid: "" };
    lastActionMessage = null;
    remount();
  });

  /* 下拉切换门店后立即按店筛选（MID 仍可点查找叠加） */
  root.querySelector<HTMLSelectElement>("[data-dp-filter-store-id]")?.addEventListener("change", (e) => {
    const select = e.currentTarget as HTMLSelectElement;
    const storeId = select.value.trim();
    const midInput = root.querySelector<HTMLInputElement>("[data-dp-filter-mid]");
    storeFilterApplied = {
      storeId,
      mid: midInput?.value.trim() ?? storeFilterApplied.mid,
    };
    lastActionMessage = null;
    remount();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-dp-open-tasks]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const storeId = btn.getAttribute("data-store-id")?.trim() ?? "";
      const mid = btn.getAttribute("data-mid")?.trim() ?? "";
      if (!storeId && !mid) return;
      tasksDialog = { storeId, mid };
      lastActionMessage = null;
      remount();
    });
  });

  root.querySelector("[data-dp-tasks-close]")?.addEventListener("click", () => {
    closeTasksDialog(remount);
  });
  root.querySelector("[data-dp-tasks-backdrop]")?.addEventListener("click", () => {
    closeTasksDialog(remount);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-dp-retry]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-dp-retry");
      if (!id) return;
      const result = retryDpTask(id);
      lastActionMessage = result.ok
        ? `任务 ${id} 已重新入队并下发成功`
        : `更新失败：${result.reason}`;
      remount();
    });
  });

  root.querySelector("[data-dp-error-retry]")?.addEventListener("click", () => {
    if (getDualPricingMockListError()) {
      setDualPricingMockListError(false);
    }
    lastActionMessage = null;
    remount();
  });
}
