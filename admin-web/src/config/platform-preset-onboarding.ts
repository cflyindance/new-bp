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
import { applyPlatformPresetContext, clearPlatformPresetContext } from "./platform-preset-context";
import {
  countOnboardingConfirmationModules,
  getOnboardingConfirmationSections,
} from "./platform-preset-onboarding-scenarios";
import {
  getPublishedSnapshot,
  listCustomBusinessTypes,
  readSelectedBusinessTypeId,
  writeSelectedBusinessTypeId,
} from "./platform-preset-store";
import { getFirstAllowedNavPath } from "./platform-preset-nav-filter";

export const ONBOARDING_PATH = "/onboarding";

const COMPLETE_BY_EMAIL_KEY = "menusifu:platform-preset-onboarding-complete-v1";
const DRAFT_KEY = "menusifu:platform-preset-onboarding-draft-v1";

export interface OnboardingDraft {
  step: 1 | 2 | 3;
  businessTypeId: string;
  productLineId: ProductLineId;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  writeOnboardingDraft({
    step: 1,
    businessTypeId: readSelectedBusinessTypeId(),
    productLineId: "pos",
  });
}

export function needsPlatformPresetOnboarding(): boolean {
  return isAuthenticatedOnboardingCheck();
}

function isAuthenticatedOnboardingCheck(): boolean {
  const email = getAuthenticatedEmail();
  return Boolean(email) && !isPlatformPresetOnboardingComplete(email);
}

function readOnboardingDraft(): OnboardingDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as OnboardingDraft;
  } catch {
    /* ignore */
  }
  return {
    step: 1,
    businessTypeId: readSelectedBusinessTypeId(),
    productLineId: "pos",
  };
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
    <button type="button" data-ob-bt="${escapeHtml(id)}"
      class="rounded-xl border px-4 py-3 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50"}">
      ${escapeHtml(label)}
    </button>`;
}

function renderOnboardingBusinessTypeSections(selectedId: string): string {
  const serviceCards = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter((b) => b.category === "service-mode")
    .map((b) => renderOnboardingBusinessTypeButton(b.id, b.label, selectedId === b.id))
    .join("");

  const categoryCards = PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.filter((b) => b.category === "category")
    .map((b) => renderOnboardingBusinessTypeButton(b.id, b.label, selectedId === b.id))
    .join("");

  const customTypes = listCustomBusinessTypes();
  const customSection =
    customTypes.length > 0
      ? `<div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">自定义业态</p>
          <div class="grid gap-2 sm:grid-cols-2">${customTypes
            .map((c) => renderOnboardingBusinessTypeButton(c.id, c.label, selectedId === c.id))
            .join("")}</div>
        </div>`
      : "";

  return `
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

function renderOnboardingConfirmationSections(
  businessTypeId: string,
  productLineId: ProductLineId,
): string {
  const sections = getOnboardingConfirmationSections(businessTypeId, productLineId);
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

function presetSourceLabel(businessTypeId: string, productLineId: ProductLineId): string {
  const published = getPublishedSnapshot(businessTypeId, productLineId);
  return published ? `平台预设 v${published.version}` : "系统默认预设";
}

export function renderPlatformPresetOnboardingPage(): string {
  const draft = readOnboardingDraft();
  const btLabel = businessTypeLabel(
    draft.businessTypeId,
    listCustomBusinessTypes().find((c) => c.id === draft.businessTypeId)?.label,
  );
  const plLabel = productLineLabel(draft.productLineId);
  const presetSource = presetSourceLabel(draft.businessTypeId, draft.productLineId);
  const confirmationSections = getOnboardingConfirmationSections(draft.businessTypeId, draft.productLineId);
  const moduleTotal = countOnboardingConfirmationModules(confirmationSections);

  const step1 = draft.step === 1;
  const step2 = draft.step === 2;
  const step3 = draft.step === 3;

  const lineCards = PLATFORM_PRESET_PRODUCT_LINES.map(
    (l) => `
    <button type="button" data-ob-pl="${escapeHtml(l.id)}"
      class="rounded-xl border px-4 py-3 text-left text-sm transition-colors ${draft.productLineId === l.id ? "border-primary bg-primary/10 font-medium text-primary" : "border-border hover:bg-muted/50"}">
      <span class="font-medium">${escapeHtml(l.label)}</span>
      <span class="mt-0.5 block font-mono text-xs text-muted-foreground">${escapeHtml(l.id)}</span>
    </button>`,
  ).join("");

  const moduleList = renderOnboardingConfirmationSections(draft.businessTypeId, draft.productLineId);

  const stepContent = step1
    ? `<div>
        <h2 class="text-base font-semibold text-card-foreground">请选择经营业态</h2>
        <div class="mt-4">${renderOnboardingBusinessTypeSections(draft.businessTypeId)}</div>
      </div>`
    : step2
      ? `<div>
        <h2 class="text-base font-semibold text-card-foreground">请选择产线</h2>
        <p class="mt-1 text-sm text-muted-foreground">业态：<strong class="text-card-foreground">${escapeHtml(btLabel)}</strong></p>
        <div class="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">${lineCards}</div>
      </div>`
      : `<div>
        <h2 class="text-base font-semibold text-card-foreground">功能确认</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          将应用 <strong class="text-card-foreground">${escapeHtml(btLabel)}</strong> ·
          <strong class="text-card-foreground">${escapeHtml(plLabel)}</strong>
          （${escapeHtml(presetSource)}）
        </p>
        <p class="mt-3 text-sm font-medium text-card-foreground">
          将进入系统的一级功能模块
          ${moduleTotal > 0 ? `<span class="font-normal text-muted-foreground">（共 ${moduleTotal} 项，按业务场景分组）</span>` : ""}：
        </p>
        <div class="mt-3">${moduleList}</div>
      </div>`;

  const backBtn = `<button type="button" data-ob-back class="rounded-lg border border-border px-5 py-2.5 text-sm hover:bg-muted">上一步</button>`;
  const nextBtn = `<button type="button" data-ob-next class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">下一步</button>`;
  const finishBtn = `<button type="button" data-ob-finish class="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">进入系统</button>`;

  const footerActions = step1
    ? `<div class="flex justify-end">${nextBtn}</div>`
    : step2
      ? `<div class="flex justify-between gap-2">${backBtn}${nextBtn}</div>`
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
      draft.businessTypeId = btBtn.dataset.obBt!;
      writeSelectedBusinessTypeId(draft.businessTypeId);
      writeOnboardingDraft(draft);
      onMount();
      return;
    }

    const plBtn = target.closest<HTMLElement>("[data-ob-pl]");
    if (plBtn) {
      draft.productLineId = plBtn.dataset.obPl! as ProductLineId;
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
      if (draft.step === 1) draft.step = 2;
      else if (draft.step === 2) draft.step = 3;
      writeOnboardingDraft(draft);
      onMount();
      return;
    }

    if (target.closest("[data-ob-finish]")) {
      applyPlatformPresetContext(draft.businessTypeId, draft.productLineId);
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
