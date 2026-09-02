import type { TipsView } from "./tips-templates";

export interface TipsRoute {
  view: TipsView;
  query: string;
  href: string;
}

export function parseTipsRoute(hash: string): TipsRoute {
  const raw = hash.replace(/^#/, "") || "/team/tips/distribution";
  const queryIndex = raw.indexOf("?");
  const path = queryIndex >= 0 ? raw.slice(0, queryIndex) : raw;
  const query = queryIndex >= 0 ? raw.slice(queryIndex) : "";
  let view: TipsView = "distribution";
  if (path.startsWith("/team/tips/rules/editor")) view = "rule-editor";
  else if (path.startsWith("/team/tips/rules")) view = "rules";
  else if (path.startsWith("/team/tips/details")) view = "details";
  return { view, query, href: `${path}${query}` };
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
