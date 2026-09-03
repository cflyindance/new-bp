import type { TipsView } from "./tips-templates";

export interface TipsRoute {
  view: TipsView;
  query: string;
  href: string;
}

export interface TipsHistoryEntryState {
  flowId: string;
  viewHref: string;
  scrollTop: number;
  parentHref: string;
  summaryHref: "/team/tips/distribution";
  summaryScrollTop: number;
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
}

export function parseTipsRoute(hash: string): TipsRoute {
  const raw = hash.replace(/^#/, "") || "/team/tips/distribution";
  const queryIndex = raw.indexOf("?");
  const path = normalizePath(queryIndex >= 0 ? raw.slice(0, queryIndex) : raw);
  const query = queryIndex >= 0 ? raw.slice(queryIndex) : "";
  let view: TipsView = "distribution";
  if (path === "/team/tips/rules/editor") view = "rule-editor";
  else if (path === "/team/tips/rules") view = "rules";
  else if (path === "/team/tips/details") view = "details";
  return { view, query, href: `${path}${query}` };
}

export function isTipsFullscreenRoute(route: TipsRoute): boolean {
  const path = normalizePath(route.href.split("?")[0]);
  return path === "/team/tips/rules" || path === "/team/tips/rules/editor";
}

export function isTrustedTipsHistoryState(value: unknown, currentHref: string): value is TipsHistoryEntryState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<TipsHistoryEntryState>;
  const allowed = new Set(["/team/tips/distribution", "/team/tips/rules", "/team/tips/rules/editor"]);
  const finite = (item: unknown) => typeof item === "number" && Number.isFinite(item) && item >= 0;
  return typeof state.flowId === "string" && state.flowId.length > 0 &&
    normalizePath(String(state.viewHref ?? "").split("?")[0]) === normalizePath(currentHref.split("?")[0]) &&
    allowed.has(normalizePath(String(state.parentHref ?? "").split("?")[0])) &&
    state.summaryHref === "/team/tips/distribution" && finite(state.scrollTop) && finite(state.summaryScrollTop);
}

export function rewriteLegacyTipsUrl(value: string): string | null {
  const raw = String(value || "").trim();
  const match = raw.match(/(?:^|\/)(index|detail|rules|rule-add)\.html(\?[^#]*)?/i);
  if (!match) return null;
  const routes: Record<string, string> = {
    index: "/team/tips/distribution",
    detail: "/team/tips/details",
    rules: "/team/tips/rules",
    "rule-add": "/team/tips/rules/editor",
  };
  return `${routes[match[1].toLowerCase()]}${match[2] ?? ""}`;
}
