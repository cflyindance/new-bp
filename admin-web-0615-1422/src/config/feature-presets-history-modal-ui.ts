/**
 * 平台预设 — 变更记录弹框
 */
import { t, tf } from "../i18n";
import { fetchPresetAuditLog, type PresetAuditEntry } from "./feature-presets-audit";
import type { PresetOverrideChangeSet } from "./feature-presets-audit-diff";
import {
  getL1ModuleLabel,
  getL2FeatureLabel,
  getL3FeatureLabel,
  pickPresetTitle,
} from "./feature-presets-labels";
import type { PresetSettingConfig } from "./feature-presets-setting-config";
import { formatVariantSettingBrief } from "./feature-presets-variant-summary";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSettingBrief(config?: PresetSettingConfig): string {
  if (!config) return "—";
  const raw = formatVariantSettingBrief(config);
  if (raw === "开启") return t("featurePresets.settingOn");
  if (raw === "关闭") return t("featurePresets.settingOff");
  if (raw === "已预设") return t("featurePresets.detailSettingPreset");
  return raw;
}

function actionLabel(action: PresetAuditEntry["action"]): string {
  if (action === "preset.variant.override") return t("featurePresets.auditActionOverride");
  if (action === "preset.business_type.create") return t("featurePresets.auditActionBtCreate");
  if (action === "preset.business_type.update") return t("featurePresets.auditActionBtUpdate");
  if (action === "preset.business_type.delete") return t("featurePresets.auditActionBtDelete");
  return action;
}

function renderChangeChip(kind: "add" | "remove" | "change", text: string): string {
  const cls =
    kind === "add"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      : kind === "remove"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
        : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200";
  const prefix = kind === "add" ? "+" : kind === "remove" ? "−" : "~";
  return `<span class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${cls}"><span class="font-mono text-[10px]">${prefix}</span><span>${escapeHtml(text)}</span></span>`;
}

function renderChangeGroup(title: string, chips: string): string {
  if (!chips) return "";
  return `
    <div class="space-y-1.5">
      <p class="text-[11px] font-medium text-muted-foreground">${escapeHtml(title)}</p>
      <div class="flex flex-wrap gap-1.5">${chips}</div>
    </div>`;
}

function renderChanges(changes?: PresetOverrideChangeSet): string {
  if (!changes) return "";
  const parts: string[] = [];

  const l1Add = changes.l1Added.map((id) => renderChangeChip("add", getL1ModuleLabel(id))).join("");
  const l1Rem = changes.l1Removed.map((id) => renderChangeChip("remove", getL1ModuleLabel(id))).join("");
  parts.push(renderChangeGroup(t("featurePresets.auditL1EnableAdd"), l1Add));
  parts.push(renderChangeGroup(t("featurePresets.auditL1EnableRemove"), l1Rem));

  const l2Add = changes.l2Added.map((id) => renderChangeChip("add", getL2FeatureLabel(id))).join("");
  const l2Rem = changes.l2Removed.map((id) => renderChangeChip("remove", getL2FeatureLabel(id))).join("");
  parts.push(renderChangeGroup(t("featurePresets.auditL2ExcludeAdd"), l2Add));
  parts.push(renderChangeGroup(t("featurePresets.auditL2ExcludeRemove"), l2Rem));

  const l3Add = changes.l3Added.map((id) => renderChangeChip("add", getL3FeatureLabel(id))).join("");
  const l3Rem = changes.l3Removed.map((id) => renderChangeChip("remove", getL3FeatureLabel(id))).join("");
  parts.push(renderChangeGroup(t("featurePresets.auditL3ExcludeAdd"), l3Add));
  parts.push(renderChangeGroup(t("featurePresets.auditL3ExcludeRemove"), l3Rem));

  const settingAdd = changes.settingsAdded
    .map((id) => renderChangeChip("add", `${t("featurePresets.auditSetting")} ${getL3FeatureLabel(id)}`))
    .join("");
  const settingRem = changes.settingsRemoved
    .map((id) => renderChangeChip("remove", `${t("featurePresets.auditSetting")} ${getL3FeatureLabel(id)}`))
    .join("");
  parts.push(renderChangeGroup(t("featurePresets.auditSettingAdd"), settingAdd));
  parts.push(renderChangeGroup(t("featurePresets.auditSettingRemove"), settingRem));

  const settingChanged = changes.settingsChanged
    .map((row) =>
      renderChangeChip(
        "change",
        `${getL3FeatureLabel(row.id)}：${formatSettingBrief(row.before)} → ${formatSettingBrief(row.after)}`,
      ),
    )
    .join("");
  parts.push(renderChangeGroup(t("featurePresets.auditSettingChange"), settingChanged));

  const body = parts.filter(Boolean).join("");
  if (!body) {
    return `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.auditNoFieldChanges"))}</p>`;
  }
  return `<div class="space-y-3">${body}</div>`;
}

function renderEntry(entry: PresetAuditEntry): string {
  const meta: string[] = [];
  if (entry.variantId) meta.push(entry.variantId);
  if (entry.version != null) meta.push(`v${entry.version}`);
  if (entry.title) meta.push(entry.title);
  if (entry.cloneFrom) meta.push(tf("featurePresets.auditCloneFrom", { from: entry.cloneFrom }));

  return `
    <li class="relative border-l-2 border-primary/25 pb-6 pl-4 last:pb-0">
      <span class="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary ring-2 ring-card"></span>
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="text-sm font-medium text-foreground">${escapeHtml(actionLabel(entry.action))}</p>
        <time class="text-[11px] text-muted-foreground">${escapeHtml(formatWhen(entry.createdAt))}</time>
      </div>
      <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(tf("featurePresets.auditBy", { actor: entry.actor || "—" }))}</p>
      ${meta.length > 0 ? `<p class="mt-1 font-mono text-[10px] text-muted-foreground">${escapeHtml(meta.join(" · "))}</p>` : ""}
      <div class="mt-3 rounded-lg border border-border/70 bg-muted/20 p-3">${renderChanges(entry.changes)}</div>
    </li>`;
}

function renderEntries(entries: PresetAuditEntry[]): string {
  if (entries.length === 0) {
    return `<p class="py-8 text-center text-sm text-muted-foreground">${escapeHtml(t("featurePresets.auditEmpty"))}</p>`;
  }
  return `<ol class="space-y-0">${entries.map(renderEntry).join("")}</ol>`;
}

export function renderPresetHistoryModalShell(): string {
  return `
    <div
      class="fixed inset-0 z-[10070] hidden items-center justify-center bg-black/40 p-4"
      data-preset-history-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-history-title"
      aria-hidden="true"
    >
      <button type="button" class="absolute inset-0" data-preset-history-backdrop tabindex="-1" aria-label="${escapeHtml(t("featurePresets.detailClose"))}"></button>
      <div class="relative z-10 flex max-h-[min(88vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="preset-history-title" class="text-base font-semibold">${escapeHtml(t("featurePresets.auditTitle"))}</h3>
          <p class="mt-1 text-xs text-muted-foreground" data-preset-history-subtitle></p>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4" data-preset-history-body>
          <p class="text-sm text-muted-foreground">${escapeHtml(t("featurePresets.auditLoading"))}</p>
        </div>
        <div class="border-t border-border px-5 py-3 text-right">
          <button type="button" class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/50" data-preset-history-close>${escapeHtml(t("featurePresets.detailClose"))}</button>
        </div>
      </div>
    </div>`;
}

export interface OpenPresetHistoryOptions {
  variantId?: string;
  businessTypeId?: string;
  subtitle?: string;
}

let modalQuery: OpenPresetHistoryOptions = {};

function setModalOpen(open: boolean): void {
  const modal = document.querySelector<HTMLElement>("[data-preset-history-modal]");
  if (!modal) return;
  modal.classList.toggle("hidden", !open);
  modal.classList.toggle("flex", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
}

async function loadAndRenderHistory(): Promise<void> {
  const body = document.querySelector("[data-preset-history-body]");
  if (!body) return;
  body.innerHTML = `<p class="text-sm text-muted-foreground">${escapeHtml(t("featurePresets.auditLoading"))}</p>`;
  const entries = await fetchPresetAuditLog({
    variantId: modalQuery.variantId,
    businessTypeId: modalQuery.businessTypeId,
    limit: 50,
  });
  body.innerHTML = renderEntries(entries);
}

export async function openPresetHistoryModal(options: OpenPresetHistoryOptions): Promise<void> {
  modalQuery = options;
  const subtitleEl = document.querySelector("[data-preset-history-subtitle]");
  if (subtitleEl) {
    subtitleEl.textContent =
      options.subtitle ??
      (options.variantId
        ? options.variantId
        : options.businessTypeId
          ? options.businessTypeId
          : t("featurePresets.auditAll"));
  }
  setModalOpen(true);
  await loadAndRenderHistory();
}

export function bindPresetHistoryModal(root: ParentNode = document): void {
  const modal = root.querySelector<HTMLElement>("[data-preset-history-modal]");
  if (!modal || modal.dataset.bound === "1") return;
  modal.dataset.bound = "1";

  const close = () => setModalOpen(false);
  modal.querySelector("[data-preset-history-close]")?.addEventListener("click", close);
  modal.querySelector("[data-preset-history-backdrop]")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("flex")) close();
  });
}
