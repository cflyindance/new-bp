/**
 * 首次登录 · 业态 / 产线 / 功能确认引导
 */
import { getAuthenticatedEmail } from "../auth/login";
import {
  PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES,
  PLATFORM_PRESET_PRODUCT_LINES,
  businessTypeLabel,
  productLineLabel,
  type ProductLineId,
} from "./platform-preset-catalog";
import { FULL_SELECTION_BUSINESS_TYPE_ID } from "./platform-preset-recommendations";
import { applyPlatformPresetContext, clearPlatformPresetContext } from "./platform-preset-context";
import { seedMerchantPresetsFromEnterprise } from "./platform-preset-enterprise-sync";
import {
  countOnboardingConfirmationModules,
  getOnboardingConfirmationSectionsMerged,
  type OnboardingConfirmationSection,
} from "./platform-preset-onboarding-scenarios";
import { readSelectedBusinessTypeId, writeSelectedBusinessTypeId } from "./platform-preset-store";
import { listCustomBusinessTypes } from "./enterprise-platform-preset-store";
import { getFirstAllowedNavPath } from "./platform-preset-nav-filter";
import { isMvpProductVersion } from "./product-version";

export const ONBOARDING_PATH = "/onboarding";

const DEFAULT_ONBOARDING_BUSINESS_TYPE_ID = FULL_SELECTION_BUSINESS_TYPE_ID;
const DEFAULT_ONBOARDING_PRODUCT_LINE_ID = "pos" satisfies ProductLineId;

function defaultOnboardingDraft(): OnboardingDraft {
  return {
    step: 1,
    businessTypeIds: [DEFAULT_ONBOARDING_BUSINESS_TYPE_ID],
    productLineIds: [DEFAULT_ONBOARDING_PRODUCT_LINE_ID],
  };
}

const COMPLETE_BY_EMAIL_KEY = "menusifu:platform-preset-onboarding-complete-v1";
const DRAFT_KEY = "menusifu:platform-preset-onboarding-draft-v1";

export interface OnboardingDraft {
  step: 1 | 2 | 3;
  businessTypeIds: string[];
  productLineIds: ProductLineId[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toggleArrayItem<T>(arr: T[], item: T): T[] {
  const idx = arr.indexOf(item);
  if (idx >= 0) {
    if (arr.length <= 1) return arr;
    return arr.filter((_, i) => i !== idx);
  }
  return [...arr, item];
}

function normalizeOnboardingDraft(raw: unknown): OnboardingDraft {
  const fallback = defaultOnboardingDraft();
  if (!raw || typeof raw !== "object") return fallback;

  const r = raw as Partial<
    OnboardingDraft & { businessTypeId?: string; productLineId?: ProductLineId }
  >;

  const step = r.step === 2 || r.step === 3 ? r.step : 1;

  if (Array.isArray(r.businessTypeIds) && Array.isArray(r.productLineIds)) {
    return {
      step,
      businessTypeIds: r.businessTypeIds.length ? r.businessTypeIds : fallback.businessTypeIds,
      productLineIds: r.productLineIds.length ? r.productLineIds : fallback.productLineIds,
    };
  }

  return {
    step,
    businessTypeIds: r.businessTypeId ? [r.businessTypeId] : fallback.businessTypeIds,
    productLineIds: r.productLineId ? [r.productLineId] : fallback.productLineIds,
  };
}

function formatBusinessTypeLabels(ids: string[]): string {
  const custom = listCustomBusinessTypes();
  return ids
    .map((id) => businessTypeLabel(id, custom.find((c) => c.id === id)?.label))
    .join("、");
}

function formatProductLineLabels(ids: ProductLineId[]): string {
  return ids.map((id) => productLineLabel(id)).join("、");
}

function readCompleteMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COMPLETE_BY_EMAIL_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeCompleteMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(COMPLETE_BY_EMAIL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function isPlatformPresetOnboardingComplete(email: string | null = getAuthenticatedEmail()): boolean {
  if (!email) return false;
  return Boolean(readCompleteMap()[email.trim().toLowerCase()]);
}

export function markPlatformPresetOnboardingComplete(email: string | null = getAuthenticatedEmail()): void {
  if (!email) return;
  const map = readCompleteMap();
  map[email.trim().toLowerCase()] = new Date().toISOString();
  writeCompleteMap(map);
  clearOnboardingDraft();
}

/** 演示：清除引导完成状态（便于重复体验） */
export function resetPlatformPresetOnboarding(email: string | null = getAuthenticatedEmail()): void {
  if (!email) return;
  const map = readCompleteMap();
  delete map[email.trim().toLowerCase()];
  writeCompleteMap(map);
  clearOnboardingDraft();
}

/** 从步骤 ① 经营业态重新开始引导（顶栏「重新引导」） */
export function restartPlatformPresetOnboardingFromStart(): void {
  resetPlatformPresetOnboarding();
  clearPlatformPresetContext();
  writeSelectedBusinessTypeId(DEFAULT_ONBOARDING_BUSINESS_TYPE_ID);
  writeOnboardingDraft(defaultOnboardingDraft());
}

/** MVP：跳过首次登录引导，直接应用默认业态×产线（全功能/不确定 + POS） */
export function ensureMvpDefaultPlatformPresetOnboardingSkipped(): void {
  if (!isMvpProductVersion()) return;
  const email = getAuthenticatedEmail();
  if (!email || isPlatformPresetOnboardingComplete(email)) return;
  const draft = defaultOnboardingDraft();
  seedMerchantPresetsFromEnterprise(draft.businessTypeIds, draft.productLineIds);
  applyPlatformPresetContext(draft.businessTypeIds, draft.productLineIds);
  if (draft.businessTypeIds[0]) {
    writeSelectedBusinessTypeId(draft.businessTypeIds[0]);
  }
  markPlatformPresetOnboardingComplete(email);
}

export function needsPlatformPresetOnboarding(): boolean {
  if (isMvpProductVersion()) {
    ensureMvpDefaultPlatformPresetOnboardingSkipped();
    return false;
  }
  return isAuthenticatedOnboardingCheck();
}

function isAuthenticatedOnboardingCheck(): boolean {
  const email = getAuthenticatedEmail();
  return Boolean(email) && !isPlatformPresetOnboardingComplete(email);
}

function readOnboardingDraft(): OnboardingDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return normalizeOnboardingDraft(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return normalizeOnboardingDraft(null);
}

function writeOnboardingDraft(draft: OnboardingDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function clearOnboardingDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function isPlatformPresetOnboardingPath(path: string): boolean {
  return path === ONBOARDING_PATH || path.startsWith(`${ONBOARDING_PATH}/`);
}

function renderOnboardingBusinessTypeButton(id: string, label: string, selected: boolean): string {
  return `
    <button type="button" data-ob-bt="${escapeHtml(id)}" aria-pressed="${selected ? "true" : "false"}"
      class="flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50"}">
      <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"}">
        ${selected ? `<svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ""}
      </span>
      <span>${escapeHtml(label)}</span>
    </button>`;
}

function renderOnboardingBusinessTypeSections(selectedIds: string[]): string {
  const serviceCards = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter((b) => b.category === "service-mode")
    .map((b) => renderOnboardingBusinessTypeButton(b.id, b.label, selectedIds.includes(b.id)))
    .join("");

  const categoryCards = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter((b) => b.category === "category")
    .map((b) => renderOnboardingBusinessTypeButton(b.id, b.label, selectedIds.includes(b.id)))
    .join("");

  const customTypes = listCustomBusinessTypes();
  const customSection =
    customTypes.length > 0
      ? `<div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">自定义业态</p>
          <div class="grid gap-2 sm:grid-cols-2">${customTypes
            .map((c) => renderOnboardingBusinessTypeButton(c.id, c.label, selectedIds.includes(c.id)))
            .join("")}</div>
        </div>`
      : "";

  return `
    <p class="mb-4 text-sm text-muted-foreground">可多选，至少选择 1 项</p>
    <div class="space-y-5">
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">按服务方式</p>
        <div class="grid gap-2 sm:grid-cols-2">${serviceCards}</div>
      </div>
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">按品类</p>
        <div class="grid gap-2 sm:grid-cols-2">${categoryCards}</div>
      </div>
      ${customSection}
    </div>`;
}

function renderOnboardingProductLineButton(id: ProductLineId, label: string, selected: boolean): string {
  return `
    <button type="button" data-ob-pl="${escapeHtml(id)}" aria-pressed="${selected ? "true" : "false"}"
      class="flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50"}">
      <span class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-background"}">
        ${selected ? `<svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ""}
      </span>
      <span>
        <span class="font-medium">${escapeHtml(label)}</span>
        <span class="mt-0.5 block font-mono text-xs text-muted-foreground">${escapeHtml(id)}</span>
      </span>
    </button>`;
}

function renderOnboardingConfirmationSectionsHtml(sections: OnboardingConfirmationSection[]): string {
  const total = countOnboardingConfirmationModules(sections);

  if (total === 0) {
    return `<p class="text-sm text-muted-foreground">当前组合暂无可用的一级功能模块。</p>`;
  }

  return `
    <div class="space-y-8">
      ${sections
        .map(
          (section) => `
        <section>
          <div class="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-card-foreground sm:text-lg">${escapeHtml(section.group.label)}</h3>
              <p class="mt-1 text-sm text-muted-foreground">${escapeHtml(section.group.hint)}</p>
            </div>
            <span class="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">${section.modules.length} 项</span>
          </div>
          <ul class="grid gap-2 sm:grid-cols-2" role="list">
            ${section.modules
              .map(
                (mod) =>
                  `<li class="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-card-foreground">${escapeHtml(mod.title)}</li>`,
              )
              .join("")}
          </ul>
        </section>`,
        )
        .join("")}
    </div>`;
}

export function renderPlatformPresetOnboardingPage(): string {
  const draft = readOnboardingDraft();
  const btLabels = formatBusinessTypeLabels(draft.businessTypeIds);
  const plLabels = formatProductLineLabels(draft.productLineIds);
  const comboCount = draft.businessTypeIds.length * draft.productLineIds.length;
  const confirmationSections = getOnboardingConfirmationSectionsMerged(
    draft.businessTypeIds,
    draft.productLineIds,
  );
  const moduleTotal = countOnboardingConfirmationModules(confirmationSections);

  const step1 = draft.step === 1;
  const step2 = draft.step === 2;
  const step3 = draft.step === 3;

  const canNextStep1 = draft.businessTypeIds.length >= 1;
  const canNextStep2 = draft.productLineIds.length >= 1;

  const lineCards = PLATFORM_PRESET_PRODUCT_LINES.map((l) =>
    renderOnboardingProductLineButton(l.id, l.label, draft.productLineIds.includes(l.id)),
  ).join("");

  const moduleList = renderOnboardingConfirmationSectionsHtml(confirmationSections);

  const stepContent = step1
    ? `<div>
        <h2 class="text-base font-semibold text-card-foreground">请选择经营业态</h2>
        <div class="mt-4">${renderOnboardingBusinessTypeSections(draft.businessTypeIds)}</div>
      </div>`
    : step2
      ? `<div>
        <h2 class="text-base font-semibold text-card-foreground">请选择产线</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          已选业态（${draft.businessTypeIds.length}）：<strong class="text-card-foreground">${escapeHtml(btLabels)}</strong>
        </p>
        <div class="mt-4">
          <p class="mb-3 text-sm text-muted-foreground">可多选，至少选择 1 项</p>
          <div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3">${lineCards}</div>
        </div>
      </div>`
      : `<div>
        <h2 class="text-base font-semibold text-card-foreground">功能确认</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          将应用 <strong class="text-card-foreground">${escapeHtml(btLabels)}</strong> ·
          <strong class="text-card-foreground">${escapeHtml(plLabels)}</strong>
          <span class="text-muted-foreground">（${comboCount} 组预设并集）</span>
        </p>
        <p class="mt-3 text-sm font-medium text-card-foreground">
          将进入系统的一级功能模块
          ${moduleTotal > 0 ? `<span class="font-normal text-muted-foreground">（共 ${moduleTotal} 项，按业务场景分组）</span>` : ""}：
        </p>
        <div class="mt-3">${moduleList}</div>
      </div>`;

  const backBtn = `<button type="button" data-ob-back class="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted">上一步</button>`;
  const nextDisabledClass = "cursor-not-allowed opacity-50";
  const nextBtnStep1 = `<button type="button" data-ob-next ${canNextStep1 ? "" : "disabled"} class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground ${canNextStep1 ? "" : nextDisabledClass}">下一步</button>`;
  const nextBtnStep2 = `<button type="button" data-ob-next ${canNextStep2 ? "" : "disabled"} class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground ${canNextStep2 ? "" : nextDisabledClass}">下一步</button>`;
  const finishBtn = `<button type="button" data-ob-finish class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">进入系统</button>`;

  const footerActions = step1
    ? `<div class="flex justify-end">${nextBtnStep1}</div>`
    : step2
      ? `<div class="flex justify-between gap-2">${backBtn}${nextBtnStep2}</div>`
      : `<div class="flex justify-between gap-2">${backBtn}${finishBtn}</div>`;

  return `
    <div class="flex h-dvh w-full flex-col overflow-hidden bg-background" data-onboarding-root data-step="${draft.step}">
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div class="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 animate-fade-in">
          <div class="text-center">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">首次登录引导</p>
            <h1 class="mt-2 text-2xl font-semibold text-card-foreground">选择业态与产线</h1>
            <p class="mt-2 text-sm text-muted-foreground">完成后侧栏与设置页将按平台预设展示（步骤 ${draft.step}/3）</p>
          </div>
          <ol class="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <li class="${step1 ? "font-semibold text-primary" : ""}">① 经营业态</li>
            <li aria-hidden="true">→</li>
            <li class="${step2 ? "font-semibold text-primary" : ""}">② 产线</li>
            <li aria-hidden="true">→</li>
            <li class="${step3 ? "font-semibold text-primary" : ""}">③ 功能确认</li>
          </ol>
          <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
            ${stepContent}
          </div>
        </div>
      </div>
      <footer class="shrink-0 border-t border-border bg-card/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div class="mx-auto w-full max-w-3xl">
          ${footerActions}
        </div>
      </footer>
    </div>`;
}

export function bindPlatformPresetOnboarding(onMount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-onboarding-root]");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  root.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    let draft = readOnboardingDraft();

    const btBtn = target.closest<HTMLElement>("[data-ob-bt]");
    if (btBtn) {
      const id = btBtn.dataset.obBt!;
      draft.businessTypeIds = toggleArrayItem(draft.businessTypeIds, id);
      if (draft.businessTypeIds.length) {
        writeSelectedBusinessTypeId(draft.businessTypeIds[0]!);
      }
      writeOnboardingDraft(draft);
      onMount();
      return;
    }

    const plBtn = target.closest<HTMLElement>("[data-ob-pl]");
    if (plBtn) {
      const id = plBtn.dataset.obPl! as ProductLineId;
      draft.productLineIds = toggleArrayItem(draft.productLineIds, id);
      writeOnboardingDraft(draft);
      onMount();
      return;
    }

    if (target.closest("[data-ob-back]")) {
      draft.step = draft.step === 3 ? 2 : 1;
      writeOnboardingDraft(draft);
      onMount();
      return;
    }

    if (target.closest("[data-ob-next]")) {
      if (draft.step === 1) {
        if (draft.businessTypeIds.length < 1) return;
        draft.step = 2;
      } else if (draft.step === 2) {
        if (draft.productLineIds.length < 1) return;
        draft.step = 3;
      }
      writeOnboardingDraft(draft);
      onMount();
      return;
    }

    if (target.closest("[data-ob-finish]")) {
      seedMerchantPresetsFromEnterprise(draft.businessTypeIds, draft.productLineIds);
      applyPlatformPresetContext(draft.businessTypeIds, draft.productLineIds);
      if (draft.businessTypeIds[0]) {
        writeSelectedBusinessTypeId(draft.businessTypeIds[0]);
      }
      markPlatformPresetOnboardingComplete();
      location.hash = `#${getFirstAllowedNavPath()}`;
      onMount();
    }
  });
}

export function mountPlatformPresetOnboardingShell(onMount: () => void): void {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = renderPlatformPresetOnboardingPage();
  bindPlatformPresetOnboarding(onMount);
}
