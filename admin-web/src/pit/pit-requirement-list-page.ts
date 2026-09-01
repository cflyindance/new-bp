import { isPitApiError } from "./pit-api-error";
import { pitApi, type PitApi } from "./pit-api";
import {
  applyPitListFilterPatch,
  parsePitListQuery,
  PIT_MINE_ACTIVE_STATUSES,
  pitMineListQuery,
  pitRequirementDetailHref,
  pitRequirementListHref,
  pushPitListLocation,
  replacePitListLocation,
  serializePitListQuery,
  setPitListPage,
  type PitListSort,
  type PitParsedListQuery,
} from "./pit-list-query";
import type {
  PitDashboardSummary,
  PitDictionaryItem,
  PitDictionaryType,
  PitPriority,
  PitRequirementList,
  PitRequirementListItem,
  PitRequirementListQuery,
  PitRequirementStatus,
  PitUser,
} from "./pit-types";
import {
  createPitPageLifetime,
  createPitRequestState,
  escapePitHtml,
  formatPitDate,
  pitPriorityLabel,
  pitStatusLabel,
  renderPitBanner,
  renderPitStatusBadge,
  showPitToast,
} from "./pit-ui";

type PitListPageApi = Pick<PitApi, "dashboardSummary" | "listRequirements" | "listDictionaries" | "listUsers" | "followRequirement" | "unfollowRequirement">;

export type PitRequirementListPageData = {
  query: PitParsedListQuery;
  user: PitUser;
  summary: PitDashboardSummary;
  list: PitRequirementList;
  dictionaries: PitDictionaryItem[];
  users: PitUser[];
};

const STATUS_OPTIONS: readonly { value: PitRequirementStatus; label: string }[] = [
  { value: "review_pending", label: "待评审" },
  { value: "design_pending", label: "待设计" },
  { value: "scheduling_pending", label: "待排期" },
  { value: "development", label: "开发中" },
  { value: "testing", label: "测试中" },
  { value: "completed", label: "已完成" },
  { value: "paused", label: "已暂停" },
  { value: "rejected", label: "已拒绝" },
];
const PRIORITY_OPTIONS: readonly { value: PitPriority; label: string }[] = [
  { value: "urgent", label: "紧急" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];
const LIST_FILTER_KEYS = new Set(["productLine", "status", "priority", "requirementType", "problemCategory", "source", "owner", "plannedYear", "plannedMonth"]);

export type PitListFilterDraft = Partial<Record<
  "productLine" | "status" | "priority" | "requirementType" | "problemCategory" | "source" | "owner" | "plannedYear" | "plannedMonth" | "highlighted",
  string[]
>>;

export function pitListFilterDraftToPatch(draft: PitListFilterDraft): Partial<PitRequirementListQuery> {
  const patch: Partial<PitRequirementListQuery> = {};
  for (const field of ["productLine", "status", "priority", "requirementType", "problemCategory", "source", "owner"] as const) {
    if (!(field in draft)) continue;
    const values = draft[field] ?? [];
    patch[field] = values.length ? values as never : undefined;
  }
  for (const field of ["plannedYear", "plannedMonth"] as const) {
    if (!(field in draft)) continue;
    const values = (draft[field] ?? []).map(Number).filter(Number.isSafeInteger);
    patch[field] = values.length ? values : undefined;
  }
  if ("highlighted" in draft) {
    const value = draft.highlighted?.at(-1);
    patch.highlighted = value === "true" ? true : value === "false" ? false : undefined;
  }
  return patch;
}

export type PitListRefreshDecision = {
  action: "apply" | "defer" | "preserve";
  connectionInterrupted: boolean;
  writesEnabled: boolean;
};

export function pitListRefreshDecision(input: {
  summarySucceeded: boolean;
  listSucceeded: boolean;
  interactionActive: boolean;
}): PitListRefreshDecision {
  if (!input.summarySucceeded || !input.listSucceeded) {
    return { action: "preserve", connectionInterrupted: true, writesEnabled: false };
  }
  return {
    action: input.interactionActive ? "defer" : "apply",
    connectionInterrupted: false,
    writesEnabled: true,
  };
}

export function pitListRefreshCanStart(input: {
  hasCurrentData: boolean;
  lifetimeAborted: boolean;
  pendingFollowCount: number;
}): boolean {
  return input.hasCurrentData && !input.lifetimeAborted && input.pendingFollowCount === 0;
}

function selected(query: PitParsedListQuery, key: keyof PitParsedListQuery, value: string | number): boolean {
  const values = query[key];
  return Array.isArray(values) && values.map(String).includes(String(value));
}

function dictionaryOptions(dictionaries: PitDictionaryItem[], type: PitDictionaryType): PitDictionaryItem[] {
  return dictionaries.filter((item) => item.type === type && item.active).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "zh-CN"));
}

function checkboxOption(field: string, value: string | number, label: string, checked: boolean): string {
  return `<label class="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"><input type="checkbox" data-pit-filter="${escapePitHtml(field)}" value="${escapePitHtml(value)}" ${checked ? "checked" : ""} class="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"><span class="min-w-0 truncate">${escapePitHtml(label)}</span></label>`;
}

function popover(label: string, count: number, content: string): string {
  return `<details data-pit-filter-popover class="group relative"><summary class="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">${escapePitHtml(label)}${count ? `<span class="grid min-w-5 place-items-center rounded-full bg-slate-950 px-1.5 text-[10px] font-bold text-amber-300 dark:bg-amber-400 dark:text-slate-950">${count}</span>` : ""}<span class="text-[10px] text-slate-400 transition group-open:rotate-180" aria-hidden="true">▼</span></summary><div class="absolute left-0 top-12 z-40 flex max-h-96 w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"><div data-pit-filter-draft class="min-h-0 overflow-y-auto p-2">${content}</div><div class="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950"><button type="button" data-pit-filter-cancel class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:hover:bg-slate-800">取消</button><button type="button" data-pit-filter-apply class="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 dark:bg-amber-400 dark:text-slate-950">应用筛选</button></div></div></details>`;
}

function renderFilters(data: PitRequirementListPageData): string {
  const { query, dictionaries, users, list } = data;
  const productLines = dictionaryOptions(dictionaries, "product_line");
  const requirementTypes = dictionaryOptions(dictionaries, "requirement_type");
  const problemCategories = dictionaryOptions(dictionaries, "problem_category");
  const sources = dictionaryOptions(dictionaries, "requirement_source");
  const knownOwners = new Map<string, string>();
  for (const user of users) if (user.active) knownOwners.set(user.id, user.displayName);
  for (const item of list.items) if (item.owner?.id) knownOwners.set(item.owner.id, item.owner.displayName);
  for (const id of query.owner ?? []) if (!knownOwners.has(id)) knownOwners.set(id, id);
  const years = [...new Set([new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1, ...(query.plannedYear ?? [])])].sort();

  const statusContent = STATUS_OPTIONS.map((item) => checkboxOption("status", item.value, item.label, selected(query, "status", item.value))).join("");
  const priorityContent = `${PRIORITY_OPTIONS.map((item) => checkboxOption("priority", item.value, item.label, selected(query, "priority", item.value))).join("")}<div class="my-1 border-t border-slate-100 dark:border-slate-800"></div>${checkboxOption("highlighted", "true", "仅看重点需求", query.highlighted === true)}${checkboxOption("highlighted", "false", "仅看非重点需求", query.highlighted === false)}`;
  const classificationContent = [
    ["产品线", "productLine", productLines],
    ["需求类别", "requirementType", requirementTypes],
    ["问题分类", "problemCategory", problemCategories],
    ["需求来源", "source", sources],
  ].map(([label, field, items]) => `<fieldset class="py-1"><legend class="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">${label}</legend>${(items as PitDictionaryItem[]).length ? (items as PitDictionaryItem[]).map((item) => checkboxOption(String(field), item.id, item.label, selected(query, field as keyof PitParsedListQuery, item.id))).join("") : `<p class="px-2.5 py-2 text-xs text-slate-400">暂无可选项</p>`}</fieldset>`).join('<div class="my-1 border-t border-slate-100 dark:border-slate-800"></div>');
  const ownerContent = knownOwners.size ? [...knownOwners].map(([id, label]) => checkboxOption("owner", id, label, selected(query, "owner", id))).join("") : `<p class="px-2.5 py-3 text-xs leading-5 text-slate-400">当前页暂无可筛选的已关联负责人。</p>`;
  const planContent = `<fieldset><legend class="px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-slate-400">年度</legend>${years.map((year) => checkboxOption("plannedYear", year, `${year} 年`, selected(query, "plannedYear", year))).join("")}</fieldset><div class="my-1 border-t border-slate-100 dark:border-slate-800"></div><fieldset><legend class="px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-slate-400">月份</legend><div class="grid grid-cols-3">${Array.from({ length: 12 }, (_, index) => checkboxOption("plannedMonth", index + 1, `${index + 1} 月`, selected(query, "plannedMonth", index + 1))).join("")}</div></fieldset>`;

  return `<div data-pit-filter-form class="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,.03)] dark:border-slate-800 dark:bg-slate-900 sm:p-4">
    <form data-pit-search-form class="flex gap-2"><label class="relative min-w-0 flex-1"><span class="sr-only">搜索需求</span><svg class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input data-pit-search-input name="q" value="${escapePitHtml(query.q ?? "")}" maxlength="200" placeholder="搜索编号、Jira、标题、描述或 MID" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"></label><button type="submit" class="h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">搜索</button></form>
    <div class="mt-3 flex flex-wrap gap-2">
      ${popover("状态", query.status?.length ?? 0, statusContent)}
      ${popover("分类", (query.productLine?.length ?? 0) + (query.requirementType?.length ?? 0) + (query.problemCategory?.length ?? 0) + (query.source?.length ?? 0), classificationContent)}
      ${popover("优先级 / 重点", (query.priority?.length ?? 0) + (query.highlighted !== undefined ? 1 : 0), priorityContent)}
      ${popover("负责人", query.owner?.length ?? 0, ownerContent)}
      ${popover("计划时间", (query.plannedYear?.length ?? 0) + (query.plannedMonth?.length ?? 0), planContent)}
      <div class="flex min-w-[17rem] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900 sm:max-w-md"><span class="shrink-0 text-xs font-medium text-slate-500">提出时间</span><label><span class="sr-only">提出开始日期</span><input type="date" data-pit-date-filter="proposedFrom" value="${escapePitHtml(query.proposedFrom ?? "")}" class="h-9 min-w-0 bg-transparent text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-200"></label><span class="text-slate-300">—</span><label><span class="sr-only">提出结束日期</span><input type="date" data-pit-date-filter="proposedTo" value="${escapePitHtml(query.proposedTo ?? "")}" class="h-9 min-w-0 bg-transparent text-xs text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-200"></label></div>
      <button type="button" data-pit-clear-filters class="ml-auto h-10 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:hover:bg-slate-800 dark:hover:text-white">清除筛选</button>
    </div>
  </div>`;
}

function filterLabelMaps(data: PitRequirementListPageData): Record<string, Map<string, string>> {
  const maps: Record<string, Map<string, string>> = {
    status: new Map(STATUS_OPTIONS.map((item) => [item.value, item.label])),
    priority: new Map(PRIORITY_OPTIONS.map((item) => [item.value, item.label])),
    productLine: new Map(), requirementType: new Map(), problemCategory: new Map(), source: new Map(), owner: new Map(),
    plannedYear: new Map(), plannedMonth: new Map(),
  };
  const fieldByType: Record<PitDictionaryType, string | undefined> = {
    product_line: "productLine", requirement_type: "requirementType", problem_category: "problemCategory", requirement_source: "source", industry: undefined,
  };
  for (const item of data.dictionaries) {
    const field = fieldByType[item.type];
    if (field) maps[field].set(item.id, item.label);
  }
  for (const user of data.users) maps.owner.set(user.id, user.displayName);
  for (const item of data.list.items) if (item.owner?.id) maps.owner.set(item.owner.id, item.owner.displayName);
  return maps;
}

function renderAppliedFilters(data: PitRequirementListPageData): string {
  const { query } = data;
  const maps = filterLabelMaps(data);
  const chips: string[] = [];
  const add = (field: string, value: string, label: string): void => {
    chips.push(`<button type="button" data-pit-remove-filter="${escapePitHtml(field)}" data-pit-filter-value="${escapePitHtml(value)}" class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-rose-300 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" aria-label="移除筛选：${escapePitHtml(label)}"><span>${escapePitHtml(label)}</span><span aria-hidden="true">×</span></button>`);
  };
  if (query.q) add("q", query.q, `搜索：${query.q}`);
  for (const field of ["productLine", "status", "priority", "requirementType", "problemCategory", "source", "owner", "plannedYear", "plannedMonth"] as const) {
    for (const value of query[field] ?? []) {
      const suffix = field === "plannedYear" ? " 年" : field === "plannedMonth" ? " 月" : "";
      add(field, String(value), `${maps[field].get(String(value)) ?? value}${suffix}`);
    }
  }
  if (query.highlighted === true) add("highlighted", "true", "重点需求");
  if (query.highlighted === false) add("highlighted", "false", "非重点需求");
  if (query.mine === true) add("mine", "true", "待我处理");
  if (query.followed === true) add("followed", "true", "我关注的");
  if (query.active === true) add("active", "true", "活跃需求");
  if (query.overdue === true) add("overdue", "true", "已逾期");
  if (query.proposedFrom) add("proposedFrom", query.proposedFrom, `提出日期 ≥ ${query.proposedFrom}`);
  if (query.proposedTo) add("proposedTo", query.proposedTo, `提出日期 ≤ ${query.proposedTo}`);
  return `<div data-pit-applied-filters class="${chips.length ? "flex" : "hidden"} flex-wrap items-center gap-2" aria-label="已应用筛选"><span class="text-xs font-medium text-slate-400">已应用</span>${chips.join("")}</div>`;
}

type QuickView = { id: string; label: string; note: string; query: Partial<PitRequirementListQuery> };
const QUICK_VIEWS: readonly QuickView[] = [
  { id: "all", label: "全部", note: "完整需求池", query: {} },
  { id: "mine", label: "待我处理", note: "未完成、未拒绝", query: { mine: true, status: [...PIT_MINE_ACTIVE_STATUSES] } },
  { id: "followed", label: "我关注的", note: "持续跟进", query: { followed: true } },
  { id: "development", label: "开发中", note: "研发执行中", query: { status: ["development"] } },
  { id: "completed", label: "已完成", note: "交付闭环", query: { status: ["completed"] } },
];

function quickViewQuery(id: string): PitParsedListQuery {
  if (id === "mine") return pitMineListQuery();
  const view = QUICK_VIEWS.find((item) => item.id === id) ?? QUICK_VIEWS[0];
  return applyPitListFilterPatch(parsePitListQuery(""), view.query);
}

function quickViewActive(query: PitParsedListQuery, id: string): boolean {
  const activeKeys = [query.q, query.productLine?.length, query.priority?.length, query.requirementType?.length, query.problemCategory?.length, query.source?.length, query.owner?.length, query.highlighted, query.plannedYear?.length, query.plannedMonth?.length, query.proposedFrom, query.proposedTo, query.active, query.overdue];
  if (activeKeys.some(Boolean)) return false;
  if (id === "mine") return query.mine === true
    && !query.followed
    && query.status?.length === PIT_MINE_ACTIVE_STATUSES.length
    && PIT_MINE_ACTIVE_STATUSES.every((status) => query.status?.includes(status));
  if (id === "followed") return query.followed === true && !query.mine && !query.status?.length;
  if (id === "development") return query.status?.length === 1 && query.status[0] === "development" && !query.mine && !query.followed;
  if (id === "completed") return query.status?.length === 1 && query.status[0] === "completed" && !query.mine && !query.followed;
  return !query.mine && !query.followed && !query.status?.length;
}

function renderQuickViews(query: PitParsedListQuery): string {
  return `<div class="grid gap-2 sm:grid-cols-5" aria-label="需求快捷视图">${QUICK_VIEWS.map((view) => {
    const active = quickViewActive(query, view.id);
    return `<button type="button" data-pit-quick-view="${view.id}" class="group flex min-h-16 items-center justify-between rounded-xl border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 ${active ? "border-slate-950 bg-slate-950 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-slate-950" : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"}" ${active ? 'aria-current="page"' : ""}><span><span class="block text-sm font-bold">${escapePitHtml(view.label)}</span><span class="mt-0.5 block text-[10px] ${active ? "text-current opacity-60" : "text-slate-400"}">${escapePitHtml(view.note)}</span></span><span class="text-slate-300 group-hover:text-amber-500" aria-hidden="true">→</span></button>`;
  }).join("")}</div>`;
}

function renderListSummary(summary: PitDashboardSummary): string {
  const items = [
    { label: "待评审", value: summary.review, view: "review", query: { status: ["review_pending"] as PitRequirementStatus[] } },
    { label: "待排期", value: summary.schedulingPending, view: "scheduling", query: { status: ["scheduling_pending"] as PitRequirementStatus[] } },
    { label: "开发 / 测试", value: summary.development + summary.testing, view: "delivery", query: { status: ["development", "testing"] as PitRequirementStatus[] } },
    { label: "重点需求", value: summary.highlighted, view: "highlighted", query: { highlighted: true } },
  ];
  return `<div data-pit-list-summary class="grid overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">${items.map((item, index) => `<button type="button" data-pit-summary-filter="${item.view}" data-pit-summary-query="${escapePitHtml(JSON.stringify(item.query))}" class="group flex min-h-24 items-end justify-between border-slate-200 p-4 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-amber-500/25 dark:border-slate-800 dark:hover:bg-slate-800/70 ${index ? "border-t sm:border-l sm:border-t-0" : ""}"><span><span class="block font-mono text-2xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">${Number.isSafeInteger(item.value) ? item.value : 0}</span><span class="mt-1 block text-xs font-medium text-slate-500">${escapePitHtml(item.label)}</span></span><span class="pb-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-500" aria-hidden="true">→</span></button>`).join("")}</div>`;
}

function priorityClass(priority: PitPriority | null): string {
  if (priority === "urgent") return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
  if (priority === "high") return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200";
  if (priority === "medium") return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200";
  if (priority === "low") return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return "bg-slate-50 text-slate-400 dark:bg-slate-800/70 dark:text-slate-500";
}

function sortDirection(query: PitParsedListQuery, name: string): "ascending" | "descending" | "none" {
  const current = query.sort.startsWith("-") ? query.sort.slice(1) : query.sort;
  if (current !== name) return "none";
  return query.sort.startsWith("-") ? "descending" : "ascending";
}

function sortHeader(query: PitParsedListQuery, name: "updatedAt" | "priority" | "plannedDate", label: string, className = ""): string {
  const direction = sortDirection(query, name);
  return `<th scope="col" aria-sort="${direction}" class="${className} px-4 py-3 text-left"><button type="button" data-pit-sort="${name}" class="inline-flex items-center gap-1.5 rounded font-medium text-slate-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-white">${escapePitHtml(label)}<span class="font-mono text-[9px] ${direction === "none" ? "text-slate-300" : "text-amber-600"}" aria-hidden="true">${direction === "ascending" ? "↑" : direction === "descending" ? "↓" : "↕"}</span></button></th>`;
}

function rowHtml(item: PitRequirementListItem, query: PitParsedListQuery, role: PitUser["role"]): string {
  const href = pitRequirementDetailHref(item.id, query);
  const productLines = item.productLines.length ? item.productLines.map((line) => escapePitHtml(line.label)).join("、") : "未分类";
  const classification = [item.requirementType?.label, item.problemCategory?.label].filter(Boolean).map(escapePitHtml).join(" · ") || "—";
  const sourceTooltip = item.source?.label ? `需求来源：${item.source.label}` : "未设置需求来源";
  return `<tr data-pit-requirement-row data-pit-row-href="${escapePitHtml(href)}" tabindex="0" aria-label="查看需求 ${escapePitHtml(item.requirementNo)} ${escapePitHtml(item.title)}" class="group cursor-pointer border-t border-slate-100 align-top transition hover:bg-amber-50/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-amber-500/25 dark:border-slate-800 dark:hover:bg-amber-950/15">
    <td class="px-4 py-4"><div class="flex items-start gap-3"><span class="mt-2 size-2 shrink-0 rounded-full ${item.isHighlighted ? "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,.12)]" : "bg-slate-200 dark:bg-slate-700"}" title="${item.isHighlighted ? "重点需求" : "普通需求"}" aria-label="${item.isHighlighted ? "重点需求" : "普通需求"}"></span><div class="min-w-0"><div class="flex flex-wrap items-center gap-x-2 gap-y-1"><span class="font-mono text-[10px] font-bold tracking-[0.06em] text-slate-500">${escapePitHtml(item.requirementNo)}</span>${item.jiraTicket ? `<span class="font-mono text-[10px] text-sky-700 dark:text-sky-400">${escapePitHtml(item.jiraTicket)}</span>` : ""}</div><a href="${escapePitHtml(href)}" class="mt-1.5 line-clamp-2 block max-w-xl text-sm font-bold leading-5 text-slate-950 decoration-amber-400 decoration-2 underline-offset-4 group-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-white">${escapePitHtml(item.title)}</a><p class="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">${escapePitHtml(item.summary)}</p></div></div></td>
    <td class="hidden px-4 py-4 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:table-cell"><span class="line-clamp-2">${productLines}</span></td>
    <td class="hidden px-4 py-4 text-xs leading-5 text-slate-500 dark:text-slate-400 lg:table-cell" title="${escapePitHtml(sourceTooltip)}">${classification}</td>
    <td class="px-4 py-4">${renderPitStatusBadge(item.status, item.sourceStatus)}</td>
    <td class="hidden px-4 py-4 md:table-cell"><span class="inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${priorityClass(item.priority)}">${escapePitHtml(pitPriorityLabel(item.priority))}</span></td>
    <td class="hidden px-4 py-4 text-xs text-slate-600 dark:text-slate-300 xl:table-cell">${escapePitHtml(item.owner?.displayName ?? "未分配")}</td>
    <td class="hidden whitespace-nowrap px-4 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 lg:table-cell">${escapePitHtml(formatPitDate(item.updatedAt))}</td>
    ${role === "viewer" ? "" : `<td class="px-3 py-4 text-right"><button type="button" data-pit-follow data-pit-write-action data-pit-requirement-id="${escapePitHtml(item.id)}" aria-pressed="${item.following}" aria-label="${item.following ? "取消关注" : "关注"} ${escapePitHtml(item.title)}" title="${item.following ? "取消关注" : "关注"}" class="grid size-9 place-items-center rounded-xl text-lg transition hover:bg-amber-100 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-amber-950/50 ${item.following ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}"><span data-pit-follow-icon aria-hidden="true">${item.following ? "★" : "☆"}</span></button></td>`}
  </tr>`;
}

function paginationPages(page: number, totalPages: number): number[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function renderPagination(list: PitRequirementList): string {
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));
  return `<div data-pit-pagination class="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><p class="text-xs text-slate-500">第 <strong class="text-slate-800 dark:text-slate-200">${list.page}</strong> / ${totalPages} 页 · 共 ${list.total} 条</p><div class="flex flex-wrap items-center gap-1"><button type="button" data-pit-page="${Math.max(1, list.page - 1)}" ${list.page <= 1 ? "disabled" : ""} class="h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">上一页</button>${paginationPages(list.page, totalPages).map((page) => `<button type="button" data-pit-page="${page}" class="grid size-8 place-items-center rounded-lg text-xs font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 ${page === list.page ? "bg-slate-950 text-amber-300 dark:bg-amber-400 dark:text-slate-950" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}" ${page === list.page ? 'aria-current="page"' : ""}>${page}</button>`).join("")}<button type="button" data-pit-page="${Math.min(totalPages, list.page + 1)}" ${list.page >= totalPages ? "disabled" : ""} class="h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">下一页</button></div></div>`;
}

function renderListResults(data: PitRequirementListPageData): string {
  const { list, query, user } = data;
  const colSpan = user.role === "viewer" ? 7 : 8;
  return `<div data-pit-list-results class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900">
    <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-sm font-bold text-slate-900 dark:text-white">需求清单</p><p class="mt-0.5 text-xs text-slate-500">服务端分页 · 最近同步 ${escapePitHtml(formatPitDate(new Date().toISOString()))}</p></div><div class="flex flex-wrap items-center gap-3"><label class="flex items-center gap-2 text-xs text-slate-500"><span>排序</span><select data-pit-sort-select class="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">${[["-updatedAt", "最近更新"], ["updatedAt", "最早更新"], ["-createdAt", "最近创建"], ["createdAt", "最早创建"], ["-priority", "优先级降序"], ["priority", "优先级升序"], ["plannedDate", "计划日期升序"], ["-plannedDate", "计划日期降序"]].map(([value, label]) => `<option value="${value}" ${query.sort === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="flex items-center gap-2 text-xs text-slate-500"><span>每页</span><select data-pit-page-size class="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">${[20, 50, 100].map((size) => `<option value="${size}" ${list.pageSize === size ? "selected" : ""}>${size}</option>`).join("")}</select></label></div></div>
    <div class="overflow-x-auto"><table aria-label="PIT 需求列表" class="w-full min-w-[54rem] table-fixed border-collapse"><caption class="sr-only">PIT 需求列表，可按状态、优先级、负责人和更新时间浏览</caption><colgroup><col class="w-[36%]"><col class="w-[12%]"><col class="w-[13%]"><col class="w-[10%]"><col class="w-[7%]"><col class="w-[10%]"><col class="w-[9%]">${user.role === "viewer" ? "" : '<col class="w-[3.5rem]">'}</colgroup><thead class="bg-slate-50/80 text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-950/70"><tr><th scope="col" class="px-4 py-3 text-left font-medium">编号 / 标题</th><th scope="col" class="hidden px-4 py-3 text-left font-medium sm:table-cell">产品线</th><th scope="col" class="hidden px-4 py-3 text-left font-medium lg:table-cell">类别 / 问题</th><th scope="col" class="px-4 py-3 text-left font-medium">状态</th>${sortHeader(query, "priority", "优先级", "hidden md:table-cell")}<th scope="col" class="hidden px-4 py-3 text-left font-medium xl:table-cell">负责人</th>${sortHeader(query, "updatedAt", "更新时间", "hidden lg:table-cell")}${user.role === "viewer" ? "" : '<th scope="col" class="px-3 py-3 text-right font-medium"><span class="sr-only">关注</span></th>'}</tr></thead><tbody>${list.items.length ? list.items.map((item) => rowHtml(item, query, user.role)).join("") : `<tr><td colspan="${colSpan}" class="px-6 py-20 text-center"><div class="mx-auto grid size-12 place-items-center rounded-2xl border border-dashed border-slate-300 font-mono text-xs text-slate-400 dark:border-slate-700">0</div><p class="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">没有符合当前条件的需求</p><p class="mt-1.5 text-xs text-slate-500">尝试减少筛选条件，或清除筛选后查看全部需求。</p><button type="button" data-pit-clear-filters class="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">清除筛选</button></td></tr>`}</tbody></table></div>
    ${renderPagination(list)}
  </div>`;
}

function renderWorkbench(data: PitRequirementListPageData): string {
  const canWrite = data.user.role !== "viewer";
  return `<div data-pit-workbench class="space-y-5">
    <div data-pit-list-connection-banner class="hidden" aria-live="assertive"></div>
    <header class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><div class="flex items-center gap-3"><p class="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-400">Intake register / ${data.list.total} records</p><span class="h-px w-12 bg-amber-400" aria-hidden="true"></span></div><h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">需求池工作台</h2><p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">搜索、组合筛选并跟进需求。筛选条件会写入地址，可安全刷新或分享给同一局域网内的协作者。</p></div><div class="flex flex-wrap gap-2">${data.user.role === "admin" ? '<a href="#/pit/imports" data-pit-write-action class="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Excel 导入</a>' : ""}<a href="#/pit/exports?${escapePitHtml(serializePitListQuery(data.query))}" data-pit-write-action class="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">导出当前视图</a>${canWrite ? '<a href="#/pit/requirements/new" data-pit-write-action class="inline-flex h-10 items-center rounded-xl bg-amber-400 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/15 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/30">＋ 新建需求</a>' : ""}</div></header>
    ${renderListSummary(data.summary)}
    ${renderQuickViews(data.query)}
    ${renderFilters(data)}
    ${renderAppliedFilters(data)}
    ${renderListResults(data)}
  </div>`;
}

export function renderPitRequirementListLoadingPage(): string {
  return `<section data-pit-requirement-list data-pit-route-page class="mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8"><div data-pit-list-loading role="status" class="grid min-h-[32rem] place-items-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div class="text-center"><div class="mx-auto flex w-20 items-center gap-1">${[0, 1, 2, 3].map((index) => `<span class="h-1 flex-1 animate-pulse rounded-full bg-amber-500" style="animation-delay:${index * 120}ms"></span>`).join("")}</div><p class="mt-4 text-sm text-slate-500">正在装载需求工作台…</p></div></div></section>`;
}

export function renderPitRequirementListPage(data: PitRequirementListPageData): string {
  return `<section data-pit-requirement-list data-pit-route-page class="mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8">${renderWorkbench(data)}</section>`;
}

function summaryViewQuery(id: string): Partial<PitRequirementListQuery> {
  if (id === "review") return { status: ["review_pending"] };
  if (id === "scheduling") return { status: ["scheduling_pending"] };
  if (id === "delivery") return { status: ["development", "testing"] };
  if (id === "highlighted") return { highlighted: true };
  return {};
}

function updateFollowButton(button: HTMLButtonElement, following: boolean, title: string): void {
  button.setAttribute("aria-pressed", String(following));
  button.setAttribute("aria-label", `${following ? "取消关注" : "关注"} ${title}`);
  button.title = following ? "取消关注" : "关注";
  button.classList.toggle("text-amber-500", following);
  button.classList.toggle("text-slate-300", !following);
  button.querySelector<HTMLElement>("[data-pit-follow-icon]")!.textContent = following ? "★" : "☆";
}

function withoutFilterValue(query: PitParsedListQuery, field: string, value: string): PitParsedListQuery {
  if (LIST_FILTER_KEYS.has(field)) {
    const values = (query[field as keyof PitParsedListQuery] as readonly (string | number)[] | undefined) ?? [];
    return applyPitListFilterPatch(query, { [field]: values.filter((item) => String(item) !== value) } as Partial<PitRequirementListQuery>);
  }
  return applyPitListFilterPatch(query, { [field]: undefined } as Partial<PitRequirementListQuery>);
}

function browserQueryValues(container: ParentNode, field: string): string[] {
  return [...container.querySelectorAll<HTMLInputElement>(`[data-pit-filter="${field}"]:checked`)].map((input) => input.value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function setWriteActionsEnabled(page: HTMLElement, enabled: boolean): void {
  page.querySelectorAll<HTMLElement>("[data-pit-write-action]").forEach((action) => {
    action.setAttribute("aria-disabled", String(!enabled));
    action.classList.toggle("pointer-events-none", !enabled);
    action.classList.toggle("opacity-45", !enabled);
    if (action instanceof HTMLButtonElement) action.disabled = !enabled;
    else if (enabled) action.removeAttribute("tabindex");
    else action.setAttribute("tabindex", "-1");
  });
}

function renderConnectionBanner(message: string): string {
  return `<div role="alert" class="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"><div><strong class="block font-bold">PIT 连接已中断，当前内容保持只读</strong><span class="mt-0.5 block text-xs opacity-80">${escapePitHtml(message)}</span></div><button type="button" data-pit-list-connection-retry class="shrink-0 rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 dark:bg-slate-950 dark:text-amber-100 dark:hover:bg-slate-900">重试连接</button></div>`;
}

function filterInputMatchesQuery(input: HTMLInputElement, query: PitParsedListQuery): boolean {
  const field = input.dataset.pitFilter;
  if (!field) return false;
  if (field === "highlighted") return query.highlighted !== undefined && String(query.highlighted) === input.value;
  const values = query[field as keyof PitParsedListQuery];
  return Array.isArray(values) && values.map(String).includes(input.value);
}

function restorePopoverDraft(popover: HTMLDetailsElement, query: PitParsedListQuery): void {
  popover.querySelectorAll<HTMLInputElement>("[data-pit-filter]").forEach((input) => {
    input.checked = filterInputMatchesQuery(input, query);
  });
}

function collectPopoverDraft(popover: HTMLDetailsElement): PitListFilterDraft {
  const draft: PitListFilterDraft = {};
  const fields = new Set([...popover.querySelectorAll<HTMLInputElement>("[data-pit-filter]")].map((input) => input.dataset.pitFilter).filter(Boolean));
  for (const field of fields) {
    (draft as Record<string, string[]>)[field!] = browserQueryValues(popover, field!);
  }
  return draft;
}

export function bindPitRequirementListPage(
  root: HTMLElement,
  query: PitParsedListQuery,
  user: PitUser,
  api: PitListPageApi = pitApi,
): void {
  const page = root.querySelector<HTMLElement>("[data-pit-requirement-list]");
  if (!page || page.dataset.pitBound === "1") return;
  page.dataset.pitBound = "1";
  const lifetime = createPitPageLifetime(page);
  const requestState = createPitRequestState();
  const pendingFollows = new Set<string>();
  let currentData: PitRequirementListPageData | null = null;
  let requestController: AbortController | null = null;
  let connectionInterrupted = false;
  let deferredRefresh: { summary: PitDashboardSummary; list: PitRequirementList } | null = null;

  const replaceFilters = (patch: Partial<PitRequirementListQuery>): void => {
    replacePitListLocation(applyPitListFilterPatch(query, patch));
  };

  const refreshVisibleRegions = (nextSummary?: PitDashboardSummary, nextList?: PitRequirementList): void => {
    if (!currentData || lifetime.signal.aborted) return;
    if (nextSummary) {
      currentData.summary = nextSummary;
      const summary = page.querySelector<HTMLElement>("[data-pit-list-summary]");
      if (summary) summary.outerHTML = renderListSummary(nextSummary);
    }
    if (nextList) {
      currentData.list = nextList;
      const results = page.querySelector<HTMLElement>("[data-pit-list-results]");
      if (results) results.outerHTML = renderListResults(currentData);
    }
  };

  const setConnectionInterrupted = (interrupted: boolean, message = "请确认本机 PIT 服务仍在运行，然后重试。") => {
    connectionInterrupted = interrupted;
    const banner = page.querySelector<HTMLElement>("[data-pit-list-connection-banner]");
    if (banner) {
      banner.innerHTML = interrupted ? renderConnectionBanner(message) : "";
      banner.classList.toggle("hidden", !interrupted);
    }
    setWriteActionsEnabled(page, !interrupted);
  };

  const interactionRegionHasFocus = (): boolean => {
    const active = document.activeElement;
    if (!(active instanceof Element)) return false;
    return Boolean(
      page.querySelector<HTMLElement>("[data-pit-list-results]")?.contains(active)
      || page.querySelector<HTMLElement>("[data-pit-list-summary]")?.contains(active),
    );
  };

  const flushDeferredRefresh = (): void => {
    if (!deferredRefresh || interactionRegionHasFocus() || lifetime.signal.aborted) return;
    const pending = deferredRefresh;
    deferredRefresh = null;
    refreshVisibleRegions(pending.summary, pending.list);
  };

  const beginRequestGeneration = (): { token: number; controller: AbortController } => {
    requestController?.abort();
    const controller = new AbortController();
    requestController = controller;
    return { token: requestState.begin(), controller };
  };

  const refreshData = async (background = true): Promise<void> => {
    // Visibility/timer refreshes can fire while the initial four requests are
    // still pending. They must not abort that generation before currentData
    // exists, otherwise every later background refresh has nothing to render.
    if (!pitListRefreshCanStart({
      hasCurrentData: currentData !== null,
      lifetimeAborted: lifetime.signal.aborted,
      pendingFollowCount: pendingFollows.size,
    })) return;
    const { token, controller } = beginRequestGeneration();
    const [summaryResult, listResult] = await Promise.allSettled([
      api.dashboardSummary({ signal: controller.signal }),
      api.listRequirements(query, { signal: controller.signal }),
    ]);
    if (!requestState.isCurrent(token) || lifetime.signal.aborted || controller.signal.aborted) return;
    if ((summaryResult.status === "rejected" && isAbortError(summaryResult.reason)) || (listResult.status === "rejected" && isAbortError(listResult.reason))) return;
    const decision = pitListRefreshDecision({
      summarySucceeded: summaryResult.status === "fulfilled",
      listSucceeded: listResult.status === "fulfilled",
      interactionActive: interactionRegionHasFocus(),
    });
    if (decision.action === "preserve") {
      deferredRefresh = null;
      const failure = summaryResult.status === "rejected" ? summaryResult.reason : listResult.status === "rejected" ? listResult.reason : null;
      const message = isPitApiError(failure) ? failure.message : "无法连接 PIT 服务，请确认服务正在运行。";
      setConnectionInterrupted(true, message);
      if (!background) showPitToast(message, "warning");
      return;
    }
    if (summaryResult.status !== "fulfilled" || listResult.status !== "fulfilled") return;
    setConnectionInterrupted(false);
    const payload = { summary: summaryResult.value, list: listResult.value };
    if (decision.action === "defer") deferredRefresh = payload;
    else {
      deferredRefresh = null;
      refreshVisibleRegions(payload.summary, payload.list);
    }
  };

  const loadInitial = async (): Promise<void> => {
    const { token, controller } = beginRequestGeneration();
    try {
      const dictionariesPromise = api.listDictionaries({}, { signal: controller.signal }).then((result) => result.items).catch((error) => {
        if (isAbortError(error)) throw error;
        return [] as PitDictionaryItem[];
      });
      const usersPromise = user.role === "admin" ? api.listUsers({ signal: controller.signal }).then((result) => result.items).catch((error) => {
        if (isAbortError(error)) throw error;
        return [] as PitUser[];
      }) : Promise.resolve([] as PitUser[]);
      const [summary, list, dictionaries, users] = await Promise.all([
        api.dashboardSummary({ signal: controller.signal }),
        api.listRequirements(query, { signal: controller.signal }),
        dictionariesPromise,
        usersPromise,
      ]);
      if (!requestState.isCurrent(token) || lifetime.signal.aborted || controller.signal.aborted) return;
      currentData = { query, user, summary, list, dictionaries, users };
      page.innerHTML = renderWorkbench(currentData);
    } catch (error) {
      if (isAbortError(error)) return;
      if (!requestState.isCurrent(token) || lifetime.signal.aborted) return;
      const message = isPitApiError(error) ? error.message : "暂时无法读取需求列表。";
      page.innerHTML = `${renderPitBanner(message, "danger")}<button type="button" data-pit-list-retry class="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 dark:bg-amber-400 dark:text-slate-950">重新加载</button>`;
    }
  };

  page.addEventListener("submit", (event) => {
    const form = (event.target as Element).closest<HTMLFormElement>("[data-pit-search-form]");
    if (!form) return;
    event.preventDefault();
    const search = form.querySelector<HTMLInputElement>("[data-pit-search-input]")?.value.trim();
    replaceFilters({ q: search || undefined });
  }, { signal: lifetime.signal });

  page.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    if (target.matches("[data-pit-page-size]")) {
      replaceFilters({ pageSize: Number(target.value) });
      return;
    }
    if (target.matches("[data-pit-sort-select]")) {
      replaceFilters({ sort: target.value as PitListSort });
      return;
    }
    if (target.matches("[data-pit-date-filter]")) {
      const field = (target as HTMLElement).dataset.pitDateFilter;
      if (field === "proposedFrom" || field === "proposedTo") replaceFilters({ [field]: target.value || undefined });
      return;
    }
    if (!target.matches("[data-pit-filter]")) return;
    const field = (target as HTMLElement).dataset.pitFilter;
    if (!field) return;
    if (field === "highlighted" && (target as HTMLInputElement).checked) {
      target.closest("[data-pit-filter-popover]")?.querySelectorAll<HTMLInputElement>('[data-pit-filter="highlighted"]').forEach((input) => {
        if (input !== target) input.checked = false;
      });
    }
  }, { signal: lifetime.signal });

  page.addEventListener("click", (event) => {
    const target = event.target as Element;
    const blockedWrite = target.closest<HTMLElement>("[data-pit-write-action]");
    if (blockedWrite && connectionInterrupted) {
      event.preventDefault();
      event.stopPropagation();
      showPitToast("PIT 连接恢复前，写操作暂时不可用。", "warning");
      return;
    }
    const connectionRetry = target.closest<HTMLButtonElement>("[data-pit-list-connection-retry]");
    if (connectionRetry) {
      connectionRetry.disabled = true;
      connectionRetry.textContent = "正在重试…";
      void refreshData(false);
      return;
    }
    const applyDraft = target.closest<HTMLButtonElement>("[data-pit-filter-apply]");
    if (applyDraft) {
      const filterPopover = applyDraft.closest<HTMLDetailsElement>("[data-pit-filter-popover]");
      if (!filterPopover) return;
      const patch = pitListFilterDraftToPatch(collectPopoverDraft(filterPopover));
      filterPopover.open = false;
      replaceFilters(patch);
      return;
    }
    const cancelDraft = target.closest<HTMLButtonElement>("[data-pit-filter-cancel]");
    if (cancelDraft) {
      const filterPopover = cancelDraft.closest<HTMLDetailsElement>("[data-pit-filter-popover]");
      if (!filterPopover) return;
      restorePopoverDraft(filterPopover, query);
      filterPopover.open = false;
      filterPopover.querySelector<HTMLElement>("summary")?.focus();
      return;
    }
    const retry = target.closest<HTMLButtonElement>("[data-pit-list-retry]");
    if (retry) {
      page.innerHTML = renderPitRequirementListLoadingPage().replace(/^<section[^>]*>|<\/section>$/g, "");
      void loadInitial();
      return;
    }
    const quickView = target.closest<HTMLButtonElement>("[data-pit-quick-view]");
    if (quickView) {
      replacePitListLocation(quickViewQuery(quickView.dataset.pitQuickView ?? "all"));
      return;
    }
    const summary = target.closest<HTMLButtonElement>("[data-pit-summary-filter]");
    if (summary) {
      replacePitListLocation(applyPitListFilterPatch(parsePitListQuery(""), summaryViewQuery(summary.dataset.pitSummaryFilter ?? "")));
      return;
    }
    const clear = target.closest<HTMLButtonElement>("[data-pit-clear-filters]");
    if (clear) {
      replacePitListLocation(parsePitListQuery(""));
      return;
    }
    const chip = target.closest<HTMLButtonElement>("[data-pit-remove-filter]");
    if (chip) {
      replacePitListLocation(withoutFilterValue(query, chip.dataset.pitRemoveFilter ?? "", chip.dataset.pitFilterValue ?? ""));
      return;
    }
    const pageButton = target.closest<HTMLButtonElement>("[data-pit-page]");
    if (pageButton && !pageButton.disabled) {
      pushPitListLocation(setPitListPage(query, Number(pageButton.dataset.pitPage)));
      return;
    }
    const sortButton = target.closest<HTMLButtonElement>("[data-pit-sort]");
    if (sortButton) {
      const name = sortButton.dataset.pitSort as "updatedAt" | "priority" | "plannedDate";
      const currentName = query.sort.startsWith("-") ? query.sort.slice(1) : query.sort;
      const sort = currentName === name && !query.sort.startsWith("-") ? `-${name}` : name;
      replaceFilters({ sort: sort as PitListSort });
      return;
    }
    const followButton = target.closest<HTMLButtonElement>("[data-pit-follow]");
    if (followButton) {
      event.preventDefault();
      event.stopPropagation();
      if (user.role === "viewer" || followButton.disabled || !currentData) return;
      const id = followButton.dataset.pitRequirementId ?? "";
      const item = currentData.list.items.find((candidate) => candidate.id === id);
      if (!item) return;
      const previousFollowing = followButton.getAttribute("aria-pressed") === "true";
      const nextFollowing = !previousFollowing;
      requestState.invalidate();
      requestController?.abort();
      pendingFollows.add(id);
      followButton.disabled = true;
      updateFollowButton(followButton, nextFollowing, item.title);
      item.following = nextFollowing;
      currentData.summary.followed = Math.max(0, currentData.summary.followed + (nextFollowing ? 1 : -1));
      refreshVisibleRegions(currentData.summary);
      void (nextFollowing ? api.followRequirement(id) : api.unfollowRequirement(id)).then((result) => {
        if (lifetime.signal.aborted) return;
        item.following = result.following;
        updateFollowButton(followButton, result.following, item.title);
        showPitToast(result.following ? "已加入关注。" : "已取消关注。", "success");
      }).catch((error) => {
        if (lifetime.signal.aborted) return;
        item.following = previousFollowing;
        currentData!.summary.followed = Math.max(0, currentData!.summary.followed + (nextFollowing ? -1 : 1));
        refreshVisibleRegions(currentData!.summary);
        updateFollowButton(followButton, previousFollowing, item.title);
        showPitToast(isPitApiError(error) ? error.message : "关注状态更新失败。", "danger");
      }).finally(() => {
        pendingFollows.delete(id);
        if (followButton.isConnected) followButton.disabled = false;
        if (!lifetime.signal.aborted && document.visibilityState === "visible") void refreshData(true);
      });
      return;
    }
    const row = target.closest<HTMLTableRowElement>("[data-pit-requirement-row]");
    if (row && !target.closest("a,button,input,select,summary")) {
      const href = row.dataset.pitRowHref;
      if (href) location.hash = href.slice(1);
    }
  }, { signal: lifetime.signal });

  page.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const filterPopover = (event.target as Element).closest<HTMLDetailsElement>("[data-pit-filter-popover]");
      if (filterPopover?.open) {
        event.preventDefault();
        restorePopoverDraft(filterPopover, query);
        filterPopover.open = false;
        filterPopover.querySelector<HTMLElement>("summary")?.focus();
      }
      return;
    }
    if (event.key !== "Enter") return;
    const row = (event.target as Element).closest<HTMLTableRowElement>("[data-pit-requirement-row]");
    if (!row || event.target !== row) return;
    const href = row.dataset.pitRowHref;
    if (href) location.hash = href.slice(1);
  }, { signal: lifetime.signal });

  page.addEventListener("focusout", () => {
    window.setTimeout(flushDeferredRefresh, 0);
  }, { signal: lifetime.signal });

  const refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") void refreshData(true);
  }, 30_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshData(true);
  }, { signal: lifetime.signal });
  window.addEventListener("pit:requirements-changed", () => { void refreshData(true); }, { signal: lifetime.signal });
  lifetime.signal.addEventListener("abort", () => window.clearInterval(refreshTimer), { once: true });
  lifetime.signal.addEventListener("abort", () => requestController?.abort(), { once: true });
  void loadInitial();
}
