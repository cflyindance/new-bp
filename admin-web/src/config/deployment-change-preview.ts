import { formatIntervalDuration } from "./interval-display";
import { MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES } from "./menu-order-limit-product-lines";
import "./deployment-change-preview.css";
/**
 * 配置变更前后对比预览（下发记录 / 保存并下发确认共用）
 */
import {
  buildChangeDetailRows,
  getSettingTitleBySeq,
} from "./deployment-change-buffer";
import { resolveOriginNavFromPath } from "./deployment-config-domains";
import type {
  ChangeDetailRow,
  DeploymentConfigChange,
  EntityChangeBlock,
  EntityChangeOp,
} from "./deployment-types";
import {
  formatAutoLogoutByLineForDeployment,
  formatMaxGuestsByLineForDeployment,
  formatStoreClosingAlertByLineForDeployment,
  resolveChangeGroupPath,
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

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function splitLabeledLines(text: string): ChangeDetailRow[] | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 1) return null;
  const rows: ChangeDetailRow[] = [];
  for (const line of lines) {
    const idx = line.indexOf("：");
    if (idx <= 0) return null;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!label) return null;
    rows.push({ key: label, label, before: value, after: value });
  }
  return rows.length > 0 ? rows : null;
}

function mergeLabeledLineDetails(beforeText: string, afterText: string): ChangeDetailRow[] | null {
  const beforeRows = splitLabeledLines(beforeText);
  const afterRows = splitLabeledLines(afterText);
  if (!beforeRows && !afterRows) return null;
  const map = new Map<string, ChangeDetailRow>();
  for (const row of beforeRows ?? []) {
    map.set(row.key, { ...row, after: "—" });
  }
  for (const row of afterRows ?? []) {
    const prev = map.get(row.key);
    if (prev) {
      map.set(row.key, { ...prev, after: row.after });
    } else {
      map.set(row.key, { ...row, before: "—" });
    }
  }
  return [...map.values()].filter((row) => row.before !== row.after);
}

/** 旧历史回退：无 details 时尽量拆成结构化行 */
export function resolveChangeDetails(change: DeploymentConfigChange): ChangeDetailRow[] {
  if (change.details?.length) {
    return change.details.filter((row) => row.before !== row.after);
  }

  if (isClosingAlertChange(change)) {
    const before =
      formatStoreClosingAlertByLineForDeployment(change.before) ?? change.before;
    const after = formatStoreClosingAlertByLineForDeployment(change.after) ?? change.after;
    const labeled = mergeLabeledLineDetails(before, after);
    if (labeled?.length) return labeled;
  }
  if (isAutoLogoutByLineChange(change)) {
    const before = formatAutoLogoutByLineForDeployment(change.before) ?? change.before;
    const after = formatAutoLogoutByLineForDeployment(change.after) ?? change.after;
    const labeled = mergeLabeledLineDetails(before, after);
    if (labeled?.length) return labeled;
  }
  if (isMaxGuestsByLineChange(change)) {
    const before = formatMaxGuestsByLineForDeployment(change.before) ?? change.before;
    const after = formatMaxGuestsByLineForDeployment(change.after) ?? change.after;
    const labeled = mergeLabeledLineDetails(before, after);
    if (labeled?.length) return labeled;
  }

  const labeled = mergeLabeledLineDetails(change.before, change.after);
  if (labeled?.length) return labeled;

  const beforeObj = tryParseJsonObject(change.before);
  const afterObj = tryParseJsonObject(change.after);
  if (beforeObj || afterObj) {
    return buildChangeDetailRows(beforeObj ?? change.before, afterObj ?? change.after, {
      rootLabel: "配置值",
      rootKey: change.fieldKey ?? "value",
    });
  }

  if (change.before !== change.after) {
    return [
      {
        key: change.fieldKey ?? "value",
        label: "配置值",
        before: change.before || "—",
        after: change.after || "—",
      },
    ];
  }
  return [];
}

export function normalizeChangeForDisplay(change: DeploymentConfigChange): DeploymentConfigChange {
  if (change.details?.length) return change;

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

function isBlankChangeValue(value: string | undefined): boolean {
  const trimmed = (value ?? "").trim();
  return !trimmed || trimmed === "—" || trimmed === "-";
}

type ChangePreviewKind = "add" | "edit" | "delete";

function resolveChangePreviewKind(change: DeploymentConfigChange, details: ChangeDetailRow[]): ChangePreviewKind {
  if (details.length > 0) {
    const allAdd = details.every((d) => isBlankChangeValue(d.before) && !isBlankChangeValue(d.after));
    const allDelete = details.every((d) => !isBlankChangeValue(d.before) && isBlankChangeValue(d.after));
    if (allAdd) return "add";
    if (allDelete) return "delete";
    return "edit";
  }
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



export const CHANGE_CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

function resolveGroupPathForChange(change: DeploymentConfigChange): string[] {
  if (change.groupPath?.length) return change.groupPath.filter(Boolean);
  const fromPath = resolveChangeGroupPath(change.settingsPath);
  if (fromPath?.length) return fromPath;
  if (change.settingsPath) {
    const nav = resolveOriginNavFromPath(change.settingsPath);
    const parts = [nav.l1Title, nav.l2Title].filter(
      (part, index, arr) => Boolean(part) && arr.indexOf(part) === index,
    );
    if (parts.length) return parts;
  }
  return ["其他变更"];
}

function renderDetailRows(details: ChangeDetailRow[]): string {
  return `<div class="change-compare-scroll"><table class="change-compare-table"><thead><tr><th scope="col">配置项</th><th scope="col">修改前</th><th scope="col">修改后</th></tr></thead><tbody>${details.map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th><td class="change-compare-before">${escapeHtml(row.before || "—")}</td><td class="change-compare-after">${escapeHtml(row.after || "—")}</td></tr>`).join("")}</tbody></table></div>`;
}

function entityOpToPreviewKind(op: EntityChangeOp): ChangePreviewKind {
  if (op === "create") return "add";
  if (op === "delete") return "delete";
  return "edit";
}

function renderEntityBlocks(entities: EntityChangeBlock[]): string {
  return entities
    .map((block) => {
      const kind = entityOpToPreviewKind(block.operation);
      const fieldsAsDetails: ChangeDetailRow[] = block.fields.map((f) => ({
        key: f.key,
        label: f.label,
        before: f.before,
        after: f.after,
      }));
      const body =
        fieldsAsDetails.length > 0
          ? `<div class="mt-2 space-y-0">${renderDetailRows(fieldsAsDetails)}</div>`
          : `<p class="mt-2 m-0 text-xs text-muted-foreground">${escapeHtml(changePreviewKindLabel(kind))}该实体</p>`;
      return `
        <div class="rounded-md border border-border/70 bg-muted/20 p-2.5 sm:p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-card-foreground">${escapeHtml(block.entityLabel)}</span>
            <span class="inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${changePreviewKindBadgeClass(kind)}">${escapeHtml(changePreviewKindLabel(kind))}</span>
          </div>
          ${body}
        </div>`;
    })
    .join("");
}

function renderCollectionChangeCard(change: DeploymentConfigChange): string {
  const entities = (change.entities ?? []).filter(
    (block) =>
      block.operation === "create" ||
      block.operation === "delete" ||
      block.fields.some((f) => f.before !== f.after),
  );
  if (entities.length === 0) return "";

  const badge = change.operation?.trim() || summarizeEntityOpsBadge(entities);

  return `
    <article class="rounded-lg border border-border bg-card p-3 sm:p-3.5">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <h4 class="m-0 text-sm font-semibold text-card-foreground">${escapeHtml(change.label)}</h4>
        <span class="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400">${escapeHtml(badge)}</span>
      </div>
      <div class="max-h-[min(28rem,50vh)] space-y-2 overflow-auto pr-0.5">${renderEntityBlocks(entities)}</div>
    </article>`;
}

function summarizeEntityOpsBadge(entities: EntityChangeBlock[]): string {
  let create = 0;
  let update = 0;
  let remove = 0;
  for (const block of entities) {
    if (block.operation === "create") create += 1;
    else if (block.operation === "delete") remove += 1;
    else update += 1;
  }
  const parts: string[] = [];
  if (create) parts.push(`新增 ${create}`);
  if (update) parts.push(`修改 ${update}`);
  if (remove) parts.push(`删除 ${remove}`);
  return parts.join(" · ") || "修改";
}

/** Presentation only: never rewrite stored change records or their dedupe keys. */
function compactConfirmationChange(change: DeploymentConfigChange): DeploymentConfigChange {
  const parts = change.label.split(" · ").filter(part => part !== "按产线配置");
  if (parts[0] === "订单间隔" && parts[1] === "订单下单时间间隔") parts.shift();
  if (parts[0] === "商品间隔" && parts[1] === "菜品下单时间间隔") parts.splice(0, 2, "商品下单间隔");
  const label = [...new Set(parts)].join(" · ");
  const lineLabels = new Map<string, string>(MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES.map(line => [line.id, line.label]));
  const details = change.details?.map(row => {
    const isOrderDuration = change.fieldKey === "588-order-place-interval-by-line" && /(^|\.)seconds$/.test(row.key);
    const segments = row.label.split(" · ").filter(part => part !== "按产线配置");
    const rowLabel = segments.map(part => lineLabels.get(part) ?? part).join(" · ");
    const duration = (value: string) => /^\d+$/.test(value.trim()) && Number.isSafeInteger(Number(value)) ? formatIntervalDuration(Number(value)) : value;
    return { ...row, label: isOrderDuration ? rowLabel.replace(/（秒）|\(秒\)/g, "") : rowLabel, before: isOrderDuration ? duration(row.before) : row.before, after: isOrderDuration ? duration(row.after) : row.after };
  });
  return { ...change, label, details };
}

function renderSettingChangeCard(change: DeploymentConfigChange, compact = false): string {
  if (compact) change = compactConfirmationChange(change);
  if (change.entities?.length) {
    return renderCollectionChangeCard(change);
  }

  const normalized = normalizeChangeForDisplay(change);
  const details = resolveChangeDetails(normalized);
  if (details.length === 0) return "";

  const kind = resolveChangePreviewKind(normalized, details);
  const badge = change.operation?.trim() || changePreviewKindLabel(kind);
  const showBadge = !compact || kind !== "edit" || !["修改", "修改配置", "修改数值"].includes(badge);

  return `
    <article class="rounded-lg border border-border bg-card p-3 sm:p-3.5">
      <div class="mb-2 flex flex-wrap items-center gap-2">
        <h4 class="m-0 text-sm font-semibold text-card-foreground">${escapeHtml(normalized.label)}</h4>
        ${showBadge ? `<span class="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${changePreviewKindBadgeClass(kind)}">${escapeHtml(badge)}</span>` : ""}
      </div>
      <div class="space-y-0">${renderDetailRows(details)}</div>
    </article>`;
}

/** 变更预览主体：按导航分组 + 设置项逐行对比 */
export function renderChangePreviewSections(changes: DeploymentConfigChange[], compact = false): string {
  if (changes.length === 0) {
    return `<p class="m-0 py-8 text-center text-sm text-muted-foreground">暂无变更明细</p>`;
  }

  const groups = new Map<string, { title: string; items: DeploymentConfigChange[] }>();
  for (const change of changes) {
    const path = resolveGroupPathForChange(change);
    const title = path.join(" / ");
    const existing = groups.get(title);
    if (existing) existing.items.push(change);
    else groups.set(title, { title, items: [change] });
  }

  const sections = [...groups.values()]
    .map(({ title, items }) => {
      const cards = items.map(change => renderSettingChangeCard(change, compact)).filter(Boolean).join("");
      if (!cards) return "";
      return `
        <section class="space-y-3">
          ${compact && groups.size === 1 ? "" : `<h3 class="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">${escapeHtml(title)}</h3>`}
          <div class="space-y-3">${cards}</div>
        </section>`;
    })
    .filter(Boolean);

  if (sections.length === 0) {
    return `<p class="m-0 py-8 text-center text-sm text-muted-foreground">暂无变更明细</p>`;
  }

  return sections.join('<div class="border-t border-border my-1"></div>');
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
        ? "确认后将保存并下发以下配置。"
        : "展示本次下发的配置变更前后对比",
    confirmLabel = "确认下发",
    closeAttr = "data-change-preview-close",
    backdropAttr = "data-change-preview-backdrop",
    confirmAttr = "data-change-preview-confirm",
    zClass = "z-[70]",
  } = options;

  const headerActions = mode === "confirm"
    ? `<button type="button" ${confirmAttr} class="change-preview-primary">${escapeHtml(confirmLabel)}</button>`
    : `<button type="button" ${closeAttr} class="change-preview-primary">关闭</button>`;

  return `<div id="${escapeHtml(dialogId)}" class="change-preview-overlay fixed inset-0 ${zClass}" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(dialogId)}-title" aria-describedby="${escapeHtml(dialogId)}-description" tabindex="-1">
    <button type="button" class="change-preview-backdrop" ${backdropAttr} aria-label="关闭" tabindex="-1"></button>
    <section class="change-preview-surface">
      <header class="change-preview-header">
        <button type="button" ${closeAttr} class="change-preview-close" aria-label="${mode === "confirm" ? "取消变更确认" : "关闭变更明细"}">${CHANGE_CLOSE_ICON}</button>
        <div class="change-preview-heading"><h2 id="${escapeHtml(dialogId)}-title">${escapeHtml(title)}</h2><p id="${escapeHtml(dialogId)}-description">${escapeHtml(subtitle)}</p></div>
        ${headerActions}
      </header>
      <div class="change-preview-body">${renderChangePreviewSections(changes, mode === "confirm")}</div>
    </section>
  </div>`;
}
