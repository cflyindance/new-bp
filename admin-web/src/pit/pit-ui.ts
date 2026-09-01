import type { PitPriority, PitRequirementStatus, PitRole } from "./pit-types";

export type PitTone = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_PRESENTATION: Record<PitRequirementStatus, { label: string; tone: PitTone; className: string }> = {
  review_pending: { label: "待评审", tone: "warning", className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200" },
  design_pending: { label: "待设计", tone: "info", className: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200" },
  scheduling_pending: { label: "待排期", tone: "info", className: "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200" },
  development: { label: "开发中", tone: "info", className: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200" },
  testing: { label: "测试中", tone: "info", className: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200" },
  completed: { label: "已完成", tone: "success", className: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200" },
  paused: { label: "已暂停", tone: "neutral", className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  rejected: { label: "已拒绝", tone: "danger", className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200" },
};

const PRIORITY_LABELS: Record<PitPriority, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

const TONE_CLASS: Record<PitTone, string> = {
  neutral: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
  danger: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200",
};

export function escapePitHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function pitRoleLabel(role: PitRole): string {
  if (role === "admin") return "管理员";
  if (role === "editor") return "编辑者";
  return "只读者";
}

export function pitStatusPresentation(status: PitRequirementStatus): (typeof STATUS_PRESENTATION)[PitRequirementStatus] {
  return STATUS_PRESENTATION[status];
}

export function pitStatusLabel(status: PitRequirementStatus): string {
  return pitStatusPresentation(status).label;
}

export function pitPriorityLabel(priority: PitPriority | null): string {
  return priority ? PRIORITY_LABELS[priority] : "未设置";
}

export function formatPitDate(value: string | null | undefined, options: { includeTime?: boolean } = {}): string {
  if (!value) return "—";
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(parsed.valueOf()) ? "—" : value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "—";
  if (options.includeTime === false) return parsed.toISOString().slice(0, 10);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed).replaceAll("/", "-");
}

export function renderPitStatusBadge(status: PitRequirementStatus, sourceStatus?: string | null): string {
  const presentation = pitStatusPresentation(status);
  const source = sourceStatus?.trim();
  const tooltip = source
    ? `规范状态：${presentation.label}；源状态：${source}`
    : `规范状态：${presentation.label}；原始源状态请在详情页查看`;
  return `<span data-pit-status-badge="${escapePitHtml(status)}" class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.className}" title="${escapePitHtml(tooltip)}"><span class="mr-1.5 size-1.5 rounded-full bg-current opacity-70" aria-hidden="true"></span>${escapePitHtml(presentation.label)}</span>`;
}

export function renderPitBanner(message: string, tone: PitTone = "neutral"): string {
  return `<div data-pit-banner role="status" class="rounded-xl border px-4 py-3 text-sm ${TONE_CLASS[tone]}">${escapePitHtml(message)}</div>`;
}

export function renderPitToast(message: string, tone: PitTone = "neutral"): string {
  return `<div data-pit-toast role="status" class="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl ${TONE_CLASS[tone]}"><span class="mt-1 size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true"></span><span>${escapePitHtml(message)}</span></div>`;
}

export function showPitToast(message: string, tone: PitTone = "neutral", duration = 4_000): void {
  let region = document.querySelector<HTMLElement>("[data-pit-toast-region]");
  if (!region) {
    region = document.createElement("div");
    region.dataset.pitToastRegion = "";
    region.setAttribute("aria-live", "polite");
    region.className = "pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2";
    document.body.append(region);
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderPitToast(message, tone);
  const toast = wrapper.firstElementChild;
  if (!toast) return;
  region.append(toast);
  window.setTimeout(() => toast.remove(), duration);
}

export type PitRequestState = {
  begin: () => number;
  invalidate: () => void;
  isCurrent: (token: number) => boolean;
};

export function createPitRequestState(): PitRequestState {
  let current = 0;
  return {
    begin: () => ++current,
    invalidate: () => { current += 1; },
    isCurrent: (token) => token === current,
  };
}

export function createPitPageLifetime(root: HTMLElement): { signal: AbortSignal; disconnect: () => void } {
  const controller = new AbortController();
  const observer = new MutationObserver(() => {
    if (!root.isConnected) controller.abort();
  });
  observer.observe(document.getElementById("app") ?? document.body, { childList: true, subtree: true });
  controller.signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  return { signal: controller.signal, disconnect: () => controller.abort() };
}
