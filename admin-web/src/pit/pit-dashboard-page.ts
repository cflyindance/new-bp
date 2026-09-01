import { pitApi, type PitApi } from "./pit-api";
import { applyPitListFilterPatch, parsePitListQuery, pitMineListQuery, pitRequirementListHref } from "./pit-list-query";
import type { PitDashboardSummary, PitRequirementListQuery } from "./pit-types";
import { createPitPageLifetime, createPitRequestState, escapePitHtml, renderPitBanner } from "./pit-ui";

type DashboardCard = {
  label: string;
  value: number;
  note: string;
  query: Partial<PitRequirementListQuery>;
  accent: string;
  index: string;
};

function safeCount(value: number): string {
  return String(Number.isSafeInteger(value) && value >= 0 ? value : 0);
}

export function pitDashboardRefreshDecision(interactionActive: boolean): "apply" | "defer" {
  return interactionActive ? "defer" : "apply";
}

function cardHref(query: Partial<PitRequirementListQuery>): string {
  return pitRequirementListHref(applyPitListFilterPatch(parsePitListQuery(""), query));
}

function cards(summary: PitDashboardSummary): DashboardCard[] {
  return [
    { label: "全部活跃", value: summary.total, note: "未完成、未拒绝需求", query: { active: true }, accent: "bg-slate-950 dark:bg-slate-100", index: "01" },
    { label: "待评审", value: summary.review, note: "等待需求判断", query: { status: ["review_pending"] }, accent: "bg-amber-500", index: "02" },
    { label: "开发 / 测试", value: summary.development + summary.testing, note: `${safeCount(summary.development)} 开发 · ${safeCount(summary.testing)} 测试`, query: { status: ["development", "testing"] }, accent: "bg-blue-500", index: "03" },
    { label: "已完成", value: summary.completed, note: "已闭环交付", query: { status: ["completed"] }, accent: "bg-emerald-500", index: "04" },
    { label: "重点需求", value: summary.highlighted, note: "标记为重点", query: { highlighted: true }, accent: "bg-orange-500", index: "05" },
    { label: "待我处理", value: summary.mine, note: "我的未完成、未拒绝执行项", query: pitMineListQuery(), accent: "bg-cyan-500", index: "06" },
    { label: "我关注的", value: summary.followed, note: "持续跟进中的需求", query: { followed: true }, accent: "bg-fuchsia-500", index: "07" },
    { label: "已逾期", value: summary.overdue, note: "计划月已过且仍在处理中", query: { overdue: true, sort: "plannedDate" }, accent: "bg-rose-500", index: "08" },
  ];
}

function renderDashboardContent(summary: PitDashboardSummary): string {
  return `<div data-pit-dashboard-content>
    <div class="grid gap-5 border-b border-slate-200 pb-7 dark:border-slate-800 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
      <div><p class="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-400">Operational signal / live pool</p><h2 class="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">从输入到交付，<span class="text-slate-400">把每一条需求放在正确的位置。</span></h2></div>
      <p class="border-l-2 border-amber-400 pl-4 text-sm leading-6 text-slate-600 dark:text-slate-300">数据来自本机 PIT 服务。摘要在页面可见时每 30 秒更新，点击指标进入对应需求视图。</p>
    </div>
    <div class="mt-7 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-[0_16px_45px_rgba(15,23,42,.07)] dark:border-slate-700 dark:bg-slate-700 sm:grid-cols-2 xl:grid-cols-4">
      ${cards(summary).map((card) => `<a href="${escapePitHtml(cardHref(card.query))}" class="group relative min-h-48 bg-white p-5 transition hover:z-10 hover:-translate-y-0.5 hover:shadow-xl focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/35 dark:bg-slate-900 sm:p-6"><span class="font-mono text-[10px] tracking-[0.22em] text-slate-400">${card.index} / 08</span><span class="absolute right-5 top-5 size-2.5 rounded-full ${card.accent}" aria-hidden="true"></span><strong class="mt-8 block font-mono text-4xl font-medium tracking-[-0.06em] text-slate-950 dark:text-white">${safeCount(card.value)}</strong><span class="mt-3 block text-sm font-bold text-slate-900 dark:text-slate-100">${escapePitHtml(card.label)}</span><span class="mt-1.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">${escapePitHtml(card.note)}</span><span class="absolute bottom-5 right-5 text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-600" aria-hidden="true">→</span></a>`).join("")}
    </div>
  </div>`;
}

export function renderPitDashboardPage(summary?: PitDashboardSummary | null): string {
  return `<section data-pit-dashboard data-pit-route-page class="mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8">
    ${summary ? renderDashboardContent(summary) : `<div data-pit-dashboard-loading role="status" class="grid min-h-[26rem] place-items-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div class="text-center"><span class="mx-auto block size-3 animate-pulse rounded-full bg-amber-500"></span><p class="mt-4 text-sm text-slate-500">正在汇总需求池信号…</p></div></div>`}
  </section>`;
}

export function bindPitDashboardPage(root: HTMLElement, api: Pick<PitApi, "dashboardSummary"> = pitApi): void {
  const page = root.querySelector<HTMLElement>("[data-pit-dashboard]");
  if (!page || page.dataset.pitBound === "1") return;
  page.dataset.pitBound = "1";
  const lifetime = createPitPageLifetime(page);
  const requestState = createPitRequestState();
  let requestController: AbortController | null = null;
  let deferredSummary: PitDashboardSummary | null = null;

  const interactionActive = (): boolean => {
    const active = document.activeElement;
    return active instanceof Element && page.contains(active);
  };

  const applySummary = (summary: PitDashboardSummary): void => {
    page.innerHTML = renderDashboardContent(summary);
  };

  const flushDeferredSummary = (): void => {
    if (!deferredSummary || interactionActive() || lifetime.signal.aborted) return;
    const summary = deferredSummary;
    deferredSummary = null;
    applySummary(summary);
  };

  const load = async (background = false): Promise<void> => {
    if (lifetime.signal.aborted || document.visibilityState === "hidden") return;
    requestController?.abort();
    requestController = new AbortController();
    const token = requestState.begin();
    try {
      const summary = await api.dashboardSummary({ signal: requestController.signal });
      if (!requestState.isCurrent(token) || lifetime.signal.aborted) return;
      if (pitDashboardRefreshDecision(interactionActive()) === "defer") deferredSummary = summary;
      else {
        deferredSummary = null;
        applySummary(summary);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      if (!requestState.isCurrent(token) || lifetime.signal.aborted || background) return;
      page.innerHTML = renderPitBanner("暂时无法读取工作台摘要，请稍后重试。", "danger");
    }
  };

  const refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") void load(true);
  }, 30_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void load(true);
  }, { signal: lifetime.signal });
  page.addEventListener("focusout", () => window.setTimeout(flushDeferredSummary, 0), { signal: lifetime.signal });
  lifetime.signal.addEventListener("abort", () => window.clearInterval(refreshTimer), { once: true });
  lifetime.signal.addEventListener("abort", () => requestController?.abort(), { once: true });
  void load();
}
