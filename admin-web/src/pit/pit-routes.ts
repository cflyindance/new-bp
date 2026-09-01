import type { PitRole } from "./pit-types";

export const PIT_ROUTE_PREFIX = "/pit";
export const PIT_DEFAULT_PATH = "/pit/dashboard";

export type PitRouteId =
  | "dashboard"
  | "requirements"
  | "requirement-new"
  | "requirement-detail"
  | "imports"
  | "exports"
  | "dictionaries"
  | "users"
  | "audit-log"
  | "trash"
  | "backups";

const STATIC_ROUTES: Readonly<Record<string, PitRouteId>> = {
  "/pit/dashboard": "dashboard",
  "/pit/requirements": "requirements",
  "/pit/requirements/new": "requirement-new",
  "/pit/imports": "imports",
  "/pit/exports": "exports",
  "/pit/dictionaries": "dictionaries",
  "/pit/users": "users",
  "/pit/audit-log": "audit-log",
  "/pit/trash": "trash",
  "/pit/backups": "backups",
};

const ADMIN_ROUTES = new Set<PitRouteId>(["imports", "dictionaries", "users", "audit-log", "trash", "backups"]);

export function isPitContentPath(path: string): boolean {
  return path === PIT_ROUTE_PREFIX || path.startsWith(`${PIT_ROUTE_PREFIX}/`);
}

export function matchPitRoute(path: string): { id: PitRouteId; requirementId?: string } {
  const cleanPath = path.split("?", 1)[0].replace(/\/+$/, "") || PIT_ROUTE_PREFIX;
  const staticRoute = STATIC_ROUTES[cleanPath];
  if (staticRoute) return { id: staticRoute };
  const detail = /^\/pit\/requirements\/([^/]+)$/.exec(cleanPath);
  if (detail) {
    try {
      return { id: "requirement-detail", requirementId: decodeURIComponent(detail[1]) };
    } catch {
      return { id: "dashboard" };
    }
  }
  return { id: "dashboard" };
}

export function normalizePitPath(path: string): string {
  if (path === PIT_ROUTE_PREFIX || path === `${PIT_ROUTE_PREFIX}/`) return PIT_DEFAULT_PATH;
  const route = matchPitRoute(path);
  if (route.id === "dashboard" && path.split("?", 1)[0] !== PIT_DEFAULT_PATH) return PIT_DEFAULT_PATH;
  return path;
}

export function canAccessPitRoute(route: PitRouteId, role: PitRole): boolean {
  if (role === "admin") return true;
  if (ADMIN_ROUTES.has(route)) return false;
  if (role === "viewer" && route === "requirement-new") return false;
  return true;
}
