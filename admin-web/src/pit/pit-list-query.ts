import type { PitPriority, PitRequirementListQuery, PitRequirementStatus } from "./pit-types";

export type PitListSort = NonNullable<PitRequirementListQuery["sort"]>;
export type PitParsedListQuery = Omit<PitRequirementListQuery, "page" | "pageSize" | "sort"> & {
  page: number;
  pageSize: 20 | 50 | 100;
  sort: PitListSort;
};

const STATUSES = new Set<PitRequirementStatus>([
  "review_pending",
  "design_pending",
  "scheduling_pending",
  "development",
  "testing",
  "completed",
  "paused",
  "rejected",
]);
const PRIORITIES = new Set<PitPriority>(["urgent", "high", "medium", "low"]);
const SORTS = new Set<PitListSort>([
  "updatedAt", "-updatedAt", "createdAt", "-createdAt", "priority", "-priority", "plannedDate", "-plannedDate",
]);
const PAGE_SIZES = new Set([20, 50, 100]);
export const PIT_MINE_ACTIVE_STATUSES: readonly PitRequirementStatus[] = [
  "review_pending",
  "design_pending",
  "scheduling_pending",
  "development",
  "testing",
  "paused",
];

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function positiveInteger(value: string | number | undefined, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function boundedText(value: string | undefined, maxLength = 200): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function safeIds(values: readonly string[]): string[] | undefined {
  const normalized = unique(values.map((value) => boundedText(value, 128)).filter((value): value is string => Boolean(value)));
  return normalized.length ? normalized : undefined;
}

function booleanValue(value: string | boolean | undefined): boolean | undefined {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

function strictIsoDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : undefined;
}

function numericList(values: readonly (string | number)[], min: number, max: number): number[] | undefined {
  const valid = unique(values.map(Number).filter((value) => Number.isSafeInteger(value) && value >= min && value <= max));
  return valid.length ? valid : undefined;
}

function choiceList<T extends string>(values: readonly string[], choices: ReadonlySet<T>): T[] | undefined {
  const valid = unique(values.filter((value): value is T => choices.has(value as T)));
  return valid.length ? valid : undefined;
}

function normalizedQuery(input: PitRequirementListQuery): PitParsedListQuery {
  const pageSize = positiveInteger(input.pageSize, 20);
  const sort = SORTS.has(input.sort as PitListSort) ? input.sort as PitListSort : "-updatedAt";
  const normalized: PitParsedListQuery = {
    page: positiveInteger(input.page, 1),
    pageSize: PAGE_SIZES.has(pageSize) ? pageSize as 20 | 50 | 100 : 20,
    sort,
  };
  const q = boundedText(input.q);
  if (q) normalized.q = q;
  for (const key of ["productLine", "requirementType", "problemCategory", "source", "owner"] as const) {
    const values = safeIds(input[key] ?? []);
    if (values) normalized[key] = values;
  }
  const statuses = choiceList(input.status ?? [], STATUSES);
  if (statuses) normalized.status = statuses;
  const priorities = choiceList(input.priority ?? [], PRIORITIES);
  if (priorities) normalized.priority = priorities;
  const years = numericList(input.plannedYear ?? [], 1900, 9999);
  if (years) normalized.plannedYear = years;
  const months = numericList(input.plannedMonth ?? [], 1, 12);
  if (months) normalized.plannedMonth = months;
  const from = strictIsoDate(input.proposedFrom);
  const to = strictIsoDate(input.proposedTo);
  if (!from || !to || from <= to) {
    if (from) normalized.proposedFrom = from;
    if (to) normalized.proposedTo = to;
  }
  const highlighted = booleanValue(input.highlighted);
  if (highlighted !== undefined) normalized.highlighted = highlighted;
  if (booleanValue(input.mine) === true) normalized.mine = true;
  if (booleanValue(input.followed) === true) normalized.followed = true;
  if (booleanValue(input.active) === true) normalized.active = true;
  if (booleanValue(input.overdue) === true) normalized.overdue = true;
  if (input.deleted === "only" || input.deleted === "include") normalized.deleted = input.deleted;
  return normalized;
}

export function parsePitListQuery(search: string): PitParsedListQuery {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const pageSize = positiveInteger(params.get("pageSize") ?? undefined, 20);
  return normalizedQuery({
    q: params.get("q") ?? undefined,
    productLine: params.getAll("productLine"),
    status: params.getAll("status") as PitRequirementStatus[],
    priority: params.getAll("priority") as PitPriority[],
    requirementType: params.getAll("requirementType"),
    problemCategory: params.getAll("problemCategory"),
    source: params.getAll("source"),
    owner: params.getAll("owner"),
    highlighted: booleanValue(params.get("highlighted") ?? undefined),
    plannedYear: numericList(params.getAll("plannedYear"), 1900, 9999),
    plannedMonth: numericList(params.getAll("plannedMonth"), 1, 12),
    proposedFrom: params.get("proposedFrom") ?? undefined,
    proposedTo: params.get("proposedTo") ?? undefined,
    mine: booleanValue(params.get("mine") ?? undefined),
    followed: booleanValue(params.get("followed") ?? undefined),
    active: booleanValue(params.get("active") ?? undefined),
    overdue: booleanValue(params.get("overdue") ?? undefined),
    deleted: (params.get("deleted") ?? undefined) as PitRequirementListQuery["deleted"],
    page: positiveInteger(params.get("page") ?? undefined, 1),
    pageSize: PAGE_SIZES.has(pageSize) ? pageSize : 20,
    sort: (params.get("sort") ?? undefined) as PitListSort | undefined,
  });
}

export function serializePitListQuery(input: PitRequirementListQuery): string {
  const query = normalizedQuery(input);
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  for (const key of ["productLine", "status", "priority", "requirementType", "problemCategory", "source", "owner"] as const) {
    for (const value of query[key] ?? []) params.append(key, String(value));
  }
  if (query.highlighted !== undefined) params.set("highlighted", String(query.highlighted));
  for (const value of query.plannedYear ?? []) params.append("plannedYear", String(value));
  for (const value of query.plannedMonth ?? []) params.append("plannedMonth", String(value));
  if (query.proposedFrom) params.set("proposedFrom", query.proposedFrom);
  if (query.proposedTo) params.set("proposedTo", query.proposedTo);
  if (query.mine !== undefined) params.set("mine", String(query.mine));
  if (query.followed !== undefined) params.set("followed", String(query.followed));
  if (query.active === true) params.set("active", "true");
  if (query.overdue === true) params.set("overdue", "true");
  if (query.deleted) params.set("deleted", query.deleted);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("sort", query.sort);
  return params.toString();
}

export function applyPitListFilterPatch(
  query: PitParsedListQuery,
  patch: Partial<PitRequirementListQuery>,
): PitParsedListQuery {
  return normalizedQuery({ ...query, ...patch, page: 1 });
}

export function pitMineListQuery(): PitParsedListQuery {
  return normalizedQuery({ mine: true, status: [...PIT_MINE_ACTIVE_STATUSES] });
}

export function setPitListPage(query: PitParsedListQuery, page: number): PitParsedListQuery {
  return normalizedQuery({ ...query, page });
}

export function pitRequirementListHref(query: PitRequirementListQuery): string {
  return `#/pit/requirements?${serializePitListQuery(query)}`;
}

export function pitRequirementDetailHref(id: string, query: PitRequirementListQuery): string {
  return `#/pit/requirements/${encodeURIComponent(id)}?${serializePitListQuery(query)}`;
}

function announceHashChange(): void {
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function replacePitListLocation(query: PitRequirementListQuery): void {
  const href = pitRequirementListHref(query);
  if (location.hash === href) return;
  history.replaceState(history.state, "", href);
  announceHashChange();
}

export function pushPitListLocation(query: PitRequirementListQuery): void {
  const href = pitRequirementListHref(query);
  if (location.hash === href) return;
  location.hash = href.slice(1);
}
