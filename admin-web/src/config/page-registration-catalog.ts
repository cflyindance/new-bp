import { buildNavRouteRegistry } from "./nav-route-registry";
import { PAGE_REGISTRATIONS } from "./page-registrations";
import { validatePageRegistrations, type PageRegistration } from "./page-registration-domain";
import { readLocalPageRegistrations } from './local-page-registration';

let cached: readonly PageRegistration[] | undefined;
export function getBuiltInPageRegistrations(): readonly PageRegistration[] {
  if (cached) return cached;
  const overridden = new Set(PAGE_REGISTRATIONS.map(page => page.routing.path));
  const pages: PageRegistration[] = [
    ...PAGE_REGISTRATIONS,
    ...buildNavRouteRegistry().filter(route => !overridden.has(route.path)).map(route => ({
      id: route.id, title: route.title, titleEn: route.titleEn, module: route.groupTitle,
      status: "active" as const, source: "nav-route-registry.ts（现有目录）",
      routing: { type: "inner" as const, path: route.path },
    })),
  ];
  const errors = validatePageRegistrations(pages);
  if (errors.length) throw new Error(`页面注册清单校验失败：${errors.join("；")}`);
  cached = pages;
  return pages;
}

/** Local records are read afresh so successful registration is immediately selectable. */
export function getPageRegistrations(): readonly PageRegistration[] {
  const builtIn = getBuiltInPageRegistrations();
  return [...builtIn, ...readLocalPageRegistrations(builtIn).pages];
}
export function getLocalPageRegistrationError(): string | undefined {
  return readLocalPageRegistrations(getBuiltInPageRegistrations()).error;
}
