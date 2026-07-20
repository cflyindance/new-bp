/**
 * 配置变更前后对比预览（下发记录 / 保存并下发确认共用）
 */
import { getSettingTitleBySeq } from "./deployment-change-buffer";
import type { DeploymentConfigChange } from "./deployment-types";
import {
  formatAutoLogoutByLineForDeployment,
  formatMaxGuestsByLineForDeployment,
  formatStoreClosingAlertByLineForDeployment,
  AUTO_LOGOUT_BY_LINE_FIELD_ID,
  MAX_GUESTS_BY_LINE_FIELD_ID,
  STORE_CLOSING_ALERT_BY_LINE_FIELD_ID,
} from "./module-settings-deployment-change";

const STORE_CLOSING_ALERT_SEQ = 582;
const AUTO_LOGOUT_MINUTES_SEQ = 75;
const MAX_GUESTS_PER_ORDER_SEQ = 111;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isClosingAlertChange(change: DeploymentConfigChange): boolean {
  const fieldKey = change.fieldKey?.trim() ?? "";
  return (
    fieldKey === STORE_CLOSING_ALERT_BY_LINE_FIELD_ID ||
    fieldKey === String(STORE_CLOSING_ALERT_SEQ) ||
    fieldKey.startsWith(`${STORE_CLOSING_ALERT_SEQ}-`) ||
    change.label.includes("营业时间即将结束提示")
  );
}

function isAutoLogoutByLineChange(change: DeploymentConfigChange): boolean {
  const fieldKey = change.fieldKey?.trim() ?? "";
  return (
    fieldKey === AUTO_LOGOUT_BY_LINE_FIELD_ID ||
    fieldKey === String(AUTO_LOGOUT_MINUTES_SEQ) ||
    fieldKey.startsWith(`${AUTO_LOGOUT_MINUTES_SEQ}-`) ||
    change.label.includes("自动登出时间")
  );
}

function isMaxGuestsByLineChange(change: DeploymentConfigChange): boolean {
  const fieldKey = change.fieldKey?.trim() ?? "";
  return (
    fieldKey === MAX_GUESTS_BY_LINE_FIELD_ID ||
    fieldKey === String(MAX_GUESTS_PER_ORDER_SEQ) ||
    fieldKey.startsWith(`${MAX_GUESTS_PER_ORDER_SEQ}-`) ||
    change.label.includes("每单最多客人")
  );
}

export function normalizeChangeForDisplay(change: DeploymentConfigChange): DeploymentConfigChange {
  if (isClosingAlertChange(change)) {
    return {
      ...change,
      label: getSettingTitleBySeq(STORE_CLOSING_ALERT_SEQ),
      before: formatStoreClosingAlertByLineForDeployment(change.before) ?? change.before,
      after: formatStoreClosingAlertByLineForDeployment(change.after) ?? change.after,
    };
  }
  if (isAutoLogoutByLineChange(change)) {
    return {
      ...change,
      label: getSettingTitleBySeq(AUTO_LOGOUT_MINUTES_SEQ),
      before: formatAutoLogoutByLineForDeployment(change.before) ?? change.before,
      after: formatAutoLogoutByLineForDeployment(change.after) ?? change.after,
    };
  }
  if (isMaxGuestsByLineChange(change)) {
    return {
      ...change,
      label: getSettingTitleBySeq(MAX_GUESTS_PER_ORDER_SEQ),
      before: formatMaxGuestsByLineForDeployment(change.before) ?? change.before,
      after: formatMaxGuestsByLineForDeployment(change.after) ?? change.after,
    };
  }
  return change;
}

function renderMultilineValue(value: string): string {
  return escapeHtml(value || "—").replace(/\n/g, "<br />");
}

function isBlankChangeValue(value: string | undefined): boolean {
  const trimmed = (value ?? "").trim();
  return !trimmed || trimmed === "—" || trimmed === "-";
}

type ChangePreviewKind = "add" | "edit" | "delete";

function resolveChangePreviewKind(change: DeploymentConfigChange): ChangePreviewKind {
  const beforeEmpty = isBlankChangeValue(change.before);
  const afterEmpty = isBlankChangeValue(change.after);
  if (beforeEmpty && !afterEmpty) return "add";
  if (!beforeEmpty && afterEmpty) return "delete";
  return "edit";
}

function changePreviewKindLabel(kind: ChangePreviewKind): string {
  if (kind === "add") return "新增";
  if (kind === "delete") return "删除";
  return "修改";
}

function changePreviewKindBadgeClass(kind: ChangePreviewKind): string {
  if (kind === "add") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (kind === "delete") return "bg-red-500/15 text-red-700 dark:text-red-400";
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
}

const CHANGE_ARROW_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

export const CHANGE_CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

function renderChangeFieldRow(label: string, value: string, emphasize = false): string {
  return `
    <div class="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span class="shrink-0 text-muted-foreground">${escapeHtml(label)}</span>
      <span class="min-w-0 text-right ${emphasize ? "font-medium text-primary" : "text-card-foreground"}">${renderMultilineValue(value)}</span>
    </div>`;
}

function renderChangeCompareBlock(changes: DeploymentConfigChange[]): string {
  const beforeRows = changes.map((c) => renderChangeFieldRow(c.label, c.before)).join("");
  const afterRows = changes.map((c) => renderChangeFieldRow(c.label, c.after, true)).join("");
  return `
    <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
      <div class="rounded-lg border border-border bg-muted/40 p-3">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">更改前</div>
        <div class="divide-y divide-border/60">${beforeRows}</div>
      </div>
      <div class="flex items-center justify-center">
        <span class="inline-flex size-8 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
          ${CHANGE_ARROW_ICON}
        </span>
      </div>
      <div class="rounded-lg border border-border bg-muted/40 p-3">
        <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">更改后</div>
        <div class="divide-y divide-border/60">${afterRows}</div>
      </div>
    </div>`;
}

function renderChangeDeleteBlock(changes: DeploymentConfigChange[]): string {
  const items = changes
    .map(
      (c) => `
      <div class="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-card-foreground">
        <span class="font-medium">${escapeHtml(c.label)}</span>
        <span class="ml-2 text-muted-foreground">${renderMultilineValue(c.before)}</span>
      </div>`,
    )
    .join("");
  return `<div class="space-y-2">${items}</div>`;
}

function renderChangeAddBlock(changes: DeploymentConfigChange[]): string {
  const items = changes
    .map(
      (c) => `
      <div class="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
        <span class="font-medium text-card-foreground">${escapeHtml(c.label)}</span>
        <span class="ml-2 font-medium text-primary">${renderMultilineValue(c.after)}</span>
      </div>`,
    )
    .join("");
  return `<div class="space-y-2">${items}</div>`;
}

/** 变更预览主体：按新增 / 修改 / 删除分组的前后对比 */
export function renderChangePreviewSections(changes: DeploymentConfigChange[]): string {
  if (changes.length === 0) {
    return `<p class="m-0 py-8 text-center text-sm text-muted-foreground">暂无变更明细</p>`;
  }

  const normalized = changes.map(normalizeChangeForDisplay);
  const groups = new Map<
    string,
    { kind: ChangePreviewKind; operation: string; items: DeploymentConfigChange[] }
  >();

  for (const change of normalized) {
    const kind = resolveChangePreviewKind(change);
    const operation = change.operation?.trim() || changePreviewKindLabel(kind);
    const key = `${kind}::${operation}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(change);
    } else {
      groups.set(key, { kind, operation, items: [change] });
    }
  }

  return [...groups.values()]
    .map(({ kind, operation, items }) => {
      const body =
        kind === "delete"
          ? renderChangeDeleteBlock(items)
          : kind === "add"
            ? renderChangeAddBlock(items)
            : renderChangeCompareBlock(items);
      return `
        <section class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${changePreviewKindBadgeClass(kind)}">${escapeHtml(operation)}</span>
          </div>
          ${body}
        </section>`;
    })
    .join('<div class="border-t border-border"></div>');
}

export type ChangePreviewDialogMode = "view" | "confirm";

export interface RenderChangePreviewDialogOptions {
  mode: ChangePreviewDialogMode;
  changes: DeploymentConfigChange[];
  /** 根节点 id，便于关闭定位 */
  dialogId: string;
  title?: string;
  subtitle?: string;
  /** 确认模式主按钮文案 */
  confirmLabel?: string;
  /** 关闭 / 取消按钮 data 属性名 */
  closeAttr?: string;
  backdropAttr?: string;
  confirmAttr?: string;
  zClass?: string;
}

/** 变更对比弹窗壳：view=只读关闭；confirm=取消+确认 */
export function renderChangePreviewDialog(options: RenderChangePreviewDialogOptions): string {
  const {
    mode,
    changes,
    dialogId,
    title = mode === "confirm" ? "确认变更" : "变更记录",
    subtitle =
      mode === "confirm"
        ? "请确认以下配置变更后再保存并下发。"
        : "展示本次下发的配置变更前后对比",
    confirmLabel = "确认下发",
    closeAttr = "data-change-preview-close",
    backdropAttr = "data-change-preview-backdrop",
    confirmAttr = "data-change-preview-confirm",
    zClass = "z-[70]",
  } = options;

  const headerActions =
    mode === "confirm"
      ? `
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              ${closeAttr}
              class="rounded-lg border border-border px-3 py-1.5 text-sm text-card-foreground hover:bg-muted"
            >取消</button>
            <button
              type="button"
              ${confirmAttr}
              class="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >${escapeHtml(confirmLabel)}</button>
          </div>`
      : `
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              ${closeAttr}
              class="rounded-lg border border-border px-3 py-1.5 text-sm text-card-foreground hover:bg-muted"
            >关闭</button>
            <button
              type="button"
              ${closeAttr}
              class="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="关闭"
            >${CHANGE_CLOSE_ICON}</button>
          </div>`;

  return `
    <div
      id="${escapeHtml(dialogId)}"
      class="fixed inset-0 ${zClass} flex items-end justify-center p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${escapeHtml(dialogId)}-title"
      tabindex="-1"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        ${backdropAttr}
        aria-label="关闭"
      ></button>
      <div class="relative z-[1] flex max-h-[min(92dvh,40rem)] w-full max-w-3xl min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-fade-in">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div class="min-w-0">
            <h2 id="${escapeHtml(dialogId)}-title" class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(subtitle)}</p>
          </div>
          ${headerActions}
        </div>
        <div class="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5">
          <h3 class="mb-4 text-sm font-semibold text-card-foreground">变更预览</h3>
          <div class="space-y-5">${renderChangePreviewSections(changes)}</div>
        </div>
      </div>
    </div>`;
}
